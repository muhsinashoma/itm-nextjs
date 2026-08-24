
// frontend/app/dashboard/layout.tsx

"use client";

import {
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import dynamic from "next/dynamic";

import {
    usePathname,
    useRouter,
} from "next/navigation";

import {
    Loader2,
    RefreshCw,
    ShieldAlert,
} from "lucide-react";

import {
    authApi,
    clearAuthStorage,
    getToken,
    type AuthMeData,
} from "@/lib/api";

import {
    TTGlobalModal,
} from "@/components/ui/TTGlobalModal";

import {
    Sheet,
    SheetContent,
    SheetTitle,
} from "@/components/ui/sheet";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import {
    DrawerProvider,
    useDrawer,
} from "@/context/DrawerContext";

import {
    ThemeProvider,
} from "@/context/ThemeContext";

/* ======================================================
   DYNAMIC COMPONENTS
====================================================== */

const Header = dynamic(
    () =>
        import(
            "@/components/ui/header"
        ).then(
            (mod) =>
                mod.Header
        ),
    {
        ssr: false,
    }
);

const Sidebar = dynamic(
    () =>
        import(
            "@/components/ui/sidebar"
        ).then(
            (mod) =>
                mod.Sidebar
        ),
    {
        ssr: false,
    }
);

const UserSidebar = dynamic(
    () =>
        import(
            "@/components/ui/user-sidebar"
        ).then(
            (mod) =>
                mod.UserSidebar
        ),
    {
        ssr: false,
    }
);

const RightSidebar = dynamic(
    () =>
        import(
            "@/components/ui/right-sidebar"
        ).then(
            (mod) =>
                mod.RightSidebar
        ),
    {
        ssr: false,
    }
);

const UserRightSidebar = dynamic(
    () =>
        import(
            "@/components/ui/user-right-sidebar"
        ).then(
            (mod) =>
                mod.UserRightSidebar
        ),
    {
        ssr: false,
    }
);

/* ======================================================
   ROOT LAYOUT
====================================================== */

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <ThemeProvider>
            <DrawerProvider>
                <DashboardBody>
                    {children}
                </DashboardBody>
            </DrawerProvider>
        </ThemeProvider>
    );
}

/* ======================================================
   DASHBOARD BODY
====================================================== */

function DashboardBody({
    children,
}: {
    children: ReactNode;
}) {
    const router =
        useRouter();

    const pathname =
        usePathname();

    const {
        isOpen,
        toggle,
    } =
        useDrawer();

    /* ======================================================
       STATE
    ====================================================== */

    const [
        mobileNavOpen,
        setMobileNavOpen,
    ] =
        useState(
            false
        );

    const [
        sessionReady,
        setSessionReady,
    ] =
        useState(
            false
        );

    const [
        sessionError,
        setSessionError,
    ] =
        useState(
            ""
        );

    const [
        checkingSession,
        setCheckingSession,
    ] =
        useState(
            true
        );

    const [
        authUser,
        setAuthUser,
    ] =
        useState<
            AuthMeData | null
        >(
            null
        );

    /* ======================================================
       ROUTE TYPE
    ====================================================== */

    const isExplicitUserRoute =
        useMemo(
            () =>
                pathname ===
                "/dashboard/user" ||
                pathname.startsWith(
                    "/dashboard/user/"
                ),
            [
                pathname,
            ]
        );

    /* ======================================================
       GENERAL USER

       IMPORTANT:

       GENERAL_USER must always use:
       - UserSidebar
       - UserRightSidebar
       - General User header links

       Even when visiting shared routes such as:

       /dashboard/operations/create_tt

       This fixes the issue where Create TT was opening
       the Admin / IT dashboard shell.
    ====================================================== */

    const isGeneralUser =
        authUser?.role_code ===
        "GENERAL_USER";

    /* ======================================================
       USER SHELL

       Use User shell when:

       1. Authenticated account is GENERAL_USER

       OR

       2. Any role intentionally opens /dashboard/user/*
          to view its personal employee dashboard.
    ====================================================== */

    const useUserShell =
        Boolean(
            isGeneralUser ||
            isExplicitUserRoute
        );

    /* ======================================================
       VALIDATE SESSION
    ====================================================== */

    const validateSession =
        useCallback(
            async () => {
                const token =
                    getToken();

                if (!token) {
                    clearAuthStorage();

                    router.replace(
                        "/auth"
                    );

                    return;
                }

                setCheckingSession(
                    true
                );

                setSessionError(
                    ""
                );

                try {
                    const response =
                        await authApi.me();

                    const user =
                        response.data;

                    /*
                     * /auth/me is authoritative.
                     */
                    setAuthUser(
                        user
                    );

                    localStorage.setItem(
                        "itm_user",
                        JSON.stringify(
                            user
                        )
                    );

                    setSessionReady(
                        true
                    );
                } catch (
                error
                ) {
                    setAuthUser(
                        null
                    );

                    setSessionReady(
                        false
                    );

                    setSessionError(
                        error instanceof
                            Error
                            ? error.message
                            : "Unable to verify your session."
                    );
                } finally {
                    setCheckingSession(
                        false
                    );
                }
            },
            [
                router,
            ]
        );

    useEffect(
        () => {
            void validateSession();
        },
        [
            validateSession,
        ]
    );

    /* ======================================================
       CLOSE MOBILE NAV AFTER ROUTE CHANGE
    ====================================================== */

    useEffect(
        () => {
            setMobileNavOpen(
                false
            );
        },
        [
            pathname,
        ]
    );

    /* ======================================================
       SESSION LOADING
    ====================================================== */

    if (
        checkingSession &&
        !sessionReady
    ) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-7 w-7 animate-spin" />

                    <p className="text-sm font-medium">
                        Verifying your session...
                    </p>
                </div>
            </div>
        );
    }

    /* ======================================================
       SESSION ERROR
    ====================================================== */

    if (
        !sessionReady ||
        !authUser
    ) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <ShieldAlert className="h-6 w-6" />
                    </div>

                    <h1 className="text-lg font-semibold text-foreground">
                        Unable to verify session
                    </h1>

                    <p className="mt-2 text-sm text-muted-foreground">
                        {sessionError ||
                            "Your current session could not be verified."}
                    </p>

                    <div className="mt-5 flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                void validateSession()
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
                        >
                            <RefreshCw className="h-4 w-4" />

                            Retry
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                clearAuthStorage();

                                router.replace(
                                    "/auth"
                                );
                            }}
                            className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
                        >
                            Sign in
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ======================================================
       AUTHENTICATED DASHBOARD
    ====================================================== */

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden">
            {/* ==================================================
                HEADER
            ================================================== */}

            <Header
                authUser={
                    authUser
                }
                useUserShell={
                    useUserShell
                }
                onMenuClick={
                    toggle
                }
                onMobileNavClick={() =>
                    setMobileNavOpen(
                        true
                    )
                }
            />

            {/* ==================================================
                BODY
            ================================================== */}

            <div className="flex flex-1 overflow-hidden">
                {/* ==============================================
                    LEFT SIDEBAR — DESKTOP
                ============================================== */}

                <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border bg-card md:flex">
                    {useUserShell ? (
                        <UserSidebar />
                    ) : (
                        <Sidebar />
                    )}
                </aside>

                {/* ==============================================
                    MOBILE SIDEBAR
                ============================================== */}

                <Sheet
                    open={
                        mobileNavOpen
                    }
                    onOpenChange={
                        setMobileNavOpen
                    }
                >
                    <SheetContent
                        side="left"
                        className="w-72 bg-card p-0"
                    >
                        <VisuallyHidden.Root>
                            <SheetTitle>
                                Navigation
                            </SheetTitle>
                        </VisuallyHidden.Root>

                        {useUserShell ? (
                            <UserSidebar />
                        ) : (
                            <Sidebar
                                onNavigate={() =>
                                    setMobileNavOpen(
                                        false
                                    )
                                }
                            />
                        )}
                    </SheetContent>
                </Sheet>

                {/* ==============================================
                    MAIN CONTENT
                ============================================== */}

                <main className="min-w-0 flex-1 overflow-y-auto bg-background p-3 text-[13px] leading-[1.5] sm:p-4">
                    {children}
                </main>

                {/* ==============================================
                    RIGHT SIDEBAR

                    GENERAL USER:
                    UserRightSidebar

                    ADMIN / IT:
                    RightSidebar
                ============================================== */}

                <aside
                    className={`hidden shrink-0 overflow-hidden border-l border-border bg-card transition-all duration-300 ease-in-out lg:block ${isOpen
                        ? "w-80"
                        : "w-0"
                        }`}
                >
                    <div
                        className={`h-full transition-opacity duration-300 ${isOpen
                            ? "opacity-100"
                            : "pointer-events-none opacity-0"
                            }`}
                    >
                        {useUserShell ? (
                            <UserRightSidebar />
                        ) : (
                            <RightSidebar />
                        )}
                    </div>
                </aside>
            </div>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <footer className="shrink-0 border-t border-border bg-card">
                <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground">
                    <a
                        href="https://fiberathome.net"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium transition-colors hover:text-foreground hover:underline"
                    >
                        Fiber@Home Ltd.
                    </a>

                    <span className="hidden sm:block">
                        Developed by{" "}
                        <span className="font-medium text-foreground">
                            Software Team
                        </span>
                    </span>

                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Production
                        </span>

                        <span className="hidden text-muted-foreground md:inline">
                            v1.0.0
                        </span>
                    </div>
                </div>
            </footer>

            {/* ==================================================
                GLOBAL TT MODAL
            ================================================== */}

            <TTGlobalModal />
        </div>
    );
}