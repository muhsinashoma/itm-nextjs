
// frontend/lib/api.ts

// Central API client for ITM Go backend

const BASE =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080/api/v1";

/* ======================================================
   AUTH HELPERS
====================================================== */

export function getToken():
    | string
    | null {
    if (
        typeof window ===
        "undefined"
    ) {
        return null;
    }

    return localStorage.getItem(
        "itm_token"
    );
}

export function getUser():
    | AuthMeData
    | null {
    if (
        typeof window ===
        "undefined"
    ) {
        return null;
    }

    try {
        return JSON.parse(
            localStorage.getItem(
                "itm_user"
            ) ?? "null"
        );
    } catch {
        return null;
    }
}


/* ======================================================
  Auth
====================================================== */


export function clearAuthStorage() {
    if (
        typeof window ===
        "undefined"
    ) {
        return;
    }

    localStorage.removeItem(
        "itm_token"
    );

    localStorage.removeItem(
        "itm_user"
    );
}

export function clearAuth() {
    if (
        typeof window ===
        "undefined"
    ) {
        return;
    }

    clearAuthStorage();

    /*
     * Used for automatic logout such as HTTP 401.
     *
     * replace() is preferable to href because the user
     * should not return to a protected page with Back.
     */
    window.location.replace(
        "/auth"
    );
}
/* ======================================================
   REQUEST
====================================================== */

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token =
        getToken();

    const res =
        await fetch(
            `${BASE}${path}`,
            {
                ...options,

                cache:
                    "no-store",

                headers: {
                    "Content-Type":
                        "application/json",

                    ...(token
                        ? {
                            Authorization:
                                `Bearer ${token}`,
                        }
                        : {}),

                    ...(options.headers ??
                        {}),
                },
            }
        );

    if (
        res.status ===
        401
    ) {
        clearAuth();

        throw new Error(
            "Session expired"
        );
    }

    const data =
        await res
            .json()
            .catch(
                () =>
                    null
            );

    if (
        !res.ok ||
        data?.success ===
        false
    ) {
        throw new Error(
            data?.error ||
            data?.message ||
            `HTTP ${res.status}`
        );
    }

    return data as T;
}

/* ======================================================
   GENERIC API TYPES
====================================================== */

export interface ApiOk<T> {
    success: boolean;
    data: T;
}

export interface ApiPage<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    page_size: number;
}

/* ======================================================
   AUTH TYPES
====================================================== */

export interface AuthLoginData {
    token: string;

    expires_in: number;

    user_id: number;

    employee_id: string;

    username: string;

    full_name: string;

    user_type: number;

    role_code: string;

    must_change_password: boolean;
}

export interface AuthMeData {
    user_id: number;

    employee_id: string;

    username: string;

    full_name: string;

    email: string;

    user_type: number;

    role_code: string;

    role_name: string;

    account_status: string;

    must_change_password: boolean;

    permissions: string[];
}

export type AuthPermission =
    | "panel.user.access"
    | "dashboard.self.access"
    | "panel.staff.access"
    | "panel.admin.access"
    | "requisition.view"
    | "requisition.approve"
    | "requisition.deliver"
    | "users.view"
    | "users.manage"
    | "roles.manage"
    | "system.manage"
    | "audit.view";

/* ======================================================
   GENERIC API METHODS
====================================================== */

export const api = {
    get: <T>(
        path: string
    ) =>
        request<T>(
            path
        ),

    post: <T>(
        path: string,
        body?: unknown
    ) =>
        request<T>(
            path,
            {
                method:
                    "POST",

                body:
                    JSON.stringify(
                        body ??
                        {}
                    ),
            }
        ),

    put: <T>(
        path: string,
        body?: unknown
    ) =>
        request<T>(
            path,
            {
                method:
                    "PUT",

                body:
                    JSON.stringify(
                        body ??
                        {}
                    ),
            }
        ),

    patch: <T>(
        path: string,
        body?: unknown
    ) =>
        request<T>(
            path,
            {
                method:
                    "PATCH",

                body:
                    JSON.stringify(
                        body ??
                        {}
                    ),
            }
        ),

    del: <T>(
        path: string
    ) =>
        request<T>(
            path,
            {
                method:
                    "DELETE",
            }
        ),
};

/* ======================================================
   QUERY HELPER
====================================================== */

function toQuery(
    params?:
        Record<
            string,
            any
        >
) {
    if (!params) {
        return "";
    }

    const q =
        new URLSearchParams();

    Object.entries(
        params
    ).forEach(
        ([
            key,
            value,
        ]) => {
            if (
                value !==
                undefined &&
                value !==
                null &&
                value !==
                ""
            ) {
                q.set(
                    key,
                    String(
                        value
                    )
                );
            }
        }
    );

    const query =
        q.toString();

    return query
        ? `?${query}`
        : "";
}

/* ======================================================
   AUTH
====================================================== */



export const authApi = {
    login: (
        username: string,
        password: string
    ) =>
        api.post<
            ApiOk<
                AuthLoginData
            >
        >(
            "/auth/login",
            {
                username,
                password,
            }
        ),

    refresh: () =>
        api.post<
            ApiOk<{
                token: string;

                expires_in: number;

                role_code?: string;
            }>
        >(
            "/auth/refresh"
        ),

    me: () =>
        api.get<
            ApiOk<
                AuthMeData
            >
        >(
            "/auth/me"
        ),
};



/* ======================================================
   AUTHORIZATION HELPERS
====================================================== */

export function hasPermission(
    user: AuthMeData | null | undefined,
    permission: AuthPermission
): boolean {
    if (!user) {
        return false;
    }

    return user.permissions.includes(
        permission
    );
}

export function canAccessRootUserPanel(
    user: AuthMeData | null | undefined
): boolean {
    return hasPermission(
        user,
        "panel.user.access"
    );
}

export function canAccessOwnDashboard(
    user: AuthMeData | null | undefined
): boolean {
    return hasPermission(
        user,
        "dashboard.self.access"
    );
}

export function canAccessStaffPanel(
    user: AuthMeData | null | undefined
): boolean {
    return hasPermission(
        user,
        "panel.staff.access"
    );
}

export function canAccessAdminPanel(
    user: AuthMeData | null | undefined
): boolean {
    return hasPermission(
        user,
        "panel.admin.access"
    );
}

export function canApproveRequisition(
    user: AuthMeData | null | undefined
): boolean {
    return hasPermission(
        user,
        "requisition.approve"
    );
}

export function canDeliverRequisition(
    user: AuthMeData | null | undefined
): boolean {
    return hasPermission(
        user,
        "requisition.deliver"
    );
}
/* ======================================================
   DASHBOARD TYPES
====================================================== */

export interface DashboardStats {
    total_devices:
    number;

    assigned_devices:
    number;

    stock_devices:
    number;

    active_employees:
    number;

    open_tickets:
    number;

    running_tickets:
    number;

    closed_tickets:
    number;

    warranty_expiring_30d:
    number;
}

export interface TicketTrend {
    day: string;

    open: number;

    running:
    number;

    closed:
    number;

    total:
    number;
}

export type DashboardSummaryItem = {
    label: string;
    value: number;
};

export type DashboardSummaryGroup = {
    total: number;

    items:
    DashboardSummaryItem[];
};

export type DashboardSummary = {
    active_assets:
    DashboardSummaryGroup;

    non_operational:
    DashboardSummaryGroup;

    service_requests:
    DashboardSummaryGroup;

    warranty:
    DashboardSummaryGroup;

    employees?:
    DashboardSummaryGroup;

    stock?:
    DashboardSummaryGroup;
};

/* ======================================================
   TROUBLE TICKET TYPES
====================================================== */

export type TroubleTicketRange =
    | "7d"
    | "30d"
    | "3m";

export type TroubleTicketStatus =
    | "Not Started"
    | "Open"
    | "In Progress"
    | "Closed";

export type TroubleTicketScope =
    | "all"
    | "opened_today"
    | "closed_today"
    | "running"
    | "procurement";

export interface TroubleTicketOverviewPoint {
    label:
    string;

    opened:
    number;

    closed:
    number;

    running:
    number;

    procurement:
    number;
}

/*
 * Used by:
 *
 * GET /dashboard/trouble-ticket-it-personnel
 *
 * Backend source:
 *
 * employee_office_info
 * WHERE work_field = 'IT'
 * AND active = 'Yes'
 */
export interface TroubleTicketITPersonnel {
    employee_id:
    string;

    employee_name:
    string;
}

export interface TroubleTicketDashboardSummary {
    opened_today:
    number;

    closed_today:
    number;

    total_running_tt:
    number;

    total_procurement_tt:
    number;
}

export interface TroubleTicketOverview {
    range:
    TroubleTicketRange;

    total:
    number;

    items:
    TroubleTicketOverviewPoint[];
}

export interface TroubleTicketItem {
    id:
    number;

    tt_no:
    string;

    employee_id:
    string;

    employee_name:
    string;

    assigned_id:
    string;

    assigned_name:
    string;

    query_type:
    string;

    requisition_type:
    string;

    status:
    TroubleTicketStatus;

    dept_name:
    string;

    func_name:
    string;

    delivered_status:
    string;

    created_at:
    string;

    age_seconds:
    number;

    mobile_no:
    string;
}

export interface OwnEmployeeProfile {
    employee_id: string;
    employee_name: string;
    designation: string;
    department: string;
    work_field: string;
    sub_function: string;
    active: string;
    personal_cell: string;
    official_cell: string;
    email: string;
    official_email: string;
    picture: string;
}

export interface OwnTicketSummary {
    total: number;
    open: number;
    running: number;
    closed: number;
}

export interface OwnDashboardData {
    employee: OwnEmployeeProfile;
    tickets: OwnTicketSummary;
}

export interface OwnTroubleTicketItem {
    id: number;
    tt_no: string;
    query_type: string;
    description: string;
    department: string;
    assigned_id: string;
    assigned_name: string;
    status: string;
    created_at: string;
}




/* ======================================================
   OWN EMPLOYEE DASHBOARD
====================================================== */

export interface OwnEmployeeProfile {
    employee_id: string;
    employee_name: string;
    designation: string;
    department: string;
    work_field: string;
    sub_function: string;
    active: string;
    personal_cell: string;
    official_cell: string;
    email: string;
    official_email: string;
    picture: string;
}

export interface OwnTicketSummary {
    total: number;
    open: number;
    running: number;
    closed: number;
}

export interface OwnDashboardData {
    employee: OwnEmployeeProfile;
    tickets: OwnTicketSummary;
}

export interface OwnTroubleTicketItem {
    id: number;
    tt_no: string;
    query_type: string;
    description: string;
    department: string;
    assigned_id: string;
    assigned_name: string;
    status: string;
    created_at: string;
}

/* ======================================================
   DASHBOARD API
====================================================== */

export const dashboardApi = {
    summary: () =>
        api.get<
            ApiOk<
                DashboardSummary
            >
        >(
            "/dashboard/summary"
        ),

    getStats: () =>
        api.get<
            ApiOk<
                DashboardStats
            >
        >(
            "/dashboard/stats"
        ),

    stats: () =>
        api.get<
            ApiOk<
                DashboardStats
            >
        >(
            "/dashboard/stats"
        ),

    getTicketTrend: () =>
        api.get<
            ApiOk<
                TicketTrend[]
            >
        >(
            "/dashboard/ticket-trend"
        ),

    ticketTrend: () =>
        api.get<
            ApiOk<
                TicketTrend[]
            >
        >(
            "/dashboard/ticket-trend"
        ),

    troubleTicketSummary:
        () =>
            api.get<
                ApiOk<
                    TroubleTicketDashboardSummary
                >
            >(
                "/dashboard/trouble-ticket-summary"
            ),

    troubleTicketOverview: (
        range:
            TroubleTicketRange
    ) =>
        api.get<
            ApiOk<
                TroubleTicketOverview
            >
        >(
            `/dashboard/trouble-ticket-overview${toQuery(
                {
                    range,
                }
            )}`
        ),

    /*
     * Combined Trouble Ticket filtering.
     *
     * Backend receives all supplied fields and
     * applies them using AND conditions.
     */
    troubleTickets: (
        params?: {
            page?:
            number;

            limit?:
            number;

            scope?:
            TroubleTicketScope;

            status?:
            | TroubleTicketStatus
            | "all";

            search?:
            string;

            from_date?:
            string;

            to_date?:
            string;

            /*
             * Ticket owner / requester's
             * Employee ID.
             */
            employee_id?:
            string;

            /*
             * Responsible IT person.
             *
             * Dropdown sends the IT
             * person's employee ID.
             */
            it_personal?:
            string;
        }
    ) =>
        api.get<
            ApiPage<
                TroubleTicketItem
            >
        >(
            `/dashboard/trouble-tickets${toQuery(
                params
            )}`
        ),

    /*
     * Active IT personnel dropdown.
     */
    troubleTicketITPersonnel:
        () =>
            api.get<
                ApiOk<
                    TroubleTicketITPersonnel[]
                >
            >(
                "/dashboard/trouble-ticket-it-personnel"
            ),


    /* ======================================================
     REQUISITION
  ====================================================== */

    requisitionDashboardSummary: () =>
        api.get<
            ApiOk<
                RequisitionDashboardSummary
            >
        >(
            "/dashboard/requisition-dashboard-summary"
        ),

    requisitionSummary: () =>
        api.get<
            ApiOk<
                RequisitionCategorySummary[]
            >
        >(
            "/dashboard/requisition-summary"
        ),

    requisitions: (
        params?: {
            view?:
            | "all"
            | "pending"
            | "rejected"
            | "approved";

            category?: string;

            search?: string;

            from_date?: string;

            to_date?: string;

            page?: number;

            limit?: number;
        }
    ) =>
        api.get<
            ApiPage<
                RequisitionItem
            >
        >(
            `/dashboard/requisitions${toQuery(
                params
            )}`
        ),

    updateRequisitionApproval: (
        id: number,
        approvedVal: number
    ) =>
        api.patch<
            ApiOk<{
                id: number;

                approved_val: number;

                approval_status: string;

                approved_by: string;

                approved_date: string;
            }>
        >(
            `/dashboard/requisitions/${id}/approval`,
            {
                approved_val:
                    approvedVal,
            }
        ),

    updateRequisitionDelivery: (
        id: number,
        deliveredVal: number
    ) =>
        api.patch<
            ApiOk<{
                id: number;

                delivered_val: number;

                delivery_status: string;

                delivered_by: string;

                delivered_date: string;
            }>
        >(
            `/dashboard/requisitions/${id}/delivery`,
            {
                delivered_val:
                    deliveredVal,
            }
        ),

};



/* ======================================================
   OWN EMPLOYEE DASHBOARD API

   Backend:
   GET /api/v1/user/dashboard
   GET /api/v1/user/trouble-tickets

   employee_id is NOT supplied by frontend.
   Backend resolves it from authenticated JWT.
====================================================== */

export const ownDashboardApi = {
    dashboard: () =>
        api.get<
            ApiOk<
                OwnDashboardData
            >
        >(
            "/user/dashboard"
        ),

    troubleTickets: (
        params?: {
            page?: number;

            limit?: number;

            status?:
            | "all"
            | "open"
            | "running"
            | "closed";

            search?: string;
        }
    ) =>
        api.get<
            ApiPage<
                OwnTroubleTicketItem
            >
        >(
            `/user/trouble-tickets${toQuery(
                params
            )}`
        ),
};
/* ======================================================
   TICKET
====================================================== */

export interface Ticket {
    id:
    number;

    tt_no:
    number;

    employee_id:
    string;

    employee_name:
    string;

    department:
    string;

    phone:
    string;

    email:
    string;

    client_name:
    string;

    fault_type:
    number;

    fault_type_name:
    string;

    reason_of_problem:
    string;

    fault_date_time:
    string;

    status_progress:
    number;

    attach_file:
    string;

    created_by:
    string;

    created_at:
    string;

    ticket_age:
    string;
}

export const ticketApi = {
    list: (
        p?: {
            page?:
            number;

            page_size?:
            number;

            status?:
            string;

            emp_id?:
            string;

            search?:
            string;
        }
    ) => {
        const q =
            new URLSearchParams(
                Object.fromEntries(
                    Object.entries(
                        p ??
                        {}
                    ).filter(
                        ([
                            ,
                            value,
                        ]) =>
                            value !==
                            undefined
                    )
                ) as any
            ).toString();

        return api.get<
            ApiPage<
                Ticket
            >
        >(
            `/tickets?${q}`
        );
    },

    get: (
        id:
            number
    ) =>
        api.get<
            ApiOk<
                Ticket
            >
        >(
            `/tickets/${id}`
        ),

    create: (
        body:
            Partial<Ticket>
    ) =>
        api.post<
            ApiOk<{
                id:
                number;

                tt_no:
                number;
            }>
        >(
            "/tickets",
            body
        ),

    update: (
        id:
            number,

        body:
            Partial<Ticket>
    ) =>
        api.put<
            ApiOk<any>
        >(
            `/tickets/${id}`,
            body
        ),

    close: (
        id:
            number,

        closing_description?:
            string
    ) =>
        api.patch(
            `/tickets/${id}/close`,
            {
                closing_description,
            }
        ),

    updateStatus: (
        id:
            number,

        status:
            number
    ) =>
        api.patch(
            `/tickets/${id}/status`,
            {
                status,
            }
        ),

    delete: (
        id:
            number
    ) =>
        api.del(
            `/tickets/${id}`
        ),

    getUpdates: (
        id:
            number
    ) =>
        api.get<
            ApiOk<
                any[]
            >
        >(
            `/tickets/${id}/updates`
        ),

    addUpdate: (
        id:
            number,

        body:
            any
    ) =>
        api.post(
            `/tickets/${id}/updates`,
            body
        ),
};

/* ======================================================
   DEVICE
====================================================== */

export interface Device {
    id:
    number;

    emp_id:
    string;

    emp_name:
    string;

    department:
    string;

    designation:
    string;

    category:
    string;

    brand:
    string;

    device_serial:
    string;

    model_no:
    string;

    device_type:
    number;

    status:
    string;

    assign_date:
    string;

    warranty_date:
    string;

    vendor:
    string;

    mr_number:
    string;

    pr_number:
    string;

    os:
    string;

    cpu:
    string;

    ram:
    string;

    hdd:
    string;

    monitor:
    string;

    ip_address:
    string;

    active:
    number;

    return_status:
    number;

    transfer_status:
    number;

    device_age:
    string;

    warranty_left:
    string;

    created_at:
    string;
}

export const deviceApi = {
    list: (
        p?: {
            page?:
            number;

            page_size?:
            number;

            category?:
            string;

            status?:
            string;

            search?:
            string;
        }
    ) => {
        const q =
            new URLSearchParams(
                Object.fromEntries(
                    Object.entries(
                        p ??
                        {}
                    ).filter(
                        ([
                            ,
                            value,
                        ]) =>
                            value !==
                            undefined
                    )
                ) as any
            ).toString();

        return api.get<
            ApiPage<
                Device
            >
        >(
            `/devices?${q}`
        );
    },

    get: (
        id:
            number
    ) =>
        api.get<
            ApiOk<
                Device
            >
        >(
            `/devices/${id}`
        ),

    byEmployee: (
        empId:
            string
    ) =>
        api.get<
            ApiOk<
                Device[]
            >
        >(
            `/devices/employee/${empId}`
        ),

    bySerial: (
        serial:
            string
    ) =>
        api.get<
            ApiOk<
                Device
            >
        >(
            `/devices/serial/${serial}`
        ),

    create: (
        body:
            Partial<Device>
    ) =>
        api.post<
            ApiOk<{
                id:
                number;
            }>
        >(
            "/devices",
            body
        ),

    update: (
        id:
            number,

        body:
            Partial<Device>
    ) =>
        api.put<
            ApiOk<any>
        >(
            `/devices/${id}`,
            body
        ),

    transfer: (
        id:
            number,

        to_emp_id:
            string,

        remarks?:
            string
    ) =>
        api.post(
            `/devices/${id}/transfer`,
            {
                to_emp_id,
                remarks,
            }
        ),

    return: (
        id:
            number,

        remarks?:
            string
    ) =>
        api.post(
            `/devices/${id}/return`,
            {
                remarks,
            }
        ),

    history: (
        id:
            number
    ) =>
        api.get<
            ApiOk<
                any[]
            >
        >(
            `/devices/${id}/history`
        ),

    delete: (
        id:
            number
    ) =>
        api.del(
            `/devices/${id}`
        ),
};

/* ======================================================
   ASSET DEVICES
====================================================== */

export interface AssetDevice {
    id:
    number;

    device_serial:
    string |
    null;

    category:
    string |
    null;

    brand:
    string |
    null;

    model:
    string |
    null;

    device_type:
    string |
    null;

    asset_status:
    number;

    status_label:
    string;

    emp_id:
    string |
    null;

    emp_name:
    string |
    null;

    employee_image?:
    string |
    null;

    department:
    string |
    null;

    designation:
    string |
    null;

    assigned_date:
    string |
    null;

    vendor_id:
    number |
    null;

    vendor_name:
    string |
    null;

    mr_number:
    string |
    null;

    pr_number:
    string |
    null;

    purchase_date:
    string |
    null;

    warranty_date:
    string |
    null;
}

export interface AssetDeviceHistory {
    id:
    number;

    asset_device_id:
    number;

    legacy_equipment_id:
    number;

    device_serial:
    string |
    null;

    status_code:
    number |
    null;

    status_label:
    string;

    raw_status:
    string |
    null;

    previous_status:
    number |
    null;

    return_status:
    number |
    null;

    transfer_status:
    number |
    null;

    emp_id:
    string |
    null;

    emp_name:
    string |
    null;

    department:
    string |
    null;

    designation:
    string |
    null;

    mr_number:
    string |
    null;

    pr_number:
    string |
    null;

    vendor:
    string |
    null;

    assigned_date:
    string |
    null;

    transferred_at:
    string |
    null;

    returned_at:
    string |
    null;

    history_reason:
    string;

    created_at_source:
    string |
    null;

    updated_at_source:
    string |
    null;

    migrated_at:
    string |
    null;
}

export const assetDeviceApi = {
    list: (
        params?: {
            page?:
            number;

            limit?:
            number;

            category?:
            string;

            status?:
            number;

            vendor_id?:
            number;

            search?:
            string;
        }
    ) => {
        const query =
            new URLSearchParams();

        Object.entries(
            params ??
            {}
        ).forEach(
            ([
                key,
                value,
            ]) => {
                if (
                    value !==
                    undefined &&
                    value !==
                    null &&
                    value !==
                    ""
                ) {
                    query.set(
                        key,
                        String(
                            value
                        )
                    );
                }
            }
        );

        const qs =
            query.toString();

        return api.get<
            ApiPage<
                AssetDevice
            >
        >(
            `/assets/devices${qs
                ? `?${qs}`
                : ""
            }`
        );
    },

    get: (
        id:
            number
    ) =>
        api.get<
            ApiOk<
                AssetDevice
            >
        >(
            `/assets/devices/${id}`
        ),

    history: (
        id:
            number
    ) =>
        api.get<
            ApiOk<
                AssetDeviceHistory[]
            >
        >(
            `/assets/devices/${id}/history`
        ),
};

/* ======================================================
   DEVICE OWNERSHIP
====================================================== */

export interface OwnershipSummary {
    user_ownership:
    number;

    vendor_ownership:
    number;

    total_ownership:
    number;

    current_asset_count:
    number;
}

export interface OwnershipAsset {
    id:
    number;

    reference:
    string;

    ownership_category:
    number;

    ownership_type:
    | "User"
    | "Vendor"
    | "Unknown";

    device_serial:
    string |
    null;

    category:
    string |
    null;

    brand:
    string |
    null;

    model:
    string |
    null;

    emp_id:
    string |
    null;

    emp_name:
    string |
    null;

    department:
    string |
    null;

    designation:
    string |
    null;

    assigned_date:
    string |
    null;

    purchase_date:
    string |
    null;

    warranty_date:
    string |
    null;

    transfer_date:
    string |
    null;

    remarks:
    string |
    null;

    asset_status:
    number;

    status_label:
    string;

    created_at:
    string |
    null;

    updated_at:
    string |
    null;
}

export const ownershipApi = {
    summary: () =>
        api.get<
            ApiOk<
                OwnershipSummary
            >
        >(
            "/assets/ownership/summary"
        ),

    list: (
        params?: {
            page?:
            number;

            limit?:
            number;

            search?:
            string;

            category?:
            | "all"
            | "user"
            | "vendor";
        }
    ) => {
        const query =
            new URLSearchParams();

        Object.entries(
            params ??
            {}
        ).forEach(
            ([
                key,
                value,
            ]) => {
                if (
                    value !==
                    undefined &&
                    value !==
                    null &&
                    value !==
                    ""
                ) {
                    query.set(
                        key,
                        String(
                            value
                        )
                    );
                }
            }
        );

        const qs =
            query.toString();

        return api.get<
            ApiPage<
                OwnershipAsset
            >
        >(
            `/assets/ownership${qs
                ? `?${qs}`
                : ""
            }`
        );
    },
};

/* ======================================================
   EMPLOYEE
====================================================== */

export interface Employee {
    employee_id:
    string;

    employee_name:
    string;

    designation:
    string;

    department:
    string;

    work_field:
    string;

    sub_function:
    string;

    active:
    string;

    personal_cell:
    string;

    official_cell:
    string;

    email:
    string;

    picture:
    string;

    device_count?:
    number;
}

export const employeeApi = {
    list: (
        p?: {
            page?:
            number;

            page_size?:
            number;

            active?:
            string;
        }
    ) =>
        api.get<
            ApiPage<
                Employee
            >
        >(
            `/employees?${new URLSearchParams(
                p as any
            ).toString()}`
        ),

    get: (
        empId:
            string
    ) =>
        api.get<
            ApiOk<
                Employee
            >
        >(
            `/employees/${empId}`
        ),

    search: (
        q:
            string
    ) =>
        api.get<
            ApiOk<
                Employee[]
            >
        >(
            `/employees/search?q=${q}`
        ),
};

/* ======================================================
   CLAIMS
====================================================== */

export interface Claim {
    id:
    number;

    reference_no:
    number;

    category:
    string;

    brand:
    string;

    model_no:
    string;

    device_serial:
    string;

    problems:
    string;

    claim_status:
    number;

    service_type:
    number;

    vendor_id:
    number;

    vendor_name:
    string;

    received_date:
    string;

    return_date:
    string;

    approved_val:
    number;

    created_by:
    string;

    created_at:
    string;
}

export const claimApi = {
    list: (
        p?: {
            page?:
            number;

            page_size?:
            number;

            service_type?:
            string;
        }
    ) =>
        api.get<
            ApiPage<
                Claim
            >
        >(
            `/claims?${new URLSearchParams(
                p as any
            ).toString()}`
        ),

    get: (
        id:
            number
    ) =>
        api.get<
            ApiOk<
                Claim
            >
        >(
            `/claims/${id}`
        ),

    create: (
        body:
            Partial<Claim>
    ) =>
        api.post<
            ApiOk<{
                id:
                number;
            }>
        >(
            "/claims",
            body
        ),

    updateStatus: (
        id:
            number,

        claim_status:
            number
    ) =>
        api.put(
            `/claims/${id}/status`,
            {
                claim_status,
            }
        ),
};

/* ======================================================
   STOCK
====================================================== */

export const stockApi = {
    list: (
        p?:
            any
    ) =>
        api.get<
            ApiPage<any>
        >(
            `/stock?${new URLSearchParams(
                p ??
                {}
            ).toString()}`
        ),

    get: (
        id:
            number
    ) =>
        api.get<
            ApiOk<any>
        >(
            `/stock/${id}`
        ),

    create: (
        body:
            any
    ) =>
        api.post<
            ApiOk<{
                id:
                number;
            }>
        >(
            "/stock",
            body
        ),

    update: (
        id:
            number,

        body:
            any
    ) =>
        api.put<
            ApiOk<any>
        >(
            `/stock/${id}`,
            body
        ),
};

/* ======================================================
   VENDOR
====================================================== */

export const vendorApi = {
    list: () =>
        api.get<
            ApiOk<
                any[]
            >
        >(
            "/vendors"
        ),

    create: (
        body:
            any
    ) =>
        api.post<
            ApiOk<{
                id:
                number;
            }>
        >(
            "/vendors",
            body
        ),

    update: (
        id:
            number,

        body:
            any
    ) =>
        api.put<
            ApiOk<any>
        >(
            `/vendors/${id}`,
            body
        ),

    delete: (
        id:
            number
    ) =>
        api.del(
            `/vendors/${id}`
        ),
};

/* ======================================================
   CATEGORY
====================================================== */

export const categoryApi = {
    list: () =>
        api.get<
            ApiOk<
                any[]
            >
        >(
            "/categories"
        ),

    create: (
        body:
            any
    ) =>
        api.post<
            ApiOk<{
                id:
                number;
            }>
        >(
            "/categories",
            body
        ),
};

/* ======================================================
   REPORT TYPES
====================================================== */

export interface NonOperationalSummary {
    ownership:
    number;

    damaged:
    number;

    lost:
    number;

    total_non_operational:
    number;

    main_table_damaged:
    number;

    damage_inventory_damaged:
    number;

    duplicate_in_both_tables:
    number;

    damage_inventory_only:
    number;
}

export interface NonOperationalDevice {
    id:
    number;

    source:
    | "asset_devices"
    | "damage_inventory";

    source_id:
    number;

    device_serial:
    string |
    null;

    category:
    string |
    null;

    brand:
    string |
    null;

    model:
    string |
    null;

    emp_id:
    string |
    null;

    emp_name:
    string |
    null;

    department:
    string |
    null;

    designation:
    string |
    null;

    mr_number:
    string |
    null;

    pr_number:
    string |
    null;

    assigned_date:
    string |
    null;

    purchase_date:
    string |
    null;

    warranty_date:
    string |
    null;

    asset_status:
    number;

    status_label:
    string;

    remarks:
    string |
    null;

    damage_created_by:
    string |
    null;

    created_at:
    string |
    null;

    updated_at:
    string |
    null;
}

export interface WarrantyClaimItem {
    id:
    number;

    reference:
    string;

    employee:
    string |
    null;

    emp_id:
    string |
    null;

    department:
    string |
    null;

    designation:
    string |
    null;

    category:
    string |
    null;

    brand:
    string |
    null;

    model:
    string |
    null;

    device_serial:
    string |
    null;

    warranty_date:
    string |
    null;

    status:
    | "Claimed"
    | "To Vendor"
    | "Recovered"
    | "Expired";

    vendor:
    string |
    null;

    problems:
    string |
    null;

    created_at:
    string |
    null;
}

export interface WarrantySummaryRaw {
    claimed:
    number;

    to_vendor:
    number;

    recovered:
    number;

    expired:
    number;

    total:
    number;
}

export interface WarrantySummary {
    total:
    number;

    items:
    DashboardSummaryItem[];

    raw?:
    WarrantySummaryRaw;
}

export interface ServiceRequestSummaryRaw {
    service_request:
    number;

    to_vendor:
    number;

    closed:
    number;

    total:
    number;
}

export interface ServiceRequestSummary {
    total:
    number;

    items:
    DashboardSummaryItem[];

    raw?:
    ServiceRequestSummaryRaw;
}

export interface ServiceRequestClaimItem {
    id:
    number;

    reference:
    string;

    employee:
    string |
    null;

    emp_id:
    string |
    null;

    department:
    string |
    null;

    designation:
    string |
    null;

    category:
    string |
    null;

    brand:
    string |
    null;

    model:
    string |
    null;

    device_serial:
    string |
    null;

    warranty_date:
    string |
    null;

    status:
    | "Service Request"
    | "Transferred to Vendor"
    | "Closed";

    vendor:
    string |
    null;

    problems:
    string |
    null;

    created_at:
    string |
    null;
}

/* ======================================================
   REPORT API
====================================================== */

export const reportApi = {
    assets: (
        params?:
            Record<
                string,
                any
            >
    ) =>
        api.get<
            ApiOk<
                Device[]
            >
        >(
            `/reports/assets${toQuery(
                params
            )}`
        ),

    assigned: (
        params?:
            Record<
                string,
                any
            >
    ) =>
        api.get<
            ApiOk<
                Device[]
            >
        >(
            `/reports/assigned${toQuery(
                params
            )}`
        ),

    warranty: (
        params?:
            Record<
                string,
                any
            >
    ) =>
        api.get<
            ApiOk<
                Claim[]
            >
        >(
            `/reports/warranty${toQuery(
                params
            )}`
        ),

    service: (
        params?:
            Record<
                string,
                any
            >
    ) =>
        api.get<
            ApiOk<
                Claim[]
            >
        >(
            `/reports/service${toQuery(
                params
            )}`
        ),

    users: (
        params?:
            Record<
                string,
                any
            >
    ) =>
        api.get<
            ApiOk<
                Employee[]
            >
        >(
            `/reports/users${toQuery(
                params
            )}`
        ),

    disposal: (
        params?:
            Record<
                string,
                any
            >
    ) =>
        api.get<
            ApiOk<
                any[]
            >
        >(
            `/reports/disposal${toQuery(
                params
            )}`
        ),

    stockStatus: (
        params?:
            Record<
                string,
                any
            >
    ) =>
        api.get<
            ApiOk<
                any[]
            >
        >(
            `/reports/stock-status${toQuery(
                params
            )}`
        ),

    resignation: (
        params?:
            Record<
                string,
                any
            >
    ) =>
        api.get<
            ApiOk<
                any[]
            >
        >(
            `/reports/resignation${toQuery(
                params
            )}`
        ),

    renewal: (
        params?:
            Record<
                string,
                any
            >
    ) =>
        api.get<
            ApiOk<
                any[]
            >
        >(
            `/reports/renewal${toQuery(
                params
            )}`
        ),

    nonOperational: (
        params?: {
            status?:
            string;

            detail?:
            | "all"
            | "main_table"
            | "damage_inventory"
            | "duplicates"
            | "inventory_only";
        }
    ) =>
        api.get<
            ApiOk<
                NonOperationalDevice[]
            >
        >(
            `/assets/non-operational${toQuery(
                params
            )}`
        ),

    nonOperationalSummary:
        () =>
            api.get<
                ApiOk<
                    NonOperationalSummary
                >
            >(
                "/assets/non-operational/summary"
            ),

    warrantySummary:
        () =>
            api.get<
                ApiOk<
                    WarrantySummary
                >
            >(
                "/assets/warranty/summary"
            ),

    serviceRequestSummary:
        () =>
            api.get<
                ApiOk<
                    ServiceRequestSummary
                >
            >(
                "/assets/service-requests/summary"
            ),

    serviceRequestClaims:
        (
            params?: {
                page?:
                number;

                limit?:
                number;

                status?:
                | "all"
                | "Service Request"
                | "Transferred to Vendor"
                | "Closed";

                search?:
                string;
            }
        ) =>
            api.get<
                ApiPage<
                    ServiceRequestClaimItem
                >
            >(
                `/assets/service-requests/claims${toQuery(
                    params
                )}`
            ),

    warrantyClaims: (
        params?: {
            page?:
            number;

            limit?:
            number;

            status?:
            | "all"
            | "Claimed"
            | "To Vendor"
            | "Recovered"
            | "Expired";

            search?:
            string;
        }
    ) =>
        api.get<
            ApiPage<
                WarrantyClaimItem
            >
        >(
            `/assets/warranty/claims${toQuery(
                params
            )}`
        ),
};

export const reportsApi =
    reportApi;



export interface RequisitionDashboardSummary {
    pending_categories: number;
    approval_pending: number;
    rejected: number;
    approved: number;
    total_active: number;
}

export interface RequisitionCategorySummary {
    category: string;
    pending_count: number;
}

export interface RequisitionItem {
    id: number;

    tt_no: string;

    category: string;

    employee_id: string;
    employee_name: string;

    reason_details: string;

    created_by: string;
    created_by_name: string;

    created_at: string;

    device_sl_no: string;

    approved_val: number;
    approval_status: string;

    approved_by: string;
    approved_by_name: string;
    approved_date: string;

    delivered_val: number;
    delivery_status: string;

    delivered_by: string;
    delivered_by_name: string;
    delivered_date: string;

    device_assigned_val: number;
    device_assigned_by: string;
    device_assigned_date: string;
}


/* ======================================================
   USER DOWNSTREAM SUMMARY
====================================================== */

export interface DownstreamEmployeeSummary {
    direct_employees: number;
    all_employees: number;
}

export interface DownstreamDeviceSummary {
    assigned_devices: number;
    direct_devices: number;
    indirect_devices: number;
}

export interface DownstreamTicketSummary {
    total: number;
    open: number;
    running: number;
    closed: number;
}

export interface DownstreamSummaryData {
    employees: DownstreamEmployeeSummary;
    devices: DownstreamDeviceSummary;
    tickets: DownstreamTicketSummary;
}

export const downstreamApi = {
    summary: () =>
        api.get<
            ApiOk<
                DownstreamSummaryData
            >
        >(
            "/user/downstream-summary"
        ),
};


/* ======================================================
   USER SIDEBAR SUMMARY
====================================================== */

export interface UserSidebarSummaryData {
    device_count: number;
    ticket_count: number;
}

export const userSidebarApi = {
    summary: () =>
        api.get<
            ApiOk<UserSidebarSummaryData>
        >(
            "/user/sidebar-summary"
        ),
};


/* ======================================================
   OWN USER DEVICES
====================================================== */

export interface OwnDeviceItem {
    id: number;
    device_serial: string;
    category: string;
    brand: string;
    model: string;

    employee_id: string;
    employee_name: string;
    department: string;
    designation: string;

    mr_number: string;
    pr_number: string;

    assigned_date: string;
    purchase_date: string;
    warranty_date: string;

    status: string;
}

export const ownDevicesApi = {
    list: (
        params?: {
            page?: number;
            limit?: number;
            search?: string;
        }
    ) =>
        api.get<
            ApiPage<OwnDeviceItem>
        >(
            `/user/devices${toQuery(
                params
            )}`
        ),
};



/* ======================================================
   DOWNSTREAM DEVICES
====================================================== */

export type DownstreamDeviceScope =
    | "all"
    | "direct"
    | "indirect";

export interface DownstreamDeviceItem {
    id: number;

    device_serial: string;
    category: string;
    brand: string;
    model: string;

    employee_id: string;
    employee_name: string;
    department: string;
    designation: string;

    relationship: string;
    tier_level: number;

    mr_number: string;
    pr_number: string;

    assigned_date: string;
    purchase_date: string;
    warranty_date: string;

    status: string;
}

export interface DownstreamDevicesParams {
    page?: number;
    limit?: number;
    search?: string;
    scope?: DownstreamDeviceScope;
}

export const downstreamDevicesApi = {
    list: (
        params?: DownstreamDevicesParams
    ) =>
        api.get<
            ApiPage<DownstreamDeviceItem>
        >(
            `/user/downstream-devices${toQuery(
                params
            )}`
        ),
};