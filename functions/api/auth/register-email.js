// Email Registration
import { createSession, setCookie, jsonResponse } from '../../utils.js';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return jsonResponse({ error: 'Email y contraseña son requeridos' }, 400);
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonResponse({ error: 'Email inválido' }, 400);
    }

    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase().trim()).first();

    if (existingUser) {
      return jsonResponse({ error: 'Ya existe una cuenta con este email' }, 409);
    }

    const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);

    const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    const isAdmin = userCount.count === 0 ? 1 : 0;

    const result = await env.DB.prepare(
      'INSERT INTO users (email, name, password_hash, is_admin) VALUES (?, ?, ?, ?)'
    ).bind(email.toLowerCase().trim(), email.split('@')[0], passwordHash, isAdmin).run();

    const userId = result.meta.last_row_id;

    const sessionId = await createSession(env, userId, email, email.split('@')[0], null, isAdmin);

    const headers = new Headers();
    headers.append('Set-Cookie', setCookie('session_id', sessionId));
    headers.append('Content-Type', 'application/json');

    return new Response(JSON.stringify({ success: true, userId }), { status: 201, headers });

  } catch (err) {
    console.error('Register error:', err);
    console.error('Register error stack:', err.stack);
    return jsonResponse({ error: 'Error al crear la cuenta', details: err.message }, 500);
  }
}
