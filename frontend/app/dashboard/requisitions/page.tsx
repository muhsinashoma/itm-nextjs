

//frontend/app/dashboard/requisitions/page.tsx

"use client";

import {
    Suspense,
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Columns3,
    Eye,
    Filter,
    LoaderCircle,
    RefreshCcw,
    Search,
    X,
    XCircle,
} from "lucide-react";

import {
    Button,
} from "@/components/ui/button";

import {
    dashboardApi,
    type RequisitionCategorySummary,
    type RequisitionDashboardSummary,
    type RequisitionItem,
} from "@/lib/api";

/* ======================================================
   TYPES
====================================================== */

type RequisitionView =
    | "summary"
    | "pending"
    | "rejected"
    | "tt_reason";

type RequisitionListView =
    | "all"
    | "pending"
    | "rejected";

type DateFilters = {
    fromDate: string;
    toDate: string;
};

type OptionalColumn =
    | "raisedBy"
    | "userDetails"
    | "reason";

type VisibleColumns = {
    raisedBy: boolean;
    userDetails: boolean;
    reason: boolean;
};

/* ======================================================
   CONSTANTS
====================================================== */

const VALID_VIEWS: RequisitionView[] = [
    "summary",
    "pending",
    "rejected",
    "tt_reason",
];

const PAGE_SIZE = 10;

const EMPTY_DASHBOARD_SUMMARY:
    RequisitionDashboardSummary = {
    pending_categories: 0,
    approval_pending: 0,
    rejected: 0,
    approved: 0,
    total_active: 0,
};

/*
 * Professional default:
 *
 * Raised By    = hidden
 * User Details = hidden
 * Reason       = hidden
 *
 * User can enable them from Columns.
 */
const DEFAULT_VISIBLE_COLUMNS:
    VisibleColumns = {
    raisedBy: false,
    userDetails: false,
    reason: false,
};

const VIEW_CONFIG: Record<
    RequisitionView,
    {
        title: string;
        description: string;
        emptyTitle: string;
        emptyDescription: string;
    }
> = {
    summary: {
        title:
            "Requisition Summary",

        description:
            "IT Accessories pending requisition summary by category",

        emptyTitle:
            "No Pending Requisitions",

        emptyDescription:
            "There are currently no IT accessories requisitions waiting for approval.",
    },

    pending: {
        title:
            "Approval Pending",

        description:
            "IT Accessories requisitions currently waiting for approval",

        emptyTitle:
            "No Approval Pending Requisitions",

        emptyDescription:
            "There are currently no requisitions waiting for approval.",
    },

    rejected: {
        title:
            "Rejected Requisitions",

        description:
            "IT Accessories requisitions rejected during the approval workflow",

        emptyTitle:
            "No Rejected Requisitions",

        emptyDescription:
            "There are currently no rejected requisitions.",
    },

    tt_reason: {
        title:
            "IT Accessories Requisition List",

        description:
            "Complete TT reason, approval, and delivery workflow",

        emptyTitle:
            "No Requisition Records",

        emptyDescription:
            "No IT accessories requisition records were found.",
    },
};

const VIEW_OPTIONS: {
    view: RequisitionView;
    label: string;
}[] = [
        {
            view:
                "summary",

            label:
                "Requisition Summary",
        },

        {
            view:
                "pending",

            label:
                "Approval Pending",
        },

        {
            view:
                "rejected",

            label:
                "Rejected",
        },

        {
            view:
                "tt_reason",

            label:
                "TT Reason",
        },
    ];

/* ======================================================
   DATE HELPERS
====================================================== */

function normalizeDateValue(
    value: string
) {
    if (!value) {
        return "";
    }

    let normalized =
        value.trim();

    if (
        normalized.includes(
            " "
        ) &&
        !normalized.includes(
            "T"
        )
    ) {
        normalized =
            normalized.replace(
                " ",
                "T"
            );
    }

    normalized =
        normalized.replace(
            /([+-]\d{2})$/,
            "$1:00"
        );

    return normalized;
}

function formatDateTime(
    value: string
) {
    if (!value) {
        return "—";
    }

    const normalized =
        normalizeDateValue(
            value
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

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",

            hour12:
                true,
        }
    ).format(
        date
    );
}

/* ======================================================
   APPROVAL BADGE

   Used after workflow has already been completed.
====================================================== */

function ApprovalBadge({
    item,
}: {
    item: RequisitionItem;
}) {
    if (
        item.approved_val ===
        1
    ) {
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3 shrink-0" />

                Petty Cash (Approved)
            </span>
        );
    }

    if (
        item.approved_val ===
        3
    ) {
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-sky-600 dark:text-sky-400">
                <CheckCircle2 className="h-3 w-3 shrink-0" />

                PR (Approved)
            </span>
        );
    }

    if (
        item.approved_val ===
        2
    ) {
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-red-600 dark:text-red-400">
                <XCircle className="h-3 w-3 shrink-0" />

                Rejected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-amber-600 dark:text-amber-400">
            <Clock3 className="h-3 w-3 shrink-0" />

            Approval Pending
        </span>
    );
}

/* ======================================================
   DELIVERY BADGE

   Used after delivery workflow has already been
   completed.
====================================================== */

function DeliveryBadge({
    item,
}: {
    item: RequisitionItem;
}) {
    if (
        item.delivered_val ===
        1
    ) {
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3 shrink-0" />

                Delivered
            </span>
        );
    }

    if (
        item.delivered_val ===
        2
    ) {
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-red-600 dark:text-red-400">
                <XCircle className="h-3 w-3 shrink-0" />

                Rejected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold text-amber-600 dark:text-amber-400">
            <Clock3 className="h-3 w-3 shrink-0" />

            Pending
        </span>
    );
}

/* ======================================================
   APPROVAL DROPDOWN

   IMPORTANT:
   This dropdown is shown ONLY while approval is pending.

   Once approved or rejected, ApprovalBadge is used
   instead.
====================================================== */

function ApprovalDropdown({
    disabled,
    onChange,
}: {
    disabled: boolean;

    onChange:
    (
        value:
            number
    ) => void;
}) {
    return (
        <select
            value="0"
            disabled={
                disabled
            }
            onChange={(
                event
            ) => {
                const value =
                    Number(
                        event
                            .target
                            .value
                    );

                /*
                 * 0 is only the placeholder/current
                 * pending state.
                 *
                 * Do not send an update when user
                 * selects it.
                 */
                if (
                    value ===
                    0
                ) {
                    return;
                }

                onChange(
                    value
                );
            }}
            className="
                h-7
                min-w-[155px]
                rounded-md
                border
                border-amber-400
                bg-amber-50/50
                px-2
                text-[9px]
                font-semibold
                text-amber-700
                outline-none
                transition-colors
                focus:ring-1
                focus:ring-amber-400/30
                disabled:cursor-wait
                disabled:opacity-60
                dark:bg-amber-950/20
                dark:text-amber-400
            "
        >
            <option value="0">
                - Select -
            </option>

            <option value="1">
                Petty Cash (Approved)
            </option>

            <option value="3">
                PR (Approved)
            </option>

            <option value="2">
                Rejected
            </option>
        </select>
    );
}

/* ======================================================
   DELIVERY DROPDOWN

   IMPORTANT:
   This dropdown is shown ONLY when:

       approval = approved
       delivery = pending

   After Delivered or Rejected, DeliveryBadge is used.
====================================================== */

function DeliveryDropdown({
    disabled,
    onChange,
}: {
    disabled: boolean;

    onChange:
    (
        value:
            number
    ) => void;
}) {
    return (
        <select
            value="0"
            disabled={
                disabled
            }
            onChange={(
                event
            ) => {
                const value =
                    Number(
                        event
                            .target
                            .value
                    );

                /*
                 * Keep Pending as the current state.
                 * Only send update for a final action.
                 */
                if (
                    value ===
                    0
                ) {
                    return;
                }

                onChange(
                    value
                );
            }}
            className="
                h-7
                min-w-[115px]
                rounded-md
                border
                border-amber-400
                bg-amber-50/50
                px-2
                text-[9px]
                font-semibold
                text-amber-700
                outline-none
                transition-colors
                focus:ring-1
                focus:ring-amber-400/30
                disabled:cursor-wait
                disabled:opacity-60
                dark:bg-amber-950/20
                dark:text-amber-400
            "
        >
            <option value="0">
                Pending
            </option>

            <option value="1">
                Delivered
            </option>

            <option value="2">
                Rejected
            </option>
        </select>
    );
}

/* ======================================================
   APPROVAL STATUS CELL

   Workflow:

   approved_val = 0
       → approval dropdown

   approved_val = 1
       → Petty Cash Approved text

   approved_val = 3
       → PR Approved text

   approved_val = 2
       → Rejected text
====================================================== */

function ApprovalStatusCell({
    item,
    updatingCell,
    onUpdate,
}: {
    item:
    RequisitionItem;

    updatingCell:
    string;

    onUpdate:
    (
        item:
            RequisitionItem,
        value:
            number
    ) => void;
}) {
    const approvedVal =
        Number(
            item.approved_val ??
            0
        );

    /*
     * Approval still pending.
     *
     * This is where user must get the dropdown.
     */
    if (
        approvedVal ===
        0
    ) {
        return (
            <ApprovalDropdown
                disabled={
                    updatingCell ===
                    `approval-${item.id}`
                }
                onChange={(
                    value
                ) =>
                    onUpdate(
                        item,
                        value
                    )
                }
            />
        );
    }

    /*
     * Approval already completed.
     *
     * Do not keep an editable dropdown here.
     */
    return (
        <ApprovalBadge
            item={
                item
            }
        />
    );
}

/* ======================================================
   DELIVERY STATUS CELL

   Workflow:

   approval pending
       → no delivery action

   approval rejected
       → no delivery action

   approved + delivery pending
       → delivery dropdown

   delivery completed
       → status value
====================================================== */

function DeliveryStatusCell({
    item,
    updatingCell,
    onUpdate,
}: {
    item:
    RequisitionItem;

    updatingCell:
    string;

    onUpdate:
    (
        item:
            RequisitionItem,
        value:
            number
    ) => void;
}) {
    const approvedVal =
        Number(
            item.approved_val ??
            0
        );

    const deliveredVal =
        Number(
            item.delivered_val ??
            0
        );

    const isApproved =
        approvedVal ===
        1 ||
        approvedVal ===
        3;

    const isApprovalPending =
        approvedVal ===
        0;

    const isApprovalRejected =
        approvedVal ===
        2;

    /*
     * Approval must happen before delivery.
     */
    if (
        isApprovalPending
    ) {
        return (
            <span className="text-[9px] text-muted-foreground">
                —
            </span>
        );
    }

    /*
     * Rejected requisition does not continue
     * to delivery workflow.
     */
    if (
        isApprovalRejected
    ) {
        return (
            <span className="text-[9px] text-muted-foreground">
                —
            </span>
        );
    }

    /*
     * Requisition has been approved, but delivery
     * is still pending.
     *
     * Now user gets the Delivery dropdown.
     */
    if (
        isApproved &&
        deliveredVal ===
        0
    ) {
        return (
            <DeliveryDropdown
                disabled={
                    updatingCell ===
                    `delivery-${item.id}`
                }
                onChange={(
                    value
                ) =>
                    onUpdate(
                        item,
                        value
                    )
                }
            />
        );
    }

    /*
     * Delivery already completed/rejected.
     */
    return (
        <DeliveryBadge
            item={
                item
            }
        />
    );
}

/* ======================================================
   DETAIL FIELD
====================================================== */

function DetailField({
    label,
    value,
}: {
    label: string;

    value:
    | string
    | number
    | null
    | undefined;
}) {
    const displayValue =
        value === null ||
            value === undefined ||
            value === ""
            ? "—"
            : String(
                value
            );

    return (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                {
                    label
                }
            </p>

            <p className="mt-1 break-words text-[10px] font-medium text-foreground">
                {
                    displayValue
                }
            </p>
        </div>
    );
}

/* ======================================================
   DETAILS MODAL
====================================================== */

function RequisitionDetailsModal({
    item,
    onClose,
}: {
    item:
    | RequisitionItem
    | null;

    onClose:
    () => void;
}) {
    if (
        !item
    ) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
                {/* Header */}

                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-primary">
                            IT Accessories Requisition
                        </p>

                        <h2 className="mt-1 text-sm font-semibold text-foreground">
                            {
                                item.tt_no
                            }
                        </h2>

                        <p className="mt-1 text-[9px] text-muted-foreground">
                            Complete requisition information
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-label="Close"
                        onClick={
                            onClose
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}

                <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-5">
                    {/* Workflow Summary */}

                    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/20 px-3 py-2">
                        <div>
                            <p className="mb-1 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Approval
                            </p>

                            <ApprovalBadge
                                item={
                                    item
                                }
                            />
                        </div>

                        <div className="h-8 w-px bg-border" />

                        <div>
                            <p className="mb-1 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Delivery
                            </p>

                            {item.approved_val ===
                                0 ||
                                item.approved_val ===
                                2 ? (
                                <span className="text-[9px] text-muted-foreground">
                                    —
                                </span>
                            ) : (
                                <DeliveryBadge
                                    item={
                                        item
                                    }
                                />
                            )}
                        </div>
                    </div>

                    {/* Detail Grid */}

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailField
                            label="TT No"
                            value={
                                item.tt_no
                            }
                        />

                        <DetailField
                            label="Submitted Date"
                            value={
                                formatDateTime(
                                    item.created_at
                                )
                            }
                        />

                        <DetailField
                            label="Category"
                            value={
                                item.category
                            }
                        />

                        <DetailField
                            label="Device Serial"
                            value={
                                item.device_sl_no
                            }
                        />

                        <DetailField
                            label="Employee ID"
                            value={
                                item.employee_id
                            }
                        />

                        <DetailField
                            label="Employee Name"
                            value={
                                item.employee_name
                            }
                        />

                        <DetailField
                            label="Raised By ID"
                            value={
                                item.created_by
                            }
                        />

                        <DetailField
                            label="Raised By"
                            value={
                                item.created_by_name
                            }
                        />

                        <DetailField
                            label="Approval Status"
                            value={
                                item.approval_status
                            }
                        />

                        <DetailField
                            label="Approved By"
                            value={
                                item.approved_by_name ||
                                item.approved_by
                            }
                        />

                        <DetailField
                            label="Approved Date"
                            value={
                                formatDateTime(
                                    item.approved_date
                                )
                            }
                        />

                        <DetailField
                            label="Delivery Status"
                            value={
                                item.approved_val ===
                                    0 ||
                                    item.approved_val ===
                                    2
                                    ? "—"
                                    : item.delivery_status
                            }
                        />

                        <DetailField
                            label="Delivered By"
                            value={
                                item.delivered_by_name ||
                                item.delivered_by
                            }
                        />

                        <DetailField
                            label="Delivered Date"
                            value={
                                formatDateTime(
                                    item.delivered_date
                                )
                            }
                        />
                    </div>

                    {/* Reason */}

                    <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Reason
                        </p>

                        <p className="mt-2 whitespace-pre-wrap break-words text-[10px] leading-5 text-foreground">
                            {
                                item.reason_details ||
                                "—"
                            }
                        </p>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-[9px]"
                            onClick={
                                onClose
                            }
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ======================================================
   PAGE CONTENT
====================================================== */

function RequisitionPageContent() {
    const router =
        useRouter();

    const searchParams =
        useSearchParams();

    /* ==================================================
       VIEW
    ================================================== */

    const rawView =
        searchParams.get(
            "view"
        ) ??
        "summary";

    const view:
        RequisitionView =
        VALID_VIEWS.includes(
            rawView as
            RequisitionView
        )
            ? rawView as
            RequisitionView
            : "summary";

    const selectedCategory =
        searchParams.get(
            "category"
        ) ??
        "";

    const config =
        VIEW_CONFIG[
        view
        ];

    /* ==================================================
       SUMMARY STATE
    ================================================== */

    const [
        dashboardSummary,
        setDashboardSummary,
    ] =
        useState<RequisitionDashboardSummary>(
            EMPTY_DASHBOARD_SUMMARY
        );

    const [
        dashboardLoading,
        setDashboardLoading,
    ] =
        useState(
            true
        );

    const [
        summaryRefreshKey,
        setSummaryRefreshKey,
    ] =
        useState(
            0
        );

    /* ==================================================
       CATEGORY SUMMARY
    ================================================== */

    const [
        categoryRows,
        setCategoryRows,
    ] =
        useState<
            RequisitionCategorySummary[]
        >([]);

    const [
        categoryLoading,
        setCategoryLoading,
    ] =
        useState(
            true
        );

    const [
        categoryError,
        setCategoryError,
    ] =
        useState(
            ""
        );

    const [
        categorySearch,
        setCategorySearch,
    ] =
        useState(
            ""
        );

    /* ==================================================
       LIST
    ================================================== */

    const [
        rows,
        setRows,
    ] =
        useState<
            RequisitionItem[]
        >([]);

    const [
        total,
        setTotal,
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
        loading,
        setLoading,
    ] =
        useState(
            true
        );

    const [
        error,
        setError,
    ] =
        useState(
            ""
        );

    const [
        listRefreshKey,
        setListRefreshKey,
    ] =
        useState(
            0
        );

    /* ==================================================
       UPDATE ACTION
    ================================================== */

    const [
        updatingCell,
        setUpdatingCell,
    ] =
        useState(
            ""
        );

    const [
        actionError,
        setActionError,
    ] =
        useState(
            ""
        );

    /* ==================================================
       SEARCH / FILTER
    ================================================== */

    const [
        search,
        setSearch,
    ] =
        useState(
            ""
        );

    const deferredSearch =
        useDeferredValue(
            search
        );

    const [
        dateFilters,
        setDateFilters,
    ] =
        useState<DateFilters>({
            fromDate:
                "",

            toDate:
                "",
        });

    const [
        filtersOpen,
        setFiltersOpen,
    ] =
        useState(
            false
        );

    /* ==================================================
       COLUMN VISIBILITY
    ================================================== */

    const [
        columnsOpen,
        setColumnsOpen,
    ] =
        useState(
            false
        );

    const [
        visibleColumns,
        setVisibleColumns,
    ] =
        useState<VisibleColumns>(
            DEFAULT_VISIBLE_COLUMNS
        );

    /* ==================================================
       DETAILS MODAL
    ================================================== */

    const [
        selectedItem,
        setSelectedItem,
    ] =
        useState<
            | RequisitionItem
            | null
        >(
            null
        );

    /* ==================================================
       LOAD DASHBOARD SUMMARY
    ================================================== */

    useEffect(
        () => {
            let mounted =
                true;

            async function loadSummary() {
                try {
                    setDashboardLoading(
                        true
                    );

                    const response =
                        await dashboardApi
                            .requisitionDashboardSummary();

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setDashboardSummary({
                        pending_categories:
                            Number(
                                response
                                    .data
                                    ?.pending_categories ??
                                0
                            ),

                        approval_pending:
                            Number(
                                response
                                    .data
                                    ?.approval_pending ??
                                0
                            ),

                        rejected:
                            Number(
                                response
                                    .data
                                    ?.rejected ??
                                0
                            ),

                        approved:
                            Number(
                                response
                                    .data
                                    ?.approved ??
                                0
                            ),

                        total_active:
                            Number(
                                response
                                    .data
                                    ?.total_active ??
                                0
                            ),
                    });
                } catch (
                reason:
                    unknown
                ) {
                    console.error(
                        "Unable to load requisition dashboard summary:",
                        reason
                    );

                    if (
                        mounted
                    ) {
                        setDashboardSummary(
                            EMPTY_DASHBOARD_SUMMARY
                        );
                    }
                } finally {
                    if (
                        mounted
                    ) {
                        setDashboardLoading(
                            false
                        );
                    }
                }
            }

            void loadSummary();

            return () => {
                mounted =
                    false;
            };
        },
        [
            summaryRefreshKey,
        ]
    );

    /* ==================================================
       LOAD CATEGORY SUMMARY
    ================================================== */

    useEffect(
        () => {
            let mounted =
                true;

            async function loadCategories() {
                try {
                    setCategoryLoading(
                        true
                    );

                    setCategoryError(
                        ""
                    );

                    const response =
                        await dashboardApi
                            .requisitionSummary();

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setCategoryRows(
                        response.data ??
                        []
                    );
                } catch (
                reason:
                    unknown
                ) {
                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setCategoryRows(
                        []
                    );

                    setCategoryError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load Requisition Summary"
                    );
                } finally {
                    if (
                        mounted
                    ) {
                        setCategoryLoading(
                            false
                        );
                    }
                }
            }

            void loadCategories();

            return () => {
                mounted =
                    false;
            };
        },
        [
            summaryRefreshKey,
        ]
    );

    /* ==================================================
       RESET PAGE ON FILTER CHANGE
    ================================================== */

    useEffect(
        () => {
            setPage(
                1
            );
        },
        [
            view,
            selectedCategory,
            deferredSearch,
            dateFilters.fromDate,
            dateFilters.toDate,
        ]
    );

    /* ==================================================
       LOAD REQUISITION LIST
    ================================================== */

    useEffect(
        () => {
            if (
                view ===
                "summary"
            ) {
                setRows(
                    []
                );

                setTotal(
                    0
                );

                setLoading(
                    false
                );

                setError(
                    ""
                );

                return;
            }

            const listView:
                RequisitionListView =
                view ===
                    "tt_reason"
                    ? "all"
                    : view;

            let mounted =
                true;

            async function loadList() {
                try {
                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );

                    const response =
                        await dashboardApi
                            .requisitions({
                                view:
                                    listView,

                                category:
                                    selectedCategory ||
                                    undefined,

                                search:
                                    deferredSearch
                                        .trim() ||
                                    undefined,

                                from_date:
                                    dateFilters
                                        .fromDate ||
                                    undefined,

                                to_date:
                                    dateFilters
                                        .toDate ||
                                    undefined,

                                page,

                                limit:
                                    PAGE_SIZE,
                            });

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setRows(
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
                reason:
                    unknown
                ) {
                    if (
                        !mounted
                    ) {
                        return;
                    }

                    setRows(
                        []
                    );

                    setTotal(
                        0
                    );

                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load Requisition records"
                    );
                } finally {
                    if (
                        mounted
                    ) {
                        setLoading(
                            false
                        );
                    }
                }
            }

            void loadList();

            return () => {
                mounted =
                    false;
            };
        },
        [
            view,
            selectedCategory,
            deferredSearch,
            dateFilters.fromDate,
            dateFilters.toDate,
            page,
            listRefreshKey,
        ]
    );

    /* ==================================================
       CATEGORY FILTER
    ================================================== */

    const filteredCategoryRows =
        useMemo(
            () => {
                const value =
                    categorySearch
                        .trim()
                        .toLowerCase();

                if (
                    !value
                ) {
                    return categoryRows;
                }

                return categoryRows.filter(
                    (
                        item
                    ) =>
                        item.category
                            .toLowerCase()
                            .includes(
                                value
                            )
                );
            },
            [
                categoryRows,
                categorySearch,
            ]
        );

    const totalPendingFromCategories =
        useMemo(
            () =>
                categoryRows.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        Number(
                            item.pending_count ??
                            0
                        ),
                    0
                ),
            [
                categoryRows,
            ]
        );

    /* ==================================================
       CALCULATED
    ================================================== */

    const totalPages =
        Math.max(
            Math.ceil(
                total /
                PAGE_SIZE
            ),
            1
        );

    const currentRecordCount =
        view ===
            "summary"
            ? dashboardSummary
                .pending_categories
            : total;

    const currentRecordLabel =
        view ===
            "summary"
            ? currentRecordCount ===
                1
                ? "Category"
                : "Categories"
            : currentRecordCount ===
                1
                ? "Record"
                : "Records";

    const hasActiveFilters =
        Boolean(
            selectedCategory ||
            search.trim() ||
            dateFilters.fromDate ||
            dateFilters.toDate
        );

    const tableColumnCount =
        12 +
        (
            visibleColumns
                .raisedBy
                ? 1
                : 0
        ) +
        (
            visibleColumns
                .userDetails
                ? 1
                : 0
        ) +
        (
            visibleColumns
                .reason
                ? 1
                : 0
        );

    /* ==================================================
       COLUMN ACTION
    ================================================== */

    function toggleColumn(
        column:
            OptionalColumn
    ) {
        setVisibleColumns(
            (
                current
            ) => ({
                ...current,

                [column]:
                    !current[
                    column
                    ],
            })
        );
    }

    function resetColumns() {
        setVisibleColumns(
            DEFAULT_VISIBLE_COLUMNS
        );
    }

    /* ==================================================
       VIEW ACTIONS
    ================================================== */

    function changeView(
        nextView:
            RequisitionView
    ) {
        setSearch(
            ""
        );

        setDateFilters({
            fromDate:
                "",

            toDate:
                "",
        });

        setFiltersOpen(
            false
        );

        setColumnsOpen(
            false
        );

        setActionError(
            ""
        );

        setPage(
            1
        );

        router.push(
            `/dashboard/requisitions?view=${nextView}`
        );
    }

    function openPendingCategory(
        category:
            string
    ) {
        setSearch(
            ""
        );

        setDateFilters({
            fromDate:
                "",

            toDate:
                "",
        });

        setPage(
            1
        );

        router.push(
            `/dashboard/requisitions?view=pending&category=${encodeURIComponent(
                category
            )}`
        );
    }

    function clearFilters() {
        setSearch(
            ""
        );

        setDateFilters({
            fromDate:
                "",

            toDate:
                "",
        });

        setPage(
            1
        );

        if (
            selectedCategory
        ) {
            router.push(
                `/dashboard/requisitions?view=${view}`
            );
        }
    }

    /* ==================================================
       APPROVAL UPDATE
    ================================================== */

    async function updateApproval(
        item:
            RequisitionItem,
        approvedVal:
            number
    ) {
        const key =
            `approval-${item.id}`;

        try {
            setUpdatingCell(
                key
            );

            setActionError(
                ""
            );

            await dashboardApi
                .updateRequisitionApproval(
                    item.id,
                    approvedVal
                );

            /*
             * Reload current list.
             *
             * On Approval Pending page, an approved
             * record disappears automatically because
             * it is no longer pending.
             *
             * On TT Reason page it remains and changes
             * from Approval dropdown to Approval value +
             * Delivery dropdown.
             */
            setListRefreshKey(
                (
                    current
                ) =>
                    current +
                    1
            );

            /*
             * Also refresh dashboard counts.
             */
            setSummaryRefreshKey(
                (
                    current
                ) =>
                    current +
                    1
            );
        } catch (
        reason:
            unknown
        ) {
            setActionError(
                reason instanceof
                    Error
                    ? reason.message
                    : "Unable to update approval status"
            );
        } finally {
            setUpdatingCell(
                ""
            );
        }
    }

    /* ==================================================
       DELIVERY UPDATE
    ================================================== */

    async function updateDelivery(
        item:
            RequisitionItem,
        deliveredVal:
            number
    ) {
        const key =
            `delivery-${item.id}`;

        try {
            setUpdatingCell(
                key
            );

            setActionError(
                ""
            );

            await dashboardApi
                .updateRequisitionDelivery(
                    item.id,
                    deliveredVal
                );

            /*
             * Reload the row so completed delivery
             * becomes a status value instead of dropdown.
             */
            setListRefreshKey(
                (
                    current
                ) =>
                    current +
                    1
            );
        } catch (
        reason:
            unknown
        ) {
            setActionError(
                reason instanceof
                    Error
                    ? reason.message
                    : "Unable to update delivery status"
            );
        } finally {
            setUpdatingCell(
                ""
            );
        }
    }

    /* ==================================================
       UI
    ================================================== */

    return (
        <>
            <div className="space-y-3 p-4">
                {/* ======================================
                    HEADER
                ====================================== */}

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-[10px]"
                            onClick={() =>
                                router.push(
                                    "/dashboard"
                                )
                            }
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />

                            Dashboard
                        </Button>

                        <div>
                            <h1 className="text-sm font-semibold text-foreground">
                                {
                                    config.title
                                }
                            </h1>

                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                                {
                                    config.description
                                }
                            </p>
                        </div>
                    </div>

                    <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                        <span className="text-[9px] font-semibold text-primary">
                            {dashboardLoading &&
                                view ===
                                "summary"
                                ? "—"
                                : currentRecordCount.toLocaleString()}{" "}
                            {
                                currentRecordLabel
                            }
                        </span>
                    </div>
                </div>

                {/* ======================================
                    VIEW BUTTONS
                ====================================== */}

                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-2 shadow-sm">
                    {VIEW_OPTIONS.map(
                        (
                            option
                        ) => {
                            const active =
                                view ===
                                option.view;

                            let count:
                                number |
                                null =
                                null;

                            if (
                                option.view ===
                                "pending"
                            ) {
                                count =
                                    dashboardSummary
                                        .approval_pending;
                            }

                            if (
                                option.view ===
                                "rejected"
                            ) {
                                count =
                                    dashboardSummary
                                        .rejected;
                            }

                            if (
                                option.view ===
                                "tt_reason"
                            ) {
                                count =
                                    dashboardSummary
                                        .total_active;
                            }

                            return (
                                <button
                                    key={
                                        option.view
                                    }
                                    type="button"
                                    onClick={() =>
                                        changeView(
                                            option.view
                                        )
                                    }
                                    className={`
                                        rounded-md
                                        border
                                        px-3
                                        py-1.5
                                        text-[9px]
                                        font-medium
                                        transition-all

                                        ${active
                                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }
                                    `}
                                >
                                    {
                                        option.label
                                    }

                                    {!dashboardLoading &&
                                        count !==
                                        null && (
                                            <span
                                                className={`
                                                ml-1.5
                                                rounded-full
                                                px-1.5
                                                py-0.5
                                                text-[7px]

                                                ${active
                                                        ? "bg-white/20"
                                                        : "bg-muted"
                                                    }
                                            `}
                                            >
                                                {
                                                    count
                                                }
                                            </span>
                                        )}
                                </button>
                            );
                        }
                    )}
                </div>

                {/* ======================================
                    SUMMARY VIEW
                ====================================== */}

                {view ===
                    "summary" && (
                        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-[11px] font-semibold text-foreground">
                                        IT Accessories Requisition Pending List
                                    </h2>

                                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                                        Select a category to view pending requisitions
                                    </p>
                                </div>

                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-900/60 dark:bg-amber-950/20">
                                    <p className="text-[7px] font-medium uppercase text-amber-700 dark:text-amber-400">
                                        Total Pending
                                    </p>

                                    <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                                        {dashboardSummary
                                            .approval_pending
                                            .toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-3 flex max-w-sm items-center gap-2 rounded-lg border border-border px-2.5">
                                <Search className="h-3.5 w-3.5 text-muted-foreground" />

                                <input
                                    type="text"
                                    value={
                                        categorySearch
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setCategorySearch(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Search category..."
                                    className="h-8 w-full bg-transparent text-[9px] outline-none"
                                />

                                {categorySearch && (
                                    <button
                                        type="button"
                                        aria-label="Clear category search"
                                        onClick={() =>
                                            setCategorySearch(
                                                ""
                                            )
                                        }
                                    >
                                        <X className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                )}
                            </div>

                            {categoryLoading ? (
                                <div className="flex min-h-[220px] items-center justify-center text-[9px] text-muted-foreground">
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                                    Loading...
                                </div>
                            ) : categoryError ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[9px] text-red-600">
                                    {
                                        categoryError
                                    }
                                </div>
                            ) : filteredCategoryRows.length ===
                                0 ? (
                                <div className="flex min-h-[200px] items-center justify-center text-[9px] text-muted-foreground">
                                    No requisition categories found.
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-border">
                                    <table className="w-full text-[9px]">
                                        <thead className="bg-cyan-50/70 dark:bg-cyan-950/10">
                                            <tr>
                                                <th className="px-3 py-2 text-center text-[8px]">
                                                    SL
                                                </th>

                                                <th className="px-3 py-2 text-left text-[8px]">
                                                    Device Category
                                                </th>

                                                <th className="px-3 py-2 text-center text-[8px]">
                                                    Pending Requisition
                                                </th>

                                                <th className="px-3 py-2 text-center text-[8px]">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredCategoryRows.map(
                                                (
                                                    item,
                                                    index
                                                ) => (
                                                    <tr
                                                        key={
                                                            item.category
                                                        }
                                                        className="border-t border-border hover:bg-muted/25"
                                                    >
                                                        <td className="px-3 py-2 text-center">
                                                            {index +
                                                                1}
                                                        </td>

                                                        <td className="px-3 py-2">
                                                            {
                                                                item.category
                                                            }
                                                        </td>

                                                        <td className="px-3 py-2 text-center font-semibold text-amber-600">
                                                            {
                                                                item.pending_count
                                                            }
                                                        </td>

                                                        <td className="px-3 py-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openPendingCategory(
                                                                        item.category
                                                                    )
                                                                }
                                                                className="text-primary hover:underline"
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>

                                        <tfoot>
                                            <tr className="border-t border-border bg-muted/30">
                                                <td
                                                    colSpan={
                                                        2
                                                    }
                                                    className="px-3 py-2 text-right font-semibold"
                                                >
                                                    Total
                                                </td>

                                                <td className="px-3 py-2 text-center font-bold text-amber-600">
                                                    {
                                                        totalPendingFromCategories
                                                    }
                                                </td>

                                                <td />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                {/* ======================================
                    LIST VIEWS
                ====================================== */}

                {view !==
                    "summary" && (
                        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                            {/* ==============================
                            TOOLBAR
                        ============================== */}

                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                {/* Search */}

                                <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-primary/30 px-2.5">
                                    <Search className="h-3.5 w-3.5 text-primary" />

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
                                        placeholder="Global search..."
                                        className="h-8 w-full bg-transparent text-[9px] outline-none"
                                    />

                                    {search && (
                                        <button
                                            type="button"
                                            aria-label="Clear search"
                                            onClick={() =>
                                                setSearch(
                                                    ""
                                                )
                                            }
                                        >
                                            <X className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>

                                {/* Filter */}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setFiltersOpen(
                                            (
                                                current
                                            ) =>
                                                !current
                                        );

                                        setColumnsOpen(
                                            false
                                        );
                                    }}
                                    className={`
                                    inline-flex
                                    h-8
                                    items-center
                                    gap-1
                                    rounded-lg
                                    border
                                    px-2.5
                                    text-[9px]

                                    ${filtersOpen
                                            ? "border-primary text-primary"
                                            : "border-border"
                                        }
                                `}
                                >
                                    <Filter className="h-3.5 w-3.5" />

                                    Filter
                                </button>

                                {/* Columns */}

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setColumnsOpen(
                                                (
                                                    current
                                                ) =>
                                                    !current
                                            );

                                            setFiltersOpen(
                                                false
                                            );
                                        }}
                                        className={`
                                        inline-flex
                                        h-8
                                        items-center
                                        gap-1
                                        rounded-lg
                                        border
                                        px-2.5
                                        text-[9px]

                                        ${columnsOpen
                                                ? "border-primary text-primary"
                                                : "border-border"
                                            }
                                    `}
                                    >
                                        <Columns3 className="h-3.5 w-3.5" />

                                        Columns
                                    </button>

                                    {columnsOpen && (
                                        <div className="absolute right-0 top-10 z-50 w-[210px] rounded-xl border border-border bg-popover p-2 shadow-xl">
                                            <p className="px-2 py-1 text-[9px] font-semibold">
                                                Show / Hide Columns
                                            </p>

                                            {(
                                                [
                                                    [
                                                        "raisedBy",
                                                        "Raised By",
                                                    ],

                                                    [
                                                        "userDetails",
                                                        "User Details",
                                                    ],

                                                    [
                                                        "reason",
                                                        "Reason",
                                                    ],
                                                ] as const
                                            ).map(
                                                ([
                                                    key,
                                                    label,
                                                ]) => (
                                                    <button
                                                        key={
                                                            key
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            toggleColumn(
                                                                key
                                                            )
                                                        }
                                                        className="flex w-full items-center justify-between rounded px-2 py-2 text-[9px] hover:bg-muted"
                                                    >
                                                        {
                                                            label
                                                        }

                                                        <span
                                                            className={`
                                                            flex
                                                            h-4
                                                            w-4
                                                            items-center
                                                            justify-center
                                                            rounded
                                                            border

                                                            ${visibleColumns[
                                                                    key
                                                                ]
                                                                    ? "border-primary bg-primary text-white"
                                                                    : "border-border"
                                                                }
                                                        `}
                                                        >
                                                            {visibleColumns[
                                                                key
                                                            ] && (
                                                                    <Check className="h-3 w-3" />
                                                                )}
                                                        </span>
                                                    </button>
                                                )
                                            )}

                                            <button
                                                type="button"
                                                onClick={
                                                    resetColumns
                                                }
                                                className="mt-1 w-full border-t border-border px-2 py-2 text-left text-[8px] text-muted-foreground hover:text-foreground"
                                            >
                                                Reset Default
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Clear */}

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={
                                            clearFilters
                                        }
                                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-[9px]"
                                    >
                                        <RefreshCcw className="h-3 w-3" />

                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* ==============================
                            ACTION ERROR
                        ============================== */}

                            {actionError && (
                                <div className="mb-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700">
                                    <span>
                                        {
                                            actionError
                                        }
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActionError(
                                                ""
                                            )
                                        }
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}

                            {/* ==============================
                            DATE FILTER
                        ============================== */}

                            {filtersOpen && (
                                <div className="mb-3 grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2">
                                    <label>
                                        <span className="text-[8px] font-medium text-muted-foreground">
                                            From Date
                                        </span>

                                        <input
                                            type="date"
                                            value={
                                                dateFilters
                                                    .fromDate
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setDateFilters(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,

                                                        fromDate:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            className="mt-1 h-8 w-full rounded border border-border bg-background px-2 text-[9px]"
                                        />
                                    </label>

                                    <label>
                                        <span className="text-[8px] font-medium text-muted-foreground">
                                            To Date
                                        </span>

                                        <input
                                            type="date"
                                            value={
                                                dateFilters
                                                    .toDate
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setDateFilters(
                                                    (
                                                        current
                                                    ) => ({
                                                        ...current,

                                                        toDate:
                                                            event
                                                                .target
                                                                .value,
                                                    })
                                                )
                                            }
                                            className="mt-1 h-8 w-full rounded border border-border bg-background px-2 text-[9px]"
                                        />
                                    </label>
                                </div>
                            )}

                            {/* ==============================
                            TABLE
                        ============================== */}

                            {loading ? (
                                <div className="flex min-h-[260px] items-center justify-center text-[9px] text-muted-foreground">
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                                    Loading records...
                                </div>
                            ) : error ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[9px] text-red-600">
                                    {
                                        error
                                    }
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto rounded-lg border border-border">
                                        <table
                                            className="w-full border-collapse text-[9px]"
                                            style={{
                                                minWidth:
                                                    visibleColumns
                                                        .reason
                                                        ? "1900px"
                                                        : visibleColumns
                                                            .raisedBy ||
                                                            visibleColumns
                                                                .userDetails
                                                            ? "1700px"
                                                            : "1450px",
                                            }}
                                        >
                                            {/* ==================
                                            HEADER
                                        ================== */}

                                            <thead>
                                                <tr className="border-b border-border bg-cyan-50/70 dark:bg-cyan-950/10">
                                                    <th className="px-2 py-2 text-center text-[8px]">
                                                        SL
                                                    </th>

                                                    <th className="px-2 py-2 text-left text-[8px]">
                                                        TT No
                                                    </th>

                                                    <th className="px-2 py-2 text-left text-[8px]">
                                                        Submitted Date
                                                    </th>

                                                    {visibleColumns
                                                        .raisedBy && (
                                                            <th className="px-2 py-2 text-left text-[8px]">
                                                                Raised By
                                                            </th>
                                                        )}

                                                    <th className="px-2 py-2 text-left text-[8px]">
                                                        Category
                                                    </th>

                                                    <th className="px-2 py-2 text-left text-[8px]">
                                                        Device SL
                                                    </th>

                                                    {visibleColumns
                                                        .userDetails && (
                                                            <th className="px-2 py-2 text-left text-[8px]">
                                                                User Details
                                                            </th>
                                                        )}

                                                    {visibleColumns
                                                        .reason && (
                                                            <th className="px-2 py-2 text-left text-[8px]">
                                                                Reason
                                                            </th>
                                                        )}

                                                    <th className="px-2 py-2 text-left text-[8px]">
                                                        Approval Status
                                                    </th>

                                                    <th className="px-2 py-2 text-left text-[8px]">
                                                        Approved By
                                                    </th>

                                                    <th className="px-2 py-2 text-left text-[8px]">
                                                        Approved Date
                                                    </th>

                                                    <th className="px-2 py-2 text-left text-[8px]">
                                                        Delivered Status
                                                    </th>

                                                    <th className="px-2 py-2 text-left text-[8px]">
                                                        Delivered By
                                                    </th>

                                                    <th className="px-2 py-2 text-left text-[8px]">
                                                        Delivered Date
                                                    </th>

                                                    <th className="px-2 py-2 text-center text-[8px]">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>

                                            {/* ==================
                                            BODY
                                        ================== */}

                                            <tbody>
                                                {rows.length ===
                                                    0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={
                                                                tableColumnCount
                                                            }
                                                            className="px-4 py-12 text-center text-[9px] text-muted-foreground"
                                                        >
                                                            {
                                                                config.emptyTitle
                                                            }
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    rows.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    item.id
                                                                }
                                                                className="border-b border-border last:border-b-0 hover:bg-muted/25"
                                                            >
                                                                {/* SL */}

                                                                <td className="px-2 py-2 text-center">
                                                                    {(page -
                                                                        1) *
                                                                        PAGE_SIZE +
                                                                        index +
                                                                        1}
                                                                </td>

                                                                {/* TT No */}

                                                                <td className="px-2 py-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setSelectedItem(
                                                                                item
                                                                            )
                                                                        }
                                                                        className="text-[9px] font-semibold text-violet-600 hover:underline"
                                                                    >
                                                                        {
                                                                            item.tt_no
                                                                        }
                                                                    </button>
                                                                </td>

                                                                {/* Submitted */}

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    {formatDateTime(
                                                                        item.created_at
                                                                    )}
                                                                </td>

                                                                {/* Raised By */}

                                                                {visibleColumns
                                                                    .raisedBy && (
                                                                        <td className="px-2 py-2">
                                                                            <p>
                                                                                {item.created_by ||
                                                                                    "—"}
                                                                            </p>

                                                                            <p className="text-[8px] text-muted-foreground">
                                                                                {
                                                                                    item.created_by_name
                                                                                }
                                                                            </p>
                                                                        </td>
                                                                    )}

                                                                {/* Category */}

                                                                <td className="px-2 py-2">
                                                                    {
                                                                        item.category
                                                                    }
                                                                </td>

                                                                {/* Device SL */}

                                                                <td className="px-2 py-2 font-mono text-[8px]">
                                                                    {item.device_sl_no ||
                                                                        "—"}
                                                                </td>

                                                                {/* User Details */}

                                                                {visibleColumns
                                                                    .userDetails && (
                                                                        <td className="px-2 py-2">
                                                                            <p>
                                                                                {item.employee_id ||
                                                                                    "—"}
                                                                            </p>

                                                                            <p className="text-[8px] text-muted-foreground">
                                                                                {
                                                                                    item.employee_name
                                                                                }
                                                                            </p>
                                                                        </td>
                                                                    )}

                                                                {/* Reason */}

                                                                {visibleColumns
                                                                    .reason && (
                                                                        <td className="max-w-[260px] px-2 py-2">
                                                                            <p
                                                                                className="line-clamp-2"
                                                                                title={
                                                                                    item.reason_details
                                                                                }
                                                                            >
                                                                                {item.reason_details ||
                                                                                    "—"}
                                                                            </p>
                                                                        </td>
                                                                    )}

                                                                {/* ==================================
                                                                APPROVAL STATUS

                                                                IMPORTANT:
                                                                This is based on ROW STATUS,
                                                                not current page.
                                                            ================================== */}

                                                                <td className="px-2 py-2">
                                                                    <ApprovalStatusCell
                                                                        item={
                                                                            item
                                                                        }
                                                                        updatingCell={
                                                                            updatingCell
                                                                        }
                                                                        onUpdate={(
                                                                            currentItem,
                                                                            value
                                                                        ) =>
                                                                            void updateApproval(
                                                                                currentItem,
                                                                                value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>

                                                                {/* Approved By */}

                                                                <td className="px-2 py-2">
                                                                    <p>
                                                                        {item.approved_by ||
                                                                            "—"}
                                                                    </p>

                                                                    <p className="text-[8px] text-muted-foreground">
                                                                        {
                                                                            item.approved_by_name
                                                                        }
                                                                    </p>
                                                                </td>

                                                                {/* Approved Date */}

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    {formatDateTime(
                                                                        item.approved_date
                                                                    )}
                                                                </td>

                                                                {/* ==================================
                                                                DELIVERY STATUS

                                                                IMPORTANT:
                                                                Becomes dropdown only AFTER
                                                                approval has completed.
                                                            ================================== */}

                                                                <td className="px-2 py-2">
                                                                    <DeliveryStatusCell
                                                                        item={
                                                                            item
                                                                        }
                                                                        updatingCell={
                                                                            updatingCell
                                                                        }
                                                                        onUpdate={(
                                                                            currentItem,
                                                                            value
                                                                        ) =>
                                                                            void updateDelivery(
                                                                                currentItem,
                                                                                value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>

                                                                {/* Delivered By */}

                                                                <td className="px-2 py-2">
                                                                    <p>
                                                                        {item.delivered_by ||
                                                                            "—"}
                                                                    </p>

                                                                    <p className="text-[8px] text-muted-foreground">
                                                                        {
                                                                            item.delivered_by_name
                                                                        }
                                                                    </p>
                                                                </td>

                                                                {/* Delivered Date */}

                                                                <td className="whitespace-nowrap px-2 py-2">
                                                                    {formatDateTime(
                                                                        item.delivered_date
                                                                    )}
                                                                </td>

                                                                {/* Action */}

                                                                <td className="px-2 py-2 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setSelectedItem(
                                                                                item
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                                    >
                                                                        <Eye className="h-2.5 w-2.5" />

                                                                        View
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* ==============================
                                    PAGINATION
                                ============================== */}

                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-[9px] text-muted-foreground">
                                            Showing{" "}
                                            {total >
                                                0
                                                ? (page -
                                                    1) *
                                                PAGE_SIZE +
                                                1
                                                : 0}{" "}
                                            to{" "}
                                            {Math.min(
                                                page *
                                                PAGE_SIZE,
                                                total
                                            )}{" "}
                                            of{" "}
                                            {
                                                total
                                            }{" "}
                                            records
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-muted-foreground">
                                                Page{" "}
                                                {
                                                    page
                                                }{" "}
                                                of{" "}
                                                {
                                                    totalPages
                                                }
                                            </span>

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
                                                            Math.max(
                                                                1,
                                                                current -
                                                                1
                                                            )
                                                    )
                                                }
                                                className="inline-flex h-7 items-center rounded border border-border px-2 text-[9px] disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <ChevronLeft className="h-3 w-3" />

                                                Previous
                                            </button>

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
                                                            Math.min(
                                                                totalPages,
                                                                current +
                                                                1
                                                            )
                                                    )
                                                }
                                                className="inline-flex h-7 items-center rounded border border-border px-2 text-[9px] disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Next

                                                <ChevronRight className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
            </div>

            {/* ======================================
                DETAILS MODAL
            ====================================== */}

            <RequisitionDetailsModal
                item={
                    selectedItem
                }
                onClose={() =>
                    setSelectedItem(
                        null
                    )
                }
            />
        </>
    );
}

/* ======================================================
   PAGE
====================================================== */

export default function RequisitionPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[320px] items-center justify-center gap-2 text-[9px] text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" />

                    Loading Requisition page...
                </div>
            }
        >
            <RequisitionPageContent />
        </Suspense>
    );
}