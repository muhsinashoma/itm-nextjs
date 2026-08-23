// // frontend/components/ui/user-right-sidebar.tsx
// "use client";

// import {
//     useCallback,
//     useEffect,
//     useState,
// } from "react";

// import Link from "next/link";

// import {
//     AlertCircle,
//     ArrowRight,
//     CheckCircle2,
//     Clock3,
//     Loader2,
//     MonitorSmartphone,
//     Network,
//     RefreshCw,
//     Ticket,
//     Users,
// } from "lucide-react";

// import {
//     downstreamApi,
//     type DownstreamSummaryData,
// } from "@/lib/api";

// export function UserRightSidebar() {
//     const [
//         data,
//         setData,
//     ] =
//         useState<
//             DownstreamSummaryData | null
//         >(
//             null
//         );

//     const [
//         loading,
//         setLoading,
//     ] =
//         useState(
//             true
//         );

//     const [
//         error,
//         setError,
//     ] =
//         useState(
//             ""
//         );

//     const loadSummary =
//         useCallback(
//             async () => {
//                 try {
//                     setLoading(
//                         true
//                     );

//                     setError(
//                         ""
//                     );

//                     const response =
//                         await downstreamApi.summary();

//                     setData(
//                         response.data
//                     );
//                 } catch (
//                 reason
//                 ) {
//                     setData(
//                         null
//                     );

//                     setError(
//                         reason instanceof
//                             Error
//                             ? reason.message
//                             : "Unable to load downstream information."
//                     );
//                 } finally {
//                     setLoading(
//                         false
//                     );
//                 }
//             },
//             []
//         );

//     useEffect(
//         () => {
//             void loadSummary();
//         },
//         [
//             loadSummary,
//         ]
//     );

//     if (
//         loading
//     ) {
//         return (
//             <aside className="flex h-full w-full items-center justify-center bg-card">
//                 <div className="flex flex-col items-center gap-2 text-muted-foreground">
//                     <Loader2 className="h-5 w-5 animate-spin" />

//                     <span className="text-xs">
//                         Loading downstream...
//                     </span>
//                 </div>
//             </aside>
//         );
//     }

//     if (
//         error ||
//         !data
//     ) {
//         return (
//             <aside className="h-full w-full overflow-y-auto bg-card p-3">
//                 <div className="rounded-xl border border-red-100 bg-red-50 p-4">
//                     <AlertCircle className="h-5 w-5 text-red-600" />

//                     <p className="mt-2 text-xs font-semibold text-red-800">
//                         Downstream data unavailable
//                     </p>

//                     <p className="mt-1 text-[11px] text-red-600">
//                         {error}
//                     </p>

//                     <button
//                         type="button"
//                         onClick={() =>
//                             void loadSummary()
//                         }
//                         className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-700"
//                     >
//                         <RefreshCw className="h-3.5 w-3.5" />

//                         Retry
//                     </button>
//                 </div>
//             </aside>
//         );
//     }

//     const {
//         employees,
//         devices,
//         tickets,
//     } =
//         data;

//     const closedPercent =
//         tickets.total >
//             0
//             ? Math.round(
//                 (
//                     tickets.closed /
//                     tickets.total
//                 ) *
//                 100
//             )
//             : 0;

//     const runningPercent =
//         tickets.total >
//             0
//             ? Math.round(
//                 (
//                     tickets.running /
//                     tickets.total
//                 ) *
//                 100
//             )
//             : 0;

//     const openPercent =
//         tickets.total >
//             0
//             ? Math.round(
//                 (
//                     tickets.open /
//                     tickets.total
//                 ) *
//                 100
//             )
//             : 0;

//     return (
//         <aside className="flex h-full w-full flex-col bg-card">
//             {/* HEADER */}

//             <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
//                 <div>
//                     <p className="text-xs font-semibold text-foreground">
//                         Downstream Overview
//                     </p>

//                     <p className="mt-0.5 text-[10px] text-muted-foreground">
//                         Team, devices & TT
//                     </p>
//                 </div>

//                 <button
//                     type="button"
//                     onClick={() =>
//                         void loadSummary()
//                     }
//                     className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
//                     aria-label="Refresh downstream summary"
//                 >
//                     <RefreshCw className="h-3.5 w-3.5" />
//                 </button>
//             </div>

//             <div className="flex-1 space-y-3 overflow-y-auto p-3">
//                 {/* PEOPLE */}

//                 <section className="rounded-xl border border-border bg-background p-3 shadow-sm">
//                     <div className="mb-3 flex items-center gap-2">
//                         <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
//                             <Users className="h-4 w-4" />
//                         </div>

//                         <div>
//                             <h3 className="text-xs font-semibold text-foreground">
//                                 Downstream Employees
//                             </h3>

//                             <p className="text-[10px] text-muted-foreground">
//                                 Reporting hierarchy
//                             </p>
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-2">
//                         <MiniMetric
//                             label="Direct"
//                             value={
//                                 employees.direct_employees
//                             }
//                         />

//                         <MiniMetric
//                             label="All Downstream"
//                             value={
//                                 employees.all_employees
//                             }
//                         />
//                     </div>

//                     <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
//                         <Network className="h-3.5 w-3.5 text-muted-foreground" />

//                         <span className="text-[10px] text-muted-foreground">
//                             {
//                                 employees.all_employees.toLocaleString()
//                             }{" "}
//                             employees in hierarchy
//                         </span>
//                     </div>
//                 </section>

//                 {/* DEVICES */}

//                 <section className="rounded-xl border border-border bg-background p-3 shadow-sm">
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-2">
//                             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
//                                 <MonitorSmartphone className="h-4 w-4" />
//                             </div>

//                             <div>
//                                 <h3 className="text-xs font-semibold text-foreground">
//                                     Downstream Devices
//                                 </h3>

//                                 <p className="text-[10px] text-muted-foreground">
//                                     Currently assigned
//                                 </p>
//                             </div>
//                         </div>

//                         <span className="rounded-lg bg-violet-50 px-2 py-1 text-sm font-bold text-violet-700">
//                             {devices.assigned_devices.toLocaleString()}
//                         </span>
//                     </div>

//                     <Link
//                         href="/dashboard/user/downstream-device"
//                         className="mt-3 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[11px] font-medium text-foreground transition hover:bg-muted"
//                     >
//                         View downstream devices

//                         <ArrowRight className="h-3.5 w-3.5" />
//                     </Link>
//                 </section>

//                 {/* TT SUMMARY */}

//                 <section className="rounded-xl border border-border bg-background p-3 shadow-sm">
//                     <div className="mb-3 flex items-center justify-between">
//                         <div className="flex items-center gap-2">
//                             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
//                                 <Ticket className="h-4 w-4" />
//                             </div>

//                             <div>
//                                 <h3 className="text-xs font-semibold text-foreground">
//                                     Downstream TT
//                                 </h3>

//                                 <p className="text-[10px] text-muted-foreground">
//                                     Trouble Ticket summary
//                                 </p>
//                             </div>
//                         </div>

//                         <span className="text-lg font-bold text-foreground">
//                             {tickets.total.toLocaleString()}
//                         </span>
//                     </div>

//                     <div className="space-y-2">
//                         <TicketMetric
//                             icon={
//                                 <AlertCircle className="h-3.5 w-3.5" />
//                             }
//                             label="Open"
//                             value={
//                                 tickets.open
//                             }
//                             percent={
//                                 openPercent
//                             }
//                         />

//                         <TicketMetric
//                             icon={
//                                 <Clock3 className="h-3.5 w-3.5" />
//                             }
//                             label="Running"
//                             value={
//                                 tickets.running
//                             }
//                             percent={
//                                 runningPercent
//                             }
//                         />

//                         <TicketMetric
//                             icon={
//                                 <CheckCircle2 className="h-3.5 w-3.5" />
//                             }
//                             label="Closed"
//                             value={
//                                 tickets.closed
//                             }
//                             percent={
//                                 closedPercent
//                             }
//                         />
//                     </div>
//                 </section>

//                 {/* HEALTH */}

//                 <section className="rounded-xl border border-border bg-muted/30 p-3">
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
//                                 TT Closure Rate
//                             </p>

//                             <p className="mt-1 text-xl font-bold text-foreground">
//                                 {
//                                     closedPercent
//                                 }
//                                 %
//                             </p>
//                         </div>

//                         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
//                             <CheckCircle2 className="h-5 w-5" />
//                         </div>
//                     </div>

//                     <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
//                         <div
//                             className="h-full rounded-full bg-emerald-500 transition-all"
//                             style={{
//                                 width: `${Math.min(
//                                     100,
//                                     closedPercent
//                                 )}%`,
//                             }}
//                         />
//                     </div>
//                 </section>
//             </div>
//         </aside>
//     );
// }

// function MiniMetric({
//     label,
//     value,
// }: {
//     label: string;
//     value: number;
// }) {
//     return (
//         <div className="rounded-lg bg-muted/50 p-2.5">
//             <p className="text-[10px] text-muted-foreground">
//                 {label}
//             </p>

//             <p className="mt-1 text-lg font-bold text-foreground">
//                 {value.toLocaleString()}
//             </p>
//         </div>
//     );
// }

// function TicketMetric({
//     icon,
//     label,
//     value,
//     percent,
// }: {
//     icon: React.ReactNode;
//     label: string;
//     value: number;
//     percent: number;
// }) {
//     return (
//         <div className="rounded-lg bg-muted/40 px-3 py-2">
//             <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2 text-muted-foreground">
//                     {icon}

//                     <span className="text-[11px]">
//                         {label}
//                     </span>
//                 </div>

//                 <div className="text-right">
//                     <span className="text-xs font-semibold text-foreground">
//                         {value.toLocaleString()}
//                     </span>

//                     <span className="ml-1 text-[9px] text-muted-foreground">
//                         {percent}%
//                     </span>
//                 </div>
//             </div>
//         </div>
//     );
// }



// frontend/components/ui/user-right-sidebar.tsx
"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock3,
    Loader2,
    MonitorSmartphone,
    Network,
    RefreshCw,
    Ticket,
    Users,
} from "lucide-react";

import {
    downstreamApi,
    type DownstreamSummaryData,
} from "@/lib/api";

export function UserRightSidebar() {
    const [
        data,
        setData,
    ] =
        useState<
            DownstreamSummaryData | null
        >(
            null
        );

    const [
        loading,
        setLoading,
    ] =
        useState(
            true
        );

    const [
        error,
        setError,
    ] =
        useState(
            ""
        );

    const loadSummary =
        useCallback(
            async () => {
                try {
                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );

                    const response =
                        await downstreamApi.summary();

                    setData(
                        response.data
                    );
                } catch (
                reason
                ) {
                    setData(
                        null
                    );

                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load downstream information."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            []
        );

    useEffect(
        () => {
            void loadSummary();
        },
        [
            loadSummary,
        ]
    );

    if (
        loading
    ) {
        return (
            <aside className="flex h-full w-full items-center justify-center bg-card">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />

                    <span className="text-xs">
                        Loading downstream...
                    </span>
                </div>
            </aside>
        );
    }

    if (
        error ||
        !data
    ) {
        return (
            <aside className="h-full w-full overflow-y-auto bg-card p-3">
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <AlertCircle className="h-5 w-5 text-red-600" />

                    <p className="mt-2 text-xs font-semibold text-red-800">
                        Downstream data unavailable
                    </p>

                    <p className="mt-1 text-[11px] text-red-600">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            void loadSummary()
                        }
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-700"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />

                        Retry
                    </button>
                </div>
            </aside>
        );
    }

    const {
        employees,
        devices,
        tickets,
    } =
        data;

    const closedPercent =
        tickets.total >
            0
            ? Math.round(
                (
                    tickets.closed /
                    tickets.total
                ) *
                100
            )
            : 0;

    const runningPercent =
        tickets.total >
            0
            ? Math.round(
                (
                    tickets.running /
                    tickets.total
                ) *
                100
            )
            : 0;

    const openPercent =
        tickets.total >
            0
            ? Math.round(
                (
                    tickets.open /
                    tickets.total
                ) *
                100
            )
            : 0;

    return (
        <aside className="flex h-full w-full flex-col bg-card">
            {/* HEADER */}

            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                <div>
                    <p className="text-xs font-semibold text-foreground">
                        Downstream Overview
                    </p>

                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Team, devices & TT
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        void loadSummary()
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Refresh downstream summary"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {/* PEOPLE */}

                <section className="rounded-xl border border-border bg-background p-3 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Users className="h-4 w-4" />
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-foreground">
                                Downstream Employees
                            </h3>

                            <p className="text-[10px] text-muted-foreground">
                                Reporting hierarchy
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <MiniMetric
                            label="Direct"
                            value={
                                employees.direct_employees
                            }
                            href="/dashboard/user/downstream-employee?scope=direct&page=1"
                        />

                        <MiniMetric
                            label="Indirect"
                            value={
                                Math.max(
                                    0,
                                    employees.all_employees -
                                    employees.direct_employees
                                )
                            }
                            href="/dashboard/user/downstream-employee?scope=indirect&page=1"
                        />
                    </div>

                    <Link
                        href="/dashboard/user/downstream-employee?scope=all&page=1"
                        className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 transition hover:bg-muted"
                    >
                        <div className="flex items-center gap-2">
                            <Network className="h-3.5 w-3.5 text-muted-foreground" />

                            <span className="text-[10px] text-muted-foreground">
                                {
                                    employees.all_employees.toLocaleString()
                                }{" "}
                                active employees in hierarchy
                            </span>
                        </div>

                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                </section>

                {/* DEVICES */}

                <section className="rounded-xl border border-border bg-background p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                                <MonitorSmartphone className="h-4 w-4" />
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold text-foreground">
                                    Downstream Devices
                                </h3>

                                <p className="text-[10px] text-muted-foreground">
                                    Currently assigned
                                </p>
                            </div>
                        </div>

                        <span className="rounded-lg bg-violet-50 px-2 py-1 text-sm font-bold text-violet-700">
                            {devices.assigned_devices.toLocaleString()}
                        </span>
                    </div>

                    <Link
                        href="/dashboard/user/downstream-device"
                        className="mt-3 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[11px] font-medium text-foreground transition hover:bg-muted"
                    >
                        View downstream devices

                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </section>

                {/* TT SUMMARY */}

                <section className="rounded-xl border border-border bg-background p-3 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                <Ticket className="h-4 w-4" />
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold text-foreground">
                                    Downstream TT
                                </h3>

                                <p className="text-[10px] text-muted-foreground">
                                    Trouble Ticket summary
                                </p>
                            </div>
                        </div>

                        <span className="text-lg font-bold text-foreground">
                            {tickets.total.toLocaleString()}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <TicketMetric
                            icon={
                                <AlertCircle className="h-3.5 w-3.5" />
                            }
                            label="Open"
                            value={
                                tickets.open
                            }
                            percent={
                                openPercent
                            }
                        />

                        <TicketMetric
                            icon={
                                <Clock3 className="h-3.5 w-3.5" />
                            }
                            label="Running"
                            value={
                                tickets.running
                            }
                            percent={
                                runningPercent
                            }
                        />

                        <TicketMetric
                            icon={
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            }
                            label="Closed"
                            value={
                                tickets.closed
                            }
                            percent={
                                closedPercent
                            }
                        />
                    </div>
                </section>

                {/* HEALTH */}

                <section className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                TT Closure Rate
                            </p>

                            <p className="mt-1 text-xl font-bold text-foreground">
                                {
                                    closedPercent
                                }
                                %
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{
                                width: `${Math.min(
                                    100,
                                    closedPercent
                                )}%`,
                            }}
                        />
                    </div>
                </section>
            </div>
        </aside>
    );
}

function MiniMetric({
    label,
    value,
    href,
}: {
    label: string;
    value: number;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="group rounded-lg border border-transparent bg-muted/50 p-2.5 transition hover:border-primary/20 hover:bg-primary/5"
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-[10px] text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-1 text-lg font-bold text-foreground">
                        {value.toLocaleString()}
                    </p>
                </div>

                <ArrowRight className="mt-0.5 h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </div>
        </Link>
    );
}

function TicketMetric({
    icon,
    label,
    value,
    percent,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    percent: number;
}) {
    return (
        <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                    {icon}

                    <span className="text-[11px]">
                        {label}
                    </span>
                </div>

                <div className="text-right">
                    <span className="text-xs font-semibold text-foreground">
                        {value.toLocaleString()}
                    </span>

                    <span className="ml-1 text-[9px] text-muted-foreground">
                        {percent}%
                    </span>
                </div>
            </div>
        </div>
    );
}