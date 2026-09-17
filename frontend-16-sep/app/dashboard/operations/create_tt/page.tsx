
// frontend/app/dashboard/operations/create_tt/page.tsx


"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
    type ReactNode,
    type RefObject,
} from "react";

import { useRouter } from "next/navigation";

import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Check,
    ChevronDown,
    FileText,
    Loader2,
    Mail,
    Paperclip,
    Phone,
    Plus,
    Search,
    Trash2,
    User,
    X,
} from "lucide-react";

import {
    api,
    ticketApi,
    type ApiOk,
    type FaultType,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_TICKETS = 10;

const MAX_DESCRIPTION_LENGTH = 5000;

const MIN_DESCRIPTION_LENGTH = 5;

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

/*
 * Success UX timing.
 *
 * Toast appears immediately after successful creation.
 * It remains visible for about 2 seconds.
 * Then it fades and the page redirects.
 */
const SUCCESS_TOAST_VISIBLE_MS = 2000;

const SUCCESS_REDIRECT_MS = 2500;

/* ============================================================
   TYPES
============================================================ */

interface TicketDraft {
    clientId: string;
    faultType: FaultType | null;
    description: string;
    attachment: File | null;
}

interface CreatedTicket {
    index: number;
    ttNo: string;
}

interface FailedTicket {
    index: number;
    error: string;
}

interface RequesterEmployee {
    employee_id: string;
    employee_name: string;
    designation: string;
    department: string;
    work_field: string;
    sub_function: string;
    active: string;
    personal_cell: string;
    official_cell: string;
    email: string;
    official_email: string;
}

interface RequesterContext {
    employee: RequesterEmployee;
    user_type: number;
    role_code: string;
    can_raise_for_others: boolean;
}

type CreateTTSource =
    | "user"
    | "dashboard";

/* ============================================================
   HELPERS
============================================================ */

function createClientId(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}

function createEmptyTicket(): TicketDraft {
    return {
        clientId: createClientId(),
        faultType: null,
        description: "",
        attachment: null,
    };
}

function valueOrDash(
    value: string | null | undefined
): string {
    return value?.trim() || "-";
}

function readApiData<T>(
    response: unknown
): T | undefined {
    if (
        response &&
        typeof response === "object" &&
        "data" in response
    ) {
        const first =
            (
                response as {
                    data?: unknown;
                }
            ).data;

        if (
            first &&
            typeof first === "object" &&
            "data" in first
        ) {
            return (
                first as {
                    data?: T;
                }
            ).data;
        }

        return first as T;
    }

    return response as T;
}

function initials(name: string): string {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return "IT";
    }

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/* ============================================================
   PAGE
============================================================ */

export default function CreateTTPage() {
    const router = useRouter();

    /* --------------------------------------------------------
       EMPLOYEE
    -------------------------------------------------------- */

    const [employee, setEmployee] =
        useState<RequesterEmployee | null>(null);

    const [actor, setActor] =
        useState<RequesterEmployee | null>(null);

    const [canRaiseForOthers, setCanRaiseForOthers] =
        useState(false);

    const [requesterRoleCode, setRequesterRoleCode] =
        useState("");

    const [requesterUserType, setRequesterUserType] =
        useState<number | null>(null);

    /*
     * Preserve the existing role-based behavior as a fallback for
     * direct/bookmarked access where no source query exists.
     */
    const roleReturnHref =
        requesterUserType !== null &&
            requesterUserType <= 2
            ? "/dashboard"
            : "/dashboard/user";

    const readCreateTTSource = ():
        CreateTTSource | null => {
        if (
            typeof window ===
            "undefined"
        ) {
            return null;
        }

        const source =
            new URLSearchParams(
                window.location.search
            ).get("source");

        return source === "user" ||
            source === "dashboard"
            ? source
            : null;
    };

    const getReturnHref = () => {
        const source =
            readCreateTTSource();

        if (source === "user") {
            return "/dashboard/user";
        }

        if (
            source ===
            "dashboard"
        ) {
            return "/dashboard";
        }

        return roleReturnHref;
    };

    const getSuccessHref = () => {
        const source =
            readCreateTTSource();

        if (source === "user") {
            return "/dashboard/user";
        }

        if (
            source ===
            "dashboard"
        ) {
            return "/dashboard#trouble-ticket-table";
        }

        return roleReturnHref ===
            "/dashboard"
            ? "/dashboard#trouble-ticket-table"
            : "/dashboard/user";
    };

    const [employeeLoading, setEmployeeLoading] =
        useState(true);

    const [employeeError, setEmployeeError] =
        useState("");

    const [requesterOpen, setRequesterOpen] =
        useState(false);

    const [requesterSearch, setRequesterSearch] =
        useState("");

    const [requesterResults, setRequesterResults] =
        useState<RequesterEmployee[]>([]);

    const [requesterSearchLoading, setRequesterSearchLoading] =
        useState(false);

    const [requesterSearchError, setRequesterSearchError] =
        useState("");

    const requesterDropdownRef =
        useRef<HTMLDivElement | null>(null);

    /* --------------------------------------------------------
       FAULT TYPES
    -------------------------------------------------------- */

    const [faultTypes, setFaultTypes] =
        useState<FaultType[]>([]);

    const [faultTypesLoading, setFaultTypesLoading] =
        useState(true);

    const [faultTypesError, setFaultTypesError] =
        useState("");

    /* --------------------------------------------------------
       TICKETS
    -------------------------------------------------------- */

    const [tickets, setTickets] =
        useState<TicketDraft[]>([
            createEmptyTicket(),
        ]);

    /* --------------------------------------------------------
       FAULT DROPDOWN
    -------------------------------------------------------- */

    const [openFaultId, setOpenFaultId] =
        useState<string | null>(null);

    const [faultSearch, setFaultSearch] =
        useState("");

    const dropdownRef =
        useRef<HTMLDivElement | null>(null);

    /* --------------------------------------------------------
       SUBMIT
    -------------------------------------------------------- */

    const [submitting, setSubmitting] =
        useState(false);

    const [submitError, setSubmitError] =
        useState("");

    const [submitSuccess, setSubmitSuccess] =
        useState("");

    const [createdTickets, setCreatedTickets] =
        useState<CreatedTicket[]>([]);

    const [failedTickets, setFailedTickets] =
        useState<FailedTicket[]>([]);

    /* --------------------------------------------------------
       SUCCESS TOAST
    -------------------------------------------------------- */

    const [successToastVisible, setSuccessToastVisible] =
        useState(false);

    const [successToastFading, setSuccessToastFading] =
        useState(false);

    const [successToastMessage, setSuccessToastMessage] =
        useState("");

    /* ========================================================
       LOAD EMPLOYEE
    ======================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadEmployee() {
            try {
                setEmployeeLoading(true);
                setEmployeeError("");

                const response =
                    await api.get<
                        ApiOk<RequesterContext>
                    >(
                        "/tickets/requester-context"
                    );

                if (!mounted) {
                    return;
                }

                const context =
                    readApiData<RequesterContext>(
                        response
                    );

                if (!context?.employee) {
                    throw new Error(
                        "Authenticated requester information was not found."
                    );
                }

                setActor(
                    context.employee
                );

                setEmployee(
                    context.employee
                );

                setCanRaiseForOthers(
                    Boolean(
                        context.can_raise_for_others
                    )
                );

                setRequesterRoleCode(
                    context.role_code || ""
                );

                setRequesterUserType(
                    Number.isFinite(context.user_type)
                        ? context.user_type
                        : null
                );
            } catch (error) {
                if (!mounted) {
                    return;
                }

                console.error(
                    "Unable to load requester context:",
                    error
                );

                setEmployee(null);
                setRequesterUserType(null);

                setEmployeeError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load requester information."
                );
            } finally {
                if (mounted) {
                    setEmployeeLoading(false);
                }
            }
        }

        void loadEmployee();

        return () => {
            mounted = false;
        };
    }, []);

    /* ========================================================
       REQUESTER SEARCH
    ======================================================== */

    useEffect(() => {
        if (
            !canRaiseForOthers ||
            !requesterOpen
        ) {
            setRequesterResults([]);
            setRequesterSearchLoading(false);
            setRequesterSearchError("");
            return;
        }

        const query = requesterSearch.trim();

        if (query.length < 2) {
            setRequesterResults([]);
            setRequesterSearchLoading(false);
            setRequesterSearchError("");
            return;
        }

        let cancelled = false;

        const timer = window.setTimeout(
            async () => {
                try {
                    setRequesterSearchLoading(true);
                    setRequesterSearchError("");

                    const response =
                        await api.get<
                            ApiOk<RequesterEmployee[]>
                        >(
                            `/tickets/requesters?q=${encodeURIComponent(
                                query
                            )}`
                        );

                    if (cancelled) {
                        return;
                    }

                    const values =
                        readApiData<
                            RequesterEmployee[]
                        >(response) ?? [];

                    setRequesterResults(
                        Array.isArray(values)
                            ? values
                            : []
                    );
                } catch (error) {
                    if (cancelled) {
                        return;
                    }

                    console.error(
                        "Unable to search requester employees:",
                        error
                    );

                    setRequesterResults([]);
                    setRequesterSearchError(
                        error instanceof Error
                            ? error.message
                            : "Unable to search employees."
                    );
                } finally {
                    if (!cancelled) {
                        setRequesterSearchLoading(false);
                    }
                }
            },
            300
        );

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [
        canRaiseForOthers,
        requesterOpen,
        requesterSearch,
    ]);

    useEffect(() => {
        function handleRequesterOutsideClick(
            event: MouseEvent
        ) {
            if (
                requesterDropdownRef.current &&
                !requesterDropdownRef.current.contains(
                    event.target as Node
                )
            ) {
                setRequesterOpen(false);
                setRequesterSearch("");
                setRequesterResults([]);
                setRequesterSearchError("");
            }
        }

        document.addEventListener(
            "mousedown",
            handleRequesterOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleRequesterOutsideClick
            );
        };
    }, []);

    const selectRequester = (
        selected: RequesterEmployee
    ) => {
        setEmployee(selected);
        setRequesterOpen(false);
        setRequesterSearch("");
        setRequesterResults([]);
        setRequesterSearchError("");
        setSubmitError("");
        setSubmitSuccess("");
    };

    const useAuthenticatedRequester = () => {
        if (!actor) {
            return;
        }

        selectRequester(actor);
    };

    /* ========================================================
       LOAD FAULT TYPES
    ======================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadFaultTypes() {
            try {
                setFaultTypesLoading(true);
                setFaultTypesError("");

                const response =
                    await ticketApi.faultTypes();

                if (!mounted) {
                    return;
                }

                const values =
                    Array.isArray(response?.data)
                        ? response.data
                        : [];

                const activeValues =
                    values
                        .filter(
                            (item) =>
                                item.status === undefined ||
                                item.status === null ||
                                item.status === 1
                        )
                        .sort((a, b) =>
                            a.fault_name.localeCompare(
                                b.fault_name
                            )
                        );

                setFaultTypes(activeValues);
            } catch (error) {
                if (!mounted) {
                    return;
                }

                console.error(
                    "Unable to load fault types:",
                    error
                );

                setFaultTypes([]);

                setFaultTypesError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load fault types."
                );
            } finally {
                if (mounted) {
                    setFaultTypesLoading(false);
                }
            }
        }

        void loadFaultTypes();

        return () => {
            mounted = false;
        };
    }, []);

    /* ========================================================
       CLOSE DROPDOWN OUTSIDE
    ======================================================== */

    useEffect(() => {
        function handleOutsideClick(
            event: MouseEvent
        ) {
            if (!dropdownRef.current) {
                return;
            }

            if (
                !dropdownRef.current.contains(
                    event.target as Node
                )
            ) {
                setOpenFaultId(null);
                setFaultSearch("");
            }
        }

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    /* ========================================================
       FILTER FAULT TYPES
    ======================================================== */

    const filteredFaultTypes =
        useMemo(() => {
            const search =
                faultSearch.trim().toLowerCase();

            if (!search) {
                return faultTypes;
            }

            return faultTypes.filter(
                (fault) => {
                    const name =
                        fault.fault_name
                            ?.toLowerCase() ?? "";

                    const description =
                        fault.fault_desc
                            ?.toLowerCase() ?? "";

                    const register =
                        fault.fault_register
                            ?.toLowerCase() ?? "";

                    return (
                        name.includes(search) ||
                        description.includes(search) ||
                        register.includes(search)
                    );
                }
            );
        }, [
            faultSearch,
            faultTypes,
        ]);

    /* ========================================================
       TICKET UPDATE
    ======================================================== */

    const updateTicket = (
        clientId: string,
        changes: Partial<TicketDraft>
    ) => {
        setTickets((current) =>
            current.map((ticket) =>
                ticket.clientId === clientId
                    ? {
                        ...ticket,
                        ...changes,
                    }
                    : ticket
            )
        );

        setSubmitError("");
        setSubmitSuccess("");
    };

    /* ========================================================
       ADD TICKET
    ======================================================== */

    const addTicket = () => {
        if (tickets.length >= MAX_TICKETS) {
            setSubmitError(
                "You can create a maximum of 10 trouble tickets at once."
            );

            return;
        }

        setTickets((current) => [
            ...current,
            createEmptyTicket(),
        ]);

        setSubmitError("");
        setSubmitSuccess("");
    };

    /* ========================================================
       REMOVE TICKET
    ======================================================== */

    const removeTicket = (
        clientId: string
    ) => {
        if (tickets.length === 1) {
            return;
        }

        setTickets((current) =>
            current.filter(
                (ticket) =>
                    ticket.clientId !== clientId
            )
        );

        if (openFaultId === clientId) {
            setOpenFaultId(null);
            setFaultSearch("");
        }

        setSubmitError("");
        setSubmitSuccess("");
    };

    /* ========================================================
       SELECT FAULT
    ======================================================== */

    const selectFault = (
        clientId: string,
        fault: FaultType
    ) => {
        updateTicket(clientId, {
            faultType: fault,
        });

        setOpenFaultId(null);
        setFaultSearch("");
    };

    /* ========================================================
       CLEAR FAULT
    ======================================================== */

    const clearFault = (
        clientId: string
    ) => {
        updateTicket(clientId, {
            faultType: null,
        });

        setOpenFaultId(null);
        setFaultSearch("");
    };

    /* ========================================================
       ATTACHMENT
       
       IMPORTANT:
       Each TT has exactly ONE attachment.
       
       TT #1 -> tickets[0].attachment
       TT #2 -> tickets[1].attachment
       TT #3 -> tickets[2].attachment
       ...
       TT #10 -> tickets[9].attachment
    ======================================================== */

    const handleAttachment = (
        clientId: string,
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            event.target.files?.[0] ?? null;

        if (!file) {
            return;
        }

        if (
            file.size >
            MAX_ATTACHMENT_SIZE
        ) {
            setSubmitError(
                "Attachment must be 5 MB or smaller."
            );

            event.target.value = "";

            return;
        }

        updateTicket(clientId, {
            attachment: file,
        });

        setSubmitError("");
    };

    /* ========================================================
       REMOVE ATTACHMENT
    ======================================================== */

    const removeAttachment = (
        clientId: string
    ) => {
        updateTicket(clientId, {
            attachment: null,
        });
    };

    /* ========================================================
       VALIDATION
    ======================================================== */

    const validate = (): string | null => {
        if (!employee) {
            return (
                "Authenticated employee information is unavailable."
            );
        }

        if (
            tickets.length < 1 ||
            tickets.length > MAX_TICKETS
        ) {
            return "Please provide between 1 and 10 trouble tickets.";
        }

        for (
            let i = 0;
            i < tickets.length;
            i++
        ) {
            const ticket = tickets[i];

            if (!ticket.faultType) {
                return `Please select a fault type for TT #${i + 1}.`;
            }

            const description =
                ticket.description.trim();

            if (!description) {
                return `Please enter an issue description for TT #${i + 1}.`;
            }

            if (
                description.length <
                MIN_DESCRIPTION_LENGTH
            ) {
                return `TT #${i + 1} description must contain at least ${MIN_DESCRIPTION_LENGTH} characters.`;
            }

            if (
                description.length >
                MAX_DESCRIPTION_LENGTH
            ) {
                return `TT #${i + 1} description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;
            }

            if (
                ticket.attachment &&
                ticket.attachment.size >
                MAX_ATTACHMENT_SIZE
            ) {
                return `Attachment for TT #${i + 1} must be 5 MB or smaller.`;
            }
        }

        return null;
    };

    /* ========================================================
       SHOW SUCCESS TOAST + REDIRECT
    ======================================================== */

    const showSuccessAndRedirect = (
        count: number
    ) => {
        const message =
            `${count} trouble ticket${count === 1 ? "" : "s"
            } created successfully.`;

        setSuccessToastMessage(message);
        setSuccessToastVisible(true);
        setSuccessToastFading(false);

        /*
         * After approximately 2 seconds,
         * start fading the toast.
         */
        window.setTimeout(() => {
            setSuccessToastFading(true);
        }, SUCCESS_TOAST_VISIBLE_MS);

        /*
         * Return to the panel where Create TT was opened.
         *
         * User Panel:
         *   /dashboard/user
         *
         * Admin / Staff Dashboard:
         *   /dashboard#trouble-ticket-table
         *
         * replace() keeps Browser Back from reopening the submitted form.
         */
        window.setTimeout(() => {
            router.replace(
                getSuccessHref()
            );
        }, SUCCESS_REDIRECT_MS);
    };

    /* ========================================================
       SUBMIT
    ======================================================== */

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setSubmitError("");
        setSubmitSuccess("");
        setCreatedTickets([]);
        setFailedTickets([]);

        const validationError =
            validate();

        if (validationError) {
            setSubmitError(
                validationError
            );

            return;
        }

        try {
            setSubmitting(true);

            /*
             * One ticket = one attachment.
             *
             * Example:
             *
             * payload[0] -> TT #1
             * attachments[0] -> File #1
             *
             * payload[1] -> TT #2
             * attachments[1] -> File #2
             *
             * payload[2] -> TT #3
             * attachments[2] -> File #3
             *
             * This continues up to TT #10.
             */

            const payload =
                tickets.map(
                    (ticket) => ({
                        reason_of_problem:
                            ticket.description.trim(),

                        fault_type:
                            ticket.faultType!.id,

                        requester_employee_id:
                            employee!.employee_id,
                    })
                );

            const attachments =
                tickets.map(
                    (ticket) =>
                        ticket.attachment
                );

            /*
             * IMPORTANT:
             *
             * Your api.ts createBulk method must accept:
             *
             * createBulk(
             *     payload,
             *     attachments
             * )
             *
             * and send multipart/form-data to the backend.
             */
            const response =
                await ticketApi.createBulk(
                    payload,
                    attachments
                );

            const created =
                Array.isArray(
                    response?.data?.created
                )
                    ? response.data.created
                    : [];

            const successful: CreatedTicket[] =
                created.map(
                    (item, index) => ({
                        index: index + 1,
                        ttNo: String(
                            item.tt_no
                        ),
                    })
                );

            const successfulCount =
                successful.length;

            if (
                successfulCount === 0
            ) {
                throw new Error(
                    "The trouble tickets could not be created."
                );
            }

            /*
             * Notify the persistent user sidebar immediately.
             * The sidebar listens for this event and increments
             * TT History without requiring a page refresh.
             */
            window.dispatchEvent(
                new CustomEvent("tt-created", {
                    detail: {
                        count: successfulCount,
                    },
                })
            );

            setCreatedTickets(
                successful
            );

            setFailedTickets([]);

            setSubmitSuccess(
                `${successfulCount} trouble ticket${successfulCount === 1
                    ? ""
                    : "s"
                } created successfully.`
            );

            /*
             * IMPORTANT:
             *
             * Do not reset before redirecting.
             * The user should see the success toast.
             */

            showSuccessAndRedirect(
                successfulCount
            );
        } catch (error) {
            console.error(
                "Failed to create trouble tickets:",
                error
            );

            setCreatedTickets([]);
            setFailedTickets([]);

            setSubmitError(
                error instanceof Error
                    ? error.message
                    : "Unable to create the trouble tickets."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* ========================================================
       RESET
    ======================================================== */

    const handleReset = () => {
        if (submitting) {
            return;
        }

        setTickets([
            createEmptyTicket(),
        ]);

        setOpenFaultId(null);
        setFaultSearch("");

        if (actor) {
            setEmployee(actor);
        }

        setRequesterOpen(false);
        setRequesterSearch("");
        setRequesterResults([]);
        setRequesterSearchError("");

        setSubmitError("");
        setSubmitSuccess("");

        setCreatedTickets([]);
        setFailedTickets([]);
    };

    const compactMode =
        tickets.length > 1;

    const isOnBehalf =
        Boolean(
            actor &&
            employee &&
            actor.employee_id !== employee.employee_id
        );

    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <div className="min-h-full bg-slate-50">

            {/* ==================================================
                PROFESSIONAL SUCCESS TOAST
            ================================================== */}

            {successToastVisible && (
                <div
                    className={`fixed right-5 top-5 z-[9999] w-[min(420px,calc(100vw-40px))] transition-all duration-500 ease-out ${successToastFading
                        ? "translate-y-[-8px] opacity-0"
                        : "translate-y-0 opacity-100"
                        }`}
                    role="status"
                    aria-live="polite"
                >
                    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.16)]">

                        <div className="flex items-start gap-3 px-4 py-3.5">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                <Check className="h-5 w-5 text-emerald-600" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                    Success
                                </p>

                                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                                    {successToastMessage}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSuccessToastFading(
                                        true
                                    )
                                }
                                className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Close notification"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Progress / auto-dismiss indicator */}
                        <div className="h-0.5 w-full bg-emerald-100">
                            <div
                                className={`h-full bg-emerald-500 transition-all ease-linear ${successToastFading
                                    ? "w-0"
                                    : "w-full"
                                    }`}
                                style={{
                                    transitionDuration: `${SUCCESS_TOAST_VISIBLE_MS}ms`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="mx-auto w-full max-w-[1420px] px-4 py-4 lg:px-6">

                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <div className="mb-4 flex items-start justify-between gap-4">

                    <div className="min-w-0">

                        <div className="mb-1.5 flex items-center gap-2 text-[11px] text-slate-500">

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        getReturnHref()
                                    )
                                }
                                className="hover:text-blue-600"
                            >
                                Dashboard
                            </button>

                            <span>/</span>

                            <span>
                                Operations
                            </span>

                            <span>/</span>

                            <span className="font-medium text-blue-600">
                                Create Trouble Tickets
                            </span>
                        </div>

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                                <FileText className="h-5 w-5" />
                            </div>

                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                    Create Trouble Tickets
                                </h1>

                                <p className="text-xs text-slate-500">
                                    Submit one or multiple IT support requests
                                </p>
                            </div>

                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                            submitting || employeeLoading
                        }
                        onClick={() =>
                            router.push(
                                getReturnHref()
                            )
                        }
                        className="shrink-0 gap-1.5"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                    </Button>

                </div>

                {/* ==================================================
                    GLOBAL ERROR / SUCCESS
                ================================================== */}

                {(employeeError ||
                    faultTypesError ||
                    submitError) && (
                        <div className="mb-3 space-y-2">

                            {employeeError && (
                                <AlertBanner
                                    message={
                                        employeeError
                                    }
                                />
                            )}

                            {faultTypesError && (
                                <AlertBanner
                                    message={
                                        faultTypesError
                                    }
                                />
                            )}

                            {submitError && (
                                <AlertBanner
                                    message={
                                        submitError
                                    }
                                />
                            )}

                        </div>
                    )}

                <form
                    onSubmit={handleSubmit}
                    noValidate
                >

                    {/* ==================================================
                        MAIN LAYOUT
                    ================================================== */}

                    <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[310px_minmax(0,1fr)]">

                        {/* ==================================================
                            REQUESTER INFORMATION
                        ================================================== */}

                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-200 px-4 py-3">

                                <div className="flex items-center gap-2">

                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                        <User className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900">
                                            Requester Information
                                        </h2>

                                        <p className="text-[10px] text-slate-500">
                                            {canRaiseForOthers
                                                ? "Select the employee who needs IT support"
                                                : "Loaded from your authenticated account"}
                                        </p>
                                    </div>

                                </div>

                            </div>

                            <div className="p-3">

                                {employeeLoading ? (
                                    <div className="space-y-3">

                                        <div className="h-16 animate-pulse rounded-lg bg-slate-100" />

                                        <div className="h-9 animate-pulse rounded-lg bg-slate-100" />

                                        <div className="h-9 animate-pulse rounded-lg bg-slate-100" />

                                        <div className="h-9 animate-pulse rounded-lg bg-slate-100" />

                                    </div>
                                ) : employee ? (
                                    <>
                                        {canRaiseForOthers && actor && (
                                            <RequesterPicker
                                                actor={actor}
                                                selected={employee}
                                                roleCode={requesterRoleCode}
                                                isOpen={requesterOpen}
                                                search={requesterSearch}
                                                results={requesterResults}
                                                loading={requesterSearchLoading}
                                                error={requesterSearchError}
                                                dropdownRef={requesterDropdownRef}
                                                disabled={submitting}
                                                onToggle={() => {
                                                    setRequesterOpen(
                                                        (current) => !current
                                                    );
                                                    setRequesterSearch("");
                                                    setRequesterResults([]);
                                                    setRequesterSearchError("");
                                                }}
                                                onSearch={setRequesterSearch}
                                                onSelect={selectRequester}
                                                onUseSelf={useAuthenticatedRequester}
                                            />
                                        )}

                                        <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3">

                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                                {initials(
                                                    employee.employee_name
                                                )}
                                            </div>

                                            <div className="min-w-0">

                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {
                                                        employee.employee_name
                                                    }
                                                </p>

                                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                                    <p className="text-[11px] text-slate-500">
                                                        {employee.employee_id}
                                                    </p>

                                                    {isOnBehalf && (
                                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                                                            On behalf
                                                        </span>
                                                    )}
                                                </div>

                                            </div>

                                        </div>

                                        {isOnBehalf && actor && (
                                            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-[10px] leading-4 text-amber-800">
                                                Raised by {actor.employee_name || actor.employee_id}
                                                {actor.employee_name && (
                                                    <> ({actor.employee_id})</>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-2">

                                            <EmployeeInfo
                                                label="Designation"
                                                value={
                                                    employee.designation
                                                }
                                                icon={
                                                    <User className="h-3.5 w-3.5" />
                                                }
                                            />

                                            <EmployeeInfo
                                                label="Department"
                                                value={
                                                    employee.department
                                                }
                                                icon={
                                                    <Building2 className="h-3.5 w-3.5" />
                                                }
                                            />

                                            <EmployeeInfo
                                                label="Work Field"
                                                value={
                                                    employee.work_field
                                                }
                                                icon={
                                                    <Building2 className="h-3.5 w-3.5" />
                                                }
                                            />

                                            <EmployeeInfo
                                                label="Phone"
                                                value={
                                                    employee.official_cell ||
                                                    employee.personal_cell
                                                }
                                                icon={
                                                    <Phone className="h-3.5 w-3.5" />
                                                }
                                            />

                                            <EmployeeInfo
                                                label="Email"
                                                value={
                                                    employee.official_email ||
                                                    employee.email
                                                }
                                                icon={
                                                    <Mail className="h-3.5 w-3.5" />
                                                }
                                            />

                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                        Unable to load requester information.
                                    </div>
                                )}

                            </div>

                        </section>

                        {/* ==================================================
                            TROUBLE TICKETS
                        ================================================== */}

                        <section className="min-w-0 overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">

                            {/* HEADER */}

                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">

                                <div>

                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Trouble Ticket Details
                                    </h2>

                                    <p className="text-[10px] text-slate-500">
                                        Add up to 10 IT support requests
                                    </p>

                                </div>

                                <div className="shrink-0 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-center">

                                    <p className="text-[9px] font-semibold uppercase tracking-wide text-blue-500">
                                        Tickets
                                    </p>

                                    <p className="text-sm font-bold leading-none text-blue-700">
                                        {tickets.length} /{" "}
                                        {MAX_TICKETS}
                                    </p>

                                </div>

                            </div>

                            {/* SINGLE */}

                            {!compactMode && (
                                <div className="p-3">

                                    <TicketEditor
                                        ticket={
                                            tickets[0]
                                        }
                                        index={0}
                                        faultTypes={
                                            faultTypes
                                        }
                                        faultTypesLoading={
                                            faultTypesLoading
                                        }
                                        filteredFaultTypes={
                                            filteredFaultTypes
                                        }
                                        openFaultId={
                                            openFaultId
                                        }
                                        faultSearch={
                                            faultSearch
                                        }
                                        dropdownRef={
                                            dropdownRef
                                        }
                                        onOpenFault={
                                            (id) => {
                                                setFaultSearch(
                                                    ""
                                                );

                                                setOpenFaultId(
                                                    openFaultId ===
                                                        id
                                                        ? null
                                                        : id
                                                );
                                            }
                                        }
                                        onSearch={
                                            setFaultSearch
                                        }
                                        onSelectFault={
                                            selectFault
                                        }
                                        onClearFault={
                                            clearFault
                                        }
                                        onDescriptionChange={
                                            (
                                                value
                                            ) =>
                                                updateTicket(
                                                    tickets[0]
                                                        .clientId,
                                                    {
                                                        description:
                                                            value,
                                                    }
                                                )
                                        }
                                        onAttachmentChange={
                                            handleAttachment
                                        }
                                        onRemoveAttachment={
                                            removeAttachment
                                        }
                                        showRemove={
                                            false
                                        }
                                        disabled={
                                            submitting
                                        }
                                    />

                                </div>
                            )}

                            {/* MULTIPLE */}

                            {compactMode && (
                                <div className="p-3">

                                    <div className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">

                                        <div className="hidden grid-cols-[34px_minmax(0,1.05fr)_minmax(0,1.6fr)_minmax(0,0.85fr)_34px] items-center gap-3 border-b border-slate-200 bg-slate-50/90 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 lg:grid">

                                            <div className="text-center">
                                                #
                                            </div>

                                            <div>
                                                Fault Type
                                                <span className="ml-0.5 text-red-500">
                                                    *
                                                </span>
                                            </div>

                                            <div>
                                                Issue Description
                                                <span className="ml-0.5 text-red-500">
                                                    *
                                                </span>
                                            </div>

                                            <div>
                                                Attachment
                                            </div>

                                            <div className="text-center">
                                                Action
                                            </div>

                                        </div>

                                        <div className="divide-y divide-slate-100">

                                            {tickets.map(
                                                (
                                                    ticket,
                                                    index
                                                ) => (
                                                    <CompactTicketRow
                                                        key={
                                                            ticket.clientId
                                                        }
                                                        ticket={
                                                            ticket
                                                        }
                                                        index={
                                                            index
                                                        }
                                                        faultTypes={
                                                            faultTypes
                                                        }
                                                        faultTypesLoading={
                                                            faultTypesLoading
                                                        }
                                                        filteredFaultTypes={
                                                            filteredFaultTypes
                                                        }
                                                        openFaultId={
                                                            openFaultId
                                                        }
                                                        faultSearch={
                                                            faultSearch
                                                        }
                                                        dropdownRef={
                                                            dropdownRef
                                                        }
                                                        onOpenFault={
                                                            (
                                                                id
                                                            ) => {
                                                                setFaultSearch(
                                                                    ""
                                                                );

                                                                setOpenFaultId(
                                                                    openFaultId ===
                                                                        id
                                                                        ? null
                                                                        : id
                                                                );
                                                            }
                                                        }
                                                        onSearch={
                                                            setFaultSearch
                                                        }
                                                        onSelectFault={
                                                            selectFault
                                                        }
                                                        onClearFault={
                                                            clearFault
                                                        }
                                                        onDescriptionChange={
                                                            (
                                                                value
                                                            ) =>
                                                                updateTicket(
                                                                    ticket.clientId,
                                                                    {
                                                                        description:
                                                                            value,
                                                                    }
                                                                )
                                                        }
                                                        onAttachmentChange={
                                                            handleAttachment
                                                        }
                                                        onRemoveAttachment={
                                                            removeAttachment
                                                        }
                                                        onRemoveTicket={
                                                            removeTicket
                                                        }
                                                        disabled={
                                                            submitting
                                                        }
                                                    />
                                                )
                                            )}

                                        </div>

                                    </div>

                                </div>
                            )}

                            {/* ADD */}

                            <div className="px-3 pb-2">

                                <button
                                    type="button"
                                    disabled={
                                        submitting ||
                                        tickets.length >=
                                        MAX_TICKETS
                                    }
                                    onClick={
                                        addTicket
                                    }
                                    className="group flex w-full items-center justify-center gap-2.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-2.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100/80 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-200">
                                        <Plus className="h-3.5 w-3.5" />
                                    </span>

                                    Add Another Trouble Ticket

                                    <span className="text-[10px] font-medium text-indigo-400">
                                        (
                                        {MAX_TICKETS -
                                            tickets.length}{" "}
                                        remaining)
                                    </span>
                                </button>

                            </div>

                            {/* FOOTER */}

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3">

                                <div className="text-[10px] text-slate-500">
                                    {tickets.length ===
                                        1
                                        ? "1 ticket ready"
                                        : `${tickets.length} tickets ready`}
                                </div>

                                <div className="flex items-center gap-2">

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            submitting
                                        }
                                        onClick={
                                            handleReset
                                        }
                                        className="h-8 px-3 text-xs"
                                    >
                                        Reset
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            submitting || employeeLoading
                                        }
                                        onClick={() =>
                                            router.push(
                                                getReturnHref()
                                            )
                                        }
                                        className="h-8 px-3 text-xs"
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={
                                            submitting ||
                                            employeeLoading ||
                                            !employee ||
                                            faultTypesLoading
                                        }
                                        className="h-8 bg-blue-600 px-3 text-xs text-white hover:bg-blue-700"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />

                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="mr-1.5 h-3.5 w-3.5" />

                                                Submit{" "}
                                                {
                                                    tickets.length
                                                }{" "}
                                                TT
                                                {tickets.length >
                                                    1
                                                    ? "s"
                                                    : ""}
                                            </>
                                        )}
                                    </Button>

                                </div>

                            </div>

                            {/* CREATED */}

                            {createdTickets.length >
                                0 && (
                                    <div className="border-t border-emerald-100 bg-emerald-50/60 px-3 py-2">

                                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                            Created Tickets
                                        </p>

                                        <div className="flex flex-wrap gap-1.5">

                                            {createdTickets.map(
                                                (
                                                    item
                                                ) => (
                                                    <span
                                                        key={`${item.index}-${item.ttNo}`}
                                                        className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-[10px] font-medium text-emerald-700"
                                                    >
                                                        TT #
                                                        {
                                                            item.index
                                                        }{" "}
                                                        ·{" "}
                                                        {
                                                            item.ttNo
                                                        }
                                                    </span>
                                                )
                                            )}

                                        </div>

                                    </div>
                                )}

                            {/* FAILED */}

                            {failedTickets.length >
                                0 && (
                                    <div className="border-t border-amber-100 bg-amber-50/60 px-3 py-2">

                                        <p className="mb-1 text-[10px] font-semibold text-amber-800">
                                            Tickets requiring attention
                                        </p>

                                        <div className="space-y-0.5">

                                            {failedTickets.map(
                                                (
                                                    item
                                                ) => (
                                                    <p
                                                        key={
                                                            item.index
                                                        }
                                                        className="text-[10px] text-amber-800"
                                                    >
                                                        TT #
                                                        {
                                                            item.index
                                                        }
                                                        :{" "}
                                                        {
                                                            item.error
                                                        }
                                                    </p>
                                                )
                                            )}

                                        </div>

                                    </div>
                                )}

                        </section>

                    </div>

                </form>

            </div>

        </div>
    );
}

/* ============================================================
   REQUESTER PICKER
============================================================ */

function RequesterPicker({
    actor,
    selected,
    roleCode,
    isOpen,
    search,
    results,
    loading,
    error,
    dropdownRef,
    disabled,
    onToggle,
    onSearch,
    onSelect,
    onUseSelf,
}: {
    actor: RequesterEmployee;
    selected: RequesterEmployee;
    roleCode: string;
    isOpen: boolean;
    search: string;
    results: RequesterEmployee[];
    loading: boolean;
    error: string;
    dropdownRef: RefObject<HTMLDivElement | null>;
    disabled: boolean;
    onToggle: () => void;
    onSearch: (value: string) => void;
    onSelect: (employee: RequesterEmployee) => void;
    onUseSelf: () => void;
}) {
    const isSelf =
        actor.employee_id === selected.employee_id;

    return (
        <div
            ref={dropdownRef}
            className="relative mb-3"
        >
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Raise TT for
                </label>

                {roleCode && (
                    <span className="max-w-[150px] truncate rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-medium text-slate-500">
                        {roleCode}
                    </span>
                )}
            </div>

            <button
                type="button"
                disabled={disabled}
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                        {selected.employee_name || "Employee"}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">
                        {selected.employee_id}
                        {selected.department
                            ? ` · ${selected.department}`
                            : ""}
                    </p>
                </div>

                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-slate-400">
                <span>Root, IT Admin and IT Personnel may create on behalf of employees.</span>
                {!isSelf && (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={onUseSelf}
                        className="shrink-0 font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                        Use me
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[120] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.18)]">
                    <div className="border-b border-slate-100 p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <Input
                                autoFocus
                                value={search}
                                disabled={disabled}
                                onChange={(event) =>
                                    onSearch(event.target.value)
                                }
                                placeholder="Search name or employee ID..."
                                className="h-8 border-slate-200 pl-8 pr-8 text-[11px]"
                            />

                            {loading && (
                                <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-blue-500" />
                            )}
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-1.5">
                        {error ? (
                            <div className="rounded-md bg-red-50 px-3 py-3 text-[10px] text-red-700">
                                {error}
                            </div>
                        ) : search.trim().length < 2 ? (
                            <div className="px-3 py-5 text-center text-[10px] text-slate-400">
                                Type at least 2 characters to search active employees.
                            </div>
                        ) : !loading && results.length === 0 ? (
                            <div className="px-3 py-5 text-center text-[10px] text-slate-400">
                                No matching active employee found.
                            </div>
                        ) : (
                            results.map((item) => {
                                const activeSelected =
                                    item.employee_id === selected.employee_id;

                                return (
                                    <button
                                        key={item.employee_id}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => onSelect(item)}
                                        className={`flex w-full items-start justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition ${activeSelected
                                            ? "bg-blue-50"
                                            : "hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-[11px] font-semibold text-slate-800">
                                                {item.employee_name}
                                            </p>
                                            <p className="truncate text-[10px] text-slate-500">
                                                {item.employee_id}
                                                {item.designation
                                                    ? ` · ${item.designation}`
                                                    : ""}
                                            </p>
                                            {(item.department || item.work_field) && (
                                                <p className="mt-0.5 truncate text-[9px] text-slate-400">
                                                    {[
                                                        item.department,
                                                        item.work_field,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                </p>
                                            )}
                                        </div>

                                        {activeSelected && (
                                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ============================================================
   EMPLOYEE INFO
============================================================ */

function EmployeeInfo({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | null | undefined;
    icon: ReactNode;
}) {
    return (
        <div className="flex items-start gap-2 rounded-md px-1.5 py-1">

            <div className="mt-0.5 shrink-0 text-slate-400">
                {icon}
            </div>

            <div className="min-w-0">

                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                </p>

                <p className="truncate text-[11px] font-medium text-slate-700">
                    {valueOrDash(value)}
                </p>

            </div>

        </div>
    );
}

/* ============================================================
   SINGLE TICKET EDITOR
============================================================ */

function TicketEditor({
    ticket,
    index,
    faultTypes,
    faultTypesLoading,
    filteredFaultTypes,
    openFaultId,
    faultSearch,
    dropdownRef,
    onOpenFault,
    onSearch,
    onSelectFault,
    onClearFault,
    onDescriptionChange,
    onAttachmentChange,
    onRemoveAttachment,
    showRemove,
    disabled,
}: {
    ticket: TicketDraft;
    index: number;
    faultTypes: FaultType[];
    faultTypesLoading: boolean;
    filteredFaultTypes: FaultType[];
    openFaultId: string | null;
    faultSearch: string;
    dropdownRef: RefObject<HTMLDivElement | null>;
    onOpenFault: (id: string) => void;
    onSearch: (value: string) => void;
    onSelectFault: (
        id: string,
        fault: FaultType
    ) => void;
    onClearFault: (id: string) => void;
    onDescriptionChange: (
        value: string
    ) => void;
    onAttachmentChange: (
        id: string,
        event: ChangeEvent<HTMLInputElement>
    ) => void;
    onRemoveAttachment: (
        id: string
    ) => void;
    showRemove: boolean;
    disabled: boolean;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white">

            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3 py-2">

                <div>

                    <p className="text-xs font-semibold text-slate-800">
                        Trouble Ticket #{index + 1}
                    </p>

                    <p className="text-[10px] text-slate-500">
                        IT Support Request
                    </p>

                </div>

                {showRemove && (
                    <button
                        type="button"
                        className="text-red-500"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}

            </div>

            <div className="grid min-w-0 grid-cols-1 gap-2 p-3 lg:grid-cols-[170px_minmax(0,1fr)_150px]">

                <div className="min-w-0 rounded-md">

                    <FaultTypePicker
                        ticket={ticket}
                        faultTypes={
                            faultTypes
                        }
                        faultTypesLoading={
                            faultTypesLoading
                        }
                        filteredFaultTypes={
                            filteredFaultTypes
                        }
                        openFaultId={
                            openFaultId
                        }
                        faultSearch={
                            faultSearch
                        }
                        dropdownRef={
                            dropdownRef
                        }
                        onOpenFault={
                            onOpenFault
                        }
                        onSearch={
                            onSearch
                        }
                        onSelectFault={
                            onSelectFault
                        }
                        onClearFault={
                            onClearFault
                        }
                        disabled={
                            disabled
                        }
                    />

                </div>

                <div className="min-w-0 overflow-hidden rounded-md">

                    <DescriptionField
                        value={
                            ticket.description
                        }
                        onChange={
                            onDescriptionChange
                        }
                        disabled={
                            disabled
                        }
                    />

                </div>

                <div className="min-w-0 overflow-hidden rounded-md">

                    <AttachmentField
                        ticket={
                            ticket
                        }
                        onChange={
                            onAttachmentChange
                        }
                        onRemove={
                            onRemoveAttachment
                        }
                        disabled={
                            disabled
                        }
                    />

                </div>

            </div>

        </div>
    );
}

/* ============================================================
   COMPACT TICKET ROW
============================================================ */

function CompactTicketRow({
    ticket,
    index,
    faultTypes,
    faultTypesLoading,
    filteredFaultTypes,
    openFaultId,
    faultSearch,
    dropdownRef,
    onOpenFault,
    onSearch,
    onSelectFault,
    onClearFault,
    onDescriptionChange,
    onAttachmentChange,
    onRemoveAttachment,
    onRemoveTicket,
    disabled,
}: {
    ticket: TicketDraft;
    index: number;
    faultTypes: FaultType[];
    faultTypesLoading: boolean;
    filteredFaultTypes: FaultType[];
    openFaultId: string | null;
    faultSearch: string;
    dropdownRef: RefObject<HTMLDivElement | null>;
    onOpenFault: (id: string) => void;
    onSearch: (value: string) => void;
    onSelectFault: (
        id: string,
        fault: FaultType
    ) => void;
    onClearFault: (id: string) => void;
    onDescriptionChange: (
        value: string
    ) => void;
    onAttachmentChange: (
        id: string,
        event: ChangeEvent<HTMLInputElement>
    ) => void;
    onRemoveAttachment: (
        id: string
    ) => void;
    onRemoveTicket: (
        id: string
    ) => void;
    disabled: boolean;
}) {
    return (
        <div className="grid min-w-0 grid-cols-1 gap-3 px-3 py-3 transition-colors hover:bg-slate-50/60 lg:grid-cols-[34px_minmax(0,1.05fr)_minmax(0,1.6fr)_minmax(0,0.85fr)_34px] lg:items-center">

            <div className="flex items-center justify-between lg:block">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-[10px] font-bold text-slate-500 lg:h-6 lg:min-w-6 lg:px-1">
                    {index + 1}
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
                    Trouble Ticket
                </span>
            </div>

            <div className="min-w-0">

                <FaultTypePicker
                    ticket={ticket}
                    faultTypes={
                        faultTypes
                    }
                    faultTypesLoading={
                        faultTypesLoading
                    }
                    filteredFaultTypes={
                        filteredFaultTypes
                    }
                    openFaultId={
                        openFaultId
                    }
                    faultSearch={
                        faultSearch
                    }
                    dropdownRef={
                        dropdownRef
                    }
                    onOpenFault={
                        onOpenFault
                    }
                    onSearch={
                        onSearch
                    }
                    onSelectFault={
                        onSelectFault
                    }
                    onClearFault={
                        onClearFault
                    }
                    disabled={
                        disabled
                    }
                    compact
                />

            </div>

            <div className="min-w-0">

                <DescriptionField
                    value={
                        ticket.description
                    }
                    onChange={
                        onDescriptionChange
                    }
                    disabled={
                        disabled
                    }
                    compact
                />

            </div>

            <div className="min-w-0 w-full max-w-full overflow-hidden">

                <AttachmentField
                    ticket={
                        ticket
                    }
                    onChange={
                        onAttachmentChange
                    }
                    onRemove={
                        onRemoveAttachment
                    }
                    disabled={
                        disabled
                    }
                    compact
                />

            </div>

            <div className="flex justify-end lg:justify-center">

                {index === 0 ? (
                    <span className="hidden text-[10px] text-slate-300 lg:inline">
                        —
                    </span>
                ) : (
                    <button
                        type="button"
                        disabled={
                            disabled
                        }
                        onClick={() =>
                            onRemoveTicket(
                                ticket.clientId
                            )
                        }
                        aria-label={`Remove TT #${index + 1}`}
                        title={`Remove TT #${index + 1}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-40 lg:h-7 lg:w-7"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}

            </div>

        </div>
    );
}

/* ============================================================
   FAULT TYPE PICKER
============================================================ */

function FaultTypePicker({
    ticket,
    faultTypes,
    faultTypesLoading,
    filteredFaultTypes,
    openFaultId,
    faultSearch,
    dropdownRef,
    onOpenFault,
    onSearch,
    onSelectFault,
    onClearFault,
    disabled,
    compact = false,
}: {
    ticket: TicketDraft;
    faultTypes: FaultType[];
    faultTypesLoading: boolean;
    filteredFaultTypes: FaultType[];
    openFaultId: string | null;
    faultSearch: string;
    dropdownRef: RefObject<HTMLDivElement | null>;
    onOpenFault: (id: string) => void;
    onSearch: (value: string) => void;
    onSelectFault: (
        id: string,
        fault: FaultType
    ) => void;
    onClearFault: (
        id: string
    ) => void;
    disabled: boolean;
    compact?: boolean;
}) {
    const isOpen =
        openFaultId === ticket.clientId;

    return (
        <div
            ref={
                isOpen
                    ? dropdownRef
                    : undefined
            }
            className="relative"
        >

            <label
                className={`mb-1 block text-[10px] font-semibold text-slate-700 ${compact
                    ? "lg:hidden"
                    : ""
                    }`}
            >
                Fault Type

                <span className="ml-0.5 text-red-500">
                    *
                </span>
            </label>

            <button
                type="button"
                disabled={
                    disabled ||
                    faultTypesLoading
                }
                onClick={() =>
                    onOpenFault(
                        ticket.clientId
                    )
                }
                className={`flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white text-left transition hover:border-blue-300 focus:border-blue-500 focus:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-50 ${compact
                    ? "h-10 px-3 text-[11px] shadow-sm"
                    : "h-9 px-2.5 text-xs"
                    }`}
            >

                <span
                    className={
                        ticket.faultType
                            ? "truncate text-[11px] font-medium text-slate-800"
                            : "truncate text-slate-400"
                    }
                >
                    {faultTypesLoading
                        ? "Loading fault types..."
                        : ticket.faultType
                            ? ticket.faultType
                                .fault_name
                            : "Select fault type"}
                </span>

                <span className="flex shrink-0 items-center gap-1">

                    {ticket.faultType && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={(
                                event
                            ) => {
                                event.stopPropagation();

                                onClearFault(
                                    ticket.clientId
                                );
                            }}
                            onKeyDown={(
                                event
                            ) => {
                                if (
                                    event.key ===
                                    "Enter" ||
                                    event.key ===
                                    " "
                                ) {
                                    event.preventDefault();

                                    event.stopPropagation();

                                    onClearFault(
                                        ticket.clientId
                                    );
                                }
                            }}
                            aria-label="Clear fault type"
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-red-500 transition-colors hover:bg-red-50"
                        >
                            <X className="h-3 w-3" />
                        </span>
                    )}

                    <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${isOpen
                            ? "rotate-180"
                            : ""
                            }`}
                    />

                </span>

            </button>

            {isOpen && (
                <div
                    className={`absolute left-0 top-full z-[150] mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${compact
                        ? "w-[min(360px,calc(100vw-2rem))]"
                        : "w-full max-w-[320px]"
                        }`}
                >

                    <div className="border-b border-slate-100 bg-slate-50/70 p-2">

                        <div className="relative">

                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                            <Input
                                autoFocus
                                value={
                                    faultSearch
                                }
                                onChange={(
                                    event
                                ) =>
                                    onSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Search fault type..."
                                className="h-9 border-slate-200 bg-white pl-8 pr-3 text-[11px] shadow-sm"
                            />

                        </div>

                    </div>

                    <div className="max-h-72 overflow-y-auto p-1.5">

                        {filteredFaultTypes.length ===
                            0 ? (
                            <div className="px-3 py-6 text-center text-xs text-slate-500">
                                {faultTypes.length ===
                                    0
                                    ? "No fault types available"
                                    : "No matching fault type"}
                            </div>
                        ) : (
                            filteredFaultTypes.map(
                                (
                                    fault
                                ) => (
                                    <button
                                        type="button"
                                        key={
                                            fault.id
                                        }
                                        onClick={() =>
                                            onSelectFault(
                                                ticket.clientId,
                                                fault
                                            )
                                        }
                                        className="group block w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-[12px] font-semibold text-slate-700 group-hover:text-blue-700">
                                                    {
                                                        fault.fault_name
                                                    }
                                                </p>

                                                {/* {fault.fault_register && (
                                                    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] leading-4 text-slate-400">
                                                        <User className="h-3 w-3 shrink-0 text-slate-300" />

                                                        <span className="shrink-0 font-medium text-slate-400">
                                                            User
                                                        </span>

                                                        <span className="truncate">
                                                            {fault.fault_register}
                                                        </span>
                                                    </div>
                                                )} */}
                                            </div>

                                            {ticket.faultType?.id ===
                                                fault.id && (
                                                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                                                )}
                                        </div>
                                    </button>
                                )
                            )
                        )}

                    </div>

                </div>
            )}

        </div>
    );
}

/* ============================================================
   DESCRIPTION
============================================================ */

function DescriptionField({
    value,
    onChange,
    disabled,
    compact = false,
}: {
    value: string;
    onChange: (
        value: string
    ) => void;
    disabled: boolean;
    compact?: boolean;
}) {
    return (
        <div>
            <div
                className={`mb-1.5 items-center justify-between gap-2 ${compact
                    ? "flex lg:hidden"
                    : "flex"
                    }`}
            >
                <label className="text-[12px] font-semibold text-slate-700">
                    Issue Description

                    <span className="ml-0.5 text-red-500">
                        *
                    </span>
                </label>

                <span className="text-[10px] text-slate-400">
                    {value.length}/
                    {MAX_DESCRIPTION_LENGTH}
                </span>
            </div>

            <div className="relative">
                <textarea
                    value={value}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    disabled={disabled}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                    placeholder="Describe the issue..."
                    className={`w-full resize-none rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500 ${compact
                        ? "h-10 py-2 pr-14 text-[12px] shadow-sm"
                        : "h-[90px] py-2.5"
                        }`}
                />

                {compact && (
                    <span className="pointer-events-none absolute bottom-1.5 right-2 hidden rounded bg-white/90 px-1 text-[9px] tabular-nums text-slate-400 lg:inline">
                        {value.length}
                    </span>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   ATTACHMENT
============================================================ */

function AttachmentField({
    ticket,
    onChange,
    onRemove,
    disabled,
    compact = false,
}: {
    ticket: TicketDraft;
    onChange: (
        id: string,
        event: ChangeEvent<HTMLInputElement>
    ) => void;
    onRemove: (
        id: string
    ) => void;
    disabled: boolean;
    compact?: boolean;
}) {
    const file = ticket.attachment;

    const isImage =
        !!file &&
        file.type.startsWith("image/");

    const [previewUrl, setPreviewUrl] =
        useState<string | null>(null);

    useEffect(() => {
        if (!file || !isImage) {
            setPreviewUrl(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file, isImage]);

    return (
        <div className="min-w-0 w-full max-w-full">
            <label
                className={`mb-1.5 block text-[12px] font-semibold text-slate-700 ${compact
                    ? "lg:hidden"
                    : ""
                    }`}
            >
                Attachment
            </label>

            <div
                className={`relative w-full min-w-0 max-w-full overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-300 hover:bg-blue-50/30 ${compact
                    ? "min-h-10 rounded-lg px-2.5 shadow-sm"
                    : "min-h-[90px] px-2.5 py-2"
                    }`}
            >
                <input
                    type="file"
                    disabled={disabled}
                    onChange={(event) =>
                        onChange(
                            ticket.clientId,
                            event
                        )
                    }
                    className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    accept="*/*"
                />

                {file ? (
                    <div
                        className={`relative z-[5] flex min-w-0 items-center gap-2 ${compact
                            ? "min-h-9"
                            : "min-h-[74px]"
                            }`}
                    >
                        {/* IMAGE PREVIEW */}
                        {isImage && previewUrl ? (
                            <div
                                className={`shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white ${compact
                                    ? "h-7 w-7"
                                    : "h-12 w-12"
                                    }`}
                            >
                                <img
                                    src={previewUrl}
                                    alt={file.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            /* FILE ICON */
                            <div
                                className={`flex shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 ${compact
                                    ? "h-7 w-7"
                                    : "h-10 w-10"
                                    }`}
                            >
                                <FileText
                                    className={compact
                                        ? "h-3.5 w-3.5"
                                        : "h-4 w-4"
                                    }
                                />
                            </div>
                        )}

                        {/* FILE INFORMATION */}
                        <div className="min-w-0 flex-1">
                            <p
                                className={`truncate font-medium text-slate-700 ${compact
                                    ? "text-[11px]"
                                    : "text-[13px]"
                                    }`}
                                title={file.name}
                            >
                                {file.name}
                            </p>

                            <p
                                className={`mt-0.5 truncate text-slate-400 ${compact
                                    ? "text-[9px]"
                                    : "text-[10px]"
                                    }`}
                            >
                                {file.type || "File"} · {formatFileSize(file.size)}
                            </p>
                        </div>

                        {/* REMOVE */}
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();

                                onRemove(
                                    ticket.clientId
                                );
                            }}
                            className="relative z-30 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            aria-label="Remove attachment"
                        >
                            <X className="h-3.5 w-3.5 text-red-500" />
                        </button>
                    </div>
                ) : (
                    <div
                        className={`flex min-w-0 items-center gap-2 overflow-hidden text-slate-500 ${compact
                            ? "min-h-9"
                            : "min-h-[82px]"
                            }`}
                    >
                        <div
                            className={`flex shrink-0 items-center justify-center rounded-md bg-white text-slate-400 ${compact
                                ? "h-7 w-7"
                                : "h-10 w-10"
                                }`}
                        >
                            <Paperclip
                                className={compact
                                    ? "h-3.5 w-3.5"
                                    : "h-5 w-5"
                                }
                            />
                        </div>

                        <div>
                            <p
                                className={`font-medium text-slate-600 ${compact
                                    ? "text-[11px]"
                                    : "text-[13px]"
                                    }`}
                            >
                                Attach file
                            </p>

                            <p className="text-[10px] text-slate-400">
                                Maximum 5 MB
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ============================================================
   ALERT
============================================================ */

function AlertBanner({
    message,
}: {
    message: string;
}) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">

            <AlertCircle className="h-4 w-4 shrink-0" />

            <span>
                {message}
            </span>

        </div>
    );
}