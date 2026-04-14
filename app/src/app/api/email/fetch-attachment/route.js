import { google } from 'googleapis';
import { NextResponse } from 'next/server';

function getOAuthClient() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return oAuth2Client;
}

export async function POST(req) {
  try {
    const { messageId } = await req.json();
    if (!messageId) return NextResponse.json({ error: 'messageId obrigatório' }, { status: 400 });

    const auth = getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const msg = await gmail.users.messages.get({
      userId: process.env.GMAIL_USER,
      id: messageId,
      format: 'full',
    });

    const parts = msg.data.payload.parts || [];
    const pdfPart = parts.find(p => p.mimeType === 'application/pdf' || p.filename?.endsWith('.pdf'));

    if (!pdfPart) return NextResponse.json({ error: 'Nenhum PDF encontrado' }, { status: 404 });

    const att = await gmail.users.messages.attachments.get({
      userId: process.env.GMAIL_USER,
      messageId,
      id: pdfPart.body.attachmentId,
    });

    const base64 = att.data.data.replace(/-/g, '+').replace(/_/g, '/');
    return NextResponse.json({ base64, filename: pdfPart.filename });
  } catch (err) {
    console.error('[fetch-attachment]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
