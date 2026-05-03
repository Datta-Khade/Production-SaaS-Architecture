/**
 * useUsers Hook — Admin: Manage tenant users
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/shared/lib/queryClient';

export interface User {
  uuid: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  assigned_role: string | null;
  is_active: boolean;
  created_at: string;
}

export const useUsers = () => {
  // Query: List all users
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiRequest<any>('GET', '/admin/users').then((res) => res.data as User[]),
  });

  // Mutation: Create user
  const createMutation = useMutation({
    mutationFn: (data: Partial<User> & { password?: string }) => 
      apiRequest('POST', '/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // Mutation: Update user
  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<User> }) => 
      apiRequest('PATCH', `/admin/users/${uuid}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // Mutation: Delete user
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => 
      apiRequest('DELETE', `/admin/users/${uuid}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
