
//frontend/app/dashboard/user/downstream-employee/page.tsx

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import Link from "next/link";

import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    Building2,
    CalendarDays,
    Cpu,
    Loader2,
    MonitorSmartphone,
    Network,
    Package2,
    RefreshCw,
    Search,
    ShieldCheck,
    Sparkles,
    UserRoundCheck,
    Users,
    X,
} from "lucide-react";

import {
    downstreamApi,
    downstreamDevicesApi,
    downstreamEmployeesApi,
    type DownstreamDeviceItem,
    type DownstreamDeviceScope,
    type DownstreamEmployeeItem,
    type DownstreamEmployeeScope,
} from "@/lib/api";

const PAGE_SIZE = 20;
const DEVICE_MODAL_PAGE_SIZE = 100;

type SummaryTone =
    | "blue"
    | "emerald"
    | "violet";

type AvatarPalette = {
    ring: string;
    bg: string;
    text: string;
    glow: string;
};

const AVATAR_PALETTES: AvatarPalette[] = [
    { ring: "ring-rose-200", bg: "from-rose-100 via-pink-100 to-rose-50", text: "text-rose-700", glow: "shadow-rose-100" },
    { ring: "ring-orange-200", bg: "from-orange-100 via-amber-100 to-orange-50", text: "text-orange-700", glow: "shadow-orange-100" },
    { ring: "ring-emerald-200", bg: "from-emerald-100 via-teal-100 to-emerald-50", text: "text-emerald-700", glow: "shadow-emerald-100" },
    { ring: "ring-sky-200", bg: "from-sky-100 via-cyan-100 to-sky-50", text: "text-sky-700", glow: "shadow-sky-100" },
    { ring: "ring-indigo-200", bg: "from-indigo-100 via-blue-100 to-indigo-50", text: "text-indigo-700", glow: "shadow-indigo-100" },
    { ring: "ring-violet-200", bg: "from-violet-100 via-fuchsia-100 to-violet-50", text: "text-violet-700", glow: "shadow-violet-100" },
];

export default function DownstreamEmployeePage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const scope =
        useMemo<DownstreamEmployeeScope>(
            () => {
                const value =
                    searchParams.get(
                        "scope"
                    );

                if (
                    value === "direct" ||
                    value === "indirect"
                ) {
                    return value;
                }

                return "all";
            },
            [
                searchParams,
            ]
        );

    const page =
        useMemo(
            () => {
                const value =
                    Number(
                        searchParams.get(
                            "page"
                        ) ?? "1"
                    );

                if (
                    !Number.isInteger(
                        value
                    ) ||
                    value < 1
                ) {
                    return 1;
                }

                return value;
            },
            [
                searchParams,
            ]
        );

    const appliedSearch =
        useMemo(
            () =>
                searchParams
                    .get(
                        "search"
                    )
                    ?.trim() ?? "",
            [
                searchParams,
            ]
        );

    const [employees, setEmployees] =
        useState<
            DownstreamEmployeeItem[]
        >([]);

    const [total, setTotal] =
        useState(0);

    const [directTotal, setDirectTotal] =
        useState(0);

    const [allTotal, setAllTotal] =
        useState(0);

    const [search, setSearch] =
        useState(
            appliedSearch
        );

    const [loading, setLoading] =
        useState(true);

    const [summaryLoading, setSummaryLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [modalEmployee, setModalEmployee] =
        useState<DownstreamEmployeeItem | null>(
            null
        );

    const [modalOpen, setModalOpen] =
        useState(false);

    const [deviceHistoryLoading, setDeviceHistoryLoading] =
        useState(false);

    const [deviceHistoryError, setDeviceHistoryError] =
        useState("");

    const [employeeDevices, setEmployeeDevices] =
        useState<DownstreamDeviceItem[]>([]);

    useEffect(
        () => {
            setSearch(
                appliedSearch
            );
        },
        [
            appliedSearch,
        ]
    );

    useEffect(
        () => {
            if (!modalOpen) {
                return;
            }

            function onKeyDown(
                event: KeyboardEvent
            ) {
                if (
                    event.key ===
                    "Escape"
                ) {
                    closeDeviceModal();
                }
            }

            document.addEventListener(
                "keydown",
                onKeyDown
            );
            document.body.style.overflow =
                "hidden";

            return () => {
                document.removeEventListener(
                    "keydown",
                    onKeyDown
                );
                document.body.style.overflow =
                    "";
            };
        },
        [
            modalOpen,
        ]
    );

    const loadEmployees =
        useCallback(
            async () => {
                try {
                    setLoading(
                        true
                    );
                    setError(
                        ""
                    );

                    const response =
                        await downstreamEmployeesApi.list(
                            {
                                page,
                                limit:
                                    PAGE_SIZE,
                                scope,
                                search:
                                    appliedSearch ||
                                    undefined,
                            }
                        );

                    setEmployees(
                        response.data ??
                        []
                    );

                    setTotal(
                        Number(
                            response.total ??
                            0
                        )
                    );
                } catch (
                reason
                ) {
                    setEmployees(
                        []
                    );
                    setTotal(
                        0
                    );
                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load downstream employees."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                page,
                scope,
                appliedSearch,
            ]
        );

    const loadSummary =
        useCallback(
            async () => {
                try {
                    setSummaryLoading(
                        true
                    );

                    const response =
                        await downstreamApi.summary();

                    setDirectTotal(
                        Number(
                            response.data
                                .employees
                                .direct_employees ??
                            0
                        )
                    );

                    setAllTotal(
                        Number(
                            response.data
                                .employees
                                .all_employees ??
                            0
                        )
                    );
                } catch (
                reason
                ) {
                    console.error(
                        "Failed to load downstream employee summary:",
                        reason
                    );

                    setDirectTotal(
                        0
                    );
                    setAllTotal(
                        0
                    );
                } finally {
                    setSummaryLoading(
                        false
                    );
                }
            },
            []
        );

    useEffect(
        () => {
            void loadEmployees();
        },
        [
            loadEmployees,
        ]
    );

    useEffect(
        () => {
            void loadSummary();
        },
        [
            loadSummary,
        ]
    );

    function buildUrl({
        nextScope = scope,
        nextPage = page,
        nextSearch =
        appliedSearch,
    }: {
        nextScope?: DownstreamEmployeeScope;
        nextPage?: number;
        nextSearch?: string;
    }) {
        const params =
            new URLSearchParams();

        params.set(
            "scope",
            nextScope
        );

        params.set(
            "page",
            String(
                Math.max(
                    1,
                    nextPage
                )
            )
        );

        const normalizedSearch =
            nextSearch.trim();

        if (
            normalizedSearch
        ) {
            params.set(
                "search",
                normalizedSearch
            );
        }

        return `${pathname}?${params.toString()}`;
    }

    function handleSearch() {
        router.push(
            buildUrl(
                {
                    nextPage:
                        1,
                    nextSearch:
                        search,
                }
            )
        );
    }

    function clearSearch() {
        setSearch(
            ""
        );

        router.push(
            buildUrl(
                {
                    nextPage:
                        1,
                    nextSearch:
                        "",
                }
            )
        );
    }

    function goToPage(
        nextPage: number
    ) {
        router.push(
            buildUrl(
                {
                    nextPage,
                }
            )
        );
    }

    async function handleRefresh() {
        await Promise.all(
            [
                loadEmployees(),
                loadSummary(),
            ]
        );
    }

    async function openDeviceModal(
        employee: DownstreamEmployeeItem
    ) {
        setModalEmployee(
            employee
        );
        setModalOpen(
            true
        );
        setDeviceHistoryLoading(
            true
        );
        setDeviceHistoryError(
            ""
        );
        setEmployeeDevices(
            []
        );

        try {
            const deviceScope: DownstreamDeviceScope =
                employee.relationship?.toLowerCase() ===
                    "direct"
                    ? "direct"
                    : employee.relationship?.toLowerCase() ===
                        "indirect"
                        ? "indirect"
                        : "all";

            const response =
                await downstreamDevicesApi.list(
                    {
                        page: 1,
                        limit:
                            DEVICE_MODAL_PAGE_SIZE,
                        scope: deviceScope,
                        search:
                            employee.employee_id,
                    }
                );

            const matched =
                (response.data ?? []).filter(
                    (
                        item
                    ) =>
                        normalizeText(
                            item.employee_id
                        ) ===
                        normalizeText(
                            employee.employee_id
                        )
                );

            setEmployeeDevices(
                matched
            );
        } catch (
        reason
        ) {
            setDeviceHistoryError(
                reason instanceof
                    Error
                    ? reason.message
                    : "Unable to load device history."
            );
        } finally {
            setDeviceHistoryLoading(
                false
            );
        }
    }

    function closeDeviceModal() {
        setModalOpen(
            false
        );
        setTimeout(() => {
            setModalEmployee(
                null
            );
            setEmployeeDevices(
                []
            );
            setDeviceHistoryError(
                ""
            );
        }, 150);
    }

    const indirectTotal =
        Math.max(
            0,
            allTotal -
            directTotal
        );

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                PAGE_SIZE
            )
        );

    const tableTitle =
        scope === "direct"
            ? "Direct Employees"
            : scope === "indirect"
                ? "Indirect Employees"
                : "All Downstream Employees";

    return (
        <>
            <div className="min-w-0 space-y-2.5">
                <section className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 ring-1 ring-blue-100">
                                <Users className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    Reporting Hierarchy
                                </p>

                                <div className="flex flex-wrap items-baseline gap-x-2">
                                    <h1 className="text-lg font-bold text-foreground">
                                        Downstream Employees
                                    </h1>

                                    <span className="text-[10px] text-muted-foreground">
                                        Active team with assigned device counts
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                void handleRefresh()
                            }
                            disabled={
                                loading ||
                                summaryLoading
                            }
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[11px] font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${loading ||
                                    summaryLoading
                                    ? "animate-spin"
                                    : ""
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>
                </section>

                <section className="grid gap-2 sm:grid-cols-3">
                    <SummaryCard
                        title="All Downstream"
                        subtitle="Active employees"
                        value={allTotal}
                        href={buildUrl({ nextScope: "all", nextPage: 1 })}
                        active={scope === "all"}
                        loading={summaryLoading}
                        icon={<Users className="h-4 w-4" />}
                        tone="blue"
                    />

                    <SummaryCard
                        title="Direct"
                        subtitle="Immediate reports"
                        value={directTotal}
                        href={buildUrl({ nextScope: "direct", nextPage: 1 })}
                        active={scope === "direct"}
                        loading={summaryLoading}
                        icon={<UserRoundCheck className="h-4 w-4" />}
                        tone="emerald"
                    />

                    <SummaryCard
                        title="Indirect"
                        subtitle="Extended hierarchy"
                        value={indirectTotal}
                        href={buildUrl({ nextScope: "indirect", nextPage: 1 })}
                        active={scope === "indirect"}
                        loading={summaryLoading}
                        icon={<Network className="h-4 w-4" />}
                        tone="violet"
                    />
                </section>

                <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-border px-3.5 py-2.5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-foreground">
                                    {tableTitle}
                                </h2>

                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                    {total.toLocaleString()}
                                </span>
                            </div>

                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                Name, ID, department, function, designation and devices
                            </p>
                        </div>

                        <div className="flex w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-72">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            handleSearch();
                                        }
                                    }}
                                    placeholder="Name, ID, department, function..."
                                    className="h-8 w-full rounded-l-lg border border-r-0 border-border bg-background pl-9 pr-3 text-[11px] text-foreground outline-none focus:border-primary"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleSearch}
                                className="h-8 rounded-r-lg bg-slate-900 px-4 text-[11px] font-medium text-white hover:bg-slate-800"
                            >
                                Search
                            </button>

                            {appliedSearch && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="ml-1 h-8 rounded-lg border border-border bg-background px-2.5 text-[10px] text-muted-foreground hover:bg-muted"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="border-b border-red-100 bg-red-50 px-3.5 py-2 text-[11px] text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="w-full">
                        <table className="w-full table-fixed border-collapse text-left">
                            <colgroup>
                                <col className="w-[4%]" />
                                <col className="w-[23%]" />
                                <col className="w-[12%]" />
                                <col className="w-[23%]" />
                                <col className="w-[28%]" />
                                <col className="w-[10%]" />
                            </colgroup>

                            <thead>
                                <tr className="border-b border-border bg-slate-50/80">
                                    <Th>SL</Th>
                                    <Th>Employee</Th>
                                    <Th>Relation</Th>
                                    <Th>Department / Function</Th>
                                    <Th>Designation</Th>
                                    <Th align="center">Devices</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="h-36 text-center">
                                            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading employees...
                                            </div>
                                        </td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="h-36 text-center">
                                            <Users className="mx-auto h-7 w-7 text-muted-foreground/40" />
                                            <p className="mt-2 text-sm font-semibold text-foreground">
                                                No downstream employees found
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                No active employee matches this scope or search.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    employees.map((employee, index) => (
                                        <tr
                                            key={employee.employee_id}
                                            className="border-b border-border/60 transition-colors last:border-0 hover:bg-slate-50/70"
                                        >
                                            <Td>
                                                <span className="tabular-nums text-[10px] text-muted-foreground">
                                                    {(page - 1) * PAGE_SIZE + index + 1}
                                                </span>
                                            </Td>

                                            <Td>
                                                <EmployeeCell employee={employee} />
                                            </Td>

                                            <Td>
                                                <RelationshipBadge
                                                    relationship={employee.relationship}
                                                    tier={employee.tier_level}
                                                />
                                            </Td>

                                            <Td>
                                                <DepartmentFunctionCell
                                                    department={employee.department}
                                                    subFunction={employee.sub_function}
                                                    workField={employee.work_field}
                                                />
                                            </Td>

                                            <Td>
                                                <p
                                                    className="line-clamp-2 pr-2 text-[11px] leading-4 text-foreground"
                                                    title={employee.designation || ""}
                                                >
                                                    {employee.designation || "—"}
                                                </p>
                                            </Td>

                                            <Td align="center">
                                                <DeviceCountPill
                                                    count={employee.device_count}
                                                    onClick={() =>
                                                        void openDeviceModal(
                                                            employee
                                                        )
                                                    }
                                                />
                                            </Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-border px-3.5 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-[10px] text-muted-foreground">
                            Showing{" "}
                            {total === 0
                                ? 0
                                : (page - 1) * PAGE_SIZE + 1}
                            {"–"}
                            {Math.min(page * PAGE_SIZE, total)} of{" "}
                            {total.toLocaleString()}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() =>
                                    goToPage(
                                        Math.max(1, page - 1)
                                    )
                                }
                                className="h-7 rounded-md border border-border px-2.5 text-[10px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <button
                                type="button"
                                disabled={page >= totalPages || loading}
                                onClick={() =>
                                    goToPage(
                                        Math.min(totalPages, page + 1)
                                    )
                                }
                                className="h-7 rounded-md border border-border px-2.5 text-[10px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <DeviceHistoryModal
                open={modalOpen}
                employee={modalEmployee}
                devices={employeeDevices}
                loading={deviceHistoryLoading}
                error={deviceHistoryError}
                onClose={closeDeviceModal}
            />
        </>
    );
}

function SummaryCard({
    title,
    subtitle,
    value,
    icon,
    href,
    active,
    loading,
    tone,
}: {
    title: string;
    subtitle: string;
    value: number;
    icon: ReactNode;
    href: string;
    active: boolean;
    loading: boolean;
    tone: SummaryTone;
}) {
    const toneClasses: Record<
        SummaryTone,
        {
            card: string;
            icon: string;
            active: string;
            number: string;
        }
    > = {
        blue: {
            card: "border-sky-100 bg-sky-50/70 hover:border-sky-200 hover:bg-sky-50",
            icon: "bg-sky-100 text-sky-700",
            active: "border-sky-400 ring-1 ring-sky-200",
            number: "text-sky-950",
        },
        emerald: {
            card: "border-emerald-100 bg-emerald-50/70 hover:border-emerald-200 hover:bg-emerald-50",
            icon: "bg-emerald-100 text-emerald-700",
            active: "border-emerald-400 ring-1 ring-emerald-200",
            number: "text-emerald-950",
        },
        violet: {
            card: "border-violet-100 bg-violet-50/70 hover:border-violet-200 hover:bg-violet-50",
            icon: "bg-violet-100 text-violet-700",
            active: "border-violet-400 ring-1 ring-violet-200",
            number: "text-violet-950",
        },
    };

    const classes =
        toneClasses[tone];

    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group rounded-xl border px-3 py-2.5 shadow-sm transition-all ${classes.card} ${active ? classes.active : ""
                }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold text-muted-foreground">
                        {title}
                    </p>

                    <p className={`mt-0.5 text-xl font-bold tracking-tight ${classes.number}`}>
                        {loading ? "—" : value.toLocaleString()}
                    </p>

                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                        {subtitle}
                    </p>
                </div>

                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${classes.icon}`}>
                    {icon}
                </div>
            </div>
        </Link>
    );
}

function EmployeeCell({
    employee,
}: {
    employee: DownstreamEmployeeItem;
}) {
    const avatarText =
        getAvatarText(
            employee.employee_name,
            employee.employee_id
        );

    const palette =
        getAvatarPalette(
            employee.employee_id ||
            employee.employee_name
        );

    return (
        <div className="flex min-w-0 items-center gap-2">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${palette.bg} ${palette.text} ring-1 ${palette.ring} shadow-sm ${palette.glow}`}>
                <span className="text-[10px] font-extrabold tracking-wide">
                    {avatarText}
                </span>
            </div>

            <div className="min-w-0">
                <p
                    className="truncate text-[11px] font-semibold leading-4 text-foreground"
                    title={employee.employee_name || ""}
                >
                    {employee.employee_name || "Unnamed employee"}
                </p>

                <p className="truncate text-[9px] font-medium leading-3.5 text-muted-foreground">
                    {employee.employee_id || "—"}
                </p>
            </div>
        </div>
    );
}

function DepartmentFunctionCell({
    department,
    subFunction,
    workField,
}: {
    department?: string;
    subFunction?: string;
    workField?: string;
}) {
    const functionName =
        subFunction ||
        workField ||
        "Function not available";

    return (
        <div className="min-w-0 pr-2">
            <div className="flex min-w-0 items-center gap-1.5">
                <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />

                <p
                    className="truncate text-[10.5px] font-semibold leading-4 text-foreground"
                    title={department || ""}
                >
                    {department || "Not available"}
                </p>
            </div>

            <p
                className="truncate pl-[18px] text-[9px] leading-3.5 text-muted-foreground"
                title={functionName}
            >
                {functionName}
            </p>
        </div>
    );
}

function RelationshipBadge({
    relationship,
    tier,
}: {
    relationship?: string;
    tier?: number;
}) {
    const direct =
        relationship?.toLowerCase() ===
        "direct";

    return (
        <div className="flex flex-col items-start gap-0.5">
            <span
                className={
                    direct
                        ? "inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 ring-1 ring-blue-100"
                        : "inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-700 ring-1 ring-violet-100"
                }
            >
                {direct
                    ? "Direct"
                    : "Indirect"}
            </span>

            {tier ? (
                <span className="text-[8.5px] leading-3 text-muted-foreground">
                    Tier {tier}
                </span>
            ) : null}
        </div>
    );
}

function DeviceCountPill({
    count,
    onClick,
}: {
    count: number;
    onClick: () => void;
}) {
    const value =
        Number(
            count ?? 0
        );

    return (
        <button
            type="button"
            onClick={onClick}
            className="mx-auto inline-flex min-w-[74px] items-center justify-center gap-1.5 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-indigo-50 px-2.5 py-1.5 text-violet-700 shadow-sm shadow-violet-100 transition hover:-translate-y-[1px] hover:border-violet-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-200"
            title={`View ${value.toLocaleString()} assigned device${value === 1 ? "" : "s"} details`}
        >
            <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white/80 ring-1 ring-violet-100">
                <MonitorSmartphone className="h-2.5 w-2.5 shrink-0" />
            </div>

            <span className="text-[10px] font-extrabold tabular-nums">
                {value.toLocaleString()}
            </span>

            {value >= 5 ? (
                <Sparkles className="h-2.5 w-2.5 shrink-0 text-fuchsia-500" />
            ) : null}
        </button>
    );
}

function DeviceHistoryModal({
    open,
    employee,
    devices,
    loading,
    error,
    onClose,
}: {
    open: boolean;
    employee: DownstreamEmployeeItem | null;
    devices: DownstreamDeviceItem[];
    loading: boolean;
    error: string;
    onClose: () => void;
}) {
    const [selectedCategory, setSelectedCategory] =
        useState("all");

    const [selectedBrand, setSelectedBrand] =
        useState("all");

    useEffect(
        () => {
            setSelectedCategory(
                "all"
            );
            setSelectedBrand(
                "all"
            );
        },
        [
            employee?.employee_id,
            open,
        ]
    );

    const categoryOptions =
        useMemo(
            () =>
                buildFilterOptions(
                    devices,
                    (
                        item
                    ) =>
                        item.category
                ),
            [
                devices,
            ]
        );

    const brandOptions =
        useMemo(
            () =>
                buildFilterOptions(
                    devices,
                    (
                        item
                    ) =>
                        item.brand
                ),
            [
                devices,
            ]
        );

    const filteredDevices =
        useMemo(
            () =>
                devices.filter(
                    (
                        item
                    ) => {
                        const categoryMatches =
                            selectedCategory ===
                            "all" ||
                            normalizeText(
                                item.category
                            ) ===
                            selectedCategory;

                        const brandMatches =
                            selectedBrand ===
                            "all" ||
                            normalizeText(
                                item.brand
                            ) ===
                            selectedBrand;

                        return (
                            categoryMatches &&
                            brandMatches
                        );
                    }
                ),
            [
                devices,
                selectedCategory,
                selectedBrand,
            ]
        );

    if (!open || !employee) {
        return null;
    }

    const avatarText =
        getAvatarText(
            employee.employee_name,
            employee.employee_id
        );

    const palette =
        getAvatarPalette(
            employee.employee_id ||
            employee.employee_name
        );

    const uniqueCategories =
        categoryOptions.length;

    const uniqueBrands =
        brandOptions.length;

    const hasActiveFilter =
        selectedCategory !==
        "all" ||
        selectedBrand !==
        "all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-6">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-indigo-50 px-4 py-4 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${palette.bg} ${palette.text} ring-1 ${palette.ring} shadow-md ${palette.glow}`}>
                                <span className="text-sm font-black tracking-wide">
                                    {avatarText}
                                </span>
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                                        {employee.employee_name ||
                                            "Unnamed employee"}
                                    </h3>

                                    <span className="inline-flex rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                                        {employee.relationship ||
                                            "Employee"}
                                    </span>
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                    <span>
                                        ID: {employee.employee_id || "—"}
                                    </span>
                                    <span>
                                        {employee.department ||
                                            "Department unavailable"}
                                    </span>
                                    <span>
                                        {employee.designation ||
                                            "Designation unavailable"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-500 transition hover:bg-white hover:text-slate-700"
                            aria-label="Close device details"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        <MiniStatCard
                            title="Assigned Devices"
                            value={String(devices.length)}
                            icon={<MonitorSmartphone className="h-3.5 w-3.5" />}
                            tone="violet"
                        />
                        <MiniStatCard
                            title="Categories"
                            value={String(uniqueCategories)}
                            icon={<Package2 className="h-3.5 w-3.5" />}
                            tone="blue"
                        />
                        <MiniStatCard
                            title="Brands"
                            value={String(uniqueBrands)}
                            icon={<Cpu className="h-3.5 w-3.5" />}
                            tone="emerald"
                        />
                        <MiniStatCard
                            title="Status"
                            value="Assigned"
                            icon={<ShieldCheck className="h-3.5 w-3.5" />}
                            tone="amber"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white px-4 py-4 sm:px-5">
                    {loading ? (
                        <div className="flex min-h-[220px] items-center justify-center">
                            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading device history...
                            </div>
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-5 text-sm text-red-700">
                            {error}
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center">
                            <MonitorSmartphone className="h-9 w-9 text-slate-300" />
                            <p className="mt-3 text-sm font-semibold text-slate-800">
                                No assigned device history found
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                This employee does not currently have any assigned downstream devices.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                                Filter by Category
                                            </p>

                                            {selectedCategory !== "all" ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedCategory(
                                                            "all"
                                                        )
                                                    }
                                                    className="text-[10px] font-semibold text-sky-700 hover:text-sky-800"
                                                >
                                                    Clear
                                                </button>
                                            ) : null}
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <FilterChip
                                                label="All categories"
                                                count={devices.length}
                                                active={selectedCategory === "all"}
                                                tone="blue"
                                                onClick={() =>
                                                    setSelectedCategory(
                                                        "all"
                                                    )
                                                }
                                            />

                                            {categoryOptions.map(
                                                (
                                                    option
                                                ) => (
                                                    <FilterChip
                                                        key={option.key}
                                                        label={option.label}
                                                        count={option.count}
                                                        active={selectedCategory === option.key}
                                                        tone="blue"
                                                        onClick={() =>
                                                            setSelectedCategory(
                                                                selectedCategory === option.key
                                                                    ? "all"
                                                                    : option.key
                                                            )
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="hidden h-16 w-px bg-slate-200 xl:block" />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                                Filter by Brand
                                            </p>

                                            {selectedBrand !== "all" ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedBrand(
                                                            "all"
                                                        )
                                                    }
                                                    className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800"
                                                >
                                                    Clear
                                                </button>
                                            ) : null}
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <FilterChip
                                                label="All brands"
                                                count={devices.length}
                                                active={selectedBrand === "all"}
                                                tone="emerald"
                                                onClick={() =>
                                                    setSelectedBrand(
                                                        "all"
                                                    )
                                                }
                                            />

                                            {brandOptions.map(
                                                (
                                                    option
                                                ) => (
                                                    <FilterChip
                                                        key={option.key}
                                                        label={option.label}
                                                        count={option.count}
                                                        active={selectedBrand === option.key}
                                                        tone="emerald"
                                                        onClick={() =>
                                                            setSelectedBrand(
                                                                selectedBrand === option.key
                                                                    ? "all"
                                                                    : option.key
                                                            )
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs font-semibold text-slate-800">
                                        Device List
                                    </p>
                                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-100">
                                        {filteredDevices.length.toLocaleString()} of {devices.length.toLocaleString()}
                                    </span>

                                    {selectedCategory !== "all" ? (
                                        <ActiveFilterBadge
                                            label={`Category: ${getFilterLabel(categoryOptions, selectedCategory)}`}
                                            onRemove={() =>
                                                setSelectedCategory(
                                                    "all"
                                                )
                                            }
                                        />
                                    ) : null}

                                    {selectedBrand !== "all" ? (
                                        <ActiveFilterBadge
                                            label={`Brand: ${getFilterLabel(brandOptions, selectedBrand)}`}
                                            onRemove={() =>
                                                setSelectedBrand(
                                                    "all"
                                                )
                                            }
                                        />
                                    ) : null}
                                </div>

                                {hasActiveFilter ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategory(
                                                "all"
                                            );
                                            setSelectedBrand(
                                                "all"
                                            );
                                        }}
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        Reset filters
                                    </button>
                                ) : null}
                            </div>

                            {filteredDevices.length === 0 ? (
                                <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
                                    <Search className="h-8 w-8 text-slate-300" />
                                    <p className="mt-3 text-sm font-semibold text-slate-800">
                                        No devices match these filters
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Choose another category or brand, or reset the filters.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
                                        <table className="w-full table-fixed border-collapse text-left">
                                            <colgroup>
                                                <col className="w-[6%]" />
                                                <col className="w-[17%]" />
                                                <col className="w-[19%]" />
                                                <col className="w-[17%]" />
                                                <col className="w-[17%]" />
                                                <col className="w-[12%]" />
                                                <col className="w-[12%]" />
                                            </colgroup>
                                            <thead>
                                                <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.05em] text-slate-500">
                                                    <ModalTh align="center">SL</ModalTh>
                                                    <ModalTh>Device</ModalTh>
                                                    <ModalTh>Category / Model</ModalTh>
                                                    <ModalTh>PR / MR</ModalTh>
                                                    <ModalTh>Assigned / Purchase</ModalTh>
                                                    <ModalTh>Status</ModalTh>
                                                    <ModalTh align="right">Warranty</ModalTh>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredDevices.map((device, index) => (
                                                    <tr
                                                        key={device.id}
                                                        className="border-t border-slate-100 align-top hover:bg-slate-50/60"
                                                    >
                                                        <ModalTd align="center">
                                                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-bold tabular-nums text-slate-600 ring-1 ring-slate-200">
                                                                {index + 1}
                                                            </span>
                                                        </ModalTd>
                                                        <ModalTd>
                                                            <div className="space-y-1">
                                                                <div className="font-semibold text-slate-900">
                                                                    {device.device_serial || "Serial unavailable"}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const brandKey = normalizeText(device.brand);
                                                                        if (brandKey) {
                                                                            setSelectedBrand(brandKey);
                                                                        }
                                                                    }}
                                                                    className="text-left text-[11px] font-medium text-emerald-700 underline-offset-2 hover:underline"
                                                                    title="Filter table by this brand"
                                                                >
                                                                    {device.brand || "Unknown brand"}
                                                                </button>
                                                            </div>
                                                        </ModalTd>
                                                        <ModalTd>
                                                            <div className="space-y-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const categoryKey = normalizeText(device.category);
                                                                        if (categoryKey) {
                                                                            setSelectedCategory(categoryKey);
                                                                        }
                                                                    }}
                                                                    className="text-left font-semibold text-sky-700 underline-offset-2 hover:underline"
                                                                    title="Filter table by this category"
                                                                >
                                                                    {device.category || "Unknown category"}
                                                                </button>
                                                                <div className="text-[11px] text-slate-500">
                                                                    {device.model || "Model unavailable"}
                                                                </div>
                                                            </div>
                                                        </ModalTd>
                                                        <ModalTd>
                                                            <div className="space-y-1 text-[11px] text-slate-600">
                                                                <div>PR: {device.pr_number || "—"}</div>
                                                                <div>MR: {device.mr_number || "—"}</div>
                                                            </div>
                                                        </ModalTd>
                                                        <ModalTd>
                                                            <div className="space-y-1 text-[11px] text-slate-600">
                                                                <div className="inline-flex items-center gap-1">
                                                                    <CalendarDays className="h-3 w-3 text-slate-400" />
                                                                    {formatDate(device.assigned_date)}
                                                                </div>
                                                                <div>
                                                                    Purchased: {formatDate(device.purchase_date)}
                                                                </div>
                                                            </div>
                                                        </ModalTd>
                                                        <ModalTd>
                                                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                                                {device.status || "Assigned"}
                                                            </span>
                                                        </ModalTd>
                                                        <ModalTd align="right">
                                                            <span className="text-[11px] font-medium text-slate-600">
                                                                {formatDate(device.warranty_date)}
                                                            </span>
                                                        </ModalTd>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="grid gap-3 lg:hidden">
                                        {filteredDevices.map((device, index) => (
                                            <div
                                                key={device.id}
                                                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                                                        SL {index + 1}
                                                    </span>

                                                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                                        {device.status || "Assigned"}
                                                    </span>
                                                </div>

                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {device.device_serial || "Serial unavailable"}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const brandKey = normalizeText(device.brand);
                                                                if (brandKey) {
                                                                    setSelectedBrand(brandKey);
                                                                }
                                                            }}
                                                            className="mt-0.5 text-[11px] font-medium text-emerald-700 hover:underline"
                                                        >
                                                            {device.brand || "Unknown brand"}
                                                        </button>
                                                    </div>

                                                </div>

                                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const categoryKey = normalizeText(device.category);
                                                            if (categoryKey) {
                                                                setSelectedCategory(categoryKey);
                                                            }
                                                        }}
                                                        className="rounded-xl bg-sky-50 px-3 py-2 text-left ring-1 ring-sky-100"
                                                    >
                                                        <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-sky-600">
                                                            Category
                                                        </p>
                                                        <p className="mt-1 text-[12px] font-semibold text-sky-800">
                                                            {device.category || "Unknown category"}
                                                        </p>
                                                    </button>
                                                    <MobileField label="Model" value={device.model || "Model unavailable"} />
                                                    <MobileField label="PR Number" value={device.pr_number || "—"} />
                                                    <MobileField label="MR Number" value={device.mr_number || "—"} />
                                                    <MobileField label="Assigned Date" value={formatDate(device.assigned_date)} />
                                                    <MobileField label="Warranty" value={formatDate(device.warranty_date)} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


function FilterChip({
    label,
    count,
    active,
    tone,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    tone: "blue" | "emerald";
    onClick: () => void;
}) {
    const activeClass =
        tone === "blue"
            ? "border-sky-300 bg-sky-100 text-sky-800 ring-1 ring-sky-200"
            : "border-emerald-300 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";

    const idleClass =
        tone === "blue"
            ? "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${active
                ? activeClass
                : idleClass
                }`}
        >
            <span className="max-w-[160px] truncate">
                {label}
            </span>
            <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-slate-500 ring-1 ring-slate-200/70">
                {count.toLocaleString()}
            </span>
        </button>
    );
}

function ActiveFilterBadge({
    label,
    onRemove,
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
            <span className="max-w-[200px] truncate">
                {label}
            </span>
            <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-700"
                aria-label={`Remove ${label}`}
            >
                <X className="h-2.5 w-2.5" />
            </button>
        </span>
    );
}

type DeviceFilterOption = {
    key: string;
    label: string;
    count: number;
};

function buildFilterOptions(
    devices: DownstreamDeviceItem[],
    selector: (
        item: DownstreamDeviceItem
    ) => string | undefined
): DeviceFilterOption[] {
    const map =
        new Map<
            string,
            DeviceFilterOption
        >();

    for (
        const device of devices
    ) {
        const raw =
            (
                selector(
                    device
                ) ?? ""
            ).trim();

        if (!raw) {
            continue;
        }

        const key =
            normalizeText(
                raw
            );

        const current =
            map.get(
                key
            );

        if (current) {
            current.count +=
                1;
        } else {
            map.set(
                key,
                {
                    key,
                    label: raw,
                    count: 1,
                }
            );
        }
    }

    return Array.from(
        map.values()
    ).sort(
        (
            a,
            b
        ) =>
            b.count -
            a.count ||
            a.label.localeCompare(
                b.label
            )
    );
}

function getFilterLabel(
    options: DeviceFilterOption[],
    key: string
): string {
    return (
        options.find(
            (
                option
            ) =>
                option.key ===
                key
        )?.label ??
        key
    );
}

function MiniStatCard({
    title,
    value,
    icon,
    tone,
}: {
    title: string;
    value: string;
    icon: ReactNode;
    tone: "violet" | "blue" | "emerald" | "amber";
}) {
    const tones = {
        violet: "border-violet-100 bg-white/70 text-violet-700",
        blue: "border-sky-100 bg-white/70 text-sky-700",
        emerald: "border-emerald-100 bg-white/70 text-emerald-700",
        amber: "border-amber-100 bg-white/70 text-amber-700",
    } as const;

    return (
        <div className={`rounded-xl border px-3 py-2.5 shadow-sm ${tones[tone]}`}>
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-[10px] font-medium text-slate-500">
                        {title}
                    </p>
                    <p className="mt-0.5 text-base font-bold text-slate-900">
                        {value}
                    </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-slate-100">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function MobileField({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-slate-500">
                {label}
            </p>
            <p className="mt-1 text-[12px] text-slate-800">
                {value}
            </p>
        </div>
    );
}

function ModalTh({
    children,
    align = "left",
}: {
    children: ReactNode;
    align?: "left" | "center" | "right";
}) {
    return (
        <th
            className={`px-4 py-3 ${align === "center"
                ? "text-center"
                : align === "right"
                    ? "text-right"
                    : "text-left"
                }`}
        >
            {children}
        </th>
    );
}

function ModalTd({
    children,
    align = "left",
}: {
    children: ReactNode;
    align?: "left" | "center" | "right";
}) {
    return (
        <td
            className={`px-4 py-3 text-[12px] ${align === "center"
                ? "text-center"
                : align === "right"
                    ? "text-right"
                    : "text-left"
                }`}
        >
            {children}
        </td>
    );
}

function getAvatarText(
    name?: string,
    employeeID?: string
): string {
    const normalizedName =
        (name ?? "").trim();

    if (
        !normalizedName ||
        normalizedName ===
        (employeeID ?? "").trim()
    ) {
        const normalizedID =
            (employeeID ?? "")
                .replace(
                    /[^A-Za-z0-9]/g,
                    ""
                )
                .trim();

        if (
            normalizedID.length >= 2
        ) {
            return (
                normalizedID[0] +
                normalizedID[normalizedID.length - 1]
            ).toUpperCase();
        }

        return "ID";
    }

    const onlyLetters =
        normalizedName.replace(
            /[^A-Za-zÀ-ÖØ-öø-ÿ]/g,
            ""
        );

    if (
        onlyLetters.length >= 2
    ) {
        return (
            onlyLetters[0] +
            onlyLetters[onlyLetters.length - 1]
        ).toUpperCase();
    }

    const words =
        normalizedName
            .split(/\s+/)
            .filter(Boolean);

    if (
        words.length === 1
    ) {
        const word =
            words[0];

        return (
            (word[0] ?? "") +
            (word[word.length - 1] ?? "")
        ).toUpperCase();
    }

    const firstWord = words[0];
    const lastWord =
        words[words.length - 1];

    return (
        (firstWord[0] ?? "") +
        (lastWord[lastWord.length - 1] ?? "")
    ).toUpperCase();
}

function getAvatarPalette(
    seed?: string
): AvatarPalette {
    const value =
        (seed ?? "default").trim();

    let hash = 0;

    for (
        let i = 0;
        i < value.length;
        i += 1
    ) {
        hash =
            (hash * 31 +
                value.charCodeAt(i)) %
            100000;
    }

    return AVATAR_PALETTES[
        hash % AVATAR_PALETTES.length
    ];
}

function formatDate(
    value?: string
): string {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

function normalizeText(
    value?: string
): string {
    return (
        value ?? ""
    )
        .trim()
        .toLowerCase();
}

function Th({
    children,
    align = "left",
}: {
    children: ReactNode;
    align?: "left" | "center";
}) {
    return (
        <th
            className={`px-2.5 py-2 text-[9px] font-semibold uppercase tracking-[0.04em] text-muted-foreground ${align === "center"
                ? "text-center"
                : "text-left"
                }`}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    align = "left",
}: {
    children: ReactNode;
    align?: "left" | "center";
}) {
    return (
        <td
            className={`px-2.5 py-2 align-middle ${align === "center"
                ? "text-center"
                : "text-left"
                }`}
        >
            {children}
        </td>
    );
}
