// app/dashboard/reports/non-operational/page.tsx


"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DataTable } from "@/components/data-table";
import { assignedColumns } from "@/components/reports/assigned-columns";
import DeviceViewModal from "@/components/modals/DeviceViewModal";

import type { AssignedDevice } from "@/models/AssignedDevice";

import {
    reportApi,
    type NonOperationalDevice,
    type NonOperationalSummary,
} from "@/lib/api";

import Link from "next/link";

import {
    AlertTriangle,
    BadgeCheck,
    Boxes,
    CircleOff,
    ClipboardList,
    Copy,
    HardDrive,
    Eye,
    type LucideIcon,
} from "lucide-react";

type ReportStatus = "all" | "damaged" | "lost";

type DamageDetail =
    | "all"
    | "main_table"
    | "damage_inventory"
    | "duplicates"
    | "inventory_only";

const normalize = (value?: string | null) =>
    value?.toLowerCase().trim() || "";

function getSelectedStatus(value: string | null): ReportStatus {
    const normalized = normalize(value);

    if (normalized === "damaged") return "damaged";
    if (normalized === "lost") return "lost";

    return "all";
}

/*
 * AssignedDevice.status is a strict DeviceStatus type.
 * Backend sends normal string labels, so convert safely here.
 */
function toDeviceStatus(statusLabel: string): AssignedDevice["status"] {
    const normalized = normalize(statusLabel);

    switch (normalized) {
        case "lost":
            return "Lost" as AssignedDevice["status"];

        case "ownership":
        case "ownership transfer":
            return "Ownership Transfer" as AssignedDevice["status"];

        case "damaged":
        default:
            return "Damaged" as AssignedDevice["status"];
    }
}

function toAssignedDevice(
    item: NonOperationalDevice,
    index: number
): AssignedDevice {
    const referencePrefix =
        item.source === "damage_inventory" ? "Damage" : "Asset";

    return {
        id: item.id,

        sl: index + 1,

        referenceNumber:
            item.mr_number ||
            item.pr_number ||
            item.device_serial ||
            `${referencePrefix}-${item.source_id}`,

        mrnNumber: item.mr_number || "",
        prNumber: item.pr_number || "",


        employeeId: item.emp_id || "—",

        employeeName:
            item.emp_name ||
            (item.source === "damage_inventory"
                ? "No user assignment data"
                : "Unassigned"),

        designation: item.designation || "—",
        department: item.department || "—",

        category: item.category || "",
        deviceSl: item.device_serial || "",
        model: item.model || "",
        brand: item.brand || "",

        status: toDeviceStatus(item.status_label),

        userUsageDuration: "",
        warranty: item.warranty_date || "",
        vendor: "",
        assignedBy: "",
        assignedDate: item.assigned_date || "",

        deviceType: "",
        deviceAge: "",
        purchaseDate: item.purchase_date || "",

        remarks: item.remarks || "",
        avatarUrl: "",
        condition: "",
    };
}

export default function NonOperationalPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const selectedStatus = getSelectedStatus(searchParams.get("status"));

    const rawDetail = searchParams.get("detail") || "all";

    const selectedDetail: DamageDetail =
        rawDetail === "main_table" ||
            rawDetail === "damage_inventory" ||
            rawDetail === "duplicates" ||
            rawDetail === "inventory_only"
            ? rawDetail
            : "all";

    const [data, setData] = useState<AssignedDevice[]>([]);

    const [summary, setSummary] =
        useState<NonOperationalSummary>({
            ownership: 0,
            damaged: 0,
            lost: 0,
            total_non_operational: 0,

            main_table_damaged: 0,
            damage_inventory_damaged: 0,
            duplicate_in_both_tables: 0,
            damage_inventory_only: 0,
        });



    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [viewDevice, setViewDevice] =
        useState<AssignedDevice | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                const [listResponse, summaryResponse] =
                    await Promise.all([
                        reportApi.nonOperational({
                            status: selectedStatus,
                            detail: selectedDetail,
                        }),
                        reportApi.nonOperationalSummary(),
                    ]);

                const rows = listResponse.data ?? [];

                setData(
                    rows.map((item, index) =>
                        toAssignedDevice(item, index)
                    )
                );

                setSummary(summaryResponse.data);
            } catch (err) {
                console.error(
                    "[non-operational-report] failed:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load data"
                );
            } finally {
                setLoading(false);
            }
        }

        loadData();
        //}, [selectedStatus]);
    }, [selectedStatus, selectedDetail]);






    // function MiniStat({
    //     label,
    //     value,
    //     description,
    //     href,
    //     tone,
    // }: {
    //     label: string;
    //     value: number;
    //     description: string;
    //     href: string;
    //     tone: "indigo" | "amber" | "violet" | "emerald";
    // }) {
    //     const toneClasses = {
    //         indigo: {
    //             card: "border-indigo-200 bg-indigo-50 hover:border-indigo-300 hover:bg-indigo-100/70",
    //             label: "text-indigo-700",
    //             value: "text-indigo-900",
    //             arrow: "text-indigo-600",
    //         },

    //         amber: {
    //             card: "border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100/70",
    //             label: "text-amber-700",
    //             value: "text-amber-900",
    //             arrow: "text-amber-600",
    //         },

    //         violet: {
    //             card: "border-violet-200 bg-violet-50 hover:border-violet-300 hover:bg-violet-100/70",
    //             label: "text-violet-700",
    //             value: "text-violet-900",
    //             arrow: "text-violet-600",
    //         },

    //         emerald: {
    //             card: "border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100/70",
    //             label: "text-emerald-700",
    //             value: "text-emerald-900",
    //             arrow: "text-emerald-600",
    //         },
    //     };

    //     const style = toneClasses[tone];

    //     return (
    //         <Link
    //             href={href}
    //             className={`group min-h-[72px] rounded-lg border px-3 py-2 transition hover:shadow-sm ${style.card}`}
    //         >
    //             <div className="flex items-start justify-between gap-2">
    //                 <div className="min-w-0">
    //                     <p
    //                         className={`truncate text-[11px] font-semibold ${style.label}`}
    //                     >
    //                         {label}
    //                     </p>

    //                     <p
    //                         className={`mt-0.5 text-xl font-bold tabular-nums ${style.value}`}
    //                     >
    //                         {value.toLocaleString()}
    //                     </p>

    //                     <p
    //                         className="mt-0.5 truncate text-[10px] text-muted-foreground"
    //                         title={description}
    //                     >
    //                         {description}
    //                     </p>
    //                 </div>

    //                 <span
    //                     className={`pt-0.5 text-xs font-semibold opacity-0 transition group-hover:opacity-100 ${style.arrow}`}
    //                 >
    //                     →
    //                 </span>
    //             </div>
    //         </Link>
    //     );
    // }

    // function MiniStat({
    //     label,
    //     value,
    //     description,
    //     href,
    //     tone,
    //     icon: Icon,
    // }: {
    //     label: string;
    //     value: number;
    //     description: string;
    //     href: string;
    //     tone: "indigo" | "amber" | "violet" | "emerald";
    //     icon: LucideIcon;
    // }) {
    //     const toneClasses = {
    //         indigo: {
    //             card: "border-indigo-200 bg-indigo-50 hover:border-indigo-300 hover:bg-indigo-100/70",
    //             label: "text-indigo-700",
    //             value: "text-indigo-900",
    //             icon: "bg-indigo-100 text-indigo-700",
    //             arrow: "text-indigo-600",
    //         },

    //         amber: {
    //             card: "border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100/70",
    //             label: "text-amber-700",
    //             value: "text-amber-900",
    //             icon: "bg-amber-100 text-amber-700",
    //             arrow: "text-amber-600",
    //         },

    //         violet: {
    //             card: "border-violet-200 bg-violet-50 hover:border-violet-300 hover:bg-violet-100/70",
    //             label: "text-violet-700",
    //             value: "text-violet-900",
    //             icon: "bg-violet-100 text-violet-700",
    //             arrow: "text-violet-600",
    //         },

    //         emerald: {
    //             card: "border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100/70",
    //             label: "text-emerald-700",
    //             value: "text-emerald-900",
    //             icon: "bg-emerald-100 text-emerald-700",
    //             arrow: "text-emerald-600",
    //         },
    //     };

    //     const style = toneClasses[tone];

    //     return (
    //         <Link
    //             href={href}
    //             className={`group min-h-[76px] rounded-lg border px-3 py-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${style.card}`}
    //         >
    //             <div className="flex items-start justify-between gap-2">
    //                 <div className="min-w-0">
    //                     <p
    //                         className={`truncate text-[11px] font-semibold ${style.label}`}
    //                         title={label}
    //                     >
    //                         {label}
    //                     </p>

    //                     <p
    //                         className={`mt-0.5 text-xl font-bold tabular-nums ${style.value}`}
    //                     >
    //                         {value.toLocaleString()}
    //                     </p>

    //                     <p
    //                         className="mt-0.5 truncate text-[10px] text-muted-foreground"
    //                         title={description}
    //                     >
    //                         {description}
    //                     </p>
    //                 </div>

    //                 <div
    //                     className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${style.icon}`}
    //                 >
    //                     <Icon className="h-4 w-4" strokeWidth={2.2} />
    //                 </div>
    //             </div>

    //             <span
    //                 className={`mt-1 block text-[10px] font-semibold opacity-0 transition group-hover:opacity-100 ${style.arrow}`}
    //             >
    //                 View details →
    //             </span>
    //         </Link>
    //     );
    // }

    function MiniStat({
        label,
        value,
        href,
        tone,
        icon: Icon,
    }: {
        label: string;
        value: number;
        href: string;
        tone: "indigo" | "amber" | "violet" | "emerald";
        icon: LucideIcon;
    }) {
        const toneClasses = {
            indigo: {
                card: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100/70",
                iconBox: "bg-white/80 text-indigo-600",
                action: "text-indigo-600",
            },

            amber: {
                card: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100/70",
                iconBox: "bg-white/80 text-amber-600",
                action: "text-amber-600",
            },

            violet: {
                card: "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100/70",
                iconBox: "bg-white/80 text-violet-600",
                action: "text-violet-600",
            },

            emerald: {
                card: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100/70",
                iconBox: "bg-white/80 text-emerald-600",
                action: "text-emerald-600",
            },
        };

        const style = toneClasses[tone];

        return (
            <Link
                href={href}
                className={`group min-h-[76px] rounded-lg border px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${style.card}`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold">
                            {label}
                        </p>

                        <p className="mt-0.5 text-xl font-bold tabular-nums">
                            {value.toLocaleString()}
                        </p>
                    </div>

                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${style.iconBox}`}
                    >
                        <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </div>
                </div>

                <span
                    className={`mt-1 flex items-center gap-1 text-[10px] font-medium opacity-80 transition group-hover:opacity-100 ${style.action}`}
                >
                    <Eye className="h-3 w-3" strokeWidth={2.2} />
                    View records
                    <span>→</span>
                </span>
            </Link>
        );
    }
    const columns = useMemo(
        () =>
            assignedColumns({
                onView: (device) => {
                    // Open modal for every row:
                    // asset_devices + damage_inventory rows.
                    setViewDevice(device);
                },

                onAssign: () => { },
            }),
        []
    );

    const title =
        selectedStatus === "damaged"
            ? "Damaged Devices"
            : selectedStatus === "lost"
                ? "Lost Devices"
                : "Non-Operational Devices";

    if (loading) {
        return (
            <div className="space-y-3 p-4">
                {[...Array(6)].map((_, index) => (
                    <div
                        key={index}
                        className="skeleton h-10 w-full rounded-lg"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <p className="font-medium text-red-600">
                    Unable to load data
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                    {error}
                </p>
            </div>
        );
    }

    return (

        <div className="space-y-3 p-4">

            <div>
                <h1 className="text-lg font-semibold text-foreground">
                    {title}
                </h1>

                <p className="mt-0.5 text-xs text-muted-foreground">
                    Damaged devices combine main registry records and non-duplicate damage inventory records.
                </p>
            </div>




            {/* Compact summary and damaged breakdown cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
                <StatusCard
                    title="Damaged"
                    count={summary.damaged}
                    color="red"
                    icon={AlertTriangle}
                    active={selectedStatus === "damaged" && selectedDetail === "all"}
                    onClick={() =>
                        router.push(
                            "/dashboard/reports/non-operational?status=damaged"
                        )
                    }
                />

                <StatusCard
                    title="Lost"
                    count={summary.lost}
                    color="rose"
                    icon={CircleOff}
                    active={selectedStatus === "lost"}
                    onClick={() =>
                        router.push(
                            "/dashboard/reports/non-operational?status=lost"
                        )
                    }
                />

                <StatusCard
                    title="Ownership"
                    count={summary.ownership}
                    color="blue"
                    icon={BadgeCheck}
                    onClick={() =>
                        router.push(
                            "/dashboard/disposal/ownership-assets"
                        )
                    }
                />

                <MiniStat
                    label="Registered Damaged Assets"
                    value={summary.main_table_damaged}
                    href="/dashboard/reports/non-operational?status=damaged&detail=main_table"
                    tone="indigo"
                    icon={HardDrive}
                />

                <MiniStat
                    label="Damage Inventory"
                    value={summary.damage_inventory_damaged}
                    href="/dashboard/reports/non-operational?status=damaged&detail=damage_inventory"
                    tone="amber"
                    icon={ClipboardList}
                />

                <MiniStat
                    label="Duplicates"
                    value={summary.duplicate_in_both_tables}
                    href="/dashboard/reports/non-operational?status=damaged&detail=duplicates"
                    tone="violet"
                    icon={Copy}
                />

                <MiniStat
                    label="Inventory Only"
                    value={summary.damage_inventory_only}
                    href="/dashboard/reports/non-operational?status=damaged&detail=inventory_only"
                    tone="emerald"
                    icon={Boxes}
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {data.length.toLocaleString()} Records
                        </p>

                        <p className="text-xs text-muted-foreground">
                            {selectedStatus === "all"
                                ? "Damaged and lost devices"
                                : `${title} list`}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/dashboard/reports/non-operational"
                            )
                        }
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        Show all
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <DataTable columns={columns} data={data} />
                </div>
            </div>

            <DeviceViewModal
                open={!!viewDevice}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewDevice(null);
                    }
                }}
                device={viewDevice}
            />
        </div>
    );
}

function StatusCard({
    title,
    count,
    color,
    icon: Icon,
    active = false,
    onClick,
}: {
    title: string;
    count: number;
    color: "red" | "rose" | "blue";
    icon: LucideIcon;
    active?: boolean;
    onClick: () => void;
}) {
    const colors = {
        red: "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100/70",
        rose: "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100/70",
        blue: "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100/70",
    };

    // return (
    //     <button
    //         type="button"
    //         onClick={onClick}

    //         className={`min-h-[72px] rounded-lg border px-3 py-2 text-left transition hover:shadow-sm ${colors[color]
    //             } ${active ? "ring-2 ring-primary/30" : ""}`}
    //     >
    //         <p className="truncate text-[11px] font-semibold">{title}</p>

    //         <p className="mt-0.5 text-xl font-bold tabular-nums">
    //             {count.toLocaleString()}
    //         </p>
    //     </button>
    // );

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group min-h-[76px] rounded-lg border px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${colors[color]} ${active ? "ring-2 ring-primary/30" : ""
                }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold">
                        {title}
                    </p>

                    <p className="mt-0.5 text-xl font-bold tabular-nums">
                        {count.toLocaleString()}
                    </p>
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/70">
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                </div>
            </div>

            <p className="mt-1 text-[10px] opacity-75">
                View records →
            </p>
        </button>
    );
}

