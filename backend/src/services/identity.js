import { normalizeKey } from '../utils/normalize.js';

export function buildAliasMap(people, configAliases = {}) {
  /** @type {Map<string, string>} normalized alias -> personId */
  const map = new Map();

  for (const person of people) {
    for (const alias of person.aliases || []) {
      map.set(normalizeKey(alias), person.id);
    }
    map.set(normalizeKey(person.displayName), person.id);
    if (person.username) map.set(normalizeKey(person.username), person.id);
  }

  for (const [from, to] of Object.entries(configAliases || {})) {
    const targetKey = normalizeKey(to);
    let targetId = map.get(targetKey);
    if (!targetId) {
      for (const person of people) {
        if (normalizeKey(person.displayName) === targetKey) {
          targetId = person.id;
          break;
        }
      }
    }
    if (targetId) map.set(normalizeKey(from), targetId);
  }

  return map;
}

export function resolveKamPersonId(kamName, aliasMap) {
  const key = normalizeKey(kamName);
  if (!key) return null;
  return aliasMap.get(key) || null;
}

export function isIctRow(row, ictTypes) {
  const typeNorm = normalizeKey(row.type);
  const kamNorm = normalizeKey(row.kamNameOriginal || row.kamName);
  if (kamNorm === 'i c t') return true;
  return ictTypes.some((t) => normalizeKey(t) === typeNorm);
}
