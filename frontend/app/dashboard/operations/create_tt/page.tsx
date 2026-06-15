// app/dashboard/operations/create_tt/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SafeSelect from "@/components/ui/safeselect"; // your client-only select

interface EmployeeEntry {
    number: number;
    name: string;
    id: string;
    designation: string;
    department: string;
    query: string;
    phone: string;
    email: string;
}

export default function CreateTTPage() {
    const router = useRouter();
    const [description, setDescription] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);

    const [employees, setEmployees] = useState<EmployeeEntry[]>([
        {
            number: 1,
            name: "Muhsina Akter",
            id: "02-0051",
            designation: "Assistant Manager",
            department: "Software Development",
            query: "",
            phone: "01715022945",
            email: "muhsina.akter@fiberathome.net",
        },
    ]);

    const handleChange = (
        index: number,
        field: Exclude<keyof EmployeeEntry, "number">,
        value: string
    ) => {
        const updated = [...employees];
        updated[index][field] = value;
        setEmployees(updated);
    };

    const addEmployee = () => {
        if (employees.length >= 10) {
            alert("Maximum 10 employees allowed.");
            return;
        }
        const updated = [
            {
                number: 0,
                name: "",
                id: "",
                designation: "",
                department: "",
                query: "",
                phone: "",
                email: "",
            },
            ...employees,
        ].map((e, i) => ({ ...e, number: i + 1 }));
        setEmployees(updated);
    };

    const removeEmployee = (index: number) => {
        const updated = employees
            .filter((_, i) => i !== index)
            .map((e, i) => ({ ...e, number: i + 1 }));
        setEmployees(updated);
    };

    const handleSubmit = () => {
        for (const emp of employees) {
            if (!emp.name.trim() || !emp.id.trim() || !emp.query.trim()) {
                alert("Please fill Name, ID, and Query for all employees.");
                return;
            }
        }
        // Add your API submission logic here
        alert("Form submitted successfully!");
    };

    return (
        <div className="min-h-screen bg-muted p-8">
            <div className="max-w-full mx-auto bg-white rounded-xl shadow-sm p-6 space-y-6">
                {/* TITLE */}
                <h2 className="text-xl font-semibold text-blue-600 border-b border-border pb-3 text-center">
                    Create New TT
                    <span className="text-red-500 text-xs ml-2">(Maximum 10 Rows Allowed)</span>
                </h2>

                {/* EMPLOYEE SECTION */}
                <div className="space-y-4">
                    {employees.map((emp, index) => (
                        <div
                            key={emp.number}
                            className="bg-muted border border-border rounded-lg p-4"
                        >
                            <div className="flex flex-wrap gap-4 items-end">
                                {/* Name */}
                                <div className="flex-1 min-w-[150px]">
                                    <Label className="text-xs text-muted-foreground">Name</Label>
                                    <Input
                                        value={emp.name}
                                        required
                                        onChange={(e) => handleChange(index, "name", e.target.value)}
                                    />
                                </div>

                                {/* ID */}
                                <div className="flex-1 min-w-[150px]">
                                    <Label className="text-xs text-muted-foreground">ID</Label>
                                    <Input
                                        value={emp.id}
                                        required
                                        onChange={(e) => handleChange(index, "id", e.target.value)}
                                    />
                                </div>

                                {/* Query */}
                                <div className="flex-1 min-w-[150px]">
                                    <Label className="text-xs text-muted-foreground">Query</Label>
                                    <SafeSelect
                                        value={emp.query}
                                        onChange={(v) => handleChange(index, "query", v)}
                                    />
                                </div>

                                {/* Attachment */}
                                <div className="flex-1 min-w-[150px]">
                                    <Label className="text-xs text-muted-foreground">Attachment</Label>
                                    <Input
                                        type="file"
                                        onChange={(e) =>
                                            setAttachment(e.target.files ? e.target.files[0] : null)
                                        }
                                        className="cursor-pointer"
                                    />
                                </div>

                                {/* Description */}
                                <div className="flex-1 min-w-[180px]">
                                    <Label className="text-xs text-muted-foreground">Description</Label>
                                    <textarea
                                        className="w-full border rounded-md p-2 text-sm text-gray-700 min-h-[30px]"
                                        placeholder="Enter query description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 items-end">
                                    {index === 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addEmployee}
                                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                        >
                                            +Add
                                        </Button>
                                    )}

                                    {employees.length > 1 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => removeEmployee(index)}
                                        >
                                            X
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard")}
                        className="border border-gray-300 text-muted-foreground hover:bg-muted"
                    >
                        Cancel
                    </Button>

                    <Button
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handleSubmit}
                    >
                        Submit Ticket
                    </Button>
                </div>
            </div>
        </div>
    );
}