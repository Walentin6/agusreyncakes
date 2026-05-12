import { jsonResponse, sendRecipeEmail } from '../utils.js';

export async function onRequestGet(context) {
  const { env, request } = context;

  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    return jsonResponse({ error: 'RESEND_API_KEY no configurada' }, 500);
  }

  try {
    // Buscar la receta más reciente que tenga PDF (para probar el adjunto)
    const recipe = await env.DB.prepare(
      'SELECT id, title, price FROM recipes WHERE pdf_base64 IS NOT NULL ORDER BY id DESC LIMIT 1'
    ).first();

    if (!recipe) {
      return jsonResponse({ error: 'No hay ninguna receta con PDF subido para probar.' }, 400);
    }

    // Usar el email desde un query param (ej: /api/test-email?email=tu@email.com) 
    // o un email fijo para pruebas
    const url = new URL(request.url);
    const targetEmail = url.searchParams.get('email') || 'valentinfernandez2006@gmail.com';

    // Crear un usuario temporal si no existe
    let user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(targetEmail).first();
    let userId;
    if (!user) {
      const userRes = await env.DB.prepare(
        'INSERT INTO users (email, name, provider) VALUES (?, ?, ?)'
      ).bind(targetEmail, 'Usuario de Prueba', 'test').run();
      userId = userRes.meta.last_row_id;
    } else {
      userId = user.id;
    }

    // Crear una orden falsa
    const orderRes = await env.DB.prepare(
      'INSERT INTO orders (user_id, total, status, paid_at) VALUES (?, ?, ?, ?)'
    ).bind(userId, recipe.price, 'paid', new Date().toISOString()).run();
    const orderId = orderRes.meta.last_row_id;

    // Agregar la receta a la orden
    await env.DB.prepare(
      'INSERT INTO order_items (order_id, recipe_id, recipe_title, price) VALUES (?, ?, ?, ?)'
    ).bind(orderId, recipe.id, recipe.title, recipe.price).run();

    // Enviar el email (¡Esto dispara el flujo real de emails con PDFs!)
    const result = await sendRecipeEmail(env, orderId);

    if (result.sent) {
      return jsonResponse({ 
        success: true, 
        message: `Email enviado a ${targetEmail} simulando la compra de "${recipe.title}".`,
        details: result 
      });
    } else {
      return jsonResponse({ 
        success: false, 
        error: 'Falló el envío del email', 
        details: result 
      }, 500);
    }

  } catch (err) {
    console.error('[TEST-EMAIL] Error:', err);
    return jsonResponse({ error: err.message }, 500);
  }
}
