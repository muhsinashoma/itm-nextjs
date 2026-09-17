//itm/components/tt/TTTable.tsx
"use client"

import { DataTable } from "@/components/data-table"
import { getColumns, Section } from "./columns"
import { useTicketModal } from "./useTicketModal"
import TicketDetailsDialog from "./TicketDetailsDialog"

export default function TTTable({ data }: { data: Section[] }) {

    const modal = useTicketModal()

    const columns = getColumns({
        onView: modal.openModal,
    })

    return (
        <>
            <DataTable columns={columns} data={data} />

            {/* ✅ GLOBAL MODAL */}
            <TicketDetailsDialog
                open={modal.open}
                onOpenChange={modal.closeModal}
                section={modal.selected}
            />
        </>
    )
}