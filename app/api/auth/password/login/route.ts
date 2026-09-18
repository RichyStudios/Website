import { body, db, HttpError, sameOrigin } from '@/lib/server';
import { cookie } from '@/lib/oauth';
import {
  clearLoginFailures,
  createPasswordSession,
  enforceLoginLimit,
  recordLoginFailure,
  verifyPassword,
} from '@/lib/password-auth';

export const dynamic = 'force-dynamic';

function errorResponse(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  console.error('Password sign-in failed', error);
  return Response.json({ error: 'Sign-in is temporarily unavailable. Please try again.' }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const data = await body(req);
    const identifier = typeof data.identifier === 'string' ? data.identifier.trim().toLowerCase().slice(0, 320) : '';
    const password = typeof data.password === 'string' ? data.password : '';
    const limit = await enforceLoginLimit(req, identifier || 'missing');
    const account = identifier
      ? await db()
          .prepare(
            'SELECT id,email,name,password_hash,password_salt,password_iterations FROM password_accounts WHERE username=? OR email=? LIMIT 1',
          )
          .bind(identifier, identifier)
          .first<any>()
      : null;
    const valid = account && password.length <= 128
      ? await verifyPassword(password, account.password_salt, account.password_hash, account.password_iterations)
      : false;
    if (!valid) {
      await recordLoginFailure(limit);
      return Response.json({ error: 'The username, email, or password is incorrect.' }, { status: 401 });
    }
    await clearLoginFailures(limit.key);
    const session = await createPasswordSession(account);
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie('noble_session', session.token, 60 * 60 * 24 * 30),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
