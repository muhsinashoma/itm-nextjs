"use client";

import { ReactNode } from "react";
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
};

export function AppFormModal({
    open,
    onOpenChange,
    title,
    subtitle,
    icon,
    children,
    footer,
    maxWidth = "max-w-[760px]",
}: AppFormModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

                <Dialog.Content
                    className={`fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[96vw] ${maxWidth} -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl`}
                >
                    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-primary px-5 py-4">
                        <div className="flex min-w-0 items-start gap-3">
                            {icon && (
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-primary-foreground">
                                    {icon}
                                </div>
                            )}

                            <div className="min-w-0">
                                <Dialog.Title className="text-sm font-bold text-primary-foreground">
                                    {title}
                                </Dialog.Title>

                                {subtitle && (
                                    <p className="mt-0.5 text-[11px] text-primary-foreground/75">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Dialog.Close className="rounded-lg p-1.5 text-primary-foreground/80 transition hover:bg-white/10 hover:text-primary-foreground">
                            <X size={17} />
                        </Dialog.Close>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
                        {children}
                    </div>

                    {footer && (
                        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-3">
                            {footer}
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}