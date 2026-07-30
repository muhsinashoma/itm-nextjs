//frontend/components/overview-chart.tsx

"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

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
    | "area"
    | "bar"
    | "pie";

type TicketChartRow = {
    date: string;
    Open: number;
    InProgress: number;
    Closed: number;
};

type PieChartRow = {
    name: string;
    value: number;
    color: string;
};

type SummaryCard = {
    label: string;
    shortLabel: string;
    description: string;
    value: number;
    color: string;
    dotClass: string;
    valueClass: string;
    borderClass: string;
    backgroundClass: string;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const COLORS = {
    Open: "#3b82f6",
    InProgress: "#f59e0b",
    Closed: "#10b981",
};

const EMPTY_SUMMARY: TroubleTicketDashboardSummary = {
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
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "11px",
    boxShadow:
        "0 8px 20px rgba(15, 23, 42, 0.12)",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function mapOverviewData(
    items: TroubleTicketOverviewPoint[]
): TicketChartRow[] {
    return items.map((item) => ({
        date: item.label,
        Open: Number(
            item.open ?? 0
        ),
        InProgress: Number(
            item.in_progress ?? 0
        ),
        Closed: Number(
            item.closed ?? 0
        ),
    }));
}

function PieValueLabel(props: any) {
    const {
        name,
        value,
        percent,
    } = props;

    const numericValue =
        Number(value ?? 0);

    const numericPercent =
        Number(percent ?? 0);

    if (
        numericValue <= 0 ||
        numericPercent < 0.04
    ) {
        return null;
    }

    return `${name}: ${numericValue.toLocaleString()} (${(
        numericPercent * 100
    ).toFixed(0)}%)`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function OverviewChart() {
    const [
        range,
        setRange,
    ] = useState<TroubleTicketRange>(
        "7d"
    );

    const [
        chartType,
        setChartType,
    ] = useState<ChartType>(
        "area"
    );

    const [
        source,
        setSource,
    ] = useState<
        TroubleTicketOverviewPoint[]
    >([]);

    const [
        apiTotal,
        setApiTotal,
    ] = useState(0);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

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
    ] = useState(true);

    const [
        summaryError,
        setSummaryError,
    ] = useState("");

    /* ---------------------------------------------------------------------- */
    /* Load overview chart                                                    */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        let mounted = true;

        async function loadOverview() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await dashboardApi
                        .troubleTicketOverview(
                            range
                        );

                if (!mounted) {
                    return;
                }

                setSource(
                    response.data?.items ?? []
                );

                setApiTotal(
                    Number(
                        response.data?.total ??
                        0
                    )
                );
            } catch (
            reason: unknown
            ) {
                if (!mounted) {
                    return;
                }

                setSource([]);
                setApiTotal(0);

                setError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load Trouble Ticket overview"
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        void loadOverview();

        return () => {
            mounted = false;
        };
    }, [range]);

    /* ---------------------------------------------------------------------- */
    /* Load summary cards                                                     */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        let mounted = true;

        async function loadSummary() {
            try {
                setSummaryLoading(true);
                setSummaryError("");

                const response =
                    await dashboardApi
                        .troubleTicketSummary();

                if (!mounted) {
                    return;
                }

                setTicketSummary({
                    opened_today: Number(
                        response.data
                            ?.opened_today ??
                        0
                    ),

                    closed_today: Number(
                        response.data
                            ?.closed_today ??
                        0
                    ),

                    total_running_tt:
                        Number(
                            response.data
                                ?.total_running_tt ??
                            0
                        ),

                    total_procurement_tt:
                        Number(
                            response.data
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
                    reason instanceof Error
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

        void loadSummary();

        return () => {
            mounted = false;
        };
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Derived chart data                                                     */
    /* ---------------------------------------------------------------------- */

    const data = useMemo(
        () =>
            mapOverviewData(source),
        [source]
    );

    const calculatedTotal =
        useMemo(
            () =>
                data.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        item.Open +
                        item.InProgress +
                        item.Closed,
                    0
                ),
            [data]
        );

    const total =
        apiTotal ||
        calculatedTotal;

    const pieData =
        useMemo<PieChartRow[]>(
            () => {
                const totals =
                    data.reduce(
                        (
                            result,
                            item
                        ) => {
                            result.Open +=
                                item.Open;

                            result.InProgress +=
                                item.InProgress;

                            result.Closed +=
                                item.Closed;

                            return result;
                        },
                        {
                            Open: 0,
                            InProgress: 0,
                            Closed: 0,
                        }
                    );

                return [
                    {
                        name: "Open",
                        value:
                            totals.Open,
                        color:
                            COLORS.Open,
                    },
                    {
                        name:
                            "In Progress",
                        value:
                            totals.InProgress,
                        color:
                            COLORS.InProgress,
                    },
                    {
                        name: "Closed",
                        value:
                            totals.Closed,
                        color:
                            COLORS.Closed,
                    },
                ];
            },
            [data]
        );

    const summaryCards =
        useMemo<SummaryCard[]>(
            () => [
                {
                    label:
                        "TT Opened Today",
                    shortLabel:
                        "Opened Today",
                    description:
                        "Tickets registered today",
                    value:
                        ticketSummary.opened_today,
                    color: "#3b82f6",
                    dotClass:
                        "bg-blue-500",
                    valueClass:
                        "text-blue-600 dark:text-blue-400",
                    borderClass:
                        "border-t-blue-500",
                    backgroundClass:
                        "bg-blue-50/40 dark:bg-blue-950/10",
                },
                {
                    label:
                        "TT Closed Today",
                    shortLabel:
                        "Closed Today",
                    description:
                        "Tickets resolved today",
                    value:
                        ticketSummary.closed_today,
                    color: "#10b981",
                    dotClass:
                        "bg-emerald-500",
                    valueClass:
                        "text-emerald-600 dark:text-emerald-400",
                    borderClass:
                        "border-t-emerald-500",
                    backgroundClass:
                        "bg-emerald-50/40 dark:bg-emerald-950/10",
                },
                {
                    label:
                        "Total Running TT",
                    shortLabel:
                        "Running TT",
                    description:
                        "Currently active tickets",
                    value:
                        ticketSummary.total_running_tt,
                    color: "#f59e0b",
                    dotClass:
                        "bg-amber-500",
                    valueClass:
                        "text-amber-600 dark:text-amber-400",
                    borderClass:
                        "border-t-amber-500",
                    backgroundClass:
                        "bg-amber-50/40 dark:bg-amber-950/10",
                },
                {
                    label:
                        "Total Procurement TT",
                    shortLabel:
                        "Procurement TT",
                    description:
                        "Tickets requiring procurement",
                    value:
                        ticketSummary.total_procurement_tt,
                    color: "#8b5cf6",
                    dotClass:
                        "bg-violet-500",
                    valueClass:
                        "text-violet-600 dark:text-violet-400",
                    borderClass:
                        "border-t-violet-500",
                    backgroundClass:
                        "bg-violet-50/40 dark:bg-violet-950/10",
                },
            ],
            [ticketSummary]
        );

    const xAxisInterval =
        range === "30d"
            ? 4
            : 0;

    /* ---------------------------------------------------------------------- */
    /* Chart labels                                                           */
    /* ---------------------------------------------------------------------- */

    const renderValueLabel = (
        props: any
    ) => {
        const {
            x,
            y,
            value,
            index,
            width,
        } = props;

        const numericValue =
            Number(value ?? 0);

        if (numericValue <= 0) {
            return null;
        }

        if (
            range === "30d" &&
            Number(index ?? 0) %
            3 !==
            0
        ) {
            return null;
        }

        const labelX =
            Number(x ?? 0) +
            Number(width ?? 0) /
            2;

        return (
            <text
                x={labelX}
                y={
                    Number(y ?? 0) -
                    7
                }
                fill="var(--foreground)"
                fontSize={9}
                fontWeight={600}
                textAnchor="middle"
            >
                {numericValue.toLocaleString()}
            </text>
        );
    };

    /* ---------------------------------------------------------------------- */
    /* Area chart                                                             */
    /* ---------------------------------------------------------------------- */

    const renderAreaChart =
        () => (
            <AreaChart
                data={data}
                margin={{
                    top: 28,
                    right: 12,
                    left: -18,
                    bottom: 2,
                }}
            >
                <defs>
                    <linearGradient
                        id="ticketOpenGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="5%"
                            stopColor={
                                COLORS.Open
                            }
                            stopOpacity={
                                0.2
                            }
                        />

                        <stop
                            offset="95%"
                            stopColor={
                                COLORS.Open
                            }
                            stopOpacity={
                                0
                            }
                        />
                    </linearGradient>

                    <linearGradient
                        id="ticketProgressGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="5%"
                            stopColor={
                                COLORS.InProgress
                            }
                            stopOpacity={
                                0.2
                            }
                        />

                        <stop
                            offset="95%"
                            stopColor={
                                COLORS.InProgress
                            }
                            stopOpacity={
                                0
                            }
                        />
                    </linearGradient>

                    <linearGradient
                        id="ticketClosedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="5%"
                            stopColor={
                                COLORS.Closed
                            }
                            stopOpacity={
                                0.2
                            }
                        />

                        <stop
                            offset="95%"
                            stopColor={
                                COLORS.Closed
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
                    vertical={false}
                />

                <XAxis
                    dataKey="date"
                    interval={
                        xAxisInterval
                    }
                    minTickGap={10}
                    tick={{
                        fontSize: 10,
                        fill: "var(--muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                />

                <YAxis
                    allowDecimals={
                        false
                    }
                    tick={{
                        fontSize: 10,
                        fill: "var(--muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                />

                <Tooltip
                    cursor={{
                        stroke:
                            "var(--border)",
                        strokeWidth: 1,
                    }}
                    contentStyle={
                        tooltipStyle
                    }
                    formatter={(
                        value,
                        name
                    ) => {
                        const displayName =
                            String(
                                name
                            ) ===
                                "InProgress"
                                ? "In Progress"
                                : String(
                                    name
                                );

                        return [
                            Number(
                                value
                            ).toLocaleString(),
                            displayName,
                        ];
                    }}
                />

                <Legend
                    wrapperStyle={{
                        fontSize:
                            "11px",
                        paddingTop:
                            "12px",
                    }}
                />

                <Area
                    type="monotone"
                    dataKey="Open"
                    name="Open"
                    stroke={
                        COLORS.Open
                    }
                    strokeWidth={2}
                    fill="url(#ticketOpenGradient)"
                    dot={{
                        r: 2.5,
                    }}
                    activeDot={{
                        r: 5,
                    }}
                    isAnimationActive={
                        false
                    }
                >
                    <LabelList
                        dataKey="Open"
                        content={
                            renderValueLabel
                        }
                    />
                </Area>

                <Area
                    type="monotone"
                    dataKey="InProgress"
                    name="In Progress"
                    stroke={
                        COLORS.InProgress
                    }
                    strokeWidth={2}
                    fill="url(#ticketProgressGradient)"
                    dot={{
                        r: 2.5,
                    }}
                    activeDot={{
                        r: 5,
                    }}
                    isAnimationActive={
                        false
                    }
                >
                    <LabelList
                        dataKey="InProgress"
                        content={
                            renderValueLabel
                        }
                    />
                </Area>

                <Area
                    type="monotone"
                    dataKey="Closed"
                    name="Closed"
                    stroke={
                        COLORS.Closed
                    }
                    strokeWidth={2}
                    fill="url(#ticketClosedGradient)"
                    dot={{
                        r: 2.5,
                    }}
                    activeDot={{
                        r: 5,
                    }}
                    isAnimationActive={
                        false
                    }
                >
                    <LabelList
                        dataKey="Closed"
                        content={
                            renderValueLabel
                        }
                    />
                </Area>
            </AreaChart>
        );

    /* ---------------------------------------------------------------------- */
    /* Bar chart                                                              */
    /* ---------------------------------------------------------------------- */

    const renderBarChart =
        () => (
            <BarChart
                data={data}
                margin={{
                    top: 28,
                    right: 12,
                    left: -18,
                    bottom: 2,
                }}
                barCategoryGap="18%"
                barGap={2}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                />

                <XAxis
                    dataKey="date"
                    interval={
                        xAxisInterval
                    }
                    minTickGap={10}
                    tick={{
                        fontSize: 10,
                        fill: "var(--muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                />

                <YAxis
                    allowDecimals={
                        false
                    }
                    tick={{
                        fontSize: 10,
                        fill: "var(--muted-foreground)",
                    }}
                    axisLine={false}
                    tickLine={false}
                />

                <Tooltip
                    cursor={false}
                    contentStyle={
                        tooltipStyle
                    }
                    formatter={(
                        value,
                        name
                    ) => [
                            Number(
                                value
                            ).toLocaleString(),

                            String(name) ===
                                "InProgress"
                                ? "In Progress"
                                : String(
                                    name
                                ),
                        ]}
                />

                <Legend
                    wrapperStyle={{
                        fontSize:
                            "11px",
                        paddingTop:
                            "12px",
                    }}
                />

                <Bar
                    dataKey="Open"
                    name="Open"
                    fill={
                        COLORS.Open
                    }
                    radius={[
                        4,
                        4,
                        0,
                        0,
                    ]}
                    maxBarSize={34}
                    isAnimationActive={
                        false
                    }
                >
                    <LabelList
                        dataKey="Open"
                        content={
                            renderValueLabel
                        }
                    />
                </Bar>

                <Bar
                    dataKey="InProgress"
                    name="In Progress"
                    fill={
                        COLORS.InProgress
                    }
                    radius={[
                        4,
                        4,
                        0,
                        0,
                    ]}
                    maxBarSize={34}
                    isAnimationActive={
                        false
                    }
                >
                    <LabelList
                        dataKey="InProgress"
                        content={
                            renderValueLabel
                        }
                    />
                </Bar>

                <Bar
                    dataKey="Closed"
                    name="Closed"
                    fill={
                        COLORS.Closed
                    }
                    radius={[
                        4,
                        4,
                        0,
                        0,
                    ]}
                    maxBarSize={34}
                    isAnimationActive={
                        false
                    }
                >
                    <LabelList
                        dataKey="Closed"
                        content={
                            renderValueLabel
                        }
                    />
                </Bar>
            </BarChart>
        );

    /* ---------------------------------------------------------------------- */
    /* Pie chart                                                              */
    /* ---------------------------------------------------------------------- */

    const renderPieChart =
        () => (
            <PieChart>
                <Pie
                    data={
                        pieData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius={
                        58
                    }
                    outerRadius={
                        94
                    }
                    paddingAngle={
                        4
                    }
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
                        (
                            entry
                        ) => (
                            <Cell
                                key={
                                    entry.name
                                }
                                fill={
                                    entry.color
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
                                value
                            ).toLocaleString(),
                            String(name),
                        ]}
                />

                <Legend
                    wrapperStyle={{
                        fontSize:
                            "11px",
                        paddingTop:
                            "12px",
                    }}
                />
            </PieChart>
        );

    function renderSelectedChart() {
        if (
            chartType === "bar"
        ) {
            return renderBarChart();
        }

        if (
            chartType === "pie"
        ) {
            return renderPieChart();
        }

        return renderAreaChart();
    }

    /* ---------------------------------------------------------------------- */
    /* UI                                                                     */
    /* ---------------------------------------------------------------------- */

    return (
        <div>
            {/* Header */}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-foreground">
                            Trouble
                            Ticket
                            Overview
                        </h2>

                        <span
                            className={`
                                inline-flex items-center
                                rounded-full border
                                px-2 py-0.5
                                text-[9px] font-semibold
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

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {loading
                            ? "Loading ticket trend..."
                            : `${total.toLocaleString()} tickets recorded in the selected period`}
                    </p>
                </div>

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
                        disabled={
                            loading
                        }
                        aria-label="Select Trouble Ticket chart type"
                        className="
                            h-8 rounded-lg
                            border border-border
                            bg-background px-3
                            text-xs font-medium
                            text-foreground
                            outline-none
                            transition-all
                            hover:bg-muted
                            focus:ring-2
                            focus:ring-ring
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        <option value="area">
                            Area
                            Chart
                        </option>

                        <option value="bar">
                            Bar
                            Chart
                        </option>

                        <option value="pie">
                            Pie
                            Chart
                        </option>
                    </select>

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
                                        loading
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
                                        transition-all
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                        ${range ===
                                            option.key
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
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

            {/* Summary cards */}
            <div className="mb-5">
                {summaryError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <span className="font-semibold">
                            Summary
                            unavailable:
                        </span>{" "}
                        {
                            summaryError
                        }
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {summaryCards.map(
                            (
                                item
                            ) => (
                                <div
                                    key={
                                        item.label
                                    }
                                    className={`
                                        relative
                                        overflow-hidden
                                        rounded-xl
                                        border
                                        border-border
                                        border-t-2
                                        px-3 py-3
                                        transition-all
                                        duration-200
                                        hover:-translate-y-0.5
                                        hover:shadow-sm
                                        ${item.borderClass}
                                        ${item.backgroundClass}
                                    `}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p
                                                title={
                                                    item.label
                                                }
                                                className="
                                                    truncate
                                                    text-[10px]
                                                    font-semibold
                                                    uppercase
                                                    tracking-wide
                                                    text-muted-foreground
                                                "
                                            >
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
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Chart */}
            {loading ? (
                <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    Loading
                    Trouble
                    Ticket
                    overview...
                </div>
            ) : error ? (
                <div className="flex h-[300px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
                    {error}
                </div>
            ) : total ===
                0 ? (
                <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    No Trouble
                    Ticket
                    records
                    found for
                    this period.
                </div>
            ) : (
                <div className="h-[280px] sm:h-[320px]">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        {renderSelectedChart()}
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}



// // //To add label for all chart types (Area, Bar, Pie) in the OverviewChart component using Recharts library.

// //fortend/components/overview-chart.tsx

// "use client";

// import {
//     useEffect,
//     useMemo,
//     useState,
// } from "react";

// import {
//     Area,
//     AreaChart,
//     Bar,
//     BarChart,
//     CartesianGrid,
//     Cell,
//     LabelList,
//     Legend,
//     Pie,
//     PieChart,
//     ResponsiveContainer,
//     Tooltip,
//     XAxis,
//     YAxis,
// } from "recharts";

// import {
//     dashboardApi,
//     type TroubleTicketOverviewPoint,
//     type TroubleTicketRange,
// } from "@/lib/api";

// type ChartType =
//     | "area"
//     | "bar"
//     | "pie";

// type TicketChartRow = {
//     date: string;
//     Open: number;
//     InProgress: number;
//     Closed: number;
// };

// type PieChartRow = {
//     name: string;
//     value: number;
//     color: string;
// };

// const COLORS = {
//     Open: "#3b82f6",
//     InProgress: "#f59e0b",
//     Closed: "#10b981",
// };

// const RANGE_OPTIONS: {
//     key: TroubleTicketRange;
//     label: string;
// }[] = [
//         {
//             key: "7d",
//             label: "7 Days",
//         },
//         {
//             key: "30d",
//             label: "30 Days",
//         },
//         {
//             key: "3m",
//             label: "3 Months",
//         },
//     ];

// const tooltipStyle = {
//     background: "var(--card)",
//     border: "1px solid var(--border)",
//     borderRadius: "8px",
//     fontSize: "11px",
//     boxShadow:
//         "0 8px 20px rgba(15, 23, 42, 0.12)",
// };

// function mapOverviewData(
//     items: TroubleTicketOverviewPoint[]
// ): TicketChartRow[] {
//     return items.map((item) => ({
//         date: item.label,
//         Open: Number(item.open ?? 0),
//         InProgress: Number(
//             item.in_progress ?? 0
//         ),
//         Closed: Number(item.closed ?? 0),
//     }));
// }

// function PieValueLabel(props: any) {
//     const {
//         name,
//         value,
//         percent,
//     } = props;

//     const numericValue =
//         Number(value ?? 0);

//     const numericPercent =
//         Number(percent ?? 0);

//     if (
//         numericValue <= 0 ||
//         numericPercent < 0.04
//     ) {
//         return null;
//     }

//     return `${name}: ${numericValue.toLocaleString()} (${(
//         numericPercent * 100
//     ).toFixed(0)}%)`;
// }

// export default function OverviewChart() {
//     const [
//         range,
//         setRange,
//     ] = useState<TroubleTicketRange>(
//         "7d"
//     );

//     const [
//         chartType,
//         setChartType,
//     ] = useState<ChartType>("area");

//     const [
//         source,
//         setSource,
//     ] = useState<
//         TroubleTicketOverviewPoint[]
//     >([]);

//     const [
//         apiTotal,
//         setApiTotal,
//     ] = useState(0);

//     const [
//         loading,
//         setLoading,
//     ] = useState(true);

//     const [
//         error,
//         setError,
//     ] = useState("");

//     useEffect(() => {
//         let mounted = true;

//         async function loadOverview() {
//             try {
//                 setLoading(true);
//                 setError("");

//                 const response =
//                     await dashboardApi
//                         .troubleTicketOverview(
//                             range
//                         );

//                 if (!mounted) {
//                     return;
//                 }

//                 setSource(
//                     response.data.items ?? []
//                 );

//                 setApiTotal(
//                     Number(
//                         response.data.total ?? 0
//                     )
//                 );
//             } catch (
//             reason: unknown
//             ) {
//                 if (!mounted) {
//                     return;
//                 }

//                 setSource([]);
//                 setApiTotal(0);

//                 setError(
//                     reason instanceof Error
//                         ? reason.message
//                         : "Unable to load Trouble Ticket overview"
//                 );
//             } finally {
//                 if (mounted) {
//                     setLoading(false);
//                 }
//             }
//         }

//         void loadOverview();

//         return () => {
//             mounted = false;
//         };
//     }, [range]);

//     const data = useMemo(
//         () => mapOverviewData(source),
//         [source]
//     );

//     const calculatedTotal = useMemo(
//         () =>
//             data.reduce(
//                 (total, item) =>
//                     total +
//                     item.Open +
//                     item.InProgress +
//                     item.Closed,
//                 0
//             ),
//         [data]
//     );

//     const total =
//         apiTotal || calculatedTotal;

//     const pieData =
//         useMemo<PieChartRow[]>(() => {
//             const totals = data.reduce(
//                 (result, item) => {
//                     result.Open +=
//                         item.Open;

//                     result.InProgress +=
//                         item.InProgress;

//                     result.Closed +=
//                         item.Closed;

//                     return result;
//                 },
//                 {
//                     Open: 0,
//                     InProgress: 0,
//                     Closed: 0,
//                 }
//             );

//             return [
//                 {
//                     name: "Open",
//                     value: totals.Open,
//                     color: COLORS.Open,
//                 },
//                 {
//                     name: "In Progress",
//                     value:
//                         totals.InProgress,
//                     color:
//                         COLORS.InProgress,
//                 },
//                 {
//                     name: "Closed",
//                     value: totals.Closed,
//                     color: COLORS.Closed,
//                 },
//             ];
//         }, [data]);

//     const xAxisInterval =
//         range === "30d"
//             ? 4
//             : 0;

//     const renderValueLabel = (
//         props: any
//     ) => {
//         const {
//             x,
//             y,
//             value,
//             index,
//         } = props;

//         const numericValue =
//             Number(value ?? 0);

//         if (numericValue <= 0) {
//             return null;
//         }

//         /*
//          * Thirty daily points become crowded.
//          * Keep representative labels while all
//          * values remain available in the tooltip.
//          */
//         if (
//             range === "30d" &&
//             Number(index ?? 0) % 3 !== 0
//         ) {
//             return null;
//         }

//         return (
//             <text
//                 x={Number(x ?? 0)}
//                 y={Number(y ?? 0) - 7}
//                 fill="var(--foreground)"
//                 fontSize={9}
//                 fontWeight={600}
//                 textAnchor="middle"
//             >
//                 {numericValue.toLocaleString()}
//             </text>
//         );
//     };

//     const renderAreaChart = () => (
//         <AreaChart
//             data={data}
//             margin={{
//                 top: 28,
//                 right: 12,
//                 left: -18,
//                 bottom: 2,
//             }}
//         >
//             <defs>
//                 <linearGradient
//                     id="ticketOpenGradient"
//                     x1="0"
//                     y1="0"
//                     x2="0"
//                     y2="1"
//                 >
//                     <stop
//                         offset="5%"
//                         stopColor={
//                             COLORS.Open
//                         }
//                         stopOpacity={0.2}
//                     />

//                     <stop
//                         offset="95%"
//                         stopColor={
//                             COLORS.Open
//                         }
//                         stopOpacity={0}
//                     />
//                 </linearGradient>

//                 <linearGradient
//                     id="ticketProgressGradient"
//                     x1="0"
//                     y1="0"
//                     x2="0"
//                     y2="1"
//                 >
//                     <stop
//                         offset="5%"
//                         stopColor={
//                             COLORS.InProgress
//                         }
//                         stopOpacity={0.2}
//                     />

//                     <stop
//                         offset="95%"
//                         stopColor={
//                             COLORS.InProgress
//                         }
//                         stopOpacity={0}
//                     />
//                 </linearGradient>

//                 <linearGradient
//                     id="ticketClosedGradient"
//                     x1="0"
//                     y1="0"
//                     x2="0"
//                     y2="1"
//                 >
//                     <stop
//                         offset="5%"
//                         stopColor={
//                             COLORS.Closed
//                         }
//                         stopOpacity={0.2}
//                     />

//                     <stop
//                         offset="95%"
//                         stopColor={
//                             COLORS.Closed
//                         }
//                         stopOpacity={0}
//                     />
//                 </linearGradient>
//             </defs>

//             <CartesianGrid
//                 strokeDasharray="3 3"
//                 stroke="var(--border)"
//                 vertical={false}
//             />

//             <XAxis
//                 dataKey="date"
//                 interval={xAxisInterval}
//                 minTickGap={10}
//                 tick={{
//                     fontSize: 10,
//                     fill:
//                         "var(--muted-foreground)",
//                 }}
//                 axisLine={false}
//                 tickLine={false}
//             />

//             <YAxis
//                 allowDecimals={false}
//                 tick={{
//                     fontSize: 10,
//                     fill:
//                         "var(--muted-foreground)",
//                 }}
//                 axisLine={false}
//                 tickLine={false}
//             />

//             <Tooltip
//                 cursor={{
//                     stroke:
//                         "var(--border)",
//                     strokeWidth: 1,
//                 }}
//                 contentStyle={
//                     tooltipStyle
//                 }
//                 formatter={(
//                     value,
//                     name
//                 ) => {
//                     const displayName =
//                         String(name) ===
//                             "InProgress"
//                             ? "In Progress"
//                             : String(name);

//                     return [
//                         Number(
//                             value
//                         ).toLocaleString(),
//                         displayName,
//                     ];
//                 }}
//             />

//             <Legend
//                 wrapperStyle={{
//                     fontSize: "11px",
//                     paddingTop: "12px",
//                 }}
//             />

//             <Area
//                 type="monotone"
//                 dataKey="Open"
//                 name="Open"
//                 stroke={COLORS.Open}
//                 strokeWidth={2}
//                 fill="url(#ticketOpenGradient)"
//                 dot={{
//                     r: 2.5,
//                 }}
//                 activeDot={{
//                     r: 5,
//                 }}
//                 isAnimationActive={false}
//             >
//                 <LabelList
//                     dataKey="Open"
//                     content={
//                         renderValueLabel
//                     }
//                 />
//             </Area>

//             <Area
//                 type="monotone"
//                 dataKey="InProgress"
//                 name="In Progress"
//                 stroke={
//                     COLORS.InProgress
//                 }
//                 strokeWidth={2}
//                 fill="url(#ticketProgressGradient)"
//                 dot={{
//                     r: 2.5,
//                 }}
//                 activeDot={{
//                     r: 5,
//                 }}
//                 isAnimationActive={false}
//             >
//                 <LabelList
//                     dataKey="InProgress"
//                     content={
//                         renderValueLabel
//                     }
//                 />
//             </Area>

//             <Area
//                 type="monotone"
//                 dataKey="Closed"
//                 name="Closed"
//                 stroke={COLORS.Closed}
//                 strokeWidth={2}
//                 fill="url(#ticketClosedGradient)"
//                 dot={{
//                     r: 2.5,
//                 }}
//                 activeDot={{
//                     r: 5,
//                 }}
//                 isAnimationActive={false}
//             >
//                 <LabelList
//                     dataKey="Closed"
//                     content={
//                         renderValueLabel
//                     }
//                 />
//             </Area>
//         </AreaChart>
//     );

//     const renderBarChart = () => (
//         <BarChart
//             data={data}
//             margin={{
//                 top: 28,
//                 right: 12,
//                 left: -18,
//                 bottom: 2,
//             }}
//             barCategoryGap="18%"
//             barGap={2}
//         >
//             <CartesianGrid
//                 strokeDasharray="3 3"
//                 stroke="var(--border)"
//                 vertical={false}
//             />

//             <XAxis
//                 dataKey="date"
//                 interval={xAxisInterval}
//                 minTickGap={10}
//                 tick={{
//                     fontSize: 10,
//                     fill:
//                         "var(--muted-foreground)",
//                 }}
//                 axisLine={false}
//                 tickLine={false}
//             />

//             <YAxis
//                 allowDecimals={false}
//                 tick={{
//                     fontSize: 10,
//                     fill:
//                         "var(--muted-foreground)",
//                 }}
//                 axisLine={false}
//                 tickLine={false}
//             />

//             <Tooltip
//                 cursor={false}
//                 contentStyle={
//                     tooltipStyle
//                 }
//                 formatter={(
//                     value,
//                     name
//                 ) => [
//                         Number(
//                             value
//                         ).toLocaleString(),
//                         String(name),
//                     ]}
//             />

//             <Legend
//                 wrapperStyle={{
//                     fontSize: "11px",
//                     paddingTop: "12px",
//                 }}
//             />

//             <Bar
//                 dataKey="Open"
//                 name="Open"
//                 fill={COLORS.Open}
//                 radius={[4, 4, 0, 0]}
//                 maxBarSize={34}
//                 isAnimationActive={false}
//             >
//                 <LabelList
//                     dataKey="Open"
//                     content={
//                         renderValueLabel
//                     }
//                 />
//             </Bar>

//             <Bar
//                 dataKey="InProgress"
//                 name="In Progress"
//                 fill={
//                     COLORS.InProgress
//                 }
//                 radius={[4, 4, 0, 0]}
//                 maxBarSize={34}
//                 isAnimationActive={false}
//             >
//                 <LabelList
//                     dataKey="InProgress"
//                     content={
//                         renderValueLabel
//                     }
//                 />
//             </Bar>

//             <Bar
//                 dataKey="Closed"
//                 name="Closed"
//                 fill={COLORS.Closed}
//                 radius={[4, 4, 0, 0]}
//                 maxBarSize={34}
//                 isAnimationActive={false}
//             >
//                 <LabelList
//                     dataKey="Closed"
//                     content={
//                         renderValueLabel
//                     }
//                 />
//             </Bar>
//         </BarChart>
//     );

//     const renderPieChart = () => (
//         <PieChart>
//             <Pie
//                 data={pieData}
//                 dataKey="value"
//                 nameKey="name"
//                 cx="50%"
//                 cy="48%"
//                 innerRadius={58}
//                 outerRadius={94}
//                 paddingAngle={4}
//                 labelLine={false}
//                 label={PieValueLabel}
//                 isAnimationActive={false}
//             >
//                 {pieData.map(
//                     (entry) => (
//                         <Cell
//                             key={
//                                 entry.name
//                             }
//                             fill={
//                                 entry.color
//                             }
//                         />
//                     )
//                 )}
//             </Pie>

//             <Tooltip
//                 contentStyle={
//                     tooltipStyle
//                 }
//                 formatter={(
//                     value,
//                     name
//                 ) => [
//                         Number(
//                             value
//                         ).toLocaleString(),
//                         String(name),
//                     ]}
//             />

//             <Legend
//                 wrapperStyle={{
//                     fontSize: "11px",
//                     paddingTop: "12px",
//                 }}
//             />
//         </PieChart>
//     );

//     function renderSelectedChart() {
//         if (chartType === "bar") {
//             return renderBarChart();
//         }

//         if (chartType === "pie") {
//             return renderPieChart();
//         }

//         return renderAreaChart();
//     }

//     return (
//         <div>
//             <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
//                 <div>
//                     <h2 className="text-sm font-semibold text-foreground">
//                         Trouble Ticket
//                         Overview
//                     </h2>

//                     <p className="mt-0.5 text-xs text-muted-foreground">
//                         {loading
//                             ? "Loading ticket overview..."
//                             : `${total.toLocaleString()} total tickets in the selected period`}
//                     </p>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-2">
//                     <select
//                         value={chartType}
//                         onChange={(event) =>
//                             setChartType(
//                                 event.target
//                                     .value as ChartType
//                             )
//                         }
//                         disabled={loading}
//                         className="
//                             h-8 rounded-lg border border-border
//                             bg-background px-3 text-xs
//                             font-medium text-foreground
//                             outline-none transition-all
//                             hover:bg-muted
//                             focus:ring-2 focus:ring-ring
//                             disabled:cursor-not-allowed
//                             disabled:opacity-60
//                         "
//                     >
//                         <option value="area">
//                             Area Chart
//                         </option>

//                         <option value="bar">
//                             Bar Chart
//                         </option>

//                         <option value="pie">
//                             Pie Chart
//                         </option>
//                     </select>

//                     <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
//                         {RANGE_OPTIONS.map(
//                             (option) => (
//                                 <button
//                                     key={
//                                         option.key
//                                     }
//                                     type="button"
//                                     disabled={
//                                         loading
//                                     }
//                                     onClick={() =>
//                                         setRange(
//                                             option.key
//                                         )
//                                     }
//                                     className={`
//                                         rounded-md px-3 py-1
//                                         text-xs font-medium
//                                         transition-all
//                                         disabled:cursor-not-allowed
//                                         disabled:opacity-60
//                                         ${range ===
//                                             option.key
//                                             ? "bg-background text-foreground shadow-sm"
//                                             : "text-muted-foreground hover:text-foreground"
//                                         }
//                                     `}
//                                 >
//                                     {
//                                         option.label
//                                     }
//                                 </button>
//                             )
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {loading ? (
//                 <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">
//                     Loading Trouble Ticket
//                     overview...
//                 </div>
//             ) : error ? (
//                 <div className="flex h-[300px] items-center justify-center text-xs text-red-600">
//                     {error}
//                 </div>
//             ) : total === 0 ? (
//                 <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">
//                     No Trouble Ticket
//                     records found for this
//                     period.
//                 </div>
//             ) : (
//                 <div className="h-[280px] sm:h-[320px]">
//                     <ResponsiveContainer
//                         width="100%"
//                         height="100%"
//                     >
//                         {renderSelectedChart()}
//                     </ResponsiveContainer>
//                 </div>
//             )}
//         </div>
//     );
// }

