

// //frontend/components/TTTable.tsx


"use client";

import {
    createTTColumns,
    Section,
    TTActionPermissions,
} from "./tt-columns";

import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table";

import { useTTModal } from "@/components/ui/tt-modal-store";

import { useEffect, useMemo, useState } from "react";

/* ============================================================
   TYPES
   ============================================================ */

type TTTableProps = {
    data: Section[];
};

/* ============================================================
   USER / PERMISSION TYPES
   ============================================================ */

type StoredUser = {
    user_type?: unknown;
    role_id?: unknown;
    role_name?: unknown;
    role?: unknown;
    permissions?: unknown;
};

/* ============================================================
   PERMISSION CONSTANTS
   ============================================================ */

const TT_PERMISSIONS = {
    VIEW: "TT_VIEW",
    ASSIGN: "TT_ASSIGN",
    REQUISITION: "TT_REQUISITION",
    EDIT: "TT_EDIT",
    DELETE: "TT_DELETE",
} as const;

/* ============================================================
   GET STORED USER
   ============================================================ */

function getStoredUser(): StoredUser | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const rawUser = localStorage.getItem("itm_user");

        if (!rawUser) {
            return null;
        }

        const user = JSON.parse(rawUser) as StoredUser;

        return user;
    } catch (error) {
        console.error(
            "[TTTable] Unable to parse stored user:",
            error
        );

        return null;
    }
}

/* ============================================================
   GET STORED PERMISSIONS
   ============================================================ */

function getStoredPermissions(): string[] {
    const user = getStoredUser();

    if (!user) {
        return [];
    }

    if (!Array.isArray(user.permissions)) {
        return [];
    }

    return user.permissions.filter(
        (permission): permission is string =>
            typeof permission === "string"
    );
}

/* ============================================================
   CHECK PERMISSION
   ============================================================ */

function hasPermission(
    permissions: string[],
    permission: string
): boolean {
    return permissions.includes(permission);
}

/* ============================================================
   BUILD TT ACTION PERMISSIONS
   ============================================================ */

function buildTTActionPermissions(
    permissions: string[]
): TTActionPermissions {
    return {
        canView: hasPermission(
            permissions,
            TT_PERMISSIONS.VIEW
        ),

        canAssign: hasPermission(
            permissions,
            TT_PERMISSIONS.ASSIGN
        ),

        canRequisition: hasPermission(
            permissions,
            TT_PERMISSIONS.REQUISITION
        ),

        canEdit: hasPermission(
            permissions,
            TT_PERMISSIONS.EDIT
        ),

        canDelete: hasPermission(
            permissions,
            TT_PERMISSIONS.DELETE
        ),
    };
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function TTTable({
    data,
}: TTTableProps) {
    /* --------------------------------------------------------
       GLOBAL MODAL
       -------------------------------------------------------- */

    const { openModal } = useTTModal();

    /* --------------------------------------------------------
       PERMISSION STATE
       -------------------------------------------------------- */

    const [permissions, setPermissions] =
        useState<string[]>([]);

    const [permissionsLoaded, setPermissionsLoaded] =
        useState(false);

    /* --------------------------------------------------------
       LOAD USER PERMISSIONS
       -------------------------------------------------------- */

    useEffect(() => {
        const loadPermissions = () => {
            const storedPermissions =
                getStoredPermissions();

            setPermissions(storedPermissions);
            setPermissionsLoaded(true);
        };

        loadPermissions();

        /*
         * Listen for storage changes.
         *
         * This is useful if the login/session information
         * changes while the application is open.
         */
        const handleStorageChange = (
            event: StorageEvent
        ) => {
            if (event.key === "itm_user") {
                loadPermissions();
            }
        };

        window.addEventListener(
            "storage",
            handleStorageChange
        );

        return () => {
            window.removeEventListener(
                "storage",
                handleStorageChange
            );
        };
    }, []);

    /* --------------------------------------------------------
       BUILD PERMISSIONS
       -------------------------------------------------------- */

    const actionPermissions =
        useMemo(
            () =>
                buildTTActionPermissions(
                    permissions
                ),
            [permissions]
        );

    /* --------------------------------------------------------
       TT COLUMNS
       -------------------------------------------------------- */

    const columns = useMemo(
        () =>
            createTTColumns(
                actionPermissions
            ),
        [actionPermissions]
    );

    /* --------------------------------------------------------
       REACT TABLE
       -------------------------------------------------------- */

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel:
            getCoreRowModel(),
    });

    /* --------------------------------------------------------
       WAIT UNTIL PERMISSIONS ARE LOADED
       -------------------------------------------------------- */

    if (!permissionsLoaded) {
        return (
            <div className="flex w-full items-center justify-center rounded-xl border p-8">
                <span className="text-sm text-muted-foreground">
                    Loading permissions...
                </span>
            </div>
        );
    }

    /* --------------------------------------------------------
       TT_VIEW CHECK
       -------------------------------------------------------- */

    if (!actionPermissions.canView) {
        return (
            <div className="flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950/20">
                <div className="text-center">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                        Access Denied
                    </p>

                    <p className="mt-1 text-xs text-red-600 dark:text-red-500">
                        You do not have permission to view
                        Trouble Tickets.
                    </p>
                </div>
            </div>
        );
    }

    /* --------------------------------------------------------
       RENDER
       -------------------------------------------------------- */

    return (
        <div className="w-full overflow-auto rounded-xl border">
            <table className="w-full text-xs">
                {/* ==================================================
                    HEADER
                ================================================== */}

                <thead className="sticky top-0 z-10 bg-muted/50">
                    {table
                        .getHeaderGroups()
                        .map(
                            (
                                headerGroup
                            ) => (
                                <tr
                                    key={
                                        headerGroup.id
                                    }
                                >
                                    {headerGroup.headers.map(
                                        (
                                            header
                                        ) => (
                                            <th
                                                key={
                                                    header.id
                                                }
                                                className="
                                                    whitespace-nowrap
                                                    border-b
                                                    px-3
                                                    py-2
                                                    text-left
                                                    font-semibold
                                                "
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header
                                                            .column
                                                            .columnDef
                                                            .header,
                                                        header.getContext()
                                                    )}
                                            </th>
                                        )
                                    )}
                                </tr>
                            )
                        )}
                </thead>

                {/* ==================================================
                    BODY
                ================================================== */}

                <tbody>
                    {table
                        .getRowModel()
                        .rows.map(
                            (row) => {
                                const ttData =
                                    row.original;

                                return (
                                    <tr
                                        key={
                                            row.id
                                        }
                                        onClick={() =>
                                            openModal(
                                                ttData
                                            )
                                        }
                                        className="
                                            cursor-pointer
                                            border-b
                                            transition-colors
                                            hover:bg-muted/40
                                        "
                                    >
                                        {row
                                            .getVisibleCells()
                                            .map(
                                                (
                                                    cell
                                                ) => (
                                                    <td
                                                        key={
                                                            cell.id
                                                        }
                                                        className="
                                                            whitespace-nowrap
                                                            px-3
                                                            py-2
                                                        "
                                                    >
                                                        {flexRender(
                                                            cell
                                                                .column
                                                                .columnDef
                                                                .cell,
                                                            cell.getContext()
                                                        )}
                                                    </td>
                                                )
                                            )}
                                    </tr>
                                );
                            }
                        )}
                </tbody>

                {/* ==================================================
                    EMPTY STATE
                ================================================== */}

                {table
                    .getRowModel()
                    .rows.length === 0 && (
                        <tbody>
                            <tr>
                                <td
                                    colSpan={
                                        table
                                            .getAllLeafColumns()
                                            .length
                                    }
                                    className="
                                    px-4
                                    py-10
                                    text-center
                                    text-sm
                                    text-muted-foreground
                                "
                                >
                                    No Trouble Ticket
                                    records found.
                                </td>
                            </tr>
                        </tbody>
                    )}
            </table>
        </div>
    );
}