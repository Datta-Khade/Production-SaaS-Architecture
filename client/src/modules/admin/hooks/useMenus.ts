/**
 * useMenus Hook — Admin: Fetch all master menus
 */
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/lib/queryClient';

export interface Menu {
  muid: string;
  name: string;
  display_name: string;
  route: string | null;
  parent_menu: string | null;
  icon_name: string | null;
  position: 'header' | 'sidebar';
  sort_order: number;
}

export const useMenus = () => {
  return useQuery({
    queryKey: ['admin', 'menus'],
    queryFn: () => apiRequest<any>('GET', '/admin/menus').then((res) => res.data as Menu[]),
  });
};
