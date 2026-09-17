// frontend/app/dashboard/user/page.tsx

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import {
    AlertCircle,
    BadgeCheck,
    Building2,
    CheckCircle2,
    Clock3,
    Loader2,
    Mail,
    Phone,
    RefreshCw,
    Search,
    Ticket,
    UserRound,
    Workflow,
} from "lucide-react";

import {
    ownDashboardApi,
    type OwnDashboardData,
    type OwnTroubleTicketItem,
} from "@/lib/api";

const PAGE_SIZE = 10;

type TicketStatusFilter =
    | "all"
    | "open"
    | "running"
    | "closed";

type SummaryTone =
    | "slate"
    | "blue"
    | "amber"
    | "emerald";

export default function UserDashboardPage() {
    const [
        dashboard,
        setDashboard,
    ] =
        useState<OwnDashboardData | null>(
            null
        );

    const [
        tickets,
        setTickets,
    ] =
        useState<
            OwnTroubleTicketItem[]
        >([]);

    const [
        total,
        setTotal,
    ] =
        useState(0);

    const [
        page,
        setPage,
    ] =
        useState(1);

    const [
        search,
        setSearch,
    ] =
        useState("");

    const [
        appliedSearch,
        setAppliedSearch,
    ] =
        useState("");

    const [
        status,
        setStatus,
    ] =
        useState<TicketStatusFilter>(
            "all"
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        ticketsLoading,
        setTicketsLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");

    const loadDashboard =
        useCallback(
            async () => {
                try {
                    setLoading(
                        true
                    );
                    setError(
                        ""
                    );

                    const response =
                        await ownDashboardApi.dashboard();

                    setDashboard(
                        response.data
                    );
                } catch (
                reason
                ) {
                    setDashboard(
                        null
                    );

                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load employee dashboard."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            []
        );

    const loadTickets =
        useCallback(
            async () => {
                try {
                    setTicketsLoading(
                        true
                    );

                    const response =
                        await ownDashboardApi.troubleTickets(
                            {
                                page,
                                limit:
                                    PAGE_SIZE,
                                status,
                                search:
                                    appliedSearch ||
                                    undefined,
                            }
                        );

                    setTickets(
                        response.data ??
                        []
                    );

                    setTotal(
                        Number(
                            response.total ??
                            0
                        )
                    );
                } catch (
                reason
                ) {
                    setTickets(
                        []
                    );
                    setTotal(
                        0
                    );

                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load Trouble Tickets."
                    );
                } finally {
                    setTicketsLoading(
                        false
                    );
                }
            },
            [
                page,
                status,
                appliedSearch,
            ]
        );

    useEffect(
        () => {
            void loadDashboard();
        },
        [
            loadDashboard,
        ]
    );

    useEffect(
        () => {
            void loadTickets();
        },
        [
            loadTickets,
        ]
    );

    function handleSearch() {
        setPage(
            1
        );

        setAppliedSearch(
            search.trim()
        );
    }

    function clearSearch() {
        setSearch(
            ""
        );
        setAppliedSearch(
            ""
        );
        setPage(
            1
        );
    }

    function changeStatus(
        nextStatus: TicketStatusFilter
    ) {
        setStatus(
            nextStatus
        );
        setPage(
            1
        );
    }

    function handleRefresh() {
        void loadDashboard();
        void loadTickets();
    }

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                PAGE_SIZE
            )
        );

    if (
        loading
    ) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading your dashboard...
                </div>
            </div>
        );
    }

    if (
        error &&
        !dashboard
    ) {
        return (
            <div className="p-4">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

                        <div>
                            <h2 className="font-semibold text-red-800">
                                Unable to load dashboard
                            </h2>

                            <p className="mt-1 text-sm text-red-700">
                                {
                                    error
                                }
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleRefresh
                                }
                                className="mt-3 inline-flex h-8 items-center gap-2 rounded-lg bg-red-700 px-3 text-xs font-medium text-white hover:bg-red-800"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (
        !dashboard
    ) {
        return null;
    }

    const {
        employee,
        tickets:
        summary,
    } =
        dashboard;

    const closureRate =
        summary.total >
            0
            ? Math.round(
                (
                    summary.closed /
                    summary.total
                ) *
                100
            )
            : 0;

    const avatarText =
        getAvatarText(
            employee.employee_name,
            employee.employee_id
        );

    return (
        <div className="min-w-0 space-y-3 p-2 sm:p-3 lg:p-4">
            {/* ==================================================
                COMPACT HERO / EMPLOYEE OVERVIEW
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-50 via-white to-slate-100 px-4 py-4 text-slate-900 sm:px-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black tracking-wide text-slate-700 shadow-sm ring-1 ring-slate-100">
                                {
                                    avatarText
                                }
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Employee Dashboard
                                    </p>

                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                                        <BadgeCheck className="h-3 w-3" />
                                        Active
                                    </span>
                                </div>

                                <h1 className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
                                    {employee.employee_name ||
                                        employee.employee_id}
                                </h1>

                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600">
                                    {employee.designation && (
                                        <span>
                                            {
                                                employee.designation
                                            }
                                        </span>
                                    )}

                                    {employee.designation &&
                                        employee.department && (
                                            <span className="text-slate-300">
                                                •
                                            </span>
                                        )}

                                    {employee.department && (
                                        <span>
                                            {
                                                employee.department
                                            }
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm sm:block">
                                <p className="text-[9px] uppercase tracking-wide text-slate-500">
                                    Ticket Closure
                                </p>

                                <p className="mt-0.5 text-lg font-bold text-emerald-600">
                                    {
                                        closureRate
                                    }
                                    %
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleRefresh
                                }
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-6">
                    <ProfileMetric
                        icon={
                            <BadgeCheck className="h-3.5 w-3.5" />
                        }
                        label="Employee ID"
                        value={
                            employee.employee_id
                        }
                    />

                    <ProfileMetric
                        icon={
                            <UserRound className="h-3.5 w-3.5" />
                        }
                        label="Designation"
                        value={
                            employee.designation
                        }
                    />

                    <ProfileMetric
                        icon={
                            <Building2 className="h-3.5 w-3.5" />
                        }
                        label="Department"
                        value={
                            employee.department
                        }
                    />

                    <ProfileMetric
                        icon={
                            <Workflow className="h-3.5 w-3.5" />
                        }
                        label="Work Field"
                        value={
                            employee.work_field ||
                            employee.sub_function
                        }
                    />

                    <ProfileMetric
                        icon={
                            <Phone className="h-3.5 w-3.5" />
                        }
                        label="Official Mobile"
                        value={
                            employee.official_cell
                        }
                    />

                    <ProfileMetric
                        icon={
                            <Mail className="h-3.5 w-3.5" />
                        }
                        label="Official Email"
                        value={
                            employee.official_email
                        }
                    />
                </div>
            </section>

            {/* ==================================================
                TT SUMMARY - CLICKABLE FILTER CARDS
            ================================================== */}

            <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <TicketSummaryCard
                    label="Total Tickets"
                    value={
                        summary.total
                    }
                    percent={
                        100
                    }
                    helper="All your tickets"
                    icon={
                        <Ticket className="h-4 w-4" />
                    }
                    tone="slate"
                    active={
                        status ===
                        "all"
                    }
                    onClick={() =>
                        changeStatus(
                            "all"
                        )
                    }
                />

                <TicketSummaryCard
                    label="Open"
                    value={
                        summary.open
                    }
                    percent={
                        getPercent(
                            summary.open,
                            summary.total
                        )
                    }
                    helper="Needs attention"
                    icon={
                        <AlertCircle className="h-4 w-4" />
                    }
                    tone="blue"
                    active={
                        status ===
                        "open"
                    }
                    onClick={() =>
                        changeStatus(
                            "open"
                        )
                    }
                />

                <TicketSummaryCard
                    label="Running"
                    value={
                        summary.running
                    }
                    percent={
                        getPercent(
                            summary.running,
                            summary.total
                        )
                    }
                    helper="Currently in progress"
                    icon={
                        <Clock3 className="h-4 w-4" />
                    }
                    tone="amber"
                    active={
                        status ===
                        "running"
                    }
                    onClick={() =>
                        changeStatus(
                            "running"
                        )
                    }
                />

                <TicketSummaryCard
                    label="Closed"
                    value={
                        summary.closed
                    }
                    percent={
                        closureRate
                    }
                    helper={`${closureRate}% closure rate`}
                    icon={
                        <CheckCircle2 className="h-4 w-4" />
                    }
                    tone="emerald"
                    active={
                        status ===
                        "closed"
                    }
                    onClick={() =>
                        changeStatus(
                            "closed"
                        )
                    }
                />
            </section>

            {/* ==================================================
                TROUBLE TICKET TABLE - 10 ROWS AT A GLANCE
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-200 px-3.5 py-2.5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-semibold text-slate-900">
                                My Trouble Tickets
                            </h2>

                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {total.toLocaleString()}
                            </span>

                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
                                10 rows / page
                            </span>
                        </div>

                        <p className="mt-0.5 text-[10px] text-slate-500">
                            Latest ticket activity with essential details at a glance
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                        <select
                            value={
                                status
                            }
                            onChange={(
                                event
                            ) =>
                                changeStatus(
                                    event
                                        .target
                                        .value as TicketStatusFilter
                                )
                            }
                            className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 outline-none transition focus:border-indigo-300"
                        >
                            <option value="all">
                                All Status
                            </option>

                            <option value="open">
                                Open
                            </option>

                            <option value="running">
                                Running
                            </option>

                            <option value="closed">
                                Closed
                            </option>
                        </select>

                        <div className="flex min-w-0 flex-1 lg:w-72">
                            <div className="relative min-w-0 flex-1">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                                <input
                                    type="text"
                                    value={
                                        search
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearch(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    onKeyDown={(
                                        event
                                    ) => {
                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            handleSearch();
                                        }
                                    }}
                                    placeholder="TT no, query, department..."
                                    className="h-8 w-full rounded-l-lg border border-r-0 border-slate-200 bg-white pl-9 pr-3 text-[11px] outline-none transition focus:border-indigo-300"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleSearch
                                }
                                className="h-8 rounded-r-lg border border-slate-200 bg-slate-100 px-3.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                                Search
                            </button>

                            {appliedSearch && (
                                <button
                                    type="button"
                                    onClick={
                                        clearSearch
                                    }
                                    className="ml-1 h-8 rounded-lg border border-slate-200 px-2.5 text-[10px] font-medium text-slate-500 hover:bg-slate-50"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && dashboard && (
                    <div className="border-b border-red-100 bg-red-50 px-3.5 py-2 text-[10px] text-red-700">
                        {
                            error
                        }
                    </div>
                )}

                <div className="w-full">
                    <table className="w-full table-fixed border-collapse text-left">
                        <colgroup>
                            <col className="w-[4%]" />
                            <col className="w-[15%]" />
                            <col className="w-[25%]" />
                            <col className="w-[16%]" />
                            <col className="w-[16%]" />
                            <col className="w-[10%]" />
                            <col className="w-[14%]" />
                        </colgroup>

                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/90">
                                <Th align="center">
                                    SL
                                </Th>

                                <Th>
                                    TT No
                                </Th>

                                <Th>
                                    Query / Description
                                </Th>

                                <Th>
                                    Department
                                </Th>

                                <Th>
                                    Assigned To
                                </Th>

                                <Th>
                                    Status
                                </Th>

                                <Th>
                                    Created
                                </Th>
                            </tr>
                        </thead>

                        <tbody>
                            {ticketsLoading ? (
                                <tr>
                                    <td
                                        colSpan={
                                            7
                                        }
                                        className="h-32 text-center"
                                    >
                                        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading Trouble Tickets...
                                        </div>
                                    </td>
                                </tr>
                            ) : tickets.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            7
                                        }
                                        className="h-32 text-center"
                                    >
                                        <Ticket className="mx-auto h-7 w-7 text-slate-300" />

                                        <p className="mt-2 text-sm font-semibold text-slate-700">
                                            No Trouble Tickets found
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-slate-500">
                                            Change the filters or search to see more results.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(
                                    (
                                        item,
                                        index
                                    ) => (
                                        <tr
                                            key={`${item.tt_no}-${item.id}-${index}`}
                                            className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-indigo-50/30"
                                        >
                                            <Td align="center">
                                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[9px] font-bold tabular-nums text-slate-600">
                                                    {(page -
                                                        1) *
                                                        PAGE_SIZE +
                                                        index +
                                                        1}
                                                </span>
                                            </Td>

                                            <Td>
                                                <div className="min-w-0">
                                                    <p
                                                        className="truncate text-[10.5px] font-bold text-slate-900"
                                                        title={
                                                            item.tt_no
                                                        }
                                                    >
                                                        {
                                                            item.tt_no
                                                        }
                                                    </p>

                                                    <p className="mt-0.5 text-[9px] text-slate-400">
                                                        ID{" "}
                                                        {
                                                            item.id
                                                        }
                                                    </p>
                                                </div>
                                            </Td>

                                            <Td>
                                                <div className="min-w-0 pr-2">
                                                    <p
                                                        className="truncate text-[10.5px] font-semibold text-slate-800"
                                                        title={
                                                            item.query_type ||
                                                            ""
                                                        }
                                                    >
                                                        {item.query_type ||
                                                            "No query type"}
                                                    </p>

                                                    <p
                                                        className="mt-0.5 line-clamp-1 text-[9px] leading-3.5 text-slate-500"
                                                        title={
                                                            item.description ||
                                                            ""
                                                        }
                                                    >
                                                        {item.description ||
                                                            "No description"}
                                                    </p>
                                                </div>
                                            </Td>

                                            <Td>
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                    <Building2 className="h-3 w-3 shrink-0 text-slate-400" />

                                                    <span
                                                        className="truncate text-[10px] font-medium text-slate-700"
                                                        title={
                                                            item.department ||
                                                            ""
                                                        }
                                                    >
                                                        {item.department ||
                                                            "—"}
                                                    </span>
                                                </div>
                                            </Td>

                                            <Td>
                                                <div className="min-w-0">
                                                    <p
                                                        className="truncate text-[10px] font-semibold text-slate-800"
                                                        title={
                                                            item.assigned_name ||
                                                            ""
                                                        }
                                                    >
                                                        {item.assigned_name ||
                                                            item.assigned_id ||
                                                            "Unassigned"}
                                                    </p>

                                                    {item.assigned_name &&
                                                        item.assigned_id && (
                                                            <p className="mt-0.5 truncate text-[9px] text-slate-400">
                                                                {
                                                                    item.assigned_id
                                                                }
                                                            </p>
                                                        )}
                                                </div>
                                            </Td>

                                            <Td>
                                                <StatusBadge
                                                    status={
                                                        item.status
                                                    }
                                                />
                                            </Td>

                                            <Td>
                                                <DateCell
                                                    value={
                                                        item.created_at
                                                    }
                                                />
                                            </Td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/40 px-3.5 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[10px] text-slate-500">
                        Showing{" "}
                        {total ===
                            0
                            ? 0
                            : (page -
                                1) *
                            PAGE_SIZE +
                            1}
                        {"–"}
                        {Math.min(
                            page *
                            PAGE_SIZE,
                            total
                        )}{" "}
                        of{" "}
                        {total.toLocaleString()}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">
                            Page{" "}
                            {
                                page
                            }{" "}
                            of{" "}
                            {
                                totalPages
                            }
                        </span>

                        <button
                            type="button"
                            disabled={
                                page <=
                                1 ||
                                ticketsLoading
                            }
                            onClick={() =>
                                setPage(
                                    (
                                        current
                                    ) =>
                                        Math.max(
                                            1,
                                            current -
                                            1
                                        )
                                )
                            }
                            className="h-7 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={
                                page >=
                                totalPages ||
                                ticketsLoading
                            }
                            onClick={() =>
                                setPage(
                                    (
                                        current
                                    ) =>
                                        Math.min(
                                            totalPages,
                                            current +
                                            1
                                        )
                                )
                            }
                            className="h-7 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ======================================================
   COMPONENTS
====================================================== */

function ProfileMetric({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value?: string | null;
}) {
    return (
        <div className="min-w-0 bg-white px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.04em] text-slate-400">
                {
                    icon
                }

                {
                    label
                }
            </div>

            <p
                className="mt-1 truncate text-[10.5px] font-semibold text-slate-800"
                title={
                    value?.trim() ||
                    "Not available"
                }
            >
                {value?.trim() ||
                    "Not available"}
            </p>
        </div>
    );
}

function TicketSummaryCard({
    label,
    value,
    percent,
    helper,
    icon,
    tone,
    active,
    onClick,
}: {
    label: string;
    value: number;
    percent: number;
    helper: string;
    icon: ReactNode;
    tone: SummaryTone;
    active: boolean;
    onClick: () => void;
}) {
    const styles: Record<
        SummaryTone,
        {
            wrapper: string;
            icon: string;
            number: string;
            bar: string;
            active: string;
        }
    > = {
        slate: {
            wrapper:
                "border-slate-200 bg-gradient-to-br from-white to-slate-50",
            icon:
                "bg-slate-100 text-slate-700",
            number:
                "text-slate-900",
            bar:
                "bg-slate-700",
            active:
                "ring-slate-300",
        },

        blue: {
            wrapper:
                "border-blue-100 bg-gradient-to-br from-white to-blue-50/70",
            icon:
                "bg-blue-100 text-blue-700",
            number:
                "text-blue-950",
            bar:
                "bg-blue-500",
            active:
                "ring-blue-300",
        },

        amber: {
            wrapper:
                "border-amber-100 bg-gradient-to-br from-white to-amber-50/70",
            icon:
                "bg-amber-100 text-amber-700",
            number:
                "text-amber-950",
            bar:
                "bg-amber-500",
            active:
                "ring-amber-300",
        },

        emerald: {
            wrapper:
                "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70",
            icon:
                "bg-emerald-100 text-emerald-700",
            number:
                "text-emerald-950",
            bar:
                "bg-emerald-500",
            active:
                "ring-emerald-300",
        },
    };

    const style =
        styles[
        tone
        ];

    return (
        <button
            type="button"
            onClick={
                onClick
            }
            className={`rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md ${style.wrapper
                } ${active
                    ? `ring-1 ${style.active}`
                    : ""
                }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold text-slate-500">
                        {
                            label
                        }
                    </p>

                    <p
                        className={`mt-0.5 text-xl font-bold ${style.number
                            }`}
                    >
                        {Number(
                            value ??
                            0
                        ).toLocaleString()}
                    </p>
                </div>

                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.icon
                        }`}
                >
                    {
                        icon
                    }
                </div>
            </div>

            <div className="mt-2.5">
                <div className="flex items-center justify-between gap-2 text-[9px] text-slate-500">
                    <span className="truncate">
                        {
                            helper
                        }
                    </span>

                    <span className="font-semibold tabular-nums">
                        {
                            percent
                        }
                        %
                    </span>
                </div>

                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-100">
                    <div
                        className={`h-full rounded-full ${style.bar
                            }`}
                        style={{
                            width: `${Math.min(
                                100,
                                Math.max(
                                    0,
                                    percent
                                )
                            )}%`,
                        }}
                    />
                </div>
            </div>
        </button>
    );
}

function Th({
    children,
    align = "left",
}: {
    children: ReactNode;
    align?:
    | "left"
    | "center";
}) {
    return (
        <th
            className={`px-2.5 py-2 text-[9px] font-semibold uppercase tracking-[0.04em] text-slate-500 ${align ===
                "center"
                ? "text-center"
                : "text-left"
                }`}
        >
            {
                children
            }
        </th>
    );
}

function Td({
    children,
    align = "left",
}: {
    children: ReactNode;
    align?:
    | "left"
    | "center";
}) {
    return (
        <td
            className={`px-2.5 py-2 align-middle text-[10px] text-slate-600 ${align ===
                "center"
                ? "text-center"
                : "text-left"
                }`}
        >
            {
                children
            }
        </td>
    );
}

function StatusBadge({
    status,
}: {
    status?: string;
}) {
    const normalized =
        (
            status ??
            ""
        )
            .trim()
            .toLowerCase();

    if (
        normalized ===
        "closed"
    ) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Closed
            </span>
        );
    }

    if (
        normalized ===
        "running" ||
        normalized ===
        "in progress"
    ) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 ring-1 ring-amber-100">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Running
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 ring-1 ring-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {status ||
                "Open"}
        </span>
    );
}

function DateCell({
    value,
}: {
    value?: string;
}) {
    if (
        !value
    ) {
        return (
            <span className="text-slate-400">
                —
            </span>
        );
    }

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return (
            <span
                className="truncate text-[9px] text-slate-600"
                title={
                    value
                }
            >
                {
                    value
                }
            </span>
        );
    }

    return (
        <div className="min-w-0">
            <p className="text-[9.5px] font-semibold text-slate-700">
                {date.toLocaleDateString(
                    "en-GB",
                    {
                        day:
                            "2-digit",
                        month:
                            "short",
                        year:
                            "numeric",
                    }
                )}
            </p>

            <p className="mt-0.5 text-[8.5px] text-slate-400">
                {date.toLocaleTimeString(
                    [],
                    {
                        hour:
                            "2-digit",
                        minute:
                            "2-digit",
                    }
                )}
            </p>
        </div>
    );
}

function getPercent(
    value: number,
    total: number
): number {
    if (
        total <=
        0
    ) {
        return 0;
    }

    return Math.round(
        (
            value /
            total
        ) *
        100
    );
}

function getAvatarText(
    name?: string,
    employeeID?: string
): string {
    const normalizedName =
        (
            name ??
            ""
        ).trim();

    if (
        !normalizedName
    ) {
        return (
            employeeID
                ?.replace(
                    /[^A-Za-z0-9]/g,
                    ""
                )
                .slice(
                    -2
                )
                .toUpperCase() ||
            "U"
        );
    }

    const words =
        normalizedName
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );

    if (
        words.length ===
        1
    ) {
        const word =
            words[0];

        return (
            (
                word[0] ??
                ""
            ) +
            (
                word[
                word.length -
                1
                ] ??
                ""
            )
        ).toUpperCase();
    }

    return (
        (
            words[0][0] ??
            ""
        ) +
        (
            words[
            words.length -
            1
            ][0] ??
            ""
        )
    ).toUpperCase();
}
