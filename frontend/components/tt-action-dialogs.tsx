// "use client";

// import { useEffect, useMemo, useState } from "react";
// import {
//     AlertCircle,
//     CheckCircle2,
//     ClipboardList,
//     Loader2,
//     LockKeyhole,
//     UserRound,
// } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogTitle,
// } from "@/components/ui/dialog";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";

// import {
//     categoryApi,
//     dashboardApi,
//     deviceApi,
//     getUser,
//     type Device,
// } from "@/lib/api";
// import type { Section } from "@/types/tt";

// const REQUISITION_SUCCESS_PATH = "/dashboard/requisitions?view=pending";
// const CLOSE_SUCCESS_PATH = "/dashboard/trouble-tickets?scope=closed_today";

// type CategoryNode = {
//     id: number;
//     category_name: string;
//     parent_id: number;
//     sub_parent_id: number;
//     type: string;
//     status: number;
// };

// function errorMessage(error: unknown, fallback: string): string {
//     if (error instanceof Error && error.message) {
//         return error.message;
//     }
//     if (typeof error === "string" && error.trim()) {
//         return error;
//     }
//     return fallback;
// }

// function text(value: unknown): string {
//     const result = String(value ?? "").trim();
//     return result || "—";
// }

// function numberOrNull(value: string): number | null {
//     if (!value) return null;
//     const parsed = Number(value);
//     return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
// }

// function normalizeCategoryRows(rows: unknown[]): CategoryNode[] {
//     return rows
//         .map((row) => {
//             const item = row as Record<string, unknown>;
//             return {
//                 id: Number(item.id ?? 0),
//                 category_name: String(
//                     item.category_name ?? item.inventory_category_list ?? ""
//                 ).trim(),
//                 parent_id: Number(item.parent_id ?? 0),
//                 sub_parent_id: Number(item.sub_parent_id ?? 0),
//                 type: String(item.type ?? "").trim().toLowerCase(),
//                 status: Number(item.status ?? 0),
//             };
//         })
//         .filter((item) => item.id > 0 && item.category_name && item.status === 1);
// }

// function findNodeByStoredValue(
//     nodes: CategoryNode[],
//     value: unknown,
//     parentID?: number,
//     expectedType?: string
// ): CategoryNode | undefined {
//     const raw = String(value ?? "").trim();
//     if (!raw) return undefined;

//     return nodes.find((node) => {
//         const valueMatches =
//             String(node.id) === raw ||
//             node.category_name.localeCompare(raw, undefined, { sensitivity: "accent" }) === 0;

//         if (!valueMatches) return false;
//         if (parentID !== undefined && node.parent_id !== parentID) return false;
//         if (expectedType && node.type && node.type !== expectedType) return false;
//         return true;
//     });
// }

// function ActorCard() {
//     const user = getUser();

//     return (
//         <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
//             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
//                 <UserRound className="h-4 w-4 text-primary" />
//             </div>
//             <div className="min-w-0">
//                 <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                     Action performed by
//                 </p>
//                 <p className="truncate text-[11px] font-semibold text-foreground">
//                     {text(user?.full_name)}
//                     {user?.employee_id ? (
//                         <span className="ml-1.5 font-mono text-[10px] font-medium text-muted-foreground">
//                             ({user.employee_id})
//                         </span>
//                     ) : null}
//                 </p>
//             </div>
//         </div>
//     );
// }

// function ErrorBanner({ message }: { message: string }) {
//     if (!message) return null;

//     return (
//         <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] leading-4 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
//             <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
//             <span>{message}</span>
//         </div>
//     );
// }

// export function TroubleTicketRequisitionDialog({
//     section,
//     open,
//     onOpenChange,
// }: {
//     section: Section | null;
//     open: boolean;
//     onOpenChange: (open: boolean) => void;
// }) {
//     const [categories, setCategories] = useState<CategoryNode[]>([]);
//     const [devices, setDevices] = useState<Device[]>([]);
//     const [categoryID, setCategoryID] = useState("");
//     const [brandID, setBrandID] = useState("");
//     const [modelID, setModelID] = useState("");
//     const [deviceSerial, setDeviceSerial] = useState("");
//     const [reasonDetails, setReasonDetails] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [submitting, setSubmitting] = useState(false);
//     const [error, setError] = useState("");

//     const rootCategories = useMemo(
//         () =>
//             categories.filter(
//                 (item) =>
//                     item.parent_id === 0 ||
//                     item.type === "category"
//             ),
//         [categories]
//     );

//     const brands = useMemo(() => {
//         const selectedCategoryID = numberOrNull(categoryID);
//         if (!selectedCategoryID) return [];
//         return categories.filter(
//             (item) =>
//                 item.parent_id === selectedCategoryID &&
//                 (item.type === "brand" || item.type === "")
//         );
//     }, [categories, categoryID]);

//     const models = useMemo(() => {
//         const selectedBrandID = numberOrNull(brandID);
//         if (!selectedBrandID) return [];
//         return categories.filter(
//             (item) =>
//                 item.parent_id === selectedBrandID &&
//                 (item.type === "model" || item.type === "")
//         );
//     }, [categories, brandID]);

//     useEffect(() => {
//         if (!open || !section) return;

//         let mounted = true;
//         setCategoryID("");
//         setBrandID("");
//         setModelID("");
//         setDeviceSerial("");
//         setReasonDetails("");
//         setError("");

//         async function loadFormData() {
//             try {
//                 setLoading(true);
//                 const [categoryResponse, deviceResponse] = await Promise.all([
//                     categoryApi.list(),
//                     deviceApi.byEmployee(String(section?.employee_id ?? "").trim()),
//                 ]);

//                 if (!mounted) return;
//                 setCategories(normalizeCategoryRows(categoryResponse.data ?? []));
//                 setDevices(deviceResponse.data ?? []);
//             } catch (reason) {
//                 if (!mounted) return;
//                 setError(
//                     errorMessage(
//                         reason,
//                         "Unable to load requisition master data."
//                     )
//                 );
//                 setCategories([]);
//                 setDevices([]);
//             } finally {
//                 if (mounted) setLoading(false);
//             }
//         }

//         void loadFormData();
//         return () => {
//             mounted = false;
//         };
//     }, [open, section]);

//     function handleDeviceChange(serial: string) {
//         setDeviceSerial(serial === "__none__" ? "" : serial);
//         if (serial === "__none__") return;

//         const device = devices.find(
//             (item) => String(item.device_serial ?? "").trim() === serial
//         );
//         if (!device) return;

//         const category = findNodeByStoredValue(
//             categories,
//             device.category,
//             undefined,
//             "category"
//         );
//         if (!category) return;

//         setCategoryID(String(category.id));

//         const brand = findNodeByStoredValue(
//             categories,
//             device.brand,
//             category.id,
//             "brand"
//         );
//         setBrandID(brand ? String(brand.id) : "");

//         const model = brand
//             ? findNodeByStoredValue(
//                 categories,
//                 device.model_no,
//                 brand.id,
//                 "model"
//             )
//             : undefined;
//         setModelID(model ? String(model.id) : "");
//     }

//     async function handleSubmit() {
//         if (!section) return;

//         const ticketID = Number(section.id);
//         const selectedCategoryID = numberOrNull(categoryID);

//         if (!Number.isFinite(ticketID) || ticketID <= 0) {
//             setError("Invalid Trouble Ticket ID.");
//             return;
//         }
//         if (!selectedCategoryID) {
//             setError("Please select a category.");
//             return;
//         }
//         if (reasonDetails.trim().length < 3) {
//             setError("Please enter a meaningful requisition reason.");
//             return;
//         }

//         try {
//             setSubmitting(true);
//             setError("");

//             await dashboardApi.raiseTroubleTicketRequisition(ticketID, {
//                 category_id: selectedCategoryID,
//                 brand_id: numberOrNull(brandID),
//                 model_id: numberOrNull(modelID),
//                 device_serial: deviceSerial.trim(),
//                 reason_details: reasonDetails.trim(),
//             });

//             onOpenChange(false);
//             window.location.assign(REQUISITION_SUCCESS_PATH);
//         } catch (reason) {
//             setError(
//                 errorMessage(reason, "Unable to raise the requisition.")
//             );
//         } finally {
//             setSubmitting(false);
//         }
//     }

//     return (
//         <Dialog
//             open={open}
//             onOpenChange={submitting ? undefined : onOpenChange}
//         >
//             <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[720px]">
//                 <div className="space-y-1">
//                     <div className="flex items-center gap-2">
//                         <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-indigo-50 dark:bg-indigo-950/30">
//                             <ClipboardList className="h-4 w-4 text-indigo-600" />
//                         </div>
//                         <div>
//                             <DialogTitle className="text-sm">
//                                 Raise Trouble Ticket Requisition
//                             </DialogTitle>
//                             <DialogDescription className="mt-0.5 text-[10px]">
//                                 Create an auditable device/accessory request linked to this Trouble Ticket.
//                             </DialogDescription>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="space-y-4 pt-2">
//                     <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-3">
//                         <div>
//                             <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">TT No</p>
//                             <p className="mt-1 font-mono text-[11px] font-semibold">{text(section?.tt_no)}</p>
//                         </div>
//                         <div>
//                             <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Employee</p>
//                             <p className="mt-1 truncate text-[11px] font-semibold">{text(section?.employee_name)}</p>
//                         </div>
//                         <div>
//                             <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Employee ID</p>
//                             <p className="mt-1 font-mono text-[11px] font-semibold">{text(section?.employee_id)}</p>
//                         </div>
//                     </div>

//                     <ActorCard />

//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-semibold">Assigned Device <span className="font-normal text-muted-foreground">(Optional)</span></label>
//                         <Select
//                             value={deviceSerial || "__none__"}
//                             onValueChange={handleDeviceChange}
//                             disabled={loading || submitting}
//                         >
//                             <SelectTrigger className="h-9 text-[11px]">
//                                 <SelectValue placeholder={loading ? "Loading devices..." : "Select assigned device"} />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="__none__">No existing device</SelectItem>
//                                 {devices
//                                     .filter((device) =>
//                                         Boolean(String(device.device_serial ?? "").trim())
//                                     )
//                                     .map((device) => (
//                                         <SelectItem
//                                             key={`${device.id}-${device.device_serial}`}
//                                             value={String(device.device_serial ?? "").trim()}
//                                         >
//                                             {text(device.device_serial)} · {text(device.category)} · {text(device.brand)} {text(device.model_no) !== "—" ? `· ${text(device.model_no)}` : ""}
//                                         </SelectItem>
//                                     ))}
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
//                         <div className="space-y-1.5">
//                             <label className="text-[10px] font-semibold">Category *</label>
//                             <Select
//                                 value={categoryID}
//                                 onValueChange={(value) => {
//                                     setCategoryID(value);
//                                     setBrandID("");
//                                     setModelID("");
//                                 }}
//                                 disabled={loading || submitting}
//                             >
//                                 <SelectTrigger className="h-9 text-[11px]">
//                                     <SelectValue placeholder={loading ? "Loading..." : "Select category"} />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     {rootCategories.map((item) => (
//                                         <SelectItem key={item.id} value={String(item.id)}>
//                                             {item.category_name}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         <div className="space-y-1.5">
//                             <label className="text-[10px] font-semibold">Brand <span className="font-normal text-muted-foreground">(Optional)</span></label>
//                             <Select
//                                 value={brandID || "__none__"}
//                                 onValueChange={(value) => {
//                                     setBrandID(value === "__none__" ? "" : value);
//                                     setModelID("");
//                                 }}
//                                 disabled={!categoryID || loading || submitting}
//                             >
//                                 <SelectTrigger className="h-9 text-[11px]">
//                                     <SelectValue placeholder="Select brand" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="__none__">No brand</SelectItem>
//                                     {brands.map((item) => (
//                                         <SelectItem key={item.id} value={String(item.id)}>
//                                             {item.category_name}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         <div className="space-y-1.5">
//                             <label className="text-[10px] font-semibold">Model <span className="font-normal text-muted-foreground">(Optional)</span></label>
//                             <Select
//                                 value={modelID || "__none__"}
//                                 onValueChange={(value) => setModelID(value === "__none__" ? "" : value)}
//                                 disabled={!brandID || loading || submitting}
//                             >
//                                 <SelectTrigger className="h-9 text-[11px]">
//                                     <SelectValue placeholder="Select model" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="__none__">No model</SelectItem>
//                                     {models.map((item) => (
//                                         <SelectItem key={item.id} value={String(item.id)}>
//                                             {item.category_name}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                         </div>
//                     </div>

//                     {/* <p className="rounded-md border bg-muted/20 px-3 py-2 text-[9px] leading-4 text-muted-foreground">
//                         Category, brand and model are validated against the inventory_categories parent-child hierarchy. The authenticated user is recorded by the backend as the requisition raiser; the browser cannot override that identity.
//                     </p> */}

//                     <div className="space-y-1.5">
//                         <div className="flex items-center justify-between">
//                             <label className="text-[10px] font-semibold">Reason Details *</label>
//                             <span className="text-[9px] text-muted-foreground">{reasonDetails.length}/5000</span>
//                         </div>
//                         <textarea
//                             value={reasonDetails}
//                             onChange={(event) => setReasonDetails(event.target.value)}
//                             disabled={submitting}
//                             maxLength={5000}
//                             rows={6}
//                             placeholder="Explain what is required and why..."
//                             className="min-h-[132px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-[11px] outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
//                         />
//                     </div>

//                     <ErrorBanner message={error} />
//                 </div>

//                 <div className="mt-2 flex items-center justify-between gap-3 border-t pt-4">
//                     <div className="hidden items-center gap-1.5 text-[9px] text-muted-foreground sm:flex">
//                         <LockKeyhole className="h-3 w-3" />
//                         Server-side permission: TT_REQUISITION
//                     </div>
//                     <div className="ml-auto flex gap-2">
//                         <Button
//                             type="button"
//                             variant="outline"
//                             size="sm"
//                             disabled={submitting}
//                             onClick={() => onOpenChange(false)}
//                             className="h-8 text-[10px]"
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             type="button"
//                             size="sm"
//                             disabled={submitting || loading || !categoryID || reasonDetails.trim().length < 3}
//                             onClick={handleSubmit}
//                             className="h-8 gap-1.5 text-[10px]"
//                         >
//                             {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardList className="h-3.5 w-3.5" />}
//                             {submitting ? "Raising..." : "Raise Requisition"}
//                         </Button>
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// }

// export function TroubleTicketCloseDialog({
//     section,
//     open,
//     onOpenChange,
// }: {
//     section: Section | null;
//     open: boolean;
//     onOpenChange: (open: boolean) => void;
// }) {
//     const [closingDescription, setClosingDescription] = useState("");
//     const [submitting, setSubmitting] = useState(false);
//     const [error, setError] = useState("");

//     useEffect(() => {
//         if (!open) return;
//         setClosingDescription("");
//         setError("");
//     }, [open, section]);

//     async function handleSubmit() {
//         if (!section) return;
//         const ticketID = Number(section.id);

//         if (!Number.isFinite(ticketID) || ticketID <= 0) {
//             setError("Invalid Trouble Ticket ID.");
//             return;
//         }
//         if (closingDescription.trim().length < 3) {
//             setError("Please enter a meaningful closing description.");
//             return;
//         }

//         try {
//             setSubmitting(true);
//             setError("");
//             await dashboardApi.closeTroubleTicket(
//                 ticketID,
//                 closingDescription.trim()
//             );
//             onOpenChange(false);
//             window.location.assign(CLOSE_SUCCESS_PATH);
//         } catch (reason) {
//             setError(errorMessage(reason, "Unable to close the Trouble Ticket."));
//         } finally {
//             setSubmitting(false);
//         }
//     }

//     return (
//         <Dialog
//             open={open}
//             onOpenChange={submitting ? undefined : onOpenChange}
//         >
//             <DialogContent className="sm:max-w-[580px]">
//                 <div className="flex items-start gap-3">
//                     <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
//                         <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
//                     </div>
//                     <div>
//                         <DialogTitle className="text-sm">Close Trouble Ticket</DialogTitle>
//                         <DialogDescription className="mt-1 text-[10px] leading-4">
//                             Closing is an auditable action. The backend records status, closed_at, authenticated closed_by and the closing description.
//                         </DialogDescription>
//                     </div>
//                 </div>

//                 <div className="space-y-4 pt-2">
//                     <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3">
//                         <div>
//                             <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">TT No</p>
//                             <p className="mt-1 font-mono text-[11px] font-semibold">{text(section?.tt_no)}</p>
//                         </div>
//                         <div>
//                             <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Assigned To</p>
//                             <p className="mt-1 text-[11px] font-semibold">{text(section?.assigned_name || section?.assigned_id)}</p>
//                         </div>
//                     </div>

//                     <ActorCard />

//                     <div className="space-y-1.5">
//                         <div className="flex items-center justify-between">
//                             <label className="text-[10px] font-semibold">Closing Description *</label>
//                             <span className="text-[9px] text-muted-foreground">{closingDescription.length}/2000</span>
//                         </div>
//                         <textarea
//                             value={closingDescription}
//                             onChange={(event) => setClosingDescription(event.target.value)}
//                             disabled={submitting}
//                             maxLength={2000}
//                             rows={6}
//                             placeholder="Describe the resolution, corrective action and final outcome..."
//                             className="min-h-[132px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-[11px] outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
//                         />
//                     </div>

//                     {/* <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] leading-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-300">
//                         This action changes the ticket to Closed and records the authenticated employee ID. Re-open is not part of this action.
//                     </div> */}

//                     <ErrorBanner message={error} />
//                 </div>

//                 <div className="mt-2 flex items-center justify-between gap-3 border-t pt-4">
//                     <div className="hidden items-center gap-1.5 text-[9px] text-muted-foreground sm:flex">
//                         <LockKeyhole className="h-3 w-3" />
//                         Server-side permission: TT_Close
//                     </div>
//                     <div className="ml-auto flex gap-2">
//                         <Button
//                             type="button"
//                             variant="outline"
//                             size="sm"
//                             disabled={submitting}
//                             onClick={() => onOpenChange(false)}
//                             className="h-8 text-[10px]"
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             type="button"
//                             size="sm"
//                             disabled={submitting || closingDescription.trim().length < 3}
//                             onClick={handleSubmit}
//                             className="h-8 gap-1.5 text-[10px]"
//                         >
//                             {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
//                             {submitting ? "Closing..." : "Close Ticket"}
//                         </Button>
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// }



"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    Loader2,
    LockKeyhole,
    UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    categoryApi,
    dashboardApi,
    deviceApi,
    getUser,
    type Device,
} from "@/lib/api";
import type { Section } from "@/types/tt";

const REQUISITION_SUCCESS_PATH = "/dashboard/requisitions?view=pending";
const CLOSE_SUCCESS_PATH = "/dashboard/trouble-tickets?scope=closed_today";

type CategoryNode = {
    id: number;
    category_name: string;
    parent_id: number;
    sub_parent_id: number;
    type: string;
    status: number;
};

function errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    if (typeof error === "string" && error.trim()) {
        return error;
    }
    return fallback;
}

function text(value: unknown): string {
    const result = String(value ?? "").trim();
    return result || "—";
}

function numberOrNull(value: string): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCategoryRows(rows: unknown[]): CategoryNode[] {
    return rows
        .map((row) => {
            const item = row as Record<string, unknown>;
            return {
                id: Number(item.id ?? 0),
                category_name: String(
                    item.category_name ?? item.inventory_category_list ?? ""
                ).trim(),
                parent_id: Number(item.parent_id ?? 0),
                sub_parent_id: Number(item.sub_parent_id ?? 0),
                type: String(item.type ?? "").trim().toLowerCase(),
                status: Number(item.status ?? 0),
            };
        })
        .filter((item) => item.id > 0 && item.category_name && item.status === 1);
}

function findNodeByStoredValue(
    nodes: CategoryNode[],
    value: unknown,
    parentID?: number,
    expectedType?: string
): CategoryNode | undefined {
    const raw = String(value ?? "").trim();
    if (!raw) return undefined;

    return nodes.find((node) => {
        const valueMatches =
            String(node.id) === raw ||
            node.category_name.localeCompare(raw, undefined, { sensitivity: "accent" }) === 0;

        if (!valueMatches) return false;
        if (parentID !== undefined && node.parent_id !== parentID) return false;
        if (expectedType && node.type && node.type !== expectedType) return false;
        return true;
    });
}

function ActorCard() {
    const user = getUser();

    return (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                <UserRound className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Action performed by
                </p>
                <p className="truncate text-[11px] font-semibold text-foreground">
                    {text(user?.full_name)}
                    {user?.employee_id ? (
                        <span className="ml-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            ({user.employee_id})
                        </span>
                    ) : null}
                </p>
            </div>
        </div>
    );
}

function ErrorBanner({ message }: { message: string }) {
    if (!message) return null;

    return (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] leading-4 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
        </div>
    );
}

export function TroubleTicketRequisitionDialog({
    section,
    open,
    onOpenChange,
}: {
    section: Section | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [categoryID, setCategoryID] = useState("");
    const [brandID, setBrandID] = useState("");
    const [modelID, setModelID] = useState("");
    const [deviceSerial, setDeviceSerial] = useState("");
    const [reasonDetails, setReasonDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const rootCategories = useMemo(
        () =>
            categories.filter(
                (item) =>
                    item.parent_id === 0 ||
                    item.type === "category"
            ),
        [categories]
    );

    const brands = useMemo(() => {
        const selectedCategoryID = numberOrNull(categoryID);
        if (!selectedCategoryID) return [];
        return categories.filter(
            (item) =>
                item.parent_id === selectedCategoryID &&
                (item.type === "brand" || item.type === "")
        );
    }, [categories, categoryID]);

    const models = useMemo(() => {
        const selectedBrandID = numberOrNull(brandID);
        if (!selectedBrandID) return [];
        return categories.filter(
            (item) =>
                item.parent_id === selectedBrandID &&
                (item.type === "model" || item.type === "")
        );
    }, [categories, brandID]);

    useEffect(() => {
        if (!open || !section) return;

        let mounted = true;
        setCategoryID("");
        setBrandID("");
        setModelID("");
        setDeviceSerial("");
        setReasonDetails("");
        setError("");

        async function loadFormData() {
            try {
                setLoading(true);
                const [categoryResponse, deviceResponse] = await Promise.all([
                    categoryApi.list(),
                    deviceApi.byEmployee(String(section?.employee_id ?? "").trim()),
                ]);

                if (!mounted) return;
                setCategories(normalizeCategoryRows(categoryResponse.data ?? []));
                setDevices(deviceResponse.data ?? []);
            } catch (reason) {
                if (!mounted) return;
                setError(
                    errorMessage(
                        reason,
                        "Unable to load requisition master data."
                    )
                );
                setCategories([]);
                setDevices([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        void loadFormData();
        return () => {
            mounted = false;
        };
    }, [open, section]);

    function handleDeviceChange(serial: string) {
        setDeviceSerial(serial === "__none__" ? "" : serial);
        if (serial === "__none__") return;

        const device = devices.find(
            (item) => String(item.device_serial ?? "").trim() === serial
        );
        if (!device) return;

        const category = findNodeByStoredValue(
            categories,
            device.category,
            undefined,
            "category"
        );
        if (!category) return;

        setCategoryID(String(category.id));

        const brand = findNodeByStoredValue(
            categories,
            device.brand,
            category.id,
            "brand"
        );
        setBrandID(brand ? String(brand.id) : "");

        const model = brand
            ? findNodeByStoredValue(
                categories,
                device.model_no,
                brand.id,
                "model"
            )
            : undefined;
        setModelID(model ? String(model.id) : "");
    }

    async function handleSubmit() {
        if (!section) return;

        const ticketID = Number(section.id);
        const selectedCategoryID = numberOrNull(categoryID);

        if (!Number.isFinite(ticketID) || ticketID <= 0) {
            setError("Invalid Trouble Ticket ID.");
            return;
        }
        if (!selectedCategoryID) {
            setError("Please select a category.");
            return;
        }
        if (reasonDetails.trim().length < 3) {
            setError("Please enter a meaningful requisition reason.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            await dashboardApi.raiseTroubleTicketRequisition(ticketID, {
                category_id: selectedCategoryID,
                brand_id: numberOrNull(brandID),
                model_id: numberOrNull(modelID),
                device_serial: deviceSerial.trim(),
                reason_details: reasonDetails.trim(),
            });

            onOpenChange(false);
            window.location.assign(REQUISITION_SUCCESS_PATH);
        } catch (reason) {
            setError(
                errorMessage(reason, "Unable to raise the requisition.")
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={submitting ? undefined : onOpenChange}
        >
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[720px]">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-indigo-50 dark:bg-indigo-950/30">
                            <ClipboardList className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm">
                                Raise Trouble Ticket Requisition
                            </DialogTitle>
                            <DialogDescription className="mt-0.5 text-[10px]">
                                Create an auditable device/accessory request linked to this Trouble Ticket.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-3">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">TT No</p>
                            <p className="mt-1 font-mono text-[11px] font-semibold">{text(section?.tt_no)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Employee</p>
                            <p className="mt-1 truncate text-[11px] font-semibold">{text(section?.employee_name)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Employee ID</p>
                            <p className="mt-1 font-mono text-[11px] font-semibold">{text(section?.employee_id)}</p>
                        </div>
                    </div>

                    <ActorCard />

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold">Assigned Device <span className="font-normal text-muted-foreground">(Optional)</span></label>
                        <Select
                            value={deviceSerial || "__none__"}
                            onValueChange={handleDeviceChange}
                            disabled={loading || submitting}
                        >
                            <SelectTrigger className="h-9 text-[11px]">
                                <SelectValue placeholder={loading ? "Loading devices..." : "Select assigned device"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">No existing device</SelectItem>
                                {devices
                                    .filter((device) =>
                                        Boolean(String(device.device_serial ?? "").trim())
                                    )
                                    .map((device) => (
                                        <SelectItem
                                            key={`${device.id}-${device.device_serial}`}
                                            value={String(device.device_serial ?? "").trim()}
                                        >
                                            {text(device.device_serial)} · {text(device.category)} · {text(device.brand)} {text(device.model_no) !== "—" ? `· ${text(device.model_no)}` : ""}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold">Category *</label>
                            <Select
                                value={categoryID}
                                onValueChange={(value) => {
                                    setCategoryID(value);
                                    setBrandID("");
                                    setModelID("");
                                }}
                                disabled={loading || submitting}
                            >
                                <SelectTrigger className="h-9 text-[11px]">
                                    <SelectValue placeholder={loading ? "Loading..." : "Select category"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {rootCategories.map((item) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.category_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold">Brand <span className="font-normal text-muted-foreground">(Optional)</span></label>
                            <Select
                                value={brandID || "__none__"}
                                onValueChange={(value) => {
                                    setBrandID(value === "__none__" ? "" : value);
                                    setModelID("");
                                }}
                                disabled={!categoryID || loading || submitting}
                            >
                                <SelectTrigger className="h-9 text-[11px]">
                                    <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">No brand</SelectItem>
                                    {brands.map((item) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.category_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold">Model <span className="font-normal text-muted-foreground">(Optional)</span></label>
                            <Select
                                value={modelID || "__none__"}
                                onValueChange={(value) => setModelID(value === "__none__" ? "" : value)}
                                disabled={!brandID || loading || submitting}
                            >
                                <SelectTrigger className="h-9 text-[11px]">
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">No model</SelectItem>
                                    {models.map((item) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.category_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* <p className="rounded-md border bg-muted/20 px-3 py-2 text-[9px] leading-4 text-muted-foreground">
                        Category, brand and model are validated against the inventory_categories parent-child hierarchy. The authenticated user is recorded by the backend as the requisition raiser; the browser cannot override that identity.
                    </p> */}

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-semibold">Reason Details *</label>
                            <span className="text-[9px] text-muted-foreground">{reasonDetails.length}/5000</span>
                        </div>
                        <textarea
                            value={reasonDetails}
                            onChange={(event) => setReasonDetails(event.target.value)}
                            disabled={submitting}
                            maxLength={5000}
                            rows={6}
                            placeholder="Explain what is required and why..."
                            className="min-h-[132px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-[11px] outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <ErrorBanner message={error} />
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 border-t pt-4">
                    <div className="hidden items-center gap-1.5 text-[9px] text-muted-foreground sm:flex">
                        <LockKeyhole className="h-3 w-3" />
                        Server-side permission: TT_REQUISITION
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={submitting}
                            onClick={() => onOpenChange(false)}
                            className="h-8 text-[10px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={submitting || loading || !categoryID || reasonDetails.trim().length < 3}
                            onClick={handleSubmit}
                            className="h-8 gap-1.5 text-[10px]"
                        >
                            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardList className="h-3.5 w-3.5" />}
                            {submitting ? "Raising..." : "Raise Requisition"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function TroubleTicketCloseDialog({
    section,
    open,
    onOpenChange,
}: {
    section: Section | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [closingDescription, setClosingDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        setClosingDescription("");
        setError("");
    }, [open, section]);

    async function handleSubmit() {
        if (!section) return;
        const ticketID = Number(section.id);

        if (!Number.isFinite(ticketID) || ticketID <= 0) {
            setError("Invalid Trouble Ticket ID.");
            return;
        }
        if (closingDescription.trim().length < 3) {
            setError("Please enter a meaningful closing description.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            await dashboardApi.closeTroubleTicket(
                ticketID,
                closingDescription.trim()
            );
            onOpenChange(false);
            window.location.assign(CLOSE_SUCCESS_PATH);
        } catch (reason) {
            setError(errorMessage(reason, "Unable to close the Trouble Ticket."));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={submitting ? undefined : onOpenChange}
        >
            <DialogContent className="sm:max-w-[580px]">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    </div>
                    <div>
                        <DialogTitle className="text-sm">Close Trouble Ticket</DialogTitle>
                        <DialogDescription className="mt-1 text-[10px] leading-4">
                            Closing is an auditable action. The backend records status, closed_at, authenticated closed_by and the closing description.
                        </DialogDescription>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">TT No</p>
                            <p className="mt-1 font-mono text-[11px] font-semibold">{text(section?.tt_no)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Assigned To</p>
                            <p className="mt-1 text-[11px] font-semibold">{text(section?.assigned_name || section?.assigned_id)}</p>
                        </div>
                    </div>

                    <ActorCard />

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-semibold">Closing Description *</label>
                            <span className="text-[9px] text-muted-foreground">{closingDescription.length}/2000</span>
                        </div>
                        <textarea
                            value={closingDescription}
                            onChange={(event) => setClosingDescription(event.target.value)}
                            disabled={submitting}
                            maxLength={2000}
                            rows={6}
                            placeholder="Describe the resolution, corrective action and final outcome..."
                            className="min-h-[132px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-[11px] outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {/* <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] leading-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-300">
                        This action changes the ticket to Closed and records the authenticated employee ID. Re-open is not part of this action.
                    </div> */}

                    <ErrorBanner message={error} />
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 border-t pt-4">
                    <div className="hidden items-center gap-1.5 text-[9px] text-muted-foreground sm:flex">
                        <LockKeyhole className="h-3 w-3" />
                        Server-side permission: TT_Close
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={submitting}
                            onClick={() => onOpenChange(false)}
                            className="h-8 text-[10px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={submitting || closingDescription.trim().length < 3}
                            onClick={handleSubmit}
                            className="h-8 gap-1.5 text-[10px]"
                        >
                            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            {submitting ? "Closing..." : "Close Ticket"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
