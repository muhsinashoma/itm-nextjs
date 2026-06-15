"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DamagedAssetsPage() {
    const [search, setSearch] = useState("");

    const data = [
        {
            id: 1,
            reference: "14451",
            asset: "Dell Laptop",
            serial: "SN12345",
            date: "2026-02-10",
            remark: "Screen broken",
            status: "Damaged",
        },

        {
            id: 2,
            reference: "14452",
            asset: "HP Laptop",
            serial: "SN12345",
            date: "2026-02-10",
            remark: "Screen broken",
            status: "Damaged",
        },
        {
            id: 3,
            reference: "14453",
            asset: "Lenevo Laptop",
            serial: "SN12345",
            date: "2026-02-10",
            remark: "Screen broken",
            status: "Damaged",
        },
        {
            id: 4,
            reference: "14454",
            asset: "Desktop",
            serial: "SN12345",
            date: "2026-02-10",
            remark: "Screen broken",
            status: "Damaged",
        },
        {
            id: 5,
            reference: "14455",
            asset: "Desktop",
            serial: "SN12345",
            date: "2026-02-10",
            remark: "Screen broken",
            status: "Damaged",
        },
    ];

    const filtered = data.filter((item) =>
        item.reference.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">

            <div className="flex justify-between items-end">
                <h1 className="text-2xl font-medium tracking-tight text-blue-600 border-b-2 border-blue-600 pb-1">
                    Damaged Assets
                </h1>

                <div className="flex gap-2">
                    <Button variant="outline">Export Excel</Button>
                    <Button variant="outline">Export PDF</Button>
                </div>
            </div>

            <div className="bg-card border rounded-xl shadow-sm">

                <div className="flex justify-between items-center p-4 border-b">
                    <span className="text-sm text-muted-foreground">
                        Showing {filtered.length} of {data.length} entries
                    </span>

                    <div className="w-72">
                        <Input
                            placeholder="Search by Reference..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b">
                            <tr className="text-xs uppercase text-muted-foreground">
                                <th className="p-4 text-left">SL</th>
                                <th className="p-4 text-left">Reference</th>
                                <th className="p-4 text-left">Asset</th>
                                <th className="p-4 text-left">Serial</th>
                                <th className="p-4 text-left">Assigned Date</th>
                                <th className="p-4 text-left">Remark</th>
                                <th className="p-4 text-left">Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filtered.map((item, index) => (
                                <tr key={item.id} className="border-b hover:bg-muted">
                                    <td className="p-4">{index + 1}</td>
                                    <td className="p-4 font-semibold text-blue-600">
                                        {item.reference}
                                    </td>
                                    <td className="p-4">{item.asset}</td>
                                    <td className="p-4">{item.serial}</td>
                                    <td className="p-4">{item.date}</td>
                                    <td className="p-4">{item.remark}</td>
                                    <td className="p-4 text-red-600 font-medium">
                                        {item.status}
                                    </td>
                                </tr>
                            ))}

                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center p-6 text-muted-foreground">
                                        No data found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
