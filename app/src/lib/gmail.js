import { google } from 'googleapis';

function getOAuthClient() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  );
  oAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return oAuth2Client;
}

// Retorna lista de mensagens com anexo PDF (max 20)
export async function fetchEmailsWithPDF() {
  const auth = getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const list = await gmail.users.messages.list({
    userId: process.env.GMAIL_USER,
    q: 'from:gabriel.assis@medmais.com OR to:gabriel.assis@medmais.com has:attachment filename:pdf',
    maxResults: 20,
  });

  const messages = list.data.messages || [];

  const results = await Promise.all(
    messages.map(async ({ id }) => {
      const msg = await gmail.users.messages.get({
        userId: process.env.GMAIL_USER,
        id,
        format: 'full',
      });

      const headers = msg.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from    = headers.find(h => h.name === 'From')?.value || '';
      const date    = headers.find(h => h.name === 'Date')?.value || '';

      // Encontra anexos PDF
      const parts = msg.data.payload.parts || [];
      const pdfParts = parts.filter(p =>
        p.mimeType === 'application/pdf' || p.filename?.endsWith('.pdf')
      );

      return {
        id,
        subject,
        from,
        date,
        attachments: pdfParts.map(p => ({
          filename: p.filename,
          attachmentId: p.body.attachmentId,
          messageId: id,
        })),
      };
    })
  );

  return results.filter(r => r.attachments.length > 0);
}

// Baixa anexo como base64
export async function downloadAttachment(messageId, attachmentId) {
  const auth = getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.attachments.get({
    userId: process.env.GMAIL_USER,
    messageId,
    id: attachmentId,
  });

  return res.data.data; // base64url
}
