
// app/dashboard/operations/downstream/page.tsx
"use client";

import { useEffect, useState } from "react";
import AssignedAssetsModal from "@/components/AssignedAssetsModal";


interface Task {
    id: number;
    employee_id: string;
    title: string;
    assignedTo: string;
    assigned_asset_emp?: number;
}

export default function TasksPage() {

    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchText, setSearchText] = useState("");
    const [memberFilter, setMemberFilter] = useState("");

    // ✅ NEW: Debounced Search
    const [debouncedSearch, setDebouncedSearch] = useState(searchText);

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const grouped = [].reduce((acc: any, device) => {
                    if (!acc[device.employeeId]) {
                        acc[device.employeeId] = {
                            employee_id: device.employeeId,
                            assignedTo: device.employeeName,
                            assigned_asset_emp: 0,
                        };
                    }

                    acc[device.employeeId].assigned_asset_emp += 1;

                    return acc;
                }, {});

                const formattedTasks: Task[] = Object.values(grouped).map(
                    (item: any, index: number) => ({
                        id: index + 1,
                        employee_id: item.employee_id,
                        title: "Assigned Devices",
                        assignedTo: item.assignedTo,
                        assigned_asset_emp: item.assigned_asset_emp,
                    })
                );

                setTasks(formattedTasks);
            } catch (error) {
                console.error("Failed to load tasks", error);
            } finally {
                setLoading(false);
            }
        };

        loadTasks();
    }, []);

    // ✅ NEW: Debounce Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchText]);

    // ✅ UPDATED: Enterprise Filter
    const filteredTasks = tasks.filter((task) => {
        const query = debouncedSearch.trim().toLowerCase();

        const matchesSearch =
            query === "" ||
            task.employee_id.toLowerCase().includes(query) ||
            task.assignedTo.toLowerCase().includes(query);

        const matchesMember =
            memberFilter === "" || task.assignedTo === memberFilter;

        return matchesSearch && matchesMember;
    });

    return (
        <div className="p-6 bg-muted min-h-screen">

            {/* Header */}
            <div className="flex justify-center items-center mb-6">
                <h4 className="text-xl font-semibold text-blue-600 text-center border-b-2 border-blue-200 inline-block pb-1">
                    Assigned Downstream Assets
                </h4>
            </div>

            {/* Search Panel */}
            <div className="bg-card rounded-xl shadow-sm border p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">

                    {/* ✅ NEW: Search Input */}
                    <div className="md:col-span-2">
                        <label className="text-sm text-muted-foreground mb-1 block">
                            Search Employee
                        </label>
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Search by Employee ID or Name"
                            className="w-full border rounded-lg px-3 py-2 
                                focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Member */}
                    <div>
                        <label className="text-sm text-muted-foreground mb-1 block">
                            ITM Member
                        </label>
                        <select
                            value={memberFilter}
                            onChange={(e) => setMemberFilter(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 
                                focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">All Members</option>
                            {[...new Set(tasks.map(t => t.assignedTo))].map(member => (
                                <option key={member} value={member}>
                                    {member}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Clear */}
                    <div>
                        <button
                            onClick={() => {
                                setSearchText("");
                                setMemberFilter("");
                            }}
                            className="w-full bg-blue-50 border border-blue-200 
                                text-blue-700 rounded-lg py-2 
                                hover:bg-blue-100 transition"
                        >
                            Clear
                        </button>
                    </div>

                    {/* Counter */}
                    <div className="text-sm text-muted-foreground text-center md:text-right">
                        Showing <b>{filteredTasks.length}</b> of {tasks.length}
                    </div>

                </div>
            </div>

            {/* Task Table */}
            <div className="bg-card shadow rounded-lg overflow-hidden">

                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Loading tasks...
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-6 py-3 text-muted-foreground font-medium">
                                    Emp ID
                                </th>
                                <th className="px-6 py-3 text-muted-foreground font-medium">
                                    Assigned To
                                </th>
                                <th className="px-6 py-3 text-muted-foreground font-medium">
                                    Assigned Assets
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No tasks found
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr key={task.id} className="border-b hover:bg-muted">
                                        <td className="px-6 py-4">{task.employee_id}</td>
                                        <td className="px-6 py-4">{task.assignedTo}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedEmployee(task.employee_id);
                                                    setShowModal(true);
                                                }}
                                                className="w-9 h-9 flex items-center justify-center 
                                                    bg-blue-100 text-blue-700 rounded-full 
                                                    hover:bg-blue-200 transition font-semibold"
                                                title={`${task.assigned_asset_emp} TT(s)`}
                                            >
                                                {task.assigned_asset_emp ?? 0}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}

                {/* Modal */}
                {showModal && selectedEmployee && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-card w-[90%] max-w-4xl rounded-xl shadow-lg p-6 relative">

                            {/* Close Button */}
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-3 right-3 text-muted-foreground hover:text-black"
                            >
                                ✕
                            </button>

                            {/* Title */}
                            <h2 className="text-lg font-semibold mb-4 text-blue-600">
                                Assigned Assets - {selectedEmployee}
                            </h2>

                            {/* Content */}
                            <AssignedAssetsModal employeeId={selectedEmployee} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}