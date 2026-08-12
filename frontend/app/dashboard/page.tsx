
//itm/frontend/app/dashboard/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import OverviewChart from "@/components/overview-chart";
import { DataTable } from "@/components/data-table";
import {
    columns,
    toSection,
} from "@/components/tt-columns";

import type {
    Section,
} from "@/types/tt";

import {
    dashboardApi,
    reportApi,
    type DashboardSummary,
    type NonOperationalSummary,
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

/* ── Shared helpers ────────────────────────────────────────────────── */

function CardShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
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
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {title}
            </h3>

            <div className="flex items-center gap-1.5">
                <span
                    onClick={onKpiClick}
                    className={`text-lg font-bold tabular-nums ${kpiClass} ${onKpiClick ? "cursor-pointer hover:underline" : ""
                        }`}
                >
                    {kpi}
                </span>

                {badge && (
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
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
                grid grid-cols-[minmax(0,1fr)_28px]
                items-center gap-2 rounded-lg px-1.5 py-1.5
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
                    style={{ backgroundColor: color }}
                />

                <span
                    title={label}
                    className={`
                        min-w-0 text-muted-foreground
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
                    w-7 shrink-0 text-right text-[10px]
                    font-bold tabular-nums text-foreground
                "
            >
                {typeof value === "number"
                    ? value.toLocaleString()
                    : value}
            </span>
        </div>
    );
}

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
        boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
    },
};

const PieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, value } = props;

    if (!value || percent <= 0) return null;

    const RADIAN = Math.PI / 180;
    //const radius = outerRadius + 12;

    const radius = outerRadius + 5;

    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="#111827"
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
            fontSize={9}
            fontWeight={700}
        >
            {(percent * 100).toFixed(1)}%
        </text>
    );
};

function colorByLabel(label: string) {
    const key = label.toLowerCase();

    if (key.includes("assigned")) return "#3b82f6";
    if (key.includes("transfer")) return "#f59e0b";
    if (key.includes("return")) return "#10b981";
    if (key.includes("available") || key.includes("stored")) return "#8b5cf6";

    if (key.includes("lost")) return "#ef4444";
    if (key.includes("damage")) return "#f59e0b";
    if (key.includes("ownership")) return "#10b981";

    if (key.includes("claim")) return "#f97316";
    if (key.includes("vendor")) return "#8b5cf6";
    if (key.includes("recover")) return "#3b82f6";
    if (key.includes("expired")) return "#ef4444";
    if (key.includes("closed")) return "#10b981";
    if (key.includes("service")) return "#3b82f6";

    return "#64748b";
}

function getSummaryValue(
    items: { label: string; value: number }[],
    keyword: string
) {
    return (
        items.find((item) =>
            item.label.toLowerCase().includes(keyword.toLowerCase())
        )?.value ?? 0
    );
}

function hideDashboardLabels(
    items: { label: string; value: number }[],
    hiddenLabels: string[]
) {
    const hidden = hiddenLabels.map((label) => label.toLowerCase());

    return items.filter(
        (item) => !hidden.includes(item.label.toLowerCase())
    );
}

/* ── Static chart data until backend monthly trend APIs are added ───── */

const resignationAreaData = [
    { month: "Jan", pending: 2, completed: 5, inprocess: 1 },
    { month: "Feb", pending: 1, completed: 4, inprocess: 2 },
    { month: "Mar", pending: 2, completed: 3, inprocess: 1 },
    { month: "Apr", pending: 5, completed: 3, inprocess: 2 },
    { month: "May", pending: 3, completed: 6, inprocess: 2 },
    { month: "Jun", pending: 4, completed: 7, inprocess: 1 },
];

const resignationPendingTotal = resignationAreaData.reduce(
    (sum, item) => sum + item.pending,
    0
);

const resignationCompletedTotal = resignationAreaData.reduce(
    (sum, item) => sum + item.completed,
    0
);

const resignationInProcessTotal = resignationAreaData.reduce(
    (sum, item) => sum + item.inprocess,
    0
);

const resignationLegend = [
    {
        label: "Pending Clearance",
        value: resignationPendingTotal,
        color: "#f59e0b",
        status: "Pending Clearance",
    },
    {
        label: "Completed",
        value: resignationCompletedTotal,
        color: "#10b981",
        status: "Completed",
    },
    {
        label: "In Process",
        value: resignationInProcessTotal,
        color: "#3b82f6",
        status: "In Process",
    },
];

const renewalBarData = [
    { month: "Jan", upcoming: 5, completed: 10, delayed: 2 },
    { month: "Feb", upcoming: 4, completed: 9, delayed: 3 },
    { month: "Mar", upcoming: 6, completed: 12, delayed: 2 },
    { month: "Apr", upcoming: 5, completed: 14, delayed: 3 },
    { month: "May", upcoming: 7, completed: 11, delayed: 1 },
    { month: "Jun", upcoming: 6, completed: 13, delayed: 2 },
];

const renewalUpcomingTotal = renewalBarData.reduce(
    (sum, item) => sum + item.upcoming,
    0
);

const renewalCompletedTotal = renewalBarData.reduce(
    (sum, item) => sum + item.completed,
    0
);

const renewalDelayedTotal = renewalBarData.reduce(
    (sum, item) => sum + item.delayed,
    0
);

const renewalLegend = [
    {
        label: "Upcoming Renewals",
        value: renewalUpcomingTotal,
        color: "#f59e0b",
        status: "Upcoming Renewals",
    },
    {
        label: "Completed",
        value: renewalCompletedTotal,
        color: "#10b981",
        status: "Completed",
    },
    {
        label: "Delayed",
        value: renewalDelayedTotal,
        color: "#ef4444",
        status: "Delayed",
    },
];

/* ── Page ──────────────────────────────────────────────────────────── */

export default function DashboardPage() {
    const router = useRouter();

    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [nonOpSummary, setNonOpSummary] =
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

    const [nonOpLoading, setNonOpLoading] = useState(true);

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
        itPersonal: "",
    });

    useEffect(() => {
        let mounted = true;

        const emptyWarranty = {
            total: 0,
            items: [
                { label: "Claimed", value: 0 },
                { label: "To Vendor", value: 0 },
                { label: "Recovered", value: 0 },
                { label: "Expired", value: 0 },
            ],
        };

        const emptyServiceRequests = {
            total: 0,
            items: [
                { label: "Service Request", value: 0 },
                { label: "Transferred to Vendor", value: 0 },
                { label: "Closed", value: 0 },
            ],
        };

        function settledError(
            result: PromiseSettledResult<unknown>
        ): string | null {
            if (result.status === "fulfilled") {
                return null;
            }

            if (result.reason instanceof Error) {
                return result.reason.message;
            }

            if (typeof result.reason === "string") {
                return result.reason;
            }

            try {
                return JSON.stringify(result.reason);
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
                ] = await Promise.allSettled([
                    dashboardApi.summary(),
                    reportApi.nonOperationalSummary(),
                    reportApi.warrantySummary(),
                    reportApi.serviceRequestSummary(),
                ]);

                if (!mounted) return;

                if (dashboardRes.status !== "fulfilled") {
                    setError(
                        `Unable to load dashboard: ${settledError(dashboardRes) ??
                        "Unknown dashboard error"
                        }`
                    );
                    return;
                }

                if (warrantyRes.status === "rejected") {
                    console.warn(
                        "[dashboard] warranty summary failed:",
                        settledError(warrantyRes)
                    );
                }

                if (serviceRequestRes.status === "rejected") {
                    console.warn(
                        "[dashboard] service request summary failed:",
                        settledError(serviceRequestRes)
                    );
                }

                const dashboardData: DashboardSummary = {
                    ...dashboardRes.value.data,
                    warranty:
                        warrantyRes.status === "fulfilled"
                            ? warrantyRes.value.data
                            : emptyWarranty,
                    service_requests:
                        serviceRequestRes.status === "fulfilled"
                            ? serviceRequestRes.value.data
                            : emptyServiceRequests,
                };

                setSummary(dashboardData);

                if (nonOpRes.status === "fulfilled") {
                    const raw: any = nonOpRes.value.data;
                    const data = raw?.data ?? raw?.body ?? raw;

                    setNonOpSummary({
                        ownership: Number(data?.ownership ?? 0),
                        damaged: Number(data?.damaged ?? 0),
                        lost: Number(data?.lost ?? 0),
                        total_non_operational: Number(
                            data?.total_non_operational ?? 0
                        ),
                        main_table_damaged: Number(
                            data?.main_table_damaged ?? 0
                        ),
                        damage_inventory_damaged: Number(
                            data?.damage_inventory_damaged ?? 0
                        ),
                        duplicate_in_both_tables: Number(
                            data?.duplicate_in_both_tables ?? 0
                        ),
                        damage_inventory_only: Number(
                            data?.damage_inventory_only ?? 0
                        ),
                    });
                } else {
                    console.warn(
                        "[dashboard] non-operational summary failed:",
                        settledError(nonOpRes)
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
            } catch (err: unknown) {
                if (!mounted) return;

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




    // useEffect(() => {
    //     let mounted = true;

    //     async function loadTroubleTickets() {
    //         try {
    //             setTroubleTicketLoading(true);
    //             setTroubleTicketError("");

    //             // const response =
    //             //     await dashboardApi
    //             //         .troubleTickets({
    //             //             page: 1,
    //             //             limit: 200,
    //             //             status: "all",
    //             //         });

    //             const response =
    //                 await dashboardApi
    //                     .troubleTickets({
    //                         scope: "all",
    //                         page: 1,
    //                         limit: 1000,
    //                         status: "all",

    //                         from_date:
    //                             troubleTicketServerFilters.fromDate ||
    //                             undefined,

    //                         to_date:
    //                             troubleTicketServerFilters.toDate ||
    //                             undefined,

    //                         it_personal:
    //                             troubleTicketServerFilters.itPersonal ||
    //                             undefined,
    //                     });
    //             if (!mounted) {
    //                 return;
    //             }

    //             const tickets =
    //                 response.data ?? [];

    //             setTroubleTicketRows(
    //                 tickets.map(
    //                     toSection
    //                 )
    //             );
    //         } catch (
    //         reason: unknown
    //         ) {
    //             if (!mounted) {
    //                 return;
    //             }

    //             setTroubleTicketRows([]);

    //             setTroubleTicketError(
    //                 reason instanceof Error
    //                     ? reason.message
    //                     : "Unable to load Trouble Ticket data"
    //             );
    //         } finally {
    //             if (mounted) {
    //                 setTroubleTicketLoading(false);
    //             }
    //         }
    //     }

    //     void loadTroubleTickets();

    //     return () => {
    //         mounted = false;
    //     };
    // }, []);


    useEffect(() => {
        let mounted = true;

        async function loadTroubleTickets() {
            try {
                setTroubleTicketLoading(true);
                setTroubleTicketError("");

                const response =
                    await dashboardApi
                        .troubleTickets({
                            scope: "all",
                            page: 1,
                            limit: 1000,
                            status: "all",

                            from_date:
                                troubleTicketServerFilters.fromDate ||
                                undefined,

                            to_date:
                                troubleTicketServerFilters.toDate ||
                                undefined,

                            it_personal:
                                troubleTicketServerFilters.itPersonal ||
                                undefined,
                        });

                if (!mounted) {
                    return;
                }

                const tickets =
                    response.data ?? [];

                setTroubleTicketRows(
                    tickets.map(
                        toSection
                    )
                );
            } catch (
            reason: unknown
            ) {
                if (!mounted) {
                    return;
                }

                setTroubleTicketRows([]);

                setTroubleTicketError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load Trouble Ticket data"
                );
            } finally {
                if (mounted) {
                    setTroubleTicketLoading(false);
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


    if (loading) {
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

    const activeAssetsData = hideDashboardLabels(
        summary.active_assets.items,
        ["Unknown", "Other"]
    ).map((item) => ({
        label: item.label,
        shortLabel: item.label.length > 6 ? item.label.slice(0, 6) : item.label,
        value: item.value,
        color: colorByLabel(item.label),
    }));

    const warrantyDetails = summary.warranty.items.map((item) => ({
        label: item.label,
        value: item.value,
        color: colorByLabel(item.label),
        status: item.label,
    }));

    const serviceData = summary.service_requests.items.map((item) => ({
        label: item.label,
        value: item.value,
        color: colorByLabel(item.label),
        status: item.label,
    }));

    const currentYear = new Date().getFullYear().toString();

    const warrantyBarData = [
        {
            year: currentYear,
            claimed: getSummaryValue(summary.warranty.items, "claim"),
            vendor: getSummaryValue(summary.warranty.items, "vendor"),
            recovered: getSummaryValue(summary.warranty.items, "recover"),
            expired: getSummaryValue(summary.warranty.items, "expired"),
        },
    ];

    const warrantyMaxValue = Math.max(
        warrantyBarData[0].claimed,
        warrantyBarData[0].vendor,
        warrantyBarData[0].recovered,
        warrantyBarData[0].expired,
        1
    );
    const serviceBarData = [
        {
            name: currentYear,

            servicerequest: getSummaryValue(
                summary.service_requests.items,
                "service"
            ),

            transferred: getSummaryValue(
                summary.service_requests.items,
                "vendor"
            ),

            closed: getSummaryValue(
                summary.service_requests.items,
                "closed"
            ),
        },
    ];



    const serviceMaxValue = Math.max(
        serviceBarData[0].servicerequest,
        serviceBarData[0].transferred,
        serviceBarData[0].closed,
        1
    );



    const totalAssets = summary.active_assets.total;
    const totalWarranty = summary.warranty.total;
    const totalService = summary.service_requests.total;

    const ownershipCount = nonOpSummary.ownership;
    const damagedCount = nonOpSummary.damaged;
    const lostCount = nonOpSummary.lost;

    const totalNonOp =
        nonOpSummary.total_non_operational ||
        ownershipCount + damagedCount + lostCount;

    const nonOpTotal =
        ownershipCount + damagedCount + lostCount;

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


    const totalResig = resignationAreaData.reduce(
        (sum, item) =>
            sum +
            item.pending +
            item.completed +
            item.inprocess,
        0
    );



    const totalRenewal = renewalBarData.reduce(
        (sum, item) => sum + item.upcoming + item.completed + item.delayed,
        0
    );

    const ActiveAssetXAxisTick = (props: any) => {
        const { x, y, payload } = props;

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

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* ── Card 1: Active Assets ── */}
                <CardShell>
                    <CardHead
                        title="Total Active Assets"
                        kpi={totalAssets.toLocaleString()}
                        badge="Live"
                        onKpiClick={() =>
                            router.push("/dashboard/reports/assets")
                        }
                    />

                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={activeAssetsData}
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
                                        tick={<ActiveAssetXAxisTick />}
                                    />

                                    <Bar
                                        dataKey="value"
                                        radius={[3, 3, 0, 0]}
                                        maxBarSize={34}
                                        activeBar={false}
                                    >
                                        {activeAssetsData.map((item, index) => (
                                            <Cell
                                                key={index}
                                                fill={item.color}
                                            />
                                        ))}

                                        <LabelList
                                            dataKey="value"
                                            position="top"
                                            fontSize={8}
                                            fill="var(--foreground)"
                                            formatter={(value: number) =>
                                                value >= 1000
                                                    ? `${(value / 1000).toFixed(
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
                                                Number(value).toLocaleString(),
                                                props?.payload?.label || name,
                                            ]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-1/2 pl-3 border-l border-border space-y-0.5">
                            {activeAssetsData.map((item) => (
                                <LegendRow
                                    key={item.label}
                                    {...item}
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/reports/assets?status=${item.label}`
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </CardShell>

                {/* ── Card 2: Non-Operational ── */}
                <CardShell>
                    <CardHead
                        title="Non-Operational Assets"
                        kpi={totalNonOp.toLocaleString()}
                        kpiClass="text-red-500"
                        badge={nonOpLoading ? "Loading..." : "Live"}
                        onKpiClick={() =>
                            router.push("/dashboard/reports/non-operational")
                        }
                    />

                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart
                                    margin={{
                                        top: 10,
                                        right: 44,
                                        bottom: 14,
                                        left: 44,
                                    }}
                                >
                                    <Pie
                                        data={nonOpData}
                                        dataKey="value"
                                        nameKey="label"
                                        cx="46%"
                                        cy="50%"
                                        outerRadius={43}
                                        innerRadius={27}
                                        paddingAngle={3}
                                        labelLine={false}
                                        label={(props) => (
                                            <PieLabel
                                                {...props}
                                                name={
                                                    props.name ||
                                                    props.label
                                                }
                                            />
                                        )}
                                    >
                                        {nonOpData.map((item, index) => (
                                            <Cell
                                                key={index}
                                                fill={item.color}
                                            />
                                        ))}
                                    </Pie>

                                    <Tooltip
                                        {...cleanTooltipProps}
                                        formatter={(
                                            value: number,
                                            name: string
                                        ) => {
                                            const percentage =
                                                nonOpTotal > 0
                                                    ? (
                                                        (Number(value) /
                                                            nonOpTotal) *
                                                        100
                                                    ).toFixed(1)
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

                        <div className="w-1/2 pl-3 border-l border-border space-y-0.5">
                            <LegendRow
                                label="Ownership"
                                value={ownershipCount}
                                color="#10b981"
                                onClick={() =>
                                    router.push(
                                        "/dashboard/disposal/ownership-assets"
                                    )
                                }
                            />

                            <LegendRow
                                label="Damaged"
                                value={damagedCount}
                                color="#f59e0b"
                                onClick={() =>
                                    router.push(
                                        "/dashboard/reports/non-operational?status=damaged"
                                    )
                                }
                            />

                            <LegendRow
                                label="Lost"
                                value={lostCount}
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

                {/* ── Card 3: Warranty Overview ── */}
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
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={warrantyBarData}
                                    margin={{
                                        top: 18,
                                        right: 4,
                                        left: 4,
                                        bottom: 4,
                                    }}
                                    barCategoryGap="20%"
                                    barGap={3}
                                    onClick={(event) => {
                                        const key = event?.activePayload?.[0]
                                            ?.dataKey as string | undefined;

                                        const map: Record<string, string> = {
                                            claimed: "Claimed",
                                            vendor: "To Vendor",
                                            recovered: "Recovered",
                                            expired: "Expired",
                                        };

                                        if (key && map[key]) {
                                            router.push(
                                                `/dashboard/service-warranty/warranty-claims?status=${encodeURIComponent(
                                                    map[key]
                                                )}`
                                            );
                                        }
                                    }}
                                    style={{ cursor: "pointer" }}
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
                                        domain={[0, warrantyMaxValue]}
                                    />

                                    <Tooltip {...cleanTooltipProps} />

                                    <Bar
                                        dataKey="claimed"
                                        fill="#f97316"
                                        radius={[4, 4, 0, 0]}
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
                                        radius={[4, 4, 0, 0]}
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
                                        radius={[4, 4, 0, 0]}
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
                                        radius={[4, 4, 0, 0]}
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

                        <div className="w-1/2 pl-3 border-l border-border space-y-0.5">
                            {warrantyDetails.map((item) => (
                                <LegendRow
                                    key={item.label}
                                    label={item.label}
                                    value={item.value}
                                    color={item.color}
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/service-warranty/warranty-claims?status=${encodeURIComponent(
                                                item.status
                                            )}`
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </CardShell>

                {/* ── Card 4: Service Requests ── */}
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
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={serviceBarData}
                                    margin={{
                                        top: 18,
                                        right: 4,
                                        left: 4,
                                        bottom: 4,
                                    }}
                                    barCategoryGap="22%"
                                    barGap={4}
                                    onClick={(event) => {
                                        const key = event?.activePayload?.[0]
                                            ?.dataKey as string | undefined;

                                        const map: Record<string, string> = {
                                            servicerequest: "Service Request",
                                            transferred: "Transferred to Vendor",
                                            closed: "Closed",
                                        };

                                        if (key && map[key]) {
                                            router.push(
                                                `/dashboard/service-warranty/service-claims?status=${encodeURIComponent(
                                                    map[key]
                                                )}`
                                            );
                                        }
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 9 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        hide
                                        domain={[0, serviceMaxValue]}
                                    />

                                    <Tooltip {...cleanTooltipProps} />

                                    <Bar
                                        dataKey="servicerequest"
                                        fill="#3b82f6"
                                        name="Service Request"
                                        radius={[4, 4, 0, 0]}
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
                                        radius={[4, 4, 0, 0]}
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
                                        radius={[4, 4, 0, 0]}
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

                        <div className="w-1/2 pl-3 border-l border-border space-y-0.5">
                            {serviceData.map((item) => (
                                <LegendRow
                                    key={item.label}
                                    label={item.label}
                                    value={item.value}
                                    color={item.color}
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/service-warranty/service-claims?status=${encodeURIComponent(
                                                item.status
                                            )}`
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </CardShell>

                {/* ── Card 5: Resignation Clearance ── */}
                <CardShell>
                    <CardHead
                        title="Resignation Clearance"
                        kpi={totalResig}
                        kpiClass="text-red-500"
                        badge="Static"
                        onKpiClick={() =>
                            router.push("/dashboard/reports/resignation")
                        }
                    />

                    <div className="flex items-center gap-3">
                        <div className="w-[55%] h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={resignationAreaData}
                                    margin={{
                                        top: 20,
                                        right: 8,
                                        left: 4,
                                        bottom: 8,
                                    }}
                                    onClick={(event) => {
                                        const key = event?.activePayload?.[0]
                                            ?.dataKey as string;

                                        const map: Record<string, string> = {
                                            pending: "Pending Clearance",
                                            completed: "Completed",
                                            inprocess: "In Process",
                                        };

                                        if (map[key]) {
                                            router.push(
                                                `/dashboard/reports/resignation?status=${encodeURIComponent(
                                                    map[key]
                                                )}`
                                            );
                                        }
                                    }}
                                    style={{ cursor: "pointer" }}
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
                                                stopOpacity={0.2}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#f59e0b"
                                                stopOpacity={0}
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
                                                stopOpacity={0.2}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#10b981"
                                                stopOpacity={0}
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
                                                stopOpacity={0.2}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>

                                    <XAxis
                                        dataKey="month"
                                        interval={0}
                                        minTickGap={0}
                                        tick={{ fontSize: 8 }}
                                        axisLine={false}
                                        tickLine={false}
                                        padding={{ left: 6, right: 6 }}
                                    />

                                    <Tooltip {...cleanTooltipProps} />

                                    <Area
                                        type="monotone"
                                        dataKey="pending"
                                        name="Pending"
                                        stroke="#f59e0b"
                                        strokeWidth={1.5}
                                        fill="url(#g1)"
                                        dot={{ r: 2 }}
                                        activeDot={{ r: 4 }}
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
                                        dot={{ r: 2 }}
                                        activeDot={{ r: 4 }}
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
                                        dot={{ r: 2 }}
                                        activeDot={{ r: 4 }}
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

                        <div className="w-[45%] pl-3 border-l border-border space-y-1">
                            {resignationLegend.map((item) => (
                                <div
                                    key={item.label}
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/reports/resignation?status=${encodeURIComponent(
                                                item.status
                                            )}`
                                        )
                                    }
                                    className="grid grid-cols-[1fr_28px] items-center gap-2 px-1.5 py-1.5 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors"
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{
                                                backgroundColor: item.color,
                                            }}
                                        />

                                        <span className="text-[10px] text-muted-foreground leading-tight whitespace-normal">
                                            {item.label}
                                        </span>
                                    </div>

                                    <span className="text-right text-[10px] font-bold text-foreground tabular-nums shrink-0">
                                        {item.value.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardShell>

                {/* ── Card 6: Contract Renewal ── */}
                <CardShell>
                    <CardHead
                        title="Contract Renewal"
                        kpi={totalRenewal}
                        kpiClass="text-emerald-600"
                        badge="Static"
                        onKpiClick={() =>
                            router.push("/dashboard/reports/renewal")
                        }
                    />

                    <div className="flex items-center gap-2">
                        <div className="w-[54%] h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={renewalBarData}
                                    margin={{
                                        top: 18,
                                        right: 4,
                                        left: 0,
                                        bottom: 6,
                                    }}
                                    barCategoryGap="18%"
                                    barGap={0}
                                    onClick={(event) => {
                                        const key = event?.activePayload?.[0]
                                            ?.dataKey as string;

                                        const map: Record<string, string> = {
                                            upcoming: "Upcoming Renewals",
                                            completed: "Completed",
                                            delayed: "Delayed",
                                        };

                                        if (map[key]) {
                                            router.push(
                                                `/dashboard/reports/renewal?status=${encodeURIComponent(
                                                    map[key]
                                                )}`
                                            );
                                        }
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <XAxis
                                        dataKey="month"
                                        interval={0}
                                        minTickGap={0}
                                        tick={{ fontSize: 8 }}
                                        axisLine={false}
                                        tickLine={false}
                                        padding={{ left: 4, right: 4 }}
                                    />

                                    <Tooltip {...cleanTooltipProps} />

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
                                        radius={[3, 3, 0, 0]}
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

                        <div className="w-[46%] pl-2 border-l border-border space-y-1">
                            {renewalLegend.map((item) => (
                                <div
                                    key={item.label}
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/reports/renewal?status=${encodeURIComponent(
                                                item.status
                                            )}`
                                        )
                                    }
                                    className="grid grid-cols-[1fr_28px] items-center gap-2 px-1 py-1.5 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors"
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{
                                                backgroundColor: item.color,
                                            }}
                                        />

                                        <span className="text-[10px] text-muted-foreground leading-tight whitespace-normal">
                                            {item.label}
                                        </span>
                                    </div>

                                    <span className="text-right text-[10px] font-bold text-foreground tabular-nums shrink-0">
                                        {item.value.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardShell>
            </div>

            {/* Trouble Ticket Overview */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <OverviewChart />
            </div>

            {/* Trouble Ticket Table */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <h2 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">
                    Trouble Ticket Table
                </h2>

                <div className="overflow-x-auto">
                    {troubleTicketLoading ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            Loading Trouble Ticket data...
                        </div>
                    ) : troubleTicketError ? (
                        <div className="py-8 text-center text-xs text-red-600">
                            {troubleTicketError}
                        </div>
                    ) : troubleTicketRows.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            No Trouble Ticket records found.
                        </div>
                    ) : (
                        // <DataTable
                        //     columns={columns}
                        //     data={troubleTicketRows}
                        // />

                        <DataTable
                            columns={columns}
                            data={troubleTicketRows}
                            dateColumn="created_at"
                            compact
                            serverSideDateFilter
                            onApplyServerFilters={(
                                filters
                            ) => {
                                setTroubleTicketServerFilters(
                                    filters
                                );
                            }}
                        />

                    )}
                </div>
            </div>
        </div>
    );
}