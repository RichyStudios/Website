import { runtime } from '@/lib/server';
export async function GET(req: Request) {
  const key = new URL(req.url).pathname.split('/').pop()!;
  if (!/^[a-f0-9-]+\.(jpg|png|webp|mp4|webm)$/.test(key))
    return new Response('Not found', { status: 404 });
  const object = await runtime().FILES.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  return new Response(object.body, {
    headers: {
      'Content-Type':
        object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
