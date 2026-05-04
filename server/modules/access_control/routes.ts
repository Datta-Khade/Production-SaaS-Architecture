import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.js';
import { accessControlController } from './controller.js';

const router = Router();

/**
 * Access Control & Navigation
 */
router.get(
  '/api/v2/navigation',
  authenticate,
  asyncHandler(requireTenant),
  asyncHandler(accessControlController.getNavigation)
);

/**
 * Admin: Master Menu Management
 */
router.get(
  '/api/v2/admin/menus',
  authenticate,
  asyncHandler(accessControlController.getAllMenus)
);

router.get(
  '/api/v2/admin/roles',
  authenticate,
  asyncHandler(accessControlController.getAllRoles)
);

router.post(
  '/api/v2/admin/menus',
  authenticate,
  requireRole('superadmin'),
  asyncHandler(requireTenant),
  asyncHandler(accessControlController.createMenu)
);

router.patch(
  '/api/v2/admin/menus/:muid',
  authenticate,
  requireRole('superadmin'),
  asyncHandler(requireTenant),
  asyncHandler(accessControlController.updateMenu)
);

router.delete(
  '/api/v2/admin/menus/:muid',
  authenticate,
  asyncHandler(requireTenant),
  asyncHandler(accessControlController.deleteMenu)
);

/**
 * Admin: Role Permission Management
 */
router.get(
  '/api/v2/admin/permissions/:roleUuid',
  authenticate,
  asyncHandler(requireTenant),
  asyncHandler(accessControlController.getRolePermissions)
);

router.post(
  '/api/v2/admin/permissions/:roleUuid',
  authenticate,
  asyncHandler(requireTenant),
  asyncHandler(accessControlController.saveRolePermissions)
);

export default router;
