
//frontend/app/dashboard/master-data/vendors/page.tsx
"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Check,
    LoaderCircle,
    Plus,
    Search,
    Tags,
    X,
} from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

type VendorType = {
    id: number;
    code: string;
    name: string;
    status: number;
};

type Vendor = {
    id: number;
    vendor_code: string;
    vendor_name: string;
    contact_person: string;
    mobile: string;
    email: string;
    address: string;
    status: number;
    vendor_type_ids: number[];
    vendor_types: string[];
};

type VendorForm = {
    id: number | null;
    vendor_name: string;
    contact_person: string;
    mobile: string;
    email: string;
    address: string;
    vendor_type_ids: number[];
};

const emptyForm: VendorForm = {
    id: null,
    vendor_name: "",
    contact_person: "",
    mobile: "",
    email: "",
    address: "",
    vendor_type_ids: [],
};

export default function VendorMasterPage() {
    const [types, setTypes] =
        useState<VendorType[]>([]);
    const [vendors, setVendors] =
        useState<Vendor[]>([]);
    const [search, setSearch] =
        useState("");
    const [loading, setLoading] =
        useState(true);
    const [saving, setSaving] =
        useState(false);
    const [open, setOpen] =
        useState(false);
    const [form, setForm] =
        useState<VendorForm>(emptyForm);
    const [error, setError] =
        useState("");

    async function load() {
        try {
            setLoading(true);
            setError("");

            const [
                typeResponse,
                vendorResponse,
            ] = await Promise.all([
                api.get<{
                    success: boolean;
                    data: VendorType[];
                }>("/vendors/master/types"),
                api.get<{
                    success: boolean;
                    data: Vendor[];
                }>(
                    `/vendors/master?search=${encodeURIComponent(
                        search.trim()
                    )}`
                ),
            ]);

            setTypes(
                typeResponse.data ?? []
            );
            setVendors(
                vendorResponse.data ?? []
            );
        } catch (reason) {
            const message =
                reason instanceof Error
                    ? reason.message
                    : "Unable to load Vendor Master.";

            setError(
                message.toLowerCase().includes("route not found")
                    ? "Vendor Master backend routes are not registered yet. Apply PATCHES/01_REQUIRED_HANDLER_ROUTES.txt, rebuild the Go API, and restart the backend."
                    : message
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = window.setTimeout(
            () => void load(),
            300
        );

        return () =>
            window.clearTimeout(timer);
    }, [search]);

    const activeCount = useMemo(
        () =>
            vendors.filter(
                (vendor) =>
                    vendor.status === 1
            ).length,
        [vendors]
    );

    function openNew() {
        setForm(emptyForm);
        setError("");
        setOpen(true);
    }

    function editVendor(vendor: Vendor) {
        setForm({
            id: vendor.id,
            vendor_name:
                vendor.vendor_name,
            contact_person:
                vendor.contact_person ?? "",
            mobile: vendor.mobile ?? "",
            email: vendor.email ?? "",
            address:
                vendor.address ?? "",
            vendor_type_ids:
                vendor.vendor_type_ids ??
                [],
        });
        setError("");
        setOpen(true);
    }

    function toggleType(id: number) {
        setForm((current) => ({
            ...current,
            vendor_type_ids:
                current.vendor_type_ids.includes(
                    id
                )
                    ? current.vendor_type_ids.filter(
                        (value) =>
                            value !== id
                    )
                    : [
                        ...current.vendor_type_ids,
                        id,
                    ],
        }));
    }

    async function save() {
        if (!form.vendor_name.trim()) {
            setError(
                "Vendor Name is required."
            );
            return;
        }

        if (
            form.vendor_type_ids.length ===
            0
        ) {
            setError(
                "Select at least one Vendor Type."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            const body = {
                vendor_name:
                    form.vendor_name.trim(),
                contact_person:
                    form.contact_person.trim(),
                mobile: form.mobile.trim(),
                email: form.email.trim(),
                address:
                    form.address.trim(),
                vendor_type_ids:
                    form.vendor_type_ids,
            };

            if (form.id) {
                await api.put(
                    `/vendors/master/${form.id}`,
                    body
                );
            } else {
                await api.post(
                    "/vendors/master",
                    body
                );
            }

            setOpen(false);
            setForm(emptyForm);
            await load();
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to save vendor."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">
                        Vendor Management
                    </h1>
                    <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                        One Vendor Master for SCM / Supply, Hardware, Software / License, Service, Infrastructure and Consulting / Project vendors.
                    </p>
                </div>

                <Button
                    onClick={openNew}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add Vendor
                </Button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Vendors Loaded
                    </p>
                    <p className="mt-1 text-xl font-bold">
                        {vendors.length}
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Active
                    </p>
                    <p className="mt-1 text-xl font-bold text-emerald-600">
                        {activeCount}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                    <div className="relative max-w-xl">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search vendor code, name, mobile or email..."
                            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                        <thead className="bg-muted/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">
                                    Vendor Code
                                </th>
                                <th className="px-4 py-3">
                                    Vendor
                                </th>
                                <th className="px-4 py-3">
                                    Types
                                </th>
                                <th className="px-4 py-3">
                                    Contact
                                </th>
                                <th className="px-4 py-3">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center"
                                    >
                                        <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-primary" />
                                    </td>
                                </tr>
                            ) : vendors.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                                    >
                                        No vendors found.
                                    </td>
                                </tr>
                            ) : (
                                vendors.map(
                                    (vendor) => (
                                        <tr
                                            key={
                                                vendor.id
                                            }
                                            className="border-t border-border"
                                        >
                                            <td className="px-4 py-3 font-mono text-[11px] font-bold">
                                                {
                                                    vendor.vendor_code
                                                }
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold">
                                                    {
                                                        vendor.vendor_name
                                                    }
                                                </p>
                                                <p className="mt-0.5 max-w-xs truncate text-[10px] text-muted-foreground">
                                                    {vendor.address ||
                                                        "—"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex max-w-sm flex-wrap gap-1">
                                                    {vendor.vendor_types.map(
                                                        (type) => (
                                                            <span
                                                                key={
                                                                    type
                                                                }
                                                                className="rounded-full border border-border bg-muted px-2 py-0.5 text-[9px]"
                                                            >
                                                                {
                                                                    type
                                                                }
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[11px]">
                                                <p>
                                                    {vendor.contact_person ||
                                                        "—"}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {vendor.mobile ||
                                                        vendor.email ||
                                                        "—"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${vendor.status ===
                                                        1
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-500"
                                                        }`}
                                                >
                                                    {vendor.status ===
                                                        1
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        editVendor(
                                                            vendor
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <div>
                                <h2 className="font-bold">
                                    {form.id
                                        ? "Edit Vendor"
                                        : "Add Vendor"}
                                </h2>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                    Vendor Code is generated automatically and remains unique.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setOpen(false)
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="grid gap-4 p-5 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className="mb-1 block text-[10px] font-semibold">
                                    Vendor Name *
                                </span>
                                <input
                                    value={
                                        form.vendor_name
                                    }
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                vendor_name:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-[10px] font-semibold">
                                    Contact Person
                                </span>
                                <input
                                    value={
                                        form.contact_person
                                    }
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                contact_person:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-[10px] font-semibold">
                                    Mobile
                                </span>
                                <input
                                    value={form.mobile}
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                mobile:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-[10px] font-semibold">
                                    Email
                                </span>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                email:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>

                            <label>
                                <span className="mb-1 block text-[10px] font-semibold">
                                    Address
                                </span>
                                <input
                                    value={form.address}
                                    onChange={(event) =>
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                address:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>

                            <div className="sm:col-span-2">
                                <div className="mb-2 flex items-center gap-2">
                                    <Tags className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-semibold">
                                        Vendor Types *
                                    </span>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {types.map(
                                        (type) => {
                                            const checked =
                                                form.vendor_type_ids.includes(
                                                    type.id
                                                );

                                            return (
                                                <button
                                                    key={
                                                        type.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        toggleType(
                                                            type.id
                                                        )
                                                    }
                                                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-[10px] ${checked
                                                        ? "border-primary/40 bg-primary/5 text-primary"
                                                        : "border-border"
                                                        }`}
                                                >
                                                    <span>
                                                        {
                                                            type.name
                                                        }
                                                    </span>

                                                    {checked && (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setOpen(false)
                                }
                                disabled={saving}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={() =>
                                    void save()
                                }
                                disabled={saving}
                            >
                                {saving && (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save Vendor
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
