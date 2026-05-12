// Cart API - For logged-in users
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env, data } = context;
  
  if (!data.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const cart = await env.DB.prepare(
      'SELECT items FROM carts WHERE user_id = ?'
    ).bind(data.session.userId).first();
    
    return jsonResponse({
      items: cart ? JSON.parse(cart.items) : []
    });
  } catch (err) {
    console.error('Error fetching cart:', err);
    return jsonResponse({ error: 'Failed to fetch cart' }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, data } = context;
  
  if (!data.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const body = await context.request.json();
    let items = body.items || [];
    
    // Check for already purchased items
    if (items.length > 0) {
      const { results } = await env.DB.prepare(`
        SELECT DISTINCT oi.recipe_id 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = ? AND o.status = 'paid'
      `).bind(data.session.userId).all();
      
      const purchasedIds = results.map(r => Number(r.recipe_id));
      items = items.filter(item => !purchasedIds.includes(Number(item.id)));
    }
    
    // Upsert cart
    await env.DB.prepare(
      `INSERT INTO carts (user_id, items, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET items = excluded.items, updated_at = CURRENT_TIMESTAMP`
    ).bind(data.session.userId, JSON.stringify(items)).run();
    
    return jsonResponse({ success: true, items });
  } catch (err) {
    console.error('Error updating cart:', err);
    return jsonResponse({ error: 'Failed to update cart' }, 500);
  }
}

export async function onRequestDelete(context) {
  const { env, data } = context;
  
  if (!data.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  try {
    await env.DB.prepare(
      'DELETE FROM carts WHERE user_id = ?'
    ).bind(data.session.userId).run();
    
    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Error clearing cart:', err);
    return jsonResponse({ error: 'Failed to clear cart' }, 500);
  }
}
