const env = require('./env');

/**
 * Database access.
 *
 * Two drivers sit behind one interface. `DB_CLIENT=sqlite` (the local default)
 * runs the database inside this process — nothing to install, nothing to start,
 * and nothing for the operating system to kill when memory is tight.
 * `DB_CLIENT=mysql` is the production path and speaks the dialect the queries
 * are written in.
 *
 * Services never branch on the client: they call query() and withTransaction()
 * and get the same shapes either way.
 */
const driver = env.db.client === 'sqlite'
  ? require('./db/sqliteDriver').createDriver(env)
  : require('./db/mysqlDriver').createDriver(env);

module.exports = {
  client: driver.client,
  pool: driver.pool,
  query: driver.query,
  withTransaction: driver.withTransaction,
  ping: driver.ping,
  exec: driver.exec,
  describe: driver.describe,
  handle: driver.handle,
};
