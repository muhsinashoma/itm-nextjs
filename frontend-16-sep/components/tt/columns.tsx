//itm/components/tt/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Section = {
    id: string
    tt_no: string
    employee_id?: string
    employee_name?: string
    query_type?: string
    requistionType: string
    status: "Closed" | "Open" | "Not Started"
    dept_name: string
    func_name: string
    mobile_no: string
    created_at?: string
}

type Props = {
    onView: (row: Section) => void
}

export const getColumns = ({ onView }: Props): ColumnDef<Section>[] => [
    // ================= SERIAL =================
    {
        accessorKey: "id",
        header: "Serial",
    },

    // ================= TT NO =================
    {
        accessorKey: "tt_no",
        header: "TT No",
        cell: ({ row }) => {
            const data = row.original

            return (
                <Badge
                    className= "cursor-pointer"
            onClick = {() => onView(data)}
                >
    { data.tt_no }
    </Badge>
            )
        },
    },

// ================= EMPLOYEE =================
{
    accessorKey: "employee_id",
        header: "Employee ID",
    },

// ================= STATUS =================
{
    accessorKey: "status",
        header: "Status",
    },

// ================= ACTIONS =================
{
    id: "actions",
        header: "Actions",
            cell: ({ row }) => {
                const data = row.original

                return (
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild >
                    <Button variant= "outline" size = "sm" >
                        Actions < ChevronDown className = "ml-1 h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>

                            < DropdownMenuContent align = "end" >
                                <DropdownMenuItem onClick={ () => onView(data) }>
                                    View Details
                                        </DropdownMenuItem>
                                        </DropdownMenuContent>
                                        </DropdownMenu>
            )
            },
    },
]