
// components/ui/right-sidebar.tsx
"use client";

import { LucideCalendar } from "lucide-react";
import { Calendar } from "./calendar";
import { useState, useEffect } from "react";

import { sections } from "@/components/tt-data";
import { Section } from "@/components/tt-columns";
import TTTable from "../TTTable";
import { X } from "lucide-react";
import { typography } from "@/components/ui/typography";


export function RightSidebar() {
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

    const filteredTickets: Section[] = sections.filter(
        (ticket) => ticket.dept_name === selectedDept?.dept
    );

    const ttCreatorsToday = [
        { name: "Shakil Akhter Khan", color: "bg-pink-100 text-pink-800", count: 1 },
        { name: "Md. Saulad Zahir Alvi", color: "bg-yellow-100 text-yellow-800", count: 2 },
        { name: "Nur Hosen", color: "bg-blue-100 text-blue-800", count: 3 },
        { name: "Rustam Ali", color: "bg-green-100 text-green-800", count: 2 },
        { name: "S.M. Ariful", color: "bg-purple-100 text-purple-800", count: 1 },
        { name: "Ruhul Amin", color: "bg-indigo-100 text-indigo-800", count: 6 },
    ];

    const ttDepartmentToday = [
        { dept: "IT", count: 8, color: "bg-blue-100 text-blue-800" },
        { dept: "HR", count: 4, color: "bg-green-100 text-green-800" },
        { dept: "Technology", count: 4, color: "bg-purple-100 text-purple-800" },
        { dept: "Admin", count: 1, color: "bg-pink-100 text-pink-800" },
        { dept: "Support", count: 0, color: "bg-yellow-100 text-yellow-800" },
        { dept: "Sales", count: 0, color: "bg-indigo-100 text-indigo-800" },
    ];


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
            className="h-full w-full p-3 flex flex-col gap-3 overflow-y-auto overflow-x-hidden transition-colors duration-300"
            style={{ backgroundColor: "var(--dashboard-bg)", color: "var(--foreground)" }}
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
            {/* <div className="border rounded-lg shadow-sm p-3 flex flex-col gap-2 w-full transition-colors duration-300" style={cardStyle}>
                <h4 className={`${typography.label} text-primary mb-1 border-b border-primary pb-0.5`}>
                    Urgent Tasks
                </h4>
                <ul className="space-y-0 text-sm text-muted-foreground">
                    <li>- Approve new requests</li>
                    <li>- Update inventory</li>
                    <li>- Review reports</li>
                </ul>
            </div> */}

            {/* Urgent Tasks */}
            <div
                className="border rounded-lg shadow-sm p-3 flex flex-col gap-2 w-full transition-colors duration-300"
                style={cardStyle}
            >
                <h4 className={`${typography.label} text-primary mb-1 border-b border-primary pb-1`}>
                    Urgent Tasks
                </h4>

                <div className="flex flex-col gap-3 text-sm">

                    {/* Task Item */}
                    <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-md">
                        <div className="leading-tight">
                            <p className={typography.body}>Approve new requests</p>
                            <p className="text-[11px] text-muted-foreground">Due: Today, 3:00 PM</p>
                        </div>
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                            Urgent
                        </span>
                    </div>

                    {/* Task Item */}
                    <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-md">
                        <div>
                            <p className={typography.body}>Update inventory</p>
                            <p className="text-xs text-muted-foreground">Due: Tomorrow</p>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">
                            Medium
                        </span>
                    </div>

                    {/* Task Item */}
                    <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-md">
                        <div>
                            <p className={typography.body}>Review reports</p>
                            <p className="text-xs text-muted-foreground">Due: 10 May 2026</p>
                        </div>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                            Normal
                        </span>
                    </div>

                </div>
            </div>


            {/* Company TT Cards */}
            <div
                className="border rounded-lg shadow-sm p-3 flex flex-col gap-2 w-full transition-colors duration-300"
                style={cardStyle}
            >
                {/* Title */}
                <h4 className={`${typography.label} text-primary mb-1 border-b border-primary pb-0.5`}>
                    Company TT Today
                </h4>

                {/* Grid Content (UNCHANGED DESIGN) */}
                <div className="grid grid-cols-2 gap-2">
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
                            >
                                {/* Company Name */}
                                <span className="text-xs font-medium truncate">
                                    {item.company}
                                </span>

                                {/* Count Badge */}
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.color}`}
                                >
                                    {item.count}
                                </span>
                            </div>
                        ))}
                </div>
            </div>


            {/* Department TT */}
            <div
                className="border rounded-lg shadow-sm p-3 flex flex-col gap-2 w-full transition-colors duration-300"
                style={cardStyle}
            >
                <h4
                    className={`${typography.label} text-primary mb-1 border-b border-primary pb-0.5`}
                >
                    Departmental TT Today
                </h4>

                <div className="flex flex-wrap gap-2">
                    {ttDepartmentToday.slice(0, 4).map((dept, idx) => (
                        <button
                            key={idx}
                            // onClick={() => {
                            //     setSelectedDept(dept);
                            //     setShowDeptDrawer(true);
                            // }}

                            onClick={() => {
                                setDeptFilter([dept.dept]);   // only one dept
                                setSelectedDept(dept);
                                setShowDeptDrawer(true);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all hover:scale-[1.03] ${dept.color}`}
                        >
                            <span>{dept.dept}</span>
                            <span className="font-bold">{dept.count}</span>
                        </button>
                    ))}


                    {ttDepartmentToday.length > 4 && (
                        <button
                            onClick={() => {
                                setDeptFilter(ttDepartmentToday.map(d => d.dept)); // ALL departments
                                setShowDeptDrawer(true);
                            }}
                            className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted-foreground hover:text-muted transition-all"
                        >
                            +{ttDepartmentToday.length - 4}
                        </button>
                    )}
                </div>
            </div>


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
                    {ttCreatorsToday.slice(0, 4).map((creator, index) => {
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

                    {ttCreatorsToday.length > 4 && (
                        <button
                            className="text-sm text-muted-foreground pl-10 hover:underline"
                            //onClick={() => setShowCreatorDrawer(true)}
                            onClick={() => {
                                setCreatorFilter(ttCreatorsToday.map(c => c.name)); // ALL creators
                                setSelectedCreator(null); // optional: means "all"
                                setShowCreatorDrawer(true);
                            }}
                        >
                            +{ttCreatorsToday.length - 4} more
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


