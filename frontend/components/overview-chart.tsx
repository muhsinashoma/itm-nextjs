//frontend/components/overview-chart.tsx


"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import {
    dashboardApi,
    type RequisitionDashboardSummary,
    type TroubleTicketDashboardSummary,
    type TroubleTicketOverviewPoint,
    type TroubleTicketRange,
} from "@/lib/api";

/* ======================================================
   TYPES
====================================================== */

type ChartType =
    | "bar"
    | "area"
    | "pie";

type TroubleTicketMetric = {
    label: string;
    shortLabel: string;
    description: string;
    value: number;
    color: string;
    route: string;
    dotClass: string;
    valueClass: string;
    borderClass: string;
    backgroundClass: string;
};

type TroubleTicketTrendRow = {
    label: string;
    Opened: number;
    Closed: number;
    Running: number;
    Procurement: number;
};

type TroubleTicketPieRow = {
    name: string;
    value: number;
    color: string;
};

type RequisitionChartRow = {
    name: string;
    value: number;
    color: string;
};

/* ======================================================
   CONSTANTS
====================================================== */

const COLORS = {
    opened:
        "#2563eb",

    closed:
        "#10b981",

    running:
        "#f59e0b",

    procurement:
        "#8b5cf6",

    requisitionPending:
        "#f59e0b",

    requisitionApproved:
        "#10b981",

    requisitionRejected:
        "#ef4444",
};

const TROUBLE_TICKET_ROUTES = {
    openedToday:
        "/dashboard/trouble-tickets?scope=opened_today",

    closedToday:
        "/dashboard/trouble-tickets?scope=closed_today",

    running:
        "/dashboard/trouble-tickets?scope=running",

    procurement:
        "/dashboard/trouble-tickets?scope=procurement",
};

const REQUISITION_ROUTES = {
    summary:
        "/dashboard/requisitions?view=summary",

    pending:
        "/dashboard/requisitions?view=pending",

    rejected:
        "/dashboard/requisitions?view=rejected",
};

const EMPTY_SUMMARY:
    TroubleTicketDashboardSummary = {
    opened_today:
        0,

    closed_today:
        0,

    total_running_tt:
        0,

    total_procurement_tt:
        0,
};

const EMPTY_REQUISITION_SUMMARY:
    RequisitionDashboardSummary = {
    pending_categories:
        0,

    approval_pending:
        0,

    rejected:
        0,

    approved:
        0,

    total_active:
        0,
};

const RANGE_OPTIONS: {
    key:
    TroubleTicketRange;

    label:
    string;
}[] = [
        {
            key:
                "7d",

            label:
                "7 Days",
        },

        {
            key:
                "30d",

            label:
                "30 Days",
        },

        {
            key:
                "3m",

            label:
                "3 Months",
        },
    ];

const tooltipStyle = {
    background:
        "var(--card)",

    border:
        "1px solid var(--border)",

    borderRadius:
        "10px",

    fontSize:
        "11px",

    boxShadow:
        "0 12px 30px rgba(15, 23, 42, 0.14)",
};

/* ======================================================
   PIE LABEL
====================================================== */

function PieValueLabel(
    props: any
) {
    const {
        cx,
        cy,
        midAngle,
        outerRadius,
        percent,
        value,
    } = props;

    const numericValue =
        Number(
            value ??
            0
        );

    const numericPercent =
        Number(
            percent ??
            0
        );

    if (
        numericValue <=
        0
    ) {
        return null;
    }

    const radian =
        Math.PI /
        180;

    const radius =
        Number(
            outerRadius ??
            0
        ) +
        18;

    const x =
        Number(
            cx ??
            0
        ) +
        radius *
        Math.cos(
            -Number(
                midAngle ??
                0
            ) *
            radian
        );

    const y =
        Number(
            cy ??
            0
        ) +
        radius *
        Math.sin(
            -Number(
                midAngle ??
                0
            ) *
            radian
        );

    return (
        <text
            x={x}
            y={y}
            fill="var(--foreground)"
            fontSize={10}
            fontWeight={700}
            dominantBaseline="central"
            textAnchor={
                x >
                    Number(
                        cx ??
                        0
                    )
                    ? "start"
                    : "end"
            }
        >
            {`${numericValue.toLocaleString()} (${(
                numericPercent *
                100
            ).toFixed(0)}%)`}
        </text>
    );
}

/* ======================================================
   COMPONENT
====================================================== */

export default function OverviewChart() {
    const router =
        useRouter();

    /* ==================================================
       CHART STATE
    ================================================== */

    const [
        chartType,
        setChartType,
    ] =
        useState<ChartType>(
            "bar"
        );

    const [
        range,
        setRange,
    ] =
        useState<TroubleTicketRange>(
            "7d"
        );

    /* ==================================================
       TROUBLE TICKET SUMMARY
    ================================================== */

    const [
        ticketSummary,
        setTicketSummary,
    ] =
        useState<TroubleTicketDashboardSummary>(
            EMPTY_SUMMARY
        );

    const [
        summaryLoading,
        setSummaryLoading,
    ] =
        useState(
            true
        );

    const [
        summaryError,
        setSummaryError,
    ] =
        useState(
            ""
        );

    /* ==================================================
       REQUISITION SUMMARY
    ================================================== */

    const [
        requisitionSummary,
        setRequisitionSummary,
    ] =
        useState<RequisitionDashboardSummary>(
            EMPTY_REQUISITION_SUMMARY
        );

    const [
        requisitionLoading,
        setRequisitionLoading,
    ] =
        useState(
            true
        );

    const [
        requisitionError,
        setRequisitionError,
    ] =
        useState(
            ""
        );

    /* ==================================================
       TROUBLE TICKET TREND
    ================================================== */

    const [
        trendSource,
        setTrendSource,
    ] =
        useState<
            TroubleTicketOverviewPoint[]
        >([]);

    const [
        trendLoading,
        setTrendLoading,
    ] =
        useState(
            true
        );

    const [
        trendError,
        setTrendError,
    ] =
        useState(
            ""
        );

    /* ==================================================
       NAVIGATION
    ================================================== */

    function openTroubleTicketList(
        route:
            string
    ) {
        router.push(
            route
        );
    }

    function openRequisitionList(
        route:
            string
    ) {
        router.push(
            route
        );
    }

    /* ==================================================
       LOAD TROUBLE TICKET SUMMARY
    ================================================== */

    useEffect(
        () => {
            let mounted =
                true;

            async function loadTroubleTicketSummary() {
                try {
                    setSummaryLoading(
                        true
                    );

                    setSummaryError(
                        ""
                    );

                    const response =
                        await dashboardApi
                            .troubleTicketSummary();

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setTicketSummary({
                        opened_today:
                            Number(
                                response
                                    .data
                                    ?.opened_today ??
                                0
                            ),

                        closed_today:
                            Number(
                                response
                                    .data
                                    ?.closed_today ??
                                0
                            ),

                        total_running_tt:
                            Number(
                                response
                                    .data
                                    ?.total_running_tt ??
                                0
                            ),

                        total_procurement_tt:
                            Number(
                                response
                                    .data
                                    ?.total_procurement_tt ??
                                0
                            ),
                    });
                } catch (
                reason:
                    unknown
                ) {
                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setTicketSummary(
                        EMPTY_SUMMARY
                    );

                    setSummaryError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load Trouble Ticket summary"
                    );
                } finally {
                    if (
                        mounted
                    ) {
                        setSummaryLoading(
                            false
                        );
                    }
                }
            }

            void loadTroubleTicketSummary();

            return () => {
                mounted =
                    false;
            };
        },
        []
    );

    /* ==================================================
       LOAD REQUISITION SUMMARY
    ================================================== */

    useEffect(
        () => {
            let mounted =
                true;

            async function loadRequisitionSummary() {
                try {
                    setRequisitionLoading(
                        true
                    );

                    setRequisitionError(
                        ""
                    );

                    const response =
                        await dashboardApi
                            .requisitionDashboardSummary();

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setRequisitionSummary({
                        pending_categories:
                            Number(
                                response
                                    .data
                                    ?.pending_categories ??
                                0
                            ),

                        approval_pending:
                            Number(
                                response
                                    .data
                                    ?.approval_pending ??
                                0
                            ),

                        rejected:
                            Number(
                                response
                                    .data
                                    ?.rejected ??
                                0
                            ),

                        approved:
                            Number(
                                response
                                    .data
                                    ?.approved ??
                                0
                            ),

                        total_active:
                            Number(
                                response
                                    .data
                                    ?.total_active ??
                                0
                            ),
                    });
                } catch (
                reason:
                    unknown
                ) {
                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setRequisitionSummary(
                        EMPTY_REQUISITION_SUMMARY
                    );

                    setRequisitionError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load Requisition summary"
                    );
                } finally {
                    if (
                        mounted
                    ) {
                        setRequisitionLoading(
                            false
                        );
                    }
                }
            }

            void loadRequisitionSummary();

            return () => {
                mounted =
                    false;
            };
        },
        []
    );

    /* ==================================================
       LOAD TT TREND
    ================================================== */

    useEffect(
        () => {
            let mounted =
                true;

            async function loadTroubleTicketTrend() {
                try {
                    setTrendLoading(
                        true
                    );

                    setTrendError(
                        ""
                    );

                    const response =
                        await dashboardApi
                            .troubleTicketOverview(
                                range
                            );

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setTrendSource(
                        response
                            .data
                            ?.items ??
                        []
                    );
                } catch (
                reason:
                    unknown
                ) {
                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setTrendSource(
                        []
                    );

                    setTrendError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load Trouble Ticket trend"
                    );
                } finally {
                    if (
                        mounted
                    ) {
                        setTrendLoading(
                            false
                        );
                    }
                }
            }

            void loadTroubleTicketTrend();

            return () => {
                mounted =
                    false;
            };
        },
        [
            range,
        ]
    );

    /* ==================================================
       TT CARD DATA
    ================================================== */

    const currentData =
        useMemo<
            TroubleTicketMetric[]
        >(
            () => [
                {
                    label:
                        "TT Opened Today",

                    shortLabel:
                        "Opened Today",

                    description:
                        "Tickets registered today",

                    value:
                        ticketSummary
                            .opened_today,

                    color:
                        COLORS.opened,

                    route:
                        TROUBLE_TICKET_ROUTES
                            .openedToday,

                    dotClass:
                        "bg-blue-600",

                    valueClass:
                        "text-blue-600 dark:text-blue-400",

                    borderClass:
                        "border-t-blue-600",

                    backgroundClass:
                        "bg-blue-50/60 dark:bg-blue-950/10",
                },

                {
                    label:
                        "TT Closed Today",

                    shortLabel:
                        "Closed Today",

                    description:
                        "Tickets resolved today",

                    value:
                        ticketSummary
                            .closed_today,

                    color:
                        COLORS.closed,

                    route:
                        TROUBLE_TICKET_ROUTES
                            .closedToday,

                    dotClass:
                        "bg-emerald-500",

                    valueClass:
                        "text-emerald-600 dark:text-emerald-400",

                    borderClass:
                        "border-t-emerald-500",

                    backgroundClass:
                        "bg-emerald-50/60 dark:bg-emerald-950/10",
                },

                {
                    label:
                        "Total Running TT",

                    shortLabel:
                        "Running TT",

                    description:
                        "Currently active tickets",

                    value:
                        ticketSummary
                            .total_running_tt,

                    color:
                        COLORS.running,

                    route:
                        TROUBLE_TICKET_ROUTES
                            .running,

                    dotClass:
                        "bg-amber-500",

                    valueClass:
                        "text-amber-600 dark:text-amber-400",

                    borderClass:
                        "border-t-amber-500",

                    backgroundClass:
                        "bg-amber-50/60 dark:bg-amber-950/10",
                },

                {
                    label:
                        "Total Procurement TT",

                    shortLabel:
                        "Procurement TT",

                    description:
                        "Tickets requiring procurement",

                    value:
                        ticketSummary
                            .total_procurement_tt,

                    color:
                        COLORS.procurement,

                    route:
                        TROUBLE_TICKET_ROUTES
                            .procurement,

                    dotClass:
                        "bg-violet-500",

                    valueClass:
                        "text-violet-600 dark:text-violet-400",

                    borderClass:
                        "border-t-violet-500",

                    backgroundClass:
                        "bg-violet-50/60 dark:bg-violet-950/10",
                },
            ],
            [
                ticketSummary,
            ]
        );

    /* ==================================================
       REQUISITION BAR DATA

       Important:
       Do not include pending_categories here because
       it is a category count, not a requisition count.
    ================================================== */

    const requisitionChartData =
        useMemo<
            RequisitionChartRow[]
        >(
            () => [
                {
                    name:
                        "Pending",

                    value:
                        requisitionSummary
                            .approval_pending,

                    color:
                        COLORS
                            .requisitionPending,
                },

                {
                    name:
                        "Approved",

                    value:
                        requisitionSummary
                            .approved,

                    color:
                        COLORS
                            .requisitionApproved,
                },

                {
                    name:
                        "Rejected",

                    value:
                        requisitionSummary
                            .rejected,

                    color:
                        COLORS
                            .requisitionRejected,
                },
            ],
            [
                requisitionSummary,
            ]
        );

    const requisitionChartMaximum =
        Math.max(
            ...requisitionChartData.map(
                (
                    item
                ) =>
                    item.value
            ),
            1
        );

    const requisitionYAxisMaximum =
        Math.max(
            Math.ceil(
                requisitionChartMaximum *
                1.15
            ),
            1
        );

    /* ==================================================
       TREND DATA
    ================================================== */

    const trendData =
        useMemo<
            TroubleTicketTrendRow[]
        >(
            () =>
                trendSource.map(
                    (
                        item
                    ) => ({
                        label:
                            item.label,

                        Opened:
                            Number(
                                item.opened ??
                                0
                            ),

                        Closed:
                            Number(
                                item.closed ??
                                0
                            ),

                        Running:
                            Number(
                                item.running ??
                                0
                            ),

                        Procurement:
                            Number(
                                item.procurement ??
                                0
                            ),
                    })
                ),
            [
                trendSource,
            ]
        );

    const selectedRangeLabel =
        RANGE_OPTIONS.find(
            (
                option
            ) =>
                option.key ===
                range
        )?.label ??
        "7 Days";

    const rangeOpenedTotal =
        trendData.reduce(
            (
                total,
                item
            ) =>
                total +
                item.Opened,
            0
        );

    const rangeClosedTotal =
        trendData.reduce(
            (
                total,
                item
            ) =>
                total +
                item.Closed,
            0
        );

    const selectedRangeActivityTotal =
        rangeOpenedTotal +
        rangeClosedTotal;

    /* ==================================================
       TT BAR MAXIMUM
    ================================================== */

    const selectedMaximum =
        Math.max(
            ...currentData.map(
                (
                    item
                ) =>
                    item.value
            ),
            1
        );

    const verticalBarMaximum =
        Math.max(
            Math.ceil(
                selectedMaximum *
                1.15
            ),
            1
        );

    /* ==================================================
       PIE DATA
    ================================================== */

    const pieData =
        useMemo<
            TroubleTicketPieRow[]
        >(
            () => [
                {
                    name:
                        "Opened",

                    value:
                        rangeOpenedTotal,

                    color:
                        COLORS.opened,
                },

                {
                    name:
                        "Closed",

                    value:
                        rangeClosedTotal,

                    color:
                        COLORS.closed,
                },
            ],
            [
                rangeOpenedTotal,
                rangeClosedTotal,
            ]
        );

    /* ==================================================
       BAR LABEL
    ================================================== */

    function renderBarValueLabel(
        props:
            any
    ) {
        const {
            x,
            y,
            width,
            value,
        } = props;

        const numericValue =
            Number(
                value ??
                0
            );

        return (
            <text
                x={
                    Number(
                        x ??
                        0
                    ) +
                    Number(
                        width ??
                        0
                    ) /
                    2
                }
                y={
                    Number(
                        y ??
                        0
                    ) -
                    8
                }
                fill="var(--foreground)"
                fontSize={10}
                fontWeight={700}
                textAnchor="middle"
            >
                {numericValue.toLocaleString()}
            </text>
        );
    }

    /* ==================================================
       TT BAR CHART
    ================================================== */

    function renderBarChart() {
        return (
            <BarChart
                data={
                    currentData
                }
                margin={{
                    top:
                        32,

                    right:
                        18,

                    left:
                        0,

                    bottom:
                        18,
                }}
                barCategoryGap="34%"
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={
                        false
                    }
                />

                <XAxis
                    dataKey="shortLabel"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{
                        fontSize:
                            10,

                        fontWeight:
                            500,

                        fill:
                            "var(--muted-foreground)",
                    }}
                />

                <YAxis
                    allowDecimals={
                        false
                    }
                    domain={[
                        0,
                        verticalBarMaximum,
                    ]}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                        fontSize:
                            9,

                        fill:
                            "var(--muted-foreground)",
                    }}
                />

                <Tooltip
                    cursor={{
                        fill:
                            "var(--muted)",

                        opacity:
                            0.2,
                    }}
                    contentStyle={
                        tooltipStyle
                    }
                    formatter={(
                        value,
                        name,
                        item
                    ) => [
                            Number(
                                value ??
                                0
                            ).toLocaleString(),

                            item
                                ?.payload
                                ?.shortLabel ??
                            String(
                                name
                            ),
                        ]}
                    labelFormatter={() =>
                        "Current operational values"
                    }
                />

                <Bar
                    dataKey="value"
                    name="Tickets"
                    radius={[
                        7,
                        7,
                        0,
                        0,
                    ]}
                    maxBarSize={76}
                    minPointSize={3}
                    isAnimationActive={
                        false
                    }
                    onClick={(
                        data:
                            any
                    ) => {
                        const route =
                            data
                                ?.payload
                                ?.route ??
                            data
                                ?.route;

                        if (
                            route
                        ) {
                            openTroubleTicketList(
                                String(
                                    route
                                )
                            );
                        }
                    }}
                >
                    {currentData.map(
                        (
                            item
                        ) => (
                            <Cell
                                key={
                                    item.label
                                }
                                fill={
                                    item.color
                                }
                                style={{
                                    cursor:
                                        "pointer",
                                }}
                            />
                        )
                    )}

                    <LabelList
                        dataKey="value"
                        content={
                            renderBarValueLabel
                        }
                    />
                </Bar>
            </BarChart>
        );
    }

    /* ==================================================
       REQUISITION BAR CHART
    ================================================== */

    function renderRequisitionBarChart() {
        return (
            <BarChart
                data={
                    requisitionChartData
                }
                margin={{
                    top:
                        28,

                    right:
                        8,

                    left:
                        -18,

                    bottom:
                        4,
                }}
                barCategoryGap="30%"
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={
                        false
                    }
                />

                <XAxis
                    dataKey="name"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    tick={{
                        fontSize:
                            9,

                        fontWeight:
                            600,

                        fill:
                            "var(--muted-foreground)",
                    }}
                />

                <YAxis
                    allowDecimals={
                        false
                    }
                    domain={[
                        0,
                        requisitionYAxisMaximum,
                    ]}
                    axisLine={false}
                    tickLine={false}
                    width={38}
                    tick={{
                        fontSize:
                            8,

                        fill:
                            "var(--muted-foreground)",
                    }}
                />

                <Tooltip
                    cursor={{
                        fill:
                            "var(--muted)",

                        opacity:
                            0.18,
                    }}
                    contentStyle={
                        tooltipStyle
                    }
                    formatter={(
                        value
                    ) => [
                            Number(
                                value ??
                                0
                            ).toLocaleString(),

                            "Requisitions",
                        ]}
                />

                <Bar
                    dataKey="value"
                    radius={[
                        6,
                        6,
                        0,
                        0,
                    ]}
                    maxBarSize={54}
                    minPointSize={3}
                    isAnimationActive={
                        false
                    }
                >
                    {requisitionChartData.map(
                        (
                            item
                        ) => (
                            <Cell
                                key={
                                    item.name
                                }
                                fill={
                                    item.color
                                }
                            />
                        )
                    )}

                    <LabelList
                        dataKey="value"
                        content={
                            renderBarValueLabel
                        }
                    />
                </Bar>
            </BarChart>
        );
    }

    /* ==================================================
       AREA CHART
    ================================================== */

    function renderAreaChart() {
        const showDots =
            range !==
            "30d";

        return (
            <AreaChart
                data={
                    trendData
                }
                margin={{
                    top:
                        22,

                    right:
                        12,

                    left:
                        2,

                    bottom:
                        8,
                }}
            >
                <defs>
                    <linearGradient
                        id="ttOpenedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="5%"
                            stopColor={
                                COLORS.opened
                            }
                            stopOpacity={
                                0.24
                            }
                        />

                        <stop
                            offset="95%"
                            stopColor={
                                COLORS.opened
                            }
                            stopOpacity={
                                0
                            }
                        />
                    </linearGradient>

                    <linearGradient
                        id="ttClosedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="5%"
                            stopColor={
                                COLORS.closed
                            }
                            stopOpacity={
                                0.21
                            }
                        />

                        <stop
                            offset="95%"
                            stopColor={
                                COLORS.closed
                            }
                            stopOpacity={
                                0
                            }
                        />
                    </linearGradient>

                    <linearGradient
                        id="ttRunningGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="5%"
                            stopColor={
                                COLORS.running
                            }
                            stopOpacity={
                                0.18
                            }
                        />

                        <stop
                            offset="95%"
                            stopColor={
                                COLORS.running
                            }
                            stopOpacity={
                                0
                            }
                        />
                    </linearGradient>

                    <linearGradient
                        id="ttProcurementGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="5%"
                            stopColor={
                                COLORS.procurement
                            }
                            stopOpacity={
                                0.16
                            }
                        />

                        <stop
                            offset="95%"
                            stopColor={
                                COLORS.procurement
                            }
                            stopOpacity={
                                0
                            }
                        />
                    </linearGradient>
                </defs>

                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={
                        false
                    }
                />

                <XAxis
                    dataKey="label"
                    interval={
                        range ===
                            "30d"
                            ? 4
                            : 0
                    }
                    minTickGap={8}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    tick={{
                        fontSize:
                            9,

                        fill:
                            "var(--muted-foreground)",
                    }}
                />

                <YAxis
                    yAxisId="activity"
                    orientation="left"
                    allowDecimals={
                        false
                    }
                    axisLine={false}
                    tickLine={false}
                    tick={{
                        fontSize:
                            9,

                        fill:
                            "var(--muted-foreground)",
                    }}
                />

                <YAxis
                    yAxisId="workload"
                    orientation="right"
                    allowDecimals={
                        false
                    }
                    axisLine={false}
                    tickLine={false}
                    tick={{
                        fontSize:
                            9,

                        fill:
                            "var(--muted-foreground)",
                    }}
                />

                <Tooltip
                    contentStyle={
                        tooltipStyle
                    }
                    formatter={(
                        value,
                        name
                    ) => [
                            Number(
                                value ??
                                0
                            ).toLocaleString(),

                            String(
                                name
                            ),
                        ]}
                />

                <Legend
                    wrapperStyle={{
                        fontSize:
                            "10px",

                        paddingTop:
                            "12px",
                    }}
                />

                <Area
                    yAxisId="activity"
                    type="monotone"
                    dataKey="Opened"
                    name="Opened"
                    stroke={
                        COLORS.opened
                    }
                    strokeWidth={2}
                    fill="url(#ttOpenedGradient)"
                    dot={
                        showDots
                            ? {
                                r:
                                    2.5,
                            }
                            : false
                    }
                    activeDot={{
                        r:
                            5,
                    }}
                    isAnimationActive={
                        false
                    }
                />

                <Area
                    yAxisId="activity"
                    type="monotone"
                    dataKey="Closed"
                    name="Closed"
                    stroke={
                        COLORS.closed
                    }
                    strokeWidth={2}
                    fill="url(#ttClosedGradient)"
                    dot={
                        showDots
                            ? {
                                r:
                                    2.5,
                            }
                            : false
                    }
                    activeDot={{
                        r:
                            5,
                    }}
                    isAnimationActive={
                        false
                    }
                />

                <Area
                    yAxisId="workload"
                    type="monotone"
                    dataKey="Running"
                    name="Running TT"
                    stroke={
                        COLORS.running
                    }
                    strokeWidth={2}
                    fill="url(#ttRunningGradient)"
                    dot={
                        showDots
                            ? {
                                r:
                                    2.5,
                            }
                            : false
                    }
                    activeDot={{
                        r:
                            5,
                    }}
                    isAnimationActive={
                        false
                    }
                />

                <Area
                    yAxisId="workload"
                    type="monotone"
                    dataKey="Procurement"
                    name="Procurement TT"
                    stroke={
                        COLORS.procurement
                    }
                    strokeWidth={2}
                    fill="url(#ttProcurementGradient)"
                    dot={
                        showDots
                            ? {
                                r:
                                    2.5,
                            }
                            : false
                    }
                    activeDot={{
                        r:
                            5,
                    }}
                    isAnimationActive={
                        false
                    }
                />
            </AreaChart>
        );
    }

    /* ==================================================
       PIE CHART
    ================================================== */

    function renderPieChart() {
        return (
            <PieChart>
                <Pie
                    data={
                        pieData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={72}
                    outerRadius={112}
                    paddingAngle={5}
                    labelLine={false}
                    label={
                        PieValueLabel
                    }
                    isAnimationActive={
                        false
                    }
                >
                    {pieData.map(
                        (
                            item
                        ) => (
                            <Cell
                                key={
                                    item.name
                                }
                                fill={
                                    item.color
                                }
                            />
                        )
                    )}
                </Pie>

                <Tooltip
                    contentStyle={
                        tooltipStyle
                    }
                    formatter={(
                        value,
                        name
                    ) => [
                            Number(
                                value ??
                                0
                            ).toLocaleString(),

                            String(
                                name
                            ),
                        ]}
                />

                <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{
                        fontSize:
                            "10px",
                    }}
                />

                <text
                    x="50%"
                    y="42%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--muted-foreground)"
                    fontSize={10}
                >
                    {
                        selectedRangeLabel
                    }
                </text>

                <text
                    x="50%"
                    y="49%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--foreground)"
                    fontSize={24}
                    fontWeight={700}
                >
                    {selectedRangeActivityTotal.toLocaleString()}
                </text>
            </PieChart>
        );
    }

    /* ==================================================
       TT CHART TITLE
    ================================================== */

    function getChartTitle() {
        if (
            chartType ===
            "area"
        ) {
            return "Trouble Ticket Trend";
        }

        if (
            chartType ===
            "pie"
        ) {
            return "Opened vs Closed Distribution";
        }

        return "Trouble Ticket Distribution";
    }

    function getChartDescription() {
        if (
            chartType ===
            "area"
        ) {
            return `Historical ticket activity and workload for ${selectedRangeLabel.toLowerCase()}`;
        }

        if (
            chartType ===
            "pie"
        ) {
            return `Opened versus closed ticket activity for ${selectedRangeLabel.toLowerCase()}`;
        }

        return "Current Trouble Ticket operational values";
    }

    const noTrendData =
        !trendLoading &&
        trendData.length ===
        0;

    const noPieData =
        chartType ===
        "pie" &&
        selectedRangeActivityTotal ===
        0;

    /* ==================================================
       TT CHART CONTENT
    ================================================== */

    function renderChartContent() {
        if (
            chartType ===
            "bar"
        ) {
            if (
                summaryLoading
            ) {
                return (
                    <div className="flex h-[320px] items-center justify-center text-xs text-muted-foreground sm:h-[360px]">
                        Loading Trouble Ticket chart...
                    </div>
                );
            }

            if (
                summaryError
            ) {
                return (
                    <div className="flex h-[320px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-center text-xs text-red-700 sm:h-[360px]">
                        {
                            summaryError
                        }
                    </div>
                );
            }

            return (
                <div className="h-[320px] sm:h-[360px]">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        {renderBarChart()}
                    </ResponsiveContainer>
                </div>
            );
        }

        if (
            trendLoading
        ) {
            return (
                <div className="flex h-[320px] items-center justify-center text-xs text-muted-foreground sm:h-[360px]">
                    Loading Trouble Ticket chart...
                </div>
            );
        }

        if (
            trendError
        ) {
            return (
                <div className="flex h-[320px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-center text-xs text-red-700 sm:h-[360px]">
                    {
                        trendError
                    }
                </div>
            );
        }

        if (
            noTrendData
        ) {
            return (
                <div className="flex h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center sm:h-[360px]">
                    <p className="text-xs font-semibold text-foreground">
                        No historical data found
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                        No Trouble Ticket records are available for the selected period.
                    </p>
                </div>
            );
        }

        if (
            noPieData
        ) {
            return (
                <div className="flex h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center sm:h-[360px]">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-[10px] border-muted">
                        <span className="text-lg font-bold text-muted-foreground">
                            0
                        </span>
                    </div>

                    <p className="mt-4 text-xs font-semibold text-foreground">
                        No opened or closed activity
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                        No tickets were opened or closed during the selected period.
                    </p>
                </div>
            );
        }

        return (
            <div className="h-[320px] sm:h-[360px]">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    {chartType ===
                        "area"
                        ? renderAreaChart()
                        : renderPieChart()
                    }
                </ResponsiveContainer>
            </div>
        );
    }

    /* ==================================================
       UI
    ================================================== */

    /* ==================================================
    UI
 ================================================== */

    return (
        <div>
            {/* ==================================================
            MAIN OPERATIONAL OVERVIEW
        ================================================== */}

            <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:grid-cols-2">
                {/* ==============================================
                LEFT SIDE
                TROUBLE TICKET OVERVIEW
            ============================================== */}

                <section className="p-4 xl:border-r xl:border-border">
                    {/* Header */}

                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-foreground">
                                    Trouble Ticket Overview
                                </h2>

                                <span
                                    className={`
                                    inline-flex
                                    items-center
                                    rounded-full
                                    border
                                    px-2
                                    py-0.5
                                    text-[9px]
                                    font-semibold

                                    ${summaryLoading
                                            ? "border-amber-200 bg-amber-50 text-amber-700"
                                            : summaryError
                                                ? "border-red-200 bg-red-50 text-red-700"
                                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        }
                                `}
                                >
                                    {summaryLoading
                                        ? "Loading"
                                        : summaryError
                                            ? "Unavailable"
                                            : "Live"}
                                </span>
                            </div>

                            <p className="mt-1 text-[10px] text-muted-foreground">
                                Current Trouble Ticket activity and workload
                            </p>
                        </div>
                    </div>

                    {/* ==========================================
                    TROUBLE TICKET KPI CARDS
                ========================================== */}

                    {summaryError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
                            <span className="font-semibold">
                                Trouble Ticket summary unavailable:
                            </span>{" "}
                            {summaryError}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {currentData.map(
                                (
                                    item
                                ) => (
                                    <button
                                        key={
                                            item.label
                                        }
                                        type="button"
                                        aria-label={`View ${item.label} list`}
                                        onClick={() =>
                                            openTroubleTicketList(
                                                item.route
                                            )
                                        }
                                        className={`
                    group
                    relative
                    min-h-[78px]
                    min-w-0
                    w-full
                    overflow-hidden
                    rounded-lg
                    border
                    border-border
                    border-t-2
                    px-2
                    py-2
                    text-left
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:shadow-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary/20

                    ${item.borderClass}
                    ${item.backgroundClass}
                `}
                                    >
                                        {/* Card title */}

                                        <div className="flex items-center justify-between gap-1">
                                            <p
                                                className="min-w-0 truncate text-[8px] font-semibold uppercase tracking-wide text-muted-foreground"
                                                title={
                                                    item.shortLabel
                                                }
                                            >
                                                {
                                                    item.shortLabel
                                                }
                                            </p>

                                            <span
                                                className={`
                            h-2
                            w-2
                            shrink-0
                            rounded-full

                            ${item.dotClass}
                        `}
                                            />
                                        </div>

                                        {/* Value */}

                                        <div className="mt-2 flex items-end justify-between gap-1">
                                            <p
                                                className={`
                            text-xl
                            font-bold
                            leading-none
                            tabular-nums

                            ${item.valueClass}
                        `}
                                            >
                                                {summaryLoading
                                                    ? "—"
                                                    : item.value.toLocaleString()}
                                            </p>

                                            <span className="text-[7px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                                                View →
                                            </span>
                                        </div>

                                        {/* Description */}

                                        <p
                                            className="mt-1 truncate text-[7px] leading-3 text-muted-foreground/75"
                                            title={
                                                item.description
                                            }
                                        >
                                            {
                                                item.description
                                            }
                                        </p>
                                    </button>
                                )
                            )}
                        </div>
                    )}

                    {/* ==========================================
                    TROUBLE TICKET CHART
                ========================================== */}

                    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/10">
                        {/* Chart header */}

                        <div className="border-b border-border px-3 py-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-[11px] font-semibold text-foreground">
                                        {getChartTitle()}
                                    </h3>

                                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                                        {getChartDescription()}
                                    </p>
                                </div>

                                {/* Chart controls */}

                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={
                                            chartType
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setChartType(
                                                event
                                                    .target
                                                    .value as ChartType
                                            )
                                        }
                                        aria-label="Select Trouble Ticket chart type"
                                        className={`
                                        h-7
                                        rounded-md
                                        border
                                        px-2
                                        text-[9px]
                                        font-medium
                                        outline-none
                                        transition-colors

                                        ${chartType ===
                                                "bar"
                                                ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                                                : "border-border bg-background text-foreground"
                                            }
                                    `}
                                    >
                                        <option value="bar">
                                            Bar
                                        </option>

                                        <option value="area">
                                            Area
                                        </option>

                                        <option value="pie">
                                            Pie
                                        </option>
                                    </select>

                                    {chartType !==
                                        "bar" && (
                                            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
                                                {RANGE_OPTIONS.map(
                                                    (
                                                        option
                                                    ) => (
                                                        <button
                                                            key={
                                                                option.key
                                                            }
                                                            type="button"
                                                            disabled={
                                                                trendLoading
                                                            }
                                                            onClick={() =>
                                                                setRange(
                                                                    option.key
                                                                )
                                                            }
                                                            className={`
                                                        rounded
                                                        px-1.5
                                                        py-1
                                                        text-[8px]
                                                        font-medium
                                                        transition-colors

                                                        ${range ===
                                                                    option.key
                                                                    ? "bg-blue-600 text-white"
                                                                    : "text-muted-foreground hover:bg-background"
                                                                }
                                                    `}
                                                        >
                                                            {
                                                                option.label
                                                            }
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>

                        {/* Chart body */}

                        <div className="px-2 pb-2 pt-1">
                            {renderChartContent()}
                        </div>
                    </div>
                </section>

                {/* ==============================================
                RIGHT SIDE
                REQUISITION WORKFLOW
            ============================================== */}

                <section className="border-t border-border p-4 xl:border-t-0">
                    {/* Header */}

                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-foreground">
                                    Requisition Workflow
                                </h2>

                                {!requisitionLoading &&
                                    !requisitionError && (
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
                                            Live
                                        </span>
                                    )}
                            </div>

                            <p className="mt-1 text-[10px] text-muted-foreground">
                                IT accessories requisition approval and processing
                            </p>
                        </div>

                        {!requisitionLoading &&
                            !requisitionError && (
                                <div className="rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-right">
                                    <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Total Active
                                    </p>

                                    <p className="text-lg font-bold leading-none tabular-nums text-foreground">
                                        {requisitionSummary
                                            .total_active
                                            .toLocaleString()}
                                    </p>
                                </div>
                            )}
                    </div>

                    {requisitionError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
                            <span className="font-semibold">
                                Requisition summary unavailable:
                            </span>{" "}
                            {requisitionError}
                        </div>
                    ) : (
                        <>
                            {/* ==================================
                                    THREE CARDS IN ONE ROW
                                    SAME STANDARD SIZE AS TT CARDS
                                ================================== */}

                            <div className="grid grid-cols-3 gap-2">
                                {/* Requisition Summary */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        openRequisitionList(
                                            REQUISITION_ROUTES.summary
                                        )
                                    }
                                    className="
            group
            relative
            min-h-[78px]
            min-w-0
            w-full
            overflow-hidden
            rounded-lg
            border
            border-sky-200
            border-t-2
            border-t-sky-500
            bg-sky-50/60
            px-2
            py-2
            text-left
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:shadow-sm
            focus:outline-none
            focus:ring-2
            focus:ring-sky-500/20
            dark:border-sky-900/60
            dark:bg-sky-950/10
        "
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <p
                                            className="min-w-0 truncate text-[8px] font-semibold uppercase tracking-wide text-muted-foreground"
                                            title="Requisition Summary"
                                        >
                                            Requisition Summary
                                        </p>

                                        <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                                    </div>

                                    <div className="mt-2 flex items-end justify-between gap-1">
                                        <p className="text-xl font-bold leading-none tabular-nums text-sky-600 dark:text-sky-400">
                                            {requisitionLoading
                                                ? "—"
                                                : requisitionSummary
                                                    .pending_categories
                                                    .toLocaleString()}
                                        </p>

                                        <span className="text-[7px] font-semibold text-sky-600 opacity-0 transition-opacity group-hover:opacity-100">
                                            View →
                                        </span>
                                    </div>

                                    <p
                                        className="mt-1 truncate text-[7px] leading-3 text-muted-foreground/75"
                                        title="Pending requisition categories"
                                    >
                                        Pending categories
                                    </p>
                                </button>

                                {/* Approval Pending */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        openRequisitionList(
                                            REQUISITION_ROUTES.pending
                                        )
                                    }
                                    className="
            group
            relative
            min-h-[78px]
            min-w-0
            w-full
            overflow-hidden
            rounded-lg
            border
            border-amber-200
            border-t-2
            border-t-amber-500
            bg-amber-50/60
            px-2
            py-2
            text-left
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:shadow-sm
            focus:outline-none
            focus:ring-2
            focus:ring-amber-500/20
            dark:border-amber-900/60
            dark:bg-amber-950/10
        "
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <p
                                            className="min-w-0 truncate text-[8px] font-semibold uppercase tracking-wide text-muted-foreground"
                                            title="Approval Pending"
                                        >
                                            Approval Pending
                                        </p>

                                        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                                    </div>

                                    <div className="mt-2 flex items-end justify-between gap-1">
                                        <p className="text-xl font-bold leading-none tabular-nums text-amber-600 dark:text-amber-400">
                                            {requisitionLoading
                                                ? "—"
                                                : requisitionSummary
                                                    .approval_pending
                                                    .toLocaleString()}
                                        </p>

                                        <span className="text-[7px] font-semibold text-amber-600 opacity-0 transition-opacity group-hover:opacity-100">
                                            View →
                                        </span>
                                    </div>

                                    <p
                                        className="mt-1 truncate text-[7px] leading-3 text-muted-foreground/75"
                                        title="Waiting for approval"
                                    >
                                        Waiting for approval
                                    </p>
                                </button>

                                {/* Rejected */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        openRequisitionList(
                                            REQUISITION_ROUTES.rejected
                                        )
                                    }
                                    className="
            group
            relative
            min-h-[78px]
            min-w-0
            w-full
            overflow-hidden
            rounded-lg
            border
            border-red-200
            border-t-2
            border-t-red-500
            bg-red-50/60
            px-2
            py-2
            text-left
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:shadow-sm
            focus:outline-none
            focus:ring-2
            focus:ring-red-500/20
            dark:border-red-900/60
            dark:bg-red-950/10
        "
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <p
                                            className="min-w-0 truncate text-[8px] font-semibold uppercase tracking-wide text-muted-foreground"
                                            title="Rejected"
                                        >
                                            Rejected
                                        </p>

                                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                                    </div>

                                    <div className="mt-2 flex items-end justify-between gap-1">
                                        <p className="text-xl font-bold leading-none tabular-nums text-red-600 dark:text-red-400">
                                            {requisitionLoading
                                                ? "—"
                                                : requisitionSummary
                                                    .rejected
                                                    .toLocaleString()}
                                        </p>

                                        <span className="text-[7px] font-semibold text-red-600 opacity-0 transition-opacity group-hover:opacity-100">
                                            View →
                                        </span>
                                    </div>

                                    <p
                                        className="mt-1 truncate text-[7px] leading-3 text-muted-foreground/75"
                                        title="Rejected requisitions"
                                    >
                                        Rejected requisitions
                                    </p>
                                </button>
                            </div>

                            {/* ==================================
                            REQUISITION STATUS DISTRIBUTION
                        ================================== */}

                            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/10">
                                {/* Header */}

                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-3">
                                    <div>
                                        <h3 className="text-[11px] font-semibold text-foreground">
                                            Requisition Status Distribution
                                        </h3>

                                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                                            Current requisition approval status
                                        </p>
                                    </div>

                                    <span className="rounded-full border border-border bg-background px-2 py-1 text-[8px] font-semibold text-muted-foreground">
                                        {requisitionLoading
                                            ? "Loading..."
                                            : `${requisitionSummary.total_active.toLocaleString()} Total`}
                                    </span>
                                </div>

                                {/* Bar chart */}

                                {requisitionLoading ? (
                                    <div className="flex h-[320px] items-center justify-center text-[10px] text-muted-foreground sm:h-[360px]">
                                        Loading Requisition chart...
                                    </div>
                                ) : (
                                    <div className="h-[320px] px-2 pb-2 pt-2 sm:h-[360px]">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            {renderRequisitionBarChart()}
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Status totals */}

                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}