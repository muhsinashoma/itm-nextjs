"use client";

import { useEffect, useMemo, useState } from "react";

import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LabelList,
} from "recharts";

import {
    ticketApi,
    type TroubleTicketOverviewPoint,
    type TroubleTicketRange,
} from "@/lib/api";

type ChartType = "area" | "bar" | "pie";

type ChartRow = {
    date: string;
    Open: number;
    InProgress: number;
    Closed: number;
};

const COLORS = {
    Open: "#3b82f6",
    InProgress: "#f59e0b",
    Closed: "#10b981",
};

const ranges: {
    key: TroubleTicketRange;
    label: string;
}[] = [
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "3m", label: "3 Months" },
];

export default function OverviewChart() {
    const [range, setRange] =
        useState<TroubleTicketRange>("7d");

    const [chartType, setChartType] =
        useState<ChartType>("area");

    const [source, setSource] =
        useState<TroubleTicketOverviewPoint[]>([]);

    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        async function loadOverview() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await ticketApi.overview(range);

                if (!mounted) return;

                setSource(response.data.items ?? []);
                setTotal(Number(response.data.total ?? 0));
            } catch (reason: unknown) {
                if (!mounted) return;

                setSource([]);
                setTotal(0);
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

    const data: ChartRow[] = useMemo(
        () =>
            source.map((item) => ({
                date: item.label,
                Open: Number(item.open ?? 0),
                InProgress: Number(
                    item.in_progress ?? 0
                ),
                Closed: Number(item.closed ?? 0),
            })),
        [source]
    );

    const pieData = useMemo(() => {
        const totals = data.reduce(
            (sum, item) => {
                sum.Open += item.Open;
                sum.InProgress += item.InProgress;
                sum.Closed += item.Closed;
                return sum;
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
                value: totals.InProgress,
                color: COLORS.InProgress,
            },
            {
                name: "Closed",
                value: totals.Closed,
                color: COLORS.Closed,
            },
        ];
    }, [data]);

    const tooltipStyle = {
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        fontSize: "12px",
        boxShadow:
            "0 4px 12px rgba(0,0,0,0.08)",
    };

    const renderAreaValueLabel = (
        props: any
    ) => {
        const { x, y, value } = props;

        if (
            value === undefined ||
            value === null ||
            Number(value) === 0
        ) {
            return null;
        }

        return (
            <text
                x={x}
                y={y - 8}
                fill="var(--foreground)"
                fontSize={10}
                fontWeight={600}
                textAnchor="middle"
            >
                {Number(value).toLocaleString()}
            </text>
        );
    };

    const commonAxis = (
        <>
            <XAxis
                dataKey="date"
                interval="preserveStartEnd"
                minTickGap={18}
                tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                }}
                axisLine={false}
                tickLine={false}
            />

            <YAxis
                allowDecimals={false}
                tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                }}
                axisLine={false}
                tickLine={false}
            />

            <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
            />

            <Tooltip contentStyle={tooltipStyle} />

            <Legend
                wrapperStyle={{
                    fontSize: "11px",
                    paddingTop: "12px",
                }}
            />
        </>
    );

    const renderAreaChart = () => (
        <AreaChart
            data={data}
            margin={{
                top: 26,
                right: 10,
                left: -20,
                bottom: 0,
            }}
        >
            <defs>
                <linearGradient
                    id="ttOpen"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop
                        offset="5%"
                        stopColor={COLORS.Open}
                        stopOpacity={0.18}
                    />
                    <stop
                        offset="95%"
                        stopColor={COLORS.Open}
                        stopOpacity={0}
                    />
                </linearGradient>

                <linearGradient
                    id="ttProgress"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop
                        offset="5%"
                        stopColor={COLORS.InProgress}
                        stopOpacity={0.18}
                    />
                    <stop
                        offset="95%"
                        stopColor={COLORS.InProgress}
                        stopOpacity={0}
                    />
                </linearGradient>

                <linearGradient
                    id="ttClosed"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop
                        offset="5%"
                        stopColor={COLORS.Closed}
                        stopOpacity={0.18}
                    />
                    <stop
                        offset="95%"
                        stopColor={COLORS.Closed}
                        stopOpacity={0}
                    />
                </linearGradient>
            </defs>

            {commonAxis}

            <Area
                type="monotone"
                dataKey="Open"
                stroke={COLORS.Open}
                strokeWidth={2}
                fill="url(#ttOpen)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
            >
                <LabelList
                    dataKey="Open"
                    content={renderAreaValueLabel}
                />
            </Area>

            <Area
                type="monotone"
                dataKey="InProgress"
                name="In Progress"
                stroke={COLORS.InProgress}
                strokeWidth={2}
                fill="url(#ttProgress)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
            >
                <LabelList
                    dataKey="InProgress"
                    content={renderAreaValueLabel}
                />
            </Area>

            <Area
                type="monotone"
                dataKey="Closed"
                stroke={COLORS.Closed}
                strokeWidth={2}
                fill="url(#ttClosed)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
            >
                <LabelList
                    dataKey="Closed"
                    content={renderAreaValueLabel}
                />
            </Area>
        </AreaChart>
    );

    const renderBarChart = () => (
        <BarChart
            data={data}
            margin={{
                top: 26,
                right: 10,
                left: -20,
                bottom: 0,
            }}
        >
            {commonAxis}

            <Bar
                dataKey="Open"
                fill={COLORS.Open}
                radius={[4, 4, 0, 0]}
            >
                <LabelList
                    dataKey="Open"
                    position="top"
                    fontSize={10}
                    fontWeight={600}
                    fill="var(--foreground)"
                />
            </Bar>

            <Bar
                dataKey="InProgress"
                name="In Progress"
                fill={COLORS.InProgress}
                radius={[4, 4, 0, 0]}
            >
                <LabelList
                    dataKey="InProgress"
                    position="top"
                    fontSize={10}
                    fontWeight={600}
                    fill="var(--foreground)"
                />
            </Bar>

            <Bar
                dataKey="Closed"
                fill={COLORS.Closed}
                radius={[4, 4, 0, 0]}
            >
                <LabelList
                    dataKey="Closed"
                    position="top"
                    fontSize={10}
                    fontWeight={600}
                    fill="var(--foreground)"
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
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
                labelLine={false}
                label={({
                    name,
                    value,
                    percent,
                }) =>
                    percent && percent >= 0.05
                        ? `${name}: ${Number(
                            value
                        ).toLocaleString()} (${(
                            percent * 100
                        ).toFixed(0)}%)`
                        : ""
                }
            >
                {pieData.map((entry) => (
                    <Cell
                        key={entry.name}
                        fill={entry.color}
                    />
                ))}
            </Pie>

            <Tooltip
                formatter={(value: number) =>
                    Number(value).toLocaleString()
                }
                contentStyle={tooltipStyle}
            />

            <Legend
                wrapperStyle={{
                    fontSize: "11px",
                    paddingTop: "12px",
                }}
            />
        </PieChart>
    );

    const selectedChart =
        chartType === "bar"
            ? renderBarChart()
            : chartType === "pie"
                ? renderPieChart()
                : renderAreaChart();

    return (
        <div>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">
                        Trouble Ticket Overview
                    </h2>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {loading
                            ? "Loading real ticket data..."
                            : `${total.toLocaleString()} unique tickets in selected period`
                        }
                    </p>

                    {error && (
                        <p className="mt-1 text-xs text-red-600">
                            {error}
                        </p>
                    )}
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
                        className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground outline-none transition-all hover:bg-muted focus:ring-2 focus:ring-ring"
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
                        {ranges.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                disabled={loading}
                                onClick={() =>
                                    setRange(item.key)
                                }
                                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                                    range === item.key
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[260px] sm:h-[300px]">
                {loading ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Loading Trouble Ticket overview...
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No Trouble Ticket data found for this period.
                    </div>
                ) : (
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        {selectedChart}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
