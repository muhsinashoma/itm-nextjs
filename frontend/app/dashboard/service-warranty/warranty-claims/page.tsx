//frontend/app/dashboard/service-warranty/warranty-claims/page.tsx
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileSpreadsheet,
    FileText,
    Hash,
    Info,
    Loader2,
    Monitor,
    Package,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";


import { Input } from "@/components/ui/input";
import {
    reportApi,
    type WarrantyClaimItem,
    type WarrantySummary,
} from "@/lib/api";


//To Add New

import { AppFormModal } from "@/components/common/form/AppFormModal";
import { AppFormSection } from "@/components/common/form/AppFormSection";
import { AppInfoField } from "@/components/common/form/AppInfoField";
import { AppFormFooter } from "@/components/common/form/AppFormFooter";

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

    const printedAt = new Date().toLocaleString();

    const dateLabel = (status?: string) =>
        status === "Recovered"
            ? "Closing Date"
            : status === "To Vendor"
                ? "Forward Date"
                : status === "Expired"
                    ? "Expired Date"
                    : "Claim Date";

    const detailCard = (row: WarrantyClaimItem, index: number) => `
        <section class="claim-page">
            <div class="header">
                <div>
                    <h1>Warranty Claim Information</h1>
                    <p>Reference: <b>${escape(row.reference)}</b></p>
                </div>
                <div class="printed">
                    <p>Printed: ${escape(printedAt)}</p>
                    <p>Record: ${index + 1} of ${rows.length}</p>
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-box">
                    <span>Reference</span>
                    <b class="blue">${escape(row.reference)}</b>
                </div>
                <div class="summary-box">
                    <span>Status</span>
                    <b>${escape(row.status)}</b>
                </div>
                <div class="summary-box">
                    <span>${escape(dateLabel(row.status))}</span>
                    <b>${escape(formatDate(row.created_at))}</b>
                </div>
                <div class="summary-box">
                    <span>Vendor</span>
                    <b>${escape(text(row.vendor))}</b>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Employee Information</div>
                <div class="field-grid four">
                    <div class="field">
                        <span>Employee</span>
                        <b>${escape(text(row.employee))}</b>
                    </div>
                    <div class="field">
                        <span>Employee ID</span>
                        <b>${escape(text(row.emp_id))}</b>
                    </div>
                    <div class="field">
                        <span>Department</span>
                        <b>${escape(text(row.department))}</b>
                    </div>
                    <div class="field">
                        <span>Designation</span>
                        <b>${escape(text(row.designation))}</b>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Device Information</div>
                <div class="field-grid three">
                    <div class="field">
                        <span>Category</span>
                        <b>${escape(text(row.category))}</b>
                    </div>
                    <div class="field">
                        <span>Brand</span>
                        <b>${escape(text(row.brand))}</b>
                    </div>
                    <div class="field">
                        <span>Model</span>
                        <b>${escape(text(row.model))}</b>
                    </div>
                    <div class="field">
                        <span>Device Serial</span>
                        <b class="mono">${escape(text(row.device_serial))}</b>
                    </div>
                    <div class="field">
                        <span>Warranty Date</span>
                        <b>${escape(formatDate(row.warranty_date))}</b>
                    </div>
                    <div class="field">
                        <span>Vendor</span>
                        <b>${escape(text(row.vendor))}</b>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Warranty & Claim Information</div>
                <div class="field-grid three">
                    <div class="field">
                        <span>Warranty Date</span>
                        <b>${escape(formatDate(row.warranty_date))}</b>
                    </div>
                    <div class="field">
                        <span>${escape(dateLabel(row.status))}</span>
                        <b>${escape(formatDate(row.created_at))}</b>
                    </div>
                    <div class="field">
                        <span>Current Status</span>
                        <b>${escape(row.status)}</b>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Problem / Remarks</div>
                <div class="remarks">
                    ${escape(text(row.problems))}
                </div>
            </div>
        </section>
    `;

    const html = `
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <title>Warranty Claim Information</title>

                <style>
                    * {
                        box-sizing: border-box;
                    }

                    @page {
                        size: A4 portrait;
                        margin: 12mm;
                    }

                    body {
                        margin: 0;
                        color: #111827;
                        font-family: Arial, sans-serif;
                        font-size: 11px;
                        background: #ffffff;
                    }

                    .claim-page {
                        page-break-after: always;
                    }

                    .claim-page:last-child {
                        page-break-after: auto;
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 16px;
                        border-bottom: 2px solid #111827;
                        padding-bottom: 10px;
                        margin-bottom: 12px;
                    }

                    h1 {
                        margin: 0;
                        font-size: 18px;
                        line-height: 1.2;
                    }

                    p {
                        margin: 3px 0 0;
                    }

                    .printed {
                        color: #6b7280;
                        font-size: 10px;
                        text-align: right;
                        white-space: nowrap;
                    }

                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        overflow: hidden;
                        margin-bottom: 10px;
                    }

                    .summary-box {
                        min-height: 54px;
                        padding: 9px 10px;
                        border-right: 1px solid #e5e7eb;
                    }

                    .summary-box:last-child {
                        border-right: 0;
                    }

                    .summary-box span,
                    .field span {
                        display: block;
                        color: #6b7280;
                        font-size: 9px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                        margin-bottom: 4px;
                    }

                    .summary-box b,
                    .field b {
                        display: block;
                        color: #111827;
                        font-size: 11px;
                        line-height: 1.35;
                        word-break: break-word;
                    }

                    .summary-box .blue {
                        color: #1d4ed8;
                        font-size: 13px;
                    }

                    .section {
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        overflow: hidden;
                        margin-bottom: 10px;
                    }

                    .section-title {
                        background: #f1f5f9;
                        border-bottom: 1px solid #d1d5db;
                        color: #111827;
                        font-size: 12px;
                        font-weight: 700;
                        padding: 8px 10px;
                    }

                    .field-grid {
                        display: grid;
                    }

                    .field-grid.four {
                        grid-template-columns: repeat(4, 1fr);
                    }

                    .field-grid.three {
                        grid-template-columns: repeat(3, 1fr);
                    }

                    .field {
                        min-height: 50px;
                        padding: 9px 10px;
                        border-right: 1px solid #e5e7eb;
                        border-bottom: 1px solid #e5e7eb;
                    }

                    .field:nth-child(4n) {
                        border-right: 0;
                    }

                    .field-grid.three .field:nth-child(3n) {
                        border-right: 0;
                    }

                    .mono {
                        font-family: Consolas, "Courier New", monospace;
                    }

                    .remarks {
                        min-height: 70px;
                        padding: 10px;
                        line-height: 1.5;
                        color: #111827;
                        word-break: break-word;
                    }

                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>

            <body>
                ${rows.map(detailCard).join("")}

                <script>
                    window.addEventListener("load", function () {
                        setTimeout(function () {
                            window.focus();
                            window.print();
                        }, 300);
                    });
                </script>
            </body>
        </html>
    `;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("Popup blocked. Please allow popups for this site.");
        return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}

function ClaimModal({
    item,
    onClose,
}: {
    item: WarrantyClaimItem;
    onClose: () => void;
}) {
    const dateLabel =
        item.status === "Recovered"
            ? "Closing Date"
            : item.status === "To Vendor"
                ? "Forward Date"
                : item.status === "Expired"
                    ? "Expired Date"
                    : "Claim Date";

    return (
        <AppFormModal
            open={true}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title="Warranty Claim Information"
            subtitle={`Reference: ${item.reference}`}
            icon={<Hash size={18} />}
            footer={
                <AppFormFooter
                    onCancel={onClose}
                    cancelText="Close"
                    hideSubmit
                />
            }
        >
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <AppInfoField label="Reference" value={item.reference} />
                    <AppInfoField label="Status" value={item.status} />
                    <AppInfoField
                        label={dateLabel}
                        value={formatDate(item.created_at)}
                    />
                    <AppInfoField label="Vendor" value={item.vendor} />
                </div>

                <AppFormSection
                    title="Employee Information"
                    icon={<UserRound size={14} />}
                    columns="four"
                >
                    <AppInfoField label="Employee" value={item.employee} />
                    <AppInfoField label="Employee ID" value={item.emp_id} />
                    <AppInfoField label="Department" value={item.department} />
                    <AppInfoField label="Designation" value={item.designation} />
                </AppFormSection>

                <AppFormSection
                    title="Device Information"
                    icon={<Monitor size={14} />}
                    columns="three"
                >
                    <AppInfoField label="Category" value={item.category} />
                    <AppInfoField label="Brand" value={item.brand} />
                    <AppInfoField label="Model" value={item.model} />
                    <AppInfoField
                        label="Device Serial"
                        value={item.device_serial}
                        mono
                    />
                    <AppInfoField
                        label="Warranty Date"
                        value={formatDate(item.warranty_date)}
                    />
                    <AppInfoField label="Vendor" value={item.vendor} />
                </AppFormSection>

                <AppFormSection
                    title="Warranty & Claim Information"
                    icon={<CalendarDays size={14} />}
                    columns="three"
                >
                    <AppInfoField
                        label="Warranty Date"
                        value={formatDate(item.warranty_date)}
                    />
                    <AppInfoField
                        label={dateLabel}
                        value={formatDate(item.created_at)}
                    />
                    <AppInfoField label="Current Status" value={item.status} />
                </AppFormSection>

                <AppFormSection
                    title="Problem / Remarks"
                    icon={<Info size={14} />}
                    columns="one"
                >
                    <AppInfoField
                        label="Problem Details"
                        value={item.problems}
                        span
                    />
                </AppFormSection>
            </div>
        </AppFormModal>
    );
}

function WarrantyRowActions({
    item,
    onView,
    onPrint,
}: {
    item: WarrantyClaimItem;
    onView: (item: WarrantyClaimItem) => void;
    onPrint: (item: WarrantyClaimItem) => void;
}) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{
        top: number;
        right: number;
    } | null>(null);

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const toggleMenu = () => {
        const rect = buttonRef.current?.getBoundingClientRect();

        if (!rect) return;

        setPosition({
            top: rect.bottom + 6,
            right: window.innerWidth - rect.right,
        });

        setOpen((value) => !value);
    };

    useEffect(() => {
        if (!open) return;

        function handleClick(event: MouseEvent) {
            const target = event.target as Node;

            if (
                buttonRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }

            setOpen(false);
        }

        function closeMenu() {
            setOpen(false);
        }

        document.addEventListener("mousedown", handleClick);
        window.addEventListener("scroll", closeMenu, true);
        window.addEventListener("resize", closeMenu);

        return () => {
            document.removeEventListener("mousedown", handleClick);
            window.removeEventListener("scroll", closeMenu, true);
            window.removeEventListener("resize", closeMenu);
        };
    }, [open]);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleMenu}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-border"
            >
                Actions
                <ChevronDown size={12} />
            </button>

            {open && position && (
                <div
                    ref={menuRef}
                    className="fixed z-[80] w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl"
                    style={{
                        top: position.top,
                        right: position.right,
                    }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onView(item);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-foreground transition hover:bg-muted"
                    >
                        <Eye size={13} />
                        View Details
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onPrint(item);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-foreground transition hover:bg-muted"
                    >
                        <FileText size={13} />
                        Print
                    </button>
                </div>
            )}
        </>
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

    //will have unchanged
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

                    <div className="group relative w-full sm:w-[340px]">
                        <Search
                            size={15}
                            className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            z-10
            -translate-y-1/2
            text-slate-400
            transition-colors
                            duration-200
                            group-focus-within:text-red-500
                             "
                        />

                        <Input
                            autoFocus
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            placeholder="Search name, reference, category..."
                            className="
                            h-10
                            w-full
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            pl-9
                            pr-10
                            text-xs
                            shadow-sm
                            transition-all
                            duration-200
                            placeholder:text-slate-400

                            hover:border-slate-400

                            focus-visible:border-red-500
                            focus-visible:ring-2
                            focus-visible:ring-red-500/20
                            focus-visible:ring-offset-0
                          "
                        />

                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput("");
                                    setSearch("");
                                    setPage(1);
                                }}
                                className="
                                absolute
                                right-2.5
                                top-1/2
                                -translate-y-1/2
                                rounded-md
                                p-1
                                text-slate-400
                                transition-colors
                                hover:bg-red-50
                                hover:text-red-600
                                "
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table  */}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="sticky top-0 z-10">
                            {/* <tr className="bg-slate-300/90 shadow-sm"> */}
                            <tr className="bg-[#DDE4E7]">
                                {[
                                    "#",
                                    "Reference",
                                    "Employee",
                                    "Dept",
                                    "Category",
                                    "Created At",
                                    "Warranty",
                                    "Status",
                                    "Vendor",
                                    "Actions",
                                ].map((column) => (
                                    <th
                                        key={column}
                                        className="
                                        whitespace-nowrap
                                        border-b
                                        border-slate-400
                                        px-3
                                        py-3
                                        text-left
                                        text-[10px]
                                        font-bold
                                        uppercase
                                        tracking-[0.06em]
                                        text-slate-800
                                        "
                                    >
                                        {column}
                                    </th>

                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
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

                                    <tr
                                        key={`${item.status}-${item.id}-${item.reference}`}
                                        className={`
                                                group
                                                transition-colors
                                                duration-150
                                                ${index % 2 === 0
                                                ? "bg-[#F4FAFA]"
                                                : "bg-white"
                                            }
                                                hover:bg-[#E8F5F4]
                                            `}
                                    >
                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                                            {(page - 1) * PAGE_SIZE + index + 1}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span
                                                className="
                                                    inline-flex
                                                    items-center
                                                    rounded-md
                                                    border
                                                    border-blue-200/70
                                                    bg-blue-50
                                                    px-2
                                                    py-1
                                                    font-mono
                                                    text-[11px]
                                                    font-semibold
                                                    text-blue-700
                                                   "
                                            >
                                                {item.reference}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="min-w-[150px]">
                                                <p className="text-[11px] font-semibold leading-4 text-foreground">
                                                    {text(item.employee)}
                                                </p>

                                                <p className="mt-0.5 text-[9px] font-medium text-muted-foreground">
                                                    {text(item.emp_id)}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-3 py-3">
                                            <p className="max-w-[180px] text-[11px] leading-4 text-muted-foreground">
                                                {text(item.department)}
                                            </p>
                                        </td>

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
                                            <WarrantyRowActions
                                                item={item}
                                                onView={setViewItem}
                                                onPrint={(selectedItem) => printRows([selectedItem])}
                                            />
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