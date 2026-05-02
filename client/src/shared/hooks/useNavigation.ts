import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

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

interface NavResponse {
  success: boolean;
  data: NavItem[];
}

/**
 * Hook to fetch and manage dynamic navigation data.
 * Results are cached by TanStack Query.
 */
export function useNavigation() {
  const { data, isLoading, error } = useQuery<NavResponse>({
    queryKey: ['navigation'],
    queryFn: () => apiRequest('GET', '/navigation'),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  const navigation = data?.data || [];

  const headerItems = navigation.filter(item => item.position === 'header');
  
  /**
   * Get sidebar items for a specific parent header menu.
   */
  const getSidebarItems = (parentMuid: string | null) => {
    if (!parentMuid) return [];
    
    // Find the header item
    const headerItem = headerItems.find(item => item.muid === parentMuid);
    if (!headerItem) return [];

    // Return its children that are marked as sidebar
    return headerItem.children.filter(child => child.position === 'sidebar');
  };

  return {
    navigation,
    headerItems,
    getSidebarItems,
    isLoading,
    error
  };
}
