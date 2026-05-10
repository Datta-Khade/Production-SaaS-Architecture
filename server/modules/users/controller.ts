/**
 * Users Controller — HTTP interface for user management
 */
import { Request, Response } from 'express';
import { usersService } from './service.js';

export const usersController = {
  /**
   * GET /api/v2/admin/users
   */
  getAll: async (_req: Request, res: Response) => {
    const users = await usersService.getAllUsers();
    res.json({ success: true, data: users });
  },

  /**
   * GET /api/v2/admin/users/:uuid
   */
  getOne: async (req: Request, res: Response) => {
    const user = await usersService.getUser(req.params.uuid);
    res.json({ success: true, data: user });
  },

  /**
   * POST /api/v2/admin/users
   */
  create: async (req: Request, res: Response) => {
    const user = await usersService.createUser(req.body, req.user!.sub);
    res.status(201).json({ success: true, data: user });
  },

  /**
   * PATCH /api/v2/admin/users/:uuid
   */
  update: async (req: Request, res: Response) => {
    const user = await usersService.updateUser(req.params.uuid, req.body, req.user!.sub);
    res.json({ success: true, data: user });
  },

  /**
   * DELETE /api/v2/admin/users/:uuid
   */
  delete: async (req: Request, res: Response) => {
    await usersService.deleteUser(req.params.uuid, req.user!.sub);
    res.json({ success: true, data: null });
  },
};
