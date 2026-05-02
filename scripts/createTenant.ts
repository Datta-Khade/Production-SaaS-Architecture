/**
 * Create Tenant Script — Admin: provision a new tenant
 * 
 * Usage: npm run tenant:create -- --name "Acme Corp" --domain "acme.production.so"
 * 
 * This script:
 * 1. Creates a new PostgreSQL database for the tenant
 * 2. Runs all migrations on the new database
 * 3. Inserts the tenant record into the master DB
 * 4. Creates an initial admin user for the tenant
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { runMigrations } from '../server/modules/migrationRunner.js';

dotenv.config({ path: '.env.development' });

const { Pool } = pg;

const MASTER_DB_URL = process.env.MASTER_DATABASE_URL || 'postgresql://dev:devpassword@localhost:5432/production_master';

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
};

async function createTenant(): Promise<void> {
  const companyName = getArg('name');
  const domain = getArg('domain');
  const adminEmail = getArg('email') || `admin@${domain}`;
  const plan = getArg('plan') || 'starter';

  if (!companyName || !domain) {
    console.error('Usage: npm run tenant:create -- --name "Company Name" --domain "company.production.so" [--email admin@company.com] [--plan starter|pro|enterprise]');
    process.exit(1);
  }

  // Generate tenant ID
  const tuid = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().slice(0, 4)}`;
  const dbName = `tenant_${tuid.replace(/-/g, '_')}`;

  console.log(`\n🏢 Creating tenant: ${companyName}`);
  console.log(`   TUID:   ${tuid}`);
  console.log(`   Domain: ${domain}`);
  console.log(`   DB:     ${dbName}`);
  console.log(`   Plan:   ${plan}\n`);

  const masterPool = new Pool({ connectionString: MASTER_DB_URL, max: 1 });

  try {
    // 1. Create the tenant database
    console.log('📦 Creating tenant database...');
    await masterPool.query(`CREATE DATABASE "${dbName}"`);
    console.log(`   ✅ Database ${dbName} created`);

    // 2. Build tenant DB URL (same host as master, different db name)
    const masterUrl = new URL(MASTER_DB_URL);
    masterUrl.pathname = `/${dbName}`;
    const tenantDbUrl = masterUrl.toString();

    // 3. Run migrations on tenant DB
    console.log('📦 Running migrations on tenant DB...');
    await runMigrations(tenantDbUrl);
    console.log('   ✅ Migrations applied');

    // 4. Insert tenant record into master DB
    console.log('📦 Registering tenant in master DB...');
    await masterPool.query(`
      INSERT INTO tenants (tuid, domain, db_url, company_name, plan, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
    `, [tuid, domain, tenantDbUrl, companyName, plan]);
    console.log('   ✅ Tenant registered');

    // 5. Create admin user in tenant DB
    console.log('📦 Creating admin user...');
    const tenantPool = new Pool({ connectionString: tenantDbUrl, max: 1 });
    try {
      const passwordHash = await bcrypt.hash('changeme', 12);
      const adminUuid = uuidv4();

      await tenantPool.query(`
        INSERT INTO users_v2 (uuid, email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
      `, [adminUuid, adminEmail, passwordHash, 'Admin', companyName, 'admin']);

      console.log(`   ✅ Admin user: ${adminEmail} / changeme`);
    } finally {
      await tenantPool.end();
    }

    console.log(`\n🎉 Tenant "${companyName}" created successfully!\n`);
  } catch (err) {
    console.error('❌ Failed to create tenant:', (err as Error).message);
    process.exit(1);
  } finally {
    await masterPool.end();
  }
}

createTenant();

