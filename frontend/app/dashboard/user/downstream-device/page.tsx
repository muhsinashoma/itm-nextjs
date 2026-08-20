// // frontend/app/dashboard/user/downstream-device/page.tsx
// "use client";

// import {
//     MonitorSmartphone,
// } from "lucide-react";

// export default function DownstreamDevicePage() {
//     return (
//         <div className="p-4 sm:p-5 lg:p-6">
//             <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//                 <div className="flex items-center gap-3">
//                     <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
//                         <MonitorSmartphone className="h-5 w-5" />
//                     </div>

//                     <div>
//                         <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
//                             My Devices
//                         </p>

//                         <h1 className="text-xl font-bold text-slate-900">
//                             Downstream Device
//                         </h1>
//                     </div>
//                 </div>

//                 <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
//                     <p className="text-sm font-medium text-slate-700">
//                         Downstream device information will load here.
//                     </p>

//                     <p className="mt-1 text-xs text-slate-500">
//                         The secure user-specific device API will be connected next.
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// }


// frontend/app/dashboard/user/downstream-device/page.tsx
"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ArrowLeftRight,
    Laptop,
    Loader2,
    MonitorSmartphone,
    RefreshCw,
    Search,
    Users,
} from "lucide-react";

import {
    downstreamDevicesApi,
    type DownstreamDeviceItem,
} from "@/lib/api";

export default function DownstreamDevicePage() {
    const [
        devices,
        setDevices,
    ] =
        useState<
            DownstreamDeviceItem[]
        >([]);

    const [
        total,
        setTotal,
    ] =
        useState(0);

    const [
        page,
        setPage,
    ] =
        useState(1);

    const pageSize =
        20;

    const [
        search,
        setSearch,
    ] =
        useState("");

    const [
        appliedSearch,
        setAppliedSearch,
    ] =
        useState("");

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");

    /* ======================================================
       LOAD DOWNSTREAM DEVICES
    ====================================================== */

    const loadDevices =
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
                        await downstreamDevicesApi.list(
                            {
                                page,
                                limit:
                                    pageSize,
                                search:
                                    appliedSearch ||
                                    undefined,
                            }
                        );

                    setDevices(
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
                    setDevices(
                        []
                    );

                    setTotal(
                        0
                    );

                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load downstream devices."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                page,
                appliedSearch,
            ]
        );

    useEffect(
        () => {
            void loadDevices();
        },
        [
            loadDevices,
        ]
    );

    /* ======================================================
       SEARCH
    ====================================================== */

    function handleSearch() {
        setPage(
            1
        );

        setAppliedSearch(
            search.trim()
        );
    }

    function clearSearch() {
        setSearch(
            ""
        );

        setAppliedSearch(
            ""
        );

        setPage(
            1
        );
    }

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                pageSize
            )
        );

    const directOnPage =
        devices.filter(
            (
                item
            ) =>
                item.relationship
                    ?.toLowerCase() ===
                "direct"
        ).length;

    const indirectOnPage =
        devices.filter(
            (
                item
            ) =>
                item.relationship
                    ?.toLowerCase() ===
                "indirect"
        ).length;

    return (
        <div className="min-w-0 space-y-4 p-1">
            {/* ==================================================
                HEADER
            ================================================== */}

            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <MonitorSmartphone className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Downstream Assets
                            </p>

                            <h1 className="text-xl font-bold text-foreground">
                                Downstream Devices
                            </h1>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Assigned devices under your reporting hierarchy
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void loadDevices()
                        }
                        disabled={
                            loading
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${loading
                                    ? "animate-spin"
                                    : ""
                                }`}
                        />

                        Refresh
                    </button>
                </div>
            </section>

            {/* ==================================================
                SUMMARY
            ================================================== */}

            <section className="grid gap-3 sm:grid-cols-3">
                <SummaryCard
                    title="Assigned Devices"
                    value={
                        total
                    }
                    icon={
                        <Laptop className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    title="Direct on This Page"
                    value={
                        directOnPage
                    }
                    icon={
                        <Users className="h-5 w-5" />
                    }
                />

                <SummaryCard
                    title="Indirect on This Page"
                    value={
                        indirectOnPage
                    }
                    icon={
                        <ArrowLeftRight className="h-5 w-5" />
                    }
                />
            </section>

            {/* ==================================================
                TABLE
            ================================================== */}

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {/* TOOLBAR */}

                <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">
                            Downstream Device List
                        </h2>

                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {total.toLocaleString()}{" "}
                            assigned device
                            {total === 1
                                ? ""
                                : "s"}{" "}
                            found
                        </p>
                    </div>

                    <div className="flex w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-72">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                            <input
                                type="text"
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                onKeyDown={(
                                    event
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        handleSearch();
                                    }
                                }}
                                placeholder="Employee, serial, category, brand..."
                                className="h-9 w-full rounded-l-lg border border-r-0 border-border bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleSearch
                            }
                            className="h-9 bg-slate-900 px-4 text-xs font-medium text-white hover:bg-slate-800"
                        >
                            Search
                        </button>

                        {appliedSearch && (
                            <button
                                type="button"
                                onClick={
                                    clearSearch
                                }
                                className="h-9 rounded-r-lg border border-l-0 border-border bg-background px-3 text-xs text-muted-foreground hover:bg-muted"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                        {
                            error
                        }
                    </div>
                )}

                {/* TABLE */}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1450px] border-collapse text-left">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <Th>
                                    SL
                                </Th>

                                <Th>
                                    Employee
                                </Th>

                                <Th>
                                    Relationship
                                </Th>

                                <Th>
                                    Device Serial
                                </Th>

                                <Th>
                                    Category
                                </Th>

                                <Th>
                                    Brand / Model
                                </Th>

                                <Th>
                                    Department
                                </Th>

                                <Th>
                                    PR Number
                                </Th>

                                <Th>
                                    Assigned Date
                                </Th>

                                <Th>
                                    Warranty
                                </Th>

                                <Th>
                                    Status
                                </Th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={
                                            11
                                        }
                                        className="h-52 text-center"
                                    >
                                        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />

                                            Loading downstream devices...
                                        </div>
                                    </td>
                                </tr>
                            ) : devices.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            11
                                        }
                                        className="h-52 text-center"
                                    >
                                        <MonitorSmartphone className="mx-auto h-8 w-8 text-muted-foreground/40" />

                                        <p className="mt-3 text-sm font-semibold text-foreground">
                                            No downstream devices found
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            No device matches your search.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                devices.map(
                                    (
                                        device,
                                        index
                                    ) => (
                                        <tr
                                            key={
                                                device.id
                                            }
                                            className="border-b border-border/70 transition last:border-0 hover:bg-muted/30"
                                        >
                                            <Td>
                                                {(
                                                    page -
                                                    1
                                                ) *
                                                    pageSize +
                                                    index +
                                                    1}
                                            </Td>

                                            {/* EMPLOYEE */}

                                            <Td>
                                                <div className="min-w-[180px]">
                                                    <p className="font-semibold text-foreground">
                                                        {device.employee_name ||
                                                            "—"}
                                                    </p>

                                                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                        {
                                                            device.employee_id
                                                        }
                                                    </p>

                                                    {device.designation && (
                                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                            {
                                                                device.designation
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </Td>

                                            {/* RELATIONSHIP */}

                                            <Td>
                                                <RelationshipBadge
                                                    relationship={
                                                        device.relationship
                                                    }
                                                    tier={
                                                        device.tier_level
                                                    }
                                                />
                                            </Td>

                                            {/* SERIAL */}

                                            <Td>
                                                <span className="font-semibold text-foreground">
                                                    {device.device_serial ||
                                                        "—"}
                                                </span>
                                            </Td>

                                            {/* CATEGORY */}

                                            <Td>
                                                {device.category ||
                                                    "—"}
                                            </Td>

                                            {/* BRAND MODEL */}

                                            <Td>
                                                <div className="min-w-[180px]">
                                                    <p className="text-foreground">
                                                        {device.brand ||
                                                            "—"}
                                                    </p>

                                                    {device.model && (
                                                        <p className="mt-0.5 max-w-[230px] whitespace-normal text-[10px] text-muted-foreground">
                                                            {
                                                                device.model
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </Td>

                                            {/* DEPARTMENT */}

                                            <Td>
                                                <span className="block max-w-[190px] whitespace-normal">
                                                    {device.department ||
                                                        "—"}
                                                </span>
                                            </Td>

                                            {/* PR */}

                                            <Td>
                                                <span className="block max-w-[180px] break-all text-[10px]">
                                                    {device.pr_number ||
                                                        "—"}
                                                </span>
                                            </Td>

                                            {/* ASSIGNED */}

                                            <Td>
                                                {formatDate(
                                                    device.assigned_date
                                                )}
                                            </Td>

                                            {/* WARRANTY */}

                                            <Td>
                                                {formatDate(
                                                    device.warranty_date,
                                                    true
                                                )}
                                            </Td>

                                            {/* STATUS */}

                                            <Td>
                                                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                                    {device.status ||
                                                        "Assigned"}
                                                </span>
                                            </Td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ==================================================
                    PAGINATION
                ================================================== */}

                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[11px] text-muted-foreground">
                        Showing{" "}
                        {total === 0
                            ? 0
                            : (page -
                                1) *
                            pageSize +
                            1}
                        {" - "}
                        {Math.min(
                            page *
                            pageSize,
                            total
                        )}{" "}
                        of{" "}
                        {total.toLocaleString()}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground">
                            Page {page} of{" "}
                            {totalPages}
                        </span>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={
                                    page <=
                                    1 ||
                                    loading
                                }
                                onClick={() =>
                                    setPage(
                                        (
                                            current
                                        ) =>
                                            Math.max(
                                                1,
                                                current -
                                                1
                                            )
                                    )
                                }
                                className="h-8 rounded-lg border border-border px-3 text-[11px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <button
                                type="button"
                                disabled={
                                    page >=
                                    totalPages ||
                                    loading
                                }
                                onClick={() =>
                                    setPage(
                                        (
                                            current
                                        ) =>
                                            Math.min(
                                                totalPages,
                                                current +
                                                1
                                            )
                                    )
                                }
                                className="h-8 rounded-lg border border-border px-3 text-[11px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ======================================================
   SMALL COMPONENTS
====================================================== */

function SummaryCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] text-muted-foreground">
                        {
                            title
                        }
                    </p>

                    <p className="mt-1 text-2xl font-bold text-foreground">
                        {value.toLocaleString()}
                    </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                    {
                        icon
                    }
                </div>
            </div>
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
        relationship
            ?.toLowerCase() ===
        "direct";

    return (
        <div className="flex flex-col items-start gap-1">
            <span
                className={
                    direct
                        ? "inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700"
                        : "inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700"
                }
            >
                {relationship ||
                    "Indirect"}
            </span>

            {tier ? (
                <span className="text-[9px] text-muted-foreground">
                    Tier {tier}
                </span>
            ) : null}
        </div>
    );
}

function Th({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {
                children
            }
        </th>
    );
}

function Td({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <td className="px-4 py-3 text-xs text-muted-foreground">
            {
                children
            }
        </td>
    );
}

function formatDate(
    value?: string,
    dateOnly = false
): string {
    if (!value) {
        return "—";
    }

    const normalized =
        value.includes(
            "T"
        )
            ? value
            : value.replace(
                " ",
                "T"
            );

    const date =
        new Date(
            normalized
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    if (
        dateOnly
    ) {
        return date.toLocaleDateString();
    }

    return date.toLocaleString();
}