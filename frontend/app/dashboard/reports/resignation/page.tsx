

// // app/dashboard/reports/resignation/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import { DataTable } from "@/components/data-table";
// import { assignedColumns } from "@/components/reports/assigned-columns";
// import { AssignedDevice } from "@/models/AssignedDevice";
// import DeviceViewModal from "@/components/modals/DeviceViewModal";
// import * as DialogPrimitive from "@radix-ui/react-dialog";
// import { Button } from "@/components/ui/button";
// import { X, Clock, CheckCircle2, Loader2 } from "lucide-react";

// function InfoField({ label, value }: { label: string; value?: string }) {
//     return (
//         <div className="min-w-0">
//             <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
//             <p className="text-[11px] font-semibold text-foreground mt-0.5 break-words">{value || "—"}</p>
//         </div>
//     );
// }

// function LocalInput({ label, ...props }: any) {
//     return (
//         <div>
//             <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
//             <input {...props} className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
//         </div>
//     );
// }

// const STATUS_CONFIG = [
//     { key: "Pending Clearance", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: <Clock size={13} /> },
//     { key: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 size={13} /> },
//     { key: "In Process", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <Loader2 size={13} /> },
// ];

// export default function ResignationPage() {
//     const searchParams = useSearchParams();
//     const router = useRouter();
//     const status = searchParams.get("status");

//     const [allData, setAllData] = useState<AssignedDevice[]>([]);
//     const [data, setData] = useState<AssignedDevice[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [viewDevice, setViewDevice] = useState<AssignedDevice | null>(null);
//     const [assignDevice, setAssignDevice] = useState<AssignedDevice | null>(null);
//     const [formData, setFormData] = useState<AssignedDevice | null>(null);

//     useEffect(() => {
//         async function loadData() {
//             try {
//                 setLoading(true);

//                 // Always fetch all data for counts
//                 const allRes = await fetch(`/api/reports/assigned`);
//                 const allResult: AssignedDevice[] = await allRes.json();
//                 setAllData(allResult);

//                 // Fetch filtered data
//                 const url = status
//                     ? `/api/reports/assigned?status=${encodeURIComponent(status)}`
//                     : `/api/reports/assigned`;
//                 const res = await fetch(url);
//                 if (!res.ok) throw new Error("Failed to load");
//                 setData(await res.json());
//             } catch {
//                 setError("Unable to load data");
//             } finally {
//                 setLoading(false);
//             }
//         }
//         loadData();
//     }, [status]);

//     const columns = assignedColumns({
//         onView: (device) => setViewDevice(device),
//         onAssign: (device) => { setAssignDevice(device); setFormData(device); },
//     });

//     // Count using exact case-insensitive match
//     const getCount = (key: string) =>
//         allData.filter(d => d.status?.toLowerCase().trim() === key.toLowerCase().trim()).length;

//     if (loading) return (
//         <div className="space-y-3 p-4">
//             {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded-lg" />)}
//         </div>
//     );
//     if (error) return <p className="p-6 text-red-600">{error}</p>;

//     return (
//         <div className="p-4 sm:p-6 space-y-4">

//             {/* Header with status cards */}
//             <div className="bg-card border border-border rounded-2xl p-4">
//                 <div className="flex items-center gap-3 mb-4">
//                     <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
//                         <Clock className="w-4 h-4 text-orange-600" />
//                     </div>
//                     <div>
//                         <h1 className="text-sm font-bold text-foreground">Resignation Clearance</h1>
//                         <p className="text-xs text-muted-foreground mt-0.5">
//                             {status ? `Showing: ${status}` : "All resignation clearance records"}
//                         </p>
//                     </div>
//                     {status && (
//                         <button
//                             onClick={() => router.push("/dashboard/reports/resignation")}
//                             className="ml-auto text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition"
//                         >
//                             <X size={10} /> Clear filter
//                         </button>
//                     )}
//                 </div>

//                 {/* Clickable status cards */}
//                 <div className="grid grid-cols-3 gap-3">
//                     {STATUS_CONFIG.map(s => {
//                         const count = getCount(s.key);
//                         const isActive = status?.toLowerCase() === s.key.toLowerCase();
//                         return (
//                             <button
//                                 key={s.key}
//                                 onClick={() => router.push(
//                                     isActive
//                                         ? "/dashboard/reports/resignation"
//                                         : `/dashboard/reports/resignation?status=${encodeURIComponent(s.key)}`
//                                 )}
//                                 className={`rounded-xl border px-4 py-3 text-left transition ring-2 hover:opacity-80 ${s.bg} ${isActive ? "ring-primary shadow-sm" : "ring-transparent"}`}
//                             >
//                                 <div className="flex items-center justify-between mb-1">
//                                     <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">{s.key}</p>
//                                     <span className={`${s.color} opacity-60`}>{s.icon}</span>
//                                 </div>
//                                 <p className={`text-xl font-bold ${s.color}`}>{count}</p>
//                                 {isActive && <p className="text-[9px] text-muted-foreground mt-0.5">Active filter ✓</p>}
//                             </button>
//                         );
//                     })}
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="bg-card border border-border rounded-xl overflow-hidden">
//                 <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
//                     <p className="text-[11px] text-muted-foreground">
//                         Showing <span className="font-semibold text-foreground">{data.length}</span> records
//                         {status && <span className="ml-1">· <span className="text-primary font-medium">{status}</span></span>}
//                     </p>
//                 </div>
//                 <div className="overflow-x-auto">
//                     <DataTable columns={columns} data={data} />
//                 </div>
//             </div>

//             {/* View Modal */}
//             <DeviceViewModal
//                 open={!!viewDevice}
//                 onOpenChange={(open) => { if (!open) setViewDevice(null); }}
//                 device={viewDevice}
//             />

//             {/* Assign Modal */}
//             <DialogPrimitive.Root
//                 open={!!assignDevice}
//                 onOpenChange={(open) => { if (!open) { setAssignDevice(null); setFormData(null); } }}
//             >
//                 <DialogPrimitive.Portal>
//                     <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
//                     <DialogPrimitive.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[600px] max-h-[88vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-card border border-border">

//                         <div className="shrink-0 bg-primary px-5 py-3.5 flex items-center justify-between">
//                             <div>
//                                 <DialogPrimitive.Title className="text-sm font-semibold text-primary-foreground">Assign Device</DialogPrimitive.Title>
//                                 <p className="text-[11px] text-primary-foreground/70 mt-0.5">Ref: {assignDevice?.referenceNumber}</p>
//                             </div>
//                             <DialogPrimitive.Close className="rounded-lg p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors">
//                                 <X className="h-4 w-4" />
//                             </DialogPrimitive.Close>
//                         </div>

//                         <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                             {formData && (
//                                 <>
//                                     <div className="rounded-xl border border-border overflow-hidden">
//                                         <div className="px-4 py-2 bg-muted border-b border-border">
//                                             <p className="text-xs font-semibold text-foreground">Device Information</p>
//                                         </div>
//                                         <div className="px-4 py-3 bg-card grid grid-cols-4 gap-3">
//                                             <InfoField label="Reference No" value={formData.referenceNumber} />
//                                             <InfoField label="Category" value={formData.category} />
//                                             <InfoField label="Model" value={formData.model} />
//                                             <InfoField label="Device SL" value={formData.deviceSl} />
//                                             <InfoField label="Vendor" value={formData.vendor} />
//                                             <InfoField label="Warranty" value={formData.warranty} />
//                                             <InfoField label="Device Age" value={formData.deviceAge} />
//                                             <InfoField label="Status" value={formData.status} />
//                                         </div>
//                                     </div>
//                                     <div className="rounded-xl border border-border overflow-hidden">
//                                         <div className="px-4 py-2 bg-muted border-b border-border">
//                                             <p className="text-xs font-semibold text-foreground">Employee Assignment</p>
//                                         </div>
//                                         <div className="px-4 py-3 bg-card grid grid-cols-2 gap-3">
//                                             <LocalInput label="Employee ID" value={formData.employeeId} onChange={(e: any) => setFormData({ ...formData, employeeId: e.target.value })} />
//                                             <LocalInput label="Employee Name" value={formData.employeeName} onChange={(e: any) => setFormData({ ...formData, employeeName: e.target.value })} />
//                                             <LocalInput label="Department" value={formData.department} onChange={(e: any) => setFormData({ ...formData, department: e.target.value })} />
//                                             <LocalInput label="Designation" value={formData.designation} onChange={(e: any) => setFormData({ ...formData, designation: e.target.value })} />
//                                             <LocalInput label="Assign Date" type="date" value={formData.purchaseDate} onChange={(e: any) => setFormData({ ...formData, purchaseDate: e.target.value })} />
//                                             <LocalInput label="Remarks" value={formData.remarks} onChange={(e: any) => setFormData({ ...formData, remarks: e.target.value })} />
//                                         </div>
//                                     </div>
//                                 </>
//                             )}
//                         </div>

//                         <div className="shrink-0 px-5 py-3 border-t border-border bg-muted/40 flex justify-end gap-2">
//                             <Button variant="outline" size="sm" onClick={() => { setAssignDevice(null); setFormData(null); }}>Cancel</Button>
//                             <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-90">Confirm Assign</Button>
//                         </div>

//                     </DialogPrimitive.Content>
//                 </DialogPrimitive.Portal>
//             </DialogPrimitive.Root>

//         </div>
//     );
// }


//app/dashboard/reports/resignation/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { assignedColumns } from "@/components/reports/assigned-columns";
import { AssignedDevice } from "@/models/AssignedDevice";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

export default function AssignedPage() {
    const searchParams = useSearchParams();
    const status = searchParams.get("status");

    const [data, setData] = useState<AssignedDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ✅ MODAL STATES
    const [viewDevice, setViewDevice] = useState<AssignedDevice | null>(null);
    const [assignDevice, setAssignDevice] = useState<AssignedDevice | null>(null);

    // ✅ FORM STATE (NEW)
    const [formData, setFormData] = useState<AssignedDevice | null>(null);

    useEffect(() => {
        async function loadAssignedDevices() {
            try {
                const url = status
                    ? `/api/reports/assigned?status=${status}`
                    : `/api/reports/assigned`;

                const res = await fetch(url);

                if (!res.ok) throw new Error("Failed to load assigned devices");

                const result: AssignedDevice[] = await res.json();
                setData(result);
            } catch (err) {
                setError("Unable to load data");
            } finally {
                setLoading(false);
            }
        }

        loadAssignedDevices();
    }, [status]);

    // ✅ PASS HANDLERS TO COLUMNS
    const columns = assignedColumns({
        onView: (device) => setViewDevice(device),

        onAssign: (device) => {
            setAssignDevice(device);
            setFormData(device); // ✅ preload all fields
        },
    });

    if (loading) return <p className="p-6">Loading...</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;

    const Info = ({ label, value }: any) => (
        <div>
            <p className="text-gray-500 text-xs">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );

    const Input = ({ label, ...props }: any) => (
        <div>
            <p className="text-gray-500 text-xs">{label}</p>
            <input
                {...props}
                className="border p-2 rounded w-full mt-1"
            />
        </div>
    );

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">
                {status ?? "All"} Devices
            </h1>

            <DataTable columns={columns} data={data} />

            {/* ================= VIEW MODAL ================= */}
            <DialogPrimitive.Root
                open={!!viewDevice}
                onOpenChange={() => setViewDevice(null)}
            >
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40" />

                    <DialogPrimitive.Content className="fixed top-1/2 left-1/2 w-[800px] max-w-[95%] -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl overflow-hidden">

                        {/* HEADER */}
                        <div className="border-b p-5 bg-gray-50">
                            <DialogPrimitive.Title className="text-lg font-semibold">
                                Device Details
                            </DialogPrimitive.Title>

                            <p className="text-sm text-gray-500">
                                Reference: {viewDevice?.referenceNumber}
                            </p>
                        </div>

                        {/* BODY */}
                        {viewDevice && (
                            <div className="p-6 grid grid-cols-2 gap-5 text-sm">

                                {/* Employee Info */}
                                <div className="col-span-2">
                                    <h3 className="font-semibold text-gray-700 mb-2">Employee Information</h3>
                                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                                        <p><span className="text-gray-500">Name:</span> {viewDevice.employeeName}</p>
                                        <p><span className="text-gray-500">ID:</span> {viewDevice.employeeId}</p>
                                        <p><span className="text-gray-500">Department:</span> {viewDevice.department}</p>
                                        <p><span className="text-gray-500">Designation:</span> {viewDevice.designation}</p>
                                    </div>
                                </div>

                                {/* Device Info */}
                                <div className="col-span-2">
                                    <h3 className="font-semibold text-gray-700 mb-2">Device Information</h3>
                                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                                        <p><span className="text-gray-500">Category:</span> {viewDevice.category}</p>
                                        <p><span className="text-gray-500">Model:</span> {viewDevice.model}</p>
                                        <p><span className="text-gray-500">Device SL:</span> {viewDevice.deviceSl}</p>
                                        <p><span className="text-gray-500">Vendor:</span> {viewDevice.vendor}</p>
                                        <p><span className="text-gray-500">Type:</span> {viewDevice.deviceType}</p>
                                        <p>
                                            <span className="text-gray-500">Status:</span>{" "}
                                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                                                {viewDevice.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="col-span-2">
                                    <h3 className="font-semibold text-gray-700 mb-2">Timeline</h3>
                                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                                        <p><span className="text-gray-500">Assigned Date:</span> {viewDevice.assignedDate}</p>
                                        <p><span className="text-gray-500">Purchase Date:</span> {viewDevice.purchaseDate}</p>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* FOOTER */}
                        <div className="p-5 border-t flex justify-end">
                            <Button onClick={() => setViewDevice(null)}>
                                Close
                            </Button>
                        </div>

                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

            {/* ================= ASSIGN MODAL ================= */}
            <DialogPrimitive.Root
                open={!!assignDevice}
                onOpenChange={() => {
                    setAssignDevice(null);
                    setFormData(null); // ✅ reset form
                }}
            >
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40" />

                    <DialogPrimitive.Content className="fixed top-1/2 left-1/2 w-[600px] max-w-[95%] -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg">
                        <DialogPrimitive.Title className="text-lg font-semibold mb-4">
                            Assign Device - {assignDevice?.referenceNumber}
                        </DialogPrimitive.Title>

                        {formData && (
                            <div className="space-y-6 text-sm">

                                {/* ================= HEADER SUMMARY ================= */}
                                <div className="bg-blue-50 border rounded p-3">
                                    <h2 className="text-base font-semibold text-blue-700">
                                        Assign Device Preview
                                    </h2>
                                    <p className="text-xs text-gray-600">
                                        Review device and employee details before assignment
                                    </p>
                                </div>

                                {/* ================= DEVICE INFO ================= */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-2">
                                        Device Information
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded border">

                                        <Info label="Reference No" value={formData.referenceNumber} />
                                        <Info label="Category" value={formData.category} />
                                        <Info label="Model" value={formData.model} />
                                        <Info label="Device SL" value={formData.deviceSl} />
                                        <Info label="Vendor" value={formData.vendor} />
                                        <Info label="Warranty" value={formData.warranty} />
                                        <Info label="Device Age" value={formData.deviceAge} />
                                        <Info label="Status" value={formData.status} />

                                    </div>
                                </div>

                                {/* ================= EMPLOYEE INFO ================= */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-2">
                                        Employee Assignment
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3">

                                        <Input
                                            label="Employee ID"
                                            value={formData.employeeId}
                                            onChange={(e) =>
                                                setFormData({ ...formData, employeeId: e.target.value })
                                            }
                                        />

                                        <Input
                                            label="Employee Name"
                                            value={formData.employeeName}
                                            onChange={(e) =>
                                                setFormData({ ...formData, employeeName: e.target.value })
                                            }
                                        />

                                        <Input
                                            label="Department"
                                            value={formData.department}
                                            onChange={(e) =>
                                                setFormData({ ...formData, department: e.target.value })
                                            }
                                        />

                                        <Input
                                            label="Designation"
                                            value={formData.designation}
                                            onChange={(e) =>
                                                setFormData({ ...formData, designation: e.target.value })
                                            }
                                        />

                                        <Input
                                            label="Assign Date"
                                            type="date"
                                            value={formData.purchaseDate}
                                            onChange={(e) =>
                                                setFormData({ ...formData, purchaseDate: e.target.value })
                                            }
                                        />

                                        <Input
                                            label="Remarks"
                                            value={formData.remarks}
                                            onChange={(e) =>
                                                setFormData({ ...formData, remarks: e.target.value })
                                            }
                                        />

                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAssignDevice(null);
                                    setFormData(null);
                                }}
                            >
                                Cancel
                            </Button>

                            <Button className="bg-blue-600 text-white">
                                Confirm Assign
                            </Button>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>


        </div>
    );
}

