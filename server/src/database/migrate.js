#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const RESET = process.argv.includes('--reset');

// A chunk often begins with the file's comment header or a comment describing the
// table. Strip those leading comment lines instead of discarding the whole chunk —
// dropping it would silently skip the CREATE TABLE that follows the comment.
function stripLeadingComments(statement) {
  const lines = statement.split(/\r?\n/);
  while (lines.length > 0) {
    const first = lines[0].trim();
    if (first === '' || first.startsWith('--')) lines.shift();
    else break;
  }
  return lines.join('\n').trim();
}

function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => stripLeadingComments(s.trim()))
    .filter((s) => s.length > 0);
}

async function ensureDatabase() {
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });
  try {
    if (RESET) {
      console.log(`[db] dropping database ${env.db.database}`);
      await conn.query(`DROP DATABASE IF EXISTS \`${env.db.database}\``);
    }
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await conn.end();
  }
}

async function runSqlite() {
  const env = require('../config/env');
  const db = require('../config/db');
  const schemaPath = path.join(__dirname, 'sqlite-schema.sql');

  if (RESET && env.db.file !== ':memory:' && fs.existsSync(env.db.file)) {
    console.log(`[db] removing ${env.db.file}`);
    // Drop the whole file, along with the write-ahead log beside it.
    await db.pool.end();
    for (const suffix of ['', '-wal', '-shm']) {
      try { fs.unlinkSync(env.db.file + suffix); } catch (_) { /* not present */ }
    }
    // Reload the module so a fresh handle opens the recreated file.
    delete require.cache[require.resolve('../config/db')];
    delete require.cache[require.resolve('../config/db/sqliteDriver')];
  }

  const fresh = require('../config/db');
  fresh.exec(fs.readFileSync(schemaPath, 'utf8'));
  fresh.exec(
    "INSERT OR IGNORE INTO schema_migrations (filename) VALUES ('sqlite-schema.sql')"
  );
  console.log(`[db] sqlite schema applied to ${env.db.file}`);
  console.log('[db] migrations done.');
  await fresh.pool.end();
}

async function run() {
  if (require('../config/env').db.client === 'sqlite') return runSqlite();
  await ensureDatabase();

  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
  });

  try {
    await conn.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    const [applied] = await conn.query('SELECT filename FROM schema_migrations');
    const appliedSet = new Set(applied.map((row) => row.filename));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let ranAny = false;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[db] skip ${file} (already applied)`);
        continue;
      }
      const full = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(full, 'utf8');
      console.log(`[db] apply ${file}`);
      const statements = splitStatements(sql);
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      await conn.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
      ranAny = true;
    }

    if (!ranAny) console.log('[db] nothing new to apply.');
    console.log('[db] migrations done.');
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error('[db] migration failed:', err.message);
  process.exit(1);
});
