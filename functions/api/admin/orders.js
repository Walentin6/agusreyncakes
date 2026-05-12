// Admin Orders API - List all orders
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env, data } = context;
  
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }
  
  try {
    const url = new URL(context.request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    
    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    let bindings = [];
    
    if (status) {
      query += ' WHERE o.status = ?';
      bindings.push(status);
    }
    
    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    bindings.push(limit, offset);
    
    const orders = await env.DB.prepare(query).bind(...bindings).all();
    
    return jsonResponse({ orders: orders.results || [] });
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    return jsonResponse({ error: 'Failed to fetch orders' }, 500);
  }
}
