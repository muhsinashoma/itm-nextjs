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
//             .slice(0, 2)
//             .toUpperCase();
//     }

//     return (
//         parts[0][0] +
//         parts[
//         parts.length - 1
//         ][0]
//     ).toUpperCase();
// }

// export const Header =
//     React.forwardRef<
//         HTMLElement,
//         HeaderProps
//     >(
//         (
//             props,
//             ref
//         ) => {
//             const {
//                 className,
//                 onMobileNavClick,
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

//             const isGeneralUser =
//                 currentUser?.role_code ===
//                 "GENERAL_USER";

//             const isUserArea =
//                 pathname ===
//                 "/dashboard/user" ||
//                 pathname.startsWith(
//                     "/dashboard/user/"
//                 );

//             const displayName =
//                 currentUser
//                     ?.full_name
//                     ?.trim() ||
//                 currentUser
//                     ?.username
//                     ?.trim() ||
//                 "ITM User";

//             const displayEmail =
//                 currentUser
//                     ?.email
//                     ?.trim() ||
//                 "No email available";

//             const initials =
//                 getInitials(
//                     displayName
//                 );

//             /*
//              * GENERAL_USER
//              *
//              * Dashboard -> /dashboard/user
//              * Assigned TT removed
//              *
//              * Staff roles retain the existing
//              * operational navigation.
//              */
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

//             function handleLogout() {
//                 clearAuthStorage();

//                 router.replace(
//                     "/auth"
//                 );
//             }

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
//                     {/* LEFT */}

//                     <div className="flex min-w-0 items-center gap-1 sm:gap-3">
//                         <Button
//                             variant="ghost"
//                             size="icon"
//                             className="h-8 w-8 shrink-0 md:hidden"
//                             onClick={
//                                 onMobileNavClick
//                             }
//                             aria-label="Open navigation"
//                         >
//                             <Menu className="h-4 w-4" />
//                         </Button>

//                         <span className="text-sm font-semibold text-foreground md:hidden">
//                             ITM
//                         </span>

//                         <nav className="hidden items-center gap-1 md:flex">
//                             {navItems.map(
//                                 (
//                                     item
//                                 ) => {
//                                     const isActive =
//                                         item.href ===
//                                             "/dashboard/user"
//                                             ? isUserArea
//                                             : pathname ===
//                                             item.href ||
//                                             pathname.startsWith(
//                                                 `${item.href}/`
//                                             );

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
//                                                 isActive
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

//                         <button
//                             type="button"
//                             onClick={
//                                 handleLogout
//                             }
//                             className="ml-1 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
//                         >
//                             Logout
//                         </button>
//                     </div>

//                     {/* RIGHT */}

//                     <div className="flex shrink-0 items-center gap-1">
//                         <div className="relative hidden sm:block">
//                             <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

//                             <Input
//                                 placeholder="Search..."
//                                 className="h-8 w-36 border-0 bg-muted pl-8 text-xs focus-visible:ring-1 lg:w-48"
//                                 type="search"
//                             />
//                         </div>

//                         <Button
//                             variant="ghost"
//                             size="icon"
//                             className="h-8 w-8 sm:hidden"
//                             onClick={() =>
//                                 setSearchOpen(
//                                     (
//                                         value
//                                     ) =>
//                                         !value
//                                 )
//                             }
//                             aria-label="Search"
//                         >
//                             <Search className="h-4 w-4" />
//                         </Button>

//                         {/* Keep right sidebar toggle.
//                             On user dashboard this opens
//                             Downstream Device + TT History. */}
//                         <Button
//                             variant="ghost"
//                             size="icon"
//                             className="hidden h-8 w-8 lg:flex"
//                             onClick={
//                                 toggle
//                             }
//                             aria-label="Toggle right panel"
//                         >
//                             <PanelRightOpen className="h-4 w-4" />
//                         </Button>

//                         <ThemeDropdown
//                             activeMenu={
//                                 activeMenu
//                             }
//                             setActiveMenu={
//                                 setActiveMenu
//                             }
//                         />

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
//                                 <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
//                                     Notifications

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

//                                                     <div>
//                                                         <p className="text-sm font-medium text-foreground">
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
//                                 <div className="border-b border-border px-4 py-3">
//                                     <p className="text-sm font-semibold text-foreground">
//                                         {
//                                             displayName
//                                         }
//                                     </p>

//                                     <p className="mt-0.5 text-xs text-muted-foreground">
//                                         {
//                                             displayEmail
//                                         }
//                                     </p>
//                                 </div>

//                                 <DropdownMenuItem className="m-1 rounded-lg">
//                                     Profile
//                                 </DropdownMenuItem>

//                                 <DropdownMenuItem className="m-1 rounded-lg">
//                                     Settings
//                                 </DropdownMenuItem>

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
//                     </div>
//                 </header>
//             );
//         }
//     );

// Header.displayName =
//     "Header";




// // // frontend/components/ui/header.tsx
// // "use client";

// // import * as React from "react";
// // import { cn } from "@/lib/utils";
// // import { Input } from "@/components/ui/input";
// // import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// // import { Button } from "@/components/ui/button";
// // import { Search, Bell, Menu, ChevronDown, PanelRightOpen } from "lucide-react";
// // import { ThemeDropdown } from "@/components/theme-dropdown";
// // import Link from "next/link";
// // import { usePathname, useRouter, } from "next/navigation";
// // import { useDrawer } from "@/context/DrawerContext";
// // import { clearAuthStorage, } from "@/lib/api";
// // import {
// //     DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
// // } from "@/components/ui/dropdown-menu";

// // export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
// //     title?: string;
// //     onMenuClick?: () => void;
// //     onMobileNavClick?: () => void;
// //     userName?: string;
// //     userEmail?: string;
// // }

// // export const Header = React.forwardRef<HTMLElement, HeaderProps>(
// //     (props, ref) => {
// //         const {
// //             className,
// //             title = "",
// //             onMenuClick,
// //             onMobileNavClick,
// //             userName = "Muhsina Akter",
// //             userEmail = "muhsina.akter@fiberathome.net",
// //             ...rest
// //         } = props;

// //         const { toggle } = useDrawer();
// //         const pathname = usePathname();

// //         const router =
// //             useRouter();

// //         function handleLogout() {
// //             /*
// //              * Clear authentication synchronously first.
// //              *
// //              * This is important because /auth checks for an
// //              * existing token as soon as it mounts.
// //              */
// //             clearAuthStorage();

// //             /*
// //              * Use client-side replace for a fast/smooth logout.
// //              *
// //              * Do not use:
// //              * window.location.href = "/auth"
// //              *
// //              * for normal manual logout.
// //              */
// //             router.replace(
// //                 "/auth"
// //             );
// //         }

// //         const [activeMenu, setActiveMenu] = React.useState<"notif" | "user" | "theme" | null>(null);
// //         const [notifications, setNotifications] = React.useState([
// //             { id: 1, title: "New task assigned", time: "2 min ago", read: false },
// //             { id: 2, title: "Inventory updated", time: "1 hour ago", read: false },
// //             { id: 3, title: "Report ready", time: "Yesterday", read: false },
// //         ]);
// //         const [searchOpen, setSearchOpen] = React.useState(false);

// //         const unreadCount = notifications.filter((n) => !n.read).length;

      
// //         const navItems = [
// //             {
// //                 label: "Dashboard",
// //                 href: "/dashboard",
// //             },
// //             {
// //                 label: "Assigned TT",
// //                 href: "/dashboard/operations/assigned-tt",
// //             },
// //             {
// //                 label: "Create TT",
// //                 href: "/dashboard/operations/create_tt",
// //             },
// //         ];

// //         return (
// //             <header
// //                 ref={ref}
// //                 className={cn(
// //                     "sticky top-0 z-50 h-14 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm text-foreground px-3 sm:px-5 gap-2",
// //                     className
// //                 )}
// //                 {...rest}
// //             >
// //                 {/* Left: mobile hamburger + nav links */}
// //                 <div className="flex items-center gap-1 sm:gap-3 min-w-0">
// //                     {/* Mobile menu button */}
// //                     <Button
// //                         variant="ghost"
// //                         size="icon"
// //                         className="md:hidden shrink-0 h-8 w-8"
// //                         onClick={onMobileNavClick}
// //                         aria-label="Open navigation"
// //                     >
// //                         <Menu className="h-4 w-4" />
// //                     </Button>

// //                     {/* Logo text on mobile */}
// //                     <span className="md:hidden font-semibold text-sm text-foreground">ITM</span>

// //                     {/* Desktop nav links */}
// //                     <nav className="hidden md:flex items-center gap-1">
// //                         {navItems.map((item) => {
// //                             const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
// //                             const isLogout = item.label === "Logout";
// //                             return (
// //                                 <Link
// //                                     key={item.href}
// //                                     href={item.href}
// //                                     className={cn(
// //                                         "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
// //                                         isLogout
// //                                             ? "text-red-500 hover:bg-red-50 hover:text-red-600"
// //                                             : isActive
// //                                                 ? "bg-primary/10 text-primary font-semibold"
// //                                                 : "text-muted-foreground hover:text-foreground hover:bg-muted"
// //                                     )}
// //                                 >
// //                                     {item.label}
// //                                 </Link>
// //                             );
// //                         })}
// //                     </nav>

// //                     <button
// //                         type="button"
// //                         onClick={
// //                             handleLogout
// //                         }
// //                         className="text-red-600 hover:text-red-700 transition-colors"
// //                     >
// //                         Logout
// //                     </button>
// //                 </div>

// //                 {/* Right: actions */}
// //                 <div className="flex items-center gap-1 shrink-0">
// //                     {/* Search — collapsible on mobile */}
// //                     <div className="relative hidden sm:block">
// //                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
// //                         <Input
// //                             placeholder="Search..."
// //                             className="w-36 lg:w-48 pl-8 h-8 text-xs bg-muted border-0 focus-visible:ring-1"
// //                             type="search"
// //                         />
// //                     </div>

// //                     {/* Mobile search toggle */}
// //                     <Button
// //                         variant="ghost"
// //                         size="icon"
// //                         className="sm:hidden h-8 w-8"
// //                         onClick={() => setSearchOpen(!searchOpen)}
// //                         aria-label="Search"
// //                     >
// //                         <Search className="h-4 w-4" />
// //                     </Button>

// //                     {/* Right sidebar toggle — desktop only */}
// //                     <Button
// //                         variant="ghost"
// //                         size="icon"
// //                         className="hidden lg:flex h-8 w-8"
// //                         onClick={toggle}
// //                         aria-label="Toggle right panel"
// //                     >
// //                         <PanelRightOpen className="h-4 w-4" />
// //                     </Button>

// //                     {/* Theme Dropdown */}
// //                     <ThemeDropdown activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

// //                     {/* Notifications */}
// //                     <DropdownMenu
// //                         open={activeMenu === "notif"}
// //                         onOpenChange={(open) => setActiveMenu(open ? "notif" : null)}
// //                     >
// //                         <DropdownMenuTrigger asChild>
// //                             <Button variant="ghost" size="icon" className="relative h-8 w-8">
// //                                 <Bell className="h-4 w-4" />
// //                                 {unreadCount > 0 && (
// //                                     <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full">
// //                                         {unreadCount}
// //                                     </span>
// //                                 )}
// //                             </Button>
// //                         </DropdownMenuTrigger>
// //                         <DropdownMenuContent
// //                             align="end"
// //                             sideOffset={8}
// //                             className="w-72 max-w-[90vw] bg-popover border border-border rounded-xl shadow-lg p-0 overflow-hidden"
// //                         >
// //                             <div className="px-4 py-3 font-semibold text-sm text-foreground border-b border-border flex justify-between items-center">
// //                                 Notifications
// //                                 <button
// //                                     className="text-xs text-primary hover:underline font-normal"
// //                                     onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
// //                                 >
// //                                     Mark all read
// //                                 </button>
// //                             </div>
// //                             <ul className="divide-y divide-border max-h-72 overflow-y-auto">
// //                                 {notifications.map((notif) => (
// //                                     <li
// //                                         key={notif.id}
// //                                         className={`px-4 py-3 cursor-pointer hover:bg-muted transition-colors ${notif.read ? "opacity-60" : ""}`}
// //                                         onClick={() => setNotifications((prev) =>
// //                                             prev.map((n) => n.id === notif.id ? { ...n, read: true } : n)
// //                                         )}
// //                                     >
// //                                         <div className="flex items-start gap-2.5">
// //                                             {!notif.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
// //                                             <div className={notif.read ? "pl-4" : ""}>
// //                                                 <p className="text-sm text-foreground font-medium">{notif.title}</p>
// //                                                 <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
// //                                             </div>
// //                                         </div>
// //                                     </li>
// //                                 ))}
// //                             </ul>
// //                         </DropdownMenuContent>
// //                     </DropdownMenu>

// //                     {/* Avatar */}
// //                     <DropdownMenu
// //                         open={activeMenu === "user"}
// //                         onOpenChange={(open) => setActiveMenu(open ? "user" : null)}
// //                     >
// //                         <DropdownMenuTrigger asChild>
// //                             <button
// //                                 type="button"
// //                                 className="flex items-center gap-1.5 cursor-pointer rounded-lg px-1.5 py-1 hover:bg-muted transition-all"
// //                             >
// //                                 <Avatar className="h-7 w-7">
// //                                     <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">MA</AvatarFallback>
// //                                 </Avatar>
// //                                 <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
// //                             </button>
// //                         </DropdownMenuTrigger>
// //                         <DropdownMenuContent
// //                             align="end"
// //                             sideOffset={8}
// //                             className="w-56 max-w-[90vw] bg-popover border border-border rounded-xl shadow-lg p-0 overflow-hidden"
// //                         >
// //                             <div className="px-4 py-3 border-b border-border">
// //                                 <p className="text-sm font-semibold text-foreground">{userName}</p>
// //                                 <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
// //                             </div>
// //                             <DropdownMenuItem className="m-1 rounded-lg">Profile</DropdownMenuItem>
// //                             <DropdownMenuItem className="m-1 rounded-lg">Settings</DropdownMenuItem>
// //                             {/* <DropdownMenuItem className="m-1 rounded-lg text-red-600 focus:text-red-600">Logout</DropdownMenuItem> */}
// //                             <DropdownMenuItem
// //                                 onSelect={
// //                                     handleLogout
// //                                 }
// //                                 className="m-1 cursor-pointer rounded-lg text-red-600 focus:text-red-600"
// //                             >
// //                                 Logout
// //                             </DropdownMenuItem>

// //                         </DropdownMenuContent>
// //                     </DropdownMenu>
// //                 </div>
// //             </header>
// //         );
// //     }
// // );

// // Header.displayName = "Header";



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
    getUser,
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

    userName?: string;

    userEmail?: string;
}

type NavItem = {
    label: string;
    href: string;
};

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
        return "IT";
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
            /*
             * IMPORTANT:
             *
             * Custom component props are explicitly
             * removed here so they are NOT forwarded
             * to the native <header> element.
             *
             * This fixes:
             *
             * Unknown event handler property
             * `onMenuClick`
             */
            const {
                className,
                title,
                onMenuClick,
                onMobileNavClick,
                userName,
                userEmail,
                ...rest
            } = props;

            const router =
                useRouter();

            const pathname =
                usePathname();

            const {
                toggle,
            } =
                useDrawer();

            const currentUser =
                getUser();

            /* ==================================================
               ROLE
            ================================================== */

            const isGeneralUser =
                currentUser
                    ?.role_code ===
                "GENERAL_USER";

            const isUserDashboard =
                pathname ===
                "/dashboard/user" ||
                pathname.startsWith(
                    "/dashboard/user/"
                );

            /* ==================================================
               USER INFORMATION
            ================================================== */

            const displayName =
                userName?.trim() ||
                currentUser
                    ?.full_name
                    ?.trim() ||
                currentUser
                    ?.username
                    ?.trim() ||
                "ITM User";

            const displayEmail =
                userEmail?.trim() ||
                currentUser
                    ?.email
                    ?.trim() ||
                "No email available";

            const initials =
                getInitials(
                    displayName
                );

            /* ==================================================
               NAVIGATION

               GENERAL_USER:
               Dashboard -> /dashboard/user
               Create TT
               Logout

               Assigned TT is NOT shown.

               Staff users:
               Dashboard
               Assigned TT
               Create TT
            ================================================== */

            const navItems: NavItem[] =
                isGeneralUser
                    ? [
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
                    ]
                    : [
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

            /* ==================================================
               LOCAL UI STATE
            ================================================== */

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
                    (
                        item
                    ) =>
                        !item.read
                ).length;

            /* ==================================================
               LOGOUT
            ================================================== */

            function handleLogout() {
                clearAuthStorage();

                router.replace(
                    "/auth"
                );
            }

            /* ==================================================
               ACTIVE NAVIGATION
            ================================================== */

            function isNavActive(
                item: NavItem
            ): boolean {
                /*
                 * General User dashboard also stays active
                 * for nested user pages such as:
                 *
                 * /dashboard/user/device-history
                 */
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

                /*
                 * Main staff dashboard should only match
                 * the exact /dashboard page.
                 *
                 * Otherwise every /dashboard/... page
                 * would make Dashboard look active.
                 */
                if (
                    item.href ===
                    "/dashboard"
                ) {
                    return (
                        pathname ===
                        "/dashboard"
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

            /* ==================================================
               RENDER
            ================================================== */

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
                    {/* ==========================================
                        LEFT SIDE
                    ========================================== */}

                    <div className="flex min-w-0 items-center gap-1 sm:gap-3">
                        {/* MOBILE MENU */}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 md:hidden"
                            onClick={
                                onMobileNavClick ??
                                onMenuClick
                            }
                            aria-label="Open navigation"
                        >
                            <Menu className="h-4 w-4" />
                        </Button>

                        {/* MOBILE TITLE */}

                        <span className="max-w-[120px] truncate text-sm font-semibold text-foreground md:hidden">
                            {title ||
                                "ITM"}
                        </span>

                        {/* DESKTOP NAVIGATION */}

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
                                                item.href
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

                        {/* LOGOUT */}

                        <button
                            type="button"
                            onClick={
                                handleLogout
                            }
                            className="ml-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                            Logout
                        </button>
                    </div>

                    {/* ==========================================
                        RIGHT SIDE
                    ========================================== */}

                    <div className="flex shrink-0 items-center gap-1">
                        {/* DESKTOP SEARCH */}

                        <div className="relative hidden sm:block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                placeholder="Search..."
                                className="h-8 w-36 border-0 bg-muted pl-8 text-xs focus-visible:ring-1 lg:w-48"
                                type="search"
                            />
                        </div>

                        {/* MOBILE SEARCH BUTTON */}

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

                        {/* RIGHT SIDEBAR TOGGLE */}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden h-8 w-8 lg:flex"
                            onClick={
                                toggle
                            }
                            aria-label={
                                isUserDashboard
                                    ? "Toggle employee information panel"
                                    : "Toggle right panel"
                            }
                        >
                            <PanelRightOpen className="h-4 w-4" />
                        </Button>

                        {/* THEME */}

                        <ThemeDropdown
                            activeMenu={
                                activeMenu
                            }
                            setActiveMenu={
                                setActiveMenu
                            }
                        />

                        {/* ======================================
                            NOTIFICATIONS
                        ====================================== */}

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
                                    aria-label="Notifications"
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
                                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                    <span className="text-sm font-semibold text-foreground">
                                        Notifications
                                    </span>

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
                                                            item
                                                        ) => ({
                                                            ...item,
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

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-foreground">
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

                        {/* ======================================
                            USER MENU
                        ====================================== */}

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
                                    aria-label="User menu"
                                >
                                    <Avatar className="h-7 w-7">
                                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                            {
                                                initials
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
                                className="w-56 max-w-[90vw] overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg"
                            >
                                {/* USER INFO */}

                                <div className="border-b border-border px-4 py-3">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {
                                            displayName
                                        }
                                    </p>

                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                        {
                                            displayEmail
                                        }
                                    </p>

                                    {currentUser
                                        ?.role_name && (
                                            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                                {
                                                    currentUser.role_name
                                                }
                                            </p>
                                        )}
                                </div>

                                {/* PROFILE */}

                                <DropdownMenuItem className="m-1 cursor-pointer rounded-lg">
                                    Profile
                                </DropdownMenuItem>

                                {/* SETTINGS */}

                                <DropdownMenuItem className="m-1 cursor-pointer rounded-lg">
                                    Settings
                                </DropdownMenuItem>

                                {/* LOGOUT */}

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

                        {/* MOBILE SEARCH PANEL */}

                        {searchOpen && (
                            <div className="absolute left-0 right-0 top-14 border-b border-border bg-card p-3 shadow-sm sm:hidden">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                    <Input
                                        autoFocus
                                        type="search"
                                        placeholder="Search..."
                                        className="h-9 w-full bg-muted pl-9 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </header>
            );
        }
    );

Header.displayName =
    "Header";