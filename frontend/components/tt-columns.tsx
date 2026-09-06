
// //itm/frontend/components/tt-columns.tsx


"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
    CheckCircle,
    ChevronDown,
    ClipboardList,
    Clock,
    Eye,
    Pencil,
    Trash2,
    UserCheck,
    XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTTModal } from "@/components/ui/tt-modal-store";
import type { TroubleTicketItem } from "@/lib/api";
import type { Section } from "@/types/tt";

export type { Section } from "@/types/tt";

/* ======================================================
   TYPES
====================================================== */

type DisplayTicketStatus = "Open" | "Closed";

type BadgeConfiguration = {
    icon: ReactNode;
    className: string;
};

/* ======================================================
   TT ACTION PERMISSIONS
====================================================== */

export interface TTActionPermissions {
    canView: boolean;
    canAssign: boolean;
    canRequisition: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

/**
 * Convert backend permission codes into
 * UI-level Trouble Ticket permissions.
 *
 * Example:
 * [
 *   "TT_VIEW",
 *   "TT_ASSIGN",
 *   "TT_REQUISITION"
 * ]
 *
 * => View + Assign + Requisition
 * => Edit + Delete hidden
 */
export function mapTTPermissions(
    permissions: string[]
): TTActionPermissions {
    const permissionSet = new Set(
        permissions.map((permission) =>
            permission.trim().toUpperCase()
        )
    );

    return {
        canView: permissionSet.has("TT_VIEW"),
        canAssign: permissionSet.has("TT_ASSIGN"),
        canRequisition: permissionSet.has("TT_REQUISITION"),
        canEdit: permissionSet.has("TT_EDIT"),
        canDelete: permissionSet.has("TT_DELETE"),
    };
}

/* ======================================================
   HELPERS
====================================================== */

function normalizeTicketStatus(
    value: unknown
): DisplayTicketStatus {
    const normalized = String(value ?? "")
        .trim()
        .toLowerCase();

    if (
        normalized === "closed" ||
        normalized === "close" ||
        normalized === "0"
    ) {
        return "Closed";
    }

    return "Open";
}

function formatDuration(seconds: number): string {
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

function textValue(value: unknown): string {
    const normalized = String(
        value ?? ""
    ).trim();

    return normalized || "—";
}

function normalizeDateValue(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) {
        return "";
    }

    return trimmed
        .replace(" ", "T")
        .replace(
            /([+-]\d{2})$/,
            "$1:00"
        );
}

function formatCreatedAt(value: string): string {
    if (!value) {
        return "—";
    }

    const date = new Date(
        normalizeDateValue(value)
    );

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
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Dhaka",
        }
    ).format(date);
}

/* ======================================================
   API -> TABLE
====================================================== */

export function toSection(
    item: TroubleTicketItem
): Section {
    const requisitionType = String(
        item.requisition_type ?? ""
    ).trim();

    const deliveredStatus = String(
        item.delivered_status ?? ""
    ).trim();

    return {
        ...item,

        status: normalizeTicketStatus(
            item.status
        ),

        requisition_type:
            requisitionType,

        // Keep for old modal compatibility.
        requistionType:
            requisitionType,

        delivered_status:
            deliveredStatus,

        tt_age:
            formatDuration(
                item.age_seconds
            ),
    };
}

/* ======================================================
   COMMON STYLE
====================================================== */

const textClass =
    "text-[10px] leading-[13px]";

const badgeClass =
    "inline-flex h-[20px] items-center rounded-full px-1.5 py-0 text-[9px] font-medium leading-none whitespace-nowrap";

const buttonClass =
    "h-6 gap-1 px-2 text-[9px] font-medium";

const menuClass =
    "text-[10px]";

/* ======================================================
   CELL TEXT
====================================================== */

function CellText({
    value,
    className = "",
}: {
    value: unknown;
    className?: string;
}) {
    const display = textValue(value);

    return (
        <span
            title={
                display === "—"
                    ? undefined
                    : display
            }
            className={`
                ${textClass}
                block
                truncate
                font-medium
                text-foreground
                ${className}
            `}
        >
            {display}
        </span>
    );
}

/* ======================================================
   STATUS
====================================================== */

const statusConfiguration: Record<
    DisplayTicketStatus,
    BadgeConfiguration
> = {
    Open: {
        icon: (
            <Clock className="h-3 w-3 shrink-0" />
        ),
        className:
            "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
    },

    Closed: {
        icon: (
            <CheckCircle className="h-3 w-3 shrink-0" />
        ),
        className:
            "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
};

/* ======================================================
   REQUISITION
====================================================== */

function requisitionClass(
    value: string
): string {
    if (
        value ===
        "Petty Cash (Approved)"
    ) {
        return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    }

    if (
        value ===
        "PR (Approved)"
    ) {
        return "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300";
    }

    return "border-border bg-muted text-foreground";
}

/* ======================================================
   DELIVERY
====================================================== */

function deliveryConfiguration(
    value: string
): BadgeConfiguration {
    const normalized =
        value.trim().toLowerCase();

    if (
        normalized === "delivered"
    ) {
        return {
            icon: (
                <CheckCircle className="h-3 w-3 shrink-0" />
            ),
            className:
                "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        };
    }

    if (
        normalized === "rejected"
    ) {
        return {
            icon: (
                <XCircle className="h-3 w-3 shrink-0" />
            ),
            className:
                "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
        };
    }

    return {
        icon: (
            <Clock className="h-3 w-3 shrink-0" />
        ),
        className:
            "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    };
}

/* ======================================================
   TT NUMBER
====================================================== */

function TTNoCell({
    section,
}: {
    section: Section;
}) {
    const { openModal } =
        useTTModal();

    const ttNo = textValue(
        section.tt_no
    );

    return (
        <button
            type="button"
            title={ttNo}
            onClick={() =>
                openModal(section)
            }
            className="
                inline-flex
                h-[22px]
                min-w-[118px]
                items-center
                justify-center
                rounded-md
                border
                border-border
                bg-muted/40
                px-1.5
                font-mono
                text-[9.5px]
                font-semibold
                leading-none
                tracking-[-0.15px]
                text-foreground
                whitespace-nowrap
                tabular-nums
                transition-colors
                hover:border-primary/40
                hover:bg-primary/5
                hover:text-primary
                focus:outline-none
                focus:ring-2
                focus:ring-primary/20
            "
        >
            {ttNo}
        </button>
    );
}

/* ======================================================
   TT ACTIONS
====================================================== */

function ActionCell({
    section,
    permissions,
}: {
    section: Section;
    permissions: TTActionPermissions;
}) {
    const { openModal } =
        useTTModal();

    const hasActions =
        permissions.canView ||
        permissions.canAssign ||
        permissions.canRequisition ||
        permissions.canEdit ||
        permissions.canDelete;

    /*
     * No permission = no Action button.
     */
    if (!hasActions) {
        return null;
    }

    function handleAssign() {
        console.log(
            "Assign TT:",
            section.tt_no
        );
    }

    function handleRequisition() {
        console.log(
            "Requisition TT:",
            section.tt_no
        );
    }

    function handleEdit() {
        console.log(
            "Edit TT:",
            section.tt_no
        );
    }

    function handleDelete() {
        console.log(
            "Delete TT:",
            section.tt_no
        );
    }

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
                        border-primary/70
                        text-primary
                        hover:bg-primary/5
                        hover:text-primary
                    `}
                >
                    Action
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-44"
            >
                {/* VIEW */}
                {permissions.canView && (
                    <DropdownMenuItem
                        className={`
                            ${menuClass}
                            cursor-pointer
                        `}
                        onClick={() =>
                            openModal(section)
                        }
                    >
                        <Eye className="h-3.5 w-3.5 text-indigo-600" />
                        View Details
                    </DropdownMenuItem>
                )}

                {/* ASSIGN */}
                {permissions.canAssign && (
                    <DropdownMenuItem
                        className={`
                            ${menuClass}
                            cursor-pointer
                        `}
                        onClick={
                            handleAssign
                        }
                    >
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        Assign
                    </DropdownMenuItem>
                )}

                {/* REQUISITION */}
                {permissions.canRequisition && (
                    <DropdownMenuItem
                        className={`
                            ${menuClass}
                            cursor-pointer
                        `}
                        onClick={
                            handleRequisition
                        }
                    >
                        <ClipboardList className="h-3.5 w-3.5 text-indigo-600" />
                        Requisition
                    </DropdownMenuItem>
                )}

                {/* EDIT */}
                {permissions.canEdit && (
                    <DropdownMenuItem
                        className={`
                            ${menuClass}
                            cursor-pointer
                        `}
                        onClick={
                            handleEdit
                        }
                    >
                        <Pencil className="h-3.5 w-3.5 text-primary" />

                    </DropdownMenuItem>
                )}

                {/* DELETE */}
                {permissions.canDelete && (
                    <>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className={`
                                ${menuClass}
                                cursor-pointer
                                text-red-600
                                focus:text-red-700
                            `}
                            onClick={
                                handleDelete
                            }
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/* ======================================================
   COLUMNS
====================================================== */

export function createTTColumns(
    permissions: TTActionPermissions
): ColumnDef<Section>[] {
    return [
        {
            id: "serial",
            size: 48,
            minSize: 48,
            maxSize: 48,
            accessorFn: (
                _row,
                index
            ) => index + 1,
            header: "SL",
            enableHiding: false,
            enableSorting: false,
            cell: ({
                row,
                table,
            }) => {
                const orderedRows =
                    table
                        .getPrePaginationRowModel()
                        .rows;

                const position =
                    orderedRows.findIndex(
                        (item) =>
                            item.id ===
                            row.id
                    );

                const serial =
                    position >= 0
                        ? position + 1
                        : row.index + 1;

                return (
                    <span
                        className="
                            text-[10px]
                            font-semibold
                            tabular-nums
                            text-foreground
                        "
                    >
                        {serial}
                    </span>
                );
            },
        },

        {
            accessorKey: "tt_no",
            header: "TT No",
            size: 128,
            minSize: 128,
            maxSize: 128,
            enableHiding: false,
            cell: ({ row }) => (
                <TTNoCell
                    section={
                        row.original
                    }
                />
            ),
        },

        {
            accessorKey: "employee_id",
            header: "Employee ID",
            size: 82,
            minSize: 82,
            maxSize: 82,
            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .employee_id
                    }
                    className="
                        max-w-[80px]
                        whitespace-nowrap
                        tabular-nums
                    "
                />
            ),
        },

        {
            accessorKey: "employee_name",
            header: "Emp Name",
            size: 125,
            minSize: 110,
            maxSize: 150,
            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .employee_name
                    }
                    className="max-w-[120px]"
                />
            ),
        },

        {
            accessorKey: "query_type",
            header: "Query",
            size: 170,
            minSize: 140,
            maxSize: 200,
            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .query_type
                    }
                    className="max-w-[165px]"
                />
            ),
        },

        {
            accessorKey: "tt_age",
            header: "Age",
            size: 75,
            minSize: 70,
            maxSize: 82,
            cell: ({ row }) => (
                <span
                    className="
                        whitespace-nowrap
                        text-[10px]
                        font-semibold
                        tabular-nums
                        text-foreground
                    "
                >
                    {row.original.tt_age}
                </span>
            ),
        },

        {
            accessorKey: "dept_name",
            header: "Department",
            size: 120,
            minSize: 100,
            maxSize: 150,
            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .dept_name
                    }
                    className="max-w-[115px]"
                />
            ),
        },

        {
            accessorKey: "func_name",
            header: "Function",
            size: 90,
            minSize: 80,
            maxSize: 110,
            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .func_name
                    }
                    className="max-w-[85px]"
                />
            ),
        },

        {
            accessorKey: "mobile_no",
            header: "Mobile",
            size: 92,
            minSize: 88,
            maxSize: 100,
            cell: ({ row }) => (
                <span
                    className="
                        whitespace-nowrap
                        text-[10px]
                        font-medium
                        tabular-nums
                        text-foreground
                    "
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
            size: 76,
            minSize: 72,
            maxSize: 82,
            enableHiding: false,
            cell: ({ row }) => {
                const status =
                    normalizeTicketStatus(
                        row.original
                            .status
                    );

                const config =
                    statusConfiguration[
                    status
                    ];

                return (
                    <Badge
                        variant="outline"
                        className={`
                            ${badgeClass}
                            gap-1
                            ${config.className}
                        `}
                    >
                        {config.icon}
                        {status}
                    </Badge>
                );
            },
        },

        {
            accessorKey:
                "requisition_type",
            header: "Requisition",
            size: 116,
            minSize: 108,
            maxSize: 125,
            cell: ({ row }) => {
                const value =
                    String(
                        row.original
                            .requisition_type ??
                        ""
                    ).trim();

                if (!value) {
                    return (
                        <span
                            className="
                                text-[9px]
                                text-muted-foreground/70
                            "
                        >
                            —
                        </span>
                    );
                }

                let display = value;

                if (
                    value ===
                    "Petty Cash (Approved)"
                ) {
                    display = "Petty Cash";
                }

                if (
                    value ===
                    "PR (Approved)"
                ) {
                    display = "PR";
                }

                return (
                    <Badge
                        variant="outline"
                        title={value}
                        className={`
                            ${badgeClass}
                            gap-1
                            ${requisitionClass(
                            value
                        )}
                        `}
                    >
                        <CheckCircle className="h-3 w-3 shrink-0" />

                        <span className="whitespace-nowrap">
                            {display}
                        </span>
                    </Badge>
                );
            },
        },

        {
            accessorKey:
                "delivered_status",
            header: "Delivery",
            size: 92,
            minSize: 88,
            maxSize: 100,
            cell: ({ row }) => {
                const value =
                    String(
                        row.original
                            .delivered_status ??
                        ""
                    ).trim();

                if (!value) {
                    return (
                        <span
                            className="
                                text-[9px]
                                text-muted-foreground/70
                            "
                        >
                            —
                        </span>
                    );
                }

                const config =
                    deliveryConfiguration(
                        value
                    );

                return (
                    <Badge
                        variant="outline"
                        className={`
                            ${badgeClass}
                            gap-1
                            ${config.className}
                        `}
                    >
                        {config.icon}
                        {value}
                    </Badge>
                );
            },
        },

        {
            accessorKey: "created_at",
            header: "Created",
            size: 108,
            minSize: 100,
            maxSize: 115,
            cell: ({ row }) => {
                const formatted =
                    formatCreatedAt(
                        row.original
                            .created_at
                    );

                return (
                    <span
                        title={
                            row.original
                                .created_at
                        }
                        className="
                            block
                            max-w-[104px]
                            truncate
                            whitespace-nowrap
                            text-[9px]
                            text-foreground
                        "
                    >
                        {formatted}
                    </span>
                );
            },
        },

        /* ==================================================
           ACTION
        ================================================== */

        {
            id: "actions",
            header: "Action",
            size: 78,
            minSize: 76,
            maxSize: 82,
            enableHiding: false,
            enableSorting: false,

            cell: ({ row }) => (
                <ActionCell
                    section={
                        row.original
                    }
                    permissions={
                        permissions
                    }
                />
            ),
        },
    ];
}