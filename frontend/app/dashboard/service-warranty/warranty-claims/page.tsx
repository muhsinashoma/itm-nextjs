//frontend/app/dashboard/service-warranty/warranty-claims/page.tsx
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileSpreadsheet,
    FileText,
    Loader2,
    Package,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
    reportApi,
    type WarrantyClaimItem,
    type WarrantySummary,
} from "@/lib/api";

type WarrantyStatus = "Claimed" | "To Vendor" | "Recovered" | "Expired";

const PAGE_SIZE = 20;

const EMPTY_SUMMARY: WarrantySummary = {
    total: 0,
    items: [
        { label: "Claimed", value: 0 },
        { label: "To Vendor", value: 0 },
        { label: "Recovered", value: 0 },
        { label: "Expired", value: 0 },
    ],
};

const STATUS_CONFIG: Record<
    WarrantyStatus,
    { color: string; bg: string; border: string; icon: ReactNode }
> = {
    Claimed: {
        color: "text-orange-700",
        bg: "bg-orange-50",
        border: "border-orange-200",
        icon: <Package size={11} />,
    },
    "To Vendor": {
        color: "text-violet-700",
        bg: "bg-violet-50",
        border: "border-violet-200",
        icon: <RotateCcw size={11} />,
    },
    Recovered: {
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: <CheckCircle2 size={11} />,
    },
    Expired: {
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: <AlertCircle size={11} />,
    },
};

const STAT_CARDS: Array<{
    key: WarrantyStatus | null;
    label: string;
    color: string;
    bg: string;
    icon: ReactNode;
}> = [
        {
            key: null,
            label: "Total",
            color: "text-foreground",
            bg: "bg-muted border-border",
            icon: <ShieldCheck size={14} />,
        },
        {
            key: "Claimed",
            label: "Claimed",
            color: "text-orange-700",
            bg: "bg-orange-50 border-orange-100",
            icon: <Package size={14} />,
        },
        {
            key: "To Vendor",
            label: "To Vendor",
            color: "text-violet-700",
            bg: "bg-violet-50 border-violet-100",
            icon: <RotateCcw size={14} />,
        },
        {
            key: "Recovered",
            label: "Recovered",
            color: "text-blue-700",
            bg: "bg-blue-50 border-blue-100",
            icon: <CheckCircle2 size={14} />,
        },
        {
            key: "Expired",
            label: "Expired",
            color: "text-red-700",
            bg: "bg-red-50 border-red-100",
            icon: <AlertCircle size={14} />,
        },
    ];

function isWarrantyStatus(value: string | null): value is WarrantyStatus {
    return (
        value === "Claimed" ||
        value === "To Vendor" ||
        value === "Recovered" ||
        value === "Expired"
    );
}

function text(value?: string | null) {
    return value?.trim() || "—";
}

function formatDate(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status as WarrantyStatus];

    if (!config) {
        return (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {status}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.color} ${config.bg} ${config.border}`}
        >
            {config.icon}
            {status}
        </span>
    );
}

function exportCSV(rows: WarrantyClaimItem[]) {
    const headers = [
        "SL",
        "Reference",
        "Employee",
        "Employee ID",
        "Department",
        "Category",
        "Brand",
        "Model",
        "Device Serial",
        "Warranty Date",
        "Status",
        "Vendor",
        "Problems",
    ];

    const escape = (value: unknown) =>
        `"${String(value ?? "").replaceAll('"', '""')}"`;

    const body = rows.map((row, index) => [
        index + 1,
        row.reference,
        row.employee,
        row.emp_id,
        row.department,
        row.category,
        row.brand,
        row.model,
        row.device_serial,
        row.warranty_date,
        row.status,
        row.vendor,
        row.problems,
    ]);

    const csv = [headers, ...body]
        .map((row) => row.map(escape).join(","))
        .join("\n");

    const url = URL.createObjectURL(
        new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `warranty-claims-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
}

function printRows(rows: WarrantyClaimItem[]) {
    const escape = (value: unknown) =>
        String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");

    const tableRows = rows
        .map(
            (row, index) => `<tr>
                <td>${index + 1}</td>
                <td>${escape(row.reference)}</td>
                <td>${escape(text(row.employee))}</td>
                <td>${escape(text(row.department))}</td>
                <td>${escape(text(row.category))}</td>
                <td>${escape(formatDate(row.warranty_date))}</td>
                <td>${escape(row.status)}</td>
                <td>${escape(text(row.vendor))}</td>
            </tr>`,
        )
        .join("");

    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;

    popup.document.write(`<!doctype html><html><head><title>Warranty Claims</title>
        <style>
            body{font-family:Arial,sans-serif;padding:24px;font-size:11px}
            table{width:100%;border-collapse:collapse}
            th{background:#f1f5f9;text-align:left;padding:8px}
            td{padding:8px;border-bottom:1px solid #e2e8f0}
        </style></head><body>
        <h2>Warranty Claims Report</h2>
        <p>${rows.length} record(s)</p>
        <table><thead><tr><th>#</th><th>Reference</th><th>Employee</th><th>Department</th><th>Category</th><th>Warranty</th><th>Status</th><th>Vendor</th></tr></thead>
        <tbody>${tableRows}</tbody></table>
        <script>window.onload=()=>window.print()</script>
        </body></html>`);
    popup.document.close();
}

function ClaimModal({
    item,
    onClose,
}: {
    item: WarrantyClaimItem;
    onClose: () => void;
}) {
    const field = (label: string, value?: string | null) => (
        <div>
            <p className="text-[9px] uppercase text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-foreground">
                {text(value)}
            </p>
        </div>
    );

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[95vw] max-w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
                    <div className="flex items-center justify-between bg-primary px-5 py-4">
                        <div>
                            <Dialog.Title className="text-sm font-semibold text-primary-foreground">
                                Warranty Claim Details
                            </Dialog.Title>
                            <p className="text-[11px] text-primary-foreground/70">
                                Reference: {item.reference}
                            </p>
                        </div>
                        <Dialog.Close className="rounded-lg p-1 text-primary-foreground">
                            <X size={16} />
                        </Dialog.Close>
                    </div>

                    <div className="space-y-4 p-5">
                        <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 sm:grid-cols-4">
                            {field("Employee", item.employee)}
                            {field("Employee ID", item.emp_id)}
                            {field("Department", item.department)}
                            {field("Designation", item.designation)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 sm:grid-cols-3">
                            {field("Category", item.category)}
                            {field("Brand", item.brand)}
                            {field("Model", item.model)}
                            {field("Serial", item.device_serial)}
                            {field("Warranty", formatDate(item.warranty_date))}
                            {field("Vendor", item.vendor)}
                        </div>

                        <div className="space-y-3 rounded-xl border border-border p-4">
                            <StatusBadge status={item.status} />
                            {field("Problems", item.problems)}
                            {field("Created", formatDate(item.created_at))}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default function WarrantyClaimsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const statusParam = searchParams.get("status");
    const activeStatus: WarrantyStatus | null = isWarrantyStatus(statusParam)
        ? statusParam
        : null;

    const [rows, setRows] = useState<WarrantyClaimItem[]>([]);
    const [summary, setSummary] = useState<WarrantySummary>(EMPTY_SUMMARY);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewItem, setViewItem] = useState<WarrantyClaimItem | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 350);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [activeStatus]);

    const loadSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const response = await reportApi.warrantySummary();
            setSummary(response.data ?? EMPTY_SUMMARY);
        } catch (err) {
            console.error(err);
            setSummary(EMPTY_SUMMARY);
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    const loadClaims = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await reportApi.warrantyClaims({
                page,
                limit: PAGE_SIZE,
                status: activeStatus ?? "all",
                search: search || undefined,
            });

            setRows(response.data ?? []);
            setTotal(response.total ?? 0);
        } catch (err) {
            setRows([]);
            setTotal(0);
            setError(
                err instanceof Error ? err.message : "Unable to load claims",
            );
        } finally {
            setLoading(false);
        }
    }, [activeStatus, page, search]);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    useEffect(() => {
        void loadClaims();
    }, [loadClaims]);

    const summaryMap = useMemo(
        () =>
            new Map(
                (summary.items ?? []).map((item) => [
                    item.label,
                    Number(item.value) || 0,
                ]),
            ),
        [summary.items],
    );

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const last = Math.min(page * PAGE_SIZE, total);

    // const changeStatus = (status: WarrantyStatus | null) => {
    //     const next = activeStatus === status ? null : status;
    //     const params = new URLSearchParams(searchParams.toString());

    //     if (next) params.set("status", next);
    //     else params.delete("status");

    //     const query = params.toString();
    //     router.replace(query ? `${pathname}?${query}` : pathname, {
    //         scroll: false,
    //     });

    // };

    const changeStatus = (status: WarrantyStatus | null) => {
        const nextStatus = activeStatus === status ? null : status;
        const params = new URLSearchParams(searchParams.toString());

        if (nextStatus) {
            params.set("status", nextStatus);
        } else {
            params.delete("status");
        }

        setPage(1);

        const query = params.toString();

        router.replace(
            query ? `${pathname}?${query}` : pathname,
            {
                scroll: false,
            },
        );
    };

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
                            <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold">Warranty Claims</h1>
                            <p className="text-xs text-muted-foreground">
                                {activeStatus
                                    ? `Showing: ${activeStatus}`
                                    : "All warranty claim records"}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                void loadSummary();
                                void loadClaims();
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs"
                        >
                            <RefreshCw size={13} /> Refresh
                        </button>
                        <button
                            type="button"
                            disabled={!rows.length}
                            onClick={() => exportCSV(rows)}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 disabled:opacity-40"
                        >
                            <FileSpreadsheet size={13} /> Excel
                        </button>
                        <button
                            type="button"
                            disabled={!rows.length}
                            onClick={() => printRows(rows)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 disabled:opacity-40"
                        >
                            <FileText size={13} /> PDF
                        </button>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {STAT_CARDS.map((card) => {
                        const count =
                            card.key === null
                                ? summary.total
                                : summaryMap.get(card.key) ?? 0;
                        const selected =
                            card.key === null
                                ? !activeStatus
                                : activeStatus === card.key;

                        return (
                            <button
                                type="button"
                                key={card.label}
                                onClick={() => changeStatus(card.key)}
                                className={`rounded-xl border px-3 py-3 text-left ring-2 transition hover:opacity-80 ${card.bg} ${selected ? "ring-primary" : "ring-transparent"
                                    }`}
                            >
                                <div className="mb-1 flex items-center justify-between">
                                    <p className="text-[9px] uppercase text-muted-foreground">
                                        {card.label}
                                    </p>
                                    <span className={`${card.color} opacity-50`}>
                                        {card.icon}
                                    </span>
                                </div>
                                <p className={`text-xl font-bold ${card.color}`}>
                                    {summaryLoading ? "…" : count}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    <AlertCircle size={15} />
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <p className="text-[11px] text-muted-foreground">
                        Showing <b className="text-foreground">{first}-{last}</b> of{" "}
                        <b className="text-foreground">{total}</b> records
                    </p>

                    <div className="relative">
                        <Search
                            size={12}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            placeholder="Search name, ref, category..."
                            className="h-8 w-64 pl-7 text-xs"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                {["#", "Reference", "Employee", "Dept", "Category", "Created At", "Warranty", "Status", "Vendor", "Actions"].map((column) => (
                                    <th key={column} className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="py-10 text-center">
                                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 size={16} className="animate-spin" />
                                            Loading warranty claims...
                                        </span>
                                    </td>
                                </tr>
                            ) : rows.length ? (
                                rows.map((item, index) => (
                                    <tr key={`${item.status}-${item.id}-${item.reference}`} className="hover:bg-muted/30">
                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                                            {(page - 1) * PAGE_SIZE + index + 1}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                                                {item.reference}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <p className="text-[11px] font-medium">{text(item.employee)}</p>
                                            <p className="text-[9px] text-muted-foreground">{text(item.emp_id)}</p>
                                        </td>
                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{text(item.department)}</td>
                                        <td className="px-3 py-2.5">
                                            <p className="text-[11px] font-medium">{text(item.category)}</p>
                                            <p className="text-[9px] text-muted-foreground">{[item.brand, item.model].filter(Boolean).join(" · ") || "—"}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-muted-foreground">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{formatDate(item.warranty_date)}</td>
                                        <td className="px-3 py-2.5"><StatusBadge status={item.status} /></td>
                                        <td className="px-3 py-2.5 text-[11px]">{text(item.vendor)}</td>
                                        <td className="px-3 py-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setViewItem(item)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-[11px]"
                                            >
                                                <Eye size={12} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="py-10 text-center text-xs text-muted-foreground">
                                        No warranty claim records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <p className="text-[10px] text-muted-foreground">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[11px] disabled:opacity-40"
                        >
                            <ChevronLeft size={12} /> Previous
                        </button>
                        <button
                            type="button"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[11px] disabled:opacity-40"
                        >
                            Next <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {viewItem && (
                <ClaimModal item={viewItem} onClose={() => setViewItem(null)} />
            )}
        </div>
    );
}