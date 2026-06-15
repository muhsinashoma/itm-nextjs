// //app/dashboard/master-data/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import {
    Laptop,
    Layers,
    MessageSquare,
    Ticket,
    Truck,
    Users,
} from "lucide-react";

/* ================= ICON MAP ================= */
const iconMap: Record<string, ReactNode> = {
    "Device Category": <Laptop className="w-5 h-5 text-blue-600" />,
    "Asset Status Control": <Layers className="w-5 h-5 text-green-600" />,
    "Query Type": <MessageSquare className="w-5 h-5 text-purple-600" />,
    "TT Management": <Ticket className="w-5 h-5 text-orange-600" />,
    "Vendor Type": <Truck className="w-5 h-5 text-indigo-600" />,
    "Ownership Management": <Users className="w-5 h-5 text-muted-foreground" />,
};

/* ================= CARD ================= */
const Card = ({ title, children, subtitle }) => (
    <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition">

        {/* HEADER */}
        <div className="p-5 border-b bg-muted rounded-t-2xl flex gap-3 items-start">

            {/* ICON */}
            <div className="mt-0.5">
                {iconMap[title] || (
                    <Layers className="w-5 h-5 text-muted-foreground" />
                )}
            </div>

            {/* TITLE */}
            <div>
                <h2 className="text-base font-semibold text-gray-800">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {subtitle}
                    </p>
                )}
            </div>

        </div>

        {/* BODY */}
        <div className="p-5">{children}</div>

    </div>
);

/* ================= CHIP GROUP ================= */
const ChipGroup = ({ items, color = "gray" }) => {
    const colorMap = {
        gray: "bg-muted text-gray-700 border-border",
        green: "bg-green-50 text-green-700 border-green-200",
        red: "bg-red-50 text-red-700 border-red-200",
        blue: "bg-blue-50 text-blue-700 border-blue-200",
    };

    const visibleItems = items.slice(0, 5);
    const extraCount = items.length - 5;

    return (
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
            {visibleItems.map((item, i) => (
                <span
                    key={i}
                    className={`text-xs px-3 py-1 rounded-full border ${colorMap[color]}`}
                >
                    {item}
                </span>
            ))}

            {extraCount > 0 && (
                <span className="text-xs px-3 py-1 rounded-full border bg-muted text-muted-foreground">
                    +{extraCount} more
                </span>
            )}
        </div>
    );
};

/* ================= PAGE ================= */
export default function MasterDataPage() {
    return (
        <div className="min-h-screen bg-muted p-6">

            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Master Data Management
                    </h1>
                </div>

                {/* GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* DEVICE CATEGORY */}
                    <Card title="Device Category" subtitle="Hardware inventory types">
                        <ChipGroup
                            items={[
                                "Laptop",
                                "Desktop",
                                "Keyboard",
                                "Mouse",
                                "Router",
                                "Switch",
                                "Printer",
                                "Scanner",
                            ]}
                        />
                    </Card>

                    {/* ASSET STATUS */}
                    <Card title="Asset Status Control" subtitle="Operational lifecycle tracking">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <div>
                                <p className="text-sm font-semibold text-green-700 mb-2">
                                    Operational
                                </p>
                                <ChipGroup
                                    color="green"
                                    items={[
                                        "Active",
                                        "In Use",
                                        "Assigned",
                                        "Returned",
                                        "Transferred",
                                        "Available",
                                    ]}
                                />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-red-700 mb-2">
                                    Non-Operational
                                </p>
                                <ChipGroup
                                    color="red"
                                    items={[
                                        "Lost",
                                        "Damaged",
                                        "Stolen",
                                        "Obsolete",
                                    ]}
                                />
                            </div>

                        </div>
                    </Card>

                    {/* QUERY TYPE */}
                    <Card title="Query Type" subtitle="IT support categories">
                        <ChipGroup
                            items={[
                                "Printer Access",
                                "Administrator Account",
                                "Bad Sector",
                                "BIOS Issue",
                                "Blue Screen",
                                "Cable Issue",
                                "Power Cable",
                            ]}
                        />
                    </Card>

                    {/* TT MANAGEMENT */}
                    <Card title="TT Management" subtitle="Ticket tracking system">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <div>
                                <p className="text-sm font-semibold text-green-700 mb-2">
                                    TT Status
                                </p>
                                <ChipGroup color="green" items={["Open", "Closed"]} />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-blue-700 mb-2">
                                    Requisition
                                </p>
                                <ChipGroup
                                    color="blue"
                                    items={[
                                        "Raised",
                                        "Petty Cash Approved",
                                        "MR Approved",
                                        "Rejected",
                                    ]}
                                />
                            </div>

                        </div>
                    </Card>

                    {/* VENDOR TYPE */}
                    <Card title="Vendor Type" subtitle="External service classification">
                        <ChipGroup
                            items={[
                                "Supplier",
                                "Service Provider",
                                "Manufacturer",
                                "Distributor",
                            ]}
                        />
                    </Card>

                    {/* OWNERSHIP */}
                    <Card title="Ownership Management" subtitle="Asset responsibility">
                        <ChipGroup items={["User", "Vendor"]} />
                    </Card>

                </div>

                {/* FOOTER */}
                <div className="mt-8 flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                        Manage Master Data
                    </Button>
                </div>

            </div>
        </div>
    );
}