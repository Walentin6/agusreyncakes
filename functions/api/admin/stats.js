// Admin Stats API
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env, data } = context;
  
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }
  
  try {
    // Total recipes (non-deleted)
    const recipesCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM recipes WHERE deleted_at IS NULL"
    ).first();

    // Trash count
    const trashCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM recipes WHERE deleted_at IS NOT NULL"
    ).first();
    
    // Total users
    const usersCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first();
    
    // Total orders
    const ordersCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM orders'
    ).first();
    
    // Total revenue (paid orders)
    const revenue = await env.DB.prepare(
      'SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = "paid"'
    ).first();
    
    // Recent orders
    const recentOrders = await env.DB.prepare(
      `SELECT o.*, u.name as user_name, u.email as user_email,
              COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    ).all();
    
    // Orders by status
    const ordersByStatus = await env.DB.prepare(
      'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
    ).all();
    
    return jsonResponse({
      stats: {
        recipes: recipesCount.count,
        trash: trashCount.count,
        users: usersCount.count,
        orders: ordersCount.count,
        revenue: revenue.total
      },
      recentOrders: recentOrders.results || [],
      ordersByStatus: ordersByStatus.results || []
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return jsonResponse({ error: 'Failed to fetch stats' }, 500);
  }
}
