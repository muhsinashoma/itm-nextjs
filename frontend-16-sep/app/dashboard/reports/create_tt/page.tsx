// app/dashboard/reports/create_tt/page.tsx


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

    // ✅ USER INFO PREFILLED
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

    // ✅ ADD EMPLOYEE TO TOP
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

    return (
        <div className="p-6 space-y-6">

            {/* TITLE */}
            <h2 className="text-xl font-semibold text-blue-600 border-b-2 border-blue-500 pb-2 text-center">
                Create New TT
                <span className="text-red-500 text-xs ml-2">
                    (Maximum 10 Rows Allowed)
                </span>
            </h2>


            {/* EMPLOYEE SECTION */}
            {employees.map((emp, index) => (
                <div
                    key={emp.number}
                    className="border rounded-md p-4 bg-white space-y-4"
                >
                    <div className="flex justify-between items-center">
                       
                        <span className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
                            Employee #{emp.number}
                        </span>


                        {employees.length > 1 && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeEmployee(index)}
                            >
                                Remove
                            </Button>
                        )}
                    </div>

                    {/* TWO COLUMN LAYOUT */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr] gap-6">
                        {/* LEFT */}
                        <div className="space-y-3">
                            <div>
                                <Label>Employee Name</Label>
                                <Input
                                    value={emp.name}
                                    onChange={(e) => handleChange(index, "name", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Employee ID</Label>
                                <Input
                                    value={emp.id}
                                    onChange={(e) => handleChange(index, "id", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Designation</Label>
                                <Input
                                    value={emp.designation}
                                    onChange={(e) =>
                                        handleChange(index, "designation", e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <Label>Department</Label>
                                <Input
                                    value={emp.department}
                                    onChange={(e) =>
                                        handleChange(index, "department", e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* VERTICAL LINE */}
                        <div className="hidden md:block bg-gray-300"></div>

                        {/* RIGHT */}
                        <div className="space-y-3">
                            <div>
                                <Label>Query Type</Label>
                                <Select
                                    onValueChange={(v) => handleChange(index, "query", v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hardware">Hardware</SelectItem>
                                        <SelectItem value="software">Software</SelectItem>
                                        <SelectItem value="network">Network</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Mobile</Label>
                                <Input
                                    value={emp.phone}
                                    onChange={(e) =>
                                        handleChange(index, "phone", e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <Label>Email</Label>
                                <Input
                                    value={emp.email}
                                    onChange={(e) =>
                                        handleChange(index, "email", e.target.value)
                                    }
                                />
                            </div>

                            {/* ADD BUTTON (BOTTOM LOGIC CAN BE CHANGED IF NEEDED) */}
                            {index === 0 && (
                                <Button
                                    variant="outline"
                                    onClick={addEmployee}
                                    className="border-blue-500 text-blue-500"
                                >
                                    + Add
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* ISSUE DETAILS */}
            <div className="bg-muted p-4 rounded-md space-y-3">
                <Label>Description</Label>
                <Textarea
                    rows={4}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div>
                    <Label>Attachment</Label>
                    <Input
                        type="file"
                        onChange={(e) =>
                            setAttachment(e.target.files?.[0] || null)
                        }
                    />
                </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="bg-blue-200 text-blue-700 hover:bg-blue-300"
                >
                    Cancel
                </Button>
                <Button
                    className="bg-blue-200 text-blue-700 hover:bg-blue-300"
                >
                    Submit Ticket
                </Button>
            </div>

        </div>
    );
}


