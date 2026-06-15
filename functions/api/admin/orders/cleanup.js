import { jsonResponse } from '../../../utils.js';

export async function onRequestDelete(context) {
  const { env, data } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const url = new URL(context.request.url);
    const days = parseInt(url.searchParams.get('days')) || 7;

    const result = await env.DB.prepare(
      `UPDATE orders SET deleted_at = CURRENT_TIMESTAMP
       WHERE status IN ('pending', 'failed')
         AND deleted_at IS NULL
         AND created_at < datetime('now', '-' || ? || ' days')`
    ).bind(days).run();

    const deletedCount = result.meta.changes || 0;

    console.log(`[CLEANUP] Soft-deleted ${deletedCount} orders older than ${days} days`);

    return jsonResponse({ success: true, deletedCount, days });
  } catch (err) {
    console.error('Error cleaning up orders:', err);
    return jsonResponse({ error: 'Failed to cleanup orders' }, 500);
  }
}
