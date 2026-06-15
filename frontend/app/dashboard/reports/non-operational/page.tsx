// app/dashboard/reports/non-operational/page.tsx
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

export default function NonOperationalPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const status = normalize(searchParams.get("status") || undefined);

    const [data, setData] = useState<AssignedDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [viewDevice, setViewDevice] = useState<AssignedDevice | null>(null);

    const [stats, setStats] = useState({
        lost: 0,
        stolen: 0,
        damaged: 0,
        obsoleted: 0,
        ownership: 0,
    });

    /* ================= LOAD DATA ================= */
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                const url = status
                    ? `/api/reports/non-operational?status=${status}`
                    : `/api/reports/non-operational`;

                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to load data");

                const result: AssignedDevice[] = await res.json();
                setData(result);

                /* ================= STATS ================= */
                const counts = {
                    lost: 0,
                    stolen: 0,
                    damaged: 0,
                    obsoleted: 0,
                    ownership: 0,
                };

                result.forEach((item) => {
                    const s = normalize(item.status);

                    switch (s) {
                        case "lost":
                            counts.lost++;
                            break;
                        case "stolen":
                            counts.stolen++;
                            break;
                        case "damaged":
                            counts.damaged++;
                            break;
                        case "obsoleted":
                        case "obsolete":
                            counts.obsoleted++;
                            break;
                        case "ownership":
                            counts.ownership++;
                            break;
                    }
                });

                setStats(counts);
            } catch (err) {
                setError("Unable to load data");
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
                Non-Operational Devices ({status || "all"})
            </h1>

            {/* ================= DASHBOARD CARDS ================= */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">

                <Card title="Lost" count={stats.lost} color="red"
                    onClick={() => router.push("?status=lost")} />

                <Card title="Stolen" count={stats.stolen} color="orange"
                    onClick={() => router.push("?status=stolen")} />

                <Card title="Damaged" count={stats.damaged} color="yellow"
                    onClick={() => router.push("?status=damaged")} />

                <Card title="Obsoleted" count={stats.obsoleted} color="gray"
                    onClick={() => router.push("?status=obsoleted")} />

                {/* <Card title="Ownership" count={stats.ownership} color="blue"
                    onClick={() => router.push("?status=ownership")} /> */}
                <Card title="Ownership" count={stats.ownership} color="blue"
                    onClick={() => router.push("/dashboard/disposal/ownership-assets")} />

            </div>

            {/* ================= TABLE ================= */}
            <div className="overflow-x-auto rounded-xl">
                <DataTable columns={columns} data={data} />
            </div>

            {/* ================= VIEW MODAL (REUSABLE) ================= */}
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

/* ================= CARD COMPONENT ================= */
function Card({
    title,
    count,
    color,
    onClick,
}: {
    title: string;
    count: number;
    color: "red" | "orange" | "yellow" | "gray" | "blue";
    onClick: () => void;
}) {
    const colors = {
        red: "bg-red-50 border-red-200 text-red-600",
        orange: "bg-orange-50 border-orange-200 text-orange-600",
        yellow: "bg-yellow-50 border-yellow-200 text-yellow-600",
        gray: "bg-muted border-border text-muted-foreground",
        blue: "bg-blue-50 border-blue-200 text-blue-600",
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
