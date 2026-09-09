//itm/frontend/components/tt-columns.tsx
"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import {
    Building2,
    CalendarDays,
    CheckCircle,
    ChevronDown,
    ClipboardList,
    Clock,
    Eye,
    FileText,
    History,
    Loader2,
    Mail,
    Pencil,
    Phone,
    Trash2,
    UserCheck,
    UserRound,
    XCircle,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTTModal } from "@/components/ui/tt-modal-store";

import {
    dashboardApi,
    getToken,
    type TroubleTicketItem,
    type TroubleTicketITPersonnel,
} from "@/lib/api";

import type { Section } from "@/types/tt";

/* ============================================================
   EXPORT
============================================================ */

export type { Section } from "@/types/tt";

/* ============================================================
   PERMISSIONS
============================================================ */

export interface TTActionPermissions {
    canView: boolean;
    canAssign: boolean;
    canRequisition: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

/* ============================================================
   MAP RBAC PERMISSIONS
============================================================ */

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
        canRequisition:
            permissionSet.has("TT_REQUISITION"),
        canEdit: permissionSet.has("TT_EDIT"),
        canDelete: permissionSet.has("TT_DELETE"),
    };
}

/* ============================================================
   HELPERS
============================================================ */

function textValue(value: unknown): string {
    const result = String(value ?? "").trim();

    return result || "—";
}

function normalizeStatus(
    value: unknown
): "Open" | "Closed" {
    const status = String(value ?? "")
        .trim()
        .toLowerCase();

    if (
        status === "closed" ||
        status === "close" ||
        status === "0"
    ) {
        return "Closed";
    }

    return "Open";
}

function formatDuration(
    seconds: number
): string {
    const value = Math.max(
        0,
        Number(seconds || 0)
    );

    const days = Math.floor(
        value / 86400
    );

    const hours = Math.floor(
        (value % 86400) / 3600
    );

    const minutes = Math.floor(
        (value % 3600) / 60
    );

    return `${days}d ${hours}h ${minutes}m`;
}

function normalizeDateValue(value: unknown): string {
    return String(value ?? "")
        .trim()
        .replace(" ", "T");
}

type CreatedAtParts = {
    date: string;
    time: string;
    full: string;
};

function formatCreatedAtParts(
    value: string
): CreatedAtParts {
    const raw = String(value ?? "").trim();

    if (!raw) {
        return {
            date: "—",
            time: "",
            full: "—",
        };
    }

    /*
     * PostgreSQL commonly returns:
     *
     * 2026-09-08 16:18:03.071+06
     *
     * Convert the space separator to ISO's T separator.
     * Keep the timezone information so the browser does not
     * accidentally interpret the timestamp in a different zone.
     */
    const normalized = raw.includes("T")
        ? raw
        : raw.replace(" ", "T");

    const parsed = new Date(normalized);

    if (Number.isNaN(parsed.getTime())) {
        /*
         * Safe fallback for an unexpected timestamp format.
         * If the raw value starts with YYYY-MM-DD HH:mm:ss,
         * still present the two useful parts separately.
         */
        const match = raw.match(
            /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/
        );

        if (match) {
            return {
                date: match[1],
                time: match[2],
                full: `${match[1]} ${match[2]}`,
            };
        }

        return {
            date: raw,
            time: "",
            full: raw,
        };
    }

    const dateParts = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Asia/Dhaka",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    ).formatToParts(parsed);

    const timeParts = new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone: "Asia/Dhaka",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }
    ).formatToParts(parsed);

    const getPart = (
        parts: Intl.DateTimeFormatPart[],
        type: Intl.DateTimeFormatPartTypes
    ) =>
        parts.find(
            (part) => part.type === type
        )?.value ?? "";

    const date =
        `${getPart(dateParts, "year")}-${getPart(
            dateParts,
            "month"
        )}-${getPart(dateParts, "day")}`;

    const time =
        `${getPart(timeParts, "hour")}:${getPart(
            timeParts,
            "minute"
        )}:${getPart(timeParts, "second")}`;

    return {
        date,
        time,
        full: `${date} ${time}`,
    };
}


/* ============================================================
   API ITEM -> SECTION
============================================================ */

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

        status: normalizeStatus(
            item.status
        ),

        requisition_type:
            requisitionType,

        requistionType:
            requisitionType,

        delivered_status:
            deliveredStatus,

        tt_age: formatDuration(
            item.age_seconds
        ),
    };
}

/* ============================================================
   COMMON CLASSES
============================================================ */

const textClass =
    "text-[9.5px] leading-[13px]";

const badgeClass =
    "inline-flex h-[20px] items-center rounded-full px-1.5 py-0 text-[9px] font-medium leading-none whitespace-nowrap";

/* ============================================================
   CELL TEXT
============================================================ */

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

/* ============================================================
   STATUS CONFIG
============================================================ */

const statusConfig = {
    Open: {
        icon: (
            <Clock className="h-3 w-3" />
        ),
        className:
            "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
    },

    Closed: {
        icon: (
            <CheckCircle className="h-3 w-3" />
        ),
        className:
            "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
};

/* ============================================================
   REQUISITION STYLE
============================================================ */

function requisitionClass(
    value: string
): string {
    if (
        value ===
        "Petty Cash (Approved)"
    ) {
        return "border-emerald-300 bg-emerald-50 text-emerald-700";
    }

    if (
        value ===
        "PR (Approved)"
    ) {
        return "border-indigo-300 bg-indigo-50 text-indigo-700";
    }

    return "border-border bg-muted text-foreground";
}

/* ============================================================
   DELIVERY STYLE
============================================================ */

function deliveryConfig(
    value: string
) {
    const normalized =
        value
            .trim()
            .toLowerCase();

    if (
        normalized ===
        "delivered"
    ) {
        return {
            icon: (
                <CheckCircle className="h-3 w-3" />
            ),
            className:
                "border-emerald-300 bg-emerald-50 text-emerald-700",
        };
    }

    if (
        normalized ===
        "rejected"
    ) {
        return {
            icon: (
                <XCircle className="h-3 w-3" />
            ),
            className:
                "border-red-300 bg-red-50 text-red-700",
        };
    }

    return {
        icon: (
            <Clock className="h-3 w-3" />
        ),
        className:
            "border-amber-300 bg-amber-50 text-amber-700",
    };
}

/* ============================================================
   HOVER DETAILS
============================================================ */

function HoverInfoRow({
    icon,
    label,
    value,
    mono = false,
}: {
    icon: ReactNode;
    label: string;
    value: unknown;
    mono?: boolean;
}) {
    const display = textValue(value);

    return (
        <div className="grid grid-cols-[16px_78px_minmax(0,1fr)] items-start gap-2 py-1">
            <span className="mt-0.5 text-muted-foreground">{icon}</span>
            <span className="text-[9px] font-medium text-muted-foreground">
                {label}
            </span>
            <span
                title={display === "—" ? undefined : display}
                className={`min-w-0 truncate text-[9px] font-semibold text-foreground ${mono ? "font-mono" : ""
                    }`}
            >
                {display}
            </span>
        </div>
    );
}

function TTHoverPreview({
    section,
    position,
}: {
    section: Section;
    position: {
        top: number;
        left: number;
    };
}) {
    const raw =
        section as unknown as Record<string, unknown>;

    const created = formatCreatedAtParts(
        String(raw.created_at ?? "")
    );

    const assignedID =
        textValue(raw.assigned_id);

    const assignedName =
        textValue(raw.assigned_name);

    const status =
        normalizeStatus(raw.status);

    return (
        <div
            className="
                pointer-events-none
                fixed
                z-[9999]
                w-[390px]
                -translate-y-1/2
                overflow-hidden
                rounded-xl
                border
                border-border/80
                bg-background/98
                p-3
                text-left
                shadow-2xl
                ring-1
                ring-black/5
                animate-in
                fade-in-0
                zoom-in-95
                duration-150
            "
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <div className="mb-2.5 flex items-start justify-between gap-3 border-b border-border/70 pb-2.5">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-foreground">
                            Trouble Ticket
                        </span>
                    </div>

                    <p className="mt-1 truncate font-mono text-[11px] font-semibold text-primary">
                        {textValue(raw.tt_no)}
                    </p>
                </div>

                <Badge
                    variant="outline"
                    className={`
                        ${badgeClass}
                        ${status === "Closed"
                            ? statusConfig.Closed.className
                            : statusConfig.Open.className
                        }
                    `}
                >
                    {status === "Closed"
                        ? statusConfig.Closed.icon
                        : statusConfig.Open.icon}
                    {status}
                </Badge>
            </div>

            <div className="space-y-0.5">
                <HoverInfoRow
                    icon={
                        <UserRound className="h-3 w-3" />
                    }
                    label="Employee"
                    value={
                        textValue(
                            raw.employee_name
                        ) === "—"
                            ? raw.employee_id
                            : `${textValue(
                                raw.employee_name
                            )} (${textValue(
                                raw.employee_id
                            )})`
                    }
                />

                <HoverInfoRow
                    icon={
                        <UserCheck className="h-3 w-3" />
                    }
                    label="Assigned"
                    value={
                        assignedID === "—"
                            ? "Not assigned"
                            : `${assignedName !== "—"
                                ? `${assignedName} `
                                : ""
                            }(${assignedID})`
                    }
                    mono
                />

                <HoverInfoRow
                    icon={
                        <FileText className="h-3 w-3" />
                    }
                    label="Query"
                    value={raw.query_type}
                />

                <HoverInfoRow
                    icon={
                        <Clock className="h-3 w-3" />
                    }
                    label="Age"
                    value={raw.tt_age}
                />

                <HoverInfoRow
                    icon={
                        <Building2 className="h-3 w-3" />
                    }
                    label="Department"
                    value={
                        raw.dept_name ??
                        raw.department
                    }
                />

                <HoverInfoRow
                    icon={
                        <Phone className="h-3 w-3" />
                    }
                    label="Mobile"
                    value={raw.mobile_no}
                    mono
                />

                <HoverInfoRow
                    icon={
                        <Mail className="h-3 w-3" />
                    }
                    label="Email"
                    value={raw.email}
                />

                <HoverInfoRow
                    icon={
                        <CalendarDays className="h-3 w-3" />
                    }
                    label="Created"
                    value={`${created.date} ${created.time}`}
                    mono
                />


            </div>

            <div className="mt-2.5 flex items-center gap-1.5 border-t border-border/70 pt-2 text-[8px] text-muted-foreground">
                <History className="h-3 w-3 shrink-0" />
                <span>
                    Hover row for preview • Click TT No or Action for full details
                </span>
            </div>
        </div>
    );
}

/* ============================================================
   TT NUMBER CELL + ROW HOVER
============================================================ */

function TTNoCell({
    section,
}: {
    section: Section;
}) {
    const { openModal } =
        useTTModal();

    const hostRef =
        useRef<HTMLDivElement | null>(null);

    const [hovered, setHovered] =
        useState(false);

    const [hoverPosition, setHoverPosition] =
        useState({
            top: 0,
            left: 0,
        });

    useEffect(() => {
        const host =
            hostRef.current;

        const row =
            host?.closest("tr") as
            | HTMLTableRowElement
            | null;

        if (!row) {
            return;
        }

        const updatePosition = () => {
            const rect =
                row.getBoundingClientRect();

            const previewWidth = 390;
            const viewportPadding = 16;

            // Keep the hover preview centered in the viewport so it never
            // gets pushed to the far left/right of the table.
            const left = Math.max(
                viewportPadding,
                Math.min(
                    (window.innerWidth - previewWidth) / 2,
                    window.innerWidth - previewWidth - viewportPadding
                )
            );

            // The preview component uses -translate-y-1/2, so positioning
            // it at the viewport center keeps it visually balanced.
            const top = window.innerHeight / 2;

            setHoverPosition({
                top,
                left,
            });
        };

        const handleEnter = () => {
            updatePosition();
            setHovered(true);
        };

        const handleLeave = () => {
            setHovered(false);
        };

        row.addEventListener(
            "mouseenter",
            handleEnter
        );

        row.addEventListener(
            "mouseleave",
            handleLeave
        );

        window.addEventListener(
            "resize",
            updatePosition
        );

        window.addEventListener(
            "scroll",
            updatePosition,
            true
        );

        return () => {
            row.removeEventListener(
                "mouseenter",
                handleEnter
            );

            row.removeEventListener(
                "mouseleave",
                handleLeave
            );

            window.removeEventListener(
                "resize",
                updatePosition
            );

            window.removeEventListener(
                "scroll",
                updatePosition,
                true
            );
        };
    }, []);

    return (
        <div
            ref={hostRef}
            className="relative inline-flex"
        >
            <button
                type="button"
                onClick={() =>
                    openModal(section)
                }
                title={textValue(
                    section.tt_no
                )}
                className="
                    inline-flex
                    h-[22px]
                    min-w-0
                    w-full
                    max-w-[118px]
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
                    tracking-[-0.15px]
                    text-foreground
                    transition-all
                    hover:border-primary/40
                    hover:bg-primary/5
                    hover:text-primary
                    hover:shadow-sm
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-primary/20
                "
            >
                {textValue(
                    section.tt_no
                )}
            </button>

            {hovered && (
                <TTHoverPreview
                    section={section}
                    position={hoverPosition}
                />
            )}
        </div>
    );
}

/* ============================================================
   ASSIGNMENT ERROR
============================================================ */

function assignmentError(
    error: unknown
): string {
    if (
        error instanceof Error &&
        error.message
    ) {
        return error.message;
    }

    if (
        typeof error ===
        "string"
    ) {
        return error;
    }

    return "Unable to process Trouble Ticket assignment.";
}

/* ============================================================
   ASSIGNMENT DIALOG
============================================================ */

function AssignmentDialog({
    section,
    open,
    onOpenChange,
}: {
    section: Section | null;
    open: boolean;
    onOpenChange: (
        open: boolean
    ) => void;
}) {
    const [
        personnel,
        setPersonnel,
    ] = useState<
        TroubleTicketITPersonnel[]
    >([]);

    const [
        selectedEmployee,
        setSelectedEmployee,
    ] = useState("");

    const [
        note,
        setNote,
    ] = useState("");

    const [
        loadingPersonnel,
        setLoadingPersonnel,
    ] = useState(false);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    /* ========================================================
       LOAD IT PERSONNEL
    ======================================================== */

    useEffect(() => {
        if (!open) {
            return;
        }

        let mounted = true;

        async function loadPersonnel() {
            try {
                setLoadingPersonnel(true);
                setError("");

                const response =
                    await dashboardApi.troubleTicketITPersonnel();

                if (!mounted) {
                    return;
                }

                setPersonnel(
                    response.data ?? []
                );
            } catch (reason) {
                if (!mounted) {
                    return;
                }

                console.error(
                    "Failed to load IT Personnel:",
                    reason
                );

                setPersonnel([]);

                setError(
                    assignmentError(
                        reason
                    )
                );
            } finally {
                if (mounted) {
                    setLoadingPersonnel(
                        false
                    );
                }
            }
        }

        void loadPersonnel();

        return () => {
            mounted = false;
        };
    }, [open]);

    /* ========================================================
       RESET MODAL
    ======================================================== */

    useEffect(() => {
        if (!open || !section) {
            return;
        }

        setSelectedEmployee(
            String(
                section.assigned_id ??
                ""
            ).trim()
        );

        setNote("");

        setError("");
    }, [open, section]);

    /* ========================================================
       CURRENT ASSIGNEE
    ======================================================== */

    const currentAssignedID =
        String(
            section?.assigned_id ??
            ""
        ).trim();

    const currentAssignedName =
        String(
            section?.assigned_name ??
            ""
        ).trim();

    const alreadyAssigned =
        Boolean(
            currentAssignedID &&
            selectedEmployee ===
            currentAssignedID
        );

    /* ========================================================
       SUBMIT ASSIGNMENT
    ======================================================== */

    async function handleSubmit() {
        if (!section) {
            return;
        }

        const ticketID =
            Number(section.id);

        if (
            !Number.isFinite(
                ticketID
            ) ||
            ticketID <= 0
        ) {
            setError(
                "Invalid Trouble Ticket ID."
            );

            return;
        }

        if (!selectedEmployee) {
            setError(
                "Please select an IT Personnel."
            );

            return;
        }

        if (alreadyAssigned) {
            setError(
                "This ticket is already assigned to the selected employee."
            );

            return;
        }

        try {
            setSubmitting(true);
            setError("");

            /*
             * IMPORTANT:
             *
             * Backend:
             *
             * POST
             * /api/v1/dashboard/trouble-tickets/:id/assignment
             *
             * Body:
             *
             * {
             *   assigned_id: "02-2014",
             *   note: "..."
             * }
             */

            const apiBase =
                (
                    process.env.NEXT_PUBLIC_API_URL ??
                    ""
                ).replace(
                    /\/$/,
                    ""
                );

            const token = getToken();

            const headers: HeadersInit = {
                "Content-Type": "application/json",
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(
                `${apiBase}/dashboard/trouble-tickets/${ticketID}/assignment`,
                {
                    method: "POST",
                    headers,
                    credentials: "include",
                    body: JSON.stringify({
                        assigned_id: selectedEmployee,
                        note: note.trim(),
                    }),
                }
            );

            let body:
                | {
                    success?: boolean;
                    error?: string;
                    message?: string;
                    data?: unknown;
                }
                | null = null;

            try {
                body =
                    await response.json();
            } catch {
                body = null;
            }

            if (!response.ok) {
                throw new Error(
                    body?.error ||
                    body?.message ||
                    `Assignment failed (${response.status}).`
                );
            }

            if (
                body?.success ===
                false
            ) {
                throw new Error(
                    body.error ||
                    body.message ||
                    "Assignment failed."
                );
            }

            /*
             * Successful assignment.
             *
             * Close modal first,
             * then refresh dashboard.
             */
            onOpenChange(false);

            window.location.reload();
        } catch (reason) {
            console.error(
                "Trouble Ticket assignment failed:",
                reason
            );

            setError(
                assignmentError(
                    reason
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    /* ========================================================
       DIALOG
    ======================================================== */

    return (
        <Dialog
            open={open}
            onOpenChange={
                submitting
                    ? undefined
                    : onOpenChange
            }
        >
            <DialogContent>
                <div className="mb-4">
                    <DialogTitle className="text-sm">
                        {currentAssignedID
                            ? "Reassign Trouble Ticket"
                            : "Assign Trouble Ticket"}
                    </DialogTitle>

                    <DialogDescription className="mt-1 text-xs">
                        Assign this Trouble Ticket
                        to an active IT Personnel.
                    </DialogDescription>
                </div>

                <div className="space-y-4 py-4">

                    {/* ==================================================
                       TICKET INFORMATION
                    ================================================== */}

                    <div
                        className="
                            rounded-lg
                            border
                            bg-muted/30
                            p-3
                        "
                    >
                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                                    TT No
                                </p>

                                <p className="mt-1 font-mono text-[11px] font-semibold">
                                    {textValue(
                                        section?.tt_no
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Ticket ID
                                </p>

                                <p className="mt-1 text-[11px] font-semibold">
                                    {textValue(
                                        section?.id
                                    )}
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* ==================================================
                       CURRENT ASSIGNEE
                    ================================================== */}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold">
                            Current Assignee
                        </label>

                        <div
                            className="
                                flex
                                min-h-9
                                items-center
                                rounded-md
                                border
                                bg-muted/30
                                px-3
                                text-[11px]
                            "
                        >
                            {currentAssignedID ? (
                                <span>
                                    {currentAssignedName ||
                                        "Unknown"}

                                    <span className="ml-1 text-muted-foreground">
                                        (
                                        {
                                            currentAssignedID
                                        }
                                        )
                                    </span>
                                </span>
                            ) : (
                                <span className="text-muted-foreground">
                                    Not assigned
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ==================================================
                       IT PERSONNEL
                    ================================================== */}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold">
                            Assign To
                        </label>

                        <Select
                            value={
                                selectedEmployee
                            }
                            onValueChange={
                                setSelectedEmployee
                            }
                            disabled={
                                loadingPersonnel ||
                                submitting
                            }
                        >
                            <SelectTrigger className="h-9 text-[11px]">
                                <SelectValue
                                    placeholder={
                                        loadingPersonnel
                                            ? "Loading IT Personnel..."
                                            : "Select IT Personnel"
                                    }
                                />
                            </SelectTrigger>

                            <SelectContent>
                                {personnel.length ===
                                    0 ? (
                                    <SelectItem
                                        value="__no_personnel__"
                                        disabled
                                    >
                                        No active IT
                                        Personnel
                                        available
                                    </SelectItem>
                                ) : (
                                    personnel.map(
                                        (
                                            person
                                        ) => (
                                            <SelectItem
                                                key={
                                                    person.employee_id
                                                }
                                                value={
                                                    person.employee_id
                                                }
                                            >
                                                {
                                                    person.employee_name
                                                }{" "}
                                                (
                                                {
                                                    person.employee_id
                                                }
                                                )
                                            </SelectItem>
                                        )
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ==================================================
                       NOTE
                    ================================================== */}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold">
                            Note
                            <span className="ml-1 font-normal text-muted-foreground">
                                (Optional)
                            </span>
                        </label>

                        <Input
                            value={note}
                            onChange={(
                                event
                            ) =>
                                setNote(
                                    event.target
                                        .value
                                )
                            }
                            disabled={
                                submitting
                            }
                            placeholder={
                                currentAssignedID
                                    ? "Reassigned to another IT Personnel"
                                    : "Assigned to IT Personnel"
                            }
                            maxLength={500}
                            className="h-9 text-[11px]"
                        />

                        <p className="text-right text-[9px] text-muted-foreground">
                            {note.length}/500
                        </p>
                    </div>

                    {/* ==================================================
                       ERROR
                    ================================================== */}

                    {error && (
                        <div
                            className="
                                rounded-md
                                border
                                border-red-200
                                bg-red-50
                                px-3
                                py-2
                                text-[10px]
                                leading-4
                                text-red-700
                                dark:border-red-900
                                dark:bg-red-950/30
                                dark:text-red-400
                            "
                        >
                            {error}
                        </div>
                    )}
                </div>

                {/* ======================================================
                   FOOTER
                ====================================================== */}

                <div className="mt-5 flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                            submitting
                        }
                        onClick={() =>
                            onOpenChange(
                                false
                            )
                        }
                        className="h-8 text-[10px]"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        disabled={
                            submitting ||
                            loadingPersonnel ||
                            !selectedEmployee ||
                            alreadyAssigned
                        }
                        onClick={
                            handleSubmit
                        }
                        className="h-8 gap-1.5 text-[10px]"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />

                                {currentAssignedID
                                    ? "Reassigning..."
                                    : "Assigning..."}
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-3.5 w-3.5" />

                                {currentAssignedID
                                    ? "Reassign"
                                    : "Assign"}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ============================================================
   ACTION CELL
============================================================ */

function ActionCell({
    section,
    permissions,
}: {
    section: Section;
    permissions: TTActionPermissions;
}) {
    const { openModal } =
        useTTModal();

    const [
        assignmentOpen,
        setAssignmentOpen,
    ] = useState(false);

    const hasActions =
        permissions.canView ||
        permissions.canAssign ||
        permissions.canRequisition ||
        permissions.canEdit ||
        permissions.canDelete;

    if (!hasActions) {
        return null;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    asChild
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="
                            h-7
                            min-w-0
                            w-full
                            max-w-[64px]
                            gap-1
                            rounded-md
                            border-primary/70
                            bg-background
                            px-2
                            text-[9px]
                            font-semibold
                            text-primary
                            shadow-sm
                            hover:border-primary
                            hover:bg-primary/5
                            hover:shadow
                        "
                    >
                        Action

                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="w-44"
                >

                    {/* ==================================================
                       VIEW
                    ================================================== */}

                    {permissions.canView && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() =>
                                openModal(
                                    section
                                )
                            }
                        >
                            <Eye className="mr-2 h-3.5 w-3.5 text-indigo-600" />

                            View Details
                        </DropdownMenuItem>
                    )}

                    {/* ==================================================
                       ASSIGN / REASSIGN
                    ================================================== */}

                    {permissions.canAssign && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() =>
                                setAssignmentOpen(
                                    true
                                )
                            }
                        >
                            <UserCheck className="mr-2 h-3.5 w-3.5 text-blue-600" />

                            {section.assigned_id
                                ? "Reassign"
                                : "Assign"}
                        </DropdownMenuItem>
                    )}

                    {/* ==================================================
                       REQUISITION
                    ================================================== */}

                    {permissions.canRequisition && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() =>
                                console.log(
                                    "Requisition TT:",
                                    section.tt_no
                                )
                            }
                        >
                            <ClipboardList className="mr-2 h-3.5 w-3.5 text-indigo-600" />

                            Requisition
                        </DropdownMenuItem>
                    )}

                    {/* ==================================================
                       EDIT
                    ================================================== */}

                    {permissions.canEdit && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() =>
                                console.log(
                                    "Edit TT:",
                                    section.tt_no
                                )
                            }
                        >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-primary" />

                            Update
                        </DropdownMenuItem>
                    )}

                    {/* ==================================================
                       DELETE
                    ================================================== */}

                    {permissions.canDelete && (
                        <>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="
                                    cursor-pointer
                                    text-[10px]
                                    text-red-600
                                    focus:text-red-700
                                "
                                onClick={() =>
                                    console.log(
                                        "Delete TT:",
                                        section.tt_no
                                    )
                                }
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />

                                Delete
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* ASSIGNMENT MODAL */}

            <AssignmentDialog
                section={section}
                open={assignmentOpen}
                onOpenChange={
                    setAssignmentOpen
                }
            />
        </>
    );
}

/* ============================================================
   TABLE COLUMNS
============================================================ */

export function createTTColumns(
    permissions: TTActionPermissions
): ColumnDef<Section>[] {
    /*
     * Column widths are intentionally not hard-coded here.
     * The shared DataTable controls responsive widths so the
     * Created and Action columns remain visible without
     * horizontal overflow.
     */
    return [
        /* ========================================================
           SL
        ======================================================== */

        {
            id: "serial",

            header: "SL",

            enableHiding: false,
            enableSorting: false,

            accessorFn: (
                _row,
                index
            ) => index + 1,

            cell: ({
                row,
                table,
            }) => {
                const rows =
                    table.getPrePaginationRowModel()
                        .rows;

                const position =
                    rows.findIndex(
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
                        "
                    >
                        {serial}
                    </span>
                );
            },
        },

        /* ========================================================
           TT NO
        ======================================================== */

        {
            accessorKey: "tt_no",

            header: "TT No",

            enableHiding: false,

            cell: ({ row }) => (
                <TTNoCell
                    section={
                        row.original
                    }
                />
            ),
        },

        /* ========================================================
           EMPLOYEE ID
        ======================================================== */

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
                    className="
                        max-w-[80px]
                        whitespace-nowrap
                    "
                />
            ),
        },


        /* ========================================================
          Assigned ID
         =========================================================== */
        {
            accessorKey: "assigned_id",
            header: "Assigned ID",

            cell: ({ row }) => {
                const assignedId = String(
                    row.original.assigned_id ?? ""
                ).trim();

                if (!assignedId) {
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

                return (
                    <span
                        title={`Assigned to ${assignedId}`}
                        className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-md
                    border
                    border-blue-200
                    bg-blue-50
                    px-2
                    py-1
                    font-mono
                    text-[9px]
                    font-semibold
                    tabular-nums
                    text-blue-700
                    whitespace-nowrap
                "
                    >
                        {assignedId}
                    </span>
                );
            },
        },
        //I prefer this over displaying only the ID.

        // {
        //     id: "assigned",
        //     accessorFn: (row) =>
        //         row.assigned_id ?? "",
        //     header: "Assigned",
        //     size: 115,
        //     minSize: 105,
        //     maxSize: 130,

        //     cell: ({ row }) => {
        //         const assignedId = String(
        //             row.original.assigned_id ?? ""
        //         ).trim();

        //         const assignedName = String(
        //             row.original.assigned_name ?? ""
        //         ).trim();

        //         if (!assignedId && !assignedName) {
        //             return (
        //                 <span
        //                     className="
        //                 text-[9px]
        //                 text-muted-foreground/70
        //             "
        //                 >
        //                     Not assigned
        //                 </span>
        //             );
        //         }

        //         return (
        //             <div
        //                 className="
        //             flex
        //             min-w-0
        //             flex-col
        //             items-center
        //             justify-center
        //             leading-tight
        //         "
        //             >
        //                 {assignedName && (
        //                     <span
        //                         title={assignedName}
        //                         className="
        //                     max-w-[110px]
        //                     truncate
        //                     text-[9px]
        //                     font-semibold
        //                     text-foreground
        //                 "
        //                     >
        //                         {assignedName}
        //                     </span>
        //                 )}

        //                 {assignedId && (
        //                     <span
        //                         title={assignedId}
        //                         className="
        //                     mt-0.5
        //                     rounded
        //                     bg-blue-50
        //                     px-1.5
        //                     py-0.5
        //                     font-mono
        //                     text-[8px]
        //                     font-semibold
        //                     tabular-nums
        //                     text-blue-700
        //                 "
        //                     >
        //                         {assignedId}
        //                     </span>
        //                 )}
        //             </div>
        //         );
        //     },
        // },

        /* ========================================================
           EMPLOYEE NAME
        ======================================================== */

        {
            accessorKey:
                "employee_name",

            header: "Emp Name",

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

        /* ========================================================
           QUERY
        ======================================================== */

        {
            accessorKey: "query_type",

            header: "Query",

            size: 150,
            minSize: 135,
            maxSize: 160,

            cell: ({ row }) => {
                const query = String(
                    row.original.query_type ?? ""
                ).trim();

                return (
                    <div
                        className="
                            w-full
                            min-w-0
                            overflow-hidden
                            px-1
                        "
                        title={
                            query
                                ? query
                                : undefined
                        }
                    >
                        <span
                            className="
                                block
                                max-w-full
                                truncate
                                whitespace-nowrap
                                text-[9.5px]
                                font-medium
                                leading-[13px]
                                text-foreground
                            "
                        >
                            {query || "—"}
                        </span>
                    </div>
                );
            },
        },

        /* ========================================================
           AGE
        ======================================================== */

        {
            accessorKey: "tt_age",

            header: "Age",

            cell: ({ row }) => (
                <span
                    className="
                        whitespace-nowrap
                        text-[10px]
                        font-semibold
                        tabular-nums
                    "
                >
                    {
                        row.original
                            .tt_age
                    }
                </span>
            ),
        },

        /* ========================================================
           DEPARTMENT
        ======================================================== */

        {
            accessorKey:
                "dept_name",

            header: "Department",

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

        /* ========================================================
           FUNCTION
        ======================================================== */

        {
            accessorKey:
                "func_name",

            header: "Function",

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

        /* ========================================================
           MOBILE
        ======================================================== */

        {
            accessorKey:
                "mobile_no",

            header: "Mobile",

            cell: ({ row }) => (
                <span
                    className="
                        whitespace-nowrap
                        text-[10px]
                        font-medium
                        tabular-nums
                    "
                >
                    {textValue(
                        row.original
                            .mobile_no
                    )}
                </span>
            ),
        },

        /* ========================================================
           STATUS
        ======================================================== */

        {
            accessorKey: "status",

            header: "Status",

            enableHiding: false,

            cell: ({ row }) => {
                const status =
                    normalizeStatus(
                        row.original
                            .status
                    );

                const config =
                    statusConfig[
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

        /* ========================================================
           REQUISITION
        ======================================================== */

        {
            accessorKey:
                "requisition_type",

            header: "Requisition",

            cell: ({ row }) => {
                const value =
                    String(
                        row.original
                            .requisition_type ??
                        ""
                    ).trim();

                if (!value) {
                    return (
                        <span className="text-[9px] text-muted-foreground/70">
                            —
                        </span>
                    );
                }

                let display =
                    value;

                if (
                    value ===
                    "Petty Cash (Approved)"
                ) {
                    display =
                        "Petty Cash";
                }

                if (
                    value ===
                    "PR (Approved)"
                ) {
                    display =
                        "PR";
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
                        <CheckCircle className="h-3 w-3" />

                        {display}
                    </Badge>
                );
            },
        },

        /* ========================================================
           DELIVERY
        ======================================================== */

        {
            accessorKey:
                "delivered_status",

            header: "Delivery",

            cell: ({ row }) => {
                const value =
                    String(
                        row.original
                            .delivered_status ??
                        ""
                    ).trim();

                if (!value) {
                    return (
                        <span className="text-[9px] text-muted-foreground/70">
                            —
                        </span>
                    );
                }

                const config =
                    deliveryConfig(
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

        /* ========================================================
           CREATED
        ======================================================== */

        {
            accessorKey: "created_at",

            header: "Created",

            enableSorting: true,

            /*
             * The cell deliberately uses two rows:
             *
             * 2026-09-08
             * 16:18:03
             *
             * This is easier to scan than a long single-line
             * timestamp and avoids exposing milliseconds.
             */
            size: 112,
            minSize: 112,
            maxSize: 112,

            cell: ({ row }) => {
                const created =
                    formatCreatedAtParts(
                        String(
                            row.original.created_at ??
                            ""
                        )
                    );

                return (
                    <div
                        title={created.full}
                        className="
                            flex
                            w-[112px]
                            min-w-[112px]
                            max-w-[112px]
                            shrink-0
                            flex-col
                            items-center
                            justify-center
                            overflow-hidden
                            py-0.5
                            leading-none
                        "
                    >
                        <span
                            className="
                                block
                                whitespace-nowrap
                                font-mono
                                text-[10px]
                                font-semibold
                                leading-[14px]
                                tracking-normal
                                tabular-nums
                                text-foreground
                            "
                        >
                            {created.date}
                        </span>

                        {created.time && (
                            <span
                                className="
                                    mt-[2px]
                                    block
                                    whitespace-nowrap
                                    font-mono
                                    text-[9.5px]
                                    font-medium
                                    leading-[13px]
                                    tracking-normal
                                    tabular-nums
                                    text-muted-foreground
                                "
                            >
                                {created.time}
                            </span>
                        )}
                    </div>
                );
            },
        },
        /* ========================================================
           ACTION
        ======================================================== */

        {
            id: "actions",

            header: "Action",

            enableHiding: false,
            enableSorting: false,

            size: 82,
            minSize: 82,
            maxSize: 82,

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