// Google OAuth - Initiate login flow
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env } = context;
  
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = `${env.SITE_URL}/api/auth/callback`;
  const state = crypto.randomUUID();
  
  // Store state in KV for validation (5 min TTL)
  await env.SESSIONS.put(`oauth_state:${state}`, '1', { expirationTtl: 300 });
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
    prompt: 'consent'
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  return Response.redirect(authUrl, 302);
}
