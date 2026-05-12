// Orders API - Create and List
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env, data } = context;
  
  if (!data.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const orders = await env.DB.prepare(
      `SELECT o.*, COUNT(oi.id) as item_count 
       FROM orders o 
       LEFT JOIN order_items oi ON o.id = oi.order_id 
       WHERE o.user_id = ? 
       GROUP BY o.id 
       ORDER BY o.created_at DESC`
    ).bind(data.session.userId).all();
    
    return jsonResponse({ orders: orders.results || [] });
  } catch (err) {
    console.error('Error fetching orders:', err);
    return jsonResponse({ error: 'Failed to fetch orders' }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, data } = context;
  
  if (!data.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const body = await context.request.json();
    const items = body.items || [];
    
    if (items.length === 0) {
      return jsonResponse({ error: 'Cart is empty' }, 400);
    }
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    // Create order
    const orderResult = await env.DB.prepare(
      'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)'
    ).bind(data.session.userId, total, 'pending').run();
    
    const orderId = orderResult.meta.last_row_id;
    
    // Create order items
    for (const item of items) {
      await env.DB.prepare(
        'INSERT INTO order_items (order_id, recipe_id, recipe_title, price) VALUES (?, ?, ?, ?)'
      ).bind(orderId, item.id, item.title, item.price).run();
    }
    
    // Clear cart
    await env.DB.prepare(
      'DELETE FROM carts WHERE user_id = ?'
    ).bind(data.session.userId).run();
    
    return jsonResponse({ orderId, total, status: 'pending' }, 201);
  } catch (err) {
    console.error('Error creating order:', err);
    return jsonResponse({ error: 'Failed to create order' }, 500);
  }
}
