//frontend/app/dashboard/operations/create_tt/page.tsx

"use client";

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import {
    api,
    ownDashboardApi,
    ticketApi,
    OwnEmployeeProfile,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    User,
    Building2,
    BriefcaseBusiness,
    Phone,
    Mail,
    Ticket,
    FileText,
    Paperclip,
    Loader2,
    ArrowLeft,
    Send,
    CheckCircle2,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

interface FaultType {
    id: number;
    fault_name: string;
    fault_register?: string | null;
    fault_desc?: string | null;
    status?: number | null;
}

interface FaultTypesResponse {
    success: boolean;
    data: FaultType[];
}

interface CreateTicketResponse {
    success: boolean;
    data: {
        id: number;
        tt_no: number;
    };
}

/* ============================================================
   PAGE
============================================================ */

export default function CreateTTPage() {
    const router = useRouter();

    /* ========================================================
       EMPLOYEE
    ======================================================== */

    const [
        employee,
        setEmployee,
    ] = useState<OwnEmployeeProfile | null>(
        null
    );

    const [
        loadingEmployee,
        setLoadingEmployee,
    ] = useState(true);

    /* ========================================================
       FAULT TYPES
    ======================================================== */

    const [
        faults,
        setFaults,
    ] = useState<FaultType[]>([]);

    const [
        loadingFaults,
        setLoadingFaults,
    ] = useState(true);

    /* ========================================================
       FORM
    ======================================================== */

    const [
        selectedFault,
        setSelectedFault,
    ] = useState("");

    const [
        description,
        setDescription,
    ] = useState("");

    const [
        attachment,
        setAttachment,
    ] = useState<File | null>(null);

    /* ========================================================
       UI STATE
    ======================================================== */

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState("");

    /* ========================================================
       LOAD AUTHENTICATED EMPLOYEE
       
       GET /api/v1/user/dashboard

       employee_id is resolved by backend from JWT.
       We do NOT send employee_id from the browser.
    ======================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadEmployee() {
            try {
                setLoadingEmployee(true);
                setError("");

                const response =
                    await ownDashboardApi.dashboard();

                if (!mounted) {
                    return;
                }

                if (
                    !response ||
                    !response.data ||
                    !response.data.employee
                ) {
                    throw new Error(
                        "Employee information was not found."
                    );
                }

                setEmployee(
                    response.data.employee
                );
            } catch (
            reason: unknown
            ) {
                console.error(
                    "Unable to load employee information:",
                    reason
                );

                if (!mounted) {
                    return;
                }

                setEmployee(null);

                setError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load your employee information."
                );
            } finally {
                if (mounted) {
                    setLoadingEmployee(false);
                }
            }
        }

        void loadEmployee();

        return () => {
            mounted = false;
        };
    }, []);

    /* ========================================================
       LOAD FAULT TYPES

       IMPORTANT:
       This expects:

       GET /api/v1/tickets/fault-types

       Backend response:

       {
           "success": true,
           "data": [...]
       }
    ======================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadFaultTypes() {
            try {
                setLoadingFaults(true);

                /*
                 * Do not overwrite the employee error here.
                 */
                const response =
                    await ticketApi.faultTypes();

                if (!mounted) {
                    return;
                }

                const list =
                    response?.data ?? [];

                /*
                 * Only active fault types.
                 *
                 * If backend does not send status,
                 * the item remains selectable.
                 */
                const activeFaults =
                    list.filter(
                        (fault) =>
                            fault.status ===
                            undefined ||
                            fault.status ===
                            null ||
                            fault.status ===
                            1
                    );

                /*
                 * Remove duplicate IDs.
                 */
                const uniqueFaults =
                    Array.from(
                        new Map(
                            activeFaults.map(
                                (fault) => [
                                    fault.id,
                                    fault,
                                ]
                            )
                        ).values()
                    );

                setFaults(
                    uniqueFaults
                );
            } catch (
            reason: unknown
            ) {
                console.error(
                    "Unable to load fault types:",
                    reason
                );

                if (!mounted) {
                    return;
                }

                setFaults([]);

                setError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load fault types."
                );
            } finally {
                if (mounted) {
                    setLoadingFaults(false);
                }
            }
        }

        void loadFaultTypes();

        return () => {
            mounted = false;
        };
    }, []);

    /* ========================================================
       ATTACHMENT
       
       Current backend TicketHandler.Create() accepts JSON,
       not multipart/form-data.

       Therefore we validate/select the file here, but do not
       send it to the current Create API yet.
    ======================================================== */

    function handleAttachment(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0] ??
            null;

        if (!file) {
            setAttachment(null);
            return;
        }

        const maxFileSize =
            5 * 1024 * 1024;

        if (
            file.size >
            maxFileSize
        ) {
            setAttachment(null);

            event.target.value = "";

            setError(
                "Attachment size must not exceed 5 MB."
            );

            return;
        }

        setError("");

        setAttachment(file);
    }

    /* ========================================================
       SUBMIT
       
       Current backend expects:

       {
           reason_of_problem,
           client_name,
           department,
           phone,
           email,
           fault_type
       }

       employee_id is NOT sent.

       Backend gets it from JWT.
    ======================================================== */

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        /* -----------------------------------------------
           Employee validation
        ------------------------------------------------ */

        if (!employee) {
            setError(
                "Unable to identify the authenticated employee."
            );

            return;
        }

        /* -----------------------------------------------
           Fault validation
        ------------------------------------------------ */

        if (!selectedFault) {
            setError(
                "Please select a fault type."
            );

            return;
        }

        /* -----------------------------------------------
           Description validation
        ------------------------------------------------ */

        const cleanDescription =
            description.trim();

        if (!cleanDescription) {
            setError(
                "Please enter a description."
            );

            return;
        }

        if (
            cleanDescription.length <
            3
        ) {
            setError(
                "Description must contain at least 3 characters."
            );

            return;
        }

        /* -----------------------------------------------
           Submit
        ------------------------------------------------ */

        try {
            setSubmitting(true);

            const faultType =
                Number(
                    selectedFault
                );

            if (
                !Number.isInteger(
                    faultType
                ) ||
                faultType <= 0
            ) {
                throw new Error(
                    "Invalid fault type."
                );
            }

            /*
             * IMPORTANT:
             *
             * employee_id is intentionally NOT included.
             *
             * The Go backend does:
             *
             * empID := c.GetString("employee_id")
             *
             * and therefore uses the authenticated JWT.
             */
            const payload = {
                reason_of_problem:
                    cleanDescription,

                client_name:
                    employee.employee_name,

                department:
                    employee.department ||
                    null,

                phone:
                    employee.official_cell ||
                    employee.personal_cell ||
                    null,

                email:
                    employee.official_email ||
                    employee.email ||
                    null,

                fault_type:
                    faultType,
            };

            const response =
                await ticketApi.create(
                    payload
                );

            const ticket =
                response?.data;

            setSuccess(
                ticket?.tt_no
                    ? `Trouble ticket ${ticket.tt_no} created successfully.`
                    : "Trouble ticket created successfully."
            );

            /* -------------------------------------------
               Reset form
            -------------------------------------------- */

            setSelectedFault("");

            setDescription("");

            setAttachment(null);

            const fileInput =
                document.getElementById(
                    "attachment"
                ) as HTMLInputElement | null;

            if (fileInput) {
                fileInput.value = "";
            }

            /* -------------------------------------------
               Redirect
            -------------------------------------------- */

            window.setTimeout(() => {
                router.push(
                    "/dashboard/operations/trouble-tickets"
                );
            }, 1200);
        } catch (
        reason: unknown
        ) {
            console.error(
                "Create ticket error:",
                reason
            );

            setError(
                reason instanceof Error
                    ? reason.message
                    : "Failed to create trouble ticket."
            );
        } finally {
            setSubmitting(false);
        }
    }

    /* ========================================================
       LOADING
    ======================================================== */

    if (loadingEmployee) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Loader2 className="h-5 w-5 animate-spin" />

                    <span>
                        Loading your employee information...
                    </span>
                </div>
            </div>
        );
    }

    /* ========================================================
       PAGE
    ======================================================== */

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>
                                Dashboard
                            </span>

                            <span>
                                /
                            </span>

                            <span>
                                Operations
                            </span>

                            <span>
                                /
                            </span>

                            <span className="font-medium text-blue-600">
                                Create Trouble Ticket
                            </span>
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                <Ticket className="h-5 w-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Create Trouble Ticket
                                </h1>

                                <p className="text-sm text-slate-500">
                                    Submit a new IT support request
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            router.back()
                        }
                        className="gap-2"
                        disabled={
                            submitting
                        }
                    >
                        <ArrowLeft className="h-4 w-4" />

                        Back
                    </Button>
                </div>

                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span className="font-semibold">
                            Error:
                        </span>

                        <span>
                            {error}
                        </span>
                    </div>
                )}

                {/* ==================================================
                    SUCCESS
                ================================================== */}

                {success && (
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        <CheckCircle2 className="h-5 w-5" />

                        <span>
                            {success}
                        </span>
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                        {/* ==================================================
                            REQUESTER INFORMATION
                        ================================================== */}

                        <Card className="border-slate-200 shadow-sm lg:col-span-1">
                            <CardHeader className="border-b bg-slate-50/70">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="h-5 w-5 text-blue-600" />

                                    Requester Information
                                </CardTitle>

                                <CardDescription>
                                    Automatically loaded from your authenticated account
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-5 pt-6">

                                {/* Name */}

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Employee Name
                                    </Label>

                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                                        <Input
                                            value={
                                                employee?.employee_name ??
                                                ""
                                            }
                                            readOnly
                                            className="bg-slate-50 pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Employee ID */}

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Employee ID
                                    </Label>

                                    <div className="relative">
                                        <Ticket className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                                        <Input
                                            value={
                                                employee?.employee_id ??
                                                ""
                                            }
                                            readOnly
                                            className="bg-slate-50 pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Designation */}

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Designation
                                    </Label>

                                    <div className="relative">
                                        <BriefcaseBusiness className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                                        <Input
                                            value={
                                                employee?.designation ??
                                                ""
                                            }
                                            readOnly
                                            className="bg-slate-50 pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Department */}

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Department
                                    </Label>

                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                                        <Input
                                            value={
                                                employee?.department ??
                                                ""
                                            }
                                            readOnly
                                            className="bg-slate-50 pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Work Field */}

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Work Field
                                    </Label>

                                    <div className="relative">
                                        <BriefcaseBusiness className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                                        <Input
                                            value={
                                                employee?.work_field ??
                                                ""
                                            }
                                            readOnly
                                            className="bg-slate-50 pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Phone
                                    </Label>

                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                                        <Input
                                            value={
                                                employee?.official_cell ||
                                                employee?.personal_cell ||
                                                ""
                                            }
                                            readOnly
                                            className="bg-slate-50 pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Email */}

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Email
                                    </Label>

                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                                        <Input
                                            value={
                                                employee?.official_email ||
                                                employee?.email ||
                                                ""
                                            }
                                            readOnly
                                            className="bg-slate-50 pl-9"
                                        />
                                    </div>
                                </div>

                            </CardContent>
                        </Card>

                        {/* ==================================================
                            TROUBLE TICKET
                        ================================================== */}

                        <Card className="border-slate-200 shadow-sm lg:col-span-2">
                            <CardHeader className="border-b bg-slate-50/70">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-5 w-5 text-blue-600" />

                                    Trouble Ticket Details
                                </CardTitle>

                                <CardDescription>
                                    Provide the details of the issue
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">

                                {/* ==================================================
                                    FAULT TYPE
                                ================================================== */}

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Fault Type

                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </Label>

                                    <Select
                                        value={
                                            selectedFault
                                        }
                                        onValueChange={
                                            setSelectedFault
                                        }
                                        disabled={
                                            loadingFaults ||
                                            submitting
                                        }
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue
                                                placeholder={
                                                    loadingFaults
                                                        ? "Loading fault types..."
                                                        : faults.length ===
                                                            0
                                                            ? "No fault types available"
                                                            : "Select a fault type"
                                                }
                                            />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {faults.map(
                                                (
                                                    fault
                                                ) => (
                                                    <SelectItem
                                                        key={
                                                            fault.id
                                                        }
                                                        value={String(
                                                            fault.id
                                                        )}
                                                    >
                                                        {
                                                            fault.fault_name
                                                        }
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {/* Selected fault description */}

                                    {selectedFault && (
                                        <p className="text-xs leading-5 text-slate-500">
                                            {
                                                faults.find(
                                                    (
                                                        fault
                                                    ) =>
                                                        String(
                                                            fault.id
                                                        ) ===
                                                        selectedFault
                                                )?.fault_desc
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* ==================================================
                                    DESCRIPTION
                                ================================================== */}

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Issue Description

                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </Label>

                                    <textarea
                                        value={
                                            description
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setDescription(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            submitting
                                        }
                                        placeholder="Please describe the issue in detail..."
                                        rows={
                                            8
                                        }
                                        className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    />

                                    <div className="flex justify-end">
                                        <span className="text-xs text-slate-400">
                                            {
                                                description.length
                                            }{" "}
                                            characters
                                        </span>
                                    </div>
                                </div>

                                {/* ==================================================
                                    ATTACHMENT
                                ================================================== */}

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Attachment
                                    </Label>

                                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
                                        <div className="flex flex-col items-center justify-center gap-2 text-center">

                                            <Paperclip className="h-7 w-7 text-slate-400" />

                                            <div>
                                                <p className="text-sm font-medium text-slate-700">
                                                    Attach supporting file
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Maximum file size: 5 MB
                                                </p>
                                            </div>

                                            <Input
                                                id="attachment"
                                                type="file"
                                                onChange={
                                                    handleAttachment
                                                }
                                                disabled={
                                                    submitting
                                                }
                                                className="mt-2 max-w-sm cursor-pointer bg-white"
                                            />

                                            {attachment && (
                                                <p className="text-xs font-medium text-blue-600">
                                                    Selected:{" "}
                                                    {
                                                        attachment.name
                                                    }
                                                </p>
                                            )}

                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-400">
                                        File upload will be connected when the backend multipart upload endpoint is enabled.
                                    </p>
                                </div>

                                {/* ==================================================
                                    ACTIONS
                                ================================================== */}

                                <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.back()
                                        }
                                        disabled={
                                            submitting
                                        }
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={
                                            submitting ||
                                            loadingFaults ||
                                            !employee ||
                                            faults.length ===
                                            0
                                        }
                                        className="min-w-[160px] gap-2 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />

                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />

                                                Submit Ticket
                                            </>
                                        )}
                                    </Button>

                                </div>

                            </CardContent>
                        </Card>

                    </div>
                </form>
            </div>
        </div>
    );
}
