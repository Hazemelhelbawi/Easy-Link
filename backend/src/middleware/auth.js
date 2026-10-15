import { verifySessionToken } from '../services/authService.js';
import { loadPeople } from '../services/store.js';
import { getUserRole } from '../services/permissions.js';

export function cookieName() {
  return 'easylink_session';
}

export async function attachAuth(req, res, next) {
  const token = req.cookies?.[cookieName()];
  if (!token) {
    req.auth = null;
    return next();
  }
  const session = await verifySessionToken(token);
  if (!session) {
    req.auth = null;
    return next();
  }
  const people = await loadPeople();
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const role = getUserRole(session.user, peopleById);
  req.auth = {
    user: session.user,
    payload: session.payload,
    role,
    peopleById,
    passwordChangeOnly: session.payload.pwc === 1,
  };
  return next();
}

export function requireAuth(req, res, next) {
  if (!req.auth?.user) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  }
  return next();
}

export function requirePasswordChanged(req, res, next) {
  if (req.auth?.passwordChangeOnly) {
    return res.status(403).json({ ok: false, code: 'PASSWORD_CHANGE_REQUIRED' });
  }
  return next();
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.auth?.user) return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ ok: false, code: 'FORBIDDEN' });
    }
    return next();
  };
}
