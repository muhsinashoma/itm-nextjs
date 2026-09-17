"use client";

import { Loader2 } from "lucide-react";

type AppFormFooterProps = {
    onCancel: () => void;
    onSubmit?: () => void;
    cancelText?: string;
    submitText?: string;
    loading?: boolean;
    disabled?: boolean;
    hideSubmit?: boolean;
};

export function AppFormFooter({
    onCancel,
    onSubmit,
    cancelText = "Cancel",
    submitText = "Save",
    loading,
    disabled,
    hideSubmit,
}: AppFormFooterProps) {
    return (
        <>
            <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-border bg-background px-4 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
                {cancelText}
            </button>

            {!hideSubmit && (
                <button
                    type="button"
                    disabled={disabled || loading}
                    onClick={onSubmit}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                    {loading && <Loader2 size={13} className="animate-spin" />}
                    {submitText}
                </button>
            )}
        </>
    );
}