import { getMasterDb } from './modules/db.js';
import { menuMasterTable } from '../shared/modules/schema/access_control.js';
import { env } from './env.js';
import { eq } from 'drizzle-orm';

async function check() {
  const db = getMasterDb(env.MASTER_DATABASE_URL);
  const menus = await db.select().from(menuMasterTable);
  console.log('Menus in DB:', menus.map(m => m.muid));
}

check().catch(console.error);
