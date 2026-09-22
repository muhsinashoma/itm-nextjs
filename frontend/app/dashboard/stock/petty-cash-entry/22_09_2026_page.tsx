//frontend/app/dashboard/stock/petty-cash/page.tsx
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
    LoaderCircle,
    PackageCheck,
    Search,
    ShieldCheck,
    TriangleAlert,
    X,
} from "lucide-react";

import {
    api,
    categoryApi,
    inventoryWorkflowApi,
    type InventoryCategoryItem,
    type InventorySpecOptions,
} from "@/lib/api";

import { Button } from "@/components/ui/button";

type SearchOption = {
    value: string;
    label: string;
    description?: string;
};

type VendorOption = {
    id: number;
    vendor_code: string;
    vendor_name: string;
    vendor_types: string[];
};

type PettyCashRow = {
    row_key: string;
    category_id: number | null;
    brand_id: number | null;
    model_id: number | null;
    category: string;
    brand: string;
    model: string;
    serial_no: string;
    purchase_date: string;
    warranty_months: number;
    vendor_id: number | null;
    cpu: string;
    ram: string;
    ssd: string;
    monitor: string;
    device_type: "IT Device" | "IT Accessory";
    remarks: string;
};

type ValidationStatus =
    | "NEW"
    | "EXISTING"
    | "DUPLICATE_IN_REQUEST";

type ValidationRow = {
    row_no: number;
    serial_no: string;
    status: ValidationStatus;
    reason?: string;
    existing_mrs?: string[];
    existing_prs?: string[];
};

type ValidationData = {
    total: number;
    new_count: number;
    existing_count: number;
    duplicate_request_count: number;
    skipped_count: number;
    can_import: boolean;
    rows: ValidationRow[];
};

type ImportResult = {
    batch_id: number;
    batch_no: string;
    requested: number;
    inserted: number;
    skipped: number;
    inserted_serials: string[];
    skipped_serials: string[];
    inventory_type: number;
};

const fieldClass =
    "h-9 w-full rounded-lg border border-border bg-background px-3 text-[11px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground";

const labelClass =
    "mb-1 block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground";

function normalizeType(value: unknown) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

function normalizeSerial(value: unknown) {
    return String(value ?? "")
        .trim()
        .toUpperCase();
}

function todayISO() {
    const now = new Date();
    const local = new Date(
        now.getTime() -
        now.getTimezoneOffset() *
        60_000
    );

    return local
        .toISOString()
        .slice(0, 10);
}

function warrantyEndDate(
    purchaseDate: string,
    months: number
) {
    const match =
        /^(\d{4})-(\d{2})-(\d{2})$/.exec(
            purchaseDate
        );

    if (!match || months <= 0) {
        return "";
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);

    const rawMonth = month + months;
    const targetYear =
        year +
        Math.floor(rawMonth / 12);
    const targetMonth =
        ((rawMonth % 12) + 12) % 12;

    const lastDay = new Date(
        targetYear,
        targetMonth + 1,
        0
    ).getDate();

    const date = new Date(
        targetYear,
        targetMonth,
        Math.min(day, lastDay)
    );

    const pad = (value: number) =>
        String(value).padStart(2, "0");

    return `${date.getFullYear()}-${pad(
        date.getMonth() + 1
    )}-${pad(date.getDate())}`;
}

function newRow(index: number): PettyCashRow {
    return {
        row_key: `row-${index + 1}`,
        category_id: null,
        brand_id: null,
        model_id: null,
        category: "",
        brand: "",
        model: "",
        serial_no: "",
        purchase_date: "",
        warranty_months: 0,
        vendor_id: null,
        cpu: "",
        ram: "",
        ssd: "",
        monitor: "",
        device_type: "IT Device",
        remarks: "",
    };
}

function SearchableSelect({
    value,
    options,
    onChange,
    placeholder,
    disabled = false,
}: {
    value: string;
    options: SearchOption[];
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
}) {
    const rootRef =
        useRef<HTMLDivElement | null>(null);

    const [open, setOpen] =
        useState(false);

    const [query, setQuery] =
        useState("");

    const selected =
        options.find(
            (option) =>
                option.value === value
        ) ?? null;

    const filtered = useMemo(() => {
        const term =
            query.trim().toLowerCase();

        if (!term) return options;

        return options.filter(
            (option) =>
                option.label
                    .toLowerCase()
                    .includes(term) ||
                String(
                    option.description ?? ""
                )
                    .toLowerCase()
                    .includes(term)
        );
    }, [options, query]);

    useEffect(() => {
        if (!open) return;

        const close = (
            event: MouseEvent
        ) => {
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
            close
        );

        return () =>
            document.removeEventListener(
                "mousedown",
                close
            );
    }, [open]);

    return (
        <div
            ref={rootRef}
            className="relative"
        >
            <div
                className={`flex h-9 items-center rounded-lg border bg-background ${disabled
                    ? "cursor-not-allowed opacity-60"
                    : "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
                    }`}
            >
                <Search className="ml-2.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                <input
                    value={
                        open
                            ? query
                            : selected?.label ??
                            ""
                    }
                    disabled={disabled}
                    onFocus={() => {
                        if (disabled) return;
                        setOpen(true);
                        setQuery("");
                    }}
                    onChange={(event) => {
                        setQuery(
                            event.target.value
                        );
                        setOpen(true);
                    }}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="h-full min-w-0 flex-1 bg-transparent px-2 text-[11px] outline-none"
                />

                {value && !disabled ? (
                    <button
                        type="button"
                        onMouseDown={(event) =>
                            event.preventDefault()
                        }
                        onClick={() => {
                            onChange("");
                            setQuery("");
                            setOpen(false);
                        }}
                        className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                        title="Clear"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                ) : (
                    <ChevronDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                )}
            </div>

            {open && !disabled && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[200] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                    <div className="max-h-64 overflow-y-auto p-1">
                        {filtered.length ===
                            0 ? (
                            <div className="px-3 py-4 text-center text-[10px] text-muted-foreground">
                                No matching option
                            </div>
                        ) : (
                            filtered.map(
                                (option) => (
                                    <button
                                        key={
                                            option.value
                                        }
                                        type="button"
                                        onMouseDown={(
                                            event
                                        ) =>
                                            event.preventDefault()
                                        }
                                        onClick={() => {
                                            onChange(
                                                option.value
                                            );
                                            setOpen(
                                                false
                                            );
                                            setQuery(
                                                ""
                                            );
                                        }}
                                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-[10px] font-semibold text-foreground">
                                                {
                                                    option.label
                                                }
                                            </span>
                                            {option.description && (
                                                <span className="mt-0.5 block truncate text-[8px] text-muted-foreground">
                                                    {
                                                        option.description
                                                    }
                                                </span>
                                            )}
                                        </span>

                                        {option.value ===
                                            value && (
                                                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                                            )}
                                    </button>
                                )
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PettyCashStockEntryPage() {
    const router = useRouter();

    const [quantity, setQuantity] =
        useState(1);

    const [rows, setRows] =
        useState<PettyCashRow[]>([
            newRow(0),
        ]);

    const [syncFirstRow, setSyncFirstRow] =
        useState(true);

    const [masterData, setMasterData] =
        useState<InventoryCategoryItem[]>(
            []
        );

    const [specOptions, setSpecOptions] =
        useState<InventorySpecOptions>({
            cpu: [],
            ram: [],
            ssd: [],
            monitor: [],
        });

    const [vendors, setVendors] =
        useState<VendorOption[]>([]);

    const [loadingMaster, setLoadingMaster] =
        useState(true);

    const [validating, setValidating] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [validation, setValidation] =
        useState<ValidationData | null>(
            null
        );

    const [reviewOpen, setReviewOpen] =
        useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadMasterData() {
            try {
                setLoadingMaster(true);

                const [
                    categoryResponse,
                    specResponse,
                    vendorResponse,
                ] = await Promise.all([
                    categoryApi.list(),
                    inventoryWorkflowApi.specOptions(),
                    api.get<{
                        success: boolean;
                        data: VendorOption[];
                    }>(
                        "/vendors/master/options"
                    ),
                ]);

                if (!mounted) return;

                setMasterData(
                    (
                        categoryResponse.data ??
                        []
                    ).filter(
                        (item) =>
                            Number(
                                item.status ?? 1
                            ) === 1
                    )
                );

                setSpecOptions({
                    cpu:
                        specResponse.data
                            ?.cpu ?? [],
                    ram:
                        specResponse.data
                            ?.ram ?? [],
                    ssd:
                        specResponse.data
                            ?.ssd ?? [],
                    monitor:
                        specResponse.data
                            ?.monitor ?? [],
                });

                setVendors(
                    vendorResponse.data ?? []
                );
            } catch (reason) {
                if (!mounted) return;

                const message =
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load Petty Cash master data.";

                setError(
                    message.toLowerCase().includes("route not found")
                        ? "Petty Cash backend routes are not registered yet. Apply PATCHES/01_REQUIRED_HANDLER_ROUTES.txt, rebuild the Go API, and restart the backend."
                        : message
                );
            } finally {
                if (mounted) {
                    setLoadingMaster(false);
                }
            }
        }

        void loadMasterData();

        return () => {
            mounted = false;
        };
    }, []);

    const categories = useMemo(
        () =>
            masterData.filter(
                (item) =>
                    normalizeType(
                        item.type
                    ) === "category" &&
                    Number(
                        item.parent_id ?? 0
                    ) === 0
            ),
        [masterData]
    );

    const categoryOptions: SearchOption[] =
        categories.map((item) => ({
            value: String(item.id),
            label: String(
                item.category_name ?? ""
            ),
        }));

    const vendorOptions: SearchOption[] =
        vendors.map((vendor) => ({
            value: String(vendor.id),
            label: vendor.vendor_name,
            description: [
                vendor.vendor_code,
                ...vendor.vendor_types,
            ]
                .filter(Boolean)
                .join(" · "),
        }));

    const warrantyOptions: SearchOption[] = [
        { value: "3", label: "3 Months" },
        { value: "6", label: "6 Months" },
        { value: "12", label: "1 Year" },
        { value: "24", label: "2 Years" },
        { value: "36", label: "3 Years" },
        { value: "48", label: "4 Years" },
        { value: "60", label: "5 Years" },
        { value: "72", label: "6 Years" },
    ];

    function brandsFor(
        categoryID:
            | number
            | null
            | undefined
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
        brandID:
            | number
            | null
            | undefined
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

    function setRowCount(
        rawQuantity: number
    ) {
        const next = Math.max(
            1,
            Math.min(
                10,
                Number.isFinite(rawQuantity)
                    ? rawQuantity
                    : 1
            )
        );

        setQuantity(next);

        setRows((current) => {
            if (current.length === next) {
                return current;
            }

            if (current.length > next) {
                return current.slice(0, next);
            }

            const template = current[0];
            const additional = Array.from(
                {
                    length:
                        next - current.length,
                },
                (_, offset) => {
                    const row = newRow(
                        current.length + offset
                    );

                    if (
                        syncFirstRow &&
                        template
                    ) {
                        return {
                            ...row,
                            category_id:
                                template.category_id,
                            brand_id:
                                template.brand_id,
                            model_id:
                                template.model_id,
                            category:
                                template.category,
                            brand:
                                template.brand,
                            model:
                                template.model,
                            purchase_date:
                                template.purchase_date,
                            warranty_months:
                                template.warranty_months,
                            vendor_id:
                                template.vendor_id,
                            cpu: template.cpu,
                            ram: template.ram,
                            ssd: template.ssd,
                            monitor:
                                template.monitor,
                            device_type:
                                template.device_type,
                            remarks:
                                template.remarks,

                            // Critical data-accuracy rule:
                            // serial is NEVER copied from Row #1.
                            serial_no: "",
                        };
                    }

                    return row;
                }
            );

            return [
                ...current,
                ...additional,
            ];
        });

        setValidation(null);
        setReviewOpen(false);
    }

    function patchRow(
        index: number,
        patch: Partial<PettyCashRow>,
        syncCommon = true
    ) {
        setRows((current) =>
            current.map(
                (row, rowIndex) => {
                    const shouldCopy =
                        syncFirstRow &&
                        syncCommon &&
                        index === 0 &&
                        rowIndex !== 0;

                    if (
                        rowIndex === index ||
                        shouldCopy
                    ) {
                        return {
                            ...row,
                            ...patch,
                            ...(shouldCopy
                                ? {
                                    // Never overwrite another row's serial.
                                    serial_no:
                                        row.serial_no,
                                }
                                : {}),
                        };
                    }

                    return row;
                }
            )
        );

        setValidation(null);
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

        patchRow(index, {
            category_id:
                selected?.id ?? null,
            category:
                selected?.category_name ?? "",
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

        patchRow(index, {
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

        patchRow(index, {
            model_id:
                selected?.id ?? null,
            model:
                selected?.category_name ?? "",
        });
    }

    function rowComplete(
        row: PettyCashRow
    ) {
        return Boolean(
            row.category_id &&
            row.brand_id &&
            row.model_id &&
            normalizeSerial(
                row.serial_no
            ) &&
            row.purchase_date &&
            Number(
                row.warranty_months
            ) > 0 &&
            row.vendor_id
        );
    }

    const completedRows = rows.filter(
        rowComplete
    ).length;

    function requestBody() {
        return {
            items: rows.map((row) => ({
                category_id:
                    row.category_id,
                brand_id: row.brand_id,
                model_id: row.model_id,
                serial_no: normalizeSerial(
                    row.serial_no
                ),
                purchase_date:
                    row.purchase_date,
                warranty_months: Number(
                    row.warranty_months
                ),
                vendor_id: row.vendor_id,
                cpu: row.cpu.trim(),
                ram: row.ram.trim(),
                ssd: row.ssd.trim(),
                monitor:
                    row.monitor.trim(),
                device_type:
                    row.device_type,
                remarks:
                    row.remarks.trim(),
            })),
        };
    }

    function validateClient() {
        if (
            rows.length < 1 ||
            rows.length > 10
        ) {
            setError(
                "Petty Cash quantity must be between 1 and 10."
            );
            return false;
        }

        const incomplete =
            rows.findIndex(
                (row) =>
                    !rowComplete(row)
            );

        if (incomplete >= 0) {
            setError(
                `Complete Category, Brand, Model, Serial No., Purchase Date, Warranty and Vendor for Row #${incomplete + 1
                }.`
            );
            return false;
        }

        const futureRow =
            rows.findIndex(
                (row) =>
                    row.purchase_date >
                    todayISO()
            );

        if (futureRow >= 0) {
            setError(
                `Purchase Date in Row #${futureRow + 1
                } cannot be in the future.`
            );
            return false;
        }

        return true;
    }

    async function review() {
        if (!validateClient()) {
            return;
        }

        try {
            setValidating(true);
            setError("");
            setSuccess("");

            const response =
                await api.post<{
                    success: boolean;
                    data: ValidationData;
                }>(
                    "/stock/petty-cash/validate",
                    requestBody()
                );

            setValidation(response.data);
            setReviewOpen(true);
        } catch (reason) {
            const message =
                reason instanceof Error
                    ? reason.message
                    : "Unable to validate Petty Cash stock.";

            setError(
                message.toLowerCase().includes("route not found")
                    ? "Petty Cash validation API is not registered. Apply the StockHandler route patch and restart the backend."
                    : message
            );
        } finally {
            setValidating(false);
        }
    }

    async function commit() {
        if (!validation?.can_import) {
            return;
        }

        try {
            setSaving(true);
            setError("");

            const response =
                await api.post<{
                    success: boolean;
                    data: ImportResult;
                }>(
                    "/stock/petty-cash/import",
                    requestBody()
                );

            setReviewOpen(false);

            const result = response.data;

            setSuccess(
                `${result.inserted} new item(s) added successfully. ${result.skipped} existing / duplicate serial(s) skipped. Batch ${result.batch_no}.`
            );

            window.setTimeout(() => {
                router.push(
                    `/dashboard/assets/devices?import=success&entry=petty-cash&batch=${encodeURIComponent(
                        result.batch_no
                    )}`
                );
            }, 800);
        } catch (reason) {
            const message =
                reason instanceof Error
                    ? reason.message
                    : "Unable to save Petty Cash stock.";

            setError(
                message.toLowerCase().includes("route not found")
                    ? "Petty Cash import API is not registered. Apply the StockHandler route patch and restart the backend."
                    : message
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div>
                        <h1 className="text-base font-bold text-foreground">
                            Petty Cash Stock Entry
                        </h1>
                        <p className="mt-1 max-w-3xl text-[10px] leading-5 text-muted-foreground">
                            Add stock purchased without MR / PR. Petty Cash rows are stored with <span className="font-mono font-semibold">inventory_type = 2</span>.
                        </p>
                    </div>

                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] font-semibold text-emerald-700">
                        MR Type = 1 · Petty Cash = 2
                    </div>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
                    <label>
                        <span className={labelClass}>
                            Quantity *
                        </span>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={quantity}
                            onChange={(event) =>
                                setRowCount(
                                    Number(
                                        event.target
                                            .value || 1
                                    )
                                )
                            }
                            className={fieldClass}
                        />
                        <span className="mt-1 block text-[8px] text-muted-foreground">
                            Maximum 10 items per Petty Cash batch.
                        </span>
                    </label>

                    <label className="flex min-h-9 items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2 text-[9px] font-medium">
                        <input
                            type="checkbox"
                            checked={syncFirstRow}
                            onChange={(event) =>
                                setSyncFirstRow(
                                    event.target
                                        .checked
                                )
                            }
                            className="h-3.5 w-3.5 accent-primary"
                        />
                        <Copy className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>
                            Apply Row #1 common values to all rows
                            <span className="ml-1 text-muted-foreground">
                                — Serial No. is never copied
                            </span>
                        </span>
                    </label>

                    <Button
                        type="button"
                        disabled={
                            validating ||
                            saving ||
                            loadingMaster ||
                            completedRows !==
                            rows.length
                        }
                        onClick={() =>
                            void review()
                        }
                        className="h-9 gap-2 text-[10px]"
                    >
                        {validating ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                            <ShieldCheck className="h-4 w-4" />
                        )}
                        {validating
                            ? "Checking Serials..."
                            : `Review ${rows.length} Item${rows.length === 1
                                ? ""
                                : "s"
                            }`}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[10px] text-red-700">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            <div className="space-y-3">
                {rows.map((row, index) => {
                    const brandRows =
                        brandsFor(
                            row.category_id
                        );
                    const modelRows =
                        modelsFor(row.brand_id);

                    return (
                        <div
                            key={row.row_key}
                            className="overflow-visible rounded-2xl border border-border bg-card shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="text-[11px] font-bold">
                                            Stock Item #{index + 1}
                                        </p>
                                        <p className="text-[8px] text-muted-foreground">
                                            Petty Cash · No MR / PR
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className={`rounded-md border px-2 py-1 text-[8px] font-semibold ${rowComplete(row)
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-amber-200 bg-amber-50 text-amber-700"
                                        }`}
                                >
                                    {rowComplete(row)
                                        ? "Ready"
                                        : "Required fields pending"}
                                </span>
                            </div>

                            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                                <div>
                                    <span className={labelClass}>
                                        Category *
                                    </span>
                                    <SearchableSelect
                                        value={
                                            row.category_id
                                                ? String(
                                                    row.category_id
                                                )
                                                : ""
                                        }
                                        options={
                                            categoryOptions
                                        }
                                        placeholder="Search category..."
                                        disabled={
                                            loadingMaster
                                        }
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
                                        Brand *
                                    </span>
                                    <SearchableSelect
                                        value={
                                            row.brand_id
                                                ? String(
                                                    row.brand_id
                                                )
                                                : ""
                                        }
                                        options={brandRows.map(
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
                                        placeholder="Search brand..."
                                        disabled={
                                            !row.category_id
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
                                        Model *
                                    </span>
                                    <SearchableSelect
                                        value={
                                            row.model_id
                                                ? String(
                                                    row.model_id
                                                )
                                                : ""
                                        }
                                        options={modelRows.map(
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
                                        placeholder="Search model..."
                                        disabled={
                                            !row.brand_id
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

                                <label>
                                    <span className={labelClass}>
                                        Serial No. *
                                    </span>
                                    <input
                                        value={
                                            row.serial_no
                                        }
                                        onChange={(event) =>
                                            patchRow(
                                                index,
                                                {
                                                    serial_no:
                                                        event
                                                            .target
                                                            .value,
                                                },
                                                false
                                            )
                                        }
                                        onBlur={() =>
                                            patchRow(
                                                index,
                                                {
                                                    serial_no:
                                                        normalizeSerial(
                                                            row.serial_no
                                                        ),
                                                },
                                                false
                                            )
                                        }
                                        placeholder="Enter unique serial number"
                                        className={`${fieldClass} font-mono font-semibold`}
                                    />
                                </label>

                                <label>
                                    <span className={labelClass}>
                                        Purchase Date *
                                    </span>
                                    <input
                                        type="date"
                                        value={
                                            row.purchase_date
                                        }
                                        max={todayISO()}
                                        onChange={(event) =>
                                            patchRow(
                                                index,
                                                {
                                                    purchase_date:
                                                        event
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        className={
                                            fieldClass
                                        }
                                    />
                                </label>

                                <div>
                                    <span className={labelClass}>
                                        Vendor Name *
                                    </span>
                                    <SearchableSelect
                                        value={
                                            row.vendor_id
                                                ? String(
                                                    row.vendor_id
                                                )
                                                : ""
                                        }
                                        options={
                                            vendorOptions
                                        }
                                        placeholder="Search vendor..."
                                        disabled={
                                            loadingMaster
                                        }
                                        onChange={(value) =>
                                            patchRow(
                                                index,
                                                {
                                                    vendor_id:
                                                        value
                                                            ? Number(
                                                                value
                                                            )
                                                            : null,
                                                }
                                            )
                                        }
                                    />
                                </div>

                                <div>
                                    <span className={labelClass}>
                                        Warranty Duration *
                                    </span>
                                    <SearchableSelect
                                        value={
                                            row.warranty_months >
                                                0
                                                ? String(
                                                    row.warranty_months
                                                )
                                                : ""
                                        }
                                        options={
                                            warrantyOptions
                                        }
                                        placeholder="Select warranty..."
                                        onChange={(value) =>
                                            patchRow(
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

                                <label>
                                    <span className={labelClass}>
                                        Warranty End Date *
                                    </span>
                                    <input
                                        readOnly
                                        value={warrantyEndDate(
                                            row.purchase_date,
                                            row.warranty_months
                                        )}
                                        placeholder="Calculated automatically"
                                        className={`${fieldClass} font-mono font-semibold text-emerald-700`}
                                    />
                                </label>

                                <div>
                                    <span className={labelClass}>
                                        CPU / Processor
                                    </span>
                                    <SearchableSelect
                                        value={row.cpu}
                                        options={specOptions.cpu.map(
                                            (value) => ({
                                                value,
                                                label: value,
                                            })
                                        )}
                                        placeholder="Optional CPU..."
                                        onChange={(value) =>
                                            patchRow(
                                                index,
                                                { cpu: value }
                                            )
                                        }
                                    />
                                </div>

                                <div>
                                    <span className={labelClass}>
                                        RAM
                                    </span>
                                    <SearchableSelect
                                        value={row.ram}
                                        options={specOptions.ram.map(
                                            (value) => ({
                                                value,
                                                label: value,
                                            })
                                        )}
                                        placeholder="Optional RAM..."
                                        onChange={(value) =>
                                            patchRow(
                                                index,
                                                { ram: value }
                                            )
                                        }
                                    />
                                </div>

                                <div>
                                    <span className={labelClass}>
                                        SSD / HDD
                                    </span>
                                    <SearchableSelect
                                        value={row.ssd}
                                        options={specOptions.ssd.map(
                                            (value) => ({
                                                value,
                                                label: value,
                                            })
                                        )}
                                        placeholder="Optional SSD / HDD..."
                                        onChange={(value) =>
                                            patchRow(
                                                index,
                                                { ssd: value }
                                            )
                                        }
                                    />
                                </div>

                                <div>
                                    <span className={labelClass}>
                                        Monitor
                                    </span>
                                    <SearchableSelect
                                        value={
                                            row.monitor
                                        }
                                        options={specOptions.monitor.map(
                                            (value) => ({
                                                value,
                                                label: value,
                                            })
                                        )}
                                        placeholder="Optional monitor..."
                                        onChange={(value) =>
                                            patchRow(
                                                index,
                                                {
                                                    monitor:
                                                        value,
                                                }
                                            )
                                        }
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
                                            patchRow(
                                                index,
                                                {
                                                    device_type:
                                                        event
                                                            .target
                                                            .value as PettyCashRow["device_type"],
                                                }
                                            )
                                        }
                                        className={
                                            fieldClass
                                        }
                                    >
                                        <option value="IT Device">
                                            IT Device
                                        </option>
                                        <option value="IT Accessory">
                                            IT Accessory
                                        </option>
                                    </select>
                                </label>

                                <label className="xl:col-span-2">
                                    <span className={labelClass}>
                                        Remarks
                                    </span>
                                    <input
                                        value={
                                            row.remarks
                                        }
                                        maxLength={500}
                                        onChange={(event) =>
                                            patchRow(
                                                index,
                                                {
                                                    remarks:
                                                        event
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        placeholder="Optional purchase / warranty note"
                                        className={
                                            fieldClass
                                        }
                                    />
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            {reviewOpen && validation && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
                    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                            <div>
                                <h2 className="text-sm font-bold">
                                    Petty Cash Stock Review
                                </h2>
                                <p className="mt-1 text-[9px] text-muted-foreground">
                                    Existing serials are skipped automatically. Only new items will be added.
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                    setReviewOpen(
                                        false
                                    )
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5">
                            <div className="grid gap-2 sm:grid-cols-3">
                                <div className="rounded-xl border border-border bg-muted/20 p-3">
                                    <p className="text-[8px] font-bold uppercase text-muted-foreground">
                                        Total Items
                                    </p>
                                    <p className="mt-1 text-xl font-bold">
                                        {validation.total}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                    <p className="text-[8px] font-bold uppercase text-emerald-700">
                                        New
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-emerald-700">
                                        {validation.new_count}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-[8px] font-bold uppercase text-amber-700">
                                        Skipped
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-amber-700">
                                        {validation.skipped_count}
                                    </p>
                                </div>
                            </div>

                            {validation.rows.some(
                                (item) =>
                                    item.status !==
                                    "NEW"
                            ) && (
                                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                                        <p className="text-[10px] font-bold text-amber-900">
                                            Already exists — skipped
                                        </p>

                                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                            {validation.rows
                                                .filter(
                                                    (
                                                        item
                                                    ) =>
                                                        item.status !==
                                                        "NEW"
                                                )
                                                .map(
                                                    (
                                                        item
                                                    ) => (
                                                        <div
                                                            key={`${item.row_no}-${item.serial_no}`}
                                                            className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate font-mono text-[9px] font-bold">
                                                                    {item.serial_no}
                                                                </p>
                                                                <p className="mt-0.5 text-[8px] text-muted-foreground">
                                                                    Already exists — skipped
                                                                </p>
                                                            </div>

                                                            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                                                        </div>
                                                    )
                                                )}
                                        </div>
                                    </div>
                                )}

                            {validation.new_count >
                                0 && (
                                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-[9px] text-emerald-800">
                                        <PackageCheck className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>
                                            {validation.new_count} new item
                                            {validation.new_count ===
                                                1
                                                ? ""
                                                : "s"} ready to add.
                                        </span>
                                    </div>
                                )}

                            {validation.new_count ===
                                0 && (
                                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[9px] text-amber-800">
                                        <p className="font-bold">
                                            All items already exist
                                        </p>
                                        <p className="mt-1">
                                            No duplicate records will be created.
                                        </p>
                                    </div>
                                )}
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
                            <p className="text-[8px] font-medium text-muted-foreground">
                                Stock Type: Petty Cash · inventory_type = 2
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={saving}
                                    onClick={() =>
                                        setReviewOpen(
                                            false
                                        )
                                    }
                                >
                                    {validation.can_import
                                        ? "Cancel"
                                        : "Close"}
                                </Button>

                                {validation.can_import && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={saving}
                                        onClick={() =>
                                            void commit()
                                        }
                                        className="gap-2"
                                    >
                                        {saving ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <PackageCheck className="h-4 w-4" />
                                        )}
                                        Add {validation.new_count} New Item
                                        {validation.new_count ===
                                            1
                                            ? ""
                                            : "s"}
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
