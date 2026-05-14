// Email Login
import { createSession, setCookie, jsonResponse } from '../../utils.js';
import { verifyPassword } from '../../utils/password.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return jsonResponse({ error: 'Email y contraseña son requeridos' }, 400);
    }

    const user = await env.DB.prepare(
      'SELECT id, email, name, picture, password_hash, is_admin FROM users WHERE email = ?'
    ).bind(email.toLowerCase().trim()).first();

    if (!user) {
      return jsonResponse({ error: 'Credenciales inválidas' }, 401);
    }

    if (!user.password_hash) {
      return jsonResponse({ error: 'Esta cuenta no tiene contraseña. Iniciá sesión con Google.' }, 401);
    }

    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return jsonResponse({ error: 'Credenciales inválidas' }, 401);
    }

    const sessionId = await createSession(env, user.id, user.email, user.name || user.email, user.picture, user.is_admin);

    const headers = new Headers();
    headers.append('Set-Cookie', setCookie('session_id', sessionId, { rememberMe: !!rememberMe }));
    headers.append('Content-Type', 'application/json');

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });

  } catch (err) {
    console.error('Login error:', err);
    return jsonResponse({ error: 'Error al iniciar sesión' }, 500);
  }
}
