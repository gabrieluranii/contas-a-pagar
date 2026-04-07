import { downloadAttachment } from '@/lib/gmail';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messageId, attachmentId, filename } = await req.json();

    // Baixa o PDF como base64
    const base64url = await downloadAttachment(messageId, attachmentId);
    // Converte base64url → base64 padrão
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');

    // Envia para Groq Vision (modelo com suporte a documentos)
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analise este PDF de nota fiscal ou boleto e retorne SOMENTE um JSON válido com os campos:
{
  "supplier": "nome do fornecedor/emitente",
  "nf": "número da nota fiscal ou boleto",
  "value": valor numérico total,
  "due": "data de vencimento no formato YYYY-MM-DD",
  "emission": "data de emissão no formato YYYY-MM-DD"
}
Se não encontrar um campo, use null. Retorne apenas o JSON, sem explicações.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 512,
      }),
    });

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content || '{}';

    let extracted = {};
    try {
      extracted = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      extracted = {};
    }

    return NextResponse.json({ extracted, filename });
  } catch (err) {
    console.error('[email/extract]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
