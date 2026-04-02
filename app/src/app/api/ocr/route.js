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

    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: 'Chave do Groq não configurada no servidor.' },
        { status: 500 }
      );
    }

    // Groq aceita imagens mas não PDF direto — converte PDF para indicar como imagem
    const mediaType = mimeType === 'application/pdf' ? 'image/jpeg' : mimeType;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${base64Data}`,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err.error?.message || 'Falha na API do Groq' },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Adapta resposta do Groq para o mesmo formato que o frontend espera
    const text = data.choices?.[0]?.message?.content || '{}';
    return NextResponse.json({
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
    });
  } catch (error) {
    console.error('Erro na rota OCR:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
