import { serverConfig } from '../config.js';

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
    if (url.host !== host) {
      return res.status(403).json({ ok: false, code: 'CSRF_ORIGIN_MISMATCH' });
    }
  } catch {
    return res.status(403).json({ ok: false, code: 'CSRF_ORIGIN_INVALID' });
  }
  return next();
}
