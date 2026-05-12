// Get current user info
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env, data } = context;
  
  if (!data.session) {
    return jsonResponse({ user: null }, 401);
  }
  
  try {
    // Get purchased recipes
    const { results } = await env.DB.prepare(`
      SELECT DISTINCT oi.recipe_id 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND o.status = 'paid'
    `).bind(data.session.userId).all();
    
    const purchasedRecipeIds = results.map(row => row.recipe_id);

    return jsonResponse({
      user: {
        id: data.session.userId,
        email: data.session.email,
        name: data.session.name,
        picture: data.session.picture,
        isAdmin: data.session.isAdmin === 1 || data.session.isAdmin === true,
        purchasedRecipes: purchasedRecipeIds
      }
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
    return jsonResponse({ error: 'Failed to fetch user data' }, 500);
  }
}
