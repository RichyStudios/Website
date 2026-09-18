import { test } from 'node:test';
import assert from 'node:assert/strict';

const base = 'http://localhost:3000';
const post = (path, data, cookie = '') =>
  fetch(base + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: base,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(data),
    redirect: 'manual',
  });

test('username and password accounts register, authenticate, and sign out', async () => {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const username = `member_${suffix}`;
  const email = `${username}@example.test`;
  const password = 'NobleAccount42';

  const weak = await post('/api/auth/password/register', {
    username: `${username}_weak`,
    email: `weak_${email}`,
    password: 'short',
  });
  assert.equal(weak.status, 400);

  const created = await post('/api/auth/password/register', { username, email, password });
  assert.equal(created.status, 201);
  const cookie = created.headers.get('set-cookie')?.split(';')[0] || '';
  assert.ok(cookie.startsWith('noble_session='));

  const duplicate = await post('/api/auth/password/register', {
    username,
    email: `another_${email}`,
    password,
  });
  assert.equal(duplicate.status, 409);

  const me = await fetch(base + '/api/store/me', { headers: { Cookie: cookie } });
  const identity = await me.json();
  assert.equal(identity.user.name, username);
  assert.equal(identity.user.email, email);

  const wrong = await post('/api/auth/password/login', { identifier: username, password: 'NotThePassword1' });
  assert.equal(wrong.status, 401);

  const signedIn = await post('/api/auth/password/login', { identifier: email, password });
  assert.equal(signedIn.status, 200);
  assert.ok(signedIn.headers.get('set-cookie')?.includes('noble_session='));

  const signedOut = await fetch(base + '/api/auth/signout?return_to=/login', {
    headers: { Cookie: cookie },
    redirect: 'manual',
  });
  assert.equal(signedOut.status, 302);
  assert.ok(signedOut.headers.get('set-cookie')?.includes('Max-Age=0'));
});
