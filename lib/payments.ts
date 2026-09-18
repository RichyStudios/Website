import { db, getSettings, reject, runtime, unseal } from './server';
export class StripeFailure extends Error {constructor(public status:number, public code:string,public providerType:string){super('Stripe could not complete this request. Check the connection or try again.')}}
export async function stripe(
  path: string,
  params?: URLSearchParams,
  idempotency?: string,
  keyOverride?: string,
  mode?: string,
) {
  const settings = await getSettings();
  const encryptedKey=mode?settings['stripe_key_'+mode]:settings.stripe_key;
  const key =
    keyOverride ||
    (encryptedKey ? await unseal(encryptedKey) : '');
  if (!key) reject(503, 'The shop is not accepting payments yet.');
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    method: params ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      ...(params
        ? { 'Content-Type': 'application/x-www-form-urlencoded' }
        : {}),
      ...(idempotency ? { 'Idempotency-Key': idempotency } : {}),
    },
    body: params?.toString(),
    signal: AbortSignal.timeout(18000),
  });
  const data = (await res.json()) as any;
  if (!res.ok) {
    console.error(
      'Payment provider request failed',
      res.status,
      data?.error?.code,
    );
    throw new StripeFailure(res.status,data?.error?.code||'',data?.error?.type||'');
  }
  return data;
}
export async function release(order: any) {
  await db().batch([
    db()
      .prepare(
        "UPDATE products SET stock=stock+(SELECT quantity FROM order_items WHERE order_id=? AND product_id=products.id) WHERE id IN(SELECT product_id FROM order_items WHERE order_id=?) AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status='pending')",
      )
      .bind(order.id, order.id, order.id),
    db()
      .prepare(
        "UPDATE orders SET status='cancelled' WHERE id=? AND status='pending'",
      )
      .bind(order.id),
  ]);
}
export async function sessionFor(order: any) {
  if (order.session_id)
    return stripe('checkout/sessions/' + encodeURIComponent(order.session_id),undefined,undefined,undefined,order.payment_mode);
  let session;
  try {session = await stripe(
    'checkout/sessions',
    new URLSearchParams(order.stripe_params),
    'checkout-' + order.id,
    undefined,
    order.payment_mode,
  );}catch(e){
    // Stripe caches successful idempotent requests. A definitive validation
    // rejection within its retention window proves no session was created.
    if(e instanceof StripeFailure&&e.status===400&&e.providerType==='invalid_request_error'&&Date.now()/1000-order.created_at<23*3600){await release(order);reject(409,'Checkout could not be created. Your reservation was released. Please try again.');}
    throw e;
  }
  await db()
    .prepare('UPDATE orders SET session_id=? WHERE id=? AND session_id IS NULL')
    .bind(session.id, order.id)
    .run();
  return session;
}
export async function reconcile(order: any, session?: any) {
  if (order.status !== 'pending') return order;
  const s = session || (await sessionFor(order));
  if (
    s.client_reference_id !== order.id ||
    s.currency !== 'usd' ||
    Boolean(s.livemode) !== (order.payment_mode === 'live') ||
    (order.session_id && s.id !== order.session_id)
  )
    reject(409, 'Payment details do not match this order. Contact the shop.');
  if (s.payment_status === 'paid') {
    if(s.amount_subtotal!==order.subtotal||(s.total_details?.amount_shipping??0)!==order.shipping||s.amount_total<order.subtotal+order.shipping)reject(409,'Payment amount does not match this order. Contact the shop.');
    const shipping =
      s.collected_information?.shipping_details ||
      s.shipping_details ||
      s.customer_details;
    await db().batch([
      db()
        .prepare(
          "DELETE FROM carts WHERE user_id=? AND product_id IN(SELECT product_id FROM order_items WHERE order_id=?) AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status='pending')",
        )
        .bind(order.user_id, order.id, order.id),
      db()
        .prepare(
          "UPDATE orders SET status='paid',total=?,address=?,payment_intent=? WHERE id=? AND status='pending'",
        )
        .bind(
          s.amount_total,
          JSON.stringify(shipping || {}),
          s.payment_intent,
          order.id,
        ),
    ]);
  } else if (s.status === 'expired') {
    await release(order);
  }
  return db().prepare('SELECT * FROM orders WHERE id=?').bind(order.id).first();
}
export async function cleanup() {
  const rows = await db()
    .prepare(
      "SELECT * FROM orders WHERE status='pending' ORDER BY expires_at ASC LIMIT 20",
    )
    .all();
  await Promise.all(rows.results.map(async(order)=>{
    try {
      await reconcile(order);
    } catch {
      /* A provider outage must never release possibly paid stock. */
    }
  }));
  const refunds=await db().prepare("SELECT * FROM orders WHERE refund_id IS NOT NULL AND status IN('paid','shipped') LIMIT 20").all();
  await Promise.all(refunds.results.map(async(order:any)=>{try{const r=await stripe('refunds/'+encodeURIComponent(order.refund_id),undefined,undefined,undefined,order.payment_mode);if(r.status==='succeeded')await db().prepare("UPDATE orders SET status='refunded' WHERE id=? AND refund_id=?").bind(order.id,r.id).run();}catch{/* Retry from the owner dashboard. */}}));
}
export function checkoutParams(
  orderId: string,
  email: string,
  items: any[],
  shipping: number,
  expires: number,
  tax: boolean,
) {
  const origin = runtime().SITE_URL;
  if (!origin) reject(503, 'The checkout address is not configured.');
  const p = new URLSearchParams({
    mode: 'payment',
    customer_email: email,
    client_reference_id: orderId,
    success_url: `${origin}/account?order=${orderId}`,
    cancel_url: `${origin}/cart?cancelled=${orderId}`,
    expires_at: String(expires),
    'payment_method_types[0]': 'card',
    'shipping_address_collection[allowed_countries][0]': 'US',
    'shipping_options[0][shipping_rate_data][type]': 'fixed_amount',
    'shipping_options[0][shipping_rate_data][fixed_amount][amount]':
      String(shipping),
    'shipping_options[0][shipping_rate_data][fixed_amount][currency]': 'usd',
    'shipping_options[0][shipping_rate_data][display_name]':
      'Standard shipping',
    billing_address_collection: 'required',
    'metadata[order_id]': orderId,
  });
  if (tax) p.set('automatic_tax[enabled]', 'true');
  items.forEach((item, i) => {
    p.set(`line_items[${i}][price_data][currency]`, 'usd');
    p.set(`line_items[${i}][price_data][product_data][name]`, item.title);
    p.set(`line_items[${i}][price_data][unit_amount]`, String(item.price));
    p.set(`line_items[${i}][quantity]`, String(item.quantity));
  });
  return p;
}
