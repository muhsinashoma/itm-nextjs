

//itm/frontend/components/tt-columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";

import {
    BellRing,
    Building2,
    CheckCircle,
    ChevronDown,
    ClipboardList,
    Clock,
    Eye,
    Loader2,
    Mail,
    Pencil,
    Phone,
    Search,
    TicketCheck,
    Trash2,
    UserCheck,
    X,
    XCircle,
} from "lucide-react";

import { useEffect, useMemo, useState, type ReactNode } from "react";

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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTTModal } from "@/components/ui/tt-modal-store";

import {
    TroubleTicketCloseDialog,
    TroubleTicketRequisitionDialog,
} from "@/components/tt-action-dialogs";

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
    canClose: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export type TTAssignmentUpdate = {
    ticketId: number;
    assignedId: string;
    assignedName: string;
};

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
        canClose: permissionSet.has("TT_CLOSE"),
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
   TT NUMBER CELL

   Row hover preview is intentionally owned by DataTable.
   Keeping hover logic out of this cell prevents duplicate
   previews and guarantees that clicking TT No / Action /
   dropdown items can dismiss the preview immediately.
============================================================ */

function TTNoCell({
    section,
}: {
    section: Section;
}) {
    const { openModal } = useTTModal();

    return (
        <button
            type="button"
            onClick={() => openModal(section)}
            className="
                inline-flex
                h-[22px]
                w-full
                min-w-0
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
                duration-200
                hover:border-primary/40
                hover:bg-primary/5
                hover:text-primary
                hover:shadow-sm
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-primary/20
            "
        >
            {textValue(section.tt_no)}
        </button>
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

function InfoItem({
    label,
    value,
    mono = false,
    icon,
}: {
    label: string;
    value: unknown;
    mono?: boolean;
    icon?: ReactNode;
}) {
    return (
        <div className="min-w-0 rounded-lg border bg-background px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                {icon}
                <span>{label}</span>
            </div>
            <p
                title={textValue(value) === "—" ? undefined : textValue(value)}
                className={`mt-1 truncate text-[10.5px] font-semibold text-foreground ${mono ? "font-mono" : ""}`}
            >
                {textValue(value)}
            </p>
        </div>
    );
}

/* ============================================================
   ASSIGNMENT DIALOG
============================================================ */

function AssignmentDialog({
    section,
    open,
    onOpenChange,
    onAssignmentCommitted,
}: {
    section: Section | null;
    open: boolean;
    onOpenChange: (
        open: boolean
    ) => void;
    onAssignmentCommitted?: (
        update: TTAssignmentUpdate
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
        personnelSearch,
        setPersonnelSearch,
    ] = useState("");

    const [
        personnelPickerOpen,
        setPersonnelPickerOpen,
    ] = useState(false);

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

        // Do not preselect the current assignee during reassignment.
        // The user must intentionally choose the new owner.
        setSelectedEmployee("");
        setPersonnelSearch("");
        setPersonnelPickerOpen(false);
        setNote("");
        setError("");
    }, [open, section?.id]);

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

    const filteredPersonnel = useMemo(() => {
        const query = personnelSearch
            .trim()
            .toLowerCase()
            .replace(/[()]/g, "");

        return personnel.filter((person) => {
            // A reassignment cannot select the current owner again.
            if (
                currentAssignedID &&
                person.employee_id === currentAssignedID
            ) {
                return false;
            }

            if (!query) {
                return true;
            }

            const searchable = `${person.employee_name ?? ""} ${person.employee_id ?? ""}`
                .toLowerCase();

            return searchable.includes(query);
        });
    }, [personnel, personnelSearch, currentAssignedID]);

    const selectedAssignee =
        personnel.find(
            (person) =>
                person.employee_id ===
                selectedEmployee
        ) ?? null;

    const alreadyAssigned =
        Boolean(
            currentAssignedID &&
            selectedEmployee ===
            currentAssignedID
        );

    function selectAssignee(
        person: TroubleTicketITPersonnel
    ) {
        setSelectedEmployee(person.employee_id);
        setPersonnelSearch("");
        setPersonnelPickerOpen(false);
        setError("");
    }

    function clearSelectedAssignee() {
        setSelectedEmployee("");
        setPersonnelSearch("");
        setPersonnelPickerOpen(true);
        setError("");
    }

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
             * Successful assignment/reassignment.
             *
             * Update the dashboard row in memory immediately.
             * This avoids a page navigation, full refresh, loading
             * state, and a second API round-trip just to display
             * the assignee that the backend has already accepted.
             */
            const assignmentUpdate: TTAssignmentUpdate = {
                ticketId: ticketID,
                assignedId: selectedEmployee,
                assignedName:
                    selectedAssignee?.employee_name ??
                    selectedEmployee,
            };

            onAssignmentCommitted?.(assignmentUpdate);

            /*
             * Keep other open ITM tabs in sync immediately.
             * A silent polling fallback in Dashboard handles users
             * signed in from a different browser/device.
             */
            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("itm:trouble-ticket-changed", {
                        detail: {
                            type: currentAssignedID
                                ? "reassigned"
                                : "assigned",
                            ...assignmentUpdate,
                        },
                    })
                );

                try {
                    const channel = new BroadcastChannel(
                        "itm-trouble-tickets"
                    );
                    channel.postMessage({
                        type: currentAssignedID
                            ? "reassigned"
                            : "assigned",
                        ...assignmentUpdate,
                    });
                    channel.close();
                } catch {
                    // BroadcastChannel is optional; silent polling is the fallback.
                }
            }

            onOpenChange(false);
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
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[820px]">
                <div className="flex items-start gap-3 border-b pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                        <TicketCheck className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="min-w-0">
                        <DialogTitle className="text-sm font-semibold">
                            {currentAssignedID
                                ? "Reassign Trouble Ticket"
                                : "Assign Trouble Ticket"}
                        </DialogTitle>

                        <DialogDescription className="mt-1 text-[10px] leading-4">
                            Select the responsible IT Personnel and review the ticket context before confirming the assignment.
                        </DialogDescription>
                    </div>
                </div>

                <div className="space-y-3 pt-3">

                    {/* ==================================================
                       TICKET INFORMATION
                    ================================================== */}

                    <div className="rounded-xl border bg-muted/20 p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Ticket Context
                                </p>
                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                    Verify the requester and issue before assigning ownership.
                                </p>
                            </div>

                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-[9px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                                {textValue(section?.tt_no)}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <InfoItem label="Requester" value={section?.employee_name} />
                            <InfoItem label="Employee ID" value={section?.employee_id} mono />
                            <InfoItem label="Query Type" value={section?.query_type} />
                            <InfoItem label="Department" value={section?.dept_name} icon={<Building2 className="h-3 w-3" />} />
                            <InfoItem label="Contact" value={section?.mobile_no} icon={<Phone className="h-3 w-3" />} />
                            <InfoItem label="Created" value={section?.created_at} />
                        </div>

                        <div className="mt-3 rounded-lg border border-slate-200 bg-background px-3 py-2.5 dark:border-slate-800">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    TT Reason / Problem Description
                                </p>
                                <span className="text-[9px] text-muted-foreground">Requester statement</span>
                            </div>
                            <p className="mt-1.5 whitespace-pre-wrap break-words text-[10.5px] leading-4 text-foreground">
                                {textValue(section?.description)}
                            </p>
                        </div>
                    </div>

                    {/* ==================================================
                       CURRENT ASSIGNEE
                    ================================================== */}

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Current Assignee
                            </p>
                            <p className="mt-1 truncate text-[11px] font-semibold">
                                {currentAssignedID
                                    ? `${currentAssignedName || "Unknown"} (${currentAssignedID})`
                                    : "Not assigned"}
                            </p>
                        </div>

                        <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2.5 dark:border-blue-900 dark:bg-blue-950/20">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                New Assignee
                            </p>
                            <p className="mt-1 truncate text-[11px] font-semibold text-blue-900 dark:text-blue-100">
                                {selectedAssignee
                                    ? `${selectedAssignee.employee_name} (${selectedAssignee.employee_id})`
                                    : "Select IT Personnel below"}
                            </p>
                        </div>
                    </div>

                    {/* ==================================================
                       IT PERSONNEL
                    ================================================== */}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <label
                                htmlFor="tt-assignee-search"
                                className="text-[10px] font-semibold"
                            >
                                IT Personnel *
                            </label>
                            <span className="text-[9px] text-muted-foreground">
                                Search by name or employee ID
                            </span>
                        </div>

                        {selectedAssignee ? (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2.5 shadow-sm dark:border-blue-900 dark:bg-blue-950/25">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-background text-blue-700 dark:border-blue-800 dark:text-blue-300">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[10.5px] font-semibold text-foreground">
                                            {selectedAssignee.employee_name}
                                        </p>
                                        <p className="mt-0.5 font-mono text-[9px] font-medium text-blue-700 dark:text-blue-300">
                                            {selectedAssignee.employee_id}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={clearSelectedAssignee}
                                    disabled={submitting}
                                    aria-label="Remove selected IT Personnel"
                                    title="Remove selected IT Personnel"
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-background text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : null}

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="tt-assignee-search"
                                value={personnelSearch}
                                onFocus={() =>
                                    setPersonnelPickerOpen(true)
                                }
                                onBlur={() =>
                                    window.setTimeout(
                                        () => setPersonnelPickerOpen(false),
                                        140
                                    )
                                }
                                onChange={(event) => {
                                    setPersonnelSearch(event.target.value);
                                    setPersonnelPickerOpen(true);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                        setPersonnelPickerOpen(false);
                                        return;
                                    }

                                    if (
                                        event.key === "Enter" &&
                                        personnelPickerOpen &&
                                        filteredPersonnel.length > 0
                                    ) {
                                        event.preventDefault();
                                        selectAssignee(filteredPersonnel[0]);
                                    }
                                }}
                                role="combobox"
                                aria-expanded={personnelPickerOpen}
                                aria-controls="tt-assignee-options"
                                aria-autocomplete="list"
                                disabled={loadingPersonnel || submitting}
                                autoComplete="off"
                                placeholder={
                                    loadingPersonnel
                                        ? "Loading IT Personnel..."
                                        : selectedAssignee
                                            ? "Search to change selected IT Personnel..."
                                            : "Search IT Personnel..."
                                }
                                className="h-10 rounded-lg pl-9 pr-3 text-[11px] shadow-sm"
                            />

                            {personnelPickerOpen && !loadingPersonnel && (
                                <div
                                    id="tt-assignee-options"
                                    role="listbox"
                                    className="absolute z-[70] mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
                                >
                                    <div className="border-b bg-muted/30 px-3 py-2">
                                        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Available IT Personnel
                                        </p>
                                    </div>
                                    <div className="max-h-[240px] overflow-y-auto p-1.5">
                                        {filteredPersonnel.length === 0 ? (
                                            <div className="px-3 py-6 text-center text-[10px] text-muted-foreground">
                                                {personnel.length === 0
                                                    ? "No active IT Personnel available."
                                                    : "No IT Personnel matched your search."}
                                            </div>
                                        ) : (
                                            filteredPersonnel.map((person) => {
                                                const selected =
                                                    person.employee_id === selectedEmployee;

                                                return (
                                                    <button
                                                        key={person.employee_id}
                                                        type="button"
                                                        role="option"
                                                        aria-selected={selected}
                                                        onMouseDown={(event) =>
                                                            event.preventDefault()
                                                        }
                                                        onClick={() =>
                                                            selectAssignee(person)
                                                        }
                                                        className={`group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground ${selected ? "bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100" : ""}`}
                                                    >
                                                        <div className="flex min-w-0 items-center gap-2.5">
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground group-hover:text-foreground">
                                                                <UserCheck className="h-3.5 w-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-[10.5px] font-semibold">
                                                                    {person.employee_name}
                                                                </p>
                                                                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                                                                    {person.employee_id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {selected ? (
                                                            <CheckCircle className="h-4 w-4 shrink-0 text-blue-600" />
                                                        ) : null}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ==================================================
                       NOTE
                    ================================================== */}

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                            <label
                                htmlFor="tt-assignment-note"
                                className="text-[10px] font-semibold"
                            >
                                Assignment Note
                                <span className="ml-1 font-normal text-muted-foreground">
                                    (Optional · included in email)
                                </span>
                            </label>
                            <span className="text-[9px] text-muted-foreground">
                                {note.length}/500
                            </span>
                        </div>

                        <textarea
                            id="tt-assignment-note"
                            value={note}
                            onChange={(event) =>
                                setNote(event.target.value)
                            }
                            disabled={submitting}
                            placeholder={
                                currentAssignedID
                                    ? "Add reassignment reason, handover context, priority or work already completed..."
                                    : "Add troubleshooting context, priority, location or instructions for the assigned IT Personnel..."
                            }
                            maxLength={500}
                            rows={4}
                            className="min-h-[96px] max-h-[180px] w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-[11px] leading-4 outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-[9.5px] leading-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200 sm:flex-row sm:items-center sm:gap-4">
                        <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            Assignment email to selected IT Personnel
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <BellRing className="h-3.5 w-3.5 shrink-0" />
                            In-app notification after successful save
                        </span>
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

                <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
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
                                <Mail className="h-3.5 w-3.5" />

                                {currentAssignedID
                                    ? "Reassign & Notify"
                                    : "Assign & Notify"}
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
    onAssignmentCommitted,
}: {
    section: Section;
    permissions: TTActionPermissions;
    onAssignmentCommitted?: (
        update: TTAssignmentUpdate
    ) => void;
}) {
    const { openModal, setActionDialogOpen } =
        useTTModal();

    const [
        assignmentOpen,
        setAssignmentOpen,
    ] = useState(false);

    const [
        requisitionOpen,
        setRequisitionOpen,
    ] = useState(false);

    const [
        closeOpen,
        setCloseOpen,
    ] = useState(false);

    const anyActionDialogOpen =
        assignmentOpen ||
        requisitionOpen ||
        closeOpen;

    useEffect(() => {
        if (!anyActionDialogOpen) {
            return;
        }

        setActionDialogOpen(true);

        return () => {
            setActionDialogOpen(false);
        };
    }, [
        anyActionDialogOpen,
        setActionDialogOpen,
    ]);

    const isClosed =
        normalizeStatus(section.status) === "Closed";

    const hasActions =
        permissions.canView ||
        (permissions.canAssign && !isClosed) ||
        (permissions.canRequisition && !isClosed) ||
        (permissions.canClose && !isClosed) ||
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

                    {permissions.canAssign && !isClosed && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() => {
                                setActionDialogOpen(true);
                                setAssignmentOpen(true);
                            }}
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

                    {permissions.canRequisition && !isClosed && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() => {
                                setActionDialogOpen(true);
                                setRequisitionOpen(true);
                            }}
                        >
                            <ClipboardList className="mr-2 h-3.5 w-3.5 text-indigo-600" />

                            Requisition
                        </DropdownMenuItem>
                    )}



                    {/* ==================================================
                       CLOSE
                    ================================================== */}

                    {permissions.canClose && !isClosed && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() => {
                                setActionDialogOpen(true);
                                setCloseOpen(true);
                            }}
                        >
                            <CheckCircle className="mr-2 h-3.5 w-3.5 text-emerald-600" />

                            Close
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
                onOpenChange={(nextOpen) => {
                    setAssignmentOpen(nextOpen);
                    setActionDialogOpen(nextOpen);
                }}
                onAssignmentCommitted={
                    onAssignmentCommitted
                }
            />


            <TroubleTicketRequisitionDialog
                section={section}
                open={requisitionOpen}
                onOpenChange={(nextOpen) => {
                    setRequisitionOpen(nextOpen);
                    setActionDialogOpen(nextOpen);
                }}
            />

            <TroubleTicketCloseDialog
                section={section}
                open={closeOpen}
                onOpenChange={(nextOpen) => {
                    setCloseOpen(nextOpen);
                    setActionDialogOpen(nextOpen);
                }}
            />
        </>
    );
}

/* ============================================================
   TABLE COLUMNS
============================================================ */

export function createTTColumns(
    permissions: TTActionPermissions,
    onAssignmentCommitted?: (
        update: TTAssignmentUpdate
    ) => void
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
                    onAssignmentCommitted={
                        onAssignmentCommitted
                    }
                />
            ),
        },
    ];
}