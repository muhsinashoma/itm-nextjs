// frontend/app/dashboard/user/tt-history/page.tsx
"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    Loader2,
    RefreshCw,
    Search,
    Ticket,
} from "lucide-react";

import {
    ownDashboardApi,
    type OwnDashboardData,
    type OwnTroubleTicketItem,
} from "@/lib/api";

type TicketStatus =
    | "all"
    | "open"
    | "running"
    | "closed";

export default function TTUserHistoryPage() {
    const [
        dashboard,
        setDashboard,
    ] =
        useState<
            OwnDashboardData | null
        >(null);

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

    const pageSize =
        20;

    const [
        status,
        setStatus,
    ] =
        useState<TicketStatus>(
            "all"
        );

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
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        summaryLoading,
        setSummaryLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");

    /* ======================================================
       LOAD SUMMARY

       Uses:
       GET /api/v1/user/dashboard
    ====================================================== */

    const loadSummary =
        useCallback(
            async () => {
                try {
                    setSummaryLoading(
                        true
                    );

                    const response =
                        await ownDashboardApi.dashboard();

                    setDashboard(
                        response.data
                    );
                } catch {
                    setDashboard(
                        null
                    );
                } finally {
                    setSummaryLoading(
                        false
                    );
                }
            },
            []
        );

    /* ======================================================
       LOAD TT HISTORY

       Uses:
       GET /api/v1/user/trouble-tickets

       employee_id is NOT passed from frontend.
       Backend resolves authenticated employee.
    ====================================================== */

    const loadTickets =
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
                        await ownDashboardApi.troubleTickets(
                            {
                                page,
                                limit:
                                    pageSize,
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
                            : "Unable to load Trouble Ticket history."
                    );
                } finally {
                    setLoading(
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
            void loadSummary();
        },
        [
            loadSummary,
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

    /* ======================================================
       ACTIONS
    ====================================================== */

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

    function handleRefresh() {
        void loadSummary();
        void loadTickets();
    }

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                pageSize
            )
        );

    const summary =
        dashboard?.tickets;

    return (
        <div className="min-w-0 space-y-4 p-1">
            {/* ==================================================
                HEADER
            ================================================== */}

            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Ticket className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                My Support
                            </p>

                            <h1 className="text-xl font-bold text-foreground">
                                TT History
                            </h1>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Your complete Trouble Ticket history
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={
                            handleRefresh
                        }
                        disabled={
                            loading ||
                            summaryLoading
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${loading ||
                                    summaryLoading
                                    ? "animate-spin"
                                    : ""
                                }`}
                        />

                        Refresh
                    </button>
                </div>
            </section>

            {/* ==================================================
                TT SUMMARY
            ================================================== */}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Total Tickets"
                    value={
                        summary?.total ??
                        0
                    }
                    loading={
                        summaryLoading
                    }
                    icon={
                        <Ticket className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    title="Open"
                    value={
                        summary?.open ??
                        0
                    }
                    loading={
                        summaryLoading
                    }
                    icon={
                        <AlertCircle className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    title="Running"
                    value={
                        summary?.running ??
                        0
                    }
                    loading={
                        summaryLoading
                    }
                    icon={
                        <Clock3 className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    title="Closed"
                    value={
                        summary?.closed ??
                        0
                    }
                    loading={
                        summaryLoading
                    }
                    icon={
                        <CheckCircle2 className="h-5 w-5" />
                    }
                />
            </section>

            {/* ==================================================
                TABLE
            ================================================== */}

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {/* TOOLBAR */}

                <div className="border-b border-border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                Trouble Ticket History
                            </h2>

                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {total.toLocaleString()}{" "}
                                ticket
                                {total === 1
                                    ? ""
                                    : "s"}{" "}
                                found
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            {/* STATUS */}

                            <select
                                value={
                                    status
                                }
                                onChange={(
                                    event
                                ) => {
                                    setStatus(
                                        event
                                            .target
                                            .value as TicketStatus
                                    );

                                    setPage(
                                        1
                                    );
                                }}
                                className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
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

                            {/* SEARCH */}

                            <div className="flex">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

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
                                        placeholder="TT No, query, assigned person..."
                                        className="h-9 w-full rounded-l-lg border border-r-0 border-border bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary sm:w-64"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        handleSearch
                                    }
                                    className="h-9 bg-slate-900 px-4 text-xs font-medium text-white hover:bg-slate-800"
                                >
                                    Search
                                </button>

                                {appliedSearch && (
                                    <button
                                        type="button"
                                        onClick={
                                            clearSearch
                                        }
                                        className="h-9 rounded-r-lg border border-l-0 border-border bg-background px-3 text-xs text-muted-foreground hover:bg-muted"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="border-b border-red-100 bg-red-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-red-700">
                            <AlertCircle className="h-4 w-4" />

                            {
                                error
                            }
                        </div>
                    </div>
                )}

                {/* TABLE */}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] border-collapse text-left">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <Th>
                                    SL
                                </Th>

                                <Th>
                                    TT No
                                </Th>

                                <Th>
                                    Query Type
                                </Th>

                                <Th>
                                    Description
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
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={
                                            8
                                        }
                                        className="h-48 text-center"
                                    >
                                        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />

                                            Loading TT history...
                                        </div>
                                    </td>
                                </tr>
                            ) : tickets.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            8
                                        }
                                        className="h-48 text-center"
                                    >
                                        <Ticket className="mx-auto h-8 w-8 text-muted-foreground/40" />

                                        <p className="mt-3 text-sm font-semibold text-foreground">
                                            No Trouble Tickets found
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            No tickets match the selected filters.
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
                                            key={
                                                item.id
                                            }
                                            className="border-b border-border/70 transition last:border-0 hover:bg-muted/30"
                                        >
                                            <Td>
                                                {(
                                                    page -
                                                    1
                                                ) *
                                                    pageSize +
                                                    index +
                                                    1}
                                            </Td>

                                            <Td>
                                                <span className="font-semibold text-foreground">
                                                    {
                                                        item.tt_no
                                                    }
                                                </span>
                                            </Td>

                                            <Td>
                                                {
                                                    item.query_type ||
                                                    "—"
                                                }
                                            </Td>

                                            <Td>
                                                <span className="block max-w-[260px] whitespace-normal">
                                                    {item.description ||
                                                        "—"}
                                                </span>
                                            </Td>

                                            <Td>
                                                {
                                                    item.department ||
                                                    "—"
                                                }
                                            </Td>

                                            <Td>
                                                <div>
                                                    <p className="text-xs text-foreground">
                                                        {item.assigned_name ||
                                                            "—"}
                                                    </p>

                                                    {item.assigned_id && (
                                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
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
                                                {formatDate(
                                                    item.created_at
                                                )}
                                            </Td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ==================================================
                    PAGINATION
                ================================================== */}

                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">
                        Page {page} of{" "}
                        {totalPages}
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={
                                page <= 1 ||
                                loading
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
                            className="h-8 rounded-lg border border-border px-3 text-[11px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={
                                page >=
                                totalPages ||
                                loading
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
                            className="h-8 rounded-lg border border-border px-3 text-[11px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
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

function SummaryCard({
    title,
    value,
    loading,
    icon,
}: {
    title: string;
    value: number;
    loading: boolean;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] text-muted-foreground">
                        {
                            title
                        }
                    </p>

                    {loading ? (
                        <Loader2 className="mt-2 h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                        <p className="mt-1 text-2xl font-bold text-foreground">
                            {value.toLocaleString()}
                        </p>
                    )}
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                    {
                        icon
                    }
                </div>
            </div>
        </div>
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
        ).toLowerCase();

    if (
        normalized ===
        "closed"
    ) {
        return (
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
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
            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                Running
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
            {status ||
                "Open"}
        </span>
    );
}

function Th({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {
                children
            }
        </th>
    );
}

function Td({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <td className="px-4 py-3 text-xs text-muted-foreground">
            {
                children
            }
        </td>
    );
}

function formatDate(
    value?: string
): string {
    if (!value) {
        return "—";
    }

    const normalized =
        value.includes(
            "T"
        )
            ? value
            : value.replace(
                " ",
                "T"
            );

    const date =
        new Date(
            normalized
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleString();
}