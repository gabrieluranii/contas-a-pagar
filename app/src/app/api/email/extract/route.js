import { downloadAttachment } from '@/lib/gmail';
import { NextResponse } from 'next/server';

// Extrai texto legível de um buffer PDF sem depender de pdfjs
function extractTextFromPDF(buffer) {
  const str = buffer.toString('latin1');
  const matches = str.match(/\(([^)]{2,80})\)/g) || [];
  const text = matches
    .map(m => m.slice(1, -1))
    .filter(s => /[a-zA-Z0-9]/.test(s))
    .join(' ')
    .slice(0, 3000);
  return text;
}

export async function POST(req) {
  try {
    const { messageId, attachmentId, filename } = await req.json();

    const base64url = await downloadAttachment(messageId, attachmentId);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const buffer = Buffer.from(base64, 'base64');

    const pdfText = extractTextFromPDF(buffer);
    console.log('[pdf text sample]', pdfText.slice(0, 200));

    if (!pdfText.trim()) {
      return NextResponse.json({
        extracted: { supplier: null, nf: null, value: null, due: null, emission: null },
        filename,
        warning: 'PDF sem texto extraível',
      });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é um extrator de dados de notas fiscais e boletos brasileiros. Retorne SOMENTE JSON válido, sem explicações.',
          },
          {
            role: 'user',
            content: `Extraia os dados deste documento e retorne SOMENTE este JSON:
{"supplier":"nome do emitente/fornecedor","nf":"número da NF ou boleto","value":0.00,"due":"YYYY-MM-DD","emission":"YYYY-MM-DD"}

Se não encontrar um campo, use null. Apenas o JSON, sem markdown.

DOCUMENTO:
${pdfText}`,
          },
        ],
        max_tokens: 256,
        temperature: 0,
      }),
    });

    const groqData = await groqRes.json();
    console.log('[groq response]', JSON.stringify(groqData).slice(0, 300));

    const raw = groqData.choices?.[0]?.message?.content || '{}';
    let extracted = {};
    try {
      extracted = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch { extracted = {}; }

    return NextResponse.json({ extracted, filename });
  } catch (err) {
    console.error('[email/extract error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
