

// frontend/components/common/form/AppFormModal.tsx
"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type AppFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    maxWidth?: string;
    maxHeight?: string;
};

export function AppFormModal({
    open,
    onOpenChange,
    title,
    subtitle,
    icon,
    children,
    footer,
    maxWidth = "max-w-[720px]",
    maxHeight = "max-h-[84vh]",
}: AppFormModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="
                        fixed inset-0 z-50 bg-black/40
                        data-[state=open]:animate-in
                        data-[state=closed]:animate-out
                        data-[state=open]:fade-in-0
                        data-[state=closed]:fade-out-0
                    "
                />

                <Dialog.Content
                    className={`
                        fixed left-1/2 top-1/2 z-50
                        flex w-[calc(100vw-24px)]
                        ${maxWidth} ${maxHeight}
                        -translate-x-1/2 -translate-y-1/2
                        flex-col overflow-hidden
                        rounded-xl border border-border
                        bg-card font-sans shadow-2xl outline-none

                        data-[state=open]:animate-in
                        data-[state=closed]:animate-out
                        data-[state=open]:fade-in-0
                        data-[state=closed]:fade-out-0
                        data-[state=open]:zoom-in-95
                        data-[state=closed]:zoom-out-95
                    `}
                >
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-primary px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                            {icon && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-primary-foreground">
                                    {icon}
                                </div>
                            )}

                            <div className="min-w-0">
                                <Dialog.Title className="truncate text-[13px] font-semibold leading-4 text-primary-foreground">
                                    {title}
                                </Dialog.Title>

                                {subtitle && (
                                    <Dialog.Description className="mt-0.5 truncate text-[10px] font-normal leading-4 text-primary-foreground/75">
                                        {subtitle}
                                    </Dialog.Description>
                                )}
                            </div>
                        </div>

                        <Dialog.Close
                            type="button"
                            aria-label="Close modal"
                            className="
                                shrink-0 rounded-lg p-1.5
                                text-primary-foreground/75
                                transition
                                hover:bg-white/10
                                hover:text-primary-foreground
                                focus:outline-none
                                focus:ring-2
                                focus:ring-white/40
                            "
                        >
                            <X size={16} />
                        </Dialog.Close>
                    </div>

                    {/* Scrollable body */}
                    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-3 text-[11px] leading-[1.4]">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-4 py-2.5 text-[11px]">
                            {footer}
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}