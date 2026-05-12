// Admin Users API - List all users
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env, data } = context;
  
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }
  
  try {
    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    
    const users = await env.DB.prepare(
      `SELECT id, email, name, picture, is_admin, created_at,
              (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
       FROM users
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
    
    return jsonResponse({ users: users.results || [] });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    return jsonResponse({ error: 'Failed to fetch users' }, 500);
  }
}
