
// components/modals/DeviceViewModal.tsx
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, User, Monitor, Calendar } from "lucide-react";
import { AssignedDevice } from "@/models/AssignedDevice";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    device: AssignedDevice | null;
}

export default function DeviceViewModal({ open, onOpenChange, device }: Props) {
    const statusColor = (status?: string) => {
        const s = status?.toLowerCase() || "";
        if (s === "damaged") return "bg-red-100 text-red-700";
        if (s === "lost" || s === "stolen") return "bg-orange-100 text-orange-700";
        if (s === "assigned") return "bg-blue-100 text-blue-700";
        if (s === "available") return "bg-green-100 text-green-700";
        return "bg-muted text-muted-foreground";
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

                <DialogPrimitive.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[680px] max-h-[82vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-card border border-border">

                    {/* HEADER */}
                    <div className="shrink-0 bg-primary px-5 py-3.5 flex items-center justify-between">
                        <div>
                            <DialogPrimitive.Title className="text-sm font-semibold text-primary-foreground">
                                Device Details
                            </DialogPrimitive.Title>
                            <p className="text-[11px] text-primary-foreground/70 mt-0.5">
                                Ref: {device?.referenceNumber || "—"}
                            </p>
                        </div>
                        <DialogPrimitive.Close className="rounded-lg p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors">
                            <X className="h-4 w-4" />
                        </DialogPrimitive.Close>
                    </div>

                    {/* BODY */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {device && (
                            <>
                                {/* Employee */}
                                <Section icon={<User className="h-3.5 w-3.5" />} title="Employee Information">
                                    <div className="grid grid-cols-4 gap-3">
                                        <Info label="Name" value={device.employeeName} span />
                                        <Info label="Employee ID" value={device.employeeId} />
                                        <Info label="Department" value={device.department} />
                                        <Info label="Designation" value={device.designation} />
                                    </div>
                                </Section>

                                {/* Device */}
                                <Section icon={<Monitor className="h-3.5 w-3.5" />} title="Device Information">
                                    <div className="grid grid-cols-4 gap-3">
                                        <Info label="Category" value={device.category} />
                                        <Info label="Model" value={device.model} />
                                        <Info label="Device SL" value={device.deviceSl} />
                                        <Info label="Vendor" value={device.vendor} />
                                        <Info label="Type" value={device.deviceType} />
                                        <div>
                                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColor(device.status)}`}>
                                                {device.status || "—"}
                                            </span>
                                        </div>
                                        <Info label="Condition" value={device.condition} />
                                        <Info label="Remarks" value={device.remarks} />
                                    </div>
                                </Section>

                                {/* Timeline */}
                                <Section icon={<Calendar className="h-3.5 w-3.5" />} title="Timeline">
                                    <div className="grid grid-cols-4 gap-3">
                                        <Info label="Assigned Date" value={device.assignedDate} span />
                                        <Info label="Purchase Date" value={device.purchaseDate} span />
                                    </div>
                                </Section>
                            </>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="shrink-0 px-5 py-2.5 border-t border-border bg-muted/40 flex justify-end">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                            Close
                        </button>
                    </div>

                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function Section({
    icon, title, children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
                <span className="text-muted-foreground">{icon}</span>
                <p className="text-xs font-semibold text-foreground">{title}</p>
            </div>
            <div className="px-4 py-3 bg-card">{children}</div>
        </div>
    );
}

function Info({ label, value, span }: { label: string; value?: string; span?: boolean }) {
    return (
        <div className={`min-w-0 ${span ? "col-span-2" : ""}`}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-xs font-semibold text-foreground mt-0.5 break-words">{value || "—"}</p>
        </div>
    );
}

