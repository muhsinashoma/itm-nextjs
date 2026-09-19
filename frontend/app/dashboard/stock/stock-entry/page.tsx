
//itm/frontend/app/dashboard/stock/stock-entry/page.tsx
"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

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
    X,
} from "lucide-react";

import {
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

const fieldClass =
    "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-[10px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground";

const labelClass =
    "mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground";

type SearchOption = {
    value: string;
    label: string;
};

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
                        className="mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[80] overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
                    <div className="max-h-52 overflow-y-auto p-1">
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
    const [mrNumber, setMRNumber] =
        useState("");

    const [preview, setPreview] =
        useState<SCMStockPreview | null>(
            null
        );

    const [rows, setRows] =
        useState<MappingRow[]>([]);

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

    const [error, setError] =
        useState("");

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
            setSuccess("");

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
        setSuccess("");
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

    function selectCategory(
        index: number,
        categoryID: number
    ) {
        const selected =
            categories.find(
                (item) =>
                    item.id === categoryID
            );

        updateRow(index, {
            category_id:
                selected?.id ?? null,
            category:
                selected?.category_name ?? "",

            // A parent change invalidates its children.
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

        updateRow(index, {
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

        updateRow(index, {
            model_id:
                selected?.id ?? null,
            model:
                selected?.category_name ?? "",
        });
    }

    function copyFirstClassificationToMatching() {
        if (rows.length < 2) return;

        const source = rows[0];

        setRows((current) =>
            current.map((row, index) => {
                if (index === 0) {
                    return row;
                }

                const sameSCMItem =
                    source.item_id &&
                        row.item_id
                        ? source.item_id ===
                        row.item_id
                        : source.item_name
                            .trim()
                            .toLowerCase() ===
                        row.item_name
                            .trim()
                            .toLowerCase() &&
                        source.item_group
                            .trim()
                            .toLowerCase() ===
                        row.item_group
                            .trim()
                            .toLowerCase();

                if (!sameSCMItem) {
                    return row;
                }

                return {
                    ...row,
                    category_id:
                        source.category_id,
                    brand_id:
                        source.brand_id,
                    model_id:
                        source.model_id,
                    category:
                        source.category,
                    brand: source.brand,
                    model: source.model,
                    cpu: source.cpu,
                    ram: source.ram,
                    ssd: source.ssd,
                    monitor:
                        source.monitor,
                    warranty_months:
                        source.warranty_months,
                    device_type:
                        source.device_type,
                };
            })
        );
    }

    /* ======================================================
       FINAL DATABASE COMMIT
    ====================================================== */

    async function importStock() {
        if (!preview) return;

        const incomplete =
            rows.findIndex(
                (row) =>
                    !isRowComplete(row)
            );

        if (incomplete >= 0) {
            setError(
                `Complete Category / Brand / Model classification for row ${incomplete + 1
                } before importing.`
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response =
                await inventoryWorkflowApi
                    .importMR(
                        preview.mr_id,
                        rows.map((row) => ({
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
                        }))
                    );

            setSuccess(
                `Import completed: ${response.data.imported} new item(s), ${response.data.updated} existing item(s) synchronized, 0 failed.`
            );
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to import stock."
            );
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
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </label>

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
                            </div>

                            {rows.length > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-[8px]"
                                    disabled={
                                        !isRowComplete(
                                            rows[0]
                                        )
                                    }
                                    onClick={
                                        copyFirstClassificationToMatching
                                    }
                                >
                                    <Copy className="h-3 w-3" />
                                    Apply row #1 to matching items
                                </Button>
                            )}
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
                                        className="overflow-hidden rounded-xl border border-border"
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
                                                            Category *
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
                                                            Brand *
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
                                                            Model *
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
                                                            value={row.cpu}
                                                            options={
                                                                cpuSelectOptions
                                                            }
                                                            placeholder="Search CPU / processor..."
                                                            emptyText="No CPU options found"
                                                            onChange={(value) =>
                                                                updateRow(
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
                                                            value={row.ram}
                                                            options={
                                                                ramSelectOptions
                                                            }
                                                            placeholder="Search RAM..."
                                                            emptyText="No RAM options found"
                                                            onChange={(value) =>
                                                                updateRow(
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
                                                            value={row.ssd}
                                                            options={
                                                                ssdSelectOptions
                                                            }
                                                            placeholder="Search SSD / HDD..."
                                                            emptyText="No SSD / HDD options found"
                                                            onChange={(value) =>
                                                                updateRow(
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
                                                            value={row.monitor}
                                                            options={
                                                                monitorSelectOptions
                                                            }
                                                            placeholder="Search monitor..."
                                                            emptyText="No monitor options found"
                                                            onChange={(value) =>
                                                                updateRow(
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
                                                            Warranty Duration *
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
                                                                updateRow(
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
                                                            Asset Type
                                                        </span>
                                                        <select
                                                            value={
                                                                row.device_type
                                                            }
                                                            onChange={(event) =>
                                                                updateRow(
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

                                                    <label className="sm:col-span-2 lg:col-span-3">
                                                        <span className={labelClass}>
                                                            Remarks
                                                        </span>
                                                        <textarea
                                                            value={
                                                                row.remarks
                                                            }
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    {
                                                                        remarks:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }
                                                                )
                                                            }
                                                            rows={2}
                                                            placeholder="Optional stock / warranty note"
                                                            className="w-full resize-y rounded-lg border border-border bg-background px-2.5 py-2 text-[10px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
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
                                Duplicate MR + serial items are synchronized instead of inserted twice. SCM procurement data is revalidated by the backend during import.
                            </p>

                            <Button
                                type="button"
                                size="sm"
                                className="h-8 gap-1.5 text-[9px]"
                                disabled={
                                    saving ||
                                    rows.length === 0 ||
                                    completeRows !==
                                    rows.length
                                }
                                onClick={() =>
                                    void importStock()
                                }
                            >
                                {saving ? (
                                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <PackageCheck className="h-3.5 w-3.5" />
                                )}
                                Import {rows.length} Stock Item
                                {rows.length === 1
                                    ? ""
                                    : "s"}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
