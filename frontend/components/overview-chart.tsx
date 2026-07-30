
// //To add label for all chart types (Area, Bar, Pie) in the OverviewChart component using Recharts library.



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
    type TroubleTicketOverviewPoint,
    type TroubleTicketRange,
} from "@/lib/api";

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

const COLORS = {
    Open: "#3b82f6",
    InProgress: "#f59e0b",
    Closed: "#10b981",
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

function mapOverviewData(
    items: TroubleTicketOverviewPoint[]
): TicketChartRow[] {
    return items.map((item) => ({
        date: item.label,
        Open: Number(item.open ?? 0),
        InProgress: Number(
            item.in_progress ?? 0
        ),
        Closed: Number(item.closed ?? 0),
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
    ] = useState<ChartType>("area");

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
                    response.data.items ?? []
                );

                setApiTotal(
                    Number(
                        response.data.total ?? 0
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

    const data = useMemo(
        () => mapOverviewData(source),
        [source]
    );

    const calculatedTotal = useMemo(
        () =>
            data.reduce(
                (total, item) =>
                    total +
                    item.Open +
                    item.InProgress +
                    item.Closed,
                0
            ),
        [data]
    );

    const total =
        apiTotal || calculatedTotal;

    const pieData =
        useMemo<PieChartRow[]>(() => {
            const totals = data.reduce(
                (result, item) => {
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
                    value: totals.Open,
                    color: COLORS.Open,
                },
                {
                    name: "In Progress",
                    value:
                        totals.InProgress,
                    color:
                        COLORS.InProgress,
                },
                {
                    name: "Closed",
                    value: totals.Closed,
                    color: COLORS.Closed,
                },
            ];
        }, [data]);

    const xAxisInterval =
        range === "30d"
            ? 4
            : 0;

    const renderValueLabel = (
        props: any
    ) => {
        const {
            x,
            y,
            value,
            index,
        } = props;

        const numericValue =
            Number(value ?? 0);

        if (numericValue <= 0) {
            return null;
        }

        /*
         * Thirty daily points become crowded.
         * Keep representative labels while all
         * values remain available in the tooltip.
         */
        if (
            range === "30d" &&
            Number(index ?? 0) % 3 !== 0
        ) {
            return null;
        }

        return (
            <text
                x={Number(x ?? 0)}
                y={Number(y ?? 0) - 7}
                fill="var(--foreground)"
                fontSize={9}
                fontWeight={600}
                textAnchor="middle"
            >
                {numericValue.toLocaleString()}
            </text>
        );
    };

    const renderAreaChart = () => (
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
                        stopOpacity={0.2}
                    />

                    <stop
                        offset="95%"
                        stopColor={
                            COLORS.Open
                        }
                        stopOpacity={0}
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
                        stopOpacity={0.2}
                    />

                    <stop
                        offset="95%"
                        stopColor={
                            COLORS.InProgress
                        }
                        stopOpacity={0}
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
                        stopOpacity={0.2}
                    />

                    <stop
                        offset="95%"
                        stopColor={
                            COLORS.Closed
                        }
                        stopOpacity={0}
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
                interval={xAxisInterval}
                minTickGap={10}
                tick={{
                    fontSize: 10,
                    fill:
                        "var(--muted-foreground)",
                }}
                axisLine={false}
                tickLine={false}
            />

            <YAxis
                allowDecimals={false}
                tick={{
                    fontSize: 10,
                    fill:
                        "var(--muted-foreground)",
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
                        String(name) ===
                            "InProgress"
                            ? "In Progress"
                            : String(name);

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
                    fontSize: "11px",
                    paddingTop: "12px",
                }}
            />

            <Area
                type="monotone"
                dataKey="Open"
                name="Open"
                stroke={COLORS.Open}
                strokeWidth={2}
                fill="url(#ticketOpenGradient)"
                dot={{
                    r: 2.5,
                }}
                activeDot={{
                    r: 5,
                }}
                isAnimationActive={false}
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
                isAnimationActive={false}
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
                stroke={COLORS.Closed}
                strokeWidth={2}
                fill="url(#ticketClosedGradient)"
                dot={{
                    r: 2.5,
                }}
                activeDot={{
                    r: 5,
                }}
                isAnimationActive={false}
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

    const renderBarChart = () => (
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
                interval={xAxisInterval}
                minTickGap={10}
                tick={{
                    fontSize: 10,
                    fill:
                        "var(--muted-foreground)",
                }}
                axisLine={false}
                tickLine={false}
            />

            <YAxis
                allowDecimals={false}
                tick={{
                    fontSize: 10,
                    fill:
                        "var(--muted-foreground)",
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
                        String(name),
                    ]}
            />

            <Legend
                wrapperStyle={{
                    fontSize: "11px",
                    paddingTop: "12px",
                }}
            />

            <Bar
                dataKey="Open"
                name="Open"
                fill={COLORS.Open}
                radius={[4, 4, 0, 0]}
                maxBarSize={34}
                isAnimationActive={false}
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
                radius={[4, 4, 0, 0]}
                maxBarSize={34}
                isAnimationActive={false}
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
                fill={COLORS.Closed}
                radius={[4, 4, 0, 0]}
                maxBarSize={34}
                isAnimationActive={false}
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

    const renderPieChart = () => (
        <PieChart>
            <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                innerRadius={58}
                outerRadius={94}
                paddingAngle={4}
                labelLine={false}
                label={PieValueLabel}
                isAnimationActive={false}
            >
                {pieData.map(
                    (entry) => (
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
                    fontSize: "11px",
                    paddingTop: "12px",
                }}
            />
        </PieChart>
    );

    function renderSelectedChart() {
        if (chartType === "bar") {
            return renderBarChart();
        }

        if (chartType === "pie") {
            return renderPieChart();
        }

        return renderAreaChart();
    }

    return (
        <div>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">
                        Trouble Ticket
                        Overview
                    </h2>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {loading
                            ? "Loading ticket overview..."
                            : `${total.toLocaleString()} total tickets in the selected period`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={chartType}
                        onChange={(event) =>
                            setChartType(
                                event.target
                                    .value as ChartType
                            )
                        }
                        disabled={loading}
                        className="
                            h-8 rounded-lg border border-border
                            bg-background px-3 text-xs
                            font-medium text-foreground
                            outline-none transition-all
                            hover:bg-muted
                            focus:ring-2 focus:ring-ring
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        <option value="area">
                            Area Chart
                        </option>

                        <option value="bar">
                            Bar Chart
                        </option>

                        <option value="pie">
                            Pie Chart
                        </option>
                    </select>

                    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                        {RANGE_OPTIONS.map(
                            (option) => (
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
                                        rounded-md px-3 py-1
                                        text-xs font-medium
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

            {loading ? (
                <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">
                    Loading Trouble Ticket
                    overview...
                </div>
            ) : error ? (
                <div className="flex h-[300px] items-center justify-center text-xs text-red-600">
                    {error}
                </div>
            ) : total === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">
                    No Trouble Ticket
                    records found for this
                    period.
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


// //components/overview-chart.tsx

// "use client";

// import { useMemo, useState } from "react";
// import {
//     AreaChart,
//     Area,
//     BarChart,
//     Bar,
//     PieChart,
//     Pie,
//     Cell,
//     XAxis,
//     YAxis,
//     CartesianGrid,
//     Tooltip,
//     ResponsiveContainer,
//     Legend,
//     LabelList,
// } from "recharts";

// const data3Months = [
//     { date: "Jun 1", Open: 120, Closed: 80, InProgress: 45 },
//     { date: "Jun 10", Open: 200, Closed: 150, InProgress: 60 },
//     { date: "Jun 20", Open: 180, Closed: 130, InProgress: 55 },
//     { date: "Jun 25", Open: 190, Closed: 141, InProgress: 70 },
//     { date: "Jun 30", Open: 220, Closed: 170, InProgress: 80 },
// ];

// const data30Days = [
//     { date: "Jun 21", Open: 160, Closed: 120, InProgress: 48 },
//     { date: "Jun 22", Open: 170, Closed: 110, InProgress: 55 },
//     { date: "Jun 23", Open: 150, Closed: 100, InProgress: 42 },
//     { date: "Jun 24", Open: 180, Closed: 130, InProgress: 62 },
//     { date: "Jun 25", Open: 190, Closed: 141, InProgress: 68 },
// ];

// const data7Days = [
//     { date: "Jun 24", Open: 180, Closed: 130, InProgress: 62 },
//     { date: "Jun 25", Open: 190, Closed: 141, InProgress: 68 },
//     { date: "Jun 26", Open: 200, Closed: 160, InProgress: 72 },
//     { date: "Jun 27", Open: 220, Closed: 170, InProgress: 80 },
//     { date: "Jun 28", Open: 180, Closed: 140, InProgress: 65 },
//     { date: "Jun 29", Open: 150, Closed: 120, InProgress: 55 },
//     { date: "Jun 30", Open: 200, Closed: 160, InProgress: 75 },
// ];

// type Range = "7d" | "30d" | "3m";
// type ChartType = "area" | "bar" | "pie";

// type TicketRow = {
//     date: string;
//     Open: number;
//     Closed: number;
//     InProgress: number;
// };

// const COLORS = {
//     Open: "#3b82f6",
//     InProgress: "#f59e0b",
//     Closed: "#10b981",
// };

// export default function OverviewChart() {
//     const [range, setRange] = useState<Range>("7d");
//     const [chartType, setChartType] = useState<ChartType>("area");

//     const ranges: { key: Range; label: string }[] = [
//         { key: "7d", label: "7 Days" },
//         { key: "30d", label: "30 Days" },
//         { key: "3m", label: "3 Months" },
//     ];

//     const data: TicketRow[] = useMemo(() => {
//         if (range === "3m") return data3Months;
//         if (range === "30d") return data30Days;
//         return data7Days;
//     }, [range]);

//     const total = data.reduce(
//         (sum, item) => sum + item.Open + item.Closed + item.InProgress,
//         0
//     );

//     const pieData = useMemo(() => {
//         const totals = data.reduce(
//             (sum, item) => {
//                 sum.Open += item.Open;
//                 sum.InProgress += item.InProgress;
//                 sum.Closed += item.Closed;
//                 return sum;
//             },
//             { Open: 0, InProgress: 0, Closed: 0 }
//         );

//         return [
//             { name: "Open", value: totals.Open, color: COLORS.Open },
//             { name: "In Progress", value: totals.InProgress, color: COLORS.InProgress },
//             { name: "Closed", value: totals.Closed, color: COLORS.Closed },
//         ];
//     }, [data]);

//     const tooltipStyle = {
//         background: "var(--card)",
//         border: "1px solid var(--border)",
//         borderRadius: "8px",
//         fontSize: "12px",
//         boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//     };

//     const renderAreaValueLabel = (props: any) => {
//         const { x, y, value } = props;

//         if (value === undefined || value === null) return null;

//         return (
//             <text
//                 x={x}
//                 y={y - 8}
//                 fill="var(--foreground)"
//                 fontSize={10}
//                 fontWeight={600}
//                 textAnchor="middle"
//             >
//                 {value}
//             </text>
//         );
//     };

//     const renderAreaChart = () => (
//         <AreaChart data={data} margin={{ top: 26, right: 10, left: -20, bottom: 0 }}>
//             <defs>
//                 <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor={COLORS.Open} stopOpacity={0.18} />
//                     <stop offset="95%" stopColor={COLORS.Open} stopOpacity={0} />
//                 </linearGradient>

//                 <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor={COLORS.InProgress} stopOpacity={0.18} />
//                     <stop offset="95%" stopColor={COLORS.InProgress} stopOpacity={0} />
//                 </linearGradient>

//                 <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor={COLORS.Closed} stopOpacity={0.18} />
//                     <stop offset="95%" stopColor={COLORS.Closed} stopOpacity={0} />
//                 </linearGradient>
//             </defs>

//             <XAxis
//                 dataKey="date"
//                 tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
//                 axisLine={false}
//                 tickLine={false}
//             />

//             <YAxis
//                 tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
//                 axisLine={false}
//                 tickLine={false}
//             />

//             <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

//             <Tooltip contentStyle={tooltipStyle} />

//             <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />

//             <Area
//                 type="monotone"
//                 dataKey="Open"
//                 stroke={COLORS.Open}
//                 strokeWidth={2}
//                 fill="url(#colorOpen)"
//                 dot={{ r: 3 }}
//                 activeDot={{ r: 5 }}
//             >
//                 <LabelList dataKey="Open" content={renderAreaValueLabel} />
//             </Area>

//             <Area
//                 type="monotone"
//                 dataKey="InProgress"
//                 name="In Progress"
//                 stroke={COLORS.InProgress}
//                 strokeWidth={2}
//                 fill="url(#colorInProgress)"
//                 dot={{ r: 3 }}
//                 activeDot={{ r: 5 }}
//             >
//                 <LabelList dataKey="InProgress" content={renderAreaValueLabel} />
//             </Area>

//             <Area
//                 type="monotone"
//                 dataKey="Closed"
//                 stroke={COLORS.Closed}
//                 strokeWidth={2}
//                 fill="url(#colorClosed)"
//                 dot={{ r: 3 }}
//                 activeDot={{ r: 5 }}
//             >
//                 <LabelList dataKey="Closed" content={renderAreaValueLabel} />
//             </Area>
//         </AreaChart>
//     );

//     const renderBarChart = () => (
//         <BarChart data={data} margin={{ top: 26, right: 10, left: -20, bottom: 0 }}>
//             <XAxis
//                 dataKey="date"
//                 tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
//                 axisLine={false}
//                 tickLine={false}
//             />

//             <YAxis
//                 tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
//                 axisLine={false}
//                 tickLine={false}
//             />

//             <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

//             <Tooltip contentStyle={tooltipStyle} />

//             <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />

//             <Bar dataKey="Open" fill={COLORS.Open} radius={[4, 4, 0, 0]}>
//                 <LabelList
//                     dataKey="Open"
//                     position="top"
//                     fontSize={10}
//                     fontWeight={600}
//                     fill="var(--foreground)"
//                 />
//             </Bar>

//             <Bar
//                 dataKey="InProgress"
//                 name="In Progress"
//                 fill={COLORS.InProgress}
//                 radius={[4, 4, 0, 0]}
//             >
//                 <LabelList
//                     dataKey="InProgress"
//                     position="top"
//                     fontSize={10}
//                     fontWeight={600}
//                     fill="var(--foreground)"
//                 />
//             </Bar>

//             <Bar dataKey="Closed" fill={COLORS.Closed} radius={[4, 4, 0, 0]}>
//                 <LabelList
//                     dataKey="Closed"
//                     position="top"
//                     fontSize={10}
//                     fontWeight={600}
//                     fill="var(--foreground)"
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
//                 cy="50%"
//                 innerRadius={55}
//                 outerRadius={90}
//                 paddingAngle={4}
//                 labelLine={false}
//                 label={({ name, value, percent }) =>
//                     percent && percent >= 0.05
//                         ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
//                         : ""
//                 }
//             >
//                 {pieData.map((entry) => (
//                     <Cell key={entry.name} fill={entry.color} />
//                 ))}
//             </Pie>

//             <Tooltip
//                 formatter={(value: number) => value.toLocaleString()}
//                 contentStyle={tooltipStyle}
//             />

//             <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
//         </PieChart>
//     );

//     const renderSelectedChart = () => {
//         if (chartType === "bar") return renderBarChart();
//         if (chartType === "pie") return renderPieChart();
//         return renderAreaChart();
//     };

//     return (
//         <div>
//             <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
//                 <div>
//                     <h2 className="text-sm font-semibold text-foreground">
//                         Trouble Ticket Overview
//                     </h2>

//                     <p className="text-xs text-muted-foreground mt-0.5">
//                         {total.toLocaleString()} total tickets in selected period
//                     </p>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-2">
//                     <select
//                         value={chartType}
//                         onChange={(e) => setChartType(e.target.value as ChartType)}
//                         className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground outline-none transition-all hover:bg-muted focus:ring-2 focus:ring-ring"
//                     >
//                         <option value="area">Area Chart</option>
//                         <option value="bar">Bar Chart</option>
//                         <option value="pie">Pie Chart</option>
//                     </select>

//                     <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
//                         {ranges.map((r) => (
//                             <button
//                                 key={r.key}
//                                 onClick={() => setRange(r.key)}
//                                 className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${range === r.key
//                                     ? "bg-background text-foreground shadow-sm"
//                                     : "text-muted-foreground hover:text-foreground"
//                                     }`}
//                             >
//                                 {r.label}
//                             </button>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             <div className="h-[260px] sm:h-[300px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                     {renderSelectedChart()}
//                 </ResponsiveContainer>
//             </div>
//         </div>
//     );
// }



