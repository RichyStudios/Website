import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const profiles = sqliteTable('profiles', {
  id: text().primaryKey(),
  email: text().notNull(),
  name: text().notNull(),
  created_at: integer().notNull(),
});
export const products = sqliteTable(
  'products',
  {
    id: text().primaryKey(),
    title: text().notNull(),
    description: text().notNull(),
    category: text().notNull(),
    price: integer().notNull(),
    stock: integer().notNull(),
    image: text().notNull(),
    status: text().notNull().default('draft'),
    sample: integer().notNull().default(0),
    created_at: integer().notNull(),
  },
  (t) => [
    check('stock_nonnegative', sql`${t.stock}>=0`),
    check('price_positive', sql`${t.price}>0`),
    index('idx_products_status').on(t.status),
  ],
);
export const carts = sqliteTable(
  'carts',
  {
    user_id: text().notNull(),
    product_id: text()
      .notNull()
      .references(() => products.id),
    quantity: integer().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.product_id] }),
    check('cart_quantity', sql`${t.quantity}>0 AND ${t.quantity}<=20`),
  ],
);
export const favorites = sqliteTable(
  'favorites',
  { user_id: text().notNull(), product_id: text().notNull() },
  (t) => [primaryKey({ columns: [t.user_id, t.product_id] })],
);
export const orders = sqliteTable(
  'orders',
  {
    id: text().primaryKey(),
    user_id: text().notNull(),
    email: text().notNull(),
    status: text().notNull(),
    subtotal: integer().notNull(),
    shipping: integer().notNull(),
    total: integer().notNull(),
    session_id: text(),
    stripe_params: text().notNull(),
    created_at: integer().notNull(),
    expires_at: integer().notNull(),
    tracking: text().notNull().default(''),
    address: text().notNull().default(''),
    payment_intent: text(),
    refund_id: text(),
    payment_mode: text().notNull().default('test'),
  },
  (t) => [
    index('idx_orders_user_created').on(t.user_id, t.created_at),
    index('idx_orders_status_expires').on(t.status, t.expires_at),
    uniqueIndex('idx_orders_one_pending_per_user')
      .on(t.user_id)
      .where(sql`status='pending'`),
  ],
);
export const orderItems = sqliteTable(
  'order_items',
  {
    order_id: text()
      .notNull()
      .references(() => orders.id),
    product_id: text()
      .notNull()
      .references(() => products.id),
    title: text().notNull(),
    price: integer().notNull(),
    quantity: integer().notNull(),
    image: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.order_id, t.product_id] })],
);
export const posts = sqliteTable(
  'posts',
  {
    id: text().primaryKey(),
    kind: text().notNull(),
    title: text().notNull(),
    summary: text().notNull(),
    body: text().notNull(),
    image: text().notNull(),
    video: text().notNull().default(''),
    date: text().notNull(),
    end_date: text().notNull().default(''),
    location: text().notNull().default(''),
    author: text().notNull().default('Signova Technology'),
    published_at: integer().notNull().default(0),
    capacity: integer().notNull().default(0),
    contact_email: text().notNull().default(''),
    registration_url: text().notNull().default(''),
    accessibility: text().notNull().default(''),
    featured: integer().notNull().default(0),
    published: integer().notNull().default(0),
  },
  (t) => [index('idx_posts_kind_published').on(t.kind, t.published)],
);
export const rsvps = sqliteTable(
  'rsvps',
  {
    user_id: text().notNull(),
    post_id: text()
      .notNull()
      .references(() => posts.id),
    created_at: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.user_id, t.post_id] })],
);
export const settings = sqliteTable('settings', {
  key: text().primaryKey(),
  value: text().notNull(),
});
export const scores = sqliteTable('scores', {
  user_id: text().primaryKey(),
  moves: integer().notNull(),
  seconds: integer().notNull(),
  updated_at: integer().notNull(),
});
export const authSessions = sqliteTable(
  'auth_sessions',
  {
    token: text().primaryKey(),
    user_id: text().notNull(),
    provider: text().notNull(),
    email: text().notNull(),
    name: text().notNull(),
    created_at: integer().notNull(),
    expires_at: integer().notNull(),
  },
  (t) => [index('idx_auth_sessions_expires').on(t.expires_at)],
);
export const passwordAccounts = sqliteTable(
  'password_accounts',
  {
    id: text().primaryKey(),
    username: text().notNull(),
    email: text().notNull(),
    name: text().notNull(),
    password_hash: text().notNull(),
    password_salt: text().notNull(),
    password_iterations: integer().notNull(),
    created_at: integer().notNull(),
  },
  (t) => [
    uniqueIndex('idx_password_accounts_username').on(t.username),
    uniqueIndex('idx_password_accounts_email').on(t.email),
  ],
);
export const authLoginAttempts = sqliteTable('auth_login_attempts', {
  key: text().primaryKey(),
  attempts: integer().notNull().default(0),
  window_start: integer().notNull(),
  locked_until: integer().notNull().default(0),
});
export const supportRequests = sqliteTable(
  'support_requests',
  {
    id: text().primaryKey(),
    user_id: text(),
    first_name: text().notNull().default(''),
    last_name: text().notNull().default(''),
    name: text().notNull(),
    email: text().notNull(),
    phone: text().notNull().default(''),
    device: text().notNull(),
    issue: text().notNull(),
    asl_code: text().notNull().default(''),
    consent_at: integer().notNull(),
    status: text().notNull().default('new'),
    note: text().notNull().default(''),
    notification_status: text().notNull().default('pending'),
    notification_error: text().notNull().default(''),
    created_at: integer().notNull(),
    updated_at: integer().notNull(),
  },
  (t) => [index('idx_support_requests_status_created').on(t.status, t.created_at)],
);

export const supportMessages = sqliteTable(
  'support_messages',
  {
    id: text().primaryKey(),
    request_id: text().notNull().references(() => supportRequests.id, { onDelete: 'cascade' }),
    sender: text().notNull(),
    body: text().notNull(),
    delivery_status: text().notNull().default('pending'),
    delivery_error: text().notNull().default(''),
    created_at: integer().notNull(),
  },
  (t) => [index('idx_support_messages_request_created').on(t.request_id, t.created_at)],
);

export const games = sqliteTable(
  'games',
  {
    id: text().primaryKey(),
    title: text().notNull(),
    description: text().notNull(),
    category: text().notNull(),
    thumbnail: text().notNull(),
    html: text().notNull(),
    css: text().notNull(),
    javascript: text().notNull(),
    python: text().notNull().default(''),
    published: integer().notNull().default(0),
    created_at: integer().notNull(),
    updated_at: integer().notNull(),
  },
  (t) => [index('idx_games_published_updated').on(t.published, t.updated_at)],
);
