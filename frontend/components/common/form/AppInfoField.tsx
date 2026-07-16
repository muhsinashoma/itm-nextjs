
// frontend/components/common/form/AppInfoField.tsx

import type { ReactNode } from "react";

type AppInfoFieldProps = {
    label: string;
    value?: ReactNode;
    mono?: boolean;
    span?: boolean;
};

export function AppInfoField({
    label,
    value,
    mono = false,
    span = false,
}: AppInfoFieldProps) {
    const hasValue =
        value !== null &&
        value !== undefined &&
        String(value).trim() !== "";

    return (
        <div
            className={`
                min-w-0 rounded-lg border border-border
                bg-card px-3 py-2.5
                ${span ? "col-span-full" : ""}
            `}
        >
            <p
                className="
                    mb-1
                    text-[9px]
                    font-semibold
                    uppercase
                    leading-3
                    tracking-[0.05em]
                    text-muted-foreground
                "
            >
                {label}
            </p>

            <div
                className={`
                    break-words
                    text-[11px]
                    font-semibold
                    leading-[1.35]
                    text-foreground
                    ${mono ? "font-mono" : "font-sans"}
                `}
            >
                {hasValue ? value : "—"}
            </div>
        </div>
    );
}