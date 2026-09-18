import { runtime, db, reject, str } from './server';

export type Provider = 'google' | 'facebook' | 'outlook';
type Config = { clientId: string; clientSecret: string; authorize: string; token: string; userinfo: string; scopes: string };

export function providerConfig(provider: string): Config {
  const p = provider as Provider;
  const e = runtime() as any;
  if (p === 'google') return { clientId: e.GOOGLE_CLIENT_ID || '', clientSecret: e.GOOGLE_CLIENT_SECRET || '', authorize: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', userinfo: 'https://openidconnect.googleapis.com/v1/userinfo', scopes: 'openid email profile' };
  if (p === 'facebook') return { clientId: e.FACEBOOK_CLIENT_ID || '', clientSecret: e.FACEBOOK_CLIENT_SECRET || '', authorize: 'https://www.facebook.com/dialog/oauth', token: 'https://graph.facebook.com/oauth/access_token', userinfo: 'https://graph.facebook.com/me?fields=id,name,email', scopes: 'email,public_profile' };
  if (p === 'outlook') return { clientId: e.MICROSOFT_CLIENT_ID || '', clientSecret: e.MICROSOFT_CLIENT_SECRET || '', authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token', userinfo: 'https://graph.microsoft.com/oidc/userinfo', scopes: 'openid profile email' };
  reject(404, 'Unknown sign-in provider.');
  throw new Error('Unknown sign-in provider');
}
export function redirectUri(provider: Provider) { const base = runtime().SITE_URL; if (!base) reject(503, 'The sign-in address is not configured yet.'); return `${base}/api/auth/${provider}/callback`; }
function base64url(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=',''); }
export function randomToken() { return base64url(crypto.getRandomValues(new Uint8Array(32))); }
export async function pkceChallenge(verifier: string) { const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)); return base64url(new Uint8Array(hash)); }
export function safeReturnTo(value: string | null) { return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/api/auth') ? value : '/account'; }
function secureAttribute() { return String(runtime().SITE_URL || '').startsWith('https://') ? '; Secure' : ''; }
export function cookie(name: string, value: string, maxAge: number) { return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secureAttribute()}`; }
export function clearCookie(name: string) { return `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureAttribute()}`; }
export async function provisionSession(provider: Provider | 'password', profile: {id: string; email: string; name: string}) {
  const userId = `${provider}:${str(profile.id, 200)}`;
  const email = str(profile.email, 320);
  const name = str(profile.name || email.split('@')[0], 100);
  const now = Math.floor(Date.now()/1000), token = randomToken();
  await db().batch([
    db().prepare('INSERT INTO profiles(id,email,name,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name').bind(userId,email,name,Date.now()),
    db().prepare('INSERT INTO auth_sessions(token,user_id,provider,email,name,created_at,expires_at) VALUES(?,?,?,?,?,?,?)').bind(token,userId,provider,email,name,now,now+60*60*24*30),
  ]);
  return { token, userId, email, name };
}
