

// components/sales-columns.tsx
"use client"

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog"

import { ColumnDef } from "@tanstack/react-table"
import {
    MoreVertical,
    Pencil,
    Copy,
    Star,
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

// --------------------
// Type Definition
// --------------------
export type Section = {
    id: string
    tt_no: string
    employee_id?: string
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
}

// --------------------
// Column Definitions
// --------------------
export const columns: ColumnDef<Section>[] = [
    {
        accessorKey: "id",
        header: "Serial",
    },
    {
        accessorKey: "tt_no",
        header: "TT No",
        cell: ({ row }) => {
            const section = row.original
            return (
                <HoverCard>
                    <HoverCardTrigger asChild>
                        <Badge
                            variant="outline"
                            className="cursor-pointer bg-muted text-foreground border-border font-semibold px-3 py-1"
                        >
                            {section.tt_no}
                        </Badge>
                    </HoverCardTrigger>
                    <HoverCardContent align="start" className="space-y-2 bg-card text-foreground border border-border">
                        <p className="font-semibold text-sm">Ticket Preview</p>
                        <div className="text-xs space-y-1">
                            <p><b>Employee:</b> {section.employee_id}</p>
                            <p><b>Dept:</b> {section.dept_name}</p>
                            <p><b>Status:</b> {section.status}</p>
                            <p><b>Query:</b> {section.query_type}</p>
                        </div>
                    </HoverCardContent>
                </HoverCard>
            )
        },
    },
    {
        accessorKey: "employee_id",
        header: "Employee ID",
        cell: ({ row }) => <span className="font-medium">{row.getValue("employee_id")}</span>
    },
    {
        accessorKey: "query_type",
        header: "Query Type",
        cell: ({ row }) => <span className="font-medium">{row.getValue("query_type")}</span>
    },
    {
        accessorKey: "tt_age",
        header: "TT Age",
        cell: ({ row }) => <span className="font-medium">{row.getValue("tt_age")}</span>
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string

            const statusConfig = {
                Closed: {
                    icon: <CheckCircle className="h-4 w-4" />,
                    className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
                    iconColor: "text-green-600 dark:text-green-400",
                },
                Open: {
                    icon: <Clock className="h-4 w-4" />,
                    className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
                    iconColor: "text-yellow-600 dark:text-yellow-400",
                },
                "Not Started": {
                    icon: <Circle className="h-4 w-4" />,
                    className: "bg-muted text-foreground border-border dark:bg-muted",
                    iconColor: "text-muted-foreground",
                },
            }[status] || {
                icon: <Circle className="h-4 w-4" />,
                className: "bg-muted text-foreground border-border dark:bg-muted",
                iconColor: "text-muted-foreground",
            }

            return (
                <div className="flex items-center">
                    <Badge className={`${statusConfig.className} flex items-center gap-1.5 pl-2 pr-3 py-1.5`}>
                        <span className={statusConfig.iconColor}>{statusConfig.icon}</span>
                        {status}
                    </Badge>
                </div>
            )
        },
    },
    {
        accessorKey: "requistionType",
        header: "Requisition Type",
        cell: ({ row }) => {
            const rawType = row.getValue("requistionType") as string
            const type = rawType?.trim()

            const typeConfig = {
                "Raised": "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
                "Petty Cash (Approved)": "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
                "PR (Approved)": "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
            }[type] || "bg-muted text-foreground border-border dark:bg-muted"

            return (
                <Badge
                    className={`${typeConfig} px-3 py-1 text-xs font-medium`}
                >
                    {rawType}
                </Badge>
            )
        },
    },
    {
        accessorKey: "dept_name",
        header: "Dept Name",
        cell: ({ row }) => <span className="font-medium">{row.getValue("dept_name")}</span>
    },
    {
        accessorKey: "func_name",
        header: "Function Name",
        cell: ({ row }) => <span className="font-medium">{row.getValue("func_name")}</span>
    },
    {
        accessorKey: "mobile_no",
        header: "Mobile No.",
        cell: ({ row }) => <span className="font-medium">{row.getValue("mobile_no")}</span>
    },
    {
        accessorKey: "delivered_status",
        header: "Delivered Status",
        cell: ({ row }) => {
            const status = row.original.delivered_status as string
            if (!status) return null

            const statusConfig = {
                "Pending": {
                    icon: <Clock className="h-4 w-4" />,
                    className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
                    iconColor: "text-yellow-600 dark:text-yellow-400",
                },
                "Delivered": {
                    icon: <CheckCircle className="h-4 w-4" />,
                    className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
                    iconColor: "text-green-600 dark:text-green-400",
                },
                "Canceled": {
                    icon: <Circle className="h-4 w-4" />,
                    className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
                    iconColor: "text-red-600 dark:text-red-400",
                },
            }[status] || {
                icon: <Circle className="h-4 w-4" />,
                className: "bg-muted text-foreground border-border dark:bg-muted",
                iconColor: "text-muted-foreground",
            }

            return (
                <Badge className={`${statusConfig.className} flex items-center gap-1.5 pl-2 pr-3 py-1.5 text-xs font-medium`}>
                    <span className={statusConfig.iconColor}>{statusConfig.icon}</span>
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
            const date = new Date(row.getValue("created_at") as string)
            return date.toLocaleDateString()
        }
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const section = row.original

            return (
                <Dialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1 px-3 py-1 text-sm font-medium border-primary text-primary hover:bg-muted dark:hover:bg-muted">
                                Actions
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44 bg-card text-foreground border border-border">
                            <DialogTrigger asChild>
                                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                    <MoreVertical className="h-4 w-4 text-indigo-600" />
                                    View Details
                                </DropdownMenuItem>
                            </DialogTrigger>

                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                <Pencil className="h-4 w-4 text-primary" />
                                Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem className="flex items-center gap-2 text-red-600 cursor-pointer">
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DialogContent className="max-w-3xl w-full sm:w-[48rem] bg-card text-foreground border border-border rounded-lg shadow-lg fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6">
                        <DialogClose asChild>
                            <button className="absolute right-4 top-4 font-bold text-foreground hover:text-primary text-lg">✕</button>
                        </DialogClose>

                        <DialogTitle className="text-xl font-semibold mb-2 text-primary">Ticket Details - {section.tt_no}</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mb-4">
                            Complete information for this ticket.
                        </DialogDescription>

                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <p><b>Employee:</b> {section.employee_id}</p>
                            <p><b>Dept:</b> {section.dept_name}</p>
                            <p><b>Function:</b> {section.func_name}</p>
                            <p><b>Status:</b> {section.status}</p>
                            <p><b>Delivered:</b> {section.delivered_status}</p>
                            <p><b>Query:</b> {section.query_type}</p>
                            <p><b>TT Age:</b> {section.tt_age}</p>
                            <p><b>Mobile:</b> {section.mobile_no}</p>
                            <p><b>Created At:</b> {new Date(section.created_at || "").toLocaleDateString()}</p>
                            <p><b>Requistion Type:</b> {section.requistionType}</p>
                        </div>

                        <div className="mt-6 text-right">
                            <DialogClose asChild>
                                <Button className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900">
                                    Close
                                </Button>
                            </DialogClose>
                        </div>
                    </DialogContent>
                </Dialog>
            )
        },
    },
]
