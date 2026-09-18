import { body, db, HttpError, sameOrigin } from '@/lib/server';
import { cookie } from '@/lib/oauth';
import {
  createPasswordSession,
  hashPassword,
  newAccountId,
  normalizeEmail,
  normalizeUsername,
  validatePassword,
} from '@/lib/password-auth';

export const dynamic = 'force-dynamic';

function errorResponse(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  if (String((error as Error)?.message || '').includes('UNIQUE constraint')) {
    return Response.json({ error: 'That username or email is already in use.' }, { status: 409 });
  }
  console.error('Account registration failed', error);
  return Response.json({ error: 'Your account could not be created. Please try again.' }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const data = await body(req);
    const username = normalizeUsername(data.username);
    const email = normalizeEmail(data.email);
    const password = validatePassword(data.password);
    const existing = await db()
      .prepare('SELECT 1 FROM password_accounts WHERE username=? OR email=? LIMIT 1')
      .bind(username, email)
      .first();
    if (existing) return Response.json({ error: 'That username or email is already in use.' }, { status: 409 });

    const id = newAccountId();
    const secured = await hashPassword(password);
    await db()
      .prepare(
        'INSERT INTO password_accounts(id,username,email,name,password_hash,password_salt,password_iterations,created_at) VALUES(?,?,?,?,?,?,?,?)',
      )
      .bind(id, username, email, username, secured.hash, secured.salt, secured.iterations, Date.now())
      .run();
    const session = await createPasswordSession({ id, email, name: username });
    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie('noble_session', session.token, 60 * 60 * 24 * 30),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
