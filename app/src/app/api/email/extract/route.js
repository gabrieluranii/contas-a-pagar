import { NextResponse } from 'next/server';

const EXTRACTION_PROMPT = `Extraia os seguintes campos do documento anexo (Boleto ou Nota Fiscal). Retorne EXATAMENTE e APENAS um JSON válido. Não inclua Markdown, backticks ou texto extra.
Campos requeridos:
- fornecedor (string): Nome do emissor ou recebedor.
- valor (number): Valor total a pagar numérico (ex: 1540.50).
- emissao (string): Data de emissão no formato YYYY-MM-DD.
- nfnum (string): Número da nota fiscal (se houver).
- nfserie (string): Série da nota fiscal (se houver).
- vencimento (string): Data de vencimento no formato YYYY-MM-DD.
- observacao (string): Linha digitável ou resumo.
- tipo (string): "boleto", "nf", "merged" ou "outro".
Retorne APENAS o JSON vazio se não entender nada.`;

export async function POST(req) {
  try {
    const { base64, mimeType, filename } = await req.json();

    const key = process.env.GROQ_API_KEY;
    if (!key) return NextResponse.json({ error: 'Chave Groq não configurada.' }, { status: 500 });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        }],
        temperature: 0,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message || 'Falha Groq' }, { status: res.status });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    let extracted = {};
    try {
      const match = raw.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/);
      if (match) extracted = JSON.parse(match[0]);
    } catch { extracted = {}; }

    return NextResponse.json({ extracted, filename });
  } catch (err) {
    console.error('[email/extract error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
