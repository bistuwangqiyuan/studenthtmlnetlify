const { Pool } = require('pg');

let pool;

const createPool = () => {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    throw new Error('Environment variable NEON_DATABASE_URL is not set.');
  }

  return new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  });
};

const getPool = () => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

const query = async (text, params = []) => {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

module.exports = {
  query,
};

