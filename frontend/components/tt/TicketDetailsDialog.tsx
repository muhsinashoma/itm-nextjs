//itm/components/tt/TicketDetailsDialog.tsx
"use client"

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export default function TicketDetailsDialog({
    open,
    onOpenChange,
    section,
}: any) {
    if (!section) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl w-full bg-card text-foreground border border-border rounded-xl shadow-xl p-6">

                {/* Close Button (Colorful Cross) */}
                <DialogClose asChild>
                    <button className="absolute right-4 top-4 p-2 rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white hover:scale-110 transition">
                        <X size={18} />
                    </button>
                </DialogClose>

                {/* Title */}
                <DialogTitle className="text-xl font-semibold text-primary">
                    Ticket Details - {section.tt_no}
                </DialogTitle>

                <DialogDescription className="text-sm text-muted-foreground mb-4">
                    Complete information for this ticket.
                </DialogDescription>

                {/* Content */}
                <div className="grid grid-cols-2 gap-6 text-sm">
                    <p><b>Employee:</b> {section.employee_id}</p>
                    <p><b>Dept:</b> {section.dept_name}</p>
                    <p><b>Function:</b> {section.func_name}</p>
                    <p><b>Status:</b> {section.status}</p>
                    <p><b>Delivered:</b> {section.delivered_status}</p>
                    <p><b>Query:</b> {section.query_type}</p>
                    <p><b>TT Age:</b> {section.tt_age}</p>
                    <p><b>Mobile:</b> {section.mobile_no}</p>
                    <p><b>Created At:</b> {new Date(section.created_at || "").toLocaleDateString()}</p>
                    <p><b>Requisition Type:</b> {section.requistionType}</p>
                </div>

                {/* Footer */}
                <div className="mt-6 text-right">
                    <DialogClose asChild>
                        <Button className="bg-green-100 text-green-800 hover:bg-green-200">
                            Close
                        </Button>
                    </DialogClose>
                </div>

            </DialogContent>
        </Dialog>
    )
}