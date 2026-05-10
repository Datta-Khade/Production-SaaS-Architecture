import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import HeaderComponent from '../components/HeaderComponent';
import SideBarComponent from '../components/SideBarComponent';
import { useViewport, getLayoutConfig } from '@/shared/hooks/useViewport';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAdminPage, setSelectedAdminPage] = useState('all');
  const viewport = useViewport();
  const layoutConfig = getLayoutConfig(viewport);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Determine padding-left for main content based on sidebar width
  const sidebarWidth = sidebarOpen ? layoutConfig.sidebarWidth : viewport === 'phone' ? 0 : 56;
  const mainPaddingLeft = viewport === 'phone' || !sidebarOpen ? 0 : sidebarWidth;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <HeaderComponent
        showSidebarToggle={true}
        onSidebarToggle={toggleSidebar}
        isSidebarOpen={sidebarOpen}
      />

      {/* Sidebar */}
      {sidebarOpen && (
        <SideBarComponent
          selectedAdminPage={selectedAdminPage}
          setSelectedAdminPage={setSelectedAdminPage}
        />
      )}

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-200"
        style={{
          marginTop: '67px',
          marginLeft: sidebarOpen ? `${layoutConfig.sidebarWidth}px` : '0px',
        }}
      >
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
