// components/ui/typography.ts
export const typography = {
    h1: "text-2xl font-bold tracking-tight text-foreground",        // ↓ from 3xl
    h2: "text-xl font-semibold tracking-tight text-foreground",     // ↓ from 2xl
    h3: "text-lg font-semibold text-foreground",                    // ↓ from xl

    body: "text-xs text-foreground",                                // ↓ from sm
    small: "text-[11px] text-muted-foreground",                     // more precise compact size

    label: "text-xs font-medium text-foreground",                  // sidebar headers
};