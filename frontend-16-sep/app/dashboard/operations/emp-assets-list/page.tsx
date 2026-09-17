// // //app/dashboard/operations/emp-assets-list/page.tsx


"use client";

import { useEffect, useState } from "react";
import AssignedAssetsModal from "@/components/AssignedAssetsModal";

import { UserAvatar } from "@/components/user-avatar"; // ✅ ADD ONLY THIS
import {
    Monitor,
    Building2,
    Users,
    Shield,
    Cpu,
    Network,
} from "lucide-react";

interface Task {
    id: number;
    employee_id: string;
    assignedTo: string;
    assigned_asset_emp: number;
    department: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchText, setSearchText] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("");

    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    const [showEmpModal, setShowEmpModal] = useState(false);
    const [showDeptModal, setShowDeptModal] = useState(false);

    // ================= LOAD DATA =================
    useEffect(() => {
        const grouped = [].reduce((acc: any, device) => {
            if (!acc[device.employeeId]) {
                acc[device.employeeId] = {
                    employee_id: device.employeeId,
                    assignedTo: device.employeeName,
                    assigned_asset_emp: 0,
                    department: device.department || "Unknown",
                };
            }
            acc[device.employeeId].assigned_asset_emp += 1;
            return acc;
        }, {});

        const formatted: Task[] = Object.values(grouped).map(
            (item: any, index: number) => ({
                id: index + 1,
                ...item,
            })
        );

        setTasks(formatted);
        setLoading(false);
    }, []);

    // ================= SEARCH DEBOUNCE =================
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    // ================= FILTER =================
    const filteredTasks = tasks.filter((task) => {
        const q = debouncedSearch.toLowerCase();
        return (
            (!q ||
                task.employee_id.toLowerCase().includes(q) ||
                task.assignedTo.toLowerCase().includes(q)) &&
            (!deptFilter || task.department === deptFilter)
        );
    });

    // ================= SUMMARY =================
    const departmentSummary = Object.values(
        tasks.reduce((acc: any, item) => {
            if (!acc[item.department]) {
                acc[item.department] = { department: item.department, count: 0 };
            }
            acc[item.department].count += item.assigned_asset_emp;
            return acc;
        }, {})
    );

    const deptEmployees = tasks.filter(
        (t) => t.department === selectedDept
    );

    // ================= ICON =================
    const getDeptIcon = (dept: string) => {
        switch (dept.toLowerCase()) {
            case "it":
                return <Monitor size={16} />;
            case "hr":
                return <Users size={16} />;
            case "admin":
                return <Building2 size={16} />;
            case "security":
                return <Shield size={16} />;
            case "network":
                return <Network size={16} />;
            default:
                return <Cpu size={16} />;
        }
    };

    // ================= CLOSE HANDLERS =================
    const closeEmpModal = () => {
        setShowEmpModal(false);
        setSelectedEmployee(null);
    };

    const closeDeptModal = () => {
        setShowDeptModal(false);
        setSelectedDept(null);
    };

    return (
        <div className="p-6 dashboard-bg min-h-screen">

            {/* HEADER */}
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building2 size={18} />
                Assigned Assets
            </h2>

            {/* ================= DEPARTMENT OVERVIEW ================= */}
            <div className="bg-card border rounded-xl p-4 mb-6">
                <h4 className="text-sm text-muted-foreground mb-3">
                    DEPARTMENT DEVICE OVERVIEW
                </h4>

                <div className="flex flex-wrap gap-3">
                    {departmentSummary.map((dept: any, i: number) => (
                        <button
                            key={i}
                            onClick={() => {
                                closeEmpModal();
                                setSelectedDept(dept.department);
                                setShowDeptModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-muted/30 hover:bg-primary hover:text-white transition"
                        >
                            {getDeptIcon(dept.department)}
                            <span>{dept.department}</span>
                            <span className="ml-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                {dept.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ================= FILTER ================= */}
            <div className="bg-card border rounded-xl p-4 mb-6 flex gap-4 items-end">
                <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search employee..."
                    className="input w-1/3"
                />

                <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="input"
                >
                    <option value="">All Departments</option>
                    {[...new Set(tasks.map((t) => t.department))].map((d) => (
                        <option key={d}>{d}</option>
                    ))}
                </select>

                <div className="ml-auto text-sm text-muted-foreground">
                    {filteredTasks.length} / {tasks.length}
                </div>
            </div>

            {/* ================= TABLE ================= */}
            <div className="bg-card border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="space-y-3 p-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-2 text-left">Emp ID</th>
                                <th className="px-4 py-2 text-left">Name</th>
                                <th className="px-4 py-2 text-left">Devices</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredTasks.map((task) => (
                                <tr key={task.id} className="border-b hover:bg-muted/30">

                                    <td className="px-4 py-2">{task.employee_id}</td>

                                    {/* ✅ AVATAR ADDED HERE */}
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <UserAvatar name={task.assignedTo} />
                                            <span>{task.assignedTo}</span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => {
                                                closeDeptModal();
                                                setSelectedEmployee(task.employee_id);
                                                setShowEmpModal(true);
                                            }}
                                            className="px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary hover:text-white transition"
                                        >
                                            {task.assigned_asset_emp}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ================= EMPLOYEE MODAL ================= */}
            {showEmpModal && selectedEmployee && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/30 flex items-center justify-center"
                    onClick={closeEmpModal}
                >
                    <div
                        className="bg-card w-[90%] max-w-4xl p-6 rounded-xl shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="mb-4 font-semibold">
                            Employee: {selectedEmployee}
                        </h3>

                        <AssignedAssetsModal employeeId={selectedEmployee} />
                    </div>
                </div>
            )}

            {/* ================= DEPARTMENT MODAL ================= */}
            {showDeptModal && selectedDept && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/30 flex items-center justify-center"
                    onClick={closeDeptModal}
                >
                    <div
                        className="w-[95%] max-w-5xl max-h-[85vh] bg-card rounded-2xl shadow-xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-6 py-4 border-b">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {selectedDept} Department
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {deptEmployees.length} Employees
                                </p>
                            </div>

                            <button onClick={closeDeptModal}>✕</button>
                        </div>

                        <div className="overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-card border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Emp ID</th>
                                        <th className="px-6 py-3 text-left">Name</th>
                                        <th className="px-6 py-3 text-left">Devices</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {deptEmployees.map((emp) => (
                                        <tr key={emp.id} className="border-b hover:bg-muted/30">
                                            <td className="px-6 py-3">{emp.employee_id}</td>
                                            <td className="px-6 py-3 flex items-center gap-2">
                                                <UserAvatar name={emp.assignedTo} />
                                                {emp.assignedTo}
                                            </td>
                                            <td className="px-6 py-3">
                                                {emp.assigned_asset_emp}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-3 border-t text-sm text-muted-foreground">
                            Total Employees: {deptEmployees.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

