"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    UserRound,
    Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    urgentTaskApi,
    type ActiveEmployeeOption,
    type UrgentTaskPriority,
    type UrgentTaskStatus,
} from "@/lib/urgent-task-api";

const priorities: UrgentTaskPriority[] = [
    "Critical",
    "High",
    "Medium",
    "Low",
];

const statuses: UrgentTaskStatus[] = [
    "Pending",
    "In Progress",
    "Completed",
];

function currentLocalDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function CreateUrgentTask() {
    const router = useRouter();

    const [employees, setEmployees] = useState<ActiveEmployeeOption[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const currentUser = useMemo(
        () => urgentTaskApi.currentUser(),
        []
    );

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "High" as UrgentTaskPriority,
        status: "Pending" as UrgentTaskStatus,
        dueDate: currentLocalDate(),
        assignedTo: "",
    });

    useEffect(() => {
        let mounted = true;

        async function loadEmployees() {
            try {
                setLoadingEmployees(true);
                const response = await urgentTaskApi.employees();
                if (!mounted) return;
                setEmployees(response.data ?? []);
            } catch (reason) {
                if (!mounted) return;
                setEmployees([]);
                setError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load active IT personnel."
                );
            } finally {
                if (mounted) setLoadingEmployees(false);
            }
        }

        void loadEmployees();
        return () => {
            mounted = false;
        };
    }, []);

    function updateField<K extends keyof typeof formData>(
        key: K,
        value: (typeof formData)[K]
    ) {
        setFormData((current) => ({
            ...current,
            [key]: value,
        }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (formData.title.trim().length < 3) {
            setError("Task title must contain at least 3 characters.");
            return;
        }

        if (!formData.assignedTo) {
            setError("Please select an active IT personnel member.");
            return;
        }

        if (!formData.dueDate) {
            setError("Please select a due date.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await urgentTaskApi.create({
                title: formData.title.trim(),
                description: formData.description.trim(),
                priority: formData.priority,
                status: formData.status,
                due_date: formData.dueDate,
                assigned_to: formData.assignedTo,
            });

            setSuccess(
                `Urgent task ${response.data.reference} created successfully.`
            );

            window.setTimeout(() => {
                router.push("/dashboard/urgent/list");
            }, 700);
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to create urgent task."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                            className="h-9 gap-1.5"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>

                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50">
                                    <Zap className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                        Create Urgent Task
                                    </h1>
                                    <p className="text-xs text-muted-foreground">
                                        Create an auditable operational priority task.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
                        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                            <div className="mb-5">
                                <h2 className="text-sm font-semibold text-foreground">
                                    Task Information
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Keep the title actionable and the description concise.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground">
                                        Task Title <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => updateField("title", e.target.value)}
                                        placeholder="Example: Restore core switch redundancy"
                                        maxLength={180}
                                        required
                                        className="h-10"
                                    />
                                    <p className="text-right text-[10px] text-muted-foreground">
                                        {formData.title.length}/180
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground">
                                        Task Description
                                    </label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => updateField("description", e.target.value)}
                                        placeholder="Describe the operational requirement, impact, dependency or expected result..."
                                        rows={7}
                                        maxLength={5000}
                                        className="min-h-[180px] resize-y"
                                    />
                                    <p className="text-right text-[10px] text-muted-foreground">
                                        {formData.description.length}/5000
                                    </p>
                                </div>
                            </div>
                        </section>

                        <aside className="space-y-4">
                            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <div className="mb-5 flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-primary" />
                                    <h2 className="text-sm font-semibold">Task Settings</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold">
                                            Assigned To <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.assignedTo}
                                            onChange={(e) => updateField("assignedTo", e.target.value)}
                                            disabled={loadingEmployees || submitting}
                                            required
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="">
                                                {loadingEmployees
                                                    ? "Loading active IT personnel..."
                                                    : "Select active IT personnel"}
                                            </option>
                                            {employees.map((employee) => (
                                                <option
                                                    key={employee.employee_id}
                                                    value={employee.employee_id}
                                                >
                                                    {employee.employee_name} ({employee.employee_id})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-muted-foreground">
                                            Only active IT personnel are available for assignment.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold">
                                            Due Date <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => updateField("dueDate", e.target.value)}
                                            min={currentLocalDate()}
                                            required
                                            className="h-10"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold">Priority</label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) =>
                                                    updateField(
                                                        "priority",
                                                        e.target.value as UrgentTaskPriority
                                                    )
                                                }
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                {priorities.map((priority) => (
                                                    <option key={priority} value={priority}>
                                                        {priority}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold">Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) =>
                                                    updateField(
                                                        "status",
                                                        e.target.value as UrgentTaskStatus
                                                    )
                                                }
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                {statuses.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                        <UserRound className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                            Generated By
                                        </p>
                                        <p className="mt-1 truncate text-sm font-semibold text-foreground">
                                            {currentUser?.full_name || "Authenticated User"}
                                        </p>
                                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                                            {currentUser?.employee_id || "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200/70 bg-background/60 p-2.5 text-[10px] leading-4 text-muted-foreground dark:border-blue-900">
                                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                                    <span>
                                        Creator identity shown here is informational. The backend records the authenticated employee from the JWT/session context and does not trust a browser-supplied creator value.
                                    </span>
                                </div>
                            </section>
                        </aside>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            {success}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={submitting}
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || loadingEmployees}
                            className="min-w-[130px] gap-2"
                        >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {submitting ? "Creating..." : "Create Task"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
