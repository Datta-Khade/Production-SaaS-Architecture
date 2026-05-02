import { accessControlRepository } from './repository.js';
import { logger } from '../../lib/logger.js';

export interface NavItem {
  muid: string;
  name: string;
  displayName: string;
  route: string | null;
  iconName: string | null;
  position: 'header' | 'sidebar';
  sortOrder: number;
  children: NavItem[];
}

/**
 * Access Control Service
 * Logic to build navigation tree and check permissions
 */
export const accessControlService = {
  /**
   * Build a hierarchical navigation tree for a given user role
   */
  async getUserNavigation(roleName: string): Promise<NavItem[]> {
    logger.debug({ roleName }, 'Building navigation for user');

    // 1. Get role from Master DB
    const role = await accessControlRepository.getRoleByName(roleName);
    if (!role) {
      logger.warn({ roleName }, 'Role not found in rolemaster table');
      return [];
    }

    // 2. Get permissions for this role from Tenant DB
    const permissions = await accessControlRepository.getRolePermissions(role.ruid);
    const allowedMenuUuids = permissions.map(p => p.menu_uuid);

    logger.debug({ 
      roleName, 
      roleUuid: role.ruid, 
      permissionCount: permissions.length,
      allowedMenuUuids 
    }, 'Fetched role permissions');

    if (allowedMenuUuids.length === 0) {
      logger.warn({ roleName, roleUuid: role.ruid }, 'No permissions found for role in roleaccess table');
      return [];
    }

    // 3. Get menu details from Master DB
    const allMenus = await accessControlRepository.getMenus(allowedMenuUuids);

    // 4. Build hierarchy
    const menuMap = new Map<string, NavItem>();
    const rootItems: NavItem[] = [];

    // First pass: Create all NavItem objects
    allMenus.forEach(menu => {
      const item: NavItem = {
        muid: menu.muid,
        name: menu.name,
        displayName: menu.display_name,
        route: menu.route,
        iconName: menu.icon_name,
        position: (menu.position as 'header' | 'sidebar') || 'header',
        sortOrder: menu.sort_order,
        children: []
      };
      menuMap.set(menu.muid, item);
    });

    // Second pass: Connect children to parents
    allMenus.forEach(menu => {
      const item = menuMap.get(menu.muid)!;
      if (menu.parent_menu && menuMap.has(menu.parent_menu)) {
        const parent = menuMap.get(menu.parent_menu)!;
        parent.children.push(item);
        // Sort children
        parent.children.sort((a, b) => a.sortOrder - b.sortOrder);
      } else {
        rootItems.push(item);
      }
    });

    return rootItems.sort((a, b) => a.sortOrder - b.sortOrder);
  }
};
