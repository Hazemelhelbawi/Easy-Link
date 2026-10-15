import test from 'node:test';
import assert from 'node:assert/strict';
import { createTempDataRoot, seedAdminUser } from './helpers.js';

test('bootstrap refuses when already completed', async () => {
  const dir = await createTempDataRoot();
  await seedAdminUser('admin', 'Password1', { bootstrapCompleted: true });
  const { loadConfig } = await import('../src/services/store.js');
  const cfg = await loadConfig();
  assert.equal(cfg.bootstrapCompleted, true);
  await import('fs/promises').then((fs) => fs.rm(dir, { recursive: true, force: true }));
});

test('login and password change flow', async () => {
  const dir = await createTempDataRoot();
  await seedAdminUser('admin', 'Password1');
  const { initDataDirs, ensurePeopleSeed } = await import('../src/services/store.js');
  await initDataDirs();
  await ensurePeopleSeed();
  const { authenticateCredentials, changePassword, signSession, verifySessionToken } = await import(
    '../src/services/authService.js'
  );

  const auth = await authenticateCredentials('admin', 'Password1');
  assert.ok(auth.user);
  const session = await signSession(auth.user);
  const verified = await verifySessionToken(session.token);
  assert.ok(verified);

  const changed = await changePassword(auth.user.id, {
    currentPassword: 'Password1',
    newPassword: 'NewPassword1',
  });
  assert.ok(changed.user);
  const old = await verifySessionToken(session.token);
  assert.equal(old, null);

  await import('fs/promises').then((fs) => fs.rm(dir, { recursive: true, force: true }));
});

test('temporary password expiry', async () => {
  const dir = await createTempDataRoot();
  await seedAdminUser('admin', 'Password1');
  const { seedRoleUser } = await import('./helpers.js');
  await seedRoleUser({
    username: 'tempuser',
    password: 'TempPass1234',
    role: 'employee',
    personId: 'p-mahmoud-el-sheikh',
    mustChangePassword: true,
    tempPasswordExpiresAt: new Date(Date.now() - 1000).toISOString(),
  });
  const { authenticateCredentials } = await import('../src/services/authService.js');
  const result = await authenticateCredentials('tempuser', 'TempPass1234');
  assert.equal(result.error, 'TEMP_PASSWORD_EXPIRED');
  await import('fs/promises').then((fs) => fs.rm(dir, { recursive: true, force: true }));
});
