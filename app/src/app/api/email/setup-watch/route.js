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

export async function POST() {
  try {
    const auth = getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const res = await gmail.users.watch({
      userId: process.env.GMAIL_USER,
      requestBody: {
        topicName: process.env.GMAIL_PUBSUB_TOPIC,
        labelIds: ['INBOX'],
      },
    });

    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    await sb.from('gmail_watch').update({
      history_id: res.data.historyId,
      expiration: res.data.expiration,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);

    return NextResponse.json({ ok: true, historyId: res.data.historyId, expiration: res.data.expiration });
  } catch (err) {
    console.error('[setup-watch]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
