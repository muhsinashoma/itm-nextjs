


//app/dashboard/reports/assigned/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DataTable } from "@/components/data-table";
import { assignedColumns } from "@/components/reports/assigned-columns";
import { AssignedDevice } from "@/models/AssignedDevice";

export default function AssignedPage() {
    const searchParams = useSearchParams();
    const status = searchParams.get("status");

    const [data, setData] = useState<AssignedDevice[]>([]);
    const [loading, setLoading] = useState(true);

    const [viewDevice, setViewDevice] = useState<AssignedDevice | null>(null);
    const [assignDevice, setAssignDevice] = useState<AssignedDevice | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);

                const url = new URL("/api/reports/assigned", window.location.origin);

                if (status) {
                    url.searchParams.set("status", status);
                }

                const res = await fetch(url.toString());
                const result = await res.json();

                setData(result);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [status]);

    const columns = assignedColumns({
        onView: setViewDevice,
        onAssign: setAssignDevice,
    });

    if (loading) return (
        <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-lg" />
            ))}
        </div>
    );

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">
                {status ?? "All"} Devices
            </h1>

            {/* ✅ FIXED */}
            <div className="overflow-x-auto rounded-xl"><DataTable columns={columns} data={data} />

            {/* ================= VIEW MODAL ================= */}
            {viewDevice && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-card p-6 rounded w-[600px]">
                        <h2 className="text-lg font-bold mb-3">
                            {viewDevice.referenceNumber}
                        </h2>

                        <p><b>Employee:</b> {viewDevice.employeeName}</p>
                        <p><b>Department:</b> {viewDevice.department}</p>
                        <p><b>Status:</b> {viewDevice.status}</p>

                        <button
                            className="mt-4 px-4 py-2 bg-muted"
                            onClick={() => setViewDevice(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* ================= ASSIGN MODAL ================= */}
            {assignDevice && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-card p-6 rounded w-[600px]">
                        <h2 className="text-lg font-bold mb-3">
                            Assign {assignDevice.referenceNumber}
                        </h2>

                        <input className="border p-2 w-full mb-2" placeholder="Employee ID" />
                        <input className="border p-2 w-full mb-2" placeholder="Employee Name" />

                        <button className="bg-blue-600 text-white px-4 py-2 mr-2">
                            Confirm
                        </button>

                        <button
                            className="px-4 py-2 bg-muted"
                            onClick={() => setAssignDevice(null)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}