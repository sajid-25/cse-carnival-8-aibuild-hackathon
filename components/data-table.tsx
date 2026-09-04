"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: string | React.ReactNode;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: keyof T | string;
  searchPlaceholder?: string;
  pageSize?: number;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  data = [],
  columns,
  searchKey,
  searchPlaceholder = "Search records...",
  pageSize = 10,
  actions,
  filters,
  onRowClick,
  emptyMessage = "No records found.",
  isLoading = false,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState(1);

  // 1. Search Filter
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();

    return data.filter((row) => {
      if (searchKey && row[searchKey] !== undefined) {
        return String(row[searchKey]).toLowerCase().includes(query);
      }
      // Global search across all string/number fields
      return Object.values(row).some((val) => {
        if (typeof val === "string" || typeof val === "number") {
          return String(val).toLowerCase().includes(query);
        }
        return false;
      });
    });
  }, [data, searchQuery, searchKey]);

  // 2. Sorting
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      return sortDirection === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDirection]);

  // 3. Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9"
            />
          </div>
          {filters}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table Surface */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "font-semibold text-xs tracking-wider uppercase text-muted-foreground select-none",
                      col.sortable && "cursor-pointer hover:text-foreground",
                      col.className
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-muted-foreground">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col, j) => (
                    <TableCell key={`skeleton-cell-${j}`}>
                      <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <TableRow
                  key={String(row.id ?? `row-${idx}`)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell
                        ? col.cell(row, idx)
                        : ((row[col.key] as React.ReactNode) ?? "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-36 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-8 w-8 stroke-[1.25] text-muted-foreground/60" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedData.length > pageSize && (
        <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">
              {(currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {sortedData.length}
            </span>{" "}
            results
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="px-2 text-xs font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
