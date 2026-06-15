import { jsonResponse } from '../../../utils.js';

export async function onRequestDelete(context) {
  const { env, data, params } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const orderId = params.id;

    const order = await env.DB.prepare(
      'SELECT id, status FROM orders WHERE id = ? AND deleted_at IS NULL'
    ).bind(orderId).first();

    if (!order) {
      return jsonResponse({ error: 'Pedido no encontrado' }, 404);
    }

    await env.DB.prepare(
      'UPDATE orders SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(orderId).run();

    return jsonResponse({ success: true, orderId });
  } catch (err) {
    console.error('Error deleting order:', err);
    return jsonResponse({ error: 'Failed to delete order' }, 500);
  }
}
