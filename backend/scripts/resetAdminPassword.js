
import {
    initDataDirs,
    loadConfig,
    loadUsers,
    saveUsers,
  } from '../src/services/store.js';
  
  import {
    generateTempPassword,
    hashPassword,
  } from '../src/utils/passwords.js';
  
  async function main() {
    await initDataDirs();
  
    const config = await loadConfig();
  
    if (!config.bootstrapCompleted) {
      throw new Error(
        'Bootstrap is not completed. Refusing to reset password.'
      );
    }
  
    const users = await loadUsers();
  
    const admins = users.filter(
      (user) => user.username === 'admin' && user.role === 'admin'
    );
  
    if (admins.length !== 1) {
      throw new Error(
        `Expected exactly one admin account, found ${admins.length}.`
      );
    }
  
    const admin = admins[0];
    const password = generateTempPassword(14);
  
    admin.passwordHash = await hashPassword(password);
    admin.mustChangePassword = true;
    admin.tempPasswordExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();
  
    admin.tokenVersion = (admin.tokenVersion ?? 0) + 1;
  
    await saveUsers(users);
  
    console.log('=== ADMIN PASSWORD RESET SUCCESSFUL ===');
    console.log(`Username: ${admin.username}`);
    console.log(`Temporary password: ${password}`);
    console.log('Expires in: 7 days');
    console.log('Change the password after login.');
  }
  
  main().catch((error) => {
    console.error('Admin password reset failed:', error.message);
    process.exitCode = 1;
  });
  