
// itm/frontend/types/tt.ts

import type {
    TroubleTicketItem,
} from "@/lib/api";

export type Section =
    TroubleTicketItem & {
        /**
         * Temporary compatibility property.
         *
         * The correct API field is:
         * requisition_type
         */
        requistionType: string;

        /**
         * Human-readable ticket age generated
         * from age_seconds.
         *
         * Example:
         * 2d 4h 15m
         */
        tt_age: string;

        /**
         * Company name used by dashboard/right sidebar
         * ticket grouping and filtering.
         *
         * Keep optional because some older API rows
         * may not contain a company value.
         */
        company_name?: string;
    };