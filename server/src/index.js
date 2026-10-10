const { createApp } = require('./app');
const { createPool, migrate } = require('./db');

const PORT = process.env.PORT || 4000;

async function start() {
  const pool = createPool();
  await migrate(pool);
  createApp(pool).listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
