import { downloadAttachment } from '@/lib/gmail';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messageId, attachmentId } = await req.json();
    const base64url = await downloadAttachment(messageId, attachmentId);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    return NextResponse.json({ base64 });
  } catch (err) {
    console.error('[email/attachment error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
