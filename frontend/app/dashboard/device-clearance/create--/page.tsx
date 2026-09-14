/* eslint-disable @next/next/no-img-element */
"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    ArrowRight,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    HardDrive,
    KeyRound,
    Laptop,
    Loader2,
    Network,
    PackageOpen,
    Printer,
    Search,
    ShieldCheck,
    UserCheck,
    UserPlus,
    UserRound,
    X,
} from "lucide-react";

import {
    useRouter,
} from "next/navigation";

import {
    Button,
} from "@/components/ui/button";

import {
    Input,
} from "@/components/ui/input";

import {
    api,
    dashboardApi,
    deviceApi,
    type ApiOk,
    type Device,
} from "@/lib/api";

/* ============================================================
   TYPES
============================================================ */

type RequestType =
    | "Joining"
    | "Resignation"
    | "Retirement"
    | "Contract End"
    | "Termination"
    | "Other";

type EmployeeSearchRaw = {
    employee_id?: string;
    employee_name?: string;

    designation?:
        | string
        | null;

    department?:
        | string
        | null;

    department_name?:
        | string
        | null;

    work_field?:
        | string
        | null;

    personal_cell?:
        | string
        | null;

    official_cell?:
        | string
        | null;

    email?:
        | string
        | null;

    official_email?:
        | string
        | null;

    picture?:
        | string
        | null;

    active?:
        | string
        | null;

    // Legacy Go response support.
    EmpID?: string;
    Name?: string;

    Desig?:
        | string
        | null;

    Dept?:
        | string
        | null;
};

type EmployeeOption = {
    employee_id: string;
    employee_name: string;
    designation: string;
    department: string;
    work_field: string;
    phone: string;
    email: string;
    picture: string;
    active: string;
};

type ITEmployeeRaw = {
    employee_id: string;
    employee_name: string;

    designation?:
        | string
        | null;

    department?:
        | string
        | null;

    picture?:
        | string
        | null;
};

type ITEmployeeOption = {
    employee_id: string;
    employee_name: string;
    designation: string;
    department: string;
    picture: string;
};

type EmployeeDetailsRaw = {
    employee_id?: string;
    employee_name?: string;

    designation?:
        | string
        | null;

    department?:
        | string
        | null;

    department_name?:
        | string
        | null;

    work_field?:
        | string
        | null;

    personal_cell?:
        | string
        | null;

    official_cell?:
        | string
        | null;

    email?:
        | string
        | null;

    official_email?:
        | string
        | null;

    picture?:
        | string
        | null;
};

type CreateRequestResult = {
    id: number;

    reference_no?:
        | string
        | null;

    status?:
        | string
        | null;
};

type LifecycleFormState = {
    request_type: RequestType;

    effective_date: string;

    employee_id: string;
    employee_name: string;
    designation: string;
    department: string;
    work_field: string;
    phone: string;
    email: string;
    employee_picture: string;

    assigned_to: string;
    assigned_to_name: string;

    remarks: string;
};

/* ============================================================
   CONSTANTS
============================================================ */

const EMPTY_FORM: LifecycleFormState = {
    request_type:
        "Joining",

    effective_date:
        "",

    employee_id:
        "",

    employee_name:
        "",

    designation:
        "",

    department:
        "",

    work_field:
        "",

    phone:
        "",

    email:
        "",

    employee_picture:
        "",

    assigned_to:
        "",

    assigned_to_name:
        "",

    remarks:
        "",
};

/*
 * This reproduces the legacy PHP HRIS image URL:
 *
 * https://hris.fiberathome.net/hris/admin/<picture>
 *
 * employee_personal_info.picture contains values such as:
 *
 * user_images/1401616150.jpg
 */
const HRIS_EMPLOYEE_IMAGE_BASE_URL =
    "https://hris.fiberathome.net/hris/admin/";

const REQUEST_TYPES: Array<{
    value: RequestType;
    label: string;
    description: string;
}> = [
    {
        value:
            "Joining",

        label:
            "Joining",

        description:
            "Prepare IT access, device and standard services for a new employee.",
    },
    {
        value:
            "Resignation",

        label:
            "Resignation",

        description:
            "Recover assets and revoke IT access for a resigning employee.",
    },
    {
        value:
            "Retirement",

        label:
            "Retirement",

        description:
            "Complete IT exit activities for a retiring employee.",
    },
    {
        value:
            "Contract End",

        label:
            "Contract End",

        description:
            "Close IT access and recover assigned assets when a contract ends.",
    },
    {
        value:
            "Termination",

        label:
            "Termination",

        description:
            "Complete controlled IT offboarding for a terminated employee.",
    },
    {
        value:
            "Other",

        label:
            "Other",

        description:
            "Create another employee IT lifecycle request.",
    },
];

/* ============================================================
   HELPERS
============================================================ */

function readApiData<T>(
    response: unknown
): T | undefined {
    if (
        response &&
        typeof response ===
            "object" &&
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
            typeof first ===
                "object" &&
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

function text(
    value:
        | string
        | null
        | undefined
): string {
    return String(
        value ?? ""
    ).trim();
}

function resolvePicture(
    picture:
        | string
        | null
        | undefined
): string {
    const value =
        text(
            picture
        );

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

    const clean =
        value
            .replace(
                /^["']+|["']+$/g,
                ""
            )
            .replace(
                /^\/+/,
                ""
            );

    return `${HRIS_EMPLOYEE_IMAGE_BASE_URL}${clean}`;
}

function normalizeEmployee(
    employee: EmployeeSearchRaw
): EmployeeOption {
    return {
        employee_id:
            text(
                employee.employee_id ??
                    employee.EmpID
            ),

        employee_name:
            text(
                employee.employee_name ??
                    employee.Name
            ),

        designation:
            text(
                employee.designation ??
                    employee.Desig
            ),

        department:
            text(
                employee.department ??
                    employee.department_name ??
                    employee.Dept
            ),

        work_field:
            text(
                employee.work_field
            ),

        phone:
            text(
                employee.official_cell ??
                    employee.personal_cell
            ),

        email:
            text(
                employee.official_email ??
                    employee.email
            ),

        picture:
            resolvePicture(
                employee.picture
            ),

        active:
            text(
                employee.active
            ),
    };
}

function getInitials(
    name: string
): string {
    const parts =
        name
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );

    if (!parts.length) {
        return "?";
    }

    if (
        parts.length ===
        1
    ) {
        return (
            parts[0]
                ?.charAt(
                    0
                )
                .toUpperCase() ??
            "?"
        );
    }

    return (
        `${parts[0]?.charAt(0) ?? ""}${parts[
            parts.length - 1
        ]?.charAt(0) ?? ""}`
    ).toUpperCase();
}

function formatDeviceDate(
    value:
        | string
        | null
        | undefined
): string {
    const raw =
        text(
            value
        );

    if (!raw) {
        return "—";
    }

    const date =
        new Date(
            raw
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return raw;
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",
        }
    );
}

/* ============================================================
   PAGE
============================================================ */

export default function DeviceLifecycleCreatePage() {
    const router =
        useRouter();

    const [
        form,
        setForm,
    ] =
        useState<LifecycleFormState>(
            EMPTY_FORM
        );

    const [
        loading,
        setLoading,
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

    /* ========================================================
       EMPLOYEE SEARCH
    ======================================================== */

    const [
        employeeQuery,
        setEmployeeQuery,
    ] =
        useState(
            ""
        );

    const [
        employeeResults,
        setEmployeeResults,
    ] =
        useState<
            EmployeeOption[]
        >([]);

    const [
        employeeSearching,
        setEmployeeSearching,
    ] =
        useState(
            false
        );

    const [
        employeeDropdownOpen,
        setEmployeeDropdownOpen,
    ] =
        useState(
            false
        );

    const employeeRequestRef =
        useRef(
            0
        );

    /* ========================================================
       IT PERSONNEL
    ======================================================== */

    const [
        itPersonnel,
        setITPersonnel,
    ] =
        useState<
            ITEmployeeOption[]
        >([]);

    const [
        itQuery,
        setITQuery,
    ] =
        useState(
            ""
        );

    const [
        itLoading,
        setITLoading,
    ] =
        useState(
            true
        );

    const [
        itDropdownOpen,
        setITDropdownOpen,
    ] =
        useState(
            false
        );

    /* ========================================================
       DEVICES
    ======================================================== */

    const [
        assignedDevices,
        setAssignedDevices,
    ] =
        useState<
            Device[]
        >([]);

    const [
        devicesLoading,
        setDevicesLoading,
    ] =
        useState(
            false
        );

    const [
        devicesError,
        setDevicesError,
    ] =
        useState(
            ""
        );

    /* ========================================================
       LOAD IT PERSONNEL
    ======================================================== */

    useEffect(
        () => {
            let active =
                true;

            async function loadITPersonnel() {
                try {
                    setITLoading(
                        true
                    );

                    const response =
                        await dashboardApi
                            .troubleTicketITPersonnel();

                    const data =
                        readApiData<
                            ITEmployeeRaw[]
                        >(
                            response
                        ) ?? [];

                    if (!active) {
                        return;
                    }

                    setITPersonnel(
                        data
                            .map(
                                (
                                    employee
                                ): ITEmployeeOption => ({
                                    employee_id:
                                        text(
                                            employee.employee_id
                                        ),

                                    employee_name:
                                        text(
                                            employee.employee_name
                                        ),

                                    designation:
                                        text(
                                            employee.designation
                                        ),

                                    department:
                                        text(
                                            employee.department
                                        ),

                                    picture:
                                        resolvePicture(
                                            employee.picture
                                        ),
                                })
                            )
                            .filter(
                                (
                                    employee
                                ) =>
                                    Boolean(
                                        employee.employee_id &&
                                            employee.employee_name
                                    )
                            )
                    );
                } catch (
                    reason
                ) {
                    console.error(
                        "Unable to load IT personnel:",
                        reason
                    );
                } finally {
                    if (
                        active
                    ) {
                        setITLoading(
                            false
                        );
                    }
                }
            }

            void loadITPersonnel();

            return () => {
                active =
                    false;
            };
        },
        []
    );

    /* ========================================================
       EMPLOYEE SEARCH
    ======================================================== */

    useEffect(
        () => {
            const query =
                employeeQuery
                    .trim();

            if (
                form.employee_id &&
                query ===
                    form.employee_name
            ) {
                setEmployeeResults(
                    []
                );

                return;
            }

            if (
                query.length <
                2
            ) {
                setEmployeeResults(
                    []
                );

                setEmployeeSearching(
                    false
                );

                return;
            }

            const requestNumber =
                ++employeeRequestRef.current;

            const timer =
                window.setTimeout(
                    async () => {
                        try {
                            setEmployeeSearching(
                                true
                            );

                            const response =
                                await api.get<
                                    ApiOk<
                                        EmployeeSearchRaw[]
                                    >
                                >(
                                    `/employees/search?q=${encodeURIComponent(
                                        query
                                    )}`
                                );

                            if (
                                requestNumber !==
                                employeeRequestRef.current
                            ) {
                                return;
                            }

                            const raw =
                                readApiData<
                                    EmployeeSearchRaw[]
                                >(
                                    response
                                ) ?? [];

                            const results =
                                raw
                                    .map(
                                        normalizeEmployee
                                    )
                                    .filter(
                                        (
                                            employee
                                        ) =>
                                            Boolean(
                                                employee.employee_id &&
                                                    employee.employee_name
                                            )
                                    );

                            setEmployeeResults(
                                results
                            );

                            setEmployeeDropdownOpen(
                                true
                            );
                        } catch (
                            reason
                        ) {
                            console.error(
                                "Employee search failed:",
                                reason
                            );

                            if (
                                requestNumber ===
                                employeeRequestRef.current
                            ) {
                                setEmployeeResults(
                                    []
                                );
                            }
                        } finally {
                            if (
                                requestNumber ===
                                employeeRequestRef.current
                            ) {
                                setEmployeeSearching(
                                    false
                                );
                            }
                        }
                    },
                    300
                );

            return () =>
                window.clearTimeout(
                    timer
                );
        },
        [
            employeeQuery,
            form.employee_id,
            form.employee_name,
        ]
    );

    /* ========================================================
       FILTER IT PERSONNEL
    ======================================================== */

    const filteredITPersonnel =
        useMemo(
            () => {
                const query =
                    itQuery
                        .trim()
                        .toLowerCase();

                if (!query) {
                    return itPersonnel;
                }

                return itPersonnel.filter(
                    (
                        employee
                    ) =>
                        [
                            employee.employee_id,
                            employee.employee_name,
                            employee.designation,
                            employee.department,
                        ]
                            .join(
                                " "
                            )
                            .toLowerCase()
                            .includes(
                                query
                            )
                );
            },
            [
                itPersonnel,
                itQuery,
            ]
        );

    /* ========================================================
       REQUEST DISPLAY
    ======================================================== */

    const selectedRequest =
        useMemo(
            () =>
                REQUEST_TYPES.find(
                    (
                        item
                    ) =>
                        item.value ===
                        form.request_type
                ) ??
                REQUEST_TYPES[0],
            [
                form.request_type,
            ]
        );

    const isJoining =
        form.request_type ===
        "Joining";

    const dateLabel =
        isJoining
            ? "Joining Date"
            : form.request_type ===
                "Contract End"
            ? "Contract End Date"
            : form.request_type ===
                "Retirement"
            ? "Retirement Date"
            : "Last Working Date";

    const pageTitle =
        isJoining
            ? "Employee Joining IT Setup"
            : "Employee IT Clearance";

    const submitLabel =
        isJoining
            ? "Create & Assign Joining Task"
            : "Create & Assign Clearance";

    const isFormValid =
        Boolean(
            form.request_type &&
                form.effective_date &&
                form.employee_id &&
                form.employee_name &&
                form.assigned_to &&
                form.assigned_to_name
        ) &&
        form.employee_id !==
            form.assigned_to;

    /* ========================================================
       EMPLOYEE SELECTION
    ======================================================== */

    async function loadAssignedDevices(
        employeeID: string
    ) {
        const id =
            employeeID.trim();

        if (!id) {
            setAssignedDevices(
                []
            );

            return;
        }

        try {
            setDevicesLoading(
                true
            );

            setDevicesError(
                ""
            );

            const response =
                await deviceApi
                    .byEmployee(
                        id
                    );

            const devices =
                readApiData<
                    Device[]
                >(
                    response
                ) ?? [];

            setAssignedDevices(
                devices
            );
        } catch (
            reason
        ) {
            console.error(
                "Unable to load assigned devices:",
                reason
            );

            setAssignedDevices(
                []
            );

            setDevicesError(
                reason instanceof
                    Error
                    ? reason.message
                    : "Unable to load assigned device information."
            );
        } finally {
            setDevicesLoading(
                false
            );
        }
    }

    async function selectEmployee(
        employee: EmployeeOption
    ) {
        setForm(
            (
                previous
            ) => ({
                ...previous,

                employee_id:
                    employee.employee_id,

                employee_name:
                    employee.employee_name,

                designation:
                    employee.designation,

                department:
                    employee.department,

                work_field:
                    employee.work_field,

                phone:
                    employee.phone,

                email:
                    employee.email,

                employee_picture:
                    employee.picture,
            })
        );

        setEmployeeQuery(
            employee.employee_name
        );

        setEmployeeResults(
            []
        );

        setEmployeeDropdownOpen(
            false
        );

        setError(
            ""
        );

        void loadAssignedDevices(
            employee.employee_id
        );

        try {
            const response =
                await api.get<
                    ApiOk<
                        EmployeeDetailsRaw
                    >
                >(
                    `/employees/${encodeURIComponent(
                        employee.employee_id
                    )}`
                );

            const details =
                readApiData<
                    EmployeeDetailsRaw
                >(
                    response
                );

            if (!details) {
                return;
            }

            setForm(
                (
                    previous
                ) => {
                    if (
                        previous.employee_id !==
                        employee.employee_id
                    ) {
                        return previous;
                    }

                    return {
                        ...previous,

                        employee_name:
                            text(
                                details.employee_name
                            ) ||
                            previous.employee_name,

                        designation:
                            text(
                                details.designation
                            ) ||
                            previous.designation,

                        department:
                            text(
                                details.department ??
                                    details.department_name
                            ) ||
                            previous.department,

                        work_field:
                            text(
                                details.work_field
                            ) ||
                            previous.work_field,

                        phone:
                            text(
                                details.official_cell ??
                                    details.personal_cell
                            ) ||
                            previous.phone,

                        email:
                            text(
                                details.official_email ??
                                    details.email
                            ) ||
                            previous.email,

                        employee_picture:
                            resolvePicture(
                                details.picture
                            ) ||
                            previous.employee_picture,
                    };
                }
            );
        } catch (
            reason
        ) {
            console.error(
                "Unable to load employee details:",
                reason
            );
        }
    }

    function clearEmployee() {
        employeeRequestRef.current++;

        setEmployeeQuery(
            ""
        );

        setEmployeeResults(
            []
        );

        setEmployeeDropdownOpen(
            false
        );

        setAssignedDevices(
            []
        );

        setDevicesError(
            ""
        );

        setForm(
            (
                previous
            ) => ({
                ...previous,

                employee_id:
                    "",

                employee_name:
                    "",

                designation:
                    "",

                department:
                    "",

                work_field:
                    "",

                phone:
                    "",

                email:
                    "",

                employee_picture:
                    "",
            })
        );
    }

    /* ========================================================
       IT PERSONNEL SELECTION
    ======================================================== */

    function selectITPerson(
        employee: ITEmployeeOption
    ) {
        if (
            employee.employee_id ===
            form.employee_id
        ) {
            setError(
                "The selected employee cannot be assigned as the responsible IT person for the same request."
            );

            return;
        }

        setForm(
            (
                previous
            ) => ({
                ...previous,

                assigned_to:
                    employee.employee_id,

                assigned_to_name:
                    employee.employee_name,
            })
        );

        setITQuery(
            employee.employee_name
        );

        setITDropdownOpen(
            false
        );

        setError(
            ""
        );
    }

    function clearITPerson() {
        setITQuery(
            ""
        );

        setITDropdownOpen(
            false
        );

        setForm(
            (
                previous
            ) => ({
                ...previous,

                assigned_to:
                    "",

                assigned_to_name:
                    "",
            })
        );
    }

    /* ========================================================
       SUBMIT
    ======================================================== */

    async function handleSubmit() {
        if (
            !form.employee_id
        ) {
            setError(
                "Please select an employee."
            );

            return;
        }

        if (
            !form.effective_date
        ) {
            setError(
                `Please select the ${dateLabel.toLowerCase()}.`
            );

            return;
        }

        if (
            !form.assigned_to
        ) {
            setError(
                "Please assign an IT person to this request."
            );

            return;
        }

        if (
            form.employee_id ===
            form.assigned_to
        ) {
            setError(
                "The selected employee cannot be assigned as the responsible IT person for the same request."
            );

            return;
        }

        try {
            setLoading(
                true
            );

            setError(
                ""
            );

            /*
             * Keep the existing backend contract working:
             *
             * request_type  -> separation_mode
             * effective_date -> resignation_date
             *
             * We also send the professional semantic names.
             * Gin ignores unknown JSON fields, so this remains
             * backward-compatible with the existing API.
             */
            const response =
                await api.post<
                    ApiOk<
                        CreateRequestResult
                    >
                >(
                    "/device-clearances",
                    {
                        request_type:
                            form.request_type,

                        effective_date:
                            form.effective_date,

                        employee_id:
                            form.employee_id,

                        assigned_to:
                            form.assigned_to,

                        // Existing backend compatibility.
                        resignation_date:
                            form.effective_date,

                        separation_mode:
                            form.request_type,

                        remarks:
                            form.remarks.trim(),

                        /*
                         * The creation screen no longer performs
                         * operational checklist work.
                         *
                         * The assigned IT employee should complete
                         * the workflow later.
                         */
                        device_returned:
                            false,

                        vpn_removed:
                            false,

                        ip_phone_disabled:
                            false,

                        printer_access_removed:
                            false,

                        panda_removed:
                            false,
                    }
                );

            const result =
                readApiData<
                    CreateRequestResult
                >(
                    response
                );

            if (
                !result?.id
            ) {
                throw new Error(
                    "The request was created but no request ID was returned."
                );
            }

            /*
             * This screen is for creation + assignment.
             * After creation, return to the work queue/list.
             */
            router.push(
                "/dashboard/device-clearance/clearance-list"
            );
        } catch (
            reason
        ) {
            setError(
                reason instanceof
                    Error
                    ? reason.message
                    : "Unable to create the IT lifecycle request."
            );
        } finally {
            setLoading(
                false
            );
        }
    }

    /* ========================================================
       UI
    ======================================================== */

    return (
        <div className="w-full p-4 sm:p-6">
            <div className="mx-auto w-full max-w-[1600px] space-y-5">
                {/* HEADER */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">
                            {pageTitle}
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Create an employee IT lifecycle request and assign responsibility to IT personnel.
                        </p>
                    </div>

                    <div
                        className={`
                            inline-flex
                            w-fit
                            items-center
                            gap-1.5
                            rounded-full
                            border
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            ${
                                isFormValid
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                            }
                        `}
                    >
                        {isFormValid ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                            <BriefcaseBusiness className="h-3.5 w-3.5" />
                        )}

                        {isFormValid
                            ? "Ready to Assign"
                            : "Information Required"}
                    </div>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* REQUEST TYPE CARD */}

                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-sm font-semibold text-foreground">
                            Request Details
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Select the employee lifecycle event and the date when IT action is required.
                        </p>
                    </div>

                    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <FieldLabel required>
                                    Lifecycle Event
                                </FieldLabel>

                                <select
                                    value={
                                        form.request_type
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,

                                                request_type:
                                                    event
                                                        .target
                                                        .value as
                                                        RequestType,
                                            })
                                        )
                                    }
                                    className="
                                        h-11
                                        w-full
                                        rounded-lg
                                        border
                                        border-input
                                        bg-background
                                        px-3
                                        text-sm
                                        font-medium
                                        text-foreground
                                        outline-none
                                        transition
                                        focus:border-primary
                                        focus:ring-2
                                        focus:ring-primary/20
                                    "
                                >
                                    {REQUEST_TYPES.map(
                                        (
                                            item
                                        ) => (
                                            <option
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {item.label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <FieldLabel required>
                                    {dateLabel}
                                </FieldLabel>

                                <div className="relative">
                                    <CalendarDays
                                        className="
                                            pointer-events-none
                                            absolute
                                            left-3
                                            top-1/2
                                            h-4
                                            w-4
                                            -translate-y-1/2
                                            text-muted-foreground
                                        "
                                    />

                                    <Input
                                        type="date"
                                        value={
                                            form.effective_date
                                        }
                                        className="h-11 pl-9"
                                        onChange={(
                                            event
                                        ) =>
                                            setForm(
                                                (
                                                    previous
                                                ) => ({
                                                    ...previous,

                                                    effective_date:
                                                        event
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            className={`
                                rounded-xl
                                border
                                p-4
                                ${
                                    isJoining
                                        ? "border-blue-200 bg-blue-50/70"
                                        : "border-amber-200 bg-amber-50/70"
                                }
                            `}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        ${
                                            isJoining
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-amber-100 text-amber-700"
                                        }
                                    `}
                                >
                                    {isJoining ? (
                                        <UserPlus className="h-5 w-5" />
                                    ) : (
                                        <BriefcaseBusiness className="h-5 w-5" />
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {selectedRequest.label} Workflow
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        {selectedRequest.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* EMPLOYEE CARD */}

                <section className="overflow-visible rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-sm font-semibold text-foreground">
                            Employee Information
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Search HRIS by employee name or ID. Employee details and photo are populated automatically.
                        </p>
                    </div>

                    <div className="p-5">
                        <div className="grid gap-6 xl:grid-cols-[180px_minmax(0,1fr)]">
                            {/* PHOTO */}

                            <div className="flex flex-col items-center">
                                <EmployeeAvatar
                                    name={
                                        form.employee_name
                                    }
                                    picture={
                                        form.employee_picture
                                    }
                                    large
                                />

                                {form.employee_id && (
                                    <div className="mt-3 text-center">
                                        <p className="text-sm font-semibold text-foreground">
                                            {form.employee_name}
                                        </p>

                                        <p className="mt-0.5 text-xs font-semibold text-primary">
                                            {form.employee_id}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* FIELDS */}

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="relative md:col-span-2 xl:col-span-2">
                                    <FieldLabel required>
                                        Employee
                                    </FieldLabel>

                                    <div className="relative">
                                        <Search
                                            className="
                                                pointer-events-none
                                                absolute
                                                left-3
                                                top-1/2
                                                z-10
                                                h-4
                                                w-4
                                                -translate-y-1/2
                                                text-muted-foreground
                                            "
                                        />

                                        <Input
                                            value={
                                                employeeQuery
                                            }
                                            autoComplete="off"
                                            placeholder="Search employee by name or employee ID..."
                                            className="h-11 pl-9 pr-10"
                                            onFocus={() => {
                                                if (
                                                    employeeQuery
                                                        .trim()
                                                        .length >=
                                                    2
                                                ) {
                                                    setEmployeeDropdownOpen(
                                                        true
                                                    );
                                                }
                                            }}
                                            onChange={(
                                                event
                                            ) => {
                                                const value =
                                                    event
                                                        .target
                                                        .value;

                                                setEmployeeQuery(
                                                    value
                                                );

                                                if (
                                                    form.employee_id &&
                                                    value !==
                                                        form.employee_name
                                                ) {
                                                    clearEmployee();

                                                    setEmployeeQuery(
                                                        value
                                                    );
                                                }

                                                setEmployeeDropdownOpen(
                                                    true
                                                );
                                            }}
                                            onBlur={() => {
                                                window.setTimeout(
                                                    () =>
                                                        setEmployeeDropdownOpen(
                                                            false
                                                        ),
                                                    180
                                                );
                                            }}
                                        />

                                        {employeeSearching ? (
                                            <Loader2
                                                className="
                                                    absolute
                                                    right-3
                                                    top-1/2
                                                    h-4
                                                    w-4
                                                    -translate-y-1/2
                                                    animate-spin
                                                    text-primary
                                                "
                                            />
                                        ) : form.employee_id ? (
                                            <button
                                                type="button"
                                                aria-label="Clear employee"
                                                onMouseDown={(
                                                    event
                                                ) =>
                                                    event.preventDefault()
                                                }
                                                onClick={
                                                    clearEmployee
                                                }
                                                className="
                                                    absolute
                                                    right-2.5
                                                    top-1/2
                                                    -translate-y-1/2
                                                    rounded-md
                                                    p-1
                                                    text-muted-foreground
                                                    transition
                                                    hover:bg-muted
                                                    hover:text-foreground
                                                "
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        ) : null}

                                        {employeeDropdownOpen &&
                                            employeeQuery
                                                .trim()
                                                .length >=
                                                2 && (
                                                <div
                                                    className="
                                                        absolute
                                                        left-0
                                                        right-0
                                                        top-[calc(100%+6px)]
                                                        z-[80]
                                                        max-h-[420px]
                                                        overflow-y-auto
                                                        rounded-xl
                                                        border
                                                        border-border
                                                        bg-popover
                                                        shadow-xl
                                                    "
                                                >
                                                    {employeeSearching &&
                                                    employeeResults.length ===
                                                        0 ? (
                                                        <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Searching employees...
                                                        </div>
                                                    ) : employeeResults.length >
                                                      0 ? (
                                                        <div className="divide-y divide-border">
                                                            {employeeResults.map(
                                                                (
                                                                    employee
                                                                ) => (
                                                                    <button
                                                                        key={
                                                                            employee.employee_id
                                                                        }
                                                                        type="button"
                                                                        onMouseDown={(
                                                                            event
                                                                        ) =>
                                                                            event.preventDefault()
                                                                        }
                                                                        onClick={() =>
                                                                            void selectEmployee(
                                                                                employee
                                                                            )
                                                                        }
                                                                        className="
                                                                            flex
                                                                            w-full
                                                                            items-center
                                                                            gap-3
                                                                            px-4
                                                                            py-3
                                                                            text-left
                                                                            transition-colors
                                                                            hover:bg-muted/70
                                                                        "
                                                                    >
                                                                        <EmployeeAvatar
                                                                            name={
                                                                                employee.employee_name
                                                                            }
                                                                            picture={
                                                                                employee.picture
                                                                            }
                                                                        />

                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex flex-wrap items-center gap-x-2">
                                                                                <span className="text-sm font-semibold text-foreground">
                                                                                    {employee.employee_name}
                                                                                </span>

                                                                                <span className="text-xs font-semibold text-primary">
                                                                                    ({employee.employee_id})
                                                                                </span>
                                                                            </div>

                                                                            <p className="mt-1 truncate text-xs text-muted-foreground">
                                                                                {employee.department ||
                                                                                    employee.designation ||
                                                                                    "Employee"}
                                                                            </p>

                                                                            {employee.designation &&
                                                                                employee.department && (
                                                                                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                                                                                        {employee.designation}
                                                                                    </p>
                                                                                )}
                                                                        </div>
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : (
                                                        !employeeSearching && (
                                                            <div className="px-4 py-8 text-center">
                                                                <UserRound className="mx-auto h-7 w-7 text-muted-foreground/50" />

                                                                <p className="mt-2 text-sm font-medium text-foreground">
                                                                    No employee found
                                                                </p>

                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    Search using employee name or employee ID.
                                                                </p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <ReadOnlyField
                                    label="Employee ID"
                                    value={
                                        form.employee_id
                                    }
                                />

                                <ReadOnlyField
                                    label="Designation"
                                    value={
                                        form.designation
                                    }
                                />

                                <ReadOnlyField
                                    label="Department"
                                    value={
                                        form.department
                                    }
                                />

                                <ReadOnlyField
                                    label="Work Field"
                                    value={
                                        form.work_field
                                    }
                                />

                                <ReadOnlyField
                                    label="Phone"
                                    value={
                                        form.phone
                                    }
                                />

                                <ReadOnlyField
                                    label="Email"
                                    value={
                                        form.email
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* JOINING / EXIT CONTEXT CARD */}

                {isJoining ? (
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-sm font-semibold text-foreground">
                                Joining IT Preparation
                            </h2>

                            <p className="mt-1 text-xs text-muted-foreground">
                                The assigned IT employee will complete these setup activities after the task is created.
                            </p>
                        </div>

                        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                            <PreparationCard
                                icon={
                                    <KeyRound className="h-5 w-5" />
                                }
                                title="Account & Access"
                                description="Prepare corporate account, email and standard access."
                            />

                            <PreparationCard
                                icon={
                                    <Laptop className="h-5 w-5" />
                                }
                                title="Device Provisioning"
                                description="Allocate and configure the required workstation or laptop."
                            />

                            <PreparationCard
                                icon={
                                    <Network className="h-5 w-5" />
                                }
                                title="VPN Access"
                                description="Enable the required VPN profile and remote-access permissions for the employee."
                            />

                            <PreparationCard
                                icon={
                                    <Printer className="h-5 w-5" />
                                }
                                title="Printer Access"
                                description="Grant approved printer and print-server access based on the employee role."
                            />

                            <PreparationCard
                                icon={
                                    <Network className="h-5 w-5" />
                                }
                                title="Network Services"
                                description="Configure the employee network profile, IP phone and standard connectivity services."
                            />

                            <PreparationCard
                                icon={
                                    <ShieldCheck className="h-5 w-5" />
                                }
                                title="Security Baseline"
                                description="Apply endpoint security and standard IT security controls."
                            />
                        </div>
                    </section>
                ) : (
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <HardDrive className="h-4 w-4 text-primary" />
                                    Assigned Device Information
                                </h2>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Current IT equipment linked to the selected employee.
                                </p>
                            </div>

                            {form.employee_id &&
                                !devicesLoading && (
                                    <span className="inline-flex w-fit rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">
                                        {assignedDevices.length}{" "}
                                        {assignedDevices.length ===
                                        1
                                            ? "device"
                                            : "devices"}
                                    </span>
                                )}
                        </div>

                        <div className="p-5">
                            {!form.employee_id ? (
                                <EmptyState
                                    title="Select an employee first"
                                    description="Assigned device information will load after employee selection."
                                />
                            ) : devicesLoading ? (
                                <div className="flex min-h-[120px] items-center justify-center gap-2 rounded-xl border border-border bg-muted/15 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    Loading assigned devices...
                                </div>
                            ) : devicesError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
                                    <p className="text-sm font-medium text-red-700">
                                        Unable to load assigned devices
                                    </p>

                                    <p className="mt-1 text-xs text-red-600">
                                        {devicesError}
                                    </p>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() =>
                                            void loadAssignedDevices(
                                                form.employee_id
                                            )
                                        }
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            ) : assignedDevices.length ===
                              0 ? (
                                <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 text-center">
                                    <PackageOpen className="h-8 w-8 text-emerald-600/70" />

                                    <p className="mt-2 text-sm font-semibold text-emerald-800">
                                        No assigned IT device found
                                    </p>

                                    <p className="mt-1 text-xs text-emerald-700/80">
                                        No equipment is currently linked to this employee.
                                    </p>
                                </div>
                            ) : (
                                <DeviceTable
                                    devices={
                                        assignedDevices
                                    }
                                />
                            )}
                        </div>
                    </section>
                )}

                {/* ASSIGNMENT CARD */}

                <section className="overflow-visible rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <UserCheck className="h-4 w-4 text-primary" />
                            IT Personnel Assignment
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Assign one IT employee who will own and complete this lifecycle task.
                        </p>
                    </div>

                    <div className="grid gap-5 p-5 lg:grid-cols-2">
                        <div className="relative">
                            <FieldLabel required>
                                Responsible IT Person
                            </FieldLabel>

                            <div className="relative">
                                <Search
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-3
                                        top-1/2
                                        z-10
                                        h-4
                                        w-4
                                        -translate-y-1/2
                                        text-muted-foreground
                                    "
                                />

                                <Input
                                    value={
                                        itQuery
                                    }
                                    placeholder={
                                        itLoading
                                            ? "Loading IT personnel..."
                                            : "Search IT personnel by name or employee ID..."
                                    }
                                    disabled={
                                        itLoading
                                    }
                                    autoComplete="off"
                                    className="h-11 pl-9 pr-10"
                                    onFocus={() =>
                                        setITDropdownOpen(
                                            true
                                        )
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setITQuery(
                                            event
                                                .target
                                                .value
                                        );

                                        if (
                                            form.assigned_to
                                        ) {
                                            setForm(
                                                (
                                                    previous
                                                ) => ({
                                                    ...previous,

                                                    assigned_to:
                                                        "",

                                                    assigned_to_name:
                                                        "",
                                                })
                                            );
                                        }

                                        setITDropdownOpen(
                                            true
                                        );
                                    }}
                                    onBlur={() => {
                                        window.setTimeout(
                                            () =>
                                                setITDropdownOpen(
                                                    false
                                                ),
                                            180
                                        );
                                    }}
                                />

                                {itLoading ? (
                                    <Loader2
                                        className="
                                            absolute
                                            right-3
                                            top-1/2
                                            h-4
                                            w-4
                                            -translate-y-1/2
                                            animate-spin
                                            text-primary
                                        "
                                    />
                                ) : form.assigned_to ? (
                                    <button
                                        type="button"
                                        aria-label="Clear assigned IT person"
                                        onMouseDown={(
                                            event
                                        ) =>
                                            event.preventDefault()
                                        }
                                        onClick={
                                            clearITPerson
                                        }
                                        className="
                                            absolute
                                            right-2.5
                                            top-1/2
                                            -translate-y-1/2
                                            rounded-md
                                            p-1
                                            text-muted-foreground
                                            transition
                                            hover:bg-muted
                                            hover:text-foreground
                                        "
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <ChevronDown
                                        className="
                                            pointer-events-none
                                            absolute
                                            right-3
                                            top-1/2
                                            h-4
                                            w-4
                                            -translate-y-1/2
                                            text-muted-foreground
                                        "
                                    />
                                )}

                                {itDropdownOpen &&
                                    !itLoading && (
                                        <div
                                            className="
                                                absolute
                                                left-0
                                                right-0
                                                top-[calc(100%+6px)]
                                                z-[70]
                                                max-h-[380px]
                                                overflow-y-auto
                                                rounded-xl
                                                border
                                                border-border
                                                bg-popover
                                                shadow-xl
                                            "
                                        >
                                            {filteredITPersonnel.length >
                                            0 ? (
                                                <div className="divide-y divide-border">
                                                    {filteredITPersonnel.map(
                                                        (
                                                            employee
                                                        ) => {
                                                            const isSameEmployee =
                                                                employee.employee_id ===
                                                                form.employee_id;

                                                            return (
                                                                <button
                                                                    key={
                                                                        employee.employee_id
                                                                    }
                                                                    type="button"
                                                                    disabled={
                                                                        isSameEmployee
                                                                    }
                                                                    onMouseDown={(
                                                                        event
                                                                    ) =>
                                                                        event.preventDefault()
                                                                    }
                                                                    onClick={() =>
                                                                        selectITPerson(
                                                                            employee
                                                                        )
                                                                    }
                                                                    className="
                                                                        flex
                                                                        w-full
                                                                        items-center
                                                                        gap-3
                                                                        px-4
                                                                        py-3
                                                                        text-left
                                                                        transition-colors
                                                                        hover:bg-muted/70
                                                                        disabled:cursor-not-allowed
                                                                        disabled:opacity-45
                                                                    "
                                                                >
                                                                    <EmployeeAvatar
                                                                        name={
                                                                            employee.employee_name
                                                                        }
                                                                        picture={
                                                                            employee.picture
                                                                        }
                                                                    />

                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex flex-wrap items-center gap-x-2">
                                                                            <span className="text-sm font-semibold text-foreground">
                                                                                {employee.employee_name}
                                                                            </span>

                                                                            <span className="text-xs font-semibold text-primary">
                                                                                ({employee.employee_id})
                                                                            </span>
                                                                        </div>

                                                                        <p className="mt-1 truncate text-xs text-muted-foreground">
                                                                            {isSameEmployee
                                                                                ? "Cannot assign the same employee"
                                                                                : employee.department ||
                                                                                  employee.designation ||
                                                                                  "IT"}
                                                                        </p>

                                                                        {employee.designation &&
                                                                            !isSameEmployee && (
                                                                                <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                                                                                    {employee.designation}
                                                                                </p>
                                                                            )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                    No IT personnel found.
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        </div>

                        <div>
                            <FieldLabel>
                                Assignment Summary
                            </FieldLabel>

                            <div
                                className="
                                    min-h-[92px]
                                    rounded-xl
                                    border
                                    border-border
                                    bg-muted/20
                                    p-4
                                "
                            >
                                {form.assigned_to ? (
                                    <div className="flex items-center gap-3">
                                        <EmployeeAvatar
                                            name={
                                                form.assigned_to_name
                                            }
                                            picture={
                                                itPersonnel.find(
                                                    (
                                                        employee
                                                    ) =>
                                                        employee.employee_id ===
                                                        form.assigned_to
                                                )
                                                    ?.picture ??
                                                ""
                                            }
                                        />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {form.assigned_to_name}
                                            </p>

                                            <p className="mt-0.5 text-xs font-medium text-primary">
                                                {form.assigned_to}
                                            </p>

                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                Responsible for the {form.request_type.toLowerCase()} IT workflow.
                                            </p>
                                        </div>

                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                            Assigned
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex min-h-[58px] items-center gap-3 text-muted-foreground">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                            <UserCheck className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                No IT person assigned
                                            </p>

                                            <p className="mt-0.5 text-xs">
                                                Select the responsible IT employee from the search field.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* REMARKS */}

                <section className="rounded-2xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-sm font-semibold text-foreground">
                            Additional Notes
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Add any information the assigned IT person should know before starting the task.
                        </p>
                    </div>

                    <div className="p-5">
                        <textarea
                            value={
                                form.remarks
                            }
                            onChange={(
                                event
                            ) =>
                                setForm(
                                    (
                                        previous
                                    ) => ({
                                        ...previous,

                                        remarks:
                                            event
                                                .target
                                                .value,
                                    })
                                )
                            }
                            placeholder={
                                isJoining
                                    ? "Example: Joining department, workstation requirement, special software or access..."
                                    : "Example: Asset handover notes, access dependencies or special clearance instructions..."
                            }
                            rows={4}
                            maxLength={
                                2000
                            }
                            className="
                                w-full
                                resize-y
                                rounded-xl
                                border
                                border-input
                                bg-background
                                px-3
                                py-2.5
                                text-sm
                                text-foreground
                                outline-none
                                transition
                                placeholder:text-muted-foreground
                                focus:border-primary
                                focus:ring-2
                                focus:ring-primary/20
                            "
                        />

                        <div className="mt-1 text-right text-[10px] text-muted-foreground">
                            {form.remarks.length}
                            /2000
                        </div>
                    </div>
                </section>

                {/* WORKFLOW MESSAGE */}

                <div
                    className={`
                        rounded-xl
                        border
                        px-4
                        py-3
                        text-sm
                        ${
                            isJoining
                                ? "border-blue-200 bg-blue-50 text-blue-800"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                        }
                    `}
                >
                    <strong>
                        Workflow:
                    </strong>{" "}
                    This screen creates and assigns the request only. Operational IT work should be completed by the assigned IT person after assignment.
                </div>

                {/* ACTIONS */}

                <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={
                            loading
                        }
                        onClick={() =>
                            router.back()
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        disabled={
                            !isFormValid ||
                            loading
                        }
                        onClick={() =>
                            void handleSubmit()
                        }
                        className="min-w-[230px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                {submitLabel}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   SUPPORTING COMPONENTS
============================================================ */

function FieldLabel({
    children,
    required = false,
}: {
    children:
        React.ReactNode;

    required?:
        boolean;
}) {
    return (
        <label className="mb-1.5 block text-xs font-semibold text-foreground">
            {children}

            {required && (
                <span className="ml-0.5 text-red-500">
                    *
                </span>
            )}
        </label>
    );
}

function ReadOnlyField({
    label,
    value,
}: {
    label:
        string;

    value:
        string;
}) {
    return (
        <div>
            <FieldLabel>
                {label}
            </FieldLabel>

            <Input
                value={
                    value
                }
                readOnly
                placeholder="Auto-filled"
                className="h-11 cursor-default bg-muted/35 text-foreground"
            />
        </div>
    );
}

function PreparationCard({
    icon,
    title,
    description,
}: {
    icon:
        React.ReactNode;

    title:
        string;

    description:
        string;
}) {
    return (
        <div className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
            </div>

            <p className="mt-3 text-sm font-semibold text-foreground">
                {title}
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
            </p>
        </div>
    );
}

function EmptyState({
    title,
    description,
}: {
    title:
        string;

    description:
        string;
}) {
    return (
        <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 px-4 text-center">
            <HardDrive className="h-8 w-8 text-muted-foreground/40" />

            <p className="mt-2 text-sm font-medium text-foreground">
                {title}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
                {description}
            </p>
        </div>
    );
}

function DeviceTable({
    devices,
}: {
    devices:
        Device[];
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                    <thead className="bg-muted/40">
                        <tr className="border-b border-border">
                            <DeviceHead>
                                Device
                            </DeviceHead>

                            <DeviceHead>
                                Brand / Model
                            </DeviceHead>

                            <DeviceHead>
                                Serial Number
                            </DeviceHead>

                            <DeviceHead>
                                Status
                            </DeviceHead>

                            <DeviceHead>
                                Assigned Date
                            </DeviceHead>

                            <DeviceHead>
                                IP Address
                            </DeviceHead>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                        {devices.map(
                            (
                                device
                            ) => (
                                <tr
                                    key={
                                        device.id
                                    }
                                    className="bg-card transition-colors hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 align-top">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5">
                                                <HardDrive className="h-4 w-4 text-primary" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {text(
                                                        device.category
                                                    ) ||
                                                        "Device"}
                                                </p>

                                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                    Asset ID: {device.id}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        <p className="text-sm font-medium text-foreground">
                                            {text(
                                                device.brand
                                            ) ||
                                                "—"}
                                        </p>

                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {text(
                                                device.model_no
                                            ) ||
                                                "No model"}
                                        </p>
                                    </td>

                                    <td className="px-4 py-3 align-top font-mono text-xs text-foreground">
                                        {text(
                                            device.device_serial
                                        ) ||
                                            "—"}
                                    </td>

                                    <td className="px-4 py-3 align-top">
                                        <DeviceStatusBadge
                                            status={
                                                device.status
                                            }
                                        />
                                    </td>

                                    <td className="px-4 py-3 align-top text-xs text-foreground">
                                        {formatDeviceDate(
                                            device.assign_date
                                        )}
                                    </td>

                                    <td className="px-4 py-3 align-top font-mono text-xs text-foreground">
                                        {text(
                                            device.ip_address
                                        ) ||
                                            "—"}
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DeviceHead({
    children,
}: {
    children:
        React.ReactNode;
}) {
    return (
        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </th>
    );
}

function DeviceStatusBadge({
    status,
}: {
    status:
        | string
        | null
        | undefined;
}) {
    const value =
        text(
            status
        ) ||
        "Unknown";

    const key =
        value.toLowerCase();

    const classes =
        key ===
            "assigned" ||
        key ===
            "1"
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : key ===
                  "returned" ||
              key ===
                  "4"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : key ===
                  "transferred" ||
              key ===
                  "transfer" ||
              key ===
                  "3"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-border bg-muted/40 text-muted-foreground";

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
                ${classes}
            `}
        >
            {value}
        </span>
    );
}

function EmployeeAvatar({
    name,
    picture,
    large = false,
}: {
    name:
        string;

    picture:
        string;

    large?:
        boolean;
}) {
    const [
        imageFailed,
        setImageFailed,
    ] =
        useState(
            false
        );

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

    const sizeClass =
        large
            ? "h-28 w-28 text-xl"
            : "h-11 w-11 text-xs";

    if (
        picture &&
        !imageFailed
    ) {
        return (
            <img
                src={
                    picture
                }
                alt={
                    name ||
                    "Employee"
                }
                loading={
                    large
                        ? "eager"
                        : "lazy"
                }
                referrerPolicy="no-referrer"
                onError={() =>
                    setImageFailed(
                        true
                    )
                }
                className={`
                    ${sizeClass}
                    shrink-0
                    rounded-full
                    border
                    border-border
                    bg-muted
                    object-cover
                    shadow-sm
                `}
            />
        );
    }

    return (
        <div
            className={`
                ${sizeClass}
                flex
                shrink-0
                items-center
                justify-center
                rounded-full
                border
                border-primary/15
                bg-primary/10
                font-bold
                text-primary
            `}
        >
            {name ? (
                getInitials(
                    name
                )
            ) : (
                <UserRound
                    className={
                        large
                            ? "h-9 w-9"
                            : "h-5 w-5"
                    }
                />
            )}
        </div>
    );
}
