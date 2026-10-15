import fs from 'fs/promises';
import { paths } from '../config.js';
import { validateAndParseFile } from './excelImport.js';
import { buildAliasMap, resolveKamPersonId, isIctRow } from './identity.js';
import { loadConfig, loadPeople, saveMetadata, withImportLock } from './store.js';
import { atomicWriteBuffer } from '../utils/atomicWrite.js';

/** @typedef {'applied'|'underActivation'|'lost'} OrderStatus */

/**
 * @typedef {Object} OrderRow
 * @property {string} id
 * @property {OrderStatus} status
 * @property {string} sourceSheet
 * @property {number} sourceRow
 * @property {string} kamNameOriginal
 * @property {string} kamName
 * @property {string} kamStatus
 * @property {string} companyName
 * @property {string} orderIdentifier
 * @property {string} msisdn
 * @property {string} packageName
 * @property {number} mrc
 * @property {string} type
 * @property {string} statusText
 * @property {string} stage
 * @property {number} revenue
 * @property {number|null} month
 * @property {number} reportingYear
 * @property {string|null} [personId]
 * @property {boolean} [ict]
 */

let cache = {
  loaded: false,
  rows: /** @type {OrderRow[]} */ ([]),
  unassignedNames: /** @type {string[]} */ ([]),
  rowCounts: { applied: 0, underActivation: 0, lost: 0 },
  lastUploadAt: null,
};

export function getReportCache() {
  return cache;
}

function enrichRows(rows, people, config) {
  const aliasMap = buildAliasMap(people, config.kamAliases);
  const unassigned = new Map();

  const enriched = rows.map((row) => {
    const personId = resolveKamPersonId(row.kamNameOriginal, aliasMap);
    if (!personId) {
      unassigned.set(normalizeName(row.kamNameOriginal), row.kamNameOriginal);
    }
    return {
      ...row,
      personId,
      ict: isIctRow(row, config.ictTypes || []),
    };
  });

  return {
    rows: enriched,
    unassignedNames: [...unassigned.values()].sort((a, b) => a.localeCompare(b)),
  };
}

function normalizeName(v) {
  return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

function buildIndexes(rows) {
  const counts = { applied: 0, underActivation: 0, lost: 0 };
  for (const row of rows) counts[row.status] += 1;
  return counts;
}

export async function rebuildCacheFromDisk() {
  const config = await loadConfig();
  const people = await loadPeople();
  try {
    await fs.access(paths.currentXlsx);
  } catch {
    cache = {
      loaded: true,
      rows: [],
      unassignedNames: [],
      rowCounts: { applied: 0, underActivation: 0, lost: 0 },
      lastUploadAt: null,
    };
    return cache;
  }

  const parsed = await validateAndParseFile(paths.currentXlsx, config.reportingYear);
  const allRows = [...parsed.applied, ...parsed.underActivation, ...parsed.lost];
  const { rows, unassignedNames } = enrichRows(allRows, people, config);
  const metadata = await (await import('./store.js')).loadMetadata();
  cache = {
    loaded: true,
    rows,
    unassignedNames,
    rowCounts: buildIndexes(rows),
    lastUploadAt: metadata.lastUploadAt,
  };
  return cache;
}

export async function commitWorkbookReplacement(tempPath) {
  return withImportLock(async () => {
    const config = await loadConfig();
    const people = await loadPeople();
    const parsed = await validateAndParseFile(tempPath, config.reportingYear);
    const allRows = [...parsed.applied, ...parsed.underActivation, ...parsed.lost];
    const { rows, unassignedNames } = enrichRows(allRows, people, config);

    const buffer = await fs.readFile(tempPath);
    await atomicWriteBuffer(paths.currentXlsx, buffer);

    const now = new Date().toISOString();
    await saveMetadata({
      lastUploadAt: now,
      rowCounts: buildIndexes(rows),
      reportingYear: config.reportingYear,
    });

    cache = {
      loaded: true,
      rows,
      unassignedNames,
      rowCounts: buildIndexes(rows),
      lastUploadAt: now,
    };

    try {
      await fs.unlink(tempPath);
    } catch {
      /* ignore */
    }

    return {
      rowCounts: cache.rowCounts,
      lastUploadAt: now,
      unassignedCount: unassignedNames.length,
    };
  });
}

export function refreshIdentityOnPeopleChange(people, config) {
  if (!cache.loaded) return;
  const { rows, unassignedNames } = enrichRows(cache.rows, people, config);
  cache = { ...cache, rows, unassignedNames };
}
