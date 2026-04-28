import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

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

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_BASE64_LENGTH = 7 * 1024 * 1024; // ~5.25 MB binário

export async function POST(req) {
  try {
    // 1. Auth — primeiro tenta Bearer token no header (atual fluxo cliente browser)
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let user = null;

    if (bearerToken) {
      // Cliente mandou token explícito — valida com createClient simples (não precisa cookies)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data, error } = await supabaseAuth.auth.getUser(bearerToken);
      if (!error && data?.user) user = data.user;
    } else {
      // Fallback: cookie-based via @supabase/ssr (pra quando migrarmos)
      const supabase = await getServerSupabase();
      const { data: { user: cookieUser } } = await supabase.auth.getUser();
      user = cookieUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Rate limit
    const rl = checkRateLimit(`ocr:${user.id}`);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    // 3. Validação
    const { mimeType, base64Data } = await req.json();

    if (!mimeType || !base64Data) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    if (!ALLOWED_MIME.includes(mimeType)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não suportado. Permitidos: ${ALLOWED_MIME.join(', ')}` },
        { status: 400 }
      );
    }
    if (typeof base64Data !== 'string' || base64Data.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: 'Arquivo muito grande (máx 5 MB).' }, { status: 413 });
    }

    // 4. Groq
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'Chave do Groq não configurada.' }, { status: 500 });
    }

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
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        }],
        temperature: 0,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
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
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
