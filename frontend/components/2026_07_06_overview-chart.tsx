//components/overview-chart.tsx
"use client";

import { useState } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
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

export default function OverviewChart() {
    const [data, setData] = useState(data7Days);
    const [range, setRange] = useState<Range>("7d");

    const ranges: { key: Range; label: string }[] = [
        { key: "7d", label: "7 Days" },
        { key: "30d", label: "30 Days" },
        { key: "3m", label: "3 Months" },
    ];

    const handleRange = (r: Range) => {
        setRange(r);
        setData(r === "3m" ? data3Months : r === "30d" ? data30Days : data7Days);
    };

    const total = data.reduce((sum, d) => sum + d.Open + d.Closed + d.InProgress, 0);

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Trouble Ticket Overview</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {total.toLocaleString()} total tickets in selected period
                    </p>
                </div>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    {ranges.map((r) => (
                        <button
                            key={r.key}
                            onClick={() => handleRange(r.key)}
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

            <div className="h-[240px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
                        <Tooltip
                            contentStyle={{
                                background: "var(--card)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                        <Area type="monotone" dataKey="Open" stroke="#3b82f6" strokeWidth={2} fill="url(#colorOpen)" dot={false} />
                        <Area type="monotone" dataKey="InProgress" stroke="#f59e0b" strokeWidth={2} fill="url(#colorInProgress)" dot={false} />
                        <Area type="monotone" dataKey="Closed" stroke="#10b981" strokeWidth={2} fill="url(#colorClosed)" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
