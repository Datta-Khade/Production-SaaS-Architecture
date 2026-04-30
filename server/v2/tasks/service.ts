/**
 * Tasks Service — Business Logic & Auditing
 */
import { tasksRepository } from './repository.js';
import { auditLog } from '../lib/auditLog.js';
import type { Task, NewTask } from '../../../shared/v2/schema/tasks.js';

interface RequestContext {
  user: { sub: string; email?: string };
  ipAddress?: string;
  requestId?: string;
}

export const tasksService = {
  getTasks: async (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    return tasksRepository.findAll(limit, offset);
  },

  getTaskById: async (uuid: string) => {
    return tasksRepository.findById(uuid);
  },

  createTask: async (
    data: Omit<NewTask, 'uuid' | 'createdBy' | 'updatedBy'>,
    ctx: RequestContext
  ): Promise<Task> => {
    const task = await tasksRepository.create({
      ...data,
      createdBy: ctx.user.sub,
    });

    await auditLog.track({
      actor: ctx.user,
      action: 'create',
      entity: 'tasks_v2',
      entityUuid: task.uuid,
      after: task,
      ipAddress: ctx.ipAddress,
      requestId: ctx.requestId,
    });

    return task;
  },

  updateTask: async (
    uuid: string,
    data: Partial<Omit<NewTask, 'uuid' | 'createdBy' | 'updatedBy'>>,
    ctx: RequestContext
  ): Promise<Task> => {
    const before = await tasksRepository.findById(uuid);

    const task = await tasksRepository.update(uuid, {
      ...data,
      updatedBy: ctx.user.sub,
    });

    await auditLog.track({
      actor: ctx.user,
      action: 'update',
      entity: 'tasks_v2',
      entityUuid: task.uuid,
      before,
      after: task,
      ipAddress: ctx.ipAddress,
      requestId: ctx.requestId,
    });

    return task;
  },

  deleteTask: async (uuid: string, ctx: RequestContext): Promise<void> => {
    const before = await tasksRepository.findById(uuid);
    await tasksRepository.softDelete(uuid, ctx.user.sub);

    await auditLog.track({
      actor: ctx.user,
      action: 'delete',
      entity: 'tasks_v2',
      entityUuid: uuid,
      before,
      ipAddress: ctx.ipAddress,
      requestId: ctx.requestId,
    });
  },
};
