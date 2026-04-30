/**
 * Tasks Repository — DB access
 *
 * All functions use getDb() to ensure tenant isolation.
 * No business logic or auditing here.
 */
import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { tasksTable, type Task, type NewTask } from '../../../shared/v2/schema/tasks.js';
import { NotFoundError } from '../../../shared/v2/errors/index.js';

export const tasksRepository = {
  findAll: async (limit: number, offset: number): Promise<{ data: Task[]; total: number }> => {
    const db = getDb();

    const data = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.isDeleted, false))
      .orderBy(desc(tasksTable.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasksTable)
      .where(eq(tasksTable.isDeleted, false));

    return {
      data,
      total: Number(totalResult[0]?.count || 0),
    };
  },

  findById: async (uuid: string): Promise<Task> => {
    const db = getDb();
    const result = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.uuid, uuid), eq(tasksTable.isDeleted, false)))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundError('Task not found');
    }
    return result[0];
  },

  create: async (data: Omit<NewTask, 'uuid'>): Promise<Task> => {
    const db = getDb();
    const result = await db
      .insert(tasksTable)
      .values({ ...data, uuid: uuidv4() })
      .returning();
    return result[0];
  },

  update: async (uuid: string, data: Partial<NewTask>): Promise<Task> => {
    const db = getDb();
    const result = await db
      .update(tasksTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tasksTable.uuid, uuid), eq(tasksTable.isDeleted, false)))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError('Task not found');
    }
    return result[0];
  },

  softDelete: async (uuid: string, deletedBy: string): Promise<void> => {
    const db = getDb();
    const result = await db
      .update(tasksTable)
      .set({ isDeleted: true, updatedBy: deletedBy, updatedAt: new Date() })
      .where(and(eq(tasksTable.uuid, uuid), eq(tasksTable.isDeleted, false)))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError('Task not found');
    }
  },
};
