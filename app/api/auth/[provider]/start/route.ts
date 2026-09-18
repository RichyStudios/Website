import { providerConfig, redirectUri, cookie, pkceChallenge, randomToken, safeReturnTo, type Provider } from '@/lib/oauth';
import { json } from '@/lib/server';
export const dynamic = 'force-dynamic';
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const provider = (await params).provider as Provider;
  try {
    const config = providerConfig(provider);
    if (!config.clientId || !config.clientSecret) return Response.redirect(new URL('/login?error=provider_not_configured', req.url), 302);
    const state = randomToken(), verifier = randomToken(), challenge = await pkceChallenge(verifier), returnTo = safeReturnTo(new URL(req.url).searchParams.get('return_to'));
    const url = new URL(config.authorize);
    url.searchParams.set('client_id', config.clientId); url.searchParams.set('redirect_uri', redirectUri(provider)); url.searchParams.set('response_type', 'code'); url.searchParams.set('scope', config.scopes); url.searchParams.set('state', state);
    if (provider !== 'facebook') { url.searchParams.set('code_challenge', challenge); url.searchParams.set('code_challenge_method', 'S256'); }
    const response = Response.redirect(url, 302);
    response.headers.append('Set-Cookie', cookie('noble_oauth_state', state, 600)); response.headers.append('Set-Cookie', cookie('noble_oauth_verifier', verifier, 600)); response.headers.append('Set-Cookie', cookie('noble_oauth_return', returnTo, 600));
    return response;
  } catch { return Response.redirect(new URL('/login?error=oauth_failed', req.url), 302); }
}
