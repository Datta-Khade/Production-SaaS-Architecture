import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useViewport, getLayoutConfig } from '../hooks/useViewport';
import { getAccessToken, decodeToken, logout, getTenantDomain } from '../lib/auth';
import { 
    FileText, 
    BarChart3, 
    Menu,
    X,
    PanelLeft,
    LogOut
} from "lucide-react";
import logo from '../../assets/logo.svg';

const navItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        menuName: "Dashboard",
        icon: BarChart3,
        activeBg: "#5DADE2",
        activeText: "white",
        inactiveBg: "#f1f1f1",
        inactiveText: "#4f5863",
    },
    {
        label: "Tasks",
        href: "/tasks",
        menuName: "Tasks",
        icon: FileText,
        activeBg: "#5DADE2",
        activeText: "white",
        inactiveBg: "#f1f1f1",
        inactiveText: "#4f5863",
    },
];

interface HeaderComponentProps {
    showSidebarToggle?: boolean;
    onSidebarToggle?: () => void;
    isSidebarOpen?: boolean;
}

export default function HeaderComponent({ 
    showSidebarToggle = false, 
    onSidebarToggle,
    isSidebarOpen = false
}: HeaderComponentProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const viewport = useViewport();
    const layoutConfig = getLayoutConfig(viewport);

    const [userName, setUserName] = useState('');
    const [domain, setDomain] = useState('');

    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            const decoded = decodeToken(token);
            if (decoded) {
                setUserName((decoded.name as string) || (decoded.username as string) || (decoded.email as string) || 'User');
            }
        }
        setDomain(getTenantDomain() || '');
    }, [isProfileOpen]);

    const getInitials = (name: string): string => {
        if (!name) return 'UN';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const initials = getInitials(userName);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleModuleChange = useCallback((moduleId: string) => {
        switch (moduleId) {
            case "crewing":
                navigate("/");
                break;
            default:
                navigate("/");
        }
    }, [navigate]);


    return (
        <>
            <header className="fixed top-0 left-0 right-0 w-full h-[67px] bg-[#f1f1f1] border-b-2 border-[#51baf4] z-[100]">
                <div className="flex items-center justify-between h-[65px] bg-[#f1f1f1]">
                    <div className="flex items-center h-full">
                        {showSidebarToggle && layoutConfig.showMobileSidebarToggle && (
                            <button
                                className="flex items-center justify-center w-10 h-10 ml-2 text-[#16569e] hover:bg-gray-200 rounded"
                                onClick={onSidebarToggle}
                                aria-label="Toggle sidebar"
                            >
                                <PanelLeft size={24} />
                            </button>
                        )}
                        
                        <div className={`flex items-center ml-2 sm:ml-4`}>
                            <Link to='/'>
                                <img src={logo} alt="SAIL Logo" className="h-12 w-auto" />
                            </Link>
                        </div>
                    </div>

                    <nav className="hidden xl:flex h-[65px] flex-1">
                        <div className="flex h-full">
                            {navItems.map(({ label, href, icon: Icon, activeBg, activeText, inactiveBg, inactiveText }) => {
                                const isActive = href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);
                                return (
                                    <Link key={href} to={href}>
                                        <div
                                            className="flex flex-col items-center justify-center w-[100px] h-full cursor-pointer hover:bg-gray-300"
                                            style={{
                                                backgroundColor: isActive ? activeBg : inactiveBg,
                                            }}
                                        >
                                            <Icon size={24} color={isActive ? activeText : "#6B7280"} className="mb-1" />
                                            <div
                                                className="text-[10px] font-normal font-['Roboto',Helvetica]"
                                                style={{ color: isActive ? activeText : inactiveText }}
                                            >
                                                {label}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    <nav className="hidden md:flex xl:hidden h-[65px] flex-1 overflow-x-auto overflow-y-hidden">
                        <div className="flex h-full min-w-max">
                            {navItems.map(({ label, href, icon: Icon, activeBg, activeText, inactiveBg, inactiveText }) => {
                                const isActive = href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);
                                return (
                                    <Link key={href} to={href}>
                                        <div
                                            className="flex flex-col items-center justify-center w-[80px] lg:w-[90px] h-full cursor-pointer hover:bg-gray-300 flex-shrink-0"
                                            style={{
                                                backgroundColor: isActive ? activeBg : inactiveBg,
                                            }}
                                        >
                                            <Icon size={20} color={isActive ? activeText : "#6B7280"} className="mb-1" />
                                            <div
                                                className="text-[9px] lg:text-[10px] font-normal font-['Roboto',Helvetica] text-center"
                                                style={{ color: isActive ? activeText : inactiveText }}
                                            >
                                                {label}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="relative flex items-center mr-2 sm:mr-4" ref={profileRef}>
                        <button
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#16569e] text-white text-sm font-semibold cursor-pointer border-2 border-transparent hover:border-[#51baf4] transition-colors"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            aria-label="User profile menu"
                        >
                            {initials}
                        </button>

                        {isProfileOpen && (
                            <div
                                className="absolute right-0 top-[50px] w-[240px] bg-white rounded-md shadow-lg border border-gray-200 z-[200] py-1"
                            >
                                <div className="px-5 py-3">
                                    <span className="text-sm text-gray-600 font-['Roboto',Helvetica]">User Name :  </span>
                                    <span className="text-sm font-bold text-gray-900 font-['Roboto',Helvetica]">{userName || '-'}</span>
                                </div>
                                <div className="px-5 py-3 border-b border-gray-200">
                                    <span className="text-sm text-gray-600 font-['Roboto',Helvetica]">Domain Name :  </span>
                                    <span className="text-sm font-bold text-gray-900 font-['Roboto',Helvetica]">{domain || '-'}</span>
                                </div>
                                <button
                                    className="flex items-center gap-2 w-full px-5 py-3 text-sm text-gray-800 font-['Roboto',Helvetica] hover:bg-gray-100 cursor-pointer"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className="md:hidden flex items-center justify-center w-10 h-10 mr-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <X size={24} className="text-gray-700" />
                        ) : (
                            <Menu size={24} className="text-gray-700" />
                        )}
                    </button>
                </div>
            </header>

            {isMobileMenuOpen && (
                <nav 
                    className="md:hidden fixed top-[67px] left-0 right-0 bg-[#f1f1f1] border-b-2 border-[#51baf4] shadow-lg z-[99] max-h-[calc(100vh-67px)] overflow-y-auto" 
                    aria-label="Mobile navigation"
                >
                    <div className="grid grid-cols-3 gap-0">
                        {navItems.map(({ label, href, icon: Icon, activeBg, activeText, inactiveBg, inactiveText }) => {
                            const isActive = href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);
                            return (
                                <Link
                                    key={href}
                                    to={href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex flex-col items-center justify-center h-[60px] border-r border-b border-gray-300 cursor-pointer hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-[#51baf4] focus:ring-inset"
                                    style={{
                                        backgroundColor: isActive ? activeBg : inactiveBg,
                                    }}
                                >
                                    <Icon size={20} color={isActive ? activeText : "#6B7280"} className="mb-1" />
                                    <div
                                        className="text-[8px] font-normal font-['Roboto',Helvetica] text-center px-1"
                                        style={{ color: isActive ? activeText : inactiveText }}
                                    >
                                        {label}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}

            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 top-[67px] bg-black bg-opacity-25 z-[98]"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    )
}
