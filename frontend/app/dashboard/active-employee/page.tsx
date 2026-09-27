

// //frontend/app/dashboard/active-employee/page.tsx
// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { RefreshCw, Search, Users } from "lucide-react";

// import { Badge } from "@/components/ui/badge";
// import {
//     Avatar,
//     AvatarFallback,
//     AvatarImage,
// } from "@/components/ui/avatar";

// import {
//     employeeApi,
//     type Employee,
// } from "@/lib/api";

// const HRIS_IMAGE_BASE_URL =
//     (
//         process.env.NEXT_PUBLIC_HRIS_IMAGE_BASE_URL ||
//         "https://hris.fiberathome.net/hris/admin"
//     ).replace(/\/+$/, "");

// function getInitials(name: string | null | undefined) {
//     const parts = String(name || "")
//         .trim()
//         .split(/\s+/)
//         .filter(Boolean);

//     if (parts.length === 0) return "NA";
//     if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

//     return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
// }

// function resolveEmployeeImageUrl(value: string | null | undefined) {
//     const image = String(value || "").trim();
//     if (!image) return "";

//     if (
//         image.startsWith("http://") ||
//         image.startsWith("https://") ||
//         image.startsWith("data:") ||
//         image.startsWith("blob:")
//     ) {
//         return image;
//     }

//     return `${HRIS_IMAGE_BASE_URL}/${image.replace(/^\/+/, "")}`;
// }

// function isActiveEmployee(value: string | null | undefined) {
//     const normalized = String(value || "").trim().toLowerCase();
//     return normalized === "yes" || normalized === "active";
// }

// function csvEscape(value: string | number | null | undefined) {
//     return `"${String(value ?? "").replace(/"/g, '""')}"`;
// }

// export default function ActiveEmployeePage() {
//     const [employees, setEmployees] = useState<Employee[]>([]);
//     const [selectedDept, setSelectedDept] = useState<string | null>(null);
//     const [search, setSearch] = useState("");
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");

//     async function loadActiveEmployees() {
//         try {
//             setLoading(true);
//             setError("");

//             const first = await employeeApi.list({
//                 page: 1,
//                 page_size: 200,
//                 active: "Yes",
//             });

//             const firstRows = Array.isArray(first.data) ? first.data : [];
//             const totalPages = Math.max(
//                 1,
//                 Number(
//                     (first as any).total_pages ??
//                     Math.ceil(
//                         Number((first as any).total ?? firstRows.length) / 200,
//                     ),
//                 ) || 1,
//             );

//             let rows = [...firstRows];

//             if (totalPages > 1) {
//                 const remaining = await Promise.all(
//                     Array.from({ length: totalPages - 1 }, (_, index) =>
//                         employeeApi.list({
//                             page: index + 2,
//                             page_size: 200,
//                             active: "Yes",
//                         }),
//                     ),
//                 );

//                 for (const response of remaining) {
//                     if (Array.isArray(response.data)) {
//                         rows.push(...response.data);
//                     }
//                 }
//             }

//             const unique = new Map<string, Employee>();

//             rows
//                 .filter((employee) => isActiveEmployee(employee.active))
//                 .forEach((employee) => {
//                     const id = String(employee.employee_id || "").trim();
//                     if (id) unique.set(id, employee);
//                 });

//             setEmployees(
//                 Array.from(unique.values()).sort((a, b) =>
//                     String(a.employee_name || "").localeCompare(
//                         String(b.employee_name || ""),
//                     ),
//                 ),
//             );
//         } catch (reason) {
//             setEmployees([]);
//             setError(
//                 reason instanceof Error
//                     ? reason.message
//                     : "Unable to load active employees.",
//             );
//         } finally {
//             setLoading(false);
//         }
//     }

//     useEffect(() => {
//         void loadActiveEmployees();
//     }, []);

//     const grouped = useMemo(() => {
//         return employees.reduce<Record<string, Employee[]>>((acc, employee) => {
//             const department =
//                 String(employee.department || "").trim() ||
//                 "Unassigned Department";

//             if (!acc[department]) acc[department] = [];
//             acc[department].push(employee);

//             return acc;
//         }, {});
//     }, [employees]);

//     const departments = useMemo(
//         () =>
//             Object.entries(grouped).sort(([a], [b]) =>
//                 a.localeCompare(b),
//             ),
//         [grouped],
//     );

//     const filteredData = useMemo(() => {
//         const query = search.trim().toLowerCase();
//         const rows = selectedDept
//             ? grouped[selectedDept] || []
//             : employees;

//         if (!query) return rows;

//         return rows.filter((employee) =>
//             [
//                 employee.employee_id,
//                 employee.employee_name,
//                 employee.designation,
//                 employee.department,
//                 employee.email,
//                 employee.official_cell,
//                 employee.personal_cell,
//             ]
//                 .filter(Boolean)
//                 .some((value) =>
//                     String(value).toLowerCase().includes(query),
//                 ),
//         );
//     }, [employees, grouped, search, selectedDept]);

//     function exportCSV() {
//         const rows = [
//             [
//                 "Employee ID",
//                 "Employee Name",
//                 "Designation",
//                 "Department",
//                 "Email",
//                 "Mobile",
//                 "Status",
//             ],
//             ...filteredData.map((employee) => [
//                 employee.employee_id,
//                 employee.employee_name,
//                 employee.designation,
//                 employee.department,
//                 employee.email,
//                 employee.official_cell || employee.personal_cell,
//                 employee.active,
//             ]),
//         ];

//         const csv = rows
//             .map((row) => row.map(csvEscape).join(","))
//             .join("\n");

//         const blob = new Blob([csv], {
//             type: "text/csv;charset=utf-8",
//         });

//         const url = URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.href = url;
//         link.download = "active-employees.csv";
//         link.click();
//         URL.revokeObjectURL(url);
//     }

//     return (
//         <div className="min-h-screen bg-muted/30 p-4">
//             <div className="mx-auto max-w-7xl space-y-3">
//                 <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
//                     <div>
//                         <div className="flex items-center gap-2">
//                             <Users className="h-5 w-5 text-primary" />
//                             <h1 className="text-lg font-semibold">
//                                 Active Employee Directory
//                             </h1>
//                         </div>
//                         <p className="mt-1 text-xs text-muted-foreground">
//                             Real active employee data with HRIS employee images.
//                         </p>
//                     </div>

//                     <div className="flex items-center gap-2">
//                         <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
//                             <span className="text-[10px] font-medium text-emerald-700">
//                                 Active Employees
//                             </span>
//                             <span className="ml-2 text-sm font-bold text-emerald-800">
//                                 {loading ? "…" : employees.length.toLocaleString()}
//                             </span>
//                         </div>

//                         <button
//                             type="button"
//                             onClick={() => void loadActiveEmployees()}
//                             disabled={loading}
//                             className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"
//                         >
//                             <RefreshCw
//                                 className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""
//                                     }`}
//                             />
//                             Refresh
//                         </button>
//                     </div>
//                 </div>

//                 {error && (
//                     <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
//                         {error}
//                     </div>
//                 )}

//                 <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
//                     <div className="mb-2 flex items-center justify-between">
//                         <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
//                             Department Overview
//                         </p>
//                         <span className="text-[10px] text-muted-foreground">
//                             Quick Filter
//                         </span>
//                     </div>

//                     <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
//                         <button
//                             type="button"
//                             onClick={() => setSelectedDept(null)}
//                             className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-[11px] ${!selectedDept
//                                 ? "border-primary bg-primary/10 font-semibold text-primary"
//                                 : "border-border bg-muted/20 hover:bg-muted/50"
//                                 }`}
//                         >
//                             <span>All</span>
//                             <span className="font-semibold tabular-nums">
//                                 {employees.length}
//                             </span>
//                         </button>

//                         {departments.map(([department, list]) => (
//                             <button
//                                 key={department}
//                                 type="button"
//                                 onClick={() =>
//                                     setSelectedDept(
//                                         selectedDept === department
//                                             ? null
//                                             : department,
//                                     )
//                                 }
//                                 className={`flex min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-[11px] ${selectedDept === department
//                                     ? "border-primary bg-primary/10 font-semibold text-primary"
//                                     : "border-border bg-muted/20 hover:bg-muted/50"
//                                     }`}
//                             >
//                                 <span className="truncate" title={department}>
//                                     {department}
//                                 </span>
//                                 <span className="shrink-0 font-semibold tabular-nums">
//                                     {list.length}
//                                 </span>
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
//                     <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
//                         <div className="relative w-full max-w-md">
//                             <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                             <input
//                                 value={search}
//                                 onChange={(event) => setSearch(event.target.value)}
//                                 className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
//                                 placeholder="Search by ID, name, designation, department, email or mobile..."
//                             />
//                         </div>

//                         <div className="flex items-center gap-2">
//                             <span className="text-[10px] text-muted-foreground">
//                                 Showing {filteredData.length.toLocaleString()}
//                             </span>

//                             <button
//                                 type="button"
//                                 onClick={exportCSV}
//                                 disabled={filteredData.length === 0}
//                                 className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
//                             >
//                                 Export CSV
//                             </button>
//                         </div>
//                     </div>

//                     <div className="max-h-[68vh] overflow-auto">
//                         <table className="w-full min-w-[980px] text-[11px]">
//                             <thead className="sticky top-0 z-10 border-b border-border bg-background/95 text-[9px] font-semibold uppercase tracking-[0.04em] text-muted-foreground backdrop-blur">
//                                 <tr>
//                                     <th className="w-[55px] px-3 py-2 text-center">SL</th>
//                                     <th className="px-3 py-2 text-left">Employee</th>
//                                     <th className="px-3 py-2 text-left">Designation</th>
//                                     <th className="px-3 py-2 text-left">Department</th>
//                                     <th className="px-3 py-2 text-left">Email</th>
//                                     <th className="px-3 py-2 text-left">Mobile</th>
//                                     <th className="w-[90px] px-3 py-2 text-center">Status</th>
//                                 </tr>
//                             </thead>

//                             <tbody>
//                                 {loading && employees.length === 0 && (
//                                     <tr>
//                                         <td colSpan={7} className="px-4 py-14 text-center text-muted-foreground">
//                                             <span className="inline-flex items-center gap-2">
//                                                 <RefreshCw className="h-4 w-4 animate-spin text-primary" />
//                                                 Loading active employees...
//                                             </span>
//                                         </td>
//                                     </tr>
//                                 )}

//                                 {!loading && !error && filteredData.length === 0 && (
//                                     <tr>
//                                         <td colSpan={7} className="px-4 py-14 text-center text-muted-foreground">
//                                             No active employees found.
//                                         </td>
//                                     </tr>
//                                 )}

//                                 {filteredData.map((employee, index) => {
//                                     const imageUrl =
//                                         resolveEmployeeImageUrl(employee.picture);

//                                     return (
//                                         <tr
//                                             key={employee.employee_id}
//                                             className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/30"
//                                         >
//                                             <td className="px-3 py-2 text-center font-medium tabular-nums text-muted-foreground">
//                                                 {index + 1}
//                                             </td>

//                                             <td className="px-3 py-2">
//                                                 <div className="flex min-w-0 items-center gap-2.5">
//                                                     <Avatar className="h-9 w-9 shrink-0 border border-border bg-muted">
//                                                         {imageUrl && (
//                                                             <AvatarImage
//                                                                 src={imageUrl}
//                                                                 alt={employee.employee_name || "Employee"}
//                                                                 className="object-cover"
//                                                             />
//                                                         )}
//                                                         <AvatarFallback className="text-[10px] font-bold">
//                                                             {getInitials(employee.employee_name)}
//                                                         </AvatarFallback>
//                                                     </Avatar>

//                                                     <div className="min-w-0">
//                                                         <p
//                                                             className="truncate text-[11px] font-semibold"
//                                                             title={employee.employee_name}
//                                                         >
//                                                             {employee.employee_name || "Employee"}
//                                                         </p>
//                                                         <p className="mt-0.5 font-mono text-[9px] font-semibold text-primary">
//                                                             {employee.employee_id || "—"}
//                                                         </p>
//                                                     </div>
//                                                 </div>
//                                             </td>

//                                             <td className="max-w-[220px] px-3 py-2">
//                                                 <span className="block truncate" title={employee.designation || "—"}>
//                                                     {employee.designation || "—"}
//                                                 </span>
//                                             </td>

//                                             <td className="max-w-[220px] px-3 py-2">
//                                                 <span className="block truncate" title={employee.department || "—"}>
//                                                     {employee.department || "—"}
//                                                 </span>
//                                             </td>

//                                             <td className="max-w-[260px] px-3 py-2 text-muted-foreground">
//                                                 <span className="block truncate" title={employee.email || "—"}>
//                                                     {employee.email || "—"}
//                                                 </span>
//                                             </td>

//                                             <td className="px-3 py-2 font-mono text-[10px]">
//                                                 {employee.official_cell ||
//                                                     employee.personal_cell ||
//                                                     "—"}
//                                             </td>

//                                             <td className="px-3 py-2 text-center">
//                                                 <Badge className="border border-emerald-200 bg-emerald-50 text-[9px] font-semibold text-emerald-700 hover:bg-emerald-50">
//                                                     Active
//                                                 </Badge>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }



"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";

import {
    employeeApi,
    type Employee,
} from "@/lib/api";

const PAGE_SIZE = 200;

const HRIS_IMAGE_BASE_URL =
    (
        process.env.NEXT_PUBLIC_HRIS_IMAGE_BASE_URL ||
        "https://hris.fiberathome.net/hris/admin"
    ).replace(/\/+$/, "");

function getInitials(name: string | null | undefined) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) return "NA";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function resolveEmployeeImageUrl(value: string | null | undefined) {
    const image = String(value || "").trim();

    if (!image) return "";

    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("data:") ||
        image.startsWith("blob:")
    ) {
        return image;
    }

    return `${HRIS_IMAGE_BASE_URL}/${image.replace(/^\/+/, "")}`;
}

function isActiveEmployee(value: string | null | undefined) {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized === "yes" || normalized === "active";
}

function csvEscape(value: string | number | null | undefined) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function ActiveEmployeePage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadActiveEmployees() {
        try {
            setLoading(true);
            setError("");

            const first = await employeeApi.list({
                page: 1,
                page_size: PAGE_SIZE,
                active: "Yes",
            });

            const firstRows = Array.isArray(first.data) ? first.data : [];
            const total = Number(first.total ?? firstRows.length);
            const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

            let rows = [...firstRows];

            // First page is rendered immediately so the screen does not wait
            // for every employee page before becoming useful.
            const firstUnique = new Map<string, Employee>();
            firstRows
                .filter((employee) => isActiveEmployee(employee.active))
                .forEach((employee) => {
                    const id = String(employee.employee_id || "").trim();
                    if (id) firstUnique.set(id, employee);
                });

            const firstVisible = Array.from(firstUnique.values()).sort((a, b) =>
                String(a.employee_name || "").localeCompare(
                    String(b.employee_name || ""),
                ),
            );

            setEmployees(firstVisible);
            setLoading(false);

            // Preload only the photos that are most likely to be visible first.
            if (typeof window !== "undefined") {
                firstVisible.slice(0, 32).forEach((employee) => {
                    const src = resolveEmployeeImageUrl(employee.picture);
                    if (!src) return;

                    const preload = new window.Image();
                    preload.decoding = "async";
                    preload.src = src;
                });
            }

            if (totalPages > 1) {
                const remaining = await Promise.all(
                    Array.from({ length: totalPages - 1 }, (_, index) =>
                        employeeApi.list({
                            page: index + 2,
                            page_size: PAGE_SIZE,
                            active: "Yes",
                        }),
                    ),
                );

                for (const response of remaining) {
                    if (Array.isArray(response.data)) {
                        rows.push(...response.data);
                    }
                }

                const unique = new Map<string, Employee>();

                rows
                    .filter((employee) => isActiveEmployee(employee.active))
                    .forEach((employee) => {
                        const id = String(employee.employee_id || "").trim();
                        if (id) unique.set(id, employee);
                    });

                setEmployees(
                    Array.from(unique.values()).sort((a, b) =>
                        String(a.employee_name || "").localeCompare(
                            String(b.employee_name || ""),
                        ),
                    ),
                );
            }
        } catch (reason) {
            setEmployees([]);
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to load active employees.",
            );
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadActiveEmployees();
    }, []);

    const grouped = useMemo(() => {
        return employees.reduce<Record<string, Employee[]>>((acc, employee) => {
            const department =
                String(employee.department || "").trim() ||
                "Unassigned Department";

            if (!acc[department]) acc[department] = [];
            acc[department].push(employee);

            return acc;
        }, {});
    }, [employees]);

    const departments = useMemo(
        () =>
            Object.entries(grouped).sort(([a], [b]) =>
                a.localeCompare(b),
            ),
        [grouped],
    );

    const filteredData = useMemo(() => {
        const query = search.trim().toLowerCase();
        const rows = selectedDept
            ? grouped[selectedDept] || []
            : employees;

        if (!query) return rows;

        return rows.filter((employee) =>
            [
                employee.employee_id,
                employee.employee_name,
                employee.designation,
                employee.department,
                employee.official_email,
                employee.official_cell,
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value).toLowerCase().includes(query),
                ),
        );
    }, [employees, grouped, search, selectedDept]);

    function exportCSV() {
        const rows = [
            [
                "Employee ID",
                "Employee Name",
                "Designation",
                "Department",
                "Office Email",
                "Official Number",
                "Status",
            ],
            ...filteredData.map((employee) => [
                employee.employee_id,
                employee.employee_name,
                employee.designation,
                employee.department,
                employee.official_email,
                employee.official_cell,
                employee.active,
            ]),
        ];

        const csv = rows
            .map((row) => row.map(csvEscape).join(","))
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "active-employees.csv";
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="min-h-screen bg-muted/30 p-3">
            <div className="mx-auto max-w-[1500px] space-y-2.5">
                <section className="flex flex-col gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <h1 className="text-base font-semibold">
                                Active Employee Directory
                            </h1>
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Active office employees with official contact details.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                            <span className="text-[9px] font-medium text-emerald-700">
                                Active
                            </span>
                            <span className="ml-1.5 text-xs font-bold text-emerald-800">
                                {employees.length.toLocaleString()}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => void loadActiveEmployees()}
                            disabled={loading}
                            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[10px] font-semibold hover:bg-muted disabled:opacity-60"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>
                </section>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                        {error}
                    </div>
                )}

                <section className="rounded-xl border border-border bg-card p-2.5 shadow-sm">
                    <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                            Department Overview
                        </p>
                        <span className="text-[9px] text-muted-foreground">
                            Quick Filter
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-8">
                        <button
                            type="button"
                            onClick={() => setSelectedDept(null)}
                            className={`flex min-w-0 items-center justify-between rounded-md border px-2 py-1 text-[10px] ${!selectedDept
                                    ? "border-primary bg-primary/10 font-semibold text-primary"
                                    : "border-border bg-muted/20 hover:bg-muted/50"
                                }`}
                        >
                            <span>All</span>
                            <span className="font-semibold tabular-nums">
                                {employees.length}
                            </span>
                        </button>

                        {departments.map(([department, list]) => (
                            <button
                                key={department}
                                type="button"
                                onClick={() =>
                                    setSelectedDept(
                                        selectedDept === department
                                            ? null
                                            : department,
                                    )
                                }
                                className={`flex min-w-0 items-center justify-between gap-1 rounded-md border px-2 py-1 text-left text-[10px] ${selectedDept === department
                                        ? "border-primary bg-primary/10 font-semibold text-primary"
                                        : "border-border bg-muted/20 hover:bg-muted/50"
                                    }`}
                            >
                                <span className="truncate" title={department}>
                                    {department}
                                </span>
                                <span className="shrink-0 font-semibold tabular-nums">
                                    {list.length}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-border p-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-lg">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2.5 text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Search ID, name, designation, department, office email or official number..."
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-muted-foreground">
                                Showing {filteredData.length.toLocaleString()}
                            </span>

                            <button
                                type="button"
                                onClick={exportCSV}
                                disabled={filteredData.length === 0}
                                className="h-7 rounded-md bg-emerald-600 px-2.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden">
                        <table className="w-full table-fixed text-[10px]">
                            <thead className="sticky top-0 z-10 border-b border-border bg-background/95 text-[9px] font-semibold uppercase tracking-[0.03em] text-muted-foreground backdrop-blur">
                                <tr>
                                    <th className="w-[4%] px-2 py-1.5 text-center">
                                        SL
                                    </th>
                                    <th className="w-[25%] px-2 py-1.5 text-left">
                                        Employee
                                    </th>
                                    <th className="w-[17%] px-2 py-1.5 text-left">
                                        Designation
                                    </th>
                                    <th className="w-[17%] px-2 py-1.5 text-left">
                                        Department
                                    </th>
                                    <th className="w-[29%] px-2 py-1.5 text-left">
                                        Office Contact
                                    </th>
                                    <th className="w-[8%] px-2 py-1.5 text-center">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading && employees.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-12 text-center text-muted-foreground"
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                                                Loading active employees...
                                            </span>
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    !error &&
                                    filteredData.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-12 text-center text-muted-foreground"
                                            >
                                                No active employees found.
                                            </td>
                                        </tr>
                                    )}

                                {filteredData.map((employee, index) => {
                                    const imageUrl =
                                        resolveEmployeeImageUrl(
                                            employee.picture,
                                        );

                                    return (
                                        <tr
                                            key={employee.employee_id}
                                            className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
                                        >
                                            <td className="px-2 py-1.5 text-center font-medium tabular-nums text-muted-foreground">
                                                {index + 1}
                                            </td>

                                            <td className="min-w-0 px-2 py-1.5">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <Avatar className="h-8 w-8 shrink-0 border border-border bg-muted">
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={
                                                                    employee.employee_name ||
                                                                    "Employee"
                                                                }
                                                                className="h-full w-full object-cover"
                                                                loading={
                                                                    index < 20
                                                                        ? "eager"
                                                                        : "lazy"
                                                                }
                                                                decoding="async"
                                                                fetchPriority={
                                                                    index < 10
                                                                        ? "high"
                                                                        : "auto"
                                                                }
                                                                onError={(
                                                                    event,
                                                                ) => {
                                                                    event.currentTarget.style.display =
                                                                        "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            <AvatarFallback className="text-[9px] font-bold">
                                                                {getInitials(
                                                                    employee.employee_name,
                                                                )}
                                                            </AvatarFallback>
                                                        )}
                                                    </Avatar>

                                                    <div className="min-w-0">
                                                        <p
                                                            className="truncate text-[10px] font-semibold text-foreground"
                                                            title={
                                                                employee.employee_name
                                                            }
                                                        >
                                                            {employee.employee_name ||
                                                                "Employee"}
                                                        </p>
                                                        <p className="mt-0.5 truncate font-mono text-[8.5px] font-semibold text-primary">
                                                            {employee.employee_id ||
                                                                "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="min-w-0 px-2 py-1.5">
                                                <span
                                                    className="block truncate"
                                                    title={
                                                        employee.designation ||
                                                        "—"
                                                    }
                                                >
                                                    {employee.designation ||
                                                        "—"}
                                                </span>
                                            </td>

                                            <td className="min-w-0 px-2 py-1.5">
                                                <span
                                                    className="block truncate"
                                                    title={
                                                        employee.department ||
                                                        "—"
                                                    }
                                                >
                                                    {employee.department ||
                                                        "—"}
                                                </span>
                                            </td>

                                            <td className="min-w-0 px-2 py-1.5">
                                                <p
                                                    className="truncate text-[9.5px] font-medium text-foreground"
                                                    title={
                                                        employee.official_email ||
                                                        "—"
                                                    }
                                                >
                                                    {employee.official_email ||
                                                        "—"}
                                                </p>
                                                <p
                                                    className="mt-0.5 truncate font-mono text-[8.5px] text-muted-foreground"
                                                    title={
                                                        employee.official_cell ||
                                                        "—"
                                                    }
                                                >
                                                    {employee.official_cell ||
                                                        "—"}
                                                </p>
                                            </td>

                                            <td className="px-2 py-1.5 text-center">
                                                <Badge className="border border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[8px] font-semibold text-emerald-700 hover:bg-emerald-50">
                                                    Active
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
