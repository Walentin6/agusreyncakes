// Get order items for a specific order (users can view their own, admins can view any)
import { jsonResponse } from '../../../utils.js';

export async function onRequestGet(context) {
  const { env, data, params } = context;

  if (!data.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const orderId = params.id;

    // Verify ownership: non-admin users can only view their own orders
    if (!data.session.isAdmin) {
      const order = await env.DB.prepare(
        'SELECT id FROM orders WHERE id = ? AND user_id = ?'
      ).bind(orderId, data.session.userId).first();

      if (!order) {
        return jsonResponse({ error: 'Order not found' }, 404);
      }
    }

    const items = await env.DB.prepare(
      `SELECT oi.id, oi.order_id, oi.recipe_id, oi.recipe_title, oi.price,
              r.title as recipe_title,
              CASE WHEN r.pdf_base64 IS NOT NULL THEN 1 ELSE 0 END as has_pdf
       FROM order_items oi
       LEFT JOIN recipes r ON oi.recipe_id = r.id
       WHERE oi.order_id = ?`
    ).bind(orderId).all();

    return jsonResponse({ items: items.results || [] });
  } catch (err) {
    console.error('Error fetching order items:', err);
    return jsonResponse({ error: 'Failed to fetch order items' }, 500);
  }
}
