// // frontend/components/reports/assigned-columns.tsx

// "use client";

// import { ColumnDef } from "@tanstack/react-table";
// import { AssignedDevice } from "@/models/AssignedDevice";
// import { Button } from "@/components/ui/button";
// import { UserAvatar } from "@/components/user-avatar";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// import {
//   MoreVertical,
//   Pencil,
//   Trash2,
//   ChevronDown,
//   UserPlus,
// } from "lucide-react";

// import {
//   Avatar,
//   AvatarImage,
//   AvatarFallback,
// } from "@/components/ui/avatar";

// // ================= HELPER =================
// const getInitials = (name?: string) => {
//   if (!name) return "NA";

//   const ignored = ["md.", "md", "mohammad"];

//   const parts = name
//     .toLowerCase()
//     .split(" ")
//     .filter((w) => w && !ignored.includes(w));

//   return parts
//     .slice(0, 2)
//     .map((w) => w[0].toUpperCase())
//     .join("");
// };

// // ================= TYPES =================
// type ColumnProps = {
//   onView?: (device: AssignedDevice) => void;
//   onAssign?: (device: AssignedDevice) => void;
// };

// // ================= COLUMNS =================
// export const assignedColumns = (
//   props: ColumnProps = {}
// ): ColumnDef<AssignedDevice>[] => {
//   const { onView, onAssign } = props;

//   return [
//     {
//       accessorKey: "sl",
//       header: "SL",
//     },
//     {
//       accessorKey: "referenceNumber",
//       header: "Reference No",
//     },
//     {
//       accessorKey: "employeeId",
//       header: "Employee ID",
//     },



//     {
//       accessorKey: "employeeName",
//       header: "Employee",
//       cell: ({ row }) => {
//         const data = row.original;

//         return (
//           <div className="flex items-center gap-2">
//             <UserAvatar
//               name={data.employeeName}
//               src={data.avatarUrl}
//             />
//             <span>{data.employeeName}</span>
//           </div>
//         );
//       },
//     },

//     {
//       accessorKey: "designation",
//       header: "Designation",
//     },
//     {
//       accessorKey: "department",
//       header: "Department",
//     },
//     {
//       accessorKey: "category",
//       header: "Category",
//     },
//     {
//       accessorKey: "model",
//       header: "Model",
//     },

//     // ✅ STATUS BADGE (IMPROVED UI)
//     {
//       accessorKey: "status",
//       header: "Status",
//       cell: ({ row }) => {
//         const status = row.original.status;

//         return (
//           <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
//             {status}
//           </span>
//         );
//       },
//     },

//     {
//       accessorKey: "deviceType",
//       header: "Device Type",
//     },

//     // ================= ACTIONS =================
//     {
//       id: "actions",
//       header: "Actions",
//       cell: ({ row }) => {
//         const device = row.original;

//         return (
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button size="sm" variant="outline">
//                 Actions <ChevronDown className="ml-1 h-4 w-4" />
//               </Button>
//             </DropdownMenuTrigger>

//             <DropdownMenuContent>

//               {/* VIEW */}
//               <DropdownMenuItem onClick={() => onView?.(device)}>
//                 <MoreVertical className="h-4 w-4 mr-2" />
//                 View Details
//               </DropdownMenuItem>

//               {/* ASSIGN */}
//               {device.status === "Available" && (
//                 <DropdownMenuItem
//                   onClick={() => onAssign?.(device)}
//                   className="text-blue-600"
//                 >
//                   <UserPlus className="h-4 w-4 mr-2" />
//                   Assign Device
//                 </DropdownMenuItem>
//               )}

//               {/* EDIT */}
//               <DropdownMenuItem>
//                 <Pencil className="h-4 w-4 mr-2" />
//                 Edit
//               </DropdownMenuItem>

//               <DropdownMenuSeparator />

//               {/* DELETE */}
//               <DropdownMenuItem className="text-red-600">
//                 <Trash2 className="h-4 w-4 mr-2" />
//                 Delete
//               </DropdownMenuItem>

//             </DropdownMenuContent>
//           </DropdownMenu>
//         );
//       },
//     },
//   ];
// };

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
     * ================= DEFAULT VISIBLE COLUMNS =================
     * Order:
     * SL | Reference No | Employee ID | Employee | Designation
     * Category | Model | Status | Actions
     */

    {
      accessorKey: "sl",
      header: "SL",
      enableHiding: false,
      size: 55,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.sl}
        </span>
      ),
    },

    {
      accessorKey: "referenceNumber",
      header: "Reference No",
      enableHiding: false,
      size: 190,
      cell: ({ row }) => (
        <div className="max-w-[180px] break-words text-xs font-medium text-foreground">
          {emptyValue(row.original.referenceNumber)}
        </div>
      ),
    },

    {
      accessorKey: "employeeId",
      header: "Employee ID",
      enableHiding: true,
      size: 110,
      cell: ({ row }) => (
        <span className="text-xs font-medium text-foreground">
          {emptyValue(row.original.employeeId)}
        </span>
      ),
    },

    {
      accessorKey: "employeeName",
      header: "Employee",
      enableHiding: true,
      size: 220,
      cell: ({ row }) => {
        const device = row.original;

        return (
          <div className="flex min-w-[180px] items-center gap-2.5">
            <UserAvatar
              name={device.employeeName}
              src={device.avatarUrl}
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {emptyValue(device.employeeName)}
              </p>
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "designation",
      header: "Designation",
      enableHiding: true,
      size: 170,
      cell: ({ row }) => (
        <div className="max-w-[160px] break-words text-xs text-foreground">
          {emptyValue(row.original.designation)}
        </div>
      ),
    },

    {
      accessorKey: "category",
      header: "Category",
      enableHiding: true,
      size: 145,
      cell: ({ row }) => (
        <div className="max-w-[140px] break-words text-xs text-foreground">
          {emptyValue(row.original.category)}
        </div>
      ),
    },

    {
      accessorKey: "model",
      header: "Model",
      enableHiding: true,
      size: 160,
      cell: ({ row }) => (
        <div className="max-w-[150px] break-words text-xs text-foreground">
          {emptyValue(row.original.model)}
        </div>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      enableHiding: false,
      size: 120,
      cell: ({ row }) => {
        const status = row.original.status;

        return (
          <span
            className={`inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium ${statusClass(
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
      size: 125,
      cell: ({ row }) => {
        const device = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 px-2.5 text-xs"
              >
                Actions
                <ChevronDown className="h-3.5 w-3.5" />
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
     * ================= OPTIONAL COLUMNS =================
     * These should be hidden by default in DataTable.
     * Users can enable them from the Columns dropdown.
     */

    {
      accessorKey: "deviceSl",
      header: "Device Serial Number",
      enableHiding: true,
      size: 190,
      cell: ({ row }) => (
        <div className="max-w-[180px] break-all text-xs font-medium text-foreground">
          {emptyValue(row.original.deviceSl)}
        </div>
      ),
    },

    {
      accessorKey: "mrnNumber",
      header: "MR No",
      enableHiding: true,
      size: 180,
      cell: ({ row }) => (
        <div className="max-w-[170px] break-all text-xs text-foreground">
          {emptyValue(row.original.mrnNumber)}
        </div>
      ),
    },

    {
      accessorKey: "prNumber",
      header: "PR No",
      enableHiding: true,
      size: 180,
      cell: ({ row }) => (
        <div className="max-w-[170px] break-all text-xs text-foreground">
          {emptyValue(row.original.prNumber)}
        </div>
      ),
    },

    {
      accessorKey: "department",
      header: "Department",
      enableHiding: true,
      size: 210,
      cell: ({ row }) => (
        <div className="max-w-[200px] break-words text-xs text-foreground">
          {emptyValue(row.original.department)}
        </div>
      ),
    },

    {
      accessorKey: "brand",
      header: "Brand",
      enableHiding: true,
      size: 140,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {emptyValue(row.original.brand)}
        </span>
      ),
    },

    {
      accessorKey: "deviceType",
      header: "Device Type",
      enableHiding: true,
      size: 130,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {emptyValue(row.original.deviceType)}
        </span>
      ),
    },

    {
      accessorKey: "vendor",
      header: "Vendor",
      enableHiding: true,
      size: 170,
      cell: ({ row }) => (
        <div className="max-w-[160px] break-words text-xs text-foreground">
          {emptyValue(row.original.vendor)}
        </div>
      ),
    },

    {
      accessorKey: "assignedDate",
      header: "Assigned Date",
      enableHiding: true,
      size: 140,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {formatDate(row.original.assignedDate)}
        </span>
      ),
    },

    {
      accessorKey: "returnedDate",
      header: "Returned Date",
      enableHiding: true,
      size: 140,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {formatDate(row.original.returnedDate)}
        </span>
      ),
    },

    {
      accessorKey: "transferredDate",
      header: "Transferred Date",
      enableHiding: true,
      size: 150,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {formatDate(row.original.transferredDate)}
        </span>
      ),
    },

    {
      accessorKey: "purchaseDate",
      header: "Purchase Date",
      enableHiding: true,
      size: 140,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {formatDate(row.original.purchaseDate)}
        </span>
      ),
    },

    {
      accessorKey: "warranty",
      header: "Warranty Date",
      enableHiding: true,
      size: 140,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {formatDate(row.original.warranty)}
        </span>
      ),
    },

    {
      accessorKey: "deviceAge",
      header: "Device Age",
      enableHiding: true,
      size: 120,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {emptyValue(row.original.deviceAge)}
        </span>
      ),
    },

    {
      accessorKey: "userUsageDuration",
      header: "Usage Duration",
      enableHiding: true,
      size: 140,
      cell: ({ row }) => (
        <span className="text-xs text-foreground">
          {emptyValue(row.original.userUsageDuration)}
        </span>
      ),
    },

    {
      accessorKey: "remarks",
      header: "Remarks",
      enableHiding: true,
      size: 220,
      cell: ({ row }) => (
        <div className="max-w-[210px] break-words text-xs text-foreground">
          {emptyValue(row.original.remarks)}
        </div>
      ),
    },
  ];
};