
// components/ui/TTGlobalModal.tsx
"use client"

import * as React from "react"

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
    Phone,
    Building2,
    User2,
    ClipboardList,
    Clock3,
    BriefcaseBusiness,
    History,
    ArrowRight,
    UserCheck,
    X,
} from "lucide-react"

import { useTTModal } from "./tt-modal-store"

/* ============================================================
   TT EVENT TYPE
============================================================ */

type TTEvent = {
    id: number
    event_uuid: string
    trouble_ticket_id: number
    event_type: string

    previous_assigned_id?: string | null
    new_assigned_id?: string | null

    previous_assigned_name?: string | null
    new_assigned_name?: string | null

    note?: string | null
    performed_by?: string | null

    created_at: string
}

/* ============================================================
   TT EVENT API RESPONSE
============================================================ */

type TTEventApiResponse = {
    success?: boolean
    data?: {
        ticket_id: number
        tt_no: string
        events: TTEvent[]
    }
    error?: string
    message?: string
}

/* ============================================================
   MODAL
============================================================ */

export function TTGlobalModal() {
    const { open, data, closeModal } = useTTModal()

    const [events, setEvents] = React.useState<TTEvent[]>([])
    const [historyLoading, setHistoryLoading] = React.useState(false)
    const [historyError, setHistoryError] = React.useState("")

    const statusColor = {
        Open: "bg-blue-100 text-blue-700 border-blue-200",
        Closed: "bg-green-100 text-green-700 border-green-200",
        "Not Started":
            "bg-red-100 text-red-700 border-red-200",
    }

    /* ========================================================
       LOAD TT HISTORY
    ======================================================== */

    const loadHistory = React.useCallback(async () => {
        if (!data?.id) {
            setEvents([])
            return
        }

        try {
            setHistoryLoading(true)
            setHistoryError("")

            const token =
                typeof window !== "undefined"
                    ? localStorage.getItem("itm_token")
                    : null

            if (!token) {
                setHistoryError(
                    "Missing authorization token. Please sign in again."
                )
                setEvents([])
                return
            }

            const apiBase = (
                process.env.NEXT_PUBLIC_API_URL ??
                "http://localhost:8080/api/v1"
            ).replace(/\/+$/, "")

            const response = await fetch(
                `${apiBase}/dashboard/trouble-tickets/${data.id}/events`,
                {
                    method: "GET",

                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    credentials: "include",

                    cache: "no-store",
                }
            )

            const result =
                (await response.json()) as TTEventApiResponse

            if (!response.ok) {
                throw new Error(
                    result?.error ??
                    result?.message ??
                    `Failed to load TT history (${response.status})`
                )
            }

            setEvents(
                result?.data?.events ?? []
            )
        } catch (error) {
            setEvents([])

            setHistoryError(
                error instanceof Error
                    ? error.message
                    : "Failed to load TT history."
            )
        } finally {
            setHistoryLoading(false)
        }
    }, [data?.id])

    /* ========================================================
       LOAD HISTORY WHEN MODAL OPENS
    ======================================================== */

    React.useEffect(() => {
        if (!open || !data?.id) {
            return
        }

        void loadHistory()
    }, [
        open,
        data?.id,
        loadHistory,
    ])

    /* ========================================================
       EVENT TITLE
    ======================================================== */

    const getEventTitle = (
        eventType: string
    ) => {
        switch (eventType) {
            case "ASSIGNED":
                return "Ticket Assigned"

            case "REASSIGNED":
                return "Ticket Reassigned"

            case "UNASSIGNED":
                return "Ticket Unassigned"

            case "STATUS_CHANGED":
                return "Status Changed"

            case "NOTE_ADDED":
                return "Note Added"

            case "REQUISITION_CREATED":
                return "Requisition Created"

            case "REQUISITION_APPROVED":
                return "Requisition Approved"

            case "REQUISITION_REJECTED":
                return "Requisition Rejected"

            case "DELIVERED":
                return "Ticket Delivered"

            case "CLOSED":
                return "Ticket Closed"

            default:
                return eventType
        }
    }

    /* ========================================================
       EVENT STYLE
    ======================================================== */

    const getEventStyle = (
        eventType: string
    ) => {
        switch (eventType) {
            case "REASSIGNED":
                return {
                    icon:
                        "text-blue-600",
                    badge:
                        "bg-blue-100 text-blue-700",
                    border:
                        "border-blue-200",
                }

            case "CLOSED":
                return {
                    icon:
                        "text-green-600",
                    badge:
                        "bg-green-100 text-green-700",
                    border:
                        "border-green-200",
                }

            case "STATUS_CHANGED":
                return {
                    icon:
                        "text-orange-600",
                    badge:
                        "bg-orange-100 text-orange-700",
                    border:
                        "border-orange-200",
                }

            default:
                return {
                    icon:
                        "text-green-600",
                    badge:
                        "bg-green-100 text-green-700",
                    border:
                        "border-green-200",
                }
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={closeModal}
        >
            <DialogContent
                className="
                    w-full
                    max-w-[620px]
                    rounded-2xl
                    border
                    p-0
                    overflow-hidden
                    shadow-2xl
                "
            >
                <DialogTitle className="sr-only">
                    TT Details
                </DialogTitle>

                {/* ====================================================
                    HEADER
                ==================================================== */}

                <div className="border-b px-5 py-4 bg-muted/30">

                    <div className="flex items-start justify-between">

                        <div className="space-y-1">

                            <div className="flex items-center gap-2">

                                <h2 className="text-lg font-semibold text-primary">
                                    TT #{data?.tt_no}
                                </h2>

                                <Badge
                                    className={`border text-xs font-medium ${statusColor[
                                        data?.status ||
                                        "Open"
                                    ] ||
                                        statusColor.Open
                                        }`}
                                >
                                    {data?.status}
                                </Badge>

                            </div>

                            <p className="text-xs text-muted-foreground">
                                Ticket Information & Employee Details
                            </p>

                        </div>

                        <DialogClose asChild>

                            <button
                                className="
                                    h-8
                                    w-8
                                    rounded-full
                                    flex
                                    items-center
                                    justify-center
                                    hover:bg-muted
                                    transition
                                "
                            >
                                <X className="w-4 h-4" />
                            </button>

                        </DialogClose>

                    </div>

                </div>

                {/* ====================================================
                    BODY
                ==================================================== */}

                <div className="max-h-[70vh] overflow-y-auto p-5">

                    {/* ==================================================
                        TOP INFO
                    ================================================== */}

                    <div className="grid grid-cols-2 gap-4">

                        {/* Employee */}

                        <div className="rounded-xl border p-4 space-y-2 bg-background">

                            <div className="flex items-center gap-2 text-primary">

                                <User2 className="w-4 h-4" />

                                <h4 className="text-sm font-semibold">
                                    Employee
                                </h4>

                            </div>

                            <div className="space-y-1 text-xs">

                                <p>

                                    <span className="text-muted-foreground">
                                        Name:
                                    </span>{" "}

                                    <span className="font-medium">
                                        {data?.employee_name ||
                                            "-"}
                                    </span>

                                </p>

                                <p>

                                    <span className="text-muted-foreground">
                                        ID:
                                    </span>{" "}

                                    {data?.employee_id ||
                                        "-"}

                                </p>

                                <p className="flex items-center gap-1">

                                    <Phone className="w-3 h-3" />

                                    {data?.mobile_no ||
                                        "-"}

                                </p>

                            </div>

                        </div>

                        {/* Department */}

                        <div className="rounded-xl border p-4 space-y-2 bg-background">

                            <div className="flex items-center gap-2 text-primary">

                                <Building2 className="w-4 h-4" />

                                <h4 className="text-sm font-semibold">
                                    Department
                                </h4>

                            </div>

                            <div className="space-y-1 text-xs">

                                <p>

                                    <span className="text-muted-foreground">
                                        Department:
                                    </span>{" "}

                                    {data?.dept_name ||
                                        "-"}

                                </p>

                                <p>

                                    <span className="text-muted-foreground">
                                        Function:
                                    </span>{" "}

                                    {data?.func_name ||
                                        "-"}

                                </p>

                                <p>

                                    <span className="text-muted-foreground">
                                        Company:
                                    </span>{" "}

                                    {data?.company_name ||
                                        "-"}

                                </p>

                            </div>

                        </div>

                    </div>

                    {/* ==================================================
                        TICKET DETAILS
                    ================================================== */}

                    <div className="mt-4 rounded-xl border p-4 bg-background">

                        <div className="flex items-center gap-2 text-primary mb-3">

                            <ClipboardList className="w-4 h-4" />

                            <h4 className="text-sm font-semibold">
                                Ticket Details
                            </h4>

                        </div>

                        <div className="grid grid-cols-2 gap-y-3 text-xs">

                            <div>

                                <p className="text-muted-foreground">
                                    Requisition Type
                                </p>

                                <p className="font-medium">
                                    {data?.requistionType ||
                                        "-"}
                                </p>

                            </div>

                            <div>

                                <p className="text-muted-foreground">
                                    Query Type
                                </p>

                                <p className="font-medium">
                                    {data?.query_type ||
                                        "-"}
                                </p>

                            </div>

                            <div>

                                <p className="text-muted-foreground">
                                    Assigned To
                                </p>

                                <p className="font-medium">
                                    {data?.assigned_name ||
                                        "-"}
                                </p>

                            </div>

                            <div>

                                <p className="text-muted-foreground">
                                    Assigned ID
                                </p>

                                <p className="font-medium">
                                    {data?.assigned_id ||
                                        "-"}
                                </p>

                            </div>

                            <div>

                                <p className="text-muted-foreground">
                                    TT Age
                                </p>

                                <p className="font-medium flex items-center gap-1">

                                    <Clock3 className="w-3 h-3" />

                                    {data?.tt_age ||
                                        "-"}

                                </p>

                            </div>

                            <div>

                                <p className="text-muted-foreground">
                                    Delivery Status
                                </p>

                                <p className="font-medium">
                                    {data?.delivered_status ||
                                        "-"}
                                </p>

                            </div>

                            <div className="col-span-2">

                                <p className="text-muted-foreground">
                                    Created At
                                </p>

                                <p className="font-medium">
                                    {data?.created_at ||
                                        "-"}
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* ==================================================
                        ASSIGNMENT
                    ================================================== */}

                    <div className="mt-4 rounded-xl border p-4 bg-background">

                        <div className="flex items-center gap-2 text-primary mb-2">

                            <BriefcaseBusiness className="w-4 h-4" />

                            <h4 className="text-sm font-semibold">
                                Assignment Information
                            </h4>

                        </div>

                        <div className="text-xs space-y-1">

                            <p>

                                <span className="text-muted-foreground">
                                    Responsible Person:
                                </span>{" "}

                                <span className="font-medium">
                                    {data?.assigned_name ||
                                        "Not Assigned"}
                                </span>

                            </p>

                        </div>

                    </div>

                    {/* ==================================================
                        TT HISTORY
                    ================================================== */}

                    <div className="mt-4 rounded-xl border p-4 bg-background">

                        {/* History Header */}

                        <div className="flex items-center gap-2 mb-4">

                            <div
                                className="
                                    flex
                                    h-8
                                    w-8
                                    items-center
                                    justify-center
                                    rounded-lg
                                    bg-primary/10
                                "
                            >
                                <History className="w-4 h-4 text-primary" />
                            </div>

                            <div>

                                <h4 className="text-sm font-semibold">
                                    TT History
                                </h4>

                                <p className="text-[10px] text-muted-foreground">
                                    Assignment activity and notes
                                </p>

                            </div>

                            {events.length > 0 && (
                                <span
                                    className="
                                        ml-auto
                                        rounded-full
                                        bg-muted
                                        px-2
                                        py-0.5
                                        text-[10px]
                                        font-medium
                                    "
                                >
                                    {events.length}{" "}
                                    {events.length === 1
                                        ? "Event"
                                        : "Events"}
                                </span>
                            )}

                        </div>

                        {/* Loading */}

                        {historyLoading && (

                            <div className="
                                flex
                                items-center
                                justify-center
                                py-6
                                text-xs
                                text-muted-foreground
                            ">

                                <div
                                    className="
                                        mr-2
                                        h-4
                                        w-4
                                        animate-spin
                                        rounded-full
                                        border-2
                                        border-primary
                                        border-t-transparent
                                    "
                                />

                                Loading TT history...

                            </div>

                        )}

                        {/* Error */}

                        {!historyLoading &&
                            historyError && (

                                <div
                                    className="
                                        rounded-lg
                                        border
                                        border-red-200
                                        bg-red-50
                                        px-3
                                        py-2.5
                                        text-xs
                                        text-red-700
                                    "
                                >
                                    {historyError}
                                </div>
                            )}

                        {/* Empty */}

                        {!historyLoading &&
                            !historyError &&
                            events.length === 0 && (

                                <div
                                    className="
                                        rounded-lg
                                        border
                                        border-dashed
                                        bg-muted/20
                                        py-6
                                        text-center
                                    "
                                >

                                    <History
                                        className="
                                            mx-auto
                                            h-5
                                            w-5
                                            text-muted-foreground
                                        "
                                    />

                                    <p
                                        className="
                                            mt-2
                                            text-xs
                                            font-medium
                                            text-gray-700
                                        "
                                    >
                                        No history available
                                    </p>

                                </div>
                            )}

                        {/* Timeline */}

                        {!historyLoading &&
                            !historyError &&
                            events.length > 0 && (

                                <div className="relative">

                                    {/* Timeline line */}

                                    <div
                                        className="
                                            absolute
                                            left-[15px]
                                            top-3
                                            bottom-3
                                            w-px
                                            bg-border
                                        "
                                    />

                                    <div className="space-y-4">

                                        {events.map(
                                            (event) => {

                                                const style =
                                                    getEventStyle(
                                                        event.event_type
                                                    )

                                                const isReassigned =
                                                    event.event_type ===
                                                    "REASSIGNED"

                                                return (
                                                    <div
                                                        key={
                                                            event.event_uuid ||
                                                            event.id
                                                        }
                                                        className="
                                                            relative
                                                            flex
                                                            gap-3
                                                        "
                                                    >

                                                        {/* Timeline Icon */}

                                                        <div
                                                            className={`
                                                                relative
                                                                z-10
                                                                flex
                                                                h-8
                                                                w-8
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                border
                                                                bg-background
                                                                ${style.border}
                                                            `}
                                                        >

                                                            {isReassigned ? (
                                                                <ArrowRight
                                                                    className={`
                                                                        h-3.5
                                                                        w-3.5
                                                                        ${style.icon}
                                                                    `}
                                                                />
                                                            ) : (
                                                                <UserCheck
                                                                    className={`
                                                                        h-3.5
                                                                        w-3.5
                                                                        ${style.icon}
                                                                    `}
                                                                />
                                                            )}

                                                        </div>

                                                        {/* Event */}

                                                        <div
                                                            className="
                                                                flex-1
                                                                rounded-lg
                                                                border
                                                                bg-muted/20
                                                                p-3
                                                            "
                                                        >

                                                            {/* Title */}

                                                            <div
                                                                className="
                                                                    flex
                                                                    items-start
                                                                    justify-between
                                                                    gap-3
                                                                "
                                                            >

                                                                <div
                                                                    className="
                                                                        flex
                                                                        items-center
                                                                        gap-2
                                                                    "
                                                                >

                                                                    <span
                                                                        className="
                                                                            text-xs
                                                                            font-semibold
                                                                        "
                                                                    >
                                                                        {getEventTitle(
                                                                            event.event_type
                                                                        )}
                                                                    </span>

                                                                    <span
                                                                        className={`
                                                                            rounded-full
                                                                            px-1.5
                                                                            py-0.5
                                                                            text-[9px]
                                                                            font-medium
                                                                            ${style.badge}
                                                                        `}
                                                                    >
                                                                        {
                                                                            event.event_type
                                                                        }
                                                                    </span>

                                                                </div>

                                                                <span
                                                                    className="
                                                                        shrink-0
                                                                        text-[9px]
                                                                        text-muted-foreground
                                                                    "
                                                                >
                                                                    {new Date(
                                                                        event.created_at
                                                                    ).toLocaleString(
                                                                        "en-US",
                                                                        {
                                                                            month:
                                                                                "short",
                                                                            day:
                                                                                "numeric",
                                                                            year:
                                                                                "numeric",
                                                                            hour:
                                                                                "numeric",
                                                                            minute:
                                                                                "2-digit",
                                                                        }
                                                                    )}
                                                                </span>

                                                            </div>

                                                            {/* Assignment Change */}

                                                            {(event.previous_assigned_id ||
                                                                event.new_assigned_id ||
                                                                event.previous_assigned_name ||
                                                                event.new_assigned_name) && (

                                                                    <div
                                                                        className="
                                                                        mt-3
                                                                        flex
                                                                        items-center
                                                                        gap-2
                                                                        rounded-md
                                                                        border
                                                                        bg-background
                                                                        px-3
                                                                        py-2
                                                                    "
                                                                    >

                                                                        {/* Previous */}

                                                                        <div
                                                                            className="
                                                                            flex-1
                                                                            min-w-0
                                                                        "
                                                                        >

                                                                            <p
                                                                                className="
                                                                                text-[9px]
                                                                                text-muted-foreground
                                                                            "
                                                                            >
                                                                                Previous
                                                                            </p>

                                                                            <p
                                                                                className="
                                                                                mt-0.5
                                                                                truncate
                                                                                text-xs
                                                                                font-medium
                                                                            "
                                                                            >
                                                                                {event.previous_assigned_name ||
                                                                                    "Not Assigned"}
                                                                            </p>

                                                                            {event.previous_assigned_id && (
                                                                                <p
                                                                                    className="
                                                                                    text-[9px]
                                                                                    text-muted-foreground
                                                                                "
                                                                                >
                                                                                    {
                                                                                        event.previous_assigned_id
                                                                                    }
                                                                                </p>
                                                                            )}

                                                                        </div>

                                                                        {/* Arrow */}

                                                                        <ArrowRight
                                                                            className="
                                                                            h-3.5
                                                                            w-3.5
                                                                            shrink-0
                                                                            text-muted-foreground
                                                                        "
                                                                        />

                                                                        {/* New */}

                                                                        <div
                                                                            className="
                                                                            flex-1
                                                                            min-w-0
                                                                        "
                                                                        >

                                                                            <p
                                                                                className="
                                                                                text-[9px]
                                                                                text-muted-foreground
                                                                            "
                                                                            >
                                                                                Assigned To
                                                                            </p>

                                                                            <p
                                                                                className="
                                                                                mt-0.5
                                                                                truncate
                                                                                text-xs
                                                                                font-semibold
                                                                                text-primary
                                                                            "
                                                                            >
                                                                                {event.new_assigned_name ||
                                                                                    "Not Assigned"}
                                                                            </p>

                                                                            {event.new_assigned_id && (
                                                                                <p
                                                                                    className="
                                                                                    text-[9px]
                                                                                    text-muted-foreground
                                                                                "
                                                                                >
                                                                                    {
                                                                                        event.new_assigned_id
                                                                                    }
                                                                                </p>
                                                                            )}

                                                                        </div>

                                                                    </div>
                                                                )}

                                                            {/* Note */}

                                                            {event.note?.trim() && (

                                                                <div
                                                                    className="
                                                                        mt-2
                                                                        rounded-md
                                                                        bg-muted/40
                                                                        px-3
                                                                        py-2
                                                                    "
                                                                >

                                                                    <p
                                                                        className="
                                                                            text-[9px]
                                                                            font-medium
                                                                            text-muted-foreground
                                                                        "
                                                                    >
                                                                        Note
                                                                    </p>

                                                                    <p
                                                                        className="
                                                                            mt-0.5
                                                                            text-[11px]
                                                                            leading-4
                                                                            text-foreground
                                                                        "
                                                                    >
                                                                        {
                                                                            event.note
                                                                        }
                                                                    </p>

                                                                </div>
                                                            )}

                                                            {/* Performed By */}

                                                            {event.performed_by && (

                                                                <div
                                                                    className="
                                                                        mt-2
                                                                        flex
                                                                        items-center
                                                                        gap-1.5
                                                                        text-[9px]
                                                                        text-muted-foreground
                                                                    "
                                                                >

                                                                    <User2 className="w-3 h-3" />

                                                                    <span>
                                                                        Performed by
                                                                    </span>

                                                                    <span
                                                                        className="
                                                                            font-medium
                                                                            text-foreground
                                                                        "
                                                                    >
                                                                        {
                                                                            event.performed_by
                                                                        }
                                                                    </span>

                                                                </div>
                                                            )}

                                                        </div>

                                                    </div>
                                                )
                                            }
                                        )}

                                    </div>

                                </div>
                            )}

                    </div>

                </div>

                {/* ====================================================
                    FOOTER
                ==================================================== */}

                <div className="
                    border-t
                    px-5
                    py-4
                    flex
                    items-center
                    justify-end
                    gap-2
                    bg-muted/20
                ">

                    <DialogClose asChild>

                        <Button
                            variant="outline"
                            size="sm"
                        >
                            Close
                        </Button>

                    </DialogClose>

                    <Button size="sm">
                        Print TT
                    </Button>

                </div>

            </DialogContent>
        </Dialog>
    )
}