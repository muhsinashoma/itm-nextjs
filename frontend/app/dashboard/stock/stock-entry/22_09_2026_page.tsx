

// //itm/frontend/app/dashboard/stock/stock-entry/page.tsx
// "use client";

// import {
//     useEffect,
//     useMemo,
//     useRef,
//     useState,
// } from "react";

// import { useRouter } from "next/navigation";

// import {
//     Check,
//     CheckCircle2,
//     ChevronDown,
//     Copy,
//     Database,
//     LoaderCircle,
//     PackageCheck,
//     RefreshCcw,
//     Search,
//     ServerCog,
//     ShieldCheck,
//     TriangleAlert,
//     X,
// } from "lucide-react";

// import {
//     categoryApi,
//     inventoryWorkflowApi,
//     type InventoryCategoryItem,
//     type InventorySpecOptions,
//     type SCMStockImportItem,
//     type SCMStockPreview,
// } from "@/lib/api";

// import {
//     Button,
// } from "@/components/ui/button";

// type MappingRow = SCMStockImportItem & {
//     item_id: string;
//     item_name: string;
//     item_group: string;
//     pr_id: string;
//     vendor_name: string;
//     purchase_date: string;
//     warranty_text: string;
// };

// type SerialConflictInfo = {
//     row: number;
//     serial: string;
//     assetId: number;
//     existingMR: string;
//     stockId: number;
//     status: number;
//     raw: string;
// };

// function parseSerialConflict(message: string): SerialConflictInfo | null {
//     const match = message.match(
//         /row\s+(\d+):\s+serial\s+"([^"]+)"\s+is already registered as Asset #(\d+)\s+under MR\s+(.+?)\s+\(stock #(\d+), status (\d+)\)/i
//     );

//     if (!match) return null;

//     return {
//         row: Number(match[1]),
//         serial: match[2],
//         assetId: Number(match[3]),
//         existingMR: match[4].trim(),
//         stockId: Number(match[5]),
//         status: Number(match[6]),
//         raw: message,
//     };
// }

// const fieldClass =
//     "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-[10px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground";

// const labelClass =
//     "mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground";

// type SearchOption = {
//     value: string;
//     label: string;
// };

// function warrantyEndDate(
//     purchaseDate: string,
//     warrantyMonths: number
// ) {
//     const value = String(purchaseDate ?? "").trim();

//     if (!value || warrantyMonths <= 0) {
//         return "";
//     }

//     const match = value.match(
//         /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/
//     );

//     if (!match) {
//         return "";
//     }

//     const year = Number(match[1]);
//     const month = Number(match[2]) - 1;
//     const day = Number(match[3]);
//     const hour = Number(match[4] ?? 0);
//     const minute = Number(match[5] ?? 0);
//     const second = Number(match[6] ?? 0);

//     const targetMonthIndex =
//         month + warrantyMonths;

//     const targetYear =
//         year + Math.floor(targetMonthIndex / 12);

//     const targetMonth =
//         ((targetMonthIndex % 12) + 12) % 12;

//     const lastDay = new Date(
//         targetYear,
//         targetMonth + 1,
//         0
//     ).getDate();

//     const date = new Date(
//         targetYear,
//         targetMonth,
//         Math.min(day, lastDay),
//         hour,
//         minute,
//         second
//     );

//     const pad = (number: number) =>
//         String(number).padStart(2, "0");

//     return `${date.getFullYear()}-${pad(
//         date.getMonth() + 1
//     )}-${pad(date.getDate())} ${pad(
//         date.getHours()
//     )}:${pad(date.getMinutes())}:${pad(
//         date.getSeconds()
//     )}`;
// }

// function SearchableClearableSelect({
//     value,
//     options,
//     onChange,
//     placeholder,
//     disabled = false,
//     required = false,
//     emptyText = "No matching options",
// }: {
//     value: string;
//     options: SearchOption[];
//     onChange: (value: string) => void;
//     placeholder: string;
//     disabled?: boolean;
//     required?: boolean;
//     emptyText?: string;
// }) {
//     const rootRef = useRef<HTMLDivElement | null>(null);
//     const [open, setOpen] = useState(false);
//     const [query, setQuery] = useState("");

//     const selected = options.find(
//         (option) => option.value === value
//     );

//     const filtered = useMemo(() => {
//         const term = query.trim().toLowerCase();
//         if (!term) return options;

//         return options.filter((option) =>
//             option.label.toLowerCase().includes(term)
//         );
//     }, [options, query]);

//     useEffect(() => {
//         if (!open) return;

//         const onPointerDown = (event: MouseEvent) => {
//             if (
//                 rootRef.current &&
//                 !rootRef.current.contains(
//                     event.target as Node
//                 )
//             ) {
//                 setOpen(false);
//                 setQuery("");
//             }
//         };

//         document.addEventListener(
//             "mousedown",
//             onPointerDown
//         );

//         return () => {
//             document.removeEventListener(
//                 "mousedown",
//                 onPointerDown
//             );
//         };
//     }, [open]);

//     return (
//         <div
//             ref={rootRef}
//             className="relative"
//         >
//             <div
//                 className={`flex h-8 items-center rounded-lg border bg-background transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 ${disabled
//                     ? "cursor-not-allowed bg-muted/40 opacity-70"
//                     : "border-border"
//                     }`}
//             >
//                 <Search className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

//                 <input
//                     type="text"
//                     value={
//                         open
//                             ? query
//                             : selected?.label ?? ""
//                     }
//                     disabled={disabled}
//                     required={required && !value}
//                     placeholder={placeholder}
//                     onFocus={() => {
//                         if (disabled) return;
//                         setOpen(true);
//                         setQuery("");
//                     }}
//                     onChange={(event) => {
//                         setQuery(event.target.value);
//                         setOpen(true);
//                     }}
//                     className="h-full min-w-0 flex-1 bg-transparent px-2 text-[10px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
//                 />

//                 {value && !disabled ? (
//                     <button
//                         type="button"
//                         aria-label="Clear selection"
//                         title="Clear selection"
//                         onMouseDown={(event) =>
//                             event.preventDefault()
//                         }
//                         onClick={() => {
//                             onChange("");
//                             setQuery("");
//                             setOpen(false);
//                         }}
//                         className="mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
//                     >
//                         <X className="h-3.5 w-3.5" />
//                     </button>
//                 ) : null}

//                 <button
//                     type="button"
//                     aria-label="Toggle options"
//                     disabled={disabled}
//                     onMouseDown={(event) =>
//                         event.preventDefault()
//                     }
//                     onClick={() => {
//                         if (disabled) return;
//                         setOpen((current) => !current);
//                         setQuery("");
//                     }}
//                     className="mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none"
//                 >
//                     <ChevronDown
//                         className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""
//                             }`}
//                     />
//                 </button>
//             </div>

//             {open && !disabled && (
//                 <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[150] overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
//                     <div className="max-h-[320px] overflow-y-auto overscroll-contain p-1">
//                         {filtered.length === 0 ? (
//                             <div className="px-2.5 py-3 text-center text-[9px] text-muted-foreground">
//                                 {emptyText}
//                             </div>
//                         ) : (
//                             filtered.map((option) => {
//                                 const active =
//                                     option.value === value;

//                                 return (
//                                     <button
//                                         key={option.value}
//                                         type="button"
//                                         onMouseDown={(event) =>
//                                             event.preventDefault()
//                                         }
//                                         onClick={() => {
//                                             onChange(option.value);
//                                             setOpen(false);
//                                             setQuery("");
//                                         }}
//                                         className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[10px] transition ${active
//                                             ? "bg-primary/10 font-semibold text-primary"
//                                             : "hover:bg-muted"
//                                             }`}
//                                     >
//                                         <span className="min-w-0 truncate">
//                                             {option.label}
//                                         </span>
//                                         {active && (
//                                             <Check className="h-3.5 w-3.5 shrink-0" />
//                                         )}
//                                     </button>
//                                 );
//                             })
//                         )}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// function normalizeType(
//     value: string | null | undefined
// ) {
//     return String(value ?? "")
//         .trim()
//         .toLowerCase();
// }

// function emptyRow(
//     preview: SCMStockPreview,
//     index: number
// ): MappingRow {
//     const item = preview.items[index];

//     return {
//         source_index: item.source_index,
//         serial_number: item.serial_number,

//         category_id: null,
//         brand_id: null,
//         model_id: null,

//         category: "",
//         brand: "",
//         model: "",
//         cpu: "",
//         ram: "",
//         ssd: "",
//         monitor: "",
//         warranty_months:
//             item.warranty_months || 0,
//         device_type:
//             item.item_group
//                 ?.toLowerCase()
//                 .includes("accessor")
//                 ? "IT Accessory"
//                 : "IT Device",
//         remarks: "",

//         item_id: item.item_id,
//         item_name: item.item_name,
//         item_group: item.item_group,
//         pr_id: item.pr_id,
//         vendor_name: item.vendor_name,
//         purchase_date: item.purchase_date,
//         warranty_text: item.warranty_text,
//     };
// }

// export default function StockEntryPage() {
//     const router = useRouter();

//     const [mrNumber, setMRNumber] =
//         useState("");

//     const [preview, setPreview] =
//         useState<SCMStockPreview | null>(
//             null
//         );

//     const [rows, setRows] =
//         useState<MappingRow[]>([]);

//     // Professional default for bulk MR intake:
//     // Row #1 acts as the template for all remaining rows.
//     // Disable this only when one MR contains mixed device types.
//     const [syncFirstRow, setSyncFirstRow] =
//         useState(true);

//     const [masterData, setMasterData] =
//         useState<InventoryCategoryItem[]>(
//             []
//         );

//     const [masterLoading, setMasterLoading] =
//         useState(true);

//     const [specOptions, setSpecOptions] =
//         useState<InventorySpecOptions>({
//             cpu: [],
//             ram: [],
//             ssd: [],
//             monitor: [],
//         });

//     const [loading, setLoading] =
//         useState(false);

//     const [saving, setSaving] =
//         useState(false);

//     const [error, setError] =
//         useState("");

//     const [serialConflict, setSerialConflict] =
//         useState<SerialConflictInfo | null>(null);

//     const [success, setSuccess] =
//         useState("");

//     const requestSequence = useRef(0);
//     const lastLoadedMR = useRef("");

//     /* ======================================================
//        MASTER DATA

//        inventory_categories is the single source for:
//        Category -> Brand -> Model.
//     ====================================================== */

//     useEffect(() => {
//         let mounted = true;

//         async function loadMasterData() {
//             try {
//                 setMasterLoading(true);

//                 const response =
//                     await categoryApi.list();

//                 if (!mounted) return;

//                 setMasterData(
//                     (response.data ?? [])
//                         .filter(
//                             (item) =>
//                                 Number(
//                                     item.status ?? 1
//                                 ) === 1
//                         )
//                         .sort((a, b) =>
//                             String(
//                                 a.category_name ?? ""
//                             ).localeCompare(
//                                 String(
//                                     b.category_name ?? ""
//                                 )
//                             )
//                         )
//                 );
//             } catch {
//                 if (!mounted) return;

//                 setMasterData([]);
//                 setError(
//                     "Unable to load ITM Category / Brand / Model master data."
//                 );
//             } finally {
//                 if (mounted) {
//                     setMasterLoading(false);
//                 }
//             }
//         }

//         void loadMasterData();

//         return () => {
//             mounted = false;
//         };
//     }, []);

//     useEffect(() => {
//         let mounted = true;

//         async function loadSpecOptions() {
//             try {
//                 const response =
//                     await inventoryWorkflowApi.specOptions();

//                 if (!mounted) return;

//                 setSpecOptions({
//                     cpu: response.data?.cpu ?? [],
//                     ram: response.data?.ram ?? [],
//                     ssd: response.data?.ssd ?? [],
//                     monitor:
//                         response.data?.monitor ?? [],
//                 });
//             } catch {
//                 if (!mounted) return;

//                 // Optional specification fields should not block
//                 // SCM stock intake if the option catalogue fails.
//                 setSpecOptions({
//                     cpu: [],
//                     ram: [],
//                     ssd: [],
//                     monitor: [],
//                 });
//             }
//         }

//         void loadSpecOptions();

//         return () => {
//             mounted = false;
//         };
//     }, []);

//     const categories = useMemo(
//         () =>
//             masterData.filter(
//                 (item) =>
//                     normalizeType(item.type) ===
//                     "category" &&
//                     Number(item.parent_id ?? 0) ===
//                     0
//             ),
//         [masterData]
//     );

//     function brandsFor(
//         categoryID: number | null | undefined
//     ) {
//         if (!categoryID) return [];

//         return masterData.filter(
//             (item) =>
//                 normalizeType(item.type) ===
//                 "brand" &&
//                 Number(item.parent_id ?? 0) ===
//                 Number(categoryID)
//         );
//     }

//     function modelsFor(
//         brandID: number | null | undefined
//     ) {
//         if (!brandID) return [];

//         return masterData.filter(
//             (item) =>
//                 normalizeType(item.type) ===
//                 "model" &&
//                 Number(item.parent_id ?? 0) ===
//                 Number(brandID)
//         );
//     }

//     function isRowComplete(
//         row: MappingRow
//     ) {
//         return Boolean(
//             row.category_id &&
//             row.brand_id &&
//             row.model_id &&
//             Number(row.warranty_months ?? 0) > 0
//         );
//     }

//     const completeRows = rows.filter((row) =>
//         isRowComplete(row)
//     ).length;

//     /* ======================================================
//        SCM AJAX-LIKE MR PREVIEW

//        No Load button is required.  A pasted/typed MR is
//        fetched automatically after a short debounce.
//     ====================================================== */

//     async function loadMR(
//         mrInput: string,
//         force = false
//     ) {
//         const mr = mrInput.trim();

//         if (!mr) {
//             return;
//         }

//         if (
//             !force &&
//             lastLoadedMR.current === mr
//         ) {
//             return;
//         }

//         const sequence =
//             ++requestSequence.current;

//         try {
//             setLoading(true);
//             setError("");
//             setSerialConflict(null);
//             setSuccess("");

//             const response =
//                 await inventoryWorkflowApi
//                     .previewMR(mr);

//             if (
//                 sequence !==
//                 requestSequence.current
//             ) {
//                 return;
//             }

//             const data = response.data;

//             lastLoadedMR.current =
//                 data.mr_id || mr;

//             setPreview(data);
//             setMRNumber(data.mr_id || mr);
//             setRows(
//                 data.items.map(
//                     (_, index) =>
//                         emptyRow(
//                             data,
//                             index
//                         )
//                 )
//             );
//         } catch (reason) {
//             if (
//                 sequence !==
//                 requestSequence.current
//             ) {
//                 return;
//             }

//             lastLoadedMR.current = "";
//             setPreview(null);
//             setRows([]);
//             setError(
//                 reason instanceof Error
//                     ? reason.message
//                     : "Unable to load SCM MR data."
//             );
//         } finally {
//             if (
//                 sequence ===
//                 requestSequence.current
//             ) {
//                 setLoading(false);
//             }
//         }
//     }

//     useEffect(() => {
//         const mr = mrNumber.trim();

//         if (!mr) {
//             requestSequence.current++;
//             lastLoadedMR.current = "";
//             setLoading(false);
//             setPreview(null);
//             setRows([]);
//             setError("");
//             setSuccess("");
//             return;
//         }

//         // Prevent SCM calls while the operator has only
//         // typed the first few characters of an MR.
//         if (mr.length < 10) {
//             return;
//         }

//         if (
//             lastLoadedMR.current === mr
//         ) {
//             return;
//         }

//         const timer =
//             window.setTimeout(() => {
//                 void loadMR(mr);
//             }, 650);

//         return () => {
//             window.clearTimeout(timer);
//         };
//     }, [mrNumber]);

//     function clearMR() {
//         requestSequence.current++;
//         lastLoadedMR.current = "";
//         setMRNumber("");
//         setPreview(null);
//         setRows([]);
//         setLoading(false);
//         setError("");
//         setSerialConflict(null);
//         setSuccess("");
//     }

//     const categorySelectOptions: SearchOption[] =
//         categories.map((item) => ({
//             value: String(item.id),
//             label: String(item.category_name ?? ""),
//         }));

//     const cpuSelectOptions: SearchOption[] =
//         specOptions.cpu.map((value) => ({
//             value,
//             label: value,
//         }));

//     const ramSelectOptions: SearchOption[] =
//         specOptions.ram.map((value) => ({
//             value,
//             label: value,
//         }));

//     const ssdSelectOptions: SearchOption[] =
//         specOptions.ssd.map((value) => ({
//             value,
//             label: value,
//         }));

//     const monitorSelectOptions: SearchOption[] =
//         specOptions.monitor.map((value) => ({
//             value,
//             label: value,
//         }));

//     const warrantySelectOptions: SearchOption[] = [
//         { value: "3", label: "3 Months" },
//         { value: "6", label: "6 Months" },
//         { value: "12", label: "1 Year" },
//         { value: "24", label: "2 Years" },
//         { value: "36", label: "3 Years" },
//         { value: "48", label: "4 Years" },
//         { value: "60", label: "5 Years" },
//         { value: "72", label: "6 Years" },
//         { value: "84", label: "7 Years" },
//         { value: "96", label: "8 Years" },
//         { value: "108", label: "9 Years" },
//         { value: "120", label: "10 Years" },
//     ];

//     /* ======================================================
//        CLASSIFICATION
//     ====================================================== */

//     function updateRow(
//         index: number,
//         patch: Partial<MappingRow>
//     ) {
//         setRows((current) =>
//             current.map((row, rowIndex) =>
//                 rowIndex === index
//                     ? {
//                         ...row,
//                         ...patch,
//                     }
//                     : row
//             )
//         );
//     }

//     function updateClassification(
//         index: number,
//         patch: Partial<MappingRow>
//     ) {
//         setRows((current) =>
//             current.map((row, rowIndex) => {
//                 const shouldSync =
//                     syncFirstRow &&
//                     index === 0;

//                 if (
//                     rowIndex !== index &&
//                     !shouldSync
//                 ) {
//                     return row;
//                 }

//                 return {
//                     ...row,
//                     ...patch,
//                 };
//             })
//         );
//     }

//     function selectCategory(
//         index: number,
//         categoryID: number
//     ) {
//         const selected =
//             categories.find(
//                 (item) =>
//                     item.id === categoryID
//             );

//         updateClassification(index, {
//             category_id:
//                 selected?.id ?? null,
//             category:
//                 selected?.category_name ?? "",

//             // A parent change invalidates Brand + Model.
//             brand_id: null,
//             brand: "",
//             model_id: null,
//             model: "",
//         });
//     }

//     function selectBrand(
//         index: number,
//         brandID: number
//     ) {
//         const selected =
//             masterData.find(
//                 (item) =>
//                     item.id === brandID
//             );

//         updateClassification(index, {
//             brand_id:
//                 selected?.id ?? null,
//             brand:
//                 selected?.category_name ?? "",
//             model_id: null,
//             model: "",
//         });
//     }

//     function selectModel(
//         index: number,
//         modelID: number
//     ) {
//         const selected =
//             masterData.find(
//                 (item) =>
//                     item.id === modelID
//             );

//         updateClassification(index, {
//             model_id:
//                 selected?.id ?? null,
//             model:
//                 selected?.category_name ?? "",
//         });
//     }

//     /* ======================================================
//        FINAL DATABASE COMMIT
//     ====================================================== */

//     async function importStock() {
//         if (!preview) return;

//         const incomplete =
//             rows.findIndex(
//                 (row) =>
//                     !isRowComplete(row)
//             );

//         if (incomplete >= 0) {
//             setError(
//                 `Complete Category / Brand / Model / Warranty for row ${incomplete + 1
//                 } before importing.`
//             );
//             return;
//         }

//         try {
//             setSaving(true);
//             setError("");
//             setSerialConflict(null);
//             setSuccess("");

//             const response =
//                 await inventoryWorkflowApi
//                     .importMR(
//                         preview.mr_id,
//                         rows.map((row) => ({
//                             source_index:
//                                 row.source_index,
//                             serial_number:
//                                 row.serial_number,

//                             category_id:
//                                 row.category_id,
//                             brand_id:
//                                 row.brand_id,
//                             model_id:
//                                 row.model_id,

//                             // Names remain for backwards compatibility;
//                             // backend IDs are the canonical validation path.
//                             category:
//                                 row.category.trim(),
//                             brand:
//                                 row.brand?.trim(),
//                             model:
//                                 row.model?.trim(),
//                             cpu:
//                                 row.cpu?.trim(),
//                             ram:
//                                 row.ram?.trim(),
//                             ssd:
//                                 row.ssd?.trim(),
//                             monitor:
//                                 row.monitor?.trim(),
//                             warranty_months:
//                                 Number(
//                                     row.warranty_months ??
//                                     0
//                                 ),
//                             device_type:
//                                 row.device_type,
//                             remarks:
//                                 row.remarks?.trim(),
//                         }))
//                     );

//             const importResult = response.data as typeof response.data & {
//                 received?: number;
//                 stock_rows_committed?: number;
//                 asset_created?: number;
//                 asset_synchronized?: number;
//                 asset_normalized_available?: number;
//                 conflicted?: number;
//                 conflicts?: Array<{
//                     row?: number;
//                     serial?: string;
//                     asset_id?: number;
//                     existing_mr?: string;
//                     stock_id?: number;
//                     asset_status?: number;
//                 }>;
//             };

//             const conflicted = Number(importResult.conflicted ?? 0);
//             const assetCreated = Number(importResult.asset_created ?? importResult.imported ?? 0);
//             const assetSynchronized = Number(importResult.asset_synchronized ?? 0);
//             const assetNormalizedAvailable = Number(importResult.asset_normalized_available ?? 0);
//             const stockCommitted = Number(
//                 importResult.stock_rows_committed ??
//                 (Number(importResult.imported ?? 0) + Number(importResult.updated ?? 0))
//             );
//             const firstConflict = importResult.conflicts?.[0];

//             setSuccess(
//                 conflicted > 0
//                     ? `Import completed with warning: ${stockCommitted} stock row(s) committed, ${assetCreated} new asset(s) created, ${conflicted} serial conflict(s) kept pending verification. Opening Device Operations...`
//                     : `Import completed: ${stockCommitted} stock row(s) committed, ${assetCreated} new asset(s), ${assetSynchronized} existing asset(s) synchronized${assetNormalizedAvailable > 0 ? `, ${assetNormalizedAvailable} normalized to Available` : ""}. Opening Device Operations...`
//             );

//             const destination =
//                 `/dashboard/assets/devices?import=success&mr=${encodeURIComponent(
//                     preview.mr_id
//                 )}&imported=${encodeURIComponent(
//                     String(response.data.imported ?? 0)
//                 )}&updated=${encodeURIComponent(
//                     String(response.data.updated ?? 0)
//                 )}&stock_committed=${encodeURIComponent(
//                     String(stockCommitted)
//                 )}&assets_created=${encodeURIComponent(
//                     String(assetCreated)
//                 )}&assets_synchronized=${encodeURIComponent(
//                     String(assetSynchronized)
//                 )}&normalized_available=${encodeURIComponent(
//                     String(assetNormalizedAvailable)
//                 )}&conflicted=${encodeURIComponent(
//                     String(conflicted)
//                 )}&conflict_asset_id=${encodeURIComponent(
//                     String(firstConflict?.asset_id ?? "")
//                 )}&conflict_serial=${encodeURIComponent(
//                     String(firstConflict?.serial ?? "")
//                 )}`;

//             // The stock transaction has already committed successfully.
//             // Replace avoids returning to a stale form that could be submitted again.
//             router.replace(destination);
//         } catch (reason) {
//             const message =
//                 reason instanceof Error
//                     ? reason.message
//                     : "Unable to import stock.";

//             const conflict =
//                 parseSerialConflict(message);

//             if (conflict) {
//                 setSerialConflict(conflict);
//                 setError("");
//             } else {
//                 setSerialConflict(null);
//                 setError(message);
//             }
//         } finally {
//             setSaving(false);
//         }
//     }

//     return (
//         <div className="space-y-4 p-4 sm:p-6">
//             <div className="rounded-2xl border border-border bg-card shadow-sm">
//                 <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
//                     <div className="flex items-start gap-3">
//                         <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
//                             <ServerCog className="h-5 w-5 text-primary" />
//                         </div>

//                         <div>
//                             <h1 className="text-sm font-semibold text-foreground">
//                                 SCM Stock Intake
//                             </h1>

//                             <p className="mt-1 max-w-2xl text-[10px] leading-5 text-muted-foreground">
//                                 Enter an approved Material Requisition. SCM data loads automatically; classify each received item with ITM master data, then commit the stock once.
//                             </p>
//                         </div>
//                     </div>

//                     <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400">
//                         <ShieldCheck className="h-3.5 w-3.5" />
//                         Server-side SCM integration
//                     </div>
//                 </div>

//                 <div className="p-5">
//                     <label className="block">
//                         <span className={labelClass}>
//                             Material Requisition (MR)
//                         </span>

//                         <div className="flex h-10 items-center rounded-lg border border-border bg-background px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
//                             <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />

//                             <input
//                                 value={mrNumber}
//                                 onChange={(event) => {
//                                     setMRNumber(
//                                         event.target.value
//                                     );
//                                     setSuccess("");
//                                 }}
//                                 placeholder="Enter / paste MR number — SCM will load automatically"
//                                 className="h-full min-w-0 flex-1 bg-transparent text-[10px] outline-none"
//                                 autoComplete="off"
//                             />

//                             {loading && (
//                                 <div className="mr-2 flex items-center gap-1.5 whitespace-nowrap text-[8px] font-medium text-primary">
//                                     <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
//                                     Loading SCM...
//                                 </div>
//                             )}

//                             {!loading &&
//                                 preview && (
//                                     <div className="mr-2 hidden items-center gap-1.5 whitespace-nowrap text-[8px] font-semibold text-emerald-600 sm:flex">
//                                         <CheckCircle2 className="h-3.5 w-3.5" />
//                                         {preview.items.length} item(s) loaded
//                                     </div>
//                                 )}

//                             {mrNumber && (
//                                 <button
//                                     type="button"
//                                     aria-label="Clear MR"
//                                     onClick={clearMR}
//                                     className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
//                                 >
//                                     <X className="h-3.5 w-3.5" />
//                                 </button>
//                             )}
//                         </div>
//                     </label>

//                     {serialConflict && (
//                         <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200">
//                             <div className="flex items-start gap-2.5">
//                                 <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

//                                 <div className="min-w-0 flex-1">
//                                     <p className="text-[10px] font-bold">
//                                         Duplicate device serial blocked safely
//                                     </p>
//                                     <p className="mt-1 text-[9px] leading-5">
//                                         Row {serialConflict.row} · Serial <span className="font-mono font-bold">{serialConflict.serial}</span> is already registered as <span className="font-semibold">Asset #{serialConflict.assetId}</span>.
//                                     </p>

//                                     <div className="mt-2 grid gap-2 sm:grid-cols-3">
//                                         <div className="rounded-lg border border-amber-200 bg-white/70 px-2.5 py-2 dark:border-amber-900/60 dark:bg-black/10">
//                                             <p className="text-[7px] font-semibold uppercase tracking-wide opacity-70">Existing MR</p>
//                                             <p className="mt-1 break-all text-[8px] font-semibold">{serialConflict.existingMR || "—"}</p>
//                                         </div>
//                                         <div className="rounded-lg border border-amber-200 bg-white/70 px-2.5 py-2 dark:border-amber-900/60 dark:bg-black/10">
//                                             <p className="text-[7px] font-semibold uppercase tracking-wide opacity-70">Existing Stock</p>
//                                             <p className="mt-1 text-[8px] font-semibold">#{serialConflict.stockId}</p>
//                                         </div>
//                                         <div className="rounded-lg border border-amber-200 bg-white/70 px-2.5 py-2 dark:border-amber-900/60 dark:bg-black/10">
//                                             <p className="text-[7px] font-semibold uppercase tracking-wide opacity-70">Asset Status Code</p>
//                                             <p className="mt-1 text-[8px] font-semibold">{serialConflict.status}</p>
//                                         </div>
//                                     </div>

//                                     <p className="mt-2 text-[8px] leading-4 opacity-90">
//                                         No duplicate asset was created. Verify the physical device / SCM serial and correct SCM if this is a different device. Do not remove the unique serial constraint.
//                                     </p>

//                                     <div className="mt-2 flex flex-wrap gap-2">
//                                         <button
//                                             type="button"
//                                             onClick={() =>
//                                                 router.push(
//                                                     `/dashboard/assets/devices/${serialConflict.assetId}`
//                                                 )
//                                             }
//                                             className="inline-flex h-7 items-center rounded-md border border-amber-400 bg-white px-2.5 text-[8px] font-semibold hover:bg-amber-100 dark:bg-transparent dark:hover:bg-amber-950/50"
//                                         >
//                                             View Existing Asset #{serialConflict.assetId}
//                                         </button>

//                                         <button
//                                             type="button"
//                                             disabled={loading || saving}
//                                             onClick={() => {
//                                                 setSerialConflict(null);
//                                                 void loadMR(mrNumber, true);
//                                             }}
//                                             className="inline-flex h-7 items-center gap-1.5 rounded-md border border-amber-400 px-2.5 text-[8px] font-semibold hover:bg-amber-100 disabled:opacity-50 dark:hover:bg-amber-950/50"
//                                         >
//                                             <RefreshCcw className="h-3 w-3" />
//                                             Reload MR after SCM correction
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {error && (
//                         <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
//                             <span>{error}</span>

//                             {mrNumber.trim().length >=
//                                 10 && (
//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             void loadMR(
//                                                 mrNumber,
//                                                 true
//                                             )
//                                         }
//                                         disabled={loading}
//                                         className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-[8px] font-semibold hover:bg-red-100 disabled:opacity-50 dark:border-red-900"
//                                     >
//                                         <RefreshCcw className="h-3 w-3" />
//                                         Retry
//                                     </button>
//                                 )}
//                         </div>
//                     )}

//                     {success && (
//                         <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400">
//                             <CheckCircle2 className="h-4 w-4" />
//                             {success}
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {preview && (
//                 <>
//                     <div className="grid gap-3 sm:grid-cols-3">
//                         <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
//                             <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                 MR Number
//                             </p>
//                             <p className="mt-1 break-all text-[10px] font-semibold text-foreground">
//                                 {preview.mr_id}
//                             </p>
//                         </div>

//                         <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
//                             <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                 SCM Items
//                             </p>
//                             <p className="mt-1 text-lg font-bold text-primary">
//                                 {preview.items.length}
//                             </p>
//                         </div>

//                         <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
//                             <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                 Ready to Import
//                             </p>
//                             <p
//                                 className={`mt-1 text-lg font-bold ${completeRows ===
//                                     rows.length
//                                     ? "text-emerald-600"
//                                     : "text-amber-600"
//                                     }`}
//                             >
//                                 {completeRows}/{rows.length}
//                             </p>
//                         </div>
//                     </div>

//                     <div className="rounded-2xl border border-border bg-card shadow-sm">
//                         <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
//                             <div>
//                                 <h2 className="text-[11px] font-semibold text-foreground">
//                                     SCM Receipt & ITM Classification
//                                 </h2>
//                                 <p className="mt-0.5 text-[8px] text-muted-foreground">
//                                     SCM procurement fields are read-only. Category → Brand → Model comes from the ITM inventory master.
//                                 </p>
//                                 {rows.length > 1 && syncFirstRow && (
//                                     <p className="mt-1 text-[8px] font-medium text-primary">
//                                         Row #1 is the active template: classification and remarks are synchronized to all rows automatically.
//                                     </p>
//                                 )}
//                             </div>

//                             {rows.length > 1 && (
//                                 <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2 text-[8px] font-medium text-foreground">
//                                     <input
//                                         type="checkbox"
//                                         checked={syncFirstRow}
//                                         onChange={(event) =>
//                                             setSyncFirstRow(
//                                                 event.target.checked
//                                             )
//                                         }
//                                         className="h-3.5 w-3.5 accent-primary"
//                                     />
//                                     <Copy className="h-3 w-3 text-primary" />
//                                     <span>
//                                         Auto-apply Row #1 classification to all rows
//                                     </span>
//                                 </label>
//                             )}
//                         </div>

//                         <div className="space-y-3 p-4">
//                             {rows.map((row, index) => {
//                                 const source =
//                                     preview.items[index];

//                                 const brandOptions =
//                                     brandsFor(
//                                         row.category_id
//                                     );

//                                 const modelOptions =
//                                     modelsFor(
//                                         row.brand_id
//                                     );

//                                 const rowReady =
//                                     isRowComplete(row);

//                                 return (
//                                     <div
//                                         key={source.source_index}
//                                         className="relative overflow-visible rounded-xl border border-border"
//                                     >
//                                         <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
//                                             <div className="flex items-center gap-2">
//                                                 <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
//                                                     {index + 1}
//                                                 </span>
//                                                 <div>
//                                                     <p className="text-[10px] font-semibold text-foreground">
//                                                         {source.item_name ||
//                                                             "SCM Item"}
//                                                     </p>
//                                                     <p className="text-[8px] text-muted-foreground">
//                                                         {source.item_group ||
//                                                             "Unclassified group"}
//                                                     </p>
//                                                 </div>
//                                             </div>

//                                             <div className="flex items-center gap-2">
//                                                 <span
//                                                     className={`rounded-md border px-2 py-1 text-[7px] font-semibold ${rowReady
//                                                         ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400"
//                                                         : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-400"
//                                                         }`}
//                                                 >
//                                                     {rowReady
//                                                         ? "Ready"
//                                                         : "Classification required"}
//                                                 </span>

//                                                 <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[8px] text-muted-foreground">
//                                                     {source.serial_number ||
//                                                         "Internal asset tag will be generated"}
//                                                 </span>
//                                             </div>
//                                         </div>

//                                         <div className="grid gap-4 p-4 xl:grid-cols-2">
//                                             <div className="rounded-lg border border-border bg-muted/15 p-3">
//                                                 <div className="mb-3 flex items-center gap-2">
//                                                     <Database className="h-3.5 w-3.5 text-amber-600" />
//                                                     <p className="text-[9px] font-semibold text-foreground">
//                                                         SCM Inventory
//                                                     </p>
//                                                 </div>

//                                                 <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
//                                                     {[
//                                                         [
//                                                             "MR Number",
//                                                             preview.mr_id,
//                                                         ],
//                                                         [
//                                                             "PR Number",
//                                                             source.pr_id,
//                                                         ],
//                                                         [
//                                                             "Vendor Name",
//                                                             source.vendor_name,
//                                                         ],
//                                                         [
//                                                             "Received / GR",
//                                                             source.gr_id,
//                                                         ],
//                                                         [
//                                                             "Serial No.",
//                                                             source.serial_number,
//                                                         ],
//                                                         [
//                                                             "Purchase Date",
//                                                             source.purchase_date,
//                                                         ],
//                                                         [
//                                                             "Item Group",
//                                                             source.item_group,
//                                                         ],
//                                                         [
//                                                             "Item Name",
//                                                             source.item_name,
//                                                         ],
//                                                         [
//                                                             "SCM Warranty",
//                                                             source.warranty_text ||
//                                                             (source.warranty_months
//                                                                 ? `${source.warranty_months} month(s)`
//                                                                 : ""),
//                                                         ],
//                                                     ].map(
//                                                         ([
//                                                             label,
//                                                             value,
//                                                         ]) => (
//                                                             <div
//                                                                 key={label}
//                                                             >
//                                                                 <p className="text-[7px] font-semibold uppercase text-muted-foreground">
//                                                                     {label}
//                                                                 </p>
//                                                                 <p className="mt-1 break-words text-[9px] font-medium text-foreground">
//                                                                     {value ||
//                                                                         "—"}
//                                                                 </p>
//                                                             </div>
//                                                         )
//                                                     )}
//                                                 </div>
//                                             </div>

//                                             <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3">
//                                                 <div className="mb-3 flex items-center justify-between gap-3">
//                                                     <div className="flex items-center gap-2">
//                                                         <PackageCheck className="h-3.5 w-3.5 text-primary" />
//                                                         <p className="text-[9px] font-semibold text-foreground">
//                                                             ITM Classification
//                                                         </p>
//                                                     </div>

//                                                     {masterLoading && (
//                                                         <span className="flex items-center gap-1 text-[7px] text-muted-foreground">
//                                                             <LoaderCircle className="h-3 w-3 animate-spin" />
//                                                             Loading master data
//                                                         </span>
//                                                     )}
//                                                 </div>

//                                                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Category <span className="text-red-500">*</span>
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={
//                                                                 row.category_id
//                                                                     ? String(
//                                                                         row.category_id
//                                                                     )
//                                                                     : ""
//                                                             }
//                                                             options={
//                                                                 categorySelectOptions
//                                                             }
//                                                             disabled={
//                                                                 masterLoading
//                                                             }
//                                                             required
//                                                             placeholder="Search category..."
//                                                             onChange={(value) =>
//                                                                 selectCategory(
//                                                                     index,
//                                                                     Number(
//                                                                         value ||
//                                                                         0
//                                                                     )
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Brand <span className="text-red-500">*</span>
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={
//                                                                 row.brand_id
//                                                                     ? String(
//                                                                         row.brand_id
//                                                                     )
//                                                                     : ""
//                                                             }
//                                                             options={brandOptions.map(
//                                                                 (item) => ({
//                                                                     value: String(
//                                                                         item.id
//                                                                     ),
//                                                                     label: String(
//                                                                         item.category_name ??
//                                                                         ""
//                                                                     ),
//                                                                 })
//                                                             )}
//                                                             disabled={
//                                                                 !row.category_id ||
//                                                                 brandOptions.length ===
//                                                                 0
//                                                             }
//                                                             required
//                                                             placeholder={
//                                                                 row.category_id &&
//                                                                     brandOptions.length ===
//                                                                     0
//                                                                     ? "No active brand under category"
//                                                                     : "Search brand..."
//                                                             }
//                                                             onChange={(value) =>
//                                                                 selectBrand(
//                                                                     index,
//                                                                     Number(
//                                                                         value ||
//                                                                         0
//                                                                     )
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Model <span className="text-red-500">*</span>
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={
//                                                                 row.model_id
//                                                                     ? String(
//                                                                         row.model_id
//                                                                     )
//                                                                     : ""
//                                                             }
//                                                             options={modelOptions.map(
//                                                                 (item) => ({
//                                                                     value: String(
//                                                                         item.id
//                                                                     ),
//                                                                     label: String(
//                                                                         item.category_name ??
//                                                                         ""
//                                                                     ),
//                                                                 })
//                                                             )}
//                                                             disabled={
//                                                                 !row.brand_id ||
//                                                                 modelOptions.length ===
//                                                                 0
//                                                             }
//                                                             required
//                                                             placeholder={
//                                                                 row.brand_id &&
//                                                                     modelOptions.length ===
//                                                                     0
//                                                                     ? "No active model under brand"
//                                                                     : "Search model..."
//                                                             }
//                                                             onChange={(value) =>
//                                                                 selectModel(
//                                                                     index,
//                                                                     Number(
//                                                                         value ||
//                                                                         0
//                                                                     )
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             CPU / Processor
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={row.cpu ?? ""}
//                                                             options={
//                                                                 cpuSelectOptions
//                                                             }
//                                                             placeholder="Search CPU / processor..."
//                                                             emptyText="No CPU options found"
//                                                             onChange={(value) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         cpu: value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             RAM
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={row.ram ?? ""}
//                                                             options={
//                                                                 ramSelectOptions
//                                                             }
//                                                             placeholder="Search RAM..."
//                                                             emptyText="No RAM options found"
//                                                             onChange={(value) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         ram: value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             SSD / HDD
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={row.ssd ?? ""}
//                                                             options={
//                                                                 ssdSelectOptions
//                                                             }
//                                                             placeholder="Search SSD / HDD..."
//                                                             emptyText="No SSD / HDD options found"
//                                                             onChange={(value) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         ssd: value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Monitor
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={row.monitor ?? ""}
//                                                             options={
//                                                                 monitorSelectOptions
//                                                             }
//                                                             placeholder="Search monitor..."
//                                                             emptyText="No monitor options found"
//                                                             onChange={(value) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         monitor: value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Warranty Duration <span className="text-red-500">*</span>
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={
//                                                                 Number(
//                                                                     row.warranty_months ??
//                                                                     0
//                                                                 ) > 0
//                                                                     ? String(
//                                                                         row.warranty_months
//                                                                     )
//                                                                     : ""
//                                                             }
//                                                             options={
//                                                                 warrantySelectOptions
//                                                             }
//                                                             required
//                                                             placeholder="Search warranty..."
//                                                             onChange={(value) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         warranty_months:
//                                                                             Number(
//                                                                                 value ||
//                                                                                 0
//                                                                             ),
//                                                                     }
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Warranty End Date
//                                                         </span>
//                                                         <input
//                                                             type="text"
//                                                             readOnly
//                                                             value={
//                                                                 warrantyEndDate(
//                                                                     source.purchase_date,
//                                                                     Number(
//                                                                         row.warranty_months ??
//                                                                         0
//                                                                     )
//                                                                 )
//                                                             }
//                                                             placeholder="Select warranty duration"
//                                                             className={`${fieldClass} font-mono text-[9px] text-emerald-700 dark:text-emerald-400`}
//                                                         />
//                                                     </div>

//                                                     <label>
//                                                         <span className={labelClass}>
//                                                             Asset Type
//                                                         </span>
//                                                         <select
//                                                             value={
//                                                                 row.device_type
//                                                             }
//                                                             onChange={(event) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         device_type:
//                                                                             event
//                                                                                 .target
//                                                                                 .value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                             className={fieldClass}
//                                                         >
//                                                             <option value="IT Device">
//                                                                 IT Device
//                                                             </option>
//                                                             <option value="IT Accessory">
//                                                                 IT Accessory
//                                                             </option>
//                                                         </select>
//                                                     </label>

//                                                     <label className="sm:col-span-1 lg:col-span-2">
//                                                         <span className={labelClass}>
//                                                             Remarks
//                                                         </span>
//                                                         <input
//                                                             type="text"
//                                                             value={
//                                                                 row.remarks
//                                                             }
//                                                             maxLength={500}
//                                                             onChange={(event) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         remarks:
//                                                                             event
//                                                                                 .target
//                                                                                 .value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                             placeholder="Optional stock / warranty note"
//                                                             className={fieldClass}
//                                                         />
//                                                     </label>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>

//                         <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
//                             <p className="text-[8px] text-muted-foreground">
//                                 Duplicate MR + serial items are synchronized instead of inserted twice. SCM procurement data is revalidated by the backend during import.
//                             </p>

//                             <Button
//                                 type="button"
//                                 size="sm"
//                                 className="h-8 gap-1.5 text-[9px]"
//                                 disabled={
//                                     saving ||
//                                     rows.length === 0 ||
//                                     completeRows !==
//                                     rows.length
//                                 }
//                                 onClick={() =>
//                                     void importStock()
//                                 }
//                             >
//                                 {saving ? (
//                                     <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
//                                 ) : (
//                                     <PackageCheck className="h-3.5 w-3.5" />
//                                 )}
//                                 Import {rows.length} Stock Item
//                                 {rows.length === 1
//                                     ? ""
//                                     : "s"}
//                             </Button>
//                         </div>
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// }









// //itm/frontend/app/dashboard/stock/stock-entry/page.tsx
// "use client";

// import {
//     useEffect,
//     useMemo,
//     useRef,
//     useState,
// } from "react";

// import { useRouter } from "next/navigation";

// import {
//     Check,
//     CheckCircle2,
//     ChevronDown,
//     Copy,
//     Database,
//     LoaderCircle,
//     PackageCheck,
//     RefreshCcw,
//     Search,
//     ServerCog,
//     ShieldCheck,
//     TriangleAlert,
//     X,
// } from "lucide-react";

// import {
//     api,
//     assetDeviceApi,
//     categoryApi,
//     inventoryWorkflowApi,
//     type InventoryCategoryItem,
//     type InventorySpecOptions,
//     type SCMStockImportItem,
//     type SCMStockPreview,
// } from "@/lib/api";

// import {
//     Button,
// } from "@/components/ui/button";

// type MappingRow = SCMStockImportItem & {
//     item_id: string;
//     item_name: string;
//     item_group: string;
//     pr_id: string;
//     vendor_name: string;
//     purchase_date: string;
//     warranty_text: string;
// };

// type SerialConflictInfo = {
//     row: number;
//     serial: string;
//     assetId: number;
//     existingMR: string;
//     stockId: number;
//     status: number;
//     raw: string;
// };


// type StockValidationStatus =
//     | "NEW"
//     | "EXISTING_SAME_MR"
//     | "CONFLICT_OTHER_MR"
//     | "DUPLICATE_IN_PAYLOAD";

// type StockValidationRow = {
//     row_no: number;
//     serial_number: string;
//     asset_ids: number[];
//     stock_ids: number[];
//     existing_mrs: string[];
//     pr_numbers: string[];
//     asset_status: number | null;
//     payload_count: number;
//     validation_status: StockValidationStatus;
//     multiple_mr_warning: boolean;
// };

// type StockValidationData = {
//     mr_number: string;
//     incoming_count: number;
//     unique_row_count: number;
//     new_count: number;
//     existing_same_mr_count: number;
//     conflict_count: number;
//     duplicate_payload_count: number;
//     skipped_count: number;
//     can_import: boolean;
//     rows: StockValidationRow[];
// };

// type StockInventoryValidationItem = {
//     id: number;
//     mr_id?: string | null;
//     pr_id?: string | null;
//     serial_no?: string | null;
// };

// type StockInventoryPage = {
//     success?: boolean;
//     data?: StockInventoryValidationItem[];
//     total?: number;
//     page?: number;
//     page_size?: number;
// };

// function normalizeSerialKey(value: unknown) {
//     return String(value ?? "")
//         .trim()
//         .toUpperCase();
// }

// function uniqueNumbers(values: Array<number | null | undefined>) {
//     return Array.from(
//         new Set(
//             values
//                 .map((value) => Number(value))
//                 .filter((value) => Number.isFinite(value) && value > 0)
//         )
//     );
// }

// function uniqueStrings(values: Array<string | null | undefined>) {
//     return Array.from(
//         new Set(
//             values
//                 .map((value) => String(value ?? "").trim())
//                 .filter(Boolean)
//         )
//     );
// }

// function parseSerialConflict(message: string): SerialConflictInfo | null {
//     const match = message.match(
//         /row\s+(\d+):\s+serial\s+"([^"]+)"\s+is already registered as Asset #(\d+)\s+under MR\s+(.+?)\s+\(stock #(\d+), status (\d+)\)/i
//     );

//     if (!match) return null;

//     return {
//         row: Number(match[1]),
//         serial: match[2],
//         assetId: Number(match[3]),
//         existingMR: match[4].trim(),
//         stockId: Number(match[5]),
//         status: Number(match[6]),
//         raw: message,
//     };
// }

// const fieldClass =
//     "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-[10px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground";

// const labelClass =
//     "mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground";

// type SearchOption = {
//     value: string;
//     label: string;
// };

// function warrantyEndDate(
//     purchaseDate: string,
//     warrantyMonths: number
// ) {
//     const value = String(purchaseDate ?? "").trim();

//     if (!value || warrantyMonths <= 0) {
//         return "";
//     }

//     const match = value.match(
//         /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/
//     );

//     if (!match) {
//         return "";
//     }

//     const year = Number(match[1]);
//     const month = Number(match[2]) - 1;
//     const day = Number(match[3]);
//     const hour = Number(match[4] ?? 0);
//     const minute = Number(match[5] ?? 0);
//     const second = Number(match[6] ?? 0);

//     const targetMonthIndex =
//         month + warrantyMonths;

//     const targetYear =
//         year + Math.floor(targetMonthIndex / 12);

//     const targetMonth =
//         ((targetMonthIndex % 12) + 12) % 12;

//     const lastDay = new Date(
//         targetYear,
//         targetMonth + 1,
//         0
//     ).getDate();

//     const date = new Date(
//         targetYear,
//         targetMonth,
//         Math.min(day, lastDay),
//         hour,
//         minute,
//         second
//     );

//     const pad = (number: number) =>
//         String(number).padStart(2, "0");

//     return `${date.getFullYear()}-${pad(
//         date.getMonth() + 1
//     )}-${pad(date.getDate())} ${pad(
//         date.getHours()
//     )}:${pad(date.getMinutes())}:${pad(
//         date.getSeconds()
//     )}`;
// }

// function SearchableClearableSelect({
//     value,
//     options,
//     onChange,
//     placeholder,
//     disabled = false,
//     required = false,
//     emptyText = "No matching options",
// }: {
//     value: string;
//     options: SearchOption[];
//     onChange: (value: string) => void;
//     placeholder: string;
//     disabled?: boolean;
//     required?: boolean;
//     emptyText?: string;
// }) {
//     const rootRef = useRef<HTMLDivElement | null>(null);
//     const [open, setOpen] = useState(false);
//     const [query, setQuery] = useState("");

//     const selected = options.find(
//         (option) => option.value === value
//     );

//     const filtered = useMemo(() => {
//         const term = query.trim().toLowerCase();
//         if (!term) return options;

//         return options.filter((option) =>
//             option.label.toLowerCase().includes(term)
//         );
//     }, [options, query]);

//     useEffect(() => {
//         if (!open) return;

//         const onPointerDown = (event: MouseEvent) => {
//             if (
//                 rootRef.current &&
//                 !rootRef.current.contains(
//                     event.target as Node
//                 )
//             ) {
//                 setOpen(false);
//                 setQuery("");
//             }
//         };

//         document.addEventListener(
//             "mousedown",
//             onPointerDown
//         );

//         return () => {
//             document.removeEventListener(
//                 "mousedown",
//                 onPointerDown
//             );
//         };
//     }, [open]);

//     return (
//         <div
//             ref={rootRef}
//             className="relative"
//         >
//             <div
//                 className={`flex h-8 items-center rounded-lg border bg-background transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 ${disabled
//                     ? "cursor-not-allowed bg-muted/40 opacity-70"
//                     : "border-border"
//                     }`}
//             >
//                 <Search className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

//                 <input
//                     type="text"
//                     value={
//                         open
//                             ? query
//                             : selected?.label ?? ""
//                     }
//                     disabled={disabled}
//                     required={required && !value}
//                     placeholder={placeholder}
//                     onFocus={() => {
//                         if (disabled) return;
//                         setOpen(true);
//                         setQuery("");
//                     }}
//                     onChange={(event) => {
//                         setQuery(event.target.value);
//                         setOpen(true);
//                     }}
//                     className="h-full min-w-0 flex-1 bg-transparent px-2 text-[10px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
//                 />

//                 {value && !disabled ? (
//                     <button
//                         type="button"
//                         aria-label="Clear selection"
//                         title="Clear selection"
//                         onMouseDown={(event) =>
//                             event.preventDefault()
//                         }
//                         onClick={() => {
//                             onChange("");
//                             setQuery("");
//                             setOpen(false);
//                         }}
//                         className="mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
//                     >
//                         <X className="h-3.5 w-3.5" />
//                     </button>
//                 ) : null}

//                 <button
//                     type="button"
//                     aria-label="Toggle options"
//                     disabled={disabled}
//                     onMouseDown={(event) =>
//                         event.preventDefault()
//                     }
//                     onClick={() => {
//                         if (disabled) return;
//                         setOpen((current) => !current);
//                         setQuery("");
//                     }}
//                     className="mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none"
//                 >
//                     <ChevronDown
//                         className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""
//                             }`}
//                     />
//                 </button>
//             </div>

//             {open && !disabled && (
//                 <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[150] overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
//                     <div className="max-h-[320px] overflow-y-auto overscroll-contain p-1">
//                         {filtered.length === 0 ? (
//                             <div className="px-2.5 py-3 text-center text-[9px] text-muted-foreground">
//                                 {emptyText}
//                             </div>
//                         ) : (
//                             filtered.map((option) => {
//                                 const active =
//                                     option.value === value;

//                                 return (
//                                     <button
//                                         key={option.value}
//                                         type="button"
//                                         onMouseDown={(event) =>
//                                             event.preventDefault()
//                                         }
//                                         onClick={() => {
//                                             onChange(option.value);
//                                             setOpen(false);
//                                             setQuery("");
//                                         }}
//                                         className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[10px] transition ${active
//                                             ? "bg-primary/10 font-semibold text-primary"
//                                             : "hover:bg-muted"
//                                             }`}
//                                     >
//                                         <span className="min-w-0 truncate">
//                                             {option.label}
//                                         </span>
//                                         {active && (
//                                             <Check className="h-3.5 w-3.5 shrink-0" />
//                                         )}
//                                     </button>
//                                 );
//                             })
//                         )}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// function normalizeType(
//     value: string | null | undefined
// ) {
//     return String(value ?? "")
//         .trim()
//         .toLowerCase();
// }

// function emptyRow(
//     preview: SCMStockPreview,
//     index: number
// ): MappingRow {
//     const item = preview.items[index];

//     return {
//         source_index: item.source_index,
//         serial_number: item.serial_number,

//         category_id: null,
//         brand_id: null,
//         model_id: null,

//         category: "",
//         brand: "",
//         model: "",
//         cpu: "",
//         ram: "",
//         ssd: "",
//         monitor: "",
//         warranty_months:
//             item.warranty_months || 0,
//         device_type:
//             item.item_group
//                 ?.toLowerCase()
//                 .includes("accessor")
//                 ? "IT Accessory"
//                 : "IT Device",
//         remarks: "",

//         item_id: item.item_id,
//         item_name: item.item_name,
//         item_group: item.item_group,
//         pr_id: item.pr_id,
//         vendor_name: item.vendor_name,
//         purchase_date: item.purchase_date,
//         warranty_text: item.warranty_text,
//     };
// }

// export default function StockEntryPage() {
//     const router = useRouter();

//     const [mrNumber, setMRNumber] =
//         useState("");

//     const [preview, setPreview] =
//         useState<SCMStockPreview | null>(
//             null
//         );

//     const [rows, setRows] =
//         useState<MappingRow[]>([]);

//     // Professional default for bulk MR intake:
//     // Row #1 acts as the template for all remaining rows.
//     // Disable this only when one MR contains mixed device types.
//     const [syncFirstRow, setSyncFirstRow] =
//         useState(true);

//     const [masterData, setMasterData] =
//         useState<InventoryCategoryItem[]>(
//             []
//         );

//     const [masterLoading, setMasterLoading] =
//         useState(true);

//     const [specOptions, setSpecOptions] =
//         useState<InventorySpecOptions>({
//             cpu: [],
//             ram: [],
//             ssd: [],
//             monitor: [],
//         });

//     const [loading, setLoading] =
//         useState(false);

//     const [saving, setSaving] =
//         useState(false);

//     const [validating, setValidating] =
//         useState(false);

//     const [validationOpen, setValidationOpen] =
//         useState(false);

//     const [validation, setValidation] =
//         useState<StockValidationData | null>(null);

//     const [error, setError] =
//         useState("");

//     const [serialConflict, setSerialConflict] =
//         useState<SerialConflictInfo | null>(null);

//     const [success, setSuccess] =
//         useState("");

//     const requestSequence = useRef(0);
//     const lastLoadedMR = useRef("");

//     /* ======================================================
//        MASTER DATA

//        inventory_categories is the single source for:
//        Category -> Brand -> Model.
//     ====================================================== */

//     useEffect(() => {
//         let mounted = true;

//         async function loadMasterData() {
//             try {
//                 setMasterLoading(true);

//                 const response =
//                     await categoryApi.list();

//                 if (!mounted) return;

//                 setMasterData(
//                     (response.data ?? [])
//                         .filter(
//                             (item) =>
//                                 Number(
//                                     item.status ?? 1
//                                 ) === 1
//                         )
//                         .sort((a, b) =>
//                             String(
//                                 a.category_name ?? ""
//                             ).localeCompare(
//                                 String(
//                                     b.category_name ?? ""
//                                 )
//                             )
//                         )
//                 );
//             } catch {
//                 if (!mounted) return;

//                 setMasterData([]);
//                 setError(
//                     "Unable to load ITM Category / Brand / Model master data."
//                 );
//             } finally {
//                 if (mounted) {
//                     setMasterLoading(false);
//                 }
//             }
//         }

//         void loadMasterData();

//         return () => {
//             mounted = false;
//         };
//     }, []);

//     useEffect(() => {
//         let mounted = true;

//         async function loadSpecOptions() {
//             try {
//                 const response =
//                     await inventoryWorkflowApi.specOptions();

//                 if (!mounted) return;

//                 setSpecOptions({
//                     cpu: response.data?.cpu ?? [],
//                     ram: response.data?.ram ?? [],
//                     ssd: response.data?.ssd ?? [],
//                     monitor:
//                         response.data?.monitor ?? [],
//                 });
//             } catch {
//                 if (!mounted) return;

//                 // Optional specification fields should not block
//                 // SCM stock intake if the option catalogue fails.
//                 setSpecOptions({
//                     cpu: [],
//                     ram: [],
//                     ssd: [],
//                     monitor: [],
//                 });
//             }
//         }

//         void loadSpecOptions();

//         return () => {
//             mounted = false;
//         };
//     }, []);

//     const categories = useMemo(
//         () =>
//             masterData.filter(
//                 (item) =>
//                     normalizeType(item.type) ===
//                     "category" &&
//                     Number(item.parent_id ?? 0) ===
//                     0
//             ),
//         [masterData]
//     );

//     function brandsFor(
//         categoryID: number | null | undefined
//     ) {
//         if (!categoryID) return [];

//         return masterData.filter(
//             (item) =>
//                 normalizeType(item.type) ===
//                 "brand" &&
//                 Number(item.parent_id ?? 0) ===
//                 Number(categoryID)
//         );
//     }

//     function modelsFor(
//         brandID: number | null | undefined
//     ) {
//         if (!brandID) return [];

//         return masterData.filter(
//             (item) =>
//                 normalizeType(item.type) ===
//                 "model" &&
//                 Number(item.parent_id ?? 0) ===
//                 Number(brandID)
//         );
//     }

//     function isRowComplete(
//         row: MappingRow
//     ) {
//         return Boolean(
//             row.category_id &&
//             row.brand_id &&
//             row.model_id &&
//             Number(row.warranty_months ?? 0) > 0
//         );
//     }

//     const completeRows = rows.filter((row) =>
//         isRowComplete(row)
//     ).length;

//     /* ======================================================
//        SCM AJAX-LIKE MR PREVIEW

//        No Load button is required.  A pasted/typed MR is
//        fetched automatically after a short debounce.
//     ====================================================== */

//     async function loadMR(
//         mrInput: string,
//         force = false
//     ) {
//         const mr = mrInput.trim();

//         if (!mr) {
//             return;
//         }

//         if (
//             !force &&
//             lastLoadedMR.current === mr
//         ) {
//             return;
//         }

//         const sequence =
//             ++requestSequence.current;

//         try {
//             setLoading(true);
//             setError("");
//             setSerialConflict(null);
//             setSuccess("");
//             setValidation(null);
//             setValidationOpen(false);

//             const response =
//                 await inventoryWorkflowApi
//                     .previewMR(mr);

//             if (
//                 sequence !==
//                 requestSequence.current
//             ) {
//                 return;
//             }

//             const data = response.data;

//             lastLoadedMR.current =
//                 data.mr_id || mr;

//             setPreview(data);
//             setMRNumber(data.mr_id || mr);
//             setRows(
//                 data.items.map(
//                     (_, index) =>
//                         emptyRow(
//                             data,
//                             index
//                         )
//                 )
//             );
//         } catch (reason) {
//             if (
//                 sequence !==
//                 requestSequence.current
//             ) {
//                 return;
//             }

//             lastLoadedMR.current = "";
//             setPreview(null);
//             setRows([]);
//             setError(
//                 reason instanceof Error
//                     ? reason.message
//                     : "Unable to load SCM MR data."
//             );
//         } finally {
//             if (
//                 sequence ===
//                 requestSequence.current
//             ) {
//                 setLoading(false);
//             }
//         }
//     }

//     useEffect(() => {
//         const mr = mrNumber.trim();

//         if (!mr) {
//             requestSequence.current++;
//             lastLoadedMR.current = "";
//             setLoading(false);
//             setPreview(null);
//             setRows([]);
//             setError("");
//             setSuccess("");
//             setValidation(null);
//             setValidationOpen(false);
//             return;
//         }

//         // Prevent SCM calls while the operator has only
//         // typed the first few characters of an MR.
//         if (mr.length < 10) {
//             return;
//         }

//         if (
//             lastLoadedMR.current === mr
//         ) {
//             return;
//         }

//         const timer =
//             window.setTimeout(() => {
//                 void loadMR(mr);
//             }, 650);

//         return () => {
//             window.clearTimeout(timer);
//         };
//     }, [mrNumber]);

//     function clearMR() {
//         requestSequence.current++;
//         lastLoadedMR.current = "";
//         setMRNumber("");
//         setPreview(null);
//         setRows([]);
//         setLoading(false);
//         setError("");
//         setSerialConflict(null);
//         setSuccess("");
//         setValidation(null);
//         setValidationOpen(false);
//         setValidating(false);
//     }

//     const categorySelectOptions: SearchOption[] =
//         categories.map((item) => ({
//             value: String(item.id),
//             label: String(item.category_name ?? ""),
//         }));

//     const cpuSelectOptions: SearchOption[] =
//         specOptions.cpu.map((value) => ({
//             value,
//             label: value,
//         }));

//     const ramSelectOptions: SearchOption[] =
//         specOptions.ram.map((value) => ({
//             value,
//             label: value,
//         }));

//     const ssdSelectOptions: SearchOption[] =
//         specOptions.ssd.map((value) => ({
//             value,
//             label: value,
//         }));

//     const monitorSelectOptions: SearchOption[] =
//         specOptions.monitor.map((value) => ({
//             value,
//             label: value,
//         }));

//     const warrantySelectOptions: SearchOption[] = [
//         { value: "3", label: "3 Months" },
//         { value: "6", label: "6 Months" },
//         { value: "12", label: "1 Year" },
//         { value: "24", label: "2 Years" },
//         { value: "36", label: "3 Years" },
//         { value: "48", label: "4 Years" },
//         { value: "60", label: "5 Years" },
//         { value: "72", label: "6 Years" },
//         { value: "84", label: "7 Years" },
//         { value: "96", label: "8 Years" },
//         { value: "108", label: "9 Years" },
//         { value: "120", label: "10 Years" },
//     ];

//     /* ======================================================
//        CLASSIFICATION
//     ====================================================== */

//     function updateRow(
//         index: number,
//         patch: Partial<MappingRow>
//     ) {
//         setRows((current) =>
//             current.map((row, rowIndex) =>
//                 rowIndex === index
//                     ? {
//                         ...row,
//                         ...patch,
//                     }
//                     : row
//             )
//         );
//     }

//     function updateClassification(
//         index: number,
//         patch: Partial<MappingRow>
//     ) {
//         setRows((current) =>
//             current.map((row, rowIndex) => {
//                 const shouldSync =
//                     syncFirstRow &&
//                     index === 0;

//                 if (
//                     rowIndex !== index &&
//                     !shouldSync
//                 ) {
//                     return row;
//                 }

//                 return {
//                     ...row,
//                     ...patch,
//                 };
//             })
//         );
//     }

//     function selectCategory(
//         index: number,
//         categoryID: number
//     ) {
//         const selected =
//             categories.find(
//                 (item) =>
//                     item.id === categoryID
//             );

//         updateClassification(index, {
//             category_id:
//                 selected?.id ?? null,
//             category:
//                 selected?.category_name ?? "",

//             // A parent change invalidates Brand + Model.
//             brand_id: null,
//             brand: "",
//             model_id: null,
//             model: "",
//         });
//     }

//     function selectBrand(
//         index: number,
//         brandID: number
//     ) {
//         const selected =
//             masterData.find(
//                 (item) =>
//                     item.id === brandID
//             );

//         updateClassification(index, {
//             brand_id:
//                 selected?.id ?? null,
//             brand:
//                 selected?.category_name ?? "",
//             model_id: null,
//             model: "",
//         });
//     }

//     function selectModel(
//         index: number,
//         modelID: number
//     ) {
//         const selected =
//             masterData.find(
//                 (item) =>
//                     item.id === modelID
//             );

//         updateClassification(index, {
//             model_id:
//                 selected?.id ?? null,
//             model:
//                 selected?.category_name ?? "",
//         });
//     }

//     /* ======================================================
//        FINAL DATABASE COMMIT
//     ====================================================== */

//     function importPayloadForRows(sourceRows: MappingRow[]) {
//         return sourceRows.map((row) => ({
//             source_index:
//                 row.source_index,
//             serial_number:
//                 row.serial_number,

//             category_id:
//                 row.category_id,
//             brand_id:
//                 row.brand_id,
//             model_id:
//                 row.model_id,

//             // Names remain for backwards compatibility;
//             // backend IDs are the canonical validation path.
//             category:
//                 row.category.trim(),
//             brand:
//                 row.brand?.trim(),
//             model:
//                 row.model?.trim(),
//             cpu:
//                 row.cpu?.trim(),
//             ram:
//                 row.ram?.trim(),
//             ssd:
//                 row.ssd?.trim(),
//             monitor:
//                 row.monitor?.trim(),
//             warranty_months:
//                 Number(
//                     row.warranty_months ??
//                     0
//                 ),
//             device_type:
//                 row.device_type,
//             remarks:
//                 row.remarks?.trim(),
//         }));
//     }

//     function validateFormRows() {
//         const incomplete =
//             rows.findIndex(
//                 (row) =>
//                     !isRowComplete(row)
//             );

//         if (incomplete >= 0) {
//             setError(
//                 `Complete Category / Brand / Model / Warranty for row ${incomplete + 1
//                 } before importing.`
//             );
//             return false;
//         }

//         return true;
//     }

//     async function importStock() {
//         if (!preview || !validateFormRows()) {
//             return;
//         }

//         try {
//             setValidating(true);
//             setError("");
//             setSerialConflict(null);
//             setSuccess("");
//             setValidation(null);
//             setValidationOpen(false);

//             /*
//              * Route-safe preflight.
//              *
//              * No new backend validation route is required here. We intentionally
//              * use the application's existing /stock list endpoint together with
//              * the existing assetDeviceApi search endpoint. This removes the
//              * previous "route not found" failure while still checking BOTH
//              * stack_inventory and asset_devices before anything is inserted.
//              */

//             const stockRows: StockInventoryValidationItem[] = [];
//             let stockPage = 1;
//             const stockPageSize = 1000;

//             while (stockPage <= 100) {
//                 const stockResponse =
//                     await api.get<StockInventoryPage>(
//                         `/stock?page=${stockPage}&page_size=${stockPageSize}`
//                     );

//                 const batch =
//                     stockResponse.data ?? [];

//                 stockRows.push(...batch);

//                 const total = Number(
//                     stockResponse.total ??
//                     stockRows.length
//                 );

//                 if (
//                     batch.length === 0 ||
//                     stockRows.length >= total
//                 ) {
//                     break;
//                 }

//                 stockPage += 1;
//             }

//             const serialCounts = new Map<string, number>();

//             rows.forEach((row) => {
//                 const key = normalizeSerialKey(
//                     row.serial_number
//                 );

//                 if (!key) return;

//                 serialCounts.set(
//                     key,
//                     (serialCounts.get(key) ?? 0) + 1
//                 );
//             });

//             const uniqueSerials = Array.from(
//                 serialCounts.keys()
//             );

//             const assetMatchesBySerial = new Map<
//                 string,
//                 Array<{
//                     id: number;
//                     device_serial?: string | null;
//                     mr_number?: string | null;
//                     pr_number?: string | null;
//                     asset_status?: number | null;
//                 }>
//             >();

//             await Promise.all(
//                 uniqueSerials.map(
//                     async (serialKey) => {
//                         const assetResponse =
//                             await assetDeviceApi.list({
//                                 page: 1,
//                                 limit: 50,
//                                 search: serialKey,
//                             });

//                         const exactMatches =
//                             (assetResponse.data ?? [])
//                                 .filter(
//                                     (asset) =>
//                                         normalizeSerialKey(
//                                             asset.device_serial
//                                         ) === serialKey
//                                 )
//                                 .map((asset) => ({
//                                     id: Number(asset.id),
//                                     device_serial: asset.device_serial,
//                                     mr_number: asset.mr_number,
//                                     pr_number: asset.pr_number,
//                                     asset_status: asset.asset_status,
//                                 }));

//                         assetMatchesBySerial.set(
//                             serialKey,
//                             exactMatches
//                         );
//                     }
//                 )
//             );

//             const targetMR =
//                 String(preview.mr_id ?? "")
//                     .trim();

//             const seenIncoming = new Set<string>();

//             const validationRows: StockValidationRow[] =
//                 rows.map((row, index) => {
//                     const serialNumber =
//                         String(
//                             row.serial_number ??
//                             ""
//                         ).trim();

//                     const serialKey =
//                         normalizeSerialKey(serialNumber);

//                     const payloadCount =
//                         serialKey
//                             ? serialCounts.get(serialKey) ?? 1
//                             : 1;

//                     const repeatedInsidePayload =
//                         Boolean(
//                             serialKey &&
//                             seenIncoming.has(serialKey)
//                         );

//                     if (serialKey) {
//                         seenIncoming.add(serialKey);
//                     }

//                     const matchingStock =
//                         serialKey
//                             ? stockRows.filter(
//                                 (stock) =>
//                                     normalizeSerialKey(
//                                         stock.serial_no
//                                     ) === serialKey
//                             )
//                             : [];

//                     const matchingAssets =
//                         serialKey
//                             ? assetMatchesBySerial.get(
//                                 serialKey
//                             ) ?? []
//                             : [];

//                     const existingMRs =
//                         uniqueStrings([
//                             ...matchingStock.map(
//                                 (stock) => stock.mr_id
//                             ),
//                             ...matchingAssets.map(
//                                 (asset) => asset.mr_number
//                             ),
//                         ]);

//                     const prNumbers =
//                         uniqueStrings([
//                             ...matchingStock.map(
//                                 (stock) => stock.pr_id
//                             ),
//                             ...matchingAssets.map(
//                                 (asset) => asset.pr_number
//                             ),
//                         ]);

//                     const assetIDs =
//                         uniqueNumbers(
//                             matchingAssets.map(
//                                 (asset) => asset.id
//                             )
//                         );

//                     const stockIDs =
//                         uniqueNumbers(
//                             matchingStock.map(
//                                 (stock) => stock.id
//                             )
//                         );

//                     const hasDatabaseReference =
//                         matchingStock.length > 0 ||
//                         matchingAssets.length > 0;

//                     const existsSameMR =
//                         existingMRs.some(
//                             (mr) => mr === targetMR
//                         );

//                     const existsOtherMR =
//                         existingMRs.some(
//                             (mr) =>
//                                 Boolean(mr) &&
//                                 mr !== targetMR
//                         );

//                     let validationStatus: StockValidationStatus =
//                         "NEW";

//                     if (repeatedInsidePayload) {
//                         validationStatus =
//                             "DUPLICATE_IN_PAYLOAD";
//                     } else if (
//                         existsOtherMR ||
//                         (
//                             hasDatabaseReference &&
//                             !existsSameMR
//                         )
//                     ) {
//                         validationStatus =
//                             "CONFLICT_OTHER_MR";
//                     } else if (existsSameMR) {
//                         validationStatus =
//                             "EXISTING_SAME_MR";
//                     }

//                     const statusValues =
//                         matchingAssets
//                             .map(
//                                 (asset) =>
//                                     Number(
//                                         asset.asset_status
//                                     )
//                             )
//                             .filter(
//                                 (value) =>
//                                     Number.isFinite(value)
//                             );

//                     return {
//                         row_no: index + 1,
//                         serial_number: serialNumber,
//                         asset_ids: assetIDs,
//                         stock_ids: stockIDs,
//                         existing_mrs: existingMRs,
//                         pr_numbers: prNumbers,
//                         asset_status:
//                             statusValues.length
//                                 ? statusValues[0]
//                                 : null,
//                         payload_count: payloadCount,
//                         validation_status: validationStatus,
//                         multiple_mr_warning:
//                             existingMRs.length > 1,
//                     };
//                 });

//             const newCount =
//                 validationRows.filter(
//                     (item) =>
//                         item.validation_status ===
//                         "NEW"
//                 ).length;

//             const existingSameMRCount =
//                 validationRows.filter(
//                     (item) =>
//                         item.validation_status ===
//                         "EXISTING_SAME_MR"
//                 ).length;

//             const conflictCount =
//                 validationRows.filter(
//                     (item) =>
//                         item.validation_status ===
//                         "CONFLICT_OTHER_MR"
//                 ).length;

//             const duplicatePayloadCount =
//                 validationRows.filter(
//                     (item) =>
//                         item.validation_status ===
//                         "DUPLICATE_IN_PAYLOAD"
//                 ).length;

//             const validationData: StockValidationData = {
//                 mr_number: targetMR,
//                 incoming_count: rows.length,
//                 unique_row_count:
//                     new Set(
//                         rows.map(
//                             (row, index) =>
//                                 normalizeSerialKey(
//                                     row.serial_number
//                                 ) ||
//                                 `__EMPTY_${index}`
//                         )
//                     ).size,
//                 new_count: newCount,
//                 existing_same_mr_count:
//                     existingSameMRCount,
//                 conflict_count: conflictCount,
//                 duplicate_payload_count:
//                     duplicatePayloadCount,
//                 skipped_count:
//                     rows.length - newCount,
//                 can_import: newCount > 0,
//                 rows: validationRows,
//             };

//             setValidation(validationData);
//             setValidationOpen(true);
//         } catch (reason) {
//             setValidation(null);
//             setValidationOpen(false);
//             setError(
//                 reason instanceof Error
//                     ? reason.message
//                     : "Unable to validate MR / serial data."
//             );
//         } finally {
//             setValidating(false);
//         }
//     }

//     async function commitValidatedImport() {
//         if (!preview || !validation) {
//             return;
//         }

//         const newRowNumbers =
//             new Set(
//                 validation.rows
//                     .filter(
//                         (item) =>
//                             item.validation_status ===
//                             "NEW"
//                     )
//                     .map(
//                         (item) =>
//                             item.row_no
//                     )
//             );

//         const rowsToImport =
//             rows.filter(
//                 (_, index) =>
//                     newRowNumbers.has(
//                         index + 1
//                     )
//             );

//         if (rowsToImport.length === 0) {
//             setValidationOpen(false);
//             setError(
//                 "Nothing to import. Every incoming serial is already registered or duplicated, so no new database row will be created."
//             );
//             return;
//         }

//         try {
//             setSaving(true);
//             setError("");
//             setSerialConflict(null);
//             setSuccess("");

//             const response =
//                 await inventoryWorkflowApi
//                     .importMR(
//                         preview.mr_id,
//                         importPayloadForRows(
//                             rowsToImport
//                         )
//                     );

//             const importResult = response.data as typeof response.data & {
//                 received?: number;
//                 stock_rows_committed?: number;
//                 asset_created?: number;
//                 asset_synchronized?: number;
//                 asset_normalized_available?: number;
//                 conflicted?: number;
//                 conflicts?: Array<{
//                     row?: number;
//                     serial?: string;
//                     asset_id?: number;
//                     existing_mr?: string;
//                     stock_id?: number;
//                     asset_status?: number;
//                 }>;
//             };

//             const conflicted = Number(importResult.conflicted ?? 0);
//             const assetCreated = Number(importResult.asset_created ?? importResult.imported ?? 0);
//             const assetSynchronized = Number(importResult.asset_synchronized ?? 0);
//             const assetNormalizedAvailable = Number(importResult.asset_normalized_available ?? 0);
//             const stockCommitted = Number(
//                 importResult.stock_rows_committed ??
//                 (Number(importResult.imported ?? 0) + Number(importResult.updated ?? 0))
//             );
//             const firstConflict = importResult.conflicts?.[0];

//             setValidationOpen(false);

//             setSuccess(
//                 conflicted > 0
//                     ? `Import completed with warning: ${stockCommitted} stock row(s) committed, ${assetCreated} new asset(s) created, ${conflicted} serial conflict(s) kept pending verification. Opening Device Operations...`
//                     : `Import completed: ${stockCommitted} stock row(s) committed, ${assetCreated} new asset(s), ${assetSynchronized} existing asset(s) synchronized${assetNormalizedAvailable > 0 ? `, ${assetNormalizedAvailable} normalized to Available` : ""}. Opening Device Operations...`
//             );

//             const destination =
//                 `/dashboard/assets/devices?import=success&mr=${encodeURIComponent(
//                     preview.mr_id
//                 )}&imported=${encodeURIComponent(
//                     String(response.data.imported ?? 0)
//                 )}&updated=${encodeURIComponent(
//                     String(response.data.updated ?? 0)
//                 )}&stock_committed=${encodeURIComponent(
//                     String(stockCommitted)
//                 )}&assets_created=${encodeURIComponent(
//                     String(assetCreated)
//                 )}&assets_synchronized=${encodeURIComponent(
//                     String(assetSynchronized)
//                 )}&normalized_available=${encodeURIComponent(
//                     String(assetNormalizedAvailable)
//                 )}&conflicted=${encodeURIComponent(
//                     String(conflicted)
//                 )}&conflict_asset_id=${encodeURIComponent(
//                     String(firstConflict?.asset_id ?? "")
//                 )}&conflict_serial=${encodeURIComponent(
//                     String(firstConflict?.serial ?? "")
//                 )}`;

//             // The existing import endpoint remains the authoritative second check.
//             // Replace avoids returning to a stale form that could be submitted again.
//             router.replace(destination);
//         } catch (reason) {
//             const message =
//                 reason instanceof Error
//                     ? reason.message
//                     : "Unable to import stock.";

//             const conflict =
//                 parseSerialConflict(message);

//             if (conflict) {
//                 setValidationOpen(false);
//                 setSerialConflict(conflict);
//                 setError("");
//             } else {
//                 setSerialConflict(null);
//                 setError(message);
//             }
//         } finally {
//             setSaving(false);
//         }
//     }

//     return (
//         <div className="space-y-4 p-4 sm:p-6">
//             <div className="rounded-2xl border border-border bg-card shadow-sm">
//                 <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
//                     <div className="flex items-start gap-3">
//                         <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
//                             <ServerCog className="h-5 w-5 text-primary" />
//                         </div>

//                         <div>
//                             <h1 className="text-sm font-semibold text-foreground">
//                                 SCM Stock Intake
//                             </h1>

//                             <p className="mt-1 max-w-2xl text-[10px] leading-5 text-muted-foreground">
//                                 Enter an approved Material Requisition. SCM data loads automatically; classify each received item with ITM master data, then commit the stock once.
//                             </p>
//                         </div>
//                     </div>

//                     <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400">
//                         <ShieldCheck className="h-3.5 w-3.5" />
//                         Server-side SCM integration
//                     </div>
//                 </div>

//                 <div className="p-5">
//                     <label className="block">
//                         <span className={labelClass}>
//                             Material Requisition (MR)
//                         </span>

//                         <div className="flex h-10 items-center rounded-lg border border-border bg-background px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
//                             <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />

//                             <input
//                                 value={mrNumber}
//                                 onChange={(event) => {
//                                     setMRNumber(
//                                         event.target.value
//                                     );
//                                     setSuccess("");
//                                 }}
//                                 placeholder="Enter / paste MR number — SCM will load automatically"
//                                 className="h-full min-w-0 flex-1 bg-transparent text-[10px] outline-none"
//                                 autoComplete="off"
//                             />

//                             {loading && (
//                                 <div className="mr-2 flex items-center gap-1.5 whitespace-nowrap text-[8px] font-medium text-primary">
//                                     <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
//                                     Loading SCM...
//                                 </div>
//                             )}

//                             {!loading &&
//                                 preview && (
//                                     <div className="mr-2 hidden items-center gap-1.5 whitespace-nowrap text-[8px] font-semibold text-emerald-600 sm:flex">
//                                         <CheckCircle2 className="h-3.5 w-3.5" />
//                                         {preview.items.length} item(s) loaded
//                                     </div>
//                                 )}

//                             {mrNumber && (
//                                 <button
//                                     type="button"
//                                     aria-label="Clear MR"
//                                     onClick={clearMR}
//                                     className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
//                                 >
//                                     <X className="h-3.5 w-3.5" />
//                                 </button>
//                             )}
//                         </div>
//                     </label>

//                     {serialConflict && (
//                         <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200">
//                             <div className="flex items-start gap-2.5">
//                                 <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

//                                 <div className="min-w-0 flex-1">
//                                     <p className="text-[10px] font-bold">
//                                         Duplicate device serial blocked safely
//                                     </p>
//                                     <p className="mt-1 text-[9px] leading-5">
//                                         Row {serialConflict.row} · Serial <span className="font-mono font-bold">{serialConflict.serial}</span> is already registered as <span className="font-semibold">Asset #{serialConflict.assetId}</span>.
//                                     </p>

//                                     <div className="mt-2 grid gap-2 sm:grid-cols-3">
//                                         <div className="rounded-lg border border-amber-200 bg-white/70 px-2.5 py-2 dark:border-amber-900/60 dark:bg-black/10">
//                                             <p className="text-[7px] font-semibold uppercase tracking-wide opacity-70">Existing MR</p>
//                                             <p className="mt-1 break-all text-[8px] font-semibold">{serialConflict.existingMR || "—"}</p>
//                                         </div>
//                                         <div className="rounded-lg border border-amber-200 bg-white/70 px-2.5 py-2 dark:border-amber-900/60 dark:bg-black/10">
//                                             <p className="text-[7px] font-semibold uppercase tracking-wide opacity-70">Existing Stock</p>
//                                             <p className="mt-1 text-[8px] font-semibold">#{serialConflict.stockId}</p>
//                                         </div>
//                                         <div className="rounded-lg border border-amber-200 bg-white/70 px-2.5 py-2 dark:border-amber-900/60 dark:bg-black/10">
//                                             <p className="text-[7px] font-semibold uppercase tracking-wide opacity-70">Asset Status Code</p>
//                                             <p className="mt-1 text-[8px] font-semibold">{serialConflict.status}</p>
//                                         </div>
//                                     </div>

//                                     <p className="mt-2 text-[8px] leading-4 opacity-90">
//                                         No duplicate asset was created. Verify the physical device / SCM serial and correct SCM if this is a different device. Do not remove the unique serial constraint.
//                                     </p>

//                                     <div className="mt-2 flex flex-wrap gap-2">
//                                         <button
//                                             type="button"
//                                             onClick={() =>
//                                                 router.push(
//                                                     `/dashboard/assets/devices/${serialConflict.assetId}`
//                                                 )
//                                             }
//                                             className="inline-flex h-7 items-center rounded-md border border-amber-400 bg-white px-2.5 text-[8px] font-semibold hover:bg-amber-100 dark:bg-transparent dark:hover:bg-amber-950/50"
//                                         >
//                                             View Existing Asset #{serialConflict.assetId}
//                                         </button>

//                                         <button
//                                             type="button"
//                                             disabled={loading || saving}
//                                             onClick={() => {
//                                                 setSerialConflict(null);
//                                                 void loadMR(mrNumber, true);
//                                             }}
//                                             className="inline-flex h-7 items-center gap-1.5 rounded-md border border-amber-400 px-2.5 text-[8px] font-semibold hover:bg-amber-100 disabled:opacity-50 dark:hover:bg-amber-950/50"
//                                         >
//                                             <RefreshCcw className="h-3 w-3" />
//                                             Reload MR after SCM correction
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {error && (
//                         <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
//                             <span>{error}</span>

//                             {mrNumber.trim().length >=
//                                 10 && (
//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             void loadMR(
//                                                 mrNumber,
//                                                 true
//                                             )
//                                         }
//                                         disabled={loading}
//                                         className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-[8px] font-semibold hover:bg-red-100 disabled:opacity-50 dark:border-red-900"
//                                     >
//                                         <RefreshCcw className="h-3 w-3" />
//                                         Retry
//                                     </button>
//                                 )}
//                         </div>
//                     )}

//                     {success && (
//                         <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400">
//                             <CheckCircle2 className="h-4 w-4" />
//                             {success}
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {preview && (
//                 <>
//                     <div className="grid gap-3 sm:grid-cols-3">
//                         <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
//                             <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                 MR Number
//                             </p>
//                             <p className="mt-1 break-all text-[10px] font-semibold text-foreground">
//                                 {preview.mr_id}
//                             </p>
//                         </div>

//                         <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
//                             <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                 SCM Items
//                             </p>
//                             <p className="mt-1 text-lg font-bold text-primary">
//                                 {preview.items.length}
//                             </p>
//                         </div>

//                         <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
//                             <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
//                                 Ready to Import
//                             </p>
//                             <p
//                                 className={`mt-1 text-lg font-bold ${completeRows ===
//                                     rows.length
//                                     ? "text-emerald-600"
//                                     : "text-amber-600"
//                                     }`}
//                             >
//                                 {completeRows}/{rows.length}
//                             </p>
//                         </div>
//                     </div>

//                     <div className="rounded-2xl border border-border bg-card shadow-sm">
//                         <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
//                             <div>
//                                 <h2 className="text-[11px] font-semibold text-foreground">
//                                     SCM Receipt & ITM Classification
//                                 </h2>
//                                 <p className="mt-0.5 text-[8px] text-muted-foreground">
//                                     SCM procurement fields are read-only. Category → Brand → Model comes from the ITM inventory master.
//                                 </p>
//                                 {rows.length > 1 && syncFirstRow && (
//                                     <p className="mt-1 text-[8px] font-medium text-primary">
//                                         Row #1 is the active template: classification and remarks are synchronized to all rows automatically.
//                                     </p>
//                                 )}
//                             </div>

//                             <div className="flex flex-wrap items-center gap-2">
//                                 {rows.length > 1 && (
//                                     <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2 text-[8px] font-medium text-foreground">
//                                         <input
//                                             type="checkbox"
//                                             checked={syncFirstRow}
//                                             onChange={(event) =>
//                                                 setSyncFirstRow(
//                                                     event.target.checked
//                                                 )
//                                             }
//                                             className="h-3.5 w-3.5 accent-primary"
//                                         />
//                                         <Copy className="h-3 w-3 text-primary" />
//                                         <span>
//                                             Auto-apply Row #1 classification to all rows
//                                         </span>
//                                     </label>
//                                 )}

//                                 <Button
//                                     type="button"
//                                     size="sm"
//                                     className="h-8 gap-1.5 text-[9px]"
//                                     disabled={
//                                         saving ||
//                                         validating ||
//                                         rows.length === 0 ||
//                                         completeRows !==
//                                         rows.length
//                                     }
//                                     onClick={() =>
//                                         void importStock()
//                                     }
//                                 >
//                                     {validating ? (
//                                         <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
//                                     ) : (
//                                         <ShieldCheck className="h-3.5 w-3.5" />
//                                     )}
//                                     {validating
//                                         ? "Checking MR / Serial..."
//                                         : `Review & Import ${rows.length}`}
//                                 </Button>
//                             </div>
//                         </div>

//                         <div className="space-y-3 p-4">
//                             {rows.map((row, index) => {
//                                 const source =
//                                     preview.items[index];

//                                 const brandOptions =
//                                     brandsFor(
//                                         row.category_id
//                                     );

//                                 const modelOptions =
//                                     modelsFor(
//                                         row.brand_id
//                                     );

//                                 const rowReady =
//                                     isRowComplete(row);

//                                 return (
//                                     <div
//                                         key={source.source_index}
//                                         className="relative overflow-visible rounded-xl border border-border"
//                                     >
//                                         <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
//                                             <div className="flex items-center gap-2">
//                                                 <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
//                                                     {index + 1}
//                                                 </span>
//                                                 <div>
//                                                     <p className="text-[10px] font-semibold text-foreground">
//                                                         {source.item_name ||
//                                                             "SCM Item"}
//                                                     </p>
//                                                     <p className="text-[8px] text-muted-foreground">
//                                                         {source.item_group ||
//                                                             "Unclassified group"}
//                                                     </p>
//                                                 </div>
//                                             </div>

//                                             <div className="flex items-center gap-2">
//                                                 <span
//                                                     className={`rounded-md border px-2 py-1 text-[7px] font-semibold ${rowReady
//                                                         ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400"
//                                                         : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-400"
//                                                         }`}
//                                                 >
//                                                     {rowReady
//                                                         ? "Ready"
//                                                         : "Classification required"}
//                                                 </span>

//                                                 <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[8px] text-muted-foreground">
//                                                     {source.serial_number ||
//                                                         "Internal asset tag will be generated"}
//                                                 </span>
//                                             </div>
//                                         </div>

//                                         <div className="grid gap-4 p-4 xl:grid-cols-2">
//                                             <div className="rounded-lg border border-border bg-muted/15 p-3">
//                                                 <div className="mb-3 flex items-center gap-2">
//                                                     <Database className="h-3.5 w-3.5 text-amber-600" />
//                                                     <p className="text-[9px] font-semibold text-foreground">
//                                                         SCM Inventory
//                                                     </p>
//                                                 </div>

//                                                 <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
//                                                     {[
//                                                         [
//                                                             "MR Number",
//                                                             preview.mr_id,
//                                                         ],
//                                                         [
//                                                             "PR Number",
//                                                             source.pr_id,
//                                                         ],
//                                                         [
//                                                             "Vendor Name",
//                                                             source.vendor_name,
//                                                         ],
//                                                         [
//                                                             "Received / GR",
//                                                             source.gr_id,
//                                                         ],
//                                                         [
//                                                             "Serial No.",
//                                                             source.serial_number,
//                                                         ],
//                                                         [
//                                                             "Purchase Date",
//                                                             source.purchase_date,
//                                                         ],
//                                                         [
//                                                             "Item Group",
//                                                             source.item_group,
//                                                         ],
//                                                         [
//                                                             "Item Name",
//                                                             source.item_name,
//                                                         ],
//                                                         [
//                                                             "SCM Warranty",
//                                                             source.warranty_text ||
//                                                             (source.warranty_months
//                                                                 ? `${source.warranty_months} month(s)`
//                                                                 : ""),
//                                                         ],
//                                                     ].map(
//                                                         ([
//                                                             label,
//                                                             value,
//                                                         ]) => (
//                                                             <div
//                                                                 key={label}
//                                                             >
//                                                                 <p className="text-[7px] font-semibold uppercase text-muted-foreground">
//                                                                     {label}
//                                                                 </p>
//                                                                 <p className="mt-1 break-words text-[9px] font-medium text-foreground">
//                                                                     {value ||
//                                                                         "—"}
//                                                                 </p>
//                                                             </div>
//                                                         )
//                                                     )}
//                                                 </div>
//                                             </div>

//                                             <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3">
//                                                 <div className="mb-3 flex items-center justify-between gap-3">
//                                                     <div className="flex items-center gap-2">
//                                                         <PackageCheck className="h-3.5 w-3.5 text-primary" />
//                                                         <p className="text-[9px] font-semibold text-foreground">
//                                                             ITM Classification
//                                                         </p>
//                                                     </div>

//                                                     {masterLoading && (
//                                                         <span className="flex items-center gap-1 text-[7px] text-muted-foreground">
//                                                             <LoaderCircle className="h-3 w-3 animate-spin" />
//                                                             Loading master data
//                                                         </span>
//                                                     )}
//                                                 </div>

//                                                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Category <span className="text-red-500">*</span>
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={
//                                                                 row.category_id
//                                                                     ? String(
//                                                                         row.category_id
//                                                                     )
//                                                                     : ""
//                                                             }
//                                                             options={
//                                                                 categorySelectOptions
//                                                             }
//                                                             disabled={
//                                                                 masterLoading
//                                                             }
//                                                             required
//                                                             placeholder="Search category..."
//                                                             onChange={(value) =>
//                                                                 selectCategory(
//                                                                     index,
//                                                                     Number(
//                                                                         value ||
//                                                                         0
//                                                                     )
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Brand <span className="text-red-500">*</span>
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={
//                                                                 row.brand_id
//                                                                     ? String(
//                                                                         row.brand_id
//                                                                     )
//                                                                     : ""
//                                                             }
//                                                             options={brandOptions.map(
//                                                                 (item) => ({
//                                                                     value: String(
//                                                                         item.id
//                                                                     ),
//                                                                     label: String(
//                                                                         item.category_name ??
//                                                                         ""
//                                                                     ),
//                                                                 })
//                                                             )}
//                                                             disabled={
//                                                                 !row.category_id ||
//                                                                 brandOptions.length ===
//                                                                 0
//                                                             }
//                                                             required
//                                                             placeholder={
//                                                                 row.category_id &&
//                                                                     brandOptions.length ===
//                                                                     0
//                                                                     ? "No active brand under category"
//                                                                     : "Search brand..."
//                                                             }
//                                                             onChange={(value) =>
//                                                                 selectBrand(
//                                                                     index,
//                                                                     Number(
//                                                                         value ||
//                                                                         0
//                                                                     )
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Model <span className="text-red-500">*</span>
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={
//                                                                 row.model_id
//                                                                     ? String(
//                                                                         row.model_id
//                                                                     )
//                                                                     : ""
//                                                             }
//                                                             options={modelOptions.map(
//                                                                 (item) => ({
//                                                                     value: String(
//                                                                         item.id
//                                                                     ),
//                                                                     label: String(
//                                                                         item.category_name ??
//                                                                         ""
//                                                                     ),
//                                                                 })
//                                                             )}
//                                                             disabled={
//                                                                 !row.brand_id ||
//                                                                 modelOptions.length ===
//                                                                 0
//                                                             }
//                                                             required
//                                                             placeholder={
//                                                                 row.brand_id &&
//                                                                     modelOptions.length ===
//                                                                     0
//                                                                     ? "No active model under brand"
//                                                                     : "Search model..."
//                                                             }
//                                                             onChange={(value) =>
//                                                                 selectModel(
//                                                                     index,
//                                                                     Number(
//                                                                         value ||
//                                                                         0
//                                                                     )
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             CPU / Processor
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={row.cpu ?? ""}
//                                                             options={
//                                                                 cpuSelectOptions
//                                                             }
//                                                             placeholder="Search CPU / processor..."
//                                                             emptyText="No CPU options found"
//                                                             onChange={(value) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         cpu: value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             RAM
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={row.ram ?? ""}
//                                                             options={
//                                                                 ramSelectOptions
//                                                             }
//                                                             placeholder="Search RAM..."
//                                                             emptyText="No RAM options found"
//                                                             onChange={(value) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         ram: value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             SSD / HDD
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={row.ssd ?? ""}
//                                                             options={
//                                                                 ssdSelectOptions
//                                                             }
//                                                             placeholder="Search SSD / HDD..."
//                                                             emptyText="No SSD / HDD options found"
//                                                             onChange={(value) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         ssd: value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Monitor
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={row.monitor ?? ""}
//                                                             options={
//                                                                 monitorSelectOptions
//                                                             }
//                                                             placeholder="Search monitor..."
//                                                             emptyText="No monitor options found"
//                                                             onChange={(value) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         monitor: value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Warranty Duration <span className="text-red-500">*</span>
//                                                         </span>
//                                                         <SearchableClearableSelect
//                                                             value={
//                                                                 Number(
//                                                                     row.warranty_months ??
//                                                                     0
//                                                                 ) > 0
//                                                                     ? String(
//                                                                         row.warranty_months
//                                                                     )
//                                                                     : ""
//                                                             }
//                                                             options={
//                                                                 warrantySelectOptions
//                                                             }
//                                                             required
//                                                             placeholder="Search warranty..."
//                                                             onChange={(value) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         warranty_months:
//                                                                             Number(
//                                                                                 value ||
//                                                                                 0
//                                                                             ),
//                                                                     }
//                                                                 )
//                                                             }
//                                                         />
//                                                     </div>

//                                                     <div>
//                                                         <span className={labelClass}>
//                                                             Warranty End Date
//                                                         </span>
//                                                         <input
//                                                             type="text"
//                                                             readOnly
//                                                             value={
//                                                                 warrantyEndDate(
//                                                                     source.purchase_date,
//                                                                     Number(
//                                                                         row.warranty_months ??
//                                                                         0
//                                                                     )
//                                                                 )
//                                                             }
//                                                             placeholder="Select warranty duration"
//                                                             className={`${fieldClass} font-mono text-[9px] text-emerald-700 dark:text-emerald-400`}
//                                                         />
//                                                     </div>

//                                                     <label>
//                                                         <span className={labelClass}>
//                                                             Asset Type
//                                                         </span>
//                                                         <select
//                                                             value={
//                                                                 row.device_type
//                                                             }
//                                                             onChange={(event) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         device_type:
//                                                                             event
//                                                                                 .target
//                                                                                 .value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                             className={fieldClass}
//                                                         >
//                                                             <option value="IT Device">
//                                                                 IT Device
//                                                             </option>
//                                                             <option value="IT Accessory">
//                                                                 IT Accessory
//                                                             </option>
//                                                         </select>
//                                                     </label>

//                                                     <label className="sm:col-span-1 lg:col-span-2">
//                                                         <span className={labelClass}>
//                                                             Remarks
//                                                         </span>
//                                                         <input
//                                                             type="text"
//                                                             value={
//                                                                 row.remarks
//                                                             }
//                                                             maxLength={500}
//                                                             onChange={(event) =>
//                                                                 updateClassification(
//                                                                     index,
//                                                                     {
//                                                                         remarks:
//                                                                             event
//                                                                                 .target
//                                                                                 .value,
//                                                                     }
//                                                                 )
//                                                             }
//                                                             placeholder="Optional stock / warranty note"
//                                                             className={fieldClass}
//                                                         />
//                                                     </label>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>

//                         <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
//                             <p className="text-[8px] text-muted-foreground">
//                                 Existing serials are never inserted twice. Review automatically skipped rows in the confirmation modal; only NEW serials continue to import.
//                             </p>

//                             <div className="flex items-center gap-1.5 text-[8px] font-medium text-primary">
//                                 <ShieldCheck className="h-3.5 w-3.5" />
//                                 Import action is available at the top after all rows are ready.
//                             </div>
//                         </div>
//                     </div>
//                 </>
//             )}

//             {validationOpen && validation && (
//                 <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
//                     <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
//                         <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
//                             <div className="flex items-start gap-3">
//                                 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
//                                     <ShieldCheck className="h-4 w-4 text-primary" />
//                                 </div>

//                                 <div>
//                                     <h3 className="text-[12px] font-bold text-foreground">
//                                         Stock Import Review
//                                     </h3>
//                                     <p className="mt-1 text-[9px] text-muted-foreground">
//                                         Preflight completed for <span className="font-mono font-semibold text-foreground">{validation.mr_number}</span> using the existing Stock + Asset APIs. Existing serials are locked to Skip; only genuinely new rows will be inserted.
//                                     </p>
//                                 </div>
//                             </div>

//                             <button
//                                 type="button"
//                                 aria-label="Close validation"
//                                 disabled={saving}
//                                 onClick={() => setValidationOpen(false)}
//                                 className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
//                             >
//                                 <X className="h-4 w-4" />
//                             </button>
//                         </div>

//                         <div className="overflow-y-auto p-5">
//                             <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
//                                 <div className="rounded-xl border border-border bg-muted/20 p-3">
//                                     <p className="text-[7px] font-bold uppercase tracking-wide text-muted-foreground">Incoming</p>
//                                     <p className="mt-1 text-lg font-bold text-foreground">{validation.incoming_count}</p>
//                                 </div>
//                                 <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
//                                     <p className="text-[7px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">New</p>
//                                     <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">{validation.new_count}</p>
//                                 </div>
//                                 <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
//                                     <p className="text-[7px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Existing Serial</p>
//                                     <p className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-400">{validation.existing_same_mr_count + validation.conflict_count}</p>
//                                 </div>
//                                 <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/20">
//                                     <p className="text-[7px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Auto-Skipped</p>
//                                     <p className="mt-1 text-lg font-bold text-slate-700 dark:text-slate-200">
//                                         {validation.skipped_count}
//                                     </p>
//                                 </div>
//                             </div>

//                             {validation.rows.some((item) => item.validation_status === "CONFLICT_OTHER_MR" || item.validation_status === "DUPLICATE_IN_PAYLOAD") && (
//                                 <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/15">
//                                     <div className="mb-2 flex items-start gap-2">
//                                         <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
//                                             <Check className="h-3 w-3" />
//                                         </div>
//                                         <div>
//                                             <p className="text-[10px] font-bold text-amber-900 dark:text-amber-200">Existing / duplicate serials — automatically skipped</p>
//                                             <p className="mt-0.5 text-[8px] leading-4 text-amber-800/80 dark:text-amber-300/80">These rows are read-only exclusions for data accuracy. They cannot be re-enabled and will not be sent to the final import.</p>
//                                         </div>
//                                     </div>

//                                     <div className="space-y-2">
//                                         {validation.rows
//                                             .filter((item) => item.validation_status === "CONFLICT_OTHER_MR" || item.validation_status === "DUPLICATE_IN_PAYLOAD")
//                                             .map((item) => (
//                                                 <div key={`skipped-${item.row_no}-${item.serial_number}`} className="grid gap-2 rounded-lg border border-amber-200 bg-white/80 px-3 py-2.5 text-[8px] dark:border-amber-900/50 dark:bg-black/10 sm:grid-cols-[44px_60px_minmax(160px,1fr)_minmax(180px,2fr)_minmax(150px,1fr)]">
//                                                     <div className="flex items-center justify-center">
//                                                         <span title="Skipped automatically" className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
//                                                             <Check className="h-3.5 w-3.5" />
//                                                         </span>
//                                                     </div>
//                                                     <div>
//                                                         <p className="text-[7px] uppercase text-muted-foreground">Row</p>
//                                                         <p className="mt-0.5 font-bold">#{item.row_no}</p>
//                                                     </div>
//                                                     <div>
//                                                         <p className="text-[7px] uppercase text-muted-foreground">Serial</p>
//                                                         <p className="mt-0.5 break-all font-mono font-bold">{item.serial_number || "No serial"}</p>
//                                                     </div>
//                                                     <div>
//                                                         <p className="text-[7px] uppercase text-muted-foreground">Existing MR / reason</p>
//                                                         <p className="mt-0.5 break-words font-semibold">
//                                                             {item.validation_status === "DUPLICATE_IN_PAYLOAD"
//                                                                 ? `Repeated ${item.payload_count}× inside this SCM payload`
//                                                                 : item.existing_mrs.length
//                                                                     ? item.existing_mrs.join(" · ")
//                                                                     : "Existing serial reference without MR"}
//                                                         </p>
//                                                     </div>
//                                                     <div>
//                                                         <p className="text-[7px] uppercase text-muted-foreground">Action</p>
//                                                         <p className="mt-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
//                                                             ✓ Skip — no duplicate row will be created
//                                                         </p>
//                                                         {item.validation_status === "CONFLICT_OTHER_MR" && (
//                                                             <p className="mt-0.5 text-muted-foreground">
//                                                                 Asset {item.asset_ids.length ? item.asset_ids.map((id) => `#${id}`).join(", ") : "—"} · Stock {item.stock_ids.length ? item.stock_ids.map((id) => `#${id}`).join(", ") : "—"}
//                                                             </p>
//                                                         )}
//                                                     </div>
//                                                 </div>
//                                             ))}
//                                     </div>
//                                 </div>
//                             )}

//                             {validation.rows.some((item) => item.validation_status === "EXISTING_SAME_MR") && (
//                                 <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/15">
//                                     <div className="mb-2 flex items-center gap-2">
//                                         <Database className="h-4 w-4 text-amber-600 dark:text-amber-400" />
//                                         <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Already stored under this MR — automatically skipped</p>
//                                     </div>

//                                     <div className="grid gap-2 md:grid-cols-2">
//                                         {validation.rows
//                                             .filter((item) => item.validation_status === "EXISTING_SAME_MR")
//                                             .map((item) => (
//                                                 <div key={`existing-${item.row_no}-${item.serial_number}`} className="rounded-lg border border-amber-200 bg-white/80 px-3 py-2.5 text-[8px] dark:border-amber-900/50 dark:bg-black/10">
//                                                     <div className="flex flex-wrap items-center justify-between gap-2">
//                                                         <span className="font-mono font-bold">{item.serial_number || "No serial"}</span>
//                                                         <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[7px] font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
//                                                             <Check className="h-2.5 w-2.5" /> SKIP EXISTING
//                                                         </span>
//                                                     </div>
//                                                     <p className="mt-1 text-muted-foreground">
//                                                         Row #{item.row_no} · Asset {item.asset_ids.length ? item.asset_ids.map((id) => `#${id}`).join(", ") : "—"} · Stock {item.stock_ids.length ? item.stock_ids.map((id) => `#${id}`).join(", ") : "—"}
//                                                     </p>
//                                                 </div>
//                                             ))}
//                                     </div>
//                                 </div>
//                             )}

//                             {validation.rows.some((item) => item.validation_status === "NEW") && (
//                                 <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/15">
//                                     <div className="mb-2 flex items-center gap-2">
//                                         <PackageCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
//                                         <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">New stock rows ready for import</p>
//                                     </div>

//                                     <div className="flex flex-wrap gap-1.5">
//                                         {validation.rows
//                                             .filter((item) => item.validation_status === "NEW")
//                                             .map((item) => (
//                                                 <span key={`new-${item.row_no}-${item.serial_number}`} className="rounded-lg border border-emerald-200 bg-white px-2 py-1 font-mono text-[8px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-black/10 dark:text-emerald-400">
//                                                     #{item.row_no} · {item.serial_number || "No serial / internal tag"}
//                                                 </span>
//                                             ))}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>

//                         <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
//                             <p className="text-[8px] text-muted-foreground">
//                                 Existing and duplicate serials are locked to Skip for data accuracy. Only NEW rows are sent to the existing SCM import endpoint; no extra validation route is required.
//                             </p>

//                             <div className="flex items-center gap-2">
//                                 <Button
//                                     type="button"
//                                     variant="outline"
//                                     size="sm"
//                                     className="h-8 text-[9px]"
//                                     disabled={saving}
//                                     onClick={() => setValidationOpen(false)}
//                                 >
//                                     {validation.can_import ? "Cancel" : "Close"}
//                                 </Button>

//                                 {validation.can_import && (
//                                     <Button
//                                         type="button"
//                                         size="sm"
//                                         className="h-8 gap-1.5 text-[9px]"
//                                         disabled={saving}
//                                         onClick={() => void commitValidatedImport()}
//                                     >
//                                         {saving ? (
//                                             <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
//                                         ) : (
//                                             <PackageCheck className="h-3.5 w-3.5" />
//                                         )}
//                                         Import {validation.new_count} New Item{validation.new_count === 1 ? "" : "s"}
//                                     </Button>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }





//itm/frontend/app/dashboard/stock/stock-entry/page.tsx
"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import {
    Check,
    CheckCircle2,
    ChevronDown,
    Copy,
    Database,
    LoaderCircle,
    PackageCheck,
    RefreshCcw,
    Search,
    ServerCog,
    ShieldCheck,
    TriangleAlert,
    X,
} from "lucide-react";

import {
    api,
    assetDeviceApi,
    categoryApi,
    inventoryWorkflowApi,
    type InventoryCategoryItem,
    type InventorySpecOptions,
    type SCMStockImportItem,
    type SCMStockPreview,
} from "@/lib/api";

import {
    Button,
} from "@/components/ui/button";

type MappingRow = SCMStockImportItem & {
    item_id: string;
    item_name: string;
    item_group: string;
    pr_id: string;
    vendor_name: string;
    purchase_date: string;
    warranty_text: string;
};

type SerialConflictInfo = {
    row: number;
    serial: string;
    assetId: number;
    existingMR: string;
    stockId: number;
    status: number;
    raw: string;
};


type StockValidationStatus =
    | "NEW"
    | "EXISTING_SAME_MR"
    | "CONFLICT_OTHER_MR"
    | "DUPLICATE_IN_PAYLOAD";

type StockValidationRow = {
    row_no: number;
    serial_number: string;
    asset_ids: number[];
    stock_ids: number[];
    existing_mrs: string[];
    pr_numbers: string[];
    asset_status: number | null;
    payload_count: number;
    validation_status: StockValidationStatus;
    multiple_mr_warning: boolean;
};

type StockValidationData = {
    mr_number: string;
    incoming_count: number;
    unique_row_count: number;
    new_count: number;
    existing_same_mr_count: number;
    conflict_count: number;
    duplicate_payload_count: number;
    skipped_count: number;
    can_import: boolean;
    rows: StockValidationRow[];
};

type StockInventoryValidationItem = {
    id: number;
    mr_id?: string | null;
    pr_id?: string | null;
    serial_no?: string | null;
};

type StockInventoryPage = {
    success?: boolean;
    data?: StockInventoryValidationItem[];
    total?: number;
    page?: number;
    page_size?: number;
};

function normalizeSerialKey(value: unknown) {
    return String(value ?? "")
        .trim()
        .toUpperCase();
}

function uniqueNumbers(values: Array<number | null | undefined>) {
    return Array.from(
        new Set(
            values
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value) && value > 0)
        )
    );
}

function uniqueStrings(values: Array<string | null | undefined>) {
    return Array.from(
        new Set(
            values
                .map((value) => String(value ?? "").trim())
                .filter(Boolean)
        )
    );
}

function parseSerialConflict(message: string): SerialConflictInfo | null {
    const match = message.match(
        /row\s+(\d+):\s+serial\s+"([^"]+)"\s+is already registered as Asset #(\d+)\s+under MR\s+(.+?)\s+\(stock #(\d+), status (\d+)\)/i
    );

    if (!match) return null;

    return {
        row: Number(match[1]),
        serial: match[2],
        assetId: Number(match[3]),
        existingMR: match[4].trim(),
        stockId: Number(match[5]),
        status: Number(match[6]),
        raw: message,
    };
}

const fieldClass =
    "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-[10px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground";

const labelClass =
    "mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground";

type SearchOption = {
    value: string;
    label: string;
};

function warrantyEndDate(
    purchaseDate: string,
    warrantyMonths: number
) {
    const value = String(purchaseDate ?? "").trim();

    if (!value || warrantyMonths <= 0) {
        return "";
    }

    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/
    );

    if (!match) {
        return "";
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const hour = Number(match[4] ?? 0);
    const minute = Number(match[5] ?? 0);
    const second = Number(match[6] ?? 0);

    const targetMonthIndex =
        month + warrantyMonths;

    const targetYear =
        year + Math.floor(targetMonthIndex / 12);

    const targetMonth =
        ((targetMonthIndex % 12) + 12) % 12;

    const lastDay = new Date(
        targetYear,
        targetMonth + 1,
        0
    ).getDate();

    const date = new Date(
        targetYear,
        targetMonth,
        Math.min(day, lastDay),
        hour,
        minute,
        second
    );

    const pad = (number: number) =>
        String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(
        date.getMonth() + 1
    )}-${pad(date.getDate())} ${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}:${pad(
        date.getSeconds()
    )}`;
}

function SearchableClearableSelect({
    value,
    options,
    onChange,
    placeholder,
    disabled = false,
    required = false,
    emptyText = "No matching options",
}: {
    value: string;
    options: SearchOption[];
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    required?: boolean;
    emptyText?: string;
}) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selected = options.find(
        (option) => option.value === value
    );

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return options;

        return options.filter((option) =>
            option.label.toLowerCase().includes(term)
        );
    }, [options, query]);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            if (
                rootRef.current &&
                !rootRef.current.contains(
                    event.target as Node
                )
            ) {
                setOpen(false);
                setQuery("");
            }
        };

        document.addEventListener(
            "mousedown",
            onPointerDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                onPointerDown
            );
        };
    }, [open]);

    return (
        <div
            ref={rootRef}
            className="relative"
        >
            <div
                className={`flex h-8 items-center rounded-lg border bg-background transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 ${disabled
                    ? "cursor-not-allowed bg-muted/40 opacity-70"
                    : "border-border"
                    }`}
            >
                <Search className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                <input
                    type="text"
                    value={
                        open
                            ? query
                            : selected?.label ?? ""
                    }
                    disabled={disabled}
                    required={required && !value}
                    placeholder={placeholder}
                    onFocus={() => {
                        if (disabled) return;
                        setOpen(true);
                        setQuery("");
                    }}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                    className="h-full min-w-0 flex-1 bg-transparent px-2 text-[10px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                />

                {value && !disabled ? (
                    <button
                        type="button"
                        aria-label="Clear selection"
                        title="Clear selection"
                        onMouseDown={(event) =>
                            event.preventDefault()
                        }
                        onClick={() => {
                            onChange("");
                            setQuery("");
                            setOpen(false);
                        }}
                        className="mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                ) : null}

                <button
                    type="button"
                    aria-label="Toggle options"
                    disabled={disabled}
                    onMouseDown={(event) =>
                        event.preventDefault()
                    }
                    onClick={() => {
                        if (disabled) return;
                        setOpen((current) => !current);
                        setQuery("");
                    }}
                    className="mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none"
                >
                    <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""
                            }`}
                    />
                </button>
            </div>

            {open && !disabled && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[150] overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
                    <div className="max-h-[320px] overflow-y-auto overscroll-contain p-1">
                        {filtered.length === 0 ? (
                            <div className="px-2.5 py-3 text-center text-[9px] text-muted-foreground">
                                {emptyText}
                            </div>
                        ) : (
                            filtered.map((option) => {
                                const active =
                                    option.value === value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onMouseDown={(event) =>
                                            event.preventDefault()
                                        }
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                            setQuery("");
                                        }}
                                        className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[10px] transition ${active
                                            ? "bg-primary/10 font-semibold text-primary"
                                            : "hover:bg-muted"
                                            }`}
                                    >
                                        <span className="min-w-0 truncate">
                                            {option.label}
                                        </span>
                                        {active && (
                                            <Check className="h-3.5 w-3.5 shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function normalizeType(
    value: string | null | undefined
) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

function emptyRow(
    preview: SCMStockPreview,
    index: number
): MappingRow {
    const item = preview.items[index];

    return {
        source_index: item.source_index,
        serial_number: item.serial_number,

        category_id: null,
        brand_id: null,
        model_id: null,

        category: "",
        brand: "",
        model: "",
        cpu: "",
        ram: "",
        ssd: "",
        monitor: "",
        warranty_months:
            item.warranty_months || 0,
        device_type:
            item.item_group
                ?.toLowerCase()
                .includes("accessor")
                ? "IT Accessory"
                : "IT Device",
        remarks: "",

        item_id: item.item_id,
        item_name: item.item_name,
        item_group: item.item_group,
        pr_id: item.pr_id,
        vendor_name: item.vendor_name,
        purchase_date: item.purchase_date,
        warranty_text: item.warranty_text,
    };
}

export default function StockEntryPage() {
    const router = useRouter();

    const [mrNumber, setMRNumber] =
        useState("");

    const [preview, setPreview] =
        useState<SCMStockPreview | null>(
            null
        );

    const [rows, setRows] =
        useState<MappingRow[]>([]);

    // Professional default for bulk MR intake:
    // Row #1 acts as the template for all remaining rows.
    // Disable this only when one MR contains mixed device types.
    const [syncFirstRow, setSyncFirstRow] =
        useState(true);

    const [masterData, setMasterData] =
        useState<InventoryCategoryItem[]>(
            []
        );

    const [masterLoading, setMasterLoading] =
        useState(true);

    const [specOptions, setSpecOptions] =
        useState<InventorySpecOptions>({
            cpu: [],
            ram: [],
            ssd: [],
            monitor: [],
        });

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [validating, setValidating] =
        useState(false);

    const [validationOpen, setValidationOpen] =
        useState(false);

    const [validation, setValidation] =
        useState<StockValidationData | null>(null);

    const [error, setError] =
        useState("");

    const [serialConflict, setSerialConflict] =
        useState<SerialConflictInfo | null>(null);

    const [success, setSuccess] =
        useState("");

    const requestSequence = useRef(0);
    const lastLoadedMR = useRef("");

    /* ======================================================
       MASTER DATA

       inventory_categories is the single source for:
       Category -> Brand -> Model.
    ====================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadMasterData() {
            try {
                setMasterLoading(true);

                const response =
                    await categoryApi.list();

                if (!mounted) return;

                setMasterData(
                    (response.data ?? [])
                        .filter(
                            (item) =>
                                Number(
                                    item.status ?? 1
                                ) === 1
                        )
                        .sort((a, b) =>
                            String(
                                a.category_name ?? ""
                            ).localeCompare(
                                String(
                                    b.category_name ?? ""
                                )
                            )
                        )
                );
            } catch {
                if (!mounted) return;

                setMasterData([]);
                setError(
                    "Unable to load ITM Category / Brand / Model master data."
                );
            } finally {
                if (mounted) {
                    setMasterLoading(false);
                }
            }
        }

        void loadMasterData();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        async function loadSpecOptions() {
            try {
                const response =
                    await inventoryWorkflowApi.specOptions();

                if (!mounted) return;

                setSpecOptions({
                    cpu: response.data?.cpu ?? [],
                    ram: response.data?.ram ?? [],
                    ssd: response.data?.ssd ?? [],
                    monitor:
                        response.data?.monitor ?? [],
                });
            } catch {
                if (!mounted) return;

                // Optional specification fields should not block
                // SCM stock intake if the option catalogue fails.
                setSpecOptions({
                    cpu: [],
                    ram: [],
                    ssd: [],
                    monitor: [],
                });
            }
        }

        void loadSpecOptions();

        return () => {
            mounted = false;
        };
    }, []);

    const categories = useMemo(
        () =>
            masterData.filter(
                (item) =>
                    normalizeType(item.type) ===
                    "category" &&
                    Number(item.parent_id ?? 0) ===
                    0
            ),
        [masterData]
    );

    function brandsFor(
        categoryID: number | null | undefined
    ) {
        if (!categoryID) return [];

        return masterData.filter(
            (item) =>
                normalizeType(item.type) ===
                "brand" &&
                Number(item.parent_id ?? 0) ===
                Number(categoryID)
        );
    }

    function modelsFor(
        brandID: number | null | undefined
    ) {
        if (!brandID) return [];

        return masterData.filter(
            (item) =>
                normalizeType(item.type) ===
                "model" &&
                Number(item.parent_id ?? 0) ===
                Number(brandID)
        );
    }

    function isRowComplete(
        row: MappingRow
    ) {
        return Boolean(
            row.category_id &&
            row.brand_id &&
            row.model_id &&
            Number(row.warranty_months ?? 0) > 0
        );
    }

    const completeRows = rows.filter((row) =>
        isRowComplete(row)
    ).length;

    /* ======================================================
       SCM AJAX-LIKE MR PREVIEW

       No Load button is required.  A pasted/typed MR is
       fetched automatically after a short debounce.
    ====================================================== */

    async function loadMR(
        mrInput: string,
        force = false
    ) {
        const mr = mrInput.trim();

        if (!mr) {
            return;
        }

        if (
            !force &&
            lastLoadedMR.current === mr
        ) {
            return;
        }

        const sequence =
            ++requestSequence.current;

        try {
            setLoading(true);
            setError("");
            setSerialConflict(null);
            setSuccess("");
            setValidation(null);
            setValidationOpen(false);

            const response =
                await inventoryWorkflowApi
                    .previewMR(mr);

            if (
                sequence !==
                requestSequence.current
            ) {
                return;
            }

            const data = response.data;

            lastLoadedMR.current =
                data.mr_id || mr;

            setPreview(data);
            setMRNumber(data.mr_id || mr);
            setRows(
                data.items.map(
                    (_, index) =>
                        emptyRow(
                            data,
                            index
                        )
                )
            );
        } catch (reason) {
            if (
                sequence !==
                requestSequence.current
            ) {
                return;
            }

            lastLoadedMR.current = "";
            setPreview(null);
            setRows([]);
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to load SCM MR data."
            );
        } finally {
            if (
                sequence ===
                requestSequence.current
            ) {
                setLoading(false);
            }
        }
    }

    useEffect(() => {
        const mr = mrNumber.trim();

        if (!mr) {
            requestSequence.current++;
            lastLoadedMR.current = "";
            setLoading(false);
            setPreview(null);
            setRows([]);
            setError("");
            setSuccess("");
            setValidation(null);
            setValidationOpen(false);
            return;
        }

        // Prevent SCM calls while the operator has only
        // typed the first few characters of an MR.
        if (mr.length < 10) {
            return;
        }

        if (
            lastLoadedMR.current === mr
        ) {
            return;
        }

        const timer =
            window.setTimeout(() => {
                void loadMR(mr);
            }, 650);

        return () => {
            window.clearTimeout(timer);
        };
    }, [mrNumber]);

    function clearMR() {
        requestSequence.current++;
        lastLoadedMR.current = "";
        setMRNumber("");
        setPreview(null);
        setRows([]);
        setLoading(false);
        setError("");
        setSerialConflict(null);
        setSuccess("");
        setValidation(null);
        setValidationOpen(false);
        setValidating(false);
    }

    const categorySelectOptions: SearchOption[] =
        categories.map((item) => ({
            value: String(item.id),
            label: String(item.category_name ?? ""),
        }));

    const cpuSelectOptions: SearchOption[] =
        specOptions.cpu.map((value) => ({
            value,
            label: value,
        }));

    const ramSelectOptions: SearchOption[] =
        specOptions.ram.map((value) => ({
            value,
            label: value,
        }));

    const ssdSelectOptions: SearchOption[] =
        specOptions.ssd.map((value) => ({
            value,
            label: value,
        }));

    const monitorSelectOptions: SearchOption[] =
        specOptions.monitor.map((value) => ({
            value,
            label: value,
        }));

    const warrantySelectOptions: SearchOption[] = [
        { value: "3", label: "3 Months" },
        { value: "6", label: "6 Months" },
        { value: "12", label: "1 Year" },
        { value: "24", label: "2 Years" },
        { value: "36", label: "3 Years" },
        { value: "48", label: "4 Years" },
        { value: "60", label: "5 Years" },
        { value: "72", label: "6 Years" },
        { value: "84", label: "7 Years" },
        { value: "96", label: "8 Years" },
        { value: "108", label: "9 Years" },
        { value: "120", label: "10 Years" },
    ];

    /* ======================================================
       CLASSIFICATION
    ====================================================== */

    function updateRow(
        index: number,
        patch: Partial<MappingRow>
    ) {
        setRows((current) =>
            current.map((row, rowIndex) =>
                rowIndex === index
                    ? {
                        ...row,
                        ...patch,
                    }
                    : row
            )
        );
    }

    function updateClassification(
        index: number,
        patch: Partial<MappingRow>
    ) {
        setRows((current) =>
            current.map((row, rowIndex) => {
                const shouldSync =
                    syncFirstRow &&
                    index === 0;

                if (
                    rowIndex !== index &&
                    !shouldSync
                ) {
                    return row;
                }

                return {
                    ...row,
                    ...patch,
                };
            })
        );
    }

    function selectCategory(
        index: number,
        categoryID: number
    ) {
        const selected =
            categories.find(
                (item) =>
                    item.id === categoryID
            );

        updateClassification(index, {
            category_id:
                selected?.id ?? null,
            category:
                selected?.category_name ?? "",

            // A parent change invalidates Brand + Model.
            brand_id: null,
            brand: "",
            model_id: null,
            model: "",
        });
    }

    function selectBrand(
        index: number,
        brandID: number
    ) {
        const selected =
            masterData.find(
                (item) =>
                    item.id === brandID
            );

        updateClassification(index, {
            brand_id:
                selected?.id ?? null,
            brand:
                selected?.category_name ?? "",
            model_id: null,
            model: "",
        });
    }

    function selectModel(
        index: number,
        modelID: number
    ) {
        const selected =
            masterData.find(
                (item) =>
                    item.id === modelID
            );

        updateClassification(index, {
            model_id:
                selected?.id ?? null,
            model:
                selected?.category_name ?? "",
        });
    }

    /* ======================================================
       FINAL DATABASE COMMIT
    ====================================================== */

    function importPayloadForRows(sourceRows: MappingRow[]) {
        return sourceRows.map((row) => ({
            source_index:
                row.source_index,
            serial_number:
                row.serial_number,

            category_id:
                row.category_id,
            brand_id:
                row.brand_id,
            model_id:
                row.model_id,

            // Names remain for backwards compatibility;
            // backend IDs are the canonical validation path.
            category:
                row.category.trim(),
            brand:
                row.brand?.trim(),
            model:
                row.model?.trim(),
            cpu:
                row.cpu?.trim(),
            ram:
                row.ram?.trim(),
            ssd:
                row.ssd?.trim(),
            monitor:
                row.monitor?.trim(),
            warranty_months:
                Number(
                    row.warranty_months ??
                    0
                ),
            device_type:
                row.device_type,
            remarks:
                row.remarks?.trim(),
        }));
    }

    function validateFormRows() {
        const incomplete =
            rows.findIndex(
                (row) =>
                    !isRowComplete(row)
            );

        if (incomplete >= 0) {
            setError(
                `Complete Category / Brand / Model / Warranty for row ${incomplete + 1
                } before importing.`
            );
            return false;
        }

        return true;
    }

    async function importStock() {
        if (!preview || !validateFormRows()) {
            return;
        }

        try {
            setValidating(true);
            setError("");
            setSerialConflict(null);
            setSuccess("");
            setValidation(null);
            setValidationOpen(false);

            /*
             * Route-safe preflight.
             *
             * No new backend validation route is required here. We intentionally
             * use the application's existing /stock list endpoint together with
             * the existing assetDeviceApi search endpoint. This removes the
             * previous "route not found" failure while still checking BOTH
             * stack_inventory and asset_devices before anything is inserted.
             *
             * IMPORTANT:
             * MR deletion alone does not make a serial NEW. Serial uniqueness is
             * checked globally. If a serial still exists under another MR, it is
             * skipped. If both tables no longer contain that serial, it is NEW.
             */

            const stockRows: StockInventoryValidationItem[] = [];
            let stockPage = 1;
            const stockPageSize = 1000;

            while (stockPage <= 100) {
                const stockResponse =
                    await api.get<StockInventoryPage>(
                        `/stock?page=${stockPage}&page_size=${stockPageSize}`
                    );

                const batch =
                    stockResponse.data ?? [];

                stockRows.push(...batch);

                const total = Number(
                    stockResponse.total ??
                    stockRows.length
                );

                if (
                    batch.length === 0 ||
                    stockRows.length >= total
                ) {
                    break;
                }

                stockPage += 1;
            }

            const serialCounts = new Map<string, number>();

            rows.forEach((row) => {
                const key = normalizeSerialKey(
                    row.serial_number
                );

                if (!key) return;

                serialCounts.set(
                    key,
                    (serialCounts.get(key) ?? 0) + 1
                );
            });

            const uniqueSerials = Array.from(
                serialCounts.keys()
            );

            const assetMatchesBySerial = new Map<
                string,
                Array<{
                    id: number;
                    device_serial?: string | null;
                    mr_number?: string | null;
                    pr_number?: string | null;
                    asset_status?: number | null;
                }>
            >();

            await Promise.all(
                uniqueSerials.map(
                    async (serialKey) => {
                        const assetResponse =
                            await assetDeviceApi.list({
                                page: 1,
                                limit: 50,
                                search: serialKey,
                            });

                        const exactMatches =
                            (assetResponse.data ?? [])
                                .filter(
                                    (asset) =>
                                        normalizeSerialKey(
                                            asset.device_serial
                                        ) === serialKey
                                )
                                .map((asset) => ({
                                    id: Number(asset.id),
                                    device_serial: asset.device_serial,
                                    mr_number: asset.mr_number,
                                    pr_number: asset.pr_number,
                                    asset_status: asset.asset_status,
                                }));

                        assetMatchesBySerial.set(
                            serialKey,
                            exactMatches
                        );
                    }
                )
            );

            const targetMR =
                String(preview.mr_id ?? "")
                    .trim();

            const seenIncoming = new Set<string>();

            const validationRows: StockValidationRow[] =
                rows.map((row, index) => {
                    const serialNumber =
                        String(
                            row.serial_number ??
                            ""
                        ).trim();

                    const serialKey =
                        normalizeSerialKey(serialNumber);

                    const payloadCount =
                        serialKey
                            ? serialCounts.get(serialKey) ?? 1
                            : 1;

                    const repeatedInsidePayload =
                        Boolean(
                            serialKey &&
                            seenIncoming.has(serialKey)
                        );

                    if (serialKey) {
                        seenIncoming.add(serialKey);
                    }

                    const matchingStock =
                        serialKey
                            ? stockRows.filter(
                                (stock) =>
                                    normalizeSerialKey(
                                        stock.serial_no
                                    ) === serialKey
                            )
                            : [];

                    const matchingAssets =
                        serialKey
                            ? assetMatchesBySerial.get(
                                serialKey
                            ) ?? []
                            : [];

                    const existingMRs =
                        uniqueStrings([
                            ...matchingStock.map(
                                (stock) => stock.mr_id
                            ),
                            ...matchingAssets.map(
                                (asset) => asset.mr_number
                            ),
                        ]);

                    const prNumbers =
                        uniqueStrings([
                            ...matchingStock.map(
                                (stock) => stock.pr_id
                            ),
                            ...matchingAssets.map(
                                (asset) => asset.pr_number
                            ),
                        ]);

                    const assetIDs =
                        uniqueNumbers(
                            matchingAssets.map(
                                (asset) => asset.id
                            )
                        );

                    const stockIDs =
                        uniqueNumbers(
                            matchingStock.map(
                                (stock) => stock.id
                            )
                        );

                    const hasDatabaseReference =
                        matchingStock.length > 0 ||
                        matchingAssets.length > 0;

                    const existsSameMR =
                        existingMRs.some(
                            (mr) => mr === targetMR
                        );

                    const existsOtherMR =
                        existingMRs.some(
                            (mr) =>
                                Boolean(mr) &&
                                mr !== targetMR
                        );

                    let validationStatus: StockValidationStatus =
                        "NEW";

                    if (repeatedInsidePayload) {
                        validationStatus =
                            "DUPLICATE_IN_PAYLOAD";
                    } else if (
                        existsOtherMR ||
                        (
                            hasDatabaseReference &&
                            !existsSameMR
                        )
                    ) {
                        validationStatus =
                            "CONFLICT_OTHER_MR";
                    } else if (existsSameMR) {
                        validationStatus =
                            "EXISTING_SAME_MR";
                    }

                    const statusValues =
                        matchingAssets
                            .map(
                                (asset) =>
                                    Number(
                                        asset.asset_status
                                    )
                            )
                            .filter(
                                (value) =>
                                    Number.isFinite(value)
                            );

                    return {
                        row_no: index + 1,
                        serial_number: serialNumber,
                        asset_ids: assetIDs,
                        stock_ids: stockIDs,
                        existing_mrs: existingMRs,
                        pr_numbers: prNumbers,
                        asset_status:
                            statusValues.length
                                ? statusValues[0]
                                : null,
                        payload_count: payloadCount,
                        validation_status: validationStatus,
                        multiple_mr_warning:
                            existingMRs.length > 1,
                    };
                });

            const newCount =
                validationRows.filter(
                    (item) =>
                        item.validation_status ===
                        "NEW"
                ).length;

            const existingSameMRCount =
                validationRows.filter(
                    (item) =>
                        item.validation_status ===
                        "EXISTING_SAME_MR"
                ).length;

            const conflictCount =
                validationRows.filter(
                    (item) =>
                        item.validation_status ===
                        "CONFLICT_OTHER_MR"
                ).length;

            const duplicatePayloadCount =
                validationRows.filter(
                    (item) =>
                        item.validation_status ===
                        "DUPLICATE_IN_PAYLOAD"
                ).length;

            const validationData: StockValidationData = {
                mr_number: targetMR,
                incoming_count: rows.length,
                unique_row_count:
                    new Set(
                        rows.map(
                            (row, index) =>
                                normalizeSerialKey(
                                    row.serial_number
                                ) ||
                                `__EMPTY_${index}`
                        )
                    ).size,
                new_count: newCount,
                existing_same_mr_count:
                    existingSameMRCount,
                conflict_count: conflictCount,
                duplicate_payload_count:
                    duplicatePayloadCount,
                skipped_count:
                    rows.length - newCount,
                can_import: newCount > 0,
                rows: validationRows,
            };

            setValidation(validationData);

            // Clean import UX:
            // If every incoming serial is genuinely NEW, there is nothing for the
            // operator to review. Continue directly to the existing authoritative
            // import endpoint. The review modal is reserved for skipped/existing
            // serials so users only see it when a decision/explanation is useful.
            if (
                validationData.new_count === rows.length &&
                validationData.skipped_count === 0
            ) {
                await commitValidatedImport(validationData);
                return;
            }

            setValidationOpen(true);
        } catch (reason) {
            setValidation(null);
            setValidationOpen(false);
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to validate MR / serial data."
            );
        } finally {
            setValidating(false);
        }
    }

    async function commitValidatedImport(
        validationOverride?: StockValidationData
    ) {
        const activeValidation =
            validationOverride ?? validation;

        if (!preview || !activeValidation) {
            return;
        }

        const newRowNumbers =
            new Set(
                activeValidation.rows
                    .filter(
                        (item) =>
                            item.validation_status ===
                            "NEW"
                    )
                    .map(
                        (item) =>
                            item.row_no
                    )
            );

        const rowsToImport =
            rows.filter(
                (_, index) =>
                    newRowNumbers.has(
                        index + 1
                    )
            );

        if (rowsToImport.length === 0) {
            setValidationOpen(false);
            setError(
                "Nothing to import. Every incoming serial is already registered or duplicated, so no new database row will be created."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSerialConflict(null);
            setSuccess("");

            const response =
                await inventoryWorkflowApi
                    .importMR(
                        preview.mr_id,
                        importPayloadForRows(
                            rowsToImport
                        )
                    );

            const importResult = response.data as typeof response.data & {
                received?: number;
                stock_rows_committed?: number;
                asset_created?: number;
                asset_synchronized?: number;
                asset_normalized_available?: number;
                conflicted?: number;
                conflicts?: Array<{
                    row?: number;
                    serial?: string;
                    asset_id?: number;
                    existing_mr?: string;
                    stock_id?: number;
                    asset_status?: number;
                }>;
            };

            const conflicted = Number(importResult.conflicted ?? 0);
            const assetCreated = Number(importResult.asset_created ?? importResult.imported ?? 0);
            const assetSynchronized = Number(importResult.asset_synchronized ?? 0);
            const assetNormalizedAvailable = Number(importResult.asset_normalized_available ?? 0);
            const stockCommitted = Number(
                importResult.stock_rows_committed ??
                (Number(importResult.imported ?? 0) + Number(importResult.updated ?? 0))
            );
            const firstConflict = importResult.conflicts?.[0];

            setValidationOpen(false);

            setSuccess(
                conflicted > 0
                    ? `Import completed with warning: ${stockCommitted} stock row(s) committed, ${assetCreated} new asset(s) created, ${conflicted} serial conflict(s) kept pending verification. Opening Device Operations...`
                    : `Import completed: ${stockCommitted} stock row(s) committed, ${assetCreated} new asset(s), ${assetSynchronized} existing asset(s) synchronized${assetNormalizedAvailable > 0 ? `, ${assetNormalizedAvailable} normalized to Available` : ""}. Opening Device Operations...`
            );

            const destination =
                `/dashboard/assets/devices?import=success&mr=${encodeURIComponent(
                    preview.mr_id
                )}&imported=${encodeURIComponent(
                    String(response.data.imported ?? 0)
                )}&updated=${encodeURIComponent(
                    String(response.data.updated ?? 0)
                )}&stock_committed=${encodeURIComponent(
                    String(stockCommitted)
                )}&assets_created=${encodeURIComponent(
                    String(assetCreated)
                )}&assets_synchronized=${encodeURIComponent(
                    String(assetSynchronized)
                )}&normalized_available=${encodeURIComponent(
                    String(assetNormalizedAvailable)
                )}&conflicted=${encodeURIComponent(
                    String(conflicted)
                )}&conflict_asset_id=${encodeURIComponent(
                    String(firstConflict?.asset_id ?? "")
                )}&conflict_serial=${encodeURIComponent(
                    String(firstConflict?.serial ?? "")
                )}`;

            // The existing import endpoint remains the authoritative second check.
            // Replace avoids returning to a stale form that could be submitted again.
            router.replace(destination);
        } catch (reason) {
            const message =
                reason instanceof Error
                    ? reason.message
                    : "Unable to import stock.";

            const conflict =
                parseSerialConflict(message);

            if (conflict) {
                setValidationOpen(false);
                setSerialConflict(conflict);
                setError("");
            } else {
                setSerialConflict(null);
                setError(message);
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
                            <ServerCog className="h-5 w-5 text-primary" />
                        </div>

                        <div>
                            <h1 className="text-sm font-semibold text-foreground">
                                SCM Stock Intake
                            </h1>

                            <p className="mt-1 max-w-2xl text-[10px] leading-5 text-muted-foreground">
                                Enter an approved Material Requisition. SCM data loads automatically; classify each received item with ITM master data, then commit the stock once.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Server-side SCM integration
                    </div>
                </div>

                <div className="p-5">
                    <label className="block">
                        <span className={labelClass}>
                            Material Requisition (MR)
                        </span>

                        <div className="flex h-10 items-center rounded-lg border border-border bg-background px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                            <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />

                            <input
                                value={mrNumber}
                                onChange={(event) => {
                                    setMRNumber(
                                        event.target.value
                                    );
                                    setSuccess("");
                                }}
                                placeholder="Enter / paste MR number — SCM will load automatically"
                                className="h-full min-w-0 flex-1 bg-transparent text-[10px] outline-none"
                                autoComplete="off"
                            />

                            {loading && (
                                <div className="mr-2 flex items-center gap-1.5 whitespace-nowrap text-[8px] font-medium text-primary">
                                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                    Loading SCM...
                                </div>
                            )}

                            {!loading &&
                                preview && (
                                    <div className="mr-2 hidden items-center gap-1.5 whitespace-nowrap text-[8px] font-semibold text-emerald-600 sm:flex">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {preview.items.length} item(s) loaded
                                    </div>
                                )}

                            {mrNumber && (
                                <button
                                    type="button"
                                    aria-label="Clear MR"
                                    onClick={clearMR}
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </label>

                    {serialConflict && (
                        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200">
                            <div className="flex items-start gap-2.5">
                                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold">
                                        Duplicate device serial blocked safely
                                    </p>
                                    <p className="mt-1 text-[9px] leading-5">
                                        Row {serialConflict.row} · Serial <span className="font-mono font-bold">{serialConflict.serial}</span> is already registered as <span className="font-semibold">Asset #{serialConflict.assetId}</span>.
                                    </p>

                                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                        <div className="rounded-lg border border-amber-200 bg-white/70 px-2.5 py-2 dark:border-amber-900/60 dark:bg-black/10">
                                            <p className="text-[7px] font-semibold uppercase tracking-wide opacity-70">Existing MR</p>
                                            <p className="mt-1 break-all text-[8px] font-semibold">{serialConflict.existingMR || "—"}</p>
                                        </div>
                                        <div className="rounded-lg border border-amber-200 bg-white/70 px-2.5 py-2 dark:border-amber-900/60 dark:bg-black/10">
                                            <p className="text-[7px] font-semibold uppercase tracking-wide opacity-70">Existing Stock</p>
                                            <p className="mt-1 text-[8px] font-semibold">#{serialConflict.stockId}</p>
                                        </div>
                                        <div className="rounded-lg border border-amber-200 bg-white/70 px-2.5 py-2 dark:border-amber-900/60 dark:bg-black/10">
                                            <p className="text-[7px] font-semibold uppercase tracking-wide opacity-70">Asset Status Code</p>
                                            <p className="mt-1 text-[8px] font-semibold">{serialConflict.status}</p>
                                        </div>
                                    </div>

                                    <p className="mt-2 text-[8px] leading-4 opacity-90">
                                        No duplicate asset was created. Verify the physical device / SCM serial and correct SCM if this is a different device. Do not remove the unique serial constraint.
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/assets/devices/${serialConflict.assetId}`
                                                )
                                            }
                                            className="inline-flex h-7 items-center rounded-md border border-amber-400 bg-white px-2.5 text-[8px] font-semibold hover:bg-amber-100 dark:bg-transparent dark:hover:bg-amber-950/50"
                                        >
                                            View Existing Asset #{serialConflict.assetId}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={loading || saving}
                                            onClick={() => {
                                                setSerialConflict(null);
                                                void loadMR(mrNumber, true);
                                            }}
                                            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-amber-400 px-2.5 text-[8px] font-semibold hover:bg-amber-100 disabled:opacity-50 dark:hover:bg-amber-950/50"
                                        >
                                            <RefreshCcw className="h-3 w-3" />
                                            Reload MR after SCM correction
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
                            <span>{error}</span>

                            {mrNumber.trim().length >=
                                10 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            void loadMR(
                                                mrNumber,
                                                true
                                            )
                                        }
                                        disabled={loading}
                                        className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-[8px] font-semibold hover:bg-red-100 disabled:opacity-50 dark:border-red-900"
                                    >
                                        <RefreshCcw className="h-3 w-3" />
                                        Retry
                                    </button>
                                )}
                        </div>
                    )}

                    {success && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            {success}
                        </div>
                    )}
                </div>
            </div>

            {preview && (
                <>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                MR Number
                            </p>
                            <p className="mt-1 break-all text-[10px] font-semibold text-foreground">
                                {preview.mr_id}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                SCM Items
                            </p>
                            <p className="mt-1 text-lg font-bold text-primary">
                                {preview.items.length}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Ready to Import
                            </p>
                            <p
                                className={`mt-1 text-lg font-bold ${completeRows ===
                                    rows.length
                                    ? "text-emerald-600"
                                    : "text-amber-600"
                                    }`}
                            >
                                {completeRows}/{rows.length}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                            <div>
                                <h2 className="text-[11px] font-semibold text-foreground">
                                    SCM Receipt & ITM Classification
                                </h2>
                                <p className="mt-0.5 text-[8px] text-muted-foreground">
                                    SCM procurement fields are read-only. Category → Brand → Model comes from the ITM inventory master.
                                </p>
                                {rows.length > 1 && syncFirstRow && (
                                    <p className="mt-1 text-[8px] font-medium text-primary">
                                        Row #1 is the active template: classification and remarks are synchronized to all rows automatically.
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {rows.length > 1 && (
                                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2 text-[8px] font-medium text-foreground">
                                        <input
                                            type="checkbox"
                                            checked={syncFirstRow}
                                            onChange={(event) =>
                                                setSyncFirstRow(
                                                    event.target.checked
                                                )
                                            }
                                            className="h-3.5 w-3.5 accent-primary"
                                        />
                                        <Copy className="h-3 w-3 text-primary" />
                                        <span>
                                            Auto-apply Row #1 classification to all rows
                                        </span>
                                    </label>
                                )}

                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-8 gap-1.5 text-[9px]"
                                    disabled={
                                        saving ||
                                        validating ||
                                        rows.length === 0 ||
                                        completeRows !==
                                        rows.length
                                    }
                                    onClick={() =>
                                        void importStock()
                                    }
                                >
                                    {validating ? (
                                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                    )}
                                    {validating
                                        ? "Checking MR / Serial..."
                                        : `Review & Import ${rows.length}`}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3 p-4">
                            {rows.map((row, index) => {
                                const source =
                                    preview.items[index];

                                const brandOptions =
                                    brandsFor(
                                        row.category_id
                                    );

                                const modelOptions =
                                    modelsFor(
                                        row.brand_id
                                    );

                                const rowReady =
                                    isRowComplete(row);

                                return (
                                    <div
                                        key={source.source_index}
                                        className="relative overflow-visible rounded-xl border border-border"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-foreground">
                                                        {source.item_name ||
                                                            "SCM Item"}
                                                    </p>
                                                    <p className="text-[8px] text-muted-foreground">
                                                        {source.item_group ||
                                                            "Unclassified group"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-md border px-2 py-1 text-[7px] font-semibold ${rowReady
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400"
                                                        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-400"
                                                        }`}
                                                >
                                                    {rowReady
                                                        ? "Ready"
                                                        : "Classification required"}
                                                </span>

                                                <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[8px] text-muted-foreground">
                                                    {source.serial_number ||
                                                        "Internal asset tag will be generated"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 p-4 xl:grid-cols-2">
                                            <div className="rounded-lg border border-border bg-muted/15 p-3">
                                                <div className="mb-3 flex items-center gap-2">
                                                    <Database className="h-3.5 w-3.5 text-amber-600" />
                                                    <p className="text-[9px] font-semibold text-foreground">
                                                        SCM Inventory
                                                    </p>
                                                </div>

                                                <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                                                    {[
                                                        [
                                                            "MR Number",
                                                            preview.mr_id,
                                                        ],
                                                        [
                                                            "PR Number",
                                                            source.pr_id,
                                                        ],
                                                        [
                                                            "Vendor Name",
                                                            source.vendor_name,
                                                        ],
                                                        [
                                                            "Received / GR",
                                                            source.gr_id,
                                                        ],
                                                        [
                                                            "Serial No.",
                                                            source.serial_number,
                                                        ],
                                                        [
                                                            "Purchase Date",
                                                            source.purchase_date,
                                                        ],
                                                        [
                                                            "Item Group",
                                                            source.item_group,
                                                        ],
                                                        [
                                                            "Item Name",
                                                            source.item_name,
                                                        ],
                                                        [
                                                            "SCM Warranty",
                                                            source.warranty_text ||
                                                            (source.warranty_months
                                                                ? `${source.warranty_months} month(s)`
                                                                : ""),
                                                        ],
                                                    ].map(
                                                        ([
                                                            label,
                                                            value,
                                                        ]) => (
                                                            <div
                                                                key={label}
                                                            >
                                                                <p className="text-[7px] font-semibold uppercase text-muted-foreground">
                                                                    {label}
                                                                </p>
                                                                <p className="mt-1 break-words text-[9px] font-medium text-foreground">
                                                                    {value ||
                                                                        "—"}
                                                                </p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <PackageCheck className="h-3.5 w-3.5 text-primary" />
                                                        <p className="text-[9px] font-semibold text-foreground">
                                                            ITM Classification
                                                        </p>
                                                    </div>

                                                    {masterLoading && (
                                                        <span className="flex items-center gap-1 text-[7px] text-muted-foreground">
                                                            <LoaderCircle className="h-3 w-3 animate-spin" />
                                                            Loading master data
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    <div>
                                                        <span className={labelClass}>
                                                            Category <span className="text-red-500">*</span>
                                                        </span>
                                                        <SearchableClearableSelect
                                                            value={
                                                                row.category_id
                                                                    ? String(
                                                                        row.category_id
                                                                    )
                                                                    : ""
                                                            }
                                                            options={
                                                                categorySelectOptions
                                                            }
                                                            disabled={
                                                                masterLoading
                                                            }
                                                            required
                                                            placeholder="Search category..."
                                                            onChange={(value) =>
                                                                selectCategory(
                                                                    index,
                                                                    Number(
                                                                        value ||
                                                                        0
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className={labelClass}>
                                                            Brand <span className="text-red-500">*</span>
                                                        </span>
                                                        <SearchableClearableSelect
                                                            value={
                                                                row.brand_id
                                                                    ? String(
                                                                        row.brand_id
                                                                    )
                                                                    : ""
                                                            }
                                                            options={brandOptions.map(
                                                                (item) => ({
                                                                    value: String(
                                                                        item.id
                                                                    ),
                                                                    label: String(
                                                                        item.category_name ??
                                                                        ""
                                                                    ),
                                                                })
                                                            )}
                                                            disabled={
                                                                !row.category_id ||
                                                                brandOptions.length ===
                                                                0
                                                            }
                                                            required
                                                            placeholder={
                                                                row.category_id &&
                                                                    brandOptions.length ===
                                                                    0
                                                                    ? "No active brand under category"
                                                                    : "Search brand..."
                                                            }
                                                            onChange={(value) =>
                                                                selectBrand(
                                                                    index,
                                                                    Number(
                                                                        value ||
                                                                        0
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className={labelClass}>
                                                            Model <span className="text-red-500">*</span>
                                                        </span>
                                                        <SearchableClearableSelect
                                                            value={
                                                                row.model_id
                                                                    ? String(
                                                                        row.model_id
                                                                    )
                                                                    : ""
                                                            }
                                                            options={modelOptions.map(
                                                                (item) => ({
                                                                    value: String(
                                                                        item.id
                                                                    ),
                                                                    label: String(
                                                                        item.category_name ??
                                                                        ""
                                                                    ),
                                                                })
                                                            )}
                                                            disabled={
                                                                !row.brand_id ||
                                                                modelOptions.length ===
                                                                0
                                                            }
                                                            required
                                                            placeholder={
                                                                row.brand_id &&
                                                                    modelOptions.length ===
                                                                    0
                                                                    ? "No active model under brand"
                                                                    : "Search model..."
                                                            }
                                                            onChange={(value) =>
                                                                selectModel(
                                                                    index,
                                                                    Number(
                                                                        value ||
                                                                        0
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className={labelClass}>
                                                            CPU / Processor
                                                        </span>
                                                        <SearchableClearableSelect
                                                            value={row.cpu ?? ""}
                                                            options={
                                                                cpuSelectOptions
                                                            }
                                                            placeholder="Search CPU / processor..."
                                                            emptyText="No CPU options found"
                                                            onChange={(value) =>
                                                                updateClassification(
                                                                    index,
                                                                    {
                                                                        cpu: value,
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className={labelClass}>
                                                            RAM
                                                        </span>
                                                        <SearchableClearableSelect
                                                            value={row.ram ?? ""}
                                                            options={
                                                                ramSelectOptions
                                                            }
                                                            placeholder="Search RAM..."
                                                            emptyText="No RAM options found"
                                                            onChange={(value) =>
                                                                updateClassification(
                                                                    index,
                                                                    {
                                                                        ram: value,
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className={labelClass}>
                                                            SSD / HDD
                                                        </span>
                                                        <SearchableClearableSelect
                                                            value={row.ssd ?? ""}
                                                            options={
                                                                ssdSelectOptions
                                                            }
                                                            placeholder="Search SSD / HDD..."
                                                            emptyText="No SSD / HDD options found"
                                                            onChange={(value) =>
                                                                updateClassification(
                                                                    index,
                                                                    {
                                                                        ssd: value,
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className={labelClass}>
                                                            Monitor
                                                        </span>
                                                        <SearchableClearableSelect
                                                            value={row.monitor ?? ""}
                                                            options={
                                                                monitorSelectOptions
                                                            }
                                                            placeholder="Search monitor..."
                                                            emptyText="No monitor options found"
                                                            onChange={(value) =>
                                                                updateClassification(
                                                                    index,
                                                                    {
                                                                        monitor: value,
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className={labelClass}>
                                                            Warranty Duration <span className="text-red-500">*</span>
                                                        </span>
                                                        <SearchableClearableSelect
                                                            value={
                                                                Number(
                                                                    row.warranty_months ??
                                                                    0
                                                                ) > 0
                                                                    ? String(
                                                                        row.warranty_months
                                                                    )
                                                                    : ""
                                                            }
                                                            options={
                                                                warrantySelectOptions
                                                            }
                                                            required
                                                            placeholder="Search warranty..."
                                                            onChange={(value) =>
                                                                updateClassification(
                                                                    index,
                                                                    {
                                                                        warranty_months:
                                                                            Number(
                                                                                value ||
                                                                                0
                                                                            ),
                                                                    }
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className={labelClass}>
                                                            Warranty End Date
                                                        </span>
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            value={
                                                                warrantyEndDate(
                                                                    source.purchase_date,
                                                                    Number(
                                                                        row.warranty_months ??
                                                                        0
                                                                    )
                                                                )
                                                            }
                                                            placeholder="Select warranty duration"
                                                            className={`${fieldClass} font-mono text-[9px] text-emerald-700 dark:text-emerald-400`}
                                                        />
                                                    </div>

                                                    <label>
                                                        <span className={labelClass}>
                                                            Asset Type
                                                        </span>
                                                        <select
                                                            value={
                                                                row.device_type
                                                            }
                                                            onChange={(event) =>
                                                                updateClassification(
                                                                    index,
                                                                    {
                                                                        device_type:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }
                                                                )
                                                            }
                                                            className={fieldClass}
                                                        >
                                                            <option value="IT Device">
                                                                IT Device
                                                            </option>
                                                            <option value="IT Accessory">
                                                                IT Accessory
                                                            </option>
                                                        </select>
                                                    </label>

                                                    <label className="sm:col-span-1 lg:col-span-2">
                                                        <span className={labelClass}>
                                                            Remarks
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={
                                                                row.remarks
                                                            }
                                                            maxLength={500}
                                                            onChange={(event) =>
                                                                updateClassification(
                                                                    index,
                                                                    {
                                                                        remarks:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }
                                                                )
                                                            }
                                                            placeholder="Optional stock / warranty note"
                                                            className={fieldClass}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                            <p className="text-[8px] text-muted-foreground">
                                Existing serials are never inserted twice. Review automatically skipped rows in the confirmation modal; only NEW serials continue to import.
                            </p>

                            <div className="flex items-center gap-1.5 text-[8px] font-medium text-primary">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Import action is available at the top after all rows are ready.
                            </div>
                        </div>
                    </div>
                </>
            )}

            {validationOpen && validation && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
                    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                </div>

                                <div>
                                    <h3 className="text-[12px] font-bold text-foreground">
                                        Stock Import Review
                                    </h3>
                                    <p className="mt-1 text-[9px] text-muted-foreground">
                                        MR <span className="font-mono font-semibold text-foreground">{validation.mr_number}</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                aria-label="Close validation"
                                disabled={saving}
                                onClick={() => setValidationOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5">
                            <div className="grid gap-2 sm:grid-cols-3">
                                <div className="rounded-xl border border-border bg-muted/20 p-3">
                                    <p className="text-[7px] font-bold uppercase tracking-wide text-muted-foreground">Total Items</p>
                                    <p className="mt-1 text-lg font-bold text-foreground">{validation.incoming_count}</p>
                                </div>
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                                    <p className="text-[7px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">New</p>
                                    <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">{validation.new_count}</p>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
                                    <p className="text-[7px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">Skipped</p>
                                    <p className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-400">{validation.skipped_count}</p>
                                </div>
                            </div>

                            {validation.new_count === 0 && (
                                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[9px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
                                    <p className="font-bold">All items already exist</p>
                                    <p className="mt-1">No duplicate records will be created.</p>
                                </div>
                            )}

                            {validation.rows.some((item) => item.validation_status === "CONFLICT_OTHER_MR" || item.validation_status === "DUPLICATE_IN_PAYLOAD") && (
                                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/15">
                                    <div className="mb-2 flex items-start gap-2">
                                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-900 dark:text-amber-200">Already exists — skipped</p>
                                            <p className="mt-0.5 text-[8px] leading-4 text-amber-800/80 dark:text-amber-300/80">These serials will not be inserted again.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {validation.rows
                                            .filter((item) => item.validation_status === "CONFLICT_OTHER_MR" || item.validation_status === "DUPLICATE_IN_PAYLOAD")
                                            .map((item) => (
                                                <div key={`skipped-${item.row_no}-${item.serial_number}`} className="grid gap-2 rounded-lg border border-amber-200 bg-white/80 px-3 py-2.5 text-[8px] dark:border-amber-900/50 dark:bg-black/10 sm:grid-cols-[44px_60px_minmax(160px,1fr)_minmax(180px,2fr)_minmax(150px,1fr)]">
                                                    <div className="flex items-center justify-center">
                                                        <span title="Skipped automatically" className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                            <Check className="h-3.5 w-3.5" />
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[7px] uppercase text-muted-foreground">Row</p>
                                                        <p className="mt-0.5 font-bold">#{item.row_no}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[7px] uppercase text-muted-foreground">Serial</p>
                                                        <p className="mt-0.5 break-all font-mono font-bold">{item.serial_number || "No serial"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[7px] uppercase text-muted-foreground">Existing MR / reason</p>
                                                        <p className="mt-0.5 break-words font-semibold">
                                                            {item.validation_status === "DUPLICATE_IN_PAYLOAD"
                                                                ? `Repeated ${item.payload_count}× inside this SCM payload`
                                                                : item.existing_mrs.length
                                                                    ? item.existing_mrs.join(" · ")
                                                                    : "Existing serial reference without MR"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[7px] uppercase text-muted-foreground">Action</p>
                                                        <p className="mt-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
                                                            ✓ Already exists — skipped
                                                        </p>
                                                        {item.validation_status === "CONFLICT_OTHER_MR" && (
                                                            <p className="mt-0.5 text-muted-foreground">
                                                                Asset {item.asset_ids.length ? item.asset_ids.map((id) => `#${id}`).join(", ") : "—"} · Stock {item.stock_ids.length ? item.stock_ids.map((id) => `#${id}`).join(", ") : "—"}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {validation.rows.some((item) => item.validation_status === "EXISTING_SAME_MR") && (
                                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/15">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Database className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Already exists — skipped</p>
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-2">
                                        {validation.rows
                                            .filter((item) => item.validation_status === "EXISTING_SAME_MR")
                                            .map((item) => (
                                                <div key={`existing-${item.row_no}-${item.serial_number}`} className="rounded-lg border border-amber-200 bg-white/80 px-3 py-2.5 text-[8px] dark:border-amber-900/50 dark:bg-black/10">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="font-mono font-bold">{item.serial_number || "No serial"}</span>
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[7px] font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                            <Check className="h-2.5 w-2.5" /> SKIP EXISTING
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-muted-foreground">
                                                        Row #{item.row_no} · Asset {item.asset_ids.length ? item.asset_ids.map((id) => `#${id}`).join(", ") : "—"} · Stock {item.stock_ids.length ? item.stock_ids.map((id) => `#${id}`).join(", ") : "—"}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {validation.rows.some((item) => item.validation_status === "NEW") && (
                                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/15">
                                    <div className="mb-2 flex items-center gap-2">
                                        <PackageCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">New stock rows ready for import</p>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {validation.rows
                                            .filter((item) => item.validation_status === "NEW")
                                            .map((item) => (
                                                <span key={`new-${item.row_no}-${item.serial_number}`} className="rounded-lg border border-emerald-200 bg-white px-2 py-1 font-mono text-[8px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-black/10 dark:text-emerald-400">
                                                    #{item.row_no} · {item.serial_number || "No serial / internal tag"}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
                            <p className="text-[8px] text-muted-foreground">
                                Existing serials are skipped automatically. Only new items will be added.
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-[9px]"
                                    disabled={saving}
                                    onClick={() => setValidationOpen(false)}
                                >
                                    {validation.can_import ? "Cancel" : "Close"}
                                </Button>

                                {validation.can_import && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="h-8 gap-1.5 text-[9px]"
                                        disabled={saving}
                                        onClick={() => void commitValidatedImport()}
                                    >
                                        {saving ? (
                                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <PackageCheck className="h-3.5 w-3.5" />
                                        )}
                                        Add {validation.new_count} New Item{validation.new_count === 1 ? "" : "s"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
