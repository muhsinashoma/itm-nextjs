"use client";

import { ColumnDef } from "@tanstack/react-table";

import {
    MoreVertical,
    CheckCircle,
    Clock,
    Circle,
    LoaderCircle,
    ChevronDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTTModal } from "@/components/ui/tt-modal-store";

import type {
    TroubleTicketItem,
    TroubleTicketStatus,
} from "@/lib/api";

export type Section = TroubleTicketItem & {
    id: number;
    requistionType: string;
    tt_age: string;
};

const textClass = "text-[11px]";
const badgeClass =
    "h-6 px-2.5 py-0 text-[11px] font-medium";
const buttonClass =
    "h-7 px-3 text-[11px] font-medium";

function formatDuration(
    seconds: number
): string {
    const safe = Math.max(
        0,
        Number(seconds || 0)
    );

    const days = Math.floor(
        safe / 86400
    );

    const hours = Math.floor(
        (safe % 86400) / 3600
    );

    const minutes = Math.floor(
        (safe % 3600) / 60
    );

    return `${days}d ${hours}h ${minutes}m`;
}

export function toSection(
    item: TroubleTicketItem
): Section {
    return {
        ...item,
        requistionType:
            item.requisition_type ?? "",
        tt_age: formatDuration(
            item.age_seconds
        ),
    };
}

export const columns: ColumnDef<Section>[] = [
    {
        id: "serial",
        header: "Serial",
        cell: ({ row }) => (
            <span className={textClass}>
                {row.index + 1}
            </span>
        ),
    },
    {
        accessorKey: "tt_no",
        header: "TT No",
        cell: ({ row }) => (
            <TTNoCell
                section={row.original}
            />
        ),
    },
    {
        accessorKey: "employee_id",
        header: "Employee ID",
        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.original.employee_id || "-"}
            </span>
        ),
    },
    {
        accessorKey: "employee_name",
        header: "Employee Name",
        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.original.employee_name || "-"}
            </span>
        ),
    },
    {
        accessorKey: "query_type",
        header: "Query Type",
        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.original.query_type || "-"}
            </span>
        ),
    },
    {
        accessorKey: "tt_age",
        header: "TT Age",
        cell: ({ row }) => (
            <span className={`${textClass} font-medium tabular-nums`}>
                {row.original.tt_age}
            </span>
        ),
    },
    {
        accessorKey: "dept_name",
        header: "Dept Name",
        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.original.dept_name || "-"}
            </span>
        ),
    },
    {
        accessorKey: "func_name",
        header: "Function Name",
        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.original.func_name || "-"}
            </span>
        ),
    },
    {
        accessorKey: "mobile_no",
        header: "Mobile No.",
        cell: ({ row }) => (
            <span className={`${textClass} font-medium`}>
                {row.original.mobile_no || "-"}
            </span>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <StatusBadge
                status={row.original.status}
            />
        ),
    },
    {
        accessorKey: "requistionType",
        header: "Requisition Type",
        cell: ({ row }) => {
            const value =
                row.original.requistionType;

            if (!value) {
                return (
                    <span className="text-[11px] text-muted-foreground">
                        -
                    </span>
                );
            }

            return (
                <Badge
                    variant="outline"
                    className={`${badgeClass} bg-muted text-foreground`}
                >
                    {value}
                </Badge>
            );
        },
    },
    {
        accessorKey: "delivered_status",
        header: "Delivered Status",
        cell: ({ row }) => {
            const value =
                row.original.delivered_status;

            if (!value) {
                return (
                    <span className="text-[11px] text-muted-foreground">
                        -
                    </span>
                );
            }

            const delivered =
                value === "Delivered";

            return (
                <Badge
                    className={`${badgeClass} ${
                        delivered
                            ? "border-green-300 bg-green-100 text-green-800"
                            : "border-yellow-300 bg-yellow-100 text-yellow-800"
                    }`}
                >
                    {delivered ? (
                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                    ) : (
                        <Clock className="mr-1 h-3.5 w-3.5" />
                    )}

                    {value}
                </Badge>
            );
        },
    },
    {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
            const value =
                row.original.created_at;

            if (!value) {
                return "-";
            }

            const date = new Date(value);

            return (
                <span className={textClass}>
                    {Number.isNaN(
                        date.getTime()
                    )
                        ? "-"
                        : date.toLocaleString()
                    }
                </span>
            );
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
            <ActionCell
                section={row.original}
            />
        ),
    },
];

function StatusBadge({
    status,
}: {
    status: TroubleTicketStatus;
}) {
    const config = {
        Closed: {
            icon: CheckCircle,
            className:
                "border-green-300 bg-green-100 text-green-800",
        },
        "In Progress": {
            icon: LoaderCircle,
            className:
                "border-blue-300 bg-blue-100 text-blue-800",
        },
        Open: {
            icon: Clock,
            className:
                "border-yellow-300 bg-yellow-100 text-yellow-800",
        },
        "Not Started": {
            icon: Circle,
            className:
                "border-border bg-muted text-foreground",
        },
    }[status];

    const Icon = config.icon;

    return (
        <Badge
            className={`${badgeClass} gap-1 ${config.className}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {status}
        </Badge>
    );
}

function TTNoCell({
    section,
}: {
    section: Section;
}) {
    const { openModal } = useTTModal();

    return (
        <Badge
            variant="outline"
            className={`${badgeClass} cursor-pointer border-border bg-muted text-foreground`}
            onClick={() =>
                openModal(section)
            }
        >
            {section.tt_no}
        </Badge>
    );
}

function ActionCell({
    section,
}: {
    section: Section;
}) {
    const { openModal } = useTTModal();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`${buttonClass} gap-1 border-primary text-primary`}
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
                    className="cursor-pointer text-[11px]"
                    onClick={() =>
                        openModal(section)
                    }
                >
                    <MoreVertical className="h-3.5 w-3.5 text-indigo-600" />
                    View Details
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
