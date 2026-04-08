import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  const { data, error } = await supabase
    .from('email_queue')
    .select('*')
    .in('status', ['pending', 'rejected'])
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req) {
  const body = await req.json();
  const { action, item, id } = body;

  if (action === 'upsert') {
    const { data, error } = await supabase
      .from('email_queue')
      .upsert({
        email_id:      item.emailId,
        email_from:    item.emailFrom,
        email_subject: item.emailSubject,
        supplier:      item.supplier,
        value:         item.value,
        due:           item.due || null,
        emission:      item.emission || null,
        nf:            item.nf,
        serie:         item.serie,
        obs:           item.obs,
        tipo:          item.tipo,
        filename:      item.filename,
        status:        'pending',
      }, { onConflict: 'email_id' })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  }

  if (action === 'approve') {
    const { error } = await supabase
      .from('email_queue')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reject') {
    const { error } = await supabase
      .from('email_queue')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'restore') {
    const { error } = await supabase
      .from('email_queue')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}
