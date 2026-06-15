// app/dashboard/urgent/list/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Package, Pencil, Trash2, ChevronDown, AlertTriangle, CheckCircle2, Clock, Zap, Search, FileSpreadsheet, FileText, ListTodo, X } from "lucide-react";

interface UrgentTask {
    id: number;
    reference: string;
    employee: string;
    description: string;
    task: string;
    status: string;
    priority: string;
    submittedDate: string;
}

const tasks: UrgentTask[] = [
    { id: 1, reference: "UT-1001", employee: "Alice Johnson", description: "Server Shiffing", task: "Server Shiffing", status: "Pending", priority: "High", submittedDate: "2026-02-01" },
    { id: 2, reference: "UT-1002", employee: "Bob Smith", description: "Server Shiffing Gulshan Zone", task: "Server Shiffing Gulshan Zone", status: "Inprogress", priority: "High", submittedDate: "2026-02-02" },
    { id: 3, reference: "UT-1003", employee: "Charlie Brown", description: "Door Server Replacement", task: "Door Server Replacement", status: "Completed", priority: "Medium", submittedDate: "2026-02-03" },
    { id: 4, reference: "UT-1004", employee: "Dana White", description: "Device Shiffing for Hitech", task: "Device Shiffing for Hitech", status: "Pending", priority: "Low", submittedDate: "2026-02-04" },
    { id: 5, reference: "UT-1005", employee: "Evan Lee", description: "Office Shifting", task: "Office Shifting", status: "Inprogress", priority: "Critical", submittedDate: "2026-02-05" },
];

const statusConfig: Record<string, { color: string; bg: string; activeBg: string; icon: React.ReactNode }> = {
    Pending: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", activeBg: "bg-amber-500 text-white border-amber-500", icon: <Clock size={10} /> },
    Inprogress: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", activeBg: "bg-blue-500 text-white border-blue-500", icon: <Zap size={10} /> },
    Completed: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", activeBg: "bg-emerald-500 text-white border-emerald-500", icon: <CheckCircle2 size={10} /> },
};

const priorityConfig: Record<string, { color: string; bg: string; activeBg: string; dot: string }> = {
    Critical: { color: "text-red-700", bg: "bg-red-50 border-red-200", activeBg: "bg-red-500 text-white border-red-500", dot: "bg-red-500" },
    High: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", activeBg: "bg-orange-500 text-white border-orange-500", dot: "bg-orange-500" },
    Medium: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", activeBg: "bg-yellow-500 text-white border-yellow-500", dot: "bg-yellow-500" },
    Low: { color: "text-green-700", bg: "bg-green-50 border-green-200", activeBg: "bg-green-500 text-white border-green-500", dot: "bg-green-500" },
};

function Avatar({ name }: { name: string }) {
    const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    const colors = ["bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"];
    return (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0 ${colors[name.charCodeAt(0) % colors.length]}`}>
            {initials}
        </span>
    );
}

function exportToCSV(data: UrgentTask[]) {
    const headers = ["SL", "Reference", "Employee", "Task", "Description", "Submitted Date", "Status", "Priority"];
    const rows = data.map((t, i) => [i + 1, t.reference, t.employee, t.task, t.description, t.submittedDate, t.status, t.priority]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `urgent-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportToPDF(data: UrgentTask[]) {
    const rows = data.map((t, i) => `<tr><td>${i + 1}</td><td>${t.reference}</td><td>${t.employee}</td><td>${t.task}</td><td>${t.submittedDate}</td><td>${t.status}</td><td>${t.priority}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Urgent Tasks Report</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;padding:24px;color:#111}h2{font-size:16px;margin-bottom:4px}p.sub{color:#666;font-size:10px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#f1f5f9;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0}td{padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}.footer{margin-top:20px;font-size:10px;color:#999;text-align:right}</style>
    </head><body><h2>Urgent Tasks Report</h2><p class="sub">Generated: ${new Date().toLocaleString()} · Total: ${data.length} tasks</p>
    <table><thead><tr><th>#</th><th>Reference</th><th>Employee</th><th>Task</th><th>Date</th><th>Status</th><th>Priority</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">Fiber@Home Ltd. · ITM Portal</div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    win?.addEventListener("load", () => { win.print(); URL.revokeObjectURL(url); });
}

export default function UrgentTaskPage() {
    const [search, setSearch] = useState("");
    const [activeStatus, setActiveStatus] = useState<string | null>(null);
    const [activePriority, setActivePriority] = useState<string | null>(null);

    // Apply all filters together
    const filtered = tasks.filter(item => {
        const matchSearch =
            !search ||
            item.reference.toLowerCase().includes(search.toLowerCase()) ||
            item.employee.toLowerCase().includes(search.toLowerCase()) ||
            item.task.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !activeStatus || item.status === activeStatus;
        const matchPriority = !activePriority || item.priority === activePriority;
        return matchSearch && matchStatus && matchPriority;
    });

    const clearFilters = () => { setSearch(""); setActiveStatus(null); setActivePriority(null); };
    const hasFilters = search || activeStatus || activePriority;

    const handleView = (item: UrgentTask) => console.log("View", item);
    const handleEdit = (item: UrgentTask) => console.log("Edit", item);
    const handleDelete = (id: number) => console.log("Delete", id);

    return (
        <div className="p-4 sm:p-6 space-y-4">

            {/* Header */}
            <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <ListTodo className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-foreground">Urgent Tasks</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">Monitor and manage all critical operations</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => exportToCSV(filtered)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition">
                            <FileSpreadsheet size={13} /> Excel
                        </button>
                        <button onClick={() => exportToPDF(filtered)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition">
                            <FileText size={13} /> PDF
                        </button>
                    </div>
                </div>

                {/* Stat cards — clickable status filter */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total Tasks", value: tasks.length, color: "text-foreground", bg: "bg-muted border-border", status: null },
                        { label: "Pending", value: tasks.filter(t => t.status === "Pending").length, color: "text-amber-700", bg: "bg-amber-50 border-amber-100", status: "Pending" },
                        { label: "In Progress", value: tasks.filter(t => t.status === "Inprogress").length, color: "text-blue-700", bg: "bg-blue-50 border-blue-100", status: "Inprogress" },
                        { label: "Completed", value: tasks.filter(t => t.status === "Completed").length, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", status: "Completed" },
                    ].map(s => (
                        <button
                            key={s.label}
                            onClick={() => setActiveStatus(activeStatus === s.status ? null : s.status)}
                            className={`rounded-xl border px-4 py-3 text-left transition ring-2 ${activeStatus === s.status && s.status !== null
                                    ? "ring-primary"
                                    : "ring-transparent"
                                } ${s.bg} hover:opacity-80`}
                        >
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                            <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Priority filter bar — clickable */}
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">Priority</p>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(priorityConfig).map(([level, cfg]) => {
                        const isActive = activePriority === level;
                        return (
                            <button
                                key={level}
                                onClick={() => setActivePriority(isActive ? null : level)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${isActive ? cfg.activeBg : `${cfg.bg} ${cfg.color}`
                                    }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-white/80" : cfg.dot}`} />
                                {level}
                                <span className={isActive ? "opacity-70" : "opacity-50"}>
                                    {tasks.filter(t => t.priority === level).length}
                                </span>
                            </button>
                        );
                    })}
                </div>
                {tasks.filter(t => t.priority === "Critical").length > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-red-600 font-semibold">
                        <AlertTriangle size={11} /> {tasks.filter(t => t.priority === "Critical").length} Critical
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-border gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {tasks.length} tasks
                        </p>
                        {/* Active filter pills */}
                        {activeStatus && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                                {activeStatus}
                                <button onClick={() => setActiveStatus(null)}><X size={10} /></button>
                            </span>
                        )}
                        {activePriority && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                                {activePriority}
                                <button onClick={() => setActivePriority(null)}><X size={10} /></button>
                            </span>
                        )}
                        {hasFilters && (
                            <button onClick={clearFilters} className="text-[10px] text-muted-foreground hover:text-foreground underline">
                                Clear all
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search reference, person, task..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-7 h-7 w-52 text-xs"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                {["#", "Reference", "Person", "Task", "Date", "Status", "Priority", "Actions"].map(col => (
                                    <th key={col} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filtered.map((item, i) => (
                                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{i + 1}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                            {item.reference}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <Avatar name={item.employee} />
                                            <span className="text-[11px] text-foreground font-medium whitespace-nowrap">{item.employee}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 max-w-[160px]">
                                        <p className="text-[11px] text-foreground font-medium truncate" title={item.task}>{item.task}</p>
                                        <p className="text-[10px] text-muted-foreground truncate" title={item.description}>{item.description}</p>
                                    </td>
                                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">{item.submittedDate}</td>
                                    <td className="px-3 py-2.5"><StatusBadge status={item.status} /></td>
                                    <td className="px-3 py-2.5"><PriorityBadge priority={item.priority} /></td>
                                    <td className="px-3 py-2.5">
                                        <ActionsDropdown item={item} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center">
                                        <p className="text-xs text-muted-foreground">No tasks match your filters.</p>
                                        {hasFilters && (
                                            <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">
                                                Clear filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] || { color: "text-muted-foreground", bg: "bg-muted border-border", icon: null };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.color}`}>
            {cfg.icon} {status}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const cfg = priorityConfig[priority] || { color: "text-muted-foreground", bg: "bg-muted border-border", dot: "bg-border" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] rounded-full font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {priority}
        </span>
    );
}

function ActionsDropdown({ item, onView, onEdit, onDelete }: {
    item: UrgentTask; onView: (i: UrgentTask) => void; onEdit: (i: UrgentTask) => void; onDelete: (id: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    return (
        <div ref={ref} className="relative inline-block">
            <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-muted hover:bg-border rounded-lg border border-border transition text-foreground">
                Actions <ChevronDown size={11} />
            </button>
            {open && (
                <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden py-1">
                    <DropItem icon={<Package size={12} />} label="View" color="text-blue-600" onClick={() => { onView(item); setOpen(false); }} />
                    <DropItem icon={<Pencil size={12} />} label="Edit" color="text-amber-600" onClick={() => { onEdit(item); setOpen(false); }} />
                    <DropItem icon={<Trash2 size={12} />} label="Delete" color="text-red-600" onClick={() => { onDelete(item.id); setOpen(false); }} />
                </div>
            )}
        </div>
    );
}

function DropItem({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium ${color} hover:bg-muted transition`}>
            {icon} {label}
        </button>
    );
}
