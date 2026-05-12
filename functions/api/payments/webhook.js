// Mercado Pago - Webhook handler
import { jsonResponse, sendRecipeEmail } from '../../utils.js';

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();

    if (body.type === 'payment' || body.topic === 'payment') {
      const paymentId = body.data?.id || body.id;

      if (!paymentId) {
        return jsonResponse({ received: true });
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`
        }
      });

      const paymentData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error('MP verification failed:', paymentData);
        return jsonResponse({ error: 'Verification failed' }, 500);
      }

      const orderId = paymentData.external_reference;
      const status = paymentData.status;

      if (orderId) {
        let orderStatus = 'pending';
        if (status === 'approved') orderStatus = 'paid';
        else if (status === 'rejected' || status === 'cancelled') orderStatus = 'failed';

        await env.DB.prepare(
          'UPDATE orders SET status = ?, payment_id = ?, paid_at = ? WHERE id = ?'
        ).bind(
          orderStatus,
          String(paymentId),
          status === 'approved' ? new Date().toISOString() : null,
          orderId
        ).run();

        if (status === 'approved') {
          await sendRecipeEmail(env, orderId);
        }
      }
    }

    return jsonResponse({ received: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return jsonResponse({ received: true });
  }
}

export async function onRequestGet(context) {
  return jsonResponse({ status: 'ok' });
}