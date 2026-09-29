//app/dashboard/reports/ownership/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { assignedColumns } from "@/components/reports/assigned-columns";
import { AssignedDevice } from "@/models/AssignedDevice";
import DeviceViewModal from "@/components/modals/DeviceViewModal";

/* ================= NORMALIZE ================= */
const normalize = (value?: string) =>
    value?.toLowerCase().trim() || "";

export default function OwnershipPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const status = normalize(searchParams.get("status") || undefined);

    const [data, setData] = useState<AssignedDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [viewDevice, setViewDevice] = useState<AssignedDevice | null>(null);

    const [stats, setStats] = useState({
        total: 0,
        user: 0,
        vendor: 0,
    });

    /* ================= LOAD DATA ================= */
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                const url = status
                    ? `/api/reports/ownership?status=${status}`
                    : `/api/reports/ownership`;

                const res = await fetch(url);

                if (!res.ok) throw new Error("Network error");

                const response = await res.json();

                if (!response.success) {
                    throw new Error("API failed");
                }

                setData(response.data);
                setStats(response.stats);

            } catch (err) {
                console.error(err);
                setError("Unable to load ownership data");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [status]);

    /* ================= COLUMNS ================= */
    const columns = assignedColumns({
        onView: (device) => setViewDevice(device),
        onAssign: () => { },
    });

    if (loading) return (
        <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-lg" />
            ))}
        </div>
    );
    if (error) return <p className="p-6 text-red-600">{error}</p>;

    return (
        <div className="p-6">

            {/* ================= TITLE ================= */}
            <h1 className="text-xl font-semibold mb-4">
                Device Ownership ({status || "all"})
            </h1>

            {/* ================= CARDS ================= */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">

                <Card
                    title="Total Ownership"
                    count={stats.total}
                    color="gray"
                    onClick={() => router.push("?")}
                />

                <Card
                    title="User Ownership"
                    count={stats.user}
                    color="green"
                    onClick={() => router.push("?status=user")}
                />

                <Card
                    title="Vendor Ownership"
                    count={stats.vendor}
                    color="red"
                    onClick={() => router.push("?status=vendor")}
                />
            </div>

            {/* ================= TABLE ================= */}
            <div className="overflow-x-auto rounded-xl"><DataTable columns={columns} data={data} />

            {/* ================= MODAL ================= */}
            <DeviceViewModal
                open={!!viewDevice}
                onOpenChange={(open) => {
                    if (!open) setViewDevice(null);
                }}
                device={viewDevice}
            />
        </div>
    );
}

/* ================= CARD ================= */
function Card({
    title,
    count,
    color,
    onClick,
}: {
    title: string;
    count: number;
    color: "red" | "green" | "gray";
    onClick: () => void;
}) {
    const colors = {
        red: "bg-red-50 border-red-200 text-red-600",
        green: "bg-green-50 border-green-200 text-green-600",
        gray: "bg-muted border-gray-300 text-muted-foreground",
    };

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer border p-4 rounded-xl hover:shadow transition ${colors[color]}`}
        >
            <p className="text-sm">{title}</p>
            <h2 className="text-2xl font-bold">{count}</h2>
        </div>
    );
}