"use client";

import {
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CheckCircle2,
    LoaderCircle,
    Search,
    ShieldCheck,
    UserPlus,
    X,
} from "lucide-react";

import {
    useSearchParams,
} from "next/navigation";

import {
    DataTable,
} from "@/components/data-table";

import {
    assignedColumns,
} from "@/components/reports/assigned-columns";

import {
    Button,
} from "@/components/ui/button";

import DeviceViewModal from "@/components/modals/DeviceViewModal";

import {
    type AssignedDevice,
} from "@/models/AssignedDevice";

import {
    inventoryWorkflowApi,
    reportApi,
    type AllocatableRequisition,
} from "@/lib/api";

function normalizeAssetStatus(
    value?: string
): AssignedDevice["status"] {
    const raw = String(
        value || ""
    )
        .toLowerCase()
        .trim();

    const map: Record<
        string,
        AssignedDevice["status"]
    > = {
        "1": "Assigned",
        "4": "Returned",
        "3": "Transferred",
        assigned: "Assigned",
        returned: "Returned",
        transfer: "Transferred",
        transferred: "Transferred",
        available: "Available",
        damaged: "Damaged",
        lost: "Lost",
    };

    return (
        map[raw] ??
        (value as AssignedDevice["status"]) ??
        "Unknown"
    );
}

function RequisitionAllocationModal({
    asset,
    onClose,
    onDone,
}: {
    asset: AssignedDevice | null;
    onClose: () => void;
    onDone: (message: string) => void;
}) {
    const [rows, setRows] =
        useState<AllocatableRequisition[]>([]);

    const [search, setSearch] =
        useState("");

    const deferredSearch =
        useDeferredValue(search);

    const [selectedID, setSelectedID] =
        useState<number | null>(null);

    const [remarks, setRemarks] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!asset) {
            setRows([]);
            setSearch("");
            setSelectedID(null);
            setRemarks("");
            setError("");
            return;
        }

        let mounted = true;

        async function load() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await inventoryWorkflowApi
                        .allocatableRequisitions({
                            category:
                                asset.category,
                            search:
                                deferredSearch
                                    .trim() ||
                                undefined,
                        });

                if (!mounted) return;

                setRows(
                    response.data ?? []
                );
            } catch (reason) {
                if (!mounted) return;

                setRows([]);
                setError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load approved requisitions"
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            mounted = false;
        };
    }, [
        asset,
        deferredSearch,
    ]);

    if (!asset) return null;

    const stockID =
        Number(
            asset.id ??
                asset.referenceNumber
        );

    async function assign() {
        if (
            !selectedID ||
            !Number.isFinite(stockID) ||
            stockID < 1
        ) {
            setError(
                "Select an approved requisition first."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            const response =
                await inventoryWorkflowApi
                    .assignToRequisition(
                        selectedID,
                        stockID,
                        remarks
                    );

            onDone(
                `${response.data.device_serial} assigned to ${response.data.employee_name || response.data.employee_id}.`
            );
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to assign asset"
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
                            <UserPlus className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                Allocate Stock to Approved Requisition
                            </h2>
                            <p className="mt-1 text-[9px] text-muted-foreground">
                                Select the approved request that will receive this exact serial / asset tag.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid border-b border-border bg-muted/20 sm:grid-cols-4">
                    {[
                        ["Stock Ref", asset.referenceNumber],
                        ["Serial / Tag", asset.deviceSl],
                        ["Category", asset.category],
                        ["Model", asset.model],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="border-b border-border px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                        >
                            <p className="text-[7px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {label}
                            </p>
                            <p className="mt-1 truncate text-[9px] font-semibold text-foreground" title={value}>
                                {value || "—"}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-border px-3">
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search TT, employee ID or employee name..."
                            className="h-9 w-full bg-transparent text-[9px] outline-none"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex min-h-[180px] items-center justify-center text-[9px] text-muted-foreground">
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Loading approved requisitions...
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
                            <ShieldCheck className="mb-2 h-6 w-6 text-muted-foreground/50" />
                            <p className="text-[10px] font-semibold text-foreground">
                                No approved unallocated requisition
                            </p>
                            <p className="mt-1 max-w-md text-[9px] leading-5 text-muted-foreground">
                                Approval must be completed and the requested category must match this stock item.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {rows.map((row) => {
                                const selected =
                                    row.id ===
                                    selectedID;

                                return (
                                    <button
                                        key={row.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedID(
                                                row.id
                                            )
                                        }
                                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                                            selected
                                                ? "border-primary bg-primary/[0.04] ring-2 ring-primary/10"
                                                : "border-border hover:border-primary/30 hover:bg-muted/20"
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] font-semibold text-primary">
                                                    TT {row.tt_no}
                                                </p>
                                                <p className="mt-1 text-[9px] font-semibold text-foreground">
                                                    {row.employee_name ||
                                                        "—"}{" "}
                                                    <span className="font-mono text-muted-foreground">
                                                        ({row.employee_id})
                                                    </span>
                                                </p>
                                            </div>

                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[7px] font-semibold text-emerald-700">
                                                Approved
                                            </span>
                                        </div>

                                        <p className="mt-2 line-clamp-2 text-[8px] leading-4 text-muted-foreground">
                                            {row.reason_details ||
                                                "No reason provided"}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {selectedID && (
                        <label className="mt-4 block">
                            <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Allocation Note
                            </span>
                            <textarea
                                rows={3}
                                value={remarks}
                                onChange={(event) =>
                                    setRemarks(
                                        event.target.value
                                    )
                                }
                                placeholder="Optional assignment note..."
                                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[9px] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                            />
                        </label>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
                    <p className="text-[8px] text-muted-foreground">
                        Stock cannot be assigned twice; the backend locks the selected row during allocation.
                    </p>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="button" size="sm" disabled={!selectedID || saving} className="gap-1.5" onClick={() => void assign()}>
                            {saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                            Allocate Asset
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AssetsPage() {
    const searchParams =
        useSearchParams();

    const status =
        searchParams.get("status");

    const [data, setData] =
        useState<AssignedDevice[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [refreshKey, setRefreshKey] =
        useState(0);

    const [viewDevice, setViewDevice] =
        useState<AssignedDevice | null>(
            null
        );

    const [assignDevice, setAssignDevice] =
        useState<AssignedDevice | null>(
            null
        );

    const [success, setSuccess] =
        useState("");

    useEffect(() => {
        let mounted = true;

        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                const response =
                    await reportApi.assets({
                        status:
                            status ||
                            undefined,
                    });

                if (!mounted) return;

                const mapped = (
                    response.data ?? []
                ).map(
                    (
                        item: any,
                        index: number
                    ): AssignedDevice => ({
                        id: item.id,
                        sl: index + 1,
                        referenceNumber:
                            String(
                                item.id ??
                                    item.reference_no ??
                                    ""
                            ),
                        mrnNumber:
                            item.mr_number ??
                            item.mr_id ??
                            "",
                        prNumber:
                            item.pr_number ??
                            item.pr_id ??
                            "",
                        deviceSl:
                            item.device_serial ??
                            item.serial_no ??
                            "",
                        employeeId:
                            item.emp_id ?? "",
                        employeeName:
                            item.emp_name ?? "",
                        department:
                            item.department ?? "",
                        designation:
                            item.designation ?? "",
                        category:
                            item.category ?? "",
                        brand:
                            item.brand ?? "",
                        model:
                            item.model ??
                            item.model_no ??
                            "",
                        status:
                            normalizeAssetStatus(
                                item.status_label ??
                                    item.status ??
                                    status ??
                                    ""
                            ),
                        userUsageDuration:
                            item.device_age ?? "",
                        warranty:
                            item.warranty_date ??
                            "",
                        vendor:
                            item.vendor_name ??
                            item.vendor ??
                            "",
                        assignedBy:
                            item.assigned_by ??
                            item.created_by ??
                            "",
                        assignedDate:
                            item.assigned_date ??
                            item.assign_date ??
                            "",
                        deviceType:
                            item.device_type
                                ? String(
                                      item.device_type
                                  )
                                : "",
                        deviceAge:
                            item.device_age ?? "",
                        purchaseDate:
                            item.purchase_date ??
                            "",
                        remarks:
                            item.remarks ?? "",
                    })
                );

                setData(mapped);
            } catch (reason) {
                if (!mounted) return;

                setError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load asset data"
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        void loadData();

        return () => {
            mounted = false;
        };
    }, [
        status,
        refreshKey,
    ]);

    const columns = useMemo(
        () =>
            assignedColumns({
                onView: (device) =>
                    setViewDevice(device),
                onAssign: (device) =>
                    setAssignDevice(device),
            }),
        []
    );

    if (loading) {
        return (
            <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-base font-semibold text-foreground">
                        {status ?? "All"} Devices
                    </h1>
                    <p className="mt-1 text-[9px] text-muted-foreground">
                        Available stock is allocated only against an approved requisition; assigned assets remain traceable in the asset registry.
                    </p>
                </div>

                {String(status).toLowerCase() === "available" && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] font-medium text-emerald-700">
                        <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5" />
                        Requisition-controlled allocation
                    </div>
                )}
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {success}
                </div>
            )}

            <div className="overflow-x-auto rounded-xl">
                <DataTable
                    columns={columns}
                    data={data}
                />
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

            <RequisitionAllocationModal
                asset={assignDevice}
                onClose={() =>
                    setAssignDevice(null)
                }
                onDone={(message) => {
                    setAssignDevice(null);
                    setSuccess(message);
                    setRefreshKey(
                        (current) =>
                            current + 1
                    );
                }}
            />
        </div>
    );
}
