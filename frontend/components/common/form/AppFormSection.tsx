"use client";

import { ReactNode } from "react";

type AppFormSectionProps = {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    columns?: "one" | "two" | "three" | "four";
};

const gridClass = {
    one: "grid-cols-1",
    two: "grid-cols-1 sm:grid-cols-2",
    three: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    four: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function AppFormSection({
    title,
    icon,
    children,
    columns = "three",
}: AppFormSectionProps) {
    return (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
                {icon && <span className="text-muted-foreground">{icon}</span>}
                <h3 className="text-xs font-bold text-foreground">
                    {title}
                </h3>
            </div>

            <div className={`grid gap-3 p-4 ${gridClass[columns]}`}>
                {children}
            </div>
        </section>
    );
}