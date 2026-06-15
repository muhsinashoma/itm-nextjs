//componets/reports/warranty-collumns

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { WarrantyDevice } from "@/models/WarrantyDevice";

export const warrantyColumns: ColumnDef<WarrantyDevice>[] = [
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
    { accessorKey: "status", header: "Status" },
    { accessorKey: "vendor", header: "Vendor" },
    { accessorKey: "assignedBy", header: "Assigned By" },
    { accessorKey: "assignedDate", header: "Assigned Date" },
];
