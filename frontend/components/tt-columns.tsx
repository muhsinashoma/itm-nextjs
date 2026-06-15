// components/tt-columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"

import {
    MoreVertical,
    Pencil,
    Trash2,
    CheckCircle,
    Clock,
    Circle,
    ChevronDown,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useTTModal } from "@/components/ui/tt-modal-store"

// ======================================================
// TYPE
// ======================================================

export type Section = {
    id: string
    tt_no: string
    employee_id?: string
    employee_name?: string
    assigned_name?: string
    query_type?: string
    requistionType: string
    status: "Closed" | "Open" | "Not Started"
    dept_name: string
    func_name: string
    delivered_status?: string
    created_at?: string
    tt_age?: string
    mobile_no: string
    assigned_id?: string
    company_name?: string
}

// ======================================================
// COMMON STYLE
// ======================================================

const textClass = "text-[11px]"
const badgeClass = "text-[11px] h-6 px-2.5 py-0 font-medium"
const buttonClass = "text-[11px] h-7 px-3 font-medium"
const menuClass = "text-[11px]"

// ======================================================
// COLUMNS
// ======================================================

export const columns: ColumnDef<Section>[] = [
    {
        accessorKey: "id",
        header: "Serial",
    },

    // ======================================================
    // TT NO
    // ======================================================

    {
        accessorKey: "tt_no",
        header: "TT No",

        cell: ({ row }) => {
            const section = row.original

            return <TTNoCell section={section} />
        },
    },

    // ======================================================
    // EMPLOYEE ID
    // ======================================================

    {
        accessorKey: "employee_id",
        header: "Employee ID",

        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.getValue("employee_id")}
            </span>
        ),
    },

    // ======================================================
    // EMPLOYEE NAME
    // ======================================================

    {
        accessorKey: "employee_name",
        header: "Employee Name",

        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.getValue("employee_name")}
            </span>
        ),
    },

    // ======================================================
    // QUERY TYPE
    // ======================================================

    {
        accessorKey: "query_type",
        header: "Query Type",

        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.getValue("query_type")}
            </span>
        ),
    },

    // ======================================================
    // TT AGE
    // ======================================================

    {
        accessorKey: "tt_age",
        header: "TT Age",

        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.getValue("tt_age")}
            </span>
        ),
    },

    // ======================================================
    // DEPARTMENT
    // ======================================================

    {
        accessorKey: "dept_name",
        header: "Dept Name",

        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.getValue("dept_name")}
            </span>
        ),
    },

    // ======================================================
    // FUNCTION
    // ======================================================

    {
        accessorKey: "func_name",
        header: "Function Name",

        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.getValue("func_name")}
            </span>
        ),
    },

    // ======================================================
    // MOBILE
    // ======================================================

    {
        accessorKey: "mobile_no",
        header: "Mobile No.",

        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.getValue("mobile_no")}
            </span>
        ),
    },

    // ======================================================
    // STATUS
    // ======================================================

    {
        accessorKey: "status",
        header: "Status",

        cell: ({ row }) => {
            const status = row.getValue("status") as string

            const statusConfig = {
                Closed: {
                    icon: <CheckCircle className="h-3.5 w-3.5" />,
                    className:
                        "bg-green-100 text-green-800 border-green-300",
                },

                Open: {
                    icon: <Clock className="h-3.5 w-3.5" />,
                    className:
                        "bg-yellow-100 text-yellow-800 border-yellow-300",
                },

                "Not Started": {
                    icon: <Circle className="h-3.5 w-3.5" />,
                    className:
                        "bg-muted text-foreground border-border",
                },
            }[status]

            return (
                <Badge
                    className={`
                        ${badgeClass}
                        ${statusConfig?.className}
                        gap-1
                    `}
                >
                    {statusConfig?.icon}
                    {status}
                </Badge>
            )
        },
    },

    // ======================================================
    // REQUISITION TYPE
    // ======================================================

    {
        accessorKey: "requistionType",
        header: "Requisition Type",

        cell: ({ row }) => {
            const rawType = row.getValue("requistionType") as string
            const type = rawType?.trim()

            const typeConfig = {
                Raised:
                    "bg-blue-100 text-blue-800 border-blue-300",

                "Petty Cash (Approved)":
                    "bg-green-100 text-green-800 border-green-300",

                "PR (Approved)":
                    "bg-indigo-100 text-indigo-800 border-indigo-300",
            }[type] || "bg-muted text-foreground border-border"

            return (
                <Badge
                    className={`
                        ${badgeClass}
                        ${typeConfig}
                    `}
                >
                    {rawType}
                </Badge>
            )
        },
    },

    // ======================================================
    // DELIVERED STATUS
    // ======================================================

    {
        accessorKey: "delivered_status",
        header: "Delivered Status",

        cell: ({ row }) => {
            const status = row.original.delivered_status as string

            if (!status) return null

            const statusConfig = {
                Pending: {
                    icon: <Clock className="h-3.5 w-3.5" />,
                    className:
                        "bg-yellow-100 text-yellow-800 border-yellow-300",
                },

                Delivered: {
                    icon: <CheckCircle className="h-3.5 w-3.5" />,
                    className:
                        "bg-green-100 text-green-800 border-green-300",
                },

                Canceled: {
                    icon: <Circle className="h-3.5 w-3.5" />,
                    className:
                        "bg-red-100 text-red-800 border-red-300",
                },
            }[status]

            return (
                <Badge
                    className={`
                        ${badgeClass}
                        ${statusConfig?.className}
                        gap-1
                    `}
                >
                    {statusConfig?.icon}
                    {status}
                </Badge>
            )
        },
    },

    // ======================================================
    // CREATED DATE
    // ======================================================

    {
        accessorKey: "created_at",
        header: "Created At",

        cell: ({ row }) => {
            const date = new Date(
                row.getValue("created_at") as string
            )

            return (
                <span className={textClass}>
                    {date.toLocaleDateString()}
                </span>
            )
        },
    },

    // ======================================================
    // ACTIONS
    // ======================================================

    {
        id: "actions",
        header: "Actions",

        cell: ({ row }) => {
            const section = row.original

            return <ActionCell section={section} />
        },
    },
]

// ======================================================
// TT NO CELL
// ======================================================

function TTNoCell({ section }: { section: Section }) {
    const { openModal } = useTTModal()

    return (
        <Badge
            variant="outline"
            className={`
                ${badgeClass}
                cursor-pointer
                bg-muted
                text-foreground
                border-border
            `}
            onClick={() => openModal(section)}
        >
            {section.tt_no}
        </Badge>
    )
}

// ======================================================
// ACTION CELL
// ======================================================

function ActionCell({ section }: { section: Section }) {
    const { openModal } = useTTModal()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`
                        ${buttonClass}
                        border-primary
                        text-primary
                        gap-1
                    `}
                >
                    Actions
                    <ChevronDown className="h-3.5 w-3.5" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-44 text-[11px]"
            >
                <DropdownMenuItem
                    className={`${menuClass} cursor-pointer`}
                    onClick={() => openModal(section)}
                >
                    <MoreVertical className="h-3.5 w-3.5 text-indigo-600" />
                    View Details
                </DropdownMenuItem>

                <DropdownMenuItem
                    className={`${menuClass} cursor-pointer`}
                >
                    <Pencil className="h-3.5 w-3.5 text-primary" />
                    Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className={`${menuClass} text-red-600 cursor-pointer`}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}