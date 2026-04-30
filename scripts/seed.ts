/**
 * Seed Script — Populate databases for development
 *
 * Usage: npm run db:seed
 *
 * Creates:
 *   - 1 test tenant in master DB (domain: dev.localhost)
 *   - 3 test users in tenant DB
 *     ├── admin@dev.localhost  / Admin@1234  (superadmin)
 *     ├── manager@dev.localhost / Admin@1234  (manager)
 *     └── user@dev.localhost   / Admin@1234  (user)
 *
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING.
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'node:path';

// Load env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.development') });

const { Pool } = pg;

const MASTER_DB_URL = process.env.MASTER_DATABASE_URL!;
const TENANT_DB_URL = process.env.DATABASE_URL!;

if (!MASTER_DB_URL) {
  console.error('❌ MASTER_DATABASE_URL not set');
  process.exit(1);
}

const TEST_DOMAIN = 'dev.localhost';
const TEST_TUID   = 'dev-tenant';
const PASSWORD    = 'Admin@1234';

const TEST_USERS = [
  { email: 'admin@dev.localhost',   username: 'admin@dev.localhost',   role: 'superadmin', first_name: 'Admin',   last_name: 'User' },
  { email: 'manager@dev.localhost', username: 'manager@dev.localhost', role: 'manager',    first_name: 'Manager', last_name: 'User' },
  { email: 'user@dev.localhost',    username: 'user@dev.localhost',    role: 'user',       first_name: 'Regular', last_name: 'User' },
];

async function seed(): Promise<void> {
  console.log('🌱 Starting seed...\n');

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ── Master DB ─────────────────────────────────────────────
  const masterPool = new Pool({ connectionString: MASTER_DB_URL, max: 1 });

  try {
    console.log('📦 Seeding master DB...');

    await masterPool.query(`
      INSERT INTO tenants (tuid, domain, db_url, company_name, plan, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (tuid) DO UPDATE
        SET domain       = EXCLUDED.domain,
            db_url       = EXCLUDED.db_url,
            company_name = EXCLUDED.company_name,
            updated_at   = NOW()
    `, [TEST_TUID, TEST_DOMAIN, TENANT_DB_URL || MASTER_DB_URL, 'Development Company', 'enterprise']);

    console.log(`   ✅ Tenant: ${TEST_DOMAIN} (tuid: ${TEST_TUID})`);
  } finally {
    await masterPool.end();
  }

  // ── Tenant DB ─────────────────────────────────────────────
  const tenantPool = new Pool({ connectionString: TENANT_DB_URL || MASTER_DB_URL, max: 1 });

  try {
    console.log('\n📦 Seeding tenant DB...');

    for (const u of TEST_USERS) {
      const uuid = uuidv4();

      await tenantPool.query(`
        INSERT INTO users_v2 (uuid, username, email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        ON CONFLICT (email) DO UPDATE
          SET username      = EXCLUDED.username,
              password_hash = EXCLUDED.password_hash,
              role          = EXCLUDED.role,
              updated_at    = NOW()
      `, [uuid, u.username, u.email, passwordHash, u.first_name, u.last_name, u.role]);

      console.log(`   ✅ ${u.role.padEnd(11)} — ${u.email}`);
    }

    console.log(`\n🔑 All users: Password = ${PASSWORD}`);
  } finally {
    await tenantPool.end();
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('┌──────────────────────────────────────────────────────┐');
  console.log('│  Domain:   dev.localhost                              │');
  console.log('│  Users:    admin@dev.localhost    / Admin@1234        │');
  console.log('│            manager@dev.localhost  / Admin@1234        │');
  console.log('│            user@dev.localhost     / Admin@1234        │');
  console.log('└──────────────────────────────────────────────────────┘');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
