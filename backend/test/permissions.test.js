import test from 'node:test';
import assert from 'node:assert/strict';
import { createTempDataRoot, seedAdminUser, writeFixtureWorkbook, seedRoleUser } from './helpers.js';
import path from 'path';

test('authorization visibility by role', async () => {
  const dir = await createTempDataRoot();
  await seedAdminUser('admin', 'Password1');
  const { paths } = await import('../src/config.js');
  const { initDataDirs, ensurePeopleSeed } = await import('../src/services/store.js');
  await initDataDirs();
  await ensurePeopleSeed();
  await writeFixtureWorkbook(path.join(dir, 'data', 'current.xlsx'));
  const { rebuildCacheFromDisk } = await import('../src/services/reportCache.js');
  await rebuildCacheFromDisk();

  await seedRoleUser({
    username: 'hossam',
    password: 'Password1',
    role: 'manager',
    personId: 'p-hossam-hassaneen',
  });
  await seedRoleUser({
    username: 'mahmoud',
    password: 'Password1',
    role: 'employee',
    personId: 'p-mahmoud-el-sheikh',
  });

  const { loadUsers, loadPeople } = await import('../src/services/store.js');
  const { getReportCache } = await import('../src/services/reportCache.js');
  const { filterVisibleRows, getUserRole } = await import('../src/services/permissions.js');

  const users = await loadUsers();
  const people = await loadPeople();
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const rows = getReportCache().rows;

  const hossam = users.find((u) => u.username === 'hossam');
  const mahmoud = users.find((u) => u.username === 'mahmoud');
  const hossamVisible = filterVisibleRows(hossam, getUserRole(hossam, peopleById), people, rows);
  const mahmoudVisible = filterVisibleRows(mahmoud, getUserRole(mahmoud, peopleById), people, rows);

  assert.ok(hossamVisible.some((r) => r.kamNameOriginal === 'Ehab Hassan'));
  assert.ok(!mahmoudVisible.some((r) => r.kamNameOriginal === 'Ehab Hassan'));
  assert.ok(mahmoudVisible.every((r) => r.personId === 'p-mahmoud-el-sheikh'));

  const ehabRows = rows.filter((r) => r.kamNameOriginal.toLowerCase().includes('ehab'));
  assert.equal(ehabRows.every((r) => r.personId === 'p-ehab-hassan'), true);

  await import('fs/promises').then((fs) => fs.rm(dir, { recursive: true, force: true }));
});
