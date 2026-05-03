/**
 * useRoles Hook — Admin: Fetch global roles from master DB
 */
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/lib/queryClient';

export interface Role {
  ruid: string;
  assigned_role: string;
  roletype: string;
  orderby: number;
}

export const useRoles = () => {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => apiRequest<any>('GET', '/admin/roles').then((res) => res.data as Role[]),
  });
};
