

// // itm/frontend/lib/role-access-api.ts

// import {
//     api,
//     type ApiOk,
//     type ApiPage,
// } from "@/lib/api";

// /* ======================================================
//    TYPES
// ====================================================== */

// export interface RoleAccessOverview {
//     total_roles: number;
//     total_permissions: number;
//     total_users: number;
//     privileged_users: number;
// }

// export interface RoleAccessPermission {
//     id: number;
//     code: string;
//     name: string;
//     active: boolean;
// }

// export interface RoleAccessRole {
//     id: number;
//     code: string;
//     name: string;
//     legacy_user_type: number;
//     hierarchy_level: number;
//     active: boolean;
//     user_count: number;
//     protected: boolean;
//     permissions: RoleAccessPermission[];
// }

// export interface RoleAccessUser {
//     id: number;
//     username: string;
//     employee_id: string;
//     full_name: string;
//     email: string;
//     user_type: number;
//     role_id: number;
//     role_code: string;
//     role_name: string;
//     account_status: string;
//     active: boolean;
//     protected: boolean;
// }

// /* ======================================================
//    REQUEST TYPES
// ====================================================== */

// export interface RoleAccessUsersParams {
//     page?: number;
//     limit?: number;
//     search?: string;
//     role?: string;
// }

// export interface UpdateUserRoleResult {
//     updated: boolean;
//     user_id: number;
//     role_id: number;
//     role_code: string;
//     role_name: string;
//     user_type: number;
// }

// export interface UpdateRolePermissionsResult {
//     updated: boolean;
//     role_id: number;
//     permission_count: number;
// }

// /* ======================================================
//    HELPERS
// ====================================================== */

// function buildQuery(
//     params?: RoleAccessUsersParams
// ): string {
//     const query = new URLSearchParams();

//     if (params?.page !== undefined) {
//         query.set(
//             "page",
//             String(params.page)
//         );
//     }

//     if (params?.limit !== undefined) {
//         query.set(
//             "limit",
//             String(params.limit)
//         );
//     }

//     const search =
//         params?.search?.trim();

//     if (search) {
//         query.set(
//             "search",
//             search
//         );
//     }

//     const role =
//         params?.role
//             ?.trim()
//             .toUpperCase();

//     if (
//         role &&
//         role !== "ALL"
//     ) {
//         query.set(
//             "role",
//             role
//         );
//     }

//     const value =
//         query.toString();

//     return value
//         ? `? ${ value } `
//         : "";
// }

// /* ======================================================
//    API
// ====================================================== */

// export const roleAccessApi = {
//     /* --------------------------------------------------
//        OVERVIEW
//     -------------------------------------------------- */

//     overview: () =>
//         api.get<
//             ApiOk<RoleAccessOverview>
//         >(
//             "/admin/role-access/overview"
//         ),

//     /* --------------------------------------------------
//        ROLES
//     -------------------------------------------------- */

//     roles: () =>
//         api.get<
//             ApiOk<RoleAccessRole[]>
//         >(
//             "/admin/role-access/roles"
//         ),

//     /* --------------------------------------------------
//        PERMISSIONS
//     -------------------------------------------------- */

//     permissions: () =>
//         api.get<
//             ApiOk<RoleAccessPermission[]>
//         >(
//             "/admin/role-access/permissions"
//         ),

//     /* --------------------------------------------------
//        USERS
//     -------------------------------------------------- */

//     users: (
//         params?: RoleAccessUsersParams
//     ) =>
//         api.get<
//             ApiPage<RoleAccessUser>
//         >(
//             `/ admin / role - access / users${
//     buildQuery(
//         params
//     )
// } `
//         ),

//     /* --------------------------------------------------
//        CHANGE USER ROLE
//     -------------------------------------------------- */

//     updateUserRole: (
//         userID: number,
//         roleID: number
//     ) =>
//         api.put<
//             ApiOk<UpdateUserRoleResult>
//         >(
//             `/ admin / role - access / users / ${ userID }/role`,
// {
//     role_id: roleID,
//             }
//         ),

// /* --------------------------------------------------
//    UPDATE ROLE PERMISSIONS
// -------------------------------------------------- */

// updateRolePermissions: (
//     roleID: number,
//     permissionIDs: number[]
// ) =>
//     api.put<
//         ApiOk<UpdateRolePermissionsResult>
//     >(
//         `/admin/role-access/roles/${roleID}/permissions`,
//         {
//             permission_ids:
//                 permissionIDs,
//         }
//     ),
// };



// itm/frontend/lib/role-access-api.ts

import {
    api,
    type ApiOk,
    type ApiPage,
} from "@/lib/api";

/* ============================================================
   TYPES
============================================================ */

export interface RoleAccessPermission {
    id: number;
    code: string;
    name: string;
    active: boolean;
}

export interface RoleAccessRole {
    id: number;

    code: string;
    name: string;

    legacy_user_type: number;
    hierarchy_level: number;

    active: boolean;

    user_count: number;

    protected: boolean;

    permissions: RoleAccessPermission[];
}

export interface RoleAccessOverview {
    total_roles: number;
    total_permissions: number;
    total_users: number;
    privileged_users: number;
}

export interface RoleAccessUser {
    id: number;

    username: string;
    employee_id: string;

    full_name: string;
    email: string;

    user_type: number;

    role_id: number;
    role_code: string;
    role_name: string;

    account_status: string;
    active: boolean;

    protected: boolean;
}

export interface RoleAccessUserParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
}

/* ============================================================
   QUERY
============================================================ */

function queryString(
    params?: RoleAccessUserParams
): string {
    if (!params) {
        return "";
    }

    const query =
        new URLSearchParams();

    if (
        params.page !== undefined
    ) {
        query.set(
            "page",
            String(params.page)
        );
    }

    if (
        params.limit !== undefined
    ) {
        query.set(
            "limit",
            String(params.limit)
        );
    }

    const search =
        params.search?.trim();

    if (search) {
        query.set(
            "search",
            search
        );
    }

    const role =
        params.role?.trim();

    /*
     * Backend understands ALL, but there is no reason
     * to send the role parameter for the All Roles case.
     */
    if (
        role &&
        role.toUpperCase() !== "ALL"
    ) {
        query.set(
            "role",
            role
        );
    }

    const value =
        query.toString();

    return value
        ? `?${value}`
        : "";
}

/* ============================================================
   API
============================================================ */

const BASE_PATH =
    "/admin/role-access";

export const roleAccessApi = {
    /* --------------------------------------------------------
       DASHBOARD METRICS
       GET /api/v1/admin/role-access/overview
    -------------------------------------------------------- */

    overview: () =>
        api.get<
            ApiOk<RoleAccessOverview>
        >(
            `${BASE_PATH}/overview`
        ),

    /* --------------------------------------------------------
       ROLES
       GET /api/v1/admin/role-access/roles
    -------------------------------------------------------- */

    roles: () =>
        api.get<
            ApiOk<RoleAccessRole[]>
        >(
            `${BASE_PATH}/roles`
        ),

    /* --------------------------------------------------------
       PERMISSIONS
       GET /api/v1/admin/role-access/permissions
    -------------------------------------------------------- */

    permissions: () =>
        api.get<
            ApiOk<RoleAccessPermission[]>
        >(
            `${BASE_PATH}/permissions`
        ),

    /* --------------------------------------------------------
       USER ACCESS DIRECTORY

       GET
       /api/v1/admin/role-access/users
            ?page=1
            &limit=20
            &search=...
            &role=IT_ADMIN
    -------------------------------------------------------- */

    users: (
        params?: RoleAccessUserParams
    ) =>
        api.get<
            ApiPage<RoleAccessUser>
        >(
            `${BASE_PATH}/users${queryString(
                params
            )}`
        ),

    /* --------------------------------------------------------
       CHANGE USER ROLE

       PUT
       /api/v1/admin/role-access/users/:id/role
    -------------------------------------------------------- */

    updateUserRole: (
        userID: number,
        roleID: number
    ) =>
        api.put<
            ApiOk<{
                updated: boolean;

                user_id: number;

                username: string;

                role_id: number;
                role_code: string;
                role_name: string;

                user_type: number;
            }>
        >(
            `${BASE_PATH}/users/${userID}/role`,
            {
                role_id: roleID,
            }
        ),

    /* --------------------------------------------------------
       UPDATE ROLE PERMISSIONS

       PUT
       /api/v1/admin/role-access/roles/:id/permissions
    -------------------------------------------------------- */

    updateRolePermissions: (
        roleID: number,
        permissionIDs: number[]
    ) =>
        api.put<
            ApiOk<{
                updated: boolean;

                role_id: number;
                role_code: string;
                role_name: string;

                permission_count: number;
            }>
        >(
            `${BASE_PATH}/roles/${roleID}/permissions`,
            {
                permission_ids:
                    permissionIDs,
            }
        ),
};