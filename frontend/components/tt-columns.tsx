
// // //itm/frontend/components/tt-columns.tsx


// "use client";

// import type { ReactNode } from "react";
// import type { ColumnDef } from "@tanstack/react-table";
// import {
//     CheckCircle,
//     ChevronDown,
//     ClipboardList,
//     Clock,
//     Eye,
//     Pencil,
//     Trash2,
//     UserCheck,
//     XCircle,
// } from "lucide-react";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// import { useTTModal } from "@/components/ui/tt-modal-store";
// import type { TroubleTicketItem } from "@/lib/api";
// import type { Section } from "@/types/tt";

// export type { Section } from "@/types/tt";

// /* ======================================================
//    TYPES
// ====================================================== */

// type DisplayTicketStatus = "Open" | "Closed";

// type BadgeConfiguration = {
//     icon: ReactNode;
//     className: string;
// };

// /* ======================================================
//    TT ACTION PERMISSIONS
// ====================================================== */

// export interface TTActionPermissions {
//     canView: boolean;
//     canAssign: boolean;
//     canRequisition: boolean;
//     canEdit: boolean;
//     canDelete: boolean;
// }

// /**
//  * Convert backend permission codes into
//  * UI-level Trouble Ticket permissions.
//  *
//  * Example:
//  * [
//  *   "TT_VIEW",
//  *   "TT_ASSIGN",
//  *   "TT_REQUISITION"
//  * ]
//  *
//  * => View + Assign + Requisition
//  * => Edit + Delete hidden
//  */
// export function mapTTPermissions(
//     permissions: string[]
// ): TTActionPermissions {
//     const permissionSet = new Set(
//         permissions.map((permission) =>
//             permission.trim().toUpperCase()
//         )
//     );

//     return {
//         canView: permissionSet.has("TT_VIEW"),
//         canAssign: permissionSet.has("TT_ASSIGN"),
//         canRequisition: permissionSet.has("TT_REQUISITION"),
//         canEdit: permissionSet.has("TT_EDIT"),
//         canDelete: permissionSet.has("TT_DELETE"),
//     };
// }

// /* ======================================================
//    HELPERS
// ====================================================== */

// function normalizeTicketStatus(
//     value: unknown
// ): DisplayTicketStatus {
//     const normalized = String(value ?? "")
//         .trim()
//         .toLowerCase();

//     if (
//         normalized === "closed" ||
//         normalized === "close" ||
//         normalized === "0"
//     ) {
//         return "Closed";
//     }

//     return "Open";
// }

// function formatDuration(seconds: number): string {
//     const safeSeconds = Math.max(
//         0,
//         Number(seconds || 0)
//     );

//     const days = Math.floor(
//         safeSeconds / 86400
//     );

//     const hours = Math.floor(
//         (safeSeconds % 86400) / 3600
//     );

//     const minutes = Math.floor(
//         (safeSeconds % 3600) / 60
//     );

//     return `${days}d ${hours}h ${minutes}m`;
// }

// function textValue(value: unknown): string {
//     const normalized = String(
//         value ?? ""
//     ).trim();

//     return normalized || "—";
// }

// function normalizeDateValue(value: string): string {
//     const trimmed = value.trim();

//     if (!trimmed) {
//         return "";
//     }

//     return trimmed
//         .replace(" ", "T")
//         .replace(
//             /([+-]\d{2})$/,
//             "$1:00"
//         );
// }

// function formatCreatedAt(value: string): string {
//     if (!value) {
//         return "—";
//     }

//     const date = new Date(
//         normalizeDateValue(value)
//     );

//     if (
//         Number.isNaN(
//             date.getTime()
//         )
//     ) {
//         return value;
//     }

//     return new Intl.DateTimeFormat(
//         "en-GB",
//         {
//             day: "2-digit",
//             month: "short",
//             year: "2-digit",
//             hour: "2-digit",
//             minute: "2-digit",
//             hour12: true,
//             timeZone: "Asia/Dhaka",
//         }
//     ).format(date);
// }

// /* ======================================================
//    API -> TABLE
// ====================================================== */

// export function toSection(
//     item: TroubleTicketItem
// ): Section {
//     const requisitionType = String(
//         item.requisition_type ?? ""
//     ).trim();

//     const deliveredStatus = String(
//         item.delivered_status ?? ""
//     ).trim();

//     return {
//         ...item,

//         status: normalizeTicketStatus(
//             item.status
//         ),

//         requisition_type:
//             requisitionType,

//         // Keep for old modal compatibility.
//         requistionType:
//             requisitionType,

//         delivered_status:
//             deliveredStatus,

//         tt_age:
//             formatDuration(
//                 item.age_seconds
//             ),
//     };
// }

// /* ======================================================
//    COMMON STYLE
// ====================================================== */

// const textClass =
//     "text-[10px] leading-[13px]";

// const badgeClass =
//     "inline-flex h-[20px] items-center rounded-full px-1.5 py-0 text-[9px] font-medium leading-none whitespace-nowrap";

// const buttonClass =
//     "h-6 gap-1 px-2 text-[9px] font-medium";

// const menuClass =
//     "text-[10px]";

// /* ======================================================
//    CELL TEXT
// ====================================================== */

// function CellText({
//     value,
//     className = "",
// }: {
//     value: unknown;
//     className?: string;
// }) {
//     const display = textValue(value);

//     return (
//         <span
//             title={
//                 display === "—"
//                     ? undefined
//                     : display
//             }
//             className={`
//                 ${textClass}
//                 block
//                 truncate
//                 font-medium
//                 text-foreground
//                 ${className}
//             `}
//         >
//             {display}
//         </span>
//     );
// }

// /* ======================================================
//    STATUS
// ====================================================== */

// const statusConfiguration: Record<
//     DisplayTicketStatus,
//     BadgeConfiguration
// > = {
//     Open: {
//         icon: (
//             <Clock className="h-3 w-3 shrink-0" />
//         ),
//         className:
//             "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
//     },

//     Closed: {
//         icon: (
//             <CheckCircle className="h-3 w-3 shrink-0" />
//         ),
//         className:
//             "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
//     },
// };

// /* ======================================================
//    REQUISITION
// ====================================================== */

// function requisitionClass(
//     value: string
// ): string {
//     if (
//         value ===
//         "Petty Cash (Approved)"
//     ) {
//         return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
//     }

//     if (
//         value ===
//         "PR (Approved)"
//     ) {
//         return "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300";
//     }

//     return "border-border bg-muted text-foreground";
// }

// /* ======================================================
//    DELIVERY
// ====================================================== */

// function deliveryConfiguration(
//     value: string
// ): BadgeConfiguration {
//     const normalized =
//         value.trim().toLowerCase();

//     if (
//         normalized === "delivered"
//     ) {
//         return {
//             icon: (
//                 <CheckCircle className="h-3 w-3 shrink-0" />
//             ),
//             className:
//                 "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
//         };
//     }

//     if (
//         normalized === "rejected"
//     ) {
//         return {
//             icon: (
//                 <XCircle className="h-3 w-3 shrink-0" />
//             ),
//             className:
//                 "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
//         };
//     }

//     return {
//         icon: (
//             <Clock className="h-3 w-3 shrink-0" />
//         ),
//         className:
//             "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
//     };
// }

// /* ======================================================
//    TT NUMBER
// ====================================================== */

// function TTNoCell({
//     section,
// }: {
//     section: Section;
// }) {
//     const { openModal } =
//         useTTModal();

//     const ttNo = textValue(
//         section.tt_no
//     );

//     return (
//         <button
//             type="button"
//             title={ttNo}
//             onClick={() =>
//                 openModal(section)
//             }
//             className="
//                 inline-flex
//                 h-[22px]
//                 min-w-[118px]
//                 items-center
//                 justify-center
//                 rounded-md
//                 border
//                 border-border
//                 bg-muted/40
//                 px-1.5
//                 font-mono
//                 text-[9.5px]
//                 font-semibold
//                 leading-none
//                 tracking-[-0.15px]
//                 text-foreground
//                 whitespace-nowrap
//                 tabular-nums
//                 transition-colors
//                 hover:border-primary/40
//                 hover:bg-primary/5
//                 hover:text-primary
//                 focus:outline-none
//                 focus:ring-2
//                 focus:ring-primary/20
//             "
//         >
//             {ttNo}
//         </button>
//     );
// }

// /* ======================================================
//    TT ACTIONS
// ====================================================== */

// function ActionCell({
//     section,
//     permissions,
// }: {
//     section: Section;
//     permissions: TTActionPermissions;
// }) {
//     const { openModal } =
//         useTTModal();

//     const hasActions =
//         permissions.canView ||
//         permissions.canAssign ||
//         permissions.canRequisition ||
//         permissions.canEdit ||
//         permissions.canDelete;

//     /*
//      * No permission = no Action button.
//      */
//     if (!hasActions) {
//         return null;
//     }

//     function handleAssign() {
//         console.log(
//             "Assign TT:",
//             section.tt_no
//         );
//     }

//     function handleRequisition() {
//         console.log(
//             "Requisition TT:",
//             section.tt_no
//         );
//     }

//     function handleEdit() {
//         console.log(
//             "Edit TT:",
//             section.tt_no
//         );
//     }

//     function handleDelete() {
//         console.log(
//             "Delete TT:",
//             section.tt_no
//         );
//     }

//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger
//                 asChild
//             >
//                 <Button
//                     variant="outline"
//                     size="sm"
//                     className={`
//                         ${buttonClass}
//                         border-primary/70
//                         text-primary
//                         hover:bg-primary/5
//                         hover:text-primary
//                     `}
//                 >
//                     Action
//                     <ChevronDown className="h-3 w-3" />
//                 </Button>
//             </DropdownMenuTrigger>

//             <DropdownMenuContent
//                 align="end"
//                 className="w-44"
//             >
//                 {/* VIEW */}
//                 {permissions.canView && (
//                     <DropdownMenuItem
//                         className={`
//                             ${menuClass}
//                             cursor-pointer
//                         `}
//                         onClick={() =>
//                             openModal(section)
//                         }
//                     >
//                         <Eye className="h-3.5 w-3.5 text-indigo-600" />
//                         View Details
//                     </DropdownMenuItem>
//                 )}

//                 {/* ASSIGN */}
//                 {permissions.canAssign && (
//                     <DropdownMenuItem
//                         className={`
//                             ${menuClass}
//                             cursor-pointer
//                         `}
//                         onClick={
//                             handleAssign
//                         }
//                     >
//                         <UserCheck className="h-3.5 w-3.5 text-blue-600" />
//                         Assign
//                     </DropdownMenuItem>
//                 )}

//                 {/* REQUISITION */}
//                 {permissions.canRequisition && (
//                     <DropdownMenuItem
//                         className={`
//                             ${menuClass}
//                             cursor-pointer
//                         `}
//                         onClick={
//                             handleRequisition
//                         }
//                     >
//                         <ClipboardList className="h-3.5 w-3.5 text-indigo-600" />
//                         Requisition
//                     </DropdownMenuItem>
//                 )}

//                 {/* EDIT */}
//                 {permissions.canEdit && (
//                     <DropdownMenuItem
//                         className={`
//                             ${menuClass}
//                             cursor-pointer
//                         `}
//                         onClick={
//                             handleEdit
//                         }
//                     >
//                         <Pencil className="h-3.5 w-3.5 text-primary" />
//                         Update
//                     </DropdownMenuItem>
//                 )}

//                 {/* DELETE */}
//                 {permissions.canDelete && (
//                     <>
//                         <DropdownMenuSeparator />

//                         <DropdownMenuItem
//                             className={`
//                                 ${menuClass}
//                                 cursor-pointer
//                                 text-red-600
//                                 focus:text-red-700
//                             `}
//                             onClick={
//                                 handleDelete
//                             }
//                         >
//                             <Trash2 className="h-3.5 w-3.5" />
//                             Delete
//                         </DropdownMenuItem>
//                     </>
//                 )}
//             </DropdownMenuContent>
//         </DropdownMenu>
//     );
// }

// /* ======================================================
//    COLUMNS
// ====================================================== */

// export function createTTColumns(
//     permissions: TTActionPermissions
// ): ColumnDef<Section>[] {
//     return [
//         {
//             id: "serial",
//             size: 48,
//             minSize: 48,
//             maxSize: 48,
//             accessorFn: (
//                 _row,
//                 index
//             ) => index + 1,
//             header: "SL",
//             enableHiding: false,
//             enableSorting: false,
//             cell: ({
//                 row,
//                 table,
//             }) => {
//                 const orderedRows =
//                     table
//                         .getPrePaginationRowModel()
//                         .rows;

//                 const position =
//                     orderedRows.findIndex(
//                         (item) =>
//                             item.id ===
//                             row.id
//                     );

//                 const serial =
//                     position >= 0
//                         ? position + 1
//                         : row.index + 1;

//                 return (
//                     <span
//                         className="
//                             text-[10px]
//                             font-semibold
//                             tabular-nums
//                             text-foreground
//                         "
//                     >
//                         {serial}
//                     </span>
//                 );
//             },
//         },

//         {
//             accessorKey: "tt_no",
//             header: "TT No",
//             size: 128,
//             minSize: 128,
//             maxSize: 128,
//             enableHiding: false,
//             cell: ({ row }) => (
//                 <TTNoCell
//                     section={
//                         row.original
//                     }
//                 />
//             ),
//         },

//         {
//             accessorKey: "employee_id",
//             header: "Employee ID",
//             size: 82,
//             minSize: 82,
//             maxSize: 82,
//             cell: ({ row }) => (
//                 <CellText
//                     value={
//                         row.original
//                             .employee_id
//                     }
//                     className="
//                         max-w-[80px]
//                         whitespace-nowrap
//                         tabular-nums
//                     "
//                 />
//             ),
//         },

//         {
//             accessorKey: "employee_name",
//             header: "Emp Name",
//             size: 125,
//             minSize: 110,
//             maxSize: 150,
//             cell: ({ row }) => (
//                 <CellText
//                     value={
//                         row.original
//                             .employee_name
//                     }
//                     className="max-w-[120px]"
//                 />
//             ),
//         },

//         {
//             accessorKey: "query_type",
//             header: "Query",
//             size: 170,
//             minSize: 140,
//             maxSize: 200,
//             cell: ({ row }) => (
//                 <CellText
//                     value={
//                         row.original
//                             .query_type
//                     }
//                     className="max-w-[165px]"
//                 />
//             ),
//         },

//         {
//             accessorKey: "tt_age",
//             header: "Age",
//             size: 75,
//             minSize: 70,
//             maxSize: 82,
//             cell: ({ row }) => (
//                 <span
//                     className="
//                         whitespace-nowrap
//                         text-[10px]
//                         font-semibold
//                         tabular-nums
//                         text-foreground
//                     "
//                 >
//                     {row.original.tt_age}
//                 </span>
//             ),
//         },

//         {
//             accessorKey: "dept_name",
//             header: "Department",
//             size: 120,
//             minSize: 100,
//             maxSize: 150,
//             cell: ({ row }) => (
//                 <CellText
//                     value={
//                         row.original
//                             .dept_name
//                     }
//                     className="max-w-[115px]"
//                 />
//             ),
//         },

//         {
//             accessorKey: "func_name",
//             header: "Function",
//             size: 90,
//             minSize: 80,
//             maxSize: 110,
//             cell: ({ row }) => (
//                 <CellText
//                     value={
//                         row.original
//                             .func_name
//                     }
//                     className="max-w-[85px]"
//                 />
//             ),
//         },

//         {
//             accessorKey: "mobile_no",
//             header: "Mobile",
//             size: 92,
//             minSize: 88,
//             maxSize: 100,
//             cell: ({ row }) => (
//                 <span
//                     className="
//                         whitespace-nowrap
//                         text-[10px]
//                         font-medium
//                         tabular-nums
//                         text-foreground
//                     "
//                 >
//                     {textValue(
//                         row.original
//                             .mobile_no
//                     )}
//                 </span>
//             ),
//         },

//         {
//             accessorKey: "status",
//             header: "Status",
//             size: 76,
//             minSize: 72,
//             maxSize: 82,
//             enableHiding: false,
//             cell: ({ row }) => {
//                 const status =
//                     normalizeTicketStatus(
//                         row.original
//                             .status
//                     );

//                 const config =
//                     statusConfiguration[
//                     status
//                     ];

//                 return (
//                     <Badge
//                         variant="outline"
//                         className={`
//                             ${badgeClass}
//                             gap-1
//                             ${config.className}
//                         `}
//                     >
//                         {config.icon}
//                         {status}
//                     </Badge>
//                 );
//             },
//         },

//         {
//             accessorKey:
//                 "requisition_type",
//             header: "Requisition",
//             size: 116,
//             minSize: 108,
//             maxSize: 125,
//             cell: ({ row }) => {
//                 const value =
//                     String(
//                         row.original
//                             .requisition_type ??
//                         ""
//                     ).trim();

//                 if (!value) {
//                     return (
//                         <span
//                             className="
//                                 text-[9px]
//                                 text-muted-foreground/70
//                             "
//                         >
//                             —
//                         </span>
//                     );
//                 }

//                 let display = value;

//                 if (
//                     value ===
//                     "Petty Cash (Approved)"
//                 ) {
//                     display = "Petty Cash";
//                 }

//                 if (
//                     value ===
//                     "PR (Approved)"
//                 ) {
//                     display = "PR";
//                 }

//                 return (
//                     <Badge
//                         variant="outline"
//                         title={value}
//                         className={`
//                             ${badgeClass}
//                             gap-1
//                             ${requisitionClass(
//                             value
//                         )}
//                         `}
//                     >
//                         <CheckCircle className="h-3 w-3 shrink-0" />

//                         <span className="whitespace-nowrap">
//                             {display}
//                         </span>
//                     </Badge>
//                 );
//             },
//         },

//         {
//             accessorKey:
//                 "delivered_status",
//             header: "Delivery",
//             size: 92,
//             minSize: 88,
//             maxSize: 100,
//             cell: ({ row }) => {
//                 const value =
//                     String(
//                         row.original
//                             .delivered_status ??
//                         ""
//                     ).trim();

//                 if (!value) {
//                     return (
//                         <span
//                             className="
//                                 text-[9px]
//                                 text-muted-foreground/70
//                             "
//                         >
//                             —
//                         </span>
//                     );
//                 }

//                 const config =
//                     deliveryConfiguration(
//                         value
//                     );

//                 return (
//                     <Badge
//                         variant="outline"
//                         className={`
//                             ${badgeClass}
//                             gap-1
//                             ${config.className}
//                         `}
//                     >
//                         {config.icon}
//                         {value}
//                     </Badge>
//                 );
//             },
//         },

//         {
//             accessorKey: "created_at",
//             header: "Created",
//             size: 108,
//             minSize: 100,
//             maxSize: 115,
//             cell: ({ row }) => {
//                 const formatted =
//                     formatCreatedAt(
//                         row.original
//                             .created_at
//                     );

//                 return (
//                     <span
//                         title={
//                             row.original
//                                 .created_at
//                         }
//                         className="
//                             block
//                             max-w-[104px]
//                             truncate
//                             whitespace-nowrap
//                             text-[9px]
//                             text-foreground
//                         "
//                     >
//                         {formatted}
//                     </span>
//                 );
//             },
//         },

//         /* ==================================================
//            ACTION
//         ================================================== */

//         {
//             id: "actions",
//             header: "Action",
//             size: 78,
//             minSize: 76,
//             maxSize: 82,
//             enableHiding: false,
//             enableSorting: false,

//             cell: ({ row }) => (
//                 <ActionCell
//                     section={
//                         row.original
//                     }
//                     permissions={
//                         permissions
//                     }
//                 />
//             ),
//         },
//     ];
// }




// "use client";

// import type { ReactNode } from "react";
// import type { ColumnDef } from "@tanstack/react-table";
// import {
//     CheckCircle,
//     ChevronDown,
//     ClipboardList,
//     Clock,
//     Eye,
//     Pencil,
//     Trash2,
//     UserCheck,
//     XCircle,
//     Loader2,
// } from "lucide-react";

// import { useEffect, useState } from "react";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";

// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
// } from "@/components/ui/dialog";

// import { Input } from "@/components/ui/input";

// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";

// import { useTTModal } from "@/components/ui/tt-modal-store";

// import {
//     dashboardApi,
//     type TroubleTicketItem,
//     type TroubleTicketITPersonnel,
// } from "@/lib/api";

// import type { Section } from "@/types/tt";

// export type { Section } from "@/types/tt";

// /* ======================================================
//    TYPES
// ====================================================== */

// type DisplayTicketStatus = "Open" | "Closed";

// type BadgeConfiguration = {
//     icon: ReactNode;
//     className: string;
// };

// /* ======================================================
//    TT ACTION PERMISSIONS
// ====================================================== */

// export interface TTActionPermissions {
//     canView: boolean;
//     canAssign: boolean;
//     canRequisition: boolean;
//     canEdit: boolean;
//     canDelete: boolean;
// }

// /**
//  * Convert backend permission codes into
//  * UI-level Trouble Ticket permissions.
//  */
// export function mapTTPermissions(
//     permissions: string[]
// ): TTActionPermissions {
//     const permissionSet = new Set(
//         permissions.map((permission) =>
//             permission.trim().toUpperCase()
//         )
//     );

//     return {
//         canView: permissionSet.has("TT_VIEW"),
//         canAssign: permissionSet.has("TT_ASSIGN"),
//         canRequisition: permissionSet.has("TT_REQUISITION"),
//         canEdit: permissionSet.has("TT_EDIT"),
//         canDelete: permissionSet.has("TT_DELETE"),
//     };
// }

// /* ======================================================
//    HELPERS
// ====================================================== */

// function normalizeTicketStatus(
//     value: unknown
// ): DisplayTicketStatus {
//     const normalized = String(value ?? "")
//         .trim()
//         .toLowerCase();

//     if (
//         normalized === "closed" ||
//         normalized === "close" ||
//         normalized === "0"
//     ) {
//         return "Closed";
//     }

//     return "Open";
// }

// function formatDuration(seconds: number): string {
//     const safeSeconds = Math.max(
//         0,
//         Number(seconds || 0)
//     );

//     const days = Math.floor(
//         safeSeconds / 86400
//     );

//     const hours = Math.floor(
//         (safeSeconds % 86400) / 3600
//     );

//     const minutes = Math.floor(
//         (safeSeconds % 3600) / 60
//     );

//     return `${days}d ${hours}h ${minutes}m`;
// }

// function textValue(value: unknown): string {
//     const normalized = String(
//         value ?? ""
//     ).trim();

//     return normalized || "—";
// }

// function normalizeDateValue(value: string): string {
//     const trimmed = value.trim();

//     if (!trimmed) {
//         return "";
//     }

//     return trimmed
//         .replace(" ", "T")
//         .replace(
//             /([+-]\d{2})$/,
//             "$1:00"
//         );
// }

// function formatCreatedAt(value: string): string {
//     if (!value) {
//         return "—";
//     }

//     const date = new Date(
//         normalizeDateValue(value)
//     );

//     if (
//         Number.isNaN(
//             date.getTime()
//         )
//     ) {
//         return value;
//     }

//     return new Intl.DateTimeFormat(
//         "en-GB",
//         {
//             day: "2-digit",
//             month: "short",
//             year: "2-digit",
//             hour: "2-digit",
//             minute: "2-digit",
//             hour12: true,
//             timeZone: "Asia/Dhaka",
//         }
//     ).format(date);
// }

// /* ======================================================
//    API -> TABLE
// ====================================================== */

// export function toSection(
//     item: TroubleTicketItem
// ): Section {
//     const requisitionType = String(
//         item.requisition_type ?? ""
//     ).trim();

//     const deliveredStatus = String(
//         item.delivered_status ?? ""
//     ).trim();

//     return {
//         ...item,

//         status: normalizeTicketStatus(
//             item.status
//         ),

//         requisition_type:
//             requisitionType,

//         // Keep for old modal compatibility.
//         requistionType:
//             requisitionType,

//         delivered_status:
//             deliveredStatus,

//         tt_age:
//             formatDuration(
//                 item.age_seconds
//             ),
//     };
// }

// /* ======================================================
//    COMMON STYLE
// ====================================================== */

// const textClass =
//     "text-[10px] leading-[13px]";

// const badgeClass =
//     "inline-flex h-[20px] items-center rounded-full px-1.5 py-0 text-[9px] font-medium leading-none whitespace-nowrap";

// const buttonClass =
//     "h-6 gap-1 px-2 text-[9px] font-medium";

// const menuClass =
//     "text-[10px]";

// /* ======================================================
//    CELL TEXT
// ====================================================== */

// function CellText({
//     value,
//     className = "",
// }: {
//     value: unknown;
//     className?: string;
// }) {
//     const display = textValue(value);

//     return (
//         <span
//             title={
//                 display === "—"
//                     ? undefined
//                     : display
//             }
//             className={`
//                 ${textClass}
//                 block
//                 truncate
//                 font-medium
//                 text-foreground
//                 ${className}
//             `}
//         >
//             {display}
//         </span>
//     );
// }

// /* ======================================================
//    STATUS
// ====================================================== */

// const statusConfiguration: Record<
//     DisplayTicketStatus,
//     BadgeConfiguration
// > = {
//     Open: {
//         icon: (
//             <Clock className="h-3 w-3 shrink-0" />
//         ),
//         className:
//             "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
//     },

//     Closed: {
//         icon: (
//             <CheckCircle className="h-3 w-3 shrink-0" />
//         ),
//         className:
//             "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
//     },
// };

// /* ======================================================
//    REQUISITION
// ====================================================== */

// function requisitionClass(
//     value: string
// ): string {
//     if (
//         value ===
//         "Petty Cash (Approved)"
//     ) {
//         return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
//     }

//     if (
//         value ===
//         "PR (Approved)"
//     ) {
//         return "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300";
//     }

//     return "border-border bg-muted text-foreground";
// }

// /* ======================================================
//    DELIVERY
// ====================================================== */

// function deliveryConfiguration(
//     value: string
// ): BadgeConfiguration {
//     const normalized =
//         value.trim().toLowerCase();

//     if (
//         normalized === "delivered"
//     ) {
//         return {
//             icon: (
//                 <CheckCircle className="h-3 w-3 shrink-0" />
//             ),
//             className:
//                 "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
//         };
//     }

//     if (
//         normalized === "rejected"
//     ) {
//         return {
//             icon: (
//                 <XCircle className="h-3 w-3 shrink-0" />
//             ),
//             className:
//                 "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
//         };
//     }

//     return {
//         icon: (
//             <Clock className="h-3 w-3 shrink-0" />
//         ),
//         className:
//             "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
//     };
// }

// /* ======================================================
//    TT NUMBER
// ====================================================== */

// function TTNoCell({
//     section,
// }: {
//     section: Section;
// }) {
//     const { openModal } =
//         useTTModal();

//     const ttNo = textValue(
//         section.tt_no
//     );

//     return (
//         <button
//             type="button"
//             title={ttNo}
//             onClick={() =>
//                 openModal(section)
//             }
//             className="
//                 inline-flex
//                 h-[22px]
//                 min-w-[118px]
//                 items-center
//                 justify-center
//                 rounded-md
//                 border
//                 border-border
//                 bg-muted/40
//                 px-1.5
//                 font-mono
//                 text-[9.5px]
//                 font-semibold
//                 leading-none
//                 tracking-[-0.15px]
//                 text-foreground
//                 whitespace-nowrap
//                 tabular-nums
//                 transition-colors
//                 hover:border-primary/40
//                 hover:bg-primary/5
//                 hover:text-primary
//                 focus:outline-none
//                 focus:ring-2
//                 focus:ring-primary/20
//             "
//         >
//             {ttNo}
//         </button>
//     );
// }

// /* ======================================================
//    ASSIGNMENT API ERROR
// ====================================================== */

// function getErrorMessage(
//     error: unknown
// ): string {
//     if (
//         error instanceof Error &&
//         error.message
//     ) {
//         return error.message;
//     }

//     if (
//         typeof error === "string"
//     ) {
//         return error;
//     }

//     return "Unable to assign Trouble Ticket.";
// }

// /* ======================================================
//    ASSIGN / REASSIGN MODAL
// ====================================================== */

// function AssignmentDialog({
//     section,
//     open,
//     onOpenChange,
// }: {
//     section: Section | null;
//     open: boolean;
//     onOpenChange: (
//         open: boolean
//     ) => void;
// }) {
//     const [
//         personnel,
//         setPersonnel,
//     ] = useState<
//         TroubleTicketITPersonnel[]
//     >([]);

//     const [
//         selectedEmployee,
//         setSelectedEmployee,
//     ] = useState("");

//     const [
//         note,
//         setNote,
//     ] = useState("");

//     const [
//         loadingPersonnel,
//         setLoadingPersonnel,
//     ] = useState(false);

//     const [
//         submitting,
//         setSubmitting,
//     ] = useState(false);

//     const [
//         error,
//         setError,
//     ] = useState("");

//     useEffect(() => {
//         if (!open) {
//             return;
//         }

//         let mounted = true;

//         async function loadPersonnel() {
//             try {
//                 setLoadingPersonnel(true);
//                 setError("");

//                 const response =
//                     await dashboardApi.troubleTicketITPersonnel();

//                 if (!mounted) {
//                     return;
//                 }

//                 setPersonnel(
//                     response.data ?? []
//                 );
//             } catch (reason) {
//                 if (!mounted) {
//                     return;
//                 }

//                 console.error(
//                     "Unable to load IT Personnel:",
//                     reason
//                 );

//                 setPersonnel([]);

//                 setError(
//                     getErrorMessage(
//                         reason
//                     )
//                 );
//             } finally {
//                 if (mounted) {
//                     setLoadingPersonnel(
//                         false
//                     );
//                 }
//             }
//         }

//         void loadPersonnel();

//         return () => {
//             mounted = false;
//         };
//     }, [open]);

//     useEffect(() => {
//         if (!open || !section) {
//             return;
//         }

//         setSelectedEmployee(
//             String(
//                 section.assigned_id ?? ""
//             ).trim()
//         );

//         setNote("");

//         setError("");
//     }, [open, section]);

//     const currentAssignedID =
//         String(
//             section?.assigned_id ?? ""
//         ).trim();

//     const currentAssignedName =
//         String(
//             section?.assigned_name ?? ""
//         ).trim();

//     const isSameEmployee =
//         Boolean(
//             selectedEmployee &&
//             currentAssignedID &&
//             selectedEmployee ===
//             currentAssignedID
//         );

//     async function handleSubmit() {
//         if (!section) {
//             return;
//         }

//         const ticketID =
//             Number(section.id);

//         if (
//             !Number.isFinite(
//                 ticketID
//             ) ||
//             ticketID <= 0
//         ) {
//             setError(
//                 "Invalid Trouble Ticket ID."
//             );
//             return;
//         }

//         if (!selectedEmployee) {
//             setError(
//                 "Please select an IT Personnel."
//             );
//             return;
//         }

//         if (isSameEmployee) {
//             setError(
//                 "This Trouble Ticket is already assigned to the selected employee."
//             );
//             return;
//         }

//         try {
//             setSubmitting(true);
//             setError("");

//             /*
//              * Backend endpoint:
//              *
//              * POST
//              * /api/v1/dashboard/trouble-tickets/:id/assignment
//              *
//              * Request:
//              * {
//              *   assigned_id: "02-2014",
//              *   note: "Reassigned to another IT Personnel"
//              * }
//              */

//             const response =
//                 await fetch(
//                     `/api/v1/dashboard/trouble-tickets/${ticketID}/assignment`,
//                     {
//                         method: "POST",
//                         headers: {
//                             "Content-Type":
//                                 "application/json",
//                         },
//                         credentials:
//                             "include",
//                         body: JSON.stringify(
//                             {
//                                 assigned_id:
//                                     selectedEmployee,
//                                 note:
//                                     note.trim(),
//                             }
//                         ),
//                     }
//                 );

//             let responseBody:
//                 | any
//                 | null = null;

//             try {
//                 responseBody =
//                     await response.json();
//             } catch {
//                 responseBody = null;
//             }

//             if (!response.ok) {
//                 const message =
//                     responseBody?.error ||
//                     responseBody?.message ||
//                     `Assignment failed with status ${response.status}.`;

//                 throw new Error(
//                     message
//                 );
//             }

//             if (
//                 responseBody &&
//                 responseBody.success ===
//                 false
//             ) {
//                 throw new Error(
//                     responseBody.error ||
//                     responseBody.message ||
//                     "Assignment failed."
//                 );
//             }

//             /*
//              * Assignment succeeded.
//              *
//              * Refresh the dashboard so:
//              *
//              * assigned_id
//              * assigned_name
//              * updated_at
//              *
//              * are immediately reflected.
//              */
//             onOpenChange(false);

//             window.location.reload();
//         } catch (reason) {
//             console.error(
//                 "Trouble Ticket assignment failed:",
//                 reason
//             );

//             setError(
//                 getErrorMessage(
//                     reason
//                 )
//             );
//         } finally {
//             setSubmitting(false);
//         }
//     }

//     return (
//         <Dialog
//             open={open}
//             onOpenChange={
//                 submitting
//                     ? undefined
//                     : onOpenChange
//             }
//         >
//             <DialogContent
//                 className="
//                     w-[calc(100%-2rem)]
//                     max-w-md
//                     rounded-xl
//                 "
//             >
//                 <DialogHeader>
//                     <DialogTitle className="text-sm">
//                         {currentAssignedID
//                             ? "Reassign Trouble Ticket"
//                             : "Assign Trouble Ticket"}
//                     </DialogTitle>

//                     <DialogDescription className="text-xs">
//                         Assign this Trouble Ticket
//                         to an active IT Personnel.
//                     </DialogDescription>
//                 </DialogHeader>

//                 <div className="space-y-4 py-2">

//                     {/* TT INFO */}
//                     <div
//                         className="
//                             rounded-lg
//                             border
//                             bg-muted/30
//                             p-3
//                         "
//                     >
//                         <div className="grid grid-cols-2 gap-3">

//                             <div>
//                                 <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
//                                     TT No
//                                 </p>

//                                 <p className="mt-1 font-mono text-[11px] font-semibold">
//                                     {textValue(
//                                         section?.tt_no
//                                     )}
//                                 </p>
//                             </div>

//                             <div>
//                                 <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
//                                     Ticket ID
//                                 </p>

//                                 <p className="mt-1 text-[11px] font-semibold">
//                                     {textValue(
//                                         section?.id
//                                     )}
//                                 </p>
//                             </div>

//                         </div>
//                     </div>

//                     {/* CURRENT ASSIGNEE */}
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-semibold text-foreground">
//                             Current Assignee
//                         </label>

//                         <div
//                             className="
//                                 flex
//                                 min-h-9
//                                 items-center
//                                 rounded-md
//                                 border
//                                 bg-muted/30
//                                 px-3
//                                 text-[11px]
//                             "
//                         >
//                             {currentAssignedID ? (
//                                 <span>
//                                     {currentAssignedName ||
//                                         "Unknown"}
//                                     {" "}
//                                     <span className="text-muted-foreground">
//                                         ({currentAssignedID})
//                                     </span>
//                                 </span>
//                             ) : (
//                                 <span className="text-muted-foreground">
//                                     Not assigned
//                                 </span>
//                             )}
//                         </div>
//                     </div>

//                     {/* IT PERSONNEL */}
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-semibold text-foreground">
//                             Assign To
//                         </label>

//                         <Select
//                             value={
//                                 selectedEmployee
//                             }
//                             onValueChange={
//                                 setSelectedEmployee
//                             }
//                             disabled={
//                                 loadingPersonnel ||
//                                 submitting
//                             }
//                         >
//                             <SelectTrigger className="h-9 text-[11px]">
//                                 <SelectValue
//                                     placeholder={
//                                         loadingPersonnel
//                                             ? "Loading IT Personnel..."
//                                             : "Select IT Personnel"
//                                     }
//                                 />
//                             </SelectTrigger>

//                             <SelectContent>
//                                 {personnel.length ===
//                                     0 ? (
//                                     <SelectItem
//                                         value="__empty__"
//                                         disabled
//                                     >
//                                         No IT Personnel
//                                         available
//                                     </SelectItem>
//                                 ) : (
//                                     personnel.map(
//                                         (
//                                             person
//                                         ) => (
//                                             <SelectItem
//                                                 key={
//                                                     person.employee_id
//                                                 }
//                                                 value={
//                                                     person.employee_id
//                                                 }
//                                             >
//                                                 {
//                                                     person.employee_name
//                                                 }{" "}
//                                                 (
//                                                 {
//                                                     person.employee_id
//                                                 }
//                                                 )
//                                             </SelectItem>
//                                         )
//                                     )
//                                 )}
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     {/* NOTE */}
//                     <div className="space-y-1.5">
//                         <label className="text-[10px] font-semibold text-foreground">
//                             Note
//                             <span className="ml-1 font-normal text-muted-foreground">
//                                 (Optional)
//                             </span>
//                         </label>

//                         <Input
//                             value={note}
//                             onChange={(
//                                 event
//                             ) =>
//                                 setNote(
//                                     event.target
//                                         .value
//                                 )
//                             }
//                             disabled={
//                                 submitting
//                             }
//                             placeholder={
//                                 currentAssignedID
//                                     ? "Reassigned to another IT Personnel"
//                                     : "Assigned to IT Personnel"
//                             }
//                             className="h-9 text-[11px]"
//                         />
//                     </div>

//                     {/* ERROR */}
//                     {error && (
//                         <div
//                             className="
//                                 rounded-md
//                                 border
//                                 border-red-200
//                                 bg-red-50
//                                 px-3
//                                 py-2
//                                 text-[10px]
//                                 leading-4
//                                 text-red-600
//                                 dark:border-red-900
//                                 dark:bg-red-950/30
//                                 dark:text-red-400
//                             "
//                         >
//                             {error}
//                         </div>
//                     )}
//                 </div>

//                 <DialogFooter className="gap-2 sm:gap-2">
//                     <Button
//                         type="button"
//                         variant="outline"
//                         size="sm"
//                         disabled={
//                             submitting
//                         }
//                         onClick={() =>
//                             onOpenChange(
//                                 false
//                             )
//                         }
//                         className="h-8 text-[10px]"
//                     >
//                         Cancel
//                     </Button>

//                     <Button
//                         type="button"
//                         size="sm"
//                         disabled={
//                             submitting ||
//                             loadingPersonnel ||
//                             !selectedEmployee ||
//                             isSameEmployee
//                         }
//                         onClick={
//                             handleSubmit
//                         }
//                         className="h-8 gap-1.5 text-[10px]"
//                     >
//                         {submitting ? (
//                             <>
//                                 <Loader2 className="h-3.5 w-3.5 animate-spin" />
//                                 Assigning...
//                             </>
//                         ) : (
//                             <>
//                                 <UserCheck className="h-3.5 w-3.5" />
//                                 {currentAssignedID
//                                     ? "Reassign"
//                                     : "Assign"}
//                             </>
//                         )}
//                     </Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// }

// /* ======================================================
//    TT ACTIONS
// ====================================================== */

// function ActionCell({
//     section,
//     permissions,
// }: {
//     section: Section;
//     permissions: TTActionPermissions;
// }) {
//     const { openModal } =
//         useTTModal();

//     const [
//         assignmentOpen,
//         setAssignmentOpen,
//     ] = useState(false);

//     const hasActions =
//         permissions.canView ||
//         permissions.canAssign ||
//         permissions.canRequisition ||
//         permissions.canEdit ||
//         permissions.canDelete;

//     if (!hasActions) {
//         return null;
//     }

//     function handleAssign() {
//         setAssignmentOpen(true);
//     }

//     function handleRequisition() {
//         console.log(
//             "Requisition TT:",
//             section.tt_no
//         );
//     }

//     function handleEdit() {
//         console.log(
//             "Edit TT:",
//             section.tt_no
//         );
//     }

//     function handleDelete() {
//         console.log(
//             "Delete TT:",
//             section.tt_no
//         );
//     }

//     return (
//         <>
//             <DropdownMenu>
//                 <DropdownMenuTrigger
//                     asChild
//                 >
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         className={`
//                             ${buttonClass}
//                             border-primary/70
//                             text-primary
//                             hover:bg-primary/5
//                             hover:text-primary
//                         `}
//                     >
//                         Action
//                         <ChevronDown className="h-3 w-3" />
//                     </Button>
//                 </DropdownMenuTrigger>

//                 <DropdownMenuContent
//                     align="end"
//                     className="w-44"
//                 >
//                     {/* VIEW */}
//                     {permissions.canView && (
//                         <DropdownMenuItem
//                             className={`
//                                 ${menuClass}
//                                 cursor-pointer
//                             `}
//                             onClick={() =>
//                                 openModal(
//                                     section
//                                 )
//                             }
//                         >
//                             <Eye className="h-3.5 w-3.5 text-indigo-600" />
//                             View Details
//                         </DropdownMenuItem>
//                     )}

//                     {/* ASSIGN */}
//                     {permissions.canAssign && (
//                         <DropdownMenuItem
//                             className={`
//                                 ${menuClass}
//                                 cursor-pointer
//                             `}
//                             onClick={
//                                 handleAssign
//                             }
//                         >
//                             <UserCheck className="h-3.5 w-3.5 text-blue-600" />
//                             {section.assigned_id
//                                 ? "Reassign"
//                                 : "Assign"}
//                         </DropdownMenuItem>
//                     )}

//                     {/* REQUISITION */}
//                     {permissions.canRequisition && (
//                         <DropdownMenuItem
//                             className={`
//                                 ${menuClass}
//                                 cursor-pointer
//                             `}
//                             onClick={
//                                 handleRequisition
//                             }
//                         >
//                             <ClipboardList className="h-3.5 w-3.5 text-indigo-600" />
//                             Requisition
//                         </DropdownMenuItem>
//                     )}

//                     {/* EDIT */}
//                     {permissions.canEdit && (
//                         <DropdownMenuItem
//                             className={`
//                                 ${menuClass}
//                                 cursor-pointer
//                             `}
//                             onClick={
//                                 handleEdit
//                             }
//                         >
//                             <Pencil className="h-3.5 w-3.5 text-primary" />
//                             Update
//                         </DropdownMenuItem>
//                     )}

//                     {/* DELETE */}
//                     {permissions.canDelete && (
//                         <>
//                             <DropdownMenuSeparator />

//                             <DropdownMenuItem
//                                 className={`
//                                     ${menuClass}
//                                     cursor-pointer
//                                     text-red-600
//                                     focus:text-red-700
//                                 `}
//                                 onClick={
//                                     handleDelete
//                                 }
//                             >
//                                 <Trash2 className="h-3.5 w-3.5" />
//                                 Delete
//                             </DropdownMenuItem>
//                         </>
//                     )}
//                 </DropdownMenuContent>
//             </DropdownMenu>

//             {/* ASSIGNMENT DIALOG */}
//             <AssignmentDialog
//                 section={section}
//                 open={assignmentOpen}
//                 onOpenChange={
//                     setAssignmentOpen
//                 }
//             />
//         </>
//     );
// }

// /* ======================================================
//    COLUMNS
// ====================================================== */

// export function createTTColumns(
//     permissions: TTActionPermissions
// ): ColumnDef<Section>[] {
//     return [
//         /* ==================================================
//            SL
//         ================================================== */

//         {
//             id: "serial",
//             size: 48,
//             minSize: 48,
//             maxSize: 48,

//             accessorFn: (
//                 _row,
//                 index
//             ) => index + 1,

//             header: "SL",

//             enableHiding: false,
//             enableSorting: false,

//             cell: ({
//                 row,
//                 table,
//             }) => {
//                 const orderedRows =
//                     table
//                         .getPrePaginationRowModel()
//                         .rows;

//                 const position =
//                     orderedRows.findIndex(
//                         (item) =>
//                             item.id ===
//                             row.id
//                     );

//                 const serial =
//                     position >= 0
//                         ? position + 1
//                         : row.index + 1;

//                 return (
//                     <span
//                         className="
//                             text-[10px]
//                             font-semibold
//                             tabular-nums
//                             text-foreground
//                         "
//                     >
//                         {serial}
//                     </span>
//                 );
//             },
//         },

//         /* ==================================================
//            TT NO
//         ================================================== */

//         {
//             accessorKey: "tt_no",

//             header: "TT No",

//             size: 128,
//             minSize: 128,
//             maxSize: 128,

//             enableHiding: false,

//             cell: ({ row }) => (
//                 <TTNoCell
//                     section={
//                         row.original
//                     }
//                 />
//             ),
//         },

//         /* ==================================================
//            EMPLOYEE ID
//         ================================================== */

//         {
//             accessorKey:
//                 "employee_id",

//             header: "Employee ID",

//             size: 82,
//             minSize: 82,
//             maxSize: 82,

//             cell: ({ row }) => (
//                 <CellText
//                     value={
//                         row.original
//                             .employee_id
//                     }
//                     className="
//                         max-w-[80px]
//                         whitespace-nowrap
//                         tabular-nums
//                     "
//                 />
//             ),
//         },

//         /* ==================================================
//            EMPLOYEE NAME
//         ================================================== */

//         {
//             accessorKey:
//                 "employee_name",

//             header: "Emp Name",

//             size: 125,
//             minSize: 110,
//             maxSize: 150,

//             cell: ({ row }) => (
//                 <CellText
//                     value={
//                         row.original
//                             .employee_name
//                     }
//                     className="max-w-[120px]"
//                 />
//             ),
//         },

//         /* ==================================================
//            QUERY
//         ================================================== */

//         {
//             accessorKey:
//                 "query_type",

//             header: "Query",

//             size: 170,
//             minSize: 140,
//             maxSize: 200,

//             cell: ({ row }) => (
//                 <CellText
//                     value={
//                         row.original
//                             .query_type
//                     }
//                     className="max-w-[165px]"
//                 />
//             ),
//         },

//         /* ==================================================
//            AGE
//         ================================================== */

//         {
//             accessorKey: "tt_age",

//             header: "Age",

//             size: 75,
//             minSize: 70,
//             maxSize: 82,

//             cell: ({ row }) => (
//                 <span
//                     className="
//                         whitespace-nowrap
//                         text-[10px]
//                         font-semibold
//                         tabular-nums
//                         text-foreground
//                     "
//                 >
//                     {
//                         row.original
//                             .tt_age
//                     }
//                 </span>
//             ),
//         },

//         /* ==================================================
//            DEPARTMENT
//         ================================================== */

//         {
//             accessorKey:
//                 "dept_name",

//             header: "Department",

//             size: 120,
//             minSize: 100,
//             maxSize: 150,

//             cell: ({ row }) => (
//                 <CellText
//                     value={
//                         row.original
//                             .dept_name
//                     }
//                     className="max-w-[115px]"
//                 />
//             ),
//         },

//         /* ==================================================
//            FUNCTION
//         ================================================== */

//         {
//             accessorKey:
//                 "func_name",

//             header: "Function",

//             size: 90,
//             minSize: 80,
//             maxSize: 110,

//             cell: ({ row }) => (
//                 <CellText
//                     value={
//                         row.original
//                             .func_name
//                     }
//                     className="max-w-[85px]"
//                 />
//             ),
//         },

//         /* ==================================================
//            MOBILE
//         ================================================== */

//         {
//             accessorKey:
//                 "mobile_no",

//             header: "Mobile",

//             size: 92,
//             minSize: 88,
//             maxSize: 100,

//             cell: ({ row }) => (
//                 <span
//                     className="
//                         whitespace-nowrap
//                         text-[10px]
//                         font-medium
//                         tabular-nums
//                         text-foreground
//                     "
//                 >
//                     {textValue(
//                         row.original
//                             .mobile_no
//                     )}
//                 </span>
//             ),
//         },

//         /* ==================================================
//            STATUS
//         ================================================== */

//         {
//             accessorKey: "status",

//             header: "Status",

//             size: 76,
//             minSize: 72,
//             maxSize: 82,

//             enableHiding: false,

//             cell: ({ row }) => {
//                 const status =
//                     normalizeTicketStatus(
//                         row.original
//                             .status
//                     );

//                 const config =
//                     statusConfiguration[
//                     status
//                     ];

//                 return (
//                     <Badge
//                         variant="outline"
//                         className={`
//                             ${badgeClass}
//                             gap-1
//                             ${config.className}
//                         `}
//                     >
//                         {config.icon}
//                         {status}
//                     </Badge>
//                 );
//             },
//         },

//         /* ==================================================
//            REQUISITION
//         ================================================== */

//         {
//             accessorKey:
//                 "requisition_type",

//             header: "Requisition",

//             size: 116,
//             minSize: 108,
//             maxSize: 125,

//             cell: ({ row }) => {
//                 const value =
//                     String(
//                         row.original
//                             .requisition_type ??
//                         ""
//                     ).trim();

//                 if (!value) {
//                     return (
//                         <span
//                             className="
//                                 text-[9px]
//                                 text-muted-foreground/70
//                             "
//                         >
//                             —
//                         </span>
//                     );
//                 }

//                 let display =
//                     value;

//                 if (
//                     value ===
//                     "Petty Cash (Approved)"
//                 ) {
//                     display =
//                         "Petty Cash";
//                 }

//                 if (
//                     value ===
//                     "PR (Approved)"
//                 ) {
//                     display = "PR";
//                 }

//                 return (
//                     <Badge
//                         variant="outline"
//                         title={value}
//                         className={`
//                             ${badgeClass}
//                             gap-1
//                             ${requisitionClass(
//                             value
//                         )}
//                         `}
//                     >
//                         <CheckCircle className="h-3 w-3 shrink-0" />

//                         <span className="whitespace-nowrap">
//                             {display}
//                         </span>
//                     </Badge>
//                 );
//             },
//         },

//         /* ==================================================
//            DELIVERY
//         ================================================== */

//         {
//             accessorKey:
//                 "delivered_status",

//             header: "Delivery",

//             size: 92,
//             minSize: 88,
//             maxSize: 100,

//             cell: ({ row }) => {
//                 const value =
//                     String(
//                         row.original
//                             .delivered_status ??
//                         ""
//                     ).trim();

//                 if (!value) {
//                     return (
//                         <span
//                             className="
//                                 text-[9px]
//                                 text-muted-foreground/70
//                             "
//                         >
//                             —
//                         </span>
//                     );
//                 }

//                 const config =
//                     deliveryConfiguration(
//                         value
//                     );

//                 return (
//                     <Badge
//                         variant="outline"
//                         className={`
//                             ${badgeClass}
//                             gap-1
//                             ${config.className}
//                         `}
//                     >
//                         {config.icon}
//                         {value}
//                     </Badge>
//                 );
//             },
//         },

//         /* ==================================================
//            CREATED
//         ================================================== */

//         {
//             accessorKey:
//                 "created_at",

//             header: "Created",

//             size: 108,
//             minSize: 100,
//             maxSize: 115,

//             cell: ({ row }) => {
//                 const formatted =
//                     formatCreatedAt(
//                         row.original
//                             .created_at
//                     );

//                 return (
//                     <span
//                         title={
//                             row.original
//                                 .created_at
//                         }
//                         className="
//                             block
//                             max-w-[104px]
//                             truncate
//                             whitespace-nowrap
//                             text-[9px]
//                             text-foreground
//                         "
//                     >
//                         {formatted}
//                     </span>
//                 );
//             },
//         },

//         /* ==================================================
//            ACTION
//         ================================================== */

//         {
//             id: "actions",

//             header: "Action",

//             size: 78,
//             minSize: 76,
//             maxSize: 82,

//             enableHiding: false,
//             enableSorting: false,

//             cell: ({ row }) => (
//                 <ActionCell
//                     section={
//                         row.original
//                     }
//                     permissions={
//                         permissions
//                     }
//                 />
//             ),
//         },
//     ];
// }



"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import {
    CheckCircle,
    ChevronDown,
    ClipboardList,
    Clock,
    Eye,
    Loader2,
    Pencil,
    Trash2,
    UserCheck,
    XCircle,
} from "lucide-react";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTTModal } from "@/components/ui/tt-modal-store";

import {
    dashboardApi,
    getToken,
    type TroubleTicketItem,
    type TroubleTicketITPersonnel,
} from "@/lib/api";

import type { Section } from "@/types/tt";

/* ============================================================
   EXPORT
============================================================ */

export type { Section } from "@/types/tt";

/* ============================================================
   PERMISSIONS
============================================================ */

export interface TTActionPermissions {
    canView: boolean;
    canAssign: boolean;
    canRequisition: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

/* ============================================================
   MAP RBAC PERMISSIONS
============================================================ */

export function mapTTPermissions(
    permissions: string[]
): TTActionPermissions {
    const permissionSet = new Set(
        permissions.map((permission) =>
            permission.trim().toUpperCase()
        )
    );

    return {
        canView: permissionSet.has("TT_VIEW"),
        canAssign: permissionSet.has("TT_ASSIGN"),
        canRequisition:
            permissionSet.has("TT_REQUISITION"),
        canEdit: permissionSet.has("TT_EDIT"),
        canDelete: permissionSet.has("TT_DELETE"),
    };
}

/* ============================================================
   HELPERS
============================================================ */

function textValue(value: unknown): string {
    const result = String(value ?? "").trim();

    return result || "—";
}

function normalizeStatus(
    value: unknown
): "Open" | "Closed" {
    const status = String(value ?? "")
        .trim()
        .toLowerCase();

    if (
        status === "closed" ||
        status === "close" ||
        status === "0"
    ) {
        return "Closed";
    }

    return "Open";
}

function formatDuration(
    seconds: number
): string {
    const value = Math.max(
        0,
        Number(seconds || 0)
    );

    const days = Math.floor(
        value / 86400
    );

    const hours = Math.floor(
        (value % 86400) / 3600
    );

    const minutes = Math.floor(
        (value % 3600) / 60
    );

    return `${days}d ${hours}h ${minutes}m`;
}

function formatCreatedAt(
    value: string
): string {
    if (!value) {
        return "—";
    }

    const normalized = value
        .trim()
        .replace(" ", "T");

    const date = new Date(
        normalized
    );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Dhaka",
        }
    ).format(date);
}

/* ============================================================
   API ITEM -> SECTION
============================================================ */

export function toSection(
    item: TroubleTicketItem
): Section {
    const requisitionType = String(
        item.requisition_type ?? ""
    ).trim();

    const deliveredStatus = String(
        item.delivered_status ?? ""
    ).trim();

    return {
        ...item,

        status: normalizeStatus(
            item.status
        ),

        requisition_type:
            requisitionType,

        requistionType:
            requisitionType,

        delivered_status:
            deliveredStatus,

        tt_age: formatDuration(
            item.age_seconds
        ),
    };
}

/* ============================================================
   COMMON CLASSES
============================================================ */

const textClass =
    "text-[10px] leading-[13px]";

const badgeClass =
    "inline-flex h-[20px] items-center rounded-full px-1.5 py-0 text-[9px] font-medium leading-none whitespace-nowrap";

/* ============================================================
   CELL TEXT
============================================================ */

function CellText({
    value,
    className = "",
}: {
    value: unknown;
    className?: string;
}) {
    const display =
        textValue(value);

    return (
        <span
            title={
                display === "—"
                    ? undefined
                    : display
            }
            className={`
                ${textClass}
                block
                truncate
                font-medium
                text-foreground
                ${className}
            `}
        >
            {display}
        </span>
    );
}

/* ============================================================
   STATUS CONFIG
============================================================ */

const statusConfig = {
    Open: {
        icon: (
            <Clock className="h-3 w-3" />
        ),
        className:
            "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
    },

    Closed: {
        icon: (
            <CheckCircle className="h-3 w-3" />
        ),
        className:
            "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
};

/* ============================================================
   REQUISITION STYLE
============================================================ */

function requisitionClass(
    value: string
): string {
    if (
        value ===
        "Petty Cash (Approved)"
    ) {
        return "border-emerald-300 bg-emerald-50 text-emerald-700";
    }

    if (
        value ===
        "PR (Approved)"
    ) {
        return "border-indigo-300 bg-indigo-50 text-indigo-700";
    }

    return "border-border bg-muted text-foreground";
}

/* ============================================================
   DELIVERY STYLE
============================================================ */

function deliveryConfig(
    value: string
) {
    const normalized =
        value
            .trim()
            .toLowerCase();

    if (
        normalized ===
        "delivered"
    ) {
        return {
            icon: (
                <CheckCircle className="h-3 w-3" />
            ),
            className:
                "border-emerald-300 bg-emerald-50 text-emerald-700",
        };
    }

    if (
        normalized ===
        "rejected"
    ) {
        return {
            icon: (
                <XCircle className="h-3 w-3" />
            ),
            className:
                "border-red-300 bg-red-50 text-red-700",
        };
    }

    return {
        icon: (
            <Clock className="h-3 w-3" />
        ),
        className:
            "border-amber-300 bg-amber-50 text-amber-700",
    };
}

/* ============================================================
   TT NUMBER CELL
============================================================ */

function TTNoCell({
    section,
}: {
    section: Section;
}) {
    const { openModal } =
        useTTModal();

    return (
        <button
            type="button"
            onClick={() =>
                openModal(section)
            }
            title={textValue(
                section.tt_no
            )}
            className="
                inline-flex
                h-[22px]
                min-w-[118px]
                items-center
                justify-center
                rounded-md
                border
                border-border
                bg-muted/40
                px-1.5
                font-mono
                text-[9.5px]
                font-semibold
                tracking-[-0.15px]
                text-foreground
                transition-colors
                hover:border-primary/40
                hover:bg-primary/5
                hover:text-primary
            "
        >
            {textValue(
                section.tt_no
            )}
        </button>
    );
}

/* ============================================================
   ASSIGNMENT ERROR
============================================================ */

function assignmentError(
    error: unknown
): string {
    if (
        error instanceof Error &&
        error.message
    ) {
        return error.message;
    }

    if (
        typeof error ===
        "string"
    ) {
        return error;
    }

    return "Unable to process Trouble Ticket assignment.";
}

/* ============================================================
   ASSIGNMENT DIALOG
============================================================ */

function AssignmentDialog({
    section,
    open,
    onOpenChange,
}: {
    section: Section | null;
    open: boolean;
    onOpenChange: (
        open: boolean
    ) => void;
}) {
    const [
        personnel,
        setPersonnel,
    ] = useState<
        TroubleTicketITPersonnel[]
    >([]);

    const [
        selectedEmployee,
        setSelectedEmployee,
    ] = useState("");

    const [
        note,
        setNote,
    ] = useState("");

    const [
        loadingPersonnel,
        setLoadingPersonnel,
    ] = useState(false);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    /* ========================================================
       LOAD IT PERSONNEL
    ======================================================== */

    useEffect(() => {
        if (!open) {
            return;
        }

        let mounted = true;

        async function loadPersonnel() {
            try {
                setLoadingPersonnel(true);
                setError("");

                const response =
                    await dashboardApi.troubleTicketITPersonnel();

                if (!mounted) {
                    return;
                }

                setPersonnel(
                    response.data ?? []
                );
            } catch (reason) {
                if (!mounted) {
                    return;
                }

                console.error(
                    "Failed to load IT Personnel:",
                    reason
                );

                setPersonnel([]);

                setError(
                    assignmentError(
                        reason
                    )
                );
            } finally {
                if (mounted) {
                    setLoadingPersonnel(
                        false
                    );
                }
            }
        }

        void loadPersonnel();

        return () => {
            mounted = false;
        };
    }, [open]);

    /* ========================================================
       RESET MODAL
    ======================================================== */

    useEffect(() => {
        if (!open || !section) {
            return;
        }

        setSelectedEmployee(
            String(
                section.assigned_id ??
                ""
            ).trim()
        );

        setNote("");

        setError("");
    }, [open, section]);

    /* ========================================================
       CURRENT ASSIGNEE
    ======================================================== */

    const currentAssignedID =
        String(
            section?.assigned_id ??
            ""
        ).trim();

    const currentAssignedName =
        String(
            section?.assigned_name ??
            ""
        ).trim();

    const alreadyAssigned =
        Boolean(
            currentAssignedID &&
            selectedEmployee ===
            currentAssignedID
        );

    /* ========================================================
       SUBMIT ASSIGNMENT
    ======================================================== */

    async function handleSubmit() {
        if (!section) {
            return;
        }

        const ticketID =
            Number(section.id);

        if (
            !Number.isFinite(
                ticketID
            ) ||
            ticketID <= 0
        ) {
            setError(
                "Invalid Trouble Ticket ID."
            );

            return;
        }

        if (!selectedEmployee) {
            setError(
                "Please select an IT Personnel."
            );

            return;
        }

        if (alreadyAssigned) {
            setError(
                "This ticket is already assigned to the selected employee."
            );

            return;
        }

        try {
            setSubmitting(true);
            setError("");

            /*
             * IMPORTANT:
             *
             * Backend:
             *
             * POST
             * /api/v1/dashboard/trouble-tickets/:id/assignment
             *
             * Body:
             *
             * {
             *   assigned_id: "02-2014",
             *   note: "..."
             * }
             */

            const apiBase =
                (
                    process.env.NEXT_PUBLIC_API_URL ??
                    ""
                ).replace(
                    /\/$/,
                    ""
                );

            const token = getToken();

            const headers: HeadersInit = {
                "Content-Type": "application/json",
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(
                `${apiBase}/dashboard/trouble-tickets/${ticketID}/assignment`,
                {
                    method: "POST",
                    headers,
                    credentials: "include",
                    body: JSON.stringify({
                        assigned_id: selectedEmployee,
                        note: note.trim(),
                    }),
                }
            );

            let body:
                | {
                    success?: boolean;
                    error?: string;
                    message?: string;
                    data?: unknown;
                }
                | null = null;

            try {
                body =
                    await response.json();
            } catch {
                body = null;
            }

            if (!response.ok) {
                throw new Error(
                    body?.error ||
                    body?.message ||
                    `Assignment failed (${response.status}).`
                );
            }

            if (
                body?.success ===
                false
            ) {
                throw new Error(
                    body.error ||
                    body.message ||
                    "Assignment failed."
                );
            }

            /*
             * Successful assignment.
             *
             * Close modal first,
             * then refresh dashboard.
             */
            onOpenChange(false);

            window.location.reload();
        } catch (reason) {
            console.error(
                "Trouble Ticket assignment failed:",
                reason
            );

            setError(
                assignmentError(
                    reason
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    /* ========================================================
       DIALOG
    ======================================================== */

    return (
        <Dialog
            open={open}
            onOpenChange={
                submitting
                    ? undefined
                    : onOpenChange
            }
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-sm">
                        {currentAssignedID
                            ? "Reassign Trouble Ticket"
                            : "Assign Trouble Ticket"}
                    </DialogTitle>

                    <DialogDescription className="mt-1 text-xs">
                        Assign this Trouble Ticket
                        to an active IT Personnel.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">

                    {/* ==================================================
                       TICKET INFORMATION
                    ================================================== */}

                    <div
                        className="
                            rounded-lg
                            border
                            bg-muted/30
                            p-3
                        "
                    >
                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                                    TT No
                                </p>

                                <p className="mt-1 font-mono text-[11px] font-semibold">
                                    {textValue(
                                        section?.tt_no
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Ticket ID
                                </p>

                                <p className="mt-1 text-[11px] font-semibold">
                                    {textValue(
                                        section?.id
                                    )}
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* ==================================================
                       CURRENT ASSIGNEE
                    ================================================== */}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold">
                            Current Assignee
                        </label>

                        <div
                            className="
                                flex
                                min-h-9
                                items-center
                                rounded-md
                                border
                                bg-muted/30
                                px-3
                                text-[11px]
                            "
                        >
                            {currentAssignedID ? (
                                <span>
                                    {currentAssignedName ||
                                        "Unknown"}

                                    <span className="ml-1 text-muted-foreground">
                                        (
                                        {
                                            currentAssignedID
                                        }
                                        )
                                    </span>
                                </span>
                            ) : (
                                <span className="text-muted-foreground">
                                    Not assigned
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ==================================================
                       IT PERSONNEL
                    ================================================== */}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold">
                            Assign To
                        </label>

                        <Select
                            value={
                                selectedEmployee
                            }
                            onValueChange={
                                setSelectedEmployee
                            }
                            disabled={
                                loadingPersonnel ||
                                submitting
                            }
                        >
                            <SelectTrigger className="h-9 text-[11px]">
                                <SelectValue
                                    placeholder={
                                        loadingPersonnel
                                            ? "Loading IT Personnel..."
                                            : "Select IT Personnel"
                                    }
                                />
                            </SelectTrigger>

                            <SelectContent>
                                {personnel.length ===
                                    0 ? (
                                    <SelectItem
                                        value="__no_personnel__"
                                        disabled
                                    >
                                        No active IT
                                        Personnel
                                        available
                                    </SelectItem>
                                ) : (
                                    personnel.map(
                                        (
                                            person
                                        ) => (
                                            <SelectItem
                                                key={
                                                    person.employee_id
                                                }
                                                value={
                                                    person.employee_id
                                                }
                                            >
                                                {
                                                    person.employee_name
                                                }{" "}
                                                (
                                                {
                                                    person.employee_id
                                                }
                                                )
                                            </SelectItem>
                                        )
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ==================================================
                       NOTE
                    ================================================== */}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold">
                            Note
                            <span className="ml-1 font-normal text-muted-foreground">
                                (Optional)
                            </span>
                        </label>

                        <Input
                            value={note}
                            onChange={(
                                event
                            ) =>
                                setNote(
                                    event.target
                                        .value
                                )
                            }
                            disabled={
                                submitting
                            }
                            placeholder={
                                currentAssignedID
                                    ? "Reassigned to another IT Personnel"
                                    : "Assigned to IT Personnel"
                            }
                            maxLength={500}
                            className="h-9 text-[11px]"
                        />

                        <p className="text-right text-[9px] text-muted-foreground">
                            {note.length}/500
                        </p>
                    </div>

                    {/* ==================================================
                       ERROR
                    ================================================== */}

                    {error && (
                        <div
                            className="
                                rounded-md
                                border
                                border-red-200
                                bg-red-50
                                px-3
                                py-2
                                text-[10px]
                                leading-4
                                text-red-700
                                dark:border-red-900
                                dark:bg-red-950/30
                                dark:text-red-400
                            "
                        >
                            {error}
                        </div>
                    )}
                </div>

                {/* ======================================================
                   FOOTER
                ====================================================== */}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                            submitting
                        }
                        onClick={() =>
                            onOpenChange(
                                false
                            )
                        }
                        className="h-8 text-[10px]"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        disabled={
                            submitting ||
                            loadingPersonnel ||
                            !selectedEmployee ||
                            alreadyAssigned
                        }
                        onClick={
                            handleSubmit
                        }
                        className="h-8 gap-1.5 text-[10px]"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />

                                {currentAssignedID
                                    ? "Reassigning..."
                                    : "Assigning..."}
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-3.5 w-3.5" />

                                {currentAssignedID
                                    ? "Reassign"
                                    : "Assign"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ============================================================
   ACTION CELL
============================================================ */

function ActionCell({
    section,
    permissions,
}: {
    section: Section;
    permissions: TTActionPermissions;
}) {
    const { openModal } =
        useTTModal();

    const [
        assignmentOpen,
        setAssignmentOpen,
    ] = useState(false);

    const hasActions =
        permissions.canView ||
        permissions.canAssign ||
        permissions.canRequisition ||
        permissions.canEdit ||
        permissions.canDelete;

    if (!hasActions) {
        return null;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    asChild
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="
                            h-6
                            gap-1
                            px-2
                            text-[9px]
                            font-medium
                            border-primary/70
                            text-primary
                            hover:bg-primary/5
                        "
                    >
                        Action

                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="w-44"
                >

                    {/* ==================================================
                       VIEW
                    ================================================== */}

                    {permissions.canView && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() =>
                                openModal(
                                    section
                                )
                            }
                        >
                            <Eye className="mr-2 h-3.5 w-3.5 text-indigo-600" />

                            View Details
                        </DropdownMenuItem>
                    )}

                    {/* ==================================================
                       ASSIGN / REASSIGN
                    ================================================== */}

                    {permissions.canAssign && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() =>
                                setAssignmentOpen(
                                    true
                                )
                            }
                        >
                            <UserCheck className="mr-2 h-3.5 w-3.5 text-blue-600" />

                            {section.assigned_id
                                ? "Reassign"
                                : "Assign"}
                        </DropdownMenuItem>
                    )}

                    {/* ==================================================
                       REQUISITION
                    ================================================== */}

                    {permissions.canRequisition && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() =>
                                console.log(
                                    "Requisition TT:",
                                    section.tt_no
                                )
                            }
                        >
                            <ClipboardList className="mr-2 h-3.5 w-3.5 text-indigo-600" />

                            Requisition
                        </DropdownMenuItem>
                    )}

                    {/* ==================================================
                       EDIT
                    ================================================== */}

                    {permissions.canEdit && (
                        <DropdownMenuItem
                            className="cursor-pointer text-[10px]"
                            onClick={() =>
                                console.log(
                                    "Edit TT:",
                                    section.tt_no
                                )
                            }
                        >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-primary" />

                            Update
                        </DropdownMenuItem>
                    )}

                    {/* ==================================================
                       DELETE
                    ================================================== */}

                    {permissions.canDelete && (
                        <>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="
                                    cursor-pointer
                                    text-[10px]
                                    text-red-600
                                    focus:text-red-700
                                "
                                onClick={() =>
                                    console.log(
                                        "Delete TT:",
                                        section.tt_no
                                    )
                                }
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />

                                Delete
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* ASSIGNMENT MODAL */}

            <AssignmentDialog
                section={section}
                open={assignmentOpen}
                onOpenChange={
                    setAssignmentOpen
                }
            />
        </>
    );
}

/* ============================================================
   TABLE COLUMNS
============================================================ */

export function createTTColumns(
    permissions: TTActionPermissions
): ColumnDef<Section>[] {
    return [
        /* ========================================================
           SL
        ======================================================== */

        {
            id: "serial",

            size: 48,
            minSize: 48,
            maxSize: 48,

            header: "SL",

            enableHiding: false,
            enableSorting: false,

            accessorFn: (
                _row,
                index
            ) => index + 1,

            cell: ({
                row,
                table,
            }) => {
                const rows =
                    table.getPrePaginationRowModel()
                        .rows;

                const position =
                    rows.findIndex(
                        (item) =>
                            item.id ===
                            row.id
                    );

                const serial =
                    position >= 0
                        ? position + 1
                        : row.index + 1;

                return (
                    <span
                        className="
                            text-[10px]
                            font-semibold
                            tabular-nums
                        "
                    >
                        {serial}
                    </span>
                );
            },
        },

        /* ========================================================
           TT NO
        ======================================================== */

        {
            accessorKey: "tt_no",

            header: "TT No",

            size: 128,
            minSize: 128,
            maxSize: 128,

            enableHiding: false,

            cell: ({ row }) => (
                <TTNoCell
                    section={
                        row.original
                    }
                />
            ),
        },

        /* ========================================================
           EMPLOYEE ID
        ======================================================== */

        {
            accessorKey:
                "employee_id",

            header: "Employee ID",

            size: 82,
            minSize: 82,
            maxSize: 82,

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .employee_id
                    }
                    className="
                        max-w-[80px]
                        whitespace-nowrap
                    "
                />
            ),
        },

        /* ========================================================
           EMPLOYEE NAME
        ======================================================== */

        {
            accessorKey:
                "employee_name",

            header: "Emp Name",

            size: 125,
            minSize: 110,
            maxSize: 150,

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .employee_name
                    }
                    className="max-w-[120px]"
                />
            ),
        },

        /* ========================================================
           QUERY
        ======================================================== */

        {
            accessorKey:
                "query_type",

            header: "Query",

            size: 170,
            minSize: 140,
            maxSize: 200,

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .query_type
                    }
                    className="max-w-[165px]"
                />
            ),
        },

        /* ========================================================
           AGE
        ======================================================== */

        {
            accessorKey: "tt_age",

            header: "Age",

            size: 75,
            minSize: 70,
            maxSize: 82,

            cell: ({ row }) => (
                <span
                    className="
                        whitespace-nowrap
                        text-[10px]
                        font-semibold
                        tabular-nums
                    "
                >
                    {
                        row.original
                            .tt_age
                    }
                </span>
            ),
        },

        /* ========================================================
           DEPARTMENT
        ======================================================== */

        {
            accessorKey:
                "dept_name",

            header: "Department",

            size: 120,
            minSize: 100,
            maxSize: 150,

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .dept_name
                    }
                    className="max-w-[115px]"
                />
            ),
        },

        /* ========================================================
           FUNCTION
        ======================================================== */

        {
            accessorKey:
                "func_name",

            header: "Function",

            size: 90,
            minSize: 80,
            maxSize: 110,

            cell: ({ row }) => (
                <CellText
                    value={
                        row.original
                            .func_name
                    }
                    className="max-w-[85px]"
                />
            ),
        },

        /* ========================================================
           MOBILE
        ======================================================== */

        {
            accessorKey:
                "mobile_no",

            header: "Mobile",

            size: 92,
            minSize: 88,
            maxSize: 100,

            cell: ({ row }) => (
                <span
                    className="
                        whitespace-nowrap
                        text-[10px]
                        font-medium
                        tabular-nums
                    "
                >
                    {textValue(
                        row.original
                            .mobile_no
                    )}
                </span>
            ),
        },

        /* ========================================================
           STATUS
        ======================================================== */

        {
            accessorKey: "status",

            header: "Status",

            size: 76,
            minSize: 72,
            maxSize: 82,

            enableHiding: false,

            cell: ({ row }) => {
                const status =
                    normalizeStatus(
                        row.original
                            .status
                    );

                const config =
                    statusConfig[
                    status
                    ];

                return (
                    <Badge
                        variant="outline"
                        className={`
                            ${badgeClass}
                            gap-1
                            ${config.className}
                        `}
                    >
                        {config.icon}

                        {status}
                    </Badge>
                );
            },
        },

        /* ========================================================
           REQUISITION
        ======================================================== */

        {
            accessorKey:
                "requisition_type",

            header: "Requisition",

            size: 116,
            minSize: 108,
            maxSize: 125,

            cell: ({ row }) => {
                const value =
                    String(
                        row.original
                            .requisition_type ??
                        ""
                    ).trim();

                if (!value) {
                    return (
                        <span className="text-[9px] text-muted-foreground/70">
                            —
                        </span>
                    );
                }

                let display =
                    value;

                if (
                    value ===
                    "Petty Cash (Approved)"
                ) {
                    display =
                        "Petty Cash";
                }

                if (
                    value ===
                    "PR (Approved)"
                ) {
                    display =
                        "PR";
                }

                return (
                    <Badge
                        variant="outline"
                        title={value}
                        className={`
                            ${badgeClass}
                            gap-1
                            ${requisitionClass(
                            value
                        )}
                        `}
                    >
                        <CheckCircle className="h-3 w-3" />

                        {display}
                    </Badge>
                );
            },
        },

        /* ========================================================
           DELIVERY
        ======================================================== */

        {
            accessorKey:
                "delivered_status",

            header: "Delivery",

            size: 92,
            minSize: 88,
            maxSize: 100,

            cell: ({ row }) => {
                const value =
                    String(
                        row.original
                            .delivered_status ??
                        ""
                    ).trim();

                if (!value) {
                    return (
                        <span className="text-[9px] text-muted-foreground/70">
                            —
                        </span>
                    );
                }

                const config =
                    deliveryConfig(
                        value
                    );

                return (
                    <Badge
                        variant="outline"
                        className={`
                            ${badgeClass}
                            gap-1
                            ${config.className}
                        `}
                    >
                        {config.icon}

                        {value}
                    </Badge>
                );
            },
        },

        /* ========================================================
           CREATED
        ======================================================== */

        {
            accessorKey:
                "created_at",

            header: "Created",

            size: 108,
            minSize: 100,
            maxSize: 115,

            cell: ({ row }) => (
                <span
                    title={
                        row.original
                            .created_at
                    }
                    className="
                        block
                        max-w-[104px]
                        truncate
                        whitespace-nowrap
                        text-[9px]
                    "
                >
                    {formatCreatedAt(
                        row.original
                            .created_at
                    )}
                </span>
            ),
        },

        /* ========================================================
           ACTION
        ======================================================== */

        {
            id: "actions",

            header: "Action",

            size: 78,
            minSize: 76,
            maxSize: 82,

            enableHiding: false,
            enableSorting: false,

            cell: ({ row }) => (
                <ActionCell
                    section={
                        row.original
                    }
                    permissions={
                        permissions
                    }
                />
            ),
        },
    ];
}