// Reset Password - Set new password using token
import { jsonResponse } from '../../utils.js';
import { hashPassword } from '../../utils/password.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return jsonResponse({ error: 'Token y nueva contraseña son requeridos' }, 400);
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400);
    }

    const resetEntry = await env.DB.prepare(
      'SELECT id, user_id FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?'
    ).bind(token, new Date().toISOString()).first();

    if (!resetEntry) {
      return jsonResponse({ error: 'Token inválido o expirado' }, 400);
    }

    const passwordHash = await hashPassword(password);

    await env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(passwordHash, resetEntry.user_id).run();

    await env.DB.prepare(
      'UPDATE password_reset_tokens SET used = 1 WHERE id = ?'
    ).bind(resetEntry.id).run();

    console.log(`[PASSWORD RESET] Password updated for user ${resetEntry.user_id}`);

    return jsonResponse({ success: true });

  } catch (err) {
    console.error('Reset password error:', err);
    return jsonResponse({ error: 'Error al resetear la contraseña' }, 500);
  }
}
