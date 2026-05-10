import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  RefreshCcw,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useUsers, User } from '../hooks/useUsers';
import { useRoles, Role } from '../hooks/useRoles';
import { AgGridTable } from '@/shared/components/AgGrid/AgGridTable';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { apiRequest, queryClient } from '@/shared/lib/queryClient';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { useToast } from '@/shared/hooks/use-toast';

const UsersPage: React.FC = () => {
  const { users, isLoading, createUser, updateUser, deleteUser, isCreating, isUpdating } =
    useUsers();

  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User & { password?: string }>>({});

  // ── Column Definitions ───────────────────────────────────────
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'User',
        field: 'email',
        flex: 2,
        cellRenderer: (params: ICellRendererParams) => (
          <div className="flex flex-col py-1">
            <span className="font-semibold text-gray-900">
              {params.data.first_name} {params.data.last_name}
            </span>
            <span className="text-xs text-gray-500">{params.data.email}</span>
          </div>
        ),
      },
      {
        headerName: 'Username',
        field: 'username',
        flex: 1,
      },
      {
        headerName: 'Role',
        field: 'role',
        flex: 1,
        cellRenderer: (params: ICellRendererParams) => (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold uppercase">
            {params.value}
          </span>
        ),
      },
      {
        headerName: 'Status',
        field: 'is_active',
        width: 100,
        cellRenderer: (params: ICellRendererParams) => (
          <div className="flex items-center justify-center h-full">
            {params.value ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" title="Active" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" title="Inactive" />
            )}
          </div>
        ),
      },
      {
        headerName: 'Created At',
        field: 'created_at',
        width: 150,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : '',
      },
      {
        headerName: 'Actions',
        width: 120,
        sortable: false,
        filter: false,
        pinned: 'right',
        cellRenderer: (params: ICellRendererParams) => (
          <div className="flex items-center gap-2 h-full">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleEdit(params.data)}
            >
              <Edit2 className="w-4 h-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleDeleteClick(params.data)}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  // ── Handlers ────────────────────────────────────────────────
  const handleAdd = () => {
    setSelectedUser(null);
    setFormData({
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      role: 'user',
      is_active: true,
      password: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData(user);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await updateUser({ uuid: selectedUser.uuid, data: formData });
        toast({ title: 'Success', description: 'User updated successfully' });
      } else {
        await createUser(formData);
        toast({ title: 'Success', description: 'User created successfully' });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser.uuid);
      toast({ title: 'Deleted', description: 'User removed successfully' });
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage system users, permissions, and status.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAdd} className="bg-[#16569e] hover:bg-[#1e5fa8]">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <AgGridTable
          rowData={users}
          columnDefs={columnDefs}
          loading={isLoading}
          height="calc(100vh - 250px)"
          pagination={true}
          paginationPageSize={20}
        />
      </div>

      {/* ── Create/Edit Dialog ────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            {!selectedUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Welcome@123"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={isLoadingRoles}
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  {roles.map((role: Role) => (
                    <option key={role.ruid} value={role.assigned_role}>
                      {role.assigned_role.charAt(0).toUpperCase() + role.assigned_role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="status"
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#16569e] hover:bg-[#1e5fa8]"
                disabled={isCreating || isUpdating}
              >
                {selectedUser ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ────────────────────────── */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete user{' '}
              <span className="font-bold">{selectedUser?.email}</span>? This action cannot be undone
              and will soft-delete the user from the system.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
