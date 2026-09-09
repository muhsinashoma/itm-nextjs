

// frontend/app/dashboard/page.tsx

"use client";

import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import OverviewChart from "@/components/overview-chart";
import { DataTable } from "@/components/data-table";

import {
    createTTColumns,
    mapTTPermissions,
    toSection,
} from "@/components/tt-columns";

import type {
    Section,
} from "@/types/tt";

import {
    authApi,
    dashboardApi,
    reportApi,
    type DashboardSummary,
    type NonOperationalSummary,
    type TroubleTicketITPersonnel,
    type TroubleTicketStatus,
} from "@/lib/api";

import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList,
    XAxis,
    YAxis,
} from "recharts";

/* ============================================================
   SHARED COMPONENTS
   ============================================================ */

function CardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            {children}
        </div>
    );
}

function CardHead({
    title,
    kpi,
    kpiClass = "text-primary",
    badge,
    onKpiClick,
}: {
    title: string;
    kpi: string | number;
    kpiClass?: string;
    badge?: string;
    onKpiClick?: () => void;
}) {
    return (
        <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {title}
            </h3>

            <div className="flex items-center gap-1.5">
                <span
                    onClick={onKpiClick}
                    className={`
                        text-lg
                        font-bold
                        tabular-nums
                        ${kpiClass}
                        ${onKpiClick
                            ? "cursor-pointer hover:underline"
                            : ""
                        }
                    `}
                >
                    {kpi}
                </span>

                {badge && (
                    <span
                        className="
                            rounded-full
                            border
                            border-emerald-100
                            bg-emerald-50
                            px-1.5
                            py-0.5
                            text-[9px]
                            font-semibold
                            text-emerald-700
                        "
                    >
                        {badge}
                    </span>
                )}
            </div>
        </div>
    );
}

function LegendRow({
    label,
    value,
    color,
    onClick,
    compact = false,
}: {
    label: string;
    value: number | string;
    color: string;
    onClick?: () => void;
    compact?: boolean;
}) {
    return (
        <div
            onClick={onClick}
            className={`
                grid
                grid-cols-[minmax(0,1fr)_28px]
                items-center
                gap-2
                rounded-lg
                px-1.5
                py-1.5
                transition-colors
                ${onClick
                    ? "cursor-pointer hover:bg-muted/60"
                    : ""
                }
            `}
        >
            <div className="flex min-w-0 items-center gap-1.5">
                <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                        backgroundColor: color,
                    }}
                />

                <span
                    title={label}
                    className={`
                        min-w-0
                        text-muted-foreground
                        ${compact
                            ? "text-[9px] leading-[11px]"
                            : "text-[10px] leading-[13px]"
                        }
                    `}
                >
                    {label}
                </span>
            </div>

            <span
                className="
                    w-7
                    shrink-0
                    text-right
                    text-[10px]
                    font-bold
                    tabular-nums
                    text-foreground
                "
            >
                {typeof value === "number"
                    ? value.toLocaleString()
                    : value}
            </span>
        </div>
    );
}

/* ============================================================
   CHART CONFIGURATION
   ============================================================ */

const tip = {
    fontSize: 10,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card)",
};

const cleanTooltipProps = {
    cursor: false,
    contentStyle: {
        ...tip,
        boxShadow:
            "0 8px 20px rgba(15, 23, 42, 0.12)",
    },
};

const PieLabel = (props: any) => {
    const {
        cx,
        cy,
        midAngle,
        outerRadius,
        percent,
        value,
    } = props;

    if (!value || percent <= 0) {
        return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 5;

    const x =
        cx +
        radius *
        Math.cos(
            -midAngle * RADIAN
        );

    const y =
        cy +
        radius *
        Math.sin(
            -midAngle * RADIAN
        );

    return (
        <text
            x={x}
            y={y}
            fill="#111827"
            textAnchor={
                x > cx
                    ? "start"
                    : "end"
            }
            dominantBaseline="central"
            fontSize={9}
            fontWeight={700}
        >
            {(percent * 100).toFixed(1)}%
        </text>
    );
};

function colorByLabel(
    label: string
) {
    const key =
        label.toLowerCase();

    if (key.includes("assigned"))
        return "#3b82f6";

    if (key.includes("transfer"))
        return "#f59e0b";

    if (key.includes("return"))
        return "#10b981";

    if (
        key.includes("available") ||
        key.includes("stored")
    )
        return "#8b5cf6";

    if (key.includes("lost"))
        return "#ef4444";

    if (key.includes("damage"))
        return "#f59e0b";

    if (key.includes("ownership"))
        return "#10b981";

    if (key.includes("claim"))
        return "#f97316";

    if (key.includes("vendor"))
        return "#8b5cf6";

    if (key.includes("recover"))
        return "#3b82f6";

    if (key.includes("expired"))
        return "#ef4444";

    if (key.includes("closed"))
        return "#10b981";

    if (key.includes("service"))
        return "#3b82f6";

    return "#64748b";
}

function getSummaryValue(
    items: {
        label: string;
        value: number;
    }[],
    keyword: string
) {
    return (
        items.find(
            (item) =>
                item.label
                    .toLowerCase()
                    .includes(
                        keyword.toLowerCase()
                    )
        )?.value ?? 0
    );
}

function hideDashboardLabels(
    items: {
        label: string;
        value: number;
    }[],
    hiddenLabels: string[]
) {
    const hidden =
        hiddenLabels.map(
            (label) =>
                label.toLowerCase()
        );

    return items.filter(
        (item) =>
            !hidden.includes(
                item.label.toLowerCase()
            )
    );
}

/* ============================================================
   STATIC CHART DATA
   ============================================================ */

const resignationAreaData = [
    {
        month: "Jan",
        pending: 2,
        completed: 5,
        inprocess: 1,
    },
    {
        month: "Feb",
        pending: 1,
        completed: 4,
        inprocess: 2,
    },
    {
        month: "Mar",
        pending: 2,
        completed: 3,
        inprocess: 1,
    },
    {
        month: "Apr",
        pending: 5,
        completed: 3,
        inprocess: 2,
    },
    {
        month: "May",
        pending: 3,
        completed: 6,
        inprocess: 2,
    },
    {
        month: "Jun",
        pending: 4,
        completed: 7,
        inprocess: 1,
    },
];

const resignationPendingTotal =
    resignationAreaData.reduce(
        (sum, item) =>
            sum + item.pending,
        0
    );

const resignationCompletedTotal =
    resignationAreaData.reduce(
        (sum, item) =>
            sum + item.completed,
        0
    );

const resignationInProcessTotal =
    resignationAreaData.reduce(
        (sum, item) =>
            sum + item.inprocess,
        0
    );

const resignationLegend = [
    {
        label: "Pending Clearance",
        value:
            resignationPendingTotal,
        color: "#f59e0b",
        status: "Pending Clearance",
    },
    {
        label: "Completed",
        value:
            resignationCompletedTotal,
        color: "#10b981",
        status: "Completed",
    },
    {
        label: "In Process",
        value:
            resignationInProcessTotal,
        color: "#3b82f6",
        status: "In Process",
    },
];

const renewalBarData = [
    {
        month: "Jan",
        upcoming: 5,
        completed: 10,
        delayed: 2,
    },
    {
        month: "Feb",
        upcoming: 4,
        completed: 9,
        delayed: 3,
    },
    {
        month: "Mar",
        upcoming: 6,
        completed: 12,
        delayed: 2,
    },
    {
        month: "Apr",
        upcoming: 5,
        completed: 14,
        delayed: 3,
    },
    {
        month: "May",
        upcoming: 7,
        completed: 11,
        delayed: 1,
    },
    {
        month: "Jun",
        upcoming: 6,
        completed: 13,
        delayed: 2,
    },
];

const renewalUpcomingTotal =
    renewalBarData.reduce(
        (sum, item) =>
            sum + item.upcoming,
        0
    );

const renewalCompletedTotal =
    renewalBarData.reduce(
        (sum, item) =>
            sum + item.completed,
        0
    );

const renewalDelayedTotal =
    renewalBarData.reduce(
        (sum, item) =>
            sum + item.delayed,
        0
    );

const renewalLegend = [
    {
        label: "Upcoming Renewals",
        value:
            renewalUpcomingTotal,
        color: "#f59e0b",
        status: "Upcoming Renewals",
    },
    {
        label: "Completed",
        value:
            renewalCompletedTotal,
        color: "#10b981",
        status: "Completed",
    },
    {
        label: "Delayed",
        value:
            renewalDelayedTotal,
        color: "#ef4444",
        status: "Delayed",
    },
];

/* ============================================================
   PAGE
   ============================================================ */

export default function DashboardPage() {
    const router = useRouter();

    /* --------------------------------------------------------
       AUTH / TT COLUMN PERMISSIONS
       -------------------------------------------------------- */

    const [authUser, setAuthUser] =
        useState<import("@/lib/api").AuthMeData | null>(null);

    const [authLoading, setAuthLoading] =
        useState(true);

    const actionPermissions = useMemo(
        () =>
            mapTTPermissions(
                authUser?.permissions ?? []
            ),
        [authUser?.permissions]
    );

    const columns = useMemo(
        () =>
            createTTColumns(
                actionPermissions
            ),
        [actionPermissions]
    );

    /* --------------------------------------------------------
       DASHBOARD STATE
       -------------------------------------------------------- */

    const [
        summary,
        setSummary,
    ] = useState<DashboardSummary | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    /* --------------------------------------------------------
       NON-OPERATIONAL STATE
       -------------------------------------------------------- */

    const [
        nonOpSummary,
        setNonOpSummary,
    ] =
        useState<NonOperationalSummary>({
            ownership: 0,
            damaged: 0,
            lost: 0,
            total_non_operational: 0,

            main_table_damaged: 0,
            damage_inventory_damaged: 0,
            duplicate_in_both_tables: 0,
            damage_inventory_only: 0,
        });

    const [
        nonOpLoading,
        setNonOpLoading,
    ] = useState(true);

    /* --------------------------------------------------------
       TROUBLE TICKET STATE
       -------------------------------------------------------- */

    const [
        troubleTicketRows,
        setTroubleTicketRows,
    ] = useState<Section[]>([]);

    const [
        troubleTicketLoading,
        setTroubleTicketLoading,
    ] = useState(true);

    const [
        troubleTicketError,
        setTroubleTicketError,
    ] = useState("");

    const [
        troubleTicketServerFilters,
        setTroubleTicketServerFilters,
    ] = useState({
        fromDate: "",
        toDate: "",
        employeeId: "",
        status: "",
        itPersonal: "",
    });

    const [
        troubleTicketITPersonnel,
        setTroubleTicketITPersonnel,
    ] = useState<
        TroubleTicketITPersonnel[]
    >([]);

    /* ========================================================
       LOAD AUTH / PERMISSIONS
       ======================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadAuth() {
            try {
                setAuthLoading(true);

                const response =
                    await authApi.me();

                if (!mounted) {
                    return;
                }

                setAuthUser(
                    response.data
                );

                /*
                 * Keep localStorage in sync so other client
                 * components such as TTTable can use the same
                 * backend-authoritative permission list.
                 */
                if (typeof window !== "undefined") {
                    localStorage.setItem(
                        "itm_user",
                        JSON.stringify(
                            response.data
                        )
                    );
                }
            } catch (reason) {
                console.error(
                    "Unable to load authenticated user:",
                    reason
                );

                if (mounted) {
                    setAuthUser(null);
                }
            } finally {
                if (mounted) {
                    setAuthLoading(false);
                }
            }
        }

        void loadAuth();

        return () => {
            mounted = false;
        };
    }, []);

    /* ========================================================
       LOAD DASHBOARD DATA
       ======================================================== */

    useEffect(() => {
        let mounted = true;

        const emptyWarranty = {
            total: 0,
            items: [
                {
                    label: "Claimed",
                    value: 0,
                },
                {
                    label: "To Vendor",
                    value: 0,
                },
                {
                    label: "Recovered",
                    value: 0,
                },
                {
                    label: "Expired",
                    value: 0,
                },
            ],
        };

        const emptyServiceRequests = {
            total: 0,
            items: [
                {
                    label: "Service Request",
                    value: 0,
                },
                {
                    label:
                        "Transferred to Vendor",
                    value: 0,
                },
                {
                    label: "Closed",
                    value: 0,
                },
            ],
        };

        function settledError(
            result: PromiseSettledResult<unknown>
        ): string | null {
            if (
                result.status ===
                "fulfilled"
            ) {
                return null;
            }

            if (
                result.reason instanceof
                Error
            ) {
                return result.reason.message;
            }

            if (
                typeof result.reason ===
                "string"
            ) {
                return result.reason;
            }

            try {
                return JSON.stringify(
                    result.reason
                );
            } catch {
                return "Unknown API error";
            }
        }

        async function loadDashboard() {
            try {
                setLoading(true);
                setNonOpLoading(true);
                setError("");

                const [
                    dashboardRes,
                    nonOpRes,
                    warrantyRes,
                    serviceRequestRes,
                ] =
                    await Promise.allSettled([
                        dashboardApi.summary(),
                        reportApi.nonOperationalSummary(),
                        reportApi.warrantySummary(),
                        reportApi.serviceRequestSummary(),
                    ]);

                if (!mounted) {
                    return;
                }

                if (
                    dashboardRes.status !==
                    "fulfilled"
                ) {
                    setError(
                        `Unable to load dashboard: ${settledError(
                            dashboardRes
                        ) ??
                        "Unknown dashboard error"
                        }`
                    );

                    return;
                }

                if (
                    warrantyRes.status ===
                    "rejected"
                ) {
                    console.warn(
                        "[dashboard] warranty summary failed:",
                        settledError(
                            warrantyRes
                        )
                    );
                }

                if (
                    serviceRequestRes.status ===
                    "rejected"
                ) {
                    console.warn(
                        "[dashboard] service request summary failed:",
                        settledError(
                            serviceRequestRes
                        )
                    );
                }

                const dashboardData: DashboardSummary =
                {
                    ...dashboardRes.value
                        .data,

                    warranty:
                        warrantyRes.status ===
                            "fulfilled"
                            ? warrantyRes
                                .value
                                .data
                            : emptyWarranty,

                    service_requests:
                        serviceRequestRes.status ===
                            "fulfilled"
                            ? serviceRequestRes
                                .value
                                .data
                            : emptyServiceRequests,
                };

                setSummary(
                    dashboardData
                );

                if (
                    nonOpRes.status ===
                    "fulfilled"
                ) {
                    const raw: any =
                        nonOpRes.value
                            .data;

                    const data =
                        raw?.data ??
                        raw?.body ??
                        raw;

                    setNonOpSummary({
                        ownership:
                            Number(
                                data?.ownership ??
                                0
                            ),

                        damaged:
                            Number(
                                data?.damaged ??
                                0
                            ),

                        lost:
                            Number(
                                data?.lost ??
                                0
                            ),

                        total_non_operational:
                            Number(
                                data?.total_non_operational ??
                                0
                            ),

                        main_table_damaged:
                            Number(
                                data?.main_table_damaged ??
                                0
                            ),

                        damage_inventory_damaged:
                            Number(
                                data?.damage_inventory_damaged ??
                                0
                            ),

                        duplicate_in_both_tables:
                            Number(
                                data?.duplicate_in_both_tables ??
                                0
                            ),

                        damage_inventory_only:
                            Number(
                                data?.damage_inventory_only ??
                                0
                            ),
                    });
                } else {
                    console.warn(
                        "[dashboard] non-operational summary failed:",
                        settledError(
                            nonOpRes
                        )
                    );

                    setNonOpSummary({
                        ownership: 0,
                        damaged: 0,
                        lost: 0,
                        total_non_operational: 0,
                        main_table_damaged: 0,
                        damage_inventory_damaged: 0,
                        duplicate_in_both_tables: 0,
                        damage_inventory_only: 0,
                    });
                }
            } catch (
            err: unknown
            ) {
                if (!mounted) {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load dashboard data"
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                    setNonOpLoading(false);
                }
            }
        }

        void loadDashboard();

        return () => {
            mounted = false;
        };
    }, []);

    /* ========================================================
       LOAD IT PERSONNEL
       ======================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadITPersonnel() {
            try {
                const response =
                    await dashboardApi.troubleTicketITPersonnel();

                if (!mounted) {
                    return;
                }

                setTroubleTicketITPersonnel(
                    response.data ?? []
                );
            } catch (reason) {
                console.error(
                    "Unable to load IT Personnel:",
                    reason
                );

                if (mounted) {
                    setTroubleTicketITPersonnel(
                        []
                    );
                }
            }
        }

        void loadITPersonnel();

        return () => {
            mounted = false;
        };
    }, []);

    /* ========================================================
       LOAD TROUBLE TICKETS
       ======================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadTroubleTickets() {
            try {
                setTroubleTicketLoading(
                    true
                );

                setTroubleTicketError("");

                const response =
                    await dashboardApi.troubleTickets(
                        {
                            scope: "all",

                            page: 1,

                            limit: 1000,

                            status:
                                troubleTicketServerFilters.status
                                    ? (troubleTicketServerFilters.status as TroubleTicketStatus)
                                    : "all",

                            from_date:
                                troubleTicketServerFilters.fromDate ||
                                undefined,

                            to_date:
                                troubleTicketServerFilters.toDate ||
                                undefined,

                            employee_id:
                                troubleTicketServerFilters.employeeId ||
                                undefined,

                            it_personal:
                                troubleTicketServerFilters.itPersonal ||
                                undefined,
                        }
                    );

                if (!mounted) {
                    return;
                }

                const tickets =
                    response.data ?? [];

                setTroubleTicketRows(
                    tickets.map(toSection)
                );
            } catch (
            reason: unknown
            ) {
                if (!mounted) {
                    return;
                }

                setTroubleTicketRows(
                    []
                );

                setTroubleTicketError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load Trouble Ticket data"
                );
            } finally {
                if (mounted) {
                    setTroubleTicketLoading(
                        false
                    );
                }
            }
        }

        void loadTroubleTickets();

        return () => {
            mounted = false;
        };
    }, [
        troubleTicketServerFilters,
    ]);

    /* ========================================================
       LOADING / ERROR STATES
       ======================================================== */

    if (loading || authLoading) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                Loading dashboard data...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-sm text-red-600">
                {error}
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="p-4 text-sm text-red-600">
                No dashboard data found.
            </div>
        );
    }

    /* ========================================================
       PREPARE CHART DATA
       ======================================================== */

    const activeAssetsData =
        hideDashboardLabels(
            summary.active_assets.items,
            [
                "Unknown",
                "Other",
            ]
        ).map((item) => ({
            label: item.label,

            shortLabel:
                item.label.length > 6
                    ? item.label.slice(
                        0,
                        6
                    )
                    : item.label,

            value: item.value,

            color: colorByLabel(
                item.label
            ),
        }));

    const warrantyDetails =
        summary.warranty.items.map(
            (item) => ({
                label: item.label,
                value: item.value,
                color: colorByLabel(
                    item.label
                ),
                status: item.label,
            })
        );

    const serviceData =
        summary.service_requests.items.map(
            (item) => ({
                label: item.label,
                value: item.value,
                color: colorByLabel(
                    item.label
                ),
                status: item.label,
            })
        );

    const currentYear =
        new Date()
            .getFullYear()
            .toString();

    const warrantyBarData = [
        {
            year: currentYear,

            claimed:
                getSummaryValue(
                    summary.warranty.items,
                    "claim"
                ),

            vendor:
                getSummaryValue(
                    summary.warranty.items,
                    "vendor"
                ),

            recovered:
                getSummaryValue(
                    summary.warranty.items,
                    "recover"
                ),

            expired:
                getSummaryValue(
                    summary.warranty.items,
                    "expired"
                ),
        },
    ];

    const warrantyMaxValue =
        Math.max(
            warrantyBarData[0]
                .claimed,
            warrantyBarData[0]
                .vendor,
            warrantyBarData[0]
                .recovered,
            warrantyBarData[0]
                .expired,
            1
        );

    const serviceBarData = [
        {
            name: currentYear,

            servicerequest:
                getSummaryValue(
                    summary
                        .service_requests
                        .items,
                    "service"
                ),

            transferred:
                getSummaryValue(
                    summary
                        .service_requests
                        .items,
                    "vendor"
                ),

            closed:
                getSummaryValue(
                    summary
                        .service_requests
                        .items,
                    "closed"
                ),
        },
    ];

    const serviceMaxValue =
        Math.max(
            serviceBarData[0]
                .servicerequest,
            serviceBarData[0]
                .transferred,
            serviceBarData[0]
                .closed,
            1
        );

    /* ========================================================
       TOTALS
       ======================================================== */

    const totalAssets =
        summary.active_assets
            .total;

    const totalWarranty =
        summary.warranty.total;

    const totalService =
        summary.service_requests
            .total;

    const ownershipCount =
        nonOpSummary.ownership;

    const damagedCount =
        nonOpSummary.damaged;

    const lostCount =
        nonOpSummary.lost;

    const totalNonOp =
        nonOpSummary.total_non_operational ||
        ownershipCount +
        damagedCount +
        lostCount;

    const nonOpTotal =
        ownershipCount +
        damagedCount +
        lostCount;

    const nonOpData = [
        {
            label: "Ownership",
            value: ownershipCount,
            color: "#10b981",
        },
        {
            label: "Damaged",
            value: damagedCount,
            color: "#f59e0b",
        },
        {
            label: "Lost",
            value: lostCount,
            color: "#ef4444",
        },
    ];

    const totalResig =
        resignationAreaData.reduce(
            (sum, item) =>
                sum +
                item.pending +
                item.completed +
                item.inprocess,
            0
        );

    const totalRenewal =
        renewalBarData.reduce(
            (sum, item) =>
                sum +
                item.upcoming +
                item.completed +
                item.delayed,
            0
        );

    /* ========================================================
       ACTIVE ASSET X AXIS
       ======================================================== */

    const ActiveAssetXAxisTick = (
        props: any
    ) => {
        const {
            x,
            y,
            payload,
        } = props;

        return (
            <text
                x={x}
                y={y + 10}
                textAnchor="middle"
                fill="#6b7280"
                fontSize={8}
                fontWeight={500}
            >
                {payload.value}
            </text>
        );
    };

    /* ========================================================
       RENDER
       ======================================================== */

    return (
        <div className="space-y-4 p-4">

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                {/* ==============================================
                    CARD 1 - ACTIVE ASSETS
                ============================================== */}

                <CardShell>
                    <CardHead
                        title="Total Active Assets"
                        kpi={totalAssets.toLocaleString()}
                        badge="Live"
                        onKpiClick={() =>
                            router.push(
                                "/dashboard/reports/assets"
                            )
                        }
                    />

                    <div className="flex items-center gap-3">

                        <div className="h-36 w-1/2">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={
                                        activeAssetsData
                                    }
                                    margin={{
                                        top: 16,
                                        right: 4,
                                        left: 4,
                                        bottom: 14,
                                    }}
                                    barCategoryGap="22%"
                                    barGap={0}
                                >
                                    <XAxis
                                        dataKey="shortLabel"
                                        interval={0}
                                        minTickGap={0}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={
                                            <ActiveAssetXAxisTick />
                                        }
                                    />

                                    <Bar
                                        dataKey="value"
                                        radius={[
                                            3,
                                            3,
                                            0,
                                            0,
                                        ]}
                                        maxBarSize={34}
                                        activeBar={false}
                                    >
                                        {activeAssetsData.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <Cell
                                                    key={
                                                        index
                                                    }
                                                    fill={
                                                        item.color
                                                    }
                                                />
                                            )
                                        )}

                                        <LabelList
                                            dataKey="value"
                                            position="top"
                                            fontSize={8}
                                            fill="var(--foreground)"
                                            formatter={(
                                                value: number
                                            ) =>
                                                value >=
                                                    1000
                                                    ? `${(
                                                        value /
                                                        1000
                                                    ).toFixed(
                                                        1
                                                    )}k`
                                                    : value
                                            }
                                        />
                                    </Bar>

                                    <Tooltip
                                        {...cleanTooltipProps}
                                        formatter={(
                                            value: number,
                                            name: string,
                                            props: any
                                        ) => [
                                                Number(
                                                    value
                                                ).toLocaleString(),
                                                props
                                                    ?.payload
                                                    ?.label ||
                                                name,
                                            ]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-1/2 space-y-0.5 border-l border-border pl-3">
                            {activeAssetsData.map(
                                (item) => (
                                    <LegendRow
                                        key={
                                            item.label
                                        }
                                        {...item}
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/reports/assets?status=${encodeURIComponent(
                                                    item.label
                                                )}`
                                            )
                                        }
                                    />
                                )
                            )}
                        </div>
                    </div>
                </CardShell>

                {/* ==============================================
                    CARD 2 - NON OPERATIONAL
                ============================================== */}

                <CardShell>
                    <CardHead
                        title="Non-Operational Assets"
                        kpi={totalNonOp.toLocaleString()}
                        kpiClass="text-red-500"
                        badge={
                            nonOpLoading
                                ? "Loading..."
                                : "Live"
                        }
                        onKpiClick={() =>
                            router.push(
                                "/dashboard/reports/non-operational"
                            )
                        }
                    />

                    <div className="flex items-center gap-3">

                        <div className="h-36 w-1/2">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <PieChart
                                    margin={{
                                        top: 10,
                                        right: 44,
                                        bottom: 14,
                                        left: 44,
                                    }}
                                >
                                    <Pie
                                        data={
                                            nonOpData
                                        }
                                        dataKey="value"
                                        nameKey="label"
                                        cx="46%"
                                        cy="50%"
                                        outerRadius={43}
                                        innerRadius={27}
                                        paddingAngle={3}
                                        labelLine={false}
                                        label={(
                                            props
                                        ) => (
                                            <PieLabel
                                                {...props}
                                                name={
                                                    props.name ||
                                                    props.label
                                                }
                                            />
                                        )}
                                    >
                                        {nonOpData.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <Cell
                                                    key={
                                                        index
                                                    }
                                                    fill={
                                                        item.color
                                                    }
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip
                                        {...cleanTooltipProps}
                                        formatter={(
                                            value: number,
                                            name: string
                                        ) => {
                                            const percentage =
                                                nonOpTotal >
                                                    0
                                                    ? (
                                                        (Number(
                                                            value
                                                        ) /
                                                            nonOpTotal) *
                                                        100
                                                    ).toFixed(
                                                        1
                                                    )
                                                    : "0";

                                            return [
                                                `${Number(
                                                    value
                                                ).toLocaleString()} (${percentage}%)`,
                                                name,
                                            ];
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-1/2 space-y-0.5 border-l border-border pl-3">

                            <LegendRow
                                label="Ownership"
                                value={
                                    ownershipCount
                                }
                                color="#10b981"
                                onClick={() =>
                                    router.push(
                                        "/dashboard/disposal/ownership-assets"
                                    )
                                }
                            />

                            <LegendRow
                                label="Damaged"
                                value={
                                    damagedCount
                                }
                                color="#f59e0b"
                                onClick={() =>
                                    router.push(
                                        "/dashboard/reports/non-operational?status=damaged"
                                    )
                                }
                            />

                            <LegendRow
                                label="Lost"
                                value={
                                    lostCount
                                }
                                color="#ef4444"
                                onClick={() =>
                                    router.push(
                                        "/dashboard/reports/non-operational?status=lost"
                                    )
                                }
                            />

                        </div>
                    </div>
                </CardShell>

                {/* ==============================================
                    CARD 3 - WARRANTY
                ============================================== */}

                <CardShell>
                    <CardHead
                        title={`Warranty Overview ${currentYear}`}
                        kpi={totalWarranty.toLocaleString()}
                        badge="Live"
                        onKpiClick={() =>
                            router.push(
                                "/dashboard/service-warranty/warranty-claims"
                            )
                        }
                    />

                    <div className="flex items-center gap-3">

                        <div className="h-36 w-1/2">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={
                                        warrantyBarData
                                    }
                                    margin={{
                                        top: 18,
                                        right: 4,
                                        left: 4,
                                        bottom: 4,
                                    }}
                                    barCategoryGap="20%"
                                    barGap={3}
                                    onClick={(
                                        event
                                    ) => {
                                        const key =
                                            event
                                                ?.activePayload?.[0]
                                                ?.dataKey as
                                            | string
                                            | undefined;

                                        const map: Record<
                                            string,
                                            string
                                        > = {
                                            claimed:
                                                "Claimed",
                                            vendor:
                                                "To Vendor",
                                            recovered:
                                                "Recovered",
                                            expired:
                                                "Expired",
                                        };

                                        if (
                                            key &&
                                            map[key]
                                        ) {
                                            router.push(
                                                `/dashboard/service-warranty/warranty-claims?status=${encodeURIComponent(
                                                    map[key]
                                                )}`
                                            );
                                        }
                                    }}
                                    style={{
                                        cursor: "pointer",
                                    }}
                                >
                                    <XAxis
                                        dataKey="year"
                                        tick={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            fill: "#374151",
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        hide
                                        domain={[
                                            0,
                                            warrantyMaxValue,
                                        ]}
                                    />

                                    <Tooltip
                                        {...cleanTooltipProps}
                                    />

                                    <Bar
                                        dataKey="claimed"
                                        fill="#f97316"
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                        cursor="pointer"
                                        minPointSize={6}
                                    >
                                        <LabelList
                                            dataKey="claimed"
                                            position="top"
                                            fontSize={8}
                                            fill="var(--foreground)"
                                        />
                                    </Bar>

                                    <Bar
                                        dataKey="vendor"
                                        fill="#8b5cf6"
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                        cursor="pointer"
                                        minPointSize={6}
                                    >
                                        <LabelList
                                            dataKey="vendor"
                                            position="top"
                                            fontSize={8}
                                            fill="var(--foreground)"
                                        />
                                    </Bar>

                                    <Bar
                                        dataKey="recovered"
                                        fill="#3b82f6"
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                        cursor="pointer"
                                        minPointSize={6}
                                    >
                                        <LabelList
                                            dataKey="recovered"
                                            position="top"
                                            fontSize={8}
                                            fill="var(--foreground)"
                                        />
                                    </Bar>

                                    <Bar
                                        dataKey="expired"
                                        fill="#ef4444"
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                        cursor="pointer"
                                        minPointSize={6}
                                    >
                                        <LabelList
                                            dataKey="expired"
                                            position="top"
                                            fontSize={8}
                                            fill="var(--foreground)"
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-1/2 space-y-0.5 border-l border-border pl-3">
                            {warrantyDetails.map(
                                (item) => (
                                    <LegendRow
                                        key={
                                            item.label
                                        }
                                        label={
                                            item.label
                                        }
                                        value={
                                            item.value
                                        }
                                        color={
                                            item.color
                                        }
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/service-warranty/warranty-claims?status=${encodeURIComponent(
                                                    item.status
                                                )}`
                                            )
                                        }
                                    />
                                )
                            )}
                        </div>
                    </div>
                </CardShell>

                {/* ==============================================
                    CARD 4 - SERVICE REQUESTS
                ============================================== */}

                <CardShell>
                    <CardHead
                        title={`Service Requests ${currentYear}`}
                        kpi={totalService.toLocaleString()}
                        badge="Live"
                        onKpiClick={() =>
                            router.push(
                                "/dashboard/service-warranty/service-claims"
                            )
                        }
                    />

                    <div className="flex items-center gap-3">

                        <div className="h-36 w-1/2">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={
                                        serviceBarData
                                    }
                                    margin={{
                                        top: 18,
                                        right: 4,
                                        left: 4,
                                        bottom: 4,
                                    }}
                                    barCategoryGap="22%"
                                    barGap={4}
                                    onClick={(
                                        event
                                    ) => {
                                        const key =
                                            event
                                                ?.activePayload?.[0]
                                                ?.dataKey as
                                            | string
                                            | undefined;

                                        const map: Record<
                                            string,
                                            string
                                        > = {
                                            servicerequest:
                                                "Service Request",
                                            transferred:
                                                "Transferred to Vendor",
                                            closed:
                                                "Closed",
                                        };

                                        if (
                                            key &&
                                            map[key]
                                        ) {
                                            router.push(
                                                `/dashboard/service-warranty/service-claims?status=${encodeURIComponent(
                                                    map[key]
                                                )}`
                                            );
                                        }
                                    }}
                                    style={{
                                        cursor: "pointer",
                                    }}
                                >
                                    <XAxis
                                        dataKey="name"
                                        tick={{
                                            fontSize: 9,
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        hide
                                        domain={[
                                            0,
                                            serviceMaxValue,
                                        ]}
                                    />

                                    <Tooltip
                                        {...cleanTooltipProps}
                                    />

                                    <Bar
                                        dataKey="servicerequest"
                                        fill="#3b82f6"
                                        name="Service Request"
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                        cursor="pointer"
                                        activeBar={false}
                                        minPointSize={6}
                                    >
                                        <LabelList
                                            dataKey="servicerequest"
                                            position="top"
                                            fontSize={8}
                                            fill="var(--foreground)"
                                        />
                                    </Bar>

                                    <Bar
                                        dataKey="transferred"
                                        fill="#f59e0b"
                                        name="Transferred to Vendor"
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                        cursor="pointer"
                                        activeBar={false}
                                        minPointSize={6}
                                    >
                                        <LabelList
                                            dataKey="transferred"
                                            position="top"
                                            fontSize={8}
                                            fill="var(--foreground)"
                                        />
                                    </Bar>

                                    <Bar
                                        dataKey="closed"
                                        fill="#10b981"
                                        name="Closed"
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                        cursor="pointer"
                                        activeBar={false}
                                        minPointSize={6}
                                    >
                                        <LabelList
                                            dataKey="closed"
                                            position="top"
                                            fontSize={8}
                                            fill="var(--foreground)"
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-1/2 space-y-0.5 border-l border-border pl-3">
                            {serviceData.map(
                                (item) => (
                                    <LegendRow
                                        key={
                                            item.label
                                        }
                                        label={
                                            item.label
                                        }
                                        value={
                                            item.value
                                        }
                                        color={
                                            item.color
                                        }
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/service-warranty/service-claims?status=${encodeURIComponent(
                                                    item.status
                                                )}`
                                            )
                                        }
                                    />
                                )
                            )}
                        </div>
                    </div>
                </CardShell>

                {/* ==============================================
                    CARD 5 - RESIGNATION CLEARANCE
                ============================================== */}

                <CardShell>
                    <CardHead
                        title="Resignation Clearance"
                        kpi={totalResig}
                        kpiClass="text-red-500"
                        badge="Static"
                        onKpiClick={() =>
                            router.push(
                                "/dashboard/reports/resignation"
                            )
                        }
                    />

                    <div className="flex items-center gap-3">

                        <div className="h-36 w-[55%]">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <AreaChart
                                    data={
                                        resignationAreaData
                                    }
                                    margin={{
                                        top: 20,
                                        right: 8,
                                        left: 4,
                                        bottom: 8,
                                    }}
                                    onClick={(
                                        event
                                    ) => {
                                        const key =
                                            event
                                                ?.activePayload?.[0]
                                                ?.dataKey as
                                            | string
                                            | undefined;

                                        const map: Record<
                                            string,
                                            string
                                        > = {
                                            pending:
                                                "Pending Clearance",
                                            completed:
                                                "Completed",
                                            inprocess:
                                                "In Process",
                                        };

                                        if (
                                            key &&
                                            map[key]
                                        ) {
                                            router.push(
                                                `/dashboard/reports/resignation?status=${encodeURIComponent(
                                                    map[key]
                                                )}`
                                            );
                                        }
                                    }}
                                    style={{
                                        cursor: "pointer",
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="g1"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#f59e0b"
                                                stopOpacity={
                                                    0.2
                                                }
                                            />

                                            <stop
                                                offset="95%"
                                                stopColor="#f59e0b"
                                                stopOpacity={
                                                    0
                                                }
                                            />
                                        </linearGradient>

                                        <linearGradient
                                            id="g2"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#10b981"
                                                stopOpacity={
                                                    0.2
                                                }
                                            />

                                            <stop
                                                offset="95%"
                                                stopColor="#10b981"
                                                stopOpacity={
                                                    0
                                                }
                                            />
                                        </linearGradient>

                                        <linearGradient
                                            id="g3"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#3b82f6"
                                                stopOpacity={
                                                    0.2
                                                }
                                            />

                                            <stop
                                                offset="95%"
                                                stopColor="#3b82f6"
                                                stopOpacity={
                                                    0
                                                }
                                            />
                                        </linearGradient>
                                    </defs>

                                    <XAxis
                                        dataKey="month"
                                        interval={0}
                                        minTickGap={0}
                                        tick={{
                                            fontSize: 8,
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        padding={{
                                            left: 6,
                                            right: 6,
                                        }}
                                    />

                                    <Tooltip
                                        {...cleanTooltipProps}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="pending"
                                        name="Pending"
                                        stroke="#f59e0b"
                                        strokeWidth={1.5}
                                        fill="url(#g1)"
                                        dot={{
                                            r: 2,
                                        }}
                                        activeDot={{
                                            r: 4,
                                        }}
                                    >
                                        <LabelList
                                            dataKey="pending"
                                            position="top"
                                            fontSize={8}
                                            fontWeight={700}
                                            fill="var(--foreground)"
                                        />
                                    </Area>

                                    <Area
                                        type="monotone"
                                        dataKey="completed"
                                        name="Completed"
                                        stroke="#10b981"
                                        strokeWidth={1.5}
                                        fill="url(#g2)"
                                        dot={{
                                            r: 2,
                                        }}
                                        activeDot={{
                                            r: 4,
                                        }}
                                    >
                                        <LabelList
                                            dataKey="completed"
                                            position="top"
                                            fontSize={8}
                                            fontWeight={700}
                                            fill="var(--foreground)"
                                        />
                                    </Area>

                                    <Area
                                        type="monotone"
                                        dataKey="inprocess"
                                        name="In Process"
                                        stroke="#3b82f6"
                                        strokeWidth={1.5}
                                        fill="url(#g3)"
                                        dot={{
                                            r: 2,
                                        }}
                                        activeDot={{
                                            r: 4,
                                        }}
                                    >
                                        <LabelList
                                            dataKey="inprocess"
                                            position="top"
                                            fontSize={8}
                                            fontWeight={700}
                                            fill="var(--foreground)"
                                        />
                                    </Area>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-[45%] space-y-1 border-l border-border pl-3">
                            {resignationLegend.map(
                                (item) => (
                                    <div
                                        key={
                                            item.label
                                        }
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/reports/resignation?status=${encodeURIComponent(
                                                    item.status
                                                )}`
                                            )
                                        }
                                        className="
                                            grid
                                            cursor-pointer
                                            grid-cols-[1fr_28px]
                                            items-center
                                            gap-2
                                            rounded-lg
                                            px-1.5
                                            py-1.5
                                            transition-colors
                                            hover:bg-muted/60
                                        "
                                    >
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            <span
                                                className="h-2 w-2 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        item.color,
                                                }}
                                            />

                                            <span className="text-[10px] leading-tight text-muted-foreground">
                                                {
                                                    item.label
                                                }
                                            </span>
                                        </div>

                                        <span className="shrink-0 text-right text-[10px] font-bold tabular-nums text-foreground">
                                            {item.value.toLocaleString()}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </CardShell>

                {/* ==============================================
                    CARD 6 - CONTRACT RENEWAL
                ============================================== */}

                <CardShell>
                    <CardHead
                        title="Contract Renewal"
                        kpi={totalRenewal}
                        kpiClass="text-emerald-600"
                        badge="Static"
                        onKpiClick={() =>
                            router.push(
                                "/dashboard/reports/renewal"
                            )
                        }
                    />

                    <div className="flex items-center gap-2">

                        <div className="h-36 w-[54%]">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={
                                        renewalBarData
                                    }
                                    margin={{
                                        top: 18,
                                        right: 4,
                                        left: 0,
                                        bottom: 6,
                                    }}
                                    barCategoryGap="18%"
                                    barGap={0}
                                    onClick={(
                                        event
                                    ) => {
                                        const key =
                                            event
                                                ?.activePayload?.[0]
                                                ?.dataKey as
                                            | string
                                            | undefined;

                                        const map: Record<
                                            string,
                                            string
                                        > = {
                                            upcoming:
                                                "Upcoming Renewals",
                                            completed:
                                                "Completed",
                                            delayed:
                                                "Delayed",
                                        };

                                        if (
                                            key &&
                                            map[key]
                                        ) {
                                            router.push(
                                                `/dashboard/reports/renewal?status=${encodeURIComponent(
                                                    map[key]
                                                )}`
                                            );
                                        }
                                    }}
                                    style={{
                                        cursor: "pointer",
                                    }}
                                >
                                    <XAxis
                                        dataKey="month"
                                        interval={0}
                                        minTickGap={0}
                                        tick={{
                                            fontSize: 8,
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        padding={{
                                            left: 4,
                                            right: 4,
                                        }}
                                    />

                                    <Tooltip
                                        {...cleanTooltipProps}
                                    />

                                    <Bar
                                        dataKey="upcoming"
                                        stackId="renewal"
                                        fill="#f59e0b"
                                        cursor="pointer"
                                        barSize={20}
                                        maxBarSize={20}
                                        activeBar={false}
                                    >
                                        <LabelList
                                            dataKey="upcoming"
                                            position="center"
                                            fontSize={8}
                                            fontWeight={700}
                                            fill="#ffffff"
                                        />
                                    </Bar>

                                    <Bar
                                        dataKey="completed"
                                        stackId="renewal"
                                        fill="#10b981"
                                        cursor="pointer"
                                        barSize={20}
                                        maxBarSize={20}
                                        activeBar={false}
                                    >
                                        <LabelList
                                            dataKey="completed"
                                            position="center"
                                            fontSize={8}
                                            fontWeight={700}
                                            fill="#ffffff"
                                        />
                                    </Bar>

                                    <Bar
                                        dataKey="delayed"
                                        stackId="renewal"
                                        fill="#ef4444"
                                        radius={[
                                            3,
                                            3,
                                            0,
                                            0,
                                        ]}
                                        cursor="pointer"
                                        barSize={20}
                                        maxBarSize={20}
                                        activeBar={false}
                                    >
                                        <LabelList
                                            dataKey="delayed"
                                            position="center"
                                            fontSize={8}
                                            fontWeight={700}
                                            fill="#ffffff"
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-[46%] space-y-1 border-l border-border pl-2">
                            {renewalLegend.map(
                                (item) => (
                                    <div
                                        key={
                                            item.label
                                        }
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/reports/renewal?status=${encodeURIComponent(
                                                    item.status
                                                )}`
                                            )
                                        }
                                        className="
                                            grid
                                            cursor-pointer
                                            grid-cols-[1fr_28px]
                                            items-center
                                            gap-2
                                            rounded-lg
                                            px-1
                                            py-1.5
                                            transition-colors
                                            hover:bg-muted/60
                                        "
                                    >
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            <span
                                                className="h-2 w-2 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        item.color,
                                                }}
                                            />

                                            <span className="text-[10px] leading-tight text-muted-foreground">
                                                {
                                                    item.label
                                                }
                                            </span>
                                        </div>

                                        <span className="shrink-0 text-right text-[10px] font-bold tabular-nums text-foreground">
                                            {item.value.toLocaleString()}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </CardShell>
            </div>

            {/* ==================================================
                TROUBLE TICKET OVERVIEW
            ================================================== */}

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <OverviewChart />
            </div>

            {/* ==================================================
                TROUBLE TICKET TABLE
            ================================================== */}

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">

                <div className="mb-3 flex items-center justify-between gap-3">

                    <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        Trouble Ticket Table
                    </h2>

                    {troubleTicketLoading && (
                        <span className="text-[10px] font-medium text-muted-foreground">
                            Updating...
                        </span>
                    )}
                </div>

                {troubleTicketError && (
                    <div
                        className="
                            mb-2
                            rounded-md
                            border
                            border-red-200
                            bg-red-50
                            px-3
                            py-2
                            text-[10px]
                            text-red-600
                        "
                    >
                        {troubleTicketError}
                    </div>
                )}

                <div className="overflow-x-auto">

                    <DataTable
                        columns={columns}
                        data={
                            troubleTicketRows
                        }
                        dateColumn="created_at"
                        compact
                        serverSideDateFilter
                        appliedServerFilters={
                            troubleTicketServerFilters
                        }
                        emptyMessage={
                            troubleTicketLoading
                                ? "Loading Trouble Ticket data..."
                                : "No Trouble Ticket records found."
                        }
                        itPersonalOptions={troubleTicketITPersonnel.map(
                            (
                                person
                            ) => ({
                                value:
                                    person.employee_id,

                                label:
                                    `${person.employee_name} (${person.employee_id})`,
                            })
                        )}
                        onApplyServerFilters={(
                            filters
                        ) => {
                            setTroubleTicketServerFilters(
                                filters
                            );
                        }}
                    />

                </div>
            </div>
        </div>
    );
}




// // frontend/app/dashboard/page.tsx



// "use client";

// import * as React from "react";
// import * as XLSX from "xlsx";

// import {
//     ColumnDef,
//     ColumnFiltersState,
//     flexRender,
//     getCoreRowModel,
//     getFilteredRowModel,
//     getPaginationRowModel,
//     getSortedRowModel,
//     SortingState,
//     useReactTable,
//     VisibilityState,
// } from "@tanstack/react-table";

// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table";

// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";

// import {
//     DropdownMenu,
//     DropdownMenuCheckboxItem,
//     DropdownMenuContent,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// import {
//     Building2,
//     CalendarDays,
//     Clock3,
//     Download,
//     Eye,
//     EyeOff,
//     FileText,
//     Filter,
//     PackageCheck,
//     Search,
//     Smartphone,
//     SlidersHorizontal,
//     UserCheck,
//     UserRound,
//     X,
// } from "lucide-react";

// /* ============================================================
//    TYPES
// ============================================================ */

// export type DataTableServerFilters = {
//     fromDate: string;
//     toDate: string;
//     employeeId: string;
//     status: string;
//     itPersonal: string;
// };

// export type DataTableOption = {
//     value: string;
//     label: string;
// };

// interface DataTableProps<TData, TValue> {
//     columns: ColumnDef<TData, TValue>[];
//     data: TData[];

//     dateColumn?: string;

//     compact?: boolean;

//     serverSideDateFilter?: boolean;

//     itPersonalOptions?: DataTableOption[];

//     appliedServerFilters?: DataTableServerFilters;

//     emptyMessage?: string;

//     onApplyServerFilters?: (
//         filters: DataTableServerFilters
//     ) => void;
// }

// /* ============================================================
//    DEFAULTS
// ============================================================ */

// const EMPTY_SERVER_FILTERS: DataTableServerFilters = {
//     fromDate: "",
//     toDate: "",
//     employeeId: "",
//     status: "",
//     itPersonal: "",
// };

// const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
//     mrnNumber: false,
//     prNumber: false,
//     department: false,
//     designation: false,
//     brand: false,
//     deviceType: false,
//     vendor: false,
//     assignedBy: false,
//     assignedDate: false,
//     returnedDate: false,
//     transferredDate: false,
//     purchaseDate: false,
//     warranty: false,
//     deviceAge: false,
//     userUsageDuration: false,
//     remarks: false,

//     dept_name: false,
//     employee_name: false,
//     func_name: false,
//     mobile_no: false,

//     postingArea: false,
//     postingDistrict: false,
//     personalMobile: false,
//     officeMobile: false,
// };

// /* ============================================================
//    HELPERS
// ============================================================ */

// function normalizeValue(value: unknown): string {
//     if (
//         value === null ||
//         value === undefined
//     ) {
//         return "";
//     }

//     if (
//         typeof value === "object"
//     ) {
//         try {
//             return JSON.stringify(value).toLowerCase();
//         } catch {
//             return String(value).toLowerCase();
//         }
//     }

//     return String(value).toLowerCase();
// }

// /* ============================================================
//    DATE NORMALIZATION
// ============================================================ */

// function normalizeDateOnly(
//     value: unknown
// ): string | null {
//     if (
//         value === null ||
//         value === undefined
//     ) {
//         return null;
//     }

//     if (value instanceof Date) {
//         if (
//             Number.isNaN(
//                 value.getTime()
//             )
//         ) {
//             return null;
//         }

//         const year =
//             value.getFullYear();

//         const month =
//             String(
//                 value.getMonth() + 1
//             ).padStart(2, "0");

//         const day =
//             String(
//                 value.getDate()
//             ).padStart(2, "0");

//         return `${year}-${month}-${day}`;
//     }

//     const text =
//         String(value).trim();

//     if (!text) {
//         return null;
//     }

//     const match =
//         text.match(
//             /(\d{4})-(\d{2})-(\d{2})/
//         );

//     if (match) {
//         return (
//             `${match[1]}-` +
//             `${match[2]}-` +
//             `${match[3]}`
//         );
//     }

//     const parsed =
//         new Date(text);

//     if (
//         Number.isNaN(
//             parsed.getTime()
//         )
//     ) {
//         return null;
//     }

//     const year =
//         parsed.getFullYear();

//     const month =
//         String(
//             parsed.getMonth() + 1
//         ).padStart(2, "0");

//     const day =
//         String(
//             parsed.getDate()
//         ).padStart(2, "0");

//     return `${year}-${month}-${day}`;
// }

// /* ============================================================
//    CREATED DATE / TIME
// ============================================================ */

// function formatCreatedDateTime(
//     value: unknown
// ): {
//     date: string;
//     time: string;
// } {
//     if (
//         value === null ||
//         value === undefined ||
//         String(value).trim() === ""
//     ) {
//         return {
//             date: "—",
//             time: "—",
//         };
//     }

//     if (value instanceof Date) {
//         if (
//             Number.isNaN(
//                 value.getTime()
//             )
//         ) {
//             return {
//                 date: "—",
//                 time: "—",
//             };
//         }

//         const date =
//             [
//                 value.getFullYear(),
//                 String(
//                     value.getMonth() + 1
//                 ).padStart(2, "0"),
//                 String(
//                     value.getDate()
//                 ).padStart(2, "0"),
//             ].join("-");

//         const time =
//             [
//                 String(
//                     value.getHours()
//                 ).padStart(2, "0"),
//                 String(
//                     value.getMinutes()
//                 ).padStart(2, "0"),
//                 String(
//                     value.getSeconds()
//                 ).padStart(2, "0"),
//             ].join(":");

//         return {
//             date,
//             time,
//         };
//     }

//     const text =
//         String(value).trim();

//     /*
//      * Preserve the timestamp returned by PostgreSQL.
//      *
//      * Example:
//      *
//      * 2026-09-08T16:18:03.071+06:00
//      *
//      * We intentionally extract the date/time directly
//      * instead of converting through the browser timezone.
//      */
//     const match =
//         text.match(
//             /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/
//         );

//     if (match) {
//         return {
//             date: match[1],
//             time: match[2],
//         };
//     }

//     const parsed =
//         new Date(text);

//     if (
//         Number.isNaN(
//             parsed.getTime()
//         )
//     ) {
//         return {
//             date: text,
//             time: "",
//         };
//     }

//     const date =
//         [
//             parsed.getFullYear(),
//             String(
//                 parsed.getMonth() + 1
//             ).padStart(2, "0"),
//             String(
//                 parsed.getDate()
//             ).padStart(2, "0"),
//         ].join("-");

//     const time =
//         [
//             String(
//                 parsed.getHours()
//             ).padStart(2, "0"),
//             String(
//                 parsed.getMinutes()
//             ).padStart(2, "0"),
//             String(
//                 parsed.getSeconds()
//             ).padStart(2, "0"),
//         ].join(":");

//     return {
//         date,
//         time,
//     };
// }

// /* ============================================================
//    COLUMN DISPLAY NAME
// ============================================================ */

// function getColumnDisplayName(
//     columnId: string
// ): string {
//     const names: Record<
//         string,
//         string
//     > = {
//         employeeId:
//             "Employee ID",

//         employee_id:
//             "Employee ID",

//         employee_name:
//             "Employee Name",

//         assigned_id:
//             "Assigned ID",

//         assigned_name:
//             "Assigned",

//         status:
//             "Status",

//         requisition_type:
//             "Requisition",

//         delivered_status:
//             "Delivery",

//         tt_no:
//             "TT No",

//         created_at:
//             "Created",

//         query_type:
//             "Query",

//         query:
//             "Query",

//         description:
//             "Description",

//         dept_name:
//             "Department",

//         department:
//             "Department",

//         func_name:
//             "Function",

//         function:
//             "Function",

//         mobile_no:
//             "Mobile No",

//         mobile:
//             "Mobile",

//         action:
//             "Action",

//         actions:
//             "Action",

//         age:
//             "Age",

//         tt_age:
//             "Age",
//     };

//     return (
//         names[columnId] ??
//         columnId
//     );
// }

// /* ============================================================
//    RESPONSIVE COLUMN WIDTH
// ============================================================ */

// function getColumnWidth(
//     columnId: string
// ): string | undefined {
//     const widths: Record<
//         string,
//         string
//     > = {
//         /*
//          * TT TABLE
//          *
//          * The widths intentionally stay below
//          * 100% so the table never creates an
//          * unnecessary horizontal scrollbar.
//          */

//         sl: "5%",
//         serial: "5%",
//         index: "5%",

//         tt_no: "11%",

//         employee_id: "9%",
//         employeeId: "9%",

//         assigned_id: "9%",
//         assigned_name: "10%",

//         query_type: "16%",
//         query: "16%",

//         age: "7%",
//         tt_age: "7%",

//         status: "7%",

//         requisition_type: "7%",

//         delivered_status: "7%",

//         created_at: "12%",

//         action: "10%",
//         actions: "10%",

//         employee_name: "11%",
//         dept_name: "10%",
//         department: "10%",
//         func_name: "10%",
//         mobile_no: "10%",
//     };

//     return widths[columnId];
// }

// /* ============================================================
//    GENERIC VALUE
// ============================================================ */

// function displayValue(
//     value: unknown
// ): string {
//     if (
//         value === null ||
//         value === undefined ||
//         String(value).trim() === ""
//     ) {
//         return "Not available";
//     }

//     if (
//         typeof value === "object"
//     ) {
//         try {
//             return JSON.stringify(
//                 value
//             );
//         } catch {
//             return String(value);
//         }
//     }

//     return String(value);
// }

// /* ============================================================
//    FIND VALUE BY POSSIBLE KEYS
// ============================================================ */

// function getRecordValue(
//     record: Record<string, unknown>,
//     keys: string[]
// ): unknown {
//     for (const key of keys) {
//         if (
//             record[key] !==
//             undefined &&
//             record[key] !== null &&
//             String(
//                 record[key]
//             ).trim() !== ""
//         ) {
//             return record[key];
//         }
//     }

//     return undefined;
// }

// /* ============================================================
//    EXPORT VALUE
// ============================================================ */

// function exportCellValue(
//     value: unknown
// ): string | number {
//     if (
//         value === null ||
//         value === undefined
//     ) {
//         return "";
//     }

//     if (
//         typeof value ===
//         "string" ||
//         typeof value ===
//         "number"
//     ) {
//         return value;
//     }

//     if (
//         typeof value ===
//         "boolean"
//     ) {
//         return value
//             ? "Yes"
//             : "No";
//     }

//     if (
//         value instanceof Date
//     ) {
//         return value.toISOString();
//     }

//     if (
//         typeof value === "object"
//     ) {
//         try {
//             return JSON.stringify(
//                 value
//             );
//         } catch {
//             return String(value);
//         }
//     }

//     return String(value);
// }

// /* ============================================================
//    DATA TABLE
// ============================================================ */

// export function DataTable<
//     TData,
//     TValue
// >({
//     columns,
//     data,
//     dateColumn = "date",
//     compact = false,
//     serverSideDateFilter = false,
//     itPersonalOptions = [],
//     appliedServerFilters,
//     emptyMessage =
//     "No results found.",
//     onApplyServerFilters,
// }: DataTableProps<
//     TData,
//     TValue
// >) {
//     /* ========================================================
//        TABLE STATE
//     ======================================================== */

//     const [
//         sorting,
//         setSorting,
//     ] =
//         React.useState<
//             SortingState
//         >([]);

//     const [
//         columnFilters,
//         setColumnFilters,
//     ] =
//         React.useState<
//             ColumnFiltersState
//         >([]);

//     const [
//         columnVisibility,
//         setColumnVisibility,
//     ] =
//         React.useState<
//             VisibilityState
//         >(
//             DEFAULT_HIDDEN_COLUMNS
//         );

//     /* ========================================================
//        SEARCH
//     ======================================================== */

//     const [
//         searchInput,
//         setSearchInput,
//     ] =
//         React.useState("");

//     const deferredSearch =
//         React.useDeferredValue(
//             searchInput
//         );

//     /* ========================================================
//        FILTER POPUP
//     ======================================================== */

//     const [
//         filterOpen,
//         setFilterOpen,
//     ] =
//         React.useState(false);

//     /* ========================================================
//        SERVER FILTER DRAFT
//     ======================================================== */

//     const [
//         fromDate,
//         setFromDate,
//     ] =
//         React.useState(
//             appliedServerFilters
//                 ?.fromDate ??
//             ""
//         );

//     const [
//         toDate,
//         setToDate,
//     ] =
//         React.useState(
//             appliedServerFilters
//                 ?.toDate ??
//             ""
//         );

//     const [
//         employeeId,
//         setEmployeeId,
//     ] =
//         React.useState(
//             appliedServerFilters
//                 ?.employeeId ??
//             ""
//         );

//     const [
//         status,
//         setStatus,
//     ] =
//         React.useState(
//             appliedServerFilters
//                 ?.status ??
//             ""
//         );

//     const [
//         itPersonal,
//         setItPersonal,
//     ] =
//         React.useState(
//             appliedServerFilters
//                 ?.itPersonal ??
//             ""
//         );

//     /* ========================================================
//        LOCAL APPLIED FILTERS
//     ======================================================== */

//     const [
//         localAppliedFilters,
//         setLocalAppliedFilters,
//     ] =
//         React.useState<
//             DataTableServerFilters
//         >(
//             appliedServerFilters ??
//             EMPTY_SERVER_FILTERS
//         );

//     const appliedFilters =
//         appliedServerFilters ??
//         localAppliedFilters;

//     /* ========================================================
//        SYNC PARENT FILTERS
//     ======================================================== */

//     React.useEffect(
//         () => {
//             if (
//                 !appliedServerFilters
//             ) {
//                 return;
//             }

//             setFromDate(
//                 appliedServerFilters
//                     .fromDate
//             );

//             setToDate(
//                 appliedServerFilters
//                     .toDate
//             );

//             setEmployeeId(
//                 appliedServerFilters
//                     .employeeId
//             );

//             setStatus(
//                 appliedServerFilters
//                     .status
//             );

//             setItPersonal(
//                 appliedServerFilters
//                     .itPersonal
//             );

//             setLocalAppliedFilters(
//                 appliedServerFilters
//             );
//         },
//         [
//             appliedServerFilters,
//         ]
//     );

//     /* ========================================================
//        LOCAL FILTERING
//     ======================================================== */

//     const filteredData =
//         React.useMemo(
//             () => {
//                 const searchText =
//                     deferredSearch
//                         .trim()
//                         .toLowerCase();

//                 return data.filter(
//                     (
//                         row: TData
//                     ) => {
//                         const record =
//                             row as Record<
//                                 string,
//                                 unknown
//                             >;

//                         const matchesSearch =
//                             !searchText ||
//                             Object.values(
//                                 record
//                             ).some(
//                                 (
//                                     value
//                                 ) =>
//                                     normalizeValue(
//                                         value
//                                     ).includes(
//                                         searchText
//                                     )
//                             );

//                         /*
//                          * Server mode:
//                          *
//                          * PostgreSQL handles
//                          * server filters.
//                          */
//                         if (
//                             serverSideDateFilter
//                         ) {
//                             return matchesSearch;
//                         }

//                         let matchesDate =
//                             true;

//                         if (
//                             fromDate ||
//                             toDate
//                         ) {
//                             const rowDate =
//                                 normalizeDateOnly(
//                                     record[
//                                     dateColumn
//                                     ]
//                                 );

//                             if (!rowDate) {
//                                 matchesDate =
//                                     false;
//                             } else {
//                                 if (
//                                     fromDate &&
//                                     rowDate <
//                                     fromDate
//                                 ) {
//                                     matchesDate =
//                                         false;
//                                 }

//                                 if (
//                                     toDate &&
//                                     rowDate >
//                                     toDate
//                                 ) {
//                                     matchesDate =
//                                         false;
//                                 }
//                             }
//                         }

//                         return (
//                             matchesSearch &&
//                             matchesDate
//                         );
//                     }
//                 );
//             },
//             [
//                 data,
//                 deferredSearch,
//                 fromDate,
//                 toDate,
//                 dateColumn,
//                 serverSideDateFilter,
//             ]
//         );

//     /* ========================================================
//        TANSTACK TABLE
//     ======================================================== */

//     const table =
//         useReactTable({
//             data: filteredData,
//             columns,

//             state: {
//                 sorting,
//                 columnFilters,
//                 columnVisibility,
//             },

//             onSortingChange:
//                 setSorting,

//             onColumnFiltersChange:
//                 setColumnFilters,

//             onColumnVisibilityChange:
//                 setColumnVisibility,

//             getCoreRowModel:
//                 getCoreRowModel(),

//             getFilteredRowModel:
//                 getFilteredRowModel(),

//             getPaginationRowModel:
//                 getPaginationRowModel(),

//             getSortedRowModel:
//                 getSortedRowModel(),
//         });

//     /* ========================================================
//        RESET PAGE ON SEARCH / DATA CHANGE
//     ======================================================== */

//     React.useEffect(
//         () => {
//             table.setPageIndex(
//                 0
//             );
//         },
//         [
//             deferredSearch,
//             data,
//             table,
//         ]
//     );

//     /* ========================================================
//        COLUMN REFERENCES
//     ======================================================== */

//     const statusColumn =
//         table
//             .getAllColumns()
//             .find(
//                 (
//                     column
//                 ) =>
//                     column.id ===
//                     "status"
//             );

//     /* ========================================================
//        FILTER COUNTS
//     ======================================================== */

//     const serverActiveFiltersCount =
//         (
//             searchInput.trim()
//                 ? 1
//                 : 0
//         ) +
//         (
//             appliedFilters.fromDate
//                 ? 1
//                 : 0
//         ) +
//         (
//             appliedFilters.toDate
//                 ? 1
//                 : 0
//         ) +
//         (
//             appliedFilters.employeeId
//                 ? 1
//                 : 0
//         ) +
//         (
//             appliedFilters.itPersonal
//                 ? 1
//                 : 0
//         ) +
//         (
//             appliedFilters.status
//                 ? 1
//                 : 0
//         );

//     const localActiveFiltersCount =
//         (
//             searchInput.trim()
//                 ? 1
//                 : 0
//         ) +
//         columnFilters.length +
//         (
//             fromDate ||
//                 toDate
//                 ? 1
//                 : 0
//         );

//     const activeFiltersCount =
//         serverSideDateFilter
//             ? serverActiveFiltersCount
//             : localActiveFiltersCount;

//     /* ========================================================
//        APPLY SERVER FILTERS
//     ======================================================== */

//     function updateAppliedFilters(
//         next: DataTableServerFilters
//     ) {
//         setLocalAppliedFilters(
//             next
//         );

//         onApplyServerFilters?.(
//             next
//         );

//         table.setPageIndex(
//             0
//         );
//     }

//     function applyFilters() {
//         if (
//             !serverSideDateFilter
//         ) {
//             setFilterOpen(
//                 false
//             );

//             return;
//         }

//         const next:
//             DataTableServerFilters =
//         {
//             fromDate:
//                 fromDate.trim(),

//             toDate:
//                 toDate.trim(),

//             employeeId:
//                 employeeId.trim(),

//             status:
//                 status.trim(),

//             itPersonal:
//                 itPersonal.trim(),
//         };

//         updateAppliedFilters(
//             next
//         );

//         setFilterOpen(false);
//     }

//     /* ========================================================
//        RESET FILTERS
//     ======================================================== */

//     function resetFilters() {
//         setSearchInput("");

//         setColumnFilters([]);

//         setFromDate("");
//         setToDate("");
//         setEmployeeId("");
//         setStatus("");
//         setItPersonal("");

//         const emptyFilters =
//             EMPTY_SERVER_FILTERS;

//         setLocalAppliedFilters(
//             emptyFilters
//         );

//         if (
//             serverSideDateFilter
//         ) {
//             onApplyServerFilters?.(
//                 emptyFilters
//             );
//         }

//         table.setPageIndex(
//             0
//         );

//         setFilterOpen(false);
//     }

//     /* ========================================================
//        EXCEL EXPORT
//     ======================================================== */

//     function exportToExcel() {
//         const visibleColumns =
//             table
//                 .getVisibleLeafColumns()
//                 .filter(
//                     (
//                         column
//                     ) =>
//                         column.id !==
//                         "actions" &&
//                         column.id !==
//                         "action"
//                 );

//         const exportRows =
//             filteredData.map(
//                 (
//                     row
//                 ) => {
//                     const record =
//                         row as Record<
//                             string,
//                             unknown
//                         >;

//                     const output:
//                         Record<
//                             string,
//                             string | number
//                         > = {};

//                     visibleColumns.forEach(
//                         (
//                             column
//                         ) => {
//                             const header =
//                                 column
//                                     .columnDef
//                                     .header;

//                             const label =
//                                 typeof header ===
//                                     "string"
//                                     ? header
//                                     : getColumnDisplayName(
//                                         column.id
//                                     );

//                             output[
//                                 label
//                             ] =
//                                 exportCellValue(
//                                     record[
//                                     column.id
//                                     ]
//                                 );
//                         }
//                     );

//                     return output;
//                 }
//             );

//         const worksheet =
//             XLSX.utils.json_to_sheet(
//                 exportRows
//             );

//         const workbook =
//             XLSX.utils.book_new();

//         XLSX.utils.book_append_sheet(
//             workbook,
//             worksheet,
//             "Data"
//         );

//         XLSX.writeFile(
//             workbook,
//             "itm-data.xlsx"
//         );
//     }

//     /* ========================================================
//        VISIBLE COLUMN COUNT
//     ======================================================== */

//     const visibleColumnCount =
//         Math.max(
//             table
//                 .getVisibleLeafColumns()
//                 .length,
//             1
//         );

//     /* ========================================================
//        STYLES
//     ======================================================== */

//     const toolbarButtonClass =
//         compact
//             ? "h-8 px-2.5 text-[10px]"
//             : "h-9 px-3 text-xs";

//     const toolbarIconClass =
//         compact
//             ? "mr-1.5 h-3.5 w-3.5"
//             : "mr-2 h-4 w-4";

//     const searchHeight =
//         compact
//             ? "h-8"
//             : "h-9";

//     const searchText =
//         compact
//             ? "text-[10px]"
//             : "text-xs";

//     const badgeClass =
//         compact
//             ? "h-6 gap-1 px-2 text-[9px]"
//             : "h-7 gap-1 px-2 text-[10px]";

//     /* ========================================================
//        RENDER
//     ======================================================== */

//     return (
//         <div className="w-full min-w-0 space-y-2.5">

//             {/* ==================================================
//                 TOOLBAR
//             ================================================== */}

//             <div
//                 className="
//                     flex
//                     w-full
//                     min-w-0
//                     items-center
//                     gap-2
//                 "
//             >
//                 {/* SEARCH */}

//                 <div
//                     className="
//                         relative
//                         min-w-0
//                         flex-1
//                     "
//                 >
//                     <Search
//                         className="
//                             pointer-events-none
//                             absolute
//                             left-2.5
//                             top-1/2
//                             h-3.5
//                             w-3.5
//                             -translate-y-1/2
//                             text-muted-foreground
//                         "
//                     />

//                     <Input
//                         value={
//                             searchInput
//                         }
//                         onChange={(
//                             event
//                         ) =>
//                             setSearchInput(
//                                 event
//                                     .target
//                                     .value
//                             )
//                         }
//                         placeholder="Search TT, employee, query, status..."
//                         className={`
//                             w-full
//                             ${searchHeight}
//                             ${searchText}
//                             pl-8
//                             pr-8
//                         `}
//                     />

//                     {searchInput && (
//                         <button
//                             type="button"
//                             onClick={() =>
//                                 setSearchInput(
//                                     ""
//                                 )
//                             }
//                             className="
//                                 absolute
//                                 right-2
//                                 top-1/2
//                                 flex
//                                 h-5
//                                 w-5
//                                 -translate-y-1/2
//                                 items-center
//                                 justify-center
//                                 rounded-full
//                                 text-muted-foreground
//                                 transition-colors
//                                 hover:bg-muted
//                                 hover:text-foreground
//                             "
//                             aria-label="Clear search"
//                         >
//                             <X className="h-3 w-3" />
//                         </button>
//                     )}
//                 </div>

//                 {/* FILTER */}

//                 <DropdownMenu
//                     open={
//                         filterOpen
//                     }
//                     onOpenChange={
//                         setFilterOpen
//                     }
//                 >
//                     <DropdownMenuTrigger
//                         asChild
//                     >
//                         <Button
//                             type="button"
//                             variant="outline"
//                             className={`
//                                 shrink-0
//                                 border-emerald-300
//                                 bg-emerald-50
//                                 text-emerald-700
//                                 hover:bg-emerald-100
//                                 ${toolbarButtonClass}
//                             `}
//                         >
//                             <Filter
//                                 className={
//                                     toolbarIconClass
//                                 }
//                             />

//                             Filter

//                             {activeFiltersCount >
//                                 0 && (
//                                     <span
//                                         className="
//                                         ml-1
//                                         inline-flex
//                                         h-4
//                                         min-w-4
//                                         items-center
//                                         justify-center
//                                         rounded-full
//                                         bg-emerald-600
//                                         px-1
//                                         text-[8px]
//                                         font-bold
//                                         text-white
//                                     "
//                                     >
//                                         {
//                                             activeFiltersCount
//                                         }
//                                     </span>
//                                 )}
//                         </Button>
//                     </DropdownMenuTrigger>

//                     <DropdownMenuContent
//                         align="start"
//                         sideOffset={6}
//                         className="
//                             w-[310px]
//                             max-w-[calc(100vw-24px)]
//                             p-3
//                         "
//                     >
//                         <DropdownMenuLabel
//                             className="
//                                 px-0
//                                 pb-2
//                                 text-xs
//                                 font-semibold
//                             "
//                         >
//                             Trouble Ticket Filters
//                         </DropdownMenuLabel>

//                         <DropdownMenuSeparator />

//                         <div className="space-y-3 pt-3">

//                             {/* DATE */}

//                             <div
//                                 className="
//                                     grid
//                                     grid-cols-2
//                                     gap-2
//                                 "
//                             >
//                                 <div className="space-y-1">
//                                     <label
//                                         className="
//                                             text-[9px]
//                                             font-semibold
//                                             text-muted-foreground
//                                         "
//                                     >
//                                         From Date
//                                     </label>

//                                     <Input
//                                         type="date"
//                                         value={
//                                             fromDate
//                                         }
//                                         onChange={(
//                                             event
//                                         ) =>
//                                             setFromDate(
//                                                 event
//                                                     .target
//                                                     .value
//                                             )
//                                         }
//                                         className="
//                                             h-8
//                                             text-[10px]
//                                         "
//                                     />
//                                 </div>

//                                 <div className="space-y-1">
//                                     <label
//                                         className="
//                                             text-[9px]
//                                             font-semibold
//                                             text-muted-foreground
//                                         "
//                                     >
//                                         To Date
//                                     </label>

//                                     <Input
//                                         type="date"
//                                         value={
//                                             toDate
//                                         }
//                                         onChange={(
//                                             event
//                                         ) =>
//                                             setToDate(
//                                                 event
//                                                     .target
//                                                     .value
//                                             )
//                                         }
//                                         className="
//                                             h-8
//                                             text-[10px]
//                                         "
//                                     />
//                                 </div>
//                             </div>

//                             {/* EMPLOYEE */}

//                             <div className="space-y-1">
//                                 <label
//                                     className="
//                                         text-[9px]
//                                         font-semibold
//                                         text-muted-foreground
//                                     "
//                                 >
//                                     Employee ID
//                                 </label>

//                                 <Input
//                                     value={
//                                         employeeId
//                                     }
//                                     onChange={(
//                                         event
//                                     ) =>
//                                         setEmployeeId(
//                                             event
//                                                 .target
//                                                 .value
//                                         )
//                                     }
//                                     placeholder="e.g. 02-0407"
//                                     className="
//                                         h-8
//                                         text-[10px]
//                                     "
//                                 />
//                             </div>

//                             {/* IT PERSONNEL */}

//                             {itPersonalOptions.length >
//                                 0 && (
//                                     <div className="space-y-1">
//                                         <label
//                                             className="
//                                             text-[9px]
//                                             font-semibold
//                                             text-muted-foreground
//                                         "
//                                         >
//                                             Assigned IT Personnel
//                                         </label>

//                                         <select
//                                             value={
//                                                 itPersonal
//                                             }
//                                             onChange={(
//                                                 event
//                                             ) =>
//                                                 setItPersonal(
//                                                     event
//                                                         .target
//                                                         .value
//                                                 )
//                                             }
//                                             className="
//                                             h-8
//                                             w-full
//                                             rounded-md
//                                             border
//                                             border-input
//                                             bg-background
//                                             px-2
//                                             text-[10px]
//                                             outline-none
//                                             focus:ring-2
//                                             focus:ring-ring
//                                         "
//                                         >
//                                             <option value="">
//                                                 All IT Personnel
//                                             </option>

//                                             {itPersonalOptions.map(
//                                                 (
//                                                     option
//                                                 ) => (
//                                                     <option
//                                                         key={
//                                                             option.value
//                                                         }
//                                                         value={
//                                                             option.value
//                                                         }
//                                                     >
//                                                         {
//                                                             option.label
//                                                         }
//                                                     </option>
//                                                 )
//                                             )}
//                                         </select>
//                                     </div>
//                                 )}

//                             {/* STATUS */}

//                             {statusColumn && (
//                                 <div className="space-y-1">
//                                     <label
//                                         className="
//                                             text-[9px]
//                                             font-semibold
//                                             text-muted-foreground
//                                         "
//                                     >
//                                         Status
//                                     </label>

//                                     <select
//                                         value={
//                                             status
//                                         }
//                                         onChange={(
//                                             event
//                                         ) =>
//                                             setStatus(
//                                                 event
//                                                     .target
//                                                     .value
//                                             )
//                                         }
//                                         className="
//                                             h-8
//                                             w-full
//                                             rounded-md
//                                             border
//                                             border-input
//                                             bg-background
//                                             px-2
//                                             text-[10px]
//                                             outline-none
//                                             focus:ring-2
//                                             focus:ring-ring
//                                         "
//                                     >
//                                         <option value="">
//                                             All Status
//                                         </option>

//                                         <option value="Open">
//                                             Open
//                                         </option>

//                                         <option value="Closed">
//                                             Closed
//                                         </option>
//                                     </select>
//                                 </div>
//                             )}

//                             {/* BUTTONS */}

//                             <div
//                                 className="
//                                     flex
//                                     items-center
//                                     justify-between
//                                     gap-2
//                                     border-t
//                                     pt-3
//                                 "
//                             >
//                                 <Button
//                                     type="button"
//                                     variant="ghost"
//                                     onClick={
//                                         resetFilters
//                                     }
//                                     className="
//                                         h-8
//                                         px-2
//                                         text-[10px]
//                                         text-destructive
//                                         hover:bg-destructive/10
//                                     "
//                                 >
//                                     <X className="mr-1 h-3 w-3" />

//                                     Clear
//                                 </Button>

//                                 <Button
//                                     type="button"
//                                     onClick={
//                                         applyFilters
//                                     }
//                                     className="
//                                         h-8
//                                         px-3
//                                         text-[10px]
//                                     "
//                                 >
//                                     Apply Filters
//                                 </Button>
//                             </div>
//                         </div>
//                     </DropdownMenuContent>
//                 </DropdownMenu>

//                 {/* RIGHT ACTIONS */}

//                 <div
//                     className="
//                         ml-auto
//                         flex
//                         shrink-0
//                         items-center
//                         gap-1.5
//                     "
//                 >
//                     {/* COLUMNS */}

//                     <DropdownMenu>
//                         <DropdownMenuTrigger
//                             asChild
//                         >
//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 className={
//                                     toolbarButtonClass
//                                 }
//                             >
//                                 <SlidersHorizontal
//                                     className={
//                                         toolbarIconClass
//                                     }
//                                 />

//                                 Columns
//                             </Button>
//                         </DropdownMenuTrigger>

//                         <DropdownMenuContent
//                             align="end"
//                             className="
//                                 max-h-[420px]
//                                 w-64
//                                 overflow-y-auto
//                             "
//                         >
//                             <DropdownMenuLabel
//                                 className={
//                                     compact
//                                         ? "text-[10px]"
//                                         : "text-xs"
//                                 }
//                             >
//                                 Show / Hide Columns
//                             </DropdownMenuLabel>

//                             <DropdownMenuSeparator />

//                             <div className="py-1">
//                                 {table
//                                     .getAllColumns()
//                                     .filter(
//                                         (
//                                             column
//                                         ) =>
//                                             column.getCanHide()
//                                     )
//                                     .map(
//                                         (
//                                             column
//                                         ) => {
//                                             const header =
//                                                 column
//                                                     .columnDef
//                                                     .header;

//                                             const label =
//                                                 typeof header ===
//                                                     "string"
//                                                     ? header
//                                                     : getColumnDisplayName(
//                                                         column.id
//                                                     );

//                                             const visible =
//                                                 column.getIsVisible();

//                                             return (
//                                                 <DropdownMenuCheckboxItem
//                                                     key={
//                                                         column.id
//                                                     }
//                                                     checked={
//                                                         visible
//                                                     }
//                                                     onCheckedChange={(
//                                                         checked
//                                                     ) =>
//                                                         column.toggleVisibility(
//                                                             Boolean(
//                                                                 checked
//                                                             )
//                                                         )
//                                                     }
//                                                     className="text-[10px]"
//                                                 >
//                                                     <span className="mr-2">
//                                                         {visible ? (
//                                                             <Eye className="h-3.5 w-3.5" />
//                                                         ) : (
//                                                             <EyeOff className="h-3.5 w-3.5" />
//                                                         )}
//                                                     </span>

//                                                     {
//                                                         label
//                                                     }
//                                                 </DropdownMenuCheckboxItem>
//                                             );
//                                         }
//                                     )}
//                             </div>
//                         </DropdownMenuContent>
//                     </DropdownMenu>

//                     {/* EXCEL */}

//                     <Button
//                         type="button"
//                         variant="outline"
//                         onClick={
//                             exportToExcel
//                         }
//                         className={
//                             toolbarButtonClass
//                         }
//                     >
//                         <Download
//                             className={
//                                 toolbarIconClass
//                             }
//                         />

//                         Excel
//                     </Button>
//                 </div>
//             </div>

//             {/* ==================================================
//                 ACTIVE FILTERS
//             ================================================== */}

//             {activeFiltersCount >
//                 0 && (
//                     <div
//                         className="
//                         flex
//                         min-w-0
//                         flex-wrap
//                         items-center
//                         gap-1.5
//                     "
//                     >
//                         {searchInput.trim() && (
//                             <Badge
//                                 variant="outline"
//                                 className={
//                                     badgeClass
//                                 }
//                             >
//                                 <span className="font-semibold text-primary">
//                                     Search:
//                                 </span>

//                                 <span
//                                     className="
//                                     max-w-[220px]
//                                     truncate
//                                     font-medium
//                                 "
//                                     title={
//                                         searchInput
//                                     }
//                                 >
//                                     {
//                                         searchInput
//                                     }
//                                 </span>

//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setSearchInput(
//                                             ""
//                                         )
//                                     }
//                                     className="
//                                     ml-0.5
//                                     inline-flex
//                                     h-4
//                                     w-4
//                                     items-center
//                                     justify-center
//                                     rounded-full
//                                     text-muted-foreground
//                                     hover:bg-destructive/10
//                                     hover:text-destructive
//                                 "
//                                     aria-label="Clear search"
//                                 >
//                                     <X className="h-3 w-3" />
//                                 </button>
//                             </Badge>
//                         )}

//                         {serverSideDateFilter ? (
//                             <>
//                                 {appliedFilters.employeeId && (
//                                     <Badge
//                                         variant="outline"
//                                         className={
//                                             badgeClass
//                                         }
//                                     >
//                                         <span className="font-semibold text-primary">
//                                             Employee:
//                                         </span>

//                                         <span>
//                                             {
//                                                 appliedFilters.employeeId
//                                             }
//                                         </span>
//                                     </Badge>
//                                 )}

//                                 {appliedFilters.itPersonal && (
//                                     <Badge
//                                         variant="outline"
//                                         className={
//                                             badgeClass
//                                         }
//                                     >
//                                         <span className="font-semibold text-primary">
//                                             Assigned:
//                                         </span>

//                                         <span>
//                                             {
//                                                 appliedFilters.itPersonal
//                                             }
//                                         </span>
//                                     </Badge>
//                                 )}

//                                 {appliedFilters.status && (
//                                     <Badge
//                                         variant="outline"
//                                         className={
//                                             badgeClass
//                                         }
//                                     >
//                                         <span className="font-semibold text-primary">
//                                             Status:
//                                         </span>

//                                         <span>
//                                             {
//                                                 appliedFilters.status
//                                             }
//                                         </span>
//                                     </Badge>
//                                 )}

//                                 {(
//                                     appliedFilters.fromDate ||
//                                     appliedFilters.toDate
//                                 ) && (
//                                         <Badge
//                                             variant="outline"
//                                             className={
//                                                 badgeClass
//                                             }
//                                         >
//                                             <span className="font-semibold text-primary">
//                                                 Date:
//                                             </span>

//                                             <span>
//                                                 {
//                                                     appliedFilters.fromDate ||
//                                                     "Start"
//                                                 }

//                                                 {" — "}

//                                                 {
//                                                     appliedFilters.toDate ||
//                                                     "Now"
//                                                 }
//                                             </span>
//                                         </Badge>
//                                     )}
//                             </>
//                         ) : (
//                             <>
//                                 {columnFilters.map(
//                                     (
//                                         filter
//                                     ) => (
//                                         <Badge
//                                             key={
//                                                 filter.id
//                                             }
//                                             variant="outline"
//                                             className={
//                                                 badgeClass
//                                             }
//                                         >
//                                             <span className="font-semibold text-primary">
//                                                 {getColumnDisplayName(
//                                                     filter.id
//                                                 )}
//                                                 :
//                                             </span>

//                                             <span>
//                                                 {String(
//                                                     filter.value
//                                                 )}
//                                             </span>

//                                             <button
//                                                 type="button"
//                                                 onClick={() =>
//                                                     setColumnFilters(
//                                                         (
//                                                             current
//                                                         ) =>
//                                                             current.filter(
//                                                                 (
//                                                                     item
//                                                                 ) =>
//                                                                     item.id !==
//                                                                     filter.id
//                                                             )
//                                                     )
//                                                 }
//                                                 className="
//                                                 ml-0.5
//                                                 inline-flex
//                                                 h-4
//                                                 w-4
//                                                 items-center
//                                                 justify-center
//                                                 rounded-full
//                                                 text-muted-foreground
//                                                 hover:bg-destructive/10
//                                                 hover:text-destructive
//                                             "
//                                             >
//                                                 <X className="h-3 w-3" />
//                                             </button>
//                                         </Badge>
//                                     )
//                                 )}

//                                 {(
//                                     fromDate ||
//                                     toDate
//                                 ) && (
//                                         <Badge
//                                             variant="outline"
//                                             className={
//                                                 badgeClass
//                                             }
//                                         >
//                                             <span className="font-semibold text-primary">
//                                                 Date:
//                                             </span>

//                                             <span>
//                                                 {
//                                                     fromDate ||
//                                                     "Start"
//                                                 }

//                                                 {" — "}

//                                                 {
//                                                     toDate ||
//                                                     "Now"
//                                                 }
//                                             </span>
//                                         </Badge>
//                                     )}
//                             </>
//                         )}

//                         <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={
//                                 resetFilters
//                             }
//                             className="
//                             h-7
//                             shrink-0
//                             px-2.5
//                             text-[10px]
//                             font-semibold
//                             text-destructive
//                             hover:bg-destructive/10
//                             hover:text-destructive
//                         "
//                         >
//                             <X className="mr-1 h-3.5 w-3.5" />

//                             Clear all
//                         </Button>
//                     </div>
//                 )}

//             {/* ==================================================
//                 TABLE
//             ================================================== */}

//             <div
//                 className={`
//                     relative
//                     w-full
//                     min-w-0
//                     overflow-hidden
//                     border
//                     border-border
//                     bg-card

//                     ${compact
//                         ? "rounded-lg"
//                         : "rounded-xl"
//                     }
//                 `}
//             >
//                 <Table
//                     className={`
//                         w-full
//                         table-fixed
//                         border-collapse
//                         ${compact
//                             ? "text-[9px]"
//                             : "text-[10px]"
//                         }
//                     `}
//                 >
//                     <TableHeader>
//                         {table
//                             .getHeaderGroups()
//                             .map(
//                                 (
//                                     headerGroup
//                                 ) => (
//                                     <TableRow
//                                         key={
//                                             headerGroup.id
//                                         }
//                                         className="
//                                             hover:bg-transparent
//                                         "
//                                     >
//                                         {headerGroup.headers.map(
//                                             (
//                                                 header
//                                             ) => {
//                                                 const width =
//                                                     getColumnWidth(
//                                                         header
//                                                             .column
//                                                             .id
//                                                     );

//                                                 return (
//                                                     <TableHead
//                                                         key={
//                                                             header.id
//                                                         }
//                                                         className={`
//                                                             overflow-hidden
//                                                             border-b
//                                                             bg-muted/60
//                                                             text-center
//                                                             font-semibold
//                                                             uppercase
//                                                             tracking-wide
//                                                             text-muted-foreground

//                                                             ${compact
//                                                                 ? "h-8 px-1 py-1 text-[8px]"
//                                                                 : "px-2 py-2 text-[9px]"
//                                                             }
//                                                         `}
//                                                         style={{
//                                                             width,
//                                                         }}
//                                                     >
//                                                         {header.isPlaceholder
//                                                             ? null
//                                                             : flexRender(
//                                                                 header
//                                                                     .column
//                                                                     .columnDef
//                                                                     .header,
//                                                                 header.getContext()
//                                                             )}
//                                                     </TableHead>
//                                                 );
//                                             }
//                                         )}
//                                     </TableRow>
//                                 )
//                             )}
//                     </TableHeader>

//                     <TableBody>
//                         {table
//                             .getRowModel()
//                             .rows.length ? (
//                             table
//                                 .getRowModel()
//                                 .rows
//                                 .map(
//                                     (
//                                         row
//                                     ) => {
//                                         const record =
//                                             row.original as Record<
//                                                 string,
//                                                 unknown
//                                             >;

//                                         return (
//                                             <TableRow
//                                                 key={
//                                                     row.id
//                                                 }
//                                                 className={`
//                                                     group
//                                                     relative
//                                                     border-b
//                                                     border-border/70
//                                                     transition-all
//                                                     duration-200
//                                                     ease-out

//                                                     hover:bg-primary/[0.045]
//                                                     hover:shadow-[inset_3px_0_0_hsl(var(--primary)/0.65)]
//                                                     hover:relative
//                                                     hover:z-10

//                                                     ${compact
//                                                         ? "h-8"
//                                                         : ""
//                                                     }
//                                                 `}
//                                             >
//                                                 {row
//                                                     .getVisibleCells()
//                                                     .map(
//                                                         (
//                                                             cell
//                                                         ) => {
//                                                             const width =
//                                                                 getColumnWidth(
//                                                                     cell
//                                                                         .column
//                                                                         .id
//                                                                 );

//                                                             const columnId =
//                                                                 cell
//                                                                     .column
//                                                                     .id;

//                                                             const isAction =
//                                                                 columnId ===
//                                                                 "action" ||
//                                                                 columnId ===
//                                                                 "actions";

//                                                             const isCreated =
//                                                                 columnId ===
//                                                                 "created_at";

//                                                             const isQuery =
//                                                                 columnId ===
//                                                                 "query_type" ||
//                                                                 columnId ===
//                                                                 "query";

//                                                             const rawValue =
//                                                                 record[
//                                                                 columnId
//                                                                 ];

//                                                             return (
//                                                                 <TableCell
//                                                                     key={
//                                                                         cell.id
//                                                                     }
//                                                                     className={`
//                                                                         overflow-hidden
//                                                                         text-center
//                                                                         align-middle

//                                                                         ${compact
//                                                                             ? "h-8 px-1 py-[3px] text-[9px]"
//                                                                             : "px-2 py-2 text-[10px]"
//                                                                         }

//                                                                         ${columnId ===
//                                                                             "tt_no"
//                                                                             ? "font-semibold text-primary"
//                                                                             : ""
//                                                                         }

//                                                                         ${isAction
//                                                                             ? "relative z-30"
//                                                                             : ""
//                                                                         }
//                                                                     `}
//                                                                     style={{
//                                                                         width,
//                                                                     }}
//                                                                 >
//                                                                     <div
//                                                                         className="
//                                                                             min-w-0
//                                                                             max-w-full
//                                                                             overflow-hidden
//                                                                         "
//                                                                     >
//                                                                         {isCreated ? (
//                                                                             (() => {
//                                                                                 const created =
//                                                                                     formatCreatedDateTime(
//                                                                                         rawValue
//                                                                                     );

//                                                                                 return (
//                                                                                     <div
//                                                                                         className="
//                                                                                             flex
//                                                                                             min-w-0
//                                                                                             flex-col
//                                                                                             items-center
//                                                                                             justify-center
//                                                                                             leading-tight
//                                                                                         "
//                                                                                         title={`${created.date} ${created.time}`}
//                                                                                     >
//                                                                                         <span
//                                                                                             className="
//                                                                                                 whitespace-nowrap
//                                                                                                 font-medium
//                                                                                                 text-foreground
//                                                                                             "
//                                                                                         >
//                                                                                             {
//                                                                                                 created.date
//                                                                                             }
//                                                                                         </span>

//                                                                                         <span
//                                                                                             className="
//                                                                                                 mt-0.5
//                                                                                                 whitespace-nowrap
//                                                                                                 font-mono
//                                                                                                 text-[10px]
//                                                                                                 font-medium
//                                                                                                 text-muted-foreground
//                                                                                             "
//                                                                                         >
//                                                                                             {
//                                                                                                 created.time
//                                                                                             }
//                                                                                         </span>
//                                                                                     </div>
//                                                                                 );
//                                                                             })()
//                                                                         ) : isQuery ? (
//                                                                             <div
//                                                                                 className="
//                                                                                     mx-auto
//                                                                                     min-w-0
//                                                                                     max-w-full
//                                                                                     truncate
//                                                                                     px-1
//                                                                                 "
//                                                                                 title={
//                                                                                     rawValue !==
//                                                                                         null &&
//                                                                                         rawValue !==
//                                                                                         undefined
//                                                                                         ? String(
//                                                                                             rawValue
//                                                                                         )
//                                                                                         : undefined
//                                                                                 }
//                                                                             >
//                                                                                 {flexRender(
//                                                                                     cell
//                                                                                         .column
//                                                                                         .columnDef
//                                                                                         .cell,
//                                                                                     cell.getContext()
//                                                                                 )}
//                                                                             </div>
//                                                                         ) : (
//                                                                             flexRender(
//                                                                                 cell
//                                                                                     .column
//                                                                                     .columnDef
//                                                                                     .cell,
//                                                                                 cell.getContext()
//                                                                             )
//                                                                         )}
//                                                                     </div>
//                                                                 </TableCell>
//                                                             );
//                                                         }
//                                                     )}
//                                             </TableRow>
//                                         );
//                                     }
//                                 )
//                         ) : (
//                             <TableRow>
//                                 <TableCell
//                                     colSpan={
//                                         visibleColumnCount
//                                     }
//                                     className={
//                                         compact
//                                             ? "h-24 text-center text-[10px] font-medium text-muted-foreground"
//                                             : "h-32 text-center text-sm font-medium text-muted-foreground"
//                                     }
//                                 >
//                                     {
//                                         emptyMessage
//                                     }
//                                 </TableCell>
//                             </TableRow>
//                         )}
//                     </TableBody>
//                 </Table>

//             </div>

//             {/* ==================================================
//                 PAGINATION
//             ================================================== */}

//             <div
//                 className={`
//                     flex
//                     items-center
//                     justify-between
//                     gap-3

//                     ${compact
//                         ? "px-0.5"
//                         : "px-1"
//                     }
//                 `}
//             >
//                 <p
//                     className={
//                         compact
//                             ? "text-[10px] text-muted-foreground"
//                             : "text-xs text-muted-foreground"
//                     }
//                 >
//                     Page{" "}

//                     <span className="font-medium text-foreground">
//                         {table
//                             .getState()
//                             .pagination
//                             .pageIndex +
//                             1}
//                     </span>

//                     {" "}

//                     of{" "}

//                     <span className="font-medium text-foreground">
//                         {Math.max(
//                             table.getPageCount(),
//                             1
//                         )}
//                     </span>
//                 </p>

//                 <div
//                     className={
//                         compact
//                             ? "flex items-center gap-1.5"
//                             : "flex items-center gap-2"
//                     }
//                 >
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() =>
//                             table.previousPage()
//                         }
//                         disabled={
//                             !table.getCanPreviousPage()
//                         }
//                         className={
//                             compact
//                                 ? "h-7 px-2.5 text-[10px]"
//                                 : "h-8 text-xs"
//                         }
//                     >
//                         Previous
//                     </Button>

//                     <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() =>
//                             table.nextPage()
//                         }
//                         disabled={
//                             !table.getCanNextPage()
//                         }
//                         className={
//                             compact
//                                 ? "h-7 px-2.5 text-[10px]"
//                                 : "h-8 text-xs"
//                         }
//                     >
//                         Next
//                     </Button>
//                 </div>
//             </div>
//         </div>
//     );
// }