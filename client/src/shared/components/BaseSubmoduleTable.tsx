import {
  EditIcon,
  EyeIcon,
  FilterIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

export interface TableColumn {
  key: string;
  header: string;
  render?: (item: any) => React.ReactNode;
}

export interface TableFilter {
  key: string;
  placeholder: string;
  options?: { value: string; label: string }[];
  type?: "search" | "select";
}

interface BaseSubmoduleTableProps {
  title: string;
  data: any[];
  columns: TableColumn[];
  filters?: TableFilter[];
  onEdit?: (item: any) => void;
  onView?: (item: any) => void;
  onDelete?: (item: any) => void;
  isLoading?: boolean;
  /** Optional extra actions to render in the header toolbar */
  headerActions?: React.ReactNode;
  /** Accent color for table header row */
  headerColor?: string;
}

/**
 * BaseSubmoduleTable
 *
 * A generic, filterable data table with standardized column/action rendering.
 * Designed to be the common list-page component across all modules.
 *
 * Usage:
 * ```tsx
 * <BaseSubmoduleTable
 *   title="Contracts"
 *   data={contracts}
 *   columns={[
 *     { key: 'contractNo', header: 'Contract No.' },
 *     { key: 'status', header: 'Status', render: (item) => <Badge>{item.status}</Badge> },
 *   ]}
 *   filters={[
 *     { key: 'contractNo', placeholder: 'Search by contract no.', type: 'search' },
 *   ]}
 *   onEdit={handleEdit}
 *   onView={handleView}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const BaseSubmoduleTable: React.FC<BaseSubmoduleTableProps> = ({
  title,
  data,
  columns,
  filters = [],
  onEdit,
  onView,
  onDelete,
  isLoading = false,
  headerActions,
  headerColor = "#52baf3",
}) => {
  const [showFilters, setShowFilters] = useState(true);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Client-side filtering
  const filteredData = data.filter((item) =>
    Object.entries(filterValues).every(([key, value]) => {
      if (!value) return true;
      const itemValue = item[key];
      if (typeof itemValue === "string") {
        return itemValue.toLowerCase().includes(value.toLowerCase());
      }
      return itemValue === value;
    })
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilterValues({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading {title.toLowerCase()}…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h1 className="font-bold text-black text-xl">{title}</h1>
        <div className="flex items-center gap-2">
          {headerActions}
          <Button
            variant="outline"
            className="h-9 border text-sm flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <FilterIcon className="w-4 h-4" />
            <span>Filters</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && filters.length > 0 && (
        <div className="flex justify-between items-center gap-2 mb-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <div key={filter.key} className="relative">
                {filter.type === "search" ? (
                  <div className="relative w-[180px]">
                    <Input
                      className="h-8 pl-10 text-xs"
                      placeholder={filter.placeholder}
                      value={filterValues[filter.key] || ""}
                      onChange={(e) =>
                        handleFilterChange(filter.key, e.target.value)
                      }
                      data-testid={`filter-search-${filter.key}`}
                    />
                    <SearchIcon className="w-4 h-4 absolute left-3 top-2 text-gray-400" />
                  </div>
                ) : (
                  <Select
                    value={filterValues[filter.key] || ""}
                    onValueChange={(value) => handleFilterChange(filter.key, value)}
                  >
                    <SelectTrigger
                      className="w-[150px] h-8 bg-white text-xs"
                      data-testid={`filter-select-${filter.key}`}
                    >
                      <SelectValue placeholder={filter.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="h-8 text-xs"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="border-0 shadow-none bg-gray-50 rounded-lg">
        <CardContent className="p-4">
          <Table className="bg-white rounded-lg shadow-sm overflow-hidden">
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className="text-white text-xs font-normal"
                    style={{ backgroundColor: headerColor }}
                  >
                    {column.header}
                  </TableHead>
                ))}
                {(onView || onEdit || onDelete) && (
                  <TableHead
                    className="text-white text-xs font-normal w-24"
                    style={{ backgroundColor: headerColor }}
                  >
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)}
                    className="text-center py-12 text-gray-400 text-sm"
                  >
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow
                    key={index}
                    className="border-b border-gray-200 bg-white hover:bg-gray-50"
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className="text-gray-700 text-[13px] font-normal py-3"
                      >
                        {column.render ? column.render(item) : item[column.key]}
                      </TableCell>
                    ))}
                    {(onView || onEdit || onDelete) && (
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onView(item)}
                              data-testid={`button-view-${index}`}
                            >
                              <EyeIcon className="h-[18px] w-[18px] text-gray-500" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onEdit(item)}
                              data-testid={`button-edit-${index}`}
                            >
                              <EditIcon className="h-[18px] w-[18px] text-gray-500" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onDelete(item)}
                              data-testid={`button-delete-${index}`}
                            >
                              <Trash2Icon className="h-[18px] w-[18px] text-red-400" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Row Count */}
      <div className="mt-2 text-xs text-gray-500 px-1">
        {filteredData.length > 0
          ? `Showing 1 – ${filteredData.length} of ${filteredData.length}`
          : "No records"}
      </div>
    </div>
  );
};
