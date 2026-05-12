// Forgot Password - Generate reset token
import { jsonResponse } from '../../utils.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const { email } = await request.json();

    if (!email) {
      return jsonResponse({ error: 'Email es requerido' }, 400);
    }

    const user = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ? AND password_hash IS NOT NULL'
    ).bind(email.toLowerCase().trim()).first();

    if (!user) {
      return jsonResponse({ received: true });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, token, expiresAt).run();

    const resetUrl = `${env.SITE_URL}/reset-password.html?token=${token}`;

    console.log(`[PASSWORD RESET] Token generated for ${email}`);
    console.log(`[PASSWORD RESET] Reset URL: ${resetUrl}`);
    console.log(`[PASSWORD RESET] Token expires at: ${expiresAt}`);

    return jsonResponse({ received: true });

  } catch (err) {
    console.error('Forgot password error:', err);
    return jsonResponse({ received: true });
  }
}
