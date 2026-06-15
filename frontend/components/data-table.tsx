
// itm/components/data-table.tsx

"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    SortingState,
    ColumnFiltersState,
    VisibilityState,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Search,
    X,
    Filter,
    Download,
    SlidersHorizontal,
    Eye,
    EyeOff,
} from "lucide-react"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    dateColumn?: string
}

export function DataTable<TData, TValue>({
    columns,
    data,
    dateColumn = "date",
}: DataTableProps<TData, TValue>) {

    /* =========================
       STATES
    ========================= */

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])

    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({
            dept_name: false,
            employee_name: false,
            func_name: false,
            mobile_no: false,
            postingArea: false,
            postingDistrict: false,
            personalMobile: false,
            officeMobile: false,
            vendor: false,
            assignedBy: false,
            department: false,
            userUsageDuration: false,
            deviceAge: false,
            warranty: false,
            purchaseDate: false,
            deviceType: false,
            remarks: false,
        })

    const [globalFilter, setGlobalFilter] = React.useState("")
    const [columnSearchOpen, setColumnSearchOpen] =
        React.useState(false)

    const [fromDate, setFromDate] = React.useState("")
    const [toDate, setToDate] = React.useState("")

    /* =========================
       FILTERED DATA
    ========================= */

    const filteredData = React.useMemo(() => {
        return data.filter((row: any) => {

            const ttNoMatch =
                !columnFilters.find(f => f.id === "tt_no") ||
                (row.tt_no ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(
                        (
                            columnFilters.find(
                                f => f.id === "tt_no"
                            )?.value ?? ""
                        )
                            .toString()
                            .toLowerCase()
                    )

            const employeeIdMatch =
                !columnFilters.find(
                    f => f.id === "employee_id"
                ) ||
                (row.employee_id ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(
                        (
                            columnFilters.find(
                                f => f.id === "employee_id"
                            )?.value ?? ""
                        )
                            .toString()
                            .toLowerCase()
                    )

            const statusMatch =
                !columnFilters.find(f => f.id === "status") ||
                (row.status ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(
                        (
                            columnFilters.find(
                                f => f.id === "status"
                            )?.value ?? ""
                        )
                            .toString()
                            .toLowerCase()
                    )

            let dateMatch = true

            if (fromDate || toDate) {
                const rowDate = new Date(row[dateColumn])

                const from = fromDate
                    ? new Date(fromDate)
                    : null

                const to = toDate
                    ? new Date(toDate)
                    : null

                if (
                    from &&
                    to &&
                    !(rowDate >= from && rowDate <= to)
                ) {
                    dateMatch = false
                }

                if (from && !to && rowDate < from) {
                    dateMatch = false
                }

                if (!from && to && rowDate > to) {
                    dateMatch = false
                }
            }

            return (
                ttNoMatch &&
                employeeIdMatch &&
                statusMatch &&
                dateMatch
            )
        })
    }, [
        data,
        fromDate,
        toDate,
        columnFilters,
        dateColumn,
    ])

    /* =========================
       TABLE
    ========================= */

    const table = useReactTable({
        data: filteredData,
        columns,

        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },

        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange:
            setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,

        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel:
            getPaginationRowModel(),
        getSortedRowModel:
            getSortedRowModel(),
        getFilteredRowModel:
            getFilteredRowModel(),
    })

    const activeFiltersCount =
        columnFilters.length +
        (globalFilter ? 1 : 0) +
        (fromDate || toDate ? 1 : 0)

    /* =========================
       CSV EXPORT
    ========================= */

    const exportToCSV = () => {
        const rows =
            table.getFilteredRowModel().rows

        if (!rows.length) return

        const visibleColumns =
            table
                .getAllLeafColumns()
                .filter(col => col.getIsVisible())

        const headers = visibleColumns.map(
            col =>
                col.columnDef.header?.toString() ||
                col.id
        )

        const csvRows = [
            headers.join(","),

            ...rows.map(row =>
                visibleColumns
                    .map(
                        col =>
                            `"${String(
                                row.getValue(col.id) ?? ""
                            ).replace(/"/g, '""')}"`
                    )
                    .join(",")
            ),
        ]

        const blob = new Blob(
            [csvRows.join("\n")],
            {
                type: "text/csv",
            }
        )

        const url =
            window.URL.createObjectURL(blob)

        const a =
            document.createElement("a")

        a.href = url

        a.download = `table-export-${new Date()
            .toISOString()
            .split("T")[0]
            }.csv`

        a.click()

        window.URL.revokeObjectURL(url)
    }

    /* =========================
       FILTER HELPERS
    ========================= */

    const clearAllFilters = () => {
        setGlobalFilter("")
        setColumnFilters([])
        setFromDate("")
        setToDate("")
    }

    const clearColumnFilter = (
        columnId: string
    ) => {
        setColumnFilters(prev =>
            prev.filter(f => f.id !== columnId)
        )
    }

    /* =========================
       RENDER
    ========================= */

    return (
        <div className="space-y-2 text-[10px] leading-tight text-foreground">

            {/* =========================
                TOOLBAR
            ========================= */}

            <div className="flex flex-wrap items-center justify-between gap-2">

                {/* LEFT */}

                <div className="flex flex-wrap items-center gap-2 flex-1">

                    {/* SEARCH */}

                    <div className="relative w-full max-w-md">

                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400" />

                        <Input
                            placeholder="Search..."
                            value={globalFilter}
                            onChange={e =>
                                setGlobalFilter(
                                    e.target.value
                                )
                            }
                            className="
                                h-8
                                pl-8
                                pr-8
                                text-[10px]
                                border-blue-300
                                focus-visible:ring-1
                                focus-visible:ring-blue-300
                            "
                        />

                        {globalFilter && (
                            <button
                                onClick={() =>
                                    setGlobalFilter("")
                                }
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* FILTER */}

                    <DropdownMenu
                        open={columnSearchOpen}
                        onOpenChange={
                            setColumnSearchOpen
                        }
                    >
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                className="
                                    h-8
                                    gap-1.5
                                    text-[10px]
                                    bg-green-200
                                    border
                                    border-green-300
                                    text-black
                                    hover:bg-green-300
                                "
                            >
                                <Filter className="h-3.5 w-3.5" />

                                Filter

                                {activeFiltersCount > 0 && (
                                    <Badge
                                        className="
                                            h-5
                                            min-w-5
                                            px-1
                                            text-[10px]
                                            bg-green-100
                                            text-black
                                        "
                                    >
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="start"
                            className="w-80 p-3 space-y-3"
                        >

                            {/* DATE FILTER */}

                            <div className="grid grid-cols-2 gap-3">

                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium">
                                        From Date
                                    </label>

                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={e =>
                                            setFromDate(
                                                e.target.value
                                            )
                                        }
                                        className="h-8 text-[10px]"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium">
                                        To Date
                                    </label>

                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={e =>
                                            setToDate(
                                                e.target.value
                                            )
                                        }
                                        className="h-8 text-[10px]"
                                    />
                                </div>
                            </div>

                            {/* COLUMN FILTERS */}

                            {[
                                "tt_no",
                                "employee_id",
                                "status",
                            ].map(colId => {
                                const column =
                                    table
                                        .getAllColumns()
                                        .find(
                                            c =>
                                                c.id ===
                                                colId
                                        )

                                if (!column) return null

                                return (
                                    <div
                                        key={colId}
                                        className="space-y-1"
                                    >
                                        <p className="text-[10px] font-medium capitalize">
                                            {colId}
                                        </p>

                                        <Input
                                            placeholder={`Filter ${colId}`}
                                            value={
                                                (column.getFilterValue() as string) ??
                                                ""
                                            }
                                            onChange={e =>
                                                column.setFilterValue(
                                                    e.target
                                                        .value
                                                )
                                            }
                                            className="h-8 text-[10px]"
                                        />
                                    </div>
                                )
                            })}

                            {/* FOOTER */}

                            <div className="flex justify-end gap-2 pt-2">

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-[10px]"
                                    onClick={() => {
                                        table.resetColumnFilters()
                                        setFromDate("")
                                        setToDate("")
                                        setColumnSearchOpen(
                                            false
                                        )
                                    }}
                                >
                                    Reset
                                </Button>

                                <Button
                                    size="sm"
                                    className="h-7 text-[10px] bg-green-500 hover:bg-green-600"
                                    onClick={() =>
                                        setColumnSearchOpen(
                                            false
                                        )
                                    }
                                >
                                    Apply
                                </Button>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* RIGHT */}

                <div className="flex items-center gap-2">

                    {/* COLUMN VISIBILITY */}

                    <DropdownMenu>

                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-[10px]"
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="w-56"
                        >
                            <DropdownMenuLabel className="text-[10px]">
                                Show / Hide Columns
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <div className="py-1">

                                {table
                                    .getAllColumns()
                                    .filter(col =>
                                        col.getCanHide()
                                    )
                                    .map(col => (
                                        <DropdownMenuCheckboxItem
                                            key={col.id}
                                            checked={col.getIsVisible()}
                                            onCheckedChange={val =>
                                                col.toggleVisibility(
                                                    !!val
                                                )
                                            }
                                            className="text-[10px]"
                                        >
                                            {col.getIsVisible() ? (
                                                <Eye className="mr-2 h-3.5 w-3.5" />
                                            ) : (
                                                <EyeOff className="mr-2 h-3.5 w-3.5" />
                                            )}

                                            {col.columnDef.header?.toString() ||
                                                col.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* EXPORT */}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        className="h-8 gap-1.5 text-[10px]"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export
                    </Button>
                </div>
            </div>

            {/* =========================
                ACTIVE FILTERS
            ========================= */}

            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">

                    {globalFilter && (
                        <Badge
                            variant="secondary"
                            className="h-6 text-[10px]"
                        >
                            Global: "{globalFilter}"

                            <button
                                onClick={() =>
                                    setGlobalFilter("")
                                }
                            >
                                <X className="ml-1 h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {columnFilters.map(f => (
                        <Badge
                            key={f.id}
                            variant="secondary"
                            className="h-6 text-[10px]"
                        >
                            {f.id}: "{String(f.value)}"

                            <button
                                onClick={() =>
                                    clearColumnFilter(
                                        f.id
                                    )
                                }
                            >
                                <X className="ml-1 h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-6 text-[10px]"
                    >
                        Clear all
                    </Button>
                </div>
            )}

            {/* =========================
                TABLE
            ========================= */}

            <div className="rounded-xl border border-border overflow-x-auto">

                <Table className="w-full min-w-[600px] table-auto border-collapse text-[10px]">

                    <TableHeader>

                        {table
                            .getHeaderGroups()
                            .map(headerGroup => (

                                <TableRow key={headerGroup.id}>

                                    {headerGroup.headers.map(
                                        header => (

                                            <TableHead
                                                key={header.id}
                                                className="
                                                    px-1
                                                    py-2
                                                    text-[10px]
                                                    font-semibold
                                                    text-center
                                                    bg-muted
                                                    border-b
                                                    whitespace-normal
                                                    break-words
                                                "
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
                            ))}
                    </TableHeader>

                    <TableBody>

                        {table.getRowModel().rows
                            ?.length ? (

                            table
                                .getRowModel()
                                .rows.map(row => (

                                    <TableRow
                                        key={row.id}
                                        className="hover:bg-muted/40"
                                    >

                                        {row
                                            .getVisibleCells()
                                            .map(cell => (

                                                <TableCell
                                                    key={cell.id}
                                                    className="
                                                        px-1
                                                        py-1
                                                        text-[10px]
                                                        text-center
                                                        align-middle
                                                        border-b
                                                        whitespace-normal
                                                        break-words
                                                    "
                                                >
                                                    {flexRender(
                                                        cell
                                                            .column
                                                            .columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                    </TableRow>
                                ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        columns.length
                                    }
                                    className="h-24 text-center text-[10px]"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* =========================
                PAGINATION
            ========================= */}

            <div className="flex items-center justify-between px-2">

                <p className="text-[10px] text-muted-foreground">
                    Page{" "}
                    {table.getState().pagination
                        .pageIndex + 1}{" "}
                    of {table.getPageCount()}
                </p>

                <div className="flex items-center gap-2">

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            table.previousPage()
                        }
                        disabled={
                            !table.getCanPreviousPage()
                        }
                        className="h-7 text-[10px]"
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
                        className="h-7 text-[10px]"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
