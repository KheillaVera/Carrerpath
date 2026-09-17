const mysql = require('mysql2/promise');

/**
 * MySQL / MariaDB driver — the production path. Queries are written in this
 * dialect, so nothing is translated here.
 */
function createDriver(env) {
  const pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
    timezone: 'Z',
    namedPlaceholders: true,
  });

  async function query(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async function withTransaction(work) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await work(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async function ping() {
    const conn = await pool.getConnection();
    try {
      await conn.ping();
    } finally {
      conn.release();
    }
  }

  return {
    client: 'mysql',
    pool,
    query,
    withTransaction,
    ping,
    describe: () => `${env.db.host}:${env.db.port}/${env.db.database}`,
  };
}

module.exports = { createDriver };
