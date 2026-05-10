import React, { useState } from 'react';
import HeaderComponent from '@/shared/components/HeaderComponent';
import SideBarComponent from '@/shared/components/SideBarComponent';
import AgGridTable from '@/shared/components/AgGrid/AgGridTable';
import AgGridTableActions from '@/shared/components/AgGrid/AgGridTableActions';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { GridApi } from 'ag-grid-community';

export default function UITestPage() {
  const [selectedPage, setSelectedPage] = useState('all');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const columnDefs = [
    { field: 'id', headerName: 'ID', checkboxSelection: true },
    { field: 'name', headerName: 'Name', filter: 'agTextColumnFilter' },
    { field: 'role', headerName: 'Role', filter: 'agSetColumnFilter' },
    { field: 'status', headerName: 'Status' },
  ];

  const rowData = [
    { id: 1, name: 'John Doe', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', role: 'User', status: 'Inactive' },
    { id: 3, name: 'Bob Johnson', role: 'Manager', status: 'Active' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent showSidebarToggle onSidebarToggle={() => {}} />
      <SideBarComponent selectedAdminPage={selectedPage} setSelectedAdminPage={setSelectedPage} />

      <main className="pt-[80px] pl-[80px] pr-8 pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">UI Components Test</h1>
            <div className="flex gap-4">
              <Button>Primary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="destructive">Destructive Button</Button>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Input & Form</h2>
            <div className="max-w-xs">
              <Input placeholder="Enter something..." />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">AG Grid Enterprise Table</h2>
              <AgGridTableActions gridApi={gridApi} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <AgGridTable
                rowData={rowData}
                columnDefs={columnDefs}
                onGridReady={(params) => setGridApi(params.api)}
                rowSelection="multiple"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
