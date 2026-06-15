// components/ui/sidebar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Layers, Boxes, ClipboardList, Wrench, Trash2,
    History, Users, FileBarChart, AlertTriangle,
    Laptop, ChevronDown, ChevronRight,
    type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Child = { title: string; href: string; };
type MenuGroup = { label: string; items: Menu[]; };
type Menu = { title: string; icon: LucideIcon; children?: Child[]; };

const menuGroups: MenuGroup[] = [
    {
        label: "Inventory",
        items: [
            {
                title: "Stock",
                icon: Boxes,
                children: [
                    { title: "Stock Entry", href: "/dashboard/stock/stock-entry" },
                    { title: "All Device Status", href: "/dashboard/stock/all-status" },
                ],
            },
            {
                title: "Assigned Assets",
                icon: Layers,
                children: [
                    { title: "Employee Asset List", href: "/dashboard/operations/emp-assets-list" },
                ],
            },
            {
                title: "Non-Operational",
                icon: Trash2,
                children: [
                    { title: "All Non-Operational", href: "/dashboard/reports/non-operational/" },
                    // { title: "Ownership Assets", href: "/dashboard/disposal/ownership-assets" },
                ],
            },
        ],
    },
    {
        label: "Operations",
        items: [
            {
                title: "Active Employee",
                icon: Users,
                children: [
                    { title: "Employee List", href: "/dashboard/active-employee/" },
                ],
            },
            {
                title: "Service & Warranty",
                icon: Wrench,
                children: [
                    { title: "Service Claims", href: "/dashboard/service-warranty/service-claims" },
                    { title: "Warranty Claims", href: "/dashboard/service-warranty/warranty-claims" },
                ],
            },
            {
                title: "Device Clearance",
                icon: Laptop,
                children: [
                    { title: "Form", href: "/dashboard/device-clearance/clearance-form" },
                    { title: "EC List", href: "/dashboard/device-clearance/clearance-list" },
                ],
            },
            {
                title: "Urgent Task",
                icon: AlertTriangle,
                children: [
                    { title: "Form", href: "/dashboard/urgent/create" },
                    { title: "List", href: "/dashboard/urgent/list" },
                ],
            },
        ],
    },
    {
        label: "Admin",
        items: [
            {
                title: "Add All Item",
                icon: ClipboardList,
                children: [
                    { title: "Add Data", href: "/dashboard/add_item/add_list" },
                ],
            },
            {
                title: "Master Data",
                icon: Layers,
                children: [
                    { title: "Reference Data", href: "/dashboard/master-data/" },
                ],
            },
            {
                title: "Lifecycle Actions",
                icon: History,
                children: [
                    { title: "Lifecycle History", href: "/dashboard/lifecycle/lifecycle-history" },
                ],
            },
            {
                title: "Reports",
                icon: FileBarChart,
                children: [
                    { title: "Asset Lifecycle", href: "/dashboard/device-reports/asset-lifecycle" },
                    { title: "Stock Status", href: "/dashboard/device-reports/stock-status" },
                    { title: "Warranty & Service", href: "/dashboard/device-reports/warranty-service" },
                    { title: "TT Metrics", href: "/dashboard/device-reports/tt-metrics" },
                ],
            },
        ],
    },
];

const iconColors = [
    "text-blue-500", "text-violet-500", "text-rose-500",
    "text-emerald-500", "text-amber-500", "text-cyan-500",
    "text-pink-500", "text-indigo-500", "text-orange-500",
    "text-teal-500", "text-sky-500", "text-lime-500",
];

interface SidebarProps {
    onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState<string | null>(() => {
        // Auto-expand active parent
        for (const group of menuGroups) {
            for (const item of group.items) {
                if (item.children?.some(c => pathname.startsWith(c.href))) {
                    return item.title;
                }
            }
        }
        return null;
    });

    let colorIdx = 0;

    return (
        <div className="w-full h-full flex flex-col bg-card text-foreground">
            {/* Logo */}
            <div className="h-14 flex items-center px-5 gap-3 border-b border-border shrink-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">IT</span>
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground leading-none">ITM Portal</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Fiber@Home Ltd.</p>
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
                {menuGroups.map((group) => (
                    <div key={group.label} className="mb-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1.5">
                            {group.label}
                        </p>
                        {group.items.map((item) => {
                            const color = iconColors[colorIdx % iconColors.length];
                            colorIdx++;
                            const isParentActive = item.children?.some(c => pathname.startsWith(c.href));
                            const isExpanded = open === item.title;

                            return (
                                <div key={item.title}>
                                    <button
                                        onClick={() => setOpen(isExpanded ? null : item.title)}
                                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all mb-0.5 ${
                                            isParentActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <item.icon className={`h-4 w-4 shrink-0 ${isParentActive ? "text-primary" : color}`} />
                                            {item.title}
                                        </span>
                                        {item.children && (
                                            <span className="text-muted-foreground shrink-0">
                                                {isExpanded
                                                    ? <ChevronDown className="h-3 w-3" />
                                                    : <ChevronRight className="h-3 w-3" />
                                                }
                                            </span>
                                        )}
                                    </button>

                                    {item.children && isExpanded && (
                                        <div className="ml-4 pl-3 border-l border-border/60 mb-1 space-y-0.5">
                                            {item.children.map((child) => {
                                                const isActive = pathname === child.href || pathname.startsWith(child.href + "/");
                                                return (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        onClick={onNavigate}
                                                        className={`block px-2.5 py-1.5 rounded-md text-xs transition-all ${
                                                            isActive
                                                                ? "bg-primary/10 text-primary font-semibold"
                                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                        }`}
                                                    >
                                                        {child.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Profile */}
            <div className="border-t border-border px-2 py-2 shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger className="w-full">
                        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted cursor-pointer transition-all">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">MA</AvatarFallback>
                            </Avatar>
                            <div className="text-left flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">Muhsina Akter</p>
                                <p className="text-[10px] text-muted-foreground truncate">IT Manager</p>
                            </div>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-card text-card-foreground border border-border">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-semibold">Muhsina Akter</p>
                                <p className="text-xs text-muted-foreground">muhsina.akter@fiberathome.net</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Account Settings</DropdownMenuItem>
                        <DropdownMenuItem>Notifications</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Log out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
