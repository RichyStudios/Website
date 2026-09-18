import { cookies } from 'next/headers';
import { providerConfig, redirectUri, cookie, clearCookie, provisionSession, safeReturnTo, type Provider } from '@/lib/oauth';
export const dynamic = 'force-dynamic';
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const provider = (await params).provider as Provider, url = new URL(req.url), jar = await cookies();
  const fail = () => { const response = Response.redirect(new URL('/login?error=oauth_failed', req.url), 302); response.headers.append('Set-Cookie', clearCookie('noble_oauth_state')); response.headers.append('Set-Cookie', clearCookie('noble_oauth_verifier')); return response; };
  try {
    const config = providerConfig(provider), code = url.searchParams.get('code'), state = url.searchParams.get('state');
    if (!code || !state || state !== jar.get('noble_oauth_state')?.value) return fail();
    const verifier = jar.get('noble_oauth_verifier')?.value, returnTo = safeReturnTo(jar.get('noble_oauth_return')?.value || '/account'); if (!verifier) return fail();
    const params = new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,code,redirect_uri:redirectUri(provider),grant_type:'authorization_code',code_verifier:verifier});
    const tokenResponse = await fetch(config.token,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params,signal:AbortSignal.timeout(15000)}); if(!tokenResponse.ok)return fail(); const token = await tokenResponse.json() as any;
    const userResponse = await fetch(config.userinfo,{headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(15000)}); if(!userResponse.ok)return fail(); const raw = await userResponse.json() as any;
    const profile = {id:String(raw.sub||raw.id||''),email:String(raw.email||raw.mail||raw.userPrincipalName||''),name:String(raw.name||[raw.given_name,raw.family_name].filter(Boolean).join(' ')||raw.email||'Signova Technology member')}; if(!profile.id||!profile.email)return fail();
    const session = await provisionSession(provider,profile), response = Response.redirect(new URL(returnTo, req.url), 302); response.headers.append('Set-Cookie',cookie('noble_session',session.token,60*60*24*30)); response.headers.append('Set-Cookie',clearCookie('noble_oauth_state')); response.headers.append('Set-Cookie',clearCookie('noble_oauth_verifier')); response.headers.append('Set-Cookie',clearCookie('noble_oauth_return')); return response;
  } catch { return fail(); }
}
