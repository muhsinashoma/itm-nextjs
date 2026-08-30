// frontend/app/dashboard/trouble-tickets/page.tsx

"use client";

import {
    Suspense,
    useEffect,
    useState,
} from "react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import {
    AlertCircle,
    ArrowLeft,
    LoaderCircle,
    X,
} from "lucide-react";


import {
    DataTable,
} from "@/components/data-table";


import {
    columns,
    toSection,
} from "@/components/tt-columns";


import {
    Button,
} from "@/components/ui/button";


import type {
    Section,
} from "@/types/tt";


import {
    dashboardApi,

    type TroubleTicketITPersonnel,

    type TroubleTicketScope,

    type TroubleTicketStatus,

    type TroubleTicketDetail,

} from "@/lib/api";



/* ======================================================
   VALID SCOPES
====================================================== */

const VALID_SCOPES:
    TroubleTicketScope[] =
    [
        "all",
        "opened_today",
        "closed_today",
        "running",
        "procurement",
    ];



/* ======================================================
   SCOPE CONFIG
====================================================== */


const SCOPE_CONFIG:
    Record<
        TroubleTicketScope,
        {
            title: string;
            description: string;
            emptyTitle: string;
            emptyDescription: string;
        }
    > =
{

    all: {
        title: "All Trouble Tickets",
        description: "Complete Trouble Ticket records",
        emptyTitle: "No Trouble Tickets found",
        emptyDescription:
            "Trouble Ticket records will appear here.",
    },


    opened_today: {
        title: "TT Opened Today",
        description: "Trouble Tickets registered today",
        emptyTitle: "No Trouble Tickets opened today",
        emptyDescription:
            "New tickets will appear here.",
    },


    closed_today: {
        title: "TT Closed Today",
        description: "Trouble Tickets resolved today",
        emptyTitle: "No Trouble Tickets closed today",
        emptyDescription:
            "Closed tickets will appear here.",
    },


    running: {
        title: "Running Trouble Tickets",
        description: "Currently active Trouble Tickets",
        emptyTitle: "No Running Trouble Tickets",
        emptyDescription:
            "Active tickets will appear here.",
    },


    procurement: {
        title: "Procurement Trouble Tickets",
        description:
            "Tickets requiring procurement",
        emptyTitle:
            "No Procurement Trouble Tickets",
        emptyDescription:
            "Procurement tickets will appear here.",
    },

};




/* ======================================================
   SCOPE BUTTONS
====================================================== */


const SCOPE_OPTIONS =
    [
        {
            scope: "all" as TroubleTicketScope,
            label: "All",
        },

        {
            scope: "opened_today" as TroubleTicketScope,
            label: "Opened Today",
        },

        {
            scope: "closed_today" as TroubleTicketScope,
            label: "Closed Today",
        },

        {
            scope: "running" as TroubleTicketScope,
            label: "Running TT",
        },

        {
            scope: "procurement" as TroubleTicketScope,
            label: "Procurement TT",
        },

    ];



/* ======================================================
   FILTER TYPE
====================================================== */


type TroubleTicketFilters = {

    fromDate: string;

    toDate: string;

    employeeId: string;

    status: string;

    itPersonal: string;

};




/* ======================================================
   PAGE CONTENT
====================================================== */


function TroubleTicketListContent() {


    const router =
        useRouter();


    const searchParams =
        useSearchParams();



    const rawScope =
        searchParams.get(
            "scope"
        )
        ??
        "all";



    const scope:
        TroubleTicketScope =
        VALID_SCOPES.includes(
            rawScope as TroubleTicketScope
        )
            ?
            rawScope as TroubleTicketScope
            :
            "all";



    const config =
        SCOPE_CONFIG[scope];



    const [
        rows,
        setRows
    ] =
        useState<Section[]>([]);



    const [
        total,
        setTotal
    ] =
        useState(0);



    const [
        loading,
        setLoading
    ] =
        useState(true);



    const [
        error,
        setError
    ] =
        useState("");



    /*
        TT DETAILS
    */


    const [
        selectedTT,
        setSelectedTT
    ] =
        useState<
            TroubleTicketDetail | null
        >(null);



    const [
        showTTModal,
        setShowTTModal
    ] =
        useState(false);



    const openTTDetails =
        async (
            id: number
        ) => {


            try {


                const response =
                    await dashboardApi
                        .troubleTicketDetails(id);



                setSelectedTT(
                    response.data
                );



                setShowTTModal(
                    true
                );


            }
            catch (error) {

                console.error(
                    "TT details error",
                    error
                );

            }

        };



    const [
        serverFilters,
        setServerFilters
    ] =
        useState<TroubleTicketFilters>(
            {

                fromDate: "",
                toDate: "",
                employeeId: "",
                status: "",
                itPersonal: "",

            });



    const [
        itPersonnel,
        setItPersonnel
    ] =
        useState<
            TroubleTicketITPersonnel[]
        >([]);



    const [
        itPersonnelLoading,
        setItPersonnelLoading
    ] =
        useState(true);

    /* ==================================================
       LOAD ACTIVE IT PERSONNEL
    ================================================== */

    useEffect(
        () => {
            let mounted =
                true;

            async function loadITPersonnel() {
                try {
                    setItPersonnelLoading(
                        true
                    );

                    const response =
                        await dashboardApi
                            .troubleTicketITPersonnel();

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    const people =
                        response.data ??
                        [];

                    /*
                     * Remove invalid or duplicate
                     * employee IDs before passing
                     * them to the dropdown.
                     */
                    const uniquePeople =
                        Array.from(
                            new Map(
                                people
                                    .filter(
                                        (
                                            person
                                        ) =>
                                            Boolean(
                                                person.employee_id
                                                    ?.trim()
                                            )
                                    )
                                    .map(
                                        (
                                            person
                                        ) => [
                                                person.employee_id
                                                    .trim(),

                                                {
                                                    employee_id:
                                                        person.employee_id
                                                            .trim(),

                                                    employee_name:
                                                        person.employee_name
                                                            ?.trim() ||
                                                        person.employee_id
                                                            .trim(),
                                                },
                                            ]
                                    )
                            ).values()
                        );

                    setItPersonnel(
                        uniquePeople
                    );
                } catch (
                reason:
                    unknown
                ) {
                    console.error(
                        "Unable to load IT Personnel:",
                        reason
                    );

                    if (
                        mounted
                    ) {
                        setItPersonnel(
                            []
                        );
                    }
                } finally {
                    if (
                        mounted
                    ) {
                        setItPersonnelLoading(
                            false
                        );
                    }
                }
            }

            void loadITPersonnel();

            return () => {
                mounted =
                    false;
            };
        },
        []
    );

    /* ==================================================
       LOAD TROUBLE TICKETS
    ================================================== */

    useEffect(
        () => {
            let mounted =
                true;

            async function loadTroubleTickets() {
                try {
                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );

                    /*
                     * Status dropdown only sends:
                     *
                     * Open
                     * Closed
                     * empty = all
                     */
                    let status:
                        TroubleTicketStatus |
                        "all" =
                        "all";

                    if (
                        serverFilters.status ===
                        "Open"
                    ) {
                        status =
                            "Open";
                    }

                    if (
                        serverFilters.status ===
                        "Closed"
                    ) {
                        status =
                            "Closed";
                    }

                    /*
                     * All filters are submitted together.
                     *
                     * PostgreSQL therefore evaluates:
                     *
                     * scope
                     * AND date
                     * AND employee
                     * AND IT personnel
                     * AND status
                     */
                    const response =
                        await dashboardApi
                            .troubleTickets({
                                scope,

                                page:
                                    1,

                                limit:
                                    1000,

                                status,

                                from_date:
                                    serverFilters.fromDate ||
                                    undefined,

                                to_date:
                                    serverFilters.toDate ||
                                    undefined,

                                employee_id:
                                    serverFilters.employeeId ||
                                    undefined,

                                it_personal:
                                    serverFilters.itPersonal ||
                                    undefined,
                            });

                    if (
                        !mounted
                    ) {
                        return;
                    }

                    const items =
                        response.data ??
                        [];

                    setRows(
                        items.map(
                            toSection
                        )
                    );

                    setTotal(
                        Number(
                            response.total ??
                            items.length
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
                            : "Unable to load Trouble Ticket records"
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

            void loadTroubleTickets();

            return () => {
                mounted =
                    false;
            };
        },
        [
            scope,

            serverFilters.fromDate,
            serverFilters.toDate,

            serverFilters.employeeId,

            serverFilters.status,

            serverFilters.itPersonal,
        ]
    );

    /* ==================================================
       IT PERSONNEL DROPDOWN OPTIONS
    ================================================== */

    const itPersonalOptions =
        itPersonnel.map(
            (
                person
            ) => ({
                /*
                 * Very important:
                 *
                 * Backend filters migrated
                 * forward_logical_person using
                 * employee ID.
                 */
                value:
                    person.employee_id,

                label:
                    `${person.employee_name} (${person.employee_id})`,
            })
        );

    /* ==================================================
       RENDER
    ================================================== */

    return (
        <div className="space-y-4 p-4">
            {/* ==========================================
                PAGE HEADER
            ========================================== */}

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
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
                        <h1 className="text-base font-semibold text-foreground">
                            {
                                config.title
                            }
                        </h1>

                        <p className="mt-1 text-xs text-muted-foreground">
                            {
                                config.description
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {itPersonnelLoading && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <LoaderCircle className="h-3 w-3 animate-spin" />

                            Loading IT Personnel...
                        </div>
                    )}

                    <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
                        <span className="text-xs font-semibold text-primary">
                            {total.toLocaleString()}{" "}

                            {total ===
                                1
                                ? "Record"
                                : "Records"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ==========================================
                SCOPE NAVIGATION
            ========================================== */}

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
                {SCOPE_OPTIONS.map(
                    (
                        option
                    ) => (
                        <button
                            key={
                                option.scope
                            }
                            type="button"
                            onClick={() =>
                                router.push(
                                    `/dashboard/trouble-tickets?scope=${option.scope}`
                                )
                            }
                            className={`
                                rounded-lg
                                border
                                px-3
                                py-2
                                text-xs
                                font-medium
                                transition-all

                                ${scope ===
                                    option.scope
                                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                }
                            `}
                        >
                            {
                                option.label
                            }
                        </button>
                    )
                )}
            </div>

            {/* ==========================================
                TABLE CONTAINER
            ========================================== */}

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                {loading ? (
                    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-muted-foreground">
                        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />

                        <p className="text-xs">
                            Loading{" "}
                            {
                                config.title
                            }
                            ...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                        <AlertCircle className="h-7 w-7 text-red-600" />

                        <div>
                            <p className="text-sm font-semibold text-red-700">
                                Unable to load Trouble Tickets
                            </p>

                            <p className="mt-1 text-xs text-red-600">
                                {
                                    error
                                }
                            </p>
                        </div>
                    </div>
                ) : (
                    /*
                     * Important:
                     *
                     * DataTable remains visible even
                     * when rows.length === 0.
                     *
                     * This lets the user Reset/Clear
                     * filters after a combination returns
                     * zero records.
                     */
                    <DataTable
                        key={
                            scope
                        }

                        columns={
                            columns
                        }

                        data={
                            rows
                        }

                        dateColumn="created_at"

                        compact

                        serverSideDateFilter

                        itPersonalOptions={
                            itPersonalOptions
                        }

                        onApplyServerFilters={(
                            filters
                        ) => {
                            setServerFilters({
                                fromDate:
                                    filters.fromDate,

                                toDate:
                                    filters.toDate,

                                employeeId:
                                    filters.employeeId,

                                status:
                                    filters.status,

                                itPersonal:
                                    filters.itPersonal,
                            });
                        }}
                    />
                )}
            </div>
        </div>
    );
}

/* ======================================================
   PAGE
====================================================== */

export default function TroubleTicketListPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[320px] items-center justify-center text-xs text-muted-foreground">
                    Loading Trouble Ticket page...
                </div>
            }
        >
            <TroubleTicketListContent />
        </Suspense>
    );
}