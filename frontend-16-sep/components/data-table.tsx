

// // frontend/components/data-table.tsx

// "use client";

// import * as React from "react";
// import { createPortal } from "react-dom";
// import * as XLSX from "xlsx";

// import {
//     ColumnDef,
//     ColumnFiltersState,
//     flexRender,
//     getCoreRowModel,
//     getFilteredRowModel,
//     getPaginationRowModel,
//     getSortedRowModel,
//     SortingState,
//     useReactTable,
//     VisibilityState,
// } from "@tanstack/react-table";

// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table";

// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";

// import {
//     DropdownMenu,
//     DropdownMenuCheckboxItem,
//     DropdownMenuContent,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// import {
//     Building2,
//     CalendarDays,
//     Clock3,
//     Download,
//     Eye,
//     EyeOff,
//     FileText,
//     Filter,
//     PackageCheck,
//     Search,
//     Smartphone,
//     SlidersHorizontal,
//     UserCheck,
//     UserRound,
//     X,
// } from "lucide-react";

// /* ============================================================
//    TYPES
// ============================================================ */

// export type DataTableServerFilters = {
//     fromDate: string;
//     toDate: string;
//     employeeId: string;
//     status: string;
//     itPersonal: string;
// };

// export type DataTableOption = {
//     value: string;
//     label: string;
// };

// interface DataTableProps<TData, TValue> {
//     columns: ColumnDef<TData, TValue>[];
//     data: TData[];

//     dateColumn?: string;

//     compact?: boolean;

//     serverSideDateFilter?: boolean;

//     itPersonalOptions?: DataTableOption[];

//     appliedServerFilters?: DataTableServerFilters;

//     emptyMessage?: string;

//     onApplyServerFilters?: (
//         filters: DataTableServerFilters
//     ) => void;
// }

// /* ============================================================
//    DEFAULTS
// ============================================================ */

// const EMPTY_SERVER_FILTERS: DataTableServerFilters = {
//     fromDate: "",
//     toDate: "",
//     employeeId: "",
//     status: "",
//     itPersonal: "",
// };

// const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
//     mrnNumber: false,
//     prNumber: false,
//     department: false,
//     designation: false,
//     brand: false,
//     deviceType: false,
//     vendor: false,
//     assignedBy: false,
//     assignedDate: false,
//     returnedDate: false,
//     transferredDate: false,
//     purchaseDate: false,
//     warranty: false,
//     deviceAge: false,
//     userUsageDuration: false,
//     remarks: false,

//     dept_name: false,
//     employee_name: false,
//     func_name: false,
//     mobile_no: false,

//     postingArea: false,
//     postingDistrict: false,
//     personalMobile: false,
//     officeMobile: false,
// };

// /* ============================================================
//    HELPERS
// ============================================================ */

// function normalizeValue(value: unknown): string {
//     if (
//         value === null ||
//         value === undefined
//     ) {
//         return "";
//     }

//     if (
//         typeof value === "object"
//     ) {
//         try {
//             return JSON.stringify(value).toLowerCase();
//         } catch {
//             return String(value).toLowerCase();
//         }
//     }

//     return String(value).toLowerCase();
// }

// /* ============================================================
//    DATE NORMALIZATION
// ============================================================ */

// function normalizeDateOnly(
//     value: unknown
// ): string | null {
//     if (
//         value === null ||
//         value === undefined
//     ) {
//         return null;
//     }

//     if (value instanceof Date) {
//         if (
//             Number.isNaN(
//                 value.getTime()
//             )
//         ) {
//             return null;
//         }

//         const year =
//             value.getFullYear();

//         const month =
//             String(
//                 value.getMonth() + 1
//             ).padStart(2, "0");

//         const day =
//             String(
//                 value.getDate()
//             ).padStart(2, "0");

//         return `${year}-${month}-${day}`;
//     }

//     const text =
//         String(value).trim();

//     if (!text) {
//         return null;
//     }

//     const match =
//         text.match(
//             /(\d{4})-(\d{2})-(\d{2})/
//         );

//     if (match) {
//         return (
//             `${match[1]}-` +
//             `${match[2]}-` +
//             `${match[3]}`
//         );
//     }

//     const parsed =
//         new Date(text);

//     if (
//         Number.isNaN(
//             parsed.getTime()
//         )
//     ) {
//         return null;
//     }

//     const year =
//         parsed.getFullYear();

//     const month =
//         String(
//             parsed.getMonth() + 1
//         ).padStart(2, "0");

//     const day =
//         String(
//             parsed.getDate()
//         ).padStart(2, "0");

//     return `${year}-${month}-${day}`;
// }

// /* ============================================================
//    CREATED DATE / TIME
// ============================================================ */

// function formatCreatedDateTime(
//     value: unknown
// ): {
//     date: string;
//     time: string;
// } {
//     if (
//         value === null ||
//         value === undefined ||
//         String(value).trim() === ""
//     ) {
//         return {
//             date: "—",
//             time: "—",
//         };
//     }

//     if (value instanceof Date) {
//         if (
//             Number.isNaN(
//                 value.getTime()
//             )
//         ) {
//             return {
//                 date: "—",
//                 time: "—",
//             };
//         }

//         const date =
//             [
//                 value.getFullYear(),
//                 String(
//                     value.getMonth() + 1
//                 ).padStart(2, "0"),
//                 String(
//                     value.getDate()
//                 ).padStart(2, "0"),
//             ].join("-");

//         const time =
//             [
//                 String(
//                     value.getHours()
//                 ).padStart(2, "0"),
//                 String(
//                     value.getMinutes()
//                 ).padStart(2, "0"),
//                 String(
//                     value.getSeconds()
//                 ).padStart(2, "0"),
//             ].join(":");

//         return {
//             date,
//             time,
//         };
//     }

//     const text =
//         String(value).trim();

//     /*
//      * Preserve the timestamp returned by PostgreSQL.
//      *
//      * Example:
//      *
//      * 2026-09-08T16:18:03.071+06:00
//      *
//      * We intentionally extract the date/time directly
//      * instead of converting through the browser timezone.
//      */
//     const match =
//         text.match(
//             /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/
//         );

//     if (match) {
//         return {
//             date: match[1],
//             time: match[2],
//         };
//     }

//     const parsed =
//         new Date(text);

//     if (
//         Number.isNaN(
//             parsed.getTime()
//         )
//     ) {
//         return {
//             date: text,
//             time: "",
//         };
//     }

//     const date =
//         [
//             parsed.getFullYear(),
//             String(
//                 parsed.getMonth() + 1
//             ).padStart(2, "0"),
//             String(
//                 parsed.getDate()
//             ).padStart(2, "0"),
//         ].join("-");

//     const time =
//         [
//             String(
//                 parsed.getHours()
//             ).padStart(2, "0"),
//             String(
//                 parsed.getMinutes()
//             ).padStart(2, "0"),
//             String(
//                 parsed.getSeconds()
//             ).padStart(2, "0"),
//         ].join(":");

//     return {
//         date,
//         time,
//     };
// }

// /* ============================================================
//    COLUMN DISPLAY NAME
// ============================================================ */

// function getColumnDisplayName(
//     columnId: string
// ): string {
//     const names: Record<
//         string,
//         string
//     > = {
//         employeeId:
//             "Employee ID",

//         employee_id:
//             "Employee ID",

//         employee_name:
//             "Employee Name",

//         assigned_id:
//             "Assigned ID",

//         assigned_name:
//             "Assigned",

//         status:
//             "Status",

//         requisition_type:
//             "Requisition",

//         delivered_status:
//             "Delivery",

//         tt_no:
//             "TT No",

//         created_at:
//             "Created",

//         query_type:
//             "Query",

//         query:
//             "Query",

//         description:
//             "Description",

//         dept_name:
//             "Department",

//         department:
//             "Department",

//         func_name:
//             "Function",

//         function:
//             "Function",

//         mobile_no:
//             "Mobile No",

//         mobile:
//             "Mobile",

//         action:
//             "Action",

//         actions:
//             "Action",

//         age:
//             "Age",

//         tt_age:
//             "Age",
//     };

//     return (
//         names[columnId] ??
//         columnId
//     );
// }

// /* ============================================================
//    RESPONSIVE COLUMN WIDTH
// ============================================================ */

// function getColumnWidth(
//     columnId: string
// ): string | undefined {
//     const widths: Record<
//         string,
//         string
//     > = {
//         /*
//          * TT TABLE
//          *
//          * The widths intentionally stay below
//          * 100% so the table never creates an
//          * unnecessary horizontal scrollbar.
//          */

//         sl: "5%",
//         serial: "5%",
//         index: "5%",

//         tt_no: "11%",

//         employee_id: "9%",
//         employeeId: "9%",

//         assigned_id: "9%",
//         assigned_name: "10%",

//         query_type: "16%",
//         query: "16%",

//         age: "7%",
//         tt_age: "7%",

//         status: "7%",

//         requisition_type: "7%",

//         delivered_status: "7%",

//         created_at: "12%",

//         action: "10%",
//         actions: "10%",

//         employee_name: "11%",
//         dept_name: "10%",
//         department: "10%",
//         func_name: "10%",
//         mobile_no: "10%",
//     };

//     return widths[columnId];
// }

// /* ============================================================
//    GENERIC VALUE
// ============================================================ */

// function displayValue(
//     value: unknown
// ): string {
//     if (
//         value === null ||
//         value === undefined ||
//         String(value).trim() === ""
//     ) {
//         return "Not available";
//     }

//     if (
//         typeof value === "object"
//     ) {
//         try {
//             return JSON.stringify(
//                 value
//             );
//         } catch {
//             return String(value);
//         }
//     }

//     return String(value);
// }

// /* ============================================================
//    FIND VALUE BY POSSIBLE KEYS
// ============================================================ */

// function getRecordValue(
//     record: Record<string, unknown>,
//     keys: string[]
// ): unknown {
//     for (const key of keys) {
//         if (
//             record[key] !==
//             undefined &&
//             record[key] !== null &&
//             String(
//                 record[key]
//             ).trim() !== ""
//         ) {
//             return record[key];
//         }
//     }

//     return undefined;
// }

// /* ============================================================
//    EXPORT VALUE
// ============================================================ */

// function exportCellValue(
//     value: unknown
// ): string | number {
//     if (
//         value === null ||
//         value === undefined
//     ) {
//         return "";
//     }

//     if (
//         typeof value ===
//         "string" ||
//         typeof value ===
//         "number"
//     ) {
//         return value;
//     }

//     if (
//         typeof value ===
//         "boolean"
//     ) {
//         return value
//             ? "Yes"
//             : "No";
//     }

//     if (
//         value instanceof Date
//     ) {
//         return value.toISOString();
//     }

//     if (
//         typeof value === "object"
//     ) {
//         try {
//             return JSON.stringify(
//                 value
//             );
//         } catch {
//             return String(value);
//         }
//     }

//     return String(value);
// }

// /* ============================================================
//    TROUBLE TICKET ROW HOVER PREVIEW

//    Important:
//    - This is the ONLY Trouble Ticket row hover implementation.
//    - tt-columns.tsx only renders cells/actions.
//    - The preview is portaled to document.body so table overflow,
//      z-index, and dropdowns cannot clip it.
//    - It is visually centered over the visible DataTable area.
// ============================================================ */

// function isTroubleTicketRecord(
//     record: Record<string, unknown>
// ): boolean {
//     return Boolean(
//         getRecordValue(
//             record,
//             ["tt_no", "ttNo"]
//         )
//     );
// }

// function TroubleTicketHoverPreview({
//     record,
//     visible,
//     position,
// }: {
//     record: Record<
//         string,
//         unknown
//     > | null;
//     visible: boolean;
//     position: {
//         top: number;
//         left: number;
//     } | null;
// }) {
//     if (
//         !record ||
//         !position ||
//         typeof document === "undefined"
//     ) {
//         return null;
//     }

//     const ttNo =
//         getRecordValue(
//             record,
//             ["tt_no", "ttNo"]
//         );

//     const employeeId =
//         getRecordValue(
//             record,
//             ["employee_id", "employeeId"]
//         );

//     const employeeName =
//         getRecordValue(
//             record,
//             ["employee_name", "employeeName"]
//         );

//     const assignedId =
//         getRecordValue(
//             record,
//             ["assigned_id", "assignedId"]
//         );

//     const assignedName =
//         getRecordValue(
//             record,
//             ["assigned_name", "assignedName"]
//         );

//     const query =
//         getRecordValue(
//             record,
//             [
//                 "query_type",
//                 "query",
//                 "reason",
//                 "description",
//             ]
//         );

//     const age =
//         getRecordValue(
//             record,
//             ["age", "tt_age"]
//         );

//     const status =
//         getRecordValue(
//             record,
//             ["status", "normalized_status"]
//         );

//     const department =
//         getRecordValue(
//             record,
//             ["department", "dept_name"]
//         );

//     const functionName =
//         getRecordValue(
//             record,
//             ["function", "func_name"]
//         );

//     const mobile =
//         getRecordValue(
//             record,
//             [
//                 "mobile_no",
//                 "mobile",
//                 "personalMobile",
//                 "officeMobile",
//             ]
//         );

//     const email =
//         getRecordValue(
//             record,
//             [
//                 "email",
//                 "email_address",
//                 "emailAddress",
//                 "employee_email",
//             ]
//         );

//     const requisition =
//         getRecordValue(
//             record,
//             ["requisition_type", "requisition"]
//         );

//     const delivery =
//         getRecordValue(
//             record,
//             ["delivered_status", "delivery"]
//         );

//     const createdRaw =
//         getRecordValue(
//             record,
//             [
//                 "created_at",
//                 "createdAt",
//                 "created",
//                 "created_date",
//                 "createdDate",
//             ]
//         );

//     const created =
//         formatCreatedDateTime(
//             createdRaw
//         );

//     const assignedText =
//         assignedId
//             ? assignedName
//                 ? `${displayValue(
//                     assignedName
//                 )} (${displayValue(
//                     assignedId
//                 )})`
//                 : displayValue(
//                     assignedId
//                 )
//             : assignedName
//                 ? displayValue(
//                     assignedName
//                 )
//                 : "Not assigned";

//     const statusText =
//         displayValue(status);

//     const statusClass =
//         String(status ?? "")
//             .toLowerCase()
//             .includes("closed")
//             ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
//             : String(status ?? "")
//                 .toLowerCase()
//                 .includes("reject")
//                 ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
//                 : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300";

//     return createPortal(
//         <div
//             className="
//                 pointer-events-none
//                 fixed
//                 z-[9999]
//                 w-[460px]
//                 max-w-[calc(100vw-28px)]
//                 -translate-x-1/2
//                 -translate-y-1/2
//             "
//             style={{
//                 top: position.top,
//                 left: position.left,
//             }}
//             aria-hidden="true"
//         >
//             <div
//                 className={`
//                     max-h-[min(620px,calc(100vh-32px))]
//                     overflow-y-auto
//                     rounded-2xl
//                     border
//                     border-border/80
//                     bg-background/98
//                     text-left
//                     shadow-[0_28px_90px_rgba(0,0,0,0.20),0_10px_30px_rgba(0,0,0,0.08)]
//                     ring-1
//                     ring-black/5
//                     backdrop-blur-xl
//                     will-change-transform
//                     transition-[opacity,transform,filter]
//                     duration-[450ms]
//                     ease-[cubic-bezier(0.22,1,0.36,1)]

//                     ${visible
//                         ? "translate-y-0 scale-100 opacity-100 blur-0"
//                         : "translate-y-2 scale-[0.965] opacity-0 blur-[1.5px]"
//                     }
//                 `}
//             >
//                 {/* HEADER */}
//                 <div className="border-b bg-muted/30 px-5 py-4">
//                     <div className="flex items-start justify-between gap-4">
//                         <div className="min-w-0">
//                             <div className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
//                                 <FileText className="h-3.5 w-3.5 text-primary" />
//                                 Trouble Ticket
//                             </div>

//                             <div className="truncate font-mono text-[15px] font-bold tracking-tight text-primary">
//                                 {displayValue(ttNo)}
//                             </div>
//                         </div>

//                         <span
//                             className={`
//                                 inline-flex
//                                 shrink-0
//                                 items-center
//                                 rounded-full
//                                 border
//                                 px-2.5
//                                 py-1
//                                 text-[9px]
//                                 font-semibold
//                                 ${statusClass}
//                             `}
//                         >
//                             {statusText}
//                         </span>
//                     </div>
//                 </div>

//                 {/* CONTENT */}
//                 <div className="space-y-3 p-4">
//                     <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
//                         <div className="mb-1.5 flex items-center gap-2">
//                             <FileText className="h-3.5 w-3.5 text-primary" />
//                             <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
//                                 Query / Reason
//                             </span>
//                         </div>

//                         <p className="max-h-24 overflow-y-auto whitespace-normal break-words text-[12px] font-medium leading-5 text-foreground">
//                             {displayValue(query)}
//                         </p>
//                     </div>

//                     <div className="grid grid-cols-2 gap-2.5">
//                         <div className="rounded-xl border border-border/70 bg-background p-3">
//                             <div className="mb-1.5 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
//                                 <UserRound className="h-3.5 w-3.5" />
//                                 Employee
//                             </div>
//                             <p className="text-[11px] font-semibold text-foreground">
//                                 {displayValue(employeeId)}
//                             </p>
//                             {employeeName && (
//                                 <p className="mt-1 truncate text-[9px] text-muted-foreground">
//                                     {displayValue(employeeName)}
//                                 </p>
//                             )}
//                         </div>

//                         <div className="rounded-xl border border-border/70 bg-background p-3">
//                             <div className="mb-1.5 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
//                                 <UserCheck className="h-3.5 w-3.5" />
//                                 Assigned To
//                             </div>
//                             <p className="truncate text-[11px] font-semibold text-foreground" title={assignedText}>
//                                 {assignedText}
//                             </p>
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-3 gap-2.5">
//                         <div className="rounded-xl border border-border/70 bg-background p-2.5">
//                             <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
//                                 <Clock3 className="h-3.5 w-3.5" />
//                                 Age
//                             </div>
//                             <p className="truncate text-[10px] font-semibold">
//                                 {displayValue(age)}
//                             </p>
//                         </div>

//                         <div className="rounded-xl border border-border/70 bg-background p-2.5">
//                             <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
//                                 <Building2 className="h-3.5 w-3.5" />
//                                 Department
//                             </div>
//                             <p className="truncate text-[10px] font-semibold" title={displayValue(department)}>
//                                 {displayValue(department)}
//                             </p>
//                         </div>

//                         <div className="rounded-xl border border-border/70 bg-background p-2.5">
//                             <div className="mb-1 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
//                                 Function
//                             </div>
//                             <p className="truncate text-[10px] font-semibold" title={displayValue(functionName)}>
//                                 {displayValue(functionName)}
//                             </p>
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-2.5">
//                         <div className="rounded-xl border border-border/70 bg-background p-2.5">
//                             <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
//                                 <Smartphone className="h-3.5 w-3.5" />
//                                 Mobile
//                             </div>
//                             <p className="truncate text-[10px] font-semibold">
//                                 {displayValue(mobile)}
//                             </p>
//                         </div>

//                         <div className="rounded-xl border border-border/70 bg-background p-2.5">
//                             <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
//                                 <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/40 text-[7px] font-bold">
//                                     @
//                                 </span>
//                                 Email
//                             </div>
//                             <p className="truncate text-[10px] font-semibold" title={displayValue(email)}>
//                                 {displayValue(email)}
//                             </p>
//                         </div>

//                         <div className="rounded-xl border border-border/70 bg-background p-2.5">
//                             <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
//                                 <PackageCheck className="h-3.5 w-3.5" />
//                                 Requisition
//                             </div>
//                             <p className="truncate text-[10px] font-semibold" title={displayValue(requisition)}>
//                                 {displayValue(requisition)}
//                             </p>
//                         </div>

//                         <div className="rounded-xl border border-border/70 bg-background p-2.5">
//                             <div className="mb-1 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
//                                 Delivery
//                             </div>
//                             <p className="truncate text-[10px] font-semibold" title={displayValue(delivery)}>
//                                 {displayValue(delivery)}
//                             </p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* FOOTER */}
//                 <div className="border-t bg-muted/25 px-5 py-3">
//                     <div className="flex items-center justify-between gap-4">
//                         <div className="flex items-center gap-2">
//                             <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
//                             <div>
//                                 <div className="text-[7px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
//                                     Created
//                                 </div>
//                                 <div className="mt-0.5 font-mono text-[10px] font-semibold">
//                                     {created.date}
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="text-right">
//                             <div className="text-[7px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
//                                 Time
//                             </div>
//                             <div className="mt-0.5 font-mono text-[10px] font-semibold">
//                                 {created.time}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>,
//         document.body
//     );
// }

// /* ============================================================
//    DATA TABLE
// ============================================================ */

// export function DataTable<
//     TData,
//     TValue
// >({
//     columns,
//     data,
//     dateColumn = "date",
//     compact = false,
//     serverSideDateFilter = false,
//     itPersonalOptions = [],
//     appliedServerFilters,
//     emptyMessage =
//     "No results found.",
//     onApplyServerFilters,
// }: DataTableProps<
//     TData,
//     TValue
// >) {
//     /* ========================================================
//        TABLE STATE
//     ======================================================== */

//     const [
//         sorting,
//         setSorting,
//     ] =
//         React.useState<
//             SortingState
//         >([]);

//     const [
//         columnFilters,
//         setColumnFilters,
//     ] =
//         React.useState<
//             ColumnFiltersState
//         >([]);

//     const [
//         columnVisibility,
//         setColumnVisibility,
//     ] =
//         React.useState<
//             VisibilityState
//         >(
//             DEFAULT_HIDDEN_COLUMNS
//         );

//     /* ========================================================
//        SEARCH
//     ======================================================== */

//     const [
//         searchInput,
//         setSearchInput,
//     ] =
//         React.useState("");

//     const deferredSearch =
//         React.useDeferredValue(
//             searchInput
//         );

//     /* ========================================================
//        FILTER POPUP
//     ======================================================== */

//     const [
//         filterOpen,
//         setFilterOpen,
//     ] =
//         React.useState(false);

//     /* ========================================================
//        SERVER FILTER DRAFT
//     ======================================================== */

//     const [
//         fromDate,
//         setFromDate,
//     ] =
//         React.useState(
//             appliedServerFilters
//                 ?.fromDate ??
//             ""
//         );

//     const [
//         toDate,
//         setToDate,
//     ] =
//         React.useState(
//             appliedServerFilters
//                 ?.toDate ??
//             ""
//         );

//     const [
//         employeeId,
//         setEmployeeId,
//     ] =
//         React.useState(
//             appliedServerFilters
//                 ?.employeeId ??
//             ""
//         );

//     const [
//         status,
//         setStatus,
//     ] =
//         React.useState(
//             appliedServerFilters
//                 ?.status ??
//             ""
//         );

//     const [
//         itPersonal,
//         setItPersonal,
//     ] =
//         React.useState(
//             appliedServerFilters
//                 ?.itPersonal ??
//             ""
//         );

//     /* ========================================================
//        LOCAL APPLIED FILTERS
//     ======================================================== */

//     const [
//         localAppliedFilters,
//         setLocalAppliedFilters,
//     ] =
//         React.useState<
//             DataTableServerFilters
//         >(
//             appliedServerFilters ??
//             EMPTY_SERVER_FILTERS
//         );

//     const appliedFilters =
//         appliedServerFilters ??
//         localAppliedFilters;

//     /* ========================================================
//        TROUBLE TICKET ROW HOVER STATE

//        One shared preview is used for the entire DataTable.
//        This prevents multiple row/cell hover cards from stacking.
//     ======================================================== */

//     const tableHoverAreaRef =
//         React.useRef<HTMLDivElement | null>(null);

//     const [
//         hoveredRow,
//         setHoveredRow,
//     ] =
//         React.useState<
//             TData | null
//         >(null);

//     const [
//         hoverPreviewMounted,
//         setHoverPreviewMounted,
//     ] =
//         React.useState(false);

//     const [
//         hoverPreviewVisible,
//         setHoverPreviewVisible,
//     ] =
//         React.useState(false);

//     const [
//         hoverPreviewPosition,
//         setHoverPreviewPosition,
//     ] =
//         React.useState<{
//             top: number;
//             left: number;
//         } | null>(null);

//     const hoverShowTimerRef =
//         React.useRef<
//             ReturnType<
//                 typeof setTimeout
//             > | null
//         >(null);

//     const hoverUnmountTimerRef =
//         React.useRef<
//             ReturnType<
//                 typeof setTimeout
//             > | null
//         >(null);

//     const clearHoverTimers =
//         React.useCallback(() => {
//             if (
//                 hoverShowTimerRef.current
//             ) {
//                 clearTimeout(
//                     hoverShowTimerRef.current
//                 );

//                 hoverShowTimerRef.current =
//                     null;
//             }

//             if (
//                 hoverUnmountTimerRef.current
//             ) {
//                 clearTimeout(
//                     hoverUnmountTimerRef.current
//                 );

//                 hoverUnmountTimerRef.current =
//                     null;
//             }
//         }, []);

//     const getTableHoverCenter =
//         React.useCallback(() => {
//             const viewportPadding = 16;

//             const fallback = {
//                 left:
//                     window.innerWidth / 2,
//                 top:
//                     window.innerHeight / 2,
//             };

//             const element =
//                 tableHoverAreaRef.current;

//             if (!element) {
//                 return fallback;
//             }

//             const rect =
//                 element.getBoundingClientRect();

//             const visibleLeft =
//                 Math.max(
//                     viewportPadding,
//                     rect.left
//                 );

//             const visibleRight =
//                 Math.min(
//                     window.innerWidth -
//                     viewportPadding,
//                     rect.right
//                 );

//             const visibleTop =
//                 Math.max(
//                     viewportPadding,
//                     rect.top
//                 );

//             const visibleBottom =
//                 Math.min(
//                     window.innerHeight -
//                     viewportPadding,
//                     rect.bottom
//                 );

//             if (
//                 visibleRight <= visibleLeft ||
//                 visibleBottom <= visibleTop
//             ) {
//                 return fallback;
//             }

//             return {
//                 left:
//                     (visibleLeft +
//                         visibleRight) /
//                     2,
//                 top:
//                     (visibleTop +
//                         visibleBottom) /
//                     2,
//             };
//         }, []);

//     const beginRowHover =
//         React.useCallback(
//             (row: TData) => {
//                 const record =
//                     row as Record<
//                         string,
//                         unknown
//                     >;

//                 /*
//                  * DataTable is shared by other pages.
//                  * Only Trouble Ticket rows should show this
//                  * Trouble Ticket-specific preview.
//                  */
//                 if (
//                     !isTroubleTicketRecord(
//                         record
//                     )
//                 ) {
//                     return;
//                 }

//                 clearHoverTimers();

//                 setHoveredRow(row);

//                 setHoverPreviewPosition(
//                     getTableHoverCenter()
//                 );

//                 /*
//                  * Mount hidden first so React/Tailwind has a
//                  * real start state for the entrance animation.
//                  */
//                 setHoverPreviewMounted(true);
//                 setHoverPreviewVisible(false);

//                 /*
//                  * Intent delay: the user must rest on the row
//                  * briefly before the preview appears. This makes
//                  * quick mouse movement across the table feel calm.
//                  */
//                 hoverShowTimerRef.current =
//                     setTimeout(() => {
//                         setHoverPreviewVisible(
//                             true
//                         );

//                         hoverShowTimerRef.current =
//                             null;
//                     }, 520);
//             },
//             [
//                 clearHoverTimers,
//                 getTableHoverCenter,
//             ]
//         );

//     const endRowHover =
//         React.useCallback(() => {
//             if (
//                 hoverShowTimerRef.current
//             ) {
//                 clearTimeout(
//                     hoverShowTimerRef.current
//                 );

//                 hoverShowTimerRef.current =
//                     null;
//             }

//             setHoverPreviewVisible(false);

//             if (
//                 hoverUnmountTimerRef.current
//             ) {
//                 clearTimeout(
//                     hoverUnmountTimerRef.current
//                 );
//             }

//             /*
//              * Let the 450ms visual fade finish before the
//              * shared preview is removed from document.body.
//              */
//             hoverUnmountTimerRef.current =
//                 setTimeout(() => {
//                     setHoverPreviewMounted(
//                         false
//                     );

//                     setHoveredRow(null);

//                     setHoverPreviewPosition(
//                         null
//                     );

//                     hoverUnmountTimerRef.current =
//                         null;
//                 }, 460);
//         }, []);

//     React.useEffect(() => {
//         if (!hoverPreviewMounted) {
//             return;
//         }

//         const updatePosition = () => {
//             setHoverPreviewPosition(
//                 getTableHoverCenter()
//             );
//         };

//         window.addEventListener(
//             "resize",
//             updatePosition
//         );

//         window.addEventListener(
//             "scroll",
//             updatePosition,
//             true
//         );

//         return () => {
//             window.removeEventListener(
//                 "resize",
//                 updatePosition
//             );

//             window.removeEventListener(
//                 "scroll",
//                 updatePosition,
//                 true
//             );
//         };
//     }, [
//         getTableHoverCenter,
//         hoverPreviewMounted,
//     ]);

//     React.useEffect(() => {
//         return () => {
//             clearHoverTimers();
//         };
//     }, [clearHoverTimers]);

//     /* ========================================================
//        SYNC PARENT FILTERS
//     ======================================================== */

//     React.useEffect(
//         () => {
//             if (
//                 !appliedServerFilters
//             ) {
//                 return;
//             }

//             setFromDate(
//                 appliedServerFilters
//                     .fromDate
//             );

//             setToDate(
//                 appliedServerFilters
//                     .toDate
//             );

//             setEmployeeId(
//                 appliedServerFilters
//                     .employeeId
//             );

//             setStatus(
//                 appliedServerFilters
//                     .status
//             );

//             setItPersonal(
//                 appliedServerFilters
//                     .itPersonal
//             );

//             setLocalAppliedFilters(
//                 appliedServerFilters
//             );
//         },
//         [
//             appliedServerFilters,
//         ]
//     );

//     /* ========================================================
//        LOCAL FILTERING
//     ======================================================== */

//     const filteredData =
//         React.useMemo(
//             () => {
//                 const searchText =
//                     deferredSearch
//                         .trim()
//                         .toLowerCase();

//                 return data.filter(
//                     (
//                         row: TData
//                     ) => {
//                         const record =
//                             row as Record<
//                                 string,
//                                 unknown
//                             >;

//                         const matchesSearch =
//                             !searchText ||
//                             Object.values(
//                                 record
//                             ).some(
//                                 (
//                                     value
//                                 ) =>
//                                     normalizeValue(
//                                         value
//                                     ).includes(
//                                         searchText
//                                     )
//                             );

//                         /*
//                          * Server mode:
//                          *
//                          * PostgreSQL handles
//                          * server filters.
//                          */
//                         if (
//                             serverSideDateFilter
//                         ) {
//                             return matchesSearch;
//                         }

//                         let matchesDate =
//                             true;

//                         if (
//                             fromDate ||
//                             toDate
//                         ) {
//                             const rowDate =
//                                 normalizeDateOnly(
//                                     record[
//                                     dateColumn
//                                     ]
//                                 );

//                             if (!rowDate) {
//                                 matchesDate =
//                                     false;
//                             } else {
//                                 if (
//                                     fromDate &&
//                                     rowDate <
//                                     fromDate
//                                 ) {
//                                     matchesDate =
//                                         false;
//                                 }

//                                 if (
//                                     toDate &&
//                                     rowDate >
//                                     toDate
//                                 ) {
//                                     matchesDate =
//                                         false;
//                                 }
//                             }
//                         }

//                         return (
//                             matchesSearch &&
//                             matchesDate
//                         );
//                     }
//                 );
//             },
//             [
//                 data,
//                 deferredSearch,
//                 fromDate,
//                 toDate,
//                 dateColumn,
//                 serverSideDateFilter,
//             ]
//         );

//     /* ========================================================
//        TANSTACK TABLE
//     ======================================================== */

//     const table =
//         useReactTable({
//             data: filteredData,
//             columns,

//             state: {
//                 sorting,
//                 columnFilters,
//                 columnVisibility,
//             },

//             onSortingChange:
//                 setSorting,

//             onColumnFiltersChange:
//                 setColumnFilters,

//             onColumnVisibilityChange:
//                 setColumnVisibility,

//             getCoreRowModel:
//                 getCoreRowModel(),

//             getFilteredRowModel:
//                 getFilteredRowModel(),

//             getPaginationRowModel:
//                 getPaginationRowModel(),

//             getSortedRowModel:
//                 getSortedRowModel(),
//         });

//     /* ========================================================
//        RESET PAGE ON SEARCH / DATA CHANGE
//     ======================================================== */

//     React.useEffect(
//         () => {
//             table.setPageIndex(
//                 0
//             );
//         },
//         [
//             deferredSearch,
//             data,
//             table,
//         ]
//     );

//     /* ========================================================
//        COLUMN REFERENCES
//     ======================================================== */

//     const statusColumn =
//         table
//             .getAllColumns()
//             .find(
//                 (
//                     column
//                 ) =>
//                     column.id ===
//                     "status"
//             );

//     /* ========================================================
//        FILTER COUNTS
//     ======================================================== */

//     const serverActiveFiltersCount =
//         (
//             searchInput.trim()
//                 ? 1
//                 : 0
//         ) +
//         (
//             appliedFilters.fromDate
//                 ? 1
//                 : 0
//         ) +
//         (
//             appliedFilters.toDate
//                 ? 1
//                 : 0
//         ) +
//         (
//             appliedFilters.employeeId
//                 ? 1
//                 : 0
//         ) +
//         (
//             appliedFilters.itPersonal
//                 ? 1
//                 : 0
//         ) +
//         (
//             appliedFilters.status
//                 ? 1
//                 : 0
//         );

//     const localActiveFiltersCount =
//         (
//             searchInput.trim()
//                 ? 1
//                 : 0
//         ) +
//         columnFilters.length +
//         (
//             fromDate ||
//                 toDate
//                 ? 1
//                 : 0
//         );

//     const activeFiltersCount =
//         serverSideDateFilter
//             ? serverActiveFiltersCount
//             : localActiveFiltersCount;

//     /* ========================================================
//        APPLY SERVER FILTERS
//     ======================================================== */

//     function updateAppliedFilters(
//         next: DataTableServerFilters
//     ) {
//         setLocalAppliedFilters(
//             next
//         );

//         onApplyServerFilters?.(
//             next
//         );

//         table.setPageIndex(
//             0
//         );
//     }

//     function applyFilters() {
//         if (
//             !serverSideDateFilter
//         ) {
//             setFilterOpen(
//                 false
//             );

//             return;
//         }

//         const next:
//             DataTableServerFilters =
//         {
//             fromDate:
//                 fromDate.trim(),

//             toDate:
//                 toDate.trim(),

//             employeeId:
//                 employeeId.trim(),

//             status:
//                 status.trim(),

//             itPersonal:
//                 itPersonal.trim(),
//         };

//         updateAppliedFilters(
//             next
//         );

//         setFilterOpen(false);
//     }

//     /* ========================================================
//        RESET FILTERS
//     ======================================================== */

//     function resetFilters() {
//         setSearchInput("");

//         setColumnFilters([]);

//         setFromDate("");
//         setToDate("");
//         setEmployeeId("");
//         setStatus("");
//         setItPersonal("");

//         const emptyFilters =
//             EMPTY_SERVER_FILTERS;

//         setLocalAppliedFilters(
//             emptyFilters
//         );

//         if (
//             serverSideDateFilter
//         ) {
//             onApplyServerFilters?.(
//                 emptyFilters
//             );
//         }

//         table.setPageIndex(
//             0
//         );

//         setFilterOpen(false);
//     }

//     /* ========================================================
//        EXCEL EXPORT
//     ======================================================== */

//     function exportToExcel() {
//         const visibleColumns =
//             table
//                 .getVisibleLeafColumns()
//                 .filter(
//                     (
//                         column
//                     ) =>
//                         column.id !==
//                         "actions" &&
//                         column.id !==
//                         "action"
//                 );

//         const exportRows =
//             filteredData.map(
//                 (
//                     row
//                 ) => {
//                     const record =
//                         row as Record<
//                             string,
//                             unknown
//                         >;

//                     const output:
//                         Record<
//                             string,
//                             string | number
//                         > = {};

//                     visibleColumns.forEach(
//                         (
//                             column
//                         ) => {
//                             const header =
//                                 column
//                                     .columnDef
//                                     .header;

//                             const label =
//                                 typeof header ===
//                                     "string"
//                                     ? header
//                                     : getColumnDisplayName(
//                                         column.id
//                                     );

//                             output[
//                                 label
//                             ] =
//                                 exportCellValue(
//                                     record[
//                                     column.id
//                                     ]
//                                 );
//                         }
//                     );

//                     return output;
//                 }
//             );

//         const worksheet =
//             XLSX.utils.json_to_sheet(
//                 exportRows
//             );

//         const workbook =
//             XLSX.utils.book_new();

//         XLSX.utils.book_append_sheet(
//             workbook,
//             worksheet,
//             "Data"
//         );

//         XLSX.writeFile(
//             workbook,
//             "itm-data.xlsx"
//         );
//     }

//     /* ========================================================
//        VISIBLE COLUMN COUNT
//     ======================================================== */

//     const visibleColumnCount =
//         Math.max(
//             table
//                 .getVisibleLeafColumns()
//                 .length,
//             1
//         );

//     /* ========================================================
//        STYLES
//     ======================================================== */

//     const toolbarButtonClass =
//         compact
//             ? "h-8 px-2.5 text-[10px]"
//             : "h-9 px-3 text-xs";

//     const toolbarIconClass =
//         compact
//             ? "mr-1.5 h-3.5 w-3.5"
//             : "mr-2 h-4 w-4";

//     const searchHeight =
//         compact
//             ? "h-8"
//             : "h-9";

//     const searchText =
//         compact
//             ? "text-[10px]"
//             : "text-xs";

//     const badgeClass =
//         compact
//             ? "h-6 gap-1 px-2 text-[9px]"
//             : "h-7 gap-1 px-2 text-[10px]";

//     /* ========================================================
//        RENDER
//     ======================================================== */

//     return (
//         <div className="w-full min-w-0 space-y-2.5">

//             {/* ==================================================
//                 TOOLBAR
//             ================================================== */}

//             <div
//                 className="
//                     flex
//                     w-full
//                     min-w-0
//                     items-center
//                     gap-2
//                 "
//             >
//                 {/* SEARCH */}

//                 <div
//                     className="
//                         relative
//                         min-w-0
//                         flex-1
//                     "
//                 >
//                     <Search
//                         className="
//                             pointer-events-none
//                             absolute
//                             left-2.5
//                             top-1/2
//                             h-3.5
//                             w-3.5
//                             -translate-y-1/2
//                             text-muted-foreground
//                         "
//                     />

//                     <Input
//                         value={
//                             searchInput
//                         }
//                         onChange={(
//                             event
//                         ) =>
//                             setSearchInput(
//                                 event
//                                     .target
//                                     .value
//                             )
//                         }
//                         placeholder="Search TT, employee, query, status..."
//                         className={`
//                             w-full
//                             ${searchHeight}
//                             ${searchText}
//                             pl-8
//                             pr-8
//                         `}
//                     />

//                     {searchInput && (
//                         <button
//                             type="button"
//                             onClick={() =>
//                                 setSearchInput(
//                                     ""
//                                 )
//                             }
//                             className="
//                                 absolute
//                                 right-2
//                                 top-1/2
//                                 flex
//                                 h-5
//                                 w-5
//                                 -translate-y-1/2
//                                 items-center
//                                 justify-center
//                                 rounded-full
//                                 text-muted-foreground
//                                 transition-colors
//                                 hover:bg-muted
//                                 hover:text-foreground
//                             "
//                             aria-label="Clear search"
//                         >
//                             <X className="h-3 w-3" />
//                         </button>
//                     )}
//                 </div>

//                 {/* FILTER */}

//                 <DropdownMenu
//                     open={
//                         filterOpen
//                     }
//                     onOpenChange={
//                         setFilterOpen
//                     }
//                 >
//                     <DropdownMenuTrigger
//                         asChild
//                     >
//                         <Button
//                             type="button"
//                             variant="outline"
//                             className={`
//                                 shrink-0
//                                 border-emerald-300
//                                 bg-emerald-50
//                                 text-emerald-700
//                                 hover:bg-emerald-100
//                                 ${toolbarButtonClass}
//                             `}
//                         >
//                             <Filter
//                                 className={
//                                     toolbarIconClass
//                                 }
//                             />

//                             Filter

//                             {activeFiltersCount >
//                                 0 && (
//                                     <span
//                                         className="
//                                         ml-1
//                                         inline-flex
//                                         h-4
//                                         min-w-4
//                                         items-center
//                                         justify-center
//                                         rounded-full
//                                         bg-emerald-600
//                                         px-1
//                                         text-[8px]
//                                         font-bold
//                                         text-white
//                                     "
//                                     >
//                                         {
//                                             activeFiltersCount
//                                         }
//                                     </span>
//                                 )}
//                         </Button>
//                     </DropdownMenuTrigger>

//                     <DropdownMenuContent
//                         align="start"
//                         sideOffset={6}
//                         className="
//                             w-[310px]
//                             max-w-[calc(100vw-24px)]
//                             p-3
//                         "
//                     >
//                         <DropdownMenuLabel
//                             className="
//                                 px-0
//                                 pb-2
//                                 text-xs
//                                 font-semibold
//                             "
//                         >
//                             Trouble Ticket Filters
//                         </DropdownMenuLabel>

//                         <DropdownMenuSeparator />

//                         <div className="space-y-3 pt-3">

//                             {/* DATE */}

//                             <div
//                                 className="
//                                     grid
//                                     grid-cols-2
//                                     gap-2
//                                 "
//                             >
//                                 <div className="space-y-1">
//                                     <label
//                                         className="
//                                             text-[9px]
//                                             font-semibold
//                                             text-muted-foreground
//                                         "
//                                     >
//                                         From Date
//                                     </label>

//                                     <Input
//                                         type="date"
//                                         value={
//                                             fromDate
//                                         }
//                                         onChange={(
//                                             event
//                                         ) =>
//                                             setFromDate(
//                                                 event
//                                                     .target
//                                                     .value
//                                             )
//                                         }
//                                         className="
//                                             h-8
//                                             text-[10px]
//                                         "
//                                     />
//                                 </div>

//                                 <div className="space-y-1">
//                                     <label
//                                         className="
//                                             text-[9px]
//                                             font-semibold
//                                             text-muted-foreground
//                                         "
//                                     >
//                                         To Date
//                                     </label>

//                                     <Input
//                                         type="date"
//                                         value={
//                                             toDate
//                                         }
//                                         onChange={(
//                                             event
//                                         ) =>
//                                             setToDate(
//                                                 event
//                                                     .target
//                                                     .value
//                                             )
//                                         }
//                                         className="
//                                             h-8
//                                             text-[10px]
//                                         "
//                                     />
//                                 </div>
//                             </div>

//                             {/* EMPLOYEE */}

//                             <div className="space-y-1">
//                                 <label
//                                     className="
//                                         text-[9px]
//                                         font-semibold
//                                         text-muted-foreground
//                                     "
//                                 >
//                                     Employee ID
//                                 </label>

//                                 <Input
//                                     value={
//                                         employeeId
//                                     }
//                                     onChange={(
//                                         event
//                                     ) =>
//                                         setEmployeeId(
//                                             event
//                                                 .target
//                                                 .value
//                                         )
//                                     }
//                                     placeholder="e.g. 02-0407"
//                                     className="
//                                         h-8
//                                         text-[10px]
//                                     "
//                                 />
//                             </div>

//                             {/* IT PERSONNEL */}

//                             {itPersonalOptions.length >
//                                 0 && (
//                                     <div className="space-y-1">
//                                         <label
//                                             className="
//                                             text-[9px]
//                                             font-semibold
//                                             text-muted-foreground
//                                         "
//                                         >
//                                             Assigned IT Personnel
//                                         </label>

//                                         <select
//                                             value={
//                                                 itPersonal
//                                             }
//                                             onChange={(
//                                                 event
//                                             ) =>
//                                                 setItPersonal(
//                                                     event
//                                                         .target
//                                                         .value
//                                                 )
//                                             }
//                                             className="
//                                             h-8
//                                             w-full
//                                             rounded-md
//                                             border
//                                             border-input
//                                             bg-background
//                                             px-2
//                                             text-[10px]
//                                             outline-none
//                                             focus:ring-2
//                                             focus:ring-ring
//                                         "
//                                         >
//                                             <option value="">
//                                                 All IT Personnel
//                                             </option>

//                                             {itPersonalOptions.map(
//                                                 (
//                                                     option
//                                                 ) => (
//                                                     <option
//                                                         key={
//                                                             option.value
//                                                         }
//                                                         value={
//                                                             option.value
//                                                         }
//                                                     >
//                                                         {
//                                                             option.label
//                                                         }
//                                                     </option>
//                                                 )
//                                             )}
//                                         </select>
//                                     </div>
//                                 )}

//                             {/* STATUS */}

//                             {statusColumn && (
//                                 <div className="space-y-1">
//                                     <label
//                                         className="
//                                             text-[9px]
//                                             font-semibold
//                                             text-muted-foreground
//                                         "
//                                     >
//                                         Status
//                                     </label>

//                                     <select
//                                         value={
//                                             status
//                                         }
//                                         onChange={(
//                                             event
//                                         ) =>
//                                             setStatus(
//                                                 event
//                                                     .target
//                                                     .value
//                                             )
//                                         }
//                                         className="
//                                             h-8
//                                             w-full
//                                             rounded-md
//                                             border
//                                             border-input
//                                             bg-background
//                                             px-2
//                                             text-[10px]
//                                             outline-none
//                                             focus:ring-2
//                                             focus:ring-ring
//                                         "
//                                     >
//                                         <option value="">
//                                             All Status
//                                         </option>

//                                         <option value="Open">
//                                             Open
//                                         </option>

//                                         <option value="Closed">
//                                             Closed
//                                         </option>
//                                     </select>
//                                 </div>
//                             )}

//                             {/* BUTTONS */}

//                             <div
//                                 className="
//                                     flex
//                                     items-center
//                                     justify-between
//                                     gap-2
//                                     border-t
//                                     pt-3
//                                 "
//                             >
//                                 <Button
//                                     type="button"
//                                     variant="ghost"
//                                     onClick={
//                                         resetFilters
//                                     }
//                                     className="
//                                         h-8
//                                         px-2
//                                         text-[10px]
//                                         text-destructive
//                                         hover:bg-destructive/10
//                                     "
//                                 >
//                                     <X className="mr-1 h-3 w-3" />

//                                     Clear
//                                 </Button>

//                                 <Button
//                                     type="button"
//                                     onClick={
//                                         applyFilters
//                                     }
//                                     className="
//                                         h-8
//                                         px-3
//                                         text-[10px]
//                                     "
//                                 >
//                                     Apply Filters
//                                 </Button>
//                             </div>
//                         </div>
//                     </DropdownMenuContent>
//                 </DropdownMenu>

//                 {/* RIGHT ACTIONS */}

//                 <div
//                     className="
//                         ml-auto
//                         flex
//                         shrink-0
//                         items-center
//                         gap-1.5
//                     "
//                 >
//                     {/* COLUMNS */}

//                     <DropdownMenu>
//                         <DropdownMenuTrigger
//                             asChild
//                         >
//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 className={
//                                     toolbarButtonClass
//                                 }
//                             >
//                                 <SlidersHorizontal
//                                     className={
//                                         toolbarIconClass
//                                     }
//                                 />

//                                 Columns
//                             </Button>
//                         </DropdownMenuTrigger>

//                         <DropdownMenuContent
//                             align="end"
//                             className="
//                                 max-h-[420px]
//                                 w-64
//                                 overflow-y-auto
//                             "
//                         >
//                             <DropdownMenuLabel
//                                 className={
//                                     compact
//                                         ? "text-[10px]"
//                                         : "text-xs"
//                                 }
//                             >
//                                 Show / Hide Columns
//                             </DropdownMenuLabel>

//                             <DropdownMenuSeparator />

//                             <div className="py-1">
//                                 {table
//                                     .getAllColumns()
//                                     .filter(
//                                         (
//                                             column
//                                         ) =>
//                                             column.getCanHide()
//                                     )
//                                     .map(
//                                         (
//                                             column
//                                         ) => {
//                                             const header =
//                                                 column
//                                                     .columnDef
//                                                     .header;

//                                             const label =
//                                                 typeof header ===
//                                                     "string"
//                                                     ? header
//                                                     : getColumnDisplayName(
//                                                         column.id
//                                                     );

//                                             const visible =
//                                                 column.getIsVisible();

//                                             return (
//                                                 <DropdownMenuCheckboxItem
//                                                     key={
//                                                         column.id
//                                                     }
//                                                     checked={
//                                                         visible
//                                                     }
//                                                     onCheckedChange={(
//                                                         checked
//                                                     ) =>
//                                                         column.toggleVisibility(
//                                                             Boolean(
//                                                                 checked
//                                                             )
//                                                         )
//                                                     }
//                                                     className="text-[10px]"
//                                                 >
//                                                     <span className="mr-2">
//                                                         {visible ? (
//                                                             <Eye className="h-3.5 w-3.5" />
//                                                         ) : (
//                                                             <EyeOff className="h-3.5 w-3.5" />
//                                                         )}
//                                                     </span>

//                                                     {
//                                                         label
//                                                     }
//                                                 </DropdownMenuCheckboxItem>
//                                             );
//                                         }
//                                     )}
//                             </div>
//                         </DropdownMenuContent>
//                     </DropdownMenu>

//                     {/* EXCEL */}

//                     <Button
//                         type="button"
//                         variant="outline"
//                         onClick={
//                             exportToExcel
//                         }
//                         className={
//                             toolbarButtonClass
//                         }
//                     >
//                         <Download
//                             className={
//                                 toolbarIconClass
//                             }
//                         />

//                         Excel
//                     </Button>
//                 </div>
//             </div>

//             {/* ==================================================
//                 ACTIVE FILTERS
//             ================================================== */}

//             {activeFiltersCount >
//                 0 && (
//                     <div
//                         className="
//                         flex
//                         min-w-0
//                         flex-wrap
//                         items-center
//                         gap-1.5
//                     "
//                     >
//                         {searchInput.trim() && (
//                             <Badge
//                                 variant="outline"
//                                 className={
//                                     badgeClass
//                                 }
//                             >
//                                 <span className="font-semibold text-primary">
//                                     Search:
//                                 </span>

//                                 <span
//                                     className="
//                                     max-w-[220px]
//                                     truncate
//                                     font-medium
//                                 "
//                                     title={
//                                         searchInput
//                                     }
//                                 >
//                                     {
//                                         searchInput
//                                     }
//                                 </span>

//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setSearchInput(
//                                             ""
//                                         )
//                                     }
//                                     className="
//                                     ml-0.5
//                                     inline-flex
//                                     h-4
//                                     w-4
//                                     items-center
//                                     justify-center
//                                     rounded-full
//                                     text-muted-foreground
//                                     hover:bg-destructive/10
//                                     hover:text-destructive
//                                 "
//                                     aria-label="Clear search"
//                                 >
//                                     <X className="h-3 w-3" />
//                                 </button>
//                             </Badge>
//                         )}

//                         {serverSideDateFilter ? (
//                             <>
//                                 {appliedFilters.employeeId && (
//                                     <Badge
//                                         variant="outline"
//                                         className={
//                                             badgeClass
//                                         }
//                                     >
//                                         <span className="font-semibold text-primary">
//                                             Employee:
//                                         </span>

//                                         <span>
//                                             {
//                                                 appliedFilters.employeeId
//                                             }
//                                         </span>
//                                     </Badge>
//                                 )}

//                                 {appliedFilters.itPersonal && (
//                                     <Badge
//                                         variant="outline"
//                                         className={
//                                             badgeClass
//                                         }
//                                     >
//                                         <span className="font-semibold text-primary">
//                                             Assigned:
//                                         </span>

//                                         <span>
//                                             {
//                                                 appliedFilters.itPersonal
//                                             }
//                                         </span>
//                                     </Badge>
//                                 )}

//                                 {appliedFilters.status && (
//                                     <Badge
//                                         variant="outline"
//                                         className={
//                                             badgeClass
//                                         }
//                                     >
//                                         <span className="font-semibold text-primary">
//                                             Status:
//                                         </span>

//                                         <span>
//                                             {
//                                                 appliedFilters.status
//                                             }
//                                         </span>
//                                     </Badge>
//                                 )}

//                                 {(
//                                     appliedFilters.fromDate ||
//                                     appliedFilters.toDate
//                                 ) && (
//                                         <Badge
//                                             variant="outline"
//                                             className={
//                                                 badgeClass
//                                             }
//                                         >
//                                             <span className="font-semibold text-primary">
//                                                 Date:
//                                             </span>

//                                             <span>
//                                                 {
//                                                     appliedFilters.fromDate ||
//                                                     "Start"
//                                                 }

//                                                 {" — "}

//                                                 {
//                                                     appliedFilters.toDate ||
//                                                     "Now"
//                                                 }
//                                             </span>
//                                         </Badge>
//                                     )}
//                             </>
//                         ) : (
//                             <>
//                                 {columnFilters.map(
//                                     (
//                                         filter
//                                     ) => (
//                                         <Badge
//                                             key={
//                                                 filter.id
//                                             }
//                                             variant="outline"
//                                             className={
//                                                 badgeClass
//                                             }
//                                         >
//                                             <span className="font-semibold text-primary">
//                                                 {getColumnDisplayName(
//                                                     filter.id
//                                                 )}
//                                                 :
//                                             </span>

//                                             <span>
//                                                 {String(
//                                                     filter.value
//                                                 )}
//                                             </span>

//                                             <button
//                                                 type="button"
//                                                 onClick={() =>
//                                                     setColumnFilters(
//                                                         (
//                                                             current
//                                                         ) =>
//                                                             current.filter(
//                                                                 (
//                                                                     item
//                                                                 ) =>
//                                                                     item.id !==
//                                                                     filter.id
//                                                             )
//                                                     )
//                                                 }
//                                                 className="
//                                                 ml-0.5
//                                                 inline-flex
//                                                 h-4
//                                                 w-4
//                                                 items-center
//                                                 justify-center
//                                                 rounded-full
//                                                 text-muted-foreground
//                                                 hover:bg-destructive/10
//                                                 hover:text-destructive
//                                             "
//                                             >
//                                                 <X className="h-3 w-3" />
//                                             </button>
//                                         </Badge>
//                                     )
//                                 )}

//                                 {(
//                                     fromDate ||
//                                     toDate
//                                 ) && (
//                                         <Badge
//                                             variant="outline"
//                                             className={
//                                                 badgeClass
//                                             }
//                                         >
//                                             <span className="font-semibold text-primary">
//                                                 Date:
//                                             </span>

//                                             <span>
//                                                 {
//                                                     fromDate ||
//                                                     "Start"
//                                                 }

//                                                 {" — "}

//                                                 {
//                                                     toDate ||
//                                                     "Now"
//                                                 }
//                                             </span>
//                                         </Badge>
//                                     )}
//                             </>
//                         )}

//                         <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={
//                                 resetFilters
//                             }
//                             className="
//                             h-7
//                             shrink-0
//                             px-2.5
//                             text-[10px]
//                             font-semibold
//                             text-destructive
//                             hover:bg-destructive/10
//                             hover:text-destructive
//                         "
//                         >
//                             <X className="mr-1 h-3.5 w-3.5" />

//                             Clear all
//                         </Button>
//                     </div>
//                 )}

//             {/* ==================================================
//                 TABLE
//             ================================================== */}

//             <div
//                 ref={tableHoverAreaRef}
//                 className={`
//                     relative
//                     w-full
//                     min-w-0
//                     overflow-hidden
//                     border
//                     border-border
//                     bg-card

//                     ${compact
//                         ? "rounded-lg"
//                         : "rounded-xl"
//                     }
//                 `}
//             >
//                 <Table
//                     className={`
//                         w-full
//                         table-fixed
//                         border-collapse
//                         ${compact
//                             ? "text-[9px]"
//                             : "text-[10px]"
//                         }
//                     `}
//                 >
//                     <TableHeader>
//                         {table
//                             .getHeaderGroups()
//                             .map(
//                                 (
//                                     headerGroup
//                                 ) => (
//                                     <TableRow
//                                         key={
//                                             headerGroup.id
//                                         }
//                                         className="
//                                             hover:bg-transparent
//                                         "
//                                     >
//                                         {headerGroup.headers.map(
//                                             (
//                                                 header
//                                             ) => {
//                                                 const width =
//                                                     getColumnWidth(
//                                                         header
//                                                             .column
//                                                             .id
//                                                     );

//                                                 return (
//                                                     <TableHead
//                                                         key={
//                                                             header.id
//                                                         }
//                                                         className={`
//                                                             overflow-hidden
//                                                             border-b
//                                                             bg-muted/60
//                                                             text-center
//                                                             font-semibold
//                                                             uppercase
//                                                             tracking-wide
//                                                             text-muted-foreground

//                                                             ${compact
//                                                                 ? "h-8 px-1 py-1 text-[8px]"
//                                                                 : "px-2 py-2 text-[9px]"
//                                                             }
//                                                         `}
//                                                         style={{
//                                                             width,
//                                                         }}
//                                                     >
//                                                         {header.isPlaceholder
//                                                             ? null
//                                                             : flexRender(
//                                                                 header
//                                                                     .column
//                                                                     .columnDef
//                                                                     .header,
//                                                                 header.getContext()
//                                                             )}
//                                                     </TableHead>
//                                                 );
//                                             }
//                                         )}
//                                     </TableRow>
//                                 )
//                             )}
//                     </TableHeader>

//                     <TableBody>
//                         {table
//                             .getRowModel()
//                             .rows.length ? (
//                             table
//                                 .getRowModel()
//                                 .rows
//                                 .map(
//                                     (
//                                         row
//                                     ) => {
//                                         const record =
//                                             row.original as Record<
//                                                 string,
//                                                 unknown
//                                             >;

//                                         return (
//                                             <TableRow
//                                                 key={
//                                                     row.id
//                                                 }
//                                                 onMouseEnter={() =>
//                                                     beginRowHover(
//                                                         row.original
//                                                     )
//                                                 }
//                                                 onMouseLeave={
//                                                     endRowHover
//                                                 }
//                                                 className={`
//                                                     group
//                                                     relative
//                                                     border-b
//                                                     border-border/70
//                                                     transition-all
//                                                     duration-200
//                                                     ease-out

//                                                     hover:bg-primary/[0.045]
//                                                     hover:shadow-[inset_3px_0_0_hsl(var(--primary)/0.65)]
//                                                     hover:relative
//                                                     hover:z-10

//                                                     ${hoveredRow === row.original
//                                                         ? "bg-primary/[0.035] shadow-[inset_3px_0_0_hsl(var(--primary)/0.65)]"
//                                                         : ""
//                                                     }

//                                                     ${compact
//                                                         ? "h-8"
//                                                         : ""
//                                                     }
//                                                 `}
//                                             >
//                                                 {row
//                                                     .getVisibleCells()
//                                                     .map(
//                                                         (
//                                                             cell
//                                                         ) => {
//                                                             const width =
//                                                                 getColumnWidth(
//                                                                     cell
//                                                                         .column
//                                                                         .id
//                                                                 );

//                                                             const columnId =
//                                                                 cell
//                                                                     .column
//                                                                     .id;

//                                                             const isAction =
//                                                                 columnId ===
//                                                                 "action" ||
//                                                                 columnId ===
//                                                                 "actions";

//                                                             const isCreated =
//                                                                 columnId ===
//                                                                 "created_at";

//                                                             const isQuery =
//                                                                 columnId ===
//                                                                 "query_type" ||
//                                                                 columnId ===
//                                                                 "query";

//                                                             const rawValue =
//                                                                 record[
//                                                                 columnId
//                                                                 ];

//                                                             return (
//                                                                 <TableCell
//                                                                     key={
//                                                                         cell.id
//                                                                     }
//                                                                     className={`
//                                                                         overflow-hidden
//                                                                         text-center
//                                                                         align-middle

//                                                                         ${compact
//                                                                             ? "h-8 px-1 py-[3px] text-[9px]"
//                                                                             : "px-2 py-2 text-[10px]"
//                                                                         }

//                                                                         ${columnId ===
//                                                                             "tt_no"
//                                                                             ? "font-semibold text-primary"
//                                                                             : ""
//                                                                         }

//                                                                         ${isAction
//                                                                             ? "relative z-30"
//                                                                             : ""
//                                                                         }
//                                                                     `}
//                                                                     style={{
//                                                                         width,
//                                                                     }}
//                                                                 >
//                                                                     <div
//                                                                         className="
//                                                                             min-w-0
//                                                                             max-w-full
//                                                                             overflow-hidden
//                                                                         "
//                                                                     >
//                                                                         {isCreated ? (
//                                                                             (() => {
//                                                                                 const created =
//                                                                                     formatCreatedDateTime(
//                                                                                         rawValue
//                                                                                     );

//                                                                                 return (
//                                                                                     <div
//                                                                                         className="
//                                                                                             flex
//                                                                                             min-w-0
//                                                                                             flex-col
//                                                                                             items-center
//                                                                                             justify-center
//                                                                                             leading-tight
//                                                                                         "
//                                                                                         title={`${created.date} ${created.time}`}
//                                                                                     >
//                                                                                         <span
//                                                                                             className="
//                                                                                                 whitespace-nowrap
//                                                                                                 font-medium
//                                                                                                 text-foreground
//                                                                                             "
//                                                                                         >
//                                                                                             {
//                                                                                                 created.date
//                                                                                             }
//                                                                                         </span>

//                                                                                         <span
//                                                                                             className="
//                                                                                                 mt-0.5
//                                                                                                 whitespace-nowrap
//                                                                                                 font-mono
//                                                                                                 text-[10px]
//                                                                                                 font-medium
//                                                                                                 text-muted-foreground
//                                                                                             "
//                                                                                         >
//                                                                                             {
//                                                                                                 created.time
//                                                                                             }
//                                                                                         </span>
//                                                                                     </div>
//                                                                                 );
//                                                                             })()
//                                                                         ) : isQuery ? (
//                                                                             <div
//                                                                                 className="
//                                                                                     mx-auto
//                                                                                     min-w-0
//                                                                                     max-w-full
//                                                                                     truncate
//                                                                                     px-1
//                                                                                 "
//                                                                                 title={
//                                                                                     rawValue !==
//                                                                                         null &&
//                                                                                         rawValue !==
//                                                                                         undefined
//                                                                                         ? String(
//                                                                                             rawValue
//                                                                                         )
//                                                                                         : undefined
//                                                                                 }
//                                                                             >
//                                                                                 {flexRender(
//                                                                                     cell
//                                                                                         .column
//                                                                                         .columnDef
//                                                                                         .cell,
//                                                                                     cell.getContext()
//                                                                                 )}
//                                                                             </div>
//                                                                         ) : (
//                                                                             flexRender(
//                                                                                 cell
//                                                                                     .column
//                                                                                     .columnDef
//                                                                                     .cell,
//                                                                                 cell.getContext()
//                                                                             )
//                                                                         )}
//                                                                     </div>
//                                                                 </TableCell>
//                                                             );
//                                                         }
//                                                     )}
//                                             </TableRow>
//                                         );
//                                     }
//                                 )
//                         ) : (
//                             <TableRow>
//                                 <TableCell
//                                     colSpan={
//                                         visibleColumnCount
//                                     }
//                                     className={
//                                         compact
//                                             ? "h-24 text-center text-[10px] font-medium text-muted-foreground"
//                                             : "h-32 text-center text-sm font-medium text-muted-foreground"
//                                     }
//                                 >
//                                     {
//                                         emptyMessage
//                                     }
//                                 </TableCell>
//                             </TableRow>
//                         )}
//                     </TableBody>
//                 </Table>

//                 {/* ==================================================
//                     PROFESSIONAL HOVER PREVIEW

//                     Kept outside the table itself so it cannot
//                     affect table width or create horizontal scroll.
//                 ================================================== */}

//                 {hoverPreviewMounted && (
//                     <TroubleTicketHoverPreview
//                         record={
//                             hoveredRow
//                                 ? (hoveredRow as Record<
//                                     string,
//                                     unknown
//                                 >)
//                                 : null
//                         }
//                         visible={
//                             hoverPreviewVisible
//                         }
//                         position={
//                             hoverPreviewPosition
//                         }
//                     />
//                 )}
//             </div>

//             {/* ==================================================
//                 PAGINATION
//             ================================================== */}

//             <div
//                 className={`
//                     flex
//                     items-center
//                     justify-between
//                     gap-3

//                     ${compact
//                         ? "px-0.5"
//                         : "px-1"
//                     }
//                 `}
//             >
//                 <p
//                     className={
//                         compact
//                             ? "text-[10px] text-muted-foreground"
//                             : "text-xs text-muted-foreground"
//                     }
//                 >
//                     Page{" "}

//                     <span className="font-medium text-foreground">
//                         {table
//                             .getState()
//                             .pagination
//                             .pageIndex +
//                             1}
//                     </span>

//                     {" "}

//                     of{" "}

//                     <span className="font-medium text-foreground">
//                         {Math.max(
//                             table.getPageCount(),
//                             1
//                         )}
//                     </span>
//                 </p>

//                 <div
//                     className={
//                         compact
//                             ? "flex items-center gap-1.5"
//                             : "flex items-center gap-2"
//                     }
//                 >
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() =>
//                             table.previousPage()
//                         }
//                         disabled={
//                             !table.getCanPreviousPage()
//                         }
//                         className={
//                             compact
//                                 ? "h-7 px-2.5 text-[10px]"
//                                 : "h-8 text-xs"
//                         }
//                     >
//                         Previous
//                     </Button>

//                     <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() =>
//                             table.nextPage()
//                         }
//                         disabled={
//                             !table.getCanNextPage()
//                         }
//                         className={
//                             compact
//                                 ? "h-7 px-2.5 text-[10px]"
//                                 : "h-8 text-xs"
//                         }
//                     >
//                         Next
//                     </Button>
//                 </div>
//             </div>
//         </div>
//     );
// }






// frontend/components/data-table.tsx

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Building2,
    CalendarDays,
    Clock3,
    Download,
    Eye,
    EyeOff,
    FileText,
    Mail,
    Filter,
    PackageCheck,
    Search,
    Smartphone,
    SlidersHorizontal,
    UserCheck,
    UserRound,
    X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

export type DataTableServerFilters = {
    fromDate: string;
    toDate: string;
    employeeId: string;
    status: string;
    itPersonal: string;
};

export type DataTableOption = {
    value: string;
    label: string;
};

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];

    dateColumn?: string;

    compact?: boolean;

    serverSideDateFilter?: boolean;

    itPersonalOptions?: DataTableOption[];

    appliedServerFilters?: DataTableServerFilters;

    emptyMessage?: string;

    onApplyServerFilters?: (
        filters: DataTableServerFilters
    ) => void;
}

/* ============================================================
   DEFAULTS
============================================================ */

const EMPTY_SERVER_FILTERS: DataTableServerFilters = {
    fromDate: "",
    toDate: "",
    employeeId: "",
    status: "",
    itPersonal: "",
};

const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
    mrnNumber: false,
    prNumber: false,
    department: false,
    designation: false,
    brand: false,
    deviceType: false,
    vendor: false,
    assignedBy: false,
    assignedDate: false,
    returnedDate: false,
    transferredDate: false,
    purchaseDate: false,
    warranty: false,
    deviceAge: false,
    userUsageDuration: false,
    remarks: false,

    dept_name: false,
    employee_name: false,
    func_name: false,
    mobile_no: false,

    postingArea: false,
    postingDistrict: false,
    personalMobile: false,
    officeMobile: false,
};

/* ============================================================
   HELPERS
============================================================ */

function normalizeValue(value: unknown): string {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        typeof value === "object"
    ) {
        try {
            return JSON.stringify(value).toLowerCase();
        } catch {
            return String(value).toLowerCase();
        }
    }

    return String(value).toLowerCase();
}

/* ============================================================
   DATE NORMALIZATION
============================================================ */

function normalizeDateOnly(
    value: unknown
): string | null {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    if (value instanceof Date) {
        if (
            Number.isNaN(
                value.getTime()
            )
        ) {
            return null;
        }

        const year =
            value.getFullYear();

        const month =
            String(
                value.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                value.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    const text =
        String(value).trim();

    if (!text) {
        return null;
    }

    const match =
        text.match(
            /(\d{4})-(\d{2})-(\d{2})/
        );

    if (match) {
        return (
            `${match[1]}-` +
            `${match[2]}-` +
            `${match[3]}`
        );
    }

    const parsed =
        new Date(text);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return null;
    }

    const year =
        parsed.getFullYear();

    const month =
        String(
            parsed.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            parsed.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* ============================================================
   CREATED DATE / TIME
============================================================ */

function formatCreatedDateTime(
    value: unknown
): {
    date: string;
    time: string;
} {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return {
            date: "—",
            time: "—",
        };
    }

    if (value instanceof Date) {
        if (
            Number.isNaN(
                value.getTime()
            )
        ) {
            return {
                date: "—",
                time: "—",
            };
        }

        const date =
            [
                value.getFullYear(),
                String(
                    value.getMonth() + 1
                ).padStart(2, "0"),
                String(
                    value.getDate()
                ).padStart(2, "0"),
            ].join("-");

        const time =
            [
                String(
                    value.getHours()
                ).padStart(2, "0"),
                String(
                    value.getMinutes()
                ).padStart(2, "0"),
                String(
                    value.getSeconds()
                ).padStart(2, "0"),
            ].join(":");

        return {
            date,
            time,
        };
    }

    const text =
        String(value).trim();

    /*
     * Preserve the timestamp returned by PostgreSQL.
     *
     * Example:
     *
     * 2026-09-08T16:18:03.071+06:00
     *
     * We intentionally extract the date/time directly
     * instead of converting through the browser timezone.
     */
    const match =
        text.match(
            /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/
        );

    if (match) {
        return {
            date: match[1],
            time: match[2],
        };
    }

    const parsed =
        new Date(text);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return {
            date: text,
            time: "",
        };
    }

    const date =
        [
            parsed.getFullYear(),
            String(
                parsed.getMonth() + 1
            ).padStart(2, "0"),
            String(
                parsed.getDate()
            ).padStart(2, "0"),
        ].join("-");

    const time =
        [
            String(
                parsed.getHours()
            ).padStart(2, "0"),
            String(
                parsed.getMinutes()
            ).padStart(2, "0"),
            String(
                parsed.getSeconds()
            ).padStart(2, "0"),
        ].join(":");

    return {
        date,
        time,
    };
}

/* ============================================================
   COLUMN DISPLAY NAME
============================================================ */

function getColumnDisplayName(
    columnId: string
): string {
    const names: Record<
        string,
        string
    > = {
        employeeId:
            "Employee ID",

        employee_id:
            "Employee ID",

        employee_name:
            "Employee Name",

        assigned_id:
            "Assigned ID",

        assigned_name:
            "Assigned",

        status:
            "Status",

        requisition_type:
            "Requisition",

        delivered_status:
            "Delivery",

        tt_no:
            "TT No",

        created_at:
            "Created",

        query_type:
            "Query",

        query:
            "Query",

        description:
            "Description",

        dept_name:
            "Department",

        department:
            "Department",

        func_name:
            "Function",

        function:
            "Function",

        mobile_no:
            "Mobile No",

        mobile:
            "Mobile",

        action:
            "Action",

        actions:
            "Action",

        age:
            "Age",

        tt_age:
            "Age",
    };

    return (
        names[columnId] ??
        columnId
    );
}

/* ============================================================
   RESPONSIVE COLUMN WIDTH
============================================================ */

function getColumnWidth(
    columnId: string
): string | undefined {
    const widths: Record<
        string,
        string
    > = {
        /*
         * TT TABLE
         *
         * The widths intentionally stay below
         * 100% so the table never creates an
         * unnecessary horizontal scrollbar.
         */

        sl: "5%",
        serial: "5%",
        index: "5%",

        tt_no: "11%",

        employee_id: "9%",
        employeeId: "9%",

        assigned_id: "9%",
        assigned_name: "10%",

        query_type: "16%",
        query: "16%",

        age: "7%",
        tt_age: "7%",

        status: "7%",

        requisition_type: "7%",

        delivered_status: "7%",

        created_at: "12%",

        action: "10%",
        actions: "10%",

        employee_name: "11%",
        dept_name: "10%",
        department: "10%",
        func_name: "10%",
        mobile_no: "10%",
    };

    return widths[columnId];
}

/* ============================================================
   GENERIC VALUE
============================================================ */

function displayValue(
    value: unknown
): string {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return "Not available";
    }

    if (
        typeof value === "object"
    ) {
        try {
            return JSON.stringify(
                value
            );
        } catch {
            return String(value);
        }
    }

    return String(value);
}

/* ============================================================
   FIND VALUE BY POSSIBLE KEYS
============================================================ */

function getRecordValue(
    record: Record<string, unknown>,
    keys: string[]
): unknown {
    for (const key of keys) {
        if (
            record[key] !==
            undefined &&
            record[key] !== null &&
            String(
                record[key]
            ).trim() !== ""
        ) {
            return record[key];
        }
    }

    return undefined;
}

/* ============================================================
   EXPORT VALUE
============================================================ */

function exportCellValue(
    value: unknown
): string | number {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        typeof value ===
        "string" ||
        typeof value ===
        "number"
    ) {
        return value;
    }

    if (
        typeof value ===
        "boolean"
    ) {
        return value
            ? "Yes"
            : "No";
    }

    if (
        value instanceof Date
    ) {
        return value.toISOString();
    }

    if (
        typeof value === "object"
    ) {
        try {
            return JSON.stringify(
                value
            );
        } catch {
            return String(value);
        }
    }

    return String(value);
}

/* ============================================================
   TROUBLE TICKET ROW HOVER PREVIEW

   This is the ONLY Trouble Ticket hover implementation.
   It is rendered from DataTable through a portal so it cannot
   be clipped by table overflow. The card is pointer-events-none,
   and every click / keyboard interaction dismisses it before the
   target control opens.
============================================================ */

const TT_HOVER_OPEN_DELAY = 550;
const TT_HOVER_CLOSE_DELAY = 140;
const TT_HOVER_CARD_WIDTH = 430;
const TT_HOVER_CARD_HEIGHT = 390;

function isTroubleTicketRecord(
    record: Record<string, unknown>
): boolean {
    return Boolean(
        getRecordValue(record, [
            "tt_no",
            "ttNo",
        ])
    );
}

function TroubleTicketHoverPreview({
    record,
    visible,
    position,
}: {
    record: Record<string, unknown> | null;
    visible: boolean;
    position: {
        top: number;
        left: number;
    } | null;
}) {
    if (
        !record ||
        !position ||
        typeof document === "undefined"
    ) {
        return null;
    }

    const ttNo = getRecordValue(record, [
        "tt_no",
        "ttNo",
    ]);

    const employeeId = getRecordValue(record, [
        "employee_id",
        "employeeId",
    ]);

    const employeeName = getRecordValue(record, [
        "employee_name",
        "employeeName",
    ]);

    const assignedId = getRecordValue(record, [
        "assigned_id",
        "assignedId",
    ]);

    const assignedName = getRecordValue(record, [
        "assigned_name",
        "assignedName",
    ]);

    const query = getRecordValue(record, [
        "query_type",
        "query",
        "reason",
        "description",
    ]);

    const age = getRecordValue(record, [
        "tt_age",
        "age",
    ]);

    const status = getRecordValue(record, [
        "status",
        "normalized_status",
    ]);

    const department = getRecordValue(record, [
        "dept_name",
        "department",
    ]);

    const functionName = getRecordValue(record, [
        "func_name",
        "function",
    ]);

    const mobile = getRecordValue(record, [
        "mobile_no",
        "mobile",
        "personalMobile",
        "officeMobile",
    ]);

    const email = getRecordValue(record, [
        "email",
        "email_address",
        "emailAddress",
        "employee_email",
    ]);

    const requisition = getRecordValue(record, [
        "requisition_type",
        "requisition",
    ]);

    const delivery = getRecordValue(record, [
        "delivered_status",
        "delivery",
    ]);

    const created = formatCreatedDateTime(
        getRecordValue(record, [
            "created_at",
            "createdAt",
            "created",
            "created_date",
            "createdDate",
        ])
    );

    const assignedText = assignedId
        ? assignedName
            ? `${displayValue(assignedName)} (${displayValue(assignedId)})`
            : displayValue(assignedId)
        : assignedName
            ? displayValue(assignedName)
            : "Not assigned";

    const normalizedStatus = String(
        status ?? ""
    ).toLowerCase();

    const statusClass = normalizedStatus.includes(
        "closed"
    )
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        : normalizedStatus.includes("reject")
            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";

    return createPortal(
        <div
            aria-hidden="true"
            className={`
                pointer-events-none
                fixed
                z-[9999]
                w-[430px]
                max-w-[calc(100vw-24px)]
                -translate-x-1/2
                -translate-y-1/2
                transition-[opacity,transform,filter]
                duration-300
                ease-[cubic-bezier(0.22,1,0.36,1)]
                will-change-transform

                ${visible
                    ? "scale-100 opacity-100 blur-0"
                    : "scale-[0.965] opacity-0 blur-[1.5px]"
                }
            `}
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <div
                className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-border/80
                    bg-background/95
                    shadow-[0_24px_70px_rgba(0,0,0,0.20),0_8px_24px_rgba(0,0,0,0.08)]
                    ring-1
                    ring-black/5
                    backdrop-blur-xl
                "
            >
                {/* HEADER */}
                <div className="border-b border-border/70 bg-muted/30 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                <FileText className="h-3.5 w-3.5 text-primary" />
                                Trouble Ticket
                            </div>

                            <div className="mt-1 truncate font-mono text-[14px] font-bold text-primary">
                                {displayValue(ttNo)}
                            </div>
                        </div>

                        <span
                            className={`
                                inline-flex
                                shrink-0
                                items-center
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-[9px]
                                font-semibold
                                ${statusClass}
                            `}
                        >
                            {displayValue(status)}
                        </span>
                    </div>
                </div>

                {/* BODY */}
                <div className="space-y-2.5 p-4">
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            Query / Reason
                        </div>

                        <p className="line-clamp-2 break-words text-[12px] font-semibold leading-5 text-foreground">
                            {displayValue(query)}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-xl border border-border/70 bg-background p-3">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
                                <UserRound className="h-3.5 w-3.5" />
                                Employee
                            </div>
                            <p className="truncate text-[11px] font-semibold text-foreground">
                                {displayValue(employeeId)}
                            </p>
                            <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                                {displayValue(employeeName)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-background p-3">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
                                <UserCheck className="h-3.5 w-3.5" />
                                Assigned To
                            </div>
                            <p className="truncate text-[11px] font-semibold text-foreground">
                                {assignedText}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="rounded-xl border border-border/70 bg-background p-2.5">
                            <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase text-muted-foreground">
                                <Clock3 className="h-3.5 w-3.5" />
                                Age
                            </div>
                            <p className="truncate text-[10px] font-semibold">
                                {displayValue(age)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-background p-2.5">
                            <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5" />
                                Department
                            </div>
                            <p className="truncate text-[10px] font-semibold" title={displayValue(department)}>
                                {displayValue(department)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-background p-2.5">
                            <div className="mb-1 text-[8px] font-bold uppercase text-muted-foreground">
                                Function
                            </div>
                            <p className="truncate text-[10px] font-semibold" title={displayValue(functionName)}>
                                {displayValue(functionName)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-xl border border-border/70 bg-background p-2.5">
                            <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase text-muted-foreground">
                                <Smartphone className="h-3.5 w-3.5" />
                                Mobile
                            </div>
                            <p className="truncate text-[10px] font-semibold">
                                {displayValue(mobile)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-background p-2.5">
                            <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                Email
                            </div>
                            <p className="truncate text-[10px] font-semibold" title={displayValue(email)}>
                                {displayValue(email)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-background p-2.5">
                            <div className="mb-1 flex items-center gap-1.5 text-[8px] font-bold uppercase text-muted-foreground">
                                <PackageCheck className="h-3.5 w-3.5" />
                                Requisition
                            </div>
                            <p className="truncate text-[10px] font-semibold">
                                {displayValue(requisition)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-background p-2.5">
                            <div className="mb-1 text-[8px] font-bold uppercase text-muted-foreground">
                                Delivery
                            </div>
                            <p className="truncate text-[10px] font-semibold">
                                {displayValue(delivery)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between gap-4 border-t border-border/70 bg-muted/25 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                            <div className="text-[7px] font-bold uppercase tracking-wide text-muted-foreground">
                                Created
                            </div>
                            <div className="font-mono text-[9px] font-semibold">
                                {created.date}
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-[7px] font-bold uppercase tracking-wide text-muted-foreground">
                            Time
                        </div>
                        <div className="font-mono text-[9px] font-semibold">
                            {created.time}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ============================================================
   DATA TABLE
============================================================ */

export function DataTable<
    TData,
    TValue
>({
    columns,
    data,
    dateColumn = "date",
    compact = false,
    serverSideDateFilter = false,
    itPersonalOptions = [],
    appliedServerFilters,
    emptyMessage =
    "No results found.",
    onApplyServerFilters,
}: DataTableProps<
    TData,
    TValue
>) {
    /* ========================================================
       TABLE STATE
    ======================================================== */

    const [
        sorting,
        setSorting,
    ] =
        React.useState<
            SortingState
        >([]);

    const [
        columnFilters,
        setColumnFilters,
    ] =
        React.useState<
            ColumnFiltersState
        >([]);

    const [
        columnVisibility,
        setColumnVisibility,
    ] =
        React.useState<
            VisibilityState
        >(
            DEFAULT_HIDDEN_COLUMNS
        );

    /* ========================================================
       SEARCH
    ======================================================== */

    const [
        searchInput,
        setSearchInput,
    ] =
        React.useState("");

    const deferredSearch =
        React.useDeferredValue(
            searchInput
        );

    /* ========================================================
       FILTER POPUP
    ======================================================== */

    const [
        filterOpen,
        setFilterOpen,
    ] =
        React.useState(false);

    /* ========================================================
       SERVER FILTER DRAFT
    ======================================================== */

    const [
        fromDate,
        setFromDate,
    ] =
        React.useState(
            appliedServerFilters
                ?.fromDate ??
            ""
        );

    const [
        toDate,
        setToDate,
    ] =
        React.useState(
            appliedServerFilters
                ?.toDate ??
            ""
        );

    const [
        employeeId,
        setEmployeeId,
    ] =
        React.useState(
            appliedServerFilters
                ?.employeeId ??
            ""
        );

    const [
        status,
        setStatus,
    ] =
        React.useState(
            appliedServerFilters
                ?.status ??
            ""
        );

    const [
        itPersonal,
        setItPersonal,
    ] =
        React.useState(
            appliedServerFilters
                ?.itPersonal ??
            ""
        );

    /* ========================================================
       LOCAL APPLIED FILTERS
    ======================================================== */

    const [
        localAppliedFilters,
        setLocalAppliedFilters,
    ] =
        React.useState<
            DataTableServerFilters
        >(
            appliedServerFilters ??
            EMPTY_SERVER_FILTERS
        );

    const appliedFilters =
        appliedServerFilters ??
        localAppliedFilters;


    /* ========================================================
       ROW HOVER PREVIEW STATE
    ======================================================== */

    const tableContainerRef =
        React.useRef<HTMLDivElement | null>(null);

    const [hoveredRow, setHoveredRow] =
        React.useState<TData | null>(null);

    const [hoverPreviewVisible, setHoverPreviewVisible] =
        React.useState(false);

    const [hoverPreviewPosition, setHoverPreviewPosition] =
        React.useState<{
            top: number;
            left: number;
        } | null>(null);

    const hoverShowTimerRef =
        React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const hoverHideTimerRef =
        React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const hoverSequenceRef =
        React.useRef(0);

    const hoverBlockedRef =
        React.useRef(false);

    const clearHoverTimers =
        React.useCallback(() => {
            if (hoverShowTimerRef.current) {
                clearTimeout(
                    hoverShowTimerRef.current
                );
                hoverShowTimerRef.current = null;
            }

            if (hoverHideTimerRef.current) {
                clearTimeout(
                    hoverHideTimerRef.current
                );
                hoverHideTimerRef.current = null;
            }
        }, []);

    const getHoverCenter =
        React.useCallback(() => {
            const padding = 12;
            const container =
                tableContainerRef.current;

            const fallback = {
                top: window.innerHeight / 2,
                left: window.innerWidth / 2,
            };

            if (!container) {
                return fallback;
            }

            const rect =
                container.getBoundingClientRect();

            const visibleLeft = Math.max(
                padding,
                rect.left
            );

            const visibleRight = Math.min(
                window.innerWidth - padding,
                rect.right
            );

            const visibleTop = Math.max(
                padding,
                rect.top
            );

            const visibleBottom = Math.min(
                window.innerHeight - padding,
                rect.bottom
            );

            if (
                visibleRight <= visibleLeft ||
                visibleBottom <= visibleTop
            ) {
                return fallback;
            }

            const cardWidth = Math.min(
                TT_HOVER_CARD_WIDTH,
                window.innerWidth - padding * 2
            );

            const cardHeight = Math.min(
                TT_HOVER_CARD_HEIGHT,
                window.innerHeight - padding * 2
            );

            const rawLeft =
                (visibleLeft + visibleRight) / 2;

            const rawTop =
                (visibleTop + visibleBottom) / 2;

            const minLeft =
                padding + cardWidth / 2;

            const maxLeft = Math.max(
                minLeft,
                window.innerWidth -
                padding -
                cardWidth / 2
            );

            const minTop =
                padding + cardHeight / 2;

            const maxTop = Math.max(
                minTop,
                window.innerHeight -
                padding -
                cardHeight / 2
            );

            return {
                left: Math.min(
                    Math.max(rawLeft, minLeft),
                    maxLeft
                ),
                top: Math.min(
                    Math.max(rawTop, minTop),
                    maxTop
                ),
            };
        }, []);

    const hideHoverPreview =
        React.useCallback(
            (
                blockUntilNextRow = false,
                immediateClear = false
            ) => {
                hoverSequenceRef.current += 1;
                clearHoverTimers();

                if (blockUntilNextRow) {
                    hoverBlockedRef.current = true;
                }

                setHoverPreviewVisible(false);

                if (immediateClear) {
                    setHoveredRow(null);
                    setHoverPreviewPosition(null);
                    return;
                }

                hoverHideTimerRef.current =
                    setTimeout(() => {
                        setHoveredRow(null);
                        setHoverPreviewPosition(null);
                        hoverHideTimerRef.current = null;
                    }, TT_HOVER_CLOSE_DELAY);
            },
            [clearHoverTimers]
        );

    const handleRowMouseEnter =
        React.useCallback(
            (row: TData) => {
                const record =
                    row as Record<string, unknown>;

                if (!isTroubleTicketRecord(record)) {
                    return;
                }

                hoverBlockedRef.current = false;
                hoverSequenceRef.current += 1;

                const sequence =
                    hoverSequenceRef.current;

                clearHoverTimers();

                setHoveredRow(row);
                setHoverPreviewPosition(
                    getHoverCenter()
                );
                setHoverPreviewVisible(false);

                hoverShowTimerRef.current =
                    setTimeout(() => {
                        if (
                            sequence !==
                            hoverSequenceRef.current ||
                            hoverBlockedRef.current
                        ) {
                            return;
                        }

                        setHoverPreviewPosition(
                            getHoverCenter()
                        );
                        setHoverPreviewVisible(true);
                        hoverShowTimerRef.current = null;
                    }, TT_HOVER_OPEN_DELAY);
            },
            [
                clearHoverTimers,
                getHoverCenter,
            ]
        );

    const handleRowMouseLeave =
        React.useCallback(() => {
            hoverBlockedRef.current = false;
            hideHoverPreview(false, false);
        }, [hideHoverPreview]);

    /*
     * Any real interaction wins over hover.
     * Capture phase runs before button/dropdown/modal click handlers,
     * so the preview is already disappearing when the target opens.
     */
    React.useEffect(() => {
        const handlePointerDown = () => {
            hideHoverPreview(true, false);
        };

        const handleKeyDown = () => {
            hideHoverPreview(true, false);
        };

        const handleFocusIn = () => {
            hideHoverPreview(true, false);
        };

        const handleScroll = () => {
            hideHoverPreview(true, true);
        };

        const handleResize = () => {
            hideHoverPreview(true, true);
        };

        document.addEventListener(
            "pointerdown",
            handlePointerDown,
            true
        );

        document.addEventListener(
            "keydown",
            handleKeyDown,
            true
        );

        document.addEventListener(
            "focusin",
            handleFocusIn,
            true
        );

        window.addEventListener(
            "scroll",
            handleScroll,
            true
        );

        window.addEventListener(
            "resize",
            handleResize
        );

        return () => {
            clearHoverTimers();

            document.removeEventListener(
                "pointerdown",
                handlePointerDown,
                true
            );

            document.removeEventListener(
                "keydown",
                handleKeyDown,
                true
            );

            document.removeEventListener(
                "focusin",
                handleFocusIn,
                true
            );

            window.removeEventListener(
                "scroll",
                handleScroll,
                true
            );

            window.removeEventListener(
                "resize",
                handleResize
            );
        };
    }, [
        clearHoverTimers,
        hideHoverPreview,
    ]);

    /* ========================================================
       SYNC PARENT FILTERS
    ======================================================== */

    React.useEffect(
        () => {
            if (
                !appliedServerFilters
            ) {
                return;
            }

            setFromDate(
                appliedServerFilters
                    .fromDate
            );

            setToDate(
                appliedServerFilters
                    .toDate
            );

            setEmployeeId(
                appliedServerFilters
                    .employeeId
            );

            setStatus(
                appliedServerFilters
                    .status
            );

            setItPersonal(
                appliedServerFilters
                    .itPersonal
            );

            setLocalAppliedFilters(
                appliedServerFilters
            );
        },
        [
            appliedServerFilters,
        ]
    );

    /* ========================================================
       LOCAL FILTERING
    ======================================================== */

    const filteredData =
        React.useMemo(
            () => {
                const searchText =
                    deferredSearch
                        .trim()
                        .toLowerCase();

                return data.filter(
                    (
                        row: TData
                    ) => {
                        const record =
                            row as Record<
                                string,
                                unknown
                            >;

                        const matchesSearch =
                            !searchText ||
                            Object.values(
                                record
                            ).some(
                                (
                                    value
                                ) =>
                                    normalizeValue(
                                        value
                                    ).includes(
                                        searchText
                                    )
                            );

                        /*
                         * Server mode:
                         *
                         * PostgreSQL handles
                         * server filters.
                         */
                        if (
                            serverSideDateFilter
                        ) {
                            return matchesSearch;
                        }

                        let matchesDate =
                            true;

                        if (
                            fromDate ||
                            toDate
                        ) {
                            const rowDate =
                                normalizeDateOnly(
                                    record[
                                    dateColumn
                                    ]
                                );

                            if (!rowDate) {
                                matchesDate =
                                    false;
                            } else {
                                if (
                                    fromDate &&
                                    rowDate <
                                    fromDate
                                ) {
                                    matchesDate =
                                        false;
                                }

                                if (
                                    toDate &&
                                    rowDate >
                                    toDate
                                ) {
                                    matchesDate =
                                        false;
                                }
                            }
                        }

                        return (
                            matchesSearch &&
                            matchesDate
                        );
                    }
                );
            },
            [
                data,
                deferredSearch,
                fromDate,
                toDate,
                dateColumn,
                serverSideDateFilter,
            ]
        );

    /* ========================================================
       TANSTACK TABLE
    ======================================================== */

    const table =
        useReactTable({
            data: filteredData,
            columns,

            state: {
                sorting,
                columnFilters,
                columnVisibility,
            },

            onSortingChange:
                setSorting,

            onColumnFiltersChange:
                setColumnFilters,

            onColumnVisibilityChange:
                setColumnVisibility,

            getCoreRowModel:
                getCoreRowModel(),

            getFilteredRowModel:
                getFilteredRowModel(),

            getPaginationRowModel:
                getPaginationRowModel(),

            getSortedRowModel:
                getSortedRowModel(),
        });

    /* ========================================================
       RESET PAGE ON SEARCH / DATA CHANGE
    ======================================================== */

    React.useEffect(
        () => {
            table.setPageIndex(
                0
            );
        },
        [
            deferredSearch,
            data,
            table,
        ]
    );

    /* ========================================================
       COLUMN REFERENCES
    ======================================================== */

    const statusColumn =
        table
            .getAllColumns()
            .find(
                (
                    column
                ) =>
                    column.id ===
                    "status"
            );

    /* ========================================================
       FILTER COUNTS
    ======================================================== */

    const serverActiveFiltersCount =
        (
            searchInput.trim()
                ? 1
                : 0
        ) +
        (
            appliedFilters.fromDate
                ? 1
                : 0
        ) +
        (
            appliedFilters.toDate
                ? 1
                : 0
        ) +
        (
            appliedFilters.employeeId
                ? 1
                : 0
        ) +
        (
            appliedFilters.itPersonal
                ? 1
                : 0
        ) +
        (
            appliedFilters.status
                ? 1
                : 0
        );

    const localActiveFiltersCount =
        (
            searchInput.trim()
                ? 1
                : 0
        ) +
        columnFilters.length +
        (
            fromDate ||
                toDate
                ? 1
                : 0
        );

    const activeFiltersCount =
        serverSideDateFilter
            ? serverActiveFiltersCount
            : localActiveFiltersCount;

    /* ========================================================
       APPLY SERVER FILTERS
    ======================================================== */

    function updateAppliedFilters(
        next: DataTableServerFilters
    ) {
        setLocalAppliedFilters(
            next
        );

        onApplyServerFilters?.(
            next
        );

        table.setPageIndex(
            0
        );
    }

    function applyFilters() {
        if (
            !serverSideDateFilter
        ) {
            setFilterOpen(
                false
            );

            return;
        }

        const next:
            DataTableServerFilters =
        {
            fromDate:
                fromDate.trim(),

            toDate:
                toDate.trim(),

            employeeId:
                employeeId.trim(),

            status:
                status.trim(),

            itPersonal:
                itPersonal.trim(),
        };

        updateAppliedFilters(
            next
        );

        setFilterOpen(false);
    }

    /* ========================================================
       RESET FILTERS
    ======================================================== */

    function resetFilters() {
        setSearchInput("");

        setColumnFilters([]);

        setFromDate("");
        setToDate("");
        setEmployeeId("");
        setStatus("");
        setItPersonal("");

        const emptyFilters =
            EMPTY_SERVER_FILTERS;

        setLocalAppliedFilters(
            emptyFilters
        );

        if (
            serverSideDateFilter
        ) {
            onApplyServerFilters?.(
                emptyFilters
            );
        }

        table.setPageIndex(
            0
        );

        setFilterOpen(false);
    }

    /* ========================================================
       EXCEL EXPORT
    ======================================================== */

    function exportToExcel() {
        const visibleColumns =
            table
                .getVisibleLeafColumns()
                .filter(
                    (
                        column
                    ) =>
                        column.id !==
                        "actions" &&
                        column.id !==
                        "action"
                );

        const exportRows =
            filteredData.map(
                (
                    row
                ) => {
                    const record =
                        row as Record<
                            string,
                            unknown
                        >;

                    const output:
                        Record<
                            string,
                            string | number
                        > = {};

                    visibleColumns.forEach(
                        (
                            column
                        ) => {
                            const header =
                                column
                                    .columnDef
                                    .header;

                            const label =
                                typeof header ===
                                    "string"
                                    ? header
                                    : getColumnDisplayName(
                                        column.id
                                    );

                            output[
                                label
                            ] =
                                exportCellValue(
                                    record[
                                    column.id
                                    ]
                                );
                        }
                    );

                    return output;
                }
            );

        const worksheet =
            XLSX.utils.json_to_sheet(
                exportRows
            );

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Data"
        );

        XLSX.writeFile(
            workbook,
            "itm-data.xlsx"
        );
    }

    /* ========================================================
       VISIBLE COLUMN COUNT
    ======================================================== */

    const visibleColumnCount =
        Math.max(
            table
                .getVisibleLeafColumns()
                .length,
            1
        );

    /* ========================================================
       STYLES
    ======================================================== */

    const toolbarButtonClass =
        compact
            ? "h-8 px-2.5 text-[10px]"
            : "h-9 px-3 text-xs";

    const toolbarIconClass =
        compact
            ? "mr-1.5 h-3.5 w-3.5"
            : "mr-2 h-4 w-4";

    const searchHeight =
        compact
            ? "h-8"
            : "h-9";

    const searchText =
        compact
            ? "text-[10px]"
            : "text-xs";

    const badgeClass =
        compact
            ? "h-6 gap-1 px-2 text-[9px]"
            : "h-7 gap-1 px-2 text-[10px]";

    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <div className="w-full min-w-0 space-y-2.5">

            {/* ==================================================
                TOOLBAR
            ================================================== */}

            <div
                className="
                    flex
                    w-full
                    min-w-0
                    items-center
                    gap-2
                "
            >
                {/* SEARCH */}

                <div
                    className="
                        relative
                        min-w-0
                        flex-1
                    "
                >
                    <Search
                        className="
                            pointer-events-none
                            absolute
                            left-2.5
                            top-1/2
                            h-3.5
                            w-3.5
                            -translate-y-1/2
                            text-muted-foreground
                        "
                    />

                    <Input
                        value={
                            searchInput
                        }
                        onChange={(
                            event
                        ) =>
                            setSearchInput(
                                event
                                    .target
                                    .value
                            )
                        }
                        placeholder="Search TT, employee, query, status..."
                        className={`
                            w-full
                            ${searchHeight}
                            ${searchText}
                            pl-8
                            pr-8
                        `}
                    />

                    {searchInput && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearchInput(
                                    ""
                                )
                            }
                            className="
                                absolute
                                right-2
                                top-1/2
                                flex
                                h-5
                                w-5
                                -translate-y-1/2
                                items-center
                                justify-center
                                rounded-full
                                text-muted-foreground
                                transition-colors
                                hover:bg-muted
                                hover:text-foreground
                            "
                            aria-label="Clear search"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* FILTER */}

                <DropdownMenu
                    open={
                        filterOpen
                    }
                    onOpenChange={
                        setFilterOpen
                    }
                >
                    <DropdownMenuTrigger
                        asChild
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className={`
                                shrink-0
                                border-emerald-300
                                bg-emerald-50
                                text-emerald-700
                                hover:bg-emerald-100
                                ${toolbarButtonClass}
                            `}
                        >
                            <Filter
                                className={
                                    toolbarIconClass
                                }
                            />

                            Filter

                            {activeFiltersCount >
                                0 && (
                                    <span
                                        className="
                                        ml-1
                                        inline-flex
                                        h-4
                                        min-w-4
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-emerald-600
                                        px-1
                                        text-[8px]
                                        font-bold
                                        text-white
                                    "
                                    >
                                        {
                                            activeFiltersCount
                                        }
                                    </span>
                                )}
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="start"
                        sideOffset={6}
                        className="
                            w-[310px]
                            max-w-[calc(100vw-24px)]
                            p-3
                        "
                    >
                        <DropdownMenuLabel
                            className="
                                px-0
                                pb-2
                                text-xs
                                font-semibold
                            "
                        >
                            Trouble Ticket Filters
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <div className="space-y-3 pt-3">

                            {/* DATE */}

                            <div
                                className="
                                    grid
                                    grid-cols-2
                                    gap-2
                                "
                            >
                                <div className="space-y-1">
                                    <label
                                        className="
                                            text-[9px]
                                            font-semibold
                                            text-muted-foreground
                                        "
                                    >
                                        From Date
                                    </label>

                                    <Input
                                        type="date"
                                        value={
                                            fromDate
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setFromDate(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="
                                            h-8
                                            text-[10px]
                                        "
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label
                                        className="
                                            text-[9px]
                                            font-semibold
                                            text-muted-foreground
                                        "
                                    >
                                        To Date
                                    </label>

                                    <Input
                                        type="date"
                                        value={
                                            toDate
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setToDate(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="
                                            h-8
                                            text-[10px]
                                        "
                                    />
                                </div>
                            </div>

                            {/* EMPLOYEE */}

                            <div className="space-y-1">
                                <label
                                    className="
                                        text-[9px]
                                        font-semibold
                                        text-muted-foreground
                                    "
                                >
                                    Employee ID
                                </label>

                                <Input
                                    value={
                                        employeeId
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setEmployeeId(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="e.g. 02-0407"
                                    className="
                                        h-8
                                        text-[10px]
                                    "
                                />
                            </div>

                            {/* IT PERSONNEL */}

                            {itPersonalOptions.length >
                                0 && (
                                    <div className="space-y-1">
                                        <label
                                            className="
                                            text-[9px]
                                            font-semibold
                                            text-muted-foreground
                                        "
                                        >
                                            Assigned IT Personnel
                                        </label>

                                        <select
                                            value={
                                                itPersonal
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setItPersonal(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            className="
                                            h-8
                                            w-full
                                            rounded-md
                                            border
                                            border-input
                                            bg-background
                                            px-2
                                            text-[10px]
                                            outline-none
                                            focus:ring-2
                                            focus:ring-ring
                                        "
                                        >
                                            <option value="">
                                                All IT Personnel
                                            </option>

                                            {itPersonalOptions.map(
                                                (
                                                    option
                                                ) => (
                                                    <option
                                                        key={
                                                            option.value
                                                        }
                                                        value={
                                                            option.value
                                                        }
                                                    >
                                                        {
                                                            option.label
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>
                                )}

                            {/* STATUS */}

                            {statusColumn && (
                                <div className="space-y-1">
                                    <label
                                        className="
                                            text-[9px]
                                            font-semibold
                                            text-muted-foreground
                                        "
                                    >
                                        Status
                                    </label>

                                    <select
                                        value={
                                            status
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setStatus(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="
                                            h-8
                                            w-full
                                            rounded-md
                                            border
                                            border-input
                                            bg-background
                                            px-2
                                            text-[10px]
                                            outline-none
                                            focus:ring-2
                                            focus:ring-ring
                                        "
                                    >
                                        <option value="">
                                            All Status
                                        </option>

                                        <option value="Open">
                                            Open
                                        </option>

                                        <option value="Closed">
                                            Closed
                                        </option>
                                    </select>
                                </div>
                            )}

                            {/* BUTTONS */}

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-2
                                    border-t
                                    pt-3
                                "
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={
                                        resetFilters
                                    }
                                    className="
                                        h-8
                                        px-2
                                        text-[10px]
                                        text-destructive
                                        hover:bg-destructive/10
                                    "
                                >
                                    <X className="mr-1 h-3 w-3" />

                                    Clear
                                </Button>

                                <Button
                                    type="button"
                                    onClick={
                                        applyFilters
                                    }
                                    className="
                                        h-8
                                        px-3
                                        text-[10px]
                                    "
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* RIGHT ACTIONS */}

                <div
                    className="
                        ml-auto
                        flex
                        shrink-0
                        items-center
                        gap-1.5
                    "
                >
                    {/* COLUMNS */}

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            asChild
                        >
                            <Button
                                type="button"
                                variant="outline"
                                className={
                                    toolbarButtonClass
                                }
                            >
                                <SlidersHorizontal
                                    className={
                                        toolbarIconClass
                                    }
                                />

                                Columns
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="
                                max-h-[420px]
                                w-64
                                overflow-y-auto
                            "
                        >
                            <DropdownMenuLabel
                                className={
                                    compact
                                        ? "text-[10px]"
                                        : "text-xs"
                                }
                            >
                                Show / Hide Columns
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <div className="py-1">
                                {table
                                    .getAllColumns()
                                    .filter(
                                        (
                                            column
                                        ) =>
                                            column.getCanHide()
                                    )
                                    .map(
                                        (
                                            column
                                        ) => {
                                            const header =
                                                column
                                                    .columnDef
                                                    .header;

                                            const label =
                                                typeof header ===
                                                    "string"
                                                    ? header
                                                    : getColumnDisplayName(
                                                        column.id
                                                    );

                                            const visible =
                                                column.getIsVisible();

                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={
                                                        column.id
                                                    }
                                                    checked={
                                                        visible
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        column.toggleVisibility(
                                                            Boolean(
                                                                checked
                                                            )
                                                        )
                                                    }
                                                    className="text-[10px]"
                                                >
                                                    <span className="mr-2">
                                                        {visible ? (
                                                            <Eye className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <EyeOff className="h-3.5 w-3.5" />
                                                        )}
                                                    </span>

                                                    {
                                                        label
                                                    }
                                                </DropdownMenuCheckboxItem>
                                            );
                                        }
                                    )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* EXCEL */}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={
                            exportToExcel
                        }
                        className={
                            toolbarButtonClass
                        }
                    >
                        <Download
                            className={
                                toolbarIconClass
                            }
                        />

                        Excel
                    </Button>
                </div>
            </div>

            {/* ==================================================
                ACTIVE FILTERS
            ================================================== */}

            {activeFiltersCount >
                0 && (
                    <div
                        className="
                        flex
                        min-w-0
                        flex-wrap
                        items-center
                        gap-1.5
                    "
                    >
                        {searchInput.trim() && (
                            <Badge
                                variant="outline"
                                className={
                                    badgeClass
                                }
                            >
                                <span className="font-semibold text-primary">
                                    Search:
                                </span>

                                <span
                                    className="
                                    max-w-[220px]
                                    truncate
                                    font-medium
                                "
                                    title={
                                        searchInput
                                    }
                                >
                                    {
                                        searchInput
                                    }
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearchInput(
                                            ""
                                        )
                                    }
                                    className="
                                    ml-0.5
                                    inline-flex
                                    h-4
                                    w-4
                                    items-center
                                    justify-center
                                    rounded-full
                                    text-muted-foreground
                                    hover:bg-destructive/10
                                    hover:text-destructive
                                "
                                    aria-label="Clear search"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}

                        {serverSideDateFilter ? (
                            <>
                                {appliedFilters.employeeId && (
                                    <Badge
                                        variant="outline"
                                        className={
                                            badgeClass
                                        }
                                    >
                                        <span className="font-semibold text-primary">
                                            Employee:
                                        </span>

                                        <span>
                                            {
                                                appliedFilters.employeeId
                                            }
                                        </span>
                                    </Badge>
                                )}

                                {appliedFilters.itPersonal && (
                                    <Badge
                                        variant="outline"
                                        className={
                                            badgeClass
                                        }
                                    >
                                        <span className="font-semibold text-primary">
                                            Assigned:
                                        </span>

                                        <span>
                                            {
                                                appliedFilters.itPersonal
                                            }
                                        </span>
                                    </Badge>
                                )}

                                {appliedFilters.status && (
                                    <Badge
                                        variant="outline"
                                        className={
                                            badgeClass
                                        }
                                    >
                                        <span className="font-semibold text-primary">
                                            Status:
                                        </span>

                                        <span>
                                            {
                                                appliedFilters.status
                                            }
                                        </span>
                                    </Badge>
                                )}

                                {(
                                    appliedFilters.fromDate ||
                                    appliedFilters.toDate
                                ) && (
                                        <Badge
                                            variant="outline"
                                            className={
                                                badgeClass
                                            }
                                        >
                                            <span className="font-semibold text-primary">
                                                Date:
                                            </span>

                                            <span>
                                                {
                                                    appliedFilters.fromDate ||
                                                    "Start"
                                                }

                                                {" — "}

                                                {
                                                    appliedFilters.toDate ||
                                                    "Now"
                                                }
                                            </span>
                                        </Badge>
                                    )}
                            </>
                        ) : (
                            <>
                                {columnFilters.map(
                                    (
                                        filter
                                    ) => (
                                        <Badge
                                            key={
                                                filter.id
                                            }
                                            variant="outline"
                                            className={
                                                badgeClass
                                            }
                                        >
                                            <span className="font-semibold text-primary">
                                                {getColumnDisplayName(
                                                    filter.id
                                                )}
                                                :
                                            </span>

                                            <span>
                                                {String(
                                                    filter.value
                                                )}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setColumnFilters(
                                                        (
                                                            current
                                                        ) =>
                                                            current.filter(
                                                                (
                                                                    item
                                                                ) =>
                                                                    item.id !==
                                                                    filter.id
                                                            )
                                                    )
                                                }
                                                className="
                                                ml-0.5
                                                inline-flex
                                                h-4
                                                w-4
                                                items-center
                                                justify-center
                                                rounded-full
                                                text-muted-foreground
                                                hover:bg-destructive/10
                                                hover:text-destructive
                                            "
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )
                                )}

                                {(
                                    fromDate ||
                                    toDate
                                ) && (
                                        <Badge
                                            variant="outline"
                                            className={
                                                badgeClass
                                            }
                                        >
                                            <span className="font-semibold text-primary">
                                                Date:
                                            </span>

                                            <span>
                                                {
                                                    fromDate ||
                                                    "Start"
                                                }

                                                {" — "}

                                                {
                                                    toDate ||
                                                    "Now"
                                                }
                                            </span>
                                        </Badge>
                                    )}
                            </>
                        )}

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={
                                resetFilters
                            }
                            className="
                            h-7
                            shrink-0
                            px-2.5
                            text-[10px]
                            font-semibold
                            text-destructive
                            hover:bg-destructive/10
                            hover:text-destructive
                        "
                        >
                            <X className="mr-1 h-3.5 w-3.5" />

                            Clear all
                        </Button>
                    </div>
                )}

            {/* ==================================================
                TABLE
            ================================================== */}

            <div
                ref={tableContainerRef}
                className={`
                    relative
                    w-full
                    min-w-0
                    overflow-hidden
                    border
                    border-border
                    bg-card

                    ${compact
                        ? "rounded-lg"
                        : "rounded-xl"
                    }
                `}
            >
                <Table
                    className={`
                        w-full
                        table-fixed
                        border-collapse
                        ${compact
                            ? "text-[9px]"
                            : "text-[10px]"
                        }
                    `}
                >
                    <TableHeader>
                        {table
                            .getHeaderGroups()
                            .map(
                                (
                                    headerGroup
                                ) => (
                                    <TableRow
                                        key={
                                            headerGroup.id
                                        }
                                        className="
                                            hover:bg-transparent
                                        "
                                    >
                                        {headerGroup.headers.map(
                                            (
                                                header
                                            ) => {
                                                const width =
                                                    getColumnWidth(
                                                        header
                                                            .column
                                                            .id
                                                    );

                                                return (
                                                    <TableHead
                                                        key={
                                                            header.id
                                                        }
                                                        className={`
                                                            overflow-hidden
                                                            border-b
                                                            bg-muted/60
                                                            text-center
                                                            font-semibold
                                                            uppercase
                                                            tracking-wide
                                                            text-muted-foreground

                                                            ${compact
                                                                ? "h-8 px-1 py-1 text-[8px]"
                                                                : "px-2 py-2 text-[9px]"
                                                            }
                                                        `}
                                                        style={{
                                                            width,
                                                        }}
                                                    >
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header
                                                                    .column
                                                                    .columnDef
                                                                    .header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                );
                                            }
                                        )}
                                    </TableRow>
                                )
                            )}
                    </TableHeader>

                    <TableBody>
                        {table
                            .getRowModel()
                            .rows.length ? (
                            table
                                .getRowModel()
                                .rows
                                .map(
                                    (
                                        row
                                    ) => {
                                        const record =
                                            row.original as Record<
                                                string,
                                                unknown
                                            >;

                                        return (
                                            <TableRow
                                                key={
                                                    row.id
                                                }
                                                onMouseEnter={() =>
                                                    handleRowMouseEnter(
                                                        row.original
                                                    )
                                                }
                                                onMouseLeave={
                                                    handleRowMouseLeave
                                                }
                                                onMouseDownCapture={() =>
                                                    hideHoverPreview(
                                                        true,
                                                        false
                                                    )
                                                }
                                                onFocusCapture={() =>
                                                    hideHoverPreview(
                                                        true,
                                                        false
                                                    )
                                                }
                                                className={`
                                                    group
                                                    relative
                                                    border-b
                                                    border-border/70
                                                    transition-all
                                                    duration-200
                                                    ease-out

                                                    hover:bg-primary/[0.045]
                                                    hover:shadow-[inset_3px_0_0_hsl(var(--primary)/0.65)]
                                                    hover:relative
                                                    hover:z-10

                                                    ${compact
                                                        ? "h-8"
                                                        : ""
                                                    }
                                                `}
                                            >
                                                {row
                                                    .getVisibleCells()
                                                    .map(
                                                        (
                                                            cell
                                                        ) => {
                                                            const width =
                                                                getColumnWidth(
                                                                    cell
                                                                        .column
                                                                        .id
                                                                );

                                                            const columnId =
                                                                cell
                                                                    .column
                                                                    .id;

                                                            const isAction =
                                                                columnId ===
                                                                "action" ||
                                                                columnId ===
                                                                "actions";

                                                            const isCreated =
                                                                columnId ===
                                                                "created_at";

                                                            const isQuery =
                                                                columnId ===
                                                                "query_type" ||
                                                                columnId ===
                                                                "query";

                                                            const rawValue =
                                                                record[
                                                                columnId
                                                                ];

                                                            return (
                                                                <TableCell
                                                                    key={
                                                                        cell.id
                                                                    }
                                                                    className={`
                                                                        overflow-hidden
                                                                        text-center
                                                                        align-middle

                                                                        ${compact
                                                                            ? "h-8 px-1 py-[3px] text-[9px]"
                                                                            : "px-2 py-2 text-[10px]"
                                                                        }

                                                                        ${columnId ===
                                                                            "tt_no"
                                                                            ? "font-semibold text-primary"
                                                                            : ""
                                                                        }

                                                                        ${isAction
                                                                            ? "relative z-30"
                                                                            : ""
                                                                        }
                                                                    `}
                                                                    style={{
                                                                        width,
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="
                                                                            min-w-0
                                                                            max-w-full
                                                                            overflow-hidden
                                                                        "
                                                                    >
                                                                        {isCreated ? (
                                                                            (() => {
                                                                                const created =
                                                                                    formatCreatedDateTime(
                                                                                        rawValue
                                                                                    );

                                                                                return (
                                                                                    <div
                                                                                        className="
                                                                                            flex
                                                                                            min-w-0
                                                                                            flex-col
                                                                                            items-center
                                                                                            justify-center
                                                                                            leading-tight
                                                                                        "
                                                                                        title={`${created.date} ${created.time}`}
                                                                                    >
                                                                                        <span
                                                                                            className="
                                                                                                whitespace-nowrap
                                                                                                font-medium
                                                                                                text-foreground
                                                                                            "
                                                                                        >
                                                                                            {
                                                                                                created.date
                                                                                            }
                                                                                        </span>

                                                                                        <span
                                                                                            className="
                                                                                                mt-0.5
                                                                                                whitespace-nowrap
                                                                                                font-mono
                                                                                                text-[10px]
                                                                                                font-medium
                                                                                                text-muted-foreground
                                                                                            "
                                                                                        >
                                                                                            {
                                                                                                created.time
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                );
                                                                            })()
                                                                        ) : isQuery ? (
                                                                            <div
                                                                                className="
                                                                                    mx-auto
                                                                                    min-w-0
                                                                                    max-w-full
                                                                                    truncate
                                                                                    px-1
                                                                                "
                                                                                title={
                                                                                    rawValue !==
                                                                                        null &&
                                                                                        rawValue !==
                                                                                        undefined
                                                                                        ? String(
                                                                                            rawValue
                                                                                        )
                                                                                        : undefined
                                                                                }
                                                                            >
                                                                                {flexRender(
                                                                                    cell
                                                                                        .column
                                                                                        .columnDef
                                                                                        .cell,
                                                                                    cell.getContext()
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            flexRender(
                                                                                cell
                                                                                    .column
                                                                                    .columnDef
                                                                                    .cell,
                                                                                cell.getContext()
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            );
                                                        }
                                                    )}
                                            </TableRow>
                                        );
                                    }
                                )
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        visibleColumnCount
                                    }
                                    className={
                                        compact
                                            ? "h-24 text-center text-[10px] font-medium text-muted-foreground"
                                            : "h-32 text-center text-sm font-medium text-muted-foreground"
                                    }
                                >
                                    {
                                        emptyMessage
                                    }
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <TroubleTicketHoverPreview
                    record={
                        hoveredRow
                            ? (hoveredRow as Record<
                                string,
                                unknown
                            >)
                            : null
                    }
                    visible={
                        hoverPreviewVisible
                    }
                    position={
                        hoverPreviewPosition
                    }
                />

            </div>

            {/* ==================================================
                PAGINATION
            ================================================== */}

            <div
                className={`
                    flex
                    items-center
                    justify-between
                    gap-3

                    ${compact
                        ? "px-0.5"
                        : "px-1"
                    }
                `}
            >
                <p
                    className={
                        compact
                            ? "text-[10px] text-muted-foreground"
                            : "text-xs text-muted-foreground"
                    }
                >
                    Page{" "}

                    <span className="font-medium text-foreground">
                        {table
                            .getState()
                            .pagination
                            .pageIndex +
                            1}
                    </span>

                    {" "}

                    of{" "}

                    <span className="font-medium text-foreground">
                        {Math.max(
                            table.getPageCount(),
                            1
                        )}
                    </span>
                </p>

                <div
                    className={
                        compact
                            ? "flex items-center gap-1.5"
                            : "flex items-center gap-2"
                    }
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            table.previousPage()
                        }
                        disabled={
                            !table.getCanPreviousPage()
                        }
                        className={
                            compact
                                ? "h-7 px-2.5 text-[10px]"
                                : "h-8 text-xs"
                        }
                    >
                        Previous
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            table.nextPage()
                        }
                        disabled={
                            !table.getCanNextPage()
                        }
                        className={
                            compact
                                ? "h-7 px-2.5 text-[10px]"
                                : "h-8 text-xs"
                        }
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}