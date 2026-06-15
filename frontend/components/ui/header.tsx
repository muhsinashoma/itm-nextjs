// components/ui/header.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Bell, Menu, ChevronDown, PanelRightOpen } from "lucide-react";
import { ThemeDropdown } from "@/components/theme-dropdown";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDrawer } from "@/context/DrawerContext";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
    title?: string;
    onMenuClick?: () => void;
    onMobileNavClick?: () => void;
    userName?: string;
    userEmail?: string;
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
    (props, ref) => {
        const {
            className,
            title = "",
            onMenuClick,
            onMobileNavClick,
            userName = "Muhsina Akter",
            userEmail = "muhsina.akter@fiberathome.net",
            ...rest
        } = props;

        const { toggle } = useDrawer();
        const pathname = usePathname();

        const [activeMenu, setActiveMenu] = React.useState<"notif" | "user" | "theme" | null>(null);
        const [notifications, setNotifications] = React.useState([
            { id: 1, title: "New task assigned", time: "2 min ago", read: false },
            { id: 2, title: "Inventory updated", time: "1 hour ago", read: false },
            { id: 3, title: "Report ready", time: "Yesterday", read: false },
        ]);
        const [searchOpen, setSearchOpen] = React.useState(false);

        const unreadCount = notifications.filter((n) => !n.read).length;

        const navItems = [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Assigned TT", href: "/dashboard/operations/assigned-tt" },
            { label: "Create TT", href: "/dashboard/operations/create_tt" },
            { label: "Logout", href: "/auth" },
        ];

        return (
            <header
                ref={ref}
                className={cn(
                    "sticky top-0 z-50 h-14 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm text-foreground px-3 sm:px-5 gap-2",
                    className
                )}
                {...rest}
            >
                {/* Left: mobile hamburger + nav links */}
                <div className="flex items-center gap-1 sm:gap-3 min-w-0">
                    {/* Mobile menu button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden shrink-0 h-8 w-8"
                        onClick={onMobileNavClick}
                        aria-label="Open navigation"
                    >
                        <Menu className="h-4 w-4" />
                    </Button>

                    {/* Logo text on mobile */}
                    <span className="md:hidden font-semibold text-sm text-foreground">ITM</span>

                    {/* Desktop nav links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            const isLogout = item.label === "Logout";
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                        isLogout
                                            ? "text-red-500 hover:bg-red-50 hover:text-red-600"
                                            : isActive
                                                ? "bg-primary/10 text-primary font-semibold"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Search — collapsible on mobile */}
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search..."
                            className="w-36 lg:w-48 pl-8 h-8 text-xs bg-muted border-0 focus-visible:ring-1"
                            type="search"
                        />
                    </div>

                    {/* Mobile search toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden h-8 w-8"
                        onClick={() => setSearchOpen(!searchOpen)}
                        aria-label="Search"
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    {/* Right sidebar toggle — desktop only */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden lg:flex h-8 w-8"
                        onClick={toggle}
                        aria-label="Toggle right panel"
                    >
                        <PanelRightOpen className="h-4 w-4" />
                    </Button>

                    {/* Theme Dropdown */}
                    <ThemeDropdown activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

                    {/* Notifications */}
                    <DropdownMenu
                        open={activeMenu === "notif"}
                        onOpenChange={(open) => setActiveMenu(open ? "notif" : null)}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-8 w-8">
                                <Bell className="h-4 w-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="w-72 max-w-[90vw] bg-popover border border-border rounded-xl shadow-lg p-0 overflow-hidden"
                        >
                            <div className="px-4 py-3 font-semibold text-sm text-foreground border-b border-border flex justify-between items-center">
                                Notifications
                                <button
                                    className="text-xs text-primary hover:underline font-normal"
                                    onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                                >
                                    Mark all read
                                </button>
                            </div>
                            <ul className="divide-y divide-border max-h-72 overflow-y-auto">
                                {notifications.map((notif) => (
                                    <li
                                        key={notif.id}
                                        className={`px-4 py-3 cursor-pointer hover:bg-muted transition-colors ${notif.read ? "opacity-60" : ""}`}
                                        onClick={() => setNotifications((prev) =>
                                            prev.map((n) => n.id === notif.id ? { ...n, read: true } : n)
                                        )}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            {!notif.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                                            <div className={notif.read ? "pl-4" : ""}>
                                                <p className="text-sm text-foreground font-medium">{notif.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Avatar */}
                    <DropdownMenu
                        open={activeMenu === "user"}
                        onOpenChange={(open) => setActiveMenu(open ? "user" : null)}
                    >
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-1.5 cursor-pointer rounded-lg px-1.5 py-1 hover:bg-muted transition-all"
                            >
                                <Avatar className="h-7 w-7">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">MA</AvatarFallback>
                                </Avatar>
                                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="w-56 max-w-[90vw] bg-popover border border-border rounded-xl shadow-lg p-0 overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-border">
                                <p className="text-sm font-semibold text-foreground">{userName}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
                            </div>
                            <DropdownMenuItem className="m-1 rounded-lg">Profile</DropdownMenuItem>
                            <DropdownMenuItem className="m-1 rounded-lg">Settings</DropdownMenuItem>
                            <DropdownMenuItem className="m-1 rounded-lg text-red-600 focus:text-red-600">Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        );
    }
);

Header.displayName = "Header";
