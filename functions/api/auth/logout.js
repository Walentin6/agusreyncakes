// Logout - destroy session
import { destroySession, setCookie } from '../../utils.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  
  await destroySession(env, request);
  
  const headers = new Headers();
  headers.append('Set-Cookie', setCookie('session_id', '', { MaxAge: 0 }));
  headers.append('Content-Type', 'application/json');
  
  return new Response(JSON.stringify({ success: true }), { headers });
}

export async function onRequestGet(context) {
  return onRequestPost(context);
}
