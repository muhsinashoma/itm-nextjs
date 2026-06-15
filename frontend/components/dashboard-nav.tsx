"use client";

import Link from "next/link";
import { Home, BarChart, Users, Settings, Package } from "lucide-react";

const items = [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "Analytics", href: "#", icon: BarChart },
    { title: "Customers", href: "#", icon: Users },
    { title: "Products", href: "#", icon: Package },
    { title: "Settings", href: "#", icon: Settings },
];

export default function DashboardNav() {
    return (
        <aside className="hidden md:flex w-64 flex-col border-r bg-background">
            <div className="flex h-16 items-center px-6 font-bold">shadcn/ui--</div>

            <nav className="flex-1 space-y-1 px-4">
                {items.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
