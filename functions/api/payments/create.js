// Mercado Pago - Create Checkout Preference
import { jsonResponse } from '../../utils.js';

export async function onRequestPost(context) {
  const { env, data } = context;

  if (!data.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await context.request.json();
    const items = body.items || [];
    const comboId = body.combo_id;

    // Handle combo purchase
    if (comboId) {
      const combo = await env.DB.prepare('SELECT * FROM combos WHERE id = ?').bind(comboId).first();

      if (!combo) {
        return jsonResponse({ error: 'Combo no encontrado' }, 400);
      }

      const comboRecipes = JSON.parse(combo.recipes || '[]');

      if (comboRecipes.length === 0) {
        return jsonResponse({ error: 'El combo no tiene recetas' }, 400);
      }

      // Check for already purchased recipes in combo
      const { results } = await env.DB.prepare(`
        SELECT DISTINCT oi.recipe_id
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = ? AND o.status = 'paid'
      `).bind(data.session.userId).all();

      const purchasedIds = results.map(r => Number(r.recipe_id));
      const alreadyPurchased = comboRecipes.filter(r => purchasedIds.includes(Number(r.id)));

      if (alreadyPurchased.length > 0) {
        return jsonResponse({
          error: 'Ya compraste algunas de las recetas de este combo',
          alreadyPurchased: alreadyPurchased.map(r => r.id)
        }, 400);
      }

      // Get recipe details from DB
      const recipeIds = comboRecipes.map(r => r.id);
      const placeholders = recipeIds.map(() => '?').join(',');
      const recipeDetails = await env.DB.prepare(
        `SELECT id, title, price FROM recipes WHERE id IN (${placeholders})`
      ).bind(...recipeIds).all();

      const recipeMap = {};
      (recipeDetails.results || []).forEach(r => {
        recipeMap[r.id] = r;
      });

      // Build items from combo recipes
      const comboItems = comboRecipes.map(r => ({
        id: r.id,
        title: recipeMap[r.id]?.title || r.title,
        price: recipeMap[r.id]?.price || r.price
      }));

      // Create order in DB with combo price
      const orderResult = await env.DB.prepare(
        'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)'
      ).bind(data.session.userId, combo.final_price, 'pending').run();

      const orderId = orderResult.meta.last_row_id;

      // Create order items with individual recipe prices (for reference)
      for (const item of comboItems) {
        await env.DB.prepare(
          'INSERT INTO order_items (order_id, recipe_id, recipe_title, price) VALUES (?, ?, ?, ?)'
        ).bind(orderId, item.id, item.title, item.price);
      }

      // Create MP preference for combo
      const mpItems = [{
        title: combo.title,
        description: combo.description ? combo.description.slice(0,100) : `Combo: ${combo.title}`,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: combo.final_price
      }];

      const preferenceData = {
        items: mpItems,
        payer: {
          email: data.session.email,
          name: data.session.name
        },
        external_reference: String(orderId),
        back_urls: {
          success: `${env.SITE_URL}/checkout/success`,
          failure: `${env.SITE_URL}/checkout/failure`,
          pending: `${env.SITE_URL}/checkout/pending`
        },
        auto_return: 'approved',
        notification_url: `${env.SITE_URL}/api/payments/webhook`
      };

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferenceData)
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error('Mercado Pago error:', mpData);
        return jsonResponse({ error: 'Payment provider error' }, 500);
      }

      await env.DB.prepare(
        'UPDATE orders SET preference_id = ? WHERE id = ?'
      ).bind(mpData.id, orderId).run();

      // Clear cart
      await env.DB.prepare(
        'DELETE FROM carts WHERE user_id = ?'
      ).bind(data.session.userId).run();

      return jsonResponse({
        orderId,
        preferenceId: mpData.id,
        initPoint: mpData.init_point,
        sandboxInitPoint: mpData.sandbox_init_point,
        combo: true
      });
    }

    // Regular items purchase (existing logic)
    if (items.length === 0) {
      return jsonResponse({ error: 'Cart is empty' }, 400);
    }

    // Check for already purchased items
    const { results } = await env.DB.prepare(`
      SELECT DISTINCT oi.recipe_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND o.status = 'paid'
    `).bind(data.session.userId).all();

    const purchasedIds = results.map(r => Number(r.recipe_id));
    const alreadyPurchased = items.filter(item => purchasedIds.includes(Number(item.id)));

    if (alreadyPurchased.length > 0) {
      return jsonResponse({
        error: 'Ya compraste algunas de estas recetas',
        alreadyPurchased: alreadyPurchased.map(i => i.id)
      }, 400);
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    // Create order in DB
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
    
    // Create Mercado Pago preference
    const mpItems = items.map(item => ({
      title: item.title,
      description: `Receta: ${item.title}`,
      quantity: item.quantity || 1,
      currency_id: 'ARS',
      unit_price: item.price
    }));
    
    const preferenceData = {
      items: mpItems,
      payer: {
        email: data.session.email,
        name: data.session.name
      },
      external_reference: String(orderId),
      back_urls: {
        success: `${env.SITE_URL}/checkout/success`,
        failure: `${env.SITE_URL}/checkout/failure`,
        pending: `${env.SITE_URL}/checkout/pending`
      },
      auto_return: 'approved',
      notification_url: `${env.SITE_URL}/api/payments/webhook`
    };
    
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });
    
    const mpData = await mpResponse.json();
    
    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      return jsonResponse({ error: 'Payment provider error' }, 500);
    }
    
    // Update order with preference ID
    await env.DB.prepare(
      'UPDATE orders SET preference_id = ? WHERE id = ?'
    ).bind(mpData.id, orderId).run();
    
    // Clear cart
    await env.DB.prepare(
      'DELETE FROM carts WHERE user_id = ?'
    ).bind(data.session.userId).run();
    
    return jsonResponse({
      orderId,
      preferenceId: mpData.id,
      initPoint: mpData.init_point, // URL para redirigir al usuario
      sandboxInitPoint: mpData.sandbox_init_point
    });
    
  } catch (err) {
    console.error('Error creating payment:', err);
    return jsonResponse({ error: 'Failed to create payment' }, 500);
  }
}
