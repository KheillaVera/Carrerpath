const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

async function start() {
  try {
    await db.ping();
    console.log(`[db] connected to ${db.describe()}`);
  } catch (err) {
    console.error(
      env.db.client === 'sqlite'
        ? `[db] could not open the local database at ${env.db.file}. Run: npm run db:migrate`
        : '[db] connection failed. Check .env and that MySQL is running.'
    );
    console.error(err.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`[api] PathAura listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`\n[api] received ${signal}, shutting down`);
    server.close(() => {
      db.pool.end().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
