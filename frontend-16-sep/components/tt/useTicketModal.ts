//itm/components/tt/useTicketModal.ts

"use client"

import { useState } from "react"
import { Section } from "./columns"

export function useTicketModal() {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<Section | null>(null)

    const openModal = (row: Section) => {
        setSelected(row)
        setOpen(true)
    }

    const closeModal = () => {
        setOpen(false)
        setSelected(null)
    }

    return {
        open,
        selected,
        openModal,
        closeModal,
    }
}