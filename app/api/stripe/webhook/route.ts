import { db, getSettings, handled, json, unseal } from '@/lib/server';
import { reconcile } from '@/lib/payments';
export async function POST(req: Request) {
  return handled(async () => {
    const settings = await getSettings();
    const raw = await req.text();
    if (raw.length > 1000000) return json({ error: 'Too large' }, 413);
    let event:any;try{event=JSON.parse(raw)}catch{return json({error:'Invalid payload'},400)}
    const secret=settings['webhook_secret_'+(event.livemode?'live':'test')];
    if(!secret)return json({error:'Webhook not configured'},503);
    const sig = req.headers.get('stripe-signature') || '';
    const timestamp =
      sig
        .split(',')
        .find((v) => v.startsWith('t='))
        ?.slice(2) || '';
    const signatures = sig
      .split(',')
      .filter((v) => v.startsWith('v1='))
      .map((v) => v.slice(3));
    if (
      !/^\d+$/.test(timestamp) ||
      Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
    )
      return json({ error: 'Invalid signature' }, 400);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(await unseal(secret)),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    let valid = false;
    for (const value of signatures) {
      if (!/^[a-f0-9]{64}$/i.test(value)) continue;
      const bytes = Uint8Array.from(value.match(/.{2}/g)!, (v) =>
        parseInt(v, 16),
      );
      if (
        await crypto.subtle.verify(
          'HMAC',
          key,
          bytes,
          new TextEncoder().encode(timestamp + '.' + raw),
        )
      )
        valid = true;
    }
    if (!valid) return json({ error: 'Invalid signature' }, 400);
    if (
      [
        'checkout.session.completed',
        'checkout.session.expired',
        'checkout.session.async_payment_succeeded',
      ].includes(event.type)
    ) {
      const session = event.data.object;
      const order = await db()
        .prepare('SELECT * FROM orders WHERE id=?')
        .bind(session.client_reference_id)
        .first();
      if (order) await reconcile(order, session);
    }
    return json({ received: true });
  });
}
