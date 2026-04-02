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

async function pdfToImageBase64(pdfBase64) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = false;

  const pdfData = Buffer.from(pdfBase64, 'base64');
  const loadingTask = pdfjs.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const scale = 2.0;
  const viewport = page.getViewport({ scale });

  const { createCanvas } = await import('canvas');
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  await page.render({ canvasContext: context, viewport }).promise;

  return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
}

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

    // Se for PDF, converte a primeira página para imagem
    let imageBase64 = base64Data;
    let imageMime = mimeType;

    if (mimeType === 'application/pdf') {
      imageBase64 = await pdfToImageBase64(base64Data);
      imageMime = 'image/jpeg';
    }

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
                  url: `data:${imageMime};base64,${imageBase64}`,
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
    const text = data.choices?.[0]?.message?.content || '{}';

    return NextResponse.json({
      candidates: [{ content: { parts: [{ text }] } }],
    });
  } catch (error) {
    console.error('Erro na rota OCR:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
