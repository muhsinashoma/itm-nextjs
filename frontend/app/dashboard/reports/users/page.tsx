
//app /dashboard/reports/users/page.tsx

"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/data-table";
import { userColumns } from "@/components/reports/users-columns";
import { UserReport } from "@/models/UserReport";

export default function UsersPage() {
    const [data, setData] = useState<UserReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        async function load() {
            try {
                setLoading(true);
                const res = await fetch("/api/reports/users");
                const users: UserReport[] = await res.json();

                if (ignore) return;
                setData(users); // ✅ No filtering
            } catch (error) {
                console.error("Failed to load users", error);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        load();
        return () => {
            ignore = true;
        };
    }, []);

    if (loading) {
        return (
        <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-lg" />
            ))}
        </div>
    );
    }

    return (
        <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Acive Users Report</h1>
            </div>

            <div className="overflow-x-auto rounded-xl"><DataTable columns={userColumns} data={data} />
        </div>
    );
}
