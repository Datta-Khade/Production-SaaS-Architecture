/**
 * usePermissions Hook — Admin: Manage role-based menu access
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/shared/lib/queryClient';

export interface Permission {
  rauid?: string;
  menu_uuid: string;
  role_uuid: string;
  canview: boolean;
  cancreate: boolean;
  canedit: boolean;
  candelete: boolean;
}

export const usePermissions = (roleUuid: string | null) => {
  const query = useQuery({
    queryKey: ['admin', 'permissions', roleUuid],
    queryFn: () => 
      roleUuid 
        ? apiRequest<any>('GET', `/admin/permissions/${roleUuid}`).then((res) => res.data as Permission[])
        : Promise.resolve([]),
    enabled: !!roleUuid,
  });

  const saveMutation = useMutation({
    mutationFn: (permissions: Partial<Permission>[]) => 
      apiRequest('POST', `/admin/permissions/${roleUuid}`, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'permissions', roleUuid] });
    },
  });

  return {
    permissions: query.data || [],
    isLoading: query.isLoading,
    savePermissions: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
};
