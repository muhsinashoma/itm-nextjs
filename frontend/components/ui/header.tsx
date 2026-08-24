


// // frontend/components/ui/header.tsx
// "use client";

// import * as React from "react";

// import Link from "next/link";

// import {
//     usePathname,
//     useRouter,
// } from "next/navigation";

// import {
//     Bell,
//     ChevronDown,
//     Menu,
//     PanelRightOpen,
//     Search,
// } from "lucide-react";

// import {
//     cn,
// } from "@/lib/utils";

// import {
//     Input,
// } from "@/components/ui/input";

// import {
//     Avatar,
//     AvatarFallback,
// } from "@/components/ui/avatar";

// import {
//     Button,
// } from "@/components/ui/button";

// import {
//     ThemeDropdown,
// } from "@/components/theme-dropdown";

// import {
//     useDrawer,
// } from "@/context/DrawerContext";

// import {
//     clearAuthStorage,
//     getUser,
// } from "@/lib/api";

// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// /* ======================================================
//    TYPES
// ====================================================== */

// export interface HeaderProps
//     extends React.HTMLAttributes<HTMLElement> {
//     title?: string;

//     onMenuClick?: () => void;

//     onMobileNavClick?: () => void;

//     userName?: string;

//     userEmail?: string;
// }

// type NavItem = {
//     label: string;
//     href: string;
// };

// /* ======================================================
//    HELPERS
// ====================================================== */

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
//         return "IT";
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

// /* ======================================================
//    HEADER
// ====================================================== */

// export const Header =
//     React.forwardRef<
//         HTMLElement,
//         HeaderProps
//     >(
//         (
//             props,
//             ref
//         ) => {
//             /*
//              * IMPORTANT:
//              *
//              * Custom component props are explicitly
//              * removed here so they are NOT forwarded
//              * to the native <header> element.
//              *
//              * This fixes:
//              *
//              * Unknown event handler property
//              * `onMenuClick`
//              */
//             const {
//                 className,
//                 title,
//                 onMenuClick,
//                 onMobileNavClick,
//                 userName,
//                 userEmail,
//                 ...rest
//             } = props;

//             const router =
//                 useRouter();

//             const pathname =
//                 usePathname();

//             const {
//                 toggle,
//             } =
//                 useDrawer();

//             const currentUser =
//                 getUser();

//             /* ==================================================
//                ROLE
//             ================================================== */

//             const isGeneralUser =
//                 currentUser
//                     ?.role_code ===
//                 "GENERAL_USER";

//             const isUserDashboard =
//                 pathname ===
//                 "/dashboard/user" ||
//                 pathname.startsWith(
//                     "/dashboard/user/"
//                 );

//             /* ==================================================
//                USER INFORMATION
//             ================================================== */

//             const displayName =
//                 userName?.trim() ||
//                 currentUser
//                     ?.full_name
//                     ?.trim() ||
//                 currentUser
//                     ?.username
//                     ?.trim() ||
//                 "ITM User";

//             const displayEmail =
//                 userEmail?.trim() ||
//                 currentUser
//                     ?.email
//                     ?.trim() ||
//                 "No email available";

//             const initials =
//                 getInitials(
//                     displayName
//                 );

//             /* ==================================================
//                NAVIGATION

//                GENERAL_USER:
//                Dashboard -> /dashboard/user
//                Create TT
//                Logout

//                Assigned TT is NOT shown.

//                Staff users:
//                Dashboard
//                Assigned TT
//                Create TT
//             ================================================== */

//             const navItems: NavItem[] =
//                 isGeneralUser
//                     ? [
//                         {
//                             label:
//                                 "Dashboard",
//                             href:
//                                 "/dashboard/user",
//                         },
//                         {
//                             label:
//                                 "Create TT",
//                             href:
//                                 "/dashboard/operations/create_tt",
//                         },
//                     ]
//                     : [
//                         {
//                             label:
//                                 "Dashboard",
//                             href:
//                                 "/dashboard",
//                         },
//                         {
//                             label:
//                                 "Assigned TT",
//                             href:
//                                 "/dashboard/operations/assigned-tt",
//                         },
//                         {
//                             label:
//                                 "Create TT",
//                             href:
//                                 "/dashboard/operations/create_tt",
//                         },
//                     ];

//             /* ==================================================
//                LOCAL UI STATE
//             ================================================== */

//             const [
//                 activeMenu,
//                 setActiveMenu,
//             ] =
//                 React.useState<
//                     | "notif"
//                     | "user"
//                     | "theme"
//                     | null
//                 >(
//                     null
//                 );

//             const [
//                 notifications,
//                 setNotifications,
//             ] =
//                 React.useState([
//                     {
//                         id: 1,
//                         title:
//                             "New task assigned",
//                         time:
//                             "2 min ago",
//                         read:
//                             false,
//                     },
//                     {
//                         id: 2,
//                         title:
//                             "Inventory updated",
//                         time:
//                             "1 hour ago",
//                         read:
//                             false,
//                     },
//                     {
//                         id: 3,
//                         title:
//                             "Report ready",
//                         time:
//                             "Yesterday",
//                         read:
//                             false,
//                     },
//                 ]);

//             const [
//                 searchOpen,
//                 setSearchOpen,
//             ] =
//                 React.useState(
//                     false
//                 );

//             const unreadCount =
//                 notifications.filter(
//                     (
//                         item
//                     ) =>
//                         !item.read
//                 ).length;

//             /* ==================================================
//                LOGOUT
//             ================================================== */

//             function handleLogout() {
//                 clearAuthStorage();

//                 router.replace(
//                     "/auth"
//                 );
//             }

//             /* ==================================================
//                ACTIVE NAVIGATION
//             ================================================== */

//             function isNavActive(
//                 item: NavItem
//             ): boolean {
//                 /*
//                  * General User dashboard also stays active
//                  * for nested user pages such as:
//                  *
//                  * /dashboard/user/device-history
//                  */
//                 if (
//                     item.href ===
//                     "/dashboard/user"
//                 ) {
//                     return (
//                         pathname ===
//                         "/dashboard/user" ||
//                         pathname.startsWith(
//                             "/dashboard/user/"
//                         )
//                     );
//                 }

//                 /*
//                  * Main staff dashboard should only match
//                  * the exact /dashboard page.
//                  *
//                  * Otherwise every /dashboard/... page
//                  * would make Dashboard look active.
//                  */
//                 if (
//                     item.href ===
//                     "/dashboard"
//                 ) {
//                     return (
//                         pathname ===
//                         "/dashboard"
//                     );
//                 }

//                 return (
//                     pathname ===
//                     item.href ||
//                     pathname.startsWith(
//                         `${item.href}/`
//                     )
//                 );
//             }

//             /* ==================================================
//                RENDER
//             ================================================== */

//             return (
//                 <header
//                     ref={
//                         ref
//                     }
//                     className={cn(
//                         "sticky top-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/95 px-3 text-foreground backdrop-blur-sm sm:px-5",
//                         className
//                     )}
//                     {...rest}
//                 >
//                     {/* ==========================================
//                         LEFT SIDE
//                     ========================================== */}

//                     <div className="flex min-w-0 items-center gap-1 sm:gap-3">
//                         {/* MOBILE MENU */}

//                         <Button
//                             variant="ghost"
//                             size="icon"
//                             className="h-8 w-8 shrink-0 md:hidden"
//                             onClick={
//                                 onMobileNavClick ??
//                                 onMenuClick
//                             }
//                             aria-label="Open navigation"
//                         >
//                             <Menu className="h-4 w-4" />
//                         </Button>

//                         {/* MOBILE TITLE */}

//                         <span className="max-w-[120px] truncate text-sm font-semibold text-foreground md:hidden">
//                             {title ||
//                                 "ITM"}
//                         </span>

//                         {/* DESKTOP NAVIGATION */}

//                         <nav className="hidden items-center gap-1 md:flex">
//                             {navItems.map(
//                                 (
//                                     item
//                                 ) => {
//                                     const active =
//                                         isNavActive(
//                                             item
//                                         );

//                                     return (
//                                         <Link
//                                             key={
//                                                 item.href
//                                             }
//                                             href={
//                                                 item.href
//                                             }
//                                             className={cn(
//                                                 "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
//                                                 active
//                                                     ? "bg-primary/10 font-semibold text-primary"
//                                                     : "text-muted-foreground hover:bg-muted hover:text-foreground"
//                                             )}
//                                         >
//                                             {
//                                                 item.label
//                                             }
//                                         </Link>
//                                     );
//                                 }
//                             )}
//                         </nav>

//                         {/* LOGOUT */}

//                         <button
//                             type="button"
//                             onClick={
//                                 handleLogout
//                             }
//                             className="ml-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
//                         >
//                             Logout
//                         </button>
//                     </div>

//                     {/* ==========================================
//                         RIGHT SIDE
//                     ========================================== */}

//                     <div className="flex shrink-0 items-center gap-1">
//                         {/* DESKTOP SEARCH */}

//                         <div className="relative hidden sm:block">
//                             <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

//                             <Input
//                                 placeholder="Search..."
//                                 className="h-8 w-36 border-0 bg-muted pl-8 text-xs focus-visible:ring-1 lg:w-48"
//                                 type="search"
//                             />
//                         </div>

//                         {/* MOBILE SEARCH BUTTON */}

//                         <Button
//                             variant="ghost"
//                             size="icon"
//                             className="h-8 w-8 sm:hidden"
//                             onClick={() =>
//                                 setSearchOpen(
//                                     (
//                                         current
//                                     ) =>
//                                         !current
//                                 )
//                             }
//                             aria-label="Search"
//                         >
//                             <Search className="h-4 w-4" />
//                         </Button>

//                         {/* RIGHT SIDEBAR TOGGLE */}

//                         <Button
//                             variant="ghost"
//                             size="icon"
//                             className="hidden h-8 w-8 lg:flex"
//                             onClick={
//                                 toggle
//                             }
//                             aria-label={
//                                 isUserDashboard
//                                     ? "Toggle employee information panel"
//                                     : "Toggle right panel"
//                             }
//                         >
//                             <PanelRightOpen className="h-4 w-4" />
//                         </Button>

//                         {/* THEME */}

//                         <ThemeDropdown
//                             activeMenu={
//                                 activeMenu
//                             }
//                             setActiveMenu={
//                                 setActiveMenu
//                             }
//                         />

//                         {/* ======================================
//                             NOTIFICATIONS
//                         ====================================== */}

//                         <DropdownMenu
//                             open={
//                                 activeMenu ===
//                                 "notif"
//                             }
//                             onOpenChange={(
//                                 open
//                             ) =>
//                                 setActiveMenu(
//                                     open
//                                         ? "notif"
//                                         : null
//                                 )
//                             }
//                         >
//                             <DropdownMenuTrigger
//                                 asChild
//                             >
//                                 <Button
//                                     variant="ghost"
//                                     size="icon"
//                                     className="relative h-8 w-8"
//                                     aria-label="Notifications"
//                                 >
//                                     <Bell className="h-4 w-4" />

//                                     {unreadCount >
//                                         0 && (
//                                             <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
//                                                 {
//                                                     unreadCount
//                                                 }
//                                             </span>
//                                         )}
//                                 </Button>
//                             </DropdownMenuTrigger>

//                             <DropdownMenuContent
//                                 align="end"
//                                 sideOffset={
//                                     8
//                                 }
//                                 className="w-72 max-w-[90vw] overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg"
//                             >
//                                 <div className="flex items-center justify-between border-b border-border px-4 py-3">
//                                     <span className="text-sm font-semibold text-foreground">
//                                         Notifications
//                                     </span>

//                                     <button
//                                         type="button"
//                                         className="text-xs font-normal text-primary hover:underline"
//                                         onClick={() =>
//                                             setNotifications(
//                                                 (
//                                                     previous
//                                                 ) =>
//                                                     previous.map(
//                                                         (
//                                                             item
//                                                         ) => ({
//                                                             ...item,
//                                                             read:
//                                                                 true,
//                                                         })
//                                                     )
//                                             )
//                                         }
//                                     >
//                                         Mark all read
//                                     </button>
//                                 </div>

//                                 <ul className="max-h-72 divide-y divide-border overflow-y-auto">
//                                     {notifications.map(
//                                         (
//                                             notification
//                                         ) => (
//                                             <li
//                                                 key={
//                                                     notification.id
//                                                 }
//                                                 className={cn(
//                                                     "cursor-pointer px-4 py-3 transition-colors hover:bg-muted",
//                                                     notification.read &&
//                                                     "opacity-60"
//                                                 )}
//                                                 onClick={() =>
//                                                     setNotifications(
//                                                         (
//                                                             previous
//                                                         ) =>
//                                                             previous.map(
//                                                                 (
//                                                                     item
//                                                                 ) =>
//                                                                     item.id ===
//                                                                         notification.id
//                                                                         ? {
//                                                                             ...item,
//                                                                             read:
//                                                                                 true,
//                                                                         }
//                                                                         : item
//                                                             )
//                                                     )
//                                                 }
//                                             >
//                                                 <div className="flex items-start gap-2.5">
//                                                     {!notification.read && (
//                                                         <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
//                                                     )}

//                                                     <div className="min-w-0">
//                                                         <p className="truncate text-sm font-medium text-foreground">
//                                                             {
//                                                                 notification.title
//                                                             }
//                                                         </p>

//                                                         <p className="mt-0.5 text-xs text-muted-foreground">
//                                                             {
//                                                                 notification.time
//                                                             }
//                                                         </p>
//                                                     </div>
//                                                 </div>
//                                             </li>
//                                         )
//                                     )}
//                                 </ul>
//                             </DropdownMenuContent>
//                         </DropdownMenu>

//                         {/* ======================================
//                             USER MENU
//                         ====================================== */}

//                         <DropdownMenu
//                             open={
//                                 activeMenu ===
//                                 "user"
//                             }
//                             onOpenChange={(
//                                 open
//                             ) =>
//                                 setActiveMenu(
//                                     open
//                                         ? "user"
//                                         : null
//                                 )
//                             }
//                         >
//                             <DropdownMenuTrigger
//                                 asChild
//                             >
//                                 <button
//                                     type="button"
//                                     className="flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 transition-all hover:bg-muted"
//                                     aria-label="User menu"
//                                 >
//                                     <Avatar className="h-7 w-7">
//                                         <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
//                                             {
//                                                 initials
//                                             }
//                                         </AvatarFallback>
//                                     </Avatar>

//                                     <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
//                                 </button>
//                             </DropdownMenuTrigger>

//                             <DropdownMenuContent
//                                 align="end"
//                                 sideOffset={
//                                     8
//                                 }
//                                 className="w-56 max-w-[90vw] overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg"
//                             >
//                                 {/* USER INFO */}

//                                 <div className="border-b border-border px-4 py-3">
//                                     <p className="truncate text-sm font-semibold text-foreground">
//                                         {
//                                             displayName
//                                         }
//                                     </p>

//                                     <p className="mt-0.5 truncate text-xs text-muted-foreground">
//                                         {
//                                             displayEmail
//                                         }
//                                     </p>

//                                     {currentUser
//                                         ?.role_name && (
//                                             <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
//                                                 {
//                                                     currentUser.role_name
//                                                 }
//                                             </p>
//                                         )}
//                                 </div>

//                                 {/* PROFILE */}

//                                 <DropdownMenuItem className="m-1 cursor-pointer rounded-lg">
//                                     Profile
//                                 </DropdownMenuItem>

//                                 {/* SETTINGS */}

//                                 <DropdownMenuItem className="m-1 cursor-pointer rounded-lg">
//                                     Settings
//                                 </DropdownMenuItem>

//                                 {/* LOGOUT */}

//                                 <DropdownMenuItem
//                                     onSelect={
//                                         handleLogout
//                                     }
//                                     className="m-1 cursor-pointer rounded-lg text-red-600 focus:text-red-600"
//                                 >
//                                     Logout
//                                 </DropdownMenuItem>
//                             </DropdownMenuContent>
//                         </DropdownMenu>

//                         {/* MOBILE SEARCH PANEL */}

//                         {searchOpen && (
//                             <div className="absolute left-0 right-0 top-14 border-b border-border bg-card p-3 shadow-sm sm:hidden">
//                                 <div className="relative">
//                                     <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

//                                     <Input
//                                         autoFocus
//                                         type="search"
//                                         placeholder="Search..."
//                                         className="h-9 w-full bg-muted pl-9 text-sm"
//                                     />
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </header>
//             );
//         }
//     );

// Header.displayName =
//     "Header";




// frontend/components/ui/header.tsx

"use client";

import * as React from "react";

import Link from "next/link";

import {
    usePathname,
    useRouter,
} from "next/navigation";

import {
    Bell,
    ChevronDown,
    Menu,
    PanelRightOpen,
    Search,
} from "lucide-react";

import {
    cn,
} from "@/lib/utils";

import {
    Input,
} from "@/components/ui/input";

import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";

import {
    Button,
} from "@/components/ui/button";

import {
    ThemeDropdown,
} from "@/components/theme-dropdown";

import {
    useDrawer,
} from "@/context/DrawerContext";

import {
    clearAuthStorage,
    type AuthMeData,
} from "@/lib/api";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ======================================================
   TYPES
====================================================== */

export interface HeaderProps
    extends React.HTMLAttributes<HTMLElement> {
    title?: string;

    onMenuClick?: () => void;

    onMobileNavClick?: () => void;

    authUser: AuthMeData;

    useUserShell: boolean;
}

type HeaderNavItem = {
    label: string;
    href: string;
};

/* ======================================================
   HEADER
====================================================== */

export const Header =
    React.forwardRef<
        HTMLElement,
        HeaderProps
    >(
        (
            props,
            ref
        ) => {
            const {
                className,
                title = "",
                onMenuClick,
                onMobileNavClick,
                authUser,
                useUserShell,
                ...rest
            } =
                props;

            const {
                toggle,
            } =
                useDrawer();

            const pathname =
                usePathname();

            const router =
                useRouter();

            /* ======================================================
               AUTH USER
            ====================================================== */

            const userName =
                authUser.full_name ||
                authUser.username ||
                authUser.employee_id;

            const userEmail =
                authUser.email ||
                authUser.employee_id;

            const avatarText =
                getAvatarText(
                    userName
                );

            /* ======================================================
               LOGOUT
            ====================================================== */

            function handleLogout() {
                clearAuthStorage();

                router.replace(
                    "/auth"
                );
            }

            /* ======================================================
               UI STATE
            ====================================================== */

            const [
                activeMenu,
                setActiveMenu,
            ] =
                React.useState<
                    | "notif"
                    | "user"
                    | "theme"
                    | null
                >(
                    null
                );

            const [
                notifications,
                setNotifications,
            ] =
                React.useState([
                    {
                        id: 1,
                        title:
                            "New task assigned",
                        time:
                            "2 min ago",
                        read:
                            false,
                    },
                    {
                        id: 2,
                        title:
                            "Inventory updated",
                        time:
                            "1 hour ago",
                        read:
                            false,
                    },
                    {
                        id: 3,
                        title:
                            "Report ready",
                        time:
                            "Yesterday",
                        read:
                            false,
                    },
                ]);

            const [
                searchOpen,
                setSearchOpen,
            ] =
                React.useState(
                    false
                );

            const unreadCount =
                notifications.filter(
                    (notification) =>
                        !notification.read
                ).length;

            /* ======================================================
               NAVIGATION

               GENERAL USER
               -----------------------------
               Dashboard → own employee page
               Create TT → shared Create TT page

               ADMIN / IT
               -----------------------------
               Dashboard
               Assigned TT
               Create TT
            ====================================================== */

            const navItems =
                React.useMemo<
                    HeaderNavItem[]
                >(
                    () => {
                        if (
                            useUserShell
                        ) {
                            return [
                                {
                                    label:
                                        "Dashboard",
                                    href:
                                        "/dashboard/user",
                                },
                                {
                                    label:
                                        "Create TT",
                                    href:
                                        "/dashboard/operations/create_tt",
                                },
                            ];
                        }

                        return [
                            {
                                label:
                                    "Dashboard",
                                href:
                                    "/dashboard",
                            },
                            {
                                label:
                                    "Assigned TT",
                                href:
                                    "/dashboard/operations/assigned-tt",
                            },
                            {
                                label:
                                    "Create TT",
                                href:
                                    "/dashboard/operations/create_tt",
                            },
                        ];
                    },
                    [
                        useUserShell,
                    ]
                );

            /* ======================================================
               ACTIVE NAV
            ====================================================== */

            function isNavActive(
                item:
                    HeaderNavItem
            ) {
                if (
                    item.href ===
                    "/dashboard"
                ) {
                    return (
                        pathname ===
                        "/dashboard"
                    );
                }

                if (
                    item.href ===
                    "/dashboard/user"
                ) {
                    return (
                        pathname ===
                        "/dashboard/user" ||
                        pathname.startsWith(
                            "/dashboard/user/"
                        )
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

            /* ======================================================
               RENDER
            ====================================================== */

            return (
                <header
                    ref={
                        ref
                    }
                    className={cn(
                        "sticky top-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/95 px-3 text-foreground backdrop-blur-sm sm:px-5",
                        className
                    )}
                    {...rest}
                >
                    {/* ==================================================
                        LEFT
                    ================================================== */}

                    <div className="flex min-w-0 items-center gap-1 sm:gap-3">
                        {/* Mobile navigation */}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 md:hidden"
                            onClick={
                                onMobileNavClick
                            }
                            aria-label="Open navigation"
                        >
                            <Menu className="h-4 w-4" />
                        </Button>

                        <span className="text-sm font-semibold text-foreground md:hidden">
                            ITM
                        </span>

                        {/* Desktop navigation */}

                        <nav className="hidden items-center gap-1 md:flex">
                            {navItems.map(
                                (
                                    item
                                ) => {
                                    const active =
                                        isNavActive(
                                            item
                                        );

                                    return (
                                        <Link
                                            key={
                                                `${item.label}-${item.href}`
                                            }
                                            href={
                                                item.href
                                            }
                                            className={cn(
                                                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                                                active
                                                    ? "bg-primary/10 font-semibold text-primary"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {
                                                item.label
                                            }
                                        </Link>
                                    );
                                }
                            )}
                        </nav>

                        {/* Logout */}

                        <button
                            type="button"
                            onClick={
                                handleLogout
                            }
                            className="px-2 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
                        >
                            Logout
                        </button>
                    </div>

                    {/* ==================================================
                        RIGHT
                    ================================================== */}

                    <div className="flex shrink-0 items-center gap-1">
                        {/* Search */}

                        <div className="relative hidden sm:block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                placeholder="Search..."
                                className="h-8 w-36 border-0 bg-muted pl-8 text-xs focus-visible:ring-1 lg:w-48"
                                type="search"
                            />
                        </div>

                        {/* Mobile search */}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:hidden"
                            onClick={() =>
                                setSearchOpen(
                                    (
                                        current
                                    ) =>
                                        !current
                                )
                            }
                            aria-label="Search"
                        >
                            <Search className="h-4 w-4" />
                        </Button>

                        {/* Right panel toggle */}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden h-8 w-8 lg:flex"
                            onClick={
                                onMenuClick ??
                                toggle
                            }
                            aria-label="Toggle right panel"
                        >
                            <PanelRightOpen className="h-4 w-4" />
                        </Button>

                        {/* Theme */}

                        <ThemeDropdown
                            activeMenu={
                                activeMenu
                            }
                            setActiveMenu={
                                setActiveMenu
                            }
                        />

                        {/* ==================================================
                            NOTIFICATIONS
                        ================================================== */}

                        <DropdownMenu
                            open={
                                activeMenu ===
                                "notif"
                            }
                            onOpenChange={(
                                open
                            ) =>
                                setActiveMenu(
                                    open
                                        ? "notif"
                                        : null
                                )
                            }
                        >
                            <DropdownMenuTrigger
                                asChild
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative h-8 w-8"
                                >
                                    <Bell className="h-4 w-4" />

                                    {unreadCount >
                                        0 && (
                                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                                                {
                                                    unreadCount
                                                }
                                            </span>
                                        )}
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                sideOffset={
                                    8
                                }
                                className="w-72 max-w-[90vw] overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg"
                            >
                                <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
                                    Notifications

                                    <button
                                        type="button"
                                        className="text-xs font-normal text-primary hover:underline"
                                        onClick={() =>
                                            setNotifications(
                                                (
                                                    previous
                                                ) =>
                                                    previous.map(
                                                        (
                                                            notification
                                                        ) => ({
                                                            ...notification,
                                                            read:
                                                                true,
                                                        })
                                                    )
                                            )
                                        }
                                    >
                                        Mark all read
                                    </button>
                                </div>

                                <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                                    {notifications.map(
                                        (
                                            notification
                                        ) => (
                                            <li
                                                key={
                                                    notification.id
                                                }
                                                className={cn(
                                                    "cursor-pointer px-4 py-3 transition-colors hover:bg-muted",
                                                    notification.read &&
                                                    "opacity-60"
                                                )}
                                                onClick={() =>
                                                    setNotifications(
                                                        (
                                                            previous
                                                        ) =>
                                                            previous.map(
                                                                (
                                                                    item
                                                                ) =>
                                                                    item.id ===
                                                                        notification.id
                                                                        ? {
                                                                            ...item,
                                                                            read:
                                                                                true,
                                                                        }
                                                                        : item
                                                            )
                                                    )
                                                }
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    {!notification.read && (
                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                                    )}

                                                    <div
                                                        className={
                                                            notification.read
                                                                ? "pl-4"
                                                                : ""
                                                        }
                                                    >
                                                        <p className="text-sm font-medium text-foreground">
                                                            {
                                                                notification.title
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {
                                                                notification.time
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* ==================================================
                            USER MENU
                        ================================================== */}

                        <DropdownMenu
                            open={
                                activeMenu ===
                                "user"
                            }
                            onOpenChange={(
                                open
                            ) =>
                                setActiveMenu(
                                    open
                                        ? "user"
                                        : null
                                )
                            }
                        >
                            <DropdownMenuTrigger
                                asChild
                            >
                                <button
                                    type="button"
                                    className="flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 transition-all hover:bg-muted"
                                >
                                    <Avatar className="h-7 w-7">
                                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                            {
                                                avatarText
                                            }
                                        </AvatarFallback>
                                    </Avatar>

                                    <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                sideOffset={
                                    8
                                }
                                className="w-64 max-w-[90vw] overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg"
                            >
                                <div className="border-b border-border px-4 py-3">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {
                                            userName
                                        }
                                    </p>

                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                        {
                                            userEmail
                                        }
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-1">
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                            {
                                                authUser.role_name ||
                                                authUser.role_code
                                            }
                                        </span>

                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                            {
                                                authUser.employee_id
                                            }
                                        </span>
                                    </div>
                                </div>

                                <DropdownMenuItem
                                    className="m-1 cursor-pointer rounded-lg"
                                    onSelect={() =>
                                        router.push(
                                            "/dashboard/user"
                                        )
                                    }
                                >
                                    My Dashboard
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onSelect={
                                        handleLogout
                                    }
                                    className="m-1 cursor-pointer rounded-lg text-red-600 focus:text-red-600"
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* ==================================================
                        MOBILE SEARCH PANEL
                    ================================================== */}

                    {searchOpen && (
                        <div className="absolute left-0 right-0 top-14 border-b border-border bg-card p-3 shadow-sm sm:hidden">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    autoFocus
                                    type="search"
                                    placeholder="Search..."
                                    className="h-9 w-full bg-muted pl-9 text-xs"
                                />
                            </div>
                        </div>
                    )}
                </header>
            );
        }
    );

Header.displayName =
    "Header";

/* ======================================================
   AVATAR
====================================================== */

function getAvatarText(
    value:
        | string
        | undefined
        | null
): string {
    const name =
        (
            value ??
            ""
        ).trim();

    if (!name) {
        return "U";
    }

    const words =
        name
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );

    if (
        words.length ===
        1
    ) {
        return words[0]
            .slice(
                0,
                2
            )
            .toUpperCase();
    }

    return `${words[0][0] ?? ""}${words[
        words.length -
        1
        ][0] ?? ""
        }`.toUpperCase();
}