import { normalizeKey } from '../utils/normalize.js';

export function getUserRole(user, peopleById) {
  if (!user) return null;
  if (user.role === 'admin' || user.role === 'top') return user.role;
  const person = user.personId ? peopleById.get(user.personId) : null;
  if (user.role === 'manager' || person?.orgRole === 'manager') return 'manager';
  if (user.role === 'ict' || person?.orgRole === 'ict') return 'ict';
  return user.role || 'employee';
}

export function getTeamMemberIds(managerPersonId, people) {
  const ids = new Set([managerPersonId]);
  for (const p of people) {
    if (p.managerId === managerPersonId) ids.add(p.id);
  }
  return ids;
}

export function wouldCreateCycle(people, personId, newManagerId) {
  if (!newManagerId) return false;
  if (personId === newManagerId) return true;
  const byId = new Map(people.map((p) => [p.id, p]));
  let current = newManagerId;
  const seen = new Set();
  while (current) {
    if (current === personId) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    current = byId.get(current)?.managerId || null;
  }
  return false;
}

/** @param {import('./reportCache.js').OrderRow} row */
export function canViewRow(user, role, people, row) {
  if (!user?.active) return false;
  if (role === 'admin' || role === 'top') return true;
  if (role === 'manager') {
    const team = getTeamMemberIds(user.personId, people);
    return !!(row.personId && team.has(row.personId));
  }
  if (role === 'ict') {
    if (row.ict) return true;
    if (row.personId && row.personId === user.personId) return true;
    return false;
  }
  if (role === 'employee') {
    return row.personId === user.personId;
  }
  return false;
}

export function filterVisibleRows(user, role, people, rows) {
  return rows.filter((row) => canViewRow(user, role, people, row));
}

export function canViewPersonMetrics(user, role, people, targetPersonId) {
  if (!targetPersonId) return false;
  if (role === 'admin' || role === 'top') return true;
  if (role === 'manager') {
    const team = getTeamMemberIds(user.personId, people);
    return team.has(targetPersonId);
  }
  if (role === 'ict') {
    return targetPersonId === user.personId;
  }
  return targetPersonId === user.personId;
}

export function leaderboardEligiblePeople(people, users, config) {
  const userByPerson = new Map(users.filter((u) => u.personId).map((u) => [u.personId, u]));
  return people.filter((p) => {
    const u = userByPerson.get(p.id);
    const role = u?.role || p.orgRole;
    if (role === 'admin' || role === 'top') {
      return config.leaderboardIncludeLeadership === true;
    }
    return ['employee', 'manager', 'ict'].includes(role) || ['employee', 'manager', 'ict'].includes(p.orgRole);
  });
}

export function matchSearch(row, q) {
  if (!q) return true;
  const needle = normalizeKey(q);
  return (
    normalizeKey(row.companyName).includes(needle) ||
    normalizeKey(row.msisdn).includes(needle) ||
    normalizeKey(row.orderIdentifier).includes(needle)
  );
}
