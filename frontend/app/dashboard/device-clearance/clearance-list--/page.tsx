//fronted/app/dashboard/device-clearance/clearance-list/page.tsx
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CheckCircle2,
    ChevronRight,
    Clock3,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    UserRound,
    XCircle,
} from "lucide-react";

import {
    useRouter,
} from "next/navigation";

import {
    Button,
} from "@/components/ui/button";

import {
    Input,
} from "@/components/ui/input";

import {
    api,
    type ApiOk,
} from "@/lib/api";

type ClearanceStatus =
    | "Pending Clearance"
    | "In Process"
    | "Completed"
    | "Cancelled"
    | string;

type ClearanceListItem = {
    id: number;

    reference_no: string;

    employee_id: string;

    employee_name: string;

    designation: string;

    department: string;

    assigned_to: string;

    assigned_to_name: string;

    resignation_date: string;

    status: ClearanceStatus;

    created_at: string;

    completed_at: string;
};

type StatusFilter =
    | "all"
    | "Pending Clearance"
    | "In Process"
    | "Completed"
    | "Cancelled";

function readApiData<T>(
    response: unknown
): T | undefined {
    if (
        response &&
        typeof response === "object" &&
        "data" in response
    ) {
        const first =
            (
                response as {
                    data?: unknown;
                }
            ).data;

        if (
            first &&
            typeof first === "object" &&
            "data" in first
        ) {
            return (
                first as {
                    data?: T;
                }
            ).data;
        }

        return first as T;
    }

    return response as T;
}

function text(
    value:
        | string
        | null
        | undefined
): string {
    return String(
        value ?? ""
    ).trim();
}

function formatDate(
    value:
        | string
        | null
        | undefined
): string {
    const raw =
        text(
            value
        );

    if (!raw) {
        return "—";
    }

    const date =
        new Date(
            raw
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return raw;
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",
        }
    );
}

function getInitials(
    name: string
): string {
    const parts =
        name
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );

    if (!parts.length) {
        return "?";
    }

    if (
        parts.length ===
        1
    ) {
        return (
            parts[0]
                ?.charAt(
                    0
                )
                .toUpperCase() ??
            "?"
        );
    }

    return (
        `${parts[0]?.charAt(0) ?? ""}${parts[
            parts.length - 1
        ]?.charAt(0) ?? ""}`
    ).toUpperCase();
}

function statusStyle(
    status: string
): string {
    const value =
        status
            .trim()
            .toLowerCase();

    if (
        value ===
        "completed"
    ) {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (
        value ===
        "in process"
    ) {
        return "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (
        value ===
        "cancelled"
    ) {
        return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
}

function statusIcon(
    status: string
) {
    const value =
        status
            .trim()
            .toLowerCase();

    if (
        value ===
        "completed"
    ) {
        return (
            <CheckCircle2 className="h-3.5 w-3.5" />
        );
    }

    if (
        value ===
        "cancelled"
    ) {
        return (
            <XCircle className="h-3.5 w-3.5" />
        );
    }

    return (
        <Clock3 className="h-3.5 w-3.5" />
    );
}

export default function ClearanceListPage() {
    const router =
        useRouter();

    const [
        items,
        setItems,
    ] =
        useState<
            ClearanceListItem[]
        >([]);

    const [
        loading,
        setLoading,
    ] =
        useState(
            true
        );

    const [
        error,
        setError,
    ] =
        useState(
            ""
        );

    const [
        searchInput,
        setSearchInput,
    ] =
        useState(
            ""
        );

    const [
        search,
        setSearch,
    ] =
        useState(
            ""
        );

    const [
        status,
        setStatus,
    ] =
        useState<StatusFilter>(
            "all"
        );

    const loadClearances =
        useCallback(
            async () => {
                try {
                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );

                    const query =
                        new URLSearchParams();

                    if (
                        status !==
                        "all"
                    ) {
                        query.set(
                            "status",
                            status
                        );
                    }

                    if (
                        search.trim()
                    ) {
                        query.set(
                            "search",
                            search.trim()
                        );
                    }

                    const suffix =
                        query.toString();

                    const response =
                        await api.get<
                            ApiOk<
                                ClearanceListItem[]
                            >
                        >(
                            `/device-clearances${suffix
                                ? `?${suffix}`
                                : ""
                            }`
                        );

                    const data =
                        readApiData<
                            ClearanceListItem[]
                        >(
                            response
                        ) ?? [];

                    setItems(
                        Array.isArray(
                            data
                        )
                            ? data
                            : []
                    );
                } catch (
                reason
                ) {
                    setItems(
                        []
                    );

                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load clearance list."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                search,
                status,
            ]
        );

    useEffect(
        () => {
            void loadClearances();
        },
        [
            loadClearances,
        ]
    );

    useEffect(
        () => {
            const timer =
                window.setTimeout(
                    () => {
                        setSearch(
                            searchInput
                                .trim()
                        );
                    },
                    350
                );

            return () =>
                window.clearTimeout(
                    timer
                );
        },
        [
            searchInput,
        ]
    );

    const counts =
        useMemo(
            () => {
                const result = {
                    total:
                        items.length,

                    pending:
                        0,

                    progress:
                        0,

                    completed:
                        0,

                    cancelled:
                        0,
                };

                for (
                    const item of
                    items
                ) {
                    const itemStatus =
                        text(
                            item.status
                        ).toLowerCase();

                    if (
                        itemStatus ===
                        "pending clearance"
                    ) {
                        result.pending++;
                    } else if (
                        itemStatus ===
                        "in process"
                    ) {
                        result.progress++;
                    } else if (
                        itemStatus ===
                        "completed"
                    ) {
                        result.completed++;
                    } else if (
                        itemStatus ===
                        "cancelled"
                    ) {
                        result.cancelled++;
                    }
                }

                return result;
            },
            [
                items,
            ]
        );

    return (
        <div className="w-full p-4 sm:p-6">
            <div className="mx-auto w-full max-w-[1600px] space-y-5">
                {/* HEADER */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">
                            Clearance List
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            View and manage employee IT exit clearance requests.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/dashboard/device-clearance/clearance-form"
                            )
                        }
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Clearance
                    </Button>
                </div>

                {/* SUMMARY */}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label="Loaded Records"
                        value={
                            counts.total
                        }
                        description="Current filtered result"
                    />

                    <SummaryCard
                        label="Pending"
                        value={
                            counts.pending
                        }
                        description="Waiting for IT action"
                    />

                    <SummaryCard
                        label="In Process"
                        value={
                            counts.progress
                        }
                        description="Clearance work started"
                    />

                    <SummaryCard
                        label="Completed"
                        value={
                            counts.completed
                        }
                        description="Exit clearance completed"
                    />
                </div>

                {/* FILTERS */}

                <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search
                                className="
                                    pointer-events-none
                                    absolute
                                    left-3
                                    top-1/2
                                    h-4
                                    w-4
                                    -translate-y-1/2
                                    text-muted-foreground
                                "
                            />

                            <Input
                                value={
                                    searchInput
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearchInput(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Search employee name, employee ID or clearance reference..."
                                className="h-10 pl-9"
                            />
                        </div>

                        <select
                            value={
                                status
                            }
                            onChange={(
                                event
                            ) =>
                                setStatus(
                                    event
                                        .target
                                        .value as
                                    StatusFilter
                                )
                            }
                            className="
                                h-10
                                min-w-[190px]
                                rounded-md
                                border
                                border-input
                                bg-background
                                px-3
                                text-sm
                                outline-none
                                focus:border-primary
                                focus:ring-2
                                focus:ring-primary/20
                            "
                        >
                            <option value="all">
                                All Status
                            </option>

                            <option value="Pending Clearance">
                                Pending Clearance
                            </option>

                            <option value="In Process">
                                In Process
                            </option>

                            <option value="Completed">
                                Completed
                            </option>

                            <option value="Cancelled">
                                Cancelled
                            </option>
                        </select>

                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                loading
                            }
                            onClick={() =>
                                void loadClearances()
                            }
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${loading
                                    ? "animate-spin"
                                    : ""
                                    }`}
                            />
                            Refresh
                        </Button>
                    </div>
                </section>

                {/* ERROR */}

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* LIST */}

                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    Clearance Requests
                                </h2>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Click a record to open its clearance details and checklist.
                                </p>
                            </div>

                            {!loading && (
                                <span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                                    {items.length} records
                                </span>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-[280px] items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            Loading clearance records...
                        </div>
                    ) : items.length ===
                        0 ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
                            <UserRound className="h-9 w-9 text-muted-foreground/40" />

                            <p className="mt-3 text-sm font-semibold text-foreground">
                                No clearance records found
                            </p>

                            <p className="mt-1 max-w-md text-xs text-muted-foreground">
                                Change the filters or create a new employee clearance request.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] border-collapse">
                                <thead className="bg-muted/35">
                                    <tr className="border-b border-border">
                                        <TableHead>
                                            Reference
                                        </TableHead>

                                        <TableHead>
                                            Employee
                                        </TableHead>

                                        <TableHead>
                                            Department
                                        </TableHead>

                                        <TableHead>
                                            Last Working Date
                                        </TableHead>

                                        <TableHead>
                                            Assigned IT
                                        </TableHead>

                                        <TableHead>
                                            Status
                                        </TableHead>

                                        <TableHead>
                                            Created
                                        </TableHead>

                                        <TableHead className="w-[80px] text-right">
                                            Action
                                        </TableHead>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border">
                                    {items.map(
                                        (
                                            item
                                        ) => (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                                className="cursor-pointer transition-colors hover:bg-muted/25"
                                                onClick={() =>
                                                    router.push(
                                                        `/dashboard/device-clearance/approval/${item.id}`
                                                    )
                                                }
                                            >
                                                <TableCell>
                                                    <div className="font-mono text-xs font-semibold text-primary">
                                                        {item.reference_no ||
                                                            `#${item.id}`}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="
                                                                flex
                                                                h-9
                                                                w-9
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                border
                                                                border-primary/15
                                                                bg-primary/10
                                                                text-[11px]
                                                                font-bold
                                                                text-primary
                                                            "
                                                        >
                                                            {getInitials(
                                                                item.employee_name
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="max-w-[240px] truncate text-sm font-semibold text-foreground">
                                                                {item.employee_name ||
                                                                    "Unknown Employee"}
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                                {item.employee_id ||
                                                                    "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <p className="max-w-[220px] truncate text-sm text-foreground">
                                                        {item.department ||
                                                            "—"}
                                                    </p>

                                                    {item.designation && (
                                                        <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">
                                                            {item.designation}
                                                        </p>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <span className="text-sm text-foreground">
                                                        {formatDate(
                                                            item.resignation_date
                                                        )}
                                                    </span>
                                                </TableCell>

                                                <TableCell>
                                                    <p className="max-w-[220px] truncate text-sm font-medium text-foreground">
                                                        {item.assigned_to_name ||
                                                            "—"}
                                                    </p>

                                                    {item.assigned_to && (
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {item.assigned_to}
                                                        </p>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <span
                                                        className={`
                                                            inline-flex
                                                            items-center
                                                            gap-1.5
                                                            rounded-full
                                                            border
                                                            px-2.5
                                                            py-1
                                                            text-[11px]
                                                            font-semibold
                                                            ${statusStyle(
                                                            item.status
                                                        )}
                                                        `}
                                                    >
                                                        {statusIcon(
                                                            item.status
                                                        )}

                                                        {item.status ||
                                                            "Pending Clearance"}
                                                    </span>
                                                </TableCell>

                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(
                                                            item.created_at
                                                        )}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        aria-label="Open clearance"
                                                        onClick={(
                                                            event
                                                        ) => {
                                                            event.stopPropagation();

                                                            router.push(
                                                                `/dashboard/device-clearance/approval/${item.id}`
                                                            );
                                                        }}
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    description,
}: {
    label: string;
    value: number;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {value}
            </p>

            <p className="mt-1 text-[11px] text-muted-foreground">
                {description}
            </p>
        </div>
    );
}

function TableHead({
    children,
    className = "",
}: {
    children:
    React.ReactNode;
    className?: string;
}) {
    return (
        <th
            className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${className}`}
        >
            {children}
        </th>
    );
}

function TableCell({
    children,
    className = "",
}: {
    children:
    React.ReactNode;
    className?: string;
}) {
    return (
        <td
            className={`px-4 py-3 align-middle ${className}`}
        >
            {children}
        </td>
    );
}
