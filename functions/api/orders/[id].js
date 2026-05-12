// Single Order API
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env, data } = context;
  const id = context.params.id;
  
  if (!data.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  try {
    // Get order
    const order = await env.DB.prepare(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?'
    ).bind(id, data.session.userId).first();
    
    if (!order) {
      return jsonResponse({ error: 'Order not found' }, 404);
    }
    
    // Get order items
    const items = await env.DB.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).bind(id).all();
    
    return jsonResponse({
      order: {
        ...order,
        items: items.results || []
      }
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    return jsonResponse({ error: 'Failed to fetch order' }, 500);
  }
}
