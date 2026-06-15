
// components/theme-dropdown.tsx
"use client";

import * as React from "react";
import { Check, Sun, Moon, Monitor, Palette, Droplet, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "@/context/ThemeContext";

type MenuType = "notif" | "user" | "theme" | null;

type Props = {
    activeMenu: MenuType;
    setActiveMenu: React.Dispatch<React.SetStateAction<MenuType>>;
};

// ✅ ALL THEMES (including DARK)

const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "soft-dark", label: "Soft Dark", icon: Droplet },
    // { id: "professional-dark", label: "Professional Dark", icon: Monitor },
    { id: "blue", label: "Blue", icon: Palette },
    { id: "amber", label: "Amber", icon: Droplet },

    { id: "system", label: "System", icon: Monitor },

    // ✅ NEW COMPANY THEME
    { id: "company", label: "Company", icon: Building2 },
];

export function ThemeDropdown({ activeMenu, setActiveMenu }: Props) {
    // ✅ USE CONTEXT (single source of truth)
    const { theme, setTheme } = useTheme();

    // ✅ prevent hydration mismatch
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // ✅ dynamic icon based on selected theme
    const SelectedIcon =
        themes.find((t) => t.id === theme)?.icon || Palette;

    return (
        <DropdownMenu
            open={activeMenu === "theme"}
            onOpenChange={(open) => setActiveMenu(open ? "theme" : null)}
        >
            {/* =========================
                TRIGGER BUTTON
            ========================= */}
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <SelectedIcon className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>

            {/* =========================
                DROPDOWN MENU
            ========================= */}
            <DropdownMenuContent align="end" className="w-48">
                {themes.map((t) => {
                    const Icon = t.icon;

                    return (
                        <DropdownMenuItem
                            key={t.id}
                            onClick={() => setTheme(t.id as any)}
                            className="flex items-center justify-between cursor-pointer"
                        >
                            {/* LEFT SIDE */}
                            <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {t.label}
                            </div>

                            {/* RIGHT SIDE CHECK */}
                            {theme === t.id && (
                                <Check className="h-4 w-4" />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
