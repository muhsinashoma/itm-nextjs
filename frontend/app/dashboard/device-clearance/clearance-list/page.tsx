
// app/dashboard/device-clearance/clearance-list/page.tsx

"use client";

import { useState } from "react";

/* ================= TYPE ================= */
type DeviceItem = {
    id: number;
    user_name: string;
    device_name: string;

    device_returned: boolean;
    vpn_removed: boolean;
    ip_phone_disabled: boolean;
    printer_access_removed: boolean;
    panda_removed: boolean;

    ec_given: boolean;
    approval: "Select" | "Pending" | "Approved" | "Rejected";
};

/* ================= STATIC DATA ================= */
const initialData: DeviceItem[] = [
    {
        id: 1,
        user_name: "John Doe",
        device_name: "Dell Latitude 5420",

        device_returned: true,
        vpn_removed: true,
        ip_phone_disabled: true,
        printer_access_removed: false,
        panda_removed: false,

        ec_given: false,
        approval: "Pending",
    },
    {
        id: 2,
        user_name: "Sarah Khan",
        device_name: "HP EliteBook",

        device_returned: true,
        vpn_removed: true,
        ip_phone_disabled: true,
        printer_access_removed: true,
        panda_removed: true,

        ec_given: true,
        approval: "Approved",
    },
    {
        id: 3,
        user_name: "Rahim Uddin",
        device_name: "MacBook Pro",

        device_returned: false,
        vpn_removed: false,
        ip_phone_disabled: false,
        printer_access_removed: false,
        panda_removed: false,

        ec_given: false,
        approval: "Pending",
    },
    {
        id: 4,
        user_name: "Nazim Uddin",
        device_name: "MacBook Pro",

        device_returned: false,
        vpn_removed: false,
        ip_phone_disabled: false,
        printer_access_removed: false,
        panda_removed: false,

        ec_given: false,
        approval: "Pending",
    },
    {
        id: 5,
        user_name: "Tauhid Islam",
        device_name: "MacBook Pro",

        device_returned: false,
        vpn_removed: false,
        ip_phone_disabled: false,
        printer_access_removed: false,
        panda_removed: false,

        ec_given: false,
        approval: "Pending",
    },
];

/* ================= PAGE ================= */
export default function DeviceClearancePage() {
    const [data, setData] = useState<DeviceItem[]>(initialData);
    const [selected, setSelected] = useState<DeviceItem | null>(null);
    const [activeFilter, setActiveFilter] = useState("All");

    const total = data.length;

    /* ================= STATUS ================= */
    function getStatus(item: DeviceItem) {
        const steps = [
            item.device_returned,
            item.vpn_removed,
            item.ip_phone_disabled,
            item.printer_access_removed,
            item.panda_removed,
        ];

        const done = steps.filter(Boolean).length;

        if (item.ec_given) return "Completed";
        if (done === 5) return "Ready for EC";
        if (done > 0) return "In Progress";
        return "Not Started";
    }

    /* ================= FILTER FIX (STATUS + APPROVAL) ================= */
    const filteredData = data.filter((item) => {
        const status = getStatus(item);

        if (activeFilter === "All") return true;

        // approval filter
        if (
            activeFilter === "Approved" ||
            activeFilter === "Pending" ||
            activeFilter === "Rejected"
        ) {
            return item.approval === activeFilter;
        }

        // status filter
        return status === activeFilter;
    });

    /* ================= STEPS ================= */
    const stepsOf = (d: DeviceItem) => [
        d.device_returned,
        d.vpn_removed,
        d.ip_phone_disabled,
        d.printer_access_removed,
        d.panda_removed,
    ];

    /* ================= COUNTS ================= */
    const statusItems = (() => {
        const completed = data.filter(d => d.ec_given).length;

        const inProgress = data.filter(d =>
            !d.ec_given && stepsOf(d).some(Boolean)
        ).length;

        const readyForEC = data.filter(d =>
            !d.ec_given && stepsOf(d).every(Boolean)
        ).length;

        const notStarted = data.filter(d =>
            stepsOf(d).every(v => !v)
        ).length;

        // ✅ APPROVED COUNT ADDED
        const approved = data.filter(d => d.approval === "Approved").length;

        return [
            { label: "All", count: total },
            { label: "Completed", count: completed },
            { label: "In Progress", count: inProgress },
            { label: "Ready for EC", count: readyForEC },
            { label: "Not Started", count: notStarted },

            // approval filter
            { label: "Approved", count: approved },
        ];
    })();

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">

            {/* ================= HEADER ================= */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    Device Clearance Dashboard
                </h1>
                <p className="text-sm text-slate-500">
                    IT Exit Clearance Management System
                </p>
            </div>

            {/* ================= STATUS OVERVIEW ================= */}
            <div className="bg-card rounded-xl shadow border p-4 space-y-4">

                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-slate-700">
                        STATUS OVERVIEW
                    </h2>
                    <span className="text-xs text-slate-500">Click to filter</span>
                </div>

                <div
                    onClick={() => setActiveFilter("All")}
                    className={`flex justify-between px-4 py-2 rounded-lg cursor-pointer ${activeFilter === "All"
                        ? "bg-slate-200"
                        : "bg-slate-100 hover:bg-slate-200"
                        }`}
                >
                    <span>All</span>
                    <span>{total}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {statusItems.filter(s => s.label !== "All").map((item, i) => (
                        <div
                            key={i}
                            onClick={() => setActiveFilter(item.label)}
                            className={`flex justify-between px-3 py-2 border rounded-lg cursor-pointer ${activeFilter === item.label
                                ? "bg-blue-100 border-blue-300"
                                : "bg-slate-50"
                                }`}
                        >
                            <span className="text-xs">{item.label}</span>
                            <span className="text-xs font-bold">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ================= TABLE ================= */}
            <div className="bg-card rounded-xl shadow border overflow-hidden">

                <table className="w-full text-sm">

                    <thead className="bg-slate-100 text-slate-600">
                        <tr>
                            <th className="p-4 text-left">Employee</th>
                            <th className="p-4 text-left">Device</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-left">EC</th>
                            <th className="p-4 text-left">Approval</th>
                            <th className="p-4 text-left">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredData.map((item) => (
                            <tr key={item.id} className="border-t hover:bg-slate-50">

                                <td className="p-4 font-medium">{item.user_name}</td>
                                <td className="p-4 text-slate-600">{item.device_name}</td>

                                <td className="p-4">
                                    <StatusBadge status={getStatus(item)} />
                                </td>

                                <td className="p-4">
                                    {item.ec_given ? "✅" : "⏳"}
                                </td>

                                <td className="p-4">
                                    {item.approval === "Approved" ? (
                                        // ✅ After Approved (NO dropdown)
                                        <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                                            ✔ Approved
                                        </span>
                                    ) : (
                                        // ✅ Before Approved (show dropdown)
                                        <select
                                            value={item.approval}
                                            onChange={(e) => {
                                                const value = e.target.value as DeviceItem["approval"];

                                                setData((prev) =>
                                                    prev.map((d) =>
                                                        d.id === item.id
                                                            ? {
                                                                ...d,
                                                                approval: value,
                                                                ec_given: value === "Approved",
                                                            }
                                                            : d
                                                    )
                                                );
                                            }}
                                            className="border rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="Select">Select</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    )}
                                </td>

                                <td className="p-4">
                                    <button
                                        onClick={() => setSelected(item)}
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        View
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>

            {/* ================= MODAL ================= */}
            {selected && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-card w-full max-w-2xl rounded-xl shadow-xl p-6 space-y-5">

                        <div className="flex justify-between border-b pb-3">
                            <h2 className="text-lg font-semibold">
                                Exit Clearance Details
                            </h2>

                            <button
                                onClick={() => setSelected(null)}
                                className="text-muted-foreground hover:text-red-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 text-sm">
                            <p><b>Employee:</b> {selected.user_name}</p>
                            <p><b>Device:</b> {selected.device_name}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded space-y-2">

                            <Check label="Device Returned" value={selected.device_returned} />
                            <Check label="VPN Removed" value={selected.vpn_removed} />
                            <Check label="IP Phone Disabled" value={selected.ip_phone_disabled} />
                            <Check label="Printer Access Removed" value={selected.printer_access_removed} />
                            <Check label="Panda Security Removed" value={selected.panda_removed} />

                        </div>

                        <div className="flex justify-between items-center pt-3 border-t">

                            <span className={`px-3 py-1 text-sm rounded-full ${selected.ec_given
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                                }`}>
                                {selected.ec_given ? "EC Approved" : "Pending EC"}
                            </span>

                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                                Print EC
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

/* ================= STATUS BADGE ================= */
function StatusBadge({ status }: { status: string }) {
    const map: any = {
        Completed: "bg-green-100 text-green-700",
        "Ready for EC": "bg-blue-100 text-blue-700",
        "In Progress": "bg-amber-100 text-amber-700",
        "Not Started": "bg-slate-100 text-slate-600",
    };

    return (
        <span className={`px-2 py-1 text-xs rounded-full ${map[status]}`}>
            {status}
        </span>
    );
}

/* ================= CHECK ================= */
function Check({ label, value }: { label: string; value: boolean }) {
    return (
        <div className="flex justify-between text-sm">
            <span>{label}</span>
            <span className={value ? "text-green-600" : "text-red-500"}>
                {value ? "✔ Done" : "✖ Pending"}
            </span>
        </div>
    );
}

