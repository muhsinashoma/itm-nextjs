
// //frontend/components/ui/dialog.tsx
// "use client"

// import * as React from "react"
// import * as DialogPrimitive from "@radix-ui/react-dialog"
// import { cn } from "@/lib/utils"

// // --------------------
// // Dialog Root & Trigger
// // --------------------
// const Dialog = DialogPrimitive.Root
// const DialogTrigger = DialogPrimitive.Trigger

// // --------------------
// // Dialog Content
// // --------------------
// const DialogContent = React.forwardRef<
//     React.ElementRef<typeof DialogPrimitive.Content>,
//     React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
// >(({ className, children, ...props }, ref) => (
//     <DialogPrimitive.Portal>
//         <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50" />
//         <DialogPrimitive.Content
//             ref={ref}
//             className={cn(
//                 "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-6 shadow-lg focus:outline-none",
//                 "data-[state=open]:animate-in data-[state=closed]:animate-out",
//                 "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
//                 "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
//                 "data-[side=bottom]:slide-in-from-top-2",
//                 "data-[side=left]:slide-in-from-right-2",
//                 "data-[side=right]:slide-in-from-left-2",
//                 "data-[side=top]:slide-in-from-bottom-2",
//                 className
//             )}
//             {...props}
//         >
//             {children}
//         </DialogPrimitive.Content>
//     </DialogPrimitive.Portal>
// ))
// DialogContent.displayName = DialogPrimitive.Content.displayName

// // --------------------
// // Dialog Title & Description
// // --------------------
// const DialogTitle = React.forwardRef<
//     React.ElementRef<typeof DialogPrimitive.Title>,
//     React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
// >(({ className, ...props }, ref) => (
//     <DialogPrimitive.Title
//         ref={ref}
//         className={cn("text-lg font-semibold leading-none", className)}
//         {...props}
//     />
// ))
// DialogTitle.displayName = DialogPrimitive.Title.displayName

// const DialogDescription = React.forwardRef<
//     React.ElementRef<typeof DialogPrimitive.Description>,
//     React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
// >(({ className, ...props }, ref) => (
//     <DialogPrimitive.Description
//         ref={ref}
//         className={cn("text-sm text-muted-foreground", className)}
//         {...props}
//     />
// ))
// DialogDescription.displayName = DialogPrimitive.Description.displayName

// // --------------------
// // Dialog Close
// // --------------------
// const DialogClose = DialogPrimitive.Close

// // --------------------
// // Export all components
// // --------------------
// export {
//     Dialog,
//     DialogTrigger,
//     DialogContent,
//     DialogTitle,
//     DialogDescription,
//     DialogClose, // ✅ now defined
// }



"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

/* ============================================================
   DIALOG ROOT
============================================================ */

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

/* ============================================================
   DIALOG PORTAL
============================================================ */

const DialogPortal = DialogPrimitive.Portal;

/* ============================================================
   DIALOG OVERLAY
============================================================ */

const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<
        typeof DialogPrimitive.Overlay
    >
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "fixed inset-0 z-50 bg-black/50",
            "data-[state=open]:animate-in",
            "data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0",
            "data-[state=open]:fade-in-0",
            className
        )}
        {...props}
    />
));

DialogOverlay.displayName =
    DialogPrimitive.Overlay.displayName;

/* ============================================================
   DIALOG CONTENT
============================================================ */

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<
        typeof DialogPrimitive.Content
    >
>(({ className, children, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />

        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                `
                fixed
                left-1/2
                top-1/2
                z-50
                w-[calc(100%-2rem)]
                max-w-lg
                -translate-x-1/2
                -translate-y-1/2
                rounded-xl
                border
                bg-white
                p-6
                shadow-xl
                focus:outline-none
                dark:bg-slate-950
                `,
                `
                data-[state=open]:animate-in
                data-[state=closed]:animate-out
                data-[state=closed]:fade-out-0
                data-[state=open]:fade-in-0
                data-[state=closed]:zoom-out-95
                data-[state=open]:zoom-in-95
                `,
                className
            )}
            {...props}
        >
            {children}
        </DialogPrimitive.Content>
    </DialogPortal>
));

DialogContent.displayName =
    DialogPrimitive.Content.displayName;

/* ============================================================
   DIALOG HEADER
============================================================ */

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-left",
            className
        )}
        {...props}
    />
);

DialogHeader.displayName = "DialogHeader";

/* ============================================================
   DIALOG FOOTER
============================================================ */

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
            className
        )}
        {...props}
    />
);

DialogFooter.displayName = "DialogFooter";

/* ============================================================
   DIALOG TITLE
============================================================ */

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<
        typeof DialogPrimitive.Title
    >
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
));

DialogTitle.displayName =
    DialogPrimitive.Title.displayName;

/* ============================================================
   DIALOG DESCRIPTION
============================================================ */

const DialogDescription = React.forwardRef<
    React.ElementRef<
        typeof DialogPrimitive.Description
    >,
    React.ComponentPropsWithoutRef<
        typeof DialogPrimitive.Description
    >
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn(
            "text-sm text-muted-foreground",
            className
        )}
        {...props}
    />
));

DialogDescription.displayName =
    DialogPrimitive.Description.displayName;

/* ============================================================
   DIALOG CLOSE
============================================================ */

const DialogClose = DialogPrimitive.Close;

/* ============================================================
   EXPORT
============================================================ */

export {
    Dialog,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogClose,
};