// components/AssignedAssetsModal.tsx

"use client";

import { useEffect, useState } from "react";
import { getAssignedDevicesByEmployee } from "@/services/assignedDeviceService";

export default function AssignedAssetsModal({ employeeId }: { employeeId: string }) {

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const res = await getAssignedDevicesByEmployee(employeeId);
            setData(res);
            setLoading(false);
        };

        load();
    }, [employeeId]);

    if (loading) {
        return <div className="text-center py-6 text-muted-foreground">Loading...</div>;
    }

    if (data.length === 0) {
        return <div className="text-center py-6 text-muted-foreground">No assets found</div>;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Assigned":
                return "bg-green-100 text-green-700";
            case "Returned":
                return "bg-yellow-100 text-yellow-700";
            case "Transferred":
                return "bg-blue-100 text-blue-700";
            case "Damaged":
                return "bg-red-100 text-red-700";
            case "Stored":
                return "bg-muted text-gray-700";
            default:
                return "bg-muted text-muted-foreground";
        }
    };



    return (
        <div className="max-h-[70vh] overflow-y-auto space-y-5 pr-1">
            {data.map((item, index) => (
                <div
                    key={`${item.sl}-${index}`} // ✅ unique key
                    className="bg-white border border-border rounded-xl shadow-sm p-5 hover:shadow-md transition"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-800">
                                {item.category} • {item.model}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Ref: {item.referenceNumber}
                            </p>
                        </div>

                        <span
                            className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(
                                item.status
                            )}`}
                        >
                            {item.status}
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border my-3" />

                    {/* Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs">Employee</p>
                            <p className="text-gray-700 font-medium">{item.employeeName}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Designation</p>
                            <p className="text-gray-700">{item.designation}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Department</p>
                            <p className="text-gray-700">{item.department}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Device SL</p>
                            <p className="text-gray-700">{item.deviceSl}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Device Type</p>
                            <p className="text-gray-700">{item.deviceType}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Vendor</p>
                            <p className="text-gray-700">{item.vendor}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Warranty</p>
                            <p className="text-gray-700">{item.warranty}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Device Age</p>
                            <p className="text-gray-700">{item.deviceAge}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Usage Duration</p>
                            <p className="text-gray-700">{item.userUsageDuration}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Purchase Date</p>
                            <p className="text-gray-700">{item.purchaseDate}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Assigned Date</p>
                            <p className="text-gray-700">{item.assignedDate}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground text-xs">Assigned By</p>
                            <p className="text-gray-700">{item.assignedBy}</p>
                        </div>
                    </div>

                    {/* Remarks */}
                    {item.remarks && (
                        <div className="border-t border-border mt-4 pt-3">
                            <p className="text-muted-foreground text-xs mb-1">Remarks</p>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                {item.remarks}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}