import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const AMBIGUOUS = new Set(['0', 'O', '1', 'l', 'I']);
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function generateTempPassword(length = 12) {
  const bytes = crypto.randomBytes(length * 2);
  let out = '';
  for (let i = 0; i < bytes.length && out.length < length; i += 1) {
    const ch = CHARSET[bytes[i] % CHARSET.length];
    if (AMBIGUOUS.has(ch)) continue;
    out += ch;
  }
  while (out.length < length) {
    const ch = CHARSET[crypto.randomInt(0, CHARSET.length)];
    if (!AMBIGUOUS.has(ch)) out += ch;
  }
  return out.slice(0, length);
}

export function validatePasswordPolicy(password, { username, tempPassword } = {}) {
  if (!password || password.length < 8) return 'PASSWORD_TOO_SHORT';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'PASSWORD_WEAK';
  if (username && password.toLowerCase() === String(username).toLowerCase()) {
    return 'PASSWORD_SAME_AS_USERNAME';
  }
  if (tempPassword && password === tempPassword) return 'PASSWORD_SAME_AS_TEMP';
  return null;
}
