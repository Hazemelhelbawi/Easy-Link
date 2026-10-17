import { serverConfig } from '../config.js';

/** Vite dev server origins (API is proxied; Host may be backend port 8501). */
const devAllowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

export function validateOrigin(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin) {
    if (serverConfig.nodeEnv === 'development') return next();
    return res.status(403).json({ ok: false, code: 'CSRF_ORIGIN_MISSING' });
  }
  try {
    const url = new URL(origin);
    if (url.host === host) return next();
    if (serverConfig.nodeEnv === 'development' && devAllowedOrigins.has(origin)) {
      return next();
    }
    return res.status(403).json({ ok: false, code: 'CSRF_ORIGIN_MISMATCH' });
  } catch {
    return res.status(403).json({ ok: false, code: 'CSRF_ORIGIN_INVALID' });
  }
}
