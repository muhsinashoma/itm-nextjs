// Add these types near the other API types in frontend/lib/api.ts.

export type TroubleTicketRange = "7d" | "30d" | "3m";

export type TroubleTicketStatus =
    | "Not Started"
    | "Open"
    | "In Progress"
    | "Closed";

export interface TroubleTicketOverviewPoint {
    label: string;
    open: number;
    in_progress: number;
    closed: number;
}

export interface TroubleTicketOverview {
    range: TroubleTicketRange;
    total: number;
    items: TroubleTicketOverviewPoint[];
}

export interface TroubleTicketItem {
    id: number;
    tt_no: string;
    employee_id: string;
    employee_name: string;
    assigned_id: string;
    assigned_name: string;
    query_type: string;
    requisition_type: string;
    status: TroubleTicketStatus;
    dept_name: string;
    func_name: string;
    delivered_status: string;
    created_at: string;
    age_seconds: number;
    mobile_no: string;
    company_name: string;
}

export interface TroubleTicketHistoryItem {
    id: number;
    event_type: string;
    previous_status?: TroubleTicketStatus | null;
    current_status?: TroubleTicketStatus | null;
    note?: string | null;
    assigned_from?: string | null;
    assigned_to?: string | null;
    department?: string | null;
    attachment_url?: string | null;
    changed_by?: string | null;
    created_at: string;
}

// Add this object once. If ticketApi already exists, merge these methods into it.
export const ticketApi = {
    overview: (range: TroubleTicketRange) =>
        api.get<ApiOk<TroubleTicketOverview>>(
            `/trouble-tickets/overview${toQuery({ range })}`
        ),

    list: (params?: {
        page?: number;
        limit?: number;
        status?: TroubleTicketStatus | "all";
        search?: string;
    }) =>
        api.get<ApiPage<TroubleTicketItem>>(
            `/trouble-tickets${toQuery(params)}`
        ),

    history: (id: number | string) =>
        api.get<ApiOk<TroubleTicketHistoryItem[]>>(
            `/trouble-tickets/${id}/history`
        ),
};
