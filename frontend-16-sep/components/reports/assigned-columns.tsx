// frontend/components/reports/assigned-columns.tsx


"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AssignedDevice } from "@/models/AssignedDevice";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";

type ColumnProps = {
  onView?: (device: AssignedDevice) => void;
  onAssign?: (device: AssignedDevice) => void;
};

function emptyValue(value?: string | null) {
  return value?.trim() ? value : "—";
}

function formatDate(value?: string | null) {
  if (!value?.trim()) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusClass(status?: string) {
  const normalized = status?.toLowerCase().trim();

  switch (normalized) {
    case "assigned":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "returned":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "transferred":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "available":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "damaged":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "lost":
      return "border-red-200 bg-red-50 text-red-700";

    case "ownership":
    case "ownership transfer":
    case "user ownership":
      return "border-teal-200 bg-teal-50 text-teal-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export const assignedColumns = (
  props: ColumnProps = {}
): ColumnDef<AssignedDevice>[] => {
  const { onView, onAssign } = props;

  return [
    /*
     * DEFAULT VISIBLE COLUMNS
     *
     * SL | Reference No | Employee ID | Employee | Designation | deviceSl
     * Category | Model | Status | Actions
     */

    {
      accessorKey: "sl",
      header: "SL",
      enableHiding: false,
      size: 35,
      cell: ({ row }) => (
        <span className="text-[10px] font-medium text-foreground">
          {row.original.sl}
        </span>
      ),
    },

    {
      accessorKey: "referenceNumber",
      header: "Reference No",
      enableHiding: false,
      size: 80,
      cell: ({ row }) => (
        <div
          className="max-w-[76px] truncate text-[10px] font-semibold text-primary"
          title={emptyValue(row.original.referenceNumber)}
        >
          {emptyValue(row.original.referenceNumber)}
        </div>
      ),
    },

    {
      accessorKey: "employeeId",
      header: "Employee ID",
      enableHiding: true,
      size: 82,
      cell: ({ row }) => (
        <span className="text-[10px] font-medium text-foreground">
          {emptyValue(row.original.employeeId)}
        </span>
      ),
    },

    {
      accessorKey: "employeeName",
      header: "Employee",
      enableHiding: true,
      size: 170,
      cell: ({ row }) => {
        const device = row.original;

        return (
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="scale-90">
              <UserAvatar
                name={device.employeeName}
                src={device.avatarUrl}
              />
            </div>

            <div className="min-w-0">
              <p
                className="max-w-[115px] truncate text-[10px] font-medium text-foreground"
                title={emptyValue(device.employeeName)}
              >
                {emptyValue(device.employeeName)}
              </p>
            </div>
          </div>
        );
      },
    },


    {
      accessorKey: "deviceSl",
      header: "Device Serial No",
      enableHiding: true,
      size: 145,
      cell: ({ row }) => (
        <div
          className="max-w-[135px] truncate text-[10px] font-medium text-foreground"
          title={emptyValue(row.original.deviceSl)}
        >
          {emptyValue(row.original.deviceSl)}
        </div>
      ),
    },

    {
      accessorKey: "category",
      header: "Category",
      enableHiding: true,
      size: 90,
      cell: ({ row }) => (
        <div
          className="max-w-[85px] truncate text-[10px] text-foreground"
          title={emptyValue(row.original.category)}
        >
          {emptyValue(row.original.category)}
        </div>
      ),
    },

    {
      accessorKey: "model",
      header: "Model",
      enableHiding: true,
      size: 82,
      cell: ({ row }) => (
        <div
          className="max-w-[78px] truncate text-[10px] text-foreground"
          title={emptyValue(row.original.model)}
        >
          {emptyValue(row.original.model)}
        </div>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      enableHiding: false,
      size: 78,
      cell: ({ row }) => {
        const status = row.original.status;

        return (
          <span
            className={`inline-flex whitespace-nowrap rounded border px-1.5 py-0.5 text-[9px] font-medium ${statusClass(
              status
            )}`}
          >
            {emptyValue(status)}
          </span>
        );
      },
    },

    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      size: 86,
      cell: ({ row }) => {
        const device = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 px-1.5 text-[9px]"
              >
                Actions
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-44"
            >
              <DropdownMenuItem
                onClick={() => onView?.(device)}
                className="gap-2"
              >
                <Eye className="h-4 w-4 text-primary" />
                View Details
              </DropdownMenuItem>

              {device.status === "Available" && (
                <DropdownMenuItem
                  onClick={() => onAssign?.(device)}
                  className="gap-2 text-blue-600"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign Device
                </DropdownMenuItem>
              )}

              <DropdownMenuItem className="gap-2">
                <Pencil className="h-4 w-4 text-amber-600" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },

    /*
     * OPTIONAL COLUMNS
     * Hidden initially in DataTable.
     */

    // {
    //   accessorKey: "deviceSl",
    //   header: "Device Serial Number",
    //   enableHiding: true,
    //   size: 160,
    //   cell: ({ row }) => (
    //     <div
    //       className="max-w-[150px] truncate text-[10px] font-medium text-foreground"
    //       title={emptyValue(row.original.deviceSl)}
    //     >
    //       {emptyValue(row.original.deviceSl)}
    //     </div>
    //   ),
    // },

    {
      accessorKey: "mrnNumber",
      header: "MR No",
      enableHiding: true,
      size: 150,
      cell: ({ row }) => (
        <div
          className="max-w-[140px] truncate text-[10px] text-foreground"
          title={emptyValue(row.original.mrnNumber)}
        >
          {emptyValue(row.original.mrnNumber)}
        </div>
      ),
    },

    {
      accessorKey: "prNumber",
      header: "PR No",
      enableHiding: true,
      size: 150,
      cell: ({ row }) => (
        <div
          className="max-w-[140px] truncate text-[10px] text-foreground"
          title={emptyValue(row.original.prNumber)}
        >
          {emptyValue(row.original.prNumber)}
        </div>
      ),
    },

    {
      accessorKey: "department",
      header: "Department",
      enableHiding: true,
      size: 180,
      cell: ({ row }) => (
        <div
          className="max-w-[170px] truncate text-[10px] text-foreground"
          title={emptyValue(row.original.department)}
        >
          {emptyValue(row.original.department)}
        </div>
      ),
    },

    {
      accessorKey: "brand",
      header: "Brand",
      enableHiding: true,
      size: 110,
      cell: ({ row }) => (
        <span className="text-[10px] text-foreground">
          {emptyValue(row.original.brand)}
        </span>
      ),
    },

    {
      accessorKey: "deviceType",
      header: "Device Type",
      enableHiding: true,
      size: 110,
      cell: ({ row }) => (
        <span className="text-[10px] text-foreground">
          {emptyValue(row.original.deviceType)}
        </span>
      ),
    },

    {
      accessorKey: "vendor",
      header: "Vendor",
      enableHiding: true,
      size: 150,
      cell: ({ row }) => (
        <div
          className="max-w-[140px] truncate text-[10px] text-foreground"
          title={emptyValue(row.original.vendor)}
        >
          {emptyValue(row.original.vendor)}
        </div>
      ),
    },

    {
      accessorKey: "assignedDate",
      header: "Assigned Date",
      enableHiding: true,
      size: 120,
      cell: ({ row }) => (
        <span className="text-[10px] text-foreground">
          {formatDate(row.original.assignedDate)}
        </span>
      ),
    },

    {
      accessorKey: "returnedDate",
      header: "Returned Date",
      enableHiding: true,
      size: 120,
      cell: ({ row }) => (
        <span className="text-[10px] text-foreground">
          {formatDate(row.original.returnedDate)}
        </span>
      ),
    },

    {
      accessorKey: "transferredDate",
      header: "Transferred Date",
      enableHiding: true,
      size: 130,
      cell: ({ row }) => (
        <span className="text-[10px] text-foreground">
          {formatDate(row.original.transferredDate)}
        </span>
      ),
    },

    {
      accessorKey: "purchaseDate",
      header: "Purchase Date",
      enableHiding: true,
      size: 120,
      cell: ({ row }) => (
        <span className="text-[10px] text-foreground">
          {formatDate(row.original.purchaseDate)}
        </span>
      ),
    },

    {
      accessorKey: "warranty",
      header: "Warranty Date",
      enableHiding: true,
      size: 120,
      cell: ({ row }) => (
        <span className="text-[10px] text-foreground">
          {formatDate(row.original.warranty)}
        </span>
      ),
    },

    {
      accessorKey: "deviceAge",
      header: "Device Age",
      enableHiding: true,
      size: 100,
      cell: ({ row }) => (
        <span className="text-[10px] text-foreground">
          {emptyValue(row.original.deviceAge)}
        </span>
      ),
    },

    {
      accessorKey: "userUsageDuration",
      header: "Usage Duration",
      enableHiding: true,
      size: 120,
      cell: ({ row }) => (
        <span className="text-[10px] text-foreground">
          {emptyValue(row.original.userUsageDuration)}
        </span>
      ),
    },

    {
      accessorKey: "remarks",
      header: "Remarks",
      enableHiding: true,
      size: 180,
      cell: ({ row }) => (
        <div
          className="max-w-[170px] truncate text-[10px] text-foreground"
          title={emptyValue(row.original.remarks)}
        >
          {emptyValue(row.original.remarks)}
        </div>
      ),
    },
    {
      accessorKey: "designation",
      header: "Designation",
      enableHiding: true,
      size: 135,
      cell: ({ row }) => (
        <div
          className="max-w-[125px] truncate text-[10px] text-foreground"
          title={emptyValue(row.original.designation)}
        >
          {emptyValue(row.original.designation)}
        </div>
      ),
    },
  ];
};