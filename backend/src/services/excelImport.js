import XLSX from "xlsx";
import fs from "fs/promises";
import {
  normalizeHeader,
  msisdnToText,
  toNumber,
  toMonth,
  normalizeKey,
} from "../utils/normalize.js";

const REQUIRED_SHEETS = [
  { key: "applied", names: ["2026 report", "2026 Report"] },
  { key: "underActivation", names: ["under activation", "Under Activation"] },
  { key: "lost", names: ["lost report", "Lost Report"] },
];

const HEADER_MARKER = "kam name";

export function findSheet(workbook, aliases) {
  const trimmedNames = workbook.SheetNames.map((n) => ({
    raw: n,
    trim: String(n).trim(),
  }));
  for (const alias of aliases) {
    const target = alias.toLowerCase();
    const hit = trimmedNames.find((s) => s.trim.toLowerCase() === target);
    if (hit) return hit.raw;
  }
  return null;
}

function sheetToMatrix(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
}

export function detectHeaderRow(matrix) {
  const limit = Math.min(10, matrix.length);
  for (let r = 0; r < limit; r += 1) {
    const row = matrix[r] || [];
    for (const cell of row) {
      if (normalizeKey(normalizeHeader(cell)) === HEADER_MARKER) return r;
    }
  }
  return -1;
}

export function buildColumnMap(headerRow) {
  /** @type {Record<string, number>} */
  const counts = {};
  /** @type {Record<string, number>} */
  const map = {};

  headerRow.forEach((cell, idx) => {
    const base = normalizeHeader(cell);
    if (!base) return;
    const keyBase = base;
    counts[keyBase] = (counts[keyBase] || 0) + 1;
    const suffix = counts[keyBase] > 1 ? `_${counts[keyBase]}` : "";
    const field = `${keyBase}${suffix}`;
    map[field] = idx;
  });

  const normalized = {};
  for (const [k, v] of Object.entries(map)) {
    normalized[normalizeHeader(k).toLowerCase()] = v;
    normalized[k] = v;
  }
  return { map, normalized };
}

function colIndex(normalized, ...names) {
  for (const name of names) {
    const key = name.toLowerCase();
    if (normalized[key] !== undefined) return normalized[key];
  }
  return -1;
}

function cell(row, idx) {
  if (idx < 0) return "";
  return row[idx] ?? "";
}

const MONTH_ALIASES = [
  "month",
  "report month",
  "reporting month",
  "activation month",
  "billing month",
  "order month",
  "date",
  "daet",
  "created date",
  "activation date",
  "report date",
  "submission date",
  "service date",
  "order date",
];

function matchesMonthHeader(value) {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!text) return false;
  return (
    text.includes("month") ||
    text.includes("date") ||
    text.includes("daet") ||
    text.includes("created") ||
    text.includes("activation") ||
    text.includes("report") ||
    text.includes("submission") ||
    text.includes("service") ||
    text.includes("order")
  );
}

function monthCandidatesForStatus(status) {
  const base = [
    "month",
    "report month",
    "reporting month",
    "activation month",
    "billing month",
    "order month",
  ];

  if (status === "applied") return base;

  return [
    "date",
    "daet",
    "created date",
    "activation date",
    "report date",
    "submission date",
    "service date",
    "order date",
    ...base,
  ];
}

function findMonthColumnIndex(headerRow, normalized, status) {
  const preferred = monthCandidatesForStatus(status);
  const exact = colIndex(normalized, ...preferred);
  if (exact >= 0) return exact;

  const fallback = [
    "month",
    "date",
    "created date",
    "activation date",
    "report date",
    "submission date",
    "service date",
    "order date",
  ];

  for (let i = 0; i < headerRow.length; i += 1) {
    const header = normalizeHeader(headerRow[i]);
    if (!header) continue;
    const lower = header.toLowerCase();
    if (fallback.some((key) => lower === key || lower.includes(key))) return i;
  }

  return -1;
}

function rowMonthValue(row, idxMonth) {
  if (idxMonth < 0) return null;
  const raw = row[idxMonth];
  if (raw === null || raw === undefined || raw === "") return null;
  return toMonth(raw);
}

export function parseWorkbookBuffer(buffer, reportingYear) {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  } catch {
    throw importError("INVALID_XLSX", "Malformed workbook");
  }

  const sheets = {};
  for (const req of REQUIRED_SHEETS) {
    const name = findSheet(workbook, req.names);
    if (!name)
      throw importError("MISSING_SHEET", `Missing sheet: ${req.names[0]}`);
    sheets[req.key] = workbook.Sheets[name];
  }

  const parsed = {
    applied: parseSheet(sheets.applied, "applied", reportingYear),
    underActivation: parseSheet(
      sheets.underActivation,
      "underActivation",
      reportingYear,
    ),
    lost: parseSheet(sheets.lost, "lost", reportingYear),
  };

  return parsed;
}

function parseSheet(sheet, status, reportingYear) {
  const matrix = sheetToMatrix(sheet);
  const headerIdx = detectHeaderRow(matrix);
  if (headerIdx < 0)
    throw importError(
      "MISSING_HEADER",
      `KAM Name header not found (${status})`,
    );

  const { normalized } = buildColumnMap(matrix[headerIdx]);
  const idxKam = colIndex(normalized, "kam name");
  if (idxKam < 0)
    throw importError("MISSING_HEADER", "KAM Name column missing");

  const idxCompany = colIndex(normalized, "company name");
  const idxOrders = colIndex(normalized, "# of orders", "# of Orders");
  const idxMsisdn = colIndex(normalized, "msisdn");
  const idxPackage = colIndex(normalized, "package");
  const idxMrc = colIndex(normalized, "mrc");
  const idxType = colIndex(normalized, "type");
  const idxStatus = colIndex(normalized, "status");
  const idxStatus2 = colIndex(normalized, "status_2");
  const idxRevenue = colIndex(normalized, "revenue", "revenue ");
  const idxMonth = findMonthColumnIndex(matrix[headerIdx], normalized, status);
  const idxKamStatus = colIndex(normalized, "kam status", "kam status ");
  const idxPending = colIndex(
    normalized,
    "pending with ...",
    "pending with ... ",
    "pending with",
    "under activation ",
  );
  const idxAuthorizedName = colIndex(
    normalized,
    "authorized name",
    "authorised name",
    "customer name",
    "contact name",
  );
  const idxAuthorizedMobile = colIndex(
    normalized,
    "mobile",
    "authorized mobile",
    "authorised mobile",
    "contact mobile",
    "customer mobile",
    "contact number",
  );

  /** @type {import('./reportCache.js').OrderRow[]} */
  const rows = [];

  for (let r = headerIdx + 1; r < matrix.length; r += 1) {
    const row = matrix[r];
    if (!row) continue;
    const kamRaw = cell(row, idxKam);
    if (!String(kamRaw).trim()) continue;

    const stage =
      status === "lost"
        ? cell(row, idxStatus2 >= 0 ? idxStatus2 : idxStatus)
        : status === "underActivation"
          ? cell(row, idxPending >= 0 ? idxPending : idxStatus)
          : cell(row, idxStatus);

    rows.push({
      id: `${status}-${r + 1}`,
      status,
      sourceSheet: status,
      sourceRow: r + 1,
      kamNameOriginal: String(kamRaw).trim(),
      kamName: String(kamRaw).trim(),
      kamStatus: String(cell(row, idxKamStatus)).trim(),
      companyName: String(cell(row, idxCompany)).trim(),
      authorizedName: String(cell(row, idxAuthorizedName)).trim(),
      authorizedMobile: msisdnToText(cell(row, idxAuthorizedMobile)),
      orderIdentifier: String(cell(row, idxOrders)).trim(),
      msisdn: msisdnToText(cell(row, idxMsisdn)),
      packageName: String(cell(row, idxPackage)).trim(),
      mrc: toNumber(cell(row, idxMrc)),
      type: String(cell(row, idxType)).trim(),
      statusText: String(cell(row, idxStatus)).trim(),
      stage: String(stage).trim(),
      revenue:
        status === "applied" || status === "lost"
          ? toNumber(cell(row, idxRevenue))
          : 0,
      month: rowMonthValue(row, idxMonth),
      reportingYear,
    });
  }

  return rows;
}

function importError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

export async function validateAndParseFile(filePath, reportingYear) {
  const buffer = await fs.readFile(filePath);
  if (buffer.length > 50 * 1024 * 1024)
    throw importError("FILE_TOO_LARGE", "File exceeds 50MB");
  const sig = buffer.subarray(0, 2).toString("utf8");
  if (sig !== "PK") throw importError("INVALID_XLSX", "Not a valid XLSX file");
  return parseWorkbookBuffer(buffer, reportingYear);
}
