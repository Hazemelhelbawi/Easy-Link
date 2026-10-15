/** @typedef {{ id: string, displayName: string, username: string, aliases: string[], managerId: string | null, group: string, orgRole: string }} Person */

/** @returns {Person[]} */
export function buildSeedPeople() {
  const top = [
    ['p-abu-hamad', 'Abu Hamad'],
    ['p-abdulrahman', 'Abdulrahman'],
    ['p-al-tayeb', 'Al-Tayeb'],
  ];
  const hossamId = 'p-hossam-hassaneen';
  const basharId = 'p-bashar-masoad';

  /** @type {Person[]} */
  const people = [];

  for (const [id, name] of top) {
    people.push({
      id,
      displayName: name,
      username: id.replace(/^p-/, ''),
      aliases: [normalizeAlias(name)],
      managerId: null,
      group: 'leadership',
      orgRole: 'top',
    });
  }

  people.push({
    id: hossamId,
    displayName: 'Hossam Hassaneen',
    username: 'hossam.hassaneen',
    aliases: [normalizeAlias('Hossam Hassaneen')],
    managerId: null,
    group: 'outsource',
    orgRole: 'manager',
  });

  people.push({
    id: basharId,
    displayName: 'Bashar Masoad',
    username: 'bashar.masoad',
    aliases: [normalizeAlias('Bashar Masoad'), normalizeAlias('i c t')],
    managerId: null,
    group: 'ict',
    orgRole: 'ict',
  });

  const outsourceTeam = [
    'Ahmed SH',
    'Bahaa Hamid',
    'Osama Magdy',
    'Ehab Hassan',
    'Jayzon',
    'Mohamed Hasab El Rasoul',
    'Manhal Aldrwish',
    'Salama Al Akhras',
    'Mohamed Mostafa',
    'muhamad alshaykh',
    'Mohammed Alamin',
    'Salem Salem',
    'Aratek',
    'Feeri Logis',
    'sparks',
    'Out Source 95',
    'Othman Ahmed',
  ];

  for (const name of outsourceTeam) {
    const id = slugId(name);
    const aliases = [normalizeAlias(name)];
    if (normalizeAlias(name) === normalizeAlias('Ehab Hassan')) {
      aliases.push(normalizeAlias('Ehab Hassan 2'));
    }
    people.push({
      id,
      displayName: name,
      username: id.replace(/^p-/, ''),
      aliases,
      managerId: hossamId,
      group: 'outsource',
      orgRole: 'employee',
    });
  }

  const independent = [
    'Mahmoud El-sheikh',
    'Khawlh Mazen',
    'Mohamed Mahrous',
    'khaled Alsayed',
    'Alaa Obeid',
  ];

  for (const name of independent) {
    const id = slugId(name);
    people.push({
      id,
      displayName: name,
      username: id.replace(/^p-/, ''),
      aliases: [normalizeAlias(name)],
      managerId: null,
      group: 'independent',
      orgRole: 'employee',
    });
  }

  return people;
}

function normalizeAlias(name) {
  return String(name).trim().replace(/\s+/g, ' ').toLowerCase();
}

function slugId(name) {
  const base = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `p-${base}`;
}
