"use client";

import { useRouter } from "next/navigation";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VendorFormData {
    name: string;
    email: string;
    mobile: string;
    responsiblePerson: string;
    address: string;
    status: string;
}

export default function VendorFormPage() {
    const router = useRouter();   // ✅ ADD THIS
    const [form, setForm] = useState<VendorFormData>({
        name: "",
        email: "",
        mobile: "",
        responsiblePerson: "",
        address: "",
        status: "Active",
    });

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
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-6xl mx-auto p-8 space-y-8">

                {/* Page Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900">
                            Vendor Management
                        </h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Create and maintain vendor master records for procurement operations.
                        </p>
                    </div>


                    <Button
                        variant="outline"
                        className="px-6"
                        type="button"
                        onClick={() => router.push("/dashboard/vendor/vendor-list")}
                    >
                        Back to List
                    </Button>
                </div>

                {/* Form Card */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">

                    {/* Card Header */}
                    <div className="bg-gray-50 border-b border-gray-200 px-8 py-5 rounded-t-xl">
                        <h2 className="text-lg font-semibold text-gray-800 tracking-wide">
                            Vendor Information
                        </h2>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-10">

                        {/* Basic Information */}
                        <div className="space-y-6">
                            <div className="border-b-2 border-blue-600 pb-3">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                    Basic Information
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Vendor Name
                                    </label>
                                    <Input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Enter vendor name"
                                        className="h-11"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Responsible Person
                                    </label>
                                    <Input
                                        name="responsiblePerson"
                                        value={form.responsiblePerson}
                                        onChange={handleChange}
                                        placeholder="Contact person name"
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Email Address
                                    </label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="example@company.com"
                                        className="h-11"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Mobile Number
                                    </label>
                                    <Input
                                        type="tel"
                                        name="mobile"
                                        value={form.mobile}
                                        onChange={handleChange}
                                        placeholder="+880 1XXXXXXXXX"
                                        className="h-11"
                                        required
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="space-y-6">
                            <div className="border-b pb-3">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                    Address Details
                                </h3>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Full Address
                                </label>
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Enter vendor full address"
                                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                                />
                            </div>
                        </div>



                        {/* Footer */}
                        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">

                            <Button type="submit" className="px-8 bg-blue-600 hover:bg-blue-700 text-white">
                                Save Vendor
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );

}
