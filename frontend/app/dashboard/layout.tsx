
// app/dashboard/layout.tsx
"use client";

import { ReactNode, useState } from "react";
import dynamic from "next/dynamic";
import { TTGlobalModal } from "@/components/ui/TTGlobalModal";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { DrawerProvider, useDrawer } from "@/context/DrawerContext";
import { ThemeProvider } from "@/context/ThemeContext";

const Header = dynamic(
    () => import("@/components/ui/header").then((mod) => mod.Header),
    { ssr: false }
);
const Sidebar = dynamic(
    () => import("@/components/ui/sidebar").then((mod) => mod.Sidebar),
    { ssr: false }
);
const RightSidebar = dynamic(
    () => import("@/components/ui/right-sidebar").then((mod) => mod.RightSidebar),
    { ssr: false }
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <DrawerProvider>
                <DashboardBody>{children}</DashboardBody>
            </DrawerProvider>
        </ThemeProvider>
    );
}

function DashboardBody({ children }: { children: ReactNode }) {
    const { isOpen, toggle } = useDrawer();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden">
            {/* HEADER */}
            <Header
                onMenuClick={toggle}
                onMobileNavClick={() => setMobileNavOpen(true)}
            />

            {/* DASHBOARD BODY */}
            <div className="flex flex-1 overflow-hidden">
                {/* LEFT SIDEBAR — desktop only */}
                <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-card overflow-y-auto">
                    <Sidebar />
                </aside>

                {/* MOBILE SIDEBAR — Sheet overlay */}
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                    <SheetContent side="left" className="p-0 w-72 bg-card">
                        <VisuallyHidden.Root>
                            <SheetTitle>Navigation</SheetTitle>
                        </VisuallyHidden.Root>
                        <Sidebar onNavigate={() => setMobileNavOpen(false)} />
                    </SheetContent>
                </Sheet>

                {/* MAIN CONTENT */}
                <main className="flex-1 min-w-0 overflow-y-auto bg-background p-3 sm:p-4 text-[13px] leading-[1.5] transition-all duration-300">
                    {children}
                </main>

                {/* RIGHT SIDEBAR — hidden on mobile/tablet */}
                <aside
                    className={`hidden lg:block border-l border-border bg-card overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "w-80" : "w-0"
                        }`}
                >
                    <div
                        className={`h-full transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                            }`}
                    >
                        <RightSidebar />
                    </div>
                </aside>
            </div>

            {/* FOOTER */}
            <footer className="shrink-0 border-t border-border bg-card">
                <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground">
                    <a
                        href="https://fiberathome.net"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground hover:underline font-medium transition-colors"
                    >
                        Fiber@Home Ltd.
                    </a>

                    <span className="hidden sm:block">
                        Developed by <span className="font-medium text-foreground">Software Team</span>
                    </span>

                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-medium">
                            Production
                        </span>
                        <span className="hidden md:inline text-muted-foreground">v1.0.0</span>
                    </div>
                </div>
            </footer>

            {/* GLOBAL TT MODAL */}
            <TTGlobalModal />
        </div>
    );
}
