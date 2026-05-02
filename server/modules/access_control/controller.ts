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
  }
};
