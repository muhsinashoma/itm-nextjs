"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PurchaseRequest {
    id: number;
    prNumber: string;
    category: "MR" | "Petty Cash";
    date: string;
    department: string;
    requestedBy: string;
    totalItems: number;
    totalAmount: number;
    status: "Draft" | "Pending" | "Approved" | "Rejected";
}

export default function PurchaseRequestListPage() {
    const router = useRouter();

    const [requests] = useState<PurchaseRequest[]>([
        {
            id: 1,
            prNumber: "MR-2026-001",
            category: "MR",
            date: "2026-02-18",
            department: "IT Department",
            requestedBy: "John Doe",
            totalItems: 3,
            totalAmount: 2500,
            status: "Pending",
        },
        {
            id: 2,
            prNumber: "PC-2026-002",
            category: "MR",
            date: "2026-02-15",
            department: "HR",
            requestedBy: "Sarah Ahmed",
            totalItems: 2,
            totalAmount: 1200,
            status: "Approved",
        },
        {
            id: 3,
            prNumber: "PC-2026-003",
            category: "Petty Cash",
            date: "2026-02-15",
            department: "HR",
            requestedBy: "Ruhul Ahmed",
            totalItems: 2,
            totalAmount: 1200,
            status: "Approved",
        },
        {
            id: 4,
            prNumber: "PC-2026-004",
            category: "Petty Cash",
            date: "2026-02-15",
            department: "HR",
            requestedBy: "Sarah Ahmed",
            totalItems: 2,
            totalAmount: 1200,
            status: "Approved",
        },
        {
            id: 5,
            prNumber: "PC-2026-005",
            category: "MR",
            date: "2026-02-15",
            department: "IT",
            requestedBy: "Noor Hossain",
            totalItems: 2,
            totalAmount: 1200,
            status: "Approved",
        },
    ]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Approved":
                return "bg-green-100 text-green-700";
            case "Pending":
                return "bg-yellow-100 text-yellow-700";
            case "Rejected":
                return "bg-red-100 text-red-700";
            default:
                return "bg-muted text-gray-700";
        }
    };

    const getCategoryBadge = (category: string) => {
        return category === "MR"
            ? "bg-blue-100 text-blue-700"
            : "bg-purple-100 text-purple-700";
    };

    return (
        <div className="min-h-screen bg-muted">
            <div className="max-w-7xl mx-auto p-8 space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900">
                            Purchase Request Register
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            Manage Material Requisitions (MR) and Petty Cash requests.
                        </p>
                    </div>

                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => router.push("/dashboard/procurement/pr/create")}
                    >
                        + Create PR
                    </Button>
                </div>

                {/* Search & Filter */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="grid md:grid-cols-4 gap-4">
                        <Input placeholder="Search by PR Number..." />
                        <Input type="date" />

                        {/* Category Filter */}
                        <select className="border border-gray-300 rounded-md px-4 py-2 text-sm">
                            <option value="">Filter by Category</option>
                            <option value="MR">MR</option>
                            <option value="Petty Cash">Petty Cash</option>
                        </select>

                        {/* Status Filter */}
                        <select className="border border-gray-300 rounded-md px-4 py-2 text-sm">
                            <option value="">Filter by Status</option>
                            <option>Draft</option>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-muted-foreground">PR Number</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Category</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Date</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Department</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Requested By</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Items</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Total Amount</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.id} className="border-b hover:bg-muted">
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {request.prNumber}
                                    </td>

                                    {/* Category */}
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadge(
                                                request.category
                                            )}`}
                                        >
                                            {request.category}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">{request.date}</td>
                                    <td className="px-6 py-4">{request.department}</td>
                                    <td className="px-6 py-4">{request.requestedBy}</td>
                                    <td className="px-6 py-4">{request.totalItems}</td>

                                    <td className="px-6 py-4 font-medium">
                                        ${request.totalAmount.toLocaleString()}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                                                request.status
                                            )}`}
                                        >
                                            {request.status}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                router.push(`/dashboard/procurement/pr/view/${request.id}`)
                                            }
                                        >
                                            View
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                router.push(`/dashboard/procurement/pr/edit/${request.id}`)
                                            }
                                        >
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
