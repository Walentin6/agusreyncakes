// Send recipe emails - for admin and users to manually resend
import { jsonResponse, sendRecipeEmail } from '../../utils.js';

export async function onRequestPost(context) {
  const { env, data } = context;

  if (!data.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await context.request.json();
    const orderId = body.orderId;
    if (!orderId) {
      return jsonResponse({ error: 'orderId es requerido' }, 400);
    }

    // Verify ownership: non-admin users can only resend their own orders
    if (!data.session.isAdmin) {
      const order = await env.DB.prepare(
        'SELECT id, status FROM orders WHERE id = ? AND user_id = ?'
      ).bind(orderId, data.session.userId).first();

      if (!order) {
        return jsonResponse({ error: 'Pedido no encontrado' }, 404);
      }

      if (order.status !== 'paid') {
        return jsonResponse({ error: 'El pedido no está pagado' }, 400);
      }
    }

    const result = await sendRecipeEmail(env, orderId);

    if (!result.sent) {
      return jsonResponse({ error: result.error }, 400);
    }

    return jsonResponse(result);
  } catch (err) {
    console.error('[SEND-RECIPE] Error:', err);
    return jsonResponse({ error: 'Error al procesar: ' + err.message }, 500);
  }
}