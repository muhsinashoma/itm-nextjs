
//This decides what is hidden initially.

// itm/components/data-table.tsx


"use client";

import * as React from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";

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
import { Badge } from "@/components/ui/badge";

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Download,
    Eye,
    EyeOff,
    Filter,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    dateColumn?: string;
}

const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
    /*
     * Asset report default visible columns:
     *
     * SL
     * Reference No
     * Employee ID
     * Employee
     * Designation
     * deviceSl
     * Category
     * Model
     * Status
     * Actions
     */

    // Asset report optional columns
    mrnNumber: false,
    prNumber: false,
    department: false,
    designation: false,
    brand: false,
    deviceType: false,
    vendor: false,
    assignedBy: false,
    assignedDate: false,
    returnedDate: false,
    transferredDate: false,
    purchaseDate: false,
    warranty: false,
    deviceAge: false,
    userUsageDuration: false,
    remarks: false,

    // Shared employee / other table optional columns
    dept_name: false,
    employee_name: false,
    func_name: false,
    mobile_no: false,
    postingArea: false,
    postingDistrict: false,
    personalMobile: false,
    officeMobile: false,
};

function normalizeValue(value: unknown) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).toLowerCase();
}

export function DataTable<TData, TValue>({
    columns,
    data,
    dateColumn = "date",
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);

    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>(DEFAULT_HIDDEN_COLUMNS);

    const [globalFilter, setGlobalFilter] = React.useState("");
    const [filterOpen, setFilterOpen] = React.useState(false);

    const [fromDate, setFromDate] = React.useState("");
    const [toDate, setToDate] = React.useState("");

    const filteredData = React.useMemo(() => {
        const searchText = globalFilter.trim().toLowerCase();

        return data.filter((row: TData) => {
            const record = row as Record<string, unknown>;

            const matchesGlobalSearch =
                !searchText ||
                Object.values(record).some((value) =>
                    normalizeValue(value).includes(searchText)
                );

            const statusFilter = columnFilters.find(
                (filter) => filter.id === "status"
            );

            const employeeIdFilter = columnFilters.find(
                (filter) => filter.id === "employeeId"
            );

            const matchesStatus =
                !statusFilter ||
                normalizeValue(record.status).includes(
                    normalizeValue(statusFilter.value)
                );

            const matchesEmployeeId =
                !employeeIdFilter ||
                normalizeValue(record.employeeId).includes(
                    normalizeValue(employeeIdFilter.value)
                );

            let matchesDate = true;

            if (fromDate || toDate) {
                const rawDate = record[dateColumn];

                if (!rawDate) {
                    matchesDate = false;
                } else {
                    const rowDate = new Date(String(rawDate));

                    if (Number.isNaN(rowDate.getTime())) {
                        matchesDate = false;
                    } else {
                        const startDate = fromDate
                            ? new Date(`${fromDate}T00:00:00`)
                            : null;

                        const endDate = toDate
                            ? new Date(`${toDate}T23:59:59`)
                            : null;

                        if (startDate && rowDate < startDate) {
                            matchesDate = false;
                        }

                        if (endDate && rowDate > endDate) {
                            matchesDate = false;
                        }
                    }
                }
            }

            return (
                matchesGlobalSearch &&
                matchesStatus &&
                matchesEmployeeId &&
                matchesDate
            );
        });
    }, [
        data,
        globalFilter,
        columnFilters,
        fromDate,
        toDate,
        dateColumn,
    ]);

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const activeFiltersCount =
        (globalFilter ? 1 : 0) +
        columnFilters.length +
        (fromDate || toDate ? 1 : 0);

    const resetFilters = () => {
        setGlobalFilter("");
        setColumnFilters([]);
        setFromDate("");
        setToDate("");
        setFilterOpen(false);
    };

    const exportToCSV = () => {
        const rows = table.getFilteredRowModel().rows;

        if (!rows.length) {
            return;
        }

        const visibleColumns = table
            .getAllLeafColumns()
            .filter((column) => column.getIsVisible());

        const headers = visibleColumns.map((column) => {
            const header = column.columnDef.header;

            if (typeof header === "string") {
                return header;
            }

            return column.id;
        });

        const csvRows = rows.map((row) =>
            visibleColumns
                .map((column) => {
                    const value = row.getValue(column.id) ?? "";

                    return `"${String(value).replace(/"/g, '""')}"`;
                })
                .join(",")
        );

        const blob = new Blob(
            [[headers.join(","), ...csvRows].join("\n")],
            {
                type: "text/csv;charset=utf-8;",
            }
        );

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `asset-report-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
    };

    const visibleColumnCount = table.getVisibleLeafColumns().length;

    return (
        <div className="space-y-3 text-sm text-foreground">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <div className="relative w-full max-w-lg">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />

                        <Input
                            placeholder="Search reference, employee, category, model..."
                            value={globalFilter}
                            onChange={(event) =>
                                setGlobalFilter(event.target.value)
                            }
                            className="h-9 border-primary/30 pl-9 pr-9 text-sm focus-visible:ring-primary/30"
                        />

                        {globalFilter && (
                            <button
                                type="button"
                                onClick={() => setGlobalFilter("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <DropdownMenu
                        open={filterOpen}
                        onOpenChange={setFilterOpen}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                className="h-9 gap-2 border border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                            >
                                <Filter className="h-4 w-4" />
                                Filter

                                {activeFiltersCount > 0 && (
                                    <Badge className="h-5 min-w-5 rounded-full bg-emerald-600 px-1 text-[10px] text-white">
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="start"
                            className="w-80 p-3"
                        >
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            From Date
                                        </label>

                                        <Input
                                            type="date"
                                            value={fromDate}
                                            onChange={(event) =>
                                                setFromDate(
                                                    event.target.value
                                                )
                                            }
                                            className="h-8 text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            To Date
                                        </label>

                                        <Input
                                            type="date"
                                            value={toDate}
                                            onChange={(event) =>
                                                setToDate(
                                                    event.target.value
                                                )
                                            }
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>

                                {["employeeId", "status"].map((columnId) => {
                                    const column = table
                                        .getAllColumns()
                                        .find(
                                            (item) => item.id === columnId
                                        );

                                    if (!column) {
                                        return null;
                                    }

                                    const label =
                                        columnId === "employeeId"
                                            ? "Employee ID"
                                            : "Status";

                                    return (
                                        <div
                                            key={columnId}
                                            className="space-y-1"
                                        >
                                            <label className="text-xs font-medium text-muted-foreground">
                                                {label}
                                            </label>

                                            <Input
                                                placeholder={`Filter by ${label}`}
                                                value={
                                                    (column.getFilterValue() as string) ??
                                                    ""
                                                }
                                                onChange={(event) =>
                                                    column.setFilterValue(
                                                        event.target.value
                                                    )
                                                }
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    );
                                })}

                                <div className="flex justify-end gap-2 border-t border-border pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={resetFilters}
                                    >
                                        Reset
                                    </Button>

                                    <Button
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => setFilterOpen(false)}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 text-xs"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="max-h-[420px] w-64 overflow-y-auto"
                        >
                            <DropdownMenuLabel className="text-xs">
                                Show / Hide Columns
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <div className="py-1">
                                {table
                                    .getAllColumns()
                                    .filter((column) =>
                                        column.getCanHide()
                                    )
                                    .map((column) => {
                                        const header =
                                            column.columnDef.header;

                                        const label =
                                            typeof header === "string"
                                                ? header
                                                : column.id;

                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        Boolean(value)
                                                    )
                                                }
                                                className="text-xs"
                                            >
                                                {column.getIsVisible() ? (
                                                    <Eye className="mr-2 h-3.5 w-3.5" />
                                                ) : (
                                                    <EyeOff className="mr-2 h-3.5 w-3.5" />
                                                )}

                                                {label}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        className="h-9 gap-2 text-xs"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Active filter chips */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {globalFilter && (
                        <Badge
                            variant="secondary"
                            className="gap-1 text-xs"
                        >
                            Search: {globalFilter}

                            <button
                                type="button"
                                onClick={() => setGlobalFilter("")}
                                aria-label="Clear search filter"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    )}

                    {columnFilters.map((filter) => (
                        <Badge
                            key={filter.id}
                            variant="secondary"
                            className="gap-1 text-xs"
                        >
                            {filter.id}: {String(filter.value)}

                            <button
                                type="button"
                                onClick={() =>
                                    setColumnFilters((current) =>
                                        current.filter(
                                            (item) =>
                                                item.id !== filter.id
                                        )
                                    )
                                }
                                aria-label={`Clear ${filter.id} filter`}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    ))}

                    {(fromDate || toDate) && (
                        <Badge
                            variant="secondary"
                            className="gap-1 text-xs"
                        >
                            Date: {fromDate || "Start"} — {toDate || "Now"}

                            <button
                                type="button"
                                onClick={() => {
                                    setFromDate("");
                                    setToDate("");
                                }}
                                aria-label="Clear date filter"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="h-7 text-xs"
                    >
                        Clear all
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
                {/* <Table className="min-w-[1180px] table-fixed border-collapse text-xs"> */}
                <Table className="w-full min-w-[940px] table-fixed border-collapse text-[10px]">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="hover:bg-transparent"
                            >
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}

                                        // className="whitespace-nowrap border-b bg-muted/60 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"

                                        className="
    whitespace-nowrap
    border-b
    bg-muted/60
    px-2
    py-2
    text-center
    text-[9px]
    font-semibold
    uppercase
    tracking-wide
    text-muted-foreground
"

                                        style={{
                                            width:
                                                header.getSize() !== 150
                                                    ? header.getSize()
                                                    : undefined,
                                        }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef
                                                    .header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="border-b border-border/70 transition-colors hover:bg-primary/[0.03]"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            // className="overflow-hidden px-3 py-3 text-center align-middle text-xs whitespace-nowrap"
                                            className="
    overflow-hidden
    whitespace-nowrap
    px-2
    py-2
    text-center
    align-middle
    text-[10px]
    text-ellipsis
"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={visibleColumnCount}
                                    className="h-28 text-center text-sm text-muted-foreground"
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-1">
                <p className="text-xs text-muted-foreground">
                    Page{" "}
                    <span className="font-medium text-foreground">
                        {table.getState().pagination.pageIndex + 1}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                        {table.getPageCount()}
                    </span>
                </p>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 text-xs"
                    >
                        Previous
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-8 text-xs"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}