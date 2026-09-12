import {
    api,
    getUser,
    type ApiOk,
    type ApiPage,
} from "@/lib/api";

export type UrgentTaskPriority =
    | "Critical"
    | "High"
    | "Medium"
    | "Low";

export type UrgentTaskStatus =
    | "Pending"
    | "In Progress"
    | "Completed";

export interface UrgentTask {
    id: number;
    reference: string;
    title: string;
    description: string;
    priority: UrgentTaskPriority;
    status: UrgentTaskStatus;
    due_date: string;
    assigned_to: string;
    assigned_to_name: string;
    generated_by: string;
    generated_by_name: string;
    created_at: string;
    updated_at: string;
    completed_at?: string | null;
}

export interface UrgentTaskCreateInput {
    title: string;
    description: string;
    priority: UrgentTaskPriority;
    status: UrgentTaskStatus;
    due_date: string;
    assigned_to: string;
}

export interface UrgentTaskListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: UrgentTaskStatus | "all";
    priority?: UrgentTaskPriority | "all";
}

export interface ActiveEmployeeOption {
    employee_id: string;
    employee_name: string;
    designation?: string | null;
    department?: string | null;
}

function queryString(params?: Record<string, unknown>) {
    if (!params) return "";

    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            query.set(key, String(value));
        }
    });

    const result = query.toString();
    return result ? `?${result}` : "";
}

export const urgentTaskApi = {
    list: (params?: UrgentTaskListParams) =>
        api.get<ApiPage<UrgentTask>>(
            `/dashboard/urgent-tasks${queryString(params)}`
        ),

    sidebar: (limit = 5) =>
        api.get<ApiOk<UrgentTask[]>>(
            `/dashboard/urgent-tasks/sidebar?limit=${limit}`
        ),

    create: (body: UrgentTaskCreateInput) =>
        api.post<ApiOk<UrgentTask>>(
            "/dashboard/urgent-tasks",
            body
        ),

    update: (id: number, body: UrgentTaskCreateInput) =>
        api.put<ApiOk<{ updated: boolean }>>(
            `/dashboard/urgent-tasks/${id}`,
            body
        ),

    remove: (id: number) =>
        api.del<void>(`/dashboard/urgent-tasks/${id}`),

    employees: () =>
        api.get<ApiOk<ActiveEmployeeOption[]>>(
            "/dashboard/trouble-ticket-it-personnel"
        ),

    currentUser: () => getUser(),
};
