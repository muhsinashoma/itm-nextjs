// frontend/app/dashboard/user/page.tsx
"use client";

import {
    useCallback,
    useEffect,
    useState,
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
} from "lucide-react";

import {
    ownDashboardApi,
    type OwnDashboardData,
    type OwnTroubleTicketItem,
} from "@/lib/api";

export default function UserDashboardPage() {
    const [
        dashboard,
        setDashboard,
    ] = useState<OwnDashboardData | null>(
        null
    );

    const [
        tickets,
        setTickets,
    ] = useState<
        OwnTroubleTicketItem[]
    >([]);

    const [
        total,
        setTotal,
    ] = useState(0);

    const [
        page,
        setPage,
    ] = useState(1);

    const [
        pageSize,
    ] = useState(20);

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        appliedSearch,
        setAppliedSearch,
    ] = useState("");

    const [
        status,
        setStatus,
    ] = useState<
        | "all"
        | "open"
        | "running"
        | "closed"
    >("all");

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        ticketsLoading,
        setTicketsLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const loadDashboard =
        useCallback(
            async () => {
                try {
                    setLoading(true);
                    setError("");

                    const response =
                        await ownDashboardApi.dashboard();

                    setDashboard(
                        response.data
                    );
                } catch (reason) {
                    setDashboard(
                        null
                    );

                    setError(
                        reason instanceof Error
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
                } catch (reason) {
                    setTickets([]);

                    setTotal(0);

                    setError(
                        reason instanceof Error
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
                pageSize,
                status,
                appliedSearch,
            ]
        );

    useEffect(() => {
        void loadDashboard();
    }, [
        loadDashboard,
    ]);

    useEffect(() => {
        void loadTickets();
    }, [
        loadTickets,
    ]);

    const handleSearch =
        () => {
            setPage(1);

            setAppliedSearch(
                search.trim()
            );
        };

    const handleRefresh =
        () => {
            void loadDashboard();
            void loadTickets();
        };

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                pageSize
            )
        );

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />

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
            <div className="p-6">
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

                        <div>
                            <h2 className="font-semibold text-red-800">
                                Unable to load dashboard
                            </h2>

                            <p className="mt-1 text-sm text-red-700">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={
                                    handleRefresh
                                }
                                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800"
                            >
                                <RefreshCw className="h-4 w-4" />

                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    const {
        employee,
        tickets: summary,
    } = dashboard;

    return (
        <div className="min-w-0 space-y-5 p-4 sm:p-5 lg:p-6">
            {/* HEADER */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                            <UserRound className="h-7 w-7" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Employee Dashboard
                            </p>

                            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                                Welcome,{" "}
                                {employee.employee_name ||
                                    employee.employee_id}
                            </h1>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                                {employee.designation && (
                                    <span>
                                        {
                                            employee.designation
                                        }
                                    </span>
                                )}

                                {employee.designation &&
                                    employee.department && (
                                        <span>
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

                    <button
                        type="button"
                        onClick={
                            handleRefresh
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        <RefreshCw className="h-4 w-4" />

                        Refresh
                    </button>
                </div>
            </section>

            {/* EMPLOYEE INFORMATION */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Employee Information
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                        Your official employee profile
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <InfoItem
                        icon={
                            <BadgeCheck className="h-4 w-4" />
                        }
                        label="Employee ID"
                        value={
                            employee.employee_id
                        }
                    />

                    <InfoItem
                        icon={
                            <UserRound className="h-4 w-4" />
                        }
                        label="Designation"
                        value={
                            employee.designation
                        }
                    />

                    <InfoItem
                        icon={
                            <Building2 className="h-4 w-4" />
                        }
                        label="Department"
                        value={
                            employee.department
                        }
                    />

                    <InfoItem
                        icon={
                            <Phone className="h-4 w-4" />
                        }
                        label="Official Mobile"
                        value={
                            employee.official_cell
                        }
                    />

                    <InfoItem
                        icon={
                            <Mail className="h-4 w-4" />
                        }
                        label="Official Email"
                        value={
                            employee.official_email
                        }
                    />

                    <InfoItem
                        icon={
                            <Building2 className="h-4 w-4" />
                        }
                        label="Work Field"
                        value={
                            employee.work_field
                        }
                    />
                </div>
            </section>

            {/* TT SUMMARY */}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Total Tickets"
                    value={
                        summary.total
                    }
                    icon={
                        <Ticket className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    label="Open"
                    value={
                        summary.open
                    }
                    icon={
                        <AlertCircle className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    label="Running"
                    value={
                        summary.running
                    }
                    icon={
                        <Clock3 className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    label="Closed"
                    value={
                        summary.closed
                    }
                    icon={
                        <CheckCircle2 className="h-5 w-5" />
                    }
                />
            </section>

            {/* MY TROUBLE TICKETS */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                My Trouble Tickets
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-500">
                                {total.toLocaleString()}{" "}
                                ticket
                                {total === 1
                                    ? ""
                                    : "s"}{" "}
                                found
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
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
                                            .value as
                                        | "all"
                                        | "open"
                                        | "running"
                                        | "closed"
                                    );

                                    setPage(
                                        1
                                    );
                                }}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
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

                            <div className="flex">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

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
                                        placeholder="Search tickets..."
                                        className="h-9 w-full rounded-l-lg border border-r-0 border-slate-200 bg-white pl-9 pr-3 text-sm outline-none sm:w-56"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        handleSearch
                                    }
                                    className="h-9 rounded-r-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <Th>
                                    TT No
                                </Th>

                                <Th>
                                    Query Type
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
                                            6
                                        }
                                        className="h-40 text-center"
                                    >
                                        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
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
                                            6
                                        }
                                        className="h-40 text-center"
                                    >
                                        <Ticket className="mx-auto h-7 w-7 text-slate-300" />

                                        <p className="mt-2 text-sm font-medium text-slate-700">
                                            No Trouble Tickets found
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Your ticket list will appear here.
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
                                            key={`${item.tt_no}-${index}`}
                                            className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                                        >
                                            <Td>
                                                <span className="font-semibold text-slate-900">
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
                                                {
                                                    item.department ||
                                                    "—"
                                                }
                                            </Td>

                                            <Td>
                                                {
                                                    item.assigned_name ||
                                                    item.assigned_id ||
                                                    "—"
                                                }
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

                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                        Page {page} of{" "}
                        {totalPages}
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={
                                page <= 1 ||
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
                            className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                            className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {Number(
                            value ?? 0
                        ).toLocaleString()}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function InfoItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value?: string | null;
}) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
                {icon}

                {label}
            </div>

            <p className="mt-1.5 truncate text-sm font-medium text-slate-900">
                {value?.trim() ||
                    "Not available"}
            </p>
        </div>
    );
}

function Th({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {children}
        </th>
    );
}

function Td({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <td className="px-4 py-3 text-sm text-slate-600">
            {children}
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
            status ?? ""
        ).toLowerCase();

    if (
        normalized ===
        "closed"
    ) {
        return (
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
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
            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Running
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {status || "Open"}
        </span>
    );
}

function formatDate(
    value?: string
) {
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

    return date.toLocaleString();
}