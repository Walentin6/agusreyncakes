// Auth utilities for Cloudflare Pages Functions

const COOKIE_NAME = 'session_id';
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
const REMEMBER_ME_TTL = 60 * 60 * 24 * 30; // 30 days

export async function createSession(env, userId, email, name, picture, isAdmin) {
  const sessionId = crypto.randomUUID();
  const sessionData = JSON.stringify({
    userId,
    email,
    name,
    picture,
    isAdmin,
    createdAt: Date.now()
  });
  
  await env.SESSIONS.put(sessionId, sessionData, { expirationTtl: SESSION_TTL });
  
  return sessionId;
}

export async function getSession(env, request) {
  const cookie = getCookie(request, COOKIE_NAME);
  if (!cookie) return null;
  
  const sessionData = await env.SESSIONS.get(cookie);
  if (!sessionData) return null;
  
  return JSON.parse(sessionData);
}

export async function destroySession(env, request) {
  const cookie = getCookie(request, COOKIE_NAME);
  if (cookie) {
    await env.SESSIONS.delete(cookie);
  }
}

export function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
}

export function setCookie(name, value, options = {}) {
  const defaults = {
    Path: '/',
    HttpOnly: true,
    Secure: true,
    SameSite: 'Lax',
    MaxAge: SESSION_TTL
  };

  const opts = { ...defaults, ...options };
  let cookie = `${name}=${value}`;

  if (opts.rememberMe) {
    opts.MaxAge = REMEMBER_ME_TTL;
    delete opts.rememberMe;
  }

  for (const [key, val] of Object.entries(opts)) {
    if (val === true) {
      cookie += `; ${key}`;
    } else if (val !== false && val !== undefined) {
      cookie += `; ${key}=${val}`;
    }
  }

  return cookie;
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}

export function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    }
  });
}

const MAX_PDF_SIZE_BASE64 = 900000; // Legacy limit if not using R2
const MAX_PDF_SIZE_R2 = 25 * 1024 * 1024; // 25MB for R2

export function validatePdfBase64(base64, hasR2 = false) {
  if (!base64) return { valid: false, error: 'pdf_base64 es requerido' };

  let clean = base64;
  if (clean.startsWith('data:')) {
    clean = clean.replace(/^data:[^;]+;base64,/, '');
  }

  const limit = hasR2 ? MAX_PDF_SIZE_R2 : MAX_PDF_SIZE_BASE64;

  if (clean.length > limit) {
    return { valid: false, error: `El PDF supera el límite de tamaño (máximo ~${Math.round(limit * 0.75 / 1024 / 1024)}MB originales). Considerá comprimir el PDF.`, clean };
  }

  return { valid: true, clean };
}

function buildRecipeEmailHtml(order, recipesWithPdf, recipesWithoutPdf) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Georgia, serif; background: #FAF5EF; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; }
    .brand { font-family: Georgia, serif; font-style: italic; font-size: 32px; color: #3D2E2A; }
    .brand span { color: #C97B7B; }
    h1 { font-family: Georgia, serif; font-weight: 300; font-size: 28px; color: #3D2E2A; margin: 0 0 8px; }
    p { color: #6B5953; line-height: 1.6; }
    .recipes { margin: 28px 0; }
    .recipe-item { padding: 16px; background: #FAF5EF; border-radius: 8px; margin-bottom: 12px; }
    .recipe-item .name { font-size: 16px; font-weight: 600; color: #3D2E2A; }
    .recipe-item .pdf-badge { display: inline-block; margin-top: 6px; font-size: 11px; color: #2E7D32; background: #E8F5E9; padding: 3px 8px; border-radius: 4px; }
    .warning { background: #FFF3E0; padding: 14px; border-radius: 8px; color: #EF6C00; font-size: 13px; margin-top: 16px; }
    .footer { text-align: center; margin-top: 32px; color: #9A8880; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">agustina<span>.</span></div>
    </div>
    <h1>¡Gracias por tu compra! ✿</h1>
    <p>Hola ${order.user_name || 'allí'},</p>
    <p>Tu pedido #${order.id} fue confirmado. Encontrás tus recetas adjuntas en este email.</p>

    ${recipesWithPdf.length > 0 ? `
    <div class="recipes">
      <p style="font-weight: 600; color: #3D2E2A; margin-bottom: 12px;">Recetas adjuntas (PDF):</p>
      ${recipesWithPdf.map(item => `
        <div class="recipe-item">
          <div class="name">📄 ${item.recipe_title || 'Receta'}</div>
          <div class="pdf-badge">✓ PDF adjunto en este email</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${recipesWithoutPdf.length > 0 ? `
    <div class="warning">
      ⚠️ Las siguientes recetas no tienen PDF adjunto. Contactá a Agustina para recibir tu receta.
      <br/><strong>${recipesWithoutPdf.join(', ')}</strong>
    </div>
    ` : ''}

    <p style="margin-top: 24px;">¿Dudas? Respondé este email o escribile a @agustina.reynoso en Instagram ✿</p>

    <div class="footer">
      agustina reynoso · recetas de autora<br/>
      Hecho con harina & amor en Justiniano Posse
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendRecipeEmail(env, orderId) {
  const order = await env.DB.prepare(
    'SELECT o.*, u.email as user_email, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?'
  ).bind(orderId).first();

  if (!order || !order.user_email) {
    return { sent: false, error: 'Sin email para el pedido' };
  }

  const orderItems = await env.DB.prepare(
    `SELECT oi.*, r.pdf_base64, r.title as recipe_title
     FROM order_items oi
     LEFT JOIN recipes r ON oi.recipe_id = r.id
     WHERE oi.order_id = ?`
  ).bind(orderId).all();

  const items = orderItems.results || [];

  const attachments = [];
  const recipesWithPdf = [];
  const recipesWithoutPdf = [];

  for (const i of items) {
    let pdfData = null;

    if (env.PDF_BUCKET) {
      try {
        const r2Object = await env.PDF_BUCKET.get(`recipe_pdfs/${i.recipe_id}.txt`);
        if (r2Object) {
          pdfData = await r2Object.text();
        }
      } catch (err) {
        console.error(`[SEND-RECIPE] Error fetching PDF for recipe ${i.recipe_id} from R2:`, err);
      }
    }

    if (!pdfData && i.pdf_base64 && i.pdf_base64 !== 'R2_STORED') {
      pdfData = i.pdf_base64;
    }

    if (pdfData) {
      recipesWithPdf.push(i);
      attachments.push({
        filename: `${(i.recipe_title || 'receta').replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`,
        content: pdfData,
        content_type: 'application/pdf',
        contentType: 'application/pdf'
      });
    } else {
      recipesWithoutPdf.push(i.recipe_title || 'Receta');
    }
  }

  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { sent: false, error: 'RESEND_API_KEY no configurada' };
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'Agustina Reynoso <noreply@agusreyncakes.com>';

  const htmlBody = buildRecipeEmailHtml(order, recipesWithPdf, recipesWithoutPdf);

  const payload = {
    from: fromEmail,
    to: [order.user_email],
    subject: `Tu pedido #${order.id} está listo ✿ agustina reynoso`,
    html: htmlBody,
    ...(attachments.length > 0 ? { attachments } : {})
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
    console.error('[SEND-RECIPE] Resend error:', emailResult);
    return { sent: false, error: emailResult.message || 'Error al enviar email' };
  }

  await env.DB.prepare(
    'UPDATE orders SET email_sent_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), orderId).run();

  console.log(`[SEND-RECIPE] Email sent for order ${orderId} to ${order.user_email}, attachments: ${attachments.length}`);
  return { sent: true, messageId: emailResult.id, attachmentsSent: attachments.length, recipesWithoutPdf: recipesWithoutPdf.length };
}
