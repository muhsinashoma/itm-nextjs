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

type ReportStatus = "all" | "damaged" | "lost";

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
        referenceNumber: `${referencePrefix}-${item.source_id}`,

        mrnNumber: item.mr_number || "",
        prNumber: item.pr_number || "",

        employeeId: item.emp_id || "",
        employeeName: item.emp_name || "—",

        designation: item.designation || "",
        department: item.department || "",

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

    const selectedStatus = getSelectedStatus(
        searchParams.get("status")
    );

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
    }, [selectedStatus]);

    const columns = useMemo(
        () =>
            assignedColumns({
                onView: (device) => {
                    const deviceId = Number(device.id);

                    /*
                     * Negative IDs are damage_inventory-only records.
                     * They do not have a real asset_devices detail page.
                     */
                    if (
                        Number.isFinite(deviceId) &&
                        deviceId > 0
                    ) {
                        setViewDevice(device);
                    }
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
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-xl font-semibold text-foreground">
                    {title}
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    Damaged devices combine main registry records and
                    non-duplicate damage inventory records.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatusCard
                    title="Damaged"
                    count={summary.damaged}
                    color="orange"
                    active={selectedStatus === "damaged"}
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
            </div>

            {/* Optional reconciliation information */}
            {selectedStatus === "damaged" && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <MiniStat
                        label="Main Table Damaged"
                        value={summary.main_table_damaged}
                    />

                    <MiniStat
                        label="Damage Inventory"
                        value={summary.damage_inventory_damaged}
                    />

                    <MiniStat
                        label="Duplicate Devices"
                        value={summary.duplicate_in_both_tables}
                    />

                    <MiniStat
                        label="Inventory Only"
                        value={summary.damage_inventory_only}
                    />
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
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
            className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${colors[color]
                } ${active ? "ring-2 ring-primary/30" : ""}`}
        >
            <p className="text-sm font-medium">{title}</p>

            <p className="mt-1 text-2xl font-bold tabular-nums">
                {count.toLocaleString()}
            </p>
        </button>
    );
}

function MiniStat({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>

            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {value.toLocaleString()}
            </p>
        </div>
    );
}