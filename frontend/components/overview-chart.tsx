//itm/fronted/components/overview-chart.tsx

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
    type TroubleTicketDashboardSummary,
    type TroubleTicketOverviewPoint,
    type TroubleTicketRange,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const COLORS = {
    opened: "#2563eb",
    closed: "#10b981",
    running: "#f59e0b",
    procurement: "#8b5cf6",
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

const EMPTY_SUMMARY:
    TroubleTicketDashboardSummary = {
    opened_today: 0,
    closed_today: 0,
    total_running_tt: 0,
    total_procurement_tt: 0,
};

const RANGE_OPTIONS: {
    key: TroubleTicketRange;
    label: string;
}[] = [
        {
            key: "7d",
            label: "7 Days",
        },
        {
            key: "30d",
            label: "30 Days",
        },
        {
            key: "3m",
            label: "3 Months",
        },
    ];

const tooltipStyle = {
    background: "var(--card)",
    border:
        "1px solid var(--border)",
    borderRadius: "10px",
    fontSize: "11px",
    boxShadow:
        "0 12px 30px rgba(15, 23, 42, 0.14)",
};

/* -------------------------------------------------------------------------- */
/* Pie chart label                                                            */
/* -------------------------------------------------------------------------- */

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
        Number(value ?? 0);

    const numericPercent =
        Number(percent ?? 0);

    if (numericValue <= 0) {
        return null;
    }

    const radian =
        Math.PI / 180;

    const radius =
        Number(
            outerRadius ?? 0
        ) + 18;

    const x =
        Number(cx ?? 0) +
        radius *
        Math.cos(
            -Number(
                midAngle ?? 0
            ) * radian
        );

    const y =
        Number(cy ?? 0) +
        radius *
        Math.sin(
            -Number(
                midAngle ?? 0
            ) * radian
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
                    Number(cx ?? 0)
                    ? "start"
                    : "end"
            }
        >
            {`${numericValue.toLocaleString()} (${(
                numericPercent * 100
            ).toFixed(0)}%)`}
        </text>
    );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function OverviewChart() {
    const router =
        useRouter();

    const [
        chartType,
        setChartType,
    ] = useState<ChartType>(
        "bar"
    );

    const [
        range,
        setRange,
    ] =
        useState<TroubleTicketRange>(
            "7d"
        );

    const [
        ticketSummary,
        setTicketSummary,
    ] =
        useState<TroubleTicketDashboardSummary>(
            EMPTY_SUMMARY
        );

    const [
        trendSource,
        setTrendSource,
    ] = useState<
        TroubleTicketOverviewPoint[]
    >([]);

    const [
        summaryLoading,
        setSummaryLoading,
    ] = useState(true);

    const [
        trendLoading,
        setTrendLoading,
    ] = useState(true);

    const [
        summaryError,
        setSummaryError,
    ] = useState("");

    const [
        trendError,
        setTrendError,
    ] = useState("");

    function openTroubleTicketList(
        route: string
    ) {
        router.push(route);
    }

    /* ---------------------------------------------------------------------- */
    /* Load live summary                                                      */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        let mounted = true;

        async function loadTroubleTicketSummary() {
            try {
                setSummaryLoading(
                    true
                );

                setSummaryError("");

                const response =
                    await dashboardApi
                        .troubleTicketSummary();

                if (!mounted) {
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
            reason: unknown
            ) {
                if (!mounted) {
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
                if (mounted) {
                    setSummaryLoading(
                        false
                    );
                }
            }
        }

        void loadTroubleTicketSummary();

        return () => {
            mounted = false;
        };
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Load historical data                                                   */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        let mounted = true;

        async function loadTroubleTicketTrend() {
            try {
                setTrendLoading(
                    true
                );

                setTrendError("");

                const response =
                    await dashboardApi
                        .troubleTicketOverview(
                            range
                        );

                if (!mounted) {
                    return;
                }

                setTrendSource(
                    response.data
                        ?.items ?? []
                );
            } catch (
            reason: unknown
            ) {
                if (!mounted) {
                    return;
                }

                setTrendSource([]);

                setTrendError(
                    reason instanceof
                        Error
                        ? reason.message
                        : "Unable to load Trouble Ticket trend"
                );
            } finally {
                if (mounted) {
                    setTrendLoading(
                        false
                    );
                }
            }
        }

        void loadTroubleTicketTrend();

        return () => {
            mounted = false;
        };
    }, [range]);

    /* ---------------------------------------------------------------------- */
    /* KPI and vertical bar data                                              */
    /* ---------------------------------------------------------------------- */

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
                        "bg-blue-50/50 dark:bg-blue-950/10",
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
                        "bg-emerald-50/50 dark:bg-emerald-950/10",
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
                        "bg-amber-50/50 dark:bg-amber-950/10",
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
                        "bg-violet-50/50 dark:bg-violet-950/10",
                },
            ],
            [ticketSummary]
        );

    /* ---------------------------------------------------------------------- */
    /* Historical trend data                                                  */
    /* ---------------------------------------------------------------------- */

    const trendData =
        useMemo<
            TroubleTicketTrendRow[]
        >(
            () =>
                trendSource.map(
                    (item) => ({
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
            [trendSource]
        );

    const selectedRangeLabel =
        RANGE_OPTIONS.find(
            (option) =>
                option.key === range
        )?.label ?? "7 Days";

    const rangeOpenedTotal =
        trendData.reduce(
            (total, item) =>
                total +
                item.Opened,
            0
        );

    const rangeClosedTotal =
        trendData.reduce(
            (total, item) =>
                total +
                item.Closed,
            0
        );

    const selectedRangeActivityTotal =
        rangeOpenedTotal +
        rangeClosedTotal;

    /* ---------------------------------------------------------------------- */
    /* Vertical bar maximum                                                   */
    /* ---------------------------------------------------------------------- */

    const selectedMaximum =
        Math.max(
            ...currentData.map(
                (item) =>
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

    /* ---------------------------------------------------------------------- */
    /* Pie chart data                                                         */
    /* ---------------------------------------------------------------------- */

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

    /* ---------------------------------------------------------------------- */
    /* Bar value label                                                        */
    /* ---------------------------------------------------------------------- */

    function renderBarValueLabel(
        props: any
    ) {
        const {
            x,
            y,
            width,
            value,
        } = props;

        const numericValue =
            Number(value ?? 0);

        return (
            <text
                x={
                    Number(
                        x ?? 0
                    ) +
                    Number(
                        width ?? 0
                    ) /
                    2
                }
                y={
                    Number(
                        y ?? 0
                    ) - 8
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

    /* ---------------------------------------------------------------------- */
    /* Vertical bar chart                                                     */
    /* ---------------------------------------------------------------------- */

    function renderBarChart() {
        return (
            <BarChart
                data={currentData}
                margin={{
                    top: 32,
                    right: 18,
                    left: 0,
                    bottom: 18,
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
                        fontSize: 10,
                        fontWeight: 500,
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
                        fontSize: 9,
                        fill:
                            "var(--muted-foreground)",
                    }}
                />

                <Tooltip
                    cursor={{
                        fill:
                            "var(--muted)",
                        opacity: 0.2,
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
                                value ?? 0
                            ).toLocaleString(),

                            item?.payload
                                ?.shortLabel ??
                            String(name),
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
                        data: any
                    ) => {
                        const route =
                            data
                                ?.payload
                                ?.route ??
                            data?.route;

                        if (route) {
                            openTroubleTicketList(
                                String(
                                    route
                                )
                            );
                        }
                    }}
                >
                    {currentData.map(
                        (item) => (
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

    /* ---------------------------------------------------------------------- */
    /* Area chart                                                             */
    /* ---------------------------------------------------------------------- */

    function renderAreaChart() {
        const showDots =
            range !== "30d";

        return (
            <AreaChart
                data={trendData}
                margin={{
                    top: 22,
                    right: 12,
                    left: 2,
                    bottom: 8,
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
                        fontSize: 9,
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
                        fontSize: 9,
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
                        fontSize: 9,
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
                                value ?? 0
                            ).toLocaleString(),
                            String(name),
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
                                r: 2.5,
                            }
                            : false
                    }
                    activeDot={{
                        r: 5,
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
                                r: 2.5,
                            }
                            : false
                    }
                    activeDot={{
                        r: 5,
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
                                r: 2.5,
                            }
                            : false
                    }
                    activeDot={{
                        r: 5,
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
                                r: 2.5,
                            }
                            : false
                    }
                    activeDot={{
                        r: 5,
                    }}
                    isAnimationActive={
                        false
                    }
                />
            </AreaChart>
        );
    }

    /* ---------------------------------------------------------------------- */
    /* Pie chart                                                              */
    /* ---------------------------------------------------------------------- */

    function renderPieChart() {
        return (
            <PieChart>
                <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={72}
                    outerRadius={112}
                    paddingAngle={5}
                    labelLine={
                        false
                    }
                    label={
                        PieValueLabel
                    }
                    isAnimationActive={
                        false
                    }
                >
                    {pieData.map(
                        (item) => (
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
                                value ?? 0
                            ).toLocaleString(),
                            String(name),
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

    /* ---------------------------------------------------------------------- */
    /* Chart heading                                                          */
    /* ---------------------------------------------------------------------- */

    function getChartTitle() {
        if (
            chartType === "area"
        ) {
            return "Trouble Ticket Trend";
        }

        if (
            chartType === "pie"
        ) {
            return "Opened vs Closed Distribution";
        }

        return "Trouble Ticket Distribution";
    }

    function getChartDescription() {
        if (
            chartType === "area"
        ) {
            return `Historical ticket activity and workload for ${selectedRangeLabel.toLowerCase()}`;
        }

        if (
            chartType === "pie"
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
        chartType === "pie" &&
        selectedRangeActivityTotal ===
        0;

    /* ---------------------------------------------------------------------- */
    /* Chart content                                                          */
    /* ---------------------------------------------------------------------- */

    function renderChartContent() {
        /*
         * The vertical bar chart uses the live summary endpoint.
         * It must not depend on the historical overview endpoint.
         */
        if (
            chartType === "bar"
        ) {
            if (
                summaryLoading
            ) {
                return (
                    <div className="flex h-[320px] items-center justify-center text-xs text-muted-foreground sm:h-[360px]">
                        Loading Trouble
                        Ticket chart...
                    </div>
                );
            }

            if (summaryError) {
                return (
                    <div className="flex h-[320px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-center text-xs text-red-700 sm:h-[360px]">
                        {summaryError}
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

        /*
         * Area and pie charts depend on historical data.
         */
        if (trendLoading) {
            return (
                <div className="flex h-[320px] items-center justify-center text-xs text-muted-foreground sm:h-[360px]">
                    Loading Trouble
                    Ticket chart...
                </div>
            );
        }

        if (trendError) {
            return (
                <div className="flex h-[320px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-center text-xs text-red-700 sm:h-[360px]">
                    {trendError}
                </div>
            );
        }

        if (noTrendData) {
            return (
                <div className="flex h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center sm:h-[360px]">
                    <p className="text-xs font-semibold text-foreground">
                        No historical
                        data found
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                        No Trouble
                        Ticket records
                        are available
                        for the selected
                        period.
                    </p>
                </div>
            );
        }

        if (noPieData) {
            return (
                <div className="flex h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center sm:h-[360px]">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-[10px] border-muted">
                        <span className="text-lg font-bold text-muted-foreground">
                            0
                        </span>
                    </div>

                    <p className="mt-4 text-xs font-semibold text-foreground">
                        No opened or
                        closed activity
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                        No tickets were
                        opened or closed
                        during the
                        selected period.
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
                        : renderPieChart()}
                </ResponsiveContainer>
            </div>
        );
    }

    /* ---------------------------------------------------------------------- */
    /* UI                                                                     */
    /* ---------------------------------------------------------------------- */

    return (
        <div>
            {/* Main header */}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-foreground">
                            Trouble
                            Ticket
                            Overview
                        </h2>

                        <span
                            className={`
                                inline-flex
                                items-center
                                rounded-full
                                border
                                px-2 py-0.5
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

                    <p className="mt-1 text-xs text-muted-foreground">
                        Current
                        activity,
                        workload and
                        historical
                        performance
                    </p>
                </div>
            </div>

            {/* Live summary cards */}
            {summaryError ? (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700">
                    <span className="font-semibold">
                        Trouble
                        Ticket
                        summary
                        unavailable:
                    </span>{" "}
                    {summaryError}
                </div>
            ) : (
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {currentData.map(
                        (item) => (
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
                                    relative
                                    w-full
                                    cursor-pointer
                                    overflow-hidden
                                    rounded-xl
                                    border
                                    border-border
                                    border-t-2
                                    px-3 py-3
                                    text-left
                                    transition-all
                                    duration-200
                                    hover:-translate-y-0.5
                                    hover:shadow-md
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-primary/30
                                    ${item.borderClass}
                                    ${item.backgroundClass}
                                `}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            {
                                                item.shortLabel
                                            }
                                        </p>

                                        <p className="mt-1 text-[9px] leading-3 text-muted-foreground/80">
                                            {
                                                item.description
                                            }
                                        </p>
                                    </div>

                                    <span
                                        className={`
                                            mt-0.5
                                            h-2.5
                                            w-2.5
                                            shrink-0
                                            rounded-full
                                            ${item.dotClass}
                                        `}
                                    />
                                </div>

                                <p
                                    className={`
                                        mt-3
                                        text-2xl
                                        font-bold
                                        tabular-nums
                                        ${item.valueClass}
                                    `}
                                >
                                    {summaryLoading
                                        ? "—"
                                        : item.value.toLocaleString()}
                                </p>

                                <p className="mt-1 text-[9px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                                    View
                                    records
                                </p>
                            </button>
                        )
                    )}
                </div>
            )}

            {/* Chart section */}
            <div className="rounded-xl border border-border bg-muted/10 p-3">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="text-xs font-semibold text-foreground">
                            {
                                getChartTitle()
                            }
                        </h3>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                            {
                                getChartDescription()
                            }
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Chart selector */}
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
                                h-8
                                rounded-lg
                                border
                                px-3
                                text-xs
                                font-medium
                                outline-none
                                transition-colors
                                focus:ring-2
                                focus:ring-blue-200
                                ${chartType ===
                                    "bar"
                                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                                    : "border-border bg-background text-foreground"
                                }
                            `}
                        >
                            <option value="bar">
                                Vertical
                                Bar
                                Chart
                            </option>

                            <option value="area">
                                Area
                                Chart
                            </option>

                            <option value="pie">
                                Pie
                                Chart
                            </option>
                        </select>

                        {/* Range controls */}
                        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
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
                                            chartType !==
                                            "bar" &&
                                            trendLoading
                                        }
                                        onClick={() =>
                                            setRange(
                                                option.key
                                            )
                                        }
                                        className={`
                                            rounded-md
                                            px-3 py-1
                                            text-xs
                                            font-medium
                                            transition-colors
                                            disabled:cursor-not-allowed
                                            disabled:opacity-60
                                            ${range ===
                                                option.key
                                                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                                : "text-muted-foreground hover:bg-background hover:text-foreground"
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
                    </div>
                </div>

                {renderChartContent()}
            </div>
        </div>
    );
}

