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
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
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
    SlidersHorizontal,
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

type WarrantyColumnKey =
    | "reference"
    | "employee"
    | "emp_id"
    | "device_serial"
    | "mr_no"
    | "pr_no"
    | "department"
    | "designation"
    | "category"
    | "brand"
    | "model"
    | "device_type"
    | "created_at"
    | "assigned_date"
    | "returned_date"
    | "transferred_date"
    | "purchase_date"
    | "warranty_date"
    | "device_age"
    | "status"
    | "vendor"
    | "problems";

type WarrantyColumnOption = {
    key: WarrantyColumnKey;
    label: string;
};

type WarrantyClaimRow = WarrantyClaimItem & {
    mr?: string | null;
    mr_no?: string | null;
    mrNo?: string | null;
    mr_number?: string | null;
    pr?: string | null;
    pr_no?: string | null;
    prNo?: string | null;
    pr_number?: string | null;
    device_type?: string | null;
    deviceType?: string | null;
    assigned_date?: string | null;
    assignedDate?: string | null;
    returned_date?: string | null;
    return_date?: string | null;
    returnedDate?: string | null;
    transferred_date?: string | null;
    transfer_date?: string | null;
    transferredDate?: string | null;
    purchase_date?: string | null;
    purchased_date?: string | null;
    purchaseDate?: string | null;
    device_age?: string | number | null;
    deviceAge?: string | number | null;
};

const WARRANTY_COLUMN_OPTIONS: WarrantyColumnOption[] = [
    { key: "reference", label: "Reference" },
    { key: "employee", label: "Employee Name / ID" },
    { key: "emp_id", label: "Employee ID" },
    { key: "device_serial", label: "Device Serial No" },
    { key: "mr_no", label: "MR No" },
    { key: "pr_no", label: "PR No" },
    { key: "department", label: "Department" },
    { key: "category", label: "Category" },
    { key: "brand", label: "Brand" },
    { key: "model", label: "Model" },
    { key: "device_type", label: "Device Type" },
    { key: "designation", label: "Designation" },
    { key: "created_at", label: "Created At" },
    { key: "assigned_date", label: "Assigned Date" },
    { key: "returned_date", label: "Returned Date" },
    { key: "transferred_date", label: "Transferred Date" },
    { key: "purchase_date", label: "Purchase Date" },
    { key: "warranty_date", label: "Warranty Date" },
    { key: "device_age", label: "Device Age" },
    { key: "status", label: "Status" },
    { key: "vendor", label: "Vendor" },
    { key: "problems", label: "Problems / Remarks" },
];

const DEFAULT_VISIBLE_WARRANTY_COLUMNS: WarrantyColumnKey[] = [
    "reference",
    "employee",
    "device_serial",
    "department",
    "category",
    "warranty_date",
    "status",
];

const WARRANTY_COLUMNS_STORAGE_KEY = "itm:warranty-claims:visible-columns:v5";

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

function getEmployeeInitials(value?: string | null) {
    const name = value?.trim().replace(/\s+/g, " ");

    if (!name) return "NA";

    const parts = name.split(" ").filter(Boolean);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    const firstInitial = parts[0]?.charAt(0) ?? "";
    const lastInitial = parts[parts.length - 1]?.charAt(0) ?? "";

    return `${firstInitial}${lastInitial}`.toUpperCase();
}

const EMPLOYEE_AVATAR_COLORS = [
    "bg-indigo-600 text-white ring-indigo-100",
    "bg-emerald-600 text-white ring-emerald-100",
    "bg-sky-600 text-white ring-sky-100",
    "bg-violet-600 text-white ring-violet-100",
    "bg-rose-600 text-white ring-rose-100",
    "bg-amber-500 text-white ring-amber-100",
    "bg-teal-600 text-white ring-teal-100",
    "bg-fuchsia-600 text-white ring-fuchsia-100",
] as const;

function getEmployeeAvatarColor(value?: string | null) {
    const normalized = value?.trim().toLowerCase() || "unknown";
    let hash = 0;

    for (let index = 0; index < normalized.length; index += 1) {
        hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
    }

    return EMPLOYEE_AVATAR_COLORS[hash % EMPLOYEE_AVATAR_COLORS.length];
}

function firstString(...values: Array<string | null | undefined>) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return undefined;
}

function formatOptionalDate(...values: Array<string | null | undefined>) {
    return formatDate(firstString(...values));
}

function formatDeviceAge(item: WarrantyClaimRow) {
    const directAge = item.device_age ?? item.deviceAge;

    if (
        directAge !== null &&
        directAge !== undefined &&
        String(directAge).trim()
    ) {
        return String(directAge);
    }

    const purchaseDate = firstString(
        item.purchase_date,
        item.purchased_date,
        item.purchaseDate,
    );

    if (!purchaseDate) return "—";

    const purchasedAt = new Date(purchaseDate);
    if (Number.isNaN(purchasedAt.getTime())) return "—";

    const today = new Date();
    let months =
        (today.getFullYear() - purchasedAt.getFullYear()) * 12 +
        (today.getMonth() - purchasedAt.getMonth());

    if (today.getDate() < purchasedAt.getDate()) {
        months -= 1;
    }

    if (months < 0) return "—";

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years && remainingMonths) return `${years}y ${remainingMonths}m`;
    if (years) return `${years}y`;
    return `${remainingMonths}m`;
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

function renderWarrantyCell(
    column: WarrantyColumnKey,
    item: WarrantyClaimRow,
    visibleColumns: Set<WarrantyColumnKey>,
) {
    switch (column) {
        case "reference":
            return (
                <span className="inline-flex items-center rounded-md border border-blue-200/70 bg-blue-50 px-2 py-1 font-mono text-[11px] font-semibold text-blue-700">
                    {item.reference}
                </span>
            );

        case "employee":
            return (
                <div className="flex min-w-0 items-center gap-2.5">
                    <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold tracking-wide shadow-sm ring-2 ${getEmployeeAvatarColor(item.employee)}`}
                        aria-label={`Employee initials ${getEmployeeInitials(item.employee)}`}
                        title={text(item.employee)}
                    >
                        {getEmployeeInitials(item.employee)}
                    </span>

                    <div className="min-w-0">
                        <p
                            className="truncate text-[11px] font-semibold leading-4 text-foreground"
                            title={item.employee || undefined}
                        >
                            {text(item.employee)}
                        </p>

                        <p className="mt-0.5 whitespace-nowrap text-[9px] font-medium text-muted-foreground">
                            {text(item.emp_id)}
                        </p>
                    </div>
                </div>
            );

        case "emp_id":
            return (
                <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    {text(item.emp_id)}
                </span>
            );

        case "device_serial":
            return (
                <span
                    className="
                        inline-block max-w-full break-all rounded-md border
                        border-slate-200 bg-slate-50 px-2 py-1 font-mono
                        text-[10px] font-semibold leading-4 text-slate-700
                    "
                    title={item.device_serial || undefined}
                >
                    {text(item.device_serial)}
                </span>
            );

        case "mr_no":
            return (
                <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    {text(firstString(item.mr_no, item.mrNo, item.mr_number, item.mr))}
                </span>
            );

        case "pr_no":
            return (
                <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    {text(firstString(item.pr_no, item.prNo, item.pr_number, item.pr))}
                </span>
            );

        case "department":
            return (
                <p className="max-w-[190px] text-[11px] leading-4 text-muted-foreground">
                    {text(item.department)}
                </p>
            );

        case "designation":
            return (
                <p className="max-w-[180px] text-[11px] leading-4">
                    {text(item.designation)}
                </p>
            );

        case "category": {
            const hiddenDeviceDetails = [
                !visibleColumns.has("brand") ? item.brand : null,
                !visibleColumns.has("model") ? item.model : null,
            ]
                .filter(Boolean)
                .join(" · ");

            return (
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold leading-4">
                        {text(item.category)}
                    </p>

                    {hiddenDeviceDetails && (
                        <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">
                            {hiddenDeviceDetails}
                        </p>
                    )}
                </div>
            );
        }

        case "brand":
            return <span className="text-[11px]">{text(item.brand)}</span>;

        case "model":
            return <span className="text-[11px]">{text(item.model)}</span>;

        case "device_type":
            return (
                <span className="text-[11px]">
                    {text(firstString(item.device_type, item.deviceType))}
                </span>
            );

        case "created_at":
            return (
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {formatDate(item.created_at)}
                </span>
            );

        case "assigned_date":
            return (
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {formatOptionalDate(item.assigned_date, item.assignedDate)}
                </span>
            );

        case "returned_date":
            return (
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {formatOptionalDate(
                        item.returned_date,
                        item.return_date,
                        item.returnedDate,
                    )}
                </span>
            );

        case "transferred_date":
            return (
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {formatOptionalDate(
                        item.transferred_date,
                        item.transfer_date,
                        item.transferredDate,
                    )}
                </span>
            );

        case "purchase_date":
            return (
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {formatOptionalDate(
                        item.purchase_date,
                        item.purchased_date,
                        item.purchaseDate,
                    )}
                </span>
            );

        case "warranty_date":
            return (
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {formatDate(item.warranty_date)}
                </span>
            );

        case "device_age":
            return (
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {formatDeviceAge(item)}
                </span>
            );

        case "status":
            return <StatusBadge status={item.status} />;

        case "vendor":
            return (
                <p className="max-w-[190px] text-[11px] leading-4">
                    {text(item.vendor)}
                </p>
            );

        case "problems":
            return (
                <p
                    className="max-w-[280px] truncate text-[11px] leading-4 text-muted-foreground"
                    title={item.problems || undefined}
                >
                    {text(item.problems)}
                </p>
            );

        default:
            return null;
    }
}

function exportCSV(rows: WarrantyClaimRow[]) {
    const headers = [
        "SL",
        "Reference",
        "Employee",
        "Employee ID",
        "Device Serial No",
        "MR No",
        "PR No",
        "Department",
        "Designation",
        "Category",
        "Brand",
        "Model",
        "Device Type",
        "Created At",
        "Assigned Date",
        "Returned Date",
        "Transferred Date",
        "Purchase Date",
        "Warranty Date",
        "Device Age",
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
        row.device_serial,
        firstString(row.mr_no, row.mrNo, row.mr_number, row.mr),
        firstString(row.pr_no, row.prNo, row.pr_number, row.pr),
        row.department,
        row.designation,
        row.category,
        row.brand,
        row.model,
        firstString(row.device_type, row.deviceType),
        row.created_at,
        firstString(row.assigned_date, row.assignedDate),
        firstString(row.returned_date, row.return_date, row.returnedDate),
        firstString(row.transferred_date, row.transfer_date, row.transferredDate),
        firstString(row.purchase_date, row.purchased_date, row.purchaseDate),
        row.warranty_date,
        formatDeviceAge(row),
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
                <AppFormFooter onCancel={onClose} cancelText="Close" hideSubmit />
            }
        >
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <AppInfoField label="Reference" value={item.reference} />
                    <AppInfoField label="Status" value={item.status} />
                    <AppInfoField label={dateLabel} value={formatDate(item.created_at)} />
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
                    <AppInfoField label="Device Serial" value={item.device_serial} mono />
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
                    <AppInfoField label={dateLabel} value={formatDate(item.created_at)} />
                    <AppInfoField label="Current Status" value={item.status} />
                </AppFormSection>

                <AppFormSection
                    title="Problem / Remarks"
                    icon={<Info size={14} />}
                    columns="one"
                >
                    <AppInfoField label="Problem Details" value={item.problems} span />
                </AppFormSection>
            </div>
        </AppFormModal>
    );
}

function WarrantyColumnSelector({
    visibleColumns,
    onToggle,
    onShowAll,
    onReset,
}: {
    visibleColumns: Set<WarrantyColumnKey>;
    onToggle: (key: WarrantyColumnKey) => void;
    onShowAll: () => void;
    onReset: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [columnSearch, setColumnSearch] = useState("");

    const selectorRef = useRef<HTMLDivElement | null>(null);
    const searchRef = useRef<HTMLInputElement | null>(null);

    const filteredColumns = useMemo(() => {
        const query = columnSearch.trim().toLowerCase();

        if (!query) {
            return WARRANTY_COLUMN_OPTIONS;
        }

        return WARRANTY_COLUMN_OPTIONS.filter((column) =>
            column.label.toLowerCase().includes(query),
        );
    }, [columnSearch]);

    useEffect(() => {
        if (!open) return;

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node;

            if (selectorRef.current && !selectorRef.current.contains(target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleKeyDown);

        const focusTimer = window.setTimeout(() => {
            searchRef.current?.focus();
        }, 50);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    return (
        <div ref={selectorRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-haspopup="menu"
                className={`
                    inline-flex h-10 items-center gap-2 rounded-lg border
                    bg-white px-3 text-xs font-semibold text-slate-700
                    shadow-sm transition-all duration-200
                    hover:border-slate-400 hover:bg-slate-50
                    ${open
                        ? "border-red-400 ring-2 ring-red-500/15"
                        : "border-slate-300"
                    }
                `}
            >
                <SlidersHorizontal size={14} />

                <span>Columns</span>

                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {visibleColumns.size}
                </span>

                <ChevronDown
                    size={13}
                    className={`transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    className="
                        absolute right-0 top-full z-[70] mt-2 w-[310px]
                        overflow-hidden rounded-xl border border-slate-200
                        bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]
                    "
                >
                    <div className="border-b border-slate-200 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold text-slate-900">
                                    Show / Hide Columns
                                </p>

                                <p className="mt-0.5 text-[10px] text-slate-500">
                                    {visibleColumns.size} of {WARRANTY_COLUMN_OPTIONS.length}{" "}
                                    visible
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Close columns menu"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="relative mt-3">
                            <Search
                                size={13}
                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                ref={searchRef}
                                value={columnSearch}
                                onChange={(event) => setColumnSearch(event.target.value)}
                                placeholder="Find a column..."
                                className="
                                    h-8 w-full rounded-lg border border-slate-200
                                    bg-slate-50 pl-8 pr-8 text-[11px]
                                    text-slate-700 outline-none transition
                                    placeholder:text-slate-400
                                    focus:border-red-400 focus:bg-white
                                    focus:ring-2 focus:ring-red-500/10
                                "
                            />

                            {columnSearch && (
                                <button
                                    type="button"
                                    onClick={() => setColumnSearch("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700"
                                    aria-label="Clear column search"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3 py-2">
                        <button
                            type="button"
                            onClick={onShowAll}
                            className="text-[10px] font-semibold text-blue-600 transition hover:text-blue-700"
                        >
                            Show all
                        </button>

                        <button
                            type="button"
                            onClick={onReset}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 transition hover:text-slate-800"
                        >
                            <RotateCcw size={11} />
                            Reset default
                        </button>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto py-1.5">
                        {filteredColumns.length ? (
                            filteredColumns.map((column) => {
                                const isVisible = visibleColumns.has(column.key);

                                return (
                                    <button
                                        key={column.key}
                                        type="button"
                                        role="menuitemcheckbox"
                                        aria-checked={isVisible}
                                        onClick={() => onToggle(column.key)}
                                        className={`
                                            group flex w-full items-center
                                            gap-2.5 px-3 py-2 text-left
                                            transition-colors
                                            ${isVisible
                                                ? "text-slate-900 hover:bg-[#F4FAFA]"
                                                : "text-slate-500 hover:bg-slate-50"
                                            }
                                        `}
                                    >
                                        <span
                                            className={`
                                                flex h-4 w-4 shrink-0 items-center
                                                justify-center rounded border
                                                transition
                                                ${isVisible
                                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                                    : "border-slate-300 bg-white"
                                                }
                                            `}
                                        >
                                            {isVisible && <Check size={11} />}
                                        </span>

                                        {isVisible ? (
                                            <Eye size={14} className="shrink-0 text-slate-600" />
                                        ) : (
                                            <EyeOff size={14} className="shrink-0 text-slate-400" />
                                        )}

                                        <span
                                            className={`flex-1 text-[11px] ${isVisible ? "font-semibold" : "font-medium"
                                                }`}
                                        >
                                            {column.label}
                                        </span>

                                        <span
                                            className={`
                                                rounded-full px-1.5 py-0.5
                                                text-[9px] font-semibold
                                                ${isVisible
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-slate-100 text-slate-500"
                                                }
                                            `}
                                        >
                                            {isVisible ? "Shown" : "Hidden"}
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <Search size={20} className="mx-auto text-slate-300" />

                                <p className="mt-2 text-[11px] font-medium text-slate-500">
                                    No matching columns
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5">
                        <p className="text-[9px] leading-4 text-slate-500">
                            Row number and Actions are always visible.
                        </p>
                    </div>
                </div>
            )}
        </div>
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
    const [rows, setRows] = useState<WarrantyClaimRow[]>([]);
    const [summary, setSummary] = useState<WarrantySummary>(EMPTY_SUMMARY);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewItem, setViewItem] = useState<WarrantyClaimItem | null>(null);

    const [visibleColumns, setVisibleColumns] = useState<Set<WarrantyColumnKey>>(
        () => new Set(DEFAULT_VISIBLE_WARRANTY_COLUMNS),
    );

    useEffect(() => {
        try {
            const storedColumns = window.localStorage.getItem(
                WARRANTY_COLUMNS_STORAGE_KEY,
            );

            if (!storedColumns) return;

            const parsedColumns = JSON.parse(storedColumns);

            if (!Array.isArray(parsedColumns)) return;

            const validColumns = parsedColumns.filter(
                (key): key is WarrantyColumnKey =>
                    WARRANTY_COLUMN_OPTIONS.some((column) => column.key === key),
            );

            setVisibleColumns(new Set(validColumns));
        } catch (storageError) {
            console.error("Unable to restore warranty claim columns:", storageError);
        }
    }, []);

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

            setRows((response.data ?? []) as WarrantyClaimRow[]);
            setTotal(response.total ?? 0);
        } catch (err) {
            setRows([]);
            setTotal(0);
            setError(err instanceof Error ? err.message : "Unable to load claims");
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

        router.replace(query ? `${pathname}?${query}` : pathname, {
            scroll: false,
        });
    };

    const persistVisibleColumns = (nextColumns: Set<WarrantyColumnKey>) => {
        setVisibleColumns(nextColumns);

        try {
            window.localStorage.setItem(
                WARRANTY_COLUMNS_STORAGE_KEY,
                JSON.stringify(Array.from(nextColumns)),
            );
        } catch (storageError) {
            console.error("Unable to save warranty claim columns:", storageError);
        }
    };

    const toggleColumn = (key: WarrantyColumnKey) => {
        const nextColumns = new Set(visibleColumns);

        if (nextColumns.has(key)) {
            nextColumns.delete(key);
        } else {
            nextColumns.add(key);
        }

        persistVisibleColumns(nextColumns);
    };

    const showAllColumns = () => {
        persistVisibleColumns(
            new Set(WARRANTY_COLUMN_OPTIONS.map((column) => column.key)),
        );
    };

    const resetColumns = () => {
        persistVisibleColumns(new Set(DEFAULT_VISIBLE_WARRANTY_COLUMNS));
    };

    const visibleColumnOptions = WARRANTY_COLUMN_OPTIONS.filter((column) =>
        visibleColumns.has(column.key),
    );

    const visibleTableColumnCount = visibleColumnOptions.length + 2;

    const hasExtraVisibleColumns = visibleColumnOptions.some(
        (column) => !DEFAULT_VISIBLE_WARRANTY_COLUMNS.includes(column.key),
    );

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
                                : (summaryMap.get(card.key) ?? 0);
                        const selected =
                            card.key === null ? !activeStatus : activeStatus === card.key;

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
                        Showing{" "}
                        <b className="text-foreground">
                            {first}-{last}
                        </b>{" "}
                        of <b className="text-foreground">{total}</b> records
                    </p>

                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        <WarrantyColumnSelector
                            visibleColumns={visibleColumns}
                            onToggle={toggleColumn}
                            onShowAll={showAllColumns}
                            onReset={resetColumns}
                        />

                        <div className="group relative w-full sm:w-[340px]">
                            <Search
                                size={15}
                                className="
                                    pointer-events-none absolute left-3 top-1/2
                                    z-10 -translate-y-1/2 text-slate-400
                                    transition-colors duration-200
                                    group-focus-within:text-red-500
                                "
                            />

                            <Input
                                autoFocus
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search name, reference, category..."
                                className="
                                    h-10 w-full rounded-lg border border-slate-300
                                    bg-white pl-9 pr-10 text-xs shadow-sm
                                    transition-all duration-200
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
                                        absolute right-2.5 top-1/2
                                        -translate-y-1/2 rounded-md p-1
                                        text-slate-400 transition-colors
                                        hover:bg-red-50 hover:text-red-600
                                    "
                                    aria-label="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table  */}

                <div
                    className={
                        hasExtraVisibleColumns
                            ? "overflow-x-auto"
                            : "overflow-hidden"
                    }
                >
                    <table
                        className={
                            hasExtraVisibleColumns
                                ? "w-full min-w-max"
                                : "w-full table-fixed"
                        }
                    >
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#DDE4E7]">
                                <th
                                    scope="col"
                                    className="
                                        w-12 whitespace-nowrap border-b
                                        border-slate-400 px-3 py-3 text-left
                                        text-[10px] font-bold uppercase
                                        tracking-[0.06em] text-slate-800
                                    "
                                >
                                    #
                                </th>

                                {visibleColumnOptions.map((column) => (
                                    <th
                                        key={column.key}
                                        scope="col"
                                        className="
                                            whitespace-nowrap border-b
                                            border-slate-400 px-3 py-3
                                            text-left text-[10px] font-bold
                                            uppercase tracking-[0.06em]
                                            text-slate-800
                                        "
                                    >
                                        {column.label}
                                    </th>
                                ))}

                                <th
                                    scope="col"
                                    className="
                                        w-24 whitespace-nowrap border-b
                                        border-slate-400 px-3 py-3 text-left
                                        text-[10px] font-bold uppercase
                                        tracking-[0.06em] text-slate-800
                                    "
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={visibleTableColumnCount}
                                        className="bg-white py-10 text-center"
                                    >
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
                                            group transition-colors duration-150
                                            ${index % 2 === 0
                                                ? "bg-[#F4FAFA]"
                                                : "bg-white"
                                            }
                                            hover:bg-[#E8F5F4]
                                        `}
                                    >
                                        <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-muted-foreground">
                                            {(page - 1) * PAGE_SIZE + index + 1}
                                        </td>

                                        {visibleColumnOptions.map((column) => (
                                            <td key={column.key} className="px-3 py-2.5 align-middle">
                                                {renderWarrantyCell(column.key, item, visibleColumns)}
                                            </td>
                                        ))}

                                        <td className="whitespace-nowrap px-3 py-2.5">
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
                                    <td
                                        colSpan={visibleTableColumnCount}
                                        className="bg-white py-10 text-center text-xs text-muted-foreground"
                                    >
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
                            onClick={() =>
                                setPage((value) => Math.min(totalPages, value + 1))
                            }
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
