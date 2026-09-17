/* eslint-disable @next/next/no-img-element */
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    CreditCard,
    HardDrive,
    KeyRound,
    Laptop,
    Loader2,
    Network,
    Phone,
    Printer,
    ShieldCheck,
    UserCheck,
    UserRound,
} from "lucide-react";

import {
    useParams,
    useRouter,
} from "next/navigation";

import {
    Button,
} from "@/components/ui/button";

import {
    Checkbox,
} from "@/components/ui/checkbox";

import {
    api,
    type ApiOk,
} from "@/lib/api";

type LifecycleDetail = {
    id: number;
    reference_no: string;

    employee_id: string;
    employee_name: string;
    designation: string;
    department: string;
    work_field: string;
    phone: string;
    email: string;
    employee_picture: string;

    resignation_date: string;
    effective_date: string;
    separation_mode: string;
    request_type: string;

    assigned_to: string;
    assigned_to_name: string;
    remarks: string;

    joining_device_required: boolean;
    joining_device_completed: boolean;

    joining_vpn_required: boolean;
    joining_vpn_completed: boolean;

    joining_ip_phone_required: boolean;
    joining_ip_phone_completed: boolean;

    joining_printer_required: boolean;
    joining_printer_completed: boolean;

    joining_endpoint_security_required: boolean;
    joining_endpoint_security_completed: boolean;

    joining_card_access_required: boolean;
    joining_card_access_completed: boolean;

    device_returned: boolean;
    vpn_removed: boolean;
    ip_phone_disabled: boolean;
    printer_access_removed: boolean;
    panda_removed: boolean;
    card_access_removed: boolean;

    checklist_required_count: number;
    checklist_completed_count: number;

    currently_assigned_devices: number;

    status: string;
    ec_given: boolean;
    can_edit: boolean;

    created_by: string;
    created_by_name: string;
    created_at: string;

    completed_by: string;
    completed_by_name: string;
    completed_at: string;
};

type ChecklistState = {
    joining_device_completed: boolean;
    joining_vpn_completed: boolean;
    joining_ip_phone_completed: boolean;
    joining_printer_completed: boolean;
    joining_endpoint_security_completed: boolean;
    joining_card_access_completed: boolean;

    device_returned: boolean;
    vpn_removed: boolean;
    ip_phone_disabled: boolean;
    printer_access_removed: boolean;
    panda_removed: boolean;
    card_access_removed: boolean;
};

type ChecklistKey =
    keyof ChecklistState;

type ChecklistItem = {
    key: ChecklistKey;
    label: string;
    description: string;
    icon: React.ReactNode;
};

const HRIS_EMPLOYEE_IMAGE_BASE_URL =
    "https://hris.fiberathome.net/hris/admin/";

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
        )
    ) {
        return value;
    }

    return `${HRIS_EMPLOYEE_IMAGE_BASE_URL}${value.replace(
        /^\/+/,
        ""
    )}`;
}

function formatDate(
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

function initials(
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

    if (
        parts.length ===
        0
    ) {
        return "?";
    }

    if (
        parts.length ===
        1
    ) {
        return (
            parts[0]
                ?.slice(
                    0,
                    2
                )
                .toUpperCase() ??
            "?"
        );
    }

    return `${parts[0]?.[0] ?? ""}${parts[
        parts.length - 1
    ]?.[0] ?? ""}`.toUpperCase();
}

function stateFromDetail(
    detail: LifecycleDetail
): ChecklistState {
    return {
        joining_device_completed:
            detail.joining_device_completed,

        joining_vpn_completed:
            detail.joining_vpn_completed,

        joining_ip_phone_completed:
            detail.joining_ip_phone_completed,

        joining_printer_completed:
            detail.joining_printer_completed,

        joining_endpoint_security_completed:
            detail.joining_endpoint_security_completed,

        joining_card_access_completed:
            detail.joining_card_access_completed,

        device_returned:
            detail.device_returned,

        vpn_removed:
            detail.vpn_removed,

        ip_phone_disabled:
            detail.ip_phone_disabled,

        printer_access_removed:
            detail.printer_access_removed,

        panda_removed:
            detail.panda_removed,

        card_access_removed:
            detail.card_access_removed,
    };
}

export default function LifecycleTaskPage() {
    const params =
        useParams<{
            id: string;
        }>();

    const router =
        useRouter();

    const id =
        Number(
            params.id
        );

    const [
        detail,
        setDetail,
    ] =
        useState<
            LifecycleDetail | null
        >(
            null
        );

    const [
        checklist,
        setChecklist,
    ] =
        useState<ChecklistState | null>(
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
        saving,
        setSaving,
    ] =
        useState(
            false
        );

    const [
        completing,
        setCompleting,
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

    const load =
        useCallback(
            async () => {
                if (
                    !Number.isFinite(
                        id
                    ) ||
                    id <=
                        0
                ) {
                    setError(
                        "Invalid lifecycle task ID."
                    );

                    setLoading(
                        false
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

                    const response =
                        await api.get<
                            ApiOk<
                                LifecycleDetail
                            >
                        >(
                            `/device-clearances/${id}`
                        );

                    const item =
                        readApiData<
                            LifecycleDetail
                        >(
                            response
                        );

                    if (!item) {
                        throw new Error(
                            "Lifecycle task not found."
                        );
                    }

                    setDetail(
                        item
                    );

                    setChecklist(
                        stateFromDetail(
                            item
                        )
                    );
                } catch (
                    reason
                ) {
                    setError(
                        reason instanceof
                            Error
                            ? reason.message
                            : "Unable to load lifecycle task."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                id,
            ]
        );

    useEffect(
        () => {
            void load();
        },
        [
            load,
        ]
    );

    const isJoining =
        text(
            detail?.separation_mode
        ).toLowerCase() ===
        "joining";

    const checklistItems =
        useMemo<
            ChecklistItem[]
        >(
            () => {
                if (
                    !detail
                ) {
                    return [];
                }

                if (
                    isJoining
                ) {
                    const items: Array<
                        ChecklistItem & {
                            required:
                                boolean;
                        }
                    > = [
                        {
                            key:
                                "joining_device_completed",

                            label:
                                "Device Assigned",

                            description:
                                "Assign and configure the approved laptop, desktop or required IT equipment.",

                            icon:
                                <Laptop className="h-5 w-5" />,

                            required:
                                detail.joining_device_required,
                        },
                        {
                            key:
                                "joining_vpn_completed",

                            label:
                                "VPN Access",

                            description:
                                "Enable the required VPN profile and approved remote-access permissions.",

                            icon:
                                <KeyRound className="h-5 w-5" />,

                            required:
                                detail.joining_vpn_required,
                        },
                        {
                            key:
                                "joining_ip_phone_completed",

                            label:
                                "IP Phone",

                            description:
                                "Create or activate the employee IP phone extension and voice service.",

                            icon:
                                <Phone className="h-5 w-5" />,

                            required:
                                detail.joining_ip_phone_required,
                        },
                        {
                            key:
                                "joining_printer_completed",

                            label:
                                "Printer Access",

                            description:
                                "Grant approved printer and print-server access for the employee role.",

                            icon:
                                <Printer className="h-5 w-5" />,

                            required:
                                detail.joining_printer_required,
                        },
                        {
                            key:
                                "joining_endpoint_security_completed",

                            label:
                                "Endpoint Security",

                            description:
                                "Install and activate Panda / endpoint security with the standard policy.",

                            icon:
                                <ShieldCheck className="h-5 w-5" />,

                            required:
                                detail.joining_endpoint_security_required,
                        },
                        {
                            key:
                                "joining_card_access_completed",

                            label:
                                "Card Access",

                            description:
                                "Activate the employee physical access card and approved office access.",

                            icon:
                                <CreditCard className="h-5 w-5" />,

                            required:
                                detail.joining_card_access_required,
                        },
                    ];

                    return items.filter(
                        (
                            item
                        ) =>
                            item.required
                    );
                }

                return [
                    {
                        key:
                            "device_returned",

                        label:
                            "Device Returned",

                        description:
                            "Confirm the employee has returned all assigned IT equipment.",

                        icon:
                            <HardDrive className="h-5 w-5" />,
                    },
                    {
                        key:
                            "vpn_removed",

                        label:
                            "VPN Access Removed",

                        description:
                            "VPN profile/account access has been revoked.",

                        icon:
                            <KeyRound className="h-5 w-5" />,
                    },
                    {
                        key:
                            "ip_phone_disabled",

                        label:
                            "IP Phone Disabled",

                        description:
                            "IP phone extension or voice service has been disabled.",

                        icon:
                            <Phone className="h-5 w-5" />,
                    },
                    {
                        key:
                            "printer_access_removed",

                        label:
                            "Printer Access Removed",

                        description:
                            "Printer / print-server access has been revoked.",

                        icon:
                            <Printer className="h-5 w-5" />,
                    },
                    {
                        key:
                            "panda_removed",

                        label:
                            "Endpoint Security Removed",

                        description:
                            "Panda / endpoint-security profile has been removed where applicable.",

                        icon:
                            <ShieldCheck className="h-5 w-5" />,
                    },
                    {
                        key:
                            "card_access_removed",

                        label:
                            "Card Access Disabled",

                        description:
                            "Employee physical access card has been deactivated.",

                        icon:
                            <CreditCard className="h-5 w-5" />,
                    },
                ];
            },
            [
                detail,
                isJoining,
            ]
        );

    const completedCount =
        checklist
            ? checklistItems.filter(
                  (
                      item
                  ) =>
                      checklist[
                          item.key
                      ]
              ).length
            : 0;

    const allCompleted =
        checklistItems.length >
            0 &&
        completedCount ===
            checklistItems.length;

    const progress =
        checklistItems.length >
        0
            ? Math.round(
                  (
                      completedCount /
                      checklistItems.length
                  ) *
                      100
              )
            : 0;

    async function saveProgress() {
        if (
            !checklist
        ) {
            return;
        }

        try {
            setSaving(
                true
            );

            setError(
                ""
            );

            await api.patch(
                `/device-clearances/${id}/checklist`,
                checklist
            );

            await load();
        } catch (
            reason
        ) {
            setError(
                reason instanceof
                    Error
                    ? reason.message
                    : "Unable to save checklist progress."
            );
        } finally {
            setSaving(
                false
            );
        }
    }

    async function completeTask() {
        if (
            !checklist ||
            !allCompleted
        ) {
            setError(
                "Complete all required checklist items first."
            );

            return;
        }

        try {
            setCompleting(
                true
            );

            setError(
                ""
            );

            /*
             * IMPORTANT:
             * The checkboxes are local React state until /checklist is saved.
             * Previously Complete Task called /complete directly, so the UI could
             * show 5/5 while PostgreSQL still contained old FALSE values.
             *
             * Save the exact visible checklist first, then complete the task.
             */
            await api.patch(
                `/device-clearances/${id}/checklist`,
                checklist
            );

            await api.patch(
                `/device-clearances/${id}/complete`,
                {}
            );

            await load();
        } catch (
            reason
        ) {
            setError(
                reason instanceof
                    Error
                    ? reason.message
                    : "Unable to save and complete lifecycle task."
            );
        } finally {
            setCompleting(
                false
            );
        }
    }

    if (
        loading
    ) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (
        !detail ||
        !checklist
    ) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error ||
                        "Lifecycle task not found."}
                </div>
            </div>
        );
    }

    const picture =
        resolvePicture(
            detail.employee_picture
        );

    const completed =
        detail.status ===
        "Completed";

    const readOnly =
        completed ||
        !detail.can_edit;

    return (
        <div className="w-full p-4 sm:p-6">
            <div className="mx-auto w-full max-w-[1500px] space-y-5">
                {/* HEADER */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                                router.back()
                            }
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-semibold text-foreground">
                                    {isJoining
                                        ? "Joining IT Checklist"
                                        : "IT Exit Clearance"}
                                </h1>

                                <span
                                    className={`
                                        rounded-full
                                        border
                                        px-2.5
                                        py-1
                                        text-[11px]
                                        font-semibold
                                        ${
                                            isJoining
                                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                                : "border-amber-200 bg-amber-50 text-amber-700"
                                        }
                                    `}
                                >
                                    {detail.separation_mode}
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {detail.reference_no}
                            </p>
                        </div>
                    </div>

                    <StatusBadge
                        status={
                            detail.status
                        }
                    />
                </div>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!completed &&
                    !detail.can_edit && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            This task is read-only for you. Only the assigned IT employee,{" "}
                            <strong>
                                {detail.assigned_to_name}
                            </strong>{" "}
                            ({detail.assigned_to}), can update and complete the checklist.
                        </div>
                    )}

                {!isJoining &&
                    detail.currently_assigned_devices >
                        0 && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <strong>
                                {detail.currently_assigned_devices}
                            </strong>{" "}
                            device(s) are still assigned to this employee. The exit task cannot be completed until those assets are returned or transferred in inventory.
                        </div>
                    )}

                {/* EMPLOYEE / ASSIGNMENT */}

                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
                        <div className="flex items-center gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/5">
                                {picture ? (
                                    <img
                                        src={
                                            picture
                                        }
                                        alt={
                                            detail.employee_name
                                        }
                                        className="h-full w-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <span className="text-lg font-bold text-primary">
                                        {initials(
                                            detail.employee_name
                                        )}
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {detail.employee_name}
                                </p>

                                <p className="mt-0.5 text-xs font-semibold text-primary">
                                    {detail.employee_id}
                                </p>

                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                    {detail.designation ||
                                        "—"}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <Info
                                label="Department"
                                value={
                                    detail.department
                                }
                            />

                            <Info
                                label={
                                    isJoining
                                        ? "Joining Date"
                                        : "Last Working Date"
                                }
                                value={
                                    formatDate(
                                        detail.effective_date ||
                                            detail.resignation_date
                                    )
                                }
                            />

                            <Info
                                label="Assigned IT"
                                value={`${detail.assigned_to_name} (${detail.assigned_to})`}
                            />

                            <Info
                                label="Checklist"
                                value={`${completedCount}/${checklistItems.length} completed`}
                            />
                        </div>
                    </div>
                </section>

                {/* CHECKLIST */}

                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <UserCheck className="h-4 w-4 text-primary" />
                                {isJoining
                                    ? "Assigned Joining Activities"
                                    : "Exit Clearance Checklist"}
                            </h2>

                            <p className="mt-1 text-xs text-muted-foreground">
                                {isJoining
                                    ? "Only the activities selected when this task was created are shown below."
                                    : "Complete every exit control before closing the employee clearance."}
                            </p>
                        </div>

                        <div className="min-w-[180px]">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                <span>
                                    Progress
                                </span>

                                <span>
                                    {completedCount}/{checklistItems.length}
                                </span>
                            </div>

                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {checklistItems.length ===
                    0 ? (
                        <div className="p-5">
                            <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-8 text-center">
                                <p className="text-sm font-semibold text-amber-800">
                                    No checklist items selected
                                </p>

                                <p className="mt-1 text-xs text-amber-700">
                                    This legacy joining task has no selected preparation items.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                            {checklistItems.map(
                                (
                                    item
                                ) => (
                                    <ChecklistCard
                                        key={
                                            item.key
                                        }
                                        item={
                                            item
                                        }
                                        checked={
                                            checklist[
                                                item.key
                                            ]
                                        }
                                        disabled={
                                            readOnly
                                        }
                                        onChange={(
                                            checked
                                        ) =>
                                            setChecklist(
                                                (
                                                    previous
                                                ) =>
                                                    previous
                                                        ? {
                                                              ...previous,

                                                              [item.key]:
                                                                  checked,
                                                          }
                                                        : previous
                                            )
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
                </section>

                {/* NOTES */}

                {detail.remarks && (
                    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Additional Notes
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                            {detail.remarks}
                        </p>
                    </section>
                )}

                {/* ACTIONS */}

                {!completed && detail.can_edit && allCompleted && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                        All selected activities are checked. <strong>Save & Complete Task</strong> will save the current checklist automatically before completing the task.
                    </div>
                )}

                {!completed && (
                    <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                !detail.can_edit ||
                                saving ||
                                completing
                            }
                            onClick={() =>
                                void saveProgress()
                            }
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Progress"
                            )}
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                !detail.can_edit ||
                                !allCompleted ||
                                saving ||
                                completing
                            }
                            onClick={() =>
                                void completeTask()
                            }
                            className="min-w-[180px]"
                        >
                            {completing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Completing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Save & Complete Task
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {completed && (
                    <div className="flex items-center justify-end gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />

                        Completed by{" "}
                        {detail.completed_by_name ||
                            detail.completed_by ||
                            "IT"}
                        {detail.completed_at
                            ? ` on ${formatDate(
                                  detail.completed_at
                              )}`
                            : ""}
                    </div>
                )}
            </div>
        </div>
    );
}

function ChecklistCard({
    item,
    checked,
    disabled,
    onChange,
}: {
    item:
        ChecklistItem;

    checked:
        boolean;

    disabled:
        boolean;

    onChange:
        (
            checked: boolean
        ) => void;
}) {
    return (
        <label
            className={`
                flex
                items-start
                gap-3
                rounded-xl
                border
                p-4
                transition-all
                ${
                    checked
                        ? "border-emerald-200 bg-emerald-50/60 shadow-sm"
                        : "border-border bg-background"
                }
                ${
                    disabled
                        ? "cursor-default opacity-80"
                        : "cursor-pointer hover:border-primary/25 hover:bg-muted/20"
                }
            `}
        >
            <Checkbox
                checked={
                    checked
                }
                disabled={
                    disabled
                }
                onCheckedChange={(
                    value
                ) =>
                    onChange(
                        value ===
                            true
                    )
                }
                aria-label={
                    item.label
                }
                className="mt-2 h-5 w-5 shrink-0"
            />

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
                        checked
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-primary/10 text-primary"
                    }
                `}
            >
                {item.icon}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                        {item.label}
                    </p>

                    <span
                        className={`
                            rounded-full
                            px-2
                            py-0.5
                            text-[10px]
                            font-semibold
                            ${
                                checked
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-muted text-muted-foreground"
                            }
                        `}
                    >
                        {checked
                            ? "Completed"
                            : "Pending"}
                    </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.description}
                </p>
            </div>
        </label>
    );
}

function StatusBadge({
    status,
}: {
    status:
        string;
}) {
    const value =
        text(
            status
        );

    const completed =
        value ===
        "Completed";

    const inProcess =
        value ===
        "In Process";

    return (
        <span
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
                    completed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : inProcess
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                }
            `}
        >
            {completed ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
                <Clock3 className="h-3.5 w-3.5" />
            )}

            {value ||
                "Pending Clearance"}
        </span>
    );
}

function Info({
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
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 text-sm font-medium text-foreground">
                {value ||
                    "—"}
            </p>
        </div>
    );
}
