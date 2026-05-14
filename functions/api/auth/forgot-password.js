// Forgot Password - Generate reset token and send email
import { jsonResponse } from '../../utils.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const { email } = await request.json();

    if (!email) {
      return jsonResponse({ error: 'Email es requerido' }, 400);
    }

    const user = await env.DB.prepare(
      'SELECT id, name, email FROM users WHERE email = ? AND password_hash IS NOT NULL'
    ).bind(email.toLowerCase().trim()).first();

    if (!user) {
      return jsonResponse({ received: true });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, token, expiresAt).run();

    const resetUrl = `${env.SITE_URL || 'http://localhost:8788'}/reset-password.html?token=${token}`;

    const resendApiKey = env.RESEND_API_KEY;
    if (resendApiKey) {
      const fromEmail = env.RESEND_FROM_EMAIL || 'Agustina Reynoso <noreply@agusreyncakes.com>';
      const userName = user.name || 'pastelera';
      const htmlBody = buildPasswordResetEmail(userName, resetUrl);

      const payload = {
        from: fromEmail,
        to: [user.email],
        subject: 'Restablecé tu contraseña ✿ agustina reynoso',
        html: htmlBody
      };

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const emailResult = await emailRes.json().catch(() => ({}));

      if (!emailRes.ok) {
        console.error('[FORGOT-PASSWORD] Resend error:', emailResult);
      } else {
        console.log(`[FORGOT-PASSWORD] Email sent to ${user.email}, messageId: ${emailResult.id}`);
      }
    } else {
      console.log('[FORGOT-PASSWORD] RESEND_API_KEY no configurada, solo logueando URL');
      console.log(`[FORGOT-PASSWORD] Reset URL: ${resetUrl}`);
    }

    return jsonResponse({ received: true });

  } catch (err) {
    console.error('Forgot password error:', err);
    return jsonResponse({ received: true });
  }
}

function buildPasswordResetEmail(userName, resetUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: Georgia, serif; background: #FAF5EF; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; }
    .brand { font-family: Georgia, serif; font-style: italic; font-size: 32px; color: #3D2E2A; }
    .brand span { color: #C97B7B; }
    h1 { font-family: Georgia, serif; font-weight: 300; font-size: 28px; color: #3D2E2A; margin: 0 0 8px; }
    p { color: #6B5953; line-height: 1.6; }
    .button { display: inline-block; padding: 14px 32px; background: #3D2E2A; color: #FAF5EF; text-decoration: none; border-radius: 999px; font-size: 14px; font-weight: 600; margin: 24px 0; }
    .button:hover { background: #C97B7B; }
    .link-text { font-size: 12px; color: #9A8880; word-break: break-all; margin-top: 16px; }
    .warning { background: #FFF3E0; padding: 14px; border-radius: 8px; color: #EF6C00; font-size: 13px; margin-top: 24px; }
    .footer { text-align: center; margin-top: 32px; color: #9A8880; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">agustina<span>.</span></div>
    </div>
    <h1>¿Olvidaste tu contraseña?</h1>
    <p>Hola ${userName},</p>
    <p>Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón de abajo para elegir una nueva contraseña:</p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Restablecer mi contraseña</a>
    </div>

    <p class="link-text">O copiá y pegá este link en tu navegador:<br/>${resetUrl}</p>

    <div class="warning">
      ⚠️ Este link expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignorá este email.
    </div>

    <div class="footer">
      agustina reynoso · recetas de autora<br/>
      Hecho con harina & amor en Justiniano Posse
    </div>
  </div>
</body>
</html>
  `.trim();
}
