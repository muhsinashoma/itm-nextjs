//components/ui/safeselect.tsx

"use client";

import { useEffect, useState } from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "./select"; // import from the local select.tsx

interface SafeSelectProps {
    value: string;
    onChange: (value: string) => void;
}

export default function SafeSelect({ value, onChange }: SafeSelectProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true); // Only render on client
    }, []);

    if (!mounted) return null; // Skip SSR render

    return (
        <Select onValueChange={onChange} value={value}>
            <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="network">Network</SelectItem>
            </SelectContent>
        </Select>
    );
}