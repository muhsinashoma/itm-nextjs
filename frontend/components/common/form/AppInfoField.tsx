"use client";

type AppInfoFieldProps = {
    label: string;
    value?: string | number | null;
    mono?: boolean;
    span?: boolean;
};

export function AppInfoField({
    label,
    value,
    mono,
    span,
}: AppInfoFieldProps) {
    const display =
        value === undefined || value === null || String(value).trim() === ""
            ? "—"
            : String(value);

    return (
        <div
            className={`min-w-0 rounded-lg border border-border bg-background px-3 py-2 ${span ? "sm:col-span-2 lg:col-span-3" : ""
                }`}
        >
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p
                className={`mt-1 break-words text-[11px] font-semibold text-foreground ${mono ? "font-mono" : ""
                    }`}
            >
                {display}
            </p>
        </div>
    );
}