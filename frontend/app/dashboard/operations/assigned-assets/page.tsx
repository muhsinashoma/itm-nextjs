//app/dashboard/operations/assigned-assets/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { assignedColumns } from "@/components/reports/assigned-columns";
import { AssignedDevice } from "@/models/AssignedDevice";

export default function AssignedPage() {
    const searchParams = useSearchParams();
    const status = searchParams.get("status"); // Assigned | Transferred | Returned

    const [data, setData] = useState<AssignedDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadAssignedDevices() {
            try {
                const url = status
                    ? `/api/reports/assigned?status=${status}`
                    : `/api/reports/assigned`;

                const res = await fetch(url);

                if (!res.ok) {
                    throw new Error("Failed to load assigned devices");
                }

                const result: AssignedDevice[] = await res.json();
                setData(result);
            } catch (err) {
                console.error(err);
                setError("Unable to load data");
            } finally {
                setLoading(false);
            }
        }

        loadAssignedDevices();
    }, [status]); // 👈 reload when status changes

    if (loading) return <p className="p-6">Loading assigned devices...</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">
                {status ?? "All"} Devices
            </h1>

            <div className="overflow-x-auto rounded-xl"><DataTable columns={assignedColumns} data={data} />
        </div>
    );
}
