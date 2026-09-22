
// //frontend/app/dashboard/vendors/page.tsx
// "use client";

// import {
//     useEffect,
//     useMemo,
//     useState,
// } from "react";

// import {
//     Check,
//     ChevronDown,
//     LoaderCircle,
//     LockKeyhole,
//     Plus,
//     Search,
//     Tags,
//     X,
// } from "lucide-react";

// import { api } from "@/lib/api";
// import { Button } from "@/components/ui/button";

// type VendorType = {
//     id: number;
//     code: string;
//     name: string;
//     status: number;
// };

// type VendorOwnership = {
//     id: number;
//     code: string;
//     name: string;
//     editable_by_it: boolean;
//     status: number;
// };

// type Vendor = {
//     id: number;
//     vendor_code: string;
//     vendor_name: string;
//     vendor_ownership_id: number;
//     vendor_ownership_code: string;
//     vendor_ownership_name: string;
//     vendor_editable: boolean;
//     contact_person: string;
//     mobile: string;
//     email: string;
//     address: string;
//     status: number;
//     vendor_type_ids: number[];
//     vendor_types: string[];
// };

// type VendorForm = {
//     id: number | null;
//     vendor_name: string;
//     contact_person: string;
//     mobile: string;
//     email: string;
//     address: string;
//     vendor_type_ids: number[];
// };

// const emptyForm: VendorForm = {
//     id: null,
//     vendor_name: "",
//     contact_person: "",
//     mobile: "",
//     email: "",
//     address: "",
//     vendor_type_ids: [],
// };

// export default function VendorMasterPage() {
//     const [types, setTypes] =
//         useState<VendorType[]>([]);
//     const [ownerships, setOwnerships] =
//         useState<VendorOwnership[]>([]);
//     const [vendors, setVendors] =
//         useState<Vendor[]>([]);
//     const [search, setSearch] =
//         useState("");
//     const [typeFilter, setTypeFilter] =
//         useState<number | "all">("all");
//     const [ownershipFilter, setOwnershipFilter] =
//         useState<number | "all">("all");
//     const [loading, setLoading] =
//         useState(true);
//     const [saving, setSaving] =
//         useState(false);
//     const [open, setOpen] =
//         useState(false);
//     const [form, setForm] =
//         useState<VendorForm>(emptyForm);
//     const [error, setError] =
//         useState("");
//     const [saveError, setSaveError] =
//         useState("");

//     async function load() {
//         try {
//             setLoading(true);
//             setError("");

//             const [
//                 typeResponse,
//                 ownershipResponse,
//                 vendorResponse,
//             ] = await Promise.all([
//                 api.get<{
//                     success: boolean;
//                     data: VendorType[];
//                 }>("/vendors/master/types"),
//                 api.get<{
//                     success: boolean;
//                     data: VendorOwnership[];
//                 }>("/vendors/master/ownerships"),
//                 api.get<{
//                     success: boolean;
//                     data: Vendor[];
//                 }>(
//                     `/vendors/master?search=${encodeURIComponent(
//                         search.trim()
//                     )}`
//                 ),
//             ]);

//             setTypes(
//                 typeResponse.data ?? []
//             );
//             setOwnerships(
//                 ownershipResponse.data ?? []
//             );
//             setVendors(
//                 [...(vendorResponse.data ?? [])].sort(
//                     (a, b) => b.id - a.id
//                 )
//             );
//         } catch (reason) {
//             const message =
//                 reason instanceof Error
//                     ? reason.message
//                     : "Unable to load Vendor Master.";

//             setError(
//                 message.toLowerCase().includes("route not found")
//                     ? "Vendor Master backend routes are not registered yet. Apply PATCHES/01_REQUIRED_HANDLER_ROUTES.txt, rebuild the Go API, and restart the backend."
//                     : message
//             );
//         } finally {
//             setLoading(false);
//         }
//     }

//     useEffect(() => {
//         const timer = window.setTimeout(
//             () => void load(),
//             300
//         );

//         return () =>
//             window.clearTimeout(timer);
//     }, [search]);

//     const activeCount = useMemo(
//         () =>
//             vendors.filter(
//                 (vendor) =>
//                     vendor.status === 1
//             ).length,
//         [vendors]
//     );

//     const filteredVendors = useMemo(
//         () =>
//             vendors.filter((vendor) => {
//                 const ownershipMatches =
//                     ownershipFilter === "all" ||
//                     vendor.vendor_ownership_id ===
//                     ownershipFilter;

//                 const typeMatches =
//                     typeFilter === "all" ||
//                     vendor.vendor_type_ids.includes(
//                         typeFilter
//                     );

//                 return (
//                     ownershipMatches &&
//                     typeMatches
//                 );
//             }),
//         [
//             vendors,
//             ownershipFilter,
//             typeFilter,
//         ]
//     );

//     const unclassifiedCount = useMemo(
//         () =>
//             vendors.filter(
//                 (vendor) =>
//                     vendor.vendor_type_ids.length === 0
//             ).length,
//         [vendors]
//     );

//     function openNew() {
//         setForm(emptyForm);
//         setError("");
//         setSaveError("");
//         setOpen(true);
//     }

//     function editVendor(vendor: Vendor) {
//         if (!vendor.vendor_editable) {
//             setError(
//                 `${vendor.vendor_ownership_name} vendors are read-only in ITM. Update this vendor in the source system.`
//             );
//             return;
//         }

//         setSaveError("");
//         setForm({
//             id: vendor.id,
//             vendor_name:
//                 vendor.vendor_name,
//             contact_person:
//                 vendor.contact_person ?? "",
//             mobile: vendor.mobile ?? "",
//             email: vendor.email ?? "",
//             address:
//                 vendor.address ?? "",
//             vendor_type_ids:
//                 vendor.vendor_type_ids ??
//                 [],
//         });
//         setError("");
//         setOpen(true);
//     }

//     function toggleType(id: number) {
//         setForm((current) => ({
//             ...current,
//             vendor_type_ids:
//                 current.vendor_type_ids.includes(
//                     id
//                 )
//                     ? current.vendor_type_ids.filter(
//                         (value) =>
//                             value !== id
//                     )
//                     : [
//                         ...current.vendor_type_ids,
//                         id,
//                     ],
//         }));
//     }

//     async function save() {
//         if (!form.vendor_name.trim()) {
//             setError(
//                 "Vendor Name is required."
//             );
//             return;
//         }

//         if (
//             form.vendor_type_ids.length ===
//             0
//         ) {
//             setError(
//                 "Select at least one Vendor Type."
//             );
//             return;
//         }

//         try {
//             setSaving(true);
//             setError("");
//             setSaveError("");

//             const body = {
//                 vendor_name:
//                     form.vendor_name.trim(),
//                 contact_person:
//                     form.contact_person.trim(),
//                 mobile: form.mobile.trim(),
//                 email: form.email.trim(),
//                 address:
//                     form.address.trim(),
//                 vendor_type_ids:
//                     form.vendor_type_ids,
//             };

//             if (form.id) {
//                 await api.put(
//                     `/vendors/master/${form.id}`,
//                     body
//                 );
//             } else {
//                 await api.post(
//                     "/vendors/master",
//                     body
//                 );
//             }

//             setOpen(false);
//             setForm(emptyForm);
//             await load();
//         } catch (reason) {
//             setSaveError(
//                 reason instanceof Error
//                     ? reason.message
//                     : "Unable to save vendor."
//             );
//         } finally {
//             setSaving(false);
//         }
//     }

//     return (
//         <div className="mx-auto w-full max-w-[1680px] space-y-4 p-4 sm:p-5 lg:p-6">
//             <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
//                 <div className="flex min-w-0 items-start gap-3">
//                     <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-primary">
//                         <Tags className="h-4 w-4" />
//                     </div>

//                     <div className="min-w-0">
//                         <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
//                             Vendor Management
//                         </h1>
//                         <p className="mt-1 max-w-4xl text-[11px] leading-5 text-muted-foreground sm:text-xs">
//                             Central vendor directory with ownership, vendor type, contact and status information.
//                         </p>
//                     </div>
//                 </div>

//                 <Button
//                     onClick={openNew}
//                     className="h-10 shrink-0 gap-2 px-4 shadow-sm"
//                 >
//                     <Plus className="h-4 w-4" />
//                     Add Vendor
//                 </Button>
//             </div>

//             {error && (
//                 <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
//                     {error}
//                 </div>
//             )}

//             <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//                 <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
//                     <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
//                         Total Vendors
//                     </p>
//                     <div className="mt-2 flex items-end justify-between gap-3">
//                         <p className="text-xl font-bold tracking-tight">
//                             {vendors.length}
//                         </p>
//                         <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
//                             {activeCount} active
//                         </span>
//                     </div>
//                 </div>

//                 <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-sm">
//                     <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-700">
//                         SCM Managed
//                     </p>
//                     <p className="mt-1.5 text-xl font-bold tracking-tight text-blue-700">
//                         {vendors.filter((vendor) => !vendor.vendor_editable).length}
//                     </p>
//                     <p className="mt-1 text-[9px] text-blue-700/70">
//                         Source-controlled vendors
//                     </p>
//                 </div>

//                 <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3.5 shadow-sm">
//                     <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-violet-700">
//                         IT Managed
//                     </p>
//                     <p className="mt-1.5 text-xl font-bold tracking-tight text-violet-700">
//                         {vendors.filter((vendor) => vendor.vendor_editable).length}
//                     </p>
//                     <p className="mt-1 text-[9px] text-violet-700/70">
//                         Editable by IT
//                     </p>
//                 </div>

//                 <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 shadow-sm">
//                     <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
//                         Search Result
//                     </p>
//                     <p className="mt-1.5 text-xl font-bold tracking-tight text-primary">
//                         {filteredVendors.length}
//                     </p>
//                     <p className="mt-1 text-[9px] text-muted-foreground">
//                         Matching current search & filters
//                     </p>
//                 </div>
//             </div>

//             <div className="rounded-2xl border border-border bg-card shadow-sm">
//                 <div className="border-b border-border p-4">
//                     <div className="rounded-xl border border-primary/20 bg-background p-3.5 shadow-sm sm:p-4">
//                         <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
//                             <div className="w-full lg:max-w-4xl">
//                                 <div className="mb-2">
//                                     <p className="text-xs font-bold text-foreground">
//                                         Search Vendor Directory
//                                     </p>
//                                     <p className="mt-0.5 text-[10px] text-muted-foreground">
//                                         Search by vendor name, vendor code, ownership, mobile or email.
//                                     </p>
//                                 </div>

//                                 <div className="relative">
//                                     <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-primary" />
//                                     <input
//                                         autoFocus
//                                         value={search}
//                                         onChange={(event) =>
//                                             setSearch(
//                                                 event.target.value
//                                             )
//                                         }
//                                         placeholder="Type vendor name, code, mobile, email or ownership..."
//                                         aria-label="Search vendors"
//                                         className="h-11 w-full rounded-xl border border-primary/30 bg-background pl-11 pr-11 text-sm font-medium shadow-sm outline-none transition placeholder:font-normal placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
//                                     />

//                                     {search && (
//                                         <button
//                                             type="button"
//                                             onClick={() =>
//                                                 setSearch("")
//                                             }
//                                             title="Clear search"
//                                             className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
//                                         >
//                                             <X className="h-3.5 w-3.5" />
//                                         </button>
//                                     )}
//                                 </div>
//                             </div>

//                             <div className="shrink-0 rounded-xl border border-border bg-muted/25 px-4 py-3">
//                                 <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
//                                     Results
//                                 </p>
//                                 <p className="mt-1 text-lg font-bold text-foreground">
//                                     {filteredVendors.length}
//                                     <span className="ml-1 text-[10px] font-medium text-muted-foreground">
//                                         / {vendors.length}
//                                     </span>
//                                 </p>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="mt-3 rounded-xl border border-border bg-background p-3">
//                         <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
//                             Ownership Category
//                         </p>

//                         <div className="flex flex-wrap items-center gap-2">
//                             <button
//                                 type="button"
//                                 onClick={() =>
//                                     setOwnershipFilter("all")
//                                 }
//                                 className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${ownershipFilter === "all"
//                                     ? "border-primary/40 bg-primary/10 text-primary"
//                                     : "border-border bg-background text-muted-foreground hover:bg-muted"
//                                     }`}
//                             >
//                                 All Ownership · {vendors.length}
//                             </button>

//                             {ownerships.map((ownership) => {
//                                 const count =
//                                     vendors.filter(
//                                         (vendor) =>
//                                             vendor.vendor_ownership_id ===
//                                             ownership.id
//                                     ).length;

//                                 return (
//                                     <button
//                                         key={ownership.id}
//                                         type="button"
//                                         onClick={() =>
//                                             setOwnershipFilter(
//                                                 ownership.id
//                                             )
//                                         }
//                                         className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${ownershipFilter ===
//                                             ownership.id
//                                             ? ownership.editable_by_it
//                                                 ? "border-violet-300 bg-violet-50 text-violet-700"
//                                                 : "border-blue-300 bg-blue-50 text-blue-700"
//                                             : "border-border bg-background text-muted-foreground hover:bg-muted"
//                                             }`}
//                                     >
//                                         {ownership.name} · {count}
//                                     </button>
//                                 );
//                             })}
//                         </div>

//                         <p className="mb-2 mt-4 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                             Vendor Type
//                         </p>

//                         <div className="flex flex-wrap items-center gap-2">
//                             <button
//                                 type="button"
//                                 onClick={() =>
//                                     setTypeFilter("all")
//                                 }
//                                 className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${typeFilter === "all"
//                                     ? "border-primary/40 bg-primary/10 text-primary"
//                                     : "border-border bg-background text-muted-foreground hover:bg-muted"
//                                     }`}
//                             >
//                                 All Vendors · {vendors.length}
//                             </button>

//                             {types.map((type) => {
//                                 const count =
//                                     vendors.filter((vendor) =>
//                                         vendor.vendor_type_ids.includes(
//                                             type.id
//                                         )
//                                     ).length;

//                                 return (
//                                     <button
//                                         key={type.id}
//                                         type="button"
//                                         onClick={() =>
//                                             setTypeFilter(type.id)
//                                         }
//                                         className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${typeFilter === type.id
//                                             ? "border-primary/40 bg-primary/10 text-primary"
//                                             : "border-border bg-background text-muted-foreground hover:bg-muted"
//                                             }`}
//                                     >
//                                         {type.name} · {count}
//                                     </button>
//                                 );
//                             })}

//                             {unclassifiedCount > 0 && (
//                                 <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
//                                     Unclassified · {unclassifiedCount}
//                                 </span>
//                             )}
//                         </div>
//                     </div>
//                 </div>

//                 <div className="max-h-[62vh] overflow-y-auto overflow-x-hidden">
//                     <table className="w-full table-fixed text-[12px]">
//                         <colgroup>
//                             <col className="w-[4%]" />
//                             <col className="w-[10%]" />
//                             <col className="w-[29%]" />
//                             <col className="w-[12%]" />
//                             <col className="w-[16%]" />
//                             <col className="w-[12%]" />
//                             <col className="w-[8%]" />
//                             <col className="w-[9%]" />
//                         </colgroup>

//                         <thead className="sticky top-0 z-10 bg-muted/95 text-left text-[9px] font-bold uppercase tracking-[0.06em] text-muted-foreground backdrop-blur">
//                             <tr>
//                                 <th className="w-[64px] px-2 py-2 text-center">
//                                     SL
//                                 </th>
//                                 <th className="px-2.5 py-2">
//                                     Vendor Code
//                                 </th>
//                                 <th className="px-2.5 py-2">
//                                     Vendor
//                                 </th>
//                                 <th className="px-2.5 py-2">
//                                     Ownership
//                                 </th>
//                                 <th className="px-2.5 py-2">
//                                     Types
//                                 </th>
//                                 <th className="px-2.5 py-2">
//                                     Contact
//                                 </th>
//                                 <th className="px-2.5 py-2">
//                                     Status
//                                 </th>
//                                 <th className="px-2.5 py-2 text-right">
//                                     Action
//                                 </th>
//                             </tr>
//                         </thead>

//                         <tbody>
//                             {loading ? (
//                                 <tr>
//                                     <td
//                                         colSpan={8}
//                                         className="px-4 py-10 text-center"
//                                     >
//                                         <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-primary" />
//                                     </td>
//                                 </tr>
//                             ) : filteredVendors.length ===
//                                 0 ? (
//                                 <tr>
//                                     <td
//                                         colSpan={8}
//                                         className="px-4 py-10 text-center text-sm text-muted-foreground"
//                                     >
//                                         No vendors found.
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 filteredVendors.map(
//                                     (vendor, index) => (
//                                         <tr
//                                             key={
//                                                 vendor.id
//                                             }
//                                             className="border-t border-border transition-colors hover:bg-muted/25"
//                                         >
//                                             <td className="px-2 py-2 text-center text-[11px] font-semibold tabular-nums text-muted-foreground">
//                                                 {index + 1}
//                                             </td>
//                                             <td className="px-2.5 py-2 font-mono text-[11px] font-bold">
//                                                 {
//                                                     vendor.vendor_code
//                                                 }
//                                             </td>
//                                             <td className="px-2.5 py-2">
//                                                 <p className="truncate font-semibold text-foreground" title={vendor.vendor_name}>
//                                                     {
//                                                         vendor.vendor_name
//                                                     }
//                                                 </p>
//                                                 <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
//                                                     {vendor.address ||
//                                                         "—"}
//                                                 </p>
//                                             </td>
//                                             <td className="px-2.5 py-2">
//                                                 {vendor.vendor_editable ? (
//                                                     <span className="inline-flex max-w-full rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[8px] font-semibold leading-3 text-violet-700">
//                                                         {vendor.vendor_ownership_name}
//                                                     </span>
//                                                 ) : (
//                                                     <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[8px] font-semibold leading-3 text-blue-700">
//                                                         <LockKeyhole className="h-3 w-3" />
//                                                         {vendor.vendor_ownership_name}
//                                                     </span>
//                                                 )}
//                                             </td>

//                                             <td className="px-2.5 py-2">
//                                                 <div className="flex max-w-full flex-wrap gap-1 overflow-hidden">
//                                                     {vendor.vendor_types.length > 0 ? (
//                                                         vendor.vendor_types.map(
//                                                             (type) => (
//                                                                 <span
//                                                                     key={type}
//                                                                     className="max-w-full truncate rounded-full border border-border bg-muted px-1.5 py-0.5 text-[8px]"
//                                                                 >
//                                                                     {type}
//                                                                 </span>
//                                                             )
//                                                         )
//                                                     ) : (
//                                                         <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[8px] font-semibold text-amber-700">
//                                                             Unclassified
//                                                         </span>
//                                                     )}
//                                                 </div>
//                                             </td>
//                                             <td className="px-2.5 py-2 text-[11px]">
//                                                 <p className="truncate">
//                                                     {vendor.contact_person ||
//                                                         "—"}
//                                                 </p>
//                                                 <p className="truncate text-muted-foreground">
//                                                     {vendor.mobile ||
//                                                         vendor.email ||
//                                                         "—"}
//                                                 </p>
//                                             </td>
//                                             <td className="px-2.5 py-2">
//                                                 <span
//                                                     className={`inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-semibold ${vendor.status ===
//                                                         1
//                                                         ? "border-emerald-200 bg-emerald-50 text-emerald-700"
//                                                         : "border-slate-200 bg-slate-50 text-slate-500"
//                                                         }`}
//                                                 >
//                                                     {vendor.status ===
//                                                         1
//                                                         ? "Active"
//                                                         : "Inactive"}
//                                                 </span>
//                                             </td>
//                                             <td className="px-2.5 py-2 text-right">
//                                                 {!vendor.vendor_editable ? (
//                                                     <span
//                                                         title={`${vendor.vendor_ownership_name} is read-only in ITM.`}
//                                                         className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-1 text-[8px] font-semibold text-muted-foreground"
//                                                     >
//                                                         <LockKeyhole className="h-3 w-3" />
//                                                         Locked
//                                                     </span>
//                                                 ) : (
//                                                     <Button
//                                                         size="sm"
//                                                         variant="outline"
//                                                         className="h-7 px-2 text-[10px]"
//                                                         onClick={() =>
//                                                             editVendor(
//                                                                 vendor
//                                                             )
//                                                         }
//                                                     >
//                                                         Edit
//                                                     </Button>
//                                                 )}
//                                             </td>
//                                         </tr>
//                                     )
//                                 )
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//             {open && (
//                 <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
//                     <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-black/5">
//                         <div className="flex items-center justify-between border-b border-border bg-muted/20 px-5 py-4">
//                             <div>
//                                 <h2 className="font-bold">
//                                     {form.id
//                                         ? "Edit Vendor"
//                                         : "Add Vendor"}
//                                 </h2>
//                                 <p className="mt-1 text-[10px] text-muted-foreground">
//                                     New vendors created here are IT Managed. SCM vendors are synchronized from SCM and remain read-only.
//                                 </p>
//                             </div>

//                             <button
//                                 type="button"
//                                 onClick={() =>
//                                     setOpen(false)
//                                 }
//                                 className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border"
//                             >
//                                 <X className="h-4 w-4" />
//                             </button>
//                         </div>

//                         <div className="grid gap-4 p-5 sm:grid-cols-2">
//                             <label className="sm:col-span-2">
//                                 <span className="mb-1 block text-[10px] font-semibold">
//                                     Vendor Name *
//                                 </span>
//                                 <input
//                                     value={
//                                         form.vendor_name
//                                     }
//                                     onChange={(event) =>
//                                         setForm(
//                                             (current) => ({
//                                                 ...current,
//                                                 vendor_name:
//                                                     event
//                                                         .target
//                                                         .value,
//                                             })
//                                         )
//                                     }
//                                     className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
//                                 />
//                             </label>

//                             <label>
//                                 <span className="mb-1 block text-[10px] font-semibold">
//                                     Contact Person
//                                 </span>
//                                 <input
//                                     value={
//                                         form.contact_person
//                                     }
//                                     onChange={(event) =>
//                                         setForm(
//                                             (current) => ({
//                                                 ...current,
//                                                 contact_person:
//                                                     event
//                                                         .target
//                                                         .value,
//                                             })
//                                         )
//                                     }
//                                     className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
//                                 />
//                             </label>

//                             <label>
//                                 <span className="mb-1 block text-[10px] font-semibold">
//                                     Mobile
//                                 </span>
//                                 <input
//                                     value={form.mobile}
//                                     onChange={(event) =>
//                                         setForm(
//                                             (current) => ({
//                                                 ...current,
//                                                 mobile:
//                                                     event
//                                                         .target
//                                                         .value,
//                                             })
//                                         )
//                                     }
//                                     className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
//                                 />
//                             </label>

//                             <label>
//                                 <span className="mb-1 block text-[10px] font-semibold">
//                                     Email
//                                 </span>
//                                 <input
//                                     type="email"
//                                     value={form.email}
//                                     onChange={(event) =>
//                                         setForm(
//                                             (current) => ({
//                                                 ...current,
//                                                 email:
//                                                     event
//                                                         .target
//                                                         .value,
//                                             })
//                                         )
//                                     }
//                                     className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
//                                 />
//                             </label>

//                             <label>
//                                 <span className="mb-1 block text-[10px] font-semibold">
//                                     Address
//                                 </span>
//                                 <input
//                                     value={form.address}
//                                     onChange={(event) =>
//                                         setForm(
//                                             (current) => ({
//                                                 ...current,
//                                                 address:
//                                                     event
//                                                         .target
//                                                         .value,
//                                             })
//                                         )
//                                     }
//                                     className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
//                                 />
//                             </label>

//                             {!form.id && (
//                                 <div className="sm:col-span-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
//                                     <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-700">
//                                         Ownership
//                                     </p>
//                                     <p className="mt-1 text-[11px] font-bold text-violet-800">
//                                         {ownerships.find(
//                                             (ownership) =>
//                                                 ownership.code === "IT"
//                                         )?.name ?? "IT Managed"}
//                                     </p>
//                                     <p className="mt-1 text-[9px] text-violet-700/70">
//                                         New vendors created by IT are automatically assigned to the IT-editable ownership category.
//                                     </p>
//                                 </div>
//                             )}

//                             <div className="sm:col-span-2">
//                                 <div className="mb-2 flex items-center gap-2">
//                                     <Tags className="h-4 w-4 text-primary" />
//                                     <span className="text-[10px] font-semibold">
//                                         Vendor Types *
//                                     </span>
//                                 </div>

//                                 <div className="grid gap-2 sm:grid-cols-2">
//                                     {types.map(
//                                         (type) => {
//                                             const checked =
//                                                 form.vendor_type_ids.includes(
//                                                     type.id
//                                                 );

//                                             return (
//                                                 <button
//                                                     key={
//                                                         type.id
//                                                     }
//                                                     type="button"
//                                                     onClick={() =>
//                                                         toggleType(
//                                                             type.id
//                                                         )
//                                                     }
//                                                     className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-[10px] ${checked
//                                                         ? "border-primary/40 bg-primary/5 text-primary"
//                                                         : "border-border"
//                                                         }`}
//                                                 >
//                                                     <span>
//                                                         {
//                                                             type.name
//                                                         }
//                                                     </span>

//                                                     {checked && (
//                                                         <Check className="h-4 w-4" />
//                                                     )}
//                                                 </button>
//                                             );
//                                         }
//                                     )}
//                                 </div>
//                             </div>
//                         </div>

//                         {saveError && (
//                             <div className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-[10px] text-red-800">
//                                 <p className="font-bold">
//                                     Unable to save vendor
//                                 </p>
//                                 <p className="mt-1 break-words">
//                                     {saveError}
//                                 </p>
//                             </div>
//                         )}

//                         <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
//                             <Button
//                                 variant="outline"
//                                 onClick={() =>
//                                     setOpen(false)
//                                 }
//                                 disabled={saving}
//                             >
//                                 Cancel
//                             </Button>

//                             <Button
//                                 onClick={() =>
//                                     void save()
//                                 }
//                                 disabled={saving}
//                             >
//                                 {saving && (
//                                     <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
//                                 )}
//                                 Save Vendor
//                             </Button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }





//frontend/app/dashboard/vendors/page.tsx
"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Check,
    ChevronDown,
    LoaderCircle,
    LockKeyhole,
    Plus,
    Search,
    Tags,
    X,
} from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

type VendorType = {
    id: number;
    code: string;
    name: string;
    status: number;
};

type VendorOwnership = {
    id: number;
    code: string;
    name: string;
    editable_by_it: boolean;
    status: number;
};

type Vendor = {
    id: number;
    vendor_code: string;
    vendor_name: string;
    vendor_ownership_id: number;
    vendor_ownership_code: string;
    vendor_ownership_name: string;
    vendor_editable: boolean;
    contact_person: string;
    mobile: string;
    email: string;
    address: string;
    status: number;
    vendor_type_ids: number[];
    vendor_types: string[];
};

type VendorForm = {
    id: number | null;
    vendor_name: string;
    contact_person: string;
    mobile: string;
    email: string;
    address: string;
    vendor_type_ids: number[];
};

const emptyForm: VendorForm = {
    id: null,
    vendor_name: "",
    contact_person: "",
    mobile: "",
    email: "",
    address: "",
    vendor_type_ids: [],
};

export default function VendorMasterPage() {
    const [types, setTypes] =
        useState<VendorType[]>([]);
    const [ownerships, setOwnerships] =
        useState<VendorOwnership[]>([]);
    const [vendors, setVendors] =
        useState<Vendor[]>([]);
    const [search, setSearch] =
        useState("");
    const [typeFilter, setTypeFilter] =
        useState<number | "all">("all");
    const [ownershipFilter, setOwnershipFilter] =
        useState<number | "all">("all");
    const [loading, setLoading] =
        useState(true);
    const [saving, setSaving] =
        useState(false);
    const [open, setOpen] =
        useState(false);
    const [form, setForm] =
        useState<VendorForm>(emptyForm);
    const [error, setError] =
        useState("");
    const [saveError, setSaveError] =
        useState("");

    async function load() {
        try {
            setLoading(true);
            setError("");

            const [
                typeResponse,
                ownershipResponse,
                vendorResponse,
            ] = await Promise.all([
                api.get<{
                    success: boolean;
                    data: VendorType[];
                }>("/vendors/master/types"),
                api.get<{
                    success: boolean;
                    data: VendorOwnership[];
                }>("/vendors/master/ownerships"),
                api.get<{
                    success: boolean;
                    data: Vendor[];
                }>(
                    `/vendors/master?search=${encodeURIComponent(
                        search.trim()
                    )}`
                ),
            ]);

            setTypes(
                typeResponse.data ?? []
            );
            setOwnerships(
                ownershipResponse.data ?? []
            );
            setVendors(
                [...(vendorResponse.data ?? [])].sort(
                    (a, b) => b.id - a.id
                )
            );
        } catch (reason) {
            const message =
                reason instanceof Error
                    ? reason.message
                    : "Unable to load Vendor Master.";

            setError(
                message.toLowerCase().includes("route not found")
                    ? "Vendor Master backend routes are not registered yet. Apply PATCHES/01_REQUIRED_HANDLER_ROUTES.txt, rebuild the Go API, and restart the backend."
                    : message
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = window.setTimeout(
            () => void load(),
            300
        );

        return () =>
            window.clearTimeout(timer);
    }, [search]);

    const activeCount = useMemo(
        () =>
            vendors.filter(
                (vendor) =>
                    vendor.status === 1
            ).length,
        [vendors]
    );

    const filteredVendors = useMemo(
        () =>
            vendors.filter((vendor) => {
                const ownershipMatches =
                    ownershipFilter === "all" ||
                    vendor.vendor_ownership_id ===
                    ownershipFilter;

                const typeMatches =
                    typeFilter === "all" ||
                    vendor.vendor_type_ids.includes(
                        typeFilter
                    );

                return (
                    ownershipMatches &&
                    typeMatches
                );
            }),
        [
            vendors,
            ownershipFilter,
            typeFilter,
        ]
    );

    const unclassifiedCount = useMemo(
        () =>
            vendors.filter(
                (vendor) =>
                    vendor.vendor_type_ids.length === 0
            ).length,
        [vendors]
    );

    function openNew() {
        setForm(emptyForm);
        setError("");
        setSaveError("");
        setOpen(true);
    }

    function editVendor(vendor: Vendor) {
        if (!vendor.vendor_editable) {
            setError(
                `${vendor.vendor_ownership_name} vendors are read-only in ITM. Update this vendor in the source system.`
            );
            return;
        }

        setSaveError("");
        setForm({
            id: vendor.id,
            vendor_name:
                vendor.vendor_name,
            contact_person:
                vendor.contact_person ?? "",
            mobile: vendor.mobile ?? "",
            email: vendor.email ?? "",
            address:
                vendor.address ?? "",
            vendor_type_ids:
                vendor.vendor_type_ids ??
                [],
        });
        setError("");
        setOpen(true);
    }

    function toggleType(id: number) {
        setForm((current) => ({
            ...current,
            vendor_type_ids:
                current.vendor_type_ids.includes(
                    id
                )
                    ? current.vendor_type_ids.filter(
                        (value) =>
                            value !== id
                    )
                    : [
                        ...current.vendor_type_ids,
                        id,
                    ],
        }));
    }

    async function save() {
        if (!form.vendor_name.trim()) {
            setError(
                "Vendor Name is required."
            );
            return;
        }

        if (
            form.vendor_type_ids.length ===
            0
        ) {
            setError(
                "Select at least one Vendor Type."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSaveError("");

            const body = {
                vendor_name:
                    form.vendor_name.trim(),
                contact_person:
                    form.contact_person.trim(),
                mobile: form.mobile.trim(),
                email: form.email.trim(),
                address:
                    form.address.trim(),
                vendor_type_ids:
                    form.vendor_type_ids,
            };

            if (form.id) {
                await api.put(
                    `/vendors/master/${form.id}`,
                    body
                );
            } else {
                await api.post(
                    "/vendors/master",
                    body
                );
            }

            setOpen(false);
            setForm(emptyForm);
            await load();
        } catch (reason) {
            setSaveError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to save vendor."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-[1680px] space-y-4 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-primary">
                        <Tags className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                            Vendor Management
                        </h1>
                        <p className="mt-1 max-w-4xl text-[11px] leading-5 text-muted-foreground sm:text-xs">
                            Central vendor directory with ownership, vendor type, contact and status information.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={openNew}
                    className="h-10 shrink-0 gap-2 px-4 shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Add Vendor
                </Button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Total Vendors
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                        <p className="text-xl font-bold tracking-tight">
                            {vendors.length}
                        </p>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                            {activeCount} active
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-700">
                        SCM Managed
                    </p>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-blue-700">
                        {vendors.filter((vendor) => !vendor.vendor_editable).length}
                    </p>
                    <p className="mt-1 text-[9px] text-blue-700/70">
                        Source-controlled vendors
                    </p>
                </div>

                <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3.5 shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-violet-700">
                        IT Managed
                    </p>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-violet-700">
                        {vendors.filter((vendor) => vendor.vendor_editable).length}
                    </p>
                    <p className="mt-1 text-[9px] text-violet-700/70">
                        Editable by IT
                    </p>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Search Result
                    </p>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-primary">
                        {filteredVendors.length}
                    </p>
                    <p className="mt-1 text-[9px] text-muted-foreground">
                        Matching current search & filters
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                    <div className="rounded-xl border border-primary/20 bg-background p-3.5 shadow-sm sm:p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div className="w-full lg:max-w-4xl">
                                <div className="mb-2">
                                    <p className="text-xs font-bold text-foreground">
                                        Search Vendor Directory
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                                        Search by vendor name, vendor code, ownership, mobile or email.
                                    </p>
                                </div>

                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-primary" />
                                    <input
                                        autoFocus
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Type vendor name, code, mobile, email or ownership..."
                                        aria-label="Search vendors"
                                        className="h-11 w-full rounded-xl border border-primary/30 bg-background pl-11 pr-11 text-sm font-medium shadow-sm outline-none transition placeholder:font-normal placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                                    />

                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSearch("")
                                            }
                                            title="Clear search"
                                            className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 rounded-xl border border-border bg-muted/25 px-4 py-3">
                                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                    Results
                                </p>
                                <p className="mt-1 text-lg font-bold text-foreground">
                                    {filteredVendors.length}
                                    <span className="ml-1 text-[10px] font-medium text-muted-foreground">
                                        / {vendors.length}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-border bg-background p-3">
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                            Ownership Category
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setOwnershipFilter("all")
                                }
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${ownershipFilter === "all"
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                                    }`}
                            >
                                All Ownership · {vendors.length}
                            </button>

                            {ownerships.map((ownership) => {
                                const count =
                                    vendors.filter(
                                        (vendor) =>
                                            vendor.vendor_ownership_id ===
                                            ownership.id
                                    ).length;

                                return (
                                    <button
                                        key={ownership.id}
                                        type="button"
                                        onClick={() =>
                                            setOwnershipFilter(
                                                ownership.id
                                            )
                                        }
                                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${ownershipFilter ===
                                            ownership.id
                                            ? ownership.editable_by_it
                                                ? "border-violet-300 bg-violet-50 text-violet-700"
                                                : "border-blue-300 bg-blue-50 text-blue-700"
                                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                                            }`}
                                    >
                                        {ownership.name} · {count}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="mb-2 mt-4 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Vendor Type
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setTypeFilter("all")
                                }
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${typeFilter === "all"
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                                    }`}
                            >
                                All Vendors · {vendors.length}
                            </button>

                            {types.map((type) => {
                                const count =
                                    vendors.filter((vendor) =>
                                        vendor.vendor_type_ids.includes(
                                            type.id
                                        )
                                    ).length;

                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() =>
                                            setTypeFilter(type.id)
                                        }
                                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${typeFilter === type.id
                                            ? "border-primary/40 bg-primary/10 text-primary"
                                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                                            }`}
                                    >
                                        {type.name} · {count}
                                    </button>
                                );
                            })}

                            {unclassifiedCount > 0 && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                                    Unclassified · {unclassifiedCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-h-[62vh] overflow-y-auto overflow-x-hidden">
                    <table className="w-full table-fixed text-xs">
                        <colgroup>
                            <col className="w-[4%]" />
                            <col className="w-[10%]" />
                            <col className="w-[28%]" />
                            <col className="w-[13%]" />
                            <col className="w-[17%]" />
                            <col className="w-[12%]" />
                            <col className="w-[7%]" />
                            <col className="w-[9%]" />
                        </colgroup>

                        <thead className="sticky top-0 z-10 bg-muted/95 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground backdrop-blur">
                            <tr>
                                <th className="whitespace-nowrap px-2 py-2.5 text-center">
                                    SL
                                </th>
                                <th className="px-2.5 py-2">
                                    Vendor Code
                                </th>
                                <th className="px-2.5 py-2">
                                    Vendor
                                </th>
                                <th className="px-2.5 py-2">
                                    Ownership
                                </th>
                                <th className="px-2.5 py-2">
                                    Types
                                </th>
                                <th className="px-2.5 py-2">
                                    Contact
                                </th>
                                <th className="px-2.5 py-2">
                                    Status
                                </th>
                                <th className="px-2.5 py-2 text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-10 text-center"
                                    >
                                        <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-primary" />
                                    </td>
                                </tr>
                            ) : filteredVendors.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                                    >
                                        No vendors found.
                                    </td>
                                </tr>
                            ) : (
                                filteredVendors.map(
                                    (vendor, index) => (
                                        <tr
                                            key={
                                                vendor.id
                                            }
                                            className="border-t border-border align-middle transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-2 py-2 text-center text-[11px] font-medium tabular-nums text-muted-foreground">
                                                {index + 1}
                                            </td>
                                            <td className="px-2.5 py-2 font-mono text-[11px] font-bold">
                                                {
                                                    vendor.vendor_code
                                                }
                                            </td>
                                            <td className="px-2.5 py-2">
                                                <p className="truncate text-xs font-semibold text-foreground" title={vendor.vendor_name}>
                                                    {
                                                        vendor.vendor_name
                                                    }
                                                </p>
                                                <p className="mt-0.5 truncate text-[10px] leading-4 text-muted-foreground">
                                                    {vendor.address ||
                                                        "—"}
                                                </p>
                                            </td>
                                            <td className="px-2.5 py-2">
                                                {vendor.vendor_editable ? (
                                                    <span className="inline-flex max-w-full items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium leading-4 text-violet-700">
                                                        {vendor.vendor_ownership_name}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium leading-4 text-blue-700">
                                                        <LockKeyhole className="h-3 w-3" />
                                                        {vendor.vendor_ownership_name}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-2.5 py-2">
                                                <div className="flex max-w-full flex-wrap gap-1 overflow-hidden">
                                                    {vendor.vendor_types.length > 0 ? (
                                                        vendor.vendor_types.map(
                                                            (type) => (
                                                                <span
                                                                    key={type}
                                                                    className="max-w-full truncate rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] leading-4"
                                                                >
                                                                    {type}
                                                                </span>
                                                            )
                                                        )
                                                    ) : (
                                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium leading-4 text-amber-700">
                                                            Unclassified
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="min-w-0 px-2.5 py-2 text-xs">
                                                <p className="truncate leading-4">
                                                    {vendor.contact_person ||
                                                        "—"}
                                                </p>
                                                <p className="truncate text-[10px] leading-4 text-muted-foreground">
                                                    {vendor.mobile ||
                                                        vendor.email ||
                                                        "—"}
                                                </p>
                                            </td>
                                            <td className="px-2.5 py-2">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium leading-4 ${vendor.status ===
                                                        1
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-500"
                                                        }`}
                                                >
                                                    {vendor.status ===
                                                        1
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-2.5 py-2 text-right">
                                                {!vendor.vendor_editable ? (
                                                    <span
                                                        title={`${vendor.vendor_ownership_name} is read-only in ITM.`}
                                                        className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground"
                                                    >
                                                        <LockKeyhole className="h-3 w-3" />
                                                        Locked
                                                    </span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2.5 text-[11px]"
                                                        onClick={() =>
                                                            editVendor(
                                                                vendor
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-black/5">
                        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-5 py-4">
                            <div>
                                <h2 className="font-bold">
                                    {form.id
                                        ? "Edit Vendor"
                                        : "Add Vendor"}
                                </h2>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                    New vendors created here are IT Managed. SCM vendors are synchronized from SCM and remain read-only.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setOpen(false)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="grid gap-4 p-5 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className="mb-1 block text-[10px] font-semibold">
                                    Vendor Name *
                                </span>
                                <input
                                    value={
                                        form.vendor_name
                                    }
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                vendor_name:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-[10px] font-semibold">
                                    Contact Person
                                </span>
                                <input
                                    value={
                                        form.contact_person
                                    }
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                contact_person:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-[10px] font-semibold">
                                    Mobile
                                </span>
                                <input
                                    value={form.mobile}
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                mobile:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-[10px] font-semibold">
                                    Email
                                </span>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                email:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-[10px] font-semibold">
                                    Address
                                </span>
                                <input
                                    value={form.address}
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                address:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>

                            {!form.id && (
                                <div className="sm:col-span-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                                    <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-700">
                                        Ownership
                                    </p>
                                    <p className="mt-1 text-[11px] font-bold text-violet-800">
                                        {ownerships.find(
                                            (ownership) =>
                                                ownership.code === "IT"
                                        )?.name ?? "IT Managed"}
                                    </p>
                                    <p className="mt-1 text-[9px] text-violet-700/70">
                                        New vendors created by IT are automatically assigned to the IT-editable ownership category.
                                    </p>
                                </div>
                            )}

                            <div className="sm:col-span-2">
                                <div className="mb-2 flex items-center gap-2">
                                    <Tags className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-semibold">
                                        Vendor Types *
                                    </span>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {types.map(
                                        (type) => {
                                            const checked =
                                                form.vendor_type_ids.includes(
                                                    type.id
                                                );

                                            return (
                                                <button
                                                    key={
                                                        type.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        toggleType(
                                                            type.id
                                                        )
                                                    }
                                                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-[10px] ${checked
                                                        ? "border-primary/40 bg-primary/5 text-primary"
                                                        : "border-border"
                                                        }`}
                                                >
                                                    <span>
                                                        {
                                                            type.name
                                                        }
                                                    </span>

                                                    {checked && (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        </div>

                        {saveError && (
                            <div className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-[10px] text-red-800">
                                <p className="font-bold">
                                    Unable to save vendor
                                </p>
                                <p className="mt-1 break-words">
                                    {saveError}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setOpen(false)
                                }
                                disabled={saving}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={() =>
                                    void save()
                                }
                                disabled={saving}
                            >
                                {saving && (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save Vendor
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}




