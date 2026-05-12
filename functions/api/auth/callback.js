// Google OAuth - Callback handler
import { createSession, setCookie } from '../../utils.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  if (error) {
    return Response.redirect(`${env.SITE_URL}/?error=${error}`, 302);
  }
  
  if (!code || !state) {
    return Response.redirect(`${env.SITE_URL}/?error=invalid_request`, 302);
  }
  
  // Validate state
  const stateValid = await env.SESSIONS.get(`oauth_state:${state}`);
  if (!stateValid) {
    return Response.redirect(`${env.SITE_URL}/?error=invalid_state`, 302);
  }
  await env.SESSIONS.delete(`oauth_state:${state}`);
  
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${env.SITE_URL}/api/auth/callback`;
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return Response.redirect(`${env.SITE_URL}/?error=token_exchange_failed`, 302);
    }
    
    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    
    const userData = await userResponse.json();
    
    if (!userResponse.ok || !userData.email) {
      console.error('User info fetch failed:', userData);
      return Response.redirect(`${env.SITE_URL}/?error=user_info_failed`, 302);
    }
    
    // Check if user exists in D1
    const existingUser = await env.DB.prepare(
      'SELECT id, is_admin FROM users WHERE email = ?'
    ).bind(userData.email).first();
    
    let userId;
    let isAdmin = 0;
    
    if (existingUser) {
      userId = existingUser.id;
      isAdmin = existingUser.is_admin;
      
      // Update user's Google ID and picture if missing
      await env.DB.prepare(
        'UPDATE users SET google_id = ?, picture = ?, name = ? WHERE id = ?'
      ).bind(userData.id, userData.picture, userData.name, userId).run();
    } else {
      // Create new user
      // First user becomes admin automatically
      const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
      isAdmin = userCount.count === 0 ? 1 : 0;
      
      const result = await env.DB.prepare(
        'INSERT INTO users (email, name, picture, google_id, is_admin) VALUES (?, ?, ?, ?, ?)'
      ).bind(userData.email, userData.name, userData.picture, userData.id, isAdmin).run();
      
      userId = result.meta.last_row_id;
    }
    
    // Create session
    const sessionId = await createSession(env, userId, userData.email, userData.name, userData.picture, isAdmin);
    
    // Set cookie and redirect
    const headers = new Headers();
    headers.append('Set-Cookie', setCookie('session_id', sessionId));
    headers.append('Location', `${env.SITE_URL}/`);
    
    return new Response(null, { status: 302, headers });
    
  } catch (err) {
    console.error('OAuth callback error:', err);
    return Response.redirect(`${env.SITE_URL}/?error=auth_failed`, 302);
  }
}
