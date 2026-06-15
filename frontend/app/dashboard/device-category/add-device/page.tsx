//app/dashboard/vendor/vendor-form/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VendorFormData {
    vendorCode: string;
    name: string;
    category: string;
    email: string;
    mobile: string;
    responsiblePerson: string;
    address: string;
    status: string;
}

export default function VendorFormPage() {
    const router = useRouter();

    const [form, setForm] = useState<VendorFormData>({
        vendorCode: "",
        name: "",
        category: "",
        email: "",
        mobile: "",
        responsiblePerson: "",
        address: "",
        status: "Active",
    });

    // ✅ Auto-generate Vendor Code
    useEffect(() => {
        const code = "VND-" + Math.floor(1000 + Math.random() * 9000);
        setForm((prev) => ({ ...prev, vendorCode: code }));
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Vendor Data:", form);
    };

    return (
        <div className="h-screen overflow-hidden bg-muted flex flex-col">

            <div className="flex-1 max-w-7xl w-full mx-auto px-8 pt-3 flex flex-col">

                <div className="bg-muted border border-border rounded-2xl shadow flex flex-col h-full">

                    {/* ================= HEADER ================= */}
                    <div className="flex items-center justify-between px-8 py-3 border-b bg-muted rounded-t-2xl">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Vendor Information
                        </h2>

                        <Button
                            variant="outline"
                            onClick={() => router.push("/dashboard/vendor/vendor-list")}
                        >
                            Vendor List
                        </Button>
                    </div>

                    {/* ================= BODY ================= */}
                    <div className="flex-1 overflow-y-auto">

                        <form onSubmit={handleSubmit} className="px-8 py-4 space-y-6">

                            {/* ================= TWO COLUMN LAYOUT ================= */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* ================= BASIC INFO ================= */}
                                <div className="bg-muted border border-border rounded-xl p-5">

                                    <h3 className="text-base font-semibold text-gray-700 mb-4">
                                        Basic Information
                                    </h3>

                                    <div className="space-y-3">

                                        <div className="space-y-2">
                                            <label className="text-sm text-muted-foreground">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="category"
                                                value={form.category}
                                                onChange={handleChange}
                                                className="h-11 w-full border border-gray-300 bg-muted rounded-lg px-3 text-sm"
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                <option value="Supplier">Supplier</option>
                                                <option value="Service Provider">Service Provider</option>
                                                <option value="Distributor">Distributor</option>
                                                <option value="Manufacturer">Manufacturer</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-muted-foreground">Status</label>
                                            <select
                                                name="status"
                                                value={form.status}
                                                onChange={handleChange}
                                                className="h-11 w-full border border-gray-300 bg-muted rounded-lg px-3 text-sm"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-muted-foreground">
                                                Vendor Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                className="h-11 bg-muted"
                                                required
                                            />
                                        </div>

                                    </div>
                                </div>

                                {/* ================= CONTACT DETAILS ================= */}
                                <div className="bg-muted border border-border rounded-xl p-5">

                                    <h3 className="text-base font-semibold text-gray-700 mb-4">
                                        Contact Details
                                    </h3>

                                    <div className="space-y-3">

                                        <div className="space-y-2">
                                            <label className="text-sm text-muted-foreground">Contact Person</label>
                                            <Input
                                                name="responsiblePerson"
                                                value={form.responsiblePerson}
                                                onChange={handleChange}
                                                className="h-11 bg-muted"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-muted-foreground">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="email"
                                                name="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                className="h-11 bg-muted"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-muted-foreground">
                                                Mobile <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="tel"
                                                name="mobile"
                                                value={form.mobile}
                                                onChange={handleChange}
                                                className="h-11 bg-muted"
                                                required
                                            />
                                        </div>

                                    </div>
                                </div>

                            </div>

                            {/* ================= ADDRESS ================= */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-700 mb-3">
                                    Address Information
                                </h3>

                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full border border-gray-300 bg-muted rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* ================= ACTION ================= */}
                            <div className="flex justify-end gap-4 pt-4 border-t">

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/dashboard/vendor/vendor-list")}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    className="px-8 bg-blue-600 text-white"
                                >
                                    Save Vendor
                                </Button>

                            </div>

                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}