// // app/dashboard/service-warranty/warranty-ownership
// "use client";

// import { useState, useRef, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Package, RotateCcw, UserCheck, Pencil, Trash2, Printer, ChevronDown } from "lucide-react";

// interface Claim {
//     id: number;
//     reference: string;
//     employee: string;
//     device: string;
//     serial: string;
//     status: string;
//     warrantyStatus: string;
//     submittedDate: string;
// }

// export default function WarrantyownershipPage() {
//     const [search, setSearch] = useState("");

//     const ownership: Claim[] = [
//         {
//             id: 1,
//             reference: "14501",
//             employee: "Bimal Chandra Gosh",
//             device: "Laptop LC2",
//             serial: "2JTWGJ3",
//             status: "User",
//             warrantyStatus: "Expired",
//             submittedDate: "2024-02-01",
//         },
//         {
//             id: 2,
//             reference: "14502",
//             employee: "Md. Hanif Ahmmed",
//             device: "Mouse",
//             serial: "2234LXBUJA8",
//             status: "User",
//             warrantyStatus: "Expired",
//             submittedDate: "2024-02-05",
//         },
//         {
//             id: 3,
//             reference: "14503",
//             employee: "Md. Touhid Ahmmed",
//             device: "Mouse",
//             serial: "2234LXBUJA8",
//             status: "User",
//             warrantyStatus: "Expired",
//             submittedDate: "2024-02-05",
//         },
//         {
//             id: 4,
//             reference: "14504",
//             employee: "Md. Ali Ahmmed",
//             device: "Mouse",
//             serial: "2234LXBUJA8",
//             status: "User",
//             warrantyStatus: "Expired",
//             submittedDate: "2024-02-05",
//         },
//         {
//             id: 5,
//             reference: "14505",
//             employee: "Md. Zaber Ahmmed",
//             device: "Laptop-1",
//             serial: "2234LXBUJA8",
//             status: "Vendor",
//             warrantyStatus: "Expired",
//             submittedDate: "2024-02-05",
//         },
//         {
//             id: 6,
//             reference: "14506",
//             employee: "Md. Jalil Ahmmed",
//             device: "Laptop-2",
//             serial: "2234LXBUJA8",
//             status: "Vendor",
//             warrantyStatus: "Expired",
//             submittedDate: "2024-02-05",
//         },
//         {
//             id: 7,
//             reference: "14507",
//             employee: "Md. Bulbul Ahmmed",
//             device: "RAM",
//             serial: "2234LXBUJA8",
//             status: "Vendor",
//             warrantyStatus: "Expired",
//             submittedDate: "2024-02-05",
//         },
//         {
//             id: 8,
//             reference: "14508",
//             employee: "Abdullah",
//             device: "Desktop",
//             serial: "2234LXBUJA8",
//             status: "Vendor",
//             warrantyStatus: "Expired",
//             submittedDate: "2024-02-05",
//         },
//         {
//             id: 9,
//             reference: "14509",
//             employee: "Md. Murad Ahmmed",
//             device: "Mouse",
//             serial: "2234LXBUJA8",
//             status: "Vendor",
//             warrantyStatus: "Expired",
//             submittedDate: "2024-02-05",
//         },
//         {
//             id: 10,
//             reference: "14510",
//             employee: "Md. Anwar Ahmmed",
//             device: "Laptop",
//             serial: "2234LXBUJA8",
//             status: "Vendor",
//             warrantyStatus: "Expired",
//             submittedDate: "2024-02-05",
//         },
//     ];

//     const filtered = ownership.filter((item) =>
//         item.reference.toLowerCase().includes(search.toLowerCase())
//     );

//     /* ================= Action Handlers ================= */
//     const handleServiceRequest = (item: Claim) => console.log("Service Request", item);
//     const handleInventoryReturn = (item: Claim) => console.log("Inventory Return", item);
//     const handleOwnership = (item: Claim) => console.log("Ownership", item);
//     const handleEdit = (item: Claim) => console.log("Edit", item);
//     const handleDelete = (id: number) => console.log("Delete", id);
//     const handlePrintPreview = (item: Claim) => console.log("Print Preview", item);

//     return (
//         <div className="p-6 space-y-6">

//             {/* ================= Header ================= */}
//             <div className="flex justify-between items-end">
//                 <div>
//                     <h1 className="text-2xl font-medium text-blue-700 inline-block border-b border-blue-300 pb-1">
//                         Device Ownership
//                     </h1>
//                     <p className="text-sm text-muted-foreground mt-1">
//                         Manage and monitor all warranty claim requests.
//                     </p>
//                 </div>

//                 <div className="flex gap-2">
//                     <Button variant="outline">Export Excel</Button>
//                     <Button variant="outline">Export PDF</Button>
//                 </div>
//             </div>


//             {/* ================= Summary Cards ================= */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="border rounded-xl p-4 shadow-sm bg-white">
//                     <p className="text-sm text-muted-foreground">Total Ownership</p>
//                     <p className="text-2xl font-semibold">{ownership.length}</p>
//                 </div>

//                 <div className="border rounded-xl p-4 shadow-sm bg-white">
//                     <p className="text-sm text-muted-foreground">User Ownership</p>
//                     <p className="text-2xl font-semibold text-green-600">
//                         {ownership.filter((c) => c.status === "Owership").length}
//                     </p>
//                 </div>

//                 <div className="border rounded-xl p-4 shadow-sm bg-white">
//                     <p className="text-sm text-muted-foreground">Vendor Ownership</p>
//                     <p className="text-2xl font-semibold text-red-600">
//                         {ownership.filter((c) => c.status === "Vendor").length}
//                     </p>
//                 </div>
//             </div>


//             {/* ================= Table ================= */}
//             <div className="border rounded-xl bg-white shadow-sm">

//                 {/* Table Top Bar */}
//                 <div className="flex justify-between items-center p-4 border-b">
//                     <span className="text-sm text-muted-foreground">
//                         Showing {filtered.length} of {ownership.length} entries
//                     </span>

//                     <div className="w-64">
//                         <Input
//                             placeholder="Search by Reference No..."
//                             value={search}
//                             onChange={(e) => setSearch(e.target.value)}
//                         />
//                     </div>
//                 </div>

//                 <div className="overflow-x-auto">
//                     <table className="w-full text-sm">
//                         <thead className="bg-muted border-b text-xs uppercase tracking-wider text-muted-foreground">
//                             <tr>
//                                 <th className="p-4 text-left">SL</th>
//                                 <th className="p-4 text-left">Reference</th>
//                                 <th className="p-4 text-left">Employee</th>
//                                 <th className="p-4 text-left">Device</th>
//                                 <th className="p-4 text-left">Serial</th>
//                                 <th className="p-4 text-left">Submitted</th>
//                                 <th className="p-4 text-left">Status</th>

//                                 <th className="p-4 text-left">Action</th>
//                             </tr>
//                         </thead>

//                         <tbody>
//                             {filtered.map((item, index) => (
//                                 <tr
//                                     key={item.id}
//                                     className="border-b last:border-none hover:bg-muted transition"
//                                 >
//                                     <td className="p-4">{index + 1}</td>
//                                     <td className="p-4 text-blue-600 font-medium">{item.reference}</td>
//                                     <td className="p-4">{item.employee}</td>
//                                     <td className="p-4">{item.device}</td>
//                                     <td className="p-4">{item.serial}</td>
//                                     <td className="p-4 text-muted-foreground">{item.submittedDate}</td>
//                                     <td className="p-4"><StatusBadge status={item.status} /></td>

//                                     <td className="p-4">
//                                         <ActionsDropdown
//                                             item={item}
//                                             onServiceRequest={handleServiceRequest}
//                                             onInventoryReturn={handleInventoryReturn}
//                                             onOwnership={handleOwnership}
//                                             onEdit={handleEdit}
//                                             onDelete={handleDelete}
//                                             onPrintPreview={handlePrintPreview}
//                                         />
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// }

// /* ================= Status Badge ================= */
// // function StatusBadge({ status }: { status: string }) {
// //     return (
// //         <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
// //             {status}
// //         </span>
// //     );
// // }

// /* ================= Status Badge ================= */
// function StatusBadge({ status }: { status: string }) {
//     // Assign colors based on status
//     const colorClasses = {
//         User: "bg-green-100 text-green-700",
//         Vendor: "bg-red-100 text-red-600",
//         Owership: "bg-blue-100 text-blue-700", // optional if needed
//     };

//     return (
//         <span
//             className={`px-3 py-1 text-xs rounded-full font-medium ${colorClasses[status] || "bg-muted text-gray-700"
//                 }`}
//         >
//             {status}
//         </span>
//     );
// }


// /* ================= Warranty Badge ================= */
// function WarrantyBadge({ status }: { status: string }) {
//     return (
//         <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-600 font-medium">
//             {status}
//         </span>
//     );
// }

// /* ================= Actions Dropdown ================= */
// interface ActionsDropdownProps {
//     item: Claim;
//     onServiceRequest: (item: Claim) => void;
//     onInventoryReturn: (item: Claim) => void;
//     onOwnership: (item: Claim) => void;
//     onEdit: (item: Claim) => void;
//     onDelete: (id: number) => void;
//     onPrintPreview: (item: Claim) => void;
// }

// function ActionsDropdown({
//     item,
//     onServiceRequest,
//     onInventoryReturn,
//     onOwnership,
//     onEdit,
//     onDelete,
//     onPrintPreview,
// }: ActionsDropdownProps) {
//     const [open, setOpen] = useState(false);
//     const ref = useRef<HTMLDivElement>(null);

//     // Close dropdown on outside click
//     useEffect(() => {
//         const handleClickOutside = (e: MouseEvent) => {
//             if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
//         };
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, []);

//     return (
//         <div ref={ref} className="relative inline-block">
//             {/* Dropdown button with text "Actions" */}
//             <button
//                 onClick={() => setOpen(!open)}
//                 className="flex items-center gap-1 px-3 py-1 bg-muted rounded hover:bg-muted text-gray-700 font-medium"
//             >
//                 Actions <ChevronDown size={16} />
//             </button>

//             {open && (
//                 <div className="absolute right-0 mt-1 w-56 bg-white border rounded shadow-md z-50">
//                     <DropdownButton text="Service Request" color="blue" icon={<Package size={16} />} onClick={() => { onServiceRequest(item); setOpen(false); }} />
//                     <DropdownButton text="Inventory Return" color="purple" icon={<RotateCcw size={16} />} onClick={() => { onInventoryReturn(item); setOpen(false); }} />
//                     <DropdownButton text="Ownership" color="green" icon={<UserCheck size={16} />} onClick={() => { onOwnership(item); setOpen(false); }} />
//                     <DropdownButton text="Edit" color="yellow" icon={<Pencil size={16} />} onClick={() => { onEdit(item); setOpen(false); }} />
//                     <DropdownButton text="Print Preview" color="blue" icon={<Printer size={16} />} onClick={() => { onPrintPreview(item); setOpen(false); }} />
//                     <DropdownButton text="Delete" color="red" icon={<Trash2 size={16} />} onClick={() => { onDelete(item.id); setOpen(false); }} />
//                 </div>
//             )}
//         </div>
//     );
// }

// /* ================= Dropdown Button Component ================= */
// interface DropdownButtonProps {
//     text: string;
//     color: string;
//     icon: React.ReactNode;
//     onClick: () => void;
// }

// function DropdownButton({ text, color, icon, onClick }: DropdownButtonProps) {
//     const colorClasses: Record<string, string> = {
//         blue: "text-blue-700",
//         purple: "text-purple-700",
//         green: "text-green-700",
//         yellow: "text-yellow-700",
//         red: "text-red-600",
//     };

//     return (
//         <button
//             onClick={onClick}
//             className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${colorClasses[color]} hover:bg-muted`}
//         >
//             {icon} {text}
//         </button>
//     );
// }



// app/dashboard/service-warranty/warranty-ownership/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
    Package, RotateCcw, UserCheck, Pencil, Trash2, Printer,
    ChevronDown, Search, FileSpreadsheet, FileText, ShieldCheck,
    X, Users, Store, Award
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface Claim {
    id: number;
    reference: string;
    employee: string;
    device: string;
    serial: string;
    status: string;
    warrantyStatus: string;
    submittedDate: string;
}

const ownership: Claim[] = [
    { id: 1, reference: "14501", employee: "Bimal Chandra Gosh", device: "Laptop LC2", serial: "2JTWGJ3", status: "User", warrantyStatus: "Expired", submittedDate: "2024-02-01" },
    { id: 2, reference: "14502", employee: "Md. Hanif Ahmmed", device: "Mouse", serial: "2234LXBUJA8", status: "User", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
    { id: 3, reference: "14503", employee: "Md. Touhid Ahmmed", device: "Mouse", serial: "2234LXBUJA8", status: "User", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
    { id: 4, reference: "14504", employee: "Md. Ali Ahmmed", device: "Mouse", serial: "2234LXBUJA8", status: "User", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
    { id: 5, reference: "14505", employee: "Md. Zaber Ahmmed", device: "Laptop-1", serial: "2234LXBUJA8", status: "Vendor", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
    { id: 6, reference: "14506", employee: "Md. Jalil Ahmmed", device: "Laptop-2", serial: "2234LXBUJA8", status: "Vendor", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
    { id: 7, reference: "14507", employee: "Md. Bulbul Ahmmed", device: "RAM", serial: "2234LXBUJA8", status: "Vendor", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
    { id: 8, reference: "14508", employee: "Abdullah", device: "Desktop", serial: "2234LXBUJA8", status: "Vendor", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
    { id: 9, reference: "14509", employee: "Md. Murad Ahmmed", device: "Mouse", serial: "2234LXBUJA8", status: "Vendor", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
    { id: 10, reference: "14510", employee: "Md. Anwar Ahmmed", device: "Laptop", serial: "2234LXBUJA8", status: "Vendor", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
];

/* ── Avatar ── */
function Avatar({ name }: { name: string }) {
    const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    const colors = ["bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"];
    return (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0 ${colors[name.charCodeAt(0) % colors.length]}`}>
            {initials}
        </span>
    );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, string> = {
        User: "bg-green-50 text-green-700 border-green-200",
        Vendor: "bg-red-50 text-red-700 border-red-200",
    };
    return (
        <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border whitespace-nowrap ${cfg[status] || "bg-muted text-muted-foreground border-border"}`}>
            {status}
        </span>
    );
}

/* ── Export helpers ── */
function exportCSV(data: Claim[]) {
    const headers = ["SL", "Reference", "Employee", "Device", "Serial", "Status", "Warranty Status", "Submitted Date"];
    const rows = data.map((c, i) => [i + 1, c.reference, c.employee, c.device, c.serial, c.status, c.warrantyStatus, c.submittedDate]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `device-ownership-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
}

function exportPDF(data: Claim[]) {
    const rows = data.map((c, i) => `<tr><td>${i + 1}</td><td>${c.reference}</td><td>${c.employee}</td><td>${c.device}</td><td>${c.serial}</td><td>${c.status}</td><td>${c.submittedDate}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Device Ownership</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;padding:24px;color:#111}h2{font-size:16px;margin-bottom:4px}p{color:#666;font-size:10px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#f1f5f9;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;border-bottom:2px solid #e2e8f0}td{padding:7px 10px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}.footer{margin-top:20px;font-size:10px;color:#999;text-align:right}</style>
    </head><body><h2>Device Ownership Report</h2><p>Generated: ${new Date().toLocaleString()} · Total: ${data.length}</p>
    <table><thead><tr><th>#</th><th>Reference</th><th>Employee</th><th>Device</th><th>Serial</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>${rows}</tbody></table><div class="footer">Fiber@Home Ltd. · ITM Portal</div></body></html>`;
    const win = window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
    win?.addEventListener("load", () => win.print());
}

/* ── View Modal ── */
function ViewModal({ item, onClose }: { item: Claim; onClose: () => void }) {
    const statusColor = item.status === "User" ? "text-green-600" : "text-red-600";
    return (
        <DialogPrimitive.Root open onOpenChange={onClose}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                <DialogPrimitive.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[520px] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-card border border-border">

                    {/* Header */}
                    <div className="shrink-0 bg-primary px-5 py-3.5 flex items-center justify-between">
                        <div>
                            <DialogPrimitive.Title className="text-sm font-semibold text-primary-foreground">
                                Ownership Details
                            </DialogPrimitive.Title>
                            <p className="text-[11px] text-primary-foreground/70 mt-0.5">Ref: {item.reference}</p>
                        </div>
                        <DialogPrimitive.Close className="rounded-lg p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors">
                            <X className="h-4 w-4" />
                        </DialogPrimitive.Close>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-3">
                        {/* Employee */}
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold text-foreground">Employee</p>
                            </div>
                            <div className="px-4 py-3 grid grid-cols-2 gap-3 bg-card">
                                <InfoField label="Name" value={item.employee} />
                                <InfoField label="Reference" value={item.reference} />
                            </div>
                        </div>

                        {/* Device */}
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold text-foreground">Device</p>
                            </div>
                            <div className="px-4 py-3 grid grid-cols-2 gap-3 bg-card">
                                <InfoField label="Device" value={item.device} />
                                <InfoField label="Serial No." value={item.serial} />
                                <InfoField label="Submitted" value={item.submittedDate} />
                                <div>
                                    <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Warranty</p>
                                    <p className="text-[11px] font-semibold mt-0.5 text-red-600">{item.warrantyStatus}</p>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
                                <Award className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold text-foreground">Ownership Status</p>
                            </div>
                            <div className="px-4 py-3 bg-card">
                                <p className={`text-sm font-bold ${statusColor}`}>{item.status} Ownership</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {item.status === "User" ? "Device transferred to employee permanently." : "Device transferred to vendor for processing."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-border bg-muted/40 flex justify-end">
                        <button onClick={onClose} className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                            Close
                        </button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function InfoField({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-[11px] font-semibold text-foreground mt-0.5 break-words">{value || "—"}</p>
        </div>
    );
}

/* ── Actions Dropdown ── */
function ActionsDropdown({ item, onView, onServiceRequest, onInventoryReturn, onOwnership, onEdit, onDelete, onPrintPreview }: {
    item: Claim;
    onView: (i: Claim) => void;
    onServiceRequest: (i: Claim) => void;
    onInventoryReturn: (i: Claim) => void;
    onOwnership: (i: Claim) => void;
    onEdit: (i: Claim) => void;
    onDelete: (id: number) => void;
    onPrintPreview: (i: Claim) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const close = () => setOpen(false);
    return (
        <div ref={ref} className="relative inline-block">
            <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-muted hover:bg-border rounded-lg border border-border transition text-foreground">
                Actions <ChevronDown size={11} />
            </button>
            {open && (
                <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    <Drop icon={<Package size={12} />} label="View" color="text-blue-600" onClick={() => { onView(item); close(); }} />
                    <Drop icon={<Package size={12} />} label="Service Request" color="text-sky-600" onClick={() => { onServiceRequest(item); close(); }} />
                    <Drop icon={<RotateCcw size={12} />} label="Inventory Return" color="text-purple-600" onClick={() => { onInventoryReturn(item); close(); }} />
                    <Drop icon={<UserCheck size={12} />} label="Ownership" color="text-green-600" onClick={() => { onOwnership(item); close(); }} />
                    <Drop icon={<Pencil size={12} />} label="Edit" color="text-amber-600" onClick={() => { onEdit(item); close(); }} />
                    <Drop icon={<Printer size={12} />} label="Print Preview" color="text-slate-600" onClick={() => { onPrintPreview(item); close(); }} />
                    <div className="border-t border-border my-1" />
                    <Drop icon={<Trash2 size={12} />} label="Delete" color="text-red-600" onClick={() => { onDelete(item.id); close(); }} />
                </div>
            )}
        </div>
    );
}

function Drop({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium ${color} hover:bg-muted transition`}>
            {icon} {label}
        </button>
    );
}

/* ── Main Page ── */
export default function WarrantyOwnershipPage() {
    const [search, setSearch] = useState("");
    const [activeStatus, setActiveStatus] = useState<string | null>(null);
    const [viewItem, setViewItem] = useState<Claim | null>(null);

    const filtered = ownership.filter(item => {
        const matchSearch = !search ||
            item.reference.toLowerCase().includes(search.toLowerCase()) ||
            item.employee.toLowerCase().includes(search.toLowerCase()) ||
            item.device.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !activeStatus || item.status === activeStatus;
        return matchSearch && matchStatus;
    });

    const userCount = ownership.filter(c => c.status === "User").length;
    const vendorCount = ownership.filter(c => c.status === "Vendor").length;

    return (
        <div className="p-4 sm:p-6 space-y-4">

            {/* Header */}
            <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-foreground">Device Ownership</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">Manage and monitor all ownership records</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => exportCSV(filtered)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition">
                            <FileSpreadsheet size={13} /> Excel
                        </button>
                        <button onClick={() => exportPDF(filtered)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition">
                            <FileText size={13} /> PDF
                        </button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                        { label: "Total", value: ownership.length, color: "text-foreground", bg: "bg-muted border-border", icon: <ShieldCheck size={14} />, status: null },
                        { label: "User", value: userCount, color: "text-green-700", bg: "bg-green-50 border-green-100", icon: <Users size={14} />, status: "User" },
                        { label: "Vendor", value: vendorCount, color: "text-red-700", bg: "bg-red-50 border-red-100", icon: <Store size={14} />, status: "Vendor" },
                    ].map(s => (
                        <button key={s.label}
                            onClick={() => setActiveStatus(activeStatus === s.status ? null : s.status)}
                            className={`rounded-xl border px-4 py-3 text-left transition ring-2 hover:opacity-80 ${s.bg} ${activeStatus === s.status && s.status !== null ? "ring-primary" : "ring-transparent"}`}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                                <span className={`${s.color} opacity-60`}>{s.icon}</span>
                            </div>
                            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-border gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {ownership.length} entries
                        </p>
                        {activeStatus && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                                {activeStatus} <button onClick={() => setActiveStatus(null)}><X size={10} /></button>
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input placeholder="Search reference, employee, device..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 w-56 text-xs" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                {["#", "Reference", "Employee", "Device", "Serial", "Submitted", "Status", "Actions"].map(col => (
                                    <th key={col} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filtered.map((item, i) => (
                                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{i + 1}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{item.reference}</span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <Avatar name={item.employee} />
                                            <span className="text-[11px] text-foreground font-medium whitespace-nowrap">{item.employee}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-[11px] text-foreground font-medium">{item.device}</td>
                                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground font-mono">{item.serial}</td>
                                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">{item.submittedDate}</td>
                                    <td className="px-3 py-2.5"><StatusBadge status={item.status} /></td>
                                    <td className="px-3 py-2.5">
                                        <ActionsDropdown
                                            item={item}
                                            onView={setViewItem}
                                            onServiceRequest={i => console.log("Service", i)}
                                            onInventoryReturn={i => console.log("Return", i)}
                                            onOwnership={i => console.log("Ownership", i)}
                                            onEdit={i => console.log("Edit", i)}
                                            onDelete={id => console.log("Delete", id)}
                                            onPrintPreview={i => console.log("Print", i)}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">No records match your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {viewItem && <ViewModal item={viewItem} onClose={() => setViewItem(null)} />}
        </div>
    );
}
