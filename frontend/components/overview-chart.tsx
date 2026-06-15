
//To add label for all chart types (Area, Bar, Pie) in the OverviewChart component using Recharts library.

//components/overview-chart.tsx

"use client";

import { useMemo, useState } from "react";
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

const data3Months = [
    { date: "Jun 1", Open: 120, Closed: 80, InProgress: 45 },
    { date: "Jun 10", Open: 200, Closed: 150, InProgress: 60 },
    { date: "Jun 20", Open: 180, Closed: 130, InProgress: 55 },
    { date: "Jun 25", Open: 190, Closed: 141, InProgress: 70 },
    { date: "Jun 30", Open: 220, Closed: 170, InProgress: 80 },
];

const data30Days = [
    { date: "Jun 21", Open: 160, Closed: 120, InProgress: 48 },
    { date: "Jun 22", Open: 170, Closed: 110, InProgress: 55 },
    { date: "Jun 23", Open: 150, Closed: 100, InProgress: 42 },
    { date: "Jun 24", Open: 180, Closed: 130, InProgress: 62 },
    { date: "Jun 25", Open: 190, Closed: 141, InProgress: 68 },
];

const data7Days = [
    { date: "Jun 24", Open: 180, Closed: 130, InProgress: 62 },
    { date: "Jun 25", Open: 190, Closed: 141, InProgress: 68 },
    { date: "Jun 26", Open: 200, Closed: 160, InProgress: 72 },
    { date: "Jun 27", Open: 220, Closed: 170, InProgress: 80 },
    { date: "Jun 28", Open: 180, Closed: 140, InProgress: 65 },
    { date: "Jun 29", Open: 150, Closed: 120, InProgress: 55 },
    { date: "Jun 30", Open: 200, Closed: 160, InProgress: 75 },
];

type Range = "7d" | "30d" | "3m";
type ChartType = "area" | "bar" | "pie";

type TicketRow = {
    date: string;
    Open: number;
    Closed: number;
    InProgress: number;
};

const COLORS = {
    Open: "#3b82f6",
    InProgress: "#f59e0b",
    Closed: "#10b981",
};

export default function OverviewChart() {
    const [range, setRange] = useState<Range>("7d");
    const [chartType, setChartType] = useState<ChartType>("area");

    const ranges: { key: Range; label: string }[] = [
        { key: "7d", label: "7 Days" },
        { key: "30d", label: "30 Days" },
        { key: "3m", label: "3 Months" },
    ];

    const data: TicketRow[] = useMemo(() => {
        if (range === "3m") return data3Months;
        if (range === "30d") return data30Days;
        return data7Days;
    }, [range]);

    const total = data.reduce(
        (sum, item) => sum + item.Open + item.Closed + item.InProgress,
        0
    );

    const pieData = useMemo(() => {
        const totals = data.reduce(
            (sum, item) => {
                sum.Open += item.Open;
                sum.InProgress += item.InProgress;
                sum.Closed += item.Closed;
                return sum;
            },
            { Open: 0, InProgress: 0, Closed: 0 }
        );

        return [
            { name: "Open", value: totals.Open, color: COLORS.Open },
            { name: "In Progress", value: totals.InProgress, color: COLORS.InProgress },
            { name: "Closed", value: totals.Closed, color: COLORS.Closed },
        ];
    }, [data]);

    const tooltipStyle = {
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        fontSize: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    };

    const renderAreaValueLabel = (props: any) => {
        const { x, y, value } = props;

        if (value === undefined || value === null) return null;

        return (
            <text
                x={x}
                y={y - 8}
                fill="var(--foreground)"
                fontSize={10}
                fontWeight={600}
                textAnchor="middle"
            >
                {value}
            </text>
        );
    };

    const renderAreaChart = () => (
        <AreaChart data={data} margin={{ top: 26, right: 10, left: -20, bottom: 0 }}>
            <defs>
                <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.Open} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={COLORS.Open} stopOpacity={0} />
                </linearGradient>

                <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.InProgress} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={COLORS.InProgress} stopOpacity={0} />
                </linearGradient>

                <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.Closed} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={COLORS.Closed} stopOpacity={0} />
                </linearGradient>
            </defs>

            <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
            />

            <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
            />

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

            <Tooltip contentStyle={tooltipStyle} />

            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />

            <Area
                type="monotone"
                dataKey="Open"
                stroke={COLORS.Open}
                strokeWidth={2}
                fill="url(#colorOpen)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
            >
                <LabelList dataKey="Open" content={renderAreaValueLabel} />
            </Area>

            <Area
                type="monotone"
                dataKey="InProgress"
                name="In Progress"
                stroke={COLORS.InProgress}
                strokeWidth={2}
                fill="url(#colorInProgress)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
            >
                <LabelList dataKey="InProgress" content={renderAreaValueLabel} />
            </Area>

            <Area
                type="monotone"
                dataKey="Closed"
                stroke={COLORS.Closed}
                strokeWidth={2}
                fill="url(#colorClosed)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
            >
                <LabelList dataKey="Closed" content={renderAreaValueLabel} />
            </Area>
        </AreaChart>
    );

    const renderBarChart = () => (
        <BarChart data={data} margin={{ top: 26, right: 10, left: -20, bottom: 0 }}>
            <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
            />

            <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
            />

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

            <Tooltip contentStyle={tooltipStyle} />

            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />

            <Bar dataKey="Open" fill={COLORS.Open} radius={[4, 4, 0, 0]}>
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

            <Bar dataKey="Closed" fill={COLORS.Closed} radius={[4, 4, 0, 0]}>
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
                label={({ name, value, percent }) =>
                    percent && percent >= 0.05
                        ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        : ""
                }
            >
                {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                ))}
            </Pie>

            <Tooltip
                formatter={(value: number) => value.toLocaleString()}
                contentStyle={tooltipStyle}
            />

            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
        </PieChart>
    );

    const renderSelectedChart = () => {
        if (chartType === "bar") return renderBarChart();
        if (chartType === "pie") return renderPieChart();
        return renderAreaChart();
    };

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">
                        Trouble Ticket Overview
                    </h2>

                    <p className="text-xs text-muted-foreground mt-0.5">
                        {total.toLocaleString()} total tickets in selected period
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value as ChartType)}
                        className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground outline-none transition-all hover:bg-muted focus:ring-2 focus:ring-ring"
                    >
                        <option value="area">Area Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                    </select>

                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        {ranges.map((r) => (
                            <button
                                key={r.key}
                                onClick={() => setRange(r.key)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${range === r.key
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[260px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    {renderSelectedChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
}



//To add label for all chart types (Area, Bar, Pie) in the OverviewChart component using Recharts library(Without using LabelList for Area Chart and using custom label renderer instead to avoid label overlapping issue).

//components/overview-chart.tsx

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

// const COLORS = {
//     Open: "#3b82f6",
//     InProgress: "#f59e0b",
//     Closed: "#10b981",
// };

// export default function OverviewChart() {
//     const [range, setRange] = useState<Range>("7d");

//     // Default chart is Area Chart
//     const [chartType, setChartType] = useState<ChartType>("area");

//     const ranges: { key: Range; label: string }[] = [
//         { key: "7d", label: "7 Days" },
//         { key: "30d", label: "30 Days" },
//         { key: "3m", label: "3 Months" },
//     ];

//     const data = useMemo(() => {
//         if (range === "3m") return data3Months;
//         if (range === "30d") return data30Days;
//         return data7Days;
//     }, [range]);

//     const total = data.reduce(
//         (sum, d) => sum + d.Open + d.Closed + d.InProgress,
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

//     const renderAreaChart = () => (
//         <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
//             <defs>
//                 <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor={COLORS.Open} stopOpacity={0.18} />
//                     <stop offset="95%" stopColor={COLORS.Open} stopOpacity={0} />
//                 </linearGradient>

//                 <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor={COLORS.Closed} stopOpacity={0.18} />
//                     <stop offset="95%" stopColor={COLORS.Closed} stopOpacity={0} />
//                 </linearGradient>

//                 <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor={COLORS.InProgress} stopOpacity={0.18} />
//                     <stop offset="95%" stopColor={COLORS.InProgress} stopOpacity={0} />
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
//                 dot={false}
//                 activeDot={{ r: 4 }}
//             />

//             <Area
//                 type="monotone"
//                 dataKey="InProgress"
//                 name="In Progress"
//                 stroke={COLORS.InProgress}
//                 strokeWidth={2}
//                 fill="url(#colorInProgress)"
//                 dot={false}
//                 activeDot={{ r: 4 }}
//             />

//             <Area
//                 type="monotone"
//                 dataKey="Closed"
//                 stroke={COLORS.Closed}
//                 strokeWidth={2}
//                 fill="url(#colorClosed)"
//                 dot={false}
//                 activeDot={{ r: 4 }}
//             />
//         </AreaChart>
//     );

//     const renderBarChart = () => (
//         <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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

//             <Bar dataKey="Open" fill={COLORS.Open} radius={[4, 4, 0, 0]} />
//             <Bar
//                 dataKey="InProgress"
//                 name="In Progress"
//                 fill={COLORS.InProgress}
//                 radius={[4, 4, 0, 0]}
//             />
//             <Bar dataKey="Closed" fill={COLORS.Closed} radius={[4, 4, 0, 0]} />
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
//                 label={({ name, percent }) =>
//                     percent && percent >= 0.05
//                         ? `${name} ${(percent * 100).toFixed(0)}%`
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

//             <div className="h-[240px] sm:h-[280px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                     {chartType === "area"
//                         ? renderAreaChart()
//                         : chartType === "bar"
//                             ? renderBarChart()
//                             : renderPieChart()}
//                 </ResponsiveContainer>
//             </div>
//         </div>
//     );
// }

