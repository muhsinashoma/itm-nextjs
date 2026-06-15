// app/dashboard/reports/assets/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { assignedColumns } from "@/components/reports/assigned-columns";
import { AssignedDevice } from "@/models/AssignedDevice";
import DeviceViewModal from "@/components/modals/DeviceViewModal";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Status color helper (covers all statuses in static data) ── */
const statusStyle = (status?: string): string => {
    switch (status?.toLowerCase().trim()) {
        case "assigned": return "text-green-600";
        case "available": return "text-emerald-600";
        case "transferred": return "text-blue-500";
        case "returned": return "text-sky-600";
        case "stored": return "text-slate-500";
        case "damaged": return "text-red-600";
        case "lost": return "text-orange-500";
        case "stolen": return "text-rose-600";
        case "obsoleted": return "text-yellow-600";
        case "ownership":
        case "user ownership": return "text-purple-600";
        case "expired": return "text-gray-500";
        case "claimed": return "text-cyan-600";
        case "to vendor": return "text-indigo-500";
        case "recovered": return "text-teal-600";
        case "open": return "text-blue-600";
        case "in progress": return "text-amber-600";
        case "closed": return "text-gray-600";
        case "pending clearance": return "text-orange-600";
        case "completed": return "text-green-700";
        case "in process": return "text-amber-500";
        case "delayed": return "text-red-500";
        case "upcoming renewals": return "text-violet-600";
        default: return "text-foreground";
    }
};

/* ── Reusable field components ── */
function Info({ label, value, span }: { label: string; value?: string; span?: boolean }) {
    return (
        <div className={`min-w-0 ${span ? "col-span-2" : ""}`}>
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-[11px] font-semibold text-foreground mt-0.5 break-words">{value || "—"}</p>
        </div>
    );
}

function StatusInfo({ label, value }: { label: string; value?: string }) {
    return (
        <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`text-[11px] font-semibold mt-0.5 capitalize ${statusStyle(value)}`}>{value || "—"}</p>
        </div>
    );
}

function LocalInput({ label, ...props }: any) {
    return (
        <div>
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
            <input
                {...props}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
        </div>
    );
}

export default function AssignedPage() {
    const searchParams = useSearchParams();
    const status = searchParams.get("status");

    const [data, setData] = useState<AssignedDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [viewDevice, setViewDevice] = useState<AssignedDevice | null>(null);
    const [assignDevice, setAssignDevice] = useState<AssignedDevice | null>(null);
    const [formData, setFormData] = useState<AssignedDevice | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const url = status
                    ? `/api/reports/assigned?status=${status}`
                    : `/api/reports/assigned`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to load");
                const result: AssignedDevice[] = await res.json();
                setData(result);
            } catch {
                setError("Unable to load data");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [status]);

    const columns = assignedColumns({
        onView: (device) => setViewDevice(device),
        onAssign: (device) => {
            setAssignDevice(device);
            setFormData(device);
        },
    });

    if (loading) return (
        <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-lg" />
            ))}
        </div>
    );
    if (error) return <p className="p-6 text-red-600">{error}</p>;

    return (
        <div className="p-4 sm:p-6 space-y-4">

            <h1 className="text-base font-semibold text-foreground">
                {status ?? "All"} Devices
            </h1>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-xl">
                <DataTable columns={columns} data={data} />
            </div>

            {/* VIEW MODAL */}
            <DeviceViewModal
                open={!!viewDevice}
                onOpenChange={(open) => { if (!open) setViewDevice(null); }}
                device={viewDevice}
            />

            {/* ASSIGN MODAL */}
            <DialogPrimitive.Root
                open={!!assignDevice}
                onOpenChange={(open) => {
                    if (!open) { setAssignDevice(null); setFormData(null); }
                }}
            >
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                    <DialogPrimitive.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[600px] max-h-[88vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-card border border-border">

                        {/* Header */}
                        <div className="shrink-0 bg-primary px-5 py-3.5 flex items-center justify-between">
                            <div>
                                <DialogPrimitive.Title className="text-sm font-semibold text-primary-foreground">
                                    Assign Device
                                </DialogPrimitive.Title>
                                <p className="text-[11px] text-primary-foreground/70 mt-0.5">
                                    Ref: {assignDevice?.referenceNumber}
                                </p>
                            </div>
                            <DialogPrimitive.Close className="rounded-lg p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors">
                                <X className="h-4 w-4" />
                            </DialogPrimitive.Close>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {formData && (
                                <>
                                    {/* Device summary */}
                                    <div className="rounded-xl border border-border overflow-hidden">
                                        <div className="px-4 py-2 bg-muted border-b border-border">
                                            <p className="text-xs font-semibold text-foreground">Device Information</p>
                                        </div>
                                        <div className="px-4 py-3 bg-card grid grid-cols-4 gap-3">
                                            <Info label="Reference No" value={formData.referenceNumber} />
                                            <Info label="Category" value={formData.category} />
                                            <Info label="Model" value={formData.model} />
                                            <Info label="Device SL" value={formData.deviceSl} />
                                            <Info label="Vendor" value={formData.vendor} />
                                            <Info label="Warranty" value={formData.warranty} />
                                            <Info label="Device Age" value={formData.deviceAge} />
                                            <StatusInfo label="Status" value={formData.status} />
                                        </div>
                                    </div>

                                    {/* Assignment form */}
                                    <div className="rounded-xl border border-border overflow-hidden">
                                        <div className="px-4 py-2 bg-muted border-b border-border">
                                            <p className="text-xs font-semibold text-foreground">Employee Assignment</p>
                                        </div>
                                        <div className="px-4 py-3 bg-card grid grid-cols-2 gap-3">
                                            <LocalInput
                                                label="Employee ID"
                                                value={formData.employeeId}
                                                onChange={(e: any) => setFormData({ ...formData, employeeId: e.target.value })}
                                            />
                                            <LocalInput
                                                label="Employee Name"
                                                value={formData.employeeName}
                                                onChange={(e: any) => setFormData({ ...formData, employeeName: e.target.value })}
                                            />
                                            <LocalInput
                                                label="Department"
                                                value={formData.department}
                                                onChange={(e: any) => setFormData({ ...formData, department: e.target.value })}
                                            />
                                            <LocalInput
                                                label="Designation"
                                                value={formData.designation}
                                                onChange={(e: any) => setFormData({ ...formData, designation: e.target.value })}
                                            />
                                            <LocalInput
                                                label="Assign Date"
                                                type="date"
                                                value={formData.purchaseDate}
                                                onChange={(e: any) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                            />
                                            <LocalInput
                                                label="Remarks"
                                                value={formData.remarks}
                                                onChange={(e: any) => setFormData({ ...formData, remarks: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 px-5 py-3 border-t border-border bg-muted/40 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setAssignDevice(null); setFormData(null); }}
                            >
                                Cancel
                            </Button>
                            <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-90">
                                Confirm Assign
                            </Button>
                        </div>

                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

        </div>
    );
}
