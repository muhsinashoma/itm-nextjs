// app/dashboard/device-clearance/approved-list/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/* ================= STATIC DATA ================= */
const initialData = [
    {
        id: 1,
        user_name: "John Doe",
        device_name: "Dell Latitude 5420",
        status: "Approved",
        created_at: "2026-05-01",
    },
    {
        id: 2,
        user_name: "Sarah Khan",
        device_name: "HP EliteBook",
        status: "Approved",
        created_at: "2026-05-02",
    },
    {
        id: 3,
        user_name: "Rahim Uddin",
        device_name: "MacBook Pro",
        status: "Rejected",
        created_at: "2026-05-03",
    },
];

export default function ClearanceListPage() {
    const router = useRouter();
    const [data] = useState(initialData);

    /* ================= STATUS STYLE ================= */
    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Approved":
                return "bg-green-100 text-green-700";
            case "Rejected":
                return "bg-red-100 text-red-600";
            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">

            {/* ================= HEADER ================= */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    Exit Clearance Approval List
                </h1>
                <p className="text-sm text-slate-500">
                    Review and manage all clearance requests
                </p>
            </div>

            {/* ================= CARD ================= */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">

                {/* TABLE HEADER */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="font-semibold text-slate-700">
                        Clearance Requests
                    </h2>

                    <span className="text-xs text-slate-500">
                        Total: {data.length}
                    </span>
                </div>

                {/* TABLE */}
                <table className="w-full text-sm">

                    <thead className="bg-slate-100 text-slate-600">
                        <tr>
                            <th className="p-4 text-left">Employee</th>
                            <th className="p-4 text-left">Device</th>
                            <th className="p-4 text-left">Date</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-left">Action</th>
                        </tr>
                    </thead>

                    <tbody>

                        {data.map((item) => (
                            <tr
                                key={item.id}
                                className="border-t hover:bg-slate-50 transition"
                            >

                                {/* EMPLOYEE */}
                                <td className="p-4 font-medium text-slate-800">
                                    {item.user_name}
                                </td>

                                {/* DEVICE */}
                                <td className="p-4 text-slate-600">
                                    {item.device_name}
                                </td>

                                {/* DATE */}
                                <td className="p-4 text-slate-500">
                                    {item.created_at}
                                </td>

                                {/* STATUS */}
                                <td className="p-4">
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusStyle(
                                            item.status
                                        )}`}
                                    >
                                        {item.status}
                                    </span>
                                </td>

                                {/* ACTION */}
                                <td className="p-4 flex gap-2">

                                    <Button
                                        variant="outline"
                                        className="text-xs"
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/device-clearance/approval/${item.id}`
                                            )
                                        }
                                    >
                                        View
                                    </Button>

                                    {item.status === "Pending" && (
                                        <>
                                            <Button className="text-xs bg-green-600 hover:bg-green-700">
                                                Approve
                                            </Button>

                                            <Button
                                                variant="destructive"
                                                className="text-xs"
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    )}

                                </td>

                            </tr>
                        ))}

                    </tbody>

                </table>
            </div>

        </div>
    );
}