import { 
    LayoutGrid, 
    BarChart3, 
    FileText, 
    Settings, 
    Users, 
    Activity,
    Shield,
    Lock,
    Menu,
    type LucideIcon 
} from 'lucide-react';
import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { useViewport, getLayoutConfig } from '@/shared/hooks/useViewport';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { useNavigation } from '../hooks/useNavigation';
import { DynamicIcon } from './DynamicIcon';

/**
 * Map of icon names (from DB) to Lucide components
 */
const iconMap: Record<string, LucideIcon> = {
    BarChart3,
    FileText,
    LayoutGrid,
    Settings,
    Users,
    Activity,
    Shield,
    Lock,
    Menu
};

type SideBarComponentProps = {
    selectedAdminPage: string;
    allowedPages?: string[];
    setSelectedAdminPage: (page: string) => void;
    isMobileSidebarOpen?: boolean;
    onCloseMobileSidebar?: () => void;
};


export default function SideBarComponent({ 
    selectedAdminPage: _selectedAdminPage, 
    setSelectedAdminPage: _setSelectedAdminPage, 
    allowedPages: _allowedPages,
    isMobileSidebarOpen: _isMobileSidebarOpen,
    onCloseMobileSidebar: _onCloseMobileSidebar
}: SideBarComponentProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const viewport = useViewport();
    const { headerItems, getSidebarItems, isLoading } = useNavigation();

    // Determine the active header module based on the current URL
    const activeHeader = useMemo(() => {
        return headerItems.find(item => 
            item.route === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.route || '')
        );
    }, [headerItems, location.pathname]);

    const sidebarItems = useMemo(() => {
        return getSidebarItems(activeHeader?.muid || null);
    }, [activeHeader, getSidebarItems]);

    const layoutConfig = getLayoutConfig(viewport);
    const isCompact = layoutConfig.sidebarMode === 'compact';
    const sidebarWidth = layoutConfig.sidebarWidth;

    return (
        <TooltipProvider>
            <aside 
                className="fixed left-0 top-[67px] h-[calc(100vh-67px)] z-50 flex flex-col transition-all duration-200"
                style={{ width: `${sidebarWidth}px` }}
            >
                {!isLoading && sidebarItems.map(item => {
                    const isActive = location.pathname === item.route;

                    return (
                        <Tooltip key={item.muid} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div
                                    className={`w-full flex flex-col items-center justify-center cursor-pointer flex-shrink-0 transition-all duration-200 ${
                                        isActive ? "bg-[#52baf3]" : "bg-[#16569e] hover:bg-[#1e5fa8]"
                                    }`}
                                    style={{ height: isCompact ? '56px' : '79px' }}
                                    onClick={() => item.route && navigate(item.route)}
                                >
                                    <div className="text-white text-[10px] font-normal font-['Roboto',Helvetica] flex flex-col items-center justify-center text-center">
                                        <div className={isCompact ? '' : 'mb-1'}>
                                            <DynamicIcon name={item.iconName} size={20} className='text-white' />
                                        </div>
                                        {!isCompact && (
                                            <div className="leading-tight break-words hyphens-auto max-w-full">
                                                {item.displayName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            {isCompact && (
                                <TooltipContent side="right" className="bg-[#16569e] text-white border-none">
                                    {item.displayName}
                                </TooltipContent>
                            )}
                        </Tooltip>
                    );
                })}
                <div className="w-full flex-1 bg-[#16569e]" />
            </aside>
        </TooltipProvider>
    );
}
