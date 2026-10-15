import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  authenticateCredentials,
  signSession,
  revokeToken,
  changePassword,
} from '../services/authService.js';
import { attachAuth, requireAuth, cookieName } from '../middleware/auth.js';
import { validateOrigin } from '../middleware/csrf.js';
import { serverConfig } from '../config.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: serverConfig.loginRateWindowMs,
  max: serverConfig.loginRateMax,
  standardHeaders: true,
  legacyHeaders: false,
});

function setSessionCookie(res, token) {
  res.cookie(cookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: serverConfig.cookieSecure,
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  });
}

router.post('/login', loginLimiter, validateOrigin, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(401).json({ ok: false, code: 'INVALID_CREDENTIALS' });
  }
  const result = await authenticateCredentials(username, password);
  if (result.error) {
    return res.status(401).json({ ok: false, code: result.error });
  }
  const { token, jti } = await signSession(result.user, {
    passwordChangeOnly: !!result.passwordChangeRequired,
  });
  setSessionCookie(res, token);
  return res.json({
    ok: true,
    passwordChangeRequired: !!result.passwordChangeRequired,
    user: sanitizeUser(result.user),
  });
});

router.post('/logout', validateOrigin, attachAuth, (req, res) => {
  if (req.auth?.payload?.jti) revokeToken(req.auth.payload.jti);
  res.clearCookie(cookieName(), { path: '/' });
  return res.json({ ok: true });
});

router.get('/me', attachAuth, requireAuth, (req, res) => {
  return res.json({
    ok: true,
    user: sanitizeUser(req.auth.user),
    role: req.auth.role,
    passwordChangeRequired: req.auth.passwordChangeOnly,
  });
});

router.post('/change-password', validateOrigin, attachAuth, requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const result = await changePassword(req.auth.user.id, { currentPassword, newPassword });
  if (result.error) {
    const status = result.error === 'NOT_FOUND' ? 404 : 400;
    return res.status(status).json({ ok: false, code: result.error });
  }
  const { token } = await signSession(result.user, { passwordChangeOnly: false });
  setSessionCookie(res, token);
  return res.json({ ok: true, user: sanitizeUser(result.user) });
});

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    personId: user.personId,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
  };
}

export default router;
