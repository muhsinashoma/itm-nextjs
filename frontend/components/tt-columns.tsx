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

// export type Section =
//     TroubleTicketItem & {
//         /*
//          * Keep this alias temporarily because
//          * older modal/table code may still use
//          * the previous misspelled property.
//          */
//         requistionType: string;

//         tt_age: string;
//     };

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


// "use client"

// import { ColumnDef } from "@tanstack/react-table"

// import {
//     MoreVertical,
//     Pencil,
//     Trash2,
//     CheckCircle,
//     Clock,
//     Circle,
//     ChevronDown,
// } from "lucide-react"

// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"

// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

// import { useTTModal } from "@/components/ui/tt-modal-store"

// // ======================================================
// // TYPE
// // ======================================================

// export type Section = {
//     id: string
//     tt_no: string
//     employee_id?: string
//     employee_name?: string
//     assigned_name?: string
//     query_type?: string
//     requistionType: string
//     status: "Closed" | "Open" | "Not Started"
//     dept_name: string
//     func_name: string
//     delivered_status?: string
//     created_at?: string
//     tt_age?: string
//     mobile_no: string
//     assigned_id?: string
//     company_name?: string
// }

// // ======================================================
// // COMMON STYLE
// // ======================================================

// const textClass = "text-[11px]"
// const badgeClass = "text-[11px] h-6 px-2.5 py-0 font-medium"
// const buttonClass = "text-[11px] h-7 px-3 font-medium"
// const menuClass = "text-[11px]"

// // ======================================================
// // COLUMNS
// // ======================================================

// export const columns: ColumnDef<Section>[] = [
//     {
//         accessorKey: "id",
//         header: "Serial",
//     },

//     // ======================================================
//     // TT NO
//     // ======================================================

//     {
//         accessorKey: "tt_no",
//         header: "TT No",

//         cell: ({ row }) => {
//             const section = row.original

//             return <TTNoCell section={section} />
//         },
//     },

//     // ======================================================
//     // EMPLOYEE ID
//     // ======================================================

//     {
//         accessorKey: "employee_id",
//         header: "Employee ID",

//         cell: ({ row }) => (
//             <span className={`${textClass} font-medium`}>
//                 {row.getValue("employee_id")}
//             </span>
//         ),
//     },

//     // ======================================================
//     // EMPLOYEE NAME
//     // ======================================================

//     {
//         accessorKey: "employee_name",
//         header: "Employee Name",

//         cell: ({ row }) => (
//             <span className={`${textClass} font-medium`}>
//                 {row.getValue("employee_name")}
//             </span>
//         ),
//     },

//     // ======================================================
//     // QUERY TYPE
//     // ======================================================

//     {
//         accessorKey: "query_type",
//         header: "Query Type",

//         cell: ({ row }) => (
//             <span className={`${textClass} font-medium`}>
//                 {row.getValue("query_type")}
//             </span>
//         ),
//     },

//     // ======================================================
//     // TT AGE
//     // ======================================================

//     {
//         accessorKey: "tt_age",
//         header: "TT Age",

//         cell: ({ row }) => (
//             <span className={`${textClass} font-medium`}>
//                 {row.getValue("tt_age")}
//             </span>
//         ),
//     },

//     // ======================================================
//     // DEPARTMENT
//     // ======================================================

//     {
//         accessorKey: "dept_name",
//         header: "Dept Name",

//         cell: ({ row }) => (
//             <span className={`${textClass} font-medium`}>
//                 {row.getValue("dept_name")}
//             </span>
//         ),
//     },

//     // ======================================================
//     // FUNCTION
//     // ======================================================

//     {
//         accessorKey: "func_name",
//         header: "Function Name",

//         cell: ({ row }) => (
//             <span className={`${textClass} font-medium`}>
//                 {row.getValue("func_name")}
//             </span>
//         ),
//     },

//     // ======================================================
//     // MOBILE
//     // ======================================================

//     {
//         accessorKey: "mobile_no",
//         header: "Mobile No.",

//         cell: ({ row }) => (
//             <span className={`${textClass} font-medium`}>
//                 {row.getValue("mobile_no")}
//             </span>
//         ),
//     },

//     // ======================================================
//     // STATUS
//     // ======================================================

//     {
//         accessorKey: "status",
//         header: "Status",

//         cell: ({ row }) => {
//             const status = row.getValue("status") as string

//             const statusConfig = {
//                 Closed: {
//                     icon: <CheckCircle className="h-3.5 w-3.5" />,
//                     className:
//                         "bg-green-100 text-green-800 border-green-300",
//                 },

//                 Open: {
//                     icon: <Clock className="h-3.5 w-3.5" />,
//                     className:
//                         "bg-yellow-100 text-yellow-800 border-yellow-300",
//                 },

//                 "Not Started": {
//                     icon: <Circle className="h-3.5 w-3.5" />,
//                     className:
//                         "bg-muted text-foreground border-border",
//                 },
//             }[status]

//             return (
//                 <Badge
//                     className={`
//                         ${badgeClass}
//                         ${statusConfig?.className}
//                         gap-1
//                     `}
//                 >
//                     {statusConfig?.icon}
//                     {status}
//                 </Badge>
//             )
//         },
//     },

//     // ======================================================
//     // REQUISITION TYPE
//     // ======================================================

//     {
//         accessorKey: "requistionType",
//         header: "Requisition Type",

//         cell: ({ row }) => {
//             const rawType = row.getValue("requistionType") as string
//             const type = rawType?.trim()

//             const typeConfig = {
//                 Raised:
//                     "bg-blue-100 text-blue-800 border-blue-300",

//                 "Petty Cash (Approved)":
//                     "bg-green-100 text-green-800 border-green-300",

//                 "PR (Approved)":
//                     "bg-indigo-100 text-indigo-800 border-indigo-300",
//             }[type] || "bg-muted text-foreground border-border"

//             return (
//                 <Badge
//                     className={`
//                         ${badgeClass}
//                         ${typeConfig}
//                     `}
//                 >
//                     {rawType}
//                 </Badge>
//             )
//         },
//     },

//     // ======================================================
//     // DELIVERED STATUS
//     // ======================================================

//     {
//         accessorKey: "delivered_status",
//         header: "Delivered Status",

//         cell: ({ row }) => {
//             const status = row.original.delivered_status as string

//             if (!status) return null

//             const statusConfig = {
//                 Pending: {
//                     icon: <Clock className="h-3.5 w-3.5" />,
//                     className:
//                         "bg-yellow-100 text-yellow-800 border-yellow-300",
//                 },

//                 Delivered: {
//                     icon: <CheckCircle className="h-3.5 w-3.5" />,
//                     className:
//                         "bg-green-100 text-green-800 border-green-300",
//                 },

//                 Canceled: {
//                     icon: <Circle className="h-3.5 w-3.5" />,
//                     className:
//                         "bg-red-100 text-red-800 border-red-300",
//                 },
//             }[status]

//             return (
//                 <Badge
//                     className={`
//                         ${badgeClass}
//                         ${statusConfig?.className}
//                         gap-1
//                     `}
//                 >
//                     {statusConfig?.icon}
//                     {status}
//                 </Badge>
//             )
//         },
//     },

//     // ======================================================
//     // CREATED DATE
//     // ======================================================

//     {
//         accessorKey: "created_at",
//         header: "Created At",

//         cell: ({ row }) => {
//             const date = new Date(
//                 row.getValue("created_at") as string
//             )

//             return (
//                 <span className={textClass}>
//                     {date.toLocaleDateString()}
//                 </span>
//             )
//         },
//     },

//     // ======================================================
//     // ACTIONS
//     // ======================================================

//     {
//         id: "actions",
//         header: "Actions",

//         cell: ({ row }) => {
//             const section = row.original

//             return <ActionCell section={section} />
//         },
//     },
// ]

// // ======================================================
// // TT NO CELL
// // ======================================================

// function TTNoCell({ section }: { section: Section }) {
//     const { openModal } = useTTModal()

//     return (
//         <Badge
//             variant="outline"
//             className={`
//                 ${badgeClass}
//                 cursor-pointer
//                 bg-muted
//                 text-foreground
//                 border-border
//             `}
//             onClick={() => openModal(section)}
//         >
//             {section.tt_no}
//         </Badge>
//     )
// }

// // ======================================================
// // ACTION CELL
// // ======================================================

// function ActionCell({ section }: { section: Section }) {
//     const { openModal } = useTTModal()

//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//                 <Button
//                     variant="outline"
//                     size="sm"
//                     className={`
//                         ${buttonClass}
//                         border-primary
//                         text-primary
//                         gap-1
//                     `}
//                 >
//                     Actions
//                     <ChevronDown className="h-3.5 w-3.5" />
//                 </Button>
//             </DropdownMenuTrigger>

//             <DropdownMenuContent
//                 align="end"
//                 className="w-44 text-[11px]"
//             >
//                 <DropdownMenuItem
//                     className={`${menuClass} cursor-pointer`}
//                     onClick={() => openModal(section)}
//                 >
//                     <MoreVertical className="h-3.5 w-3.5 text-indigo-600" />
//                     View Details
//                 </DropdownMenuItem>

//                 <DropdownMenuItem
//                     className={`${menuClass} cursor-pointer`}
//                 >
//                     <Pencil className="h-3.5 w-3.5 text-primary" />
//                     Edit
//                 </DropdownMenuItem>

//                 <DropdownMenuSeparator />

//                 <DropdownMenuItem
//                     className={`${menuClass} text-red-600 cursor-pointer`}
//                 >
//                     <Trash2 className="h-3.5 w-3.5" />
//                     Delete
//                 </DropdownMenuItem>
//             </DropdownMenuContent>
//         </DropdownMenu>
//     )
// }