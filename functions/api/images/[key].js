// Serve recipe images from R2 bucket
// Route: /api/images/:key
export async function onRequestGet(context) {
  const { env, params } = context;
  const key = params.key;

  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  // Block direct access to video files — videos are served via /api/recipes/:id/video
  if (key.startsWith('recipe_videos/')) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const object = await env.IMAGES.get(key);

    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);

    const contentType = object.httpMetadata?.contentType;
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    return new Response(object.body, { headers });
  } catch (err) {
    console.error('[IMAGES] Error serving image:', err);
    return new Response('Error loading image', { status: 500 });
  }
}