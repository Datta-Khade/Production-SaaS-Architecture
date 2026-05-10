/**
 * Users Repository — Data access for users_v2 table
 *
 * Rules:
 * - Uses getDb() for tenant isolation
 * - Soft delete via is_deleted = true
 */
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db.js';
import { usersTable, type NewUser } from '../../../shared/modules/schema/users.js';

export const usersRepository = {
  /**
   * Get all users for the current tenant (not deleted)
   */
  async findAll() {
    const db = getDb();
    return db
      .select({
        uuid: usersTable.uuid,
        email: usersTable.email,
        username: usersTable.username,
        first_name: usersTable.first_name,
        last_name: usersTable.last_name,
        role: usersTable.role,
        assigned_role: usersTable.assigned_role,
        is_active: usersTable.is_active,
        created_at: usersTable.created_at,
        updated_at: usersTable.updated_at,
      })
      .from(usersTable)
      .where(eq(usersTable.is_deleted, false))
      .orderBy(usersTable.created_at);
  },

  /**
   * Find user by UUID
   */
  async findByUuid(uuid: string) {
    const db = getDb();
    const result = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.uuid, uuid), eq(usersTable.is_deleted, false)))
      .limit(1);
    return result[0];
  },

  /**
   * Create a new user
   */
  async create(data: NewUser) {
    const db = getDb();
    const result = await db.insert(usersTable).values(data).returning();
    return result[0];
  },

  /**
   * Update user by UUID
   */
  async update(uuid: string, data: Partial<NewUser>) {
    const db = getDb();
    const result = await db
      .update(usersTable)
      .set({ ...data, updated_at: new Date() })
      .where(eq(usersTable.uuid, uuid))
      .returning();
    return result[0];
  },

  /**
   * Soft delete user by UUID
   */
  async delete(uuid: string, deletedByUuid: string) {
    const db = getDb();
    const result = await db
      .update(usersTable)
      .set({
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by_uuid: deletedByUuid,
        updated_at: new Date(),
      })
      .where(eq(usersTable.uuid, uuid))
      .returning();
    return result[0];
  },
};
