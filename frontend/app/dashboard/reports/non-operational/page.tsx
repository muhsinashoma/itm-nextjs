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
    // }: {
    //     label: string;
    //     value: number;
    //     description: string;
    //     href: string;
    // }) {
    //     return (
    //         <Link
    //             href={href}
    //             className="group min-h-[72px] rounded-lg border border-border bg-card px-3 py-2 transition hover:border-primary/40 hover:shadow-sm"
    //         >
    //             <div className="flex items-start justify-between gap-2">
    //                 <div className="min-w-0">
    //                     <p className="truncate text-[11px] font-semibold text-muted-foreground">
    //                         {label}
    //                     </p>

    //                     <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
    //                         {value.toLocaleString()}
    //                     </p>

    //                     <p
    //                         className="mt-0.5 truncate text-[10px] text-muted-foreground"
    //                         title={description}
    //                     >
    //                         {description}
    //                     </p>
    //                 </div>

    //                 <span className="pt-0.5 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
    //                     →
    //                 </span>
    //             </div>
    //         </Link>
    //     );
    // }


    function MiniStat({
        label,
        value,
        description,
        href,
        tone,
    }: {
        label: string;
        value: number;
        description: string;
        href: string;
        tone: "blue" | "orange" | "violet" | "teal";
    }) {
        const toneClasses = {
            blue: {
                card: "border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100/60",
                label: "text-blue-700",
                value: "text-blue-800",
                arrow: "text-blue-600",
            },

            orange: {
                card: "border-orange-200 bg-orange-50 hover:border-orange-300 hover:bg-orange-100/60",
                label: "text-orange-700",
                value: "text-orange-800",
                arrow: "text-orange-600",
            },

            violet: {
                card: "border-violet-200 bg-violet-50 hover:border-violet-300 hover:bg-violet-100/60",
                label: "text-violet-700",
                value: "text-violet-800",
                arrow: "text-violet-600",
            },

            teal: {
                card: "border-teal-200 bg-teal-50 hover:border-teal-300 hover:bg-teal-100/60",
                label: "text-teal-700",
                value: "text-teal-800",
                arrow: "text-teal-600",
            },
        };

        const style = toneClasses[tone];

        return (
            <Link
                href={href}
                className={`group min-h-[72px] rounded-lg border px-3 py-2 transition hover:shadow-sm ${style.card}`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p
                            className={`truncate text-[11px] font-semibold ${style.label}`}
                        >
                            {label}
                        </p>

                        <p
                            className={`mt-0.5 text-xl font-bold tabular-nums ${style.value}`}
                        >
                            {value.toLocaleString()}
                        </p>

                        <p
                            className="mt-0.5 truncate text-[10px] text-muted-foreground"
                            title={description}
                        >
                            {description}
                        </p>
                    </div>

                    <span
                        className={`pt-0.5 text-xs font-semibold opacity-0 transition group-hover:opacity-100 ${style.arrow}`}
                    >
                        →
                    </span>
                </div>
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
                    color="orange"
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
                    color="red"
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
                    onClick={() =>
                        router.push(
                            "/dashboard/disposal/ownership-assets"
                        )
                    }
                />

                {/* <MiniStat
                    label="Main Table"
                    value={summary.main_table_damaged}
                    description="Current registry"
                    href="/dashboard/reports/non-operational?status=damaged&detail=main_table"
                />

                <MiniStat
                    label="Damage Inventory"
                    value={summary.damage_inventory_damaged}
                    description="All damage reports"
                    href="/dashboard/reports/non-operational?status=damaged&detail=damage_inventory"
                />

                <MiniStat
                    label="Duplicates"
                    value={summary.duplicate_in_both_tables}
                    description="Already matched"
                    href="/dashboard/reports/non-operational?status=damaged&detail=duplicates"
                />

                <MiniStat
                    label="Inventory Only"
                    value={summary.damage_inventory_only}
                    description="No asset match"
                    href="/dashboard/reports/non-operational?status=damaged&detail=inventory_only"
                /> */}

                <MiniStat
                    label="Main Table"
                    value={summary.main_table_damaged}
                    description="Current registry"
                    href="/dashboard/reports/non-operational?status=damaged&detail=main_table"
                    tone="blue"
                />

                <MiniStat
                    label="Damage Inventory"
                    value={summary.damage_inventory_damaged}
                    description="All damage reports"
                    href="/dashboard/reports/non-operational?status=damaged&detail=damage_inventory"
                    tone="orange"
                />

                <MiniStat
                    label="Duplicates"
                    value={summary.duplicate_in_both_tables}
                    description="Already matched"
                    href="/dashboard/reports/non-operational?status=damaged&detail=duplicates"
                    tone="violet"
                />

                <MiniStat
                    label="Inventory Only"
                    value={summary.damage_inventory_only}
                    description="No asset match"
                    href="/dashboard/reports/non-operational?status=damaged&detail=inventory_only"
                    tone="teal"
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
    active = false,
    onClick,
}: {
    title: string;
    count: number;
    color: "red" | "orange" | "blue";
    active?: boolean;
    onClick: () => void;
}) {
    const colors = {
        red: "border-red-200 bg-red-50 text-red-700",
        orange: "border-orange-200 bg-orange-50 text-orange-700",
        blue: "border-blue-200 bg-blue-50 text-blue-700",
    };

    return (
        <button
            type="button"
            onClick={onClick}

            className={`min-h-[72px] rounded-lg border px-3 py-2 text-left transition hover:shadow-sm ${colors[color]
                } ${active ? "ring-2 ring-primary/30" : ""}`}
        >
            <p className="truncate text-[11px] font-semibold">{title}</p>

            <p className="mt-0.5 text-xl font-bold tabular-nums">
                {count.toLocaleString()}
            </p>
        </button>
    );
}

