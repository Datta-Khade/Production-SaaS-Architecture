import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/shared/lib/queryClient';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Plus, Edit2, Save, X, LayoutGrid, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { IconPicker } from '@/shared/components/IconPicker';
import { DynamicIcon } from '@/shared/components/DynamicIcon';

interface Menu {
  muid: string;
  name: string;
  display_name: string;
  route: string | null;
  parent_menu: string | null;
  icon_name: string | null;
  position: 'header' | 'sidebar';
  sort_order: number;
  is_active: boolean;
}

const MenuMasterPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingMuid, setEditingMuid] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: menus = [], isLoading } = useQuery<Menu[]>({
    queryKey: ['/admin/menus'],
    queryFn: async () => {
      const res = await apiRequest<{ data: Menu[] }>('GET', '/admin/menus');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newMenu: Partial<Menu>) => apiRequest('POST', '/admin/menus', newMenu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/menus'] });
      setIsAdding(false);
      toast({ title: 'Success', description: 'Menu created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ muid, data }: { muid: string; data: Partial<Menu> }) =>
      apiRequest('PATCH', `/admin/menus/${muid}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/menus'] });
      setEditingMuid(null);
      toast({ title: 'Success', description: 'Menu updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (muid: string) => apiRequest('DELETE', `/admin/menus/${muid}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/menus'] });
      toast({ title: 'Deleted', description: 'Menu removed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const [formData, setFormData] = useState<Partial<Menu>>({
    name: '',
    display_name: '',
    route: '',
    parent_menu: null,
    icon_name: 'LayoutGrid',
    position: 'sidebar',
    sort_order: 0,
    is_active: true,
  });

  const handleSave = () => {
    if (editingMuid) {
      updateMutation.mutate({ muid: editingMuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (menu: Menu) => {
    setEditingMuid(menu.muid);
    setFormData(menu);
    setIsAdding(false);
  };

  const startAdd = (parentMuid: string | null = null) => {
    setEditingMuid(null);
    setFormData({
      name: '',
      display_name: '',
      route: '',
      parent_menu: parentMuid,
      icon_name: 'LayoutGrid',
      position: parentMuid ? 'sidebar' : 'header',
      sort_order: (menus.filter((m) => m.parent_menu === parentMuid).length + 1) * 10,
      is_active: true,
    });
    setIsAdding(true);
  };

  const filteredMenus = menus.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.display_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const headers = filteredMenus.filter((m) => !m.parent_menu);
  const getChildren = (parentMuid: string) =>
    filteredMenus.filter((m) => m.parent_menu === parentMuid);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Master</h1>
          <p className="text-gray-500">Manage application headers and sidebar navigation.</p>
        </div>
        <Button onClick={() => startAdd()} className="bg-[#16569e] hover:bg-[#1e5fa8]">
          <Plus className="w-4 h-4 mr-2" />
          Add Header Menu
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tree View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search menus..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-6">Display Name / Route</div>
              <div className="col-span-2 text-center">Position</div>
              <div className="col-span-2 text-center">Sort</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading menus...</div>
              ) : headers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No menus found.</div>
              ) : (
                headers.map((header) => (
                  <React.Fragment key={header.muid}>
                    <div
                      className={`p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 ${editingMuid === header.muid ? 'bg-blue-50' : ''}`}
                    >
                      <div className="col-span-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded">
                          <DynamicIcon name={header.icon_name} className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{header.display_name}</div>
                          <div className="text-xs text-gray-400 font-mono">
                            {header.route || 'No route'}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                          {header.position}
                        </span>
                      </div>
                      <div className="col-span-2 text-center text-sm font-medium text-gray-600">
                        {header.sort_order}
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button
                          onClick={() => startAdd(header.muid)}
                          title="Add child"
                          className="p-1.5 text-gray-400 hover:text-blue-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(header)}
                          className="p-1.5 text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Children */}
                    {getChildren(header.muid).map((child) => (
                      <div
                        key={child.muid}
                        className={`p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 border-l-4 border-l-gray-100 ml-8 ${editingMuid === child.muid ? 'bg-blue-50' : ''}`}
                      >
                        <div className="col-span-6 flex items-center gap-3 pl-4">
                          <ChevronRight className="w-3 h-3 text-gray-300" />
                          <div>
                            <div className="font-medium text-gray-800">{child.display_name}</div>
                            <div className="text-xs text-gray-400 font-mono">{child.route}</div>
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="px-2 py-1 bg-gray-50 text-gray-400 rounded text-[10px] font-bold uppercase">
                            {child.position}
                          </span>
                        </div>
                        <div className="col-span-2 text-center text-sm text-gray-400">
                          {child.sort_order}
                        </div>
                        <div className="col-span-2 flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(child)}
                            className="p-1.5 text-gray-400 hover:text-blue-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="space-y-6">
          {isAdding || editingMuid ? (
            <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 sticky top-24 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">
                  {editingMuid ? 'Edit Menu' : 'New Menu'}
                </h3>
                <button
                  onClick={() => {
                    setEditingMuid(null);
                    setIsAdding(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Internal Name</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dashboard"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={formData.display_name || ''}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Name shown in UI"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Route</Label>
                  <Input
                    value={formData.route || ''}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    placeholder="/dashboard"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <IconPicker
                      value={formData.icon_name || ''}
                      onChange={(val) => setFormData({ ...formData, icon_name: val })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={formData.sort_order || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, sort_order: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <select
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                  >
                    <option value="header">Header (Level 0)</option>
                    <option value="sidebar">Sidebar (Level 1)</option>
                  </select>
                </div>

                <Button
                  onClick={handleSave}
                  className="w-full bg-[#16569e] hover:bg-[#1e5fa8] mt-4"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingMuid ? 'Update Menu' : 'Create Menu'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-xl p-8 border border-dashed border-blue-200 text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-blue-900 mb-1">Manage Navigation</h3>
              <p className="text-sm text-blue-600 mb-4">
                Select a menu to edit or create a new one to expand your application.
              </p>
              <Button
                variant="outline"
                onClick={() => startAdd()}
                className="border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuMasterPage;
