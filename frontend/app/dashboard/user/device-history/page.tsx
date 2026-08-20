

// frontend/app/dashboard/user/device-history/page.tsx
"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    AlertCircle,
    ArrowLeftRight,
    CheckCircle2,
    Clock3,
    History,
    Laptop,
    Loader2,
    Monitor,
    RefreshCw,
    RotateCcw,
    Search,
} from "lucide-react";

import {
    api,
    getUser,
    type ApiPage,
} from "@/lib/api";

/* ======================================================
   TYPES
====================================================== */

type UserDeviceHistoryItem = {
    id: number;
    asset_device_id: number | null;
    legacy_equipment_id: number | null;

    device_serial: string;

    category: string;
    brand: string;
    model: string;
    device_type: string;

    status_code: number;
    status_label: string;
    raw_status: string;

    previous_status: string;
    return_status: string;
    transfer_status: string;

    emp_id: string;
    emp_name: string;
    department: string;
    designation: string;

    mr_number: string;
    pr_number: string;
    vendor: string;

    assigned_date: string | null;
    transferred_at: string | null;
    returned_at: string | null;

    history_reason: string;

    created_at: string | null;
    updated_at: string | null;
};

type StatusFilter =
    | "all"
    | "assigned"
    | "transferred"
    | "returned";

/* ======================================================
   PAGE
====================================================== */

export default function DeviceHistoryPage() {
    const currentUser =
        getUser();

    const [
        items,
        setItems,
    ] =
        useState<
            UserDeviceHistoryItem[]
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
        useState<StatusFilter>(
            "all"
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");

    /* ==================================================
       LOAD USER-SCOPED DEVICE HISTORY

       IMPORTANT:
       employee_id is NOT passed from the browser.

       Backend must identify employee from JWT.
    ================================================== */

    const loadHistory =
        useCallback(
            async () => {
                try {
                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );

                    const params =
                        new URLSearchParams();

                    params.set(
                        "page",
                        String(
                            page
                        )
                    );

                    params.set(
                        "limit",
                        String(
                            pageSize
                        )
                    );

                    if (
                        status !==
                        "all"
                    ) {
                        params.set(
                            "status",
                            status
                        );
                    }

                    if (
                        appliedSearch
                    ) {
                        params.set(
                            "search",
                            appliedSearch
                        );
                    }

                    const response =
                        await api.get<
                            ApiPage<UserDeviceHistoryItem>
                        >(
                            `/user/device-history?${params.toString()}`
                        );

                    setItems(
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
                    setItems(
                        []
                    );

                    setTotal(
                        0
                    );

                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load device history."
                    );
                } finally {
                    setLoading(
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
        void loadHistory();
    }, [
        loadHistory,
    ]);

    /* ==================================================
       SEARCH
    ================================================== */

    function handleSearch() {
        setPage(
            1
        );

        setAppliedSearch(
            search.trim()
        );
    }

    /* ==================================================
       SUMMARY
    ================================================== */

    const assignedCount =
        items.filter(
            (
                item
            ) =>
                item.status_label
                    ?.toLowerCase() ===
                "assigned"
        ).length;

    const transferredCount =
        items.filter(
            (
                item
            ) =>
                item.status_label
                    ?.toLowerCase() ===
                "transferred"
        ).length;

    const returnedCount =
        items.filter(
            (
                item
            ) =>
                item.status_label
                    ?.toLowerCase() ===
                "returned"
        ).length;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                pageSize
            )
        );

    /* ==================================================
       RENDER
    ================================================== */

    return (
        <div className="min-w-0 space-y-5 p-4 sm:p-5 lg:p-6">
            {/* ==========================================
                PAGE HEADER
            ========================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <History className="h-6 w-6" />
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                My Devices
                            </p>

                            <h1 className="text-xl font-bold text-slate-900">
                                Device History
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                {currentUser
                                    ?.employee_id
                                    ? `Employee ${currentUser.employee_id}`
                                    : "Your assigned device history"}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void loadHistory()
                        }
                        disabled={
                            loading
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading
                                ? "animate-spin"
                                : ""
                                }`}
                        />

                        Refresh
                    </button>
                </div>
            </section>

            {/* ==========================================
                SUMMARY
            ========================================== */}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="History Records"
                    value={
                        total
                    }
                    icon={
                        <History className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    title="Assigned"
                    value={
                        assignedCount
                    }
                    icon={
                        <Laptop className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    title="Transferred"
                    value={
                        transferredCount
                    }
                    icon={
                        <ArrowLeftRight className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    title="Returned"
                    value={
                        returnedCount
                    }
                    icon={
                        <RotateCcw className="h-5 w-5" />
                    }
                />
            </section>

            {/* ==========================================
                HISTORY TABLE
            ========================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* TOOLBAR */}

                <div className="border-b border-slate-200 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                Device Activity History
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-500">
                                {total.toLocaleString()}{" "}
                                history record
                                {total ===
                                    1
                                    ? ""
                                    : "s"}
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
                                            .value as StatusFilter
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

                                <option value="assigned">
                                    Assigned
                                </option>

                                <option value="transferred">
                                    Transferred
                                </option>

                                <option value="returned">
                                    Returned
                                </option>
                            </select>

                            {/* SEARCH */}

                            <div className="flex">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                    <input
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
                                        placeholder="Serial, category, brand..."
                                        className="h-9 w-full rounded-l-lg border border-r-0 border-slate-200 pl-9 pr-3 text-sm outline-none sm:w-64"
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

                {/* ERROR */}

                {error && (
                    <div className="border-b border-red-100 bg-red-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4" />

                            {error}
                        </div>
                    </div>
                )}

                {/* TABLE */}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <Th>
                                    Device
                                </Th>

                                <Th>
                                    Category
                                </Th>

                                <Th>
                                    Brand / Model
                                </Th>

                                <Th>
                                    Status
                                </Th>

                                <Th>
                                    Assigned
                                </Th>

                                <Th>
                                    Transferred
                                </Th>

                                <Th>
                                    Returned
                                </Th>

                                <Th>
                                    Reason
                                </Th>

                                <Th>
                                    MR / PR
                                </Th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={
                                            9
                                        }
                                        className="h-48 text-center"
                                    >
                                        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                                            <Loader2 className="h-5 w-5 animate-spin" />

                                            Loading device history...
                                        </div>
                                    </td>
                                </tr>
                            ) : items.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            9
                                        }
                                        className="h-48 text-center"
                                    >
                                        <Monitor className="mx-auto h-8 w-8 text-slate-300" />

                                        <p className="mt-3 text-sm font-semibold text-slate-700">
                                            No device history found
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Device assignment history will appear here.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                items.map(
                                    (
                                        item
                                    ) => (
                                        <tr
                                            key={
                                                item.id
                                            }
                                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                        >
                                            <Td>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {item.device_serial ||
                                                            "—"}
                                                    </p>

                                                    {item.device_type && (
                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {
                                                                item.device_type
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </Td>

                                            <Td>
                                                {item.category ||
                                                    "—"}
                                            </Td>

                                            <Td>
                                                <div>
                                                    <p>
                                                        {item.brand ||
                                                            "—"}
                                                    </p>

                                                    {item.model && (
                                                        <p className="text-xs text-slate-400">
                                                            {
                                                                item.model
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </Td>

                                            <Td>
                                                <StatusBadge
                                                    value={
                                                        item.status_label
                                                    }
                                                />
                                            </Td>

                                            <Td>
                                                {formatDate(
                                                    item.assigned_date
                                                )}
                                            </Td>

                                            <Td>
                                                {formatDate(
                                                    item.transferred_at
                                                )}
                                            </Td>

                                            <Td>
                                                {formatDate(
                                                    item.returned_at
                                                )}
                                            </Td>

                                            <Td>
                                                {item.history_reason ||
                                                    "—"}
                                            </Td>

                                            <Td>
                                                <div className="space-y-0.5">
                                                    <p>
                                                        MR:{" "}
                                                        {item.mr_number ||
                                                            "—"}
                                                    </p>

                                                    <p className="text-xs text-slate-400">
                                                        PR:{" "}
                                                        {item.pr_number ||
                                                            "—"}
                                                    </p>
                                                </div>
                                            </Td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}

                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                    <p className="text-xs text-slate-500">
                        Page {page} of{" "}
                        {totalPages}
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={
                                page <=
                                1 ||
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
                            className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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

/* ======================================================
   COMPONENTS
====================================================== */

function SummaryCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {Number(
                            value
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

function Th({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
    value,
}: {
    value?: string;
}) {
    const normalized =
        (
            value ?? ""
        ).toLowerCase();

    if (
        normalized ===
        "assigned"
    ) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <CheckCircle2 className="h-3 w-3" />

                Assigned
            </span>
        );
    }

    if (
        normalized ===
        "transferred"
    ) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <ArrowLeftRight className="h-3 w-3" />

                Transferred
            </span>
        );
    }

    if (
        normalized ===
        "returned"
    ) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <RotateCcw className="h-3 w-3" />

                Returned
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            <Clock3 className="h-3 w-3" />

            {value ||
                "Unknown"}
        </span>
    );
}

function formatDate(
    value?: string | null
): string {
    if (!value) {
        return "—";
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
        return value;
    }

    return date.toLocaleString();
}