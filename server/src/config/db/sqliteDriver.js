const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { translate } = require('./sqlDialect');

/**
 * SQLite driver for local development.
 *
 * Presents the same interface as the MySQL driver — `query`, `withTransaction`,
 * `ping` — so no service or controller knows which database it is talking to.
 * SQLite runs inside this process, so there is no server to install or start.
 */

function isSelect(sql) {
  return /^\s*(SELECT|WITH|PRAGMA)\b/i.test(sql);
}

function createDriver(env) {
  const file = env.db.file;
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }

  const handle = new DatabaseSync(file);
  // Write-ahead logging keeps reads working during a write; foreign keys are
  // off by default in SQLite and must be asked for explicitly.
  handle.exec('PRAGMA journal_mode = WAL');
  handle.exec('PRAGMA foreign_keys = ON');
  handle.exec('PRAGMA busy_timeout = 5000');

  function run(sql, params = []) {
    const translated = translate(sql);
    // mysql2 accepts undefined for an omitted value; SQLite will not bind it.
    const bound = (params || []).map((value) => {
      if (value === undefined) return null;
      if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ');
      if (typeof value === 'boolean') return value ? 1 : 0;
      return value;
    });

    const statement = handle.prepare(translated);
    if (isSelect(translated)) {
      return statement.all(...bound);
    }
    const result = statement.run(...bound);
    return {
      insertId: Number(result.lastInsertRowid),
      affectedRows: Number(result.changes),
      changedRows: Number(result.changes),
    };
  }

  // Mirrors the shape mysql2 returns, so `const [rows] = await conn.query(...)`
  // keeps working inside transactions.
  const connection = {
    query: async (sql, params) => [run(sql, params)],
    release: () => {},
  };

  async function query(sql, params) {
    return run(sql, params);
  }

  async function withTransaction(work) {
    handle.exec('BEGIN');
    try {
      const result = await work(connection);
      handle.exec('COMMIT');
      return result;
    } catch (err) {
      try { handle.exec('ROLLBACK'); } catch (_) { /* the transaction is already gone */ }
      throw err;
    }
  }

  async function ping() {
    handle.prepare('SELECT 1').get();
  }

  return {
    client: 'sqlite',
    handle,
    query,
    withTransaction,
    ping,
    exec: (sql) => handle.exec(sql),
    // seed.js closes the pool when it finishes; the equivalent here is closing
    // the file handle.
    pool: { end: async () => { try { handle.close(); } catch (_) { /* already closed */ } } },
    describe: () => `sqlite:${file}`,
  };
}

module.exports = { createDriver };
