import { Request, Response } from 'express';
import { accessControlService } from './service.js';
import { logger } from '../../lib/logger.js';

/**
 * Access Control Controller
 * API endpoints for navigation and permissions
 */
export const accessControlController = {
  /**
   * GET /api/v2/navigation
   * Returns the dynamic navigation structure for the logged-in user
   */
  async getNavigation(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
      const role = req.user.role;
      if (!role) {
        return res.status(403).json({ success: false, message: 'Role not assigned' });
      }
      
      const navigation = await accessControlService.getUserNavigation(role);
      
      return res.json({
        success: true,
        data: navigation
      });
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Failed to fetch navigation');
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  /**
   * GET /api/v2/admin/menus
   */
  async getAllMenus(_req: Request, res: Response) {
    try {
      const menus = await accessControlService.getAllMenus();
      return res.json({ success: true, data: menus });
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Failed to fetch all menus');
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  /**
   * GET /api/v2/admin/roles
   */
  async getAllRoles(_req: Request, res: Response) {
    try {
      const roles = await accessControlService.getAllRoles();
      return res.json({ success: true, data: roles });
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Failed to fetch all roles');
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  /**
   * POST /api/v2/admin/menus
   */
  async createMenu(req: Request, res: Response) {
    if (!req.user?.role) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
      const menu = await accessControlService.createMenu(req.body, req.user.role);
      return res.status(201).json({ success: true, data: menu });
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Failed to create menu');
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  /**
   * PATCH /api/v2/admin/menus/:muid
   */
  async updateMenu(req: Request, res: Response) {
    try {
      const { muid } = req.params;
      const menu = await accessControlService.updateMenu(muid, req.body);
      return res.json({ success: true, data: menu });
    } catch (err) {
      logger.error({ error: (err as Error).message, muid: req.params.muid }, 'Failed to update menu');
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  /**
   * DELETE /api/v2/admin/menus/:muid
   */
  async deleteMenu(req: Request, res: Response) {
    try {
      const { muid } = req.params;
      await accessControlService.deleteMenu(muid);
      return res.json({ success: true, message: 'Menu deleted' });
    } catch (err) {
      logger.error({ error: (err as Error).message, muid: req.params.muid }, 'Failed to delete menu');
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  /**
   * GET /api/v2/admin/permissions/:roleUuid
   */
  async getRolePermissions(req: Request, res: Response) {
    try {
      const { roleUuid } = req.params;
      const permissions = await accessControlService.getRolePermissions(roleUuid);
      return res.json({ success: true, data: permissions });
    } catch (err) {
      logger.error({ error: (err as Error).message, roleUuid: req.params.roleUuid }, 'Failed to fetch role permissions');
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  },

  /**
   * POST /api/v2/admin/permissions/:roleUuid
   */
  async saveRolePermissions(req: Request, res: Response) {
    try {
      const { roleUuid } = req.params;
      const permissions = await accessControlService.saveRolePermissions(roleUuid, req.body);
      return res.json({ success: true, data: permissions });
    } catch (err) {
      logger.error({ error: (err as Error).message, roleUuid: req.params.roleUuid }, 'Failed to save role permissions');
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
};
