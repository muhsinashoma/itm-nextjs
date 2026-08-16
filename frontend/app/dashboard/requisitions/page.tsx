// //frontend/app/dashboard/requisitions/page.tsx
// "use client";

// import {
//     Suspense,
//     useDeferredValue,
//     useEffect,
//     useMemo,
//     useState,
// } from "react";

// import {
//     useRouter,
//     useSearchParams,
// } from "next/navigation";

// import {
//     AlertCircle,
//     ArrowLeft,
//     ChevronLeft,
//     ChevronRight,
//     Eye,
//     Filter,
//     LoaderCircle,
//     RefreshCcw,
//     Search,
//     X,
// } from "lucide-react";

// import {
//     Button,
// } from "@/components/ui/button";

// import {
//     dashboardApi,
//     type RequisitionCategorySummary,
//     type RequisitionDashboardSummary,
//     type RequisitionItem,
// } from "@/lib/api";

// /* ======================================================
//    TYPES
// ====================================================== */

// type RequisitionView =
//     | "summary"
//     | "pending"
//     | "rejected";

// type RequisitionListView =
//     | "pending"
//     | "rejected";

// type DateFilters = {
//     fromDate: string;
//     toDate: string;
// };

// /* ======================================================
//    CONSTANTS
// ====================================================== */

// const VALID_VIEWS:
//     RequisitionView[] = [
//         "summary",
//         "pending",
//         "rejected",
//     ];

// const PAGE_SIZE = 10;

// const EMPTY_DASHBOARD_SUMMARY:
//     RequisitionDashboardSummary = {
//     pending_categories: 0,
//     approval_pending: 0,
//     rejected: 0,
//     approved: 0,
//     total_active: 0,
// };

// const VIEW_CONFIG: Record<
//     RequisitionView,
//     {
//         title: string;
//         description: string;
//         emptyTitle: string;
//         emptyDescription: string;
//     }
// > = {
//     summary: {
//         title:
//             "Requisition Summary",

//         description:
//             "IT Accessories pending requisition summary by category",

//         emptyTitle:
//             "No Pending Requisitions",

//         emptyDescription:
//             "There are currently no IT accessories requisitions waiting for approval.",
//     },

//     pending: {
//         title:
//             "Approval Pending",

//         description:
//             "IT Accessories requisitions currently waiting for approval",

//         emptyTitle:
//             "No Approval Pending Requisitions",

//         emptyDescription:
//             "There are currently no requisitions waiting for approval.",
//     },

//     rejected: {
//         title:
//             "Rejected Requisitions",

//         description:
//             "IT Accessories requisitions rejected during the approval workflow",

//         emptyTitle:
//             "No Rejected Requisitions",

//         emptyDescription:
//             "There are currently no rejected requisitions.",
//     },
// };

// const VIEW_OPTIONS: {
//     view: RequisitionView;
//     label: string;
// }[] = [
//         {
//             view:
//                 "summary",

//             label:
//                 "Requisition Summary",
//         },

//         {
//             view:
//                 "pending",

//             label:
//                 "Approval Pending",
//         },

//         {
//             view:
//                 "rejected",

//             label:
//                 "Rejected",
//         },
//     ];

// /* ======================================================
//    DATE HELPERS
// ====================================================== */

// function normalizeDateValue(
//     value: string
// ) {
//     if (!value) {
//         return "";
//     }

//     let normalized =
//         value.trim();

//     if (
//         normalized.includes(
//             " "
//         ) &&
//         !normalized.includes(
//             "T"
//         )
//     ) {
//         normalized =
//             normalized.replace(
//                 " ",
//                 "T"
//             );
//     }

//     normalized =
//         normalized.replace(
//             /([+-]\d{2})$/,
//             "$1:00"
//         );

//     return normalized;
// }

// function formatDateTime(
//     value: string
// ) {
//     if (!value) {
//         return "—";
//     }

//     const normalized =
//         normalizeDateValue(
//             value
//         );

//     const date =
//         new Date(
//             normalized
//         );

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
//             day:
//                 "2-digit",

//             month:
//                 "short",

//             year:
//                 "numeric",

//             hour:
//                 "2-digit",

//             minute:
//                 "2-digit",

//             hour12:
//                 true,
//         }
//     ).format(
//         date
//     );
// }

// /* ======================================================
//    APPROVAL BADGE
// ====================================================== */

// function ApprovalBadge({
//     item,
// }: {
//     item:
//     RequisitionItem;
// }) {
//     if (
//         item.approved_val ===
//         2
//     ) {
//         return (
//             <span className="inline-flex whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
//                 Rejected
//             </span>
//         );
//     }

//     if (
//         item.approved_val ===
//         1
//     ) {
//         return (
//             <span className="inline-flex whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
//                 Petty Cash
//             </span>
//         );
//     }

//     if (
//         item.approved_val ===
//         3
//     ) {
//         return (
//             <span className="inline-flex whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-400">
//                 PR Approved
//             </span>
//         );
//     }

//     return (
//         <span className="inline-flex whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
//             Approval Pending
//         </span>
//     );
// }

// /* ======================================================
//    DELIVERY BADGE
// ====================================================== */

// function DeliveryBadge({
//     item,
// }: {
//     item:
//     RequisitionItem;
// }) {
//     if (
//         item.delivered_val ===
//         1
//     ) {
//         return (
//             <span className="inline-flex whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
//                 Delivered
//             </span>
//         );
//     }

//     if (
//         item.delivered_val ===
//         2
//     ) {
//         return (
//             <span className="inline-flex whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
//                 Rejected
//             </span>
//         );
//     }

//     return (
//         <span className="inline-flex whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
//             Pending
//         </span>
//     );
// }

// /* ======================================================
//    DETAIL FIELD
// ====================================================== */

// function DetailField({
//     label,
//     value,
// }: {
//     label: string;

//     value:
//     | string
//     | number
//     | null
//     | undefined;
// }) {
//     const displayValue =
//         value === null ||
//             value === undefined ||
//             value === ""
//             ? "—"
//             : String(
//                 value
//             );

//     return (
//         <div className="rounded-lg border border-border bg-muted/20 p-3">
//             <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                 {label}
//             </p>

//             <p className="mt-1 break-words text-xs font-medium text-foreground">
//                 {
//                     displayValue
//                 }
//             </p>
//         </div>
//     );
// }

// /* ======================================================
//    DETAILS MODAL
// ====================================================== */

// function RequisitionDetailsModal({
//     item,
//     onClose,
// }: {
//     item:
//     | RequisitionItem
//     | null;

//     onClose:
//     () => void;
// }) {
//     if (!item) {
//         return null;
//     }

//     return (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
//             <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
//                 {/* Header */}

//                 <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
//                     <div>
//                         <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
//                             IT Accessories Requisition
//                         </p>

//                         <h2 className="mt-1 text-base font-semibold text-foreground">
//                             {
//                                 item.tt_no
//                             }
//                         </h2>

//                         <p className="mt-1 text-xs text-muted-foreground">
//                             Complete requisition information
//                         </p>
//                     </div>

//                     <button
//                         type="button"
//                         aria-label="Close"
//                         onClick={
//                             onClose
//                         }
//                         className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
//                     >
//                         <X className="h-4 w-4" />
//                     </button>
//                 </div>

//                 {/* Body */}

//                 <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-5">
//                     <div className="mb-5 flex flex-wrap gap-2">
//                         <ApprovalBadge
//                             item={
//                                 item
//                             }
//                         />

//                         <DeliveryBadge
//                             item={
//                                 item
//                             }
//                         />
//                     </div>

//                     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                         <DetailField
//                             label="TT No"
//                             value={
//                                 item.tt_no
//                             }
//                         />

//                         <DetailField
//                             label="Category"
//                             value={
//                                 item.category
//                             }
//                         />

//                         <DetailField
//                             label="Device Serial"
//                             value={
//                                 item.device_sl_no
//                             }
//                         />

//                         <DetailField
//                             label="Employee ID"
//                             value={
//                                 item.employee_id
//                             }
//                         />

//                         <DetailField
//                             label="Employee Name"
//                             value={
//                                 item.employee_name
//                             }
//                         />

//                         <DetailField
//                             label="Submitted Date"
//                             value={
//                                 formatDateTime(
//                                     item.created_at
//                                 )
//                             }
//                         />

//                         <DetailField
//                             label="Raised By ID"
//                             value={
//                                 item.created_by
//                             }
//                         />

//                         <DetailField
//                             label="Raised By"
//                             value={
//                                 item.created_by_name
//                             }
//                         />

//                         <DetailField
//                             label="Approval Status"
//                             value={
//                                 item.approval_status
//                             }
//                         />

//                         <DetailField
//                             label="Approved / Rejected By ID"
//                             value={
//                                 item.approved_by
//                             }
//                         />

//                         <DetailField
//                             label="Approved / Rejected By"
//                             value={
//                                 item.approved_by_name
//                             }
//                         />

//                         <DetailField
//                             label="Approval Date"
//                             value={
//                                 formatDateTime(
//                                     item.approved_date
//                                 )
//                             }
//                         />

//                         <DetailField
//                             label="Delivery Status"
//                             value={
//                                 item.delivery_status
//                             }
//                         />

//                         <DetailField
//                             label="Delivered By ID"
//                             value={
//                                 item.delivered_by
//                             }
//                         />

//                         <DetailField
//                             label="Delivered By"
//                             value={
//                                 item.delivered_by_name
//                             }
//                         />

//                         <DetailField
//                             label="Delivered Date"
//                             value={
//                                 formatDateTime(
//                                     item.delivered_date
//                                 )
//                             }
//                         />

//                         <DetailField
//                             label="Device Assigned"
//                             value={
//                                 item.device_assigned_val ===
//                                     1
//                                     ? "Yes"
//                                     : "No"
//                             }
//                         />

//                         <DetailField
//                             label="Device Assigned By"
//                             value={
//                                 item.device_assigned_by
//                             }
//                         />

//                         <DetailField
//                             label="Device Assigned Date"
//                             value={
//                                 formatDateTime(
//                                     item.device_assigned_date
//                                 )
//                             }
//                         />
//                     </div>

//                     <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
//                         <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                             Reason / Details
//                         </p>

//                         <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-foreground">
//                             {
//                                 item.reason_details ||
//                                 "—"
//                             }
//                         </p>
//                     </div>

//                     <div className="mt-5 flex justify-end">
//                         <Button
//                             type="button"
//                             variant="outline"
//                             size="sm"
//                             onClick={
//                                 onClose
//                             }
//                         >
//                             Close
//                         </Button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// /* ======================================================
//    PAGE CONTENT
// ====================================================== */

// function RequisitionPageContent() {
//     const router =
//         useRouter();

//     const searchParams =
//         useSearchParams();

//     /* ==================================================
//        RESOLVE VIEW
//     ================================================== */

//     const rawView =
//         searchParams.get(
//             "view"
//         ) ?? "summary";

//     const view:
//         RequisitionView =
//         VALID_VIEWS.includes(
//             rawView as
//             RequisitionView
//         )
//             ? (
//                 rawView as
//                 RequisitionView
//             )
//             : "summary";

//     const selectedCategory =
//         searchParams.get(
//             "category"
//         ) ?? "";

//     const config =
//         VIEW_CONFIG[
//         view
//         ];

//     /* ==================================================
//        DASHBOARD SUMMARY STATE
//     ================================================== */

//     const [
//         dashboardSummary,
//         setDashboardSummary,
//     ] =
//         useState<RequisitionDashboardSummary>(
//             EMPTY_DASHBOARD_SUMMARY
//         );

//     const [
//         dashboardLoading,
//         setDashboardLoading,
//     ] =
//         useState(
//             true
//         );

//     /* ==================================================
//        CATEGORY SUMMARY STATE
//     ================================================== */

//     const [
//         categoryRows,
//         setCategoryRows,
//     ] =
//         useState<
//             RequisitionCategorySummary[]
//         >([]);

//     const [
//         categoryLoading,
//         setCategoryLoading,
//     ] =
//         useState(
//             true
//         );

//     const [
//         categoryError,
//         setCategoryError,
//     ] =
//         useState("");

//     const [
//         categorySearch,
//         setCategorySearch,
//     ] =
//         useState("");

//     /* ==================================================
//        REQUISITION LIST STATE
//     ================================================== */

//     const [
//         rows,
//         setRows,
//     ] =
//         useState<
//             RequisitionItem[]
//         >([]);

//     const [
//         total,
//         setTotal,
//     ] =
//         useState(
//             0
//         );

//     const [
//         page,
//         setPage,
//     ] =
//         useState(
//             1
//         );

//     const [
//         loading,
//         setLoading,
//     ] =
//         useState(
//             true
//         );

//     const [
//         error,
//         setError,
//     ] =
//         useState("");

//     /* ==================================================
//        SEARCH / FILTER STATE
//     ================================================== */

//     const [
//         search,
//         setSearch,
//     ] =
//         useState("");

//     const deferredSearch =
//         useDeferredValue(
//             search
//         );

//     const [
//         dateFilters,
//         setDateFilters,
//     ] =
//         useState<DateFilters>({
//             fromDate:
//                 "",

//             toDate:
//                 "",
//         });

//     const [
//         filtersOpen,
//         setFiltersOpen,
//     ] =
//         useState(
//             false
//         );

//     /* ==================================================
//        MODAL STATE
//     ================================================== */

//     const [
//         selectedItem,
//         setSelectedItem,
//     ] =
//         useState<
//             | RequisitionItem
//             | null
//         >(null);

//     /* ==================================================
//        LOAD DASHBOARD SUMMARY
//     ================================================== */

//     useEffect(
//         () => {
//             let mounted =
//                 true;

//             async function loadDashboardSummary() {
//                 try {
//                     setDashboardLoading(
//                         true
//                     );

//                     const response =
//                         await dashboardApi
//                             .requisitionDashboardSummary();

//                     if (
//                         !mounted
//                     ) {
//                         return;
//                     }

//                     setDashboardSummary({
//                         pending_categories:
//                             Number(
//                                 response
//                                     .data
//                                     ?.pending_categories ??
//                                 0
//                             ),

//                         approval_pending:
//                             Number(
//                                 response
//                                     .data
//                                     ?.approval_pending ??
//                                 0
//                             ),

//                         rejected:
//                             Number(
//                                 response
//                                     .data
//                                     ?.rejected ??
//                                 0
//                             ),

//                         approved:
//                             Number(
//                                 response
//                                     .data
//                                     ?.approved ??
//                                 0
//                             ),

//                         total_active:
//                             Number(
//                                 response
//                                     .data
//                                     ?.total_active ??
//                                 0
//                             ),
//                     });
//                 } catch (
//                 reason:
//                     unknown
//                 ) {
//                     console.error(
//                         "Unable to load requisition dashboard summary:",
//                         reason
//                     );

//                     if (
//                         mounted
//                     ) {
//                         setDashboardSummary(
//                             EMPTY_DASHBOARD_SUMMARY
//                         );
//                     }
//                 } finally {
//                     if (
//                         mounted
//                     ) {
//                         setDashboardLoading(
//                             false
//                         );
//                     }
//                 }
//             }

//             void loadDashboardSummary();

//             return () => {
//                 mounted =
//                     false;
//             };
//         },
//         []
//     );

//     /* ==================================================
//        LOAD CATEGORY SUMMARY
//     ================================================== */

//     useEffect(
//         () => {
//             let mounted =
//                 true;

//             async function loadCategorySummary() {
//                 try {
//                     setCategoryLoading(
//                         true
//                     );

//                     setCategoryError(
//                         ""
//                     );

//                     const response =
//                         await dashboardApi
//                             .requisitionSummary();

//                     if (
//                         !mounted
//                     ) {
//                         return;
//                     }

//                     setCategoryRows(
//                         response.data ??
//                         []
//                     );
//                 } catch (
//                 reason:
//                     unknown
//                 ) {
//                     if (
//                         !mounted
//                     ) {
//                         return;
//                     }

//                     setCategoryRows(
//                         []
//                     );

//                     setCategoryError(
//                         reason instanceof
//                             Error
//                             ? reason.message
//                             : "Unable to load Requisition Summary"
//                     );
//                 } finally {
//                     if (
//                         mounted
//                     ) {
//                         setCategoryLoading(
//                             false
//                         );
//                     }
//                 }
//             }

//             void loadCategorySummary();

//             return () => {
//                 mounted =
//                     false;
//             };
//         },
//         []
//     );

//     /* ==================================================
//        RESET PAGE WHEN FILTER CHANGES
//     ================================================== */

//     useEffect(
//         () => {
//             setPage(
//                 1
//             );
//         },
//         [
//             view,
//             selectedCategory,
//             deferredSearch,
//             dateFilters.fromDate,
//             dateFilters.toDate,
//         ]
//     );

//     /* ==================================================
//        LOAD REQUISITION DETAIL LIST

//        IMPORTANT:
//        The API list supports:
//        - pending
//        - rejected
//        - approved
//        - all

//        It does NOT support "summary".

//        Summary uses requisitionSummary().
//     ================================================== */

//     useEffect(
//         () => {
//             if (
//                 view ===
//                 "summary"
//             ) {
//                 setRows(
//                     []
//                 );

//                 setTotal(
//                     0
//                 );

//                 setLoading(
//                     false
//                 );

//                 setError(
//                     ""
//                 );

//                 return;
//             }

//             /*
//              * TypeScript now knows this API call
//              * can never receive "summary".
//              */
//             const listView:
//                 RequisitionListView =
//                 view;

//             let mounted =
//                 true;

//             async function loadRequisitions() {
//                 try {
//                     setLoading(
//                         true
//                     );

//                     setError(
//                         ""
//                     );

//                     const response =
//                         await dashboardApi
//                             .requisitions({
//                                 view:
//                                     listView,

//                                 category:
//                                     selectedCategory ||
//                                     undefined,

//                                 search:
//                                     deferredSearch
//                                         .trim() ||
//                                     undefined,

//                                 from_date:
//                                     dateFilters
//                                         .fromDate ||
//                                     undefined,

//                                 to_date:
//                                     dateFilters
//                                         .toDate ||
//                                     undefined,

//                                 page,

//                                 limit:
//                                     PAGE_SIZE,
//                             });

//                     if (
//                         !mounted
//                     ) {
//                         return;
//                     }

//                     setRows(
//                         response.data ??
//                         []
//                     );

//                     setTotal(
//                         Number(
//                             response.total ??
//                             0
//                         )
//                     );
//                 } catch (
//                 reason:
//                     unknown
//                 ) {
//                     if (
//                         !mounted
//                     ) {
//                         return;
//                     }

//                     setRows(
//                         []
//                     );

//                     setTotal(
//                         0
//                     );

//                     setError(
//                         reason instanceof
//                             Error
//                             ? reason.message
//                             : "Unable to load Requisition records"
//                     );
//                 } finally {
//                     if (
//                         mounted
//                     ) {
//                         setLoading(
//                             false
//                         );
//                     }
//                 }
//             }

//             void loadRequisitions();

//             return () => {
//                 mounted =
//                     false;
//             };
//         },
//         [
//             view,
//             selectedCategory,
//             deferredSearch,
//             dateFilters.fromDate,
//             dateFilters.toDate,
//             page,
//         ]
//     );

//     /* ==================================================
//        FILTER CATEGORY SUMMARY LOCALLY
//     ================================================== */

//     const filteredCategoryRows =
//         useMemo(
//             () => {
//                 const value =
//                     categorySearch
//                         .trim()
//                         .toLowerCase();

//                 if (
//                     !value
//                 ) {
//                     return categoryRows;
//                 }

//                 return categoryRows.filter(
//                     (
//                         item
//                     ) =>
//                         item.category
//                             .toLowerCase()
//                             .includes(
//                                 value
//                             )
//                 );
//             },
//             [
//                 categoryRows,
//                 categorySearch,
//             ]
//         );

//     /* ==================================================
//        TOTAL PENDING
//     ================================================== */

//     const totalPendingFromCategories =
//         useMemo(
//             () =>
//                 categoryRows.reduce(
//                     (
//                         sum,
//                         item
//                     ) =>
//                         sum +
//                         Number(
//                             item.pending_count ??
//                             0
//                         ),
//                     0
//                 ),
//             [
//                 categoryRows,
//             ]
//         );

//     /* ==================================================
//        PAGINATION
//     ================================================== */

//     const totalPages =
//         Math.max(
//             Math.ceil(
//                 total /
//                 PAGE_SIZE
//             ),
//             1
//         );

//     /* ==================================================
//        HEADER COUNT
//     ================================================== */

//     const currentRecordCount =
//         view ===
//             "summary"
//             ? dashboardSummary
//                 .pending_categories
//             : total;

//     const currentRecordLabel =
//         view ===
//             "summary"
//             ? currentRecordCount ===
//                 1
//                 ? "Category"
//                 : "Categories"
//             : currentRecordCount ===
//                 1
//                 ? "Record"
//                 : "Records";

//     /* ==================================================
//        ACTIVE FILTER
//     ================================================== */

//     const hasActiveFilters =
//         Boolean(
//             selectedCategory ||
//             search.trim() ||
//             dateFilters.fromDate ||
//             dateFilters.toDate
//         );

//     /* ==================================================
//        CHANGE VIEW
//     ================================================== */

//     function changeView(
//         nextView:
//             RequisitionView
//     ) {
//         setSearch(
//             ""
//         );

//         setDateFilters({
//             fromDate:
//                 "",

//             toDate:
//                 "",
//         });

//         setFiltersOpen(
//             false
//         );

//         setPage(
//             1
//         );

//         router.push(
//             `/dashboard/requisitions?view=${nextView}`
//         );
//     }

//     /* ==================================================
//        OPEN PENDING CATEGORY
//     ================================================== */

//     function openPendingCategory(
//         category:
//             string
//     ) {
//         setSearch(
//             ""
//         );

//         setDateFilters({
//             fromDate:
//                 "",

//             toDate:
//                 "",
//         });

//         setPage(
//             1
//         );

//         router.push(
//             `/dashboard/requisitions?view=pending&category=${encodeURIComponent(
//                 category
//             )}`
//         );
//     }

//     /* ==================================================
//        CLEAR FILTERS
//     ================================================== */

//     function clearFilters() {
//         setSearch(
//             ""
//         );

//         setDateFilters({
//             fromDate:
//                 "",

//             toDate:
//                 "",
//         });

//         setPage(
//             1
//         );

//         if (
//             selectedCategory
//         ) {
//             router.push(
//                 `/dashboard/requisitions?view=${view}`
//             );
//         }
//     }

//     /* ==================================================
//        PAGE UI
//     ================================================== */

//     return (
//         <>
//             <div className="space-y-4 p-4">
//                 {/* ======================================
//                     HEADER
//                 ====================================== */}

//                 <div className="flex flex-wrap items-start justify-between gap-3">
//                     <div className="flex items-start gap-3">
//                         <Button
//                             type="button"
//                             variant="outline"
//                             size="sm"
//                             className="h-8 gap-1.5 text-xs"
//                             onClick={() =>
//                                 router.push(
//                                     "/dashboard"
//                                 )
//                             }
//                         >
//                             <ArrowLeft className="h-3.5 w-3.5" />

//                             Dashboard
//                         </Button>

//                         <div>
//                             <h1 className="text-base font-semibold text-foreground">
//                                 {
//                                     config.title
//                                 }
//                             </h1>

//                             <p className="mt-1 text-xs text-muted-foreground">
//                                 {
//                                     config.description
//                                 }
//                             </p>
//                         </div>
//                     </div>

//                     <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
//                         <span className="text-xs font-semibold text-primary">
//                             {dashboardLoading &&
//                                 view ===
//                                 "summary"
//                                 ? "—"
//                                 : currentRecordCount.toLocaleString()}{" "}
//                             {
//                                 currentRecordLabel
//                             }
//                         </span>
//                     </div>
//                 </div>

//                 {/* ======================================
//                     VIEW TABS
//                 ====================================== */}

//                 <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
//                     {VIEW_OPTIONS.map(
//                         (
//                             option
//                         ) => {
//                             const active =
//                                 view ===
//                                 option.view;

//                             return (
//                                 <button
//                                     key={
//                                         option.view
//                                     }
//                                     type="button"
//                                     onClick={() =>
//                                         changeView(
//                                             option.view
//                                         )
//                                     }
//                                     className={`
//                                         rounded-lg
//                                         border
//                                         px-3
//                                         py-2
//                                         text-xs
//                                         font-medium
//                                         transition-all

//                                         ${active
//                                             ? "border-primary bg-primary text-primary-foreground shadow-sm"
//                                             : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
//                                         }
//                                     `}
//                                 >
//                                     {
//                                         option.label
//                                     }

//                                     {!dashboardLoading &&
//                                         option.view ===
//                                         "pending" && (
//                                             <span
//                                                 className={`
//                                                     ml-1.5
//                                                     rounded-full
//                                                     px-1.5
//                                                     py-0.5
//                                                     text-[9px]

//                                                     ${active
//                                                         ? "bg-white/20"
//                                                         : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
//                                                     }
//                                                 `}
//                                             >
//                                                 {
//                                                     dashboardSummary
//                                                         .approval_pending
//                                                 }
//                                             </span>
//                                         )}

//                                     {!dashboardLoading &&
//                                         option.view ===
//                                         "rejected" && (
//                                             <span
//                                                 className={`
//                                                     ml-1.5
//                                                     rounded-full
//                                                     px-1.5
//                                                     py-0.5
//                                                     text-[9px]

//                                                     ${active
//                                                         ? "bg-white/20"
//                                                         : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
//                                                     }
//                                                 `}
//                                             >
//                                                 {
//                                                     dashboardSummary
//                                                         .rejected
//                                                 }
//                                             </span>
//                                         )}
//                                 </button>
//                             );
//                         }
//                     )}
//                 </div>

//                 {/* ======================================
//                     SUMMARY VIEW
//                 ====================================== */}

//                 {view ===
//                     "summary" && (
//                         <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
//                             {/* Heading */}

//                             <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
//                                 <div>
//                                     <h2 className="text-xs font-semibold text-foreground">
//                                         IT Accessories Requisition Pending List
//                                     </h2>

//                                     <p className="mt-1 text-[10px] text-muted-foreground">
//                                         Select a category to view its pending requisitions
//                                     </p>
//                                 </div>

//                                 <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-950/20">
//                                     <p className="text-[9px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
//                                         Total Pending Requisition
//                                     </p>

//                                     <p className="mt-0.5 text-lg font-bold text-amber-600 dark:text-amber-400">
//                                         {dashboardLoading
//                                             ? "—"
//                                             : dashboardSummary
//                                                 .approval_pending
//                                                 .toLocaleString()}
//                                     </p>
//                                 </div>
//                             </div>

//                             {/* Search */}

//                             <div className="mb-3 flex max-w-md items-center gap-2 rounded-lg border border-border bg-background px-3">
//                                 <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

//                                 <input
//                                     type="text"
//                                     value={
//                                         categorySearch
//                                     }
//                                     onChange={(
//                                         event
//                                     ) =>
//                                         setCategorySearch(
//                                             event
//                                                 .target
//                                                 .value
//                                         )
//                                     }
//                                     placeholder="Search category..."
//                                     className="h-9 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
//                                 />

//                                 {categorySearch && (
//                                     <button
//                                         type="button"
//                                         aria-label="Clear category search"
//                                         onClick={() =>
//                                             setCategorySearch(
//                                                 ""
//                                             )
//                                         }
//                                         className="text-muted-foreground hover:text-foreground"
//                                     >
//                                         <X className="h-3.5 w-3.5" />
//                                     </button>
//                                 )}
//                             </div>

//                             {/* Loading */}

//                             {categoryLoading ? (
//                                 <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-muted-foreground">
//                                     <LoaderCircle className="h-6 w-6 animate-spin text-primary" />

//                                     <p className="text-xs">
//                                         Loading Requisition Summary...
//                                     </p>
//                                 </div>
//                             ) : categoryError ? (
//                                 /* Error */

//                                 <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
//                                     <AlertCircle className="h-7 w-7 text-red-600" />

//                                     <div>
//                                         <p className="text-sm font-semibold text-red-700">
//                                             Unable to load Requisition Summary
//                                         </p>

//                                         <p className="mt-1 text-xs text-red-600">
//                                             {
//                                                 categoryError
//                                             }
//                                         </p>
//                                     </div>
//                                 </div>
//                             ) : filteredCategoryRows.length ===
//                                 0 ? (
//                                 /* Empty */

//                                 <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
//                                     <p className="text-sm font-semibold text-foreground">
//                                         {
//                                             VIEW_CONFIG
//                                                 .summary
//                                                 .emptyTitle
//                                         }
//                                     </p>

//                                     <p className="mt-1 max-w-md text-xs text-muted-foreground">
//                                         {categorySearch
//                                             ? "No requisition category matches your search."
//                                             : VIEW_CONFIG
//                                                 .summary
//                                                 .emptyDescription
//                                         }
//                                     </p>
//                                 </div>
//                             ) : (
//                                 /* Table */

//                                 <div className="overflow-x-auto rounded-lg border border-border">
//                                     <table className="w-full min-w-[650px] border-collapse text-xs">
//                                         <thead>
//                                             <tr className="border-b border-border bg-cyan-50/70 dark:bg-cyan-950/10">
//                                                 <th className="w-[70px] px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                     SL
//                                                 </th>

//                                                 <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                     Device Category
//                                                 </th>

//                                                 <th className="w-[220px] px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                     Pending Requisition
//                                                 </th>

//                                                 <th className="w-[120px] px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                     Action
//                                                 </th>
//                                             </tr>
//                                         </thead>

//                                         <tbody>
//                                             {filteredCategoryRows.map(
//                                                 (
//                                                     item,
//                                                     index
//                                                 ) => (
//                                                     <tr
//                                                         key={
//                                                             item.category
//                                                         }
//                                                         className="border-b border-border last:border-b-0 hover:bg-muted/30"
//                                                     >
//                                                         <td className="px-4 py-2.5 text-center font-medium text-muted-foreground">
//                                                             {index +
//                                                                 1}
//                                                         </td>

//                                                         <td className="px-4 py-2.5">
//                                                             <button
//                                                                 type="button"
//                                                                 onClick={() =>
//                                                                     openPendingCategory(
//                                                                         item.category
//                                                                     )
//                                                                 }
//                                                                 className="font-semibold text-primary hover:underline"
//                                                             >
//                                                                 {
//                                                                     item.category
//                                                                 }
//                                                             </button>
//                                                         </td>

//                                                         <td className="px-4 py-2.5 text-center">
//                                                             <span className="inline-flex min-w-[38px] justify-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-bold text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
//                                                                 {item.pending_count.toLocaleString()}
//                                                             </span>
//                                                         </td>

//                                                         <td className="px-4 py-2.5 text-center">
//                                                             <button
//                                                                 type="button"
//                                                                 onClick={() =>
//                                                                     openPendingCategory(
//                                                                         item.category
//                                                                     )
//                                                                 }
//                                                                 className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
//                                                             >
//                                                                 <Eye className="h-3 w-3" />

//                                                                 View
//                                                             </button>
//                                                         </td>
//                                                     </tr>
//                                                 )
//                                             )}
//                                         </tbody>

//                                         <tfoot>
//                                             <tr className="border-t border-border bg-muted/30">
//                                                 <td
//                                                     colSpan={
//                                                         2
//                                                     }
//                                                     className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
//                                                 >
//                                                     Total Pending
//                                                 </td>

//                                                 <td className="px-4 py-2.5 text-center text-sm font-bold text-amber-600">
//                                                     {totalPendingFromCategories.toLocaleString()}
//                                                 </td>

//                                                 <td />
//                                             </tr>
//                                         </tfoot>
//                                     </table>
//                                 </div>
//                             )}
//                         </div>
//                     )}

//                 {/* ======================================
//                     PENDING / REJECTED
//                 ====================================== */}

//                 {view !==
//                     "summary" && (
//                         <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
//                             {/* Toolbar */}

//                             <div className="mb-3 flex flex-wrap items-center gap-2">
//                                 <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-primary/30 bg-background px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
//                                     <Search className="h-3.5 w-3.5 shrink-0 text-primary" />

//                                     <input
//                                         type="text"
//                                         value={
//                                             search
//                                         }
//                                         onChange={(
//                                             event
//                                         ) =>
//                                             setSearch(
//                                                 event
//                                                     .target
//                                                     .value
//                                             )
//                                         }
//                                         placeholder="Search TT, employee, category, reason, device serial..."
//                                         className="h-9 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
//                                     />

//                                     {search && (
//                                         <button
//                                             type="button"
//                                             aria-label="Clear search"
//                                             onClick={() =>
//                                                 setSearch(
//                                                     ""
//                                                 )
//                                             }
//                                             className="text-muted-foreground hover:text-foreground"
//                                         >
//                                             <X className="h-3.5 w-3.5" />
//                                         </button>
//                                     )}
//                                 </div>

//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setFiltersOpen(
//                                             (
//                                                 current
//                                             ) =>
//                                                 !current
//                                         )
//                                     }
//                                     className={`
//                                     inline-flex
//                                     h-9
//                                     items-center
//                                     gap-1.5
//                                     rounded-lg
//                                     border
//                                     px-3
//                                     text-xs
//                                     font-medium
//                                     transition-colors

//                                     ${filtersOpen ||
//                                             hasActiveFilters
//                                             ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
//                                             : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
//                                         }
//                                 `}
//                                 >
//                                     <Filter className="h-3.5 w-3.5" />

//                                     Filter
//                                 </button>

//                                 {hasActiveFilters && (
//                                     <button
//                                         type="button"
//                                         onClick={
//                                             clearFilters
//                                         }
//                                         className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
//                                     >
//                                         <RefreshCcw className="h-3.5 w-3.5" />

//                                         Clear
//                                     </button>
//                                 )}
//                             </div>

//                             {/* Selected category */}

//                             {selectedCategory && (
//                                 <div className="mb-3 flex flex-wrap items-center gap-2">
//                                     <span className="text-[10px] font-medium text-muted-foreground">
//                                         Category:
//                                     </span>

//                                     <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold text-primary">
//                                         {
//                                             selectedCategory
//                                         }

//                                         <button
//                                             type="button"
//                                             aria-label="Remove category filter"
//                                             onClick={() =>
//                                                 router.push(
//                                                     `/dashboard/requisitions?view=${view}`
//                                                 )
//                                             }
//                                         >
//                                             <X className="h-3 w-3" />
//                                         </button>
//                                     </span>
//                                 </div>
//                             )}

//                             {/* Filter panel */}

//                             {filtersOpen && (
//                                 <div className="mb-4 grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
//                                     <label className="space-y-1">
//                                         <span className="text-[10px] font-semibold text-muted-foreground">
//                                             From Date
//                                         </span>

//                                         <input
//                                             type="date"
//                                             value={
//                                                 dateFilters
//                                                     .fromDate
//                                             }
//                                             onChange={(
//                                                 event
//                                             ) =>
//                                                 setDateFilters(
//                                                     (
//                                                         current
//                                                     ) => ({
//                                                         ...current,

//                                                         fromDate:
//                                                             event
//                                                                 .target
//                                                                 .value,
//                                                     })
//                                                 )
//                                             }
//                                             className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
//                                         />
//                                     </label>

//                                     <label className="space-y-1">
//                                         <span className="text-[10px] font-semibold text-muted-foreground">
//                                             To Date
//                                         </span>

//                                         <input
//                                             type="date"
//                                             value={
//                                                 dateFilters
//                                                     .toDate
//                                             }
//                                             onChange={(
//                                                 event
//                                             ) =>
//                                                 setDateFilters(
//                                                     (
//                                                         current
//                                                     ) => ({
//                                                         ...current,

//                                                         toDate:
//                                                             event
//                                                                 .target
//                                                                 .value,
//                                                     })
//                                                 )
//                                             }
//                                             className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
//                                         />
//                                     </label>

//                                     <div className="flex items-end">
//                                         <Button
//                                             type="button"
//                                             variant="outline"
//                                             size="sm"
//                                             className="h-9 w-full text-xs lg:w-auto"
//                                             onClick={
//                                                 clearFilters
//                                             }
//                                         >
//                                             Clear Filters
//                                         </Button>
//                                     </div>
//                                 </div>
//                             )}

//                             {/* Loading */}

//                             {loading ? (
//                                 <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-muted-foreground">
//                                     <LoaderCircle className="h-6 w-6 animate-spin text-primary" />

//                                     <p className="text-xs">
//                                         Loading{" "}
//                                         {
//                                             config.title
//                                         }
//                                         ...
//                                     </p>
//                                 </div>
//                             ) : error ? (
//                                 /* Error */

//                                 <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
//                                     <AlertCircle className="h-7 w-7 text-red-600" />

//                                     <div>
//                                         <p className="text-sm font-semibold text-red-700">
//                                             Unable to load Requisitions
//                                         </p>

//                                         <p className="mt-1 text-xs text-red-600">
//                                             {
//                                                 error
//                                             }
//                                         </p>
//                                     </div>
//                                 </div>
//                             ) : (
//                                 <>
//                                     {/* ==================================
//                                     TABLE
//                                 ================================== */}

//                                     <div className="overflow-x-auto rounded-lg border border-border">
//                                         <table className="w-full min-w-[1500px] border-collapse text-[11px]">
//                                             <thead>
//                                                 <tr className="border-b border-border bg-cyan-50/70 dark:bg-cyan-950/10">
//                                                     <th className="w-[50px] px-2 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         SL
//                                                     </th>

//                                                     <th className="w-[155px] px-2 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         TT No
//                                                     </th>

//                                                     <th className="w-[140px] px-2 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         Submitted
//                                                     </th>

//                                                     <th className="w-[160px] px-2 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         Raised By
//                                                     </th>

//                                                     <th className="w-[140px] px-2 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         Category
//                                                     </th>

//                                                     <th className="w-[200px] px-2 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         User
//                                                     </th>

//                                                     <th className="w-[115px] px-2 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         Device SL
//                                                     </th>

//                                                     <th className="min-w-[260px] px-2 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         Reason
//                                                     </th>

//                                                     <th className="w-[150px] px-2 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         Approval
//                                                     </th>

//                                                     <th className="w-[120px] px-2 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         Delivery
//                                                     </th>

//                                                     <th className="w-[90px] px-2 py-2.5 text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                                         Action
//                                                     </th>
//                                                 </tr>
//                                             </thead>

//                                             <tbody>
//                                                 {rows.length ===
//                                                     0 ? (
//                                                     <tr>
//                                                         <td
//                                                             colSpan={
//                                                                 11
//                                                             }
//                                                             className="px-4 py-14 text-center"
//                                                         >
//                                                             <p className="text-sm font-semibold text-foreground">
//                                                                 {
//                                                                     config.emptyTitle
//                                                                 }
//                                                             </p>

//                                                             <p className="mt-1 text-xs text-muted-foreground">
//                                                                 {hasActiveFilters
//                                                                     ? "No records match the current search or filter combination."
//                                                                     : config.emptyDescription
//                                                                 }
//                                                             </p>

//                                                             {hasActiveFilters && (
//                                                                 <button
//                                                                     type="button"
//                                                                     onClick={
//                                                                         clearFilters
//                                                                     }
//                                                                     className="mt-3 text-xs font-semibold text-primary hover:underline"
//                                                                 >
//                                                                     Clear filters
//                                                                 </button>
//                                                             )}
//                                                         </td>
//                                                     </tr>
//                                                 ) : (
//                                                     rows.map(
//                                                         (
//                                                             item,
//                                                             index
//                                                         ) => (
//                                                             <tr
//                                                                 key={
//                                                                     item.id
//                                                                 }
//                                                                 className="border-b border-border last:border-b-0 hover:bg-muted/25"
//                                                             >
//                                                                 <td className="px-2 py-2.5 text-center font-semibold text-foreground">
//                                                                     {(page -
//                                                                         1) *
//                                                                         PAGE_SIZE +
//                                                                         index +
//                                                                         1}
//                                                                 </td>

//                                                                 <td className="px-2 py-2.5">
//                                                                     <button
//                                                                         type="button"
//                                                                         onClick={() =>
//                                                                             setSelectedItem(
//                                                                                 item
//                                                                             )
//                                                                         }
//                                                                         className="w-full rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-center font-semibold text-violet-600 transition-colors hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-400"
//                                                                     >
//                                                                         {
//                                                                             item.tt_no
//                                                                         }
//                                                                     </button>
//                                                                 </td>

//                                                                 <td className="whitespace-nowrap px-2 py-2.5 text-muted-foreground">
//                                                                     {formatDateTime(
//                                                                         item.created_at
//                                                                     )}
//                                                                 </td>

//                                                                 <td className="px-2 py-2.5">
//                                                                     <p className="font-medium text-foreground">
//                                                                         {item.created_by_name ||
//                                                                             "—"}
//                                                                     </p>

//                                                                     {item.created_by && (
//                                                                         <p className="mt-0.5 text-[9px] text-muted-foreground">
//                                                                             {
//                                                                                 item.created_by
//                                                                             }
//                                                                         </p>
//                                                                     )}
//                                                                 </td>

//                                                                 <td className="px-2 py-2.5 font-medium text-foreground">
//                                                                     {
//                                                                         item.category
//                                                                     }
//                                                                 </td>

//                                                                 <td className="px-2 py-2.5">
//                                                                     <p className="font-medium text-foreground">
//                                                                         {item.employee_name ||
//                                                                             "—"}
//                                                                     </p>

//                                                                     <p className="mt-0.5 text-[9px] font-medium text-muted-foreground">
//                                                                         {
//                                                                             item.employee_id
//                                                                         }
//                                                                     </p>
//                                                                 </td>

//                                                                 <td className="px-2 py-2.5 font-mono text-[10px] text-muted-foreground">
//                                                                     {item.device_sl_no ||
//                                                                         "—"}
//                                                                 </td>

//                                                                 <td className="px-2 py-2.5">
//                                                                     <p
//                                                                         className="line-clamp-2 max-w-[340px] leading-4 text-foreground"
//                                                                         title={
//                                                                             item.reason_details
//                                                                         }
//                                                                     >
//                                                                         {item.reason_details ||
//                                                                             "—"}
//                                                                     </p>
//                                                                 </td>

//                                                                 <td className="px-2 py-2.5 text-center">
//                                                                     <ApprovalBadge
//                                                                         item={
//                                                                             item
//                                                                         }
//                                                                     />
//                                                                 </td>

//                                                                 <td className="px-2 py-2.5 text-center">
//                                                                     <DeliveryBadge
//                                                                         item={
//                                                                             item
//                                                                         }
//                                                                     />
//                                                                 </td>

//                                                                 <td className="px-2 py-2.5 text-center">
//                                                                     <button
//                                                                         type="button"
//                                                                         onClick={() =>
//                                                                             setSelectedItem(
//                                                                                 item
//                                                                             )
//                                                                         }
//                                                                         className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
//                                                                     >
//                                                                         <Eye className="h-3 w-3" />

//                                                                         View
//                                                                     </button>
//                                                                 </td>
//                                                             </tr>
//                                                         )
//                                                     )
//                                                 )}
//                                             </tbody>
//                                         </table>
//                                     </div>

//                                     {/* ==================================
//                                     PAGINATION
//                                 ================================== */}

//                                     <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
//                                         <div className="text-[10px] text-muted-foreground">
//                                             {total >
//                                                 0 ? (
//                                                 <>
//                                                     Showing{" "}
//                                                     <span className="font-semibold text-foreground">
//                                                         {(page -
//                                                             1) *
//                                                             PAGE_SIZE +
//                                                             1}
//                                                     </span>{" "}
//                                                     to{" "}
//                                                     <span className="font-semibold text-foreground">
//                                                         {Math.min(
//                                                             page *
//                                                             PAGE_SIZE,
//                                                             total
//                                                         )}
//                                                     </span>{" "}
//                                                     of{" "}
//                                                     <span className="font-semibold text-foreground">
//                                                         {
//                                                             total
//                                                         }
//                                                     </span>{" "}
//                                                     records
//                                                 </>
//                                             ) : (
//                                                 "0 records"
//                                             )}
//                                         </div>

//                                         <div className="flex items-center gap-2">
//                                             <span className="text-[10px] text-muted-foreground">
//                                                 Page{" "}
//                                                 <span className="font-semibold text-foreground">
//                                                     {
//                                                         page
//                                                     }
//                                                 </span>{" "}
//                                                 of{" "}
//                                                 <span className="font-semibold text-foreground">
//                                                     {
//                                                         totalPages
//                                                     }
//                                                 </span>
//                                             </span>

//                                             <button
//                                                 type="button"
//                                                 disabled={
//                                                     page <=
//                                                     1
//                                                 }
//                                                 onClick={() =>
//                                                     setPage(
//                                                         (
//                                                             current
//                                                         ) =>
//                                                             Math.max(
//                                                                 current -
//                                                                 1,
//                                                                 1
//                                                             )
//                                                     )
//                                                 }
//                                                 className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
//                                             >
//                                                 <ChevronLeft className="h-3.5 w-3.5" />

//                                                 Previous
//                                             </button>

//                                             <button
//                                                 type="button"
//                                                 disabled={
//                                                     page >=
//                                                     totalPages
//                                                 }
//                                                 onClick={() =>
//                                                     setPage(
//                                                         (
//                                                             current
//                                                         ) =>
//                                                             Math.min(
//                                                                 current +
//                                                                 1,
//                                                                 totalPages
//                                                             )
//                                                     )
//                                                 }
//                                                 className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-[10px] font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
//                                             >
//                                                 Next

//                                                 <ChevronRight className="h-3.5 w-3.5" />
//                                             </button>
//                                         </div>
//                                     </div>
//                                 </>
//                             )}
//                         </div>
//                     )}
//             </div>

//             {/* ======================================
//                 DETAILS MODAL
//             ====================================== */}

//             <RequisitionDetailsModal
//                 item={
//                     selectedItem
//                 }
//                 onClose={() =>
//                     setSelectedItem(
//                         null
//                     )
//                 }
//             />
//         </>
//     );
// }

// /* ======================================================
//    PAGE EXPORT
// ====================================================== */

// export default function RequisitionPage() {
//     return (
//         <Suspense
//             fallback={
//                 <div className="flex min-h-[320px] items-center justify-center gap-2 text-xs text-muted-foreground">
//                     <LoaderCircle className="h-4 w-4 animate-spin" />

//                     Loading Requisition page...
//                 </div>
//             }
//         >
//             <RequisitionPageContent />
//         </Suspense>
//     );
// }


//frontend/app/dashboard/requisitions/page.tsx

"use client";

import {
    Suspense,
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Columns3,
    Eye,
    Filter,
    LoaderCircle,
    RefreshCcw,
    Search,
    X,
    XCircle,
} from "lucide-react";

import {
    Button,
} from "@/components/ui/button";

import {
    dashboardApi,
    type RequisitionCategorySummary,
    type RequisitionDashboardSummary,
    type RequisitionItem,
} from "@/lib/api";

/* ======================================================
   TYPES
====================================================== */

type RequisitionView =
    | "summary"
    | "pending"
    | "rejected";

type RequisitionListView =
    | "pending"
    | "rejected";

type DateFilters = {
    fromDate: string;
    toDate: string;
};

type OptionalColumn =
    | "raisedBy"
    | "userDetails"
    | "reason";

type VisibleColumns = {
    raisedBy: boolean;
    userDetails: boolean;
    reason: boolean;
};

/* ======================================================
   CONSTANTS
====================================================== */

const VALID_VIEWS:
    RequisitionView[] = [
        "summary",
        "pending",
        "rejected",
    ];

const PAGE_SIZE = 10;

const EMPTY_DASHBOARD_SUMMARY:
    RequisitionDashboardSummary = {
    pending_categories: 0,
    approval_pending: 0,
    rejected: 0,
    approved: 0,
    total_active: 0,
};

const DEFAULT_VISIBLE_COLUMNS:
    VisibleColumns = {
    raisedBy: true,
    userDetails: true,

    // Long text consumes table width.
    // User can enable it from Columns.
    reason: false,
};

const VIEW_CONFIG: Record<
    RequisitionView,
    {
        title: string;
        description: string;
        emptyTitle: string;
        emptyDescription: string;
    }
> = {
    summary: {
        title:
            "Requisition Summary",

        description:
            "IT Accessories pending requisition summary by category",

        emptyTitle:
            "No Pending Requisitions",

        emptyDescription:
            "There are currently no IT accessories requisitions waiting for approval.",
    },

    pending: {
        title:
            "Approval Pending",

        description:
            "IT Accessories requisitions currently waiting for approval",

        emptyTitle:
            "No Approval Pending Requisitions",

        emptyDescription:
            "There are currently no requisitions waiting for approval.",
    },

    rejected: {
        title:
            "Rejected Requisitions",

        description:
            "IT Accessories requisitions rejected during the approval workflow",

        emptyTitle:
            "No Rejected Requisitions",

        emptyDescription:
            "There are currently no rejected requisitions.",
    },
};

const VIEW_OPTIONS: {
    view: RequisitionView;
    label: string;
}[] = [
        {
            view:
                "summary",

            label:
                "Requisition Summary",
        },

        {
            view:
                "pending",

            label:
                "Approval Pending",
        },

        {
            view:
                "rejected",

            label:
                "Rejected",
        },
    ];

/* ======================================================
   DATE HELPERS
====================================================== */

function normalizeDateValue(
    value: string
) {
    if (!value) {
        return "";
    }

    let normalized =
        value.trim();

    if (
        normalized.includes(
            " "
        ) &&
        !normalized.includes(
            "T"
        )
    ) {
        normalized =
            normalized.replace(
                " ",
                "T"
            );
    }

    normalized =
        normalized.replace(
            /([+-]\d{2})$/,
            "$1:00"
        );

    return normalized;
}

function formatDateTime(
    value: string
) {
    if (!value) {
        return "—";
    }

    const normalized =
        normalizeDateValue(
            value
        );

    const date =
        new Date(
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
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",

            hour12:
                true,
        }
    ).format(
        date
    );
}

/* ======================================================
   APPROVAL STATUS
====================================================== */

function ApprovalBadge({
    item,
}: {
    item: RequisitionItem;
}) {
    if (
        item.approved_val ===
        1
    ) {
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3 shrink-0" />

                Petty Cash (Approved)
            </span>
        );
    }

    if (
        item.approved_val ===
        3
    ) {
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-sky-600 dark:text-sky-400">
                <CheckCircle2 className="h-3 w-3 shrink-0" />

                PR (Approved)
            </span>
        );
    }

    if (
        item.approved_val ===
        2
    ) {
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-red-600 dark:text-red-400">
                <XCircle className="h-3 w-3 shrink-0" />

                Rejected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-amber-600 dark:text-amber-400">
            <Clock3 className="h-3 w-3 shrink-0" />

            Approval Pending
        </span>
    );
}

/* ======================================================
   DELIVERY STATUS
====================================================== */

function DeliveryBadge({
    item,
}: {
    item: RequisitionItem;
}) {
    if (
        item.delivered_val ===
        1
    ) {
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3 shrink-0" />

                Delivered
            </span>
        );
    }

    if (
        item.delivered_val ===
        2
    ) {
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-red-600 dark:text-red-400">
                <XCircle className="h-3 w-3 shrink-0" />

                Rejected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-amber-600 dark:text-amber-400">
            <Clock3 className="h-3 w-3 shrink-0" />

            Pending
        </span>
    );
}

/* ======================================================
   DETAIL FIELD
====================================================== */

function DetailField({
    label,
    value,
}: {
    label: string;

    value:
    | string
    | number
    | null
    | undefined;
}) {
    const displayValue =
        value === null ||
            value === undefined ||
            value === ""
            ? "—"
            : String(
                value
            );

    return (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 break-words text-[11px] font-medium text-foreground">
                {
                    displayValue
                }
            </p>
        </div>
    );
}

/* ======================================================
   DETAILS MODAL
====================================================== */

function RequisitionDetailsModal({
    item,
    onClose,
}: {
    item:
    | RequisitionItem
    | null;

    onClose:
    () => void;
}) {
    if (!item) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
                {/* Header */}

                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-primary">
                            IT Accessories Requisition
                        </p>

                        <h2 className="mt-1 text-sm font-semibold text-foreground">
                            {
                                item.tt_no
                            }
                        </h2>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                            Complete requisition information
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-label="Close"
                        onClick={
                            onClose
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}

                <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-5">
                    {/* Workflow statuses */}

                    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/20 px-3 py-2">
                        <div>
                            <p className="mb-1 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Approval
                            </p>

                            <ApprovalBadge
                                item={
                                    item
                                }
                            />
                        </div>

                        <div className="h-8 w-px bg-border" />

                        <div>
                            <p className="mb-1 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Delivery
                            </p>

                            <DeliveryBadge
                                item={
                                    item
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailField
                            label="TT No"
                            value={
                                item.tt_no
                            }
                        />

                        <DetailField
                            label="Submitted Date"
                            value={
                                formatDateTime(
                                    item.created_at
                                )
                            }
                        />

                        <DetailField
                            label="Category"
                            value={
                                item.category
                            }
                        />

                        <DetailField
                            label="Device Serial"
                            value={
                                item.device_sl_no
                            }
                        />

                        <DetailField
                            label="User Employee ID"
                            value={
                                item.employee_id
                            }
                        />

                        <DetailField
                            label="User Name"
                            value={
                                item.employee_name
                            }
                        />

                        <DetailField
                            label="Raised By ID"
                            value={
                                item.created_by
                            }
                        />

                        <DetailField
                            label="Raised By"
                            value={
                                item.created_by_name
                            }
                        />

                        <DetailField
                            label="Approval Status"
                            value={
                                item.approval_status
                            }
                        />

                        <DetailField
                            label="Approved / Rejected By ID"
                            value={
                                item.approved_by
                            }
                        />

                        <DetailField
                            label="Approved / Rejected By"
                            value={
                                item.approved_by_name
                            }
                        />

                        <DetailField
                            label="Approved / Rejected Date"
                            value={
                                formatDateTime(
                                    item.approved_date
                                )
                            }
                        />

                        <DetailField
                            label="Delivery Status"
                            value={
                                item.delivery_status
                            }
                        />

                        <DetailField
                            label="Delivered By ID"
                            value={
                                item.delivered_by
                            }
                        />

                        <DetailField
                            label="Delivered By"
                            value={
                                item.delivered_by_name
                            }
                        />

                        <DetailField
                            label="Delivered Date"
                            value={
                                formatDateTime(
                                    item.delivered_date
                                )
                            }
                        />

                        <DetailField
                            label="Device Assigned"
                            value={
                                item.device_assigned_val ===
                                    1
                                    ? "Yes"
                                    : "No"
                            }
                        />

                        <DetailField
                            label="Device Assigned By"
                            value={
                                item.device_assigned_by
                            }
                        />

                        <DetailField
                            label="Device Assigned Date"
                            value={
                                formatDateTime(
                                    item.device_assigned_date
                                )
                            }
                        />
                    </div>

                    {/* Reason is always available in View */}

                    <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Reason / Details
                        </p>

                        <p className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-5 text-foreground">
                            {
                                item.reason_details ||
                                "—"
                            }
                        </p>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px]"
                            onClick={
                                onClose
                            }
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ======================================================
   PAGE CONTENT
====================================================== */

function RequisitionPageContent() {
    const router =
        useRouter();

    const searchParams =
        useSearchParams();

    /* ==================================================
       RESOLVE VIEW
    ================================================== */

    const rawView =
        searchParams.get(
            "view"
        ) ?? "summary";

    const view:
        RequisitionView =
        VALID_VIEWS.includes(
            rawView as
            RequisitionView
        )
            ? (
                rawView as
                RequisitionView
            )
            : "summary";

    const selectedCategory =
        searchParams.get(
            "category"
        ) ?? "";

    const config =
        VIEW_CONFIG[
        view
        ];

    /* ==================================================
       DASHBOARD SUMMARY
    ================================================== */

    const [
        dashboardSummary,
        setDashboardSummary,
    ] =
        useState<RequisitionDashboardSummary>(
            EMPTY_DASHBOARD_SUMMARY
        );

    const [
        dashboardLoading,
        setDashboardLoading,
    ] =
        useState(
            true
        );

    /* ==================================================
       CATEGORY SUMMARY
    ================================================== */

    const [
        categoryRows,
        setCategoryRows,
    ] =
        useState<
            RequisitionCategorySummary[]
        >([]);

    const [
        categoryLoading,
        setCategoryLoading,
    ] =
        useState(
            true
        );

    const [
        categoryError,
        setCategoryError,
    ] =
        useState("");

    const [
        categorySearch,
        setCategorySearch,
    ] =
        useState("");

    /* ==================================================
       LIST
    ================================================== */

    const [
        rows,
        setRows,
    ] =
        useState<
            RequisitionItem[]
        >([]);

    const [
        total,
        setTotal,
    ] =
        useState(
            0
        );

    const [
        page,
        setPage,
    ] =
        useState(
            1
        );

    const [
        loading,
        setLoading,
    ] =
        useState(
            true
        );

    const [
        error,
        setError,
    ] =
        useState("");

    /* ==================================================
       SEARCH / FILTER
    ================================================== */

    const [
        search,
        setSearch,
    ] =
        useState("");

    const deferredSearch =
        useDeferredValue(
            search
        );

    const [
        dateFilters,
        setDateFilters,
    ] =
        useState<DateFilters>({
            fromDate:
                "",

            toDate:
                "",
        });

    const [
        filtersOpen,
        setFiltersOpen,
    ] =
        useState(
            false
        );

    /* ==================================================
       COLUMN VISIBILITY

       Professional defaults:
       Raised By    = visible
       User Details = visible
       Reason       = hidden
    ================================================== */

    const [
        columnsOpen,
        setColumnsOpen,
    ] =
        useState(
            false
        );

    const [
        visibleColumns,
        setVisibleColumns,
    ] =
        useState<VisibleColumns>(
            DEFAULT_VISIBLE_COLUMNS
        );

    /* ==================================================
       MODAL
    ================================================== */

    const [
        selectedItem,
        setSelectedItem,
    ] =
        useState<
            | RequisitionItem
            | null
        >(null);

    /* ==================================================
       LOAD DASHBOARD SUMMARY
    ================================================== */

    useEffect(
        () => {
            let mounted =
                true;

            async function loadDashboardSummary() {
                try {
                    setDashboardLoading(
                        true
                    );

                    const response =
                        await dashboardApi
                            .requisitionDashboardSummary();

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setDashboardSummary({
                        pending_categories:
                            Number(
                                response
                                    .data
                                    ?.pending_categories ??
                                0
                            ),

                        approval_pending:
                            Number(
                                response
                                    .data
                                    ?.approval_pending ??
                                0
                            ),

                        rejected:
                            Number(
                                response
                                    .data
                                    ?.rejected ??
                                0
                            ),

                        approved:
                            Number(
                                response
                                    .data
                                    ?.approved ??
                                0
                            ),

                        total_active:
                            Number(
                                response
                                    .data
                                    ?.total_active ??
                                0
                            ),
                    });
                } catch (
                reason:
                    unknown
                ) {
                    console.error(
                        "Unable to load requisition dashboard summary:",
                        reason
                    );

                    if (
                        mounted
                    ) {
                        setDashboardSummary(
                            EMPTY_DASHBOARD_SUMMARY
                        );
                    }
                } finally {
                    if (
                        mounted
                    ) {
                        setDashboardLoading(
                            false
                        );
                    }
                }
            }

            void loadDashboardSummary();

            return () => {
                mounted =
                    false;
            };
        },
        []
    );

    /* ==================================================
       LOAD CATEGORY SUMMARY
    ================================================== */

    useEffect(
        () => {
            let mounted =
                true;

            async function loadCategorySummary() {
                try {
                    setCategoryLoading(
                        true
                    );

                    setCategoryError(
                        ""
                    );

                    const response =
                        await dashboardApi
                            .requisitionSummary();

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setCategoryRows(
                        response.data ??
                        []
                    );
                } catch (
                reason:
                    unknown
                ) {
                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setCategoryRows(
                        []
                    );

                    setCategoryError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load Requisition Summary"
                    );
                } finally {
                    if (
                        mounted
                    ) {
                        setCategoryLoading(
                            false
                        );
                    }
                }
            }

            void loadCategorySummary();

            return () => {
                mounted =
                    false;
            };
        },
        []
    );

    /* ==================================================
       RESET PAGE
    ================================================== */

    useEffect(
        () => {
            setPage(
                1
            );
        },
        [
            view,
            selectedCategory,
            deferredSearch,
            dateFilters.fromDate,
            dateFilters.toDate,
        ]
    );

    /* ==================================================
       LOAD REQUISITION LIST
    ================================================== */

    useEffect(
        () => {
            if (
                view ===
                "summary"
            ) {
                setRows(
                    []
                );

                setTotal(
                    0
                );

                setLoading(
                    false
                );

                setError(
                    ""
                );

                return;
            }

            const listView:
                RequisitionListView =
                view;

            let mounted =
                true;

            async function loadRequisitions() {
                try {
                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );

                    const response =
                        await dashboardApi
                            .requisitions({
                                view:
                                    listView,

                                category:
                                    selectedCategory ||
                                    undefined,

                                search:
                                    deferredSearch
                                        .trim() ||
                                    undefined,

                                from_date:
                                    dateFilters
                                        .fromDate ||
                                    undefined,

                                to_date:
                                    dateFilters
                                        .toDate ||
                                    undefined,

                                page,

                                limit:
                                    PAGE_SIZE,
                            });

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setRows(
                        response.data ??
                        []
                    );

                    setTotal(
                        Number(
                            response.total ??
                            0
                        )
                    );
                } catch (
                reason:
                    unknown
                ) {
                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setRows(
                        []
                    );

                    setTotal(
                        0
                    );

                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load Requisition records"
                    );
                } finally {
                    if (
                        mounted
                    ) {
                        setLoading(
                            false
                        );
                    }
                }
            }

            void loadRequisitions();

            return () => {
                mounted =
                    false;
            };
        },
        [
            view,
            selectedCategory,
            deferredSearch,
            dateFilters.fromDate,
            dateFilters.toDate,
            page,
        ]
    );

    /* ==================================================
       FILTER CATEGORY SUMMARY
    ================================================== */

    const filteredCategoryRows =
        useMemo(
            () => {
                const value =
                    categorySearch
                        .trim()
                        .toLowerCase();

                if (
                    !value
                ) {
                    return categoryRows;
                }

                return categoryRows.filter(
                    (
                        item
                    ) =>
                        item.category
                            .toLowerCase()
                            .includes(
                                value
                            )
                );
            },
            [
                categoryRows,
                categorySearch,
            ]
        );

    /* ==================================================
       TOTAL PENDING
    ================================================== */

    const totalPendingFromCategories =
        useMemo(
            () =>
                categoryRows.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        Number(
                            item.pending_count ??
                            0
                        ),
                    0
                ),
            [
                categoryRows,
            ]
        );

    /* ==================================================
       PAGINATION
    ================================================== */

    const totalPages =
        Math.max(
            Math.ceil(
                total /
                PAGE_SIZE
            ),
            1
        );

    /* ==================================================
       HEADER COUNT
    ================================================== */

    const currentRecordCount =
        view ===
            "summary"
            ? dashboardSummary
                .pending_categories
            : total;

    const currentRecordLabel =
        view ===
            "summary"
            ? currentRecordCount ===
                1
                ? "Category"
                : "Categories"
            : currentRecordCount ===
                1
                ? "Record"
                : "Records";

    /* ==================================================
       FILTER STATUS
    ================================================== */

    const hasActiveFilters =
        Boolean(
            selectedCategory ||
            search.trim() ||
            dateFilters.fromDate ||
            dateFilters.toDate
        );

    /* ==================================================
       TABLE COLUMN COUNT

       Permanent columns = 12

       Optional:
       Raised By
       User Details
       Reason
    ================================================== */

    const tableColumnCount =
        12 +
        (
            visibleColumns
                .raisedBy
                ? 1
                : 0
        ) +
        (
            visibleColumns
                .userDetails
                ? 1
                : 0
        ) +
        (
            visibleColumns
                .reason
                ? 1
                : 0
        );

    /* ==================================================
       COLUMN ACTIONS
    ================================================== */

    function toggleColumn(
        column:
            OptionalColumn
    ) {
        setVisibleColumns(
            (
                current
            ) => ({
                ...current,

                [column]:
                    !current[
                    column
                    ],
            })
        );
    }

    function resetColumns() {
        setVisibleColumns(
            DEFAULT_VISIBLE_COLUMNS
        );
    }

    /* ==================================================
       CHANGE VIEW
    ================================================== */

    function changeView(
        nextView:
            RequisitionView
    ) {
        setSearch(
            ""
        );

        setDateFilters({
            fromDate:
                "",

            toDate:
                "",
        });

        setFiltersOpen(
            false
        );

        setColumnsOpen(
            false
        );

        setPage(
            1
        );

        router.push(
            `/dashboard/requisitions?view=${nextView}`
        );
    }

    /* ==================================================
       OPEN PENDING CATEGORY
    ================================================== */

    function openPendingCategory(
        category:
            string
    ) {
        setSearch(
            ""
        );

        setDateFilters({
            fromDate:
                "",

            toDate:
                "",
        });

        setPage(
            1
        );

        router.push(
            `/dashboard/requisitions?view=pending&category=${encodeURIComponent(
                category
            )}`
        );
    }

    /* ==================================================
       CLEAR FILTERS
    ================================================== */

    function clearFilters() {
        setSearch(
            ""
        );

        setDateFilters({
            fromDate:
                "",

            toDate:
                "",
        });

        setPage(
            1
        );

        if (
            selectedCategory
        ) {
            router.push(
                `/dashboard/requisitions?view=${view}`
            );
        }
    }

    /* ==================================================
       PAGE UI
    ================================================== */

    return (
        <>
            <div className="space-y-3 p-4">
                {/* ======================================
                    HEADER
                ====================================== */}

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-[10px]"
                            onClick={() =>
                                router.push(
                                    "/dashboard"
                                )
                            }
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />

                            Dashboard
                        </Button>

                        <div>
                            <h1 className="text-sm font-semibold text-foreground">
                                {
                                    config.title
                                }
                            </h1>

                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                {
                                    config.description
                                }
                            </p>
                        </div>
                    </div>

                    <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                        <span className="text-[10px] font-semibold text-primary">
                            {dashboardLoading &&
                                view ===
                                "summary"
                                ? "—"
                                : currentRecordCount.toLocaleString()}{" "}
                            {
                                currentRecordLabel
                            }
                        </span>
                    </div>
                </div>

                {/* ======================================
                    VIEW TABS
                ====================================== */}

                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-2 shadow-sm">
                    {VIEW_OPTIONS.map(
                        (
                            option
                        ) => {
                            const active =
                                view ===
                                option.view;

                            return (
                                <button
                                    key={
                                        option.view
                                    }
                                    type="button"
                                    onClick={() =>
                                        changeView(
                                            option.view
                                        )
                                    }
                                    className={`
                                        rounded-md
                                        border
                                        px-3
                                        py-1.5
                                        text-[10px]
                                        font-medium
                                        transition-all

                                        ${active
                                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }
                                    `}
                                >
                                    {
                                        option.label
                                    }

                                    {!dashboardLoading &&
                                        option.view ===
                                        "pending" && (
                                            <span
                                                className={`
                                                    ml-1.5
                                                    rounded-full
                                                    px-1.5
                                                    py-0.5
                                                    text-[8px]

                                                    ${active
                                                        ? "bg-white/20"
                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                                    }
                                                `}
                                            >
                                                {
                                                    dashboardSummary
                                                        .approval_pending
                                                }
                                            </span>
                                        )}

                                    {!dashboardLoading &&
                                        option.view ===
                                        "rejected" && (
                                            <span
                                                className={`
                                                    ml-1.5
                                                    rounded-full
                                                    px-1.5
                                                    py-0.5
                                                    text-[8px]

                                                    ${active
                                                        ? "bg-white/20"
                                                        : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                                    }
                                                `}
                                            >
                                                {
                                                    dashboardSummary
                                                        .rejected
                                                }
                                            </span>
                                        )}
                                </button>
                            );
                        }
                    )}
                </div>

                {/* ======================================
                    SUMMARY
                ====================================== */}

                {view ===
                    "summary" && (
                        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-[11px] font-semibold text-foreground">
                                        IT Accessories Requisition Pending List
                                    </h2>

                                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                                        Select a category to view its pending requisitions
                                    </p>
                                </div>

                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-900/60 dark:bg-amber-950/20">
                                    <p className="text-[8px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                        Total Pending
                                    </p>

                                    <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                                        {dashboardLoading
                                            ? "—"
                                            : dashboardSummary
                                                .approval_pending
                                                .toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-3 flex max-w-sm items-center gap-2 rounded-lg border border-border bg-background px-2.5">
                                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                                <input
                                    type="text"
                                    value={
                                        categorySearch
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setCategorySearch(
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="Search category..."
                                    className="h-8 w-full bg-transparent text-[10px] outline-none placeholder:text-muted-foreground"
                                />

                                {categorySearch && (
                                    <button
                                        type="button"
                                        aria-label="Clear category search"
                                        onClick={() =>
                                            setCategorySearch(
                                                ""
                                            )
                                        }
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            {categoryLoading ? (
                                <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />

                                    <p className="text-[10px]">
                                        Loading Requisition Summary...
                                    </p>
                                </div>
                            ) : categoryError ? (
                                <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                                    <AlertCircle className="h-6 w-6 text-red-600" />

                                    <p className="text-[11px] font-semibold text-red-700">
                                        Unable to load Requisition Summary
                                    </p>

                                    <p className="text-[10px] text-red-600">
                                        {
                                            categoryError
                                        }
                                    </p>
                                </div>
                            ) : filteredCategoryRows.length ===
                                0 ? (
                                <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                                    <p className="text-[11px] font-semibold text-foreground">
                                        {
                                            VIEW_CONFIG
                                                .summary
                                                .emptyTitle
                                        }
                                    </p>

                                    <p className="mt-1 max-w-md text-[10px] text-muted-foreground">
                                        {categorySearch
                                            ? "No requisition category matches your search."
                                            : VIEW_CONFIG
                                                .summary
                                                .emptyDescription}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-border">
                                    <table className="w-full min-w-[620px] border-collapse text-[10px]">
                                        <thead>
                                            <tr className="border-b border-border bg-cyan-50/70 dark:bg-cyan-950/10">
                                                <th className="w-[55px] px-3 py-2 text-center text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    SL
                                                </th>

                                                <th className="px-3 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Device Category
                                                </th>

                                                <th className="w-[180px] px-3 py-2 text-center text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Pending Requisition
                                                </th>

                                                <th className="w-[90px] px-3 py-2 text-center text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredCategoryRows.map(
                                                (
                                                    item,
                                                    index
                                                ) => (
                                                    <tr
                                                        key={
                                                            item.category
                                                        }
                                                        className="border-b border-border last:border-b-0 hover:bg-muted/30"
                                                    >
                                                        <td className="px-3 py-2 text-center font-medium text-muted-foreground">
                                                            {index +
                                                                1}
                                                        </td>

                                                        <td className="px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openPendingCategory(
                                                                        item.category
                                                                    )
                                                                }
                                                                className="font-semibold text-primary hover:underline"
                                                            >
                                                                {
                                                                    item.category
                                                                }
                                                            </button>
                                                        </td>

                                                        <td className="px-3 py-2 text-center">
                                                            <span className="inline-flex min-w-[34px] justify-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600">
                                                                {item.pending_count.toLocaleString()}
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openPendingCategory(
                                                                        item.category
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2 py-1 text-[9px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                                                            >
                                                                <Eye className="h-3 w-3" />

                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>

                                        <tfoot>
                                            <tr className="border-t border-border bg-muted/30">
                                                <td
                                                    colSpan={
                                                        2
                                                    }
                                                    className="px-3 py-2 text-right text-[8px] font-semibold uppercase tracking-wide text-muted-foreground"
                                                >
                                                    Total Pending
                                                </td>

                                                <td className="px-3 py-2 text-center text-[11px] font-bold text-amber-600">
                                                    {totalPendingFromCategories.toLocaleString()}
                                                </td>

                                                <td />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                {/* ======================================
                    PENDING / REJECTED
                ====================================== */}

                {view !==
                    "summary" && (
                        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                            {/* Toolbar */}

                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                {/* Search */}

                                <div className="flex min-w-[250px] flex-1 items-center gap-2 rounded-lg border border-primary/30 bg-background px-2.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                                    <Search className="h-3.5 w-3.5 shrink-0 text-primary" />

                                    <input
                                        type="text"
                                        value={
                                            search
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSearch(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder="Search TT, employee, category, reason, device serial..."
                                        className="h-8 w-full bg-transparent text-[10px] outline-none placeholder:text-muted-foreground"
                                    />

                                    {search && (
                                        <button
                                            type="button"
                                            aria-label="Clear search"
                                            onClick={() =>
                                                setSearch(
                                                    ""
                                                )
                                            }
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>

                                {/* Filter */}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setFiltersOpen(
                                            (
                                                current
                                            ) =>
                                                !current
                                        );

                                        setColumnsOpen(
                                            false
                                        );
                                    }}
                                    className={`
                                    inline-flex
                                    h-8
                                    items-center
                                    gap-1.5
                                    rounded-lg
                                    border
                                    px-2.5
                                    text-[10px]
                                    font-medium
                                    transition-colors

                                    ${filtersOpen ||
                                            hasActiveFilters
                                            ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }
                                `}
                                >
                                    <Filter className="h-3.5 w-3.5" />

                                    Filter
                                </button>

                                {/* Columns */}

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setColumnsOpen(
                                                (
                                                    current
                                                ) =>
                                                    !current
                                            );

                                            setFiltersOpen(
                                                false
                                            );
                                        }}
                                        className={`
                                        inline-flex
                                        h-8
                                        items-center
                                        gap-1.5
                                        rounded-lg
                                        border
                                        px-2.5
                                        text-[10px]
                                        font-medium
                                        transition-colors

                                        ${columnsOpen
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }
                                    `}
                                    >
                                        <Columns3 className="h-3.5 w-3.5" />

                                        Columns
                                    </button>

                                    {columnsOpen && (
                                        <div className="absolute right-0 top-10 z-50 w-[220px] rounded-xl border border-border bg-popover p-2 shadow-xl">
                                            <div className="border-b border-border px-2 pb-2 pt-1">
                                                <p className="text-[10px] font-semibold text-foreground">
                                                    Show / Hide Columns
                                                </p>

                                                <p className="mt-0.5 text-[8px] text-muted-foreground">
                                                    Customize optional table fields
                                                </p>
                                            </div>

                                            {/* Raised By */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleColumn(
                                                        "raisedBy"
                                                    )
                                                }
                                                className="mt-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[10px] transition-colors hover:bg-muted"
                                            >
                                                <span>
                                                    Raised By
                                                </span>

                                                <span
                                                    className={`
                                                    flex
                                                    h-4
                                                    w-4
                                                    items-center
                                                    justify-center
                                                    rounded
                                                    border

                                                    ${visibleColumns
                                                            .raisedBy
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-border"
                                                        }
                                                `}
                                                >
                                                    {visibleColumns
                                                        .raisedBy && (
                                                            <Check className="h-3 w-3" />
                                                        )}
                                                </span>
                                            </button>

                                            {/* User Details */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleColumn(
                                                        "userDetails"
                                                    )
                                                }
                                                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[10px] transition-colors hover:bg-muted"
                                            >
                                                <span>
                                                    User Details
                                                </span>

                                                <span
                                                    className={`
                                                    flex
                                                    h-4
                                                    w-4
                                                    items-center
                                                    justify-center
                                                    rounded
                                                    border

                                                    ${visibleColumns
                                                            .userDetails
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-border"
                                                        }
                                                `}
                                                >
                                                    {visibleColumns
                                                        .userDetails && (
                                                            <Check className="h-3 w-3" />
                                                        )}
                                                </span>
                                            </button>

                                            {/* Reason */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleColumn(
                                                        "reason"
                                                    )
                                                }
                                                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[10px] transition-colors hover:bg-muted"
                                            >
                                                <span>
                                                    Reason
                                                </span>

                                                <span
                                                    className={`
                                                    flex
                                                    h-4
                                                    w-4
                                                    items-center
                                                    justify-center
                                                    rounded
                                                    border

                                                    ${visibleColumns
                                                            .reason
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-border"
                                                        }
                                                `}
                                                >
                                                    {visibleColumns
                                                        .reason && (
                                                            <Check className="h-3 w-3" />
                                                        )}
                                                </span>
                                            </button>

                                            <div className="mt-1 border-t border-border pt-1">
                                                <button
                                                    type="button"
                                                    onClick={
                                                        resetColumns
                                                    }
                                                    className="w-full rounded-lg px-2 py-1.5 text-left text-[9px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                                >
                                                    Reset Default
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Clear */}

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={
                                            clearFilters
                                        }
                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <RefreshCcw className="h-3.5 w-3.5" />

                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Selected category */}

                            {selectedCategory && (
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className="text-[9px] font-medium text-muted-foreground">
                                        Category:
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[9px] font-semibold text-primary">
                                        {
                                            selectedCategory
                                        }

                                        <button
                                            type="button"
                                            aria-label="Remove category filter"
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/requisitions?view=${view}`
                                                )
                                            }
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </span>
                                </div>
                            )}

                            {/* Filter Panel */}

                            {filtersOpen && (
                                <div className="mb-3 grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
                                    <label className="space-y-1">
                                        <span className="text-[9px] font-semibold text-muted-foreground">
                                            From Date
                                        </span>

                                        <input
                                            type="date"
                                            value={
                                                dateFilters
                                                    .fromDate
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setDateFilters(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,

                                                        fromDate:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-[10px] outline-none focus:border-primary"
                                        />
                                    </label>

                                    <label className="space-y-1">
                                        <span className="text-[9px] font-semibold text-muted-foreground">
                                            To Date
                                        </span>

                                        <input
                                            type="date"
                                            value={
                                                dateFilters
                                                    .toDate
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setDateFilters(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,

                                                        toDate:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-[10px] outline-none focus:border-primary"
                                        />
                                    </label>

                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-full text-[9px] lg:w-auto"
                                            onClick={
                                                clearFilters
                                            }
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Loading */}

                            {loading ? (
                                <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />

                                    <p className="text-[10px]">
                                        Loading{" "}
                                        {
                                            config.title
                                        }
                                        ...
                                    </p>
                                </div>
                            ) : error ? (
                                <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                                    <AlertCircle className="h-6 w-6 text-red-600" />

                                    <p className="text-[11px] font-semibold text-red-700">
                                        Unable to load Requisitions
                                    </p>

                                    <p className="text-[10px] text-red-600">
                                        {
                                            error
                                        }
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* ==================================
                                    REQUISITION TABLE
                                ================================== */}

                                    <div className="overflow-x-auto rounded-lg border border-border">
                                        <table className="w-full min-w-[1900px] border-collapse text-[9px]">
                                            <thead>
                                                <tr className="border-b border-border bg-cyan-50/70 dark:bg-cyan-950/10">
                                                    <th className="w-[42px] px-2 py-2 text-center text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        SL
                                                    </th>

                                                    <th className="w-[145px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        TT No
                                                    </th>

                                                    <th className="w-[135px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Submitted Date
                                                    </th>

                                                    {visibleColumns
                                                        .raisedBy && (
                                                            <th className="w-[145px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                                Raised By
                                                            </th>
                                                        )}

                                                    <th className="w-[125px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Category
                                                    </th>

                                                    <th className="w-[110px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Device SL
                                                    </th>

                                                    {visibleColumns
                                                        .userDetails && (
                                                            <th className="w-[155px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                                User Details
                                                            </th>
                                                        )}

                                                    {visibleColumns
                                                        .reason && (
                                                            <th className="min-w-[240px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                                Reason
                                                            </th>
                                                        )}

                                                    <th className="w-[170px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Approved Status
                                                    </th>

                                                    <th className="w-[150px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Approved By
                                                    </th>

                                                    <th className="w-[135px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Approved Date
                                                    </th>

                                                    <th className="w-[120px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Delivered Status
                                                    </th>

                                                    <th className="w-[150px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Delivered By
                                                    </th>

                                                    <th className="w-[135px] px-2 py-2 text-left text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Delivered Date
                                                    </th>

                                                    <th className="w-[75px] px-2 py-2 text-center text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {rows.length ===
                                                    0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={
                                                                tableColumnCount
                                                            }
                                                            className="px-4 py-12 text-center"
                                                        >
                                                            <p className="text-[11px] font-semibold text-foreground">
                                                                {
                                                                    config.emptyTitle
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-[9px] text-muted-foreground">
                                                                {hasActiveFilters
                                                                    ? "No records match the current search or filter combination."
                                                                    : config.emptyDescription}
                                                            </p>

                                                            {hasActiveFilters && (
                                                                <button
                                                                    type="button"
                                                                    onClick={
                                                                        clearFilters
                                                                    }
                                                                    className="mt-2 text-[9px] font-semibold text-primary hover:underline"
                                                                >
                                                                    Clear filters
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    rows.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    item.id
                                                                }
                                                                className="border-b border-border last:border-b-0 hover:bg-muted/25"
                                                            >
                                                                {/* SL */}

                                                                <td className="px-2 py-2 text-center font-semibold text-foreground">
                                                                    {(page -
                                                                        1) *
                                                                        PAGE_SIZE +
                                                                        index +
                                                                        1}
                                                                </td>

                                                                {/* TT No */}

                                                                <td className="px-2 py-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setSelectedItem(
                                                                                item
                                                                            )
                                                                        }
                                                                        className="w-full rounded border border-violet-200 bg-violet-50 px-1.5 py-1 text-center text-[9px] font-semibold text-violet-600 hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-400"
                                                                    >
                                                                        {
                                                                            item.tt_no
                                                                        }
                                                                    </button>
                                                                </td>

                                                                {/* Submitted Date */}

                                                                <td className="whitespace-nowrap px-2 py-2 text-[9px] text-muted-foreground">
                                                                    {formatDateTime(
                                                                        item.created_at
                                                                    )}
                                                                </td>

                                                                {/* Raised By */}

                                                                {visibleColumns
                                                                    .raisedBy && (
                                                                        <td className="px-2 py-2">
                                                                            <p className="text-[9px] font-medium text-foreground">
                                                                                {item.created_by_name ||
                                                                                    "—"}
                                                                            </p>

                                                                            {item.created_by && (
                                                                                <p className="mt-0.5 text-[8px] text-muted-foreground">
                                                                                    {
                                                                                        item.created_by
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </td>
                                                                    )}

                                                                {/* Category */}

                                                                <td className="px-2 py-2 text-[9px] font-medium text-foreground">
                                                                    {
                                                                        item.category
                                                                    }
                                                                </td>

                                                                {/* Device SL */}

                                                                <td className="px-2 py-2 font-mono text-[8px] text-muted-foreground">
                                                                    {item.device_sl_no ||
                                                                        "—"}
                                                                </td>

                                                                {/* User Details */}

                                                                {visibleColumns
                                                                    .userDetails && (
                                                                        <td className="px-2 py-2">
                                                                            <p className="text-[9px] font-medium text-foreground">
                                                                                {item.employee_id ||
                                                                                    "—"}
                                                                            </p>

                                                                            <p className="mt-0.5 text-[8px] text-muted-foreground">
                                                                                {item.employee_name ||
                                                                                    "—"}
                                                                            </p>
                                                                        </td>
                                                                    )}

                                                                {/* Reason */}

                                                                {visibleColumns
                                                                    .reason && (
                                                                        <td className="px-2 py-2">
                                                                            <p
                                                                                className="line-clamp-2 max-w-[280px] text-[9px] leading-4 text-foreground"
                                                                                title={
                                                                                    item.reason_details
                                                                                }
                                                                            >
                                                                                {item.reason_details ||
                                                                                    "—"}
                                                                            </p>
                                                                        </td>
                                                                    )}

                                                                {/* Approved Status */}

                                                                <td className="px-2 py-2">
                                                                    <ApprovalBadge
                                                                        item={
                                                                            item
                                                                        }
                                                                    />
                                                                </td>

                                                                {/* Approved By */}

                                                                <td className="px-2 py-2">
                                                                    <p className="text-[9px] font-medium text-foreground">
                                                                        {item.approved_by_name ||
                                                                            "—"}
                                                                    </p>

                                                                    {item.approved_by && (
                                                                        <p className="mt-0.5 text-[8px] text-muted-foreground">
                                                                            {
                                                                                item.approved_by
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </td>

                                                                {/* Approved Date */}

                                                                <td className="whitespace-nowrap px-2 py-2 text-[9px] text-muted-foreground">
                                                                    {formatDateTime(
                                                                        item.approved_date
                                                                    )}
                                                                </td>

                                                                {/* Delivered Status */}

                                                                <td className="px-2 py-2">
                                                                    <DeliveryBadge
                                                                        item={
                                                                            item
                                                                        }
                                                                    />
                                                                </td>

                                                                {/* Delivered By */}

                                                                <td className="px-2 py-2">
                                                                    <p className="text-[9px] font-medium text-foreground">
                                                                        {item.delivered_by_name ||
                                                                            "—"}
                                                                    </p>

                                                                    {item.delivered_by && (
                                                                        <p className="mt-0.5 text-[8px] text-muted-foreground">
                                                                            {
                                                                                item.delivered_by
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </td>

                                                                {/* Delivered Date */}

                                                                <td className="whitespace-nowrap px-2 py-2 text-[9px] text-muted-foreground">
                                                                    {formatDateTime(
                                                                        item.delivered_date
                                                                    )}
                                                                </td>

                                                                {/* Action */}

                                                                <td className="px-2 py-2 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setSelectedItem(
                                                                                item
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                                    >
                                                                        <Eye className="h-2.5 w-2.5" />

                                                                        View
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}

                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-[9px] text-muted-foreground">
                                            {total >
                                                0 ? (
                                                <>
                                                    Showing{" "}
                                                    <span className="font-semibold text-foreground">
                                                        {(page -
                                                            1) *
                                                            PAGE_SIZE +
                                                            1}
                                                    </span>{" "}
                                                    to{" "}
                                                    <span className="font-semibold text-foreground">
                                                        {Math.min(
                                                            page *
                                                            PAGE_SIZE,
                                                            total
                                                        )}
                                                    </span>{" "}
                                                    of{" "}
                                                    <span className="font-semibold text-foreground">
                                                        {
                                                            total
                                                        }
                                                    </span>{" "}
                                                    records
                                                </>
                                            ) : (
                                                "0 records"
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-muted-foreground">
                                                Page{" "}
                                                <span className="font-semibold text-foreground">
                                                    {
                                                        page
                                                    }
                                                </span>{" "}
                                                of{" "}
                                                <span className="font-semibold text-foreground">
                                                    {
                                                        totalPages
                                                    }
                                                </span>
                                            </span>

                                            <button
                                                type="button"
                                                disabled={
                                                    page <=
                                                    1
                                                }
                                                onClick={() =>
                                                    setPage(
                                                        (
                                                            current
                                                        ) =>
                                                            Math.max(
                                                                current -
                                                                1,
                                                                1
                                                            )
                                                    )
                                                }
                                                className="inline-flex h-7 items-center gap-1 rounded border border-border px-2 text-[9px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <ChevronLeft className="h-3 w-3" />

                                                Previous
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    page >=
                                                    totalPages
                                                }
                                                onClick={() =>
                                                    setPage(
                                                        (
                                                            current
                                                        ) =>
                                                            Math.min(
                                                                current +
                                                                1,
                                                                totalPages
                                                            )
                                                    )
                                                }
                                                className="inline-flex h-7 items-center gap-1 rounded border border-border px-2 text-[9px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Next

                                                <ChevronRight className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
            </div>

            {/* ======================================
                DETAILS MODAL
            ====================================== */}

            <RequisitionDetailsModal
                item={
                    selectedItem
                }
                onClose={() =>
                    setSelectedItem(
                        null
                    )
                }
            />
        </>
    );
}

/* ======================================================
   PAGE EXPORT
====================================================== */

export default function RequisitionPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[320px] items-center justify-center gap-2 text-[10px] text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" />

                    Loading Requisition page...
                </div>
            }
        >
            <RequisitionPageContent />
        </Suspense>
    );
}