
//frontend/lib/api.ts

// lib/api.ts — Central API client for ITM Go backend
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("itm_token");
}
export function getUser(): Record<string, any> | null {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem("itm_user") ?? "null"); } catch { return null; }
}
export function clearAuth() {
    localStorage.removeItem("itm_token");
    localStorage.removeItem("itm_user");
    window.location.href = "/auth";
}


async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();

    const res = await fetch(`${BASE}${path}`, {
        ...options,
        cache: "no-store",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers ?? {}),
        },
    });

    if (res.status === 401) {
        clearAuth();
        throw new Error("Session expired");
    }

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.success === false) {
        throw new Error(
            data?.error ||
            data?.message ||
            `HTTP ${res.status}`
        );
    }

    return data as T;
}

export interface ApiOk<T> { success: boolean; data: T; }
export interface ApiPage<T> { success: boolean; data: T[]; total: number; page: number; page_size: number; }

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
    del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const authApi = {
    login: (username: string, password: string) =>
        api.post<ApiOk<{ token: string; expires_in: number; user_id: number; employee_id: string; username: string; full_name: string; user_type: number }>>("/auth/login", { username, password }),
    refresh: () => api.post<ApiOk<{ token: string; expires_in: number }>>("/auth/refresh"),
};

export interface DashboardStats { total_devices: number; assigned_devices: number; stock_devices: number; active_employees: number; open_tickets: number; running_tickets: number; closed_tickets: number; warranty_expiring_30d: number; }
export interface TicketTrend { day: string; open: number; running: number; closed: number; total: number; }

//new adding

export type DashboardSummaryItem = {
    label: string;
    value: number;
};

export type DashboardSummaryGroup = {
    total: number;
    items: DashboardSummaryItem[];
};

export type DashboardSummary = {
    active_assets: DashboardSummaryGroup;
    non_operational: DashboardSummaryGroup;
    service_requests: DashboardSummaryGroup;
    warranty: DashboardSummaryGroup;
    employees?: DashboardSummaryGroup;
    stock?: DashboardSummaryGroup;
};


//Adding new

export const dashboardApi = {
    summary: () => api.get<ApiOk<DashboardSummary>>("/dashboard/summary"),

    getStats: () => api.get<ApiOk<DashboardStats>>("/dashboard/stats"),
    stats: () => api.get<ApiOk<DashboardStats>>("/dashboard/stats"),

    getTicketTrend: () => api.get<ApiOk<TicketTrend[]>>("/dashboard/ticket-trend"),
    ticketTrend: () => api.get<ApiOk<TicketTrend[]>>("/dashboard/ticket-trend"),
};

export interface Ticket { id: number; tt_no: number; employee_id: string; employee_name: string; department: string; phone: string; email: string; client_name: string; fault_type: number; fault_type_name: string; reason_of_problem: string; fault_date_time: string; status_progress: number; attach_file: string; created_by: string; created_at: string; ticket_age: string; }
export const ticketApi = {
    list: (p?: { page?: number; page_size?: number; status?: string; emp_id?: string; search?: string }) => {
        const q = new URLSearchParams(Object.fromEntries(Object.entries(p ?? {}).filter(([, v]) => v !== undefined)) as any).toString();
        return api.get<ApiPage<Ticket>>(`/tickets?${q}`);
    },
    get: (id: number) => api.get<ApiOk<Ticket>>(`/tickets/${id}`),
    create: (body: Partial<Ticket>) => api.post<ApiOk<{ id: number; tt_no: number }>>("/tickets", body),
    update: (id: number, body: Partial<Ticket>) => api.put<ApiOk<any>>(`/tickets/${id}`, body),
    close: (id: number, closing_description?: string) => api.patch(`/tickets/${id}/close`, { closing_description }),
    updateStatus: (id: number, status: number) => api.patch(`/tickets/${id}/status`, { status }),
    delete: (id: number) => api.del(`/tickets/${id}`),
    getUpdates: (id: number) => api.get<ApiOk<any[]>>(`/tickets/${id}/updates`),
    addUpdate: (id: number, body: any) => api.post(`/tickets/${id}/updates`, body),
};

export interface Device { id: number; emp_id: string; emp_name: string; department: string; designation: string; category: string; brand: string; device_serial: string; model_no: string; device_type: number; status: string; assign_date: string; warranty_date: string; vendor: string; mr_number: string; pr_number: string; os: string; cpu: string; ram: string; hdd: string; monitor: string; ip_address: string; active: number; return_status: number; transfer_status: number; device_age: string; warranty_left: string; created_at: string; }
export const deviceApi = {
    list: (p?: { page?: number; page_size?: number; category?: string; status?: string; search?: string }) => {
        const q = new URLSearchParams(Object.fromEntries(Object.entries(p ?? {}).filter(([, v]) => v !== undefined)) as any).toString();
        return api.get<ApiPage<Device>>(`/devices?${q}`);
    },
    get: (id: number) => api.get<ApiOk<Device>>(`/devices/${id}`),
    byEmployee: (empId: string) => api.get<ApiOk<Device[]>>(`/devices/employee/${empId}`),
    bySerial: (serial: string) => api.get<ApiOk<Device>>(`/devices/serial/${serial}`),
    create: (body: Partial<Device>) => api.post<ApiOk<{ id: number }>>("/devices", body),
    update: (id: number, body: Partial<Device>) => api.put<ApiOk<any>>(`/devices/${id}`, body),
    transfer: (id: number, to_emp_id: string, remarks?: string) => api.post(`/devices/${id}/transfer`, { to_emp_id, remarks }),
    return: (id: number, remarks?: string) => api.post(`/devices/${id}/return`, { remarks }),
    history: (id: number) => api.get<ApiOk<any[]>>(`/devices/${id}/history`),
    delete: (id: number) => api.del(`/devices/${id}`),
};

// export interface AssetDevice {
//     id: number;
//     device_serial: string | null;
//     category: string | null;
//     brand: string | null;
//     model: string | null;
//     device_type: string | null;

//     asset_status: number;
//     status_label: string;

//     emp_id: string | null;
//     emp_name: string | null;
//     department: string | null;
//     designation: string | null;
//     assigned_date: string | null;

//     vendor_id: number | null;
//     vendor_name: string | null;
//     vendor_flag: number | null;

//     mr_number: string | null;
//     pr_number: string | null;

//     purchase_date: string | null;
//     warranty_date: string | null;

//     created_at: string | null;
//     updated_at: string | null;
// }


export interface AssetDevice {
    id: number;
    device_serial: string | null;
    category: string | null;
    brand: string | null;
    model: string | null;
    device_type: string | null;

    asset_status: number;
    status_label: string;

    emp_id: string | null;
    emp_name: string | null;
    employee_image?: string | null;

    department: string | null;
    designation: string | null;
    assigned_date: string | null;

    vendor_id: number | null;
    vendor_name: string | null;

    mr_number: string | null;
    pr_number: string | null;
    purchase_date: string | null;
    warranty_date: string | null;
}

export interface AssetDeviceHistory {
    id: number;
    asset_device_id: number;
    legacy_equipment_id: number;

    device_serial: string | null;
    status_code: number | null;
    status_label: string;
    raw_status: string | null;

    previous_status: number | null;
    return_status: number | null;
    transfer_status: number | null;

    emp_id: string | null;
    emp_name: string | null;
    department: string | null;
    designation: string | null;

    mr_number: string | null;
    pr_number: string | null;
    vendor: string | null;

    assigned_date: string | null;
    transferred_at: string | null;
    returned_at: string | null;

    history_reason: string;
    created_at_source: string | null;
    updated_at_source: string | null;
    migrated_at: string | null;
}



export const assetDeviceApi = {
    list: (params?: {
        page?: number;
        limit?: number;
        category?: string;
        status?: number;
        vendor_id?: number;
        search?: string;
    }) => {
        const query = new URLSearchParams();

        Object.entries(params ?? {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                query.set(key, String(value));
            }
        });

        const qs = query.toString();

        return api.get<ApiPage<AssetDevice>>(
            `/assets/devices${qs ? `?${qs}` : ""}`
        );
    },

    get: (id: number) =>
        api.get<ApiOk<AssetDevice>>(`/assets/devices/${id}`),

    history: (id: number) =>
        api.get<ApiOk<AssetDeviceHistory[]>>(`/assets/devices/${id}/history`),
};


export interface Employee { employee_id: string; employee_name: string; designation: string; department: string; work_field: string; sub_function: string; active: string; personal_cell: string; official_cell: string; email: string; picture: string; device_count?: number; }
export const employeeApi = {
    list: (p?: { page?: number; page_size?: number; active?: string }) => api.get<ApiPage<Employee>>(`/employees?${new URLSearchParams(p as any).toString()}`),
    get: (empId: string) => api.get<ApiOk<Employee>>(`/employees/${empId}`),
    search: (q: string) => api.get<ApiOk<Employee[]>>(`/employees/search?q=${q}`),
};

export interface Claim { id: number; reference_no: number; category: string; brand: string; model_no: string; device_serial: string; problems: string; claim_status: number; service_type: number; vendor_id: number; vendor_name: string; received_date: string; return_date: string; approved_val: number; created_by: string; created_at: string; }
export const claimApi = {
    list: (p?: { page?: number; page_size?: number; service_type?: string }) => api.get<ApiPage<Claim>>(`/claims?${new URLSearchParams(p as any).toString()}`),
    get: (id: number) => api.get<ApiOk<Claim>>(`/claims/${id}`),
    create: (body: Partial<Claim>) => api.post<ApiOk<{ id: number }>>("/claims", body),
    updateStatus: (id: number, claim_status: number) => api.put(`/claims/${id}/status`, { claim_status }),
};

export const stockApi = {
    list: (p?: any) => api.get<ApiPage<any>>(`/stock?${new URLSearchParams(p ?? {}).toString()}`),
    get: (id: number) => api.get<ApiOk<any>>(`/stock/${id}`),
    create: (body: any) => api.post<ApiOk<{ id: number }>>("/stock", body),
    update: (id: number, body: any) => api.put<ApiOk<any>>(`/stock/${id}`, body),
};

export const vendorApi = {
    list: () => api.get<ApiOk<any[]>>("/vendors"),
    create: (body: any) => api.post<ApiOk<{ id: number }>>("/vendors", body),
    update: (id: number, body: any) => api.put<ApiOk<any>>(`/vendors/${id}`, body),
    delete: (id: number) => api.del(`/vendors/${id}`),
};

export const categoryApi = {
    list: () => api.get<ApiOk<any[]>>("/categories"),
    create: (body: any) => api.post<ApiOk<{ id: number }>>("/categories", body),
};


//Adding New

function toQuery(params?: Record<string, any>) {
    if (!params) return "";

    const q = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            q.set(key, String(value));
        }
    });

    const query = q.toString();
    return query ? `?${query}` : "";
}

//Adding New : Reports API

export const reportApi = {
    assets: (params?: Record<string, any>) =>
        api.get<ApiOk<Device[]>>(`/reports/assets${toQuery(params)}`),

    assigned: (params?: Record<string, any>) =>
        api.get<ApiOk<Device[]>>(`/reports/assigned${toQuery(params)}`),

    warranty: (params?: Record<string, any>) =>
        api.get<ApiOk<Claim[]>>(`/reports/warranty${toQuery(params)}`),

    service: (params?: Record<string, any>) =>
        api.get<ApiOk<Claim[]>>(`/reports/service${toQuery(params)}`),

    users: (params?: Record<string, any>) =>
        api.get<ApiOk<Employee[]>>(`/reports/users${toQuery(params)}`),

    disposal: (params?: Record<string, any>) =>
        api.get<ApiOk<any[]>>(`/reports/disposal${toQuery(params)}`),

    stockStatus: (params?: Record<string, any>) =>
        api.get<ApiOk<any[]>>(`/reports/stock-status${toQuery(params)}`),

    resignation: (params?: Record<string, any>) =>
        api.get<ApiOk<any[]>>(`/reports/resignation${toQuery(params)}`),

    renewal: (params?: Record<string, any>) =>
        api.get<ApiOk<any[]>>(`/reports/renewal${toQuery(params)}`),

    nonOperational: (params?: Record<string, any>) =>
        api.get<ApiOk<any[]>>(`/reports/non-operational${toQuery(params)}`),
};


export const reportsApi = reportApi;