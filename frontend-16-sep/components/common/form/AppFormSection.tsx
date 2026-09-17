
// frontend/components/common/form/AppFormSection.tsx

import type { ReactNode } from "react";

type AppFormSectionProps = {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    columns?: "one" | "two" | "three" | "four";
};

const COLUMN_CLASSES = {
    one: "grid-cols-1",
    two: "grid-cols-1 sm:grid-cols-2",
    three: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    four: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function AppFormSection({
    title,
    icon,
    children,
    columns = "one",
}: AppFormSectionProps) {
    return (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                {icon && (
                    <span className="flex shrink-0 items-center justify-center text-muted-foreground">
                        {icon}
                    </span>
                )}

                <h3 className="text-[10px] font-semibold leading-4 text-foreground">
                    {title}
                </h3>
            </div>

            <div
                className={`
                    grid gap-2 p-3
                    ${COLUMN_CLASSES[columns]}
                `}
            >
                {children}
            </div>
        </section>
    );
}