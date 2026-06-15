"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/ui/avatar";

/* ================= TYPES ================= */
type Employee = {
    id: number;
    name: string;
    designation: string;
    department: string;
    email: string;
    status: "Active" | "Inactive";
};

/* ================= DATA ================= */
const EMPLOYEES: Employee[] = [
    { id: 1, name: "Muhammad Rahim", designation: "Admin Officer", department: "Admin", email: "rahim@company.com", status: "Active" },
    { id: 2, name: "Ayesha Akter", designation: "HR Executive", department: "HR", email: "ayesha@company.com", status: "Active" },
    { id: 3, name: "Tanvir Hasan", designation: "System Analyst", department: "Software", email: "tanvir@company.com", status: "Active" },
    { id: 4, name: "Nusrat Jahan", designation: "Admin Officer", department: "Admin", email: "nusrat@company.com", status: "Active" },
    { id: 5, name: "Shakil Akhter Khan", designation: "DGM", department: "IT", email: "shakil.khan@company.com", status: "Active" },
    { id: 6, name: "Md. Saulad Zahir Alvi", designation: "Manager", department: "IT", email: "saulad.zahir@company.com", status: "Active" },
    { id: 7, name: "Nur Hosen", designation: "Assistant Manager", department: "IT", email: "nur.hosen@company.com", status: "Active" },
    { id: 8, name: "Masud Rabbi", designation: "Chief HR", department: "HR", email: "masud.rabbi@company.com", status: "Active" },
    { id: 9, name: "Mohammad Anwar Hossain Bhuiyan", designation: "Chief System Officer", department: "Software", email: "anwar.bhuiyan@company.com", status: "Active" },
    { id: 10, name: "Nayma Siddique", designation: "Manager", department: "Chairman Secretariat", email: "nayma.siddique@company.com", status: "Active" },
    { id: 11, name: "Nahida Islam", designation: "Sr. Manager", department: "IP Transmission", email: "nahida.islam@company.com", status: "Active" },
    { id: 12, name: "Sadia Islam", designation: "Sr. Manager", department: "IP Transmission", email: "sadia.islam@company.com", status: "Active" },
];

/* ================= HELPERS ================= */
const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

const getAvatar = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

/* ================= COMPONENT ================= */
export default function EmployeeDashboard() {
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    /* GROUP BY DEPARTMENT */
    const grouped = useMemo(() => {
        return EMPLOYEES.reduce<Record<string, Employee[]>>((acc, emp) => {
            if (!acc[emp.department]) acc[emp.department] = [];
            acc[emp.department].push(emp);
            return acc;
        }, {});
    }, []);

    /* FILTERED DATA */
    const filteredData = useMemo(() => {
        let data = selectedDept
            ? grouped[selectedDept] || []
            : EMPLOYEES;

        return data.filter((e) =>
            e.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [selectedDept, search, grouped]);

    /* EXPORT */
    const exportCSV = () => {
        const rows = [
            ["ID", "Name", "Designation", "Department", "Email", "Status"],
            ...filteredData.map((e) => [
                e.id,
                e.name,
                e.designation,
                e.department,
                e.email,
                e.status,
            ]),
        ];

        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "employees.csv";
        link.click();
    };

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto">

                {/* ================= HEADER ================= */}
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Department Wise Employee Dashboard
                    </h1>
                </div>

                {/* ================= DEPARTMENT OVERVIEW ================= */}
                <div className="mb-6 bg-white border rounded-xl shadow-sm p-3">

                    <div className="flex justify-between mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                            Department Overview
                        </p>
                        <span className="text-[10px] text-muted-foreground">Quick Filter</span>
                    </div>

                    {/* ALL */}
                    <div
                        onClick={() => setSelectedDept(null)}
                        className={`flex justify-between items-center px-3 py-2 rounded-md text-sm cursor-pointer mb-2 border transition
    ${!selectedDept
                                ? "bg-muted text-gray-800 border-gray-300"
                                : "bg-muted hover:bg-muted text-gray-700 border-border"
                            }`}
                    >
                        <span>All</span>
                        <span className={`text-[11px] font-semibold ${!selectedDept ? "text-gray-800" : "text-muted-foreground"}`}>
                            {EMPLOYEES.length}
                        </span>
                    </div>

                    {/* DEPARTMENT LIST */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(grouped).map(([dept, list]) => (
                            <div
                                key={dept}
                                onClick={() => setSelectedDept(dept)}
                                className={`flex justify-between items-center px-3 py-2 rounded-md text-xs cursor-pointer border
                                ${selectedDept === dept
                                        ? "bg-gray-800 text-white"
                                        : "bg-muted hover:bg-muted"
                                    }`}
                            >
                                <span>{dept}</span>
                                <span className={selectedDept === dept ? "text-white" : "text-muted-foreground"}>
                                    {list.length}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ================= TABLE ================= */}
                <div className="bg-card border rounded-xl shadow-sm">

                    {/* TOP BAR */}
                    <div className="p-3 flex justify-between gap-2">
                        <input
                            className="border px-3 py-2 rounded text-sm w-full max-w-sm"
                            placeholder="Search employee..."
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <button
                            onClick={exportCSV}
                            className="bg-green-600 text-white px-3 py-2 rounded text-sm"
                        >
                            Export
                        </button>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted text-xs uppercase">
                                <tr>
                                    <th className="p-3 text-left">SL</th>
                                    <th className="p-3 text-left">Employee</th>
                                    <th className="p-3 text-left">Designation</th>
                                    <th className="p-3 text-left">Department</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredData.map((emp, i) => (
                                    <tr key={emp.id} className="border-b hover:bg-muted">

                                        <td className="p-3">{i + 1}</td>

                                        <td className="p-3 flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={getAvatar(emp.name)} />
                                                <AvatarFallback>
                                                    {getInitials(emp.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {emp.name}
                                        </td>

                                        <td className="p-3">{emp.designation}</td>
                                        <td className="p-3">{emp.department}</td>
                                        <td className="p-3 text-muted-foreground">{emp.email}</td>

                                        <td className="p-3">
                                            <Badge className="bg-green-100 text-green-700">
                                                {emp.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}

                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center p-6 text-muted-foreground">
                                            No data found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

            </div>
        </div>
    );
}