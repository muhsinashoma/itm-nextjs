//componets/reports/service-request-columns

// "use client";

// import { ColumnDef } from "@tanstack/react-table";
// import { ServiceRequest } from "@/models/ServiceRequest";

// export const serviceRequestColumns: ColumnDef<ServiceRequest>[] = [
//     { accessorKey: "sl", header: "SL" },
//     { accessorKey: "referenceNumber", header: "Reference No" },
//     { accessorKey: "employeeId", header: "Employee ID" },
//     { accessorKey: "employeeName", header: "Employee Name" },
//     { accessorKey: "designation", header: "Designation" },
//     { accessorKey: "department", header: "Department" },
//     { accessorKey: "category", header: "Category" },
//     { accessorKey: "deviceSl", header: "Device SL" },
//     { accessorKey: "model", header: "Model" },
//     { accessorKey: "deviceType", header: "Device Type" },
//     { accessorKey: "status", header: "Status" },
//     { accessorKey: "vendor", header: "Vendor" },
//     { accessorKey: "assignedBy", header: "Assigned By" },
//     { accessorKey: "assignedDate", header: "Assigned Date" },
// ];



"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ServiceRequest } from "@/models/ServiceRequest";

/** ✅ Status Color Mapping */
const STATUS_COLORS: Record<string, string> = {
    Expired: "#ef4444",
    Requests: "#f59e0b",
    Vendor: "#3b82f6",
    Closed: "#10b981",
    Recovered: "#8b5cf6",
};

export const serviceRequestColumns: ColumnDef<ServiceRequest>[] = [
    { accessorKey: "sl", header: "SL" },
    { accessorKey: "referenceNumber", header: "Reference No" },
    { accessorKey: "employeeId", header: "Employee ID" },
    { accessorKey: "employeeName", header: "Employee Name" },
    { accessorKey: "designation", header: "Designation" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "deviceSl", header: "Device SL" },
    { accessorKey: "model", header: "Model" },
    { accessorKey: "deviceType", header: "Device Type" },

    /** ✅ Colored Status Badge */
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
            const status = getValue<string>();
            const color = STATUS_COLORS[status] || "#6b7280";

            return (
                <span
                    className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: color }}
                >
                    {status}
                </span>
            );
        },
    },

    { accessorKey: "vendor", header: "Vendor" },
    { accessorKey: "assignedBy", header: "Assigned By" },
    { accessorKey: "assignedDate", header: "Assigned Date" },
];
