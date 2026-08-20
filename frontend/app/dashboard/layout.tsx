
// // frontend/app/dashboard/layout.tsx
// "use client";

// import {
//     ReactNode,
//     useCallback,
//     useEffect,
//     useState,
// } from "react";

// import dynamic from "next/dynamic";

// import {
//     useRouter,
// } from "next/navigation";

// import {
//     Loader2,
//     RefreshCw,
//     ShieldAlert,
// } from "lucide-react";

// import {
//     authApi,
//     getToken,
// } from "@/lib/api";

// import {
//     TTGlobalModal,
// } from "@/components/ui/TTGlobalModal";

// import {
//     Sheet,
//     SheetContent,
//     SheetTitle,
// } from "@/components/ui/sheet";

// import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

// import {
//     DrawerProvider,
//     useDrawer,
// } from "@/context/DrawerContext";

// import {
//     ThemeProvider,
// } from "@/context/ThemeContext";

// const Header = dynamic(
//     () =>
//         import(
//             "@/components/ui/header"
//         ).then(
//             (
//                 mod
//             ) =>
//                 mod.Header
//         ),
//     {
//         ssr: false,
//     }
// );

// const Sidebar = dynamic(
//     () =>
//         import(
//             "@/components/ui/sidebar"
//         ).then(
//             (
//                 mod
//             ) =>
//                 mod.Sidebar
//         ),
//     {
//         ssr: false,
//     }
// );

// const RightSidebar = dynamic(
//     () =>
//         import(
//             "@/components/ui/right-sidebar"
//         ).then(
//             (
//                 mod
//             ) =>
//                 mod.RightSidebar
//         ),
//     {
//         ssr: false,
//     }
// );

// export default function DashboardLayout({
//     children,
// }: {
//     children: ReactNode;
// }) {
//     return (
//         <ThemeProvider>
//             <DrawerProvider>
//                 <DashboardBody>
//                     {
//                         children
//                     }
//                 </DashboardBody>
//             </DrawerProvider>
//         </ThemeProvider>
//     );
// }

// function DashboardBody({
//     children,
// }: {
//     children: ReactNode;
// }) {
//     const router =
//         useRouter();

//     const {
//         isOpen,
//         toggle,
//     } =
//         useDrawer();

//     const [
//         mobileNavOpen,
//         setMobileNavOpen,
//     ] =
//         useState(
//             false
//         );

//     const [
//         sessionReady,
//         setSessionReady,
//     ] =
//         useState(
//             false
//         );

//     const [
//         sessionError,
//         setSessionError,
//     ] =
//         useState(
//             ""
//         );

//     const [
//         checkingSession,
//         setCheckingSession,
//     ] =
//         useState(
//             true
//         );

//     /* ======================================================
//        VALIDATE CURRENT SESSION

//        This runs when the Dashboard layout mounts.

//        It verifies:
//        - JWT exists
//        - JWT is valid
//        - user still exists
//        - user is active
//        - current role is active
//        - current permissions are loaded

//        /auth/me is the authoritative frontend identity source.
//     ====================================================== */

//     const validateSession =
//         useCallback(
//             async () => {
//                 const token =
//                     getToken();

//                 if (!token) {
//                     router.replace(
//                         "/auth"
//                     );

//                     return;
//                 }

//                 setCheckingSession(
//                     true
//                 );

//                 setSessionError(
//                     ""
//                 );

//                 try {
//                     const response =
//                         await authApi.me();

//                     localStorage.setItem(
//                         "itm_user",
//                         JSON.stringify(
//                             response.data
//                         )
//                     );

//                     setSessionReady(
//                         true
//                     );
//                 } catch (
//                 error
//                 ) {
//                     /*
//                      * HTTP 401 is already handled by api.ts:
//                      * token/user are cleared and /auth is loaded.
//                      *
//                      * Other failures should not silently display
//                      * protected dashboard content.
//                      */
//                     setSessionReady(
//                         false
//                     );

//                     setSessionError(
//                         error instanceof
//                             Error
//                             ? error.message
//                             : "Unable to verify your session."
//                     );
//                 } finally {
//                     setCheckingSession(
//                         false
//                     );
//                 }
//             },
//             [
//                 router,
//             ]
//         );

//     useEffect(
//         () => {
//             void validateSession();
//         },
//         [
//             validateSession,
//         ]
//     );

//     /* ======================================================
//        SESSION LOADING
//     ====================================================== */

//     if (
//         checkingSession &&
//         !sessionReady
//     ) {
//         return (
//             <div className="min-h-screen w-full flex items-center justify-center bg-background">
//                 <div className="flex flex-col items-center gap-3 text-muted-foreground">
//                     <Loader2 className="h-7 w-7 animate-spin" />

//                     <p className="text-sm font-medium">
//                         Verifying your session...
//                     </p>
//                 </div>
//             </div>
//         );
//     }

//     /* ======================================================
//        SESSION ERROR

//        Do not render protected dashboard content if the
//        session could not be validated.
//     ====================================================== */

//     if (
//         !sessionReady
//     ) {
//         return (
//             <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
//                 <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
//                     <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
//                         <ShieldAlert className="h-6 w-6" />
//                     </div>

//                     <h1 className="text-lg font-semibold text-foreground">
//                         Unable to verify session
//                     </h1>

//                     <p className="mt-2 text-sm text-muted-foreground">
//                         {sessionError ||
//                             "Your current session could not be verified."}
//                     </p>

//                     <div className="mt-5 flex justify-center gap-2">
//                         <button
//                             type="button"
//                             onClick={() =>
//                                 void validateSession()
//                             }
//                             className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
//                         >
//                             <RefreshCw className="h-4 w-4" />

//                             Retry
//                         </button>

//                         <button
//                             type="button"
//                             onClick={() => {
//                                 localStorage.removeItem(
//                                     "itm_token"
//                                 );

//                                 localStorage.removeItem(
//                                     "itm_user"
//                                 );

//                                 router.replace(
//                                     "/auth"
//                                 );
//                             }}
//                             className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
//                         >
//                             Sign in
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     /* ======================================================
//        AUTHENTICATED DASHBOARD
//     ====================================================== */

//     return (
//         <div className="h-screen w-full flex flex-col overflow-hidden">
//             {/* HEADER */}
//             <Header
//                 onMenuClick={
//                     toggle
//                 }
//                 onMobileNavClick={() =>
//                     setMobileNavOpen(
//                         true
//                     )
//                 }
//             />

//             {/* DASHBOARD BODY */}
//             <div className="flex flex-1 overflow-hidden">
//                 {/* LEFT SIDEBAR — DESKTOP */}
//                 <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-card overflow-y-auto">
//                     <Sidebar />
//                 </aside>

//                 {/* MOBILE SIDEBAR */}
//                 <Sheet
//                     open={
//                         mobileNavOpen
//                     }
//                     onOpenChange={
//                         setMobileNavOpen
//                     }
//                 >
//                     <SheetContent
//                         side="left"
//                         className="p-0 w-72 bg-card"
//                     >
//                         <VisuallyHidden.Root>
//                             <SheetTitle>
//                                 Navigation
//                             </SheetTitle>
//                         </VisuallyHidden.Root>

//                         <Sidebar
//                             onNavigate={() =>
//                                 setMobileNavOpen(
//                                     false
//                                 )
//                             }
//                         />
//                     </SheetContent>
//                 </Sheet>

//                 {/* MAIN CONTENT */}
//                 <main className="flex-1 min-w-0 overflow-y-auto bg-background p-3 sm:p-4 text-[13px] leading-[1.5] transition-all duration-300">
//                     {
//                         children
//                     }
//                 </main>

//                 {/* RIGHT SIDEBAR */}
//                 <aside
//                     className={`hidden lg:block border-l border-border bg-card overflow-hidden transition-all duration-300 ease-in-out ${isOpen
//                         ? "w-80"
//                         : "w-0"
//                         }`}
//                 >
//                     <div
//                         className={`h-full transition-opacity duration-300 ${isOpen
//                             ? "opacity-100"
//                             : "opacity-0 pointer-events-none"
//                             }`}
//                     >
//                         <RightSidebar />
//                     </div>
//                 </aside>
//             </div>

//             {/* FOOTER */}
//             <footer className="shrink-0 border-t border-border bg-card">
//                 <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground">
//                     <a
//                         href="https://fiberathome.net"
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="hover:text-foreground hover:underline font-medium transition-colors"
//                     >
//                         Fiber@Home Ltd.
//                     </a>

//                     <span className="hidden sm:block">
//                         Developed by{" "}
//                         <span className="font-medium text-foreground">
//                             Software Team
//                         </span>
//                     </span>

//                     <div className="flex items-center gap-2">
//                         <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-medium">
//                             Production
//                         </span>

//                         <span className="hidden md:inline text-muted-foreground">
//                             v1.0.0
//                         </span>
//                     </div>
//                 </div>
//             </footer>

//             {/* GLOBAL TT MODAL */}
//             <TTGlobalModal />
//         </div>
//     );
// }

// frontend/app/dashboard/layout.tsx
"use client";

import {
    ReactNode,
    useCallback,
    useEffect,
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
    getToken,
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
            (
                mod
            ) =>
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
            (
                mod
            ) =>
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
            (
                mod
            ) =>
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
            (
                mod
            ) =>
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
            (
                mod
            ) =>
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
                    {
                        children
                    }
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

    /* ======================================================
       USER AREA

       All routes under /dashboard/user
       use employee-specific sidebars.
    ====================================================== */

    const isUserArea =
        pathname ===
        "/dashboard/user" ||
        pathname.startsWith(
            "/dashboard/user/"
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

                    localStorage.setItem(
                        "itm_user",
                        JSON.stringify(
                            response.data
                        )
                    );

                    setSessionReady(
                        true
                    );
                } catch (
                error
                ) {
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

    if (!sessionReady) {
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
                                localStorage.removeItem(
                                    "itm_token"
                                );

                                localStorage.removeItem(
                                    "itm_user"
                                );

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

                    USER AREA
                    → UserSidebar

                    ADMIN / STAFF
                    → Sidebar
                ============================================== */}

                <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border bg-card md:flex">
                    {isUserArea ? (
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

                        {isUserArea ? (
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
                    {
                        children
                    }
                </main>

                {/* ==============================================
                    RIGHT SIDEBAR

                    USER AREA
                    → UserRightSidebar

                    ADMIN / STAFF
                    → RightSidebar

                    Same width, border, animation and
                    dashboard shell for both.
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
                        {isUserArea ? (
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