// Stockage des réponses.
// - Si DATABASE_URL est défini (ex. sur Render), on utilise Postgres (durable).
// - Sinon, on retombe sur un simple fichier JSON local (pratique en dev).
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.DATA_FILE || join(__dirname, 'responses.json');
const DATABASE_URL = process.env.DATABASE_URL;

let pgPool = null;
let ready = null;

async function initPg() {
  const { default: pg } = await import('pg');
  pgPool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pgPool.query(
    `CREATE TABLE IF NOT EXISTS responses (
       name TEXT PRIMARY KEY,
       data JSONB NOT NULL,
       submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`
  );
}

function ensureReady() {
  if (!ready) ready = DATABASE_URL ? initPg() : Promise.resolve();
  return ready;
}

export const usingPostgres = Boolean(DATABASE_URL);

export async function loadResponses() {
  await ensureReady();
  if (pgPool) {
    const { rows } = await pgPool.query('SELECT name, data FROM responses');
    const out = {};
    for (const row of rows) out[row.name] = row.data;
    return out;
  }
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

export async function saveResponse(name, record) {
  await ensureReady();
  if (pgPool) {
    await pgPool.query(
      `INSERT INTO responses (name, data, submitted_at)
       VALUES ($1, $2, now())
       ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, submitted_at = now()`,
      [name, record]
    );
    return;
  }
  const all = await loadResponses();
  all[name] = record;
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(all, null, 2));
}
