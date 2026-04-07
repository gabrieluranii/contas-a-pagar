import { fetchEmailsWithPDF } from '@/lib/gmail';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const emails = await fetchEmailsWithPDF();
    return NextResponse.json({ emails });
  } catch (err) {
    console.error('[email/fetch]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
