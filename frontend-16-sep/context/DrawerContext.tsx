
// context/DrawerContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface DrawerContextType {
    isOpen: boolean;          // ✅ add this
    toggle: () => void;
    open: () => void;
    close: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const DrawerProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(true);

    const toggle = () => setIsOpen((prev) => !prev);
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    return (
        <DrawerContext.Provider value={{ isOpen, toggle, open, close }}>
            {children}
        </DrawerContext.Provider>
    );
};

export const useDrawer = (): DrawerContextType => {
    const context = useContext(DrawerContext);
    if (!context) throw new Error("useDrawer must be used within a DrawerProvider");
    return context;
};