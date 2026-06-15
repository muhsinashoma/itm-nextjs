// components/reports/assigned-columns.tsx

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
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
  UserPlus,
} from "lucide-react";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

// ================= HELPER =================
const getInitials = (name?: string) => {
  if (!name) return "NA";

  const ignored = ["md.", "md", "mohammad"];

  const parts = name
    .toLowerCase()
    .split(" ")
    .filter((w) => w && !ignored.includes(w));

  return parts
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
};

// ================= TYPES =================
type ColumnProps = {
  onView?: (device: AssignedDevice) => void;
  onAssign?: (device: AssignedDevice) => void;
};

// ================= COLUMNS =================
export const assignedColumns = (
  props: ColumnProps = {}
): ColumnDef<AssignedDevice>[] => {
  const { onView, onAssign } = props;

  return [
    {
      accessorKey: "sl",
      header: "SL",
    },
    {
      accessorKey: "referenceNumber",
      header: "Reference No",
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID",
    },



    {
      accessorKey: "employeeName",
      header: "Employee",
      cell: ({ row }) => {
        const data = row.original;

        return (
          <div className="flex items-center gap-2">
            <UserAvatar
              name={data.employeeName}
              src={data.avatarUrl}
            />
            <span>{data.employeeName}</span>
          </div>
        );
      },
    },

    {
      accessorKey: "designation",
      header: "Designation",
    },
    {
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "model",
      header: "Model",
    },

    // ✅ STATUS BADGE (IMPROVED UI)
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;

        return (
          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
            {status}
          </span>
        );
      },
    },

    {
      accessorKey: "deviceType",
      header: "Device Type",
    },

    // ================= ACTIONS =================
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const device = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                Actions <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>

              {/* VIEW */}
              <DropdownMenuItem onClick={() => onView?.(device)}>
                <MoreVertical className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>

              {/* ASSIGN */}
              {device.status === "Available" && (
                <DropdownMenuItem
                  onClick={() => onAssign?.(device)}
                  className="text-blue-600"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Device
                </DropdownMenuItem>
              )}

              {/* EDIT */}
              <DropdownMenuItem>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* DELETE */}
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};

