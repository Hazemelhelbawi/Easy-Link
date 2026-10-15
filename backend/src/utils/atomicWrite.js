import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const writeQueues = new Map();

function queueFor(filePath) {
  if (!writeQueues.has(filePath)) writeQueues.set(filePath, Promise.resolve());
  return writeQueues;
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function atomicWriteJson(filePath, data) {
  const queues = queueFor(filePath);
  const run = queues.get(filePath).then(async () => {
    await ensureDir(path.dirname(filePath));
    const tmp = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    const payload = `${JSON.stringify(data, null, 2)}\n`;
    await fs.writeFile(tmp, payload, 'utf8');
    await fs.rename(tmp, filePath);
  });
  queues.set(filePath, run.catch(() => {}));
  await run;
}

export async function atomicWriteBuffer(filePath, buffer) {
  const queues = queueFor(filePath);
  const run = queues.get(filePath).then(async () => {
    await ensureDir(path.dirname(filePath));
    const tmp = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    await fs.writeFile(tmp, buffer);
    await fs.rename(tmp, filePath);
  });
  queues.set(filePath, run.catch(() => {}));
  await run;
}

export async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}
