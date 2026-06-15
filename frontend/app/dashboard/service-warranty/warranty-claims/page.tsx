
// // app/dashboard/service-warranty/warranty-claims/page.tsx
// "use client";

// import { useState, useRef, useEffect } from "react";
// import { Input } from "@/components/ui/input";
// import {
//     Search, FileSpreadsheet, FileText, ShieldCheck, Package,
//     RotateCcw, UserCheck, Pencil, Trash2, Printer, ChevronDown,
//     Eye, X, Monitor, AlertCircle, Calendar, Users, CheckCircle2
// } from "lucide-react";
// import * as DialogPrimitive from "@radix-ui/react-dialog";

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

// const claims: Claim[] = [
//     { id: 1, reference: "14501", employee: "Bimal Chandra Gosh", device: "Laptop LC2", serial: "2JTWGJ3", status: "Active", warrantyStatus: "Expired", submittedDate: "2024-02-01" },
//     { id: 2, reference: "14502", employee: "Md. Bulbul Ahmmed", device: "Mouse", serial: "2234LXBUJA8", status: "Active", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
//     { id: 3, reference: "14503", employee: "Md. Bulbul Ahmmed", device: "Mouse", serial: "2234LXBUJA8", status: "Active", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
//     { id: 4, reference: "14504", employee: "Md. Bulbul Ahmmed", device: "Mouse", serial: "2234LXBUJA8", status: "Active", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
//     { id: 5, reference: "14505", employee: "Md. Bulbul Ahmmed", device: "Laptop-1", serial: "2234LXBUJA8", status: "Active", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
//     { id: 6, reference: "14506", employee: "Md. Bulbul Ahmmed", device: "Laptop-2", serial: "2234LXBUJA8", status: "Active", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
//     { id: 7, reference: "14507", employee: "Md. Bulbul Ahmmed", device: "RAM", serial: "2234LXBUJA8", status: "Active", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
//     { id: 8, reference: "14508", employee: "Md. Bulbul Ahmmed", device: "Desktop", serial: "2234LXBUJA8", status: "Active", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
//     { id: 9, reference: "14509", employee: "Md. Bulbul Ahmmed", device: "Mouse", serial: "2234LXBUJA8", status: "Active", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
//     { id: 10, reference: "14510", employee: "Md. Bulbul Ahmmed", device: "Laptop", serial: "2234LXBUJA8", status: "Active", warrantyStatus: "Expired", submittedDate: "2024-02-05" },
// ];

// /* ── Helpers ── */
// function Avatar({ name }: { name: string }) {
//     const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
//     const colors = ["bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"];
//     return (
//         <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0 ${colors[name.charCodeAt(0) % colors.length]}`}>
//             {initials}
//         </span>
//     );
// }

// function StatusBadge({ status }: { status: string }) {
//     const cfg: Record<string, string> = {
//         Active: "bg-green-50 text-green-700 border-green-200",
//         Inactive: "bg-muted text-muted-foreground border-border",
//     };
//     return (
//         <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border whitespace-nowrap ${cfg[status] || "bg-muted text-muted-foreground border-border"}`}>
//             {status}
//         </span>
//     );
// }

// function WarrantyBadge({ status }: { status: string }) {
//     const cfg: Record<string, string> = {
//         Expired: "bg-red-50 text-red-600 border-red-200",
//         Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
//         Valid: "bg-blue-50 text-blue-700 border-blue-200",
//     };
//     return (
//         <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border whitespace-nowrap ${cfg[status] || "bg-muted text-muted-foreground border-border"}`}>
//             {status}
//         </span>
//     );
// }

// /* ── Export ── */
// function exportCSV(rows: Claim[]) {
//     const headers = ["SL", "Reference", "Employee", "Device", "Serial", "Status", "Warranty", "Submitted"];
//     const csv = [headers, ...rows.map((r, i) => [i + 1, r.reference, r.employee, r.device, r.serial, r.status, r.warrantyStatus, r.submittedDate])]
//         .map(row => row.map(c => `"${c}"`).join(",")).join("\n");
//     const a = document.createElement("a");
//     a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
//     a.download = `warranty-claims-${new Date().toISOString().slice(0, 10)}.csv`;
//     a.click();
// }

// function exportPDF(rows: Claim[]) {
//     const trs = rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.reference}</td><td>${r.employee}</td><td>${r.device}</td><td>${r.serial}</td><td>${r.status}</td><td>${r.warrantyStatus}</td><td>${r.submittedDate}</td></tr>`).join("");
//     const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Warranty Claims</title>
//     <style>body{font-family:Arial,sans-serif;font-size:11px;padding:24px;color:#111}h2{font-size:16px;margin-bottom:4px}p{color:#666;font-size:10px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#f1f5f9;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;border-bottom:2px solid #e2e8f0}td{padding:7px 10px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}.footer{margin-top:20px;font-size:10px;color:#999;text-align:right}</style>
//     </head><body><h2>Warranty Claims Report</h2><p>Generated: ${new Date().toLocaleString()} · Total: ${rows.length}</p>
//     <table><thead><tr><th>#</th><th>Reference</th><th>Employee</th><th>Device</th><th>Serial</th><th>Status</th><th>Warranty</th><th>Submitted</th></tr></thead>
//     <tbody>${trs}</tbody></table><div class="footer">Fiber@Home Ltd. · ITM Portal</div></body></html>`;
//     const win = window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
//     win?.addEventListener("load", () => win.print());
// }

// /* ── View Modal ── */
// function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
//     return (
//         <div className="min-w-0">
//             <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
//             <p className={`text-[11px] font-semibold text-foreground mt-0.5 break-words ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
//         </div>
//     );
// }

// function ViewModal({ item, onClose }: { item: Claim; onClose: () => void }) {
//     return (
//         <DialogPrimitive.Root open onOpenChange={onClose}>
//             <DialogPrimitive.Portal>
//                 <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
//                 <DialogPrimitive.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[560px] max-h-[88vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-card border border-border">

//                     {/* Header */}
//                     <div className="shrink-0 bg-primary px-5 py-3.5 flex items-center justify-between">
//                         <div>
//                             <DialogPrimitive.Title className="text-sm font-semibold text-primary-foreground">
//                                 Warranty Claim Details
//                             </DialogPrimitive.Title>
//                             <p className="text-[11px] text-primary-foreground/70 mt-0.5">Ref: {item.reference}</p>
//                         </div>
//                         <DialogPrimitive.Close className="rounded-lg p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors">
//                             <X className="h-4 w-4" />
//                         </DialogPrimitive.Close>
//                     </div>

//                     {/* Body */}
//                     <div className="flex-1 overflow-y-auto p-5 space-y-3">

//                         {/* Employee */}
//                         <div className="rounded-xl border border-border overflow-hidden">
//                             <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
//                                 <Users className="h-3.5 w-3.5 text-muted-foreground" />
//                                 <p className="text-xs font-semibold text-foreground">Employee Information</p>
//                             </div>
//                             <div className="px-4 py-3 grid grid-cols-2 gap-3 bg-card">
//                                 <InfoField label="Employee Name" value={item.employee} />
//                                 <InfoField label="Reference" value={item.reference} />
//                             </div>
//                         </div>

//                         {/* Device */}
//                         <div className="rounded-xl border border-border overflow-hidden">
//                             <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
//                                 <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
//                                 <p className="text-xs font-semibold text-foreground">Device Information</p>
//                             </div>
//                             <div className="px-4 py-3 grid grid-cols-3 gap-3 bg-card">
//                                 <InfoField label="Device" value={item.device} />
//                                 <InfoField label="Serial No" value={item.serial} mono />
//                                 <InfoField label="Submitted" value={item.submittedDate} />
//                             </div>
//                         </div>

//                         {/* Status */}
//                         <div className="rounded-xl border border-border overflow-hidden">
//                             <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
//                                 <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
//                                 <p className="text-xs font-semibold text-foreground">Claim & Warranty Status</p>
//                             </div>
//                             <div className="px-4 py-3 bg-card grid grid-cols-2 gap-4">
//                                 <div>
//                                     <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Claim Status</p>
//                                     <StatusBadge status={item.status} />
//                                     <p className="text-[10px] text-muted-foreground mt-1.5">
//                                         {item.status === "Active" ? "Claim is currently active and being processed." : "Claim is inactive."}
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Warranty Status</p>
//                                     <WarrantyBadge status={item.warrantyStatus} />
//                                     <p className="text-[10px] text-muted-foreground mt-1.5">
//                                         {item.warrantyStatus === "Expired" ? "Device warranty has expired." : "Warranty is currently valid."}
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Footer */}
//                     <div className="shrink-0 px-5 py-3 border-t border-border bg-muted/40 flex justify-end">
//                         <button onClick={onClose} className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
//                             Close
//                         </button>
//                     </div>
//                 </DialogPrimitive.Content>
//             </DialogPrimitive.Portal>
//         </DialogPrimitive.Root>
//     );
// }

// /* ── Actions Dropdown ── */
// function ActionsDropdown({ item, onView, onServiceRequest, onInventoryReturn, onOwnership, onEdit, onDelete, onPrintPreview }: {
//     item: Claim;
//     onView: (i: Claim) => void;
//     onServiceRequest: (i: Claim) => void;
//     onInventoryReturn: (i: Claim) => void;
//     onOwnership: (i: Claim) => void;
//     onEdit: (i: Claim) => void;
//     onDelete: (id: number) => void;
//     onPrintPreview: (i: Claim) => void;
// }) {
//     const [open, setOpen] = useState(false);
//     const ref = useRef<HTMLDivElement>(null);
//     useEffect(() => {
//         const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
//         document.addEventListener("mousedown", h);
//         return () => document.removeEventListener("mousedown", h);
//     }, []);
//     const close = () => setOpen(false);
//     return (
//         <div ref={ref} className="relative inline-block">
//             <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-muted hover:bg-border rounded-lg border border-border transition text-foreground">
//                 Actions <ChevronDown size={11} />
//             </button>
//             {open && (
//                 <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
//                     <DropItem icon={<Eye size={12} />} label="View" color="text-blue-600" onClick={() => { onView(item); close(); }} />
//                     <DropItem icon={<Package size={12} />} label="Service Request" color="text-sky-600" onClick={() => { onServiceRequest(item); close(); }} />
//                     <DropItem icon={<RotateCcw size={12} />} label="Inventory Return" color="text-purple-600" onClick={() => { onInventoryReturn(item); close(); }} />
//                     <DropItem icon={<UserCheck size={12} />} label="Ownership" color="text-green-600" onClick={() => { onOwnership(item); close(); }} />
//                     <DropItem icon={<Pencil size={12} />} label="Edit" color="text-amber-600" onClick={() => { onEdit(item); close(); }} />
//                     <DropItem icon={<Printer size={12} />} label="Print Preview" color="text-slate-600" onClick={() => { onPrintPreview(item); close(); }} />
//                     <div className="border-t border-border my-1" />
//                     <DropItem icon={<Trash2 size={12} />} label="Delete" color="text-red-600" onClick={() => { onDelete(item.id); close(); }} />
//                 </div>
//             )}
//         </div>
//     );
// }

// function DropItem({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
//     return (
//         <button onClick={onClick} className={`flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium ${color} hover:bg-muted transition`}>
//             {icon} {label}
//         </button>
//     );
// }

// /* ── Main Page ── */
// export default function WarrantyClaimsPage() {
//     const [search, setSearch] = useState("");
//     const [activeStatus, setActiveStatus] = useState<string | null>(null);
//     const [viewItem, setViewItem] = useState<Claim | null>(null);

//     const filtered = claims.filter(item => {
//         const matchSearch = !search ||
//             item.reference.toLowerCase().includes(search.toLowerCase()) ||
//             item.employee.toLowerCase().includes(search.toLowerCase()) ||
//             item.device.toLowerCase().includes(search.toLowerCase());
//         const matchStatus = !activeStatus || item.status === activeStatus;
//         return matchSearch && matchStatus;
//     });

//     const activeCnt = claims.filter(c => c.status === "Active").length;
//     const expiredCnt = claims.filter(c => c.warrantyStatus === "Expired").length;

//     const stats = [
//         { label: "Total Claims", value: claims.length, color: "text-foreground", bg: "bg-muted border-border", icon: <ShieldCheck size={14} />, status: null },
//         { label: "Active Claims", value: activeCnt, color: "text-green-700", bg: "bg-green-50 border-green-100", icon: <CheckCircle2 size={14} />, status: "Active" },
//         { label: "Expired Warranty", value: expiredCnt, color: "text-red-700", bg: "bg-red-50 border-red-100", icon: <AlertCircle size={14} />, status: null },
//     ];

//     return (
//         <div className="p-4 sm:p-6 space-y-4">

//             {/* Header */}
//             <div className="bg-card border border-border rounded-2xl p-5">
//                 <div className="flex flex-wrap items-start justify-between gap-3">
//                     <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
//                             <ShieldCheck className="w-5 h-5 text-emerald-600" />
//                         </div>
//                         <div>
//                             <h1 className="text-sm font-bold text-foreground">Warranty Claims</h1>
//                             <p className="text-xs text-muted-foreground mt-0.5">Manage and monitor all warranty claim requests</p>
//                         </div>
//                     </div>
//                     <div className="flex gap-2">
//                         <button onClick={() => exportCSV(filtered)}
//                             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition">
//                             <FileSpreadsheet size={13} /> Excel
//                         </button>
//                         <button onClick={() => exportPDF(filtered)}
//                             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition">
//                             <FileText size={13} /> PDF
//                         </button>
//                     </div>
//                 </div>

//                 <div className="mt-4 grid grid-cols-3 gap-3">
//                     {stats.map(s => (
//                         <button key={s.label}
//                             onClick={() => s.status !== null && setActiveStatus(activeStatus === s.status ? null : s.status)}
//                             className={`rounded-xl border px-4 py-3 text-left transition ${s.status !== null ? "ring-2 hover:opacity-80" : "cursor-default"} ${s.bg} ${activeStatus === s.status && s.status !== null ? "ring-primary" : "ring-transparent"}`}
//                         >
//                             <div className="flex items-center justify-between">
//                                 <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
//                                 <span className={`${s.color} opacity-50`}>{s.icon}</span>
//                             </div>
//                             <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
//                         </button>
//                     ))}
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="bg-card border border-border rounded-xl overflow-hidden">
//                 <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-border gap-2">
//                     <div className="flex items-center gap-2 flex-wrap">
//                         <p className="text-[11px] text-muted-foreground">
//                             Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {claims.length} entries
//                         </p>
//                         {activeStatus && (
//                             <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
//                                 {activeStatus} <button onClick={() => setActiveStatus(null)}><X size={10} /></button>
//                             </span>
//                         )}
//                     </div>
//                     <div className="relative">
//                         <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
//                         <Input placeholder="Search reference, employee, device..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 w-56 text-xs" />
//                     </div>
//                 </div>

//                 <div className="overflow-x-auto">
//                     <table className="w-full min-w-[700px]">
//                         <thead className="bg-muted/50 border-b border-border">
//                             <tr>
//                                 {["#", "Reference", "Employee", "Device", "Serial", "Submitted", "Status", "Warranty", "Actions"].map(col => (
//                                     <th key={col} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
//                                         {col}
//                                     </th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-border/50">
//                             {filtered.map((item, i) => (
//                                 <tr key={item.id} className="hover:bg-muted/30 transition-colors">
//                                     <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{i + 1}</td>
//                                     <td className="px-3 py-2.5">
//                                         <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{item.reference}</span>
//                                     </td>
//                                     <td className="px-3 py-2.5">
//                                         <div className="flex items-center gap-2">
//                                             <Avatar name={item.employee} />
//                                             <span className="text-[11px] text-foreground font-medium whitespace-nowrap">{item.employee}</span>
//                                         </div>
//                                     </td>
//                                     <td className="px-3 py-2.5 text-[11px] text-foreground font-medium">{item.device}</td>
//                                     <td className="px-3 py-2.5 text-[11px] text-muted-foreground font-mono">{item.serial}</td>
//                                     <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">{item.submittedDate}</td>
//                                     <td className="px-3 py-2.5"><StatusBadge status={item.status} /></td>
//                                     <td className="px-3 py-2.5"><WarrantyBadge status={item.warrantyStatus} /></td>
//                                     <td className="px-3 py-2.5">
//                                         <ActionsDropdown
//                                             item={item}
//                                             onView={setViewItem}
//                                             onServiceRequest={i => console.log("Service", i)}
//                                             onInventoryReturn={i => console.log("Return", i)}
//                                             onOwnership={i => console.log("Ownership", i)}
//                                             onEdit={i => console.log("Edit", i)}
//                                             onDelete={id => console.log("Delete", id)}
//                                             onPrintPreview={i => console.log("Print", i)}
//                                         />
//                                     </td>
//                                 </tr>
//                             ))}
//                             {filtered.length === 0 && (
//                                 <tr><td colSpan={9} className="py-8 text-center text-xs text-muted-foreground">No records match your search.</td></tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//             {viewItem && <ViewModal item={viewItem} onClose={() => setViewItem(null)} />}
//         </div>
//     );
// }



// app/dashboard/service-warranty/warranty-claims/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
    Search, FileSpreadsheet, FileText, ShieldCheck, Package,
    RotateCcw, UserCheck, Pencil, Trash2, Printer, ChevronDown,
    Eye, X, Monitor, CheckCircle2, Users, AlertCircle
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { AssignedDevice } from "@/models/AssignedDevice";

// Warranty-relevant statuses from static data
const WARRANTY_STATUSES = ["Claimed", "To Vendor", "Tranferred to Vendor", "Recovered", "Expired"];

// Pull only warranty-related records from the shared dataset
const warrantyData = [].filter(d => WARRANTY_STATUSES.includes(d.status));

// Status display config
const statusCfg: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    "Claimed": { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: <Package size={10} /> },
    "To Vendor": { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", icon: <RotateCcw size={10} /> },
    "Tranferred to Vendor": { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", icon: <RotateCcw size={10} /> },
    "Recovered": { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: <CheckCircle2 size={10} /> },
    "Expired": { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: <AlertCircle size={10} /> },
};

// Stats cards — "To Vendor" groups both To Vendor + Tranferred to Vendor
const STAT_CARDS = [
    { key: null, label: "Total", color: "text-foreground", bg: "bg-muted border-border", icon: <ShieldCheck size={14} /> },
    { key: "Claimed", label: "Claimed", color: "text-orange-700", bg: "bg-orange-50 border-orange-100", icon: <Package size={14} /> },
    { key: "To Vendor", label: "To Vendor", color: "text-violet-700", bg: "bg-violet-50 border-violet-100", icon: <RotateCcw size={14} /> },
    { key: "Recovered", label: "Recovered", color: "text-blue-700", bg: "bg-blue-50 border-blue-100", icon: <CheckCircle2 size={14} /> },
    { key: "Expired", label: "Expired", color: "text-red-700", bg: "bg-red-50 border-red-100", icon: <AlertCircle size={14} /> },
];

function getCount(key: string | null): number {
    if (!key) return warrantyData.length;
    if (key === "To Vendor") return warrantyData.filter(d => d.status === "To Vendor" || d.status === "Tranferred to Vendor").length;
    return warrantyData.filter(d => d.status === key).length;
}

function Avatar({ name }: { name: string }) {
    const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    const colors = ["bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"];
    return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0 ${colors[name.charCodeAt(0) % colors.length]}`}>{initials}</span>;
}

function StatusBadge({ status }: { status: string }) {
    const cfg = statusCfg[status] || { color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.color} ${cfg.border}`}>{status}</span>;
}

function exportCSV(rows: AssignedDevice[]) {
    const headers = ["SL", "Reference", "Employee", "Dept", "Category", "Status", "Warranty", "Vendor", "Assigned Date"];
    const csv = [headers, ...rows.map((r, i) => [i + 1, r.referenceNumber, r.employeeName, r.department, r.category, r.status, r.warranty, r.vendor, r.assignedDate])]
        .map(row => row.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `warranty-claims-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
}

function exportPDF(rows: AssignedDevice[]) {
    const trs = rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.referenceNumber}</td><td>${r.employeeName}</td><td>${r.department}</td><td>${r.category}</td><td>${r.status}</td><td>${r.warranty}</td><td>${r.vendor}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Warranty Claims</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;padding:24px}table{width:100%;border-collapse:collapse}th{background:#f1f5f9;text-align:left;padding:8px;font-size:10px;text-transform:uppercase;border-bottom:2px solid #e2e8f0}td{padding:7px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}</style>
    </head><body><h2>Warranty Claims Report</h2><p style="color:#666;font-size:10px">Generated: ${new Date().toLocaleString()} · ${rows.length} records</p>
    <table><thead><tr><th>#</th><th>Reference</th><th>Employee</th><th>Dept</th><th>Category</th><th>Status</th><th>Warranty</th><th>Vendor</th></tr></thead>
    <tbody>${trs}</tbody></table></body></html>`;
    const win = window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
    win?.addEventListener("load", () => win.print());
}

function InfoField({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
    return (
        <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`text-[11px] font-semibold text-foreground mt-0.5 break-words ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
        </div>
    );
}

function ViewModal({ item, onClose }: { item: AssignedDevice; onClose: () => void }) {
    return (
        <DialogPrimitive.Root open onOpenChange={onClose}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                <DialogPrimitive.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[560px] max-h-[88vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-card border border-border">
                    <div className="shrink-0 bg-primary px-5 py-3.5 flex items-center justify-between">
                        <div>
                            <DialogPrimitive.Title className="text-sm font-semibold text-primary-foreground">Warranty Claim Details</DialogPrimitive.Title>
                            <p className="text-[11px] text-primary-foreground/70 mt-0.5">Ref: {item.referenceNumber}</p>
                        </div>
                        <DialogPrimitive.Close className="rounded-lg p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"><X className="h-4 w-4" /></DialogPrimitive.Close>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border"><Users className="h-3.5 w-3.5 text-muted-foreground" /><p className="text-xs font-semibold text-foreground">Employee</p></div>
                            <div className="px-4 py-3 grid grid-cols-3 gap-3 bg-card">
                                <InfoField label="Name" value={item.employeeName} />
                                <InfoField label="ID" value={item.employeeId} />
                                <InfoField label="Dept" value={item.department} />
                                <InfoField label="Designation" value={item.designation} />
                            </div>
                        </div>
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border"><Monitor className="h-3.5 w-3.5 text-muted-foreground" /><p className="text-xs font-semibold text-foreground">Device</p></div>
                            <div className="px-4 py-3 grid grid-cols-3 gap-3 bg-card">
                                <InfoField label="Category" value={item.category} />
                                <InfoField label="Model" value={item.model} />
                                <InfoField label="Serial" value={item.deviceSl} mono />
                                <InfoField label="Vendor" value={item.vendor} />
                                <InfoField label="Warranty" value={item.warranty} />
                                <InfoField label="Device Age" value={item.deviceAge} />
                            </div>
                        </div>
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border"><CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" /><p className="text-xs font-semibold text-foreground">Status</p></div>
                            <div className="px-4 py-3 bg-card flex items-center gap-3">
                                <StatusBadge status={item.status} />
                                <p className="text-[10px] text-muted-foreground">{item.remarks}</p>
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 px-5 py-3 border-t border-border bg-muted/40 flex justify-end">
                        <button onClick={onClose} className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">Close</button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function ActionsDropdown({ item, onView, onEdit, onDelete }: {
    item: AssignedDevice; onView: (i: AssignedDevice) => void; onEdit: (i: AssignedDevice) => void; onDelete: (id: number) => void;
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
                <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    <button onClick={() => { onView(item); close(); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium text-blue-600 hover:bg-muted transition"><Eye size={12} /> View</button>
                    <button onClick={() => { onEdit(item); close(); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium text-amber-600 hover:bg-muted transition"><Pencil size={12} /> Edit</button>
                    <button onClick={() => console.log("Print", item)} className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-muted transition"><Printer size={12} /> Print</button>
                    <div className="border-t border-border my-1" />
                    <button onClick={() => { onDelete(item.sl); close(); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-muted transition"><Trash2 size={12} /> Delete</button>
                </div>
            )}
        </div>
    );
}

export default function WarrantyClaimsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlStatus = searchParams.get("status");

    const [search, setSearch] = useState("");
    const [activeStatus, setActiveStatus] = useState<string | null>(urlStatus);
    const [viewItem, setViewItem] = useState<AssignedDevice | null>(null);

    useEffect(() => { setActiveStatus(urlStatus); }, [urlStatus]);

    const handleStatusClick = (key: string | null) => {
        const next = activeStatus === key ? null : key;
        setActiveStatus(next);
        router.push(next
            ? `/dashboard/service-warranty/warranty-claims?status=${encodeURIComponent(next)}`
            : "/dashboard/service-warranty/warranty-claims"
        );
    };

    const filtered = warrantyData.filter(item => {
        const matchSearch = !search ||
            item.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
            item.employeeName.toLowerCase().includes(search.toLowerCase()) ||
            item.category.toLowerCase().includes(search.toLowerCase()) ||
            item.department.toLowerCase().includes(search.toLowerCase());

        // "To Vendor" filter covers both "To Vendor" AND "Tranferred to Vendor"
        const matchStatus = !activeStatus ||
            (activeStatus === "To Vendor"
                ? item.status === "To Vendor" || item.status === "Tranferred to Vendor"
                : item.status === activeStatus);

        return matchSearch && matchStatus;
    });

    return (
        <div className="p-4 sm:p-6 space-y-4">

            {/* Header */}
            <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-foreground">Warranty Claims</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {activeStatus ? `Showing: ${activeStatus}` : "All warranty claim records"}
                            </p>
                        </div>
                        {activeStatus && (
                            <button onClick={() => handleStatusClick(null)}
                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition">
                                <X size={10} /> Clear
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => exportCSV(filtered)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition">
                            <FileSpreadsheet size={13} /> Excel
                        </button>
                        <button onClick={() => exportPDF(filtered)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition">
                            <FileText size={13} /> PDF
                        </button>
                    </div>
                </div>

                {/* Clickable stat cards */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {STAT_CARDS.map(s => {
                        const count = getCount(s.key);
                        const isActive = activeStatus === s.key && s.key !== null;
                        return (
                            <button key={s.label}
                                onClick={() => s.key !== null && handleStatusClick(s.key)}
                                className={`rounded-xl border px-3 py-3 text-left transition ${s.key ? "ring-2 hover:opacity-80 cursor-pointer" : "cursor-default"} ${s.bg} ${isActive ? "ring-primary" : "ring-transparent"}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">{s.label}</p>
                                    <span className={`${s.color} opacity-50`}>{s.icon}</span>
                                </div>
                                <p className={`text-xl font-bold ${s.color}`}>{count}</p>
                                {isActive && <p className="text-[9px] text-muted-foreground mt-0.5">Active ✓</p>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-border gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {warrantyData.length} records
                            {activeStatus && <span className="ml-1">· <span className="text-primary font-medium">{activeStatus}</span></span>}
                        </p>
                        {activeStatus && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                                {activeStatus} <button onClick={() => handleStatusClick(null)}><X size={10} /></button>
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input placeholder="Search name, ref, category..." value={search}
                            onChange={e => setSearch(e.target.value)} className="pl-7 h-7 w-56 text-xs" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                {["#", "Reference", "Employee", "Dept", "Category", "Warranty", "Status", "Vendor", "Actions"].map(col => (
                                    <th key={col} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filtered.map((item, i) => (
                                <tr key={item.referenceNumber + i} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{i + 1}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{item.referenceNumber}</span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <Avatar name={item.employeeName} />
                                            <span className="text-[11px] text-foreground font-medium whitespace-nowrap">{item.employeeName}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{item.department}</td>
                                    <td className="px-3 py-2.5 text-[11px] text-foreground font-medium">{item.category}</td>
                                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{item.warranty}</td>
                                    <td className="px-3 py-2.5"><StatusBadge status={item.status} /></td>
                                    <td className="px-3 py-2.5 text-[11px] text-foreground whitespace-nowrap">{item.vendor}</td>
                                    <td className="px-3 py-2.5">
                                        <ActionsDropdown item={item} onView={setViewItem}
                                            onEdit={i => console.log("Edit", i)}
                                            onDelete={id => console.log("Delete", id)} />
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={9} className="py-8 text-center text-xs text-muted-foreground">
                                    No records match your filter.
                                    {activeStatus && <button onClick={() => handleStatusClick(null)} className="ml-2 text-primary hover:underline">Clear filter</button>}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewItem && <ViewModal item={viewItem} onClose={() => setViewItem(null)} />}
        </div>
    );
}
