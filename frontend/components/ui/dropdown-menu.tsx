
// components/ui/dropdown-menu.tsx
"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* =========================================================
   ROOT
========================================================= */

export const DropdownMenu = (
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>
) => (
  <DropdownMenuPrimitive.Root
    {...props}
    data-slot="dropdown-menu"
  />
);

/* =========================================================
   TRIGGER
========================================================= */

export const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    data-slot="dropdown-menu-trigger"
    className={cn(className)}
    {...props}
  />
));

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

/* =========================================================
   CONTENT
========================================================= */

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentProps<typeof DropdownMenuPrimitive.Content> & {
    sideOffset?: number;
  }
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      data-slot="dropdown-menu-content"
      className={cn(
        `
        z-50 min-w-[10rem]
        rounded-md border bg-popover p-1
        text-[11px] text-popover-foreground
        shadow-md
        overflow-hidden
        `,
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));

DropdownMenuContent.displayName = "DropdownMenuContent";

/* =========================================================
   ITEM
========================================================= */

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
  }
>(({ className, inset, variant = "default", ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    data-slot="dropdown-menu-item"
    data-inset={inset}
    data-variant={variant}
    className={cn(
      `
      relative flex items-center gap-2
      rounded-sm
      px-2 py-1.5
      text-[11px]
      outline-none select-none
      cursor-pointer
      transition-colors
      hover:bg-accent hover:text-accent-foreground
      data-[disabled]:pointer-events-none
      data-[disabled]:opacity-50
      `,
      className
    )}
    {...props}
  />
));

DropdownMenuItem.displayName = "DropdownMenuItem";

/* =========================================================
   CHECKBOX ITEM
========================================================= */

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ children, className, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    data-slot="dropdown-menu-checkbox-item"
    className={cn(
      `
      relative flex items-center gap-2
      rounded-sm
      py-1.5 pl-7 pr-2
      text-[11px]
      outline-none select-none
      cursor-pointer
      transition-colors
      hover:bg-accent hover:text-accent-foreground
      data-[disabled]:pointer-events-none
      data-[disabled]:opacity-50
      `,
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className="size-3.5" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>

    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));

DropdownMenuCheckboxItem.displayName =
  "DropdownMenuCheckboxItem";

/* =========================================================
   RADIO
========================================================= */

export const DropdownMenuRadioGroup =
  DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>
>(({ children, className, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    data-slot="dropdown-menu-radio-item"
    className={cn(
      `
      relative flex items-center gap-2
      rounded-sm
      py-1.5 pl-7 pr-2
      text-[11px]
      outline-none select-none
      cursor-pointer
      transition-colors
      hover:bg-accent hover:text-accent-foreground
      data-[disabled]:pointer-events-none
      data-[disabled]:opacity-50
      `,
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <CircleIcon className="size-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>

    {children}
  </DropdownMenuPrimitive.RadioItem>
));

DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

/* =========================================================
   SUB MENU
========================================================= */

export const DropdownMenuSub = DropdownMenuPrimitive.Sub;

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    data-slot="dropdown-menu-sub-trigger"
    className={cn(
      `
      flex items-center justify-between
      rounded-sm
      px-2 py-1.5
      text-[11px]
      outline-none select-none
      cursor-pointer
      hover:bg-accent hover:text-accent-foreground
      `,
      className
    )}
    {...props}
  >
    {children}

    <ChevronRightIcon className="ml-auto size-3.5" />
  </DropdownMenuPrimitive.SubTrigger>
));

DropdownMenuSubTrigger.displayName =
  "DropdownMenuSubTrigger";

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    data-slot="dropdown-menu-sub-content"
    className={cn(
      `
      z-50 min-w-[10rem]
      rounded-md border bg-popover p-1
      text-[11px] text-popover-foreground
      shadow-md
      `,
      className
    )}
    {...props}
  />
));

DropdownMenuSubContent.displayName =
  "DropdownMenuSubContent";

/* =========================================================
   LABEL
========================================================= */

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    data-slot="dropdown-menu-label"
    data-inset={inset}
    className={cn(
      `
      px-2 py-1.5
      text-[11px]
      font-semibold
      data-[inset]:pl-8
      `,
      className
    )}
    {...props}
  />
));

DropdownMenuLabel.displayName = "DropdownMenuLabel";

/* =========================================================
   SEPARATOR
========================================================= */

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentProps<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    data-slot="dropdown-menu-separator"
    className={cn("bg-border my-1 h-px", className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName =
  "DropdownMenuSeparator";

/* =========================================================
   SHORTCUT
========================================================= */

export const DropdownMenuShortcut = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    data-slot="dropdown-menu-shortcut"
    className={cn(
      "ml-auto text-[10px] text-muted-foreground tracking-wide",
      className
    )}
    {...props}
  />
);

