
//frontend/app/dashboard(Admin)/add_item/add_list/page.tsx
//Master Data Management Page
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Boxes,
    Check,
    ChevronDown,
    ChevronRight,
    CirclePlus,
    Cpu,
    Database,
    Edit3,
    Layers3,
    ListFilter,
    Monitor,
    RefreshCcw,
    Search,
    Tag,
    X,
} from "lucide-react";

import {
    masterDataApi,
    type ComponentItem,
    type ComponentType,
    type DeviceCatalogItem,
    type DeviceCatalogLevel,
    type MasterStatus,
    type QueryTypeItem,
} from "@/lib/master-data-api";

type TabKey =
    | "query"
    | "device"
    | "component";

type DrawerMode =
    | "add"
    | "edit";

type DrawerState =
    | {
        tab: "query";
        mode: DrawerMode;
        item?: QueryTypeItem;
    }
    | {
        tab: "device";
        mode: DrawerMode;
        item?: DeviceCatalogItem;
    }
    | {
        tab: "component";
        mode: DrawerMode;
        item?: ComponentItem;
    }
    | null;

const COMPONENT_LABELS: Record<
    ComponentType,
    string
> = {
    cpu: "CPU",
    ram: "RAM",
    ssd: "SSD",
    monitor: "Monitor",
};

function statusLabel(
    status: MasterStatus
) {
    return status === 1
        ? "Active"
        : "Inactive";
}

function StatusBadge({
    status,
}: {
    status: MasterStatus;
}) {
    const active =
        status === 1;

    return (
        <span
            className={`
                inline-flex
                rounded-full
                border
                px-2
                py-0.5
                text-[10px]
                font-semibold
                ${active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }
            `}
        >
            {statusLabel(
                status
            )}
        </span>
    );
}

function EmptyState({
    text,
}: {
    text: string;
}) {
    return (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 px-6 text-center text-xs text-muted-foreground">
            {text}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-border bg-card text-xs text-muted-foreground">
            Loading master data...
        </div>
    );
}

function ErrorState({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-700">
                Unable to load master data
            </p>

            <p className="mt-1 text-[11px] text-red-600">
                {message}
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-[10px] font-semibold text-red-700 hover:bg-red-50"
            >
                <RefreshCcw className="h-3.5 w-3.5" />
                Retry
            </button>
        </div>
    );
}


type SearchableOption = {
    value: string;
    label: string;
    searchText?: string;
};

function SearchableSelect({
    value,
    onChange,
    options,
    placeholder,
    searchPlaceholder = "Search...",
    allowClear = true,
    disabled = false,
}: {
    value: string;
    onChange: (
        value: string
    ) => void;
    options: SearchableOption[];
    placeholder: string;
    searchPlaceholder?: string;
    allowClear?: boolean;
    disabled?: boolean;
}) {
    const [
        open,
        setOpen,
    ] =
        useState(false);

    const [
        query,
        setQuery,
    ] =
        useState("");

    const rootRef =
        useRef<HTMLDivElement>(
            null
        );

    useEffect(() => {
        function handlePointerDown(
            event: MouseEvent
        ) {
            if (
                rootRef.current &&
                !rootRef.current.contains(
                    event.target as Node
                )
            ) {
                setOpen(
                    false
                );

                setQuery(
                    ""
                );
            }
        }

        document.addEventListener(
            "mousedown",
            handlePointerDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handlePointerDown
            );
        };
    }, []);

    const sortedOptions =
        useMemo(
            () =>
                [...options].sort(
                    (
                        a,
                        b
                    ) =>
                        a.label.localeCompare(
                            b.label,
                            undefined,
                            {
                                sensitivity:
                                    "base",
                                numeric:
                                    true,
                            }
                        )
                ),
            [
                options,
            ]
        );

    const normalized =
        query
            .trim()
            .toLowerCase();

    const visibleOptions =
        sortedOptions.filter(
            (
                option
            ) =>
                !normalized ||
                [
                    option.label,
                    option.searchText ??
                    "",
                ].some(
                    (
                        text
                    ) =>
                        text
                            .toLowerCase()
                            .includes(
                                normalized
                            )
                )
        );

    const selected =
        sortedOptions.find(
            (
                option
            ) =>
                option.value ===
                value
        );

    return (
        <div
            ref={
                rootRef
            }
            className="relative"
        >
            <div
                className={`
                    flex
                    h-9
                    w-full
                    items-center
                    rounded-lg
                    border
                    border-input
                    bg-background
                    transition
                    ${open
                        ? "border-primary/40 ring-2 ring-primary/10"
                        : ""
                    }
                    ${disabled
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }
                `}
            >
                <button
                    type="button"
                    disabled={
                        disabled
                    }
                    onClick={() =>
                        setOpen(
                            (
                                current
                            ) =>
                                !current
                        )
                    }
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 text-left text-[11px]"
                >
                    <span
                        className={`
                            truncate
                            ${selected
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                        `}
                    >
                        {selected
                            ?.label ??
                            placeholder}
                    </span>

                    <ChevronDown
                        className={`
                            h-3.5
                            w-3.5
                            shrink-0
                            text-muted-foreground
                            transition-transform
                            ${open
                                ? "rotate-180"
                                : ""
                            }
                        `}
                    />
                </button>

                {allowClear &&
                    value &&
                    !disabled && (
                        <button
                            type="button"
                            onClick={(
                                event
                            ) => {
                                event.stopPropagation();

                                onChange(
                                    ""
                                );

                                setQuery(
                                    ""
                                );
                            }}
                            className="mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Clear selection"
                            title="Clear selection"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
            </div>

            {open &&
                !disabled && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[220] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                        <div className="border-b border-border p-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                                <input
                                    autoFocus
                                    value={
                                        query
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setQuery(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder={
                                        searchPlaceholder
                                    }
                                    className="h-8 w-full rounded-lg border border-input bg-background pl-8 pr-8 text-[10px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                                />

                                {query && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setQuery(
                                                ""
                                            )
                                        }
                                        className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                        aria-label="Clear search"
                                        title="Clear search"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto p-1.5">
                            {visibleOptions.length ===
                                0 ? (
                                <div className="px-3 py-5 text-center text-[10px] text-muted-foreground">
                                    No matching records
                                </div>
                            ) : (
                                visibleOptions.map(
                                    (
                                        option
                                    ) => {
                                        const active =
                                            option.value ===
                                            value;

                                        return (
                                            <button
                                                key={
                                                    option.value
                                                }
                                                type="button"
                                                onClick={() => {
                                                    onChange(
                                                        option.value
                                                    );

                                                    setOpen(
                                                        false
                                                    );

                                                    setQuery(
                                                        ""
                                                    );
                                                }}
                                                className={`
                                                    flex
                                                    w-full
                                                    items-center
                                                    justify-between
                                                    gap-2
                                                    rounded-lg
                                                    px-2.5
                                                    py-2
                                                    text-left
                                                    text-[10px]
                                                    transition
                                                    ${active
                                                        ? "bg-primary/10 font-semibold text-primary"
                                                        : "text-foreground hover:bg-muted"
                                                    }
                                                `}
                                            >
                                                <span className="truncate">
                                                    {
                                                        option.label
                                                    }
                                                </span>

                                                {active && (
                                                    <Check className="h-3.5 w-3.5 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    }
                                )
                            )}
                        </div>
                    </div>
                )}
        </div>
    );
}

export default function AddItemPage() {
    const [
        activeTab,
        setActiveTab,
    ] =
        useState<TabKey>(
            "query"
        );

    const [
        drawer,
        setDrawer,
    ] =
        useState<DrawerState>(
            null
        );

    const [
        search,
        setSearch,
    ] =
        useState("");

    const [
        componentFilter,
        setComponentFilter,
    ] =
        useState<
            "all" |
            ComponentType
        >(
            "all"
        );

    const [
        queryTypes,
        setQueryTypes,
    ] =
        useState<
            QueryTypeItem[]
        >([]);

    const [
        deviceCatalog,
        setDeviceCatalog,
    ] =
        useState<
            DeviceCatalogItem[]
        >([]);

    const [
        components,
        setComponents,
    ] =
        useState<
            ComponentItem[]
        >([]);

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

    const loadAll =
        useCallback(
            async () => {
                try {
                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );

                    const [
                        queryRes,
                        deviceRes,
                        componentRes,
                    ] =
                        await Promise.all([
                            masterDataApi.queryTypes.list(),
                            masterDataApi.deviceCatalog.list(),
                            masterDataApi.components.list(),
                        ]);

                    setQueryTypes(
                        queryRes.data ??
                        []
                    );

                    setDeviceCatalog(
                        deviceRes.data ??
                        []
                    );

                    setComponents(
                        componentRes.data ??
                        []
                    );
                } catch (
                reason
                ) {
                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unknown API error"
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            []
        );

    useEffect(() => {
        void loadAll();
    }, [
        loadAll,
    ]);

    const counts =
        useMemo(
            () => {
                const categories =
                    deviceCatalog.filter(
                        (
                            item
                        ) =>
                            item.type ===
                            "category"
                    ).length;

                const brands =
                    deviceCatalog.filter(
                        (
                            item
                        ) =>
                            item.type ===
                            "brand"
                    ).length;

                const models =
                    deviceCatalog.filter(
                        (
                            item
                        ) =>
                            item.type ===
                            "model"
                    ).length;

                return {
                    query:
                        queryTypes.length,
                    categories,
                    brands,
                    models,
                    components:
                        components.length,
                };
            },
            [
                queryTypes,
                deviceCatalog,
                components,
            ]
        );

    const normalizedSearch =
        search
            .trim()
            .toLowerCase();

    const filteredQueries =
        useMemo(
            () =>
                queryTypes
                    .filter(
                        (
                            item
                        ) =>
                            !normalizedSearch ||
                            item.name
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                ) ||
                            item.description
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                )
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a.name.localeCompare(
                                b.name,
                                undefined,
                                {
                                    sensitivity:
                                        "base",
                                    numeric:
                                        true,
                                }
                            )
                    ),
            [
                queryTypes,
                normalizedSearch,
            ]
        );

    const deviceRows =
        useMemo(
            () => {
                const categories =
                    new Map(
                        deviceCatalog
                            .filter(
                                (
                                    item
                                ) =>
                                    item.type ===
                                    "category"
                            )
                            .map(
                                (
                                    item
                                ) => [
                                        item.id,
                                        item,
                                    ]
                            )
                    );

                const brands =
                    new Map(
                        deviceCatalog
                            .filter(
                                (
                                    item
                                ) =>
                                    item.type ===
                                    "brand"
                            )
                            .map(
                                (
                                    item
                                ) => [
                                        item.id,
                                        item,
                                    ]
                            )
                    );

                return deviceCatalog
                    .filter(
                        (
                            item
                        ) =>
                            item.type ===
                            "model"
                    )
                    .map(
                        (
                            model
                        ) => {
                            const brand =
                                brands.get(
                                    Number(
                                        model.parent_id ??
                                        model.brand_id
                                    )
                                );

                            const category =
                                brand
                                    ? categories.get(
                                        Number(
                                            brand.parent_id ??
                                            brand.category_id
                                        )
                                    )
                                    : undefined;

                            return {
                                id:
                                    model.id,
                                category:
                                    model.category_name ??
                                    category?.name ??
                                    "—",
                                brand:
                                    model.brand_name ??
                                    brand?.name ??
                                    "—",
                                model:
                                    model.model_name ??
                                    model.name,
                                status:
                                    model.status,
                                raw:
                                    model,
                            };
                        }
                    )
                    .filter(
                        (
                            row
                        ) =>
                            !normalizedSearch ||
                            [
                                row.category,
                                row.brand,
                                row.model,
                            ].some(
                                (
                                    value
                                ) =>
                                    value
                                        .toLowerCase()
                                        .includes(
                                            normalizedSearch
                                        )
                            )
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a.category.localeCompare(
                                b.category,
                                undefined,
                                {
                                    sensitivity:
                                        "base",
                                    numeric:
                                        true,
                                }
                            ) ||
                            a.brand.localeCompare(
                                b.brand,
                                undefined,
                                {
                                    sensitivity:
                                        "base",
                                    numeric:
                                        true,
                                }
                            ) ||
                            a.model.localeCompare(
                                b.model,
                                undefined,
                                {
                                    sensitivity:
                                        "base",
                                    numeric:
                                        true,
                                }
                            )
                    );
            },
            [
                deviceCatalog,
                normalizedSearch,
            ]
        );

    const filteredComponents =
        useMemo(
            () =>
                components
                    .filter(
                        (
                            item
                        ) =>
                            (
                                componentFilter ===
                                "all" ||
                                item.type ===
                                componentFilter
                            ) &&
                            (
                                !normalizedSearch ||
                                item.name
                                    .toLowerCase()
                                    .includes(
                                        normalizedSearch
                                    ) ||
                                COMPONENT_LABELS[
                                    item.type
                                ]
                                    .toLowerCase()
                                    .includes(
                                        normalizedSearch
                                    )
                            )
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a.name.localeCompare(
                                b.name,
                                undefined,
                                {
                                    sensitivity:
                                        "base",
                                    numeric:
                                        true,
                                }
                            )
                    ),
            [
                components,
                componentFilter,
                normalizedSearch,
            ]
        );

    const addLabel =
        activeTab ===
            "query"
            ? "Add Query Type"
            : activeTab ===
                "device"
                ? "Add Catalog Item"
                : "Add Component";

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                            <Layers3 className="h-4 w-4 text-primary" />
                        </div>

                        <div>
                            <h1 className="text-base font-semibold text-foreground">
                                Master Data
                            </h1>

                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                Manage Query Types, Device Catalog and hardware component specifications from one page.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            void loadAll()
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[10px] font-semibold text-muted-foreground hover:bg-muted"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setDrawer({
                                tab:
                                    activeTab,
                                mode:
                                    "add",
                            } as DrawerState)
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[10px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                        <CirclePlus className="h-3.5 w-3.5" />
                        {addLabel}
                    </button>
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                <KpiCard
                    label="Query Types"
                    value={
                        counts.query
                    }
                    icon={
                        <Tag className="h-4 w-4" />
                    }
                />

                <KpiCard
                    label="Categories"
                    value={
                        counts.categories
                    }
                    icon={
                        <Boxes className="h-4 w-4" />
                    }
                />

                <KpiCard
                    label="Brands"
                    value={
                        counts.brands
                    }
                    icon={
                        <Layers3 className="h-4 w-4" />
                    }
                />

                <KpiCard
                    label="Models"
                    value={
                        counts.models
                    }
                    icon={
                        <Database className="h-4 w-4" />
                    }
                />

                <KpiCard
                    label="Components"
                    value={
                        counts.components
                    }
                    icon={
                        <Cpu className="h-4 w-4" />
                    }
                />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border px-3 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <TabButton
                            active={
                                activeTab ===
                                "query"
                            }
                            onClick={() => {
                                setActiveTab(
                                    "query"
                                );

                                setSearch(
                                    ""
                                );
                            }}
                            label="Query Types"
                            count={
                                counts.query
                            }
                        />

                        <TabButton
                            active={
                                activeTab ===
                                "device"
                            }
                            onClick={() => {
                                setActiveTab(
                                    "device"
                                );

                                setSearch(
                                    ""
                                );
                            }}
                            label="Device Catalog"
                            count={
                                counts.models
                            }
                        />

                        <TabButton
                            active={
                                activeTab ===
                                "component"
                            }
                            onClick={() => {
                                setActiveTab(
                                    "component"
                                );

                                setSearch(
                                    ""
                                );
                            }}
                            label="Components"
                            count={
                                counts.components
                            }
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-b border-border p-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

                        <input
                            value={
                                search
                            }
                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event.target
                                        .value
                                )
                            }
                            placeholder={
                                activeTab ===
                                    "query"
                                    ? "Search query name or description..."
                                    : activeTab ===
                                        "device"
                                        ? "Search category, brand or model..."
                                        : "Search component..."
                            }
                            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-[11px] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                        />
                    </div>

                    {activeTab ===
                        "component" && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <FilterChip
                                    active={
                                        componentFilter ===
                                        "all"
                                    }
                                    onClick={() =>
                                        setComponentFilter(
                                            "all"
                                        )
                                    }
                                    label="All"
                                />

                                {(
                                    [
                                        "cpu",
                                        "ram",
                                        "ssd",
                                        "monitor",
                                    ] as ComponentType[]
                                ).map(
                                    (
                                        type
                                    ) => (
                                        <FilterChip
                                            key={
                                                type
                                            }
                                            active={
                                                componentFilter ===
                                                type
                                            }
                                            onClick={() =>
                                                setComponentFilter(
                                                    type
                                                )
                                            }
                                            label={
                                                COMPONENT_LABELS[
                                                type
                                                ]
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                </div>

                <div className="p-3">
                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <ErrorState
                            message={
                                error
                            }
                            onRetry={() =>
                                void loadAll()
                            }
                        />
                    ) : activeTab ===
                        "query" ? (
                        <QueryTable
                            rows={
                                filteredQueries
                            }
                            onEdit={(
                                item
                            ) =>
                                setDrawer({
                                    tab:
                                        "query",
                                    mode:
                                        "edit",
                                    item,
                                })
                            }
                        />
                    ) : activeTab ===
                        "device" ? (
                        <DeviceTable
                            rows={
                                deviceRows
                            }
                            onEdit={(
                                item
                            ) =>
                                setDrawer({
                                    tab:
                                        "device",
                                    mode:
                                        "edit",
                                    item,
                                })
                            }
                        />
                    ) : (
                        <ComponentTable
                            rows={
                                filteredComponents
                            }
                            onEdit={(
                                item
                            ) =>
                                setDrawer({
                                    tab:
                                        "component",
                                    mode:
                                        "edit",
                                    item,
                                })
                            }
                        />
                    )}
                </div>
            </section>

            {drawer && (
                <MasterDrawer
                    drawer={
                        drawer
                    }
                    deviceCatalog={
                        deviceCatalog
                    }
                    onClose={() =>
                        setDrawer(
                            null
                        )
                    }
                    onSaved={async () => {
                        setDrawer(
                            null
                        );

                        await loadAll();
                    }}
                />
            )}
        </div>
    );
}

function KpiCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                        {value.toLocaleString()}
                    </p>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    label,
    count,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                inline-flex
                h-9
                items-center
                gap-2
                rounded-t-lg
                border
                border-b-0
                px-3
                text-[10px]
                font-semibold
                ${active
                    ? "border-primary/30 bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }
            `}
        >
            {label}

            <span
                className={`
                    rounded-full
                    px-1.5
                    py-0.5
                    text-[9px]
                    ${active
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    }
                `}
            >
                {count}
            </span>
        </button>
    );
}

function FilterChip({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                inline-flex
                h-7
                items-center
                rounded-full
                border
                px-2.5
                text-[9px]
                font-semibold
                ${active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }
            `}
        >
            {label}
        </button>
    );
}

function QueryTable({
    rows,
    onEdit,
}: {
    rows: QueryTypeItem[];
    onEdit: (
        item: QueryTypeItem
    ) => void;
}) {
    if (
        rows.length ===
        0
    ) {
        return (
            <EmptyState text="No Query Type records found." />
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] border-collapse text-[11px]">
                <thead className="bg-muted/40">
                    <tr className="border-b border-border">
                        <th className="w-14 px-3 py-2 text-left font-semibold text-muted-foreground">
                            SL
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                            Query Type
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                            Description
                        </th>
                        <th className="w-24 px-3 py-2 text-left font-semibold text-muted-foreground">
                            Status
                        </th>
                        <th className="w-20 px-3 py-2 text-center font-semibold text-muted-foreground">
                            Action
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map(
                        (
                            item,
                            index
                        ) => (
                            <tr
                                key={
                                    item.id
                                }
                                className="border-b border-border/70 last:border-b-0 hover:bg-muted/20"
                            >
                                <td className="px-3 py-2 text-muted-foreground">
                                    {index +
                                        1}
                                </td>
                                <td className="px-3 py-2 font-medium text-foreground">
                                    {
                                        item.name
                                    }
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                    {item.description ||
                                        "—"}
                                </td>
                                <td className="px-3 py-2">
                                    <StatusBadge
                                        status={
                                            item.status
                                        }
                                    />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onEdit(
                                                item
                                            )
                                        }
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                                        aria-label="Edit Query Type"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>
    );
}

function DeviceTable({
    rows,
    onEdit,
}: {
    rows: {
        id: number;
        category: string;
        brand: string;
        model: string;
        status: MasterStatus;
        raw: DeviceCatalogItem;
    }[];
    onEdit: (
        item: DeviceCatalogItem
    ) => void;
}) {
    if (
        rows.length ===
        0
    ) {
        return (
            <EmptyState text="No device catalog model records found." />
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] border-collapse text-[11px]">
                <thead className="bg-muted/40">
                    <tr className="border-b border-border">
                        <th className="w-14 px-3 py-2 text-left font-semibold text-muted-foreground">
                            SL
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                            Category
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                            Brand
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                            Model
                        </th>
                        <th className="w-24 px-3 py-2 text-left font-semibold text-muted-foreground">
                            Status
                        </th>
                        <th className="w-20 px-3 py-2 text-center font-semibold text-muted-foreground">
                            Action
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map(
                        (
                            row,
                            index
                        ) => (
                            <tr
                                key={
                                    row.id
                                }
                                className="border-b border-border/70 last:border-b-0 hover:bg-muted/20"
                            >
                                <td className="px-3 py-2 text-muted-foreground">
                                    {index +
                                        1}
                                </td>
                                <td className="px-3 py-2 font-medium text-foreground">
                                    {
                                        row.category
                                    }
                                </td>
                                <td className="px-3 py-2 text-foreground">
                                    {
                                        row.brand
                                    }
                                </td>
                                <td className="px-3 py-2 text-foreground">
                                    {
                                        row.model
                                    }
                                </td>
                                <td className="px-3 py-2">
                                    <StatusBadge
                                        status={
                                            row.status
                                        }
                                    />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onEdit(
                                                row.raw
                                            )
                                        }
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                                        aria-label="Edit Device Catalog Item"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>
    );
}

function ComponentTable({
    rows,
    onEdit,
}: {
    rows: ComponentItem[];
    onEdit: (
        item: ComponentItem
    ) => void;
}) {
    if (
        rows.length ===
        0
    ) {
        return (
            <EmptyState text="No CPU, RAM, SSD or Monitor records found." />
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[680px] border-collapse text-[11px]">
                <thead className="bg-muted/40">
                    <tr className="border-b border-border">
                        <th className="w-14 px-3 py-2 text-left font-semibold text-muted-foreground">
                            SL
                        </th>
                        <th className="w-28 px-3 py-2 text-left font-semibold text-muted-foreground">
                            Type
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                            Component / Specification
                        </th>
                        <th className="w-24 px-3 py-2 text-left font-semibold text-muted-foreground">
                            Status
                        </th>
                        <th className="w-20 px-3 py-2 text-center font-semibold text-muted-foreground">
                            Action
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map(
                        (
                            item,
                            index
                        ) => (
                            <tr
                                key={
                                    item.id
                                }
                                className="border-b border-border/70 last:border-b-0 hover:bg-muted/20"
                            >
                                <td className="px-3 py-2 text-muted-foreground">
                                    {index +
                                        1}
                                </td>
                                <td className="px-3 py-2">
                                    <span className="inline-flex rounded-md bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-700">
                                        {
                                            COMPONENT_LABELS[
                                            item.type
                                            ]
                                        }
                                    </span>
                                </td>
                                <td className="px-3 py-2 font-medium text-foreground">
                                    {
                                        item.name
                                    }
                                </td>
                                <td className="px-3 py-2">
                                    <StatusBadge
                                        status={
                                            item.status
                                        }
                                    />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onEdit(
                                                item
                                            )
                                        }
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                                        aria-label="Edit Component"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>
    );
}

function MasterDrawer({
    drawer,
    deviceCatalog,
    onClose,
    onSaved,
}: {
    drawer: Exclude<
        DrawerState,
        null
    >;
    deviceCatalog: DeviceCatalogItem[];
    onClose: () => void;
    onSaved: () => Promise<void>;
}) {
    const [
        saving,
        setSaving,
    ] =
        useState(false);

    const [
        formError,
        setFormError,
    ] =
        useState("");

    const [
        queryName,
        setQueryName,
    ] =
        useState(
            drawer.tab ===
                "query"
                ? drawer.item
                    ?.name ??
                ""
                : ""
        );

    const [
        queryDescription,
        setQueryDescription,
    ] =
        useState(
            drawer.tab ===
                "query"
                ? drawer.item
                    ?.description ??
                ""
                : ""
        );

    const [
        status,
        setStatus,
    ] =
        useState<MasterStatus>(
            drawer.item?.status ??
            1
        );

    const [
        deviceLevel,
        setDeviceLevel,
    ] =
        useState<DeviceCatalogLevel>(
            drawer.tab ===
                "device"
                ? drawer.item
                    ?.type ??
                "category"
                : "category"
        );

    const [
        deviceName,
        setDeviceName,
    ] =
        useState(
            drawer.tab ===
                "device"
                ? drawer.item
                    ?.name ??
                drawer.item
                    ?.model_name ??
                ""
                : ""
        );

    const [
        parentId,
        setParentId,
    ] =
        useState(
            drawer.tab ===
                "device"
                ? String(
                    drawer.item
                        ?.parent_id ??
                    ""
                )
                : ""
        );


    const initialModelBrand =
        drawer.tab ===
            "device" &&
            drawer.item
                ?.type ===
            "model"
            ? deviceCatalog.find(
                (
                    item
                ) =>
                    item.id ===
                    Number(
                        drawer.item
                            ?.parent_id ??
                        0
                    )
            )
            : undefined;

    const [
        modelCategoryId,
        setModelCategoryId,
    ] =
        useState(
            initialModelBrand
                ?.parent_id
                ? String(
                    initialModelBrand.parent_id
                )
                : ""
        );

    const [
        componentType,
        setComponentType,
    ] =
        useState<ComponentType>(
            drawer.tab ===
                "component"
                ? drawer.item
                    ?.type ??
                "cpu"
                : "cpu"
        );

    const [
        componentName,
        setComponentName,
    ] =
        useState(
            drawer.tab ===
                "component"
                ? drawer.item
                    ?.name ??
                ""
                : ""
        );

    const categories =
        deviceCatalog
            .filter(
                (
                    item
                ) =>
                    item.type ===
                    "category" &&
                    item.status ===
                    1
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a.name.localeCompare(
                        b.name,
                        undefined,
                        {
                            sensitivity:
                                "base",
                            numeric:
                                true,
                        }
                    )
            );

    const brands =
        deviceCatalog
            .filter(
                (
                    item
                ) =>
                    item.type ===
                    "brand" &&
                    item.status ===
                    1 &&
                    (
                        deviceLevel !==
                        "model" ||
                        !modelCategoryId ||
                        Number(
                            item.parent_id ??
                            0
                        ) ===
                        Number(
                            modelCategoryId
                        )
                    )
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a.name.localeCompare(
                        b.name,
                        undefined,
                        {
                            sensitivity:
                                "base",
                            numeric:
                                true,
                        }
                    )
            );

    async function save() {
        try {
            setSaving(
                true
            );

            setFormError(
                ""
            );

            if (
                drawer.tab ===
                "query"
            ) {
                const name =
                    queryName.trim();

                if (
                    !name
                ) {
                    throw new Error(
                        "Query Type name is required."
                    );
                }

                const body = {
                    name,
                    description:
                        queryDescription.trim(),
                    status,
                };

                if (
                    drawer.mode ===
                    "edit" &&
                    drawer.item
                ) {
                    await masterDataApi.queryTypes.update(
                        drawer.item.id,
                        body
                    );
                } else {
                    await masterDataApi.queryTypes.create(
                        body
                    );
                }
            }

            if (
                drawer.tab ===
                "device"
            ) {
                const name =
                    deviceName.trim();

                if (
                    !name
                ) {
                    throw new Error(
                        "Name is required."
                    );
                }

                if (
                    deviceLevel !==
                    "category" &&
                    !parentId
                ) {
                    throw new Error(
                        deviceLevel ===
                            "brand"
                            ? "Parent Category is required."
                            : "Parent Brand is required."
                    );
                }

                const body = {
                    name,
                    type:
                        deviceLevel,
                    status,
                    parent_id:
                        deviceLevel ===
                            "category"
                            ? null
                            : Number(
                                parentId
                            ),
                };

                if (
                    drawer.mode ===
                    "edit" &&
                    drawer.item
                ) {
                    await masterDataApi.deviceCatalog.update(
                        drawer.item.id,
                        body
                    );
                } else {
                    await masterDataApi.deviceCatalog.create(
                        body
                    );
                }
            }

            if (
                drawer.tab ===
                "component"
            ) {
                const name =
                    componentName.trim();

                if (
                    !name
                ) {
                    throw new Error(
                        "Component specification is required."
                    );
                }

                const body = {
                    type:
                        componentType,
                    name,
                    status,
                };

                if (
                    drawer.mode ===
                    "edit" &&
                    drawer.item
                ) {
                    await masterDataApi.components.update(
                        drawer.item.id,
                        body
                    );
                } else {
                    await masterDataApi.components.create(
                        body
                    );
                }
            }

            await onSaved();
        } catch (
        reason
        ) {
            setFormError(
                reason instanceof
                    Error
                    ? reason.message
                    : "Unable to save master data."
            );
        } finally {
            setSaving(
                false
            );
        }
    }

    const title =
        drawer.tab ===
            "query"
            ? drawer.mode ===
                "edit"
                ? "Edit Query Type"
                : "Add Query Type"
            : drawer.tab ===
                "device"
                ? drawer.mode ===
                    "edit"
                    ? "Edit Device Catalog"
                    : "Add Device Catalog"
                : drawer.mode ===
                    "edit"
                    ? "Edit Component"
                    : "Add Component";

    return (
        <div className="pointer-events-none fixed inset-y-0 right-0 z-[160] flex justify-end">
            <aside className="pointer-events-auto relative flex h-full w-[430px] max-w-[94vw] flex-col border-l border-border bg-card shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">
                            {title}
                        </h2>

                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Changes are saved to ITM master data.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {drawer.tab ===
                        "query" && (
                            <>
                                <Field
                                    label="Query Type Name"
                                    required
                                >
                                    <input
                                        value={
                                            queryName
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setQueryName(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[11px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                                        placeholder="e.g. Password Reset"
                                    />
                                </Field>

                                <Field label="Description">
                                    <textarea
                                        value={
                                            queryDescription
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setQueryDescription(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        rows={
                                            4
                                        }
                                        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-[11px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                                        placeholder="Describe this query type"
                                    />
                                </Field>
                            </>
                        )}

                    {drawer.tab ===
                        "device" && (
                            <>
                                <Field
                                    label="Level"
                                    required
                                >
                                    <SearchableSelect
                                        value={
                                            deviceLevel
                                        }
                                        onChange={(
                                            value
                                        ) => {
                                            setDeviceLevel(
                                                value as DeviceCatalogLevel
                                            );

                                            setParentId(
                                                ""
                                            );

                                            setModelCategoryId(
                                                ""
                                            );
                                        }}
                                        options={[
                                            {
                                                value:
                                                    "category",
                                                label:
                                                    "Category",
                                            },
                                            {
                                                value:
                                                    "brand",
                                                label:
                                                    "Brand",
                                            },
                                            {
                                                value:
                                                    "model",
                                                label:
                                                    "Model",
                                            },
                                        ]}
                                        placeholder="Select Level"
                                        searchPlaceholder="Search Level..."
                                        allowClear={
                                            false
                                        }
                                    />
                                </Field>

                                {deviceLevel ===
                                    "brand" && (
                                        <Field
                                            label="Parent Category"
                                            required
                                        >
                                            <SearchableSelect
                                                value={
                                                    parentId
                                                }
                                                onChange={
                                                    setParentId
                                                }
                                                options={
                                                    categories.map(
                                                        (
                                                            item
                                                        ) => ({
                                                            value:
                                                                String(
                                                                    item.id
                                                                ),
                                                            label:
                                                                item.name,
                                                        })
                                                    )
                                                }
                                                placeholder="Select Category"
                                                searchPlaceholder="Search Category..."
                                            />
                                        </Field>
                                    )}

                                {deviceLevel ===
                                    "model" && (
                                        <>
                                            <Field
                                                label="Category"
                                                required
                                            >
                                                <SearchableSelect
                                                    value={
                                                        modelCategoryId
                                                    }
                                                    onChange={(
                                                        value
                                                    ) => {
                                                        setModelCategoryId(
                                                            value
                                                        );

                                                        setParentId(
                                                            ""
                                                        );
                                                    }}
                                                    options={
                                                        categories.map(
                                                            (
                                                                item
                                                            ) => ({
                                                                value:
                                                                    String(
                                                                        item.id
                                                                    ),
                                                                label:
                                                                    item.name,
                                                            })
                                                        )
                                                    }
                                                    placeholder="Select Category"
                                                    searchPlaceholder="Search Category..."
                                                />
                                            </Field>

                                            <Field
                                                label="Parent Brand"
                                                required
                                            >
                                                <SearchableSelect
                                                    value={
                                                        parentId
                                                    }
                                                    onChange={
                                                        setParentId
                                                    }
                                                    options={
                                                        brands.map(
                                                            (
                                                                item
                                                            ) => ({
                                                                value:
                                                                    String(
                                                                        item.id
                                                                    ),
                                                                label:
                                                                    item.name,
                                                            })
                                                        )
                                                    }
                                                    placeholder={
                                                        modelCategoryId
                                                            ? "Select Brand"
                                                            : "Select Category first"
                                                    }
                                                    searchPlaceholder="Search Brand..."
                                                    disabled={
                                                        !modelCategoryId
                                                    }
                                                />
                                            </Field>
                                        </>
                                    )}

                                <Field
                                    label={
                                        deviceLevel ===
                                            "category"
                                            ? "Category Name"
                                            : deviceLevel ===
                                                "brand"
                                                ? "Brand Name"
                                                : "Model Name"
                                    }
                                    required
                                >
                                    <input
                                        value={
                                            deviceName
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setDeviceName(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[11px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                                        placeholder={
                                            deviceLevel ===
                                                "category"
                                                ? "e.g. Laptop"
                                                : deviceLevel ===
                                                    "brand"
                                                    ? "e.g. Dell"
                                                    : "e.g. Latitude 5420"
                                        }
                                    />
                                </Field>
                            </>
                        )}

                    {drawer.tab ===
                        "component" && (
                            <>
                                <Field
                                    label="Component Type"
                                    required
                                >
                                    <SearchableSelect
                                        value={
                                            componentType
                                        }
                                        onChange={(
                                            value
                                        ) =>
                                            setComponentType(
                                                value as ComponentType
                                            )
                                        }
                                        options={[
                                            {
                                                value:
                                                    "cpu",
                                                label:
                                                    "CPU",
                                            },
                                            {
                                                value:
                                                    "ram",
                                                label:
                                                    "RAM",
                                            },
                                            {
                                                value:
                                                    "ssd",
                                                label:
                                                    "SSD",
                                            },
                                            {
                                                value:
                                                    "monitor",
                                                label:
                                                    "Monitor",
                                            },
                                        ]}
                                        placeholder="Select Component Type"
                                        searchPlaceholder="Search Component Type..."
                                        allowClear={
                                            false
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Component / Specification"
                                    required
                                >
                                    <input
                                        value={
                                            componentName
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setComponentName(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[11px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                                        placeholder={
                                            componentType ===
                                                "cpu"
                                                ? "e.g. Intel Core i5 12th Gen"
                                                : componentType ===
                                                    "ram"
                                                    ? "e.g. 16 GB DDR4 3200 MHz"
                                                    : componentType ===
                                                        "ssd"
                                                        ? "e.g. 512 GB NVMe"
                                                        : "e.g. Dell 24 inch FHD"
                                        }
                                    />
                                </Field>
                            </>
                        )}

                    <Field
                        label="Status"
                        required
                    >
                        <SearchableSelect
                            value={
                                String(
                                    status
                                )
                            }
                            onChange={(
                                value
                            ) =>
                                setStatus(
                                    Number(
                                        value
                                    ) as MasterStatus
                                )
                            }
                            options={[
                                {
                                    value:
                                        "1",
                                    label:
                                        "Active",
                                },
                                {
                                    value:
                                        "0",
                                    label:
                                        "Inactive",
                                },
                            ]}
                            placeholder="Select Status"
                            searchPlaceholder="Search Status..."
                            allowClear={
                                false
                            }
                        />
                    </Field>

                    {formError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-600">
                            {
                                formError
                            }
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/15 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={
                            saving
                        }
                        className="h-9 rounded-lg border border-border bg-background px-4 text-[10px] font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            void save()
                        }
                        disabled={
                            saving
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[10px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                        {saving
                            ? "Saving..."
                            : drawer.mode ===
                                "edit"
                                ? "Update"
                                : "Save"}
                        {!saving && (
                            <ChevronRight className="h-3.5 w-3.5" />
                        )}
                    </button>
                </div>
            </aside>
        </div>
    );
}

function Field({
    label,
    required = false,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-foreground">
                {label}

                {required && (
                    <span className="text-red-500">
                        *
                    </span>
                )}
            </span>

            {children}
        </label>
    );
}
