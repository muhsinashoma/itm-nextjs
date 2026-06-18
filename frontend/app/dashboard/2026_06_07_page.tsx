// app/dashboard/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import OverviewChart from "@/components/overview-chart";
import { DataTable } from "@/components/data-table";
import { columns } from "@/components/tt-columns";
import { sections } from "@/components/tt-data";

import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie,
    Tooltip, ResponsiveContainer, Cell, LabelList, XAxis,
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

const PieLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
    const r = outerRadius + 14;
    const x = cx + r * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + r * Math.sin(-midAngle * Math.PI / 180);
    if (percent < 0.05) return null;
    return (
        <text x={x} y={y} fill="var(--foreground)" textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central" fontSize={9} fontWeight={600}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// ── Chart data ──────────────────────────────────────────────────────

const activeAssetsData = [
    { label: "Assigned", value: 11797, color: "#3b82f6" },
    { label: "Transferred", value: 540, color: "#f59e0b" },
    { label: "Returned", value: 210, color: "#10b981" },
    { label: "Available", value: 320, color: "#8b5cf6" },
];

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

const warrantyDetails = [
    { label: "Claimed", value: claimedCount, color: "#f97316", status: "Claimed" },
    { label: "To Vendor", value: toVendorCount, color: "#8b5cf6", status: "To Vendor" },
    { label: "Recovered", value: recoveredCount, color: "#3b82f6", status: "Recovered" },
    { label: "Expired", value: expiredCount, color: "#ef4444", status: "Expired" },
];

const warrantyBarData = [{
    year: "2026",
    claimed: claimedCount,
    vendor: toVendorCount,
    recovered: recoveredCount,
    expired: expiredCount,
}];

// Service — exact status strings from assignedDeviceService
const serviceData = [
    { label: "Service Request", value: [].filter(d => d.status === "Service Requrest").length, color: "#3b82f6", status: "Service Requrest" },
    { label: "Trf to Vendor", value: [].filter(d => d.status === "Tranferred to Vendor").length, color: "#f59e0b", status: "Tranferred to Vendor" },
    { label: "Closed", value: [].filter(d => d.status === "Closed").length, color: "#10b981", status: "Closed" },
];

const serviceBarData = [{
    name: "Requests",
    servicerequest: serviceData[0].value,
    transferred: serviceData[1].value,
    closed: serviceData[2].value,
}];

// Resignation
const resignationAreaData = [
    { month: "Jan", pending: 2, completed: 5, inprocess: 1 },
    { month: "Feb", pending: 1, completed: 4, inprocess: 2 },
    { month: "Mar", pending: 2, completed: 3, inprocess: 1 },
    { month: "Apr", pending: 5, completed: 3, inprocess: 2 },
];

const resignationLegend = [
    { label: "Pending Clearance", value: [].filter(d => d.status === "Pending Clearance").length, color: "#f59e0b", status: "Pending Clearance" },
    { label: "Completed", value: [].filter(d => d.status === "Completed").length, color: "#10b981", status: "Completed" },
    { label: "In Process", value: [].filter(d => d.status === "In Process").length, color: "#3b82f6", status: "In Process" },
];

// Renewal
const renewalBarData = [
    { month: "Jan", upcoming: 5, completed: 10, delayed: 2 },
    { month: "Feb", upcoming: 4, completed: 9, delayed: 3 },
    { month: "Mar", upcoming: 6, completed: 12, delayed: 2 },
    { month: "Apr", upcoming: 5, completed: 14, delayed: 3 },
];

const renewalLegend = [
    { label: "Upcoming Renewals", value: [].filter(d => d.status === "Upcoming Renewals").length, color: "#f59e0b", status: "Upcoming Renewals" },
    { label: "Completed", value: [].filter(d => d.status === "Completed").length, color: "#10b981", status: "Completed" },
    { label: "Delayed", value: [].filter(d => d.status === "Delayed").length, color: "#ef4444", status: "Delayed" },
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

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* ── Card 1: Active Assets ── */}
                <CardShell>
                    <CardHead title="Total Active Assets" kpi={totalAssets.toLocaleString()} badge="↑ 48%"
                        onKpiClick={() => router.push("/dashboard/reports/assets")} />
                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activeAssetsData} margin={{ top: 14, right: 2, left: 2, bottom: 0 }}>
                                    <XAxis dataKey="label" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                        {activeAssetsData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        <LabelList dataKey="value" position="top" fontSize={8} fill="var(--foreground)"
                                            formatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                                    </Bar>
                                    <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={tip} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 pl-3 border-l border-border space-y-0.5">
                            {activeAssetsData.map(item => (
                                <LegendRow key={item.label} {...item}
                                    onClick={() => router.push(`/dashboard/reports/assets?status=${item.label}`)} />
                            ))}
                        </div>
                    </div>
                </CardShell>

                {/* ── Card 2: Non-Operational ── */}
                <CardShell>
                    <CardHead title="Non-Operational Assets" kpi={totalNonOp.toLocaleString()} kpiClass="text-red-500" badge="↑ 12%"
                        onKpiClick={() => router.push("/dashboard/reports/non-operational")} />
                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={nonOpData} dataKey="value" nameKey="label"
                                        cx="50%" cy="50%" outerRadius={52} innerRadius={30}
                                        paddingAngle={3} labelLine={false} label={<PieLabel />}>
                                        {nonOpData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={tip} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 pl-3 border-l border-border space-y-0.5">
                            <LegendRow label="Lost" value={120} color="#ef4444" onClick={() => router.push("/dashboard/reports/non-operational?status=lost")} />
                            <LegendRow label="Damaged" value={55} color="#f59e0b" onClick={() => router.push("/dashboard/reports/non-operational?status=damaged")} />
                            <LegendRow label="Ownership" value={1000} color="#10b981" onClick={() => router.push("/dashboard/disposal/ownership-assets")} />
                        </div>
                    </div>
                </CardShell>

                {/* ── Card 3: Warranty ── */}
                <CardShell>
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
                                    <Bar dataKey="claimed" fill="#f97316" radius={[3, 3, 0, 0]} cursor="pointer">
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
                                    <Tooltip contentStyle={tip} />
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
                </CardShell>

                {/* ── Card 4: Service Requests ── */}
                <CardShell>
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
                                    <Bar dataKey="servicerequest" fill="#3b82f6" name="Service Request" radius={[3, 3, 0, 0]} cursor="pointer">
                                        <LabelList dataKey="servicerequest" position="top" fontSize={8} fill="var(--foreground)" />
                                    </Bar>
                                    <Bar dataKey="transferred" fill="#f59e0b" name="Tranferred to Vendor" radius={[3, 3, 0, 0]} cursor="pointer">
                                        <LabelList dataKey="transferred" position="top" fontSize={8} fill="var(--foreground)" />
                                    </Bar>
                                    <Bar dataKey="closed" fill="#10b981" name="Closed" radius={[3, 3, 0, 0]} cursor="pointer">
                                        <LabelList dataKey="closed" position="top" fontSize={8} fill="var(--foreground)" />
                                    </Bar>
                                    <Tooltip contentStyle={tip} />
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
                </CardShell>

                {/* ── Card 5: Resignation Clearance ── */}
                <CardShell>
                    <CardHead title="Resignation Clearance" kpi={totalResig} kpiClass="text-red-500" badge="↑ 6%"
                        onKpiClick={() => router.push("/dashboard/reports/resignation")} />
                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={resignationAreaData} margin={{ top: 4, right: 2, left: -20, bottom: 0 }}
                                    onClick={(e) => {
                                        const key = e?.activePayload?.[0]?.dataKey as string;
                                        const map: Record<string, string> = { pending: "Pending Clearance", completed: "Completed", inprocess: "In Process" };
                                        if (map[key]) router.push(`/dashboard/reports/resignation?status=${encodeURIComponent(map[key])}`);
                                    }}
                                    style={{ cursor: "pointer" }}>
                                    <defs>
                                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tip} />
                                    <Area type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={1.5} fill="url(#g1)" dot={false} activeDot={{ r: 4 }} />
                                    <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={1.5} fill="url(#g2)" dot={false} activeDot={{ r: 4 }} />
                                    <Area type="monotone" dataKey="inprocess" stroke="#3b82f6" strokeWidth={1.5} fill="url(#g3)" dot={false} activeDot={{ r: 4 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 pl-3 border-l border-border space-y-0.5">
                            {resignationLegend.map(item => (
                                <LegendRow key={item.label} label={item.label} value={item.value} color={item.color}
                                    onClick={() => router.push(`/dashboard/reports/resignation?status=${encodeURIComponent(item.status)}`)} />
                            ))}
                        </div>
                    </div>
                </CardShell>

                {/* ── Card 6: Contract Renewal ── */}
                <CardShell>
                    <CardHead title="Contract Renewal" kpi={totalRenewal} kpiClass="text-emerald-600" badge="↑ 12%"
                        onKpiClick={() => router.push("/dashboard/reports/renewal")} />
                    <div className="flex items-center gap-3">
                        <div className="w-1/2 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={renewalBarData} margin={{ top: 4, right: 2, left: -20, bottom: 0 }}
                                    onClick={(e) => {
                                        const key = e?.activePayload?.[0]?.dataKey as string;
                                        const map: Record<string, string> = { upcoming: "Upcoming Renewals", completed: "Completed", delayed: "Delayed" };
                                        if (map[key]) router.push(`/dashboard/reports/renewal?status=${encodeURIComponent(map[key])}`);
                                    }}
                                    style={{ cursor: "pointer" }}>
                                    <XAxis dataKey="month" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tip} />
                                    <Bar dataKey="upcoming" stackId="a" fill="#f59e0b" cursor="pointer" />
                                    <Bar dataKey="completed" stackId="a" fill="#10b981" cursor="pointer" />
                                    <Bar dataKey="delayed" stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} cursor="pointer" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 pl-3 border-l border-border space-y-0.5">
                            {renewalLegend.map(item => (
                                <LegendRow key={item.label} label={item.label} value={item.value} color={item.color}
                                    onClick={() => router.push(`/dashboard/reports/renewal?status=${encodeURIComponent(item.status)}`)} />
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
