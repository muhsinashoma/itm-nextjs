"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowRight,
    CheckCircle2,
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
    type SCMStockImportItem,
    type SCMStockPreview,
} from "@/lib/api";

import {
    Button,
} from "@/components/ui/button";

type MappingRow = SCMStockImportItem & {
    item_name: string;
    item_group: string;
    pr_id: string;
    vendor_name: string;
    purchase_date: string;
};

const fieldClass =
    "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-[10px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10";

const labelClass =
    "mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground";

function emptyRow(
    preview: SCMStockPreview,
    index: number
): MappingRow {
    const item = preview.items[index];

    return {
        source_index: item.source_index,
        serial_number: item.serial_number,
        category: "",
        brand: "",
        model: "",
        cpu: "",
        ram: "",
        ssd: "",
        monitor: "",
        warranty_months:
            item.warranty_months || 12,
        device_type:
            item.item_group
                ?.toLowerCase()
                .includes("accessor")
                ? "IT Accessory"
                : "IT Device",
        remarks: "",
        item_name: item.item_name,
        item_group: item.item_group,
        pr_id: item.pr_id,
        vendor_name: item.vendor_name,
        purchase_date: item.purchase_date,
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

    const [categories, setCategories] =
        useState<string[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    useEffect(() => {
        let mounted = true;

        void categoryApi
            .list()
            .then((response) => {
                if (!mounted) return;

                const values = (
                    response.data ?? []
                )
                    .map((item: any) =>
                        String(
                            item.category_name ??
                                item.inventory_category_list ??
                                item.name ??
                                ""
                        ).trim()
                    )
                    .filter(Boolean);

                setCategories(
                    Array.from(
                        new Set(values)
                    ).sort((a, b) =>
                        a.localeCompare(b)
                    )
                );
            })
            .catch(() => {
                // Category list is helpful, not mandatory.
            });

        return () => {
            mounted = false;
        };
    }, []);

    const completeRows = useMemo(
        () =>
            rows.filter(
                (row) =>
                    row.category.trim()
                        .length > 0
            ).length,
        [rows]
    );

    async function loadMR() {
        const mr = mrNumber.trim();

        if (!mr) {
            setError(
                "Enter an MR number first."
            );
            return;
        }

        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const response =
                await inventoryWorkflowApi
                    .previewMR(mr);

            const data =
                response.data;

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
            setPreview(null);
            setRows([]);
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to load SCM MR data."
            );
        } finally {
            setLoading(false);
        }
    }

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

    function copyClassificationToAll() {
        if (rows.length < 2) return;

        const source = rows[0];

        setRows((current) =>
            current.map((row, index) =>
                index === 0
                    ? row
                    : {
                          ...row,
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
                      }
            )
        );
    }

    async function importStock() {
        if (!preview) return;

        const incomplete =
            rows.findIndex(
                (row) =>
                    !row.category.trim()
            );

        if (incomplete >= 0) {
            setError(
                `Select a category for row ${
                    incomplete + 1
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
                `${response.data.imported} new stock item(s) imported and ${response.data.updated} existing item(s) synchronized.`
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
                                Load an approved Material Requisition directly from SCM, classify each received item for ITM, and create available stock without exposing SCM credentials in the browser.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Server-side SCM integration
                    </div>
                </div>

                <div className="p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <label className="min-w-0 flex-1">
                            <span className={labelClass}>
                                Material Requisition (MR)
                            </span>

                            <div className="flex h-9 items-center rounded-lg border border-border bg-background px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                                <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />

                                <input
                                    value={mrNumber}
                                    onChange={(event) =>
                                        setMRNumber(
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            event.preventDefault();
                                            void loadMR();
                                        }
                                    }}
                                    placeholder="Enter MR number from SCM"
                                    className="h-full w-full bg-transparent text-[10px] outline-none"
                                />

                                {mrNumber && (
                                    <button
                                        type="button"
                                        aria-label="Clear MR"
                                        onClick={() => {
                                            setMRNumber("");
                                            setPreview(null);
                                            setRows([]);
                                            setError("");
                                            setSuccess("");
                                        }}
                                    >
                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                )}
                            </div>
                        </label>

                        <Button
                            type="button"
                            size="sm"
                            className="h-9 gap-2"
                            disabled={loading}
                            onClick={() =>
                                void loadMR()
                            }
                        >
                            {loading ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RefreshCcw className="h-3.5 w-3.5" />
                            )}
                            Load from SCM
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
                            {error}
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
                            <p className="mt-1 break-all text-[11px] font-semibold text-foreground">
                                {preview.mr_id}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                SCM Items
                            </p>
                            <p className="mt-1 text-lg font-semibold text-primary">
                                {preview.items.length}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Ready to Import
                            </p>
                            <p className="mt-1 text-lg font-semibold text-emerald-600">
                                {completeRows}/{rows.length}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
                            <div>
                                <h2 className="text-[11px] font-semibold text-foreground">
                                    SCM Receipt & ITM Classification
                                </h2>
                                <p className="mt-0.5 text-[9px] text-muted-foreground">
                                    SCM fields are read-only. ITM classification remains editable before stock is committed.
                                </p>
                            </div>

                            {rows.length > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-[9px]"
                                    onClick={
                                        copyClassificationToAll
                                    }
                                >
                                    <Copy className="h-3 w-3" />
                                    Apply first row to all
                                </Button>
                            )}
                        </div>

                        <div className="space-y-3 p-4">
                            {rows.map((row, index) => {
                                const source =
                                    preview.items[index];

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

                                            <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[8px] text-muted-foreground">
                                                {source.serial_number ||
                                                    "Internal asset tag will be generated"}
                                            </span>
                                        </div>

                                        <div className="grid gap-4 p-4 xl:grid-cols-2">
                                            <div className="rounded-lg border border-border bg-muted/15 p-3">
                                                <div className="mb-3 flex items-center gap-2">
                                                    <Database className="h-3.5 w-3.5 text-amber-600" />
                                                    <p className="text-[9px] font-semibold text-foreground">
                                                        SCM Source
                                                    </p>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {[
                                                        [
                                                            "PR Number",
                                                            source.pr_id,
                                                        ],
                                                        [
                                                            "Vendor",
                                                            source.vendor_name,
                                                        ],
                                                        [
                                                            "Received / GR",
                                                            source.gr_id,
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
                                                <div className="mb-3 flex items-center gap-2">
                                                    <PackageCheck className="h-3.5 w-3.5 text-primary" />
                                                    <p className="text-[9px] font-semibold text-foreground">
                                                        ITM Classification
                                                    </p>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    <label>
                                                        <span className={labelClass}>
                                                            Category *
                                                        </span>
                                                        <input
                                                            list="itm-category-list"
                                                            value={row.category}
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    {
                                                                        category:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }
                                                                )
                                                            }
                                                            placeholder="e.g. Mouse"
                                                            className={fieldClass}
                                                        />
                                                    </label>

                                                    <label>
                                                        <span className={labelClass}>
                                                            Brand
                                                        </span>
                                                        <input
                                                            value={row.brand}
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    {
                                                                        brand:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }
                                                                )
                                                            }
                                                            className={fieldClass}
                                                        />
                                                    </label>

                                                    <label>
                                                        <span className={labelClass}>
                                                            Model
                                                        </span>
                                                        <input
                                                            value={row.model}
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    {
                                                                        model:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }
                                                                )
                                                            }
                                                            className={fieldClass}
                                                        />
                                                    </label>

                                                    <label>
                                                        <span className={labelClass}>
                                                            CPU
                                                        </span>
                                                        <input
                                                            value={row.cpu}
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    {
                                                                        cpu:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }
                                                                )
                                                            }
                                                            className={fieldClass}
                                                        />
                                                    </label>

                                                    <label>
                                                        <span className={labelClass}>
                                                            RAM
                                                        </span>
                                                        <input
                                                            value={row.ram}
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    {
                                                                        ram:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }
                                                                )
                                                            }
                                                            className={fieldClass}
                                                        />
                                                    </label>

                                                    <label>
                                                        <span className={labelClass}>
                                                            SSD / HDD
                                                        </span>
                                                        <input
                                                            value={row.ssd}
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    {
                                                                        ssd:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }
                                                                )
                                                            }
                                                            className={fieldClass}
                                                        />
                                                    </label>

                                                    <label>
                                                        <span className={labelClass}>
                                                            Monitor
                                                        </span>
                                                        <input
                                                            value={row.monitor}
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    {
                                                                        monitor:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    }
                                                                )
                                                            }
                                                            className={fieldClass}
                                                        />
                                                    </label>

                                                    <label>
                                                        <span className={labelClass}>
                                                            Warranty Months
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={
                                                                row.warranty_months ??
                                                                0
                                                            }
                                                            onChange={(event) =>
                                                                updateRow(
                                                                    index,
                                                                    {
                                                                        warranty_months:
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value
                                                                            ),
                                                                    }
                                                                )
                                                            }
                                                            className={fieldClass}
                                                        />
                                                    </label>

                                                    <label>
                                                        <span className={labelClass}>
                                                            Asset Type
                                                        </span>
                                                        <select
                                                            value={row.device_type}
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
                                                            rows={2}
                                                            value={row.remarks}
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
                                                            className="w-full resize-y rounded-lg border border-border bg-background px-2.5 py-2 text-[10px] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
                            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                Duplicate MR + serial items are synchronized instead of inserted twice.
                            </div>

                            <Button
                                type="button"
                                className="h-9 gap-2"
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
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <datalist id="itm-category-list">
                {categories.map((category) => (
                    <option
                        key={category}
                        value={category}
                    />
                ))}
            </datalist>
        </div>
    );
}
