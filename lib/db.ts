import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

console.log(
  'DATABASE_URL:',
  connectionString ? 'CONFIGURADA' : 'NO CONFIGURADA'
);

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false
    }
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}