
// app/assigned_tt/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


interface Task {
    id: number;
    employee_id: string;
    title: string;
    assignedTo: string;
    assigned_tt_no?: number;
}


export default function TasksPage() {

    const router = useRouter();

    // 📦 Tasks from API
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // 🔍 Filters
    const [searchText, setSearchText] = useState("");
    const [memberFilter, setMemberFilter] = useState("");

    // 🚀 Load Tasks From API
    useEffect(() => {
        const loadTasks = async () => {
            try {
                const res = await fetch("/api/reports/assigned_tt"); //routing api
                const data = await res.json();
                setTasks(data);
            } catch (error) {
                console.error("Failed to load tasks", error);
            } finally {
                setLoading(false);
            }
        };

        loadTasks();
    }, []);

    // 🎯 Filter Logic
    const filteredTasks = tasks.filter((task) => {
        return (
            task.title.toLowerCase().includes(searchText.toLowerCase()) &&
            (memberFilter === "" || task.assignedTo === memberFilter)
        );
    });

    return (
        <div className="p-6 bg-muted min-h-screen">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Assigned TT
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your TTs efficiently
                    </p>
                </div>
            </div>

            {/* 🔍 Search Panel */}
            <div className="bg-card rounded-xl shadow-sm border p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">



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

            {/* 📋 Task Table */}
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
                                    Assigned Total TT
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="text-center py-8 text-muted-foreground">
                                        No tasks found
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (


                                    <tr key={task.id} className="border-b hover:bg-muted">

                                        <td className="px-6 py-4">
                                            {task.employee_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            {task.assignedTo}
                                        </td>

                                        <td className="px-6 py-4">

                                            <button
                                                onClick={() => {
                                                    router.push(`/assigned_tt/${encodeURIComponent(task.employee_id)}`);

                                                }}
                                                className="w-9 h-9 flex items-center justify-center 
       bg-blue-100 text-blue-700 rounded-full 
       hover:bg-blue-200 transition font-semibold"
                                                title={`${task.assigned_tt_no} TT(s)`}
                                            >
                                                {task.assigned_tt_no ?? 0}
                                            </button>

                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
}
