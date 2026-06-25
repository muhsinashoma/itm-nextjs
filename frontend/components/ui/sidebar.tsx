



"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    AlertTriangle,
    BadgeCheck,
    Boxes,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Database,
    FileBarChart,
    FileText,
    History,
    Laptop,
    Layers,
    LayoutList,
    ListChecks,
    MonitorSmartphone,
    Plus,
    ShieldAlert,
    Trash2,
    Users,
    Wrench,
    type LucideIcon,
} from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Accent =
    | "blue"
    | "indigo"
    | "rose"
    | "emerald"
    | "amber"
    | "cyan"
    | "orange"
    | "violet"
    | "fuchsia"
    | "slate"
    | "teal";

type Child = {
    title: string;
    href: string;
    icon: LucideIcon;
};

type Menu = {
    title: string;
    icon: LucideIcon;
    accent: Accent;
    children?: Child[];
};

type MenuGroup = {
    label: string;
    accent: Accent;
    items: Menu[];
};

const menuGroups: MenuGroup[] = [
    {
        label: "Inventory",
        accent: "blue",
        items: [
            {
                title: "Stock",
                icon: Boxes,
                accent: "blue",
                children: [
                    {
                        title: "Asset Devices",
                        href: "/dashboard/assets/devices",
                        icon: MonitorSmartphone,
                    },
                    {
                        title: "Stock Entry",
                        href: "/dashboard/stock/stock-entry",
                        icon: Plus,
                    },
                    {
                        title: "All Device Status",
                        href: "/dashboard/stock/all-status",
                        icon: LayoutList,
                    },
                ],
            },
            {
                title: "Assigned Assets",
                icon: Layers,
                accent: "indigo",
                children: [
                    {
                        title: "Employee Asset List",
                        href: "/dashboard/operations/emp-assets-list",
                        icon: Users,
                    },
                ],
            },
            {
                title: "Non-Operational",
                icon: Trash2,
                accent: "rose",
                children: [
                    {
                        title: "All Non-Operational",
                        href: "/dashboard/reports/non-operational",
                        icon: ShieldAlert,
                    },
                ],
            },
        ],
    },
    {
        label: "Operations",
        accent: "emerald",
        items: [
            {
                title: "Active Employee",
                icon: Users,
                accent: "emerald",
                children: [
                    {
                        title: "Employee List",
                        href: "/dashboard/active-employee",
                        icon: ListChecks,
                    },
                ],
            },
            {
                title: "Service & Warranty",
                icon: Wrench,
                accent: "amber",
                children: [
                    {
                        title: "Service Claims",
                        href: "/dashboard/service-warranty/service-claims",
                        icon: Wrench,
                    },
                    {
                        title: "Warranty Claims",
                        href: "/dashboard/service-warranty/warranty-claims",
                        icon: BadgeCheck,
                    },
                ],
            },
            {
                title: "Device Clearance",
                icon: Laptop,
                accent: "cyan",
                children: [
                    {
                        title: "Clearance Form",
                        href: "/dashboard/device-clearance/clearance-form",
                        icon: ClipboardList,
                    },
                    {
                        title: "Clearance List",
                        href: "/dashboard/device-clearance/clearance-list",
                        icon: FileText,
                    },
                ],
            },
            {
                title: "Urgent Task",
                icon: AlertTriangle,
                accent: "orange",
                children: [
                    {
                        title: "Create Task",
                        href: "/dashboard/urgent/create",
                        icon: Plus,
                    },
                    {
                        title: "Task List",
                        href: "/dashboard/urgent/list",
                        icon: ListChecks,
                    },
                ],
            },
        ],
    },
    {
        label: "Admin",
        accent: "violet",
        items: [
            {
                title: "Add All Item",
                icon: ClipboardList,
                accent: "violet",
                children: [
                    {
                        title: "Add Data",
                        href: "/dashboard/add_item/add_list",
                        icon: Plus,
                    },
                ],
            },
            {
                title: "Master Data",
                icon: Database,
                accent: "fuchsia",
                children: [
                    {
                        title: "Reference Data",
                        href: "/dashboard/master-data",
                        icon: Database,
                    },
                ],
            },
            {
                title: "Lifecycle Actions",
                icon: History,
                accent: "slate",
                children: [
                    {
                        title: "Lifecycle History",
                        href: "/dashboard/lifecycle/lifecycle-history",
                        icon: History,
                    },
                ],
            },
            {
                title: "Reports",
                icon: FileBarChart,
                accent: "teal",
                children: [
                    {
                        title: "Asset Lifecycle",
                        href: "/dashboard/device-reports/asset-lifecycle",
                        icon: MonitorSmartphone,
                    },
                    {
                        title: "Stock Status",
                        href: "/dashboard/device-reports/stock-status",
                        icon: Boxes,
                    },
                    {
                        title: "Warranty & Service",
                        href: "/dashboard/device-reports/warranty-service",
                        icon: BadgeCheck,
                    },
                    {
                        title: "TT Metrics",
                        href: "/dashboard/device-reports/tt-metrics",
                        icon: FileBarChart,
                    },
                ],
            },
        ],
    },
];

const accentStyles: Record<
    Accent,
    {
        dot: string;
        section: string;
        iconBox: string;
        activeBg: string;
        activeText: string;
        activeIcon: string;
        line: string;
        childActiveBg: string;
        childActiveText: string;
        childActiveIcon: string;
    }
> = {
    blue: {
        dot: "bg-blue-500",
        section: "text-blue-600",
        iconBox: "bg-blue-50 text-blue-600",
        activeBg: "bg-blue-50",
        activeText: "text-blue-700",
        activeIcon: "bg-blue-600 text-white",
        line: "border-blue-200",
        childActiveBg: "bg-blue-50",
        childActiveText: "text-blue-700",
        childActiveIcon: "bg-blue-600 text-white",
    },
    indigo: {
        dot: "bg-indigo-500",
        section: "text-indigo-600",
        iconBox: "bg-indigo-50 text-indigo-600",
        activeBg: "bg-indigo-50",
        activeText: "text-indigo-700",
        activeIcon: "bg-indigo-600 text-white",
        line: "border-indigo-200",
        childActiveBg: "bg-indigo-50",
        childActiveText: "text-indigo-700",
        childActiveIcon: "bg-indigo-600 text-white",
    },
    rose: {
        dot: "bg-rose-500",
        section: "text-rose-600",
        iconBox: "bg-rose-50 text-rose-600",
        activeBg: "bg-rose-50",
        activeText: "text-rose-700",
        activeIcon: "bg-rose-600 text-white",
        line: "border-rose-200",
        childActiveBg: "bg-rose-50",
        childActiveText: "text-rose-700",
        childActiveIcon: "bg-rose-600 text-white",
    },
    emerald: {
        dot: "bg-emerald-500",
        section: "text-emerald-600",
        iconBox: "bg-emerald-50 text-emerald-600",
        activeBg: "bg-emerald-50",
        activeText: "text-emerald-700",
        activeIcon: "bg-emerald-600 text-white",
        line: "border-emerald-200",
        childActiveBg: "bg-emerald-50",
        childActiveText: "text-emerald-700",
        childActiveIcon: "bg-emerald-600 text-white",
    },
    amber: {
        dot: "bg-amber-500",
        section: "text-amber-600",
        iconBox: "bg-amber-50 text-amber-600",
        activeBg: "bg-amber-50",
        activeText: "text-amber-700",
        activeIcon: "bg-amber-500 text-white",
        line: "border-amber-200",
        childActiveBg: "bg-amber-50",
        childActiveText: "text-amber-700",
        childActiveIcon: "bg-amber-500 text-white",
    },
    cyan: {
        dot: "bg-cyan-500",
        section: "text-cyan-600",
        iconBox: "bg-cyan-50 text-cyan-600",
        activeBg: "bg-cyan-50",
        activeText: "text-cyan-700",
        activeIcon: "bg-cyan-600 text-white",
        line: "border-cyan-200",
        childActiveBg: "bg-cyan-50",
        childActiveText: "text-cyan-700",
        childActiveIcon: "bg-cyan-600 text-white",
    },
    orange: {
        dot: "bg-orange-500",
        section: "text-orange-600",
        iconBox: "bg-orange-50 text-orange-600",
        activeBg: "bg-orange-50",
        activeText: "text-orange-700",
        activeIcon: "bg-orange-600 text-white",
        line: "border-orange-200",
        childActiveBg: "bg-orange-50",
        childActiveText: "text-orange-700",
        childActiveIcon: "bg-orange-600 text-white",
    },
    violet: {
        dot: "bg-violet-500",
        section: "text-violet-600",
        iconBox: "bg-violet-50 text-violet-600",
        activeBg: "bg-violet-50",
        activeText: "text-violet-700",
        activeIcon: "bg-violet-600 text-white",
        line: "border-violet-200",
        childActiveBg: "bg-violet-50",
        childActiveText: "text-violet-700",
        childActiveIcon: "bg-violet-600 text-white",
    },
    fuchsia: {
        dot: "bg-fuchsia-500",
        section: "text-fuchsia-600",
        iconBox: "bg-fuchsia-50 text-fuchsia-600",
        activeBg: "bg-fuchsia-50",
        activeText: "text-fuchsia-700",
        activeIcon: "bg-fuchsia-600 text-white",
        line: "border-fuchsia-200",
        childActiveBg: "bg-fuchsia-50",
        childActiveText: "text-fuchsia-700",
        childActiveIcon: "bg-fuchsia-600 text-white",
    },
    slate: {
        dot: "bg-slate-500",
        section: "text-slate-600",
        iconBox: "bg-slate-100 text-slate-600",
        activeBg: "bg-slate-100",
        activeText: "text-slate-800",
        activeIcon: "bg-slate-700 text-white",
        line: "border-slate-200",
        childActiveBg: "bg-slate-100",
        childActiveText: "text-slate-800",
        childActiveIcon: "bg-slate-700 text-white",
    },
    teal: {
        dot: "bg-teal-500",
        section: "text-teal-600",
        iconBox: "bg-teal-50 text-teal-600",
        activeBg: "bg-teal-50",
        activeText: "text-teal-700",
        activeIcon: "bg-teal-600 text-white",
        line: "border-teal-200",
        childActiveBg: "bg-teal-50",
        childActiveText: "text-teal-700",
        childActiveIcon: "bg-teal-600 text-white",
    },
};

interface SidebarProps {
    onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
    const pathname = usePathname();

    const [open, setOpen] = useState<string | null>(() => {
        for (const group of menuGroups) {
            for (const item of group.items) {
                const active = item.children?.some(
                    (child) =>
                        pathname === child.href ||
                        pathname.startsWith(`${child.href}/`)
                );

                if (active) return item.title;
            }
        }

        return null;
    });

    return (
        <aside className="flex h-full w-full flex-col bg-card text-foreground">
            {/* Logo */}
            <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-xs font-bold text-primary">IT</span>
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                        ITM Portal
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        Fiber@Home Ltd.
                    </p>
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto px-2 py-2">
                {menuGroups.map((group) => {
                    const groupStyle = accentStyles[group.accent];

                    return (
                        <section key={group.label} className="mb-3">
                            <div className="mb-1 flex items-center gap-1.5 px-2.5">
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${groupStyle.dot}`}
                                />
                                <p
                                    className={`text-[9px] font-bold uppercase tracking-[0.14em] ${groupStyle.section}`}
                                >
                                    {group.label}
                                </p>
                            </div>

                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const style = accentStyles[item.accent];
                                    const RootIcon = item.icon;

                                    const isParentActive =
                                        item.children?.some(
                                            (child) =>
                                                pathname === child.href ||
                                                pathname.startsWith(
                                                    `${child.href}/`
                                                )
                                        ) ?? false;

                                    const isExpanded = open === item.title;

                                    return (
                                        <div key={item.title}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpen(
                                                        isExpanded
                                                            ? null
                                                            : item.title
                                                    )
                                                }
                                                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${isParentActive
                                                    ? `${style.activeBg} ${style.activeText}`
                                                    : "text-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                <span className="flex min-w-0 items-center gap-2">
                                                    <span
                                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${isParentActive
                                                            ? style.activeIcon
                                                            : style.iconBox
                                                            }`}
                                                    >
                                                        <RootIcon className="h-3.5 w-3.5" />
                                                    </span>

                                                    <span className="truncate">
                                                        {item.title}
                                                    </span>
                                                </span>

                                                <span className="ml-2 shrink-0 text-muted-foreground">
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    )}
                                                </span>
                                            </button>

                                            {item.children && isExpanded && (
                                                <div
                                                    className={`ml-5 mt-0.5 space-y-0.5 border-l pl-2.5 ${style.line}`}
                                                >
                                                    {item.children.map(
                                                        (child) => {
                                                            const ChildIcon =
                                                                child.icon;

                                                            const isActive =
                                                                pathname ===
                                                                child.href ||
                                                                pathname.startsWith(
                                                                    `${child.href}/`
                                                                );

                                                            return (
                                                                <Link
                                                                    key={
                                                                        child.href
                                                                    }
                                                                    href={
                                                                        child.href
                                                                    }
                                                                    onClick={
                                                                        onNavigate
                                                                    }
                                                                    className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all ${isActive
                                                                        ? `${style.childActiveBg} ${style.childActiveText}`
                                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                        }`}
                                                                >
                                                                    <span
                                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${isActive
                                                                            ? style.childActiveIcon
                                                                            : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                                                                            }`}
                                                                    >
                                                                        <ChildIcon className="h-3 w-3" />
                                                                    </span>

                                                                    <span className="truncate">
                                                                        {
                                                                            child.title
                                                                        }
                                                                    </span>

                                                                    {isActive && (
                                                                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                                                                    )}
                                                                </Link>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </nav>

            {/* Profile */}
            <div className="shrink-0 border-t border-border px-2 py-1.5">
                <DropdownMenu>
                    <DropdownMenuTrigger className="w-full outline-none">
                        <div className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                                    MA
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1 text-left">
                                <p className="truncate text-xs font-semibold text-foreground">
                                    Muhsina Akter
                                </p>
                                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                    IT Manager
                                </p>
                            </div>

                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56 border border-border bg-card text-card-foreground">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-semibold">
                                    Muhsina Akter
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    muhsina.akter@fiberathome.net
                                </p>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem>
                            Account Settings
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                            Notifications
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}

// frontend/components/ui/sidebar.tsx
// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
//     Layers, Boxes, ClipboardList, Wrench, Trash2,
//     History, Users, FileBarChart, AlertTriangle,
//     Laptop, ChevronDown, ChevronRight,
//     type LucideIcon,
// } from "lucide-react";
// import { useState } from "react";
// import {
//     DropdownMenu, DropdownMenuContent, DropdownMenuItem,
//     DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// type Child = { title: string; href: string; };
// type MenuGroup = { label: string; items: Menu[]; };
// type Menu = { title: string; icon: LucideIcon; children?: Child[]; };

// const menuGroups: MenuGroup[] = [
//     {
//         label: "Inventory",
//         items: [
//             {
//                 title: "Stock",
//                 icon: Boxes,
//                 children: [
//                     { title: "Asset Devices", href: "/dashboard/assets/devices" },
//                     { title: "Stock Entry", href: "/dashboard/stock/stock-entry" },
//                     { title: "All Device Status", href: "/dashboard/stock/all-status" },
//                 ],
//             },
//             {
//                 title: "Assigned Assets",
//                 icon: Layers,
//                 children: [
//                     { title: "Employee Asset List", href: "/dashboard/operations/emp-assets-list" },
//                 ],
//             },
//             {
//                 title: "Non-Operational",
//                 icon: Trash2,
//                 children: [
//                     { title: "All Non-Operational", href: "/dashboard/reports/non-operational/" },
//                     // { title: "Ownership Assets", href: "/dashboard/disposal/ownership-assets" },
//                 ],
//             },
//         ],
//     },
//     {
//         label: "Operations",
//         items: [
//             {
//                 title: "Active Employee",
//                 icon: Users,
//                 children: [
//                     { title: "Employee List", href: "/dashboard/active-employee/" },
//                 ],
//             },
//             {
//                 title: "Service & Warranty",
//                 icon: Wrench,
//                 children: [
//                     { title: "Service Claims", href: "/dashboard/service-warranty/service-claims" },
//                     { title: "Warranty Claims", href: "/dashboard/service-warranty/warranty-claims" },
//                 ],
//             },
//             {
//                 title: "Device Clearance",
//                 icon: Laptop,
//                 children: [
//                     { title: "Form", href: "/dashboard/device-clearance/clearance-form" },
//                     { title: "EC List", href: "/dashboard/device-clearance/clearance-list" },
//                 ],
//             },
//             {
//                 title: "Urgent Task",
//                 icon: AlertTriangle,
//                 children: [
//                     { title: "Form", href: "/dashboard/urgent/create" },
//                     { title: "List", href: "/dashboard/urgent/list" },
//                 ],
//             },
//         ],
//     },
//     {
//         label: "Admin",
//         items: [
//             {
//                 title: "Add All Item",
//                 icon: ClipboardList,
//                 children: [
//                     { title: "Add Data", href: "/dashboard/add_item/add_list" },
//                 ],
//             },
//             {
//                 title: "Master Data",
//                 icon: Layers,
//                 children: [
//                     { title: "Reference Data", href: "/dashboard/master-data/" },
//                 ],
//             },
//             {
//                 title: "Lifecycle Actions",
//                 icon: History,
//                 children: [
//                     { title: "Lifecycle History", href: "/dashboard/lifecycle/lifecycle-history" },
//                 ],
//             },
//             {
//                 title: "Reports",
//                 icon: FileBarChart,
//                 children: [
//                     { title: "Asset Lifecycle", href: "/dashboard/device-reports/asset-lifecycle" },
//                     { title: "Stock Status", href: "/dashboard/device-reports/stock-status" },
//                     { title: "Warranty & Service", href: "/dashboard/device-reports/warranty-service" },
//                     { title: "TT Metrics", href: "/dashboard/device-reports/tt-metrics" },
//                 ],
//             },
//         ],
//     },
// ];

// const iconColors = [
//     "text-blue-500", "text-violet-500", "text-rose-500",
//     "text-emerald-500", "text-amber-500", "text-cyan-500",
//     "text-pink-500", "text-indigo-500", "text-orange-500",
//     "text-teal-500", "text-sky-500", "text-lime-500",
// ];

// interface SidebarProps {
//     onNavigate?: () => void;
// }

// export function Sidebar({ onNavigate }: SidebarProps) {
//     const pathname = usePathname();
//     const [open, setOpen] = useState<string | null>(() => {
//         // Auto-expand active parent
//         for (const group of menuGroups) {
//             for (const item of group.items) {
//                 if (item.children?.some(c => pathname.startsWith(c.href))) {
//                     return item.title;
//                 }
//             }
//         }
//         return null;
//     });

//     let colorIdx = 0;

//     return (
//         <div className="w-full h-full flex flex-col bg-card text-foreground">
//             {/* Logo */}
//             <div className="h-14 flex items-center px-5 gap-3 border-b border-border shrink-0">
//                 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
//                     <span className="text-primary font-bold text-sm">IT</span>
//                 </div>
//                 <div>
//                     <p className="text-sm font-semibold text-foreground leading-none">ITM Portal</p>
//                     <p className="text-[10px] text-muted-foreground mt-0.5">Fiber@Home Ltd.</p>
//                 </div>
//             </div>

//             {/* Menu */}
//             <nav className="flex-1 overflow-y-auto py-3 px-2">
//                 {menuGroups.map((group) => (
//                     <div key={group.label} className="mb-4">
//                         <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1.5">
//                             {group.label}
//                         </p>
//                         {group.items.map((item) => {
//                             const color = iconColors[colorIdx % iconColors.length];
//                             colorIdx++;
//                             const isParentActive = item.children?.some(c => pathname.startsWith(c.href));
//                             const isExpanded = open === item.title;

//                             return (
//                                 <div key={item.title}>
//                                     <button
//                                         onClick={() => setOpen(isExpanded ? null : item.title)}
//                                         className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all mb-0.5 ${isParentActive
//                                             ? "bg-primary/10 text-primary"
//                                             : "text-foreground hover:bg-muted"
//                                             }`}
//                                     >
//                                         <span className="flex items-center gap-2.5">
//                                             <item.icon className={`h-4 w-4 shrink-0 ${isParentActive ? "text-primary" : color}`} />
//                                             {item.title}
//                                         </span>
//                                         {item.children && (
//                                             <span className="text-muted-foreground shrink-0">
//                                                 {isExpanded
//                                                     ? <ChevronDown className="h-3 w-3" />
//                                                     : <ChevronRight className="h-3 w-3" />
//                                                 }
//                                             </span>
//                                         )}
//                                     </button>

//                                     {item.children && isExpanded && (
//                                         <div className="ml-4 pl-3 border-l border-border/60 mb-1 space-y-0.5">
//                                             {item.children.map((child) => {
//                                                 const isActive = pathname === child.href || pathname.startsWith(child.href + "/");
//                                                 return (
//                                                     <Link
//                                                         key={child.href}
//                                                         href={child.href}
//                                                         onClick={onNavigate}
//                                                         className={`block px-2.5 py-1.5 rounded-md text-xs transition-all ${isActive
//                                                             ? "bg-primary/10 text-primary font-semibold"
//                                                             : "text-muted-foreground hover:text-foreground hover:bg-muted"
//                                                             }`}
//                                                     >
//                                                         {child.title}
//                                                     </Link>
//                                                 );
//                                             })}
//                                         </div>
//                                     )}
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 ))}
//             </nav>

//             {/* Profile */}
//             <div className="border-t border-border px-2 py-2 shrink-0">
//                 <DropdownMenu>
//                     <DropdownMenuTrigger className="w-full">
//                         <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted cursor-pointer transition-all">
//                             <Avatar className="h-8 w-8 shrink-0">
//                                 <AvatarImage src="https://github.com/shadcn.png" />
//                                 <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">MA</AvatarFallback>
//                             </Avatar>
//                             <div className="text-left flex-1 min-w-0">
//                                 <p className="text-xs font-semibold text-foreground truncate">Muhsina Akter</p>
//                                 <p className="text-[10px] text-muted-foreground truncate">IT Manager</p>
//                             </div>
//                             <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
//                         </div>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent className="w-56 bg-card text-card-foreground border border-border">
//                         <DropdownMenuLabel className="font-normal">
//                             <div className="flex flex-col gap-0.5">
//                                 <p className="text-sm font-semibold">Muhsina Akter</p>
//                                 <p className="text-xs text-muted-foreground">muhsina.akter@fiberathome.net</p>
//                             </div>
//                         </DropdownMenuLabel>
//                         <DropdownMenuSeparator />
//                         <DropdownMenuItem>Account Settings</DropdownMenuItem>
//                         <DropdownMenuItem>Notifications</DropdownMenuItem>
//                         <DropdownMenuSeparator />
//                         <DropdownMenuItem className="text-red-600">Log out</DropdownMenuItem>
//                     </DropdownMenuContent>
//                 </DropdownMenu>
//             </div>
//         </div>
//     );
// }




