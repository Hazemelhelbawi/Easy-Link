import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs/promises';
import { createTempDataRoot, seedAdminUser, writeFixtureWorkbook } from './helpers.js';

test('valid workbook import and replacement', async () => {
  const dir = await createTempDataRoot();
  await seedAdminUser('admin', 'Password1');
  const { initDataDirs, ensurePeopleSeed } = await import('../src/services/store.js');
  await initDataDirs();
  await ensurePeopleSeed();

  const tmp = path.join(dir, 'data', 'tmp-upload.xlsx');
  await writeFixtureWorkbook(tmp);
  const { commitWorkbookReplacement, getReportCache } = await import('../src/services/reportCache.js');
  const result = await commitWorkbookReplacement(tmp);
  assert.ok(result.rowCounts.applied >= 3);
  assert.equal(getReportCache().rows.length, result.rowCounts.applied + result.rowCounts.underActivation + result.rowCounts.lost);
  await fs.rm(dir, { recursive: true, force: true });
});

test('invalid workbook rejected without replacing active file', async () => {
  const dir = await createTempDataRoot();
  await seedAdminUser('admin', 'Password1');
  const { initDataDirs, ensurePeopleSeed } = await import('../src/services/store.js');
  await initDataDirs();
  await ensurePeopleSeed();
  const good = path.join(dir, 'data', 'good.xlsx');
  await writeFixtureWorkbook(good);
  const { commitWorkbookReplacement, rebuildCacheFromDisk, getReportCache } = await import('../src/services/reportCache.js');
  await commitWorkbookReplacement(good);
  const before = getReportCache().rows.length;

  const bad = path.join(dir, 'data', 'bad.xlsx');
  await fs.writeFile(bad, 'not-a-xlsx');
  await assert.rejects(() => commitWorkbookReplacement(bad));
  await rebuildCacheFromDisk();
  assert.equal(getReportCache().rows.length, before);
  await fs.rm(dir, { recursive: true, force: true });
});
