import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hashHex] = String(stored ?? '').split(':');
  if (!salt || !hashHex) return false;
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  const storedBuffer = Buffer.from(hashHex, 'hex');
  return storedBuffer.length === derived.length && timingSafeEqual(storedBuffer, derived);
}
