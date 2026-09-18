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
  let body = null;
  try {
    body = await response.json();
  } catch {}
  return { status: response.status, body };
}

test('remote support requests require consent and can be managed by the owner', async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const request = {
    firstName: 'Support',
    lastName: 'Test',
    email: `support-${suffix}@example.test`,
    phone: '+1 (317) 555-0123',
    device: 'Windows computer',
    issue: 'The test computer cannot connect to Wi-Fi.',
    aslCode: `ASL-${suffix}`,
  };

  const withoutConsent = await api('support', request);
  assert.equal(withoutConsent.status, 400);

  const created = await api('support', { ...request, consent: true });
  assert.equal(created.status, 201);
  assert.ok(created.body?.id);

  const ownerLogin = await fetch(`${origin}/signin-with-chatgpt?return_to=/admin`, {
    redirect: 'manual',
  });
  assert.equal(ownerLogin.status, 302);
  const cookie = ownerLogin.headers.get('set-cookie')?.split(';')[0] || '';
  assert.ok(cookie);

  const admin = await api('admin', undefined, cookie);
  assert.equal(admin.status, 200);
  const saved = admin.body.supportRequests.find((item) => item.id === created.body.id);
  assert.equal(saved.email, request.email);
  assert.equal(saved.first_name, request.firstName);
  assert.equal(saved.last_name, request.lastName);
  assert.equal(saved.phone, request.phone);
  assert.equal(saved.device, request.device);
  assert.equal(saved.asl_code, request.aslCode);
  assert.equal(saved.status, 'new');
  assert.equal(saved.notification_status, 'pending');

  const updated = await api(
    'admin/support',
    { id: created.body.id, status: 'resolved', note: 'Resolved during automated validation.' },
    cookie,
  );
  assert.equal(updated.status, 200);

  const refreshed = await api('admin', undefined, cookie);
  const resolved = refreshed.body.supportRequests.find((item) => item.id === created.body.id);
  assert.equal(resolved.status, 'resolved');
  assert.equal(resolved.note, 'Resolved during automated validation.');
});

test('IT Support inbox keeps customer conversations private and lets the owner reply', async () => {
  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const register = async (username) => {
    const response = await fetch(`${origin}/api/auth/password/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({ username, email: `${username}@example.test`, password: 'SupportPass42' }),
    });
    assert.equal(response.status, 201);
    return response.headers.get('set-cookie')?.split(';')[0] || '';
  };
  const customer = await register(`support_${suffix}`);
  const otherCustomer = await register(`other_${suffix}`);
  const created = await api('support', {
    firstName: 'Client', lastName: 'Tester', email: `support_${suffix}@example.test`,
    phone: '+1 (317) 555-0199', device: 'Mac computer', issue: 'My screen keeps flickering.', consent: true,
  }, customer);
  assert.equal(created.status, 201);
  const id = created.body.id;
  const ownerLogin = await fetch(`${origin}/signin-with-chatgpt?return_to=/account`, { redirect: 'manual' });
  const owner = ownerLogin.headers.get('set-cookie')?.split(';')[0] || '';
  assert.ok(owner);

  const ownerInbox = await api('support-tickets', undefined, owner);
  assert.equal(ownerInbox.status, 200);
  assert.ok(ownerInbox.body.tickets.some((ticket) => ticket.id === id));
  const customerInbox = await api('support-tickets', undefined, customer);
  assert.equal(customerInbox.status, 200);
  assert.equal(customerInbox.body.tickets.length, 1);
  assert.equal(customerInbox.body.tickets[0].id, id);
  assert.equal(customerInbox.body.tickets[0].note, undefined);
  assert.equal((await api(`support-ticket/${id}`, undefined, otherCustomer)).status, 404);
  assert.equal((await api('support-message', { id, message: 'Intrusion' }, otherCustomer)).status, 404);
  assert.equal((await api('support-tickets')).status, 401);

  const ownerReply = await api('support-message', { id, message: 'Please try a different display cable.' }, owner);
  assert.equal(ownerReply.status, 201);
  assert.equal(ownerReply.body.delivery, 'pending');
  const customerThread = await api(`support-ticket/${id}`, undefined, customer);
  assert.equal(customerThread.status, 200);
  assert.equal(customerThread.body.messages[0].body, 'Please try a different display cable.');
  assert.equal(customerThread.body.messages[0].sender, 'owner');
  assert.equal(customerThread.body.ticket.status, 'in_progress');

  const customerReply = await api('support-message', { id, message: 'That fixed it. Thank you!' }, customer);
  assert.equal(customerReply.status, 201);
  const ownerThread = await api(`support-ticket/${id}`, undefined, owner);
  assert.equal(ownerThread.body.messages.length, 2);
  assert.equal(ownerThread.body.messages[1].sender, 'customer');
  assert.equal(ownerThread.body.ticket.status, 'new');
});
