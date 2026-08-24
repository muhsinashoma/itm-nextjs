
// // itm/frontend/app/dashboard/operations/assigned-tt/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { sections } from "@/components/tt-data";
// import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
// import { Search, X, Users, ClipboardList, ChevronDown } from "lucide-react";
// import { Input } from "@/components/ui/input";

// interface TT { id: number; title: string; date: string; }

// interface Task {
//     id: string;
//     assigned_id: string;
//     assigned_name: string;
//     assigned_tt_no: number;
//     tt_history: TT[];
// }

// const assignedNameMap: Record<string, string> = {
//     "EMP002-0007": "Shakil Akhter Khan - Deputy General Manager",
//     "EMP002-0008": "Md. Saulad Zahir Alvi - Manager",
//     "EMP002-0009": "Nur Hosen - Assist Manager",
//     "EMP002-0010": "Rustam Ali - Assist Manager",
//     "EMP002-0011": "S.M. Ariful - Sr. Engineer",
//     "EMP002-0012": "Sakib Mashrafi Apu - Engineer",
//     "EMP002-0013": "Ruhul Amin - Engineer",
// };

// function Avatar({ name }: { name: string }) {
//     const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
//     const colors = ["bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-sky-100 text-sky-700", "bg-pink-100 text-pink-700"];
//     return (
//         <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold shrink-0 ${colors[name.charCodeAt(0) % colors.length]}`}>
//             {initials}
//         </span>
//     );
// }

// const statusCfg: Record<string, string> = {
//     open: "bg-green-50 text-green-700 border-green-200",
//     closed: "bg-red-50 text-red-700 border-red-200",
//     pending: "bg-orange-50 text-orange-700 border-orange-200",
//     "not started": "bg-yellow-50 text-yellow-700 border-yellow-200",
// };

// function StatusBadge({ status }: { status: string }) {
//     const cls = statusCfg[status?.toLowerCase()] || "bg-muted text-muted-foreground border-border";
//     return (
//         <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border whitespace-nowrap ${cls}`}>
//             {status}
//         </span>
//     );
// }

// export default function AssignedTTPage() {
//     const [tasks, setTasks] = useState<Task[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [modalOpen, setModalOpen] = useState(false);
//     const [currentTT, setCurrentTT] = useState<Task | null>(null);
//     const [memberFilter, setMemberFilter] = useState("");
//     const [search, setSearch] = useState("");

//     useEffect(() => {
//         const grouped: Record<string, Task> = {};
//         sections.forEach((item) => {
//             const emp = item.assigned_id?.toString().trim();
//             if (!grouped[emp]) {
//                 grouped[emp] = {
//                     id: emp,
//                     assigned_id: emp,
//                     assigned_name: assignedNameMap[emp] || "Unknown",
//                     assigned_tt_no: 0,
//                     tt_history: [],
//                 };
//             }
//             grouped[emp].assigned_tt_no += 1;
//             grouped[emp].tt_history.push({ id: Number(item.id), title: item.tt_no, date: item.created_at || "" });
//         });
//         setTasks(Object.values(grouped));
//         setLoading(false);
//     }, []);

//     const filtered = tasks.filter(t =>
//         (memberFilter === "" || t.assigned_name === memberFilter) &&
//         (search === "" || t.assigned_name.toLowerCase().includes(search.toLowerCase()) || t.assigned_id.toLowerCase().includes(search.toLowerCase()))
//     );

//     const totalTTs = tasks.reduce((s, t) => s + t.assigned_tt_no, 0);
//     const totalMembers = tasks.length;

//     return (
//         <div className="p-4 sm:p-6 space-y-4">

//             {/* Header */}
//             <div className="bg-card border border-border rounded-2xl p-5">
//                 <div className="flex flex-wrap items-start justify-between gap-3">
//                     <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
//                             <ClipboardList className="w-5 h-5 text-blue-600" />
//                         </div>
//                         <div>
//                             <h1 className="text-sm font-bold text-foreground">Assigned Trouble Tickets</h1>
//                             <p className="text-xs text-muted-foreground mt-0.5">View TT assignments per IT personnel</p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Stats */}
//                 <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
//                     <div className="rounded-xl border border-border bg-muted px-4 py-3">
//                         <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total Members</p>
//                         <p className="text-xl font-bold text-foreground mt-0.5">{totalMembers}</p>
//                     </div>
//                     <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
//                         <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total TTs Assigned</p>
//                         <p className="text-xl font-bold text-blue-700 mt-0.5">{totalTTs}</p>
//                     </div>
//                     <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
//                         <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Avg TT / Member</p>
//                         <p className="text-xl font-bold text-emerald-700 mt-0.5">
//                             {totalMembers ? (totalTTs / totalMembers).toFixed(1) : "0"}
//                         </p>
//                     </div>
//                 </div>
//             </div>

//             {/* Filters + Table */}
//             <div className="bg-card border border-border rounded-xl overflow-hidden">

//                 {/* Toolbar */}
//                 <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
//                     <div className="flex items-center gap-2 flex-wrap">
//                         <p className="text-[11px] text-muted-foreground">
//                             Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {tasks.length} members
//                         </p>
//                         {memberFilter && (
//                             <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
//                                 {memberFilter.split(" - ")[0]}
//                                 <button onClick={() => setMemberFilter("")}><X size={10} /></button>
//                             </span>
//                         )}
//                     </div>
//                     <div className="flex items-center gap-2">
//                         {/* Member select */}
//                         <div className="relative">
//                             <select
//                                 value={memberFilter}
//                                 onChange={e => setMemberFilter(e.target.value)}
//                                 className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
//                             >
//                                 <option value="">All Members</option>
//                                 {[...new Set(tasks.map(t => t.assigned_name))].map(m => (
//                                     <option key={m} value={m}>{m.split(" - ")[0]}</option>
//                                 ))}
//                             </select>
//                             <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
//                         </div>
//                         {/* Search */}
//                         <div className="relative">
//                             <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
//                             <Input placeholder="Search member..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 w-40 text-xs" />
//                         </div>
//                     </div>
//                 </div>

//                 {loading ? (
//                     <div className="space-y-3 p-4">
//                         {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
//                     </div>
//                 ) : (
//                     <table className="w-full min-w-[400px]">
//                         <thead className="bg-muted/50 border-b border-border">
//                             <tr>
//                                 {["#", "Employee ID", "IT Personnel", "Total TTs"].map(col => (
//                                     <th key={col} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
//                                         {col}
//                                     </th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-border/50">
//                             {filtered.length === 0 ? (
//                                 <tr><td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">No members found.</td></tr>
//                             ) : filtered.map((task, i) => {
//                                 const [name, designation] = task.assigned_name.split(" - ");
//                                 return (
//                                     <tr key={task.id} className="hover:bg-muted/30 transition-colors">
//                                         <td className="px-4 py-3 text-[11px] text-muted-foreground">{i + 1}</td>
//                                         <td className="px-4 py-3">
//                                             <span className="text-[11px] font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
//                                                 {task.assigned_id}
//                                             </span>
//                                         </td>
//                                         <td className="px-4 py-3">
//                                             <div className="flex items-center gap-2.5">
//                                                 <Avatar name={name} />
//                                                 <div>
//                                                     <p className="text-[11px] font-semibold text-foreground">{name}</p>
//                                                     {designation && (
//                                                         <p className="text-[10px] text-muted-foreground mt-0.5">{designation}</p>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         </td>
//                                         <td className="px-4 py-3">
//                                             <button
//                                                 onClick={() => { setCurrentTT(task); setModalOpen(true); }}
//                                                 className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition"
//                                             >
//                                                 <ClipboardList size={12} />
//                                                 {task.assigned_tt_no} TTs
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 )}
//             </div>

//             {/* TT History Modal */}
//             <Dialog open={modalOpen} onOpenChange={setModalOpen}>
//                 {currentTT && (
//                     <DialogContent className="max-w-5xl w-[96vw] bg-card border border-border rounded-2xl p-0 overflow-hidden shadow-2xl">

//                         {/* Modal Header */}
//                         <div className="bg-primary px-5 py-4 flex items-start justify-between">
//                             <div>
//                                 <DialogTitle className="text-sm font-semibold text-primary-foreground">
//                                     TT History — {currentTT.assigned_name.split(" - ")[0]}
//                                 </DialogTitle>
//                                 <p className="text-[11px] text-primary-foreground/70 mt-0.5">
//                                     {currentTT.assigned_id} · {currentTT.assigned_tt_no} ticket{currentTT.assigned_tt_no !== 1 ? "s" : ""}
//                                 </p>
//                             </div>
//                             <DialogClose asChild>
//                                 <button className="rounded-lg p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors">
//                                     <X className="h-4 w-4" />
//                                 </button>
//                             </DialogClose>
//                         </div>

//                         {/* Modal Body */}
//                         <div className="overflow-auto max-h-[70vh]">
//                             {currentTT.tt_history.length ? (
//                                 <table className="w-full min-w-[860px]">
//                                     <thead className="bg-muted/60 border-b border-border sticky top-0 z-10">
//                                         <tr>
//                                             {["#", "TT No", "Emp ID", "Status", "Department", "Function", "Delivered", "Query Type", "TT Age", "Created At", "Mobile"].map(col => (
//                                                 <th key={col} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
//                                                     {col}
//                                                 </th>
//                                             ))}
//                                         </tr>
//                                     </thead>
//                                     <tbody className="divide-y divide-border/50">
//                                         {currentTT.tt_history.map((tt, index) => {
//                                             const ttData = sections.find(s => Number(s.id) === tt.id);
//                                             if (!ttData) return null;
//                                             return (
//                                                 <tr key={tt.id} className="hover:bg-muted/30 transition-colors">
//                                                     <td className="px-3 py-2 text-[11px] text-muted-foreground">{index + 1}</td>
//                                                     <td className="px-3 py-2">
//                                                         <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 whitespace-nowrap">{ttData.tt_no}</span>
//                                                     </td>
//                                                     <td className="px-3 py-2 text-[11px] text-muted-foreground font-mono whitespace-nowrap">{ttData.employee_id}</td>
//                                                     <td className="px-3 py-2"><StatusBadge status={ttData.status} /></td>
//                                                     <td className="px-3 py-2 text-[11px] text-foreground max-w-[120px] truncate" title={ttData.dept_name}>{ttData.dept_name}</td>
//                                                     <td className="px-3 py-2 text-[11px] text-foreground max-w-[100px] truncate" title={ttData.func_name}>{ttData.func_name}</td>
//                                                     <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">{ttData.delivered_status || "—"}</td>
//                                                     <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">{ttData.query_type}</td>
//                                                     <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">
//                                                         {ttData.tt_age ? ttData.tt_age.replace(/\s*Hours$/, " Hours").trim() : "—"}
//                                                     </td>
//                                                     <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">{ttData.created_at}</td>
//                                                     <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">{ttData.mobile_no}</td>
//                                                 </tr>
//                                             );
//                                         })}
//                                     </tbody>
//                                 </table>
//                             ) : (
//                                 <div className="py-10 text-center text-xs text-muted-foreground">No TT history available.</div>
//                             )}
//                         </div>

//                         {/* Modal Footer */}
//                         <div className="px-5 py-3 border-t border-border bg-muted/40 flex items-center justify-between">
//                             <p className="text-[11px] text-muted-foreground">
//                                 {currentTT.assigned_tt_no} ticket{currentTT.assigned_tt_no !== 1 ? "s" : ""} assigned
//                             </p>
//                             <DialogClose asChild>
//                                 <button className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
//                                     Close
//                                 </button>
//                             </DialogClose>
//                         </div>
//                     </DialogContent>
//                 )}
//             </Dialog>
//         </div>
//     );
// }



"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Activity,
    ChevronDown,
    ClipboardList,
    Loader2,
    RefreshCw,
    Search,
    Users,
    X,
} from "lucide-react";

import {
    dashboardApi,
    type TroubleTicketITPersonnel,
    type TroubleTicketItem,
    type TroubleTicketStatus,
} from "@/lib/api";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Input,
} from "@/components/ui/input";

/* ======================================================
   CONFIG
====================================================== */

const REFRESH_INTERVAL =
    30_000;

const PAGE_LIMIT =
    100;

const LIVE_STATUSES:
    TroubleTicketStatus[] =
    [
        "Not Started",
        "Open",
        "In Progress",
    ];

/* ======================================================
   TYPES
====================================================== */

interface PersonnelSummary {
    employee_id: string;

    employee_name: string;

    not_started: number;

    open: number;

    in_progress: number;

    total_live: number;
}

/* ======================================================
   HELPERS
====================================================== */

function Avatar({
    name,
}: {
    name: string;
}) {
    const initials =
        name
            .split(/\s+/)
            .filter(Boolean)
            .map(
                (
                    part
                ) =>
                    part[0]
            )
            .slice(
                0,
                2
            )
            .join("")
            .toUpperCase();

    return (
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[11px] font-bold text-blue-700">
            {initials ||
                "IT"}
        </span>
    );
}

function StatusBadge({
    status,
}: {
    status: string;
}) {
    const normalized =
        status
            ?.trim()
            .toLowerCase();

    let cls =
        "border-border bg-muted text-muted-foreground";

    if (
        normalized ===
        "open"
    ) {
        cls =
            "border-blue-200 bg-blue-50 text-blue-700";
    } else if (
        normalized ===
        "in progress"
    ) {
        cls =
            "border-amber-200 bg-amber-50 text-amber-700";
    } else if (
        normalized ===
        "not started"
    ) {
        cls =
            "border-slate-200 bg-slate-50 text-slate-700";
    } else if (
        normalized ===
        "closed"
    ) {
        cls =
            "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}
        >
            {status ||
                "Unknown"}
        </span>
    );
}

function formatAge(
    seconds?: number
) {
    if (
        !seconds ||
        seconds <= 0
    ) {
        return "—";
    }

    const days =
        Math.floor(
            seconds /
            86400
        );

    const hours =
        Math.floor(
            (
                seconds %
                86400
            ) /
            3600
        );

    const minutes =
        Math.floor(
            (
                seconds %
                3600
            ) /
            60
        );

    if (
        days > 0
    ) {
        return `${days}d ${hours}h`;
    }

    if (
        hours > 0
    ) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

/* ======================================================
   PAGE
====================================================== */

export default function AssignedTTPage() {
    const [
        personnel,
        setPersonnel,
    ] =
        useState<
            PersonnelSummary[]
        >([]);

    const [
        loading,
        setLoading,
    ] =
        useState(
            true
        );

    const [
        refreshing,
        setRefreshing,
    ] =
        useState(
            false
        );

    const [
        error,
        setError,
    ] =
        useState(
            ""
        );

    const [
        search,
        setSearch,
    ] =
        useState(
            ""
        );

    const [
        memberFilter,
        setMemberFilter,
    ] =
        useState(
            ""
        );

    /* ==================================================
       MODAL
    ================================================== */

    const [
        modalOpen,
        setModalOpen,
    ] =
        useState(
            false
        );

    const [
        selectedPersonnel,
        setSelectedPersonnel,
    ] =
        useState<
            PersonnelSummary | null
        >(
            null
        );

    const [
        modalTickets,
        setModalTickets,
    ] =
        useState<
            TroubleTicketItem[]
        >([]);

    const [
        modalLoading,
        setModalLoading,
    ] =
        useState(
            false
        );

    const [
        modalSearch,
        setModalSearch,
    ] =
        useState(
            ""
        );

    /* ==================================================
       LOAD COUNT FOR ONE STATUS
    ================================================== */

    const getStatusCount =
        useCallback(
            async (
                employeeID:
                    string,

                status:
                    TroubleTicketStatus
            ) => {
                const response =
                    await dashboardApi.troubleTickets(
                        {
                            page:
                                1,

                            limit:
                                1,

                            scope:
                                "all",

                            status,

                            it_personal:
                                employeeID,
                        }
                    );

                return Number(
                    response.total ??
                    0
                );
            },
            []
        );

    /* ==================================================
       LOAD PERSONNEL + LIVE COUNTS
    ================================================== */

    const loadLiveAssignments =
        useCallback(
            async (
                initial =
                    false
            ) => {
                if (
                    initial
                ) {
                    setLoading(
                        true
                    );
                } else {
                    setRefreshing(
                        true
                    );
                }

                setError(
                    ""
                );

                try {
                    /* ==================================
                       ACTIVE IT PERSONNEL
                    ================================== */

                    const personnelResponse =
                        await dashboardApi.troubleTicketITPersonnel();

                    const people:
                        TroubleTicketITPersonnel[] =
                        personnelResponse.data ??
                        [];

                    /* ==================================
                       LIVE TT COUNTS

                       Closed tickets intentionally
                       excluded.
                    ================================== */

                    const summaries =
                        await Promise.all(
                            people.map(
                                async (
                                    person
                                ) => {
                                    const [
                                        notStarted,
                                        open,
                                        inProgress,
                                    ] =
                                        await Promise.all(
                                            [
                                                getStatusCount(
                                                    person.employee_id,
                                                    "Not Started"
                                                ),

                                                getStatusCount(
                                                    person.employee_id,
                                                    "Open"
                                                ),

                                                getStatusCount(
                                                    person.employee_id,
                                                    "In Progress"
                                                ),
                                            ]
                                        );

                                    return {
                                        employee_id:
                                            person.employee_id,

                                        employee_name:
                                            person.employee_name,

                                        not_started:
                                            notStarted,

                                        open,

                                        in_progress:
                                            inProgress,

                                        total_live:
                                            notStarted +
                                            open +
                                            inProgress,
                                    };
                                }
                            )
                        );

                    summaries.sort(
                        (
                            a,
                            b
                        ) => {
                            if (
                                b.total_live !==
                                a.total_live
                            ) {
                                return (
                                    b.total_live -
                                    a.total_live
                                );
                            }

                            return a.employee_name.localeCompare(
                                b.employee_name
                            );
                        }
                    );

                    setPersonnel(
                        summaries
                    );
                } catch (
                reason
                ) {
                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load live assigned tickets."
                    );
                } finally {
                    setLoading(
                        false
                    );

                    setRefreshing(
                        false
                    );
                }
            },
            [
                getStatusCount,
            ]
        );

    /* ==================================================
       INITIAL + AUTO REFRESH
    ================================================== */

    useEffect(
        () => {
            void loadLiveAssignments(
                true
            );

            const timer =
                window.setInterval(
                    () => {
                        void loadLiveAssignments(
                            false
                        );
                    },
                    REFRESH_INTERVAL
                );

            return () => {
                window.clearInterval(
                    timer
                );
            };
        },
        [
            loadLiveAssignments,
        ]
    );

    /* ==================================================
       FETCH ALL TICKETS FOR ONE STATUS
    ================================================== */

    const fetchAllTicketsForStatus =
        useCallback(
            async (
                employeeID:
                    string,

                status:
                    TroubleTicketStatus
            ) => {
                const result:
                    TroubleTicketItem[] =
                    [];

                let page =
                    1;

                let total =
                    0;

                do {
                    const response =
                        await dashboardApi.troubleTickets(
                            {
                                page,

                                limit:
                                    PAGE_LIMIT,

                                scope:
                                    "all",

                                status,

                                it_personal:
                                    employeeID,
                            }
                        );

                    const rows =
                        response.data ??
                        [];

                    result.push(
                        ...rows
                    );

                    total =
                        Number(
                            response.total ??
                            0
                        );

                    page++;
                } while (
                    result.length <
                    total
                );

                return result;
            },
            []
        );

    /* ==================================================
       OPEN LIVE TT MODAL
    ================================================== */

    const openPersonnelTickets =
        useCallback(
            async (
                person:
                    PersonnelSummary
            ) => {
                setSelectedPersonnel(
                    person
                );

                setModalOpen(
                    true
                );

                setModalLoading(
                    true
                );

                setModalSearch(
                    ""
                );

                setModalTickets(
                    []
                );

                try {
                    const [
                        notStarted,
                        open,
                        inProgress,
                    ] =
                        await Promise.all(
                            LIVE_STATUSES.map(
                                (
                                    status
                                ) =>
                                    fetchAllTicketsForStatus(
                                        person.employee_id,
                                        status
                                    )
                            )
                        );

                    const combined =
                        [
                            ...notStarted,
                            ...open,
                            ...inProgress,
                        ];

                    /* ==============================
                       Remove accidental duplicates
                    ============================== */

                    const unique =
                        Array.from(
                            new Map(
                                combined.map(
                                    (
                                        ticket
                                    ) => [
                                            ticket.id,
                                            ticket,
                                        ]
                                )
                            ).values()
                        );

                    unique.sort(
                        (
                            a,
                            b
                        ) => {
                            const aTime =
                                Date.parse(
                                    a.created_at ??
                                    ""
                                ) ||
                                0;

                            const bTime =
                                Date.parse(
                                    b.created_at ??
                                    ""
                                ) ||
                                0;

                            return (
                                bTime -
                                aTime
                            );
                        }
                    );

                    setModalTickets(
                        unique
                    );
                } catch (
                reason
                ) {
                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load assigned tickets."
                    );
                } finally {
                    setModalLoading(
                        false
                    );
                }
            },
            [
                fetchAllTicketsForStatus,
            ]
        );

    /* ==================================================
       FILTER PERSONNEL
    ================================================== */

    const filteredPersonnel =
        useMemo(
            () => {
                const normalizedSearch =
                    search
                        .trim()
                        .toLowerCase();

                return personnel.filter(
                    (
                        person
                    ) => {
                        if (
                            memberFilter &&
                            person.employee_id !==
                            memberFilter
                        ) {
                            return false;
                        }

                        if (
                            !normalizedSearch
                        ) {
                            return true;
                        }

                        return (
                            person.employee_name
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                ) ||
                            person.employee_id
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                )
                        );
                    }
                );
            },
            [
                personnel,
                memberFilter,
                search,
            ]
        );

    /* ==================================================
       FILTER MODAL
    ================================================== */

    const filteredModalTickets =
        useMemo(
            () => {
                const value =
                    modalSearch
                        .trim()
                        .toLowerCase();

                if (
                    !value
                ) {
                    return modalTickets;
                }

                return modalTickets.filter(
                    (
                        ticket
                    ) =>
                        ticket.tt_no
                            ?.toLowerCase()
                            .includes(
                                value
                            ) ||
                        ticket.employee_id
                            ?.toLowerCase()
                            .includes(
                                value
                            ) ||
                        ticket.employee_name
                            ?.toLowerCase()
                            .includes(
                                value
                            ) ||
                        ticket.query_type
                            ?.toLowerCase()
                            .includes(
                                value
                            ) ||
                        ticket.dept_name
                            ?.toLowerCase()
                            .includes(
                                value
                            )
                );
            },
            [
                modalTickets,
                modalSearch,
            ]
        );

    /* ==================================================
       TOTALS
    ================================================== */

    const totalLiveTT =
        personnel.reduce(
            (
                sum,
                item
            ) =>
                sum +
                item.total_live,
            0
        );

    const totalActivePersonnel =
        personnel.filter(
            (
                item
            ) =>
                item.total_live >
                0
        ).length;

    const average =
        personnel.length >
            0
            ? (
                totalLiveTT /
                personnel.length
            ).toFixed(
                1
            )
            : "0";

    /* ==================================================
       UI
    ================================================== */

    return (
        <div className="space-y-4 p-4 sm:p-5">
            {/* ==========================================
                HEADER
            ========================================== */}

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-bold text-foreground">
                                    Live Assigned Trouble Tickets
                                </h1>

                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                                    LIVE
                                </span>
                            </div>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Current active TT workload assigned to IT personnel
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={
                            refreshing
                        }
                        onClick={() =>
                            void loadLiveAssignments(
                                false
                            )
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:opacity-60"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${refreshing
                                    ? "animate-spin"
                                    : ""
                                }`}
                        />

                        Refresh
                    </button>
                </div>

                {/* ======================================
                    STATS
                ====================================== */}

                <div className="grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                        label="IT Personnel"
                        value={
                            personnel.length
                        }
                    />

                    <Stat
                        label="With Active TT"
                        value={
                            totalActivePersonnel
                        }
                    />

                    <Stat
                        label="Live Assigned TT"
                        value={
                            totalLiveTT
                        }
                    />

                    <Stat
                        label="Avg TT / Personnel"
                        value={
                            average
                        }
                    />
                </div>
            </section>

            {/* ==========================================
                ERROR
            ========================================== */}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    {error}
                </div>
            )}

            {/* ==========================================
                TABLE
            ========================================== */}

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* ======================================
                    FILTERS
                ====================================== */}

                <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold text-foreground">
                            IT Personnel Workload
                        </p>

                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Showing{" "}
                            <span className="font-semibold text-foreground">
                                {
                                    filteredPersonnel.length
                                }
                            </span>{" "}
                            of{" "}
                            {
                                personnel.length
                            }{" "}
                            active IT personnel
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative">
                            <select
                                value={
                                    memberFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setMemberFilter(
                                        event.target.value
                                    )
                                }
                                className="h-8 appearance-none rounded-lg border border-border bg-background pl-3 pr-8 text-[11px] text-foreground outline-none"
                            >
                                <option value="">
                                    All IT Personnel
                                </option>

                                {personnel.map(
                                    (
                                        person
                                    ) => (
                                        <option
                                            key={
                                                person.employee_id
                                            }
                                            value={
                                                person.employee_id
                                            }
                                        >
                                            {
                                                person.employee_name
                                            }
                                        </option>
                                    )
                                )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        </div>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search IT personnel..."
                                className="h-8 w-full pl-8 text-[11px] sm:w-52"
                            />
                        </div>
                    </div>
                </div>

                {/* ======================================
                    CONTENT
                ====================================== */}

                {loading ? (
                    <div className="flex min-h-[260px] items-center justify-center">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />

                            Loading live assignments...
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px]">
                            <thead className="border-b border-border bg-muted/40">
                                <tr>
                                    <Th>
                                        #
                                    </Th>

                                    <Th>
                                        Employee ID
                                    </Th>

                                    <Th>
                                        IT Personnel
                                    </Th>

                                    <Th>
                                        Not Started
                                    </Th>

                                    <Th>
                                        Open
                                    </Th>

                                    <Th>
                                        In Progress
                                    </Th>

                                    <Th>
                                        Live Assigned
                                    </Th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border/60">
                                {filteredPersonnel.length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                7
                                            }
                                            className="py-10 text-center text-xs text-muted-foreground"
                                        >
                                            No IT personnel found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPersonnel.map(
                                        (
                                            person,
                                            index
                                        ) => (
                                            <tr
                                                key={
                                                    person.employee_id
                                                }
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <Td>
                                                    <span className="text-muted-foreground">
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </span>
                                                </Td>

                                                <Td>
                                                    <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 font-mono text-[10px] font-semibold text-blue-700">
                                                        {
                                                            person.employee_id
                                                        }
                                                    </span>
                                                </Td>

                                                <Td>
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar
                                                            name={
                                                                person.employee_name
                                                            }
                                                        />

                                                        <div>
                                                            <p className="text-[11px] font-semibold text-foreground">
                                                                {
                                                                    person.employee_name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                                                                Active IT Personnel
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Td>

                                                <Td>
                                                    <CountBadge
                                                        value={
                                                            person.not_started
                                                        }
                                                        type="neutral"
                                                    />
                                                </Td>

                                                <Td>
                                                    <CountBadge
                                                        value={
                                                            person.open
                                                        }
                                                        type="open"
                                                    />
                                                </Td>

                                                <Td>
                                                    <CountBadge
                                                        value={
                                                            person.in_progress
                                                        }
                                                        type="running"
                                                    />
                                                </Td>

                                                <Td>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            person.total_live ===
                                                            0
                                                        }
                                                        onClick={() =>
                                                            void openPersonnelTickets(
                                                                person
                                                            )
                                                        }
                                                        className="inline-flex min-w-[92px] items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-default disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                                                    >
                                                        <Activity className="h-3.5 w-3.5" />

                                                        {
                                                            person.total_live
                                                        }{" "}
                                                        TT
                                                    </button>
                                                </Td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ==========================================
                LIVE TT DETAIL MODAL
            ========================================== */}

            <Dialog
                open={
                    modalOpen
                }
                onOpenChange={
                    setModalOpen
                }
            >
                {selectedPersonnel && (
                    <DialogContent className="w-[96vw] max-w-6xl overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl">
                        {/* ==================================
                            MODAL HEADER
                        ================================== */}

                        <div className="flex items-start justify-between border-b border-border bg-slate-900 px-5 py-4 text-white">
                            <div>
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-sm font-semibold">
                                        Live Assigned TT
                                    </DialogTitle>

                                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
                                        LIVE
                                    </span>
                                </div>

                                <p className="mt-1 text-[11px] text-slate-300">
                                    {
                                        selectedPersonnel.employee_name
                                    }
                                    {" · "}
                                    {
                                        selectedPersonnel.employee_id
                                    }
                                    {" · "}
                                    {
                                        selectedPersonnel.total_live
                                    }{" "}
                                    active ticket
                                    {selectedPersonnel.total_live !==
                                        1
                                        ? "s"
                                        : ""}
                                </p>
                            </div>

                            <DialogClose
                                asChild
                            >
                                <button
                                    type="button"
                                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </DialogClose>
                        </div>

                        {/* ==================================
                            MODAL TOOLBAR
                        ================================== */}

                        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                            <p className="text-[10px] text-muted-foreground">
                                Not Started + Open + In Progress
                            </p>

                            <div className="relative w-64 max-w-full">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={
                                        modalSearch
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setModalSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search TT..."
                                    className="h-8 pl-8 text-[11px]"
                                />
                            </div>
                        </div>

                        {/* ==================================
                            MODAL TABLE
                        ================================== */}

                        <div className="max-h-[68vh] overflow-auto">
                            {modalLoading ? (
                                <div className="flex min-h-[280px] items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                </div>
                            ) : filteredModalTickets.length ===
                                0 ? (
                                <div className="py-12 text-center text-xs text-muted-foreground">
                                    No active assigned tickets found.
                                </div>
                            ) : (
                                <table className="w-full min-w-[1100px]">
                                    <thead className="sticky top-0 z-10 border-b border-border bg-muted">
                                        <tr>
                                            <Th>
                                                #
                                            </Th>

                                            <Th>
                                                TT No
                                            </Th>

                                            <Th>
                                                Requester
                                            </Th>

                                            <Th>
                                                Department
                                            </Th>

                                            <Th>
                                                Query
                                            </Th>

                                            <Th>
                                                Status
                                            </Th>

                                            <Th>
                                                Age
                                            </Th>

                                            <Th>
                                                Created
                                            </Th>

                                            <Th>
                                                Mobile
                                            </Th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-border/60">
                                        {filteredModalTickets.map(
                                            (
                                                ticket,
                                                index
                                            ) => (
                                                <tr
                                                    key={
                                                        ticket.id
                                                    }
                                                    className="hover:bg-muted/30"
                                                >
                                                    <Td>
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </Td>

                                                    <Td>
                                                        <span className="whitespace-nowrap rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                                                            {
                                                                ticket.tt_no
                                                            }
                                                        </span>
                                                    </Td>

                                                    <Td>
                                                        <div>
                                                            <p className="text-[10.5px] font-semibold text-foreground">
                                                                {
                                                                    ticket.employee_name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                                                                {
                                                                    ticket.employee_id
                                                                }
                                                            </p>
                                                        </div>
                                                    </Td>

                                                    <Td>
                                                        <div>
                                                            <p className="text-[10.5px] text-foreground">
                                                                {
                                                                    ticket.dept_name ||
                                                                    "—"
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                                                                {
                                                                    ticket.func_name ||
                                                                    ""
                                                                }
                                                            </p>
                                                        </div>
                                                    </Td>

                                                    <Td>
                                                        <span
                                                            className="block max-w-[220px] truncate text-[10.5px] text-foreground"
                                                            title={
                                                                ticket.query_type
                                                            }
                                                        >
                                                            {
                                                                ticket.query_type ||
                                                                "—"
                                                            }
                                                        </span>
                                                    </Td>

                                                    <Td>
                                                        <StatusBadge
                                                            status={
                                                                ticket.status
                                                            }
                                                        />
                                                    </Td>

                                                    <Td>
                                                        <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                                                            {formatAge(
                                                                ticket.age_seconds
                                                            )}
                                                        </span>
                                                    </Td>

                                                    <Td>
                                                        <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                                                            {
                                                                ticket.created_at ||
                                                                "—"
                                                            }
                                                        </span>
                                                    </Td>

                                                    <Td>
                                                        <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                                                            {
                                                                ticket.mobile_no ||
                                                                "—"
                                                            }
                                                        </span>
                                                    </Td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* ==================================
                            MODAL FOOTER
                        ================================== */}

                        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
                            <p className="text-[10px] text-muted-foreground">
                                {
                                    filteredModalTickets.length
                                }{" "}
                                active ticket
                                {filteredModalTickets.length !==
                                    1
                                    ? "s"
                                    : ""}
                            </p>

                            <DialogClose
                                asChild
                            >
                                <button
                                    type="button"
                                    className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                                >
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

/* ======================================================
   SMALL COMPONENTS
====================================================== */

function Stat({
    label,
    value,
}: {
    label:
    string;

    value:
    string | number;
}) {
    return (
        <div className="border-b border-border px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {value}
            </p>
        </div>
    );
}

function Th({
    children,
}: {
    children:
    React.ReactNode;
}) {
    return (
        <th className="whitespace-nowrap px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {children}
        </th>
    );
}

function Td({
    children,
}: {
    children:
    React.ReactNode;
}) {
    return (
        <td className="px-4 py-3 align-middle text-[10.5px] text-foreground">
            {children}
        </td>
    );
}

function CountBadge({
    value,
    type,
}: {
    value:
    number;

    type:
    | "neutral"
    | "open"
    | "running";
}) {
    const className =
        type ===
            "open"
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : type ===
                "running"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-slate-50 text-slate-700";

    return (
        <span
            className={`inline-flex min-w-8 items-center justify-center rounded-full border px-2 py-1 text-[10px] font-bold tabular-nums ${className}`}
        >
            {value}
        </span>
    );
}