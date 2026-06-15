//components/ui/tt-modal-store.ts

"use client"

import { create } from "zustand"
import { Section } from "@/types/tt"

type TTModalStore = {
    open: boolean
    data: Section | null
    openModal: (data: Section) => void
    closeModal: () => void
}

export const useTTModal = create<TTModalStore>((set) => ({
    open: false,
    data: null,

    openModal: (data) =>
        set({
            open: true,
            data,
        }),

    closeModal: () =>
        set({
            open: false,
            data: null,
        }),
}))