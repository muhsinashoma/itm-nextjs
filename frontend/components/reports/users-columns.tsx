//components/repors/users-columns

import { ColumnDef } from "@tanstack/react-table";
import { UserReport } from "@/models/UserReport";

export const userColumns: ColumnDef<UserReport>[] = [
    { accessorKey: "slNo", header: "SL No" },
    { accessorKey: "employeeName", header: "Employee Name" },
    { accessorKey: "employeeId", header: "Employee ID" },
    { accessorKey: "designation", header: "Designation" },
    { accessorKey: "function", header: "Function" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "postingArea", header: "Posting Area" },
    { accessorKey: "postingDistrict", header: "Posting District" },
    { accessorKey: "personalMobile", header: "Personal Mobile" },
    { accessorKey: "officeMobile", header: "Office Mobile" },
    { accessorKey: "email", header: "Email" },
];

