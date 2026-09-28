"use client";

import {
    ArrowLeft,
} from "lucide-react";

import {
    useRouter,
} from "next/navigation";

export function DashboardBackButton({
    className = "",
}: {
    className?: string;
}) {
    const router =
        useRouter();

    return (
        <button
            type="button"
            onClick={() =>
                router.push(
                    "/dashboard"
                )
            }
            className={`
                inline-flex
                h-8
                items-center
                gap-1.5
                rounded-lg
                border
                border-border
                bg-background
                px-3
                text-[10px]
                font-semibold
                text-foreground
                shadow-sm
                transition
                hover:border-primary/30
                hover:bg-primary/5
                hover:text-primary
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-primary/20
                ${className}
            `}
            title="Back to Dashboard"
        >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
        </button>
    );
}
