// frontend/types/tt.ts

import type {
    TroubleTicketItem,
} from "@/lib/api";

export type Section =
    TroubleTicketItem & {
        /**
         * Temporary compatibility property.
         * The correct API field is requisition_type.
         */
        requistionType: string;

        /**
         * Human-readable value generated
         * from age_seconds.
         */
        tt_age: string;
    };

// export type Section = {
//     id: string
//     tt_no: string
//     employee_id?: string
//     employee_name?: string
//     assigned_name?: string
//     query_type?: string
//     requistionType: string
//     status: "Closed" | "Open" | "Not Started"
//     dept_name: string
//     func_name: string
//     delivered_status?: string
//     created_at?: string
//     tt_age?: string
//     mobile_no: string
//     assigned_id?: string
//     company_name?: string
// }