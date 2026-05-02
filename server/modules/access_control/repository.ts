import { eq, inArray, and } from 'drizzle-orm';
import { getDb, getMasterDb } from '../db.js';
import { env } from '../../env.js';
import { 
  menuMasterTable, 
  roleMasterTable, 
  roleAccessTable 
} from '../../../shared/modules/schema/access_control.js';

/**
 * Access Control Repository
 * Handles cross-database lookups for RBAC and Navigation
 */
export const accessControlRepository = {
  /**
   * Fetch a role by its assigned name from Master DB
   */
  async getRoleByName(roleName: string) {
    const masterDb = getMasterDb(env.MASTER_DATABASE_URL);
    const results = await masterDb
      .select()
      .from(roleMasterTable)
      .where(
        and(
          eq(roleMasterTable.assigned_role, roleName),
          eq(roleMasterTable.is_active, true),
          eq(roleMasterTable.is_deleted, false)
        )
      )
      .limit(1);
    
    return results[0] || null;
  },

  /**
   * Fetch all active roles from Master DB for hierarchy checks
   */
  async getAllRoles() {
    const masterDb = getMasterDb(env.MASTER_DATABASE_URL);
    return masterDb
      .select()
      .from(roleMasterTable)
      .where(
        and(
          eq(roleMasterTable.is_active, true),
          eq(roleMasterTable.is_deleted, false)
        )
      )
      .orderBy(roleMasterTable.orderby);
  },

  /**
   * Fetch permissions for a specific role from Tenant DB
   */
  async getRolePermissions(roleUuid: string) {
    const db = getDb();
    return db
      .select()
      .from(roleAccessTable)
      .where(
        and(
          eq(roleAccessTable.role_uuid, roleUuid),
          eq(roleAccessTable.canview, true),
          eq(roleAccessTable.is_deleted, false)
        )
      );
  },

  /**
   * Fetch menu details from Master DB for a list of UUIDs
   */
  async getMenus(muids: string[]) {
    if (muids.length === 0) return [];
    const masterDb = getMasterDb(env.MASTER_DATABASE_URL);
    return masterDb
      .select()
      .from(menuMasterTable)
      .where(
        and(
          inArray(menuMasterTable.muid, muids),
          eq(menuMasterTable.is_active, true),
          eq(menuMasterTable.is_deleted, false)
        )
      )
      .orderBy(menuMasterTable.sort_order);
  }
};
