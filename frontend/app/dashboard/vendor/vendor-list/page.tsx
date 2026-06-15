//app//dashboard/vendor/vendor-list/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Vendor {
    id: number;
    name: string;
    email: string;
    mobile: string;
    responsiblePerson: string;
    status: string;
    category: string;
}

export default function VendorListPage() {
    const router = useRouter();

    const vendors: Vendor[] = [
        {
            id: 1,
            name: "Tech Solutions Ltd.",
            email: "info@techsolutions.com",
            mobile: "+880 1712345678",
            responsiblePerson: "John Doe",
            status: "Active",
            category: "Supplier",
        },
        {
            id: 2,
            name: "Global IT Supplier",
            email: "contact@globalit.com",
            mobile: "+880 1812345678",
            responsiblePerson: "Sarah Khan",
            status: "Inactive",
            category: "Service Provider",
        },
        {
            id: 3,
            name: "Tech Valley",
            email: "contact@globalit.com",
            mobile: "+880 1812345678",
            responsiblePerson: "Jarah Khan",
            status: "Inactive",
            category: "Distributor",
        },
    ];

    return (
        <div className="min-h-screen bg-muted">
            <div className="max-w-7xl mx-auto p-8 space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900">
                            Vendor List
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            View and manage registered vendors.
                        </p>
                    </div>

                    <Button
                        onClick={() => router.push("/dashboard/vendor/vendor-form")}
                    >
                        + Add Vendor
                    </Button>
                </div>

                {/* Table Card */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">

                    <div className="bg-muted border-b px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Vendor Records
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">

                            <thead className="bg-muted text-muted-foreground uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Vendor Name</th>
                                    <th className="px-6 py-4 text-left">Category</th>
                                    <th className="px-6 py-4 text-left">Responsible Person</th>
                                    <th className="px-6 py-4 text-left">Email</th>
                                    <th className="px-6 py-4 text-left">Mobile</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-muted">

                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {vendor.name}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold
        ${vendor.category === "Supplier"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : vendor.category === "Service Provider"
                                                            ? "bg-purple-100 text-purple-700"
                                                            : vendor.category === "Distributor"
                                                                ? "bg-orange-100 text-orange-700"
                                                                : "bg-muted text-gray-700"
                                                    }`}
                                            >
                                                {vendor.category}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            {vendor.responsiblePerson}
                                        </td>

                                        <td className="px-6 py-4">
                                            {vendor.email}
                                        </td>

                                        <td className="px-6 py-4">
                                            {vendor.mobile}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${vendor.status === "Active"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {vendor.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.push(`/dashboard/vendor/vendor-form?id=${vendor.id}`)
                                                }
                                            >
                                                Edit
                                            </Button>

                                            <Button size="sm" variant="destructive">
                                                Delete
                                            </Button>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>

                </div>

            </div>
        </div>
    );
}