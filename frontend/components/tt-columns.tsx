//ITM-Data/itm/frontend/components/tt-columns.tsx

"use client";

import type {
    ReactNode,
} from "react";

import type {
    ColumnDef,
} from "@tanstack/react-table";

import {
    CheckCircle,
    ChevronDown,
    Circle,
    Clock,
    MoreVertical,
    Pencil,
    PlayCircle,
    Trash2,
} from "lucide-react";

import {
    Badge,
} from "@/components/ui/badge";

import {
    Button,
} from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    useTTModal,
} from "@/components/ui/tt-modal-store";

import type {
    TroubleTicketItem,
    TroubleTicketStatus,
} from "@/lib/api";

import type {
    Section,
} from "@/types/tt";

export type {
    Section,
} from "@/types/tt";
/* ======================================================
   TYPE
====================================================== */


/* ======================================================
   DATA CONVERSION
====================================================== */

function formatDuration(
    seconds: number
): string {
    const safeSeconds = Math.max(
        0,
        Number(seconds || 0)
    );

    const days = Math.floor(
        safeSeconds / 86400
    );

    const hours = Math.floor(
        (safeSeconds % 86400) / 3600
    );

    const minutes = Math.floor(
        (safeSeconds % 3600) / 60
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

/* ======================================================
   COMMON HELPERS
====================================================== */

const textClass =
    "text-[11px] leading-4";

const badgeClass =
    "h-6 px-2.5 py-0 text-[10px] font-medium";

const buttonClass =
    "h-7 px-3 text-[11px] font-medium";

const menuClass =
    "text-[11px]";

function textValue(
    value: unknown
): string {
    const normalized =
        String(value ?? "").trim();

    return normalized || "—";
}

function CellText({
    value,
    className = "",
}: {
    value: unknown;
    className?: string;
}) {
    const display =
        textValue(value);

    return (
        <span
            title={
                display === "—"
                    ? undefined
                    : display
            }
            className={`
                ${textClass}
                block max-w-[240px]
                truncate font-medium
                text-foreground
                ${className}
            `}
        >
            {display}
        </span>
    );
}

function formatCreatedAt(
    value: string
): string {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    ).format(date);
}

/* ======================================================
   STATUS CONFIGURATION
====================================================== */

type BadgeConfiguration = {
    icon: ReactNode;
    className: string;
};

const statusConfiguration: Record<
    TroubleTicketStatus,
    BadgeConfiguration
> = {
    "Not Started": {
        icon: (
            <Circle className="h-3.5 w-3.5" />
        ),
        className:
            "border-slate-300 bg-slate-100 text-slate-700",
    },

    Open: {
        icon: (
            <Clock className="h-3.5 w-3.5" />
        ),
        className:
            "border-blue-300 bg-blue-100 text-blue-800",
    },

    "In Progress": {
        icon: (
            <PlayCircle className="h-3.5 w-3.5" />
        ),
        className:
            "border-amber-300 bg-amber-100 text-amber-800",
    },

    Closed: {
        icon: (
            <CheckCircle className="h-3.5 w-3.5" />
        ),
        className:
            "border-emerald-300 bg-emerald-100 text-emerald-800",
    },
};

const fallbackStatusConfiguration:
    BadgeConfiguration = {
    icon: (
        <Circle className="h-3.5 w-3.5" />
    ),
    className:
        "border-border bg-muted text-foreground",
};

/* ======================================================
   COLUMNS
====================================================== */

export const columns:
    ColumnDef<Section>[] = [
        {
            accessorKey: "id",
            header: "Serial",

            cell: ({ row }) => (
                <span
                    className={`${textClass} font-semibold tabular-nums`}
                >
                    {Number(
                        row.original.id
                    ).toLocaleString()}
                </span>
            ),
        },

        {
            accessorKey: "tt_no",
            header: "TT No",

            cell: ({ row }) => (
                <TTNoCell
                    section={
                        row.original
                    }
                />
            ),
        },

        {
            accessorKey:
                "employee_id",
            header: "Employee ID",

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .employee_id
                    }
                />
            ),
        },

        {
            accessorKey:
                "employee_name",
            header: "Employee Name",

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .employee_name
                    }
                    className="max-w-[180px]"
                />
            ),
        },

        {
            accessorKey:
                "assigned_name",
            header: "Assigned To",

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .assigned_name
                    }
                    className="max-w-[180px]"
                />
            ),
        },

        {
            accessorKey:
                "query_type",
            header: "Query Type",

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .query_type
                    }
                    className="max-w-[260px]"
                />
            ),
        },

        {
            accessorKey: "tt_age",
            header: "TT Age",

            cell: ({ row }) => (
                <span
                    className={`
                        ${textClass}
                        whitespace-nowrap
                        font-semibold
                        tabular-nums
                        text-foreground
                    `}
                >
                    {
                        row.original
                            .tt_age
                    }
                </span>
            ),
        },

        {
            accessorKey: "dept_name",
            header: "Dept Name",

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .dept_name
                    }
                    className="max-w-[180px]"
                />
            ),
        },

        {
            accessorKey: "func_name",
            header: "Function Name",

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .func_name
                    }
                    className="max-w-[180px]"
                />
            ),
        },

        {
            accessorKey: "mobile_no",
            header: "Mobile No.",

            cell: ({ row }) => (
                <span
                    className={`
                        ${textClass}
                        whitespace-nowrap
                        font-medium
                        tabular-nums
                        text-foreground
                    `}
                >
                    {textValue(
                        row.original
                            .mobile_no
                    )}
                </span>
            ),
        },

        {
            accessorKey: "status",
            header: "Status",

            cell: ({ row }) => {
                const status =
                    row.original.status;

                const configuration =
                    statusConfiguration[
                    status
                    ] ??
                    fallbackStatusConfiguration;

                return (
                    <Badge
                        variant="outline"
                        className={`
                            ${badgeClass}
                            gap-1 whitespace-nowrap
                            ${configuration.className}
                        `}
                    >
                        {
                            configuration.icon
                        }

                        {textValue(
                            status
                        )}
                    </Badge>
                );
            },
        },

        {
            accessorKey:
                "requisition_type",
            header: "Requisition Type",

            cell: ({ row }) => {
                const rawType =
                    String(
                        row.original
                            .requisition_type ??
                        row.original
                            .requistionType ??
                        ""
                    ).trim();

                if (!rawType) {
                    return (
                        <span
                            className={`${textClass} text-muted-foreground`}
                        >
                            —
                        </span>
                    );
                }

                const typeClasses:
                    Record<
                        string,
                        string
                    > = {
                    Raised:
                        "border-blue-300 bg-blue-100 text-blue-800",

                    "Petty Cash (Approved)":
                        "border-emerald-300 bg-emerald-100 text-emerald-800",

                    "PR (Approved)":
                        "border-indigo-300 bg-indigo-100 text-indigo-800",
                };

                const className =
                    typeClasses[
                    rawType
                    ] ??
                    "border-border bg-muted text-foreground";

                return (
                    <Badge
                        variant="outline"
                        title={rawType}
                        className={`
                            ${badgeClass}
                            max-w-[190px]
                            truncate
                            ${className}
                        `}
                    >
                        {rawType}
                    </Badge>
                );
            },
        },

        {
            accessorKey:
                "delivered_status",
            header: "Delivered Status",

            cell: ({ row }) => {
                const status =
                    String(
                        row.original
                            .delivered_status ??
                        ""
                    ).trim();

                if (!status) {
                    return (
                        <span
                            className={`${textClass} text-muted-foreground`}
                        >
                            —
                        </span>
                    );
                }

                const normalized =
                    status.toLowerCase();

                let configuration:
                    BadgeConfiguration;

                if (
                    normalized ===
                    "delivered"
                ) {
                    configuration = {
                        icon: (
                            <CheckCircle className="h-3.5 w-3.5" />
                        ),
                        className:
                            "border-emerald-300 bg-emerald-100 text-emerald-800",
                    };
                } else if (
                    normalized ===
                    "canceled" ||
                    normalized ===
                    "cancelled"
                ) {
                    configuration = {
                        icon: (
                            <Circle className="h-3.5 w-3.5" />
                        ),
                        className:
                            "border-red-300 bg-red-100 text-red-800",
                    };
                } else {
                    configuration = {
                        icon: (
                            <Clock className="h-3.5 w-3.5" />
                        ),
                        className:
                            "border-amber-300 bg-amber-100 text-amber-800",
                    };
                }

                return (
                    <Badge
                        variant="outline"
                        className={`
                            ${badgeClass}
                            gap-1 whitespace-nowrap
                            ${configuration.className}
                        `}
                    >
                        {
                            configuration.icon
                        }

                        {status}
                    </Badge>
                );
            },
        },

        {
            accessorKey:
                "created_at",
            header: "Created At",

            cell: ({ row }) => (
                <span
                    className={`
                        ${textClass}
                        whitespace-nowrap
                        text-foreground
                    `}
                >
                    {formatCreatedAt(
                        row.original
                            .created_at
                    )}
                </span>
            ),
        },

        {
            id: "actions",
            header: "Actions",

            cell: ({ row }) => (
                <ActionCell
                    section={
                        row.original
                    }
                />
            ),
        },
    ];

/* ======================================================
   TT NUMBER CELL
====================================================== */

function TTNoCell({
    section,
}: {
    section: Section;
}) {
    const {
        openModal,
    } = useTTModal();

    function openDetails() {
        openModal(section);
    }

    return (
        <Badge
            variant="outline"
            role="button"
            tabIndex={0}
            className={`
                ${badgeClass}
                cursor-pointer
                whitespace-nowrap
                border-border
                bg-muted
                font-semibold
                text-foreground
                hover:bg-muted/70
            `}
            onClick={openDetails}
            onKeyDown={(event) => {
                if (
                    event.key ===
                    "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    openDetails();
                }
            }}
        >
            {textValue(
                section.tt_no
            )}
        </Badge>
    );
}

/* ======================================================
   ACTION CELL
====================================================== */

function ActionCell({
    section,
}: {
    section: Section;
}) {
    const {
        openModal,
    } = useTTModal();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                asChild
            >
                <Button
                    variant="outline"
                    size="sm"
                    className={`
                        ${buttonClass}
                        gap-1
                        border-primary
                        text-primary
                    `}
                >
                    Actions

                    <ChevronDown className="h-3.5 w-3.5" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-44"
            >
                <DropdownMenuItem
                    className={`
                        ${menuClass}
                        cursor-pointer
                    `}
                    onClick={() =>
                        openModal(
                            section
                        )
                    }
                >
                    <MoreVertical className="h-3.5 w-3.5 text-indigo-600" />

                    View Details
                </DropdownMenuItem>

                <DropdownMenuItem
                    disabled
                    className={
                        menuClass
                    }
                >
                    <Pencil className="h-3.5 w-3.5 text-primary" />

                    Edit
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    disabled
                    className={`
                        ${menuClass}
                        text-red-600
                    `}
                >
                    <Trash2 className="h-3.5 w-3.5" />

                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

