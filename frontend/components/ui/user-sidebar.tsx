// // frontend/components/ui/user-sidebar.tsx
// "use client";

// import Link from "next/link";

// import {
//     usePathname,
// } from "next/navigation";

// import {
//     History,
//     LayoutDashboard,
//     MonitorSmartphone,
// } from "lucide-react";

// import {
//     cn,
// } from "@/lib/utils";

// import {
//     getUser,
// } from "@/lib/api";

// type UserMenuItem = {
//     title: string;
//     href: string;
//     icon: React.ElementType;
//     exact?: boolean;
// };

// const userMenuItems: UserMenuItem[] = [
//     {
//         title: "Dashboard",
//         href: "/dashboard/user",
//         icon: LayoutDashboard,
//         exact: true,
//     },
//     {
//         title: "Device History",
//         href: "/dashboard/user/device-history",
//         icon: History,
//     },
//     {
//         title: "Downstream Device",
//         href: "/dashboard/user/downstream-device",
//         icon: MonitorSmartphone,
//     },
// ];

// export function UserSidebar() {
//     const pathname =
//         usePathname();

//     const currentUser =
//         getUser();

//     const displayName =
//         currentUser
//             ?.full_name
//             ?.trim() ||
//         currentUser
//             ?.username
//             ?.trim() ||
//         "Employee";

//     const employeeId =
//         currentUser
//             ?.employee_id
//             ?.trim() ||
//         "";

//     const roleName =
//         currentUser
//             ?.role_name
//             ?.trim() ||
//         "General User";

//     function isItemActive(
//         item: UserMenuItem
//     ): boolean {
//         if (
//             item.exact
//         ) {
//             return (
//                 pathname ===
//                 item.href
//             );
//         }

//         return (
//             pathname ===
//             item.href ||
//             pathname.startsWith(
//                 `${item.href}/`
//             )
//         );
//     }

//     return (
//         <aside className="flex h-full w-full flex-col bg-card">
//             {/* ==================================================
//                 BRAND
//             ================================================== */}

//             <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
//                 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
//                     <MonitorSmartphone className="h-4 w-4 text-primary" />
//                 </div>

//                 <div className="min-w-0">
//                     <p className="truncate text-sm font-bold text-foreground">
//                         ITM Portal
//                     </p>

//                     <p className="truncate text-[10px] text-muted-foreground">
//                         Employee Portal
//                     </p>
//                 </div>
//             </div>

//             {/* ==================================================
//                 NAVIGATION
//             ================================================== */}

//             <div className="flex-1 overflow-y-auto p-3">
//                 <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
//                     My Workspace
//                 </p>

//                 <nav className="space-y-1">
//                     {userMenuItems.map(
//                         (
//                             item
//                         ) => {
//                             const Icon =
//                                 item.icon;

//                             const active =
//                                 isItemActive(
//                                     item
//                                 );

//                             return (
//                                 <Link
//                                     key={
//                                         item.href
//                                     }
//                                     href={
//                                         item.href
//                                     }
//                                     className={cn(
//                                         "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
//                                         active
//                                             ? "bg-primary/10 text-primary"
//                                             : "text-muted-foreground hover:bg-muted hover:text-foreground"
//                                     )}
//                                 >
//                                     <Icon className="h-4 w-4 shrink-0" />

//                                     <span className="truncate">
//                                         {
//                                             item.title
//                                         }
//                                     </span>
//                                 </Link>
//                             );
//                         }
//                     )}
//                 </nav>
//             </div>

//             {/* ==================================================
//                 CURRENT USER
//             ================================================== */}

//             <div className="border-t border-border p-3">
//                 <div className="rounded-xl bg-muted/60 p-3">
//                     <div className="flex items-start gap-3">
//                         <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
//                             {getInitials(
//                                 displayName
//                             )}
//                         </div>

//                         <div className="min-w-0">
//                             <p className="truncate text-xs font-semibold text-foreground">
//                                 {
//                                     displayName
//                                 }
//                             </p>

//                             {employeeId && (
//                                 <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
//                                     {
//                                         employeeId
//                                     }
//                                 </p>
//                             )}

//                             <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
//                                 {
//                                     roleName
//                                 }
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </aside>
//     );
// }

// function getInitials(
//     value: string
// ): string {
//     const parts =
//         value
//             .trim()
//             .split(/\s+/)
//             .filter(Boolean);

//     if (
//         parts.length === 0
//     ) {
//         return "U";
//     }

//     if (
//         parts.length === 1
//     ) {
//         return parts[0]
//             .slice(
//                 0,
//                 2
//             )
//             .toUpperCase();
//     }

//     return (
//         parts[0][0] +
//         parts[
//         parts.length - 1
//         ][0]
//     ).toUpperCase();
// }


// frontend/components/ui/user-sidebar.tsx
"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import {
    usePathname,
} from "next/navigation";

import {
    History,
    LayoutDashboard,
    Laptop,
    MonitorSmartphone,
    Ticket,
} from "lucide-react";

import {
    cn,
} from "@/lib/utils";

import {
    getUser,
    userSidebarApi,
    type UserSidebarSummaryData,
} from "@/lib/api";

type UserMenuItem = {
    title: string;
    href: string;
    icon: React.ElementType;
    exact?: boolean;
    badge?: number | null;
};

export function UserSidebar() {
    const pathname =
        usePathname();

    const currentUser =
        getUser();

    const [
        summary,
        setSummary,
    ] =
        useState<UserSidebarSummaryData | null>(
            null
        );

    const [
        loading,
        setLoading,
    ] =
        useState(
            true
        );

    /* ======================================================
       LOAD OWN USER COUNTS

       GET /api/v1/user/sidebar-summary

       employee_id is resolved securely by backend
       from the current JWT.
    ====================================================== */

    const loadSummary =
        useCallback(
            async () => {
                try {
                    setLoading(
                        true
                    );

                    const response =
                        await userSidebarApi.summary();

                    setSummary(
                        response.data
                    );
                } catch {
                    setSummary(
                        null
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            []
        );

    useEffect(
        () => {
            void loadSummary();
        },
        [
            loadSummary,
        ]
    );

    /* ======================================================
       CURRENT USER
    ====================================================== */

    const displayName =
        currentUser
            ?.full_name
            ?.trim() ||
        currentUser
            ?.username
            ?.trim() ||
        "Employee";

    const employeeId =
        currentUser
            ?.employee_id
            ?.trim() ||
        "";

    const roleName =
        currentUser
            ?.role_name
            ?.trim() ||
        "General User";

    /* ======================================================
       MENU

       LEFT SIDEBAR = OWN USER ONLY

       No downstream menu here.
       Downstream information remains in right sidebar.
    ====================================================== */

    const userMenuItems: UserMenuItem[] = [
        {
            title:
                "Dashboard",
            href:
                "/dashboard/user",
            icon:
                LayoutDashboard,
            exact:
                true,
        },
        {
            title:
                "My Devices",
            href:
                "/dashboard/user/devices",
            icon:
                Laptop,
            badge:
                loading
                    ? null
                    : summary
                        ?.device_count ??
                    0,
        },
        {
            title:
                "Device History",
            href:
                "/dashboard/user/device-history",
            icon:
                History,
        },
        {
            title:
                "TT History",
            href:
                "/dashboard/user/tt-history",
            icon:
                Ticket,
            badge:
                loading
                    ? null
                    : summary
                        ?.ticket_count ??
                    0,
        },
    ];

    function isItemActive(
        item: UserMenuItem
    ): boolean {
        if (
            item.exact
        ) {
            return (
                pathname ===
                item.href
            );
        }

        return (
            pathname ===
            item.href ||
            pathname.startsWith(
                `${item.href}/`
            )
        );
    }

    return (
        <aside className="flex h-full w-full flex-col bg-card">
            {/* ==================================================
                BRAND
            ================================================== */}

            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <MonitorSmartphone className="h-4 w-4 text-primary" />
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                        ITM Portal
                    </p>

                    <p className="truncate text-[10px] text-muted-foreground">
                        Employee Portal
                    </p>
                </div>
            </div>

            {/* ==================================================
                NAVIGATION
            ================================================== */}

            <div className="flex-1 overflow-y-auto p-3">
                <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    My Workspace
                </p>

                <nav className="space-y-1">
                    {userMenuItems.map(
                        (
                            item
                        ) => {
                            const Icon =
                                item.icon;

                            const active =
                                isItemActive(
                                    item
                                );

                            return (
                                <Link
                                    key={
                                        item.href
                                    }
                                    href={
                                        item.href
                                    }
                                    className={cn(
                                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
                                        active
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />

                                    <span className="min-w-0 flex-1 truncate">
                                        {
                                            item.title
                                        }
                                    </span>

                                    {item.badge !==
                                        undefined && (
                                            <span
                                                className={cn(
                                                    "inline-flex min-w-[24px] shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                    active
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground group-hover:bg-background"
                                                )}
                                            >
                                                {item.badge ===
                                                    null
                                                    ? "..."
                                                    : formatCount(
                                                        item.badge
                                                    )}
                                            </span>
                                        )}
                                </Link>
                            );
                        }
                    )}
                </nav>
            </div>

            {/* ==================================================
                CURRENT USER
            ================================================== */}

            <div className="border-t border-border p-3">
                <div className="rounded-xl bg-muted/60 p-3">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {getInitials(
                                displayName
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground">
                                {
                                    displayName
                                }
                            </p>

                            {employeeId && (
                                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                    {
                                        employeeId
                                    }
                                </p>
                            )}

                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                {
                                    roleName
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

/* ======================================================
   HELPERS
====================================================== */

function getInitials(
    value: string
): string {
    const parts =
        value
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (
        parts.length === 0
    ) {
        return "U";
    }

    if (
        parts.length === 1
    ) {
        return parts[0]
            .slice(
                0,
                2
            )
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[
        parts.length - 1
        ][0]
    ).toUpperCase();
}

function formatCount(
    value: number
): string {
    if (
        value >=
        1000000
    ) {
        return `${(
            value /
            1000000
        ).toFixed(1)}M`;
    }

    if (
        value >=
        1000
    ) {
        return `${(
            value /
            1000
        ).toFixed(1)}K`;
    }

    return String(
        value
    );
}