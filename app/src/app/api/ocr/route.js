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
- tipo (string): "boleto", "nf", "merged" (se tiver ambos) ou "outro".

Retorne APENAS o JSON vazio se não entender nada.
`;

export async function POST(req) {
  try {
    const { mimeType, base64Data } = await req.json();

    if (!mimeType || !base64Data) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: 'Chave do Gemini não configurada no servidor.' },
        { status: 500 }
      );
    }

    const model = mimeType === 'application/pdf' ? 'gemini-2.0-flash' : 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Data } },
              { text: EXTRACTION_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err.error?.message || 'Falha na API do Gemini' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota OCR:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
