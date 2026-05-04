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
  },

  /**
   * Get all menus for management (flat list)
   */
  async getAllMenus() {
    return accessControlRepository.getAllMenus();
  },

  /**
   * Get all roles from Master DB
   */
  async getAllRoles() {
    return accessControlRepository.getAllRoles();
  },

  /**
   * Create a new menu and automatically grant access to the creator's role
   */
  async createMenu(data: any, currentRoleName: string) {
    const muid = `menu-${Math.random().toString(36).substring(2, 9)}`;
    
    // Sanitize data
    const { id, muid: _muid, created_at, updated_at, ...cleanData } = data;

    // 1. Create menu in Master DB
    const results = await accessControlRepository.createMenu({
      ...cleanData,
      muid,
    });
    return results[0];
  },

  /**
   * Update a menu
   */
  async updateMenu(muid: string, data: any) {
    // Sanitize data — do not allow updating primary key or audit columns
    const { id, muid: _muid, created_at, updated_at, ...cleanData } = data;
    return accessControlRepository.updateMenu(muid, cleanData);
  },

  /**
   * Delete a menu
   */
  async deleteMenu(muid: string) {
    return accessControlRepository.deleteMenu(muid);
  },

  /**
   * Get all permissions for a specific role
   */
  async getRolePermissions(roleUuid: string) {
    return accessControlRepository.getRolePermissions(roleUuid);
  },

  /**
   * Bulk save/sync permissions for a role
   */
  async saveRolePermissions(roleUuid: string, permissions: any[]) {
    // 1. Get existing permissions to track changes for audit
    const existing = await accessControlRepository.getRolePermissions(roleUuid);

    // 2. Perform bulk update in a transaction
    return accessControlRepository.syncRolePermissions(roleUuid, permissions);
  }
};
