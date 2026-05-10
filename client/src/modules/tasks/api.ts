/**
 * Tasks API Hooks — React Query integration using the standardized tenantFetch
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantFetch } from '../../shared/lib/queryClient';
import type { Task, NewTask } from '@shared/modules/schema/tasks';
import type { PaginatedResponse, ApiResponse } from '../../shared/lib/validators';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

export const useTasks = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: taskKeys.list({ page, limit }),
    queryFn: () =>
      tenantFetch<PaginatedResponse<Task>>('GET', `/tasks?page=${page}&limit=${limit}`),
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tenantFetch<ApiResponse<Task>>('GET', `/tasks/${id}`),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NewTask>) => tenantFetch<ApiResponse<Task>>('POST', '/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewTask> }) =>
      tenantFetch<ApiResponse<Task>>('PUT', `/tasks/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantFetch<ApiResponse<null>>('DELETE', `/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};
