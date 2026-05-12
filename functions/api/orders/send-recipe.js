// Send recipe emails - admin endpoint to manually resend
import { jsonResponse, sendRecipeEmail } from '../../utils.js';

export async function onRequestPost(context) {
  const { env, data } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const body = await context.request.json();
    const orderId = body.orderId;
    if (!orderId) {
      return jsonResponse({ error: 'orderId es requerido' }, 400);
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