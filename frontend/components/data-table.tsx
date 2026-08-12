
//This decides what is hidden initially.

//itm/frontend/components/data-table.tsx


"use client";

import * as React from "react";
import * as XLSX from "xlsx";

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

import {
    Input,
} from "@/components/ui/input";

import {
    Button,
} from "@/components/ui/button";

import {
    Badge,
} from "@/components/ui/badge";

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

/* ======================================================
   TYPES
====================================================== */
export type DataTableServerFilters = {
    fromDate: string;
    toDate: string;

    employeeId: string;

    status: string;

    itPersonal: string;
};

export type DataTableOption = {
    value: string;
    label: string;
};

interface DataTableProps<
    TData,
    TValue
> {
    columns: ColumnDef<
        TData,
        TValue
    >[];

    data: TData[];

    dateColumn?: string;

    compact?: boolean;

    serverSideDateFilter?: boolean;

    itPersonalOptions?: DataTableOption[];

    onApplyServerFilters?: (
        filters:
            DataTableServerFilters
    ) => void;
}

/* ======================================================
   DEFAULT COLUMN VISIBILITY
====================================================== */

const DEFAULT_HIDDEN_COLUMNS:
    VisibilityState = {
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

    dept_name: false,
    employee_name: false,
    func_name: false,
    mobile_no: false,

    postingArea: false,
    postingDistrict: false,
    personalMobile: false,
    officeMobile: false,
};

/* ======================================================
   HELPERS
====================================================== */

function normalizeValue(
    value: unknown
): string {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(
        value
    ).toLowerCase();
}

function normalizeDateOnly(
    value: unknown
): string | null {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    if (
        value instanceof Date
    ) {
        if (
            Number.isNaN(
                value.getTime()
            )
        ) {
            return null;
        }

        const year =
            value.getFullYear();

        const month =
            String(
                value.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const day =
            String(
                value.getDate()
            ).padStart(
                2,
                "0"
            );

        return `${year}-${month}-${day}`;
    }

    const text =
        String(
            value
        ).trim();

    if (!text) {
        return null;
    }

    const match =
        text.match(
            /(\d{4})-(\d{2})-(\d{2})/
        );

    if (match) {
        return (
            `${match[1]}-` +
            `${match[2]}-` +
            `${match[3]}`
        );
    }

    const parsed =
        new Date(
            text
        );

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return null;
    }

    const year =
        parsed.getFullYear();

    const month =
        String(
            parsed.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            parsed.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
}

function getColumnDisplayName(
    columnId: string
): string {
    const names:
        Record<string, string> = {
        employeeId:
            "Employee ID",

        employee_id:
            "Employee ID",

        employee_name:
            "Employee Name",

        status:
            "Status",

        requisition_type:
            "Requisition",

        delivered_status:
            "Delivery",

        tt_no:
            "TT No",

        created_at:
            "Created At",

        query_type:
            "Query",

        dept_name:
            "Department",

        func_name:
            "Function",

        mobile_no:
            "Mobile No",
    };

    return (
        names[columnId] ??
        columnId
    );
}

/* ======================================================
   DATA TABLE
====================================================== */

export function DataTable<
    TData,
    TValue
>({
    columns,
    data,
    dateColumn = "date",
    compact = false,
    serverSideDateFilter = false,
    itPersonalOptions = [],
    onApplyServerFilters,
}: DataTableProps<
    TData,
    TValue
>) {
    /* ==================================================
       STATE
    ================================================== */

    const [
        sorting,
        setSorting,
    ] =
        React.useState<
            SortingState
        >([]);

    const [
        columnFilters,
        setColumnFilters,
    ] =
        React.useState<
            ColumnFiltersState
        >([]);

    const [
        columnVisibility,
        setColumnVisibility,
    ] =
        React.useState<
            VisibilityState
        >(
            DEFAULT_HIDDEN_COLUMNS
        );

    const [
        globalFilter,
        setGlobalFilter,
    ] =
        React.useState("");

    const [
        filterOpen,
        setFilterOpen,
    ] =
        React.useState(false);

    const [
        fromDate,
        setFromDate,
    ] =
        React.useState("");

    const [
        toDate,
        setToDate,
    ] =
        React.useState("");

    const [
        itPersonal,
        setItPersonal,
    ] =
        React.useState("");

    /* ==================================================
       FILTERED DATA
    ================================================== */

    const filteredData =
        React.useMemo(
            () => {
                const searchText =
                    globalFilter
                        .trim()
                        .toLowerCase();

                return data.filter(
                    (
                        row: TData
                    ) => {
                        const record =
                            row as Record<
                                string,
                                unknown
                            >;

                        /* ==================================
                           GLOBAL SEARCH
                        ================================== */

                        const matchesGlobalSearch =
                            !searchText ||
                            Object.values(
                                record
                            ).some(
                                (
                                    value
                                ) =>
                                    normalizeValue(
                                        value
                                    ).includes(
                                        searchText
                                    )
                            );

                        /* ==================================
                           STATUS FILTER
                        ================================== */

                        const statusFilter =
                            columnFilters.find(
                                (
                                    filter
                                ) =>
                                    filter.id ===
                                    "status"
                            );

                        const matchesStatus =
                            !statusFilter ||
                            normalizeValue(
                                record.status
                            ).includes(
                                normalizeValue(
                                    statusFilter.value
                                )
                            );

                        /* ==================================
                           EMPLOYEE ID FILTER
                        ================================== */

                        const employeeIdFilter =
                            columnFilters.find(
                                (
                                    filter
                                ) =>
                                    filter.id ===
                                    "employeeId" ||
                                    filter.id ===
                                    "employee_id"
                            );

                        const employeeValue =
                            record.employee_id ??
                            record.employeeId ??
                            "";

                        const matchesEmployeeId =
                            !employeeIdFilter ||
                            normalizeValue(
                                employeeValue
                            ).includes(
                                normalizeValue(
                                    employeeIdFilter.value
                                )
                            );

                        /* ==================================
                           DATE FILTER
                        ================================== */

                        let matchesDate =
                            true;

                        /*
                         * For Trouble Ticket:
                         *
                         * serverSideDateFilter = true
                         *
                         * Therefore PostgreSQL already
                         * filtered the records and we must
                         * NOT filter them again here.
                         */
                        if (
                            !serverSideDateFilter &&
                            (
                                fromDate ||
                                toDate
                            )
                        ) {
                            const rawDate =
                                record[
                                dateColumn
                                ];

                            const rowDate =
                                normalizeDateOnly(
                                    rawDate
                                );

                            if (!rowDate) {
                                matchesDate =
                                    false;
                            } else {
                                if (
                                    fromDate &&
                                    rowDate <
                                    fromDate
                                ) {
                                    matchesDate =
                                        false;
                                }

                                if (
                                    toDate &&
                                    rowDate >
                                    toDate
                                ) {
                                    matchesDate =
                                        false;
                                }
                            }
                        }

                        return (
                            matchesGlobalSearch &&
                            matchesStatus &&
                            matchesEmployeeId &&
                            matchesDate
                        );
                    }
                );
            },
            [
                data,
                globalFilter,
                columnFilters,
                fromDate,
                toDate,
                dateColumn,
                serverSideDateFilter,
            ]
        );

    /* ==================================================
       TANSTACK TABLE
    ================================================== */

    const table =
        useReactTable({
            data:
                filteredData,

            columns,

            state: {
                sorting,
                columnFilters,
                columnVisibility,
            },

            onSortingChange:
                setSorting,

            onColumnFiltersChange:
                setColumnFilters,

            onColumnVisibilityChange:
                setColumnVisibility,

            getCoreRowModel:
                getCoreRowModel(),

            getFilteredRowModel:
                getFilteredRowModel(),

            getPaginationRowModel:
                getPaginationRowModel(),

            getSortedRowModel:
                getSortedRowModel(),
        });

    React.useEffect(
        () => {
            table.setPageIndex(
                0
            );
        },
        [
            globalFilter,
            columnFilters,
            fromDate,
            toDate,
        ]
    );

    /* ==================================================
       FILTER INFORMATION
    ================================================== */

    const activeFiltersCount =
        (globalFilter
            ? 1
            : 0) +
        columnFilters.length +
        (fromDate || toDate
            ? 1
            : 0) +
        (itPersonal
            ? 1
            : 0);

    function resetFilters() {
        setGlobalFilter(
            ""
        );

        setColumnFilters(
            []
        );

        setFromDate(
            ""
        );

        setToDate(
            ""
        );

        setItPersonal(
            ""
        );

        table.setPageIndex(
            0
        );

        /*
         * Reset backend Trouble Ticket filters.
         */
        const employeeId =
            String(
                employeeIdColumn
                    ?.getFilterValue() ??
                ""
            ).trim();

        const status =
            String(
                statusColumn
                    ?.getFilterValue() ??
                ""
            ).trim();

        onApplyServerFilters?.({
            fromDate,
            toDate,
            employeeId,
            status,
            itPersonal,
        });

        setFilterOpen(
            false
        );
    }

    /* ==================================================
       FIND FILTER COLUMNS
    ================================================== */

    const employeeIdColumn =
        table
            .getAllColumns()
            .find(
                (
                    column
                ) =>
                    column.id ===
                    "employee_id" ||
                    column.id ===
                    "employeeId"
            );

    const statusColumn =
        table
            .getAllColumns()
            .find(
                (
                    column
                ) =>
                    column.id ===
                    "status"
            );

    /* ==================================================
       EXCEL EXPORT
    ================================================== */

    function exportToExcel() {
        const rows =
            table
                .getFilteredRowModel()
                .rows;

        if (
            !rows.length
        ) {
            return;
        }

        const visibleColumns =
            table
                .getAllLeafColumns()
                .filter(
                    (
                        column
                    ) =>
                        column.getIsVisible() &&
                        column.id !==
                        "action"
                );

        const excelData =
            rows.map(
                (
                    row,
                    rowIndex
                ) => {
                    const excelRow:
                        Record<
                            string,
                            unknown
                        > = {};

                    visibleColumns.forEach(
                        (
                            column
                        ) => {
                            const header =
                                column
                                    .columnDef
                                    .header;

                            const columnName =
                                typeof header ===
                                    "string"
                                    ? header
                                    : getColumnDisplayName(
                                        column.id
                                    );

                            if (
                                column.id ===
                                "serial" ||
                                column.id ===
                                "sl"
                            ) {
                                excelRow[
                                    columnName
                                ] =
                                    rowIndex +
                                    1;

                                return;
                            }

                            const value =
                                row.getValue(
                                    column.id
                                );

                            excelRow[
                                columnName
                            ] =
                                value ??
                                "";
                        }
                    );

                    return excelRow;
                }
            );

        const worksheet =
            XLSX.utils
                .json_to_sheet(
                    excelData
                );

        worksheet["!cols"] =
            visibleColumns.map(
                (
                    column
                ) => {
                    switch (
                    column.id
                    ) {
                        case "tt_no":
                            return {
                                wch: 18,
                            };

                        case "employee_id":
                        case "employeeId":
                            return {
                                wch: 16,
                            };

                        case "employee_name":
                            return {
                                wch: 24,
                            };

                        case "query_type":
                            return {
                                wch: 40,
                            };

                        case "requisition_type":
                            return {
                                wch: 25,
                            };

                        case "delivered_status":
                            return {
                                wch: 18,
                            };

                        case "created_at":
                            return {
                                wch: 22,
                            };

                        default:
                            return {
                                wch: 16,
                            };
                    }
                }
            );

        const workbook =
            XLSX.utils
                .book_new();

        XLSX.utils
            .book_append_sheet(
                workbook,
                worksheet,
                "ITM Report"
            );

        const datePart =
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );

        let fileName =
            `itm-report-${datePart}`;

        if (
            fromDate ||
            toDate
        ) {
            fileName +=
                `-${fromDate || "start"}` +
                `-to-${toDate || "now"}`;
        }

        XLSX.writeFile(
            workbook,
            `${fileName}.xlsx`,
            {
                compression:
                    true,
            }
        );
    }

    const visibleColumnCount =
        table
            .getVisibleLeafColumns()
            .length;

    /* ==================================================
       STYLE
    ================================================== */

    const toolbarButtonClass =
        compact
            ? "h-8 gap-1.5 px-2.5 text-[10px]"
            : "h-9 gap-2 text-xs";

    const toolbarIconClass =
        compact
            ? "h-3.5 w-3.5"
            : "h-4 w-4";

    const filterLabelClass =
        compact
            ? "text-[10px] font-medium text-muted-foreground"
            : "text-xs font-medium text-muted-foreground";

    const filterInputClass =
        compact
            ? "h-7 text-[10px]"
            : "h-8 text-xs";

    /* ==================================================
       UI
    ================================================== */

    return (
        <div
            className={
                compact
                    ? "space-y-2 text-foreground"
                    : "space-y-3 text-sm text-foreground"
            }
        >
            {/* TOOLBAR */}

            <div
                className={`
                    flex flex-wrap
                    items-center
                    justify-between
                    ${compact
                        ? "gap-2"
                        : "gap-3"
                    }
                `}
            >
                <div
                    className={`
                        flex min-w-0
                        flex-1 flex-wrap
                        items-center
                        ${compact
                            ? "gap-1.5"
                            : "gap-2"
                        }
                    `}
                >
                    {/* Search */}

                    <div
                        className={`
                            relative w-full
                            ${compact
                                ? "max-w-[420px]"
                                : "max-w-lg"
                            }
                        `}
                    >
                        <Search
                            className={`
                                absolute
                                top-1/2
                                -translate-y-1/2
                                text-primary/70
                                ${compact
                                    ? "left-2.5 h-3.5 w-3.5"
                                    : "left-3 h-4 w-4"
                                }
                            `}
                        />

                        <Input
                            placeholder="Search TT, employee, query, status..."
                            value={
                                globalFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setGlobalFilter(
                                    event
                                        .target
                                        .value
                                )
                            }
                            className={
                                compact
                                    ? "h-8 border-primary/30 pl-8 pr-8 text-[11px] focus-visible:ring-primary/30"
                                    : "h-9 border-primary/30 pl-9 pr-9 text-sm focus-visible:ring-primary/30"
                            }
                        />

                        {globalFilter && (
                            <button
                                type="button"
                                onClick={() =>
                                    setGlobalFilter(
                                        ""
                                    )
                                }
                                className={`
                                    absolute
                                    top-1/2
                                    -translate-y-1/2
                                    text-muted-foreground
                                    transition-colors
                                    hover:text-foreground
                                    ${compact
                                        ? "right-2.5"
                                        : "right-3"
                                    }
                                `}
                                aria-label="Clear search"
                            >
                                <X
                                    className={
                                        compact
                                            ? "h-3.5 w-3.5"
                                            : "h-4 w-4"
                                    }
                                />
                            </button>
                        )}
                    </div>

                    {/* Filter */}

                    <DropdownMenu
                        open={
                            filterOpen
                        }
                        onOpenChange={
                            setFilterOpen
                        }
                    >
                        <DropdownMenuTrigger
                            asChild
                        >
                            <Button
                                size="sm"
                                className={`
                                    ${toolbarButtonClass}
                                    border
                                    border-emerald-300
                                    bg-emerald-100
                                    text-emerald-900
                                    hover:bg-emerald-200
                                    hover:text-emerald-900
                                `}
                            >
                                <Filter
                                    className={
                                        toolbarIconClass
                                    }
                                />

                                Filter

                                {activeFiltersCount >
                                    0 && (
                                        <Badge
                                            className={`
                                                rounded-full
                                                bg-emerald-600
                                                p-0
                                                text-white
                                                ${compact
                                                    ? "h-4 min-w-4 px-1 text-[8px]"
                                                    : "h-5 min-w-5 px-1 text-[10px]"
                                                }
                                            `}
                                        >
                                            {
                                                activeFiltersCount
                                            }
                                        </Badge>
                                    )}
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="start"
                            className={
                                compact
                                    ? "w-72 p-2.5"
                                    : "w-80 p-3"
                            }
                        >
                            <div
                                className={
                                    compact
                                        ? "space-y-2.5"
                                        : "space-y-3"
                                }
                            >
                                {/* Date filters */}

                                <div
                                    className={
                                        compact
                                            ? "grid grid-cols-2 gap-2"
                                            : "grid grid-cols-2 gap-3"
                                    }
                                >
                                    <div className="space-y-1">
                                        <label
                                            className={
                                                filterLabelClass
                                            }
                                        >
                                            From Date
                                        </label>

                                        <Input
                                            type="date"
                                            value={
                                                fromDate
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setFromDate(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            className={
                                                filterInputClass
                                            }
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label
                                            className={
                                                filterLabelClass
                                            }
                                        >
                                            To Date
                                        </label>

                                        <Input
                                            type="date"
                                            value={
                                                toDate
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setToDate(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            className={
                                                filterInputClass
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Employee ID */}

                                {employeeIdColumn && (
                                    <div className="space-y-1">
                                        <label
                                            className={
                                                filterLabelClass
                                            }
                                        >
                                            Employee ID
                                        </label>

                                        <Input
                                            placeholder="Employee ID"
                                            value={
                                                (
                                                    employeeIdColumn
                                                        .getFilterValue() as string
                                                ) ??
                                                ""
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                employeeIdColumn
                                                    .setFilterValue(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                            }
                                            className={
                                                filterInputClass
                                            }
                                        />
                                    </div>
                                )}



                                {/* IT Personnel */}

                                {serverSideDateFilter && (
                                    <div className="space-y-1">
                                        <label
                                            className={
                                                filterLabelClass
                                            }
                                        >
                                            IT Personnel
                                        </label>

                                        <select
                                            value={
                                                itPersonal
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setItPersonal(
                                                    event.target.value
                                                )
                                            }
                                            className={`
                w-full
                rounded-md
                border
                border-input
                bg-background
                px-2
                text-foreground
                outline-none
                focus:ring-2
                focus:ring-primary/20

                ${compact
                                                    ? "h-7 text-[10px]"
                                                    : "h-8 text-xs"
                                                }
            `}
                                        >
                                            <option value="">
                                                All IT Personnel
                                            </option>

                                            {itPersonalOptions.map(
                                                (
                                                    person
                                                ) => (
                                                    <option
                                                        key={
                                                            person.value
                                                        }
                                                        value={
                                                            person.value
                                                        }
                                                    >
                                                        {
                                                            person.label
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                )}



                                {/* Status */}

                                {statusColumn && (
                                    <div className="space-y-1">
                                        <label
                                            className={
                                                filterLabelClass
                                            }
                                        >
                                            Status
                                        </label>

                                        <select
                                            value={
                                                (
                                                    statusColumn
                                                        .getFilterValue() as string
                                                ) ?? ""
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                statusColumn
                                                    .setFilterValue(
                                                        event.target.value
                                                    )
                                            }
                                            className={`
                                                w-full
                                                rounded-md
                                                border
                                                border-input
                                                bg-background
                                                px-2
                                                text-foreground
                                                outline-none
                                                focus:ring-2
                                                focus:ring-primary/20

                                                ${compact
                                                    ? "h-7 text-[10px]"
                                                    : "h-8 text-xs"
                                                }
                                            `}
                                        >
                                            <option value="">
                                                All Status
                                            </option>

                                            <option value="Open">
                                                Open
                                            </option>

                                            <option value="Closed">
                                                Closed
                                            </option>
                                        </select>
                                    </div>
                                )}

                                {/* Actions */}

                                <div
                                    className={`
                                        flex
                                        justify-end
                                        border-t
                                        border-border
                                        ${compact
                                            ? "gap-1.5 pt-2"
                                            : "gap-2 pt-3"
                                        }
                                    `}
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={
                                            compact
                                                ? "h-7 px-2.5 text-[10px]"
                                                : "h-8 text-xs"
                                        }
                                        onClick={
                                            resetFilters
                                        }
                                    >
                                        Reset
                                    </Button>

                                    <Button
                                        size="sm"
                                        className={
                                            compact
                                                ? "h-7 px-2.5 text-[10px]"
                                                : "h-8 text-xs"
                                        }
                                        onClick={() => {
                                            table.setPageIndex(
                                                0
                                            );

                                            const employeeId =
                                                String(
                                                    employeeIdColumn
                                                        ?.getFilterValue() ??
                                                    ""
                                                ).trim();

                                            const status =
                                                String(
                                                    statusColumn
                                                        ?.getFilterValue() ??
                                                    ""
                                                ).trim();

                                            onApplyServerFilters?.({
                                                fromDate,
                                                toDate,
                                                employeeId,
                                                status,
                                                itPersonal,
                                            });

                                            setFilterOpen(
                                                false
                                            );
                                        }}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Right toolbar */}

                <div
                    className={`
                        flex items-center
                        ${compact
                            ? "gap-1.5"
                            : "gap-2"
                        }
                    `}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            asChild
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className={
                                    toolbarButtonClass
                                }
                            >
                                <SlidersHorizontal
                                    className={
                                        toolbarIconClass
                                    }
                                />

                                Columns
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="max-h-[420px] w-64 overflow-y-auto"
                        >
                            <DropdownMenuLabel
                                className={
                                    compact
                                        ? "text-[10px]"
                                        : "text-xs"
                                }
                            >
                                Show / Hide Columns
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <div className="py-1">
                                {table
                                    .getAllColumns()
                                    .filter(
                                        (
                                            column
                                        ) =>
                                            column.getCanHide()
                                    )
                                    .map(
                                        (
                                            column
                                        ) => {
                                            const header =
                                                column
                                                    .columnDef
                                                    .header;

                                            const label =
                                                typeof header ===
                                                    "string"
                                                    ? header
                                                    : getColumnDisplayName(
                                                        column.id
                                                    );

                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={
                                                        column.id
                                                    }
                                                    checked={
                                                        column.getIsVisible()
                                                    }
                                                    onCheckedChange={(
                                                        value
                                                    ) =>
                                                        column.toggleVisibility(
                                                            Boolean(
                                                                value
                                                            )
                                                        )
                                                    }
                                                    className={
                                                        compact
                                                            ? "text-[10px]"
                                                            : "text-xs"
                                                    }
                                                >
                                                    {column.getIsVisible() ? (
                                                        <Eye className="mr-2 h-3 w-3" />
                                                    ) : (
                                                        <EyeOff className="mr-2 h-3 w-3" />
                                                    )}

                                                    {
                                                        label
                                                    }
                                                </DropdownMenuCheckboxItem>
                                            );
                                        }
                                    )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={
                            exportToExcel
                        }
                        className={
                            toolbarButtonClass
                        }
                    >
                        <Download
                            className={
                                toolbarIconClass
                            }
                        />

                        Excel
                    </Button>
                </div>
            </div>

            {/* ACTIVE FILTERS */}

            {activeFiltersCount >
                0 && (
                    <div
                        className={`
                            flex flex-wrap
                            items-center
                            ${compact
                                ? "gap-1.5"
                                : "gap-2"
                            }
                        `}
                    >
                        {globalFilter && (
                            <Badge
                                variant="secondary"
                                className={
                                    compact
                                        ? "h-5 gap-1 px-2 text-[9px]"
                                        : "gap-1 text-xs"
                                }
                            >
                                Search:{" "}
                                {
                                    globalFilter
                                }

                                <button
                                    type="button"
                                    onClick={() =>
                                        setGlobalFilter(
                                            ""
                                        )
                                    }
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}

                        {columnFilters.map(
                            (
                                filter
                            ) => (
                                <Badge
                                    key={
                                        filter.id
                                    }
                                    variant="secondary"
                                    className={
                                        compact
                                            ? "h-5 gap-1 px-2 text-[9px]"
                                            : "gap-1 text-xs"
                                    }
                                >
                                    {getColumnDisplayName(
                                        filter.id
                                    )}
                                    :{" "}
                                    {String(
                                        filter.value
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setColumnFilters(
                                                (
                                                    current
                                                ) =>
                                                    current.filter(
                                                        (
                                                            item
                                                        ) =>
                                                            item.id !==
                                                            filter.id
                                                    )
                                            )
                                        }
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )
                        )}

                        {(fromDate ||
                            toDate) && (
                                <Badge
                                    variant="secondary"
                                    className={
                                        compact
                                            ? "h-5 gap-1 px-2 text-[9px]"
                                            : "gap-1 text-xs"
                                    }
                                >
                                    Date:{" "}
                                    {fromDate ||
                                        "Start"}{" "}
                                    —{" "}
                                    {toDate ||
                                        "Now"}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFromDate(
                                                ""
                                            );

                                            setToDate(
                                                ""
                                            );

                                            onApplyServerFilters?.({
                                                fromDate: "",
                                                toDate: "",
                                                employeeId: "",
                                                status: "",
                                                itPersonal: "",
                                            });
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={
                                resetFilters
                            }
                            className={
                                compact
                                    ? "h-6 px-2 text-[9px]"
                                    : "h-7 text-xs"
                            }
                        >
                            Clear all
                        </Button>
                    </div>
                )}

            {/* TABLE */}

            <div
                className={`
                    overflow-x-auto
                    border border-border
                    bg-card
                    ${compact
                        ? "rounded-lg"
                        : "rounded-xl"
                    }
                `}
            >
                <Table
                    className={`
                        w-full
                        table-fixed
                        border-collapse
                        ${compact
                            ? "min-w-[860px] text-[9px]"
                            : "min-w-[940px] text-[10px]"
                        }
                    `}
                >
                    <TableHeader>
                        {table
                            .getHeaderGroups()
                            .map(
                                (
                                    headerGroup
                                ) => (
                                    <TableRow
                                        key={
                                            headerGroup.id
                                        }
                                        className="hover:bg-transparent"
                                    >
                                        {headerGroup.headers.map(
                                            (
                                                header
                                            ) => (
                                                <TableHead
                                                    key={
                                                        header.id
                                                    }
                                                    className={`
                                                        whitespace-nowrap
                                                        border-b
                                                        bg-muted/60
                                                        text-center
                                                        font-semibold
                                                        uppercase
                                                        tracking-wide
                                                        text-muted-foreground
                                                        ${compact
                                                            ? "h-8 px-1.5 py-1 text-[8px]"
                                                            : "px-2 py-2 text-[9px]"
                                                        }
                                                    `}
                                                    style={{
                                                        width:
                                                            header.getSize() !==
                                                                150
                                                                ? header.getSize()
                                                                : undefined,
                                                    }}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header
                                                                .column
                                                                .columnDef
                                                                .header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        )}
                                    </TableRow>
                                )
                            )}
                    </TableHeader>

                    <TableBody>
                        {table
                            .getRowModel()
                            .rows
                            .length ? (
                            table
                                .getRowModel()
                                .rows
                                .map(
                                    (
                                        row
                                    ) => (
                                        <TableRow
                                            key={
                                                row.id
                                            }
                                            className={`
                                                border-b
                                                border-border/70
                                                transition-colors
                                                hover:bg-primary/[0.035]

                                                ${compact
                                                    ? "h-8"
                                                    : ""
                                                }
                                            `}
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map(
                                                    (
                                                        cell
                                                    ) => (
                                                        <TableCell
                                                            key={
                                                                cell.id
                                                            }
                                                            className={`
                                                                overflow-hidden
                                                                whitespace-nowrap
                                                                text-center
                                                                align-middle

                                                                ${compact
                                                                    ? "h-8 px-1 py-[3px] text-[9px]"
                                                                    : "px-2 py-2 text-[10px]"
                                                                }

                                                                ${cell.column.id ===
                                                                    "tt_no"
                                                                    ? "font-semibold text-primary [&>button]:border-primary/25 [&>button]:bg-primary/[0.06] [&>button]:text-primary [&>button]:shadow-none hover:[&>button]:border-primary/45 hover:[&>button]:bg-primary/10 hover:[&>button]:text-primary focus-within:[&>button]:border-primary/50 focus-within:[&>button]:ring-2 focus-within:[&>button]:ring-primary/20"
                                                                    : ""
                                                                }
                                                            `}
                                                            style={{
                                                                width:
                                                                    cell.column.getSize(),

                                                                minWidth:
                                                                    cell.column.getSize(),

                                                                maxWidth:
                                                                    cell.column.getSize(),
                                                            }}
                                                        >
                                                            {flexRender(
                                                                cell.column.columnDef.cell,
                                                                cell.getContext()
                                                            )}
                                                        </TableCell>
                                                    )
                                                )}
                                        </TableRow>
                                    )
                                )
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        visibleColumnCount
                                    }
                                    className={
                                        compact
                                            ? "h-20 text-center text-[10px] text-muted-foreground"
                                            : "h-28 text-center text-sm text-muted-foreground"
                                    }
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* PAGINATION */}

            <div
                className={`
                    flex items-center
                    justify-between
                    ${compact
                        ? "px-0.5"
                        : "px-1"
                    }
                `}
            >
                <p
                    className={
                        compact
                            ? "text-[10px] text-muted-foreground"
                            : "text-xs text-muted-foreground"
                    }
                >
                    Page{" "}
                    <span className="font-medium text-foreground">
                        {table
                            .getState()
                            .pagination
                            .pageIndex +
                            1}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                        {Math.max(
                            table.getPageCount(),
                            1
                        )}
                    </span>
                </p>

                <div
                    className={
                        compact
                            ? "flex items-center gap-1.5"
                            : "flex items-center gap-2"
                    }
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            table.previousPage()
                        }
                        disabled={
                            !table.getCanPreviousPage()
                        }
                        className={
                            compact
                                ? "h-7 px-2.5 text-[10px]"
                                : "h-8 text-xs"
                        }
                    >
                        Previous
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            table.nextPage()
                        }
                        disabled={
                            !table.getCanNextPage()
                        }
                        className={
                            compact
                                ? "h-7 px-2.5 text-[10px]"
                                : "h-8 text-xs"
                        }
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}