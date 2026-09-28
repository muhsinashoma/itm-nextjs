
// frontend/components/ui/user-sidebar.tsx
"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import Link from "next/link";

import {
    usePathname,
    useRouter,
} from "next/navigation";

import {
    ChevronDown,
    Eye,
    EyeOff,
    History,
    KeyRound,
    Loader2,
    LayoutDashboard,
    Laptop,
    MonitorSmartphone,
    Ticket,
} from "lucide-react";

import {
    cn,
} from "@/lib/utils";

import {
    api,
    employeeApi,
    getUser,
    userSidebarApi,
    type UserSidebarSummaryData,
} from "@/lib/api";

type UserMenuItem = {
    title: string;
    href: string;
    icon: React.ElementType;
    exact?: boolean;
    badge?: number | null;
};

export function UserSidebar() {
    const router = useRouter();
    const pathname =
        usePathname();

    const currentUser =
        getUser();

    const [
        summary,
        setSummary,
    ] =
        useState<UserSidebarSummaryData | null>(
            null
        );

    const [
        loading,
        setLoading,
    ] =
        useState(
            true
        );

    const [
        sidebarEmployee,
        setSidebarEmployee,
    ] =
        useState<{
            employee_name?: string;
            picture?: string;
        } | null>(
            null
        );

    const [
        userMenuOpen,
        setUserMenuOpen,
    ] =
        useState(false);

    const [
        passwordDialogOpen,
        setPasswordDialogOpen,
    ] =
        useState(false);

    const [
        currentPassword,
        setCurrentPassword,
    ] =
        useState("");

    const [
        newPassword,
        setNewPassword,
    ] =
        useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] =
        useState("");

    const [
        passwordSaving,
        setPasswordSaving,
    ] =
        useState(false);

    const [
        passwordError,
        setPasswordError,
    ] =
        useState("");

    const [
        passwordSuccess,
        setPasswordSuccess,
    ] =
        useState("");
    const [
        passwordSuccessToast,
        setPasswordSuccessToast,
    ] =
        useState(false);

    const userMenuRef =
        useRef<HTMLDivElement | null>(
            null
        );
    /* ======================================================
           LOAD OWN USER COUNTS
    
           GET /api/v1/user/sidebar-summary
    
           employee_id is resolved securely by backend
           from the current JWT.
        ====================================================== */

    const loadSummary =
        useCallback(
            async () => {
                try {
                    setLoading(
                        true
                    );

                    const response =
                        await userSidebarApi.summary();

                    setSummary(
                        response.data
                    );
                } catch {
                    setSummary(
                        null
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            []
        );

    useEffect(
        () => {
            void loadSummary();
        },
        [
            loadSummary,
        ]
    );
    useEffect(
        () => {
            let active =
                true;

            async function loadSidebarEmployee() {
                const employeeID =
                    currentUser
                        ?.employee_id
                        ?.trim() ||
                    "";

                if (
                    !employeeID ||
                    employeeID.startsWith(
                        "ROOT-"
                    ) ||
                    employeeID.startsWith(
                        "ADMIN-"
                    )
                ) {
                    setSidebarEmployee(
                        null
                    );
                    return;
                }

                try {
                    const response =
                        await employeeApi.get(
                            encodeURIComponent(
                                employeeID
                            )
                        );

                    if (!active) {
                        return;
                    }

                    setSidebarEmployee(
                        response.data ?? null
                    );
                } catch {
                    if (active) {
                        setSidebarEmployee(
                            null
                        );
                    }
                }
            }

            void loadSidebarEmployee();

            return () => {
                active =
                    false;
            };
        },
        [
            currentUser
                ?.employee_id,
        ]
    );

    /* ======================================================
       INSTANT TT HISTORY UPDATE

       Create TT dispatches "tt-created" after the API succeeds.
       Keep the sidebar mounted and update only the local count
       so the badge changes immediately without page refresh.
    ====================================================== */

    useEffect(() => {
        const handleTTCreated = (event: Event) => {
            const customEvent =
                event as CustomEvent<{
                    count?: number;
                }>;

            const count = Number(
                customEvent.detail?.count ?? 0
            );

            if (count <= 0) {
                return;
            }

            setSummary((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    ticket_count:
                        (current.ticket_count ?? 0) + count,
                };
            });
        };

        window.addEventListener(
            "tt-created",
            handleTTCreated
        );

        return () => {
            window.removeEventListener(
                "tt-created",
                handleTTCreated
            );
        };
    }, []);

    useEffect(
        () => {
            function handleUserMenuOutside(
                event: MouseEvent
            ) {
                if (
                    userMenuRef.current &&
                    !userMenuRef.current.contains(
                        event.target as Node
                    )
                ) {
                    setUserMenuOpen(
                        false
                    );
                }
            }

            document.addEventListener(
                "mousedown",
                handleUserMenuOutside
            );

            return () => {
                document.removeEventListener(
                    "mousedown",
                    handleUserMenuOutside
                );
            };
        },
        []
    );
    /* ======================================================
           CURRENT USER
        ====================================================== */

    const displayName =
        currentUser
            ?.full_name
            ?.trim() ||
        currentUser
            ?.username
            ?.trim() ||
        "Employee";

    const employeeId =
        currentUser
            ?.employee_id
            ?.trim() ||
        "";

    const roleName =
        currentUser
            ?.role_name
            ?.trim() ||
        "General User";

    /* ======================================================
       MENU

       LEFT SIDEBAR = OWN USER ONLY

       No downstream menu here.
       Downstream information remains in right sidebar.
    ====================================================== */

    const userMenuItems: UserMenuItem[] = [
        {
            title:
                "Dashboard",
            href:
                "/dashboard/user",
            icon:
                LayoutDashboard,
            exact:
                true,
        },
        {
            title:
                "My Devices",
            href:
                "/dashboard/user/devices",
            icon:
                Laptop,
            badge:
                loading
                    ? null
                    : summary
                        ?.device_count ??
                    0,
        },
        {
            title:
                "Device History",
            href:
                "/dashboard/user/device-history",
            icon:
                History,
        },
        {
            title:
                "TT History",
            href:
                "/dashboard/user/tt-history",
            icon:
                Ticket,
            badge:
                loading
                    ? null
                    : summary
                        ?.ticket_count ??
                    0,
        },
    ];

    function isItemActive(
        item: UserMenuItem
    ): boolean {
        if (
            item.exact
        ) {
            return (
                pathname ===
                item.href
            );
        }

        return (
            pathname ===
            item.href ||
            pathname.startsWith(
                `${item.href}/`
            )
        );
    }
    async function submitPasswordChange(
        event:
            React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setPasswordError("");
        setPasswordSuccess("");

        if (
            newPassword.length <
            10
        ) {
            setPasswordError(
                "New password must be at least 10 characters."
            );
            return;
        }

        if (
            newPassword !==
            confirmPassword
        ) {
            setPasswordError(
                "New password and confirmation do not match."
            );
            return;
        }

        if (
            currentPassword ===
            newPassword
        ) {
            setPasswordError(
                "New password must be different from current password."
            );
            return;
        }

        try {
            setPasswordSaving(
                true
            );

            await api.post(
                "/auth/change-password",
                {
                    current_password:
                        currentPassword,
                    new_password:
                        newPassword,
                    confirm_password:
                        confirmPassword,
                }
            );

            setPasswordSuccess(
                ""
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setPasswordDialogOpen(
                false
            );

            setPasswordSuccessToast(
                true
            );

            router.replace(
                "/dashboard/user"
            );

            window.setTimeout(
                () => {
                    setPasswordSuccessToast(
                        false
                    );
                },
                5000
            );
        }
        catch (
        reason
        ) {
            setPasswordError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to change password."
            );
        }
        finally {
            setPasswordSaving(
                false
            );
        }
    }

    return (
        <aside className="flex h-full w-full flex-col bg-card">
            {passwordSuccessToast && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed left-1/2 top-5 z-[200] w-[min(92vw,420px)] -translate-x-1/2 animate-in slide-in-from-top-2 fade-in rounded-xl border border-emerald-200 bg-white px-4 py-3.5 shadow-xl"
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                            OK
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                                Password changed successfully.
                            </p>

                            <p className="mt-0.5 text-xs leading-5 text-slate-600">
                                Your password has been updated successfully.
                            </p>
                        </div>

                        <button
                            type="button"
                            aria-label="Dismiss password success message"
                            onClick={() =>
                                setPasswordSuccessToast(
                                    false
                                )
                            }
                            className="rounded-md px-1.5 py-0.5 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                            x
                        </button>
                    </div>
                </div>
            )}
            {/* ==================================================
                BRAND
            ================================================== */}

            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <MonitorSmartphone className="h-4 w-4 text-primary" />
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                        ITM Portal
                    </p>

                    <p className="truncate text-[10px] text-muted-foreground">
                        Employee Portal
                    </p>
                </div>
            </div>

            {/* ==================================================
                NAVIGATION
            ================================================== */}

            <div className="flex-1 overflow-y-auto p-3">
                <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    My Workspace
                </p>

                <nav className="space-y-1">
                    {userMenuItems.map(
                        (
                            item
                        ) => {
                            const Icon =
                                item.icon;

                            const active =
                                isItemActive(
                                    item
                                );

                            return (
                                <Link
                                    key={
                                        item.href
                                    }
                                    href={
                                        item.href
                                    }
                                    className={cn(
                                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
                                        active
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />

                                    <span className="min-w-0 flex-1 truncate">
                                        {
                                            item.title
                                        }
                                    </span>

                                    {item.badge !==
                                        undefined && (
                                            <span
                                                className={cn(
                                                    "inline-flex min-w-[24px] shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                    active
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-foreground group-hover:bg-background"
                                                )}
                                            >
                                                {item.badge ===
                                                    null
                                                    ? "..."
                                                    : formatCount(
                                                        item.badge
                                                    )}
                                            </span>
                                        )}
                                </Link>
                            );
                        }
                    )}
                </nav>
            </div>

            {/* ==================================================
                CURRENT USER
            ================================================== */}

            <div className="border-t border-border p-3">
                <div
                    ref={
                        userMenuRef
                    }
                    className="relative"
                >
                    <button
                        type="button"
                        onClick={() =>
                            setUserMenuOpen(
                                (open) =>
                                    !open
                            )
                        }
                        className="flex w-full items-center gap-3 rounded-xl bg-muted/60 p-3 text-left transition hover:bg-muted"
                        aria-expanded={
                            userMenuOpen
                        }
                    >
                        <SidebarEmployeeAvatar
                            name={
                                sidebarEmployee?.employee_name ||
                                displayName
                            }
                            picture={
                                sidebarEmployee?.picture ||
                                ""
                            }
                        />

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground">
                                {displayName}
                            </p>

                            {employeeId && (
                                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                    {employeeId}
                                </p>
                            )}

                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                {roleName}
                            </p>
                        </div>

                        <ChevronDown
                            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${userMenuOpen
                                ? "rotate-180"
                                : ""
                                }`}
                        />
                    </button>

                    {userMenuOpen && (
                        <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                            <div className="border-b border-border px-3 py-2.5">
                                <p className="truncate text-[11px] font-semibold text-foreground">
                                    {displayName}
                                </p>

                                <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                                    {employeeId || roleName}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setUserMenuOpen(false);
                                    setPasswordError("");
                                    setPasswordSuccess("");
                                    setCurrentPassword("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                    setPasswordDialogOpen(true);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                            >
                                <KeyRound className="h-4 w-4 text-sky-600" />
                                Change Password
                            </button>
                        </div>
                    )}
                </div>

                {passwordDialogOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
                        <button
                            type="button"
                            aria-label="Close change password dialog"
                            className="absolute inset-0 cursor-default"
                            onClick={() => {
                                if (
                                    !passwordSaving
                                ) {
                                    setPasswordDialogOpen(
                                        false
                                    );
                                }
                            }}
                        />

                        <form
                            onSubmit={
                                submitPasswordChange
                            }
                            className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                        >
                            <div className="border-b border-border bg-muted/30 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                                        <KeyRound className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <h2 className="text-base font-semibold text-foreground">
                                            Change Password
                                        </h2>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Update your ITM account password securely.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 p-5">
                                <PasswordInput
                                    label="Current Password"
                                    value={
                                        currentPassword
                                    }
                                    onChange={
                                        setCurrentPassword
                                    }
                                />

                                <PasswordInput
                                    label="New Password"
                                    value={
                                        newPassword
                                    }
                                    onChange={
                                        setNewPassword
                                    }
                                    hint="New password must be at least 10 characters."
                                    hintTone="danger"
                                />

                                <PasswordInput
                                    label="Confirm New Password"
                                    value={
                                        confirmPassword
                                    }
                                    onChange={
                                        setConfirmPassword
                                    }
                                    hint="Re-enter the new password to confirm it."
                                    hintTone="info"
                                />

                                {passwordError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                                        {passwordError}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-border bg-muted/20 px-5 py-3">
                                <button
                                    type="button"
                                    disabled={
                                        passwordSaving
                                    }
                                    onClick={() =>
                                        setPasswordDialogOpen(
                                            false
                                        )
                                    }
                                    className="h-9 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        passwordSaving ||
                                        !currentPassword ||
                                        !newPassword ||
                                        !confirmPassword
                                    }
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {passwordSaving && (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    )}

                                    Save Password
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </aside>
    );
}

function PasswordInput({
    label,
    value,
    onChange,
    hint,
    hintTone = "info",
}: {
    label: string;
    value: string;
    onChange:
    (value: string) => void;
    hint?: string;
    hintTone?: "danger" | "info";
}) {
    const [
        show,
        setShow,
    ] =
        useState(false);

    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
                {label}
            </span>

            <div className="relative">
                <input
                    type={
                        show
                            ? "text"
                            : "password"
                    }
                    value={
                        value
                    }
                    onChange={(
                        event
                    ) =>
                        onChange(
                            event.target.value
                        )
                    }
                    autoComplete={
                        label ===
                            "Current Password"
                            ? "current-password"
                            : "new-password"
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />

                <button
                    type="button"
                    onClick={() =>
                        setShow(
                            (current) =>
                                !current
                        )
                    }
                    aria-label={
                        show
                            ? `Hide ${label}`
                            : `Show ${label}`
                    }
                    title={
                        show
                            ? "Hide password"
                            : "Show password"
                    }
                    className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200"
                >
                    {show ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>

            {hint && (
                <div
                    className={
                        hintTone === "danger"
                            ? "mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-4 text-red-600"
                            : "mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-4 text-sky-600"
                    }
                >
                    <KeyRound
                        className={
                            hintTone === "danger"
                                ? "mt-px h-3 w-3 shrink-0 text-red-500"
                                : "mt-px h-3 w-3 shrink-0 text-sky-500"
                        }
                    />
                    <span>
                        {hint}
                    </span>
                </div>
            )}
        </label>
    );
}


function SidebarEmployeeAvatar({
    name,
    picture,
}: {
    name: string;
    picture: string;
}) {
    const [
        imageFailed,
        setImageFailed,
    ] =
        useState(false);

    useEffect(
        () => {
            setImageFailed(
                false
            );
        },
        [
            picture,
        ]
    );

    const imageUrl =
        resolveSidebarEmployeeImage(
            picture
        );

    if (
        imageUrl &&
        !imageFailed
    ) {
        return (
            <img
                src={
                    imageUrl
                }
                alt={
                    name ||
                    "Employee"
                }
                onError={() =>
                    setImageFailed(
                        true
                    )
                }
                referrerPolicy="no-referrer"
                className="h-10 w-10 shrink-0 rounded-full border border-border bg-muted object-cover shadow-sm"
            />
        );
    }

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/10 text-xs font-bold text-primary">
            {getInitials(
                name
            )}
        </div>
    );
}

function resolveSidebarEmployeeImage(
    picture?: string | null
): string {
    const value =
        String(
            picture ??
            ""
        ).trim();

    if (!value) {
        return "";
    }

    if (
        value.startsWith(
            "http://"
        ) ||
        value.startsWith(
            "https://"
        ) ||
        value.startsWith(
            "data:"
        ) ||
        value.startsWith(
            "blob:"
        )
    ) {
        return value;
    }

    return `https://hris.fiberathome.net/hris/admin/${value
        .replace(
            /^[\"']+|[\"']+$/g,
            ""
        )
        .replace(
            /^\/+/,
            ""
        )}`;
}

/* ======================================================
   HELPERS
====================================================== */

function getInitials(
    value: string
): string {
    const parts =
        value
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (
        parts.length === 0
    ) {
        return "U";
    }

    if (
        parts.length === 1
    ) {
        return parts[0]
            .slice(
                0,
                2
            )
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[
        parts.length - 1
        ][0]
    ).toUpperCase();
}

function formatCount(
    value: number
): string {
    if (
        value >=
        1000000
    ) {
        return `${(
            value /
            1000000
        ).toFixed(1)}M`;
    }

    if (
        value >=
        1000
    ) {
        return `${(
            value /
            1000
        ).toFixed(1)}K`;
    }

    return String(
        value
    );
}