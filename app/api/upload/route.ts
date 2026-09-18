import {
  handled,
  identity,
  json,
  reject,
  runtime,
  sameOrigin,
} from '@/lib/server';
export async function POST(req: Request) {
  return handled(async () => {
    sameOrigin(req);
    await identity(true);
    if (Number(req.headers.get('content-length') || 0) > 52000000)
      reject(413, 'Choose an image under 5 MB or a video under 50 MB.');
    const form = await req.formData();
    const file = form.get('file');
    const video = form.get('kind') === 'video';
    const limit = video ? 50000000 : 5000000;
    if (!(file instanceof File) || file.size > limit || file.size === 0)
      reject(400, video ? 'Choose an MP4 or WebM video smaller than 50 MB.' : 'Choose a JPG, PNG, or WebP image smaller than 5 MB.');
    const buffer = await (file as File).arrayBuffer(),
      a = new Uint8Array(buffer);
    let type = '',
      ext = '';
    if (video && new TextDecoder().decode(a.slice(4, 8)) === 'ftyp') {
      type = 'video/mp4';
      ext = 'mp4';
    } else if (video && a[0] === 0x1a && a[1] === 0x45 && a[2] === 0xdf && a[3] === 0xa3) {
      type = 'video/webm';
      ext = 'webm';
    } else if (!video && a[0] === 255 && a[1] === 216 && a[2] === 255) {
      type = 'image/jpeg';
      ext = 'jpg';
    } else if (!video && a[0] === 137 && a[1] === 80 && a[2] === 78 && a[3] === 71) {
      type = 'image/png';
      ext = 'png';
    } else if (!video &&
      new TextDecoder().decode(a.slice(0, 4)) === 'RIFF' &&
      new TextDecoder().decode(a.slice(8, 12)) === 'WEBP'
    ) {
      type = 'image/webp';
      ext = 'webp';
    } else reject(400, video ? 'Choose a valid MP4 or WebM video.' : 'Choose a valid JPG, PNG, or WebP image.');
    const key = crypto.randomUUID() + '.' + ext;
    await runtime().FILES.put(key, buffer, {
      httpMetadata: { contentType: type },
    });
    return json({ url: '/api/files/' + key });
  });
}
