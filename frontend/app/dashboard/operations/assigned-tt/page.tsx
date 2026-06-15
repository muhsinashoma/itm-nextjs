
// app/dashboard/operations/assigned-tt/page.tsx
"use client";

import { useEffect, useState } from "react";
import { sections } from "@/components/tt-data";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Search, X, Users, ClipboardList, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TT { id: number; title: string; date: string; }

interface Task {
    id: string;
    assigned_id: string;
    assigned_name: string;
    assigned_tt_no: number;
    tt_history: TT[];
}

const assignedNameMap: Record<string, string> = {
    "EMP002-0007": "Shakil Akhter Khan - Deputy General Manager",
    "EMP002-0008": "Md. Saulad Zahir Alvi - Manager",
    "EMP002-0009": "Nur Hosen - Assist Manager",
    "EMP002-0010": "Rustam Ali - Assist Manager",
    "EMP002-0011": "S.M. Ariful - Sr. Engineer",
    "EMP002-0012": "Sakib Mashrafi Apu - Engineer",
    "EMP002-0013": "Ruhul Amin - Engineer",
};

function Avatar({ name }: { name: string }) {
    const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    const colors = ["bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-sky-100 text-sky-700", "bg-pink-100 text-pink-700"];
    return (
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold shrink-0 ${colors[name.charCodeAt(0) % colors.length]}`}>
            {initials}
        </span>
    );
}

const statusCfg: Record<string, string> = {
    open: "bg-green-50 text-green-700 border-green-200",
    closed: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-orange-50 text-orange-700 border-orange-200",
    "not started": "bg-yellow-50 text-yellow-700 border-yellow-200",
};

function StatusBadge({ status }: { status: string }) {
    const cls = statusCfg[status?.toLowerCase()] || "bg-muted text-muted-foreground border-border";
    return (
        <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border whitespace-nowrap ${cls}`}>
            {status}
        </span>
    );
}

export default function AssignedTTPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentTT, setCurrentTT] = useState<Task | null>(null);
    const [memberFilter, setMemberFilter] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const grouped: Record<string, Task> = {};
        sections.forEach((item) => {
            const emp = item.assigned_id?.toString().trim();
            if (!grouped[emp]) {
                grouped[emp] = {
                    id: emp,
                    assigned_id: emp,
                    assigned_name: assignedNameMap[emp] || "Unknown",
                    assigned_tt_no: 0,
                    tt_history: [],
                };
            }
            grouped[emp].assigned_tt_no += 1;
            grouped[emp].tt_history.push({ id: Number(item.id), title: item.tt_no, date: item.created_at || "" });
        });
        setTasks(Object.values(grouped));
        setLoading(false);
    }, []);

    const filtered = tasks.filter(t =>
        (memberFilter === "" || t.assigned_name === memberFilter) &&
        (search === "" || t.assigned_name.toLowerCase().includes(search.toLowerCase()) || t.assigned_id.toLowerCase().includes(search.toLowerCase()))
    );

    const totalTTs = tasks.reduce((s, t) => s + t.assigned_tt_no, 0);
    const totalMembers = tasks.length;

    return (
        <div className="p-4 sm:p-6 space-y-4">

            {/* Header */}
            <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <ClipboardList className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-foreground">Assigned Trouble Tickets</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">View TT assignments per IT personnel</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-muted px-4 py-3">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total Members</p>
                        <p className="text-xl font-bold text-foreground mt-0.5">{totalMembers}</p>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total TTs Assigned</p>
                        <p className="text-xl font-bold text-blue-700 mt-0.5">{totalTTs}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Avg TT / Member</p>
                        <p className="text-xl font-bold text-emerald-700 mt-0.5">
                            {totalMembers ? (totalTTs / totalMembers).toFixed(1) : "0"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters + Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {tasks.length} members
                        </p>
                        {memberFilter && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                                {memberFilter.split(" - ")[0]}
                                <button onClick={() => setMemberFilter("")}><X size={10} /></button>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Member select */}
                        <div className="relative">
                            <select
                                value={memberFilter}
                                onChange={e => setMemberFilter(e.target.value)}
                                className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">All Members</option>
                                {[...new Set(tasks.map(t => t.assigned_name))].map(m => (
                                    <option key={m} value={m}>{m.split(" - ")[0]}</option>
                                ))}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <Input placeholder="Search member..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 w-40 text-xs" />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3 p-4">
                        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
                    </div>
                ) : (
                    <table className="w-full min-w-[400px]">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                {["#", "Employee ID", "IT Personnel", "Total TTs"].map(col => (
                                    <th key={col} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">No members found.</td></tr>
                            ) : filtered.map((task, i) => {
                                const [name, designation] = task.assigned_name.split(" - ");
                                return (
                                    <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-[11px] text-muted-foreground">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-[11px] font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                {task.assigned_id}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar name={name} />
                                                <div>
                                                    <p className="text-[11px] font-semibold text-foreground">{name}</p>
                                                    {designation && (
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">{designation}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => { setCurrentTT(task); setModalOpen(true); }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition"
                                            >
                                                <ClipboardList size={12} />
                                                {task.assigned_tt_no} TTs
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* TT History Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                {currentTT && (
                    <DialogContent className="max-w-5xl w-[96vw] bg-card border border-border rounded-2xl p-0 overflow-hidden shadow-2xl">

                        {/* Modal Header */}
                        <div className="bg-primary px-5 py-4 flex items-start justify-between">
                            <div>
                                <DialogTitle className="text-sm font-semibold text-primary-foreground">
                                    TT History — {currentTT.assigned_name.split(" - ")[0]}
                                </DialogTitle>
                                <p className="text-[11px] text-primary-foreground/70 mt-0.5">
                                    {currentTT.assigned_id} · {currentTT.assigned_tt_no} ticket{currentTT.assigned_tt_no !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <DialogClose asChild>
                                <button className="rounded-lg p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </DialogClose>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-auto max-h-[70vh]">
                            {currentTT.tt_history.length ? (
                                <table className="w-full min-w-[860px]">
                                    <thead className="bg-muted/60 border-b border-border sticky top-0 z-10">
                                        <tr>
                                            {["#", "TT No", "Emp ID", "Status", "Department", "Function", "Delivered", "Query Type", "TT Age", "Created At", "Mobile"].map(col => (
                                                <th key={col} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {currentTT.tt_history.map((tt, index) => {
                                            const ttData = sections.find(s => Number(s.id) === tt.id);
                                            if (!ttData) return null;
                                            return (
                                                <tr key={tt.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-3 py-2 text-[11px] text-muted-foreground">{index + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 whitespace-nowrap">{ttData.tt_no}</span>
                                                    </td>
                                                    <td className="px-3 py-2 text-[11px] text-muted-foreground font-mono whitespace-nowrap">{ttData.employee_id}</td>
                                                    <td className="px-3 py-2"><StatusBadge status={ttData.status} /></td>
                                                    <td className="px-3 py-2 text-[11px] text-foreground max-w-[120px] truncate" title={ttData.dept_name}>{ttData.dept_name}</td>
                                                    <td className="px-3 py-2 text-[11px] text-foreground max-w-[100px] truncate" title={ttData.func_name}>{ttData.func_name}</td>
                                                    <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">{ttData.delivered_status || "—"}</td>
                                                    <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">{ttData.query_type}</td>
                                                    <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">
                                                        {ttData.tt_age ? ttData.tt_age.replace(/\s*Hours$/, " Hours").trim() : "—"}
                                                    </td>
                                                    <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">{ttData.created_at}</td>
                                                    <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">{ttData.mobile_no}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-10 text-center text-xs text-muted-foreground">No TT history available.</div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-3 border-t border-border bg-muted/40 flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">
                                {currentTT.assigned_tt_no} ticket{currentTT.assigned_tt_no !== 1 ? "s" : ""} assigned
                            </p>
                            <DialogClose asChild>
                                <button className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                                    Close
                                </button>
                            </DialogClose>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}
