import crypto from 'crypto';
import { initDataDirs, loadConfig, saveConfig, loadUsers, saveUsers, ensurePeopleSeed } from '../src/services/store.js';
import { generateTempPassword, hashPassword } from '../src/utils/passwords.js';

async function main() {
  await initDataDirs();
  await ensurePeopleSeed();
  const config = await loadConfig();
  if (config.bootstrapCompleted) {
    console.error('Bootstrap already completed. Refusing to reset admin.');
    process.exit(1);
  }
  const users = await loadUsers();
  if (users.some((u) => u.role === 'admin')) {
    console.error('An admin user already exists. Mark bootstrap completed manually if needed.');
    process.exit(1);
  }

  const password = generateTempPassword(14);
  const admin = {
    id: 'u-admin',
    username: 'admin',
    role: 'admin',
    personId: null,
    active: true,
    mustChangePassword: true,
    tempPasswordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tokenVersion: 0,
    passwordHash: await hashPassword(password),
  };
  users.push(admin);
  await saveUsers(users);
  await saveConfig({ ...config, bootstrapCompleted: true });

  console.log('=== ONE-TIME ADMIN BOOTSTRAP CREDENTIAL ===');
  console.log(`Username: ${admin.username}`);
  console.log(`Password: ${password}`);
  console.log('Store this password securely. It will NOT be shown again.');
  console.log('You must change it on first login.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
