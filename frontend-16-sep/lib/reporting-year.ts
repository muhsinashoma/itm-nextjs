"use client";

import { useEffect, useState } from "react";

export const REPORTING_YEAR_STORAGE_KEY = "itm_selected_year";
export const REPORTING_YEAR_EVENT = "itm-year-change";

export function getDefaultReportingYear(): number {
    return new Date().getFullYear();
}

export function readReportingYear(): number {
    const fallback = getDefaultReportingYear();

    if (typeof window === "undefined") {
        return fallback;
    }

    const stored = Number(
        window.localStorage.getItem(
            REPORTING_YEAR_STORAGE_KEY
        )
    );

    if (
        Number.isInteger(stored) &&
        stored >= 2000 &&
        stored <= fallback + 1
    ) {
        return stored;
    }

    return fallback;
}

export function getReportingYearRange(
    year: number
): {
    fromDate: string;
    toDate: string;
} {
    return {
        fromDate: `${year}-01-01`,
        toDate: `${year}-12-31`,
    };
}

export function useReportingYear(): number {
    const [year, setYear] = useState(
        getDefaultReportingYear()
    );

    useEffect(() => {
        setYear(readReportingYear());

        const handleYearChange = (
            event: Event
        ) => {
            const customEvent =
                event as CustomEvent<{
                    year?: number;
                }>;

            const nextYear = Number(
                customEvent.detail?.year
            );

            if (Number.isInteger(nextYear)) {
                setYear(nextYear);
                return;
            }

            setYear(readReportingYear());
        };

        const handleStorage = (
            event: StorageEvent
        ) => {
            if (
                event.key ===
                REPORTING_YEAR_STORAGE_KEY
            ) {
                setYear(readReportingYear());
            }
        };

        window.addEventListener(
            REPORTING_YEAR_EVENT,
            handleYearChange
        );
        window.addEventListener(
            "storage",
            handleStorage
        );

        return () => {
            window.removeEventListener(
                REPORTING_YEAR_EVENT,
                handleYearChange
            );
            window.removeEventListener(
                "storage",
                handleStorage
            );
        };
    }, []);

    return year;
}
