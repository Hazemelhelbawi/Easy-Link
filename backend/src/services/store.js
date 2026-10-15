import fs from 'fs/promises';
import crypto from 'crypto';
import { paths, defaultConfig } from '../config.js';
import { atomicWriteJson, readJson, ensureDir } from '../utils/atomicWrite.js';
import { buildSeedPeople } from '../data/seedPeople.js';

let importLock = Promise.resolve();

export function withImportLock(fn) {
  const run = importLock.then(fn);
  importLock = run.catch(() => {});
  return run;
}

export async function initDataDirs() {
  await ensureDir(paths.data);
  await ensureDir(paths.uploadsTmp);
}

export async function getOrCreateJwtSecret() {
  try {
    return (await fs.readFile(paths.jwtSecret, 'utf8')).trim();
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    const secret = crypto.randomBytes(48).toString('hex');
    await ensureDir(paths.data);
    await fs.writeFile(paths.jwtSecret, secret, { encoding: 'utf8', mode: 0o600 });
    return secret;
  }
}

export async function loadConfig() {
  const cfg = await readJson(paths.config, null);
  if (!cfg) {
    const initial = { ...defaultConfig, bootstrapCompleted: false };
    await atomicWriteJson(paths.config, initial);
    return initial;
  }
  return { ...defaultConfig, ...cfg };
}

export async function saveConfig(config) {
  await atomicWriteJson(paths.config, config);
}

export async function loadPeople() {
  const people = await readJson(paths.people, null);
  if (!people) {
    const seed = buildSeedPeople();
    await atomicWriteJson(paths.people, { people: seed });
    return seed;
  }
  return people.people || [];
}

export async function savePeople(people) {
  await atomicWriteJson(paths.people, { people });
}

export async function loadUsers() {
  const data = await readJson(paths.users, { users: [] });
  return data.users || [];
}

export async function saveUsers(users) {
  await atomicWriteJson(paths.users, { users });
}

export async function loadMetadata() {
  return readJson(paths.metadata, {
    lastUploadAt: null,
    rowCounts: { applied: 0, underActivation: 0, lost: 0 },
    reportingYear: defaultConfig.reportingYear,
  });
}

export async function saveMetadata(metadata) {
  await atomicWriteJson(paths.metadata, metadata);
}

export async function ensurePeopleSeed() {
  const existing = await readJson(paths.people, null);
  if (!existing) {
    await loadPeople();
  }
}
