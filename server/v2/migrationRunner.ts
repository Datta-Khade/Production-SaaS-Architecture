/**
 * Migration Runner — Auto-applies pending SQL migrations on startup
 * 
 * Rules:
 * - Every schema change = new .sql file in migrations/NNNN_description.sql
 * - NEVER modify an existing migration file after it has been applied
 * - NEVER run migrations manually — this runner handles it
 * - Migrations are tracked in a _migrations table
 * - Naming: 0001_init_master.sql, 0002_create_users.sql, etc.
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { logger } from '../lib/logger.js';

const { Pool } = pg;

interface MigrationRecord {
  name: string;
  applied_at: Date;
}

/**
 * Ensure the _migrations tracking table exists.
 */
const ensureMigrationsTable = async (pool: pg.Pool): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE,
      applied_at  TIMESTAMP DEFAULT NOW()
    );
  `);
};

/**
 * Get list of already-applied migrations.
 */
const getAppliedMigrations = async (pool: pg.Pool): Promise<Set<string>> => {
  const result = await pool.query<MigrationRecord>('SELECT name FROM _migrations ORDER BY id');
  return new Set(result.rows.map((r) => r.name));
};

/**
 * Read all .sql files from the migrations directory, sorted by name.
 */
const getPendingMigrations = (migrationsDir: string, applied: Set<string>): string[] => {
  if (!fs.existsSync(migrationsDir)) {
    logger.warn({ migrationsDir }, 'Migrations directory not found');
    return [];
  }

  const allFiles = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // Lexicographic sort — 0001, 0002, etc.

  return allFiles.filter((f) => !applied.has(f));
};

/**
 * Run all pending migrations against a database.
 * 
 * @param dbUrl - PostgreSQL connection string
 * @param migrationsDir - Path to directory containing .sql files
 */
export const runMigrations = async (
  dbUrl: string,
  migrationsDir: string
): Promise<void> => {
  const pool = new Pool({
    connectionString: dbUrl,
    max: 1, // Only 1 connection for migrations
  });

  try {
    await ensureMigrationsTable(pool);
    const applied = await getAppliedMigrations(pool);
    const pending = getPendingMigrations(migrationsDir, applied);

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info({ count: pending.length, migrations: pending }, 'Running pending migrations...');

    for (const fileName of pending) {
      const filePath = path.join(migrationsDir, fileName);
      const sql = fs.readFileSync(filePath, 'utf-8');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [fileName]);
        await client.query('COMMIT');
        logger.info({ migration: fileName }, '✅ Migration applied');
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ migration: fileName, error: (err as Error).message }, '❌ Migration failed — rolled back');
        throw err; // Stop on first failure
      } finally {
        client.release();
      }
    }

    logger.info({ count: pending.length }, 'All migrations applied successfully');
  } finally {
    await pool.end();
  }
};

/**
 * Run migrations for a specific tenant database.
 * Used when provisioning new tenants or on server startup.
 */
export const runTenantMigrations = async (
  tenantDbUrl: string,
  migrationsDir?: string
): Promise<void> => {
  const dir = migrationsDir || path.resolve(process.cwd(), 'migrations', 'tenant');
  await runMigrations(tenantDbUrl, dir);
};

// ── CLI Entry Point ─────────────────────────────────────────
// Runs when executed directly via: tsx server/v2/migrationRunner.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

const isDirectRun = process.argv[1]?.includes('migrationRunner');

if (isDirectRun) {
  const masterDbUrl = process.env.MASTER_DATABASE_URL;
  const tenantDbUrl = process.env.DATABASE_URL;

  if (!masterDbUrl) {
    console.error('❌ MASTER_DATABASE_URL not set in .env.development');
    process.exit(1);
  }

  (async () => {
    try {
      console.log('🗄️  Running migrations on master DB...');
      const masterDir = path.resolve(process.cwd(), 'migrations', 'master');
      await runMigrations(masterDbUrl, masterDir);

      if (tenantDbUrl) {
        console.log('🗄️  Running migrations on tenant dev DB...');
        const tenantDir = path.resolve(process.cwd(), 'migrations', 'tenant');
        await runMigrations(tenantDbUrl, tenantDir);
      }

      console.log('✅ All migrations complete!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Migration failed:', (err as Error).message);
      process.exit(1);
    }
  })();
}
