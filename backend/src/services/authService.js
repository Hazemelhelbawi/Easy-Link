import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { serverConfig, paths } from '../config.js';
import { loadUsers, saveUsers, getOrCreateJwtSecret, loadConfig } from './store.js';
import { hashPassword, verifyPassword, generateTempPassword, validatePasswordPolicy } from '../utils/passwords.js';

/** @type {Set<string>} */
const revokedTokens = new Set();

export async function signSession(user, { passwordChangeOnly = false } = {}) {
  const secret = await getOrCreateJwtSecret();
  const jti = crypto.randomBytes(16).toString('hex');
  const payload = {
    sub: user.id,
    tv: user.tokenVersion || 0,
    jti,
    pwc: passwordChangeOnly ? 1 : 0,
  };
  const token = jwt.sign(payload, secret, { expiresIn: serverConfig.jwtExpiresIn });
  return { token, jti };
}

export function revokeToken(jti) {
  if (jti) revokedTokens.add(jti);
}

export async function verifySessionToken(token) {
  const secret = await getOrCreateJwtSecret();
  try {
    const payload = jwt.verify(token, secret);
    if (payload.jti && revokedTokens.has(payload.jti)) return null;
    const users = await loadUsers();
    const user = users.find((u) => u.id === payload.sub);
    if (!user || !user.active) return null;
    if ((user.tokenVersion || 0) !== payload.tv) return null;
    return { user, payload };
  } catch {
    return null;
  }
}

export async function authenticateCredentials(username, password) {
  const users = await loadUsers();
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user || !user.active) return { error: 'INVALID_CREDENTIALS' };
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: 'INVALID_CREDENTIALS' };

  if (user.mustChangePassword) {
    if (user.tempPasswordExpiresAt && Date.now() > Date.parse(user.tempPasswordExpiresAt)) {
      return { error: 'TEMP_PASSWORD_EXPIRED' };
    }
    return { user, passwordChangeRequired: true };
  }

  return { user };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const users = await loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return { error: 'NOT_FOUND' };
  const user = users[idx];
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return { error: 'INVALID_CREDENTIALS' };

  const policy = validatePasswordPolicy(newPassword, {
    username: user.username,
    tempPassword: user.mustChangePassword ? currentPassword : undefined,
  });
  if (policy) return { error: policy };

  users[idx] = {
    ...user,
    passwordHash: await hashPassword(newPassword),
    mustChangePassword: false,
    tempPasswordExpiresAt: null,
    tokenVersion: (user.tokenVersion || 0) + 1,
  };
  await saveUsers(users);
  return { user: users[idx] };
}

export async function activateUserAccount(userId, adminId) {
  const users = await loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return { error: 'NOT_FOUND' };
  const temp = generateTempPassword(12);
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  users[idx] = {
    ...users[idx],
    active: true,
    mustChangePassword: true,
    tempPasswordExpiresAt: expires,
    passwordHash: await hashPassword(temp),
    tokenVersion: (users[idx].tokenVersion || 0) + 1,
    activatedBy: adminId,
  };
  await saveUsers(users);
  return { user: users[idx], tempPassword: temp };
}

export async function resetUserPassword(userId) {
  return activateUserAccount(userId, null);
}

export function countActiveAdmins(users) {
  return users.filter((u) => u.active && u.role === 'admin').length;
}

export async function ensureBootstrapState() {
  const config = await loadConfig();
  return config.bootstrapCompleted === true;
}
