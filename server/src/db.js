const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');

function createPool(connectionString = process.env.DATABASE_URL) {
  return new Pool({ connectionString });
}

async function migrate(pool) {
  await pool.query(schema);
}

module.exports = { createPool, migrate, schema };
