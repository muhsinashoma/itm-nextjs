// components/ui/TTGlobalModal.tsx
"use client"

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
    Phone,
    Building2,
    User2,
    ClipboardList,
    Clock3,
    BriefcaseBusiness,
    X,
} from "lucide-react"

import { useTTModal } from "./tt-modal-store"

export function TTGlobalModal() {
    const { open, data, closeModal } = useTTModal()

    const statusColor = {
        Open: "bg-blue-100 text-blue-700 border-blue-200",
        Closed: "bg-green-100 text-green-700 border-green-200",
        "Not Started": "bg-red-100 text-red-700 border-red-200",
    }

    return (
        <Dialog open={open} onOpenChange={closeModal}>
            <DialogContent
                className="
                    w-full
                    max-w-[620px]
                    rounded-2xl
                    border
                    p-0
                    overflow-hidden
                    shadow-2xl
                "
            >
                <DialogTitle className="sr-only">
                    TT Details
                </DialogTitle>

                {/* HEADER */}
                <div className="border-b px-5 py-4 bg-muted/30">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-primary">
                                    TT #{data?.tt_no}
                                </h2>

                                <Badge
                                    className={`border text-xs font-medium ${statusColor[data?.status || "Open"]
                                        }`}
                                >
                                    {data?.status}
                                </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Ticket Information & Employee Details
                            </p>
                        </div>

                        <DialogClose asChild>
                            <button
                                className="
                                    h-8 w-8
                                    rounded-full
                                    flex items-center justify-center
                                    hover:bg-muted
                                    transition
                                "
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </DialogClose>
                    </div>
                </div>

                {/* BODY */}
                <div className="max-h-[70vh] overflow-y-auto p-5">

                    {/* TOP INFO */}
                    <div className="grid grid-cols-2 gap-4">

                        {/* Employee */}
                        <div className="rounded-xl border p-4 space-y-2 bg-background">
                            <div className="flex items-center gap-2 text-primary">
                                <User2 className="w-4 h-4" />
                                <h4 className="text-sm font-semibold">
                                    Employee
                                </h4>
                            </div>

                            <div className="space-y-1 text-xs">
                                <p>
                                    <span className="text-muted-foreground">
                                        Name:
                                    </span>{" "}
                                    <span className="font-medium">
                                        {data?.employee_name || "-"}
                                    </span>
                                </p>

                                <p>
                                    <span className="text-muted-foreground">
                                        ID:
                                    </span>{" "}
                                    {data?.employee_id || "-"}
                                </p>

                                <p className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {data?.mobile_no || "-"}
                                </p>
                            </div>
                        </div>

                        {/* Department */}
                        <div className="rounded-xl border p-4 space-y-2 bg-background">
                            <div className="flex items-center gap-2 text-primary">
                                <Building2 className="w-4 h-4" />
                                <h4 className="text-sm font-semibold">
                                    Department
                                </h4>
                            </div>

                            <div className="space-y-1 text-xs">
                                <p>
                                    <span className="text-muted-foreground">
                                        Department:
                                    </span>{" "}
                                    {data?.dept_name || "-"}
                                </p>

                                <p>
                                    <span className="text-muted-foreground">
                                        Function:
                                    </span>{" "}
                                    {data?.func_name || "-"}
                                </p>

                                <p>
                                    <span className="text-muted-foreground">
                                        Company:
                                    </span>{" "}
                                    {data?.company_name || "-"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* TICKET DETAILS */}
                    <div className="mt-4 rounded-xl border p-4 bg-background">
                        <div className="flex items-center gap-2 text-primary mb-3">
                            <ClipboardList className="w-4 h-4" />

                            <h4 className="text-sm font-semibold">
                                Ticket Details
                            </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 text-xs">

                            <div>
                                <p className="text-muted-foreground">
                                    Requisition Type
                                </p>
                                <p className="font-medium">
                                    {data?.requistionType || "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">
                                    Query Type
                                </p>
                                <p className="font-medium">
                                    {data?.query_type || "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">
                                    Assigned To
                                </p>
                                <p className="font-medium">
                                    {data?.assigned_name || "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">
                                    Assigned ID
                                </p>
                                <p className="font-medium">
                                    {data?.assigned_id || "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">
                                    TT Age
                                </p>
                                <p className="font-medium flex items-center gap-1">
                                    <Clock3 className="w-3 h-3" />
                                    {data?.tt_age || "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">
                                    Delivery Status
                                </p>
                                <p className="font-medium">
                                    {data?.delivered_status || "-"}
                                </p>
                            </div>

                            <div className="col-span-2">
                                <p className="text-muted-foreground">
                                    Created At
                                </p>
                                <p className="font-medium">
                                    {data?.created_at || "-"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ASSIGNMENT */}
                    <div className="mt-4 rounded-xl border p-4 bg-background">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <BriefcaseBusiness className="w-4 h-4" />

                            <h4 className="text-sm font-semibold">
                                Assignment Information
                            </h4>
                        </div>

                        <div className="text-xs space-y-1">
                            <p>
                                <span className="text-muted-foreground">
                                    Responsible Person:
                                </span>{" "}
                                <span className="font-medium">
                                    {data?.assigned_name || "Not Assigned"}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="border-t px-5 py-4 flex items-center justify-end gap-2 bg-muted/20">
                    <DialogClose asChild>
                        <Button variant="outline" size="sm">
                            Close
                        </Button>
                    </DialogClose>

                    <Button size="sm">
                        Print TT
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

