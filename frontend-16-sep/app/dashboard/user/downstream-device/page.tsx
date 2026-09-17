
// frontend/app/dashboard/user/downstream-device/page.tsx

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import Link from "next/link";

import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    ArrowLeftRight,
    Laptop,
    Loader2,
    MonitorSmartphone,
    RefreshCw,
    Search,
    Users,
} from "lucide-react";

import {
    downstreamApi,
    downstreamDevicesApi,
    type DownstreamDeviceItem,
    type DownstreamDeviceScope,
} from "@/lib/api";

const PAGE_SIZE = 20;

const EMPTY_DEVICE_SUMMARY = {
    assigned_devices: 0,
    direct_devices: 0,
    indirect_devices: 0,
};

type DeviceSummary = typeof EMPTY_DEVICE_SUMMARY;

export default function DownstreamDevicePage() {
    const router =
        useRouter();

    const pathname =
        usePathname();

    const searchParams =
        useSearchParams();

    /* ======================================================
       URL STATE
    ====================================================== */

    const scope =
        useMemo<
            DownstreamDeviceScope
        >(
            () => {
                const value =
                    searchParams.get(
                        "scope"
                    );

                if (
                    value ===
                    "direct" ||
                    value ===
                    "indirect"
                ) {
                    return value;
                }

                return "all";
            },
            [
                searchParams,
            ]
        );

    const page =
        useMemo(
            () => {
                const value =
                    Number(
                        searchParams.get(
                            "page"
                        ) ??
                        "1"
                    );

                if (
                    !Number.isInteger(
                        value
                    ) ||
                    value < 1
                ) {
                    return 1;
                }

                return value;
            },
            [
                searchParams,
            ]
        );

    const appliedSearch =
        useMemo(
            () =>
                searchParams
                    .get(
                        "search"
                    )
                    ?.trim() ??
                "",
            [
                searchParams,
            ]
        );

    /* ======================================================
       LOCAL STATE
    ====================================================== */

    const [
        devices,
        setDevices,
    ] =
        useState<
            DownstreamDeviceItem[]
        >([]);

    const [
        total,
        setTotal,
    ] =
        useState(0);

    const [
        search,
        setSearch,
    ] =
        useState(
            appliedSearch
        );

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

    const [
        summary,
        setSummary,
    ] =
        useState<DeviceSummary>(
            EMPTY_DEVICE_SUMMARY
        );

    useEffect(
        () => {
            setSearch(
                appliedSearch
            );
        },
        [
            appliedSearch,
        ]
    );

    /* ======================================================
       LOAD DOWNSTREAM DEVICES
    ====================================================== */

    const loadDevices =
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
                        await downstreamDevicesApi.list(
                            {
                                page,
                                limit:
                                    PAGE_SIZE,
                                scope,
                                search:
                                    appliedSearch ||
                                    undefined,
                            }
                        );

                    setDevices(
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
                    setDevices(
                        []
                    );

                    setTotal(
                        0
                    );

                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load downstream devices."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                page,
                scope,
                appliedSearch,
            ]
        );

    /* ======================================================
       LOAD FULL DOWNSTREAM SUMMARY
    ====================================================== */

    const loadSummary =
        useCallback(
            async () => {
                try {
                    setSummaryLoading(
                        true
                    );

                    const response =
                        await downstreamApi.summary();

                    const devicesSummary =
                        response.data
                            .devices;

                    setSummary(
                        {
                            assigned_devices:
                                Number(
                                    devicesSummary
                                        .assigned_devices ??
                                    0
                                ),

                            direct_devices:
                                Number(
                                    devicesSummary
                                        .direct_devices ??
                                    0
                                ),

                            indirect_devices:
                                Number(
                                    devicesSummary
                                        .indirect_devices ??
                                    0
                                ),
                        }
                    );
                } catch (
                reason
                ) {
                    console.error(
                        "Failed to load downstream summary:",
                        reason
                    );

                    setSummary(
                        EMPTY_DEVICE_SUMMARY
                    );
                } finally {
                    setSummaryLoading(
                        false
                    );
                }
            },
            []
        );

    useEffect(
        () => {
            void loadDevices();
        },
        [
            loadDevices,
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

    /* ======================================================
       URL HELPERS
    ====================================================== */

    function buildUrl({
        nextScope = scope,
        nextPage = page,
        nextSearch =
        appliedSearch,
    }: {
        nextScope?: DownstreamDeviceScope;
        nextPage?: number;
        nextSearch?: string;
    }) {
        const params =
            new URLSearchParams();

        params.set(
            "scope",
            nextScope
        );

        params.set(
            "page",
            String(
                Math.max(
                    1,
                    nextPage
                )
            )
        );

        const normalizedSearch =
            nextSearch.trim();

        if (
            normalizedSearch
        ) {
            params.set(
                "search",
                normalizedSearch
            );
        }

        return `${pathname}?${params.toString()}`;
    }

    function handleSearch() {
        router.push(
            buildUrl(
                {
                    nextPage:
                        1,
                    nextSearch:
                        search,
                }
            )
        );
    }

    function clearSearch() {
        setSearch(
            ""
        );

        router.push(
            buildUrl(
                {
                    nextPage:
                        1,
                    nextSearch:
                        "",
                }
            )
        );
    }

    function goToPage(
        nextPage: number
    ) {
        router.push(
            buildUrl(
                {
                    nextPage,
                }
            )
        );
    }

    async function handleRefresh() {
        await Promise.all(
            [
                loadDevices(),
                loadSummary(),
            ]
        );
    }

    /* ======================================================
       DERIVED VALUES
    ====================================================== */

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                PAGE_SIZE
            )
        );

    const tableTitle =
        scope ===
            "direct"
            ? "Direct Downstream Devices"
            : scope ===
                "indirect"
                ? "Indirect Downstream Devices"
                : "All Downstream Devices";

    return (
        <div className="min-w-0 space-y-4 p-1">
            {/* ==================================================
                HEADER
            ================================================== */}

            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <MonitorSmartphone className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Downstream
                                Assets
                            </p>

                            <h1 className="text-xl font-bold text-foreground">
                                Downstream
                                Devices
                            </h1>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Assigned
                                devices
                                under your
                                reporting
                                hierarchy
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void handleRefresh()
                        }
                        disabled={
                            loading ||
                            summaryLoading
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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
                SUMMARY / CLICKABLE FILTER CARDS
            ================================================== */}

            <section className="grid gap-3 sm:grid-cols-3">
                <SummaryCard
                    title="Assigned Devices"
                    value={
                        summary.assigned_devices
                    }
                    href={buildUrl(
                        {
                            nextScope:
                                "all",
                            nextPage:
                                1,
                        }
                    )}
                    active={
                        scope ===
                        "all"
                    }
                    loading={
                        summaryLoading
                    }
                    icon={
                        <Laptop className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    title="Direct Devices"
                    value={
                        summary.direct_devices
                    }
                    href={buildUrl(
                        {
                            nextScope:
                                "direct",
                            nextPage:
                                1,
                        }
                    )}
                    active={
                        scope ===
                        "direct"
                    }
                    loading={
                        summaryLoading
                    }
                    icon={
                        <Users className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    title="Indirect Devices"
                    value={
                        summary.indirect_devices
                    }
                    href={buildUrl(
                        {
                            nextScope:
                                "indirect",
                            nextPage:
                                1,
                        }
                    )}
                    active={
                        scope ===
                        "indirect"
                    }
                    loading={
                        summaryLoading
                    }
                    icon={
                        <ArrowLeftRight className="h-5 w-5" />
                    }
                />
            </section>

            {/* ==================================================
                TABLE
            ================================================== */}

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {/* TOOLBAR */}

                <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">
                            {
                                tableTitle
                            }
                        </h2>

                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {total.toLocaleString()}{" "}
                            device
                            {total ===
                                1
                                ? ""
                                : "s"}{" "}
                            found
                        </p>
                    </div>

                    <div className="flex w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-72">
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
                                placeholder="Employee, serial, category, brand..."
                                className="h-9 w-full rounded-l-lg border border-r-0 border-border bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary"
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

                {/* ERROR */}

                {error && (
                    <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                        {
                            error
                        }
                    </div>
                )}

                {/* TABLE */}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1450px] border-collapse text-left">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <Th>
                                    SL
                                </Th>

                                <Th>
                                    Employee
                                </Th>

                                <Th>
                                    Relationship
                                </Th>

                                <Th>
                                    Device
                                    Serial
                                </Th>

                                <Th>
                                    Category
                                </Th>

                                <Th>
                                    Brand
                                    /
                                    Model
                                </Th>

                                <Th>
                                    Department
                                </Th>

                                <Th>
                                    PR
                                    Number
                                </Th>

                                <Th>
                                    Assigned
                                    Date
                                </Th>

                                <Th>
                                    Warranty
                                </Th>

                                <Th>
                                    Status
                                </Th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={
                                            11
                                        }
                                        className="h-52 text-center"
                                    >
                                        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />

                                            Loading
                                            downstream
                                            devices...
                                        </div>
                                    </td>
                                </tr>
                            ) : devices.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            11
                                        }
                                        className="h-52 text-center"
                                    >
                                        <MonitorSmartphone className="mx-auto h-8 w-8 text-muted-foreground/40" />

                                        <p className="mt-3 text-sm font-semibold text-foreground">
                                            No
                                            downstream
                                            devices
                                            found
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            No
                                            device
                                            matches
                                            the
                                            selected
                                            scope
                                            or
                                            search.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                devices.map(
                                    (
                                        device,
                                        index
                                    ) => (
                                        <tr
                                            key={
                                                device.id
                                            }
                                            className="border-b border-border/70 transition last:border-0 hover:bg-muted/30"
                                        >
                                            <Td>
                                                {(page -
                                                    1) *
                                                    PAGE_SIZE +
                                                    index +
                                                    1}
                                            </Td>

                                            <Td>
                                                <div className="min-w-[180px]">
                                                    <p className="font-semibold text-foreground">
                                                        {device.employee_name ||
                                                            "—"}
                                                    </p>

                                                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                        {device.employee_id ||
                                                            "—"}
                                                    </p>

                                                    {device.designation && (
                                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                            {
                                                                device.designation
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </Td>

                                            <Td>
                                                <RelationshipBadge
                                                    relationship={
                                                        device.relationship
                                                    }
                                                    tier={
                                                        device.tier_level
                                                    }
                                                />
                                            </Td>

                                            <Td>
                                                <span className="font-semibold text-foreground">
                                                    {device.device_serial ||
                                                        "—"}
                                                </span>
                                            </Td>

                                            <Td>
                                                {device.category ||
                                                    "—"}
                                            </Td>

                                            <Td>
                                                <div className="min-w-[180px]">
                                                    <p className="text-foreground">
                                                        {device.brand ||
                                                            "—"}
                                                    </p>

                                                    {device.model && (
                                                        <p className="mt-0.5 max-w-[230px] whitespace-normal text-[10px] text-muted-foreground">
                                                            {
                                                                device.model
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </Td>

                                            <Td>
                                                <span className="block max-w-[190px] whitespace-normal">
                                                    {device.department ||
                                                        "—"}
                                                </span>
                                            </Td>

                                            <Td>
                                                <span className="block max-w-[180px] break-all text-[10px]">
                                                    {device.pr_number ||
                                                        "—"}
                                                </span>
                                            </Td>

                                            <Td>
                                                {formatDate(
                                                    device.assigned_date
                                                )}
                                            </Td>

                                            <Td>
                                                {formatDate(
                                                    device.warranty_date,
                                                    true
                                                )}
                                            </Td>

                                            <Td>
                                                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                                    {device.status ||
                                                        "Assigned"}
                                                </span>
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

                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[11px] text-muted-foreground">
                        Showing{" "}
                        {total ===
                            0
                            ? 0
                            : (page -
                                1) *
                            PAGE_SIZE +
                            1}
                        {" - "}
                        {Math.min(
                            page *
                            PAGE_SIZE,
                            total
                        )}{" "}
                        of{" "}
                        {total.toLocaleString()}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground">
                            Page{" "}
                            {
                                page
                            }{" "}
                            of{" "}
                            {
                                totalPages
                            }
                        </span>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={
                                    page <=
                                    1 ||
                                    loading
                                }
                                onClick={() =>
                                    goToPage(
                                        Math.max(
                                            1,
                                            page -
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
                                    goToPage(
                                        Math.min(
                                            totalPages,
                                            page +
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
                </div>
            </section>
        </div>
    );
}

/* ======================================================
   SMALL COMPONENTS
====================================================== */

function SummaryCard({
    title,
    value,
    icon,
    href,
    active,
    loading,
}: {
    title: string;
    value: number;
    icon: ReactNode;
    href: string;
    active: boolean;
    loading: boolean;
}) {
    return (
        <Link
            href={
                href
            }
            aria-current={
                active
                    ? "page"
                    : undefined
            }
            className={`block rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${active
                ? "border-primary ring-1 ring-primary/20"
                : "border-border"
                }`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] text-muted-foreground">
                        {
                            title
                        }
                    </p>

                    <p className="mt-1 text-2xl font-bold text-foreground">
                        {loading
                            ? "—"
                            : value.toLocaleString()}
                    </p>
                </div>

                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-foreground"
                        }`}
                >
                    {
                        icon
                    }
                </div>
            </div>
        </Link>
    );
}

function RelationshipBadge({
    relationship,
    tier,
}: {
    relationship?: string;
    tier?: number;
}) {
    const direct =
        relationship?.toLowerCase() ===
        "direct";

    return (
        <div className="flex flex-col items-start gap-1">
            <span
                className={
                    direct
                        ? "inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700"
                        : "inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700"
                }
            >
                {relationship ||
                    "Indirect"}
            </span>

            {tier ? (
                <span className="text-[9px] text-muted-foreground">
                    Tier{" "}
                    {
                        tier
                    }
                </span>
            ) : null}
        </div>
    );
}

function Th({
    children,
}: {
    children: ReactNode;
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
    children: ReactNode;
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
    value?: string,
    dateOnly = false
): string {
    if (
        !value
    ) {
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

    if (
        dateOnly
    ) {
        return date.toLocaleDateString();
    }

    return date.toLocaleString();
}
