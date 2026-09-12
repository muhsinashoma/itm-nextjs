
// frontend/components/ui/right-sidebar.tsx
"use client";

import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock3, LucideCalendar, Loader2, Plus, Zap } from "lucide-react";
import { Calendar } from "./calendar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Section, toSection } from "@/components/tt-columns";
import { dashboardApi, type TroubleTicketITPersonnel } from "@/lib/api";
import TTTable from "../TTTable";
import { X } from "lucide-react";
import { typography } from "@/components/ui/typography";
import { urgentTaskApi, type UrgentTask } from "@/lib/urgent-task-api";


export function RightSidebar() {
    const router = useRouter();
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCreator, setSelectedCreator] = useState<any | null>(null);
    const [showCreatorTTModal, setShowCreatorTTModal] = useState(false);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [showTTListModal, setShowTTListModal] = useState(false);
    const [showAllCreatorsModal, setShowAllCreatorsModal] = useState(false);
    const [selectedDept, setSelectedDept] = useState<any>(null);


    // ✅ ADD HERE
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [companySearch, setCompanySearch] = useState("");

    const [deptSearch, setDeptSearch] = useState("");
    const [creatorSearch, setCreatorSearch] = useState("");

    // Department Drawer
    const [showDeptDrawer, setShowDeptDrawer] = useState(false);

    // Creator Drawer
    const [showCreatorDrawer, setShowCreatorDrawer] = useState(false);

    const [deptFilter, setDeptFilter] = useState<string[] | null>(null);
    const [creatorFilter, setCreatorFilter] = useState<string[] | null>(null);


    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState("");

    const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([]);
    const [urgentTasksLoading, setUrgentTasksLoading] = useState(true);
    const [urgentTasksError, setUrgentTasksError] = useState("");

    const [sections, setSections] = useState<Section[]>([]);
    const [activeITPersonnel, setActiveITPersonnel] = useState<TroubleTicketITPersonnel[]>([]);
    const [todayTTLoading, setTodayTTLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        const updateTime = () => {
            const now = new Date();
            setTime(
                now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                })
            );
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let mounted = true;

        async function loadUrgentTasks() {
            try {
                setUrgentTasksLoading(true);
                setUrgentTasksError("");

                const response = await urgentTaskApi.sidebar(3);

                if (!mounted) return;

                setUrgentTasks(response.data ?? []);
            } catch (reason) {
                if (!mounted) return;

                setUrgentTasks([]);
                setUrgentTasksError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load urgent tasks."
                );
            } finally {
                if (mounted) {
                    setUrgentTasksLoading(false);
                }
            }
        }

        void loadUrgentTasks();

        const refreshTimer = window.setInterval(
            () => void loadUrgentTasks(),
            60_000
        );

        return () => {
            mounted = false;
            window.clearInterval(refreshTimer);
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        async function loadTodayTroubleTickets() {
            try {
                setTodayTTLoading(true);

                const [
                    ticketResponse,
                    itPersonnelResponse,
                ] = await Promise.all([
                    dashboardApi.troubleTickets({
                        page: 1,
                        limit: 1000,
                        scope: "opened_today",
                        status: "all",
                    }),
                    dashboardApi.troubleTicketITPersonnel(),
                ]);

                if (!mounted) return;

                setSections(
                    (ticketResponse.data ?? []).map(toSection)
                );

                setActiveITPersonnel(
                    itPersonnelResponse.data ?? []
                );
            } catch (reason) {
                console.error("Unable to load right-sidebar TT data:", reason);
                if (mounted) setSections([]);
            } finally {
                if (mounted) setTodayTTLoading(false);
            }
        }

        void loadTodayTroubleTickets();

        const refreshTimer = window.setInterval(
            () => void loadTodayTroubleTickets(),
            60_000
        );

        return () => {
            mounted = false;
            window.clearInterval(refreshTimer);
        };
    }, []);

    const filteredTickets: Section[] = sections.filter(
        (ticket) => ticket.dept_name === selectedDept?.dept
    );

    const creatorColorClasses = [
        "bg-blue-100 text-blue-700",
        "bg-green-100 text-green-700",
        "bg-purple-100 text-purple-700",
        "bg-pink-100 text-pink-700",
        "bg-yellow-100 text-yellow-700",
        "bg-indigo-100 text-indigo-700",
    ];

    const activeITByEmployeeID =
        new Map(
            activeITPersonnel.map(
                (person) => [
                    String(
                        person.employee_id ??
                        ""
                    ).trim(),
                    String(
                        person.employee_name ??
                        ""
                    ).trim(),
                ]
            )
        );

    const creatorCountMap =
        new Map<
            string,
            {
                employeeId: string;
                name: string;
                count: number;
            }
        >();

    sections.forEach((item) => {
        const employeeId =
            String(
                item.employee_id ??
                ""
            ).trim();

        if (
            !employeeId ||
            !activeITByEmployeeID.has(
                employeeId
            )
        ) {
            return;
        }

        const name =
            activeITByEmployeeID.get(
                employeeId
            ) ||
            String(
                item.employee_name ??
                ""
            ).trim() ||
            employeeId;

        const current =
            creatorCountMap.get(
                employeeId
            );

        creatorCountMap.set(
            employeeId,
            {
                employeeId,
                name,
                count:
                    (current?.count ?? 0) +
                    1,
            }
        );
    });

    const ttCreatorsToday =
        Array.from(
            creatorCountMap.values()
        )
            .map(
                (
                    creator,
                    index
                ) => ({
                    ...creator,
                    color:
                        creatorColorClasses[
                        index %
                        creatorColorClasses.length
                        ],
                })
            )
            .sort(
                (a, b) =>
                    b.count -
                    a.count ||
                    a.name.localeCompare(
                        b.name
                    )
            );

    const departmentColorClasses = [
        "bg-blue-100 text-blue-800",
        "bg-green-100 text-green-800",
        "bg-purple-100 text-purple-800",
        "bg-pink-100 text-pink-800",
        "bg-yellow-100 text-yellow-800",
        "bg-indigo-100 text-indigo-800",
    ];

    const departmentCountMap: Record<string, number> = {};
    sections.forEach((item) => {
        const dept = String(item.dept_name ?? "").trim();
        if (!dept) return;
        departmentCountMap[dept] = (departmentCountMap[dept] ?? 0) + 1;
    });

    const ttDepartmentToday = Object.entries(departmentCountMap)
        .map(([dept, count], index) => ({
            dept,
            count,
            color: departmentColorClasses[index % departmentColorClasses.length],
        }))
        .sort((a, b) => b.count - a.count || a.dept.localeCompare(b.dept));

    // ✅ ADD HERE (below ttDepartmentToday)
    const companyCountMap: Record<string, number> = {};

    sections.forEach((item) => {
        const company = item.company_name;

        if (!company) return; // ✅ only real company names

        if (!companyCountMap[company]) {
            companyCountMap[company] = 0;
        }

        companyCountMap[company]++;
    });

    const companyCounts = Object.entries(companyCountMap).map(
        ([company, count], index) => ({
            company,
            count,
            color: [
                "bg-blue-100 text-blue-800",
                "bg-green-100 text-green-800",
                "bg-purple-100 text-purple-800",
                "bg-pink-100 text-pink-800",
            ][index % 4],
        })
    );

    const cardStyle = {
        backgroundColor: "var(--card)",
        color: "var(--card-foreground)",
        borderColor: "var(--border)",
    };

    return (
        <aside
            className="h-full min-h-0 w-full flex flex-col gap-3.5 overflow-y-auto overflow-x-hidden px-3 pt-3 pb-12 transition-colors duration-300 overscroll-contain"
            style={{
                backgroundColor: "var(--dashboard-bg)",
                color: "var(--foreground)",
                scrollbarGutter: "stable",
                WebkitOverflowScrolling: "touch",
            }}
        >
            {/* Calendar Header */}
            <div
                className="flex items-center mb-4 cursor-pointer"
                onClick={() => setCalendarOpen(!calendarOpen)}
            >
                <div className="flex items-center gap-2">
                    <LucideCalendar className="w-5 h-5 text-primary" />
                    <div>
                        <p className={typography.small}>Today</p>
                        <p className={`${typography.body} font-medium leading-tight`}>
                            {selectedDate.toLocaleDateString("en-US", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                        <p className={typography.small}>{mounted ? time : "--:--"}</p>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            {calendarOpen && (
                <div className="border rounded-xl shadow p-3 mb-4 transition-colors duration-300" style={cardStyle}>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            if (date) {
                                setSelectedDate(date);
                                setCalendarOpen(false);
                            }
                        }}
                    />
                </div>
            )}

            {/* Urgent Tasks */}
            <section
                className="
                    w-full
                    overflow-visible
                    rounded-xl
                    border
                    border-border
                    bg-card
                    shadow-sm
                    transition-colors
                    duration-300
                "
            >
                <div
                    className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        border-b
                        border-border
                        bg-muted/20
                        px-3
                        py-2.5
                    "
                >
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div
                            className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-red-100
                                bg-red-50
                            "
                        >
                            <Zap className="h-3.5 w-3.5 text-red-600" />
                        </div>

                        <div className="min-w-0">
                            <h4
                                className="
                                    truncate
                                    text-[11px]
                                    font-semibold
                                    text-foreground
                                "
                            >
                                Urgent Tasks
                            </h4>

                            <p
                                className="
                                    mt-0.5
                                    truncate
                                    text-[9px]
                                    text-muted-foreground
                                "
                            >
                                Live operational priorities
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/dashboard/urgent/create"
                            )
                        }
                        className="
                            inline-flex
                            h-7
                            shrink-0
                            items-center
                            gap-1
                            whitespace-nowrap
                            rounded-md
                            border
                            border-primary/20
                            bg-primary/5
                            px-2
                            text-[9px]
                            font-semibold
                            text-primary
                            transition
                            hover:border-primary/30
                            hover:bg-primary/10
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-primary/20
                        "
                        title="Create a new urgent task"
                    >
                        <Plus className="h-3 w-3" />
                        Add Task
                    </button>
                </div>

                <div className="min-w-0 overflow-visible px-2.5 pt-2 pb-2.5">
                    {urgentTasksLoading ? (
                        <div
                            className="
                                flex
                                items-center
                                justify-center
                                gap-2
                                py-6
                                text-[10px]
                                text-muted-foreground
                            "
                        >
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading urgent tasks...
                        </div>
                    ) : urgentTasksError ? (
                        <div
                            className="
                                rounded-lg
                                border
                                border-red-200
                                bg-red-50
                                p-2.5
                                text-[10px]
                                leading-4
                                text-red-700
                            "
                        >
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{urgentTasksError}</span>
                            </div>
                        </div>
                    ) : urgentTasks.length === 0 ? (
                        <div
                            className="
                                rounded-lg
                                border
                                border-dashed
                                border-border
                                bg-muted/15
                                px-3
                                py-5
                                text-center
                            "
                        >
                            <CheckCircle2 className="mx-auto mb-1.5 h-4 w-4 text-emerald-600" />

                            <p className="text-[10px] font-semibold text-foreground">
                                No active urgent tasks
                            </p>

                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                                Pending and in-progress tasks will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/70">
                            {urgentTasks
                                .slice(0, 2)
                                .map((task) => {
                                    const priorityClass =
                                        task.priority ===
                                            "Critical"
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : task.priority ===
                                                "High"
                                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                                : task.priority ===
                                                    "Medium"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200";

                                    const accentClass =
                                        task.priority ===
                                            "Critical"
                                            ? "bg-red-500"
                                            : task.priority ===
                                                "High"
                                                ? "bg-orange-500"
                                                : task.priority ===
                                                    "Medium"
                                                    ? "bg-amber-500"
                                                    : "bg-emerald-500";

                                    const dueDate =
                                        new Date(
                                            `${task.due_date}T00:00:00`
                                        );

                                    const dueLabel =
                                        Number.isNaN(
                                            dueDate.getTime()
                                        )
                                            ? task.due_date
                                            : dueDate.toLocaleDateString(
                                                "en-GB",
                                                {
                                                    day: "2-digit",
                                                    month: "short",
                                                }
                                            );

                                    return (
                                        <button
                                            key={task.id}
                                            type="button"
                                            onClick={() =>
                                                router.push(
                                                    "/dashboard/urgent/list"
                                                )
                                            }
                                            className="
                                                group
                                                relative
                                                flex
                                                w-full
                                                items-start
                                                gap-2.5
                                                px-1
                                                py-2.5
                                                text-left
                                                transition
                                                hover:bg-muted/25
                                                focus-visible:outline-none
                                                focus-visible:ring-2
                                                focus-visible:ring-primary/20
                                            "
                                        >
                                            <span
                                                className={`
                                                    mt-0.5
                                                    h-9
                                                    w-1
                                                    shrink-0
                                                    rounded-full
                                                    ${accentClass}
                                                `}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="
                                                            truncate
                                                            font-mono
                                                            text-[8.5px]
                                                            font-semibold
                                                            text-blue-600
                                                        "
                                                    >
                                                        {task.reference}
                                                    </span>

                                                    <span
                                                        className={`
                                                            shrink-0
                                                            rounded-full
                                                            border
                                                            px-1.5
                                                            py-0.5
                                                            text-[8px]
                                                            font-semibold
                                                            ${priorityClass}
                                                        `}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                </div>

                                                <p
                                                    className="
                                                        mt-1
                                                        truncate
                                                        text-[10.5px]
                                                        font-semibold
                                                        text-foreground
                                                    "
                                                    title={task.title}
                                                >
                                                    {task.title}
                                                </p>

                                                <div
                                                    className="
                                                        mt-1
                                                        flex
                                                        items-center
                                                        justify-between
                                                        gap-2
                                                        text-[9px]
                                                        text-muted-foreground
                                                    "
                                                >
                                                    <span
                                                        className="truncate"
                                                        title={`${task.assigned_to_name} (${task.assigned_to})`}
                                                    >
                                                        {task.assigned_to_name}
                                                    </span>

                                                    <span
                                                        className="
                                                            inline-flex
                                                            shrink-0
                                                            items-center
                                                            gap-1
                                                        "
                                                    >
                                                        <Clock3 className="h-3 w-3" />
                                                        {dueLabel}
                                                    </span>
                                                </div>
                                            </div>

                                            <ArrowRight
                                                className="
                                                    mt-3
                                                    h-3
                                                    w-3
                                                    shrink-0
                                                    text-muted-foreground
                                                    opacity-0
                                                    transition
                                                    group-hover:opacity-100
                                                "
                                            />
                                        </button>
                                    );
                                })}
                        </div>
                    )}


                </div>
                <div
                    className="
                        flex
                        w-full
                        items-center
                        justify-between
                        gap-2
                        border-t
                        border-border
                        bg-muted/30
                        px-3
                        py-2
                    "
                >
                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/dashboard/urgent/list"
                            )
                        }
                        className="
                            inline-flex
                            items-center
                            gap-1
                            whitespace-nowrap
                            rounded-md
                            px-1
                            py-1
                            text-[10px]
                            font-semibold
                            text-foreground/80
                            transition
                            hover:text-primary
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-primary/20
                        "
                        title="View all urgent tasks"
                    >
                        View Task List
                        <ArrowRight className="h-3 w-3 shrink-0" />
                    </button>

                    {urgentTasks.length > 2 && (
                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    "/dashboard/urgent/list"
                                )
                            }
                            className="
                                inline-flex
                                min-w-9
                                shrink-0
                                items-center
                                justify-center
                                whitespace-nowrap
                                rounded-full
                                border
                                border-primary/25
                                bg-primary/10
                                px-2
                                py-1
                                text-[9px]
                                font-bold
                                text-primary
                                transition
                                hover:border-primary/40
                                hover:bg-primary/15
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-primary/20
                            "
                            title="More urgent tasks are available"
                        >
                            2+
                        </button>
                    )}
                </div>
            </section>


            {/* Company TT Cards */}
            {/* <div
                className="w-full overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm transition-colors duration-300"
                style={cardStyle}
            > */}
                {/* Title */}
                {/* <h4 className={`${typography.label} text-primary mb-1 border-b border-primary pb-0.5`}>
                    Company TT Today {todayTTLoading ? "…" : ""}
                </h4> */}

                {/* Grid Content (UNCHANGED DESIGN) */}
                {/* <div className="grid grid-cols-2 gap-2">
                    {companyCounts
                        .filter((item) => item.company && item.company.trim() !== "")
                        .map((item, index) => (
                            <div
                                key={index}
                                onClick={() => {
                                    setSelectedCompany(item.company);
                                    setShowCompanyModal(true);
                                }}
                                className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted transition-colors duration-300"
                                style={cardStyle}
                            > */}
                                {/* Company Name */}
                                {/* <span className="text-xs font-medium truncate">
                                    {item.company}
                                </span> */}

                                {/* Count Badge */}
                                {/* <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.color}`}
                                >
                                    {item.count}
                                </span>
                            </div>
                        ))}
                </div>
            </div> */}


            {/* Department TT */}
            <section
                className="
                    w-full
                    overflow-visible
                    rounded-xl
                    border
                    border-border
                    bg-card
                    shadow-sm
                    transition-colors
                    duration-300
                "
            >
                <div
                    className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-border
                        bg-muted/15
                        px-3
                        py-2.5
                    "
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />

                        <div className="min-w-0">
                            <h4
                                className="
                                    truncate
                                    text-[10.5px]
                                    font-semibold
                                    text-foreground
                                "
                            >
                                Departmental TT Today
                            </h4>

                            <p className="mt-0.5 text-[8.5px] text-muted-foreground">
                                Top departments by tickets opened today
                            </p>
                        </div>
                    </div>

                    {!todayTTLoading && (
                        <span
                            className="
                                shrink-0
                                rounded-full
                                border
                                border-border
                                bg-background
                                px-2
                                py-0.5
                                text-[8.5px]
                                font-semibold
                                text-muted-foreground
                            "
                        >
                            {ttDepartmentToday.length}
                        </span>
                    )}
                </div>

                <div className="min-w-0 overflow-visible px-2.5 pt-2 pb-2.5">
                    {todayTTLoading ? (
                        <div
                            className="
                                flex
                                items-center
                                justify-center
                                gap-2
                                py-4
                                text-[9.5px]
                                text-muted-foreground
                            "
                        >
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading departments...
                        </div>
                    ) : ttDepartmentToday.length === 0 ? (
                        <div
                            className="
                                rounded-lg
                                border
                                border-dashed
                                border-border
                                px-3
                                py-4
                                text-center
                                text-[9.5px]
                                text-muted-foreground
                            "
                        >
                            No department tickets opened today.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/60">
                            {ttDepartmentToday
                                .slice(0, 3)
                                .map(
                                    (
                                        dept,
                                        index
                                    ) => (
                                        <button
                                            key={dept.dept}
                                            type="button"
                                            onClick={() => {
                                                setDeptFilter([
                                                    dept.dept,
                                                ]);
                                                setSelectedDept(
                                                    dept
                                                );
                                                setShowDeptDrawer(
                                                    true
                                                );
                                            }}
                                            className="
                                                group
                                                flex
                                                w-full
                                                items-center
                                                gap-2.5
                                                px-1
                                                py-2
                                                text-left
                                                transition
                                                hover:bg-muted/25
                                                focus-visible:outline-none
                                                focus-visible:ring-2
                                                focus-visible:ring-primary/20
                                            "
                                        >
                                            <div
                                                className="
                                                    flex
                                                    h-6
                                                    w-6
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-md
                                                    border
                                                    border-border
                                                    bg-muted/40
                                                    text-[9px]
                                                    font-bold
                                                    text-muted-foreground
                                                "
                                            >
                                                {index + 1}
                                            </div>

                                            <span
                                                className="
                                                    min-w-0
                                                    flex-1
                                                    truncate
                                                    text-[10px]
                                                    font-medium
                                                    text-foreground
                                                "
                                                title={
                                                    dept.dept
                                                }
                                            >
                                                {dept.dept}
                                            </span>

                                            <span
                                                className="
                                                    inline-flex
                                                    min-w-6
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    bg-primary/8
                                                    px-2
                                                    py-0.5
                                                    text-[9px]
                                                    font-bold
                                                    tabular-nums
                                                    text-primary
                                                "
                                            >
                                                {dept.count}
                                            </span>

                                            <ArrowRight
                                                className="
                                                    h-3
                                                    w-3
                                                    shrink-0
                                                    text-muted-foreground
                                                    opacity-0
                                                    transition
                                                    group-hover:opacity-100
                                                "
                                            />
                                        </button>
                                    )
                                )}
                        </div>
                    )}


                </div>
                {ttDepartmentToday.length > 3 && (
                    <div
                        className="
                            flex
                            w-full
                            items-center
                            justify-between
                            gap-2
                            border-t
                            border-border
                            bg-muted/30
                            px-3
                            py-2
                        "
                    >
                        <span
                            className="
                                min-w-0
                                truncate
                                whitespace-nowrap
                                text-[10px]
                                font-semibold
                                text-foreground/75
                            "
                            title="More departments available"
                        >
                            More departments available
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setDeptFilter(
                                    ttDepartmentToday.map(
                                        (department) =>
                                            department.dept
                                    )
                                );
                                setSelectedDept(null);
                                setShowDeptDrawer(true);
                            }}
                            className="
                                inline-flex
                                min-w-10
                                shrink-0
                                items-center
                                justify-center
                                gap-1
                                whitespace-nowrap
                                rounded-full
                                border
                                border-primary/25
                                bg-primary/10
                                px-2
                                py-1
                                text-[9px]
                                font-bold
                                text-primary
                                transition
                                hover:border-primary/40
                                hover:bg-primary/15
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-primary/20
                            "
                            title="View all departments"
                        >
                            3+
                            <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                        </button>
                    </div>
                )}
            </section>


            {/* TT Creators from IT Side */}
            <div
                className="border rounded-lg shadow-sm p-3 flex flex-col gap-2 w-full transition-colors duration-300"
                style={cardStyle}
            >
                <h4
                    className={`${typography.label} text-primary mb-1 border-b border-primary pb-0.5`}
                >
                    TT Creators Today from IT
                </h4>

                <div className="space-y-2">
                    {ttCreatorsToday.slice(0, 3).map((creator, index) => {
                        const initials = creator.name
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("");

                        const badgeColors = [
                            "bg-blue-100 text-blue-700",
                            "bg-green-100 text-green-700",
                            "bg-purple-100 text-purple-700",
                            "bg-pink-100 text-pink-700",
                            "bg-yellow-100 text-yellow-700",
                        ];

                        const badgeColor =
                            badgeColors[index % badgeColors.length];

                        return (
                            <div
                                key={index}
                                className="flex items-center justify-between p-1 rounded-md hover:bg-muted cursor-pointer transition-colors duration-300"

                                onClick={() => {
                                    setCreatorFilter([creator.name]); // only this creator
                                    setSelectedCreator(creator);
                                    setShowCreatorDrawer(true);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${creator.color}`}
                                    >
                                        {initials}
                                    </div>

                                    <span className="text-xs font-medium">
                                        {creator.name}
                                    </span>
                                </div>

                                <div
                                    className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-semibold ${badgeColor}`}
                                >
                                    {creator.count}
                                </div>
                            </div>
                        );
                    })}

                    {ttCreatorsToday.length > 3 && (
                        <button
                            className="text-sm text-muted-foreground pl-10 hover:underline"
                            //onClick={() => setShowCreatorDrawer(true)}
                            onClick={() => {
                                setCreatorFilter(ttCreatorsToday.map(c => c.name)); // ALL creators
                                setSelectedCreator(null); // optional: means "all"
                                setShowCreatorDrawer(true);
                            }}
                        >
                            3+
                        </button>
                    )}
                </div>
            </div>


            {/* Company TT Side Drawer */}
            <div
                className={`fixed inset-0 z-50 transition-all duration-300 ${showCompanyModal ? "visible" : "invisible"
                    }`}
            >
                {/* Overlay */}
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${showCompanyModal ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={() => setShowCompanyModal(false)}
                />

                {/* Drawer */}
                <div
                    className={`absolute right-0 top-0 h-full w-[650px] shadow-xl transition-transform duration-300 flex flex-col ${showCompanyModal ? "translate-x-0" : "translate-x-full"
                        }`}
                    style={cardStyle}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b flex flex-col gap-2">
                        {/* Title */}
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg text-primary">
                                {selectedCompany} Tickets
                            </h3>

                            <button
                                onClick={() => setShowCompanyModal(false)}
                                className="text-muted-foreground hover:text-destructive text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search employee, TT No, department..."
                                className="w-full px-3 py-2 pr-8 text-xs border rounded-md outline-none focus:ring-1 focus:ring-primary"
                                value={companySearch}
                                onChange={(e) => setCompanySearch(e.target.value)}
                            />

                            {/* Clear Button */}
                            {companySearch && (

                                <button
                                    onClick={() => setCompanySearch("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 
                                    w-6 h-6 flex items-center justify-center 
                                    rounded-full bg-red-500 text-white 
                                    hover:bg-red-600 hover:scale-110 
                                    transition-all duration-200 shadow-sm"
                                    title="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <TTTable
                            data={

                                sections.filter((tt) => {
                                    const search = companySearch.toLowerCase();

                                    return (
                                        tt.company_name === selectedCompany &&
                                        (
                                            tt.employee_id?.toLowerCase().includes(search) ||
                                            tt.employee_name?.toLowerCase().includes(search) ||
                                            tt.tt_no?.toString().toLowerCase().includes(search) ||
                                            tt.dept_name?.toLowerCase().includes(search)
                                        )
                                    );
                                })

                            }
                        />
                    </div>
                </div>
            </div>


            {/* Department Drawer */}
            {/* Department Drawer */}
            <div
                className={`fixed inset-0 z-50 transition-all duration-300 ${showDeptDrawer ? "visible" : "invisible"
                    }`}
            >
                {/* Overlay */}
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${showDeptDrawer ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={() => {
                        setShowDeptDrawer(false);
                        setDeptSearch("");
                    }}
                />

                {/* Drawer */}
                <div
                    className={`absolute right-0 top-0 h-full w-[650px] shadow-xl transition-transform duration-300 flex flex-col ${showDeptDrawer
                        ? "translate-x-0"
                        : "translate-x-full"
                        }`}
                    style={cardStyle}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b flex flex-col gap-2">

                        {/* Top Section */}
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg text-primary">
                                {deptFilter?.length === 1
                                    ? `${selectedDept?.dept} Department Tickets`
                                    : "All Department Tickets"}
                            </h3>

                            <button
                                onClick={() => {
                                    setShowDeptDrawer(false);
                                    setDeptSearch("");
                                }}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search employee, TT No, department..."
                                className="w-full px-3 py-2 pr-8 text-xs border rounded-md outline-none focus:ring-1 focus:ring-primary"
                                value={deptSearch}
                                onChange={(e) => setDeptSearch(e.target.value)}
                            />

                            {/* Clear Button */}
                            {deptSearch && (
                                <button
                                    onClick={() => setDeptSearch("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 
                        w-6 h-6 flex items-center justify-center 
                        rounded-full bg-red-500 text-white 
                        hover:bg-red-600 hover:scale-110 
                        transition-all duration-200 shadow-sm"
                                    title="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <TTTable
                            data={sections.filter((tt) => {
                                const search = deptSearch.toLowerCase();

                                return (
                                    (deptFilter
                                        ? deptFilter.includes(tt.dept_name)
                                        : true) &&
                                    (
                                        tt.employee_id?.toLowerCase().includes(search) ||
                                        tt.employee_name?.toLowerCase().includes(search) ||
                                        tt.tt_no?.toString().toLowerCase().includes(search) ||
                                        tt.dept_name?.toLowerCase().includes(search)
                                    )
                                );
                            })}
                        />
                    </div>
                </div>
            </div>


            {/* Creator Drawer */}
            <div
                className={`fixed inset-0 z-50 transition-all duration-300 ${showCreatorDrawer ? "visible" : "invisible"
                    }`}
            >
                {/* Overlay */}
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${showCreatorDrawer ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={() => {
                        setShowCreatorDrawer(false);
                        setCreatorSearch("");
                    }}
                />

                {/* Drawer */}
                <div
                    className={`absolute right-0 top-0 h-full w-[650px] shadow-xl transition-transform duration-300 flex flex-col ${showCreatorDrawer
                        ? "translate-x-0"
                        : "translate-x-full"
                        }`}
                    style={cardStyle}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b flex flex-col gap-2">

                        {/* Top Row */}
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg text-primary">
                                {creatorFilter?.length === 1
                                    ? `Tickets Created by ${selectedCreator?.name}`
                                    : "All Creator Tickets"}
                            </h3>

                            <button
                                onClick={() => {
                                    setShowCreatorDrawer(false);
                                    setCreatorSearch("");
                                }}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search employee, TT No, creator..."
                                className="w-full px-3 py-2 pr-8 text-xs border rounded-md outline-none focus:ring-1 focus:ring-primary"
                                value={creatorSearch}
                                onChange={(e) => setCreatorSearch(e.target.value)}
                            />

                            {/* Clear Button */}
                            {creatorSearch && (
                                <button
                                    onClick={() => setCreatorSearch("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 
                        w-6 h-6 flex items-center justify-center 
                        rounded-full bg-red-500 text-white 
                        hover:bg-red-600 hover:scale-110 
                        transition-all duration-200 shadow-sm"
                                    title="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <TTTable
                            data={sections.filter((tt) => {
                                const search = creatorSearch.toLowerCase();

                                return (
                                    (creatorFilter
                                        ? creatorFilter.includes(tt.employee_name)
                                        : true) &&
                                    (
                                        tt.employee_id?.toLowerCase().includes(search) ||
                                        tt.employee_name?.toLowerCase().includes(search) ||
                                        tt.tt_no?.toString().toLowerCase().includes(search) ||
                                        tt.dept_name?.toLowerCase().includes(search)
                                    )
                                );
                            })}
                        />
                    </div>
                </div>
            </div>

        </aside>

    );

}


