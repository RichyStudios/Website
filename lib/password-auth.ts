import { db, reject, str } from './server';
import { provisionSession, randomToken } from './oauth';

const PASSWORD_ITERATIONS = 210_000;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const MAX_LOGIN_ATTEMPTS = 8;

function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function decode(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

export function normalizeUsername(value: unknown) {
  const username = str(value, 30).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) {
    reject(400, 'Use 3–30 letters, numbers, periods, dashes, or underscores for your username.');
  }
  return username;
}

export function normalizeEmail(value: unknown) {
  const email = str(value, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reject(400, 'Enter a valid email address.');
  return email;
}

export function validatePassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < 10 || value.length > 128 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    reject(400, 'Use 10–128 characters with at least one letter and one number.');
  }
  return value as string;
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
      iterations,
    },
    material,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, PASSWORD_ITERATIONS);
  return { hash: encode(hash), salt: encode(salt), iterations: PASSWORD_ITERATIONS };
}

export async function verifyPassword(password: string, salt: string, expected: string, iterations: number) {
  const actual = await derive(password, decode(salt), iterations);
  const wanted = decode(expected);
  if (actual.length !== wanted.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ wanted[index];
  return difference === 0;
}

async function attemptKey(req: Request, identifier: string) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}|${identifier}`));
  return encode(new Uint8Array(digest));
}

export async function enforceLoginLimit(req: Request, identifier: string) {
  const key = await attemptKey(req, identifier);
  const now = Math.floor(Date.now() / 1000);
  const row = await db().prepare('SELECT attempts,window_start,locked_until FROM auth_login_attempts WHERE key=?').bind(key).first<any>();
  if (row?.locked_until > now) reject(429, 'Too many sign-in attempts. Try again in a few minutes.');
  return { key, now, row };
}

export async function recordLoginFailure(state: { key: string; now: number; row: any }) {
  const activeWindow = state.row && state.now - state.row.window_start < LOGIN_WINDOW_SECONDS;
  const attempts = activeWindow ? state.row.attempts + 1 : 1;
  const windowStart = activeWindow ? state.row.window_start : state.now;
  const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? state.now + LOGIN_WINDOW_SECONDS : 0;
  await db().prepare(
    'INSERT INTO auth_login_attempts(key,attempts,window_start,locked_until) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts,window_start=excluded.window_start,locked_until=excluded.locked_until',
  ).bind(state.key, attempts, windowStart, lockedUntil).run();
}

export async function clearLoginFailures(key: string) {
  await db().prepare('DELETE FROM auth_login_attempts WHERE key=?').bind(key).run();
}

export async function createPasswordSession(account: { id: string; email: string; name: string }) {
  return provisionSession('password', account);
}

export function newAccountId() {
  return randomToken();
}
