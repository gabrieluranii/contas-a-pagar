import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getOAuthClient() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return oAuth2Client;
}

const EXTRACTION_PROMPT = `Extraia os seguintes campos do documento anexo (Boleto ou Nota Fiscal). Retorne EXATAMENTE e APENAS um JSON válido. Não inclua Markdown, backticks ou texto extra.
Campos requeridos:
- fornecedor (string): Nome do emissor ou recebedor.
- valor (number): Valor total a pagar numérico (ex: 1540.50).
- emissao (string): Data de emissão no formato YYYY-MM-DD.
- nfnum (string): Número do documento — tente nesta ordem: número da nota fiscal, número do documento, número do protocolo, número do pedido, qualquer sequência numérica identificadora.
- nfserie (string): Série da nota fiscal (se houver, caso contrário retorne "1").
- vencimento (string): Data de vencimento no formato YYYY-MM-DD.
- observacao (string): Linha digitável ou resumo.
- tipo (string): "boleto", "nf", "merged" ou "outro".
Retorne APENAS o JSON vazio se não entender nada.`;

async function extractFromBase64(base64url, filename) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      }],
      temperature: 0,
      max_tokens: 1024,
    }),
  });

  const data = await groqRes.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  try {
    const match = raw.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  } catch { return {}; }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const messageData = body.message?.data;
    if (!messageData) return NextResponse.json({ ok: true });

    const decoded = JSON.parse(Buffer.from(messageData, 'base64').toString());
    const historyId = decoded.historyId;
    if (!historyId) return NextResponse.json({ ok: true });

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: watchRow } = await sb.from('gmail_watch').select('history_id').eq('id', 1).single();
    const lastHistoryId = watchRow?.history_id || historyId;

    const auth = getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const history = await gmail.users.history.list({
      userId: process.env.GMAIL_USER,
      startHistoryId: lastHistoryId,
      historyTypes: ['messageAdded'],
      labelId: 'INBOX',
    });

    const messages = history.data.history?.flatMap(h => h.messagesAdded || []).map(m => m.message) || [];

    for (const msg of messages) {
      const full = await gmail.users.messages.get({
        userId: process.env.GMAIL_USER,
        id: msg.id,
        format: 'full',
      });

      const headers = full.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from    = headers.find(h => h.name === 'From')?.value || '';

      const parts = full.data.payload.parts || [];
      const pdfParts = parts.filter(p => p.mimeType === 'application/pdf' || p.filename?.endsWith('.pdf'));
      if (!pdfParts.length) continue;

      const results = [];
      for (const part of pdfParts) {
        try {
          const attRes = await gmail.users.messages.attachments.get({
            userId: process.env.GMAIL_USER,
            messageId: msg.id,
            id: part.body.attachmentId,
          });
          const extracted = await extractFromBase64(attRes.data.data, part.filename);
          results.push({
            supplier: extracted.fornecedor || '',
            value:    extracted.valor      || 0,
            due:      extracted.vencimento || null,
            emission: extracted.emissao    || null,
            nf:       extracted.nfnum ? String(parseInt(extracted.nfnum, 10)) : '',
            serie:    extracted.nfserie    || '1',
            obs:      extracted.observacao || '',
            tipo:     extracted.tipo       || 'outro',
            filename: part.filename,
          });
        } catch { /* ignora */ }
      }

      if (!results.length) continue;

      const best = results.reduce((a, b) => b.value > a.value ? b : a, results[0]);
      if (!best.due) {
        const withDue = results.find(r => r.due);
        if (withDue) best.due = withDue.due;
      }

      const { data: existing } = await sb
        .from('email_queue')
        .select('id, status')
        .eq('email_id', msg.id)
        .single();

      if (!existing) {
        await sb.from('email_queue').insert({
          email_id:      msg.id,
          email_from:    from,
          email_subject: subject,
          supplier:      best.supplier,
          value:         best.value,
          due:           best.due || null,
          emission:      best.emission || null,
          nf:            best.nf,
          serie:         best.serie,
          obs:           best.obs,
          tipo:          best.tipo,
          filename:      best.filename,
          status:        'pending',
        });
      }
    }

    await sb.from('gmail_watch').update({
      history_id: historyId,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[webhook error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
