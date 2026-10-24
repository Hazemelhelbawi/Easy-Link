import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import XLSX from 'xlsx';
import { hashPassword } from '../src/utils/passwords.js';

export async function createTempDataRoot() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'easylink-test-'));
  await fs.mkdir(path.join(dir, 'data'), { recursive: true });
  process.env.EASYLINK_DATA_DIR = dir;
  return dir;
}

export async function writeFixtureWorkbook(filePath) {
  const headers = [
    'KAM Name',
    'KAM Status',
    'Company Name',
    'Authorized Name',
    'Authorized Mobile',
    '# of Orders',
    'MSISDN',
    'Package',
    'MRC',
    'Type',
    'Status',
    'Revenue',
    'month',
    'SFA',
  ];
  const applied = [
    headers,
    [
      'Ehab Hassan',
      'Active',
      'Acme Co',
      'Ali Customer',
      '0500100001',
      'ORD-1',
      '0500123456',
      'Gold',
      '100',
      'Mobile',
      'Done',
      '500',
      '1',
      '191575',
    ],
    [
      'Ehab Hassan 2',
      'Active',
      'Beta LLC',
      'Sara Customer',
      '0500100002',
      'ORD-2',
      '0500654321',
      'Silver',
      '80',
      'Mobile',
      'Done',
      '300',
      '1',
      '191575.0',
    ],
    [
      'Mahmoud El-sheikh',
      'Active',
      'Gamma',
      'Omar Customer',
      '0500100003',
      'ORD-3',
      '0500111111',
      'Gold',
      '120',
      'Mobile',
      'Done',
      '700',
      '2',
      '42',
    ],
    [
      'Unknown Person',
      'Active',
      'Hidden',
      'Hidden Customer',
      '0500100009',
      'ORD-9',
      '0500999999',
      'Gold',
      '50',
      'Mobile',
      'Done',
      '100',
      '2',
      '42',
    ],
  ];
  const under = [
    headers,
    [
      'Ahmed SH',
      'Active',
      'Delta',
      'Pending Customer',
      '0500100004',
      'ORD-4',
      '0500222222',
      'Bronze',
      '40',
      'Mobile',
      'Pending',
      '0',
      '2',
      '99',
    ],
  ];
  const underHeaders = [...headers, 'Pending with ...'];
  under[0] = underHeaders;
  under[1] = [...under[1], 'Sales'];

  const lostHeaders = [...headers, 'Status'];
  const lost = [
    lostHeaders,
    [
      'Bahaa Hamid',
      'Active',
      'Echo',
      'Lost Customer',
      '0500100005',
      'ORD-5',
      '0500333333',
      'Bronze',
      '40',
      'Mobile',
      'Rejected',
      '0',
      '2',
      '77',
      'Cancelled',
    ],
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(applied), '2026 Report');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(under), 'Under Activation');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(lost), 'Lost Report');
  XLSX.writeFile(wb, filePath);
}

export async function seedAdminUser(username, password, { bootstrapCompleted = true } = {}) {
  const { paths } = await import('../src/config.js');
  const { atomicWriteJson } = await import('../src/utils/atomicWrite.js');
  const { buildSeedPeople } = await import('../src/data/seedPeople.js');
  await atomicWriteJson(paths.people, { people: buildSeedPeople() });
  await atomicWriteJson(paths.config, {
    applicationName: 'EasyLink',
    reportingYear: 2026,
    currencyCode: 'SAR',
    currencyLabel: { ar: 'ر.س', en: 'SAR' },
    leaderboardShowRevenue: true,
    ictTypes: ['bent', 'dia', 'sip trunk', 'ip-vpn'],
    kamAliases: { 'ehab hassan 2': 'ehab hassan' },
    bootstrapCompleted,
  });
  await atomicWriteJson(paths.users, {
    users: [
      {
        id: 'u-admin-test',
        username,
        role: 'admin',
        personId: null,
        active: true,
        mustChangePassword: false,
        tokenVersion: 0,
        passwordHash: await hashPassword(password),
      },
    ],
  });
}

export async function seedRoleUser({ username, password, role, personId, mustChangePassword = false, tempPasswordExpiresAt = null }) {
  const { loadUsers, saveUsers } = await import('../src/services/store.js');
  const users = await loadUsers();
  users.push({
    id: `u-${username}`,
    username,
    role,
    personId,
    active: true,
    mustChangePassword,
    tempPasswordExpiresAt,
    tokenVersion: 0,
    passwordHash: await hashPassword(password),
  });
  await saveUsers(users);
}
