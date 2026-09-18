import { test } from 'node:test';
import assert from 'node:assert/strict';

const origin = 'http://localhost:3000';
async function api(path, data, cookie = '') {
  const response = await fetch(`${origin}/api/store/${path}`, {
    method: data === undefined ? 'GET' : 'POST',
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(data === undefined ? {} : { 'Content-Type': 'application/json', Origin: origin }),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  return { status: response.status, body: await response.json() };
}

test('full event pages expose every editor field and enforce capacity', async () => {
  const ownerLogin = await fetch(`${origin}/signin-with-chatgpt?return_to=/admin`, { redirect: 'manual' });
  const ownerCookie = ownerLogin.headers.get('set-cookie')?.split(';')[0] || '';
  const start = new Date(Date.now() + 70 * 86400000);
  const end = new Date(start.getTime() + 2 * 3600000);
  const event = {
    kind: 'event',
    title: `Full event ${Date.now().toString(36)}`,
    summary: 'Complete event-page integration check.',
    body: 'First paragraph.\n\nSecond paragraph.',
    image: '/hero.png',
    date: start.toISOString(),
    end_date: end.toISOString(),
    location: 'Noble Test Studio',
    author: 'Richy Noble',
    published_at: Date.now(),
    capacity: 1,
    contact_email: 'richynoble75@live.com',
    registration_url: 'https://example.com/register',
    accessibility: 'ASL interpretation and captions are available.',
    featured: true,
    published: true,
  };
  const created = await api('admin/post', event, ownerCookie);
  assert.equal(created.status, 200);

  const detail = await api(`content/${created.body.id}`);
  assert.equal(detail.status, 200);
  for (const field of ['end_date', 'author', 'published_at', 'capacity', 'contact_email', 'registration_url', 'accessibility']) {
    assert.deepEqual(detail.body.post[field], event[field], field);
  }
  assert.equal(detail.body.post.featured, 1);
  assert.equal((await fetch(`${origin}/events/${created.body.id}`)).status, 200);

  assert.equal((await api('rsvp', { postId: created.body.id, attending: true }, ownerCookie)).status, 200);
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const registration = await fetch(`${origin}/api/auth/password/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ username: `event_${suffix}`, email: `event_${suffix}@example.test`, password: 'EventAccount42' }),
  });
  const attendeeCookie = registration.headers.get('set-cookie')?.split(';')[0] || '';
  assert.equal(registration.status, 201);
  assert.equal((await api('rsvp', { postId: created.body.id, attending: true }, attendeeCookie)).status, 409);

  await api('rsvp', { postId: created.body.id, attending: false }, ownerCookie);
  assert.equal((await api('rsvp', { postId: created.body.id, attending: true }, attendeeCookie)).status, 200);
  await api('rsvp', { postId: created.body.id, attending: false }, attendeeCookie);
  assert.equal((await api('admin/post', { ...detail.body.post, published: false }, ownerCookie)).status, 200);
});
