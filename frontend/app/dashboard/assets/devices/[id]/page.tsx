"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { assetDeviceApi, type AssetDevice } from "@/lib/api";

function formatDate(value: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function statusClass(status: number) {
    const map: Record<number, string> = {
        0: "bg-orange-50 text-orange-700 border-orange-200",
        1: "bg-blue-50 text-blue-700 border-blue-200",
        2: "bg-violet-50 text-violet-700 border-violet-200",
        3: "bg-amber-50 text-amber-700 border-amber-200",
        4: "bg-emerald-50 text-emerald-700 border-emerald-200",
        5: "bg-red-50 text-red-700 border-red-200",
        7: "bg-teal-50 text-teal-700 border-teal-200",
        8: "bg-pink-50 text-pink-700 border-pink-200",
        15: "bg-cyan-50 text-cyan-700 border-cyan-200",
    };

    return map[status] ?? "bg-slate-50 text-slate-700 border-slate-200";
}

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    return (
        <div className="rounded-lg border border-border bg-background px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-foreground">
                {value === null || value === undefined || value === ""
                    ? "-"
                    : value}
            </p>
        </div>
    );
}

export default function AssetDeviceDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const id = Number(params.id);

    const [device, setDevice] = useState<AssetDevice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDevice() {
            if (!Number.isFinite(id) || id < 1) {
                setError("Invalid asset device ID.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await assetDeviceApi.get(id);
                setDevice(response.data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load asset device"
                );
            } finally {
                setLoading(false);
            }
        }

        loadDevice();
    }, [id]);

    if (loading) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                Loading asset device details...
            </div>
        );
    }

    if (error || !device) {
        return (
            <div className="space-y-3 p-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                    ← Back
                </button>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error || "Asset device not found."}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mb-3 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                        ← Back to Asset Devices
                    </button>

                    <h1 className="text-2xl font-bold text-foreground">
                        {device.device_serial || "Asset Device"}
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {[device.brand, device.model, device.category]
                            .filter(Boolean)
                            .join(" • ") || "No device information"}
                    </p>
                </div>

                <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${statusClass(
                        device.asset_status
                    )}`}
                >
                    {device.status_label}
                </span>
            </div>

            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
                    Device Information
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem label="Serial Number" value={device.device_serial} />
                    <DetailItem label="Category" value={device.category} />
                    <DetailItem label="Brand" value={device.brand} />
                    <DetailItem label="Model" value={device.model} />
                    <DetailItem label="Asset Status" value={device.status_label} />
                    <DetailItem label="MR Number" value={device.mr_number} />
                    <DetailItem label="PR Number" value={device.pr_number} />
                    <DetailItem label="Vendor" value={device.vendor_name} />
                    <DetailItem
                        label="Purchase Date"
                        value={formatDate(device.purchase_date)}
                    />
                    <DetailItem
                        label="Warranty Date"
                        value={formatDate(device.warranty_date)}
                    />
                </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
                    Current Assignment
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem label="Employee ID" value={device.emp_id} />
                    <DetailItem label="Employee Name" value={device.emp_name} />
                    <DetailItem label="Department" value={device.department} />
                    <DetailItem label="Designation" value={device.designation} />
                    <DetailItem
                        label="Assigned Date"
                        value={formatDate(device.assigned_date)}
                    />
                </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
                    Record Information
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem
                        label="Asset Device ID"
                        value={device.id}
                    />
                    <DetailItem
                        label="Vendor Master ID"
                        value={device.vendor_id}
                    />
                    <DetailItem
                        label="Created At"
                        value={formatDate(device.created_at)}
                    />
                    <DetailItem
                        label="Last Updated"
                        value={formatDate(device.updated_at)}
                    />
                </div>
            </section>
        </div>
    );
}