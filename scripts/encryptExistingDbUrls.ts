/**
 * One-Time Migration Script — Encrypt existing plaintext db_url values
 *
 * Run this ONCE after deploying the db_url encryption changes:
 *   npx tsx scripts/encryptExistingDbUrls.ts
 *
 * This script:
 * 1. Reads all tenants from the master DB
 * 2. Checks each db_url — if it's plaintext, encrypts it with AES-256-GCM
 * 3. Updates the row with the encrypted value
 * 4. Verifies the encrypted value can be decrypted back to the original
 *
 * Safe to run multiple times — already-encrypted values are skipped.
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { serverEncrypt, serverDecrypt, isEncrypted } from '../server/lib/serverEncryption.js';

dotenv.config({ path: '.env.development' });

const { Pool } = pg;
const MASTER_DB_URL =
  process.env.MASTER_DATABASE_URL ||
  'postgresql://dev:devpassword@localhost:5432/production_master';

async function encryptExistingDbUrls(): Promise<void> {
  console.log('\n🔐 Encrypting existing tenant db_url values...\n');

  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ENCRYPTION_KEY environment variable is required.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: MASTER_DB_URL, max: 1 });

  try {
    const { rows: tenants } = await pool.query('SELECT id, tuid, domain, db_url FROM tenants');
    console.log(`   Found ${tenants.length} tenant(s)\n`);

    let encrypted = 0;
    let skipped = 0;
    let failed = 0;

    for (const tenant of tenants) {
      const { id, tuid, domain, db_url } = tenant;

      // Skip if already encrypted
      if (isEncrypted(db_url)) {
        console.log(`   ⏭️  ${tuid} (${domain}) — already encrypted, skipping`);
        skipped++;
        continue;
      }

      try {
        // Encrypt the plaintext db_url
        const encryptedUrl = serverEncrypt(db_url);

        // Verify: decrypt should return original
        const decryptedUrl = serverDecrypt(encryptedUrl);
        if (decryptedUrl !== db_url) {
          console.error(
            `   ❌ ${tuid} (${domain}) — verification failed! Decrypted value doesn't match original.`,
          );
          failed++;
          continue;
        }

        // Update in DB
        await pool.query('UPDATE tenants SET db_url = $1, updated_at = NOW() WHERE id = $2', [
          encryptedUrl,
          id,
        ]);
        console.log(`   ✅ ${tuid} (${domain}) — encrypted successfully`);
        encrypted++;
      } catch (err) {
        console.error(`   ❌ ${tuid} (${domain}) — error: ${(err as Error).message}`);
        failed++;
      }
    }

    console.log(`\n📊 Results: ${encrypted} encrypted, ${skipped} skipped, ${failed} failed`);

    if (failed > 0) {
      console.error('\n⚠️  Some tenants failed to encrypt. Please investigate and re-run.');
      process.exit(1);
    }

    console.log('\n🎉 All tenant db_url values are now encrypted!\n');
  } catch (err) {
    console.error('❌ Failed:', (err as Error).message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

encryptExistingDbUrls();
