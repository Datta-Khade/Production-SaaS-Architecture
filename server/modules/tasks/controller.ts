/**
 * Tasks Controller — API Envelope and Validation
 */
import { Request, Response } from 'express';
import { z } from 'zod';
import { tasksService } from './service.js';
import {
  paginationSchema,
  uuidSchema,
  buildResponse,
  buildPaginatedResponse,
} from '../../../shared/modules/validators/common.js';
import { ValidationError } from '../../../shared/modules/errors/index.js';

const taskInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  dueDate: z.coerce.date().optional().nullable(),
});

export const tasksController = {
  list: async (req: Request, res: Response) => {
    const { page, limit } = paginationSchema.parse(req.query);
    const { data, total } = await tasksService.getTasks(page, limit);
    res.json(buildPaginatedResponse(data, total, page, limit));
  },

  get: async (req: Request, res: Response) => {
    const uuid = uuidSchema.parse(req.params.id);
    const task = await tasksService.getTaskById(uuid);
    res.json(buildResponse(task));
  },

  create: async (req: Request, res: Response) => {
    const parsed = taskInputSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');
    }

    const task = await tasksService.createTask(parsed.data as any, {
      user: req.user!,
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'] as string,
    });

    res.status(201).json(buildResponse(task, 'Task created successfully'));
  },

  update: async (req: Request, res: Response) => {
    const uuid = uuidSchema.parse(req.params.id);
    
    // Partial validation for updates
    const parsed = taskInputSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');
    }

    const task = await tasksService.updateTask(uuid, parsed.data as any, {
      user: req.user!,
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'] as string,
    });

    res.json(buildResponse(task, 'Task updated successfully'));
  },

  delete: async (req: Request, res: Response) => {
    const uuid = uuidSchema.parse(req.params.id);
    
    await tasksService.deleteTask(uuid, {
      user: req.user!,
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'] as string,
    });

    res.json(buildResponse(null, 'Task deleted successfully'));
  },
};

