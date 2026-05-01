import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridReadyEvent,
  GridApi,
  ModuleRegistry,
  GridOptions
} from 'ag-grid-community';
import {
  AllEnterpriseModule,
  SetFilterModule,
  MultiFilterModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  StatusBarModule,
  SideBarModule,
  RangeSelectionModule,
  RowGroupingModule,
  AggregationModule,
  PivotModule,
  MasterDetailModule,
  ViewportRowModelModule,
  ServerSideRowModelModule,
  InfiniteRowModelModule,
  ExcelExportModule,
  CsvExportModule,
  ClipboardModule,
  AdvancedFilterModule,
  LicenseManager
} from 'ag-grid-enterprise';
import { useViewport, getViewportConfig } from '@/shared/hooks/useViewport';

// Set AG Grid Enterprise License - check both possible environment variable names
const licenseKey = import.meta.env.VITE_AG_GRID_LICENSE_KEY || import.meta.env.AG_GRID_LICENSE_KEY;
if (licenseKey) {
  LicenseManager.setLicenseKey(licenseKey);
} else {
  console.warn('AG Grid Enterprise license key not found. Please set VITE_AG_GRID_LICENSE_KEY environment variable.');
}

// Register AG Grid Enterprise modules
ModuleRegistry.registerModules([
  AllEnterpriseModule,
  SetFilterModule,
  MultiFilterModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  StatusBarModule,
  SideBarModule,
  RangeSelectionModule,
  RowGroupingModule,
  AggregationModule,
  PivotModule,
  MasterDetailModule,
  ViewportRowModelModule,
  ServerSideRowModelModule,
  InfiniteRowModelModule,
  ExcelExportModule,
  CsvExportModule,
  ClipboardModule,
  AdvancedFilterModule
]);

export interface AgGridTableProps {
  rowData: any[];
  columnDefs: ColDef[];
  onGridReady?: (event: GridReadyEvent) => void;
  context?: any;
  height?: string | number;
  width?: string | number;
  className?: string;
  loading?: boolean;
  enableExport?: boolean;
  enableSideBar?: boolean;
  enableStatusBar?: boolean;
  enableRowGrouping?: boolean;
  enablePivoting?: boolean;
  enableAdvancedFilter?: boolean;
  rowSelection?: 'single' | 'multiple' | false;
  theme?: 'alpine' | 'balham' | 'material' | 'legacy';
  gridOptions?: Partial<GridOptions>;
  autoHeight?: boolean;
  maxHeight?: string | number;
  minHeight?: string | number;
  pagination?: boolean;
  paginationPageSize?: number;
  animateRows?: boolean;
  enableRangeSelection?: boolean;
  enableCharts?: boolean;
  suppressRowClickSelection?: boolean;
  fillAvailableHeight?: boolean;
  bottomPadding?: number;
}

export const AgGridTable: React.FC<AgGridTableProps> = ({
  rowData,
  columnDefs,
  onGridReady,
  context,
  height = '500px',
  width = '100%',
  className = '',
  loading = false,
  enableExport = true,
  enableSideBar = true,
  enableStatusBar = true,
  enableRowGrouping = false,
  enablePivoting = true,
  enableAdvancedFilter = false,
  rowSelection = false,
  theme = 'alpine',
  gridOptions = {},
  autoHeight = false,
  maxHeight = '600px',
  minHeight = '200px',
  pagination = false,
  paginationPageSize = 20,
  animateRows = false,
  enableRangeSelection = false,
  enableCharts = false,
  suppressRowClickSelection = false,
  fillAvailableHeight = false,
  bottomPadding = 20,
}) => {
  const viewport = useViewport();
  const viewportConfig = getViewportConfig(viewport);
  const gridApiRef = useRef<GridApi | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [computedHeight, setComputedHeight] = useState<string>('400px');
  const lastTopRef = useRef<number>(0);

  // Dynamic height calculation for fillAvailableHeight mode
  useEffect(() => {
    if (!fillAvailableHeight || !containerRef.current) return;

    const calculateHeight = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - rect.top - bottomPadding;
      const finalHeight = Math.max(400, availableHeight);

      const newHeight = `${finalHeight}px`;
      setComputedHeight(prev => {
        const prevNum = parseInt(prev);
        if (Math.abs(prevNum - finalHeight) > 1) {
          return newHeight;
        }
        return prev;
      });

      lastTopRef.current = rect.top;
    };

    calculateHeight();

    const handleResize = () => calculateHeight();
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(calculateHeight);
      });
      resizeObserver.observe(containerRef.current);
      let parent = containerRef.current.parentElement;
      for (let i = 0; i < 3 && parent; i++) {
        resizeObserver.observe(parent);
        parent = parent.parentElement;
      }
    }

    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(calculateHeight);
      });
      const parent = containerRef.current.parentElement;
      if (parent) {
        mutationObserver.observe(parent, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'hidden', 'data-state']
        });
      }
    }

    const pollInterval = setInterval(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (Math.abs(rect.top - lastTopRef.current) > 5) {
        calculateHeight();
      }
    }, 500);

    const timeouts = [
      setTimeout(calculateHeight, 100),
      setTimeout(calculateHeight, 300),
      setTimeout(calculateHeight, 500),
      setTimeout(calculateHeight, 1000),
    ];

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      clearInterval(pollInterval);
      timeouts.forEach(clearTimeout);
    };
  }, [fillAvailableHeight, bottomPadding]);

  const handleResponsiveGrid = useCallback((gridApi: GridApi) => {
    if (!gridApi || gridApi.isDestroyed()) return;

    const config = getViewportConfig(viewport);

    if (config.useFitColumns) {
      try {
        gridApi.sizeColumnsToFit();
      } catch (error) {
        console.warn('Failed to size columns to fit:', error);
      }
    } else {
      const allColumns = gridApi.getAllDisplayedColumns();
      if (allColumns && allColumns.length > 0) {
        const columnWidths = allColumns.map((col: any) => {
          const colDef = col.getColDef();
          const currentWidth = col.getActualWidth();
          const targetWidth = colDef.width || Math.max(config.minColumnWidth, currentWidth || 70);

          return {
            key: col.getColId(),
            newWidth: targetWidth
          };
        });

        if (columnWidths.length) {
          try {
            gridApi.setColumnWidths(columnWidths);
            setTimeout(() => {
              if (!gridApi.isDestroyed()) {
                gridApi.refreshCells();
              }
            }, 100);
          } catch (error) {
            console.warn('Failed to set column widths:', error);
          }
        }
      }
    }
  }, [viewport]);

  const rowDataRef = useRef(rowData);
  useEffect(() => {
    rowDataRef.current = rowData;
  }, [rowData]);

  const handleGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
    handleResponsiveGrid(event.api);

    if (rowDataRef.current) {
      event.api.setGridOption('rowData', rowDataRef.current);
    }

    if (onGridReady) {
      onGridReady(event);
    }
  }, [onGridReady, handleResponsiveGrid]);

  useEffect(() => {
    if (gridApiRef.current && !gridApiRef.current.isDestroyed()) {
      handleResponsiveGrid(gridApiRef.current);
    }
  }, [viewport, handleResponsiveGrid]);

  useEffect(() => {
    if (gridApiRef.current && !gridApiRef.current.isDestroyed() && rowData) {
      gridApiRef.current.setGridOption('rowData', rowData);
    }
  }, [rowData]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    menuTabs: ['filterMenuTab' as const, 'generalMenuTab' as const, 'columnsMenuTab' as const],
    floatingFilter: false,
    minWidth: getViewportConfig(viewport).minColumnWidth,
    wrapHeaderText: true,
    autoHeaderHeight: true
  }), [viewport]);

  const sideBar = useMemo(() => {
    if (!enableSideBar) return false;

    return {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressRowGroups: !enableRowGrouping,
            suppressValues: false,
            suppressPivots: !enablePivoting,
            suppressPivotMode: !enablePivoting,
            suppressColumnFilter: false,
            suppressColumnSelectAll: false,
            suppressColumnExpandAll: false
          }
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel'
        }
      ]
    };
  }, [enableSideBar, enableRowGrouping, enablePivoting]);

  const statusBar = useMemo(() => {
    if (!enableStatusBar) return undefined;

    return {
      statusPanels: [
        {
          statusPanel: 'agTotalAndFilteredRowCountComponent',
          align: 'left' as const
        },
        {
          statusPanel: 'agAggregationComponent',
          align: 'center' as const
        },
        {
          statusPanel: 'agSelectedRowCountComponent',
          align: 'right' as const
        }
      ]
    };
  }, [enableStatusBar]);

  const rowSelectionConfig = useMemo(() => {
    if (rowSelection === false) return undefined;
    return rowSelection === 'single' ? 'single' as const : 'multiple' as const;
  }, [rowSelection]);

  const getContextMenuItems = useCallback((): (string | 'separator')[] => {
    const baseItems: (string | 'separator')[] = [
      'copy',
      'copyWithHeaders',
      'copyWithGroupHeaders',
      'separator',
      'paste',
    ];

    if (enableExport) {
      return [
        ...baseItems,
        'separator',
        'csvExport',
        'excelExport',
      ];
    }

    return baseItems;
  }, [enableExport]) as () => any;

  const defaultGridOptions: Partial<GridOptions> = useMemo(() => ({
    theme: 'legacy',
    defaultColDef,
    headerHeight: getViewportConfig(viewport).headerHeight,
    groupHeaderHeight: 30,
    rowHeight: getViewportConfig(viewport).rowHeight,
    suppressHorizontalScroll: false,
    animateRows: true,
    rowSelection: rowSelectionConfig,
    getRowStyle: () => ({ backgroundColor: 'white' }),
    cellSelection: true,
    enableAdvancedFilter,
    sideBar: getViewportConfig(viewport).showSideBar ? sideBar : false,
    statusBar: getViewportConfig(viewport).showStatusBar ? statusBar : undefined,
    allowContextMenuWithControlKey: true,
    copyHeadersToClipboard: true,
    copyGroupHeadersToClipboard: true,
    enableCellTextSelection: true,
    enableBrowserTooltips: false,
    tooltipShowDelay: 2000,
    rowGroupPanelShow: 'never',
    pivotPanelShow: enablePivoting ? 'always' : 'never',
    functionsReadOnly: false,
    suppressAggFuncInHeader: false,
    alwaysShowHorizontalScroll: getViewportConfig(viewport).alwaysShowHorizontalScroll,
    alwaysShowVerticalScroll: false,
    suppressScrollOnNewData: true,
    suppressAutoSize: getViewportConfig(viewport).isTabletOrPhone,
    suppressColumnVirtualisation: false,
    debug: false,
    getContextMenuItems: enableExport ? getContextMenuItems : undefined,
  }), [
    defaultColDef,
    rowSelectionConfig,
    enableAdvancedFilter,
    sideBar,
    statusBar,
    enableRowGrouping,
    enablePivoting,
    viewport,
    enableExport,
    getContextMenuItems,
  ]);

  const parseHeightToPixels = useCallback((value: string | number): number => {
    if (typeof value === 'number') return value;
    if (value.startsWith('calc(')) {
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
      const match = value.match(/calc\(100vh\s*-\s*(\d+)px\)/);
      if (match) return screenHeight - parseInt(match[1]);
      return screenHeight - 200;
    }
    return parseInt(value) || 600;
  }, []);

  const dynamicHeight = useMemo(() => {
    if (!autoHeight) return height;

    const headerHeight = 50;
    const rowHeight = 50;
    const footerHeight = enableStatusBar ? 40 : 0;
    const padding = 4;

    const calculatedHeight = headerHeight + (rowData.length * rowHeight) + footerHeight + padding;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
    const availableHeight = screenHeight - 200;

    const maxHeightNum = parseHeightToPixels(maxHeight);
    const minHeightNum = parseHeightToPixels(minHeight);

    const effectiveMaxHeight = Math.min(maxHeightNum, availableHeight);
    const constrainedHeight = Math.max(minHeightNum, Math.min(calculatedHeight, effectiveMaxHeight));

    return `${constrainedHeight}px`;
  }, [autoHeight, height, rowData.length, enableStatusBar, maxHeight, minHeight, parseHeightToPixels]);

  const finalGridOptions = useMemo(() => {
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
    const availableHeight = screenHeight - 200;
    const calculatedHeight = 50 + (rowData.length * 50) + (enableStatusBar ? 40 : 0) + 4;
    const needsScroll = autoHeight && calculatedHeight > availableHeight;
    const defaultDomLayout = needsScroll ? ('normal' as const) : ('autoHeight' as const);

    return {
      ...defaultGridOptions,
      ...gridOptions,
      alwaysShowVerticalScroll: gridOptions.alwaysShowVerticalScroll ?? false,
      suppressHorizontalScroll: gridOptions.suppressHorizontalScroll ?? false,
      suppressScrollOnNewData: gridOptions.suppressScrollOnNewData ?? true,
      domLayout: gridOptions.domLayout ?? defaultDomLayout
    };
  }, [defaultGridOptions, gridOptions, autoHeight, rowData.length, enableStatusBar]);

  const needsScrollComputed = useMemo(() => {
    if (finalGridOptions.domLayout === 'normal') return true;
    if (!autoHeight) return false;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
    const calculatedHeight = 50 + (rowData.length * 50) + 4;
    return calculatedHeight > (screenHeight - 200);
  }, [autoHeight, rowData.length, finalGridOptions.domLayout]);

  const containerHeight = useMemo(() => {
    if (finalGridOptions.domLayout === 'normal') return height;
    if (needsScrollComputed) return dynamicHeight;
    return 'auto';
  }, [finalGridOptions.domLayout, height, needsScrollComputed, dynamicHeight]);

  const effectiveGridOptions = useMemo(() => {
    if (fillAvailableHeight) {
      return {
        ...finalGridOptions,
        domLayout: 'normal' as const
      };
    }
    return finalGridOptions;
  }, [fillAvailableHeight, finalGridOptions]);

  const showScroll = fillAvailableHeight || needsScrollComputed;

  const containerStyles = useMemo((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      width,
      overflow: showScroll ? 'auto' : 'visible'
    };

    if (fillAvailableHeight) {
      return {
        ...baseStyles,
        height: computedHeight,
        minHeight: '400px',
        overflow: 'auto'
      };
    }

    return {
      ...baseStyles,
      height: containerHeight
    };
  }, [fillAvailableHeight, computedHeight, containerHeight, width, showScroll]);

  return (
    <div
      ref={containerRef}
      className={`ag-theme-${theme} ${showScroll ? 'needs-scroll' : 'no-scroll'} bg-white rounded-lg shadow-md ${className}`}
      style={containerStyles}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        onGridReady={handleGridReady}
        context={context}
        {...effectiveGridOptions}
      />
    </div>
  );
};

export const agGridUtils = {
  exportToCsv: (gridApi: GridApi, filename = 'data.csv') => {
    gridApi.exportDataAsCsv({ fileName: filename });
  },
  exportToExcel: (gridApi: GridApi, filename = 'data.xlsx') => {
    gridApi.exportDataAsExcel({ fileName: filename });
  },
  clearFilters: (gridApi: GridApi) => {
    gridApi.setFilterModel(null);
  },
  resetColumns: (gridApi: GridApi) => {
    gridApi.resetColumnState();
  },
  expandAllGroups: (gridApi: GridApi) => {
    const rowGroupCols = gridApi.getRowGroupColumns();
    if (rowGroupCols && rowGroupCols.length > 0) {
      gridApi.expandAll();
    }
  },
  collapseAllGroups: (gridApi: GridApi) => {
    const rowGroupCols = gridApi.getRowGroupColumns();
    if (rowGroupCols && rowGroupCols.length > 0) {
      gridApi.collapseAll();
    }
  },
  hasRowGroups: (gridApi: GridApi) => {
    const rowGroupCols = gridApi.getRowGroupColumns();
    return rowGroupCols && rowGroupCols.length > 0;
  },
  getSelectedRows: (gridApi: GridApi) => {
    return gridApi.getSelectedRows();
  },
  selectAll: (gridApi: GridApi) => {
    gridApi.selectAll();
  },
  deselectAll: (gridApi: GridApi) => {
    gridApi.deselectAll();
  }
};

export default AgGridTable;
