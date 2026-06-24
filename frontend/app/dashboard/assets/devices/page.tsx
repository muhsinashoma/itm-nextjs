//frontend/app/dashboard/assets/devices/page.tsx
"use client";
import { useRouter } from "next/navigation";

import { useCallback, useEffect, useState } from "react";
import {
    assetDeviceApi,
    type AssetDevice,
} from "@/lib/api";

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
        0: "bg-orange-50 text-orange-700 border-orange-200",
        1: "bg-blue-50 text-blue-700 border-blue-200",
        2: "bg-violet-50 text-violet-700 border-violet-200",
        3: "bg-amber-50 text-amber-700 border-amber-200",
        4: "bg-emerald-50 text-emerald-700 border-emerald-200",
        5: "bg-red-50 text-red-700 border-red-200",
        7: "bg-teal-50 text-teal-700 border-teal-200",
        8: "bg-pink-50 text-pink-700 border-pink-200",
        15: "bg-cyan-50 text-cyan-700 border-cyan-200",
    };

    return map[status] ?? "bg-slate-50 text-slate-700 border-slate-200";
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

    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">
                        Asset Devices
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Current unique device inventory from asset devices.
                    </p>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Total Devices: </span>
                    <span className="font-bold text-primary">
                        {total.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                applyFilters();
                            }
                        }}
                        placeholder="Search serial, employee, brand, vendor..."
                        className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25 md:col-span-2"
                    />

                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                        className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
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
                        placeholder="Category, e.g. Laptop"
                        className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                    />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={applyFilters}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        Search
                    </button>

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1180px] text-sm">
                        <thead className="border-b border-border bg-muted/40">
                            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                                <th className="px-4 py-3 font-semibold">Serial</th>
                                <th className="px-4 py-3 font-semibold">Device</th>
                                <th className="px-4 py-3 font-semibold">Employee</th>
                                <th className="px-4 py-3 font-semibold">Department</th>
                                <th className="px-4 py-3 font-semibold">Vendor</th>
                                <th className="px-4 py-3 font-semibold">MR / PR</th>
                                <th className="px-4 py-3 font-semibold">Assigned Date</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-12 text-center text-muted-foreground"
                                    >
                                        Loading asset devices...
                                    </td>
                                </tr>
                            )}

                            {!loading && error && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-12 text-center text-red-600"
                                    >
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && items.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-12 text-center text-muted-foreground"
                                    >
                                        No asset devices found.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                !error &&
                                items.map((item) => (
                                    // <tr
                                    //     key={item.id}
                                    //     className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                    // >

                                    <tr
                                        key={item.id}
                                        onClick={() => router.push(`/dashboard/assets/devices/${item.id}`)}
                                        className="cursor-pointer border-b border-border/70 transition-colors hover:bg-muted/50"
                                    >
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {item.device_serial || "-"}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">
                                                {[item.brand, item.model]
                                                    .filter(Boolean)
                                                    .join(" ") || "-"}
                                            </div>

                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                                {item.category || "-"}
                                                {item.device_type
                                                    ? ` • ${item.device_type}`
                                                    : ""}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">
                                                {item.emp_name || "Unassigned"}
                                            </div>

                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                                {item.emp_id || "-"}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="text-foreground">
                                                {item.department || "-"}
                                            </div>

                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                                {item.designation || "-"}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.vendor_name || "-"}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div>{item.mr_number || "-"}</div>
                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                                {item.pr_number || "-"}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            {formatDate(item.assigned_date)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                                                    item.asset_status
                                                )}`}
                                            >
                                                {item.status_label}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing{" "}
                        <span className="font-medium text-foreground">
                            {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                        </span>
                        {" - "}
                        <span className="font-medium text-foreground">
                            {Math.min(page * PAGE_SIZE, total)}
                        </span>
                        {" of "}
                        <span className="font-medium text-foreground">
                            {total.toLocaleString()}
                        </span>
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-muted-foreground">
                            Page <span className="font-medium text-foreground">{page}</span> of{" "}
                            <span className="font-medium text-foreground">{totalPages}</span>
                        </span>

                        <button
                            type="button"
                            disabled={page >= totalPages || loading}
                            onClick={() =>
                                setPage((current) =>
                                    Math.min(totalPages, current + 1)
                                )
                            }
                            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}