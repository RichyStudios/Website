import {
  body,
  db,
  handled,
  HttpError,
  identity,
  imageUrl,
  int,
  json,
  reject,
  runtime,
  sameOrigin,
  seal,
  setSettings,
  getSettings,
  str,
  videoUrl,
} from '@/lib/server';
import { categories, journal, sampleProducts } from '@/lib/catalog';
import {
  checkoutParams,
  cleanup,
  reconcile,
  sessionFor,
  stripe,
} from '@/lib/payments';
export const dynamic = 'force-dynamic';
function path(req: Request) {
  return new URL(req.url).pathname.replace('/api/store/', '');
}
async function customer() {
  const u = await identity();
  await db()
    .prepare(
      'INSERT INTO profiles(id,email,name,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email',
    )
    .bind(u.userId, u.email, u.fullName || u.email.split('@')[0], Date.now())
    .run();
  return u;
}
function emailHtml(value: unknown) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
async function sendSupportNotification(request: any, settings: Record<string, string>) {
  if (!runtime().RESEND_API_KEY) {
    return { status: 'pending', error: 'Email service key is not configured.' };
  }
  const to = settings.support_notification_email || 'richynoble75@live.com';
  const subject = settings.support_subject || 'DeafTech Support';
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${runtime().RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: runtime().RESEND_FROM || 'Signova Technology <onboarding@resend.dev>',
        to: [to],
        subject,
        reply_to: request.email,
        html: `<h1>${emailHtml(subject)}</h1><p><strong>Reference:</strong> ${emailHtml(request.id.slice(0, 8).toUpperCase())}</p><p><strong>Name:</strong> ${emailHtml(request.first_name)} ${emailHtml(request.last_name)}</p><p><strong>Email:</strong> ${emailHtml(request.email)}</p><p><strong>Phone:</strong> ${emailHtml(request.phone)}</p><p><strong>Device:</strong> ${emailHtml(request.device)}</p><p><strong>ASL code:</strong> ${emailHtml(request.asl_code || 'Not provided')}</p><h2>Problem</h2><p>${emailHtml(request.issue).replaceAll('\n', '<br>')}</p>`,
      }),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      return { status: 'failed', error: `Email service returned ${response.status}: ${detail}` };
    }
    return { status: 'sent', error: '' };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message.slice(0, 300) : 'Email delivery failed.',
    };
  }
}
async function sendSupportMessageEmail(request: any, message: string, fromOwner: boolean, settings: Record<string, string>) {
  if (!runtime().RESEND_API_KEY) return { status: 'pending', error: 'Email service key is not configured.' };
  const destination = fromOwner ? request.email : (settings.support_notification_email || 'richynoble75@live.com');
  const subject = `${settings.support_subject || 'DeafTech Support'} · ${request.id.slice(0, 8).toUpperCase()}`;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${runtime().RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: runtime().RESEND_FROM || 'Signova Technology <onboarding@resend.dev>',
        to: [destination],
        subject,
        reply_to: fromOwner ? (settings.support || undefined) : request.email,
        html: `<h1>${emailHtml(subject)}</h1><p>${fromOwner ? 'A technician replied to your support request.' : `${emailHtml(request.first_name)} ${emailHtml(request.last_name)} added a message to a support request.`}</p><p>${emailHtml(message).replaceAll('\n', '<br>')}</p><p>Reference: ${emailHtml(request.id.slice(0, 8).toUpperCase())}</p>`,
      }),
    });
    if (!response.ok) return { status: 'failed', error: `Email service returned ${response.status}: ${(await response.text()).slice(0, 300)}` };
    return { status: 'sent', error: '' };
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message.slice(0, 300) : 'Email delivery failed.' };
  }
}
async function accessibleSupportRequest(id: string, user: Awaited<ReturnType<typeof identity>>) {
  const request = await db().prepare('SELECT * FROM support_requests WHERE id=?').bind(id).first<any>();
  if (!request || (!user.admin && request.user_id !== user.userId)) reject(404, 'Support request not found.');
  return request;
}
export async function GET(req: Request) {
  return handled(async () => {
    const route = path(req);
    if (route === 'catalog') {
      const products = await db()
        .prepare(
          "SELECT * FROM products WHERE status='published' ORDER BY created_at DESC",
        )
        .all();
      const settings = await getSettings();
      return json({
        products: products.results.length ? products.results : sampleProducts,
        preview: !products.results.length,
        shopName: settings.shop_name || 'Signova Technology',
        paymentsReady: !!settings.stripe_key && settings.selling === 'true',
        shipping: Number(settings.shipping || 0),
        returns: settings.returns || '',
        support: settings.support || '',
      });
    }
    if (route === 'content') {
      const p = await db()
        .prepare('SELECT p.*,(SELECT count(*) FROM rsvps r WHERE r.post_id=p.id) AS rsvp_count FROM posts p WHERE published=1 ORDER BY featured DESC,date DESC')
        .all();
      return json({ posts: [...p.results, ...journal] });
    }
    if (route.startsWith('content/')) {
      const id = str(decodeURIComponent(route.slice(8)), 100);
      const saved = await db().prepare(
        'SELECT p.*,(SELECT count(*) FROM rsvps r WHERE r.post_id=p.id) AS rsvp_count FROM posts p WHERE p.id=? AND p.published=1',
      ).bind(id).first<any>();
      const sample = journal.find((post) => post.id === id);
      const post = saved || sample;
      if (!post) reject(404, 'Post not found.');
      return json({ post });
    }
    if (route === 'games') {
      const games = await db()
        .prepare("SELECT id,title,description,category,thumbnail,html,css,javascript,python,updated_at FROM games WHERE published=1 ORDER BY updated_at DESC")
        .all();
      return json({ games: games.results });
    }
    if (route === 'me') {
      try {
        const u = await customer();
        const profile = await db()
          .prepare('SELECT name,email FROM profiles WHERE id=?')
          .bind(u.userId)
          .first();
        const cart = await db()
          .prepare(
            'SELECT coalesce(sum(quantity),0) AS count FROM carts WHERE user_id=?',
          )
          .bind(u.userId)
          .first<any>();
        return json({
          user: { ...profile, admin: u.admin },
          cartCount: cart.count,
        });
      } catch (e) {
        if (e instanceof HttpError && e.status === 401)
          return json({ user: null, cartCount: 0 });
        throw e;
      }
    }
    if (route === 'cart') {
      const u = await customer();
      const pending=await db().prepare("SELECT id FROM orders WHERE user_id=? AND status='pending'").bind(u.userId).first<any>();
      const items = await db()
        .prepare(
          'SELECT p.*,c.quantity FROM carts c JOIN products p ON p.id=c.product_id WHERE c.user_id=?',
        )
        .bind(u.userId)
        .all();
      const settings = await getSettings();
      return json({
        items: items.results,
        ready: !!settings.stripe_key && settings.selling === 'true',
        shipping: Number(settings.shipping || 0),
        mode: settings.mode || null,
        pendingOrder: pending?.id || null,
      });
    }
    if (route === 'account') {
      const u = await customer();
      const orders = await db()
        .prepare(
          'SELECT id,status,subtotal,shipping,total,created_at,tracking,address FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 100',
        )
        .bind(u.userId)
        .all();
      const favorites = await db()
        .prepare('SELECT p.* FROM favorites f JOIN products p ON p.id=f.product_id WHERE f.user_id=? AND p.status=\'published\' ORDER BY p.created_at DESC')
        .bind(u.userId)
        .all<any>();
      const rsvps = await db()
        .prepare(
          'SELECT p.* FROM rsvps r JOIN posts p ON p.id=r.post_id WHERE r.user_id=?',
        )
        .bind(u.userId)
        .all();
      const score = await db()
        .prepare('SELECT moves,seconds FROM scores WHERE user_id=?')
        .bind(u.userId)
        .first();
      return json({
        orders: orders.results,
        favorites: favorites.results.map((r) => r.id),
        savedProducts: favorites.results,
        rsvps: rsvps.results,
        score,
      });
    }
    if (route === 'favorites') {
      const u = await identity();
      const rows = await db()
        .prepare('SELECT product_id FROM favorites WHERE user_id=?')
        .bind(u.userId)
        .all<any>();
      return json(rows.results.map((r) => r.product_id));
    }
    if (route === 'support') {
      const settings = await getSettings();
      return json({
        support: settings.support || '',
        aslUrl: settings.asl_url || '',
      });
    }
    if (route === 'support-tickets') {
      const user = await identity();
      const rows = user.admin
        ? await db().prepare('SELECT * FROM support_requests ORDER BY updated_at DESC LIMIT 200').all<any>()
        : await db().prepare('SELECT * FROM support_requests WHERE user_id=? ORDER BY updated_at DESC LIMIT 100').bind(user.userId).all<any>();
      return json({ tickets: rows.results.map((request) => user.admin ? request : {
        id: request.id, first_name: request.first_name, last_name: request.last_name, device: request.device,
        issue: request.issue, status: request.status, created_at: request.created_at, updated_at: request.updated_at,
      }), owner: user.admin, emailReady: user.admin ? !!runtime().RESEND_API_KEY : undefined });
    }
    if (route.startsWith('support-ticket/')) {
      const user = await identity();
      const request = await accessibleSupportRequest(str(decodeURIComponent(route.slice(15)), 100), user);
      const messages = await db().prepare('SELECT id,request_id,sender,body,delivery_status,created_at FROM support_messages WHERE request_id=? ORDER BY created_at ASC').bind(request.id).all();
      return json({ ticket: user.admin ? request : {
        id: request.id, first_name: request.first_name, last_name: request.last_name, email: request.email,
        device: request.device, issue: request.issue, asl_code: request.asl_code, status: request.status,
        created_at: request.created_at, updated_at: request.updated_at,
      }, messages: messages.results, owner: user.admin });
    }
    if (route === 'admin') {
      await identity(true);
      await cleanup();
      const [products, orders, posts, games, supportRequests, settings] = await Promise.all([
        db().prepare('SELECT * FROM products ORDER BY created_at DESC').all(),
        db()
          .prepare(
            'SELECT id,email,status,subtotal,shipping,total,created_at,tracking,address FROM orders ORDER BY created_at DESC LIMIT 200',
          )
          .all(),
        db().prepare('SELECT * FROM posts ORDER BY date DESC').all(),
        db().prepare('SELECT * FROM games ORDER BY updated_at DESC').all(),
        db().prepare('SELECT * FROM support_requests ORDER BY created_at DESC LIMIT 200').all(),
        getSettings(),
      ]);
      const { stripe_key, webhook_secret } = settings;
      const safe=Object.fromEntries(Object.entries(settings).filter(([key])=>!key.startsWith('stripe_key')&&!key.startsWith('webhook_secret')));
      return json({
        products: products.results,
        orders: orders.results,
        posts: posts.results,
        games: games.results,
        supportRequests: supportRequests.results,
        settings: safe,
        connected: !!stripe_key,
        webhookConnected: !!webhook_secret,
        vaultReady: !!runtime().VAULT_KEY,
        emailReady: !!runtime().RESEND_API_KEY,
      });
    }
    if (route.startsWith('order/')) {
      const u = await identity();
      const order = await db()
        .prepare('SELECT * FROM orders WHERE id=?')
        .bind(route.slice(6))
        .first<any>();
      if (!order || (!u.admin && order.user_id !== u.userId))
        reject(404, 'Order not found.');
      const items = await db()
        .prepare(
          'SELECT title,price,quantity,image FROM order_items WHERE order_id=?',
        )
        .bind(order.id)
        .all();
      const { stripe_params, ...safe } = order;
      return json({ order: safe, items: items.results });
    }
    return json({ error: 'Not found' }, 404);
  });
}
export async function POST(req: Request) {
  return handled(async () => {
    sameOrigin(req);
    const route = path(req);
    const data = await body(req);
    if (route === 'profile') {
      const u = await customer();
      await db()
        .prepare('UPDATE profiles SET name=? WHERE id=?')
        .bind(str(data.name, 80), u.userId)
        .run();
      return json({ ok: true });
    }
    if (route === 'cart') {
      const u = await customer();
      if(await db().prepare("SELECT id FROM orders WHERE user_id=? AND status='pending'").bind(u.userId).first())reject(409,'A checkout is reserved. Cancel the reservation in your bag before changing items.');
      const id = str(data.productId, 100),
        quantity = int(data.quantity, 0, 20);
      if (quantity === 0) {
        await db()
          .prepare('DELETE FROM carts WHERE user_id=? AND product_id=?')
          .bind(u.userId, id)
          .run();
        return json({ ok: true });
      }
      const p = await db()
        .prepare(
          "SELECT stock FROM products WHERE id=? AND status='published' AND sample=0",
        )
        .bind(id)
        .first<any>();
      if (!p) reject(404, 'This product is no longer available.');
      if (p.stock < quantity)
        reject(409, 'There is not enough stock for that quantity.');
      await db()
        .prepare(
          'INSERT INTO carts(user_id,product_id,quantity) VALUES(?,?,?) ON CONFLICT(user_id,product_id) DO UPDATE SET quantity=excluded.quantity',
        )
        .bind(u.userId, id, quantity)
        .run();
      return json({ ok: true });
    }
    if (route === 'favorite') {
      const u = await identity();
      const id = str(data.productId, 100);
      const p =
        sampleProducts.some((p) => p.id === id) ||
        (await db()
          .prepare("SELECT id FROM products WHERE id=? AND status='published'")
          .bind(id)
          .first());
      if (!p) reject(404, 'Product not found.');
      if (data.saved === true)
        await db()
          .prepare(
            'INSERT OR IGNORE INTO favorites(user_id,product_id) VALUES(?,?)',
          )
          .bind(u.userId, id)
          .run();
      else
        await db()
          .prepare('DELETE FROM favorites WHERE user_id=? AND product_id=?')
          .bind(u.userId, id)
          .run();
      return json({ ok: true });
    }
    if (route === 'rsvp') {
      const u = await customer();
      const id = str(data.postId, 100);
      const p = await db()
        .prepare(
          "SELECT id,date,capacity FROM posts WHERE id=? AND kind='event' AND published=1",
        )
        .bind(id)
        .first<any>();
      if (!p) reject(404, 'Event not found.');
      if (data.attending === true) {
        if (new Date(p.date) < new Date()) reject(400, 'This event has ended.');
        if (p.capacity > 0) {
          const total = await db().prepare('SELECT count(*) AS count FROM rsvps WHERE post_id=?').bind(id).first<any>();
          const already = await db().prepare('SELECT 1 AS yes FROM rsvps WHERE user_id=? AND post_id=?').bind(u.userId, id).first();
          if (!already && Number(total?.count || 0) >= p.capacity) reject(409, 'This event is full.');
        }
        await db()
          .prepare(
            'INSERT OR IGNORE INTO rsvps(user_id,post_id,created_at) VALUES(?,?,?)',
          )
          .bind(u.userId, id, Date.now())
          .run();
      } else
        await db()
          .prepare('DELETE FROM rsvps WHERE user_id=? AND post_id=?')
          .bind(u.userId, id)
          .run();
      return json({ ok: true });
    }
    if (route === 'score') {
      const u = await customer();
      const moves = int(data.moves, 8, 1000),
        seconds = int(data.seconds, 1, 86400);
      await db()
        .prepare(
          'INSERT INTO scores(user_id,moves,seconds,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET moves=excluded.moves,seconds=excluded.seconds,updated_at=excluded.updated_at WHERE excluded.moves<scores.moves OR (excluded.moves=scores.moves AND excluded.seconds<scores.seconds)',
        )
        .bind(u.userId, moves, seconds, Date.now())
        .run();
      return json({ ok: true });
    }
    if (route === 'support') {
      if (data.consent !== true) reject(400, 'Please authorize contact before sending the request.');
      const email = str(data.email, 320).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reject(400, 'Enter a valid email address.');
      const firstName = str(data.firstName, 60);
      const lastName = str(data.lastName, 60);
      const phone = str(data.phone, 30);
      if (!/^[0-9+().\-\s]{7,30}$/.test(phone)) reject(400, 'Enter a valid phone number.');
      const device = str(data.device, 80);
      if (!['Windows computer', 'Mac computer', 'Chromebook', 'Phone or tablet', 'Other device'].includes(device)) {
        reject(400, 'Choose a valid device type.');
      }
      let userId: string | null = null;
      try {
        userId = (await identity()).userId;
      } catch (error) {
        if (!(error instanceof HttpError) || error.status !== 401) throw error;
      }
      const id = crypto.randomUUID();
      const now = Date.now();
      const supportRequest = {
        id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        device,
        issue: str(data.issue, 3000),
        asl_code: str(data.aslCode || '', 100, false),
      };
      await db().prepare(
        "INSERT INTO support_requests(id,user_id,first_name,last_name,name,email,phone,device,issue,asl_code,consent_at,status,note,notification_status,notification_error,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,'new','','pending','',?,?)",
      ).bind(
        id,
        userId,
        firstName,
        lastName,
        `${firstName} ${lastName}`,
        email,
        phone,
        supportRequest.device,
        supportRequest.issue,
        supportRequest.asl_code,
        now,
        now,
        now,
      ).run();
      const delivery = await sendSupportNotification(supportRequest, await getSettings());
      await db().prepare('UPDATE support_requests SET notification_status=?,notification_error=?,updated_at=? WHERE id=?')
        .bind(delivery.status, delivery.error, Date.now(), id).run();
      return json({ id, notification: delivery.status }, 201);
    }
    if (route === 'support-message') {
      const user = await identity();
      const request = await accessibleSupportRequest(str(data.id, 100), user);
      const message = str(data.message, 3000);
      const fromOwner = !!user.admin;
      const id = crypto.randomUUID();
      const now = Date.now();
      await db().batch([
        db().prepare('INSERT INTO support_messages(id,request_id,sender,body,delivery_status,delivery_error,created_at) VALUES(?,?,?,?,?,?,?)')
          .bind(id, request.id, fromOwner ? 'owner' : 'customer', message, 'pending', '', now),
        db().prepare('UPDATE support_requests SET status=?,updated_at=? WHERE id=?')
          .bind(fromOwner ? (request.status === 'new' ? 'in_progress' : request.status) : 'new', now, request.id),
      ]);
      const delivery = await sendSupportMessageEmail(request, message, fromOwner, await getSettings());
      await db().prepare('UPDATE support_messages SET delivery_status=?,delivery_error=? WHERE id=?')
        .bind(delivery.status, delivery.error, id).run();
      return json({ id, delivery: delivery.status }, 201);
    }
    if (route === 'checkout') {
      const u = await customer();
      const settings = await getSettings();
      if (!settings.stripe_key || settings.selling !== 'true')
        reject(
          503,
          'Checkout opens when the shop owner connects payments and activates selling.',
        );
      await cleanup();
      const existing = await db()
        .prepare(
          "SELECT * FROM orders WHERE user_id=? AND status='pending' ORDER BY created_at DESC LIMIT 1",
        )
        .bind(u.userId)
        .first<any>();
      if (existing) {
        const s = await sessionFor(existing);
        const updated = await reconcile(existing, s);
        if ((updated as any).status === 'pending' && s.url)
          return json({ url: s.url, orderId: existing.id });
        if ((updated as any).status === 'paid')
          return json({ url: '/account?order=' + existing.id });
      }
      const { results: items } = await db()
        .prepare(
          'SELECT p.*,c.quantity FROM carts c JOIN products p ON p.id=c.product_id WHERE c.user_id=?',
        )
        .bind(u.userId)
        .all<any>();
      if (!items.length) reject(400, 'Your bag is empty.');
      if (items.length > 30)
        reject(400, 'Please check out with 30 or fewer products.');
      for (const p of items)
        if (p.status !== 'published' || p.sample || p.stock < p.quantity)
          reject(
            409,
            `${p.title} is unavailable in this quantity. Update your bag.`,
          );
      const id = crypto.randomUUID(),
        now = Math.floor(Date.now() / 1000),
        expires = now + 1860,
        subtotal = items.reduce((n, p) => n + p.price * p.quantity, 0),
        shipping = Number(settings.shipping || 0);
      const params = checkoutParams(
        id,
        u.email,
        items,
        shipping,
        expires,
        settings.automatic_tax === 'true',
      );
      try {
        await db().batch([
          db()
            .prepare(
              "INSERT INTO orders(id,user_id,email,status,subtotal,shipping,total,stripe_params,created_at,expires_at,payment_mode) VALUES(?,?,?,'pending',?,?,?,?,?,?,?)",
            )
            .bind(
              id,
              u.userId,
              u.email,
              subtotal,
              shipping,
              subtotal + shipping,
              params.toString(),
              now,
              expires,
              settings.mode || 'test',
            ),
          ...items.flatMap((p) => [
            db()
              .prepare(
                "UPDATE products SET stock=CASE WHEN stock>=? AND status='published' AND price=? THEN stock-? ELSE -1 END WHERE id=?",
              )
              .bind(p.quantity, p.price, p.quantity, p.id),
            db()
              .prepare(
                'INSERT INTO order_items(order_id,product_id,title,price,quantity,image) VALUES(?,?,?,?,?,?)',
              )
              .bind(id, p.id, p.title, p.price, p.quantity, p.image),
          ]),
        ]);
      } catch {
        reject(
          409,
          'Stock changed while you were checking out. Refresh your bag and try again.',
        );
      }
      const order = await db()
        .prepare('SELECT * FROM orders WHERE id=?')
        .bind(id)
        .first();
      const session = await sessionFor(order);
      return json({ url: session.url, orderId: id });
    }
    if (route === 'verify' || route === 'cancel') {
      const u = await identity();
      const order = await db()
        .prepare('SELECT * FROM orders WHERE id=? AND user_id=?')
        .bind(str(data.orderId, 100), u.userId)
        .first<any>();
      if (!order) reject(404, 'Order not found.');
      if (route === 'cancel' && order.status === 'pending') {
        const session = await sessionFor(order);
        if (session.status === 'open')
          await stripe(
            `checkout/sessions/${session.id}/expire`,
            new URLSearchParams(),
            'expire-' + order.id,
            undefined,
            order.payment_mode,
          );
      }
      const updated = await reconcile(order);
      return json({ status: (updated as any).status });
    }
    if (route.startsWith('admin/')) {
      await identity(true);
      if (route === 'admin/product') {
        const id = data.id ? str(data.id, 100) : crypto.randomUUID();
        const title = str(data.title, 140),
          description = str(data.description, 6000),
          category = str(data.category, 80);
        if (!categories.slice(1).includes(category))
          reject(400, 'Choose a product category.');
        const status = str(data.status, 20);
        if (!['draft', 'published', 'archived'].includes(status))
          reject(400, 'Invalid product status.');
        const price = int(data.price, 1, 10000000),
          stock = int(data.stock, 0, 100000);
        if(data.id){const result=await db().prepare('UPDATE products SET title=?,description=?,category=?,price=?,stock=?,image=?,status=? WHERE id=? AND stock=?').bind(title,description,category,price,stock,imageUrl(data.image),status,id,int(data.expectedStock,0,100000)).run();if(!result.meta.changes)reject(409,'Stock changed while you were editing. Close this form, refresh the products, and try again.');return json({id});}
        await db()
          .prepare(
            'INSERT INTO products(id,title,description,category,price,stock,image,status,sample,created_at) VALUES(?,?,?,?,?,?,?,?,0,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,category=excluded.category,price=excluded.price,stock=excluded.stock,image=excluded.image,status=excluded.status',
          )
          .bind(
            id,
            title,
            description,
            category,
            price,
            stock,
            imageUrl(data.image),
            status,
            Date.now(),
          )
          .run();
        return json({ id });
      }
      if (route === 'admin/post') {
        const id = data.id ? str(data.id, 100) : crypto.randomUUID(),
          kind = str(data.kind, 20);
        if (!['news', 'event'].includes(kind))
          reject(400, 'Choose news or event.');
        const date = str(data.date, 100);
        if (!Number.isFinite(Date.parse(date)))
          reject(400, 'Choose a valid date.');
        const endDate = str(data.end_date || '', 100, false);
        if (endDate && (!Number.isFinite(Date.parse(endDate)) || Date.parse(endDate) < Date.parse(date)))
          reject(400, 'The ending time must be after the starting time.');
        const contactEmail = str(data.contact_email || '', 320, false).toLowerCase();
        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
          reject(400, 'Enter a valid event contact email.');
        const registrationUrl = str(data.registration_url || '', 1500, false);
        if (registrationUrl) {
          try {
            if (new URL(registrationUrl).protocol !== 'https:') reject(400, 'Use a secure HTTPS registration link.');
          } catch (error) {
            if (error instanceof HttpError) throw error;
            reject(400, 'Enter a valid registration link.');
          }
        }
        const publishedAt = data.published_at
          ? int(data.published_at, 0, Number.MAX_SAFE_INTEGER)
          : Date.now();
        await db()
          .prepare(
            'INSERT INTO posts(id,kind,title,summary,body,image,video,date,end_date,location,author,published_at,capacity,contact_email,registration_url,accessibility,featured,published) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,title=excluded.title,summary=excluded.summary,body=excluded.body,image=excluded.image,video=excluded.video,date=excluded.date,end_date=excluded.end_date,location=excluded.location,author=excluded.author,published_at=excluded.published_at,capacity=excluded.capacity,contact_email=excluded.contact_email,registration_url=excluded.registration_url,accessibility=excluded.accessibility,featured=excluded.featured,published=excluded.published',
          )
          .bind(
            id,
            kind,
            str(data.title, 160),
            str(data.summary, 400),
            str(data.body, 12000),
            imageUrl(data.image),
            videoUrl(data.video),
            date,
            endDate,
            str(data.location || '', 200, kind === 'event'),
            str(data.author || 'Signova Technology', 100),
            publishedAt,
            int(data.capacity || 0, 0, 100000),
            contactEmail,
            registrationUrl,
            str(data.accessibility || '', 2000, false),
            data.featured ? 1 : 0,
            data.published ? 1 : 0,
          )
          .run();
        return json({ id });
      }
      if (route === 'admin/post-delete') {
        const id = str(data.id, 100);
        const result = await db().prepare("DELETE FROM posts WHERE id=? AND kind='news'").bind(id).run();
        if (!result.meta.changes) reject(404, 'News post not found.');
        return json({ ok: true });
      }
      if (route === 'admin/game') {
        const id = data.id ? str(data.id, 100) : crypto.randomUUID();
        const now = Date.now();
        const category = str(data.category, 50);
        if (!['Arcade', 'Puzzle', 'Memory', 'Adventure', 'Educational', 'Relaxing'].includes(category))
          reject(400, 'Choose a valid game category.');
        await db().prepare(
          'INSERT INTO games(id,title,description,category,thumbnail,html,css,javascript,python,published,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,category=excluded.category,thumbnail=excluded.thumbnail,html=excluded.html,css=excluded.css,javascript=excluded.javascript,python=excluded.python,published=excluded.published,updated_at=excluded.updated_at',
        ).bind(
          id,
          str(data.title, 120),
          str(data.description, 500),
          category,
          imageUrl(data.thumbnail),
          str(data.html, 12000),
          str(data.css, 12000, false),
          str(data.javascript, 12000, false),
          str(data.python, 12000, false),
          data.published ? 1 : 0,
          data.id ? int(data.created_at, 0, Number.MAX_SAFE_INTEGER) : now,
          now,
        ).run();
        return json({ id });
      }
      if (route === 'admin/settings') {
        const support = str(data.support, 200);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(support))
          reject(400, 'Enter a valid support email.');
        const supportNotificationEmail = str(data.support_notification_email || 'richynoble75@live.com', 320).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportNotificationEmail))
          reject(400, 'Enter a valid support notification email.');
        const settings = await getSettings();
        if (data.selling && !settings.stripe_key)
          reject(400, 'Connect Stripe before activating selling.');
        const aslUrl = str(data.asl_url || '', 1500, false);
        if (aslUrl) {
          try {
            if (new URL(aslUrl).protocol !== 'https:') reject(400, 'Use a secure HTTPS address for the ASL support link.');
          } catch (error) {
            if (error instanceof HttpError) throw error;
            reject(400, 'Enter a valid ASL support link.');
          }
        }
        await setSettings({
          shop_name: str(data.shop_name, 80),
          support,
          returns: str(data.returns, 6000),
          shipping: String(int(data.shipping, 0, 100000)),
          selling: data.selling ? 'true' : 'false',
          automatic_tax: data.automatic_tax ? 'true' : 'false',
          asl_url: aslUrl,
          support_notification_email: supportNotificationEmail,
          support_subject: str(data.support_subject || 'DeafTech Support', 160),
        });
        return json({ ok: true });
      }
      if (route === 'admin/support') {
        const id = str(data.id, 100);
        const status = str(data.status, 30);
        if (!['new', 'in_progress', 'resolved'].includes(status)) reject(400, 'Choose a valid support status.');
        const result = await db().prepare(
          'UPDATE support_requests SET status=?,note=?,updated_at=? WHERE id=?',
        ).bind(status, str(data.note || '', 2000, false), Date.now(), id).run();
        if (!result.meta.changes) reject(404, 'Support request not found.');
        return json({ ok: true });
      }
      if (route === 'admin/support-notify') {
        const id = str(data.id, 100);
        const request = await db().prepare('SELECT * FROM support_requests WHERE id=?').bind(id).first<any>();
        if (!request) reject(404, 'Support request not found.');
        const delivery = await sendSupportNotification(request, await getSettings());
        await db().prepare('UPDATE support_requests SET notification_status=?,notification_error=?,updated_at=? WHERE id=?')
          .bind(delivery.status, delivery.error, Date.now(), id).run();
        if (delivery.status !== 'sent') reject(503, delivery.error || 'Email delivery is unavailable.');
        return json({ ok: true });
      }
      if (route === 'admin/connect') {
        const key = str(data.key, 300);
        if (!/^sk_(test|live)_/.test(key))
          reject(
            400,
            'Enter a Stripe secret key beginning with sk_test_ or sk_live_.',
          );
        const account = await stripe('account', undefined, undefined, key);
        if(key.startsWith('sk_live_')&&!account.charges_enabled)reject(400,'Finish activating your Stripe account before connecting live payments.');
        const existing = await getSettings();
        if (existing.stripe_account && existing.stripe_account !== account.id) {
          const pending = await db()
            .prepare(
              "SELECT id FROM orders WHERE status IN('pending','paid','shipped') LIMIT 1",
            )
            .first();
          if (pending)
            reject(
              409,
              'This store has orders. Keep the same Stripe account so payments and refunds remain accessible.',
            );
        }
        const values: Record<string, string> = {
          stripe_key: await seal(key),
          stripe_account: account.id,
          mode: key.startsWith('sk_live_') ? 'live' : 'test',
        };
        values['stripe_key_'+values.mode]=values.stripe_key;
        if (data.webhookSecret) {
          const secret = str(data.webhookSecret, 300);
          if (!secret.startsWith('whsec_'))
            reject(400, 'Enter a valid webhook signing secret.');
          values.webhook_secret = await seal(secret);
          values['webhook_secret_'+values.mode]=values.webhook_secret;
        }
        await setSettings(values);
        return json({ ok: true, mode: values.mode });
      }
      if (route === 'admin/ship') {
        const id = str(data.orderId, 100);
        const order = await db()
          .prepare("SELECT id FROM orders WHERE id=? AND status='paid'")
          .bind(id)
          .first();
        if (!order) reject(400, 'Only a paid order can be marked shipped.');
        await db()
          .prepare(
            "UPDATE orders SET status='shipped',tracking=? WHERE id=? AND status='paid'",
          )
          .bind(str(data.tracking, 300), id)
          .run();
        return json({ ok: true });
      }
      if (route === 'admin/refund') {
        const order = await db()
          .prepare('SELECT * FROM orders WHERE id=?')
          .bind(str(data.orderId, 100))
          .first<any>();
        if (
          !order ||
          !['paid', 'shipped', 'refunded'].includes(order.status) ||
          !order.payment_intent
        )
          reject(400, 'This order cannot be refunded.');
        if (order.status === 'refunded') return json({ ok: true });
        const refund = order.refund_id ? await stripe('refunds/'+encodeURIComponent(order.refund_id),undefined,undefined,undefined,order.payment_mode) : await stripe(
          'refunds',
          new URLSearchParams({ payment_intent: order.payment_intent }),
          'refund-' + order.id,
          undefined,
          order.payment_mode,
        );
        await db().prepare('UPDATE orders SET refund_id=? WHERE id=?').bind(refund.id,order.id).run();
        if (refund.status !== 'succeeded')
          reject(
            409,
            'Stripe is processing the refund. Check Stripe before retrying.',
          );
        await db()
          .prepare("UPDATE orders SET status='refunded',refund_id=? WHERE id=?")
          .bind(refund.id, order.id)
          .run();
        return json({ ok: true });
      }
    }
    return json({ error: 'Not found' }, 404);
  });
}
