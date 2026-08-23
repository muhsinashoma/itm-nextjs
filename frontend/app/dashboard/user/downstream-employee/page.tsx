// //frontend/app/dashboard/user/downstream-employee/page.tsx

// "use client";

// import {
//     useCallback,
//     useEffect,
//     useMemo,
//     useState,
//     type ReactNode,
// } from "react";

// import Link from "next/link";

// import {
//     usePathname,
//     useRouter,
//     useSearchParams,
// } from "next/navigation";

// import {
//     Building2,
//     Loader2,
//     MonitorSmartphone,
//     Network,
//     RefreshCw,
//     Search,
//     UserRoundCheck,
//     Users,
// } from "lucide-react";

// import {
//     downstreamApi,
//     downstreamEmployeesApi,
//     type DownstreamEmployeeItem,
//     type DownstreamEmployeeScope,
// } from "@/lib/api";

// const PAGE_SIZE = 20;

// export default function DownstreamEmployeePage() {
//     const router = useRouter();
//     const pathname = usePathname();
//     const searchParams = useSearchParams();

//     /* ======================================================
//        URL STATE
//     ====================================================== */

//     const scope =
//         useMemo<DownstreamEmployeeScope>(
//             () => {
//                 const value =
//                     searchParams.get(
//                         "scope"
//                     );

//                 if (
//                     value === "direct" ||
//                     value === "indirect"
//                 ) {
//                     return value;
//                 }

//                 return "all";
//             },
//             [
//                 searchParams,
//             ]
//         );

//     const page =
//         useMemo(
//             () => {
//                 const value =
//                     Number(
//                         searchParams.get(
//                             "page"
//                         ) ?? "1"
//                     );

//                 if (
//                     !Number.isInteger(
//                         value
//                     ) ||
//                     value < 1
//                 ) {
//                     return 1;
//                 }

//                 return value;
//             },
//             [
//                 searchParams,
//             ]
//         );

//     const appliedSearch =
//         useMemo(
//             () =>
//                 searchParams
//                     .get(
//                         "search"
//                     )
//                     ?.trim() ?? "",
//             [
//                 searchParams,
//             ]
//         );

//     /* ======================================================
//        STATE
//     ====================================================== */

//     const [
//         employees,
//         setEmployees,
//     ] =
//         useState<
//             DownstreamEmployeeItem[]
//         >([]);

//     const [
//         total,
//         setTotal,
//     ] =
//         useState(0);

//     const [
//         directTotal,
//         setDirectTotal,
//     ] =
//         useState(0);

//     const [
//         allTotal,
//         setAllTotal,
//     ] =
//         useState(0);

//     const [
//         search,
//         setSearch,
//     ] =
//         useState(
//             appliedSearch
//         );

//     const [
//         loading,
//         setLoading,
//     ] =
//         useState(true);

//     const [
//         summaryLoading,
//         setSummaryLoading,
//     ] =
//         useState(true);

//     const [
//         error,
//         setError,
//     ] =
//         useState("");

//     useEffect(
//         () => {
//             setSearch(
//                 appliedSearch
//             );
//         },
//         [
//             appliedSearch,
//         ]
//     );

//     /* ======================================================
//        LOAD EMPLOYEE LIST
//     ====================================================== */

//     const loadEmployees =
//         useCallback(
//             async () => {
//                 try {
//                     setLoading(
//                         true
//                     );

//                     setError(
//                         ""
//                     );

//                     const response =
//                         await downstreamEmployeesApi.list(
//                             {
//                                 page,
//                                 limit:
//                                     PAGE_SIZE,
//                                 scope,
//                                 search:
//                                     appliedSearch ||
//                                     undefined,
//                             }
//                         );

//                     setEmployees(
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
//                 reason
//                 ) {
//                     setEmployees(
//                         []
//                     );

//                     setTotal(
//                         0
//                     );

//                     setError(
//                         reason instanceof
//                             Error
//                             ? reason.message
//                             : "Unable to load downstream employees."
//                     );
//                 } finally {
//                     setLoading(
//                         false
//                     );
//                 }
//             },
//             [
//                 page,
//                 scope,
//                 appliedSearch,
//             ]
//         );

//     /* ======================================================
//        LOAD SUMMARY
//     ====================================================== */

//     const loadSummary =
//         useCallback(
//             async () => {
//                 try {
//                     setSummaryLoading(
//                         true
//                     );

//                     const response =
//                         await downstreamApi.summary();

//                     setDirectTotal(
//                         Number(
//                             response.data
//                                 .employees
//                                 .direct_employees ??
//                             0
//                         )
//                     );

//                     setAllTotal(
//                         Number(
//                             response.data
//                                 .employees
//                                 .all_employees ??
//                             0
//                         )
//                     );
//                 } catch (
//                 reason
//                 ) {
//                     console.error(
//                         "Failed to load downstream employee summary:",
//                         reason
//                     );

//                     setDirectTotal(
//                         0
//                     );

//                     setAllTotal(
//                         0
//                     );
//                 } finally {
//                     setSummaryLoading(
//                         false
//                     );
//                 }
//             },
//             []
//         );

//     useEffect(
//         () => {
//             void loadEmployees();
//         },
//         [
//             loadEmployees,
//         ]
//     );

//     useEffect(
//         () => {
//             void loadSummary();
//         },
//         [
//             loadSummary,
//         ]
//     );

//     /* ======================================================
//        URL HELPERS
//     ====================================================== */

//     function buildUrl({
//         nextScope = scope,
//         nextPage = page,
//         nextSearch =
//         appliedSearch,
//     }: {
//         nextScope?: DownstreamEmployeeScope;
//         nextPage?: number;
//         nextSearch?: string;
//     }) {
//         const params =
//             new URLSearchParams();

//         params.set(
//             "scope",
//             nextScope
//         );

//         params.set(
//             "page",
//             String(
//                 Math.max(
//                     1,
//                     nextPage
//                 )
//             )
//         );

//         const normalizedSearch =
//             nextSearch.trim();

//         if (
//             normalizedSearch
//         ) {
//             params.set(
//                 "search",
//                 normalizedSearch
//             );
//         }

//         return `${pathname}?${params.toString()}`;
//     }

//     function handleSearch() {
//         router.push(
//             buildUrl(
//                 {
//                     nextPage:
//                         1,
//                     nextSearch:
//                         search,
//                 }
//             )
//         );
//     }

//     function clearSearch() {
//         setSearch(
//             ""
//         );

//         router.push(
//             buildUrl(
//                 {
//                     nextPage:
//                         1,
//                     nextSearch:
//                         "",
//                 }
//             )
//         );
//     }

//     function goToPage(
//         nextPage: number
//     ) {
//         router.push(
//             buildUrl(
//                 {
//                     nextPage,
//                 }
//             )
//         );
//     }

//     async function handleRefresh() {
//         await Promise.all(
//             [
//                 loadEmployees(),
//                 loadSummary(),
//             ]
//         );
//     }

//     /* ======================================================
//        DERIVED
//     ====================================================== */

//     const indirectTotal =
//         Math.max(
//             0,
//             allTotal -
//             directTotal
//         );

//     const totalPages =
//         Math.max(
//             1,
//             Math.ceil(
//                 total /
//                 PAGE_SIZE
//             )
//         );

//     const tableTitle =
//         scope === "direct"
//             ? "Direct Employees"
//             : scope === "indirect"
//                 ? "Indirect Employees"
//                 : "All Downstream Employees";

//     return (
//         <div className="min-w-0 space-y-4 p-1">
//             {/* HEADER */}

//             <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
//                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                     <div className="flex items-center gap-3">
//                         <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
//                             <Users className="h-5 w-5" />
//                         </div>

//                         <div>
//                             <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
//                                 Reporting
//                                 Hierarchy
//                             </p>

//                             <h1 className="text-xl font-bold text-foreground">
//                                 Downstream
//                                 Employees
//                             </h1>

//                             <p className="mt-0.5 text-xs text-muted-foreground">
//                                 Active
//                                 employees
//                                 under your
//                                 reporting
//                                 hierarchy
//                                 with current
//                                 assigned
//                                 device
//                                 counts
//                             </p>
//                         </div>
//                     </div>

//                     <button
//                         type="button"
//                         onClick={() =>
//                             void handleRefresh()
//                         }
//                         disabled={
//                             loading ||
//                             summaryLoading
//                         }
//                         className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
//                     >
//                         <RefreshCw
//                             className={`h-3.5 w-3.5 ${loading ||
//                                 summaryLoading
//                                 ? "animate-spin"
//                                 : ""
//                                 }`}
//                         />

//                         Refresh
//                     </button>
//                 </div>
//             </section>

//             {/* SUMMARY */}

//             <section className="grid gap-3 sm:grid-cols-3">
//                 <SummaryCard
//                     title="All Downstream"
//                     subtitle="Active employees"
//                     value={
//                         allTotal
//                     }
//                     href={buildUrl(
//                         {
//                             nextScope:
//                                 "all",
//                             nextPage:
//                                 1,
//                         }
//                     )}
//                     active={
//                         scope ===
//                         "all"
//                     }
//                     loading={
//                         summaryLoading
//                     }
//                     icon={
//                         <Users className="h-5 w-5" />
//                     }
//                 />

//                 <SummaryCard
//                     title="Direct"
//                     subtitle="Immediate reports"
//                     value={
//                         directTotal
//                     }
//                     href={buildUrl(
//                         {
//                             nextScope:
//                                 "direct",
//                             nextPage:
//                                 1,
//                         }
//                     )}
//                     active={
//                         scope ===
//                         "direct"
//                     }
//                     loading={
//                         summaryLoading
//                     }
//                     icon={
//                         <UserRoundCheck className="h-5 w-5" />
//                     }
//                 />

//                 <SummaryCard
//                     title="Indirect"
//                     subtitle="Extended hierarchy"
//                     value={
//                         indirectTotal
//                     }
//                     href={buildUrl(
//                         {
//                             nextScope:
//                                 "indirect",
//                             nextPage:
//                                 1,
//                         }
//                     )}
//                     active={
//                         scope ===
//                         "indirect"
//                     }
//                     loading={
//                         summaryLoading
//                     }
//                     icon={
//                         <Network className="h-5 w-5" />
//                     }
//                 />
//             </section>

//             {/* LIST */}

//             <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
//                 {/* TOOLBAR */}

//                 <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
//                     <div>
//                         <h2 className="text-sm font-semibold text-foreground">
//                             {
//                                 tableTitle
//                             }
//                         </h2>

//                         <p className="mt-0.5 text-[11px] text-muted-foreground">
//                             {total.toLocaleString()}{" "}
//                             employee
//                             {total ===
//                                 1
//                                 ? ""
//                                 : "s"}{" "}
//                             found
//                         </p>
//                     </div>

//                     <div className="flex w-full lg:w-auto">
//                         <div className="relative flex-1 lg:w-80">
//                             <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

//                             <input
//                                 type="text"
//                                 value={
//                                     search
//                                 }
//                                 onChange={(
//                                     event
//                                 ) =>
//                                     setSearch(
//                                         event
//                                             .target
//                                             .value
//                                     )
//                                 }
//                                 onKeyDown={(
//                                     event
//                                 ) => {
//                                     if (
//                                         event.key ===
//                                         "Enter"
//                                     ) {
//                                         handleSearch();
//                                     }
//                                 }}
//                                 placeholder="Name, ID, department, function..."
//                                 className="h-9 w-full rounded-l-lg border border-r-0 border-border bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary"
//                             />
//                         </div>

//                         <button
//                             type="button"
//                             onClick={
//                                 handleSearch
//                             }
//                             className="h-9 bg-slate-900 px-4 text-xs font-medium text-white hover:bg-slate-800"
//                         >
//                             Search
//                         </button>

//                         {appliedSearch && (
//                             <button
//                                 type="button"
//                                 onClick={
//                                     clearSearch
//                                 }
//                                 className="h-9 rounded-r-lg border border-l-0 border-border bg-background px-3 text-xs text-muted-foreground hover:bg-muted"
//                             >
//                                 Clear
//                             </button>
//                         )}
//                     </div>
//                 </div>

//                 {error && (
//                     <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
//                         {
//                             error
//                         }
//                     </div>
//                 )}

//                 {/* TABLE */}

//                 <div className="overflow-x-auto">
//                     <table className="w-full min-w-[1080px] border-collapse text-left">
//                         <thead>
//                             <tr className="border-b border-border bg-muted/40">
//                                 <Th>
//                                     SL
//                                 </Th>

//                                 <Th>
//                                     Employee
//                                 </Th>

//                                 <Th>
//                                     Relationship
//                                 </Th>

//                                 <Th>
//                                     Department
//                                     /
//                                     Function
//                                 </Th>

//                                 <Th>
//                                     Designation
//                                 </Th>

//                                 <Th align="right">
//                                     Devices
//                                 </Th>
//                             </tr>
//                         </thead>

//                         <tbody>
//                             {loading ? (
//                                 <tr>
//                                     <td
//                                         colSpan={
//                                             6
//                                         }
//                                         className="h-52 text-center"
//                                     >
//                                         <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
//                                             <Loader2 className="h-4 w-4 animate-spin" />

//                                             Loading
//                                             downstream
//                                             employees...
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ) : employees.length ===
//                                 0 ? (
//                                 <tr>
//                                     <td
//                                         colSpan={
//                                             6
//                                         }
//                                         className="h-52 text-center"
//                                     >
//                                         <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />

//                                         <p className="mt-3 text-sm font-semibold text-foreground">
//                                             No
//                                             downstream
//                                             employees
//                                             found
//                                         </p>

//                                         <p className="mt-1 text-xs text-muted-foreground">
//                                             No
//                                             active
//                                             employee
//                                             matches
//                                             this
//                                             scope
//                                             or
//                                             search.
//                                         </p>
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 employees.map(
//                                     (
//                                         employee,
//                                         index
//                                     ) => (
//                                         <tr
//                                             key={
//                                                 employee.employee_id
//                                             }
//                                             className="border-b border-border/70 transition last:border-0 hover:bg-muted/30"
//                                         >
//                                             <Td>
//                                                 {(page -
//                                                     1) *
//                                                     PAGE_SIZE +
//                                                     index +
//                                                     1}
//                                             </Td>

//                                             <Td>
//                                                 <EmployeeCell
//                                                     employee={
//                                                         employee
//                                                     }
//                                                 />
//                                             </Td>

//                                             <Td>
//                                                 <RelationshipBadge
//                                                     relationship={
//                                                         employee.relationship
//                                                     }
//                                                     tier={
//                                                         employee.tier_level
//                                                     }
//                                                 />
//                                             </Td>

//                                             <Td>
//                                                 <div className="min-w-[230px]">
//                                                     <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
//                                                         <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

//                                                         <span>
//                                                             {employee.department ||
//                                                                 "Not available"}
//                                                         </span>
//                                                     </div>

//                                                     <p className="mt-1 pl-5 text-[10px] text-muted-foreground">
//                                                         {employee.sub_function ||
//                                                             employee.work_field ||
//                                                             "Function not available"}
//                                                     </p>
//                                                 </div>
//                                             </Td>

//                                             <Td>
//                                                 <span className="block max-w-[220px] whitespace-normal text-xs text-foreground">
//                                                     {employee.designation ||
//                                                         "—"}
//                                                 </span>
//                                             </Td>

//                                             <Td align="right">
//                                                 <DeviceCountBadge
//                                                     count={
//                                                         employee.device_count
//                                                     }
//                                                 />
//                                             </Td>
//                                         </tr>
//                                     )
//                                 )
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* PAGINATION */}

//                 <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
//                     <div className="text-[11px] text-muted-foreground">
//                         Showing{" "}
//                         {total ===
//                             0
//                             ? 0
//                             : (page -
//                                 1) *
//                             PAGE_SIZE +
//                             1}
//                         {" - "}
//                         {Math.min(
//                             page *
//                             PAGE_SIZE,
//                             total
//                         )}{" "}
//                         of{" "}
//                         {total.toLocaleString()}
//                     </div>

//                     <div className="flex items-center gap-3">
//                         <span className="text-[11px] text-muted-foreground">
//                             Page{" "}
//                             {
//                                 page
//                             }{" "}
//                             of{" "}
//                             {
//                                 totalPages
//                             }
//                         </span>

//                         <div className="flex gap-2">
//                             <button
//                                 type="button"
//                                 disabled={
//                                     page <=
//                                     1 ||
//                                     loading
//                                 }
//                                 onClick={() =>
//                                     goToPage(
//                                         Math.max(
//                                             1,
//                                             page -
//                                             1
//                                         )
//                                     )
//                                 }
//                                 className="h-8 rounded-lg border border-border px-3 text-[11px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
//                             >
//                                 Previous
//                             </button>

//                             <button
//                                 type="button"
//                                 disabled={
//                                     page >=
//                                     totalPages ||
//                                     loading
//                                 }
//                                 onClick={() =>
//                                     goToPage(
//                                         Math.min(
//                                             totalPages,
//                                             page +
//                                             1
//                                         )
//                                     )
//                                 }
//                                 className="h-8 rounded-lg border border-border px-3 text-[11px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
//                             >
//                                 Next
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </section>
//         </div>
//     );
// }

// /* ======================================================
//    SMALL COMPONENTS
// ====================================================== */

// function SummaryCard({
//     title,
//     subtitle,
//     value,
//     icon,
//     href,
//     active,
//     loading,
// }: {
//     title: string;
//     subtitle: string;
//     value: number;
//     icon: ReactNode;
//     href: string;
//     active: boolean;
//     loading: boolean;
// }) {
//     return (
//         <Link
//             href={
//                 href
//             }
//             aria-current={
//                 active
//                     ? "page"
//                     : undefined
//             }
//             className={`group block rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${active
//                 ? "border-primary ring-1 ring-primary/20"
//                 : "border-border"
//                 }`}
//         >
//             <div className="flex items-center justify-between gap-4">
//                 <div>
//                     <p className="text-[11px] font-medium text-muted-foreground">
//                         {
//                             title
//                         }
//                     </p>

//                     <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
//                         {loading
//                             ? "—"
//                             : value.toLocaleString()}
//                     </p>

//                     <p className="mt-1 text-[10px] text-muted-foreground">
//                         {
//                             subtitle
//                         }
//                     </p>
//                 </div>

//                 <div
//                     className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${active
//                         ? "bg-primary/10 text-primary"
//                         : "bg-muted text-muted-foreground group-hover:text-foreground"
//                         }`}
//                 >
//                     {
//                         icon
//                     }
//                 </div>
//             </div>
//         </Link>
//     );
// }

// function EmployeeCell({
//     employee,
// }: {
//     employee: DownstreamEmployeeItem;
// }) {
//     const initials =
//         employee.employee_name
//             .split(/\s+/)
//             .filter(
//                 Boolean
//             )
//             .slice(
//                 0,
//                 2
//             )
//             .map(
//                 (part) =>
//                     part[0]?.toUpperCase() ??
//                     ""
//             )
//             .join("") ||
//         "U";

//     return (
//         <div className="flex min-w-[260px] items-center gap-3">
//             <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">
//                 {
//                     initials
//                 }
//             </div>

//             <div className="min-w-0">
//                 <p className="truncate text-xs font-semibold text-foreground">
//                     {employee.employee_name ||
//                         "Unnamed employee"}
//                 </p>

//                 <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
//                     {employee.employee_id ||
//                         "—"}
//                 </p>
//             </div>
//         </div>
//     );
// }

// function RelationshipBadge({
//     relationship,
//     tier,
// }: {
//     relationship?: string;
//     tier?: number;
// }) {
//     const direct =
//         relationship?.toLowerCase() ===
//         "direct";

//     return (
//         <div className="flex flex-col items-start gap-1">
//             <span
//                 className={
//                     direct
//                         ? "inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-100"
//                         : "inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-100"
//                 }
//             >
//                 {direct
//                     ? "Direct"
//                     : "Indirect"}
//             </span>

//             {tier ? (
//                 <span className="text-[9px] text-muted-foreground">
//                     Tier{" "}
//                     {
//                         tier
//                     }
//                 </span>
//             ) : null}
//         </div>
//     );
// }

// function DeviceCountBadge({
//     count,
// }: {
//     count: number;
// }) {
//     return (
//         <div className="inline-flex min-w-[76px] items-center justify-end gap-2 rounded-lg bg-violet-50 px-2.5 py-1.5 text-violet-700 ring-1 ring-violet-100">
//             <MonitorSmartphone className="h-3.5 w-3.5" />

//             <span className="text-xs font-bold tabular-nums">
//                 {Number(
//                     count ??
//                     0
//                 ).toLocaleString()}
//             </span>
//         </div>
//     );
// }

// function Th({
//     children,
//     align = "left",
// }: {
//     children: ReactNode;
//     align?: "left" | "right";
// }) {
//     return (
//         <th
//             className={`whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ${align ===
//                 "right"
//                 ? "text-right"
//                 : "text-left"
//                 }`}
//         >
//             {
//                 children
//             }
//         </th>
//     );
// }

// function Td({
//     children,
//     align = "left",
// }: {
//     children: ReactNode;
//     align?: "left" | "right";
// }) {
//     return (
//         <td
//             className={`px-4 py-3 text-xs text-muted-foreground ${align ===
//                 "right"
//                 ? "text-right"
//                 : "text-left"
//                 }`}
//         >
//             {
//                 children
//             }
//         </td>
//     );
// }


"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import Link from "next/link";

import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    Building2,
    Loader2,
    MonitorSmartphone,
    Network,
    RefreshCw,
    Search,
    UserRoundCheck,
    Users,
} from "lucide-react";

import {
    downstreamApi,
    downstreamEmployeesApi,
    type DownstreamEmployeeItem,
    type DownstreamEmployeeScope,
} from "@/lib/api";

const PAGE_SIZE = 20;

export default function DownstreamEmployeePage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    /* ======================================================
       URL STATE
    ====================================================== */

    const scope =
        useMemo<DownstreamEmployeeScope>(
            () => {
                const value =
                    searchParams.get(
                        "scope"
                    );

                if (
                    value === "direct" ||
                    value === "indirect"
                ) {
                    return value;
                }

                return "all";
            },
            [
                searchParams,
            ]
        );

    const page =
        useMemo(
            () => {
                const value =
                    Number(
                        searchParams.get(
                            "page"
                        ) ?? "1"
                    );

                if (
                    !Number.isInteger(
                        value
                    ) ||
                    value < 1
                ) {
                    return 1;
                }

                return value;
            },
            [
                searchParams,
            ]
        );

    const appliedSearch =
        useMemo(
            () =>
                searchParams
                    .get(
                        "search"
                    )
                    ?.trim() ?? "",
            [
                searchParams,
            ]
        );

    /* ======================================================
       STATE
    ====================================================== */

    const [
        employees,
        setEmployees,
    ] =
        useState<
            DownstreamEmployeeItem[]
        >([]);

    const [
        total,
        setTotal,
    ] =
        useState(0);

    const [
        directTotal,
        setDirectTotal,
    ] =
        useState(0);

    const [
        allTotal,
        setAllTotal,
    ] =
        useState(0);

    const [
        search,
        setSearch,
    ] =
        useState(
            appliedSearch
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        summaryLoading,
        setSummaryLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");

    useEffect(
        () => {
            setSearch(
                appliedSearch
            );
        },
        [
            appliedSearch,
        ]
    );

    /* ======================================================
       LOAD EMPLOYEE LIST
    ====================================================== */

    const loadEmployees =
        useCallback(
            async () => {
                try {
                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );

                    const response =
                        await downstreamEmployeesApi.list(
                            {
                                page,
                                limit:
                                    PAGE_SIZE,
                                scope,
                                search:
                                    appliedSearch ||
                                    undefined,
                            }
                        );

                    setEmployees(
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
                reason
                ) {
                    setEmployees(
                        []
                    );

                    setTotal(
                        0
                    );

                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load downstream employees."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                page,
                scope,
                appliedSearch,
            ]
        );

    /* ======================================================
       LOAD SUMMARY
    ====================================================== */

    const loadSummary =
        useCallback(
            async () => {
                try {
                    setSummaryLoading(
                        true
                    );

                    const response =
                        await downstreamApi.summary();

                    setDirectTotal(
                        Number(
                            response.data
                                .employees
                                .direct_employees ??
                            0
                        )
                    );

                    setAllTotal(
                        Number(
                            response.data
                                .employees
                                .all_employees ??
                            0
                        )
                    );
                } catch (
                reason
                ) {
                    console.error(
                        "Failed to load downstream employee summary:",
                        reason
                    );

                    setDirectTotal(
                        0
                    );

                    setAllTotal(
                        0
                    );
                } finally {
                    setSummaryLoading(
                        false
                    );
                }
            },
            []
        );

    useEffect(
        () => {
            void loadEmployees();
        },
        [
            loadEmployees,
        ]
    );

    useEffect(
        () => {
            void loadSummary();
        },
        [
            loadSummary,
        ]
    );

    /* ======================================================
       URL HELPERS
    ====================================================== */

    function buildUrl({
        nextScope = scope,
        nextPage = page,
        nextSearch =
        appliedSearch,
    }: {
        nextScope?: DownstreamEmployeeScope;
        nextPage?: number;
        nextSearch?: string;
    }) {
        const params =
            new URLSearchParams();

        params.set(
            "scope",
            nextScope
        );

        params.set(
            "page",
            String(
                Math.max(
                    1,
                    nextPage
                )
            )
        );

        const normalizedSearch =
            nextSearch.trim();

        if (
            normalizedSearch
        ) {
            params.set(
                "search",
                normalizedSearch
            );
        }

        return `${pathname}?${params.toString()}`;
    }

    function handleSearch() {
        router.push(
            buildUrl(
                {
                    nextPage:
                        1,
                    nextSearch:
                        search,
                }
            )
        );
    }

    function clearSearch() {
        setSearch(
            ""
        );

        router.push(
            buildUrl(
                {
                    nextPage:
                        1,
                    nextSearch:
                        "",
                }
            )
        );
    }

    function goToPage(
        nextPage: number
    ) {
        router.push(
            buildUrl(
                {
                    nextPage,
                }
            )
        );
    }

    async function handleRefresh() {
        await Promise.all(
            [
                loadEmployees(),
                loadSummary(),
            ]
        );
    }

    /* ======================================================
       DERIVED
    ====================================================== */

    const indirectTotal =
        Math.max(
            0,
            allTotal -
            directTotal
        );

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                PAGE_SIZE
            )
        );

    const tableTitle =
        scope === "direct"
            ? "Direct Employees"
            : scope === "indirect"
                ? "Indirect Employees"
                : "All Downstream Employees";

    return (
        <div className="min-w-0 space-y-2.5">
            {/* ==================================================
                COMPACT HEADER
            ================================================== */}

            <section className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Users className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Reporting Hierarchy
                            </p>

                            <div className="flex flex-wrap items-baseline gap-x-2">
                                <h1 className="text-lg font-bold text-foreground">
                                    Downstream Employees
                                </h1>

                                <span className="text-[10px] text-muted-foreground">
                                    Active team with assigned device counts
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void handleRefresh()
                        }
                        disabled={
                            loading ||
                            summaryLoading
                        }
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[11px] font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${loading ||
                                    summaryLoading
                                    ? "animate-spin"
                                    : ""
                                }`}
                        />

                        Refresh
                    </button>
                </div>
            </section>

            {/* ==================================================
                COMPACT SUMMARY CARDS
            ================================================== */}

            <section className="grid gap-2 sm:grid-cols-3">
                <SummaryCard
                    title="All Downstream"
                    subtitle="Active employees"
                    value={
                        allTotal
                    }
                    href={buildUrl(
                        {
                            nextScope:
                                "all",
                            nextPage:
                                1,
                        }
                    )}
                    active={
                        scope ===
                        "all"
                    }
                    loading={
                        summaryLoading
                    }
                    icon={
                        <Users className="h-4 w-4" />
                    }
                    tone="blue"
                />

                <SummaryCard
                    title="Direct"
                    subtitle="Immediate reports"
                    value={
                        directTotal
                    }
                    href={buildUrl(
                        {
                            nextScope:
                                "direct",
                            nextPage:
                                1,
                        }
                    )}
                    active={
                        scope ===
                        "direct"
                    }
                    loading={
                        summaryLoading
                    }
                    icon={
                        <UserRoundCheck className="h-4 w-4" />
                    }
                    tone="emerald"
                />

                <SummaryCard
                    title="Indirect"
                    subtitle="Extended hierarchy"
                    value={
                        indirectTotal
                    }
                    href={buildUrl(
                        {
                            nextScope:
                                "indirect",
                            nextPage:
                                1,
                        }
                    )}
                    active={
                        scope ===
                        "indirect"
                    }
                    loading={
                        summaryLoading
                    }
                    icon={
                        <Network className="h-4 w-4" />
                    }
                    tone="violet"
                />
            </section>

            {/* ==================================================
                EMPLOYEE TABLE
                - No inner horizontal scrolling
                - No inner vertical scrolling
                - Fixed column widths keep Devices visible
            ================================================== */}

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {/* TOOLBAR */}

                <div className="flex flex-col gap-2 border-b border-border px-3.5 py-2.5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-foreground">
                                {
                                    tableTitle
                                }
                            </h2>

                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {total.toLocaleString()}
                            </span>
                        </div>

                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Name, ID, department, function, designation and devices
                        </p>
                    </div>

                    <div className="flex w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-72">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                            <input
                                type="text"
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                onKeyDown={(
                                    event
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        handleSearch();
                                    }
                                }}
                                placeholder="Name, ID, department, function..."
                                className="h-8 w-full rounded-l-lg border border-r-0 border-border bg-background pl-9 pr-3 text-[11px] text-foreground outline-none focus:border-primary"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleSearch
                            }
                            className="h-8 rounded-r-lg bg-slate-900 px-4 text-[11px] font-medium text-white hover:bg-slate-800"
                        >
                            Search
                        </button>

                        {appliedSearch && (
                            <button
                                type="button"
                                onClick={
                                    clearSearch
                                }
                                className="ml-1 h-8 rounded-lg border border-border bg-background px-2.5 text-[10px] text-muted-foreground hover:bg-muted"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="border-b border-red-100 bg-red-50 px-3.5 py-2 text-[11px] text-red-700">
                        {
                            error
                        }
                    </div>
                )}

                {/* TABLE */}

                <div className="w-full">
                    <table className="w-full table-fixed border-collapse text-left">
                        <colgroup>
                            <col className="w-[4%]" />
                            <col className="w-[23%]" />
                            <col className="w-[12%]" />
                            <col className="w-[23%]" />
                            <col className="w-[28%]" />
                            <col className="w-[10%]" />
                        </colgroup>

                        <thead>
                            <tr className="border-b border-border bg-slate-50/80">
                                <Th>
                                    SL
                                </Th>

                                <Th>
                                    Employee
                                </Th>

                                <Th>
                                    Relation
                                </Th>

                                <Th>
                                    Department / Function
                                </Th>

                                <Th>
                                    Designation
                                </Th>

                                <Th align="center">
                                    Devices
                                </Th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={
                                            6
                                        }
                                        className="h-36 text-center"
                                    >
                                        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />

                                            Loading employees...
                                        </div>
                                    </td>
                                </tr>
                            ) : employees.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            6
                                        }
                                        className="h-36 text-center"
                                    >
                                        <Users className="mx-auto h-7 w-7 text-muted-foreground/40" />

                                        <p className="mt-2 text-sm font-semibold text-foreground">
                                            No downstream employees found
                                        </p>

                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                            No active employee matches this scope or search.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                employees.map(
                                    (
                                        employee,
                                        index
                                    ) => (
                                        <tr
                                            key={
                                                employee.employee_id
                                            }
                                            className="border-b border-border/60 transition-colors last:border-0 hover:bg-slate-50/70"
                                        >
                                            <Td>
                                                <span className="tabular-nums text-[10px] text-muted-foreground">
                                                    {(page -
                                                        1) *
                                                        PAGE_SIZE +
                                                        index +
                                                        1}
                                                </span>
                                            </Td>

                                            <Td>
                                                <EmployeeCell
                                                    employee={
                                                        employee
                                                    }
                                                />
                                            </Td>

                                            <Td>
                                                <RelationshipBadge
                                                    relationship={
                                                        employee.relationship
                                                    }
                                                    tier={
                                                        employee.tier_level
                                                    }
                                                />
                                            </Td>

                                            <Td>
                                                <DepartmentFunctionCell
                                                    department={
                                                        employee.department
                                                    }
                                                    subFunction={
                                                        employee.sub_function
                                                    }
                                                    workField={
                                                        employee.work_field
                                                    }
                                                />
                                            </Td>

                                            <Td>
                                                <p
                                                    className="line-clamp-2 pr-2 text-[11px] leading-4 text-foreground"
                                                    title={
                                                        employee.designation ||
                                                        ""
                                                    }
                                                >
                                                    {employee.designation ||
                                                        "—"}
                                                </p>
                                            </Td>

                                            <Td align="center">
                                                <DeviceCountBadge
                                                    count={
                                                        employee.device_count
                                                    }
                                                />
                                            </Td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}

                <div className="flex flex-col gap-2 border-t border-border px-3.5 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[10px] text-muted-foreground">
                        Showing{" "}
                        {total ===
                            0
                            ? 0
                            : (page -
                                1) *
                            PAGE_SIZE +
                            1}
                        {"–"}
                        {Math.min(
                            page *
                            PAGE_SIZE,
                            total
                        )}{" "}
                        of{" "}
                        {total.toLocaleString()}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                            Page{" "}
                            {
                                page
                            }{" "}
                            of{" "}
                            {
                                totalPages
                            }
                        </span>

                        <button
                            type="button"
                            disabled={
                                page <=
                                1 ||
                                loading
                            }
                            onClick={() =>
                                goToPage(
                                    Math.max(
                                        1,
                                        page -
                                        1
                                    )
                                )
                            }
                            className="h-7 rounded-md border border-border px-2.5 text-[10px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={
                                page >=
                                totalPages ||
                                loading
                            }
                            onClick={() =>
                                goToPage(
                                    Math.min(
                                        totalPages,
                                        page +
                                        1
                                    )
                                )
                            }
                            className="h-7 rounded-md border border-border px-2.5 text-[10px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ======================================================
   SMALL COMPONENTS
====================================================== */

type SummaryTone =
    | "blue"
    | "emerald"
    | "violet";

function SummaryCard({
    title,
    subtitle,
    value,
    icon,
    href,
    active,
    loading,
    tone,
}: {
    title: string;
    subtitle: string;
    value: number;
    icon: ReactNode;
    href: string;
    active: boolean;
    loading: boolean;
    tone: SummaryTone;
}) {
    const toneClasses: Record<
        SummaryTone,
        {
            card: string;
            icon: string;
            active: string;
            number: string;
        }
    > = {
        blue: {
            card:
                "border-sky-100 bg-sky-50/70 hover:border-sky-200 hover:bg-sky-50",
            icon:
                "bg-sky-100 text-sky-700",
            active:
                "border-sky-400 ring-1 ring-sky-200",
            number:
                "text-sky-950",
        },
        emerald: {
            card:
                "border-emerald-100 bg-emerald-50/70 hover:border-emerald-200 hover:bg-emerald-50",
            icon:
                "bg-emerald-100 text-emerald-700",
            active:
                "border-emerald-400 ring-1 ring-emerald-200",
            number:
                "text-emerald-950",
        },
        violet: {
            card:
                "border-violet-100 bg-violet-50/70 hover:border-violet-200 hover:bg-violet-50",
            icon:
                "bg-violet-100 text-violet-700",
            active:
                "border-violet-400 ring-1 ring-violet-200",
            number:
                "text-violet-950",
        },
    };

    const classes =
        toneClasses[
        tone
        ];

    return (
        <Link
            href={
                href
            }
            aria-current={
                active
                    ? "page"
                    : undefined
            }
            className={`group rounded-xl border px-3 py-2.5 shadow-sm transition-all ${classes.card
                } ${active
                    ? classes.active
                    : ""
                }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold text-muted-foreground">
                        {
                            title
                        }
                    </p>

                    <p
                        className={`mt-0.5 text-xl font-bold tracking-tight ${classes.number
                            }`}
                    >
                        {loading
                            ? "—"
                            : value.toLocaleString()}
                    </p>

                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                        {
                            subtitle
                        }
                    </p>
                </div>

                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${classes.icon
                        }`}
                >
                    {
                        icon
                    }
                </div>
            </div>
        </Link>
    );
}

function EmployeeCell({
    employee,
}: {
    employee: DownstreamEmployeeItem;
}) {
    const initials =
        getEmployeeInitials(
            employee.employee_name,
            employee.employee_id
        );

    return (
        <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 text-[10px] font-bold text-slate-700 shadow-sm">
                {
                    initials
                }
            </div>

            <div className="min-w-0">
                <p
                    className="truncate text-[11px] font-semibold leading-4 text-foreground"
                    title={
                        employee.employee_name ||
                        ""
                    }
                >
                    {employee.employee_name ||
                        "Unnamed employee"}
                </p>

                <p className="truncate text-[9px] font-medium leading-3.5 text-muted-foreground">
                    {employee.employee_id ||
                        "—"}
                </p>
            </div>
        </div>
    );
}

function DepartmentFunctionCell({
    department,
    subFunction,
    workField,
}: {
    department?: string;
    subFunction?: string;
    workField?: string;
}) {
    const functionName =
        subFunction ||
        workField ||
        "Function not available";

    return (
        <div className="min-w-0 pr-2">
            <div className="flex min-w-0 items-center gap-1.5">
                <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />

                <p
                    className="truncate text-[10.5px] font-semibold leading-4 text-foreground"
                    title={
                        department ||
                        ""
                    }
                >
                    {department ||
                        "Not available"}
                </p>
            </div>

            <p
                className="truncate pl-[18px] text-[9px] leading-3.5 text-muted-foreground"
                title={
                    functionName
                }
            >
                {
                    functionName
                }
            </p>
        </div>
    );
}

function RelationshipBadge({
    relationship,
    tier,
}: {
    relationship?: string;
    tier?: number;
}) {
    const direct =
        relationship?.toLowerCase() ===
        "direct";

    return (
        <div className="flex flex-col items-start gap-0.5">
            <span
                className={
                    direct
                        ? "inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 ring-1 ring-blue-100"
                        : "inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-700 ring-1 ring-violet-100"
                }
            >
                {direct
                    ? "Direct"
                    : "Indirect"}
            </span>

            {tier ? (
                <span className="text-[8.5px] leading-3 text-muted-foreground">
                    Tier{" "}
                    {
                        tier
                    }
                </span>
            ) : null}
        </div>
    );
}

function DeviceCountBadge({
    count,
}: {
    count: number;
}) {
    const value =
        Number(
            count ??
            0
        );

    return (
        <div
            className="mx-auto inline-flex min-w-[52px] items-center justify-center gap-1 rounded-lg border border-violet-100 bg-violet-50 px-2 py-1 text-violet-700"
            title={`${value.toLocaleString()} assigned device${value === 1
                    ? ""
                    : "s"
                }`}
        >
            <MonitorSmartphone className="h-3 w-3 shrink-0" />

            <span className="text-[10px] font-bold tabular-nums">
                {value.toLocaleString()}
            </span>
        </div>
    );
}

function getEmployeeInitials(
    name?: string,
    employeeID?: string
): string {
    const normalizedName =
        (
            name ??
            ""
        ).trim();

    /*
     * Backend can fall back to employee_id when no employee
     * master name is available. In that case show "ID"
     * instead of an awkward numeric avatar.
     */
    if (
        !normalizedName ||
        normalizedName ===
        (
            employeeID ??
            ""
        ).trim()
    ) {
        return "ID";
    }

    const words =
        normalizedName
            .split(/\s+/)
            .map(
                (word) =>
                    word.replace(
                        /[^A-Za-zÀ-ÖØ-öø-ÿ]/g,
                        ""
                    )
            )
            .filter(
                Boolean
            );

    if (
        words.length ===
        0
    ) {
        return "ID";
    }

    if (
        words.length ===
        1
    ) {
        const word =
            words[0];

        return (
            (
                word[0] ??
                ""
            ) +
            (
                word[
                word.length -
                1
                ] ??
                ""
            )
        ).toUpperCase();
    }

    const first =
        words[0];

    const last =
        words[
        words.length -
        1
        ];

    return (
        (
            first[0] ??
            ""
        ) +
        (
            last[0] ??
            ""
        )
    ).toUpperCase();
}

function Th({
    children,
    align = "left",
}: {
    children: ReactNode;
    align?: "left" | "center";
}) {
    return (
        <th
            className={`px-2.5 py-2 text-[9px] font-semibold uppercase tracking-[0.04em] text-muted-foreground ${align ===
                    "center"
                    ? "text-center"
                    : "text-left"
                }`}
        >
            {
                children
            }
        </th>
    );
}

function Td({
    children,
    align = "left",
}: {
    children: ReactNode;
    align?: "left" | "center";
}) {
    return (
        <td
            className={`px-2.5 py-2 align-middle ${align ===
                    "center"
                    ? "text-center"
                    : "text-left"
                }`}
        >
            {
                children
            }
        </td>
    );
}
