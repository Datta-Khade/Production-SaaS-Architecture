import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Save, Lock } from 'lucide-react';
import { useRoles } from '../hooks/useRoles';
import { useMenus, Menu } from '../hooks/useMenus';
import { usePermissions, Permission } from '../hooks/usePermissions';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';

interface MenuNode extends Menu {
  children: MenuNode[];
  isOpen?: boolean;
}

const AccessControlPage: React.FC = () => {
  const { toast } = useToast();
  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const { data: menus = [], isLoading: isLoadingMenus } = useMenus();

  const [selectedRoleUuid, setSelectedRoleUuid] = useState<string | null>(null);
  const {
    permissions,
    isLoading: isLoadingPerms,
    savePermissions,
    isSaving,
  } = usePermissions(selectedRoleUuid);

  const [localPermissions, setLocalPermissions] = useState<Record<string, Permission>>({});
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // ── Initialize Local State ───────────────────────────────────
  const isInitialized = React.useRef(false);
  useEffect(() => {
    if (roles.length > 0 && !isInitialized.current) {
      setSelectedRoleUuid(roles[0].ruid);
      isInitialized.current = true;
    }
  }, [roles]);

  useEffect(() => {
    if (!permissions) return;
    const permMap: Record<string, Permission> = {};
    permissions.forEach((p) => {
      permMap[p.menu_uuid] = { ...p };
    });
    setLocalPermissions(permMap);
  }, [permissions]);

  // ── Hierarchy Builder ────────────────────────────────────────
  const menuTree = useMemo(() => {
    const nodeMap: Record<string, MenuNode> = {};
    const roots: MenuNode[] = [];

    menus.forEach((m) => {
      nodeMap[m.muid] = { ...m, children: [] };
    });

    menus.forEach((m) => {
      const node = nodeMap[m.muid];
      if (m.parent_menu && nodeMap[m.parent_menu]) {
        nodeMap[m.parent_menu].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots.sort((a, b) => a.sort_order - b.sort_order);
  }, [menus]);

  // ── Handlers ────────────────────────────────────────────────
  const togglePermission = (menuUuid: string, field: keyof Permission) => {
    setLocalPermissions((prev) => {
      const current = prev[menuUuid] || {
        menu_uuid: menuUuid,
        role_uuid: selectedRoleUuid!,
        canview: false,
        cancreate: false,
        canedit: false,
        candelete: false,
      };

      const newValue = !current[field];
      const updated = { ...current, [field]: newValue };

      // If viewing is disabled, disable all other permissions
      if (field === 'canview' && !newValue) {
        updated.cancreate = false;
        updated.canedit = false;
        updated.candelete = false;
      }

      // If any other permission is enabled, viewing MUST be enabled
      if (field !== 'canview' && newValue) {
        updated.canview = true;
      }

      return { ...prev, [menuUuid]: updated };
    });
  };

  const toggleAll = (menuUuid: string) => {
    setLocalPermissions((prev) => {
      const current = prev[menuUuid];
      const isAllSelected =
        current?.canview && current?.cancreate && current?.canedit && current?.candelete;

      const updated = {
        menu_uuid: menuUuid,
        role_uuid: selectedRoleUuid!,
        canview: !isAllSelected,
        cancreate: !isAllSelected,
        canedit: !isAllSelected,
        candelete: !isAllSelected,
      };

      return { ...prev, [menuUuid]: updated };
    });
  };

  const handleSave = async () => {
    if (!selectedRoleUuid) return;
    try {
      const payload = Object.values(localPermissions);
      await savePermissions(payload);
      toast({ title: 'Success', description: 'Permissions updated successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // ── Render Helpers ──────────────────────────────────────────
  const renderMenuRow = (node: MenuNode, level: number = 0) => {
    const isExpanded = expandedMenus[node.muid];
    const perm = localPermissions[node.muid] || {
      canview: false,
      cancreate: false,
      canedit: false,
      candelete: false,
    };
    const hasChildren = node.children.length > 0;

    return (
      <React.Fragment key={node.muid}>
        <div
          className={`grid grid-cols-12 border-b border-gray-100 hover:bg-gray-50 items-center min-h-[48px] ${level > 0 ? 'bg-gray-50/30' : ''}`}
        >
          <div
            className="col-span-4 flex items-center gap-2 px-4"
            style={{ paddingLeft: `${level * 24 + 16}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => setExpandedMenus((prev) => ({ ...prev, [node.muid]: !isExpanded }))}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
            <span
              className={`text-sm ${level === 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}
            >
              {node.display_name}
            </span>
          </div>

          <div className="col-span-8 grid grid-cols-5 gap-4 items-center h-full px-4 text-center">
            {/* Select All */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={perm.canview && perm.cancreate && perm.canedit && perm.candelete}
                onChange={() => toggleAll(node.muid)}
              />
            </div>
            {/* View */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={perm.canview}
                onChange={() => togglePermission(node.muid, 'canview')}
              />
            </div>
            {/* Create */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={perm.cancreate}
                onChange={() => togglePermission(node.muid, 'cancreate')}
              />
            </div>
            {/* Edit */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={perm.canedit}
                onChange={() => togglePermission(node.muid, 'canedit')}
              />
            </div>
            {/* Delete */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={perm.candelete}
                onChange={() => togglePermission(node.muid, 'candelete')}
              />
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && node.children.map((child) => renderMenuRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 bg-gray-50/50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Control</h1>
          <p className="text-gray-500">Manage dynamic role-based permissions for system menus.</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* ── Left: Roles List ────────────────────────────────── */}
        <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 bg-[#16569e] text-white font-bold flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Roles
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingRoles ? (
              <div className="p-4 text-center text-gray-400 text-sm">Loading roles...</div>
            ) : (
              roles.map((role) => (
                <button
                  key={role.ruid}
                  onClick={() => setSelectedRoleUuid(role.ruid)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50
                    ${
                      selectedRoleUuid === role.ruid
                        ? 'bg-blue-50 text-[#16569e] border-l-4 border-l-[#5DADE2]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {role.assigned_role.charAt(0).toUpperCase() + role.assigned_role.slice(1)}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Permissions Grid ─────────────────────────── */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 bg-[#5DADE2] text-white font-bold h-12 items-center px-0">
            <div className="col-span-4 px-4 border-r border-white/20">Menu Name</div>
            <div className="col-span-8 grid grid-cols-5 gap-4 text-center text-[10px] uppercase tracking-wider">
              <div className="flex items-center justify-center border-r border-white/20">
                Select All
              </div>
              <div className="flex items-center justify-center border-r border-white/20">View</div>
              <div className="flex items-center justify-center border-r border-white/20">
                Create
              </div>
              <div className="flex items-center justify-center border-r border-white/20">Edit</div>
              <div className="flex items-center justify-center">Delete</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingMenus || isLoadingPerms ? (
              <div className="p-8 text-center text-gray-400">Loading permissions...</div>
            ) : (
              menuTree.map((root) => renderMenuRow(root))
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !selectedRoleUuid}
              className="bg-[#5DADE2] hover:bg-[#4a9cd1] text-white px-8 font-semibold shadow-sm transition-all active:scale-95"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
              {!isSaving && <Save className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessControlPage;
