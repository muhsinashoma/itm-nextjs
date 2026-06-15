
//app/dashboard/urgent/create/page.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CreateUrgentTask() {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "High",
        status: "Pending",
        dueDate: "",
        assignedTo: "",
    });

    const handleChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        console.log("Submitted:", formData);
    };

    return (
        <div className="p-6 bg-muted min-h-screen">
            <div className="max-w-5xl mx-auto bg-white border border-border shadow-xl rounded-2xl p-10">

                {/* Header */}
                <div className="mb-10 border-b border-border pb-6">
                    <h2 className="text-3xl font-semibold text-gray-800 tracking-tight">
                        Create Urgent Task
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        Provide the required details below to create a priority task.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT SIDE */}
                        <div className="lg:col-span-2 bg-muted border rounded-xl p-6 space-y-6">
                            <h3 className="text-lg font-semibold text-gray-700">
                                Basic Information
                            </h3>

                            {/* Task Title */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Task Title *
                                </label>
                                <Input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter task title"
                                    className="h-11"
                                    required
                                />
                            </div>

                            {/* Task Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Task Description
                                </label>
                                <Textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Provide brief description..."
                                    rows={3}           // fewer rows
                                    className="resize-none h-24" // fixed smaller height
                                />
                            </div>
                        </div>

                        {/* RIGHT SIDE */}
                        <div className="bg-muted border rounded-xl p-6 space-y-6">
                            <h3 className="text-lg font-semibold text-gray-700">
                                Task Settings
                            </h3>

                            <div className="space-y-4">

                                {/* Assigned To */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Assigned To *
                                    </label>
                                    <select
                                        name="assignedTo"
                                        value={formData.assignedTo}
                                        onChange={handleChange}
                                        required
                                        className="w-full h-11 border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="">Select Employee</option>
                                        <option value="Shakil Akhter Khan">Shakil Akhter Khan</option>
                                        <option value="Md. Saulad Zahir Alvi">Md. Saulad Zahir Alvi</option>
                                        <option value="Nur Hosen">Nur Hosen</option>
                                        <option value="S.M. Ariful">S.M. Ariful</option>
                                        <option value="Ruhul Amin">Ruhul Amin</option>
                                    </select>
                                </div>

                                {/* Due Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Due Date *
                                    </label>
                                    <Input
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        className="h-11"
                                        required
                                    />
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Priority
                                    </label>
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className="w-full h-11 border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="Critical">🔴 Critical</option>
                                        <option value="High">🟠 High</option>
                                        <option value="Medium">🟡 Medium</option>
                                        <option value="Low">🟢 Low</option>
                                    </select>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full h-11 border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex justify-end gap-4 pt-4 border-t border-border mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="px-6 h-11"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 shadow-md"
                        >
                            Save Task
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}