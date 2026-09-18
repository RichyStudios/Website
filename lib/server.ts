import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export const runtime = () =>
  env as unknown as {
    DB: D1Database;
    FILES: R2Bucket;
    ADMIN_EMAIL?: string;
    OWNER_USER_ID?: string;
    SITE_URL?: string;
    VAULT_KEY?: string;
    RESEND_API_KEY?: string;
    RESEND_FROM?: string;
  };
export const db = () => runtime().DB;
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const reject = (status: number, message: string): never => {
  throw new HttpError(status, message);
};
export async function identity(admin = false) {
  const cookieJar = await cookies();
  const token = cookieJar.get('noble_session')?.value;
  const u = token
    ? await db()
        .prepare(
          'SELECT user_id AS userId,email,name AS displayName,name AS fullName,provider FROM auth_sessions WHERE token=? AND expires_at>? LIMIT 1',
        )
        .bind(token, Math.floor(Date.now() / 1000))
        .first<any>()
    : await getChatGPTUser();
  if (!u) reject(401, 'Sign in to continue.');
  const isAdmin =
    (!!runtime().ADMIN_EMAIL &&
      u!.email.toLowerCase() === runtime().ADMIN_EMAIL!.toLowerCase()) ||
    (!!runtime().OWNER_USER_ID &&
      runtime().OWNER_USER_ID!.split(',').map((id) => id.trim()).includes(u!.userId));
  if (admin && !isAdmin)
    reject(403, 'Only the shop owner can make this change.');
  return { ...u!, admin: isAdmin };
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  const own = new URL(req.url).origin;
  const configured = runtime().SITE_URL;
  if (!origin || !(origin === own || origin === configured))
    reject(403, 'Please reload the page and try again.');
}
export async function body(req: Request) {
  if (Number(req.headers.get('content-length') || 0) > 50000)
    reject(413, 'This request is too large.');
  const raw = await req.text();
  if (raw.length > 50000) reject(413, 'This request is too large.');
  try {
    return JSON.parse(raw);
  } catch {
    reject(400, 'Invalid request.');
  }
}
export const str = (v: unknown, max = 200, required = true) => {
  if (typeof v !== 'string' || v.trim().length > max || (required && !v.trim()))
    reject(400, 'Check the required fields and their lengths.');
  return (v as string).trim();
};
export const int = (v: unknown, min = 0, max = 100000000) => {
  if (!Number.isSafeInteger(v) || Number(v) < min || Number(v) > max)
    reject(400, 'Enter a valid whole number.');
  return Number(v);
};
export function imageUrl(v: unknown) {
  const value = str(v, 1500);
  if (value.startsWith('/api/files/') || value === '/hero.png') return value;
  try {
    if (new URL(value).protocol === 'https:') return value;
  } catch {}
  return reject(400, 'Use an HTTPS image URL or upload a product image.');
}
export function videoUrl(v: unknown) {
  const value = str(v || '', 1500, false);
  if (!value) return '';
  if (/^\/api\/files\/[a-f0-9-]+\.(mp4|webm)$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') reject(400, 'Use a secure HTTPS video URL.');
    const host = url.hostname.toLowerCase();
    if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'vimeo.com' || host.endsWith('.vimeo.com') || /\.(mp4|webm)$/i.test(url.pathname)) return value;
  } catch {}
  return reject(400, 'Use a YouTube or Vimeo link, a secure MP4 or WebM URL, or upload a video.');
}
export async function getSettings() {
  const rows = await db()
    .prepare('SELECT key,value FROM settings')
    .all<{ key: string; value: string }>();
  return Object.fromEntries(rows.results.map((r) => [r.key, r.value]));
}
export async function setSettings(data: Record<string, string>) {
  await db().batch(
    Object.entries(data).map(([k, v]) =>
      db()
        .prepare(
          'INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
        )
        .bind(k, v),
    ),
  );
}
function bytes(v: string) {
  return Uint8Array.from(atob(v), (c) => c.charCodeAt(0));
}
async function vault() {
  if (!runtime().VAULT_KEY)
    reject(503, 'Payment connection is not configured yet.');
  return crypto.subtle.importKey(
    'raw',
    bytes(runtime().VAULT_KEY!),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt'],
  );
}
export async function seal(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await vault(),
    new TextEncoder().encode(value),
  );
  return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)));
}
export async function unseal(value: string) {
  const b = bytes(value);
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b.slice(0, 12) },
      await vault(),
      b.slice(12),
    ),
  );
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
export async function handled(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(
      'Store request failed',
      e instanceof Error ? e.message : 'unknown',
    );
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
