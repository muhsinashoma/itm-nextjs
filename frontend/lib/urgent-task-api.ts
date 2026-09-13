// //frotend/list/urgent-task-api.ts
// import {
//     api,
//     getUser,
//     type ApiOk,
//     type ApiPage,
// } from "@/lib/api";

// export type UrgentTaskPriority =
//     | "Critical"
//     | "High"
//     | "Medium"
//     | "Low";

// export type UrgentTaskStatus =
//     | "Pending"
//     | "In Progress"
//     | "Completed";

// export interface UrgentTask {
//     id: number;
//     reference: string;
//     title: string;
//     description: string;
//     priority: UrgentTaskPriority;
//     status: UrgentTaskStatus;
//     due_date: string;
//     assigned_to: string;
//     assigned_to_name: string;
//     generated_by: string;
//     generated_by_name: string;
//     created_at: string;
//     updated_at: string;
//     completed_at?: string | null;
// }

// export interface UrgentTaskCreateInput {
//     title: string;
//     description: string;
//     priority: UrgentTaskPriority;
//     status: UrgentTaskStatus;
//     due_date: string;
//     assigned_to: string;
// }

// export interface UrgentTaskListParams {
//     page?: number;
//     limit?: number;
//     search?: string;
//     status?: UrgentTaskStatus | "all";
//     priority?: UrgentTaskPriority | "all";
// }

// export interface ActiveEmployeeOption {
//     employee_id: string;
//     employee_name: string;
//     designation?: string | null;
//     department?: string | null;
// }

// /**
//  * Builds a query string from any typed object.
//  *
//  * Important:
//  * Do not type this parameter as Record<string, unknown>.
//  * A normal TypeScript interface such as UrgentTaskListParams does not
//  * automatically provide a string index signature, so passing it to a
//  * Record<string, unknown> parameter causes TS2345.
//  */
// function queryString<T extends object>(
//     params?: T
// ): string {
//     if (!params) {
//         return "";
//     }

//     const query = new URLSearchParams();

//     Object.entries(params).forEach(
//         ([key, value]) => {
//             if (
//                 value !== undefined &&
//                 value !== null &&
//                 String(value).trim() !== ""
//             ) {
//                 query.set(
//                     key,
//                     String(value)
//                 );
//             }
//         }
//     );

//     const result = query.toString();

//     return result
//         ? `?${result}`
//         : "";
// }

// export const urgentTaskApi = {
//     list: (
//         params?: UrgentTaskListParams
//     ) =>
//         api.get<ApiPage<UrgentTask>>(
//             `/dashboard/urgent-tasks${queryString(
//                 params
//             )}`
//         ),

//     sidebar: (
//         limit = 5
//     ) =>
//         api.get<ApiOk<UrgentTask[]>>(
//             `/dashboard/urgent-tasks/sidebar?limit=${encodeURIComponent(
//                 String(limit)
//             )}`
//         ),

//     create: (
//         body: UrgentTaskCreateInput
//     ) =>
//         api.post<ApiOk<UrgentTask>>(
//             "/dashboard/urgent-tasks",
//             body
//         ),

//     update: (
//         id: number,
//         body: UrgentTaskCreateInput
//     ) =>
//         api.put<
//             ApiOk<{
//                 updated: boolean;
//             }>
//         >(
//             `/dashboard/urgent-tasks/${id}`,
//             body
//         ),

//     complete: (
//         id: number
//     ) =>
//         api.patch<
//             ApiOk<{
//                 id: number;
//                 reference: string;
//                 status: "Completed";
//                 completed_by: string;
//                 completed_at: string;
//             }>
//         >(
//             `/dashboard/urgent-tasks/${id}/complete`,
//             {}
//         ),

//     remove: (
//         id: number
//     ) =>
//         api.del<void>(
//             `/dashboard/urgent-tasks/${id}`
//         ),

//     employees: () =>
//         api.get<
//             ApiPage<ActiveEmployeeOption>
//         >(
//             "/employees?page=1&page_size=200&active=Active"
//         ),

//     currentUser: () =>
//         getUser(),
// };



// // frontend/lib/urgent-task-api.ts

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

function queryString<T extends object>(
    params?: T
): string {
    if (!params) {
        return "";
    }

    const query =
        new URLSearchParams();

    Object.entries(
        params
    ).forEach(
        ([key, value]) => {
            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                query.set(
                    key,
                    String(value)
                );
            }
        }
    );

    const result =
        query.toString();

    return result
        ? `?${result}`
        : "";
}

/**
 * Always return urgent tasks newest first.
 *
 * The backend should also use:
 *
 *     ORDER BY id DESC
 *
 * This client-side ordering provides a defensive guarantee so the UI remains
 * newest-first even if the API response is not ordered correctly.
 */
function newestFirst(
    items: UrgentTask[]
): UrgentTask[] {
    return [
        ...items,
    ].sort(
        (a, b) =>
            Number(b.id) -
            Number(a.id)
    );
}

export const urgentTaskApi = {
    list: async (
        params?: UrgentTaskListParams
    ): Promise<
        ApiPage<UrgentTask>
    > => {
        const response =
            await api.get<
                ApiPage<UrgentTask>
            >(
                `/dashboard/urgent-tasks${queryString(
                    params
                )}`
            );

        return {
            ...response,
            data: newestFirst(
                response.data ?? []
            ),
        };
    },

    sidebar: async (
        limit = 5
    ): Promise<
        ApiOk<UrgentTask[]>
    > => {
        const response =
            await api.get<
                ApiOk<UrgentTask[]>
            >(
                `/dashboard/urgent-tasks/sidebar?limit=${encodeURIComponent(
                    String(limit)
                )}`
            );

        return {
            ...response,
            data: newestFirst(
                response.data ?? []
            ),
        };
    },

    create: (
        body: UrgentTaskCreateInput
    ) =>
        api.post<
            ApiOk<UrgentTask>
        >(
            "/dashboard/urgent-tasks",
            body
        ),

    update: (
        id: number,
        body: UrgentTaskCreateInput
    ) =>
        api.put<
            ApiOk<{
                updated: boolean;
            }>
        >(
            `/dashboard/urgent-tasks/${id}`,
            body
        ),

    complete: (
        id: number
    ) =>
        api.patch<
            ApiOk<{
                id: number;
                reference: string;
                status: "Completed";
                completed_by: string;
                completed_at: string;
            }>
        >(
            `/dashboard/urgent-tasks/${id}/complete`,
            {}
        ),

    remove: (
        id: number
    ) =>
        api.del<void>(
            `/dashboard/urgent-tasks/${id}`
        ),

    employees: () =>
        api.get<
            ApiPage<ActiveEmployeeOption>
        >(
            "/employees?page=1&page_size=200&active=Active"
        ),

    currentUser: () =>
        getUser(),
};

