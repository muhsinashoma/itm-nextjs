//itm/frontend/app/dashboard/admin/role-access/page.tsx

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    Check,
    KeyRound,
    Loader2,
    LockKeyhole,
    RefreshCw,
    Search,
    ShieldCheck,
    UserCog,
    Users,
} from "lucide-react";

import {
    authApi,
    type AuthMeData,
} from "@/lib/api";

import {
    roleAccessApi,
    type RoleAccessOverview,
    type RoleAccessPermission,
    type RoleAccessRole,
    type RoleAccessUser,
} from "@/lib/role-access-api";

const PAGE_SIZE =
    20;

type Tab =
    | "roles"
    | "users";

const EMPTY_OVERVIEW:
    RoleAccessOverview =
{
    total_roles: 0,

    total_permissions: 0,

    total_users: 0,

    privileged_users: 0,
};

export default function RoleAccessPage() {
    const [
        me,
        setMe,
    ] =
        useState<AuthMeData | null>(
            null
        );

    const [
        overview,
        setOverview,
    ] =
        useState(
            EMPTY_OVERVIEW
        );

    const [
        roles,
        setRoles,
    ] =
        useState<
            RoleAccessRole[]
        >([]);

    const [
        permissions,
        setPermissions,
    ] =
        useState<
            RoleAccessPermission[]
        >([]);

    const [
        selectedRoleID,
        setSelectedRoleID,
    ] =
        useState<
            number | null
        >(
            null
        );

    const [
        permissionDraft,
        setPermissionDraft,
    ] =
        useState<
            Set<number>
        >(
            new Set()
        );

    const [
        tab,
        setTab,
    ] =
        useState<Tab>(
            "roles"
        );

    const [
        users,
        setUsers,
    ] =
        useState<
            RoleAccessUser[]
        >([]);

    const [
        usersTotal,
        setUsersTotal,
    ] =
        useState(
            0
        );

    const [
        page,
        setPage,
    ] =
        useState(
            1
        );

    const [
        search,
        setSearch,
    ] =
        useState(
            ""
        );

    const [
        appliedSearch,
        setAppliedSearch,
    ] =
        useState(
            ""
        );

    const [
        roleFilter,
        setRoleFilter,
    ] =
        useState(
            "ALL"
        );

    const [
        loading,
        setLoading,
    ] =
        useState(
            true
        );

    const [
        saving,
        setSaving,
    ] =
        useState(
            false
        );

    const [
        error,
        setError,
    ] =
        useState(
            ""
        );

    const [
        success,
        setSuccess,
    ] =
        useState(
            ""
        );

    const selectedRole =
        useMemo(
            () =>
                roles.find(
                    (
                        role
                    ) =>
                        role.id ===
                        selectedRoleID
                ) ??
                null,
            [
                roles,
                selectedRoleID,
            ]
        );

    const canManage =
        me?.permissions.includes(
            "roles.manage"
        ) ??
        false;

    const loadMain =
        useCallback(
            async () => {
                setLoading(
                    true
                );

                setError(
                    ""
                );

                try {
                    const [
                        meResponse,
                        overviewResponse,
                        roleResponse,
                        permissionResponse,
                    ] =
                        await Promise.all(
                            [
                                authApi.me(),

                                roleAccessApi.overview(),

                                roleAccessApi.roles(),

                                roleAccessApi.permissions(),
                            ]
                        );

                    setMe(
                        meResponse.data
                    );

                    setOverview(
                        overviewResponse.data
                    );

                    const roleList =
                        roleResponse.data ??
                        [];

                    setRoles(
                        roleList
                    );

                    setPermissions(
                        permissionResponse.data ??
                        []
                    );

                    setSelectedRoleID(
                        (
                            current
                        ) =>
                            current ??
                            roleList[0]
                                ?.id ??
                            null
                    );
                } catch (
                reason
                ) {
                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load Role Access."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            []
        );

    const loadUsers =
        useCallback(
            async () => {
                try {
                    const response =
                        await roleAccessApi.users(
                            {
                                page,

                                limit:
                                    PAGE_SIZE,

                                search:
                                    appliedSearch ||
                                    undefined,

                                role:
                                    roleFilter,
                            }
                        );

                    setUsers(
                        response.data ??
                        []
                    );

                    setUsersTotal(
                        Number(
                            response.total ??
                            0
                        )
                    );
                } catch (
                reason
                ) {
                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load users."
                    );
                }
            },
            [
                page,
                appliedSearch,
                roleFilter,
            ]
        );

    useEffect(
        () => {
            void loadMain();
        },
        [
            loadMain,
        ]
    );

    useEffect(
        () => {
            if (
                tab ===
                "users"
            ) {
                void loadUsers();
            }
        },
        [
            tab,
            loadUsers,
        ]
    );

    useEffect(
        () => {
            if (
                !selectedRole
            ) {
                return;
            }

            setPermissionDraft(
                new Set(
                    selectedRole.permissions.map(
                        (
                            permission
                        ) =>
                            permission.id
                    )
                )
            );
        },
        [
            selectedRole,
        ]
    );

    function togglePermission(
        id: number
    ) {
        if (
            selectedRole?.protected
        ) {
            return;
        }

        setPermissionDraft(
            (
                current
            ) => {
                const next =
                    new Set(
                        current
                    );

                if (
                    next.has(
                        id
                    )
                ) {
                    next.delete(
                        id
                    );
                } else {
                    next.add(
                        id
                    );
                }

                return next;
            }
        );
    }

    async function savePermissions() {
        if (
            !selectedRole ||
            selectedRole.protected
        ) {
            return;
        }

        if (
            !window.confirm(
                `Save access policy for ${selectedRole.name}?`
            )
        ) {
            return;
        }

        try {
            setSaving(
                true
            );

            setError(
                ""
            );

            await roleAccessApi.updateRolePermissions(
                selectedRole.id,
                Array.from(
                    permissionDraft
                )
            );

            setSuccess(
                `${selectedRole.name} permissions updated.`
            );

            await loadMain();
        } catch (
        reason
        ) {
            setError(
                reason instanceof
                    Error
                    ? reason.message
                    : "Unable to update permissions."
            );
        } finally {
            setSaving(
                false
            );
        }
    }

    async function updateUserRole(
        user:
            RoleAccessUser,
        roleID:
            number
    ) {
        if (
            roleID ===
            user.role_id ||
            user.protected
        ) {
            return;
        }

        const role =
            roles.find(
                (
                    item
                ) =>
                    item.id ===
                    roleID
            );

        if (
            !role
        ) {
            return;
        }

        if (
            !window.confirm(
                `Change ${user.full_name || user.username} to ${role.name}?`
            )
        ) {
            return;
        }

        try {
            setError(
                ""
            );

            await roleAccessApi.updateUserRole(
                user.id,
                roleID
            );

            setSuccess(
                `${user.username} assigned to ${role.name}.`
            );

            await Promise.all(
                [
                    loadMain(),

                    loadUsers(),
                ]
            );
        } catch (
        reason
        ) {
            setError(
                reason instanceof
                    Error
                    ? reason.message
                    : "Unable to change role."
            );
        }
    }

    if (
        loading
    ) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (
        !canManage
    ) {
        return (
            <div className="p-4">
                <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                    <LockKeyhole className="mx-auto h-8 w-8 text-red-600" />

                    <h1 className="mt-3 text-lg font-semibold">
                        Access restricted
                    </h1>

                    <p className="mt-1 text-sm text-red-700">
                        Role Access requires
                        {" "}
                        <strong>
                            roles.manage
                        </strong>
                        .
                    </p>
                </div>
            </div>
        );
    }

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                usersTotal /
                PAGE_SIZE
            )
        );

    return (
        <div className="space-y-4 p-2 sm:p-3 lg:p-4">
            {/* HEADER */}

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="bg-gradient-to-r from-slate-50 via-white to-indigo-50 px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                                <ShieldCheck className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                                    Security Administration
                                </p>

                                <h1 className="text-xl font-bold">
                                    Role & Access Management
                                </h1>

                                <p className="text-xs text-muted-foreground">
                                    Govern user roles, permissions and privileged system access.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                void loadMain()
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-semibold"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
                    <Metric
                        label="Active Roles"
                        value={
                            overview.total_roles
                        }
                        icon={
                            <ShieldCheck className="h-4 w-4" />
                        }
                    />

                    <Metric
                        label="Permissions"
                        value={
                            overview.total_permissions
                        }
                        icon={
                            <KeyRound className="h-4 w-4" />
                        }
                    />

                    <Metric
                        label="Active Users"
                        value={
                            overview.total_users
                        }
                        icon={
                            <Users className="h-4 w-4" />
                        }
                    />

                    <Metric
                        label="Privileged Users"
                        value={
                            overview.privileged_users
                        }
                        icon={
                            <UserCog className="h-4 w-4" />
                        }
                    />
                </div>
            </section>

            {/* POLICY */}

            <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                <div className="flex gap-2">
                    <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />

                    <div>
                        <p className="font-semibold">
                            Protected access policy
                        </p>

                        <p className="mt-0.5 leading-5">
                            ROOT cannot be reassigned, demoted or modified here. Administrators cannot change their own role. Mandatory baseline permissions are enforced by the backend.
                        </p>
                    </div>
                </div>
            </section>

            {error && (
                <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    <AlertCircle className="mr-2 inline h-4 w-4" />
                    {
                        error
                    }
                </section>
            )}

            {success && (
                <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                    <Check className="mr-2 inline h-4 w-4" />
                    {
                        success
                    }
                </section>
            )}

            {/* MAIN */}

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex border-b border-border bg-muted/30 px-3 pt-2">
                    <TabButton
                        active={
                            tab ===
                            "roles"
                        }
                        onClick={() =>
                            setTab(
                                "roles"
                            )
                        }
                    >
                        Roles & Permissions
                    </TabButton>

                    <TabButton
                        active={
                            tab ===
                            "users"
                        }
                        onClick={() =>
                            setTab(
                                "users"
                            )
                        }
                    >
                        User Access
                    </TabButton>
                </div>

                {tab ===
                    "roles" ? (
                    <div className="grid min-h-[520px] lg:grid-cols-[300px_1fr]">
                        {/* ROLE LIST */}

                        <aside className="border-r border-border bg-slate-50/60 p-3">
                            <p className="mb-3 text-xs font-semibold">
                                Security Roles
                            </p>

                            <div className="space-y-2">
                                {roles.map(
                                    (
                                        role
                                    ) => (
                                        <button
                                            key={
                                                role.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                setSelectedRoleID(
                                                    role.id
                                                )
                                            }
                                            className={`w-full rounded-xl border p-3 text-left ${selectedRoleID ===
                                                role.id
                                                ? "border-indigo-300 bg-indigo-50"
                                                : "border-border bg-white"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold">
                                                    {
                                                        role.name
                                                    }
                                                </span>

                                                {role.protected && (
                                                    <LockKeyhole className="h-3.5 w-3.5 text-amber-600" />
                                                )}
                                            </div>

                                            <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                                                {
                                                    role.code
                                                }
                                            </p>

                                            <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
                                                <span>
                                                    {
                                                        role.user_count
                                                    }
                                                    {" "}
                                                    users
                                                </span>

                                                <span>
                                                    {
                                                        role.permissions.length
                                                    }
                                                    {" "}
                                                    permissions
                                                </span>
                                            </div>
                                        </button>
                                    )
                                )}
                            </div>
                        </aside>

                        {/* PERMISSIONS */}

                        <main className="p-4">
                            {selectedRole && (
                                <>
                                    <div className="flex items-center justify-between border-b border-border pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-semibold">
                                                    {
                                                        selectedRole.name
                                                    }
                                                </h2>

                                                {selectedRole.protected && (
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-800">
                                                        Protected
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-1 text-[10px] text-muted-foreground">
                                                {
                                                    selectedRole.code
                                                }
                                                {" · "}
                                                User type{" "}
                                                {
                                                    selectedRole.legacy_user_type
                                                }
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={
                                                selectedRole.protected ||
                                                saving
                                            }
                                            onClick={() =>
                                                void savePermissions()
                                            }
                                            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                                        >
                                            {saving
                                                ? "Saving..."
                                                : "Save Permissions"}
                                        </button>
                                    </div>

                                    <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                        {permissions.map(
                                            (
                                                permission
                                            ) => {
                                                const checked =
                                                    permissionDraft.has(
                                                        permission.id
                                                    );

                                                return (
                                                    <button
                                                        key={
                                                            permission.id
                                                        }
                                                        type="button"
                                                        disabled={
                                                            selectedRole.protected
                                                        }
                                                        onClick={() =>
                                                            togglePermission(
                                                                permission.id
                                                            )
                                                        }
                                                        className={`flex items-start gap-3 rounded-xl border p-3 text-left ${checked
                                                            ? "border-indigo-200 bg-indigo-50"
                                                            : "border-border bg-white"
                                                            }`}
                                                    >
                                                        <span
                                                            className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border ${checked
                                                                ? "border-indigo-600 bg-indigo-600 text-white"
                                                                : ""
                                                                }`}
                                                        >
                                                            {checked && (
                                                                <Check className="h-3 w-3" />
                                                            )}
                                                        </span>

                                                        <div>
                                                            <p className="font-mono text-[10px] font-semibold">
                                                                {
                                                                    permission.code
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-muted-foreground">
                                                                {
                                                                    permission.name
                                                                }
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                </>
                            )}
                        </main>
                    </div>
                ) : (
                    /* USER ACCESS */

                    <div>
                        <div className="flex flex-col gap-2 border-b border-border p-4 lg:flex-row lg:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold">
                                    User Access Directory
                                </h2>

                                <p className="text-[10px] text-muted-foreground">
                                    {usersTotal.toLocaleString()}
                                    {" "}
                                    authenticated users
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={
                                        roleFilter
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setRoleFilter(
                                            event.target.value
                                        );

                                        setPage(
                                            1
                                        );
                                    }}
                                    className="h-9 rounded-lg border border-border bg-white px-3 text-xs"
                                >
                                    <option value="ALL">
                                        All Roles
                                    </option>

                                    {roles.map(
                                        (
                                            role
                                        ) => (
                                            <option
                                                key={
                                                    role.id
                                                }
                                                value={
                                                    role.code
                                                }
                                            >
                                                {
                                                    role.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <div className="flex">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                                        <input
                                            value={
                                                search
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSearch(
                                                    event.target.value
                                                )
                                            }
                                            className="h-9 w-64 rounded-l-lg border border-border pl-9 text-xs"
                                            placeholder="Name, username, employee ID..."
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAppliedSearch(
                                                search.trim()
                                            );

                                            setPage(
                                                1
                                            );
                                        }}
                                        className="rounded-r-lg border border-border bg-slate-100 px-3 text-xs font-semibold"
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <Th>
                                            User
                                        </Th>

                                        <Th>
                                            Employee
                                        </Th>

                                        <Th>
                                            Current Role
                                        </Th>

                                        <Th>
                                            Account
                                        </Th>

                                        <Th>
                                            Change Role
                                        </Th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map(
                                        (
                                            user
                                        ) => (
                                            <tr
                                                key={
                                                    user.id
                                                }
                                                className="border-t border-border"
                                            >
                                                <Td>
                                                    <p className="font-semibold">
                                                        {user.full_name ||
                                                            user.username}
                                                    </p>

                                                    <p className="text-[10px] text-muted-foreground">
                                                        @
                                                        {
                                                            user.username
                                                        }
                                                    </p>
                                                </Td>

                                                <Td>
                                                    <p className="font-mono text-[10px]">
                                                        {
                                                            user.employee_id
                                                        }
                                                    </p>

                                                    <p className="text-[10px] text-muted-foreground">
                                                        {
                                                            user.email ||
                                                            "No email"
                                                        }
                                                    </p>
                                                </Td>

                                                <Td>
                                                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-semibold text-indigo-700">
                                                        {
                                                            user.role_name
                                                        }
                                                    </span>
                                                </Td>

                                                <Td>
                                                    {
                                                        user.account_status
                                                    }
                                                </Td>

                                                <Td>
                                                    {user.protected ? (
                                                        <span className="text-[10px] font-semibold text-amber-700">
                                                            Protected ROOT
                                                        </span>
                                                    ) : (
                                                        <select
                                                            value={
                                                                user.role_id
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                void updateUserRole(
                                                                    user,
                                                                    Number(
                                                                        event.target.value
                                                                    )
                                                                )
                                                            }
                                                            className="h-8 rounded-lg border border-border px-2 text-[10px]"
                                                        >
                                                            {roles
                                                                .filter(
                                                                    (
                                                                        role
                                                                    ) =>
                                                                        !role.protected
                                                                )
                                                                .map(
                                                                    (
                                                                        role
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                role.id
                                                                            }
                                                                            value={
                                                                                role.id
                                                                            }
                                                                        >
                                                                            {
                                                                                role.name
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                        </select>
                                                    )}
                                                </Td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-border p-3">
                            <button
                                type="button"
                                disabled={
                                    page <=
                                    1
                                }
                                onClick={() =>
                                    setPage(
                                        (
                                            current
                                        ) =>
                                            current -
                                            1
                                    )
                                }
                                className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-30"
                            >
                                Previous
                            </button>

                            <span className="px-2 py-1.5 text-xs">
                                Page{" "}
                                {
                                    page
                                }
                                {" "}
                                of{" "}
                                {
                                    totalPages
                                }
                            </span>

                            <button
                                type="button"
                                disabled={
                                    page >=
                                    totalPages
                                }
                                onClick={() =>
                                    setPage(
                                        (
                                            current
                                        ) =>
                                            current +
                                            1
                                    )
                                }
                                className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

function Metric({
    label,
    value,
    icon,
}: {
    label: string;

    value: number;

    icon:
    React.ReactNode;
}) {
    return (
        <div className="bg-white px-4 py-3">
            <div className="flex justify-between">
                <span className="text-[9px] font-semibold uppercase text-muted-foreground">
                    {
                        label
                    }
                </span>

                <span className="text-indigo-600">
                    {
                        icon
                    }
                </span>
            </div>

            <p className="mt-1 text-xl font-bold">
                {
                    value.toLocaleString()
                }
            </p>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active:
    boolean;

    onClick:
    () => void;

    children:
    React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={
                onClick
            }
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold ${active
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-muted-foreground"
                }`}
        >
            {
                children
            }
        </button>
    );
}

function Th({
    children,
}: {
    children:
    React.ReactNode;
}) {
    return (
        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase text-muted-foreground">
            {
                children
            }
        </th>
    );
}

function Td({
    children,
}: {
    children:
    React.ReactNode;
}) {
    return (
        <td className="px-4 py-3 text-[10.5px]">
            {
                children
            }
        </td>
    );
}