
//frontend/app/dashboard/assets/devices/page.tsx


"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    MoreHorizontal,
    Pencil,
    Printer,
    RefreshCw,
    Search,
    UserRound,
    X,
} from "lucide-react";

import {
    assetDeviceApi,
    type AssetDevice,
} from "@/lib/api";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 50;

const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "1", label: "Assigned" },
    { value: "2", label: "Available" },
    { value: "3", label: "Transferred" },
    { value: "4", label: "Returned" },
    { value: "0", label: "Damaged" },
    { value: "5", label: "Lost" },
    { value: "7", label: "Ownership Transfer" },
    { value: "8", label: "Claim Raised" },
    { value: "15", label: "Service Request" },
];

function formatDate(value: string | null) {
    if (!value) return "-";

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

function statusClass(status: number) {
    const map: Record<number, string> = {
        0: "border-orange-200 bg-orange-50 text-orange-700",
        1: "border-blue-200 bg-blue-50 text-blue-700",
        2: "border-violet-200 bg-violet-50 text-violet-700",
        3: "border-amber-200 bg-amber-50 text-amber-700",
        4: "border-emerald-200 bg-emerald-50 text-emerald-700",
        5: "border-red-200 bg-red-50 text-red-700",
        7: "border-teal-200 bg-teal-50 text-teal-700",
        8: "border-pink-200 bg-pink-50 text-pink-700",
        15: "border-cyan-200 bg-cyan-50 text-cyan-700",
    };

    return (
        map[status] ??
        "border-slate-200 bg-slate-50 text-slate-700"
    );
}

function getInitials(name: string | null) {
    if (!name?.trim()) return "NA";

    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getAvatarTone(name: string | null) {
    const tones = [
        "bg-blue-100 text-blue-700",
        "bg-violet-100 text-violet-700",
        "bg-emerald-100 text-emerald-700",
        "bg-amber-100 text-amber-700",
        "bg-rose-100 text-rose-700",
        "bg-cyan-100 text-cyan-700",
        "bg-indigo-100 text-indigo-700",
        "bg-teal-100 text-teal-700",
    ];

    if (!name) {
        return "bg-slate-100 text-slate-600";
    }

    const number = [...name].reduce(
        (total, letter) => total + letter.charCodeAt(0),
        0
    );

    return tones[number % tones.length];
}


function EmployeeAvatar({
    name,
    image,
}: {
    name: string | null;
    image: string | null;
}) {
    const [imageFailed, setImageFailed] = useState(false);

    const canShowImage = Boolean(image && !imageFailed);

    return (
        <div
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold ${canShowImage
                ? "bg-muted"
                : getAvatarTone(name)
                }`}
        >
            {canShowImage ? (
                <img
                    src={image!}
                    alt={name || "Employee"}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : name ? (
                getInitials(name)
            ) : (
                <UserRound className="h-4 w-4" />
            )}
        </div>
    );
}

export default function AssetDevicesPage() {
    const router = useRouter();

    const [items, setItems] = useState<AssetDevice[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [category, setCategory] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const loadAssets = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await assetDeviceApi.list({
                page,
                limit: PAGE_SIZE,
                search: search || undefined,
                status: status ? Number(status) : undefined,
                category: category || undefined,
            });

            setItems(response.data ?? []);
            setTotal(response.total ?? 0);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load asset devices"
            );
        } finally {
            setLoading(false);
        }
    }, [page, search, status, category]);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    function applyFilters() {
        setPage(1);
        setSearch(searchInput.trim());
    }

    function clearFilters() {
        setSearchInput("");
        setSearch("");
        setStatus("");
        setCategory("");
        setPage(1);
    }

    function openDevice(item: AssetDevice) {
        router.push(`/dashboard/assets/devices/${item.id}`);
    }

    function printDevice(item: AssetDevice) {
        window.open(
            `/dashboard/assets/devices/${item.id}?print=1`,
            "_blank",
            "noopener,noreferrer,width=1100,height=850"
        );
    }

    function editDevice(item: AssetDevice) {
        router.push(`/dashboard/assets/devices/${item.id}?mode=edit`);
    }

    const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(page * PAGE_SIZE, total);

    return (
        <div className="space-y-4 p-4">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Dashboard</span>
                        <span>/</span>
                        <span>Inventory</span>
                        <span>/</span>
                        <span className="font-medium text-primary">
                            Asset Devices
                        </span>
                    </div>

                    <h1 className="text-xl font-bold text-foreground">
                        Asset Devices
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Current unique device inventory and employee assignment registry.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadAssets}
                        disabled={loading}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ? "animate-spin" : ""
                                }`}
                        />
                        Refresh
                    </button>

                    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">
                            Total Devices:
                        </span>
                        <span className="ml-1 font-bold text-primary">
                            {total.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter Area */}
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1.6fr)_180px_180px_auto]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    applyFilters();
                                }
                            }}
                            placeholder="Search serial, employee, brand, model or vendor..."
                            className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                        className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                    >
                        {STATUS_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <input
                        value={category}
                        onChange={(event) => {
                            setCategory(event.target.value);
                            setPage(1);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                setPage(1);
                            }
                        }}
                        placeholder="Category, e.g. Laptop"
                        className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                    />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                        >
                            <Filter className="h-4 w-4" />
                            Search
                        </button>

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Clear filters"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {(search || status || category) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                            Active filters:
                        </span>

                        {search && (
                            <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">
                                Search: {search}
                            </span>
                        )}

                        {status && (
                            <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">
                                Status:{" "}
                                {
                                    STATUS_OPTIONS.find(
                                        (item) => item.value === status
                                    )?.label
                                }
                            </span>
                        )}

                        {category && (
                            <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">
                                Category: {category}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1450px] text-sm">
                        <thead className="border-b border-border bg-muted/40">
                            <tr className="text-left text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                                <th className="min-w-[175px] px-4 py-3">
                                    Serial
                                </th>
                                <th className="min-w-[230px] px-4 py-3">
                                    Device
                                </th>
                                <th className="min-w-[240px] px-4 py-3">
                                    Employee
                                </th>
                                <th className="min-w-[220px] px-4 py-3">
                                    Department
                                </th>
                                <th className="min-w-[150px] px-4 py-3">
                                    Vendor
                                </th>
                                <th className="min-w-[200px] px-4 py-3">
                                    MR / PR
                                </th>
                                <th className="min-w-[130px] px-4 py-3">
                                    Assigned
                                </th>
                                <th className="min-w-[125px] px-4 py-3">
                                    Status
                                </th>
                                <th className="w-[70px] px-4 py-3 text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-16 text-center text-sm text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                                            Loading asset devices...
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && error && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-16 text-center text-sm text-red-600"
                                    >
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && items.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-16 text-center text-sm text-muted-foreground"
                                    >
                                        No asset devices found.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                !error &&
                                items.map((item) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => openDevice(item)}
                                        className="group cursor-pointer border-b border-border/70 transition-colors hover:bg-primary/[0.035]"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-semibold tracking-wide text-foreground">
                                                {item.device_serial || "-"}
                                            </div>

                                            <div className="mt-1 text-[11px] text-muted-foreground">
                                                Asset ID #{item.id}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-foreground">
                                                {[item.brand, item.model]
                                                    .filter(Boolean)
                                                    .join(" ") || "-"}
                                            </div>

                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {item.category ||
                                                    "Uncategorized"}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex min-w-[180px] items-center gap-2.5">

                                                <EmployeeAvatar
                                                    name={item.emp_name}
                                                    image={item.employee_image}
                                                />

                                                <div className="min-w-0">
                                                    <div className="truncate font-semibold text-foreground">
                                                        {item.emp_name ||
                                                            "Unassigned"}
                                                    </div>

                                                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                                        {item.emp_id ||
                                                            "No employee assigned"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="max-w-[210px] font-medium leading-5 text-foreground">
                                                {item.department || "-"}
                                            </div>

                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {item.designation || "-"}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="max-w-[145px] truncate font-medium text-foreground">
                                                {item.vendor_name || "-"}
                                            </div>

                                            {item.vendor_id && (
                                                <div className="mt-1 text-[11px] text-muted-foreground">
                                                    Vendor #{item.vendor_id}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="max-w-[200px] break-all text-xs font-medium text-foreground">
                                                {item.mr_number || "-"}
                                            </div>

                                            <div className="mt-1 max-w-[200px] break-all text-[11px] text-muted-foreground">
                                                {item.pr_number || "-"}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-xs font-medium text-foreground">
                                            {formatDate(item.assigned_date)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(
                                                    item.asset_status
                                                )}`}
                                            >
                                                {item.status_label}
                                            </span>
                                        </td>

                                        <td
                                            className="px-4 py-3 text-right"
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        aria-label={`Actions for ${item.device_serial ||
                                                            "asset device"
                                                            }`}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-48 border border-border bg-card text-card-foreground"
                                                >
                                                    <DropdownMenuLabel className="text-xs">
                                                        Asset Actions
                                                    </DropdownMenuLabel>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            openDevice(item)
                                                        }
                                                        className="gap-2 text-sm"
                                                    >
                                                        <Eye className="h-4 w-4 text-primary" />
                                                        View Details
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            printDevice(item)
                                                        }
                                                        className="gap-2 text-sm"
                                                    >
                                                        <Printer className="h-4 w-4 text-emerald-600" />
                                                        Print Preview
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            editDevice(item)
                                                        }
                                                        className="gap-2 text-sm"
                                                    >
                                                        <Pencil className="h-4 w-4 text-amber-600" />
                                                        Edit Device
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing{" "}
                        <span className="font-semibold text-foreground">
                            {startItem}
                        </span>
                        {" - "}
                        <span className="font-semibold text-foreground">
                            {endItem}
                        </span>
                        {" of "}
                        <span className="font-semibold text-foreground">
                            {total.toLocaleString()}
                        </span>
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() =>
                                setPage((current) =>
                                    Math.max(1, current - 1)
                                )
                            }
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </button>

                        <span className="px-1 text-sm text-muted-foreground">
                            Page{" "}
                            <span className="font-semibold text-foreground">
                                {page}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-foreground">
                                {totalPages}
                            </span>
                        </span>

                        <button
                            type="button"
                            disabled={page >= totalPages || loading}
                            onClick={() =>
                                setPage((current) =>
                                    Math.min(totalPages, current + 1)
                                )
                            }
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}