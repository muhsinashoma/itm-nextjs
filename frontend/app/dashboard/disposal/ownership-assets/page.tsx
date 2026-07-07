
// frontend/app/dashboard/disposal/ownership-assets/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Award,
    ChevronDown,
    FileSpreadsheet,
    FileText,
    Package,
    Printer,
    Search,
    ShieldCheck,
    Store,
    UserCheck,
    Users,
    X,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import {
    ownershipApi,
    type OwnershipAsset,
    type OwnershipSummary,
} from "@/lib/api";


function getDeviceName(item: OwnershipAsset) {
    return (
        [item.category, item.brand, item.model]
            .filter(Boolean)
            .join(" ")
            .trim() || "—"
    );
}

function formatDate(value: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function escapeCsvValue(value: string | number | null | undefined) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/* ── Avatar ── */
function Avatar({ name }: { name: string }) {
    const safeName = name.trim() || "Unknown";

    const initials = safeName
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const colors = [
        "bg-violet-100 text-violet-700",
        "bg-blue-100 text-blue-700",
        "bg-emerald-100 text-emerald-700",
        "bg-amber-100 text-amber-700",
        "bg-rose-100 text-rose-700",
    ];

    const colorIndex = safeName.charCodeAt(0) % colors.length;

    return (
        <span
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${colors[colorIndex] || colors[0]
                }`}
        >
            {initials || "—"}
        </span>
    );
}

/* ── Status badge ── */
function StatusBadge({
    ownershipType,
}: {
    ownershipType: "User" | "Vendor" | "Unknown";
}) {
    const styles = {
        User: "border-green-200 bg-green-50 text-green-700",
        Vendor: "border-red-200 bg-red-50 text-red-700",
        Unknown: "border-border bg-muted text-muted-foreground",
    };

    return (
        <span
            className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[ownershipType]
                }`}
        >
            {ownershipType}
        </span>
    );
}

/* ── Export helpers ── */
function exportCSV(data: OwnershipAsset[]) {
    const headers = [
        "SL",
        "Reference",
        "Employee ID",
        "Employee",
        "Department",
        "Designation",
        "Device",
        "Serial",
        "Assigned Date",
        "Status",
    ];

    const rows = data.map((item, index) => [
        index + 1,
        item.reference,
        item.emp_id || "",
        item.emp_name || "",
        item.department || "",
        item.designation || "",
        getDeviceName(item),
        item.device_serial || "",
        formatDate(item.assigned_date || item.updated_at),
        "Ownership",
    ]);

    const csv = [headers, ...rows]
        .map((row) => row.map(escapeCsvValue).join(","))
        .join("\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `device-ownership-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
}

function exportPDF(data: OwnershipAsset[]) {
    const rows = data
        .map(
            (item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.reference}</td>
                    <td>${item.emp_name || "—"}</td>
                    <td>${getDeviceName(item)}</td>
                    <td>${item.device_serial || "—"}</td>
                    <td>${formatDate(
                item.transfer_date ||
                item.assigned_date ||
                item.updated_at,
            )}</td>
                    <td>Ownership</td>
                </tr>
            `,
        )
        .join("");

    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8" />
                <title>Device Ownership Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 11px;
                        padding: 24px;
                        color: #111;
                    }

                    h2 {
                        margin-bottom: 4px;
                        font-size: 16px;
                    }

                    p {
                        margin-bottom: 16px;
                        color: #666;
                        font-size: 10px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    th {
                        padding: 8px 10px;
                        border-bottom: 2px solid #e2e8f0;
                        background: #f1f5f9;
                        font-size: 10px;
                        text-align: left;
                        text-transform: uppercase;
                    }

                    td {
                        padding: 7px 10px;
                        border-bottom: 1px solid #e2e8f0;
                    }

                    tr:nth-child(even) td {
                        background: #f8fafc;
                    }

                    .footer {
                        margin-top: 20px;
                        color: #999;
                        font-size: 10px;
                        text-align: right;
                    }
                </style>
            </head>

            <body>
                <h2>Device Ownership Report</h2>

                <p>
                    Generated: ${new Date().toLocaleString()}
                    · Total Current Ownership Assets: ${data.length}
                </p>

                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Reference</th>
                            <th>Employee</th>
                            <th>Device</th>
                            <th>Serial</th>
                            <th>Assigned</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="footer">
                    Fiber@Home Ltd. · ITM Portal
                </div>
            </body>
        </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const windowRef = window.open(url, "_blank");

    windowRef?.addEventListener("load", () => {
        windowRef.print();
    });
}

/* ── View Modal ── */
function ViewModal({
    item,
    onClose,
}: {
    item: OwnershipAsset;
    onClose: () => void;
}) {
    return (
        <DialogPrimitive.Root open onOpenChange={onClose}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[95vw] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between bg-primary px-5 py-3.5">
                        <div>
                            <DialogPrimitive.Title className="text-sm font-semibold text-primary-foreground">
                                Ownership Asset Details
                            </DialogPrimitive.Title>

                            <p className="mt-0.5 text-[11px] text-primary-foreground/70">
                                Reference: #{item.reference}
                            </p>
                        </div>

                        <DialogPrimitive.Close className="rounded-lg p-1.5 text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-primary-foreground">
                            <X className="h-4 w-4" />
                        </DialogPrimitive.Close>
                    </div>

                    <div className="space-y-3 p-5">
                        <div className="overflow-hidden rounded-xl border border-border">
                            <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold text-foreground">
                                    Employee Information
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 bg-card px-4 py-3">
                                <InfoField
                                    label="Employee ID"
                                    value={item.emp_id || "—"}
                                />

                                <InfoField
                                    label="Employee Name"
                                    value={item.emp_name || "Unassigned"}
                                />

                                <InfoField
                                    label="Department"
                                    value={item.department || "—"}
                                />

                                <InfoField
                                    label="Designation"
                                    value={item.designation || "—"}
                                />
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border">
                            <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2">
                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold text-foreground">
                                    Device Information
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 bg-card px-4 py-3">
                                <InfoField
                                    label="Device"
                                    value={getDeviceName(item)}
                                />

                                <InfoField
                                    label="Serial Number"
                                    value={item.device_serial || "—"}
                                />

                                <InfoField
                                    label="Assigned Date"
                                    value={formatDate(item.assigned_date)}
                                />

                                <InfoField
                                    label="Warranty Date"
                                    value={formatDate(item.warranty_date)}
                                />

                                <InfoField
                                    label="Purchase Date"
                                    value={formatDate(item.purchase_date)}
                                />

                                <InfoField
                                    label="Last Updated"
                                    value={formatDate(item.updated_at)}
                                />
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border">
                            <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2">
                                <Award className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold text-foreground">
                                    Ownership Status
                                </p>
                            </div>

                            <div className="bg-card px-4 py-3">
                                <p className="text-sm font-bold text-purple-700">
                                    Ownership Transfer
                                </p>

                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                    This asset is currently marked as ownership
                                    transfer in the asset registry.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-border bg-muted/40 px-5 py-3">
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-primary px-5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                        >
                            Close
                        </button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function InfoField({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p className="mt-0.5 break-words text-[11px] font-semibold text-foreground">
                {value || "—"}
            </p>
        </div>
    );
}

/* ── Actions Dropdown ── */
function ActionsDropdown({
    item,
    onView,
    onPrintPreview,
}: {
    item: OwnershipAsset;
    onView: (item: OwnershipAsset) => void;
    onPrintPreview: (item: OwnershipAsset) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                ref.current &&
                !ref.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const close = () => setOpen(false);

    return (
        <div ref={ref} className="relative inline-block">
            <button
                onClick={() => setOpen((current) => !current)}
                className="flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-border"
            >
                Actions
                <ChevronDown size={11} />
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl">
                    <button
                        onClick={() => {
                            onView(item);
                            close();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-blue-600 transition hover:bg-muted"
                    >
                        <Package size={12} />
                        View Details
                    </button>

                    <button
                        onClick={() => {
                            onPrintPreview(item);
                            close();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-muted"
                    >
                        <Printer size={12} />
                        Print Record
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Main Page ── */
export default function WarrantyOwnershipPage() {

    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");

    const [selectedCategory, setSelectedCategory] = useState<
        "all" | "user" | "vendor"
    >("all");

    const [viewItem, setViewItem] = useState<OwnershipAsset | null>(null);

    const [ownership, setOwnership] = useState<OwnershipAsset[]>([]);
    const [summary, setSummary] = useState<OwnershipSummary | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [total, setTotal] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);

        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        let mounted = true;

        async function loadOwnershipData() {
            try {
                setIsLoading(true);
                setError("");

                const [summaryRes, listRes] = await Promise.all([
                    ownershipApi.summary(),
                    ownershipApi.list({
                        page,
                        limit: pageSize,
                        search: search.trim() || undefined,
                        category: selectedCategory,
                    }),
                ]);

                if (!mounted) return;

                setSummary(summaryRes.data);
                setOwnership(
                    Array.isArray(listRes.data)
                        ? listRes.data
                        : []
                );
                setTotal(Number(listRes.total ?? 0));
            } catch (err: any) {
                console.error(
                    "[ownership] unable to load data:",
                    err
                );

                if (mounted) {
                    setError(
                        err?.message ||
                        "Unable to load ownership data."
                    );
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        loadOwnershipData();

        return () => {
            mounted = false;
        };
    }, [page, pageSize, search, selectedCategory]);

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return ownership;
        }

        return ownership.filter((item) => {
            const searchableText = [
                item.reference,
                item.emp_id,
                item.emp_name,
                item.department,
                item.designation,
                item.device_serial,
                item.category,
                item.brand,
                item.model,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(keyword);
        });
    }, [ownership, search]);

    const printSingleRecord = (item: OwnershipAsset) => {
        exportPDF([item]);
    };

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50">
                            <ShieldCheck className="h-5 w-5 text-purple-600" />
                        </div>

                        <div>
                            <h1 className="text-sm font-bold text-foreground">
                                Device Ownership
                            </h1>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Manage and monitor ownership transfer records
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => exportCSV(filtered)}
                            disabled={isLoading || filtered.length === 0}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FileSpreadsheet size={13} />
                            Excel
                        </button>

                        <button
                            onClick={() => exportPDF(filtered)}
                            disabled={isLoading || filtered.length === 0}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FileText size={13} />
                            PDF
                        </button>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                        {
                            label: "Transfer Forms",
                            value: summary?.total_ownership ?? 0,
                            color: "text-foreground",
                            bg: "border-border bg-muted",
                            icon: <ShieldCheck size={14} />,
                            category: "all" as const,
                        },
                        {
                            label: "User Ownership",
                            value: summary?.user_ownership ?? 0,
                            color: "text-green-700",
                            bg: "border-green-100 bg-green-50",
                            icon: <Users size={14} />,
                            category: "user" as const,
                        },
                        {
                            label: "Vendor Ownership",
                            value: summary?.vendor_ownership ?? 0,
                            color: "text-red-700",
                            bg: "border-red-100 bg-red-50",
                            icon: <Store size={14} />,
                            category: "vendor" as const,
                        },
                    ].map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                                setSelectedCategory(item.category);
                                setPage(1);
                            }}
                            className={`rounded-xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${item.bg
                                } ${selectedCategory === item.category
                                    ? "ring-2 ring-primary ring-offset-1"
                                    : ""
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {item.label}
                                </p>

                                <span className={`${item.color} opacity-60`}>
                                    {item.icon}
                                </span>
                            </div>

                            <p className={`mt-1 text-xl font-bold ${item.color}`}>
                                {isLoading ? "—" : item.value.toLocaleString()}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <div>
                        <p className="text-[11px] text-muted-foreground">
                            Showing{" "}
                            <span className="font-semibold text-foreground">
                                {ownership.length}
                            </span>{" "}
                            of {total} current ownership assets
                        </p>

                        {!isLoading && summary && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                Transfer forms: {summary.total_ownership} ·
                                Current registry assets:{" "}
                                {summary.current_asset_count}
                            </p>
                        )}
                    </div>

                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            placeholder="Search employee, serial, device..."
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            className="h-7 w-60 pl-7 text-xs"
                        />
                    </div>
                </div>

                {error && (
                    <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px]">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                {[
                                    "#",
                                    "Reference",
                                    "Employee",
                                    "Device",
                                    "Serial",
                                    "Assigned",
                                    "Status",
                                    "Actions",
                                ].map((column) => (
                                    <th
                                        key={column}
                                        className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                                    >
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-border/50">
                            {isLoading &&
                                Array.from({ length: 6 }).map((_, index) => (
                                    <tr key={index}>
                                        {Array.from({ length: 8 }).map(
                                            (_, cellIndex) => (
                                                <td
                                                    key={cellIndex}
                                                    className="px-3 py-3"
                                                >
                                                    <div className="h-4 animate-pulse rounded bg-muted" />
                                                </td>
                                            ),
                                        )}
                                    </tr>
                                ))}

                            {!isLoading &&
                                filtered.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                                            {(page - 1) * pageSize + index + 1}
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                                                #{item.reference}
                                            </span>
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    name={
                                                        item.emp_name ||
                                                        "Unassigned"
                                                    }
                                                />

                                                <div>
                                                    <p className="whitespace-nowrap text-[11px] font-medium text-foreground">
                                                        {item.emp_name ||
                                                            "Unassigned"}
                                                    </p>

                                                    <p className="text-[10px] text-muted-foreground">
                                                        {item.emp_id || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-2.5 text-[11px] font-medium text-foreground">
                                            <p>{getDeviceName(item)}</p>

                                            {item.department && (
                                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                    {item.department}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                                            {item.device_serial || "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-muted-foreground">
                                            {formatDate(
                                                item.assigned_date ||
                                                item.updated_at,
                                            )}
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <StatusBadge ownershipType={item.ownership_type} />
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <ActionsDropdown
                                                item={item}
                                                onView={setViewItem}
                                                onPrintPreview={printSingleRecord}
                                            />
                                        </td>
                                    </tr>
                                ))}

                            {!isLoading && filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-10 text-center text-xs text-muted-foreground"
                                    >
                                        No ownership assets match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && total > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                        <p className="text-[11px] text-muted-foreground">
                            Page{" "}
                            <span className="font-semibold text-foreground">
                                {page}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-foreground">
                                {Math.max(1, Math.ceil(total / pageSize))}
                            </span>
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() =>
                                    setPage((current) =>
                                        Math.max(1, current - 1),
                                    )
                                }
                                className="rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <button
                                type="button"
                                disabled={
                                    page >= Math.ceil(total / pageSize)
                                }
                                onClick={() =>
                                    setPage((current) => current + 1)
                                }
                                className="rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {viewItem && (
                <ViewModal
                    item={viewItem}
                    onClose={() => setViewItem(null)}
                />
            )}
        </div>
    );
}


