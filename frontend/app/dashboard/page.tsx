//frontend/app/dashboard/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import OverviewChart from "@/components/overview-chart";
import { DataTable } from "@/components/data-table";
import { columns } from "@/components/tt-columns";
import { sections } from "@/components/tt-data";

import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie,
    Tooltip, ResponsiveContainer, Cell, LabelList, XAxis, YAxis,
} from "recharts";

// ── Shared helpers ──────────────────────────────────────────────────
function CardShell({ children }: { children: React.ReactNode }) {
    return <div className="bg-card rounded-xl shadow-sm border border-border p-4">{children}</div>;
}

function CardHead({ title, kpi, kpiClass = "text-primary", badge, onKpiClick }: {
    title: string; kpi: string | number; kpiClass?: string; badge?: string; onKpiClick?: () => void;
}) {
    return (
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
            <div className="flex items-center gap-1.5">
                <span onClick={onKpiClick}
                    className={`text-lg font-bold tabular-nums ${kpiClass} ${onKpiClick ? "cursor-pointer hover:underline" : ""}`}>
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

function LegendRow({ label, value, color, onClick }: {
    label: string; value: number | string; color: string; onClick?: () => void;
}) {
    return (
        <div onClick={onClick}
            className={`flex justify-between items-center px-2 py-1.5 rounded-lg transition-colors ${onClick ? "cursor-pointer hover:bg-muted/60" : ""}`}>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {label}
            </span>
            <span className="text-[10px] font-bold text-foreground tabular-nums">
                {typeof value === "number" ? value.toLocaleString() : value}
            </span>
        </div>
    );
}

const tip = { fontSize: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" };

const cleanTooltipProps = {
    cursor: false,
    contentStyle: {
        ...tip,
        boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
    },
};

const PieLabel = (props: any) => {
    const { cx, cy, outerRadius, percent, value, name } = props;

    if (!value || percent <= 0) return null;

    const label = `${(percent * 100).toFixed(1)}%`;

    const labelPositions: Record<string, { x: number; y: number }> = {
        Damaged: {
            x: cx + outerRadius + 8,
            y: cy - 28,
        },
        Lost: {
            x: cx + outerRadius + 18,
            y: cy - 2,
        },
        Ownership: {
            x: cx,
            y: cy + outerRadius + 16,
        },
    };

    const position = labelPositions[name];

    if (!position) return null;

    return (
        <text
            x={position.x}
            y={position.y}
            fill="#111827"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fontWeight={700}
        >
            {label}
        </text>
    );
};

// ── Chart data ──────────────────────────────────────────────────────

const activeAssetsData = [
    { label: "Assigned", shortLabel: "Assign", value: 11797, color: "#3b82f6" },
    { label: "Transferred", shortLabel: "Trans", value: 540, color: "#f59e0b" },
    { label: "Returned", shortLabel: "Return", value: 210, color: "#10b981" },
    { label: "Available", shortLabel: "Avail", value: 320, color: "#8b5cf6" },
];


// Non Operational— computed from real static data
const nonOpData = [
    { label: "Lost", value: 120, color: "#ef4444" },
    { label: "Damaged", value: 55, color: "#f59e0b" },
    { label: "Ownership", value: 1000, color: "#10b981" },
];

// Warranty — computed from real static data
const claimedCount = [].filter(d => d.status === "Claimed").length;
const toVendorCount = [].filter(d => d.status === "To Vendor" || d.status === "Tranferred to Vendor").length;
const recoveredCount = [].filter(d => d.status === "Recovered").length;
const expiredCount = [].filter(d => d.status === "Expired").length;



// Warranty Overview with static data
const warrantyDetails = [
    { label: "Claimed", value: 42, color: "#f97316", status: "Claimed" },
    { label: "To Vendor", value: 18, color: "#8b5cf6", status: "To Vendor" },
    { label: "Recovered", value: 31, color: "#3b82f6", status: "Recovered" },
    { label: "Expired", value: 9, color: "#ef4444", status: "Expired" },
];

const warrantyBarData = [
    {
        year: "2026",
        claimed: warrantyDetails[0].value,
        vendor: warrantyDetails[1].value,
        recovered: warrantyDetails[2].value,
        expired: warrantyDetails[3].value,
    },
];

const warrantyMaxValue = Math.max(
    warrantyDetails[0].value,
    warrantyDetails[1].value,
    warrantyDetails[2].value,
    warrantyDetails[3].value,
    1
);

// Service — exact status strings from assignedDeviceService

const serviceData = [
    { label: "Service Request", value: 28, color: "#3b82f6", status: "Service Requrest" },
    { label: "Trf to Vendor", value: 12, color: "#f59e0b", status: "Tranferred to Vendor" },
    { label: "Closed", value: 44, color: "#10b981", status: "Closed" },
];

const serviceBarData = [
    {
        name: "2026",
        servicerequest: serviceData[0].value,
        transferred: serviceData[1].value,
        closed: serviceData[2].value,
    },
];

const serviceMaxValue = Math.max(
    serviceData[0].value,
    serviceData[1].value,
    serviceData[2].value,
    1
);



// Resignation Clearance
const resignationAreaData = [
    { month: "Jan", pending: 2, completed: 5, inprocess: 1 },
    { month: "Feb", pending: 1, completed: 4, inprocess: 2 },
    { month: "Mar", pending: 2, completed: 3, inprocess: 1 },
    { month: "Apr", pending: 5, completed: 3, inprocess: 2 },
    { month: "May", pending: 3, completed: 6, inprocess: 2 },
    { month: "Jun", pending: 4, completed: 7, inprocess: 1 },
];

const resignationPendingTotal = resignationAreaData.reduce((sum, item) => sum + item.pending, 0);
const resignationCompletedTotal = resignationAreaData.reduce((sum, item) => sum + item.completed, 0);
const resignationInProcessTotal = resignationAreaData.reduce((sum, item) => sum + item.inprocess, 0);

const resignationLegend = [
    { label: "Pending Clearance", value: resignationPendingTotal, color: "#f59e0b", status: "Pending Clearance" },
    { label: "Completed", value: resignationCompletedTotal, color: "#10b981", status: "Completed" },
    { label: "In Process", value: resignationInProcessTotal, color: "#3b82f6", status: "In Process" },
];

// Renewal

// const renewalBarData = [
//     { month: "Jan", upcoming: 5, completed: 10, delayed: 2 },
//     { month: "Feb", upcoming: 4, completed: 9, delayed: 3 },
//     { month: "Mar", upcoming: 6, completed: 12, delayed: 2 },
//     { month: "Apr", upcoming: 5, completed: 14, delayed: 3 },
//     { month: "May", upcoming: 7, completed: 11, delayed: 1 },
//     { month: "Jun", upcoming: 6, completed: 13, delayed: 2 },
// ];

// const renewalLegend = [
//     { label: "Upcoming Renewals", value: [].filter(d => d.status === "Upcoming Renewals").length, color: "#f59e0b", status: "Upcoming Renewals" },
//     { label: "Completed", value: [].filter(d => d.status === "Completed").length, color: "#10b981", status: "Completed" },
//     { label: "Delayed", value: [].filter(d => d.status === "Delayed").length, color: "#ef4444", status: "Delayed" },
// ];


// Renewal
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

// ── Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const router = useRouter();

    const totalAssets = activeAssetsData.reduce((s, i) => s + i.value, 0);
    const totalNonOp = nonOpData.reduce((s, i) => s + i.value, 0);
    const totalWarranty = warrantyDetails.reduce((s, i) => s + i.value, 0);
    const totalService = serviceData.reduce((s, i) => s + i.value, 0);
    const totalResig = resignationAreaData.reduce((s, d) => s + d.pending + d.completed + d.inprocess, 0);
    const totalRenewal = renewalBarData.reduce((s, d) => s + d.upcoming + d.completed + d.delayed, 0);

    //bar chart for 1st card

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

    //pie chart for 2nd card
    const getNonOpValue = (label: string) =>
        nonOpData.find((item) => item.label === label)?.value ?? 0;

    const lostCount = getNonOpValue("Lost");
    const damagedCount = getNonOpValue("Damaged");
    const ownershipCount = getNonOpValue("Ownership");

    const nonOpTotal = lostCount + damagedCount + ownershipCount;

    const damagedPercentage =
        nonOpTotal > 0 ? ((damagedCount / nonOpTotal) * 100).toFixed(1) : "0";

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">


                {/* ── Card 1: Active Assets ── */}
                <CardShell>
                    <CardHead
                        title="Total Active Assets"
                        kpi={totalAssets.toLocaleString()}
                        badge="↑ 48%"
                        onKpiClick={() => router.push("/dashboard/reports/assets")}
                    />

                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={activeAssetsData}
                                    margin={{ top: 16, right: 4, left: 4, bottom: 14 }}
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
                                            <Cell key={index} fill={item.color} />
                                        ))}

                                        <LabelList
                                            dataKey="value"
                                            position="top"
                                            fontSize={8}
                                            fill="var(--foreground)"
                                            formatter={(value: number) =>
                                                value >= 1000
                                                    ? `${(value / 1000).toFixed(1)}k`
                                                    : value
                                            }
                                        />
                                    </Bar>

                                    <Tooltip
                                        {...cleanTooltipProps}
                                        formatter={(value: number, name: string, props: any) => [
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
                        badge="↑ 12%"
                        onKpiClick={() => router.push("/dashboard/reports/non-operational")}
                    />

                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 4, right: 30, bottom: 4, left: 20 }}>
                                    <Pie
                                        data={nonOpData}
                                        dataKey="value"
                                        nameKey="label"
                                        cx="46%"
                                        cy="50%"
                                        outerRadius={48}
                                        innerRadius={30}
                                        paddingAngle={3}
                                        labelLine={false}
                                        label={(props) => (
                                            <PieLabel
                                                {...props}
                                                name={props.name || props.label}
                                            />
                                        )}
                                    >
                                        {nonOpData.map((item, index) => (
                                            <Cell key={index} fill={item.color} />
                                        ))}
                                    </Pie>

                                    <Tooltip
                                        {...cleanTooltipProps}
                                        formatter={(value: number, name: string) => {
                                            const percentage =
                                                nonOpTotal > 0
                                                    ? ((Number(value) / nonOpTotal) * 100).toFixed(1)
                                                    : "0";

                                            return [
                                                `${Number(value).toLocaleString()} (${percentage}%)`,
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
                                    router.push("/dashboard/disposal/ownership-assets")
                                }
                            />

                            <LegendRow
                                label="Damaged"
                                value={damagedCount}
                                color="#f59e0b"
                                onClick={() =>
                                    router.push("/dashboard/reports/non-operational?status=damaged")
                                }
                            />
                            <LegendRow
                                label="Lost"
                                value={lostCount}
                                color="#ef4444"
                                onClick={() =>
                                    router.push("/dashboard/reports/non-operational?status=lost")
                                }
                            />


                        </div>
                    </div>
                </CardShell>

                {/* ── Card 3: Warranty Overview── */}
                {/* <CardShell>
                    <CardHead title="Warranty Overview" kpi={totalWarranty.toLocaleString()} badge="↑ 18%"
                        onKpiClick={() => router.push("/dashboard/service-warranty/warranty-claims")} />
                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={warrantyBarData} margin={{ top: 14, right: 2, left: 2, bottom: 0 }}
                                    onClick={(e) => {
                                        const key = e?.activePayload?.[0]?.dataKey as string;
                                        const map: Record<string, string> = {
                                            claimed: "Claimed", vendor: "To Vendor",
                                            recovered: "Recovered", expired: "Expired",
                                        };
                                        if (map[key]) router.push(`/dashboard/service-warranty/warranty-claims?status=${encodeURIComponent(map[key])}`);
                                    }}
                                    style={{ cursor: "pointer" }}>
                                    <XAxis dataKey="year" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                                    <Bar dataKey="claimed" fill="#f97316" radius={[3, 3, 0, 0]} cursor="pointer" activeBar={false}>
                                        <LabelList dataKey="claimed" position="top" fontSize={8} fill="var(--foreground)" />
                                    </Bar>
                                    <Bar dataKey="vendor" fill="#8b5cf6" radius={[3, 3, 0, 0]} cursor="pointer">
                                        <LabelList dataKey="vendor" position="top" fontSize={8} fill="var(--foreground)" />
                                    </Bar>
                                    <Bar dataKey="recovered" fill="#3b82f6" radius={[3, 3, 0, 0]} cursor="pointer">
                                        <LabelList dataKey="recovered" position="top" fontSize={8} fill="var(--foreground)" />
                                    </Bar>
                                    <Bar dataKey="expired" fill="#ef4444" radius={[3, 3, 0, 0]} cursor="pointer">
                                        <LabelList dataKey="expired" position="top" fontSize={8} fill="var(--foreground)" />
                                    </Bar>

                                    <Tooltip {...cleanTooltipProps} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 pl-3 border-l border-border space-y-0.5">
                            {warrantyDetails.map(item => (
                                <LegendRow key={item.label} label={item.label} value={item.value} color={item.color}
                                    onClick={() => router.push(`/dashboard/service-warranty/warranty-claims?status=${encodeURIComponent(item.status)}`)} />
                            ))}
                        </div>
                    </div>
                </CardShell> */}

                {/* ── Card 3: Warranty Overview ── */}
                <CardShell>
                    <CardHead
                        title="Warranty Overview"
                        kpi={totalWarranty.toLocaleString()}
                        badge="↑ 18%"
                        onKpiClick={() => router.push("/dashboard/service-warranty/warranty-claims")}
                    />

                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={warrantyBarData}
                                    margin={{ top: 18, right: 4, left: 4, bottom: 4 }}
                                    barCategoryGap="20%"
                                    barGap={3}
                                    onClick={(e) => {
                                        const key = e?.activePayload?.[0]?.dataKey as string | undefined;

                                        const map: Record<string, string> = {
                                            claimed: "Claimed",
                                            vendor: "To Vendor",
                                            recovered: "Recovered",
                                            expired: "Expired",
                                        };

                                        if (key && map[key]) {
                                            router.push(
                                                `/dashboard/service-warranty/warranty-claims?status=${encodeURIComponent(map[key])}`
                                            );
                                        }
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <XAxis
                                        dataKey="year"
                                        tick={{ fontSize: 9 }}
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
                                            `/dashboard/service-warranty/warranty-claims?status=${encodeURIComponent(item.status)}`
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </CardShell>



                {/* ── Card 4: Service Requests ── */}
                {/* <CardShell>
                    <CardHead title="Service Requests" kpi={totalService.toLocaleString()} badge="↑ 24%"
                        onKpiClick={() => router.push("/dashboard/service-warranty/service-claims")} />
                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={serviceBarData} margin={{ top: 14, right: 2, left: 2, bottom: 0 }}
                                    onClick={(e) => {
                                        const key = e?.activePayload?.[0]?.dataKey as string;
                                        const map: Record<string, string> = {
                                            servicerequest: "Service Requrest",
                                            transferred: "Tranferred to Vendor",
                                            closed: "Closed",
                                        };
                                        if (map[key]) router.push(`/dashboard/service-warranty/service-claims?status=${encodeURIComponent(map[key])}`);
                                    }}
                                    style={{ cursor: "pointer" }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                                    <Bar dataKey="servicerequest" fill="#3b82f6" name="Service Request" radius={[3, 3, 0, 0]} cursor="pointer" activeBar={false}>
                                        <LabelList dataKey="servicerequest" position="top" fontSize={8} fill="var(--foreground)" />
                                    </Bar>
                                    <Bar dataKey="transferred" fill="#f59e0b" name="Tranferred to Vendor" radius={[3, 3, 0, 0]} cursor="pointer">
                                        <LabelList dataKey="transferred" position="top" fontSize={8} fill="var(--foreground)" />
                                    </Bar>
                                    <Bar dataKey="closed" fill="#10b981" name="Closed" radius={[3, 3, 0, 0]} cursor="pointer">
                                        <LabelList dataKey="closed" position="top" fontSize={8} fill="var(--foreground)" />
                                    </Bar>

                                    <Tooltip {...cleanTooltipProps} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 pl-3 border-l border-border space-y-0.5">
                            {serviceData.map(item => (
                                <LegendRow key={item.label} label={item.label} value={item.value} color={item.color}
                                    onClick={() => router.push(`/dashboard/service-warranty/service-claims?status=${encodeURIComponent(item.status)}`)} />
                            ))}
                        </div>
                    </div>
                </CardShell> */}

                {/* ── Card 4: Service Requests ── */}
                <CardShell>
                    <CardHead
                        title="Service Requests"
                        kpi={totalService.toLocaleString()}
                        badge="↑ 24%"
                        onKpiClick={() => router.push("/dashboard/service-warranty/service-claims")}
                    />

                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={serviceBarData}
                                    margin={{ top: 18, right: 4, left: 4, bottom: 4 }}
                                    barCategoryGap="22%"
                                    barGap={4}
                                    onClick={(e) => {
                                        const key = e?.activePayload?.[0]?.dataKey as string | undefined;

                                        const map: Record<string, string> = {
                                            servicerequest: "Service Requrest",
                                            transferred: "Tranferred to Vendor",
                                            closed: "Closed",
                                        };

                                        if (key && map[key]) {
                                            router.push(
                                                `/dashboard/service-warranty/service-claims?status=${encodeURIComponent(map[key])}`
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
                                        name="Tranferred to Vendor"
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
                                            `/dashboard/service-warranty/service-claims?status=${encodeURIComponent(item.status)}`
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
                        badge="↑ 6%"
                        onKpiClick={() => router.push("/dashboard/reports/resignation")}
                    />

                    <div className="flex items-center gap-3">
                        <div className="w-[55%] h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={resignationAreaData}
                                    margin={{ top: 20, right: 8, left: 4, bottom: 8 }}
                                    onClick={(e) => {
                                        const key = e?.activePayload?.[0]?.dataKey as string;

                                        const map: Record<string, string> = {
                                            pending: "Pending Clearance",
                                            completed: "Completed",
                                            inprocess: "In Process",
                                        };

                                        if (map[key]) {
                                            router.push(
                                                `/dashboard/reports/resignation?status=${encodeURIComponent(map[key])}`
                                            );
                                        }
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <defs>
                                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>

                                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>

                                        <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                                            `/dashboard/reports/resignation?status=${encodeURIComponent(item.status)}`
                                        )
                                    }
                                    className="grid grid-cols-[1fr_28px] items-center gap-2 px-1.5 py-1.5 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors"
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />

                                        <span className="text-[10px] text-muted-foreground leading-tight whitespace-normal">
                                            {item.label}
                                        </span>
                                    </div>

                                    <span className="text-right text-[10px] font-bold text-foreground tabular-nums shrink-0">
                                        {typeof item.value === "number"
                                            ? item.value.toLocaleString()
                                            : item.value}
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
                        badge="↑ 12%"
                        onKpiClick={() => router.push("/dashboard/reports/renewal")}
                    />

                    <div className="flex items-center gap-2">
                        <div className="w-[54%] h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={renewalBarData}
                                    margin={{ top: 18, right: 4, left: 0, bottom: 6 }}
                                    barCategoryGap="18%"
                                    barGap={0}
                                    onClick={(e) => {
                                        const key = e?.activePayload?.[0]?.dataKey as string;

                                        const map: Record<string, string> = {
                                            upcoming: "Upcoming Renewals",
                                            completed: "Completed",
                                            delayed: "Delayed",
                                        };

                                        if (map[key]) {
                                            router.push(
                                                `/dashboard/reports/renewal?status=${encodeURIComponent(map[key])}`
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
                                            `/dashboard/reports/renewal?status=${encodeURIComponent(item.status)}`
                                        )
                                    }
                                    className="grid grid-cols-[1fr_28px] items-center gap-2 px-1 py-1.5 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors"
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
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

            {/* Overview Chart */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <OverviewChart />
            </div>

            {/* TT Table */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <h2 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Trouble Ticket Table</h2>
                <div className="overflow-x-auto">
                    <DataTable columns={columns} data={sections} />
                </div>
            </div>
        </div>
    );
}
