import { NextResponse } from 'next/server';

const EXTRACTION_PROMPT = `Você é um especialista em documentos fiscais brasileiros. Analise o documento e extraia os dados retornando EXATAMENTE e APENAS um JSON válido, sem Markdown, sem backticks, sem texto extra.

REGRAS IMPORTANTES:
1. Datas brasileiras estão no formato DD/MM/YYYY. Converta SEMPRE para YYYY-MM-DD. Exemplo: 09/05/2026 → 2026-05-09
2. O campo "tipo" deve ser: "boleto" se for boleto bancário, "nf" se for nota fiscal eletrônica (NF-e/DANFE), "merged" se o documento contiver boleto E nota fiscal, ou "outro" se não identificar
3. O valor deve ser numérico sem formatação. Exemplo: R$ 1.147,50 → 1147.50
4. Se não encontrar um campo, retorne null

Campos a extrair:
- fornecedor (string): Nome do emitente/beneficiário/fornecedor
- valor (number): Valor total do documento
- emissao (string): Data de emissão no formato YYYY-MM-DD
- nfnum (string): Número da NF ou número do documento/boleto
- nfserie (string): Série da nota fiscal, se não houver retorne "1"
- vencimento (string): Data de vencimento no formato YYYY-MM-DD
- observacao (string): Linha digitável do boleto ou descrição do serviço
- tipo (string): "boleto", "nf", "merged" ou "outro"

Retorne APENAS o JSON, nada mais.`;

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
                  url: `data:${mimeType};base64,${base64Data}`,
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
