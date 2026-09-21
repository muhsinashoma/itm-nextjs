// frontend/app/dashboard/assets/devices/page.tsx

"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    useRouter,
    useSearchParams,
} from "next/navigation";
import {
    ArrowRightLeft,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Columns3,
    Eye,
    FileWarning,
    Filter,
    MoreHorizontal,
    Pencil,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Trash2,
    UserPlus,
    UserRound,
    X,
} from "lucide-react";

import {
    api,
    assetDeviceApi,
    employeeApi,
    getUser,
    inventoryWorkflowApi,
    type AllocatableRequisition,
    type AssetDevice,
    type Employee,
} from "@/lib/api";

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 50;
const COLUMN_STORAGE_KEY = "itm:asset-devices:visible-columns:v3";

const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "0", label: "Available" },
    { value: "1", label: "Assigned" },
    { value: "2", label: "Damaged" },
    { value: "3", label: "Transferred" },
    { value: "4", label: "Returned" },
    { value: "5", label: "Lost" },
    { value: "7", label: "Ownership Transfer" },
    { value: "8", label: "Claim Raised" },
    { value: "15", label: "Service Request" },
];

type ColumnKey =
    | "serial"
    | "device"
    | "employee"
    | "mrpr"
    | "vendor"
    | "assigned"
    | "purchase"
    | "warranty"
    | "assetType";

const COLUMN_OPTIONS: Array<{ key: ColumnKey; label: string }> = [
    { key: "serial", label: "Serial / Asset ID" },
    { key: "device", label: "Device" },
    { key: "employee", label: "Employee" },
    { key: "mrpr", label: "MR / PR" },
    { key: "vendor", label: "Vendor" },
    { key: "assigned", label: "Assigned Date" },
    { key: "purchase", label: "Purchase Date" },
    { key: "warranty", label: "Warranty End Date" },
    { key: "assetType", label: "Asset Type" },
];

const DEFAULT_COLUMNS: ColumnKey[] = [
    "serial",
    "device",
    "employee",
    "mrpr",
];

type OperationType =
    | "assign-direct"
    | "assign-tt"
    | "update"
    | "return"
    | "owst"
    | "warranty"
    | "reassign"
    | "delete"
    | null;

type OperationalAssetDevice = AssetDevice & {
    stock_inventory_id?: number | null;
    category_id?: number | null;
    brand_id?: number | null;
    model_id?: number | null;
};

type ApprovedTTRequisition = AllocatableRequisition & {
    category_id?: number;
    brand_id?: number;
    model_id?: number;
    brand?: string;
    model?: string;
    department?: string;
    designation?: string;
    approval_status?: string;
    approved_by?: string;
    approved_by_name?: string;
    approved_date?: string;
};

const deviceOperationsApi = {
    update: (
        id: number,
        body: {
            category?: string;
            brand?: string;
            model?: string;
            device_type?: string;
            vendor_name?: string;
            purchase_date?: string;
            warranty_date?: string;
        },
    ) => api.put(`/assets/devices/${id}`, body),

    assignDirect: (
        id: number,
        employee_id: string,
        remarks?: string,
    ) =>
        api.post(`/assets/devices/${id}/assign-direct`, {
            employee_id,
            remarks: remarks ?? "",
        }),

    returnAsset: (id: number, remarks?: string) =>
        api.post(`/assets/devices/${id}/return`, {
            remarks: remarks ?? "",
        }),

    createOWST: (
        id: number,
        body: {
            ownership_type: "employee" | "vendor";
            receiver_id?: string;
            vendor_name?: string;
            deducted_amount?: number;
            remarks?: string;
        },
    ) => api.post(`/assets/devices/${id}/owst`, body),

    createWarrantyClaim: (id: number, problems: string) =>
        api.post(`/assets/devices/${id}/warranty-claim`, { problems }),

    delete: (id: number) =>
        api.del(`/assets/devices/${id}`),
};

function formatDate(value: string | null | undefined) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function dateInputValue(value: string | null | undefined) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function statusClass(status: number) {
    const map: Record<number, string> = {
        0: "border-violet-200 bg-violet-50 text-violet-700",
        1: "border-blue-200 bg-blue-50 text-blue-700",
        2: "border-orange-200 bg-orange-50 text-orange-700",
        3: "border-amber-200 bg-amber-50 text-amber-700",
        4: "border-emerald-200 bg-emerald-50 text-emerald-700",
        5: "border-red-200 bg-red-50 text-red-700",
        7: "border-teal-200 bg-teal-50 text-teal-700",
        8: "border-pink-200 bg-pink-50 text-pink-700",
        15: "border-cyan-200 bg-cyan-50 text-cyan-700",
    };

    return map[status] ?? "border-slate-200 bg-slate-50 text-slate-700";
}

function getInitials(name: string | null) {
    if (!name?.trim()) return "NA";

    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function EmployeeAvatar({
    name,
    image,
}: {
    name: string | null;
    image: string | null | undefined;
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const canShowImage = Boolean(image && !imageFailed);

    return (
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-bold text-foreground">
            {canShowImage ? (
                <img
                    src={image!}
                    alt={name || "Employee"}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : name ? (
                getInitials(name)
            ) : (
                <UserRound className="h-4 w-4 text-muted-foreground" />
            )}
        </div>
    );
}

function EmployeeSearchBox({
    query,
    onQueryChange,
    results,
    selected,
    onSelect,
    searching,
}: {
    query: string;
    onQueryChange: (value: string) => void;
    results: Employee[];
    selected: Employee | null;
    onSelect: (employee: Employee) => void;
    searching: boolean;
}) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">
                Employee <span className="text-red-500">*</span>
            </label>

            {selected ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                    <div>
                        <p className="text-sm font-semibold">
                            {selected.employee_id} · {selected.employee_name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {[selected.department, selected.designation]
                                .filter(Boolean)
                                .join(" · ") || "Employee selected"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onQueryChange("");
                        }}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                        title="Change employee"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        placeholder="Search employee ID or name..."
                        className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />

                    {(searching || results.length > 0) && query.trim().length >= 2 && (
                        <div className="absolute left-0 right-0 top-[44px] z-[80] max-h-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-xl">
                            {searching ? (
                                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                    Searching employees...
                                </div>
                            ) : (
                                results.map((employee) => (
                                    <button
                                        type="button"
                                        key={employee.employee_id}
                                        onClick={() => onSelect(employee)}
                                        className="w-full rounded-md px-3 py-2 text-left hover:bg-muted"
                                    >
                                        <p className="text-sm font-semibold">
                                            {employee.employee_id} · {employee.employee_name}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {[employee.department, employee.designation]
                                                .filter(Boolean)
                                                .join(" · ") || "—"}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AssetDevicesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [items, setItems] = useState<OperationalAssetDevice[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [categoryInput, setCategoryInput] = useState("");
    const [category, setCategory] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [showImportNotice, setShowImportNotice] = useState(true);

    const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
        () => new Set(DEFAULT_COLUMNS),
    );

    const [operation, setOperation] = useState<OperationType>(null);
    const [selectedAsset, setSelectedAsset] = useState<OperationalAssetDevice | null>(null);
    const [operationBusy, setOperationBusy] = useState(false);
    const [operationError, setOperationError] = useState("");
    const [remarks, setRemarks] = useState("");

    const [employeeQuery, setEmployeeQuery] = useState("");
    const [employeeResults, setEmployeeResults] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [employeeSearching, setEmployeeSearching] = useState(false);

    const [requisitionQuery, setRequisitionQuery] = useState("");
    const [requisitionResults, setRequisitionResults] = useState<ApprovedTTRequisition[]>([]);
    const [selectedRequisition, setSelectedRequisition] = useState<ApprovedTTRequisition | null>(null);
    const [requisitionLoading, setRequisitionLoading] = useState(false);

    const [updateForm, setUpdateForm] = useState({
        category: "",
        brand: "",
        model: "",
        device_type: "",
        vendor_name: "",
        purchase_date: "",
        warranty_date: "",
    });

    const [owstType, setOWSTType] = useState<"employee" | "vendor">("employee");
    const [owstVendor, setOWSTVendor] = useState("");
    const [owstAmount, setOWSTAmount] = useState("");
    const [warrantyProblems, setWarrantyProblems] = useState("");

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const authUser = getUser();
    const isRoot =
        authUser?.role_code?.trim().toUpperCase() === "ROOT" ||
        Number(authUser?.user_type) === 0;

    const importSuccess = searchParams.get("import") === "success";
    const importMR = searchParams.get("mr") ?? "";
    const importedCount = Number(searchParams.get("imported") ?? 0);
    const updatedCount = Number(searchParams.get("updated") ?? 0);
    const stockCommittedCount = Number(searchParams.get("stock_committed") ?? 0);
    const assetsCreatedCount = Number(searchParams.get("assets_created") ?? importedCount);
    const conflictedCount = Number(searchParams.get("conflicted") ?? 0);
    const conflictAssetID = Number(searchParams.get("conflict_asset_id") ?? 0);
    const conflictSerial = searchParams.get("conflict_serial") ?? "";

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(COLUMN_STORAGE_KEY);
            if (!saved) return;
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return;
            const valid = parsed.filter((key): key is ColumnKey =>
                COLUMN_OPTIONS.some((column) => column.key === key),
            );
            if (valid.length > 0) setVisibleColumns(new Set(valid));
        } catch {
            // Keep defaults when old browser storage is malformed.
        }
    }, []);

    useEffect(() => {
        if (!importSuccess || !importMR) return;
        setSearchInput(importMR);
        setSearch(importMR);
        setPage(1);
    }, [importSuccess, importMR]);

    const loadAssets = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await assetDeviceApi.list({
                page,
                limit: PAGE_SIZE,
                search: search || undefined,
                status: status ? Number(status) : undefined,
                category: category || undefined,
            });

            setItems(response.data ?? []);
            setTotal(response.total ?? 0);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load asset devices",
            );
        } finally {
            setLoading(false);
        }
    }, [page, search, status, category]);

    useEffect(() => {
        void loadAssets();
    }, [loadAssets]);

    useEffect(() => {
        const needsEmployeeSearch =
            operation === "assign-direct" ||
            operation === "reassign" ||
            (operation === "owst" && owstType === "employee");

        if (!needsEmployeeSearch || selectedEmployee) {
            setEmployeeResults([]);
            return;
        }

        const query = employeeQuery.trim();
        if (query.length < 2) {
            setEmployeeResults([]);
            return;
        }

        const timer = window.setTimeout(async () => {
            try {
                setEmployeeSearching(true);
                const response = await employeeApi.search(
                    encodeURIComponent(query),
                );
                setEmployeeResults(response.data ?? []);
            } catch {
                setEmployeeResults([]);
            } finally {
                setEmployeeSearching(false);
            }
        }, 300);

        return () => window.clearTimeout(timer);
    }, [employeeQuery, operation, owstType, selectedEmployee]);

    useEffect(() => {
        if (operation !== "assign-tt" || !selectedAsset) {
            setRequisitionResults([]);
            return;
        }

        const timer = window.setTimeout(async () => {
            try {
                setRequisitionLoading(true);
                setOperationError("");
                const query = new URLSearchParams();

                if (selectedAsset.category_id) {
                    query.set("category_id", String(selectedAsset.category_id));
                } else if (selectedAsset.category) {
                    // Compatibility fallback for unresolved legacy assets.
                    query.set("category", selectedAsset.category);
                }

                if (requisitionQuery.trim()) {
                    query.set("search", requisitionQuery.trim());
                }

                const response = await api.get<{
                    success: boolean;
                    data: ApprovedTTRequisition[];
                }>(
                    `/inventory-workflow/allocatable-requisitions?${query.toString()}`,
                );

                setRequisitionResults(response.data ?? []);
            } catch (reason) {
                setRequisitionResults([]);
                setOperationError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load approved TT requisitions.",
                );
            } finally {
                setRequisitionLoading(false);
            }
        }, 250);

        return () => window.clearTimeout(timer);
    }, [operation, requisitionQuery, selectedAsset]);

    function applyFilters() {
        setPage(1);
        setSearch(searchInput.trim());
        setCategory(categoryInput.trim());
    }

    function clearFilters() {
        setSearchInput("");
        setSearch("");
        setStatus("");
        setCategoryInput("");
        setCategory("");
        setPage(1);
    }

    function toggleColumn(key: ColumnKey) {
        setVisibleColumns((current) => {
            const next = new Set(current);
            if (next.has(key)) next.delete(key);
            else next.add(key);

            if (next.size === 0) next.add("serial");
            window.localStorage.setItem(
                COLUMN_STORAGE_KEY,
                JSON.stringify(Array.from(next)),
            );
            return next;
        });
    }

    function openDevice(item: OperationalAssetDevice) {
        router.push(`/dashboard/assets/devices/${item.id}`);
    }

    function openOperation(item: OperationalAssetDevice, next: Exclude<OperationType, null>) {
        setSelectedAsset(item);
        setOperation(next);
        setOperationError("");
        setRemarks("");
        setEmployeeQuery("");
        setEmployeeResults([]);
        setSelectedEmployee(null);
        setRequisitionQuery("");
        setRequisitionResults([]);
        setSelectedRequisition(null);
        setOWSTType("employee");
        setOWSTVendor("");
        setOWSTAmount("");
        setWarrantyProblems("");
        setUpdateForm({
            category: item.category ?? "",
            brand: item.brand ?? "",
            model: item.model ?? "",
            device_type: item.device_type ?? "",
            vendor_name: item.vendor_name ?? "",
            purchase_date: dateInputValue(item.purchase_date),
            warranty_date: dateInputValue(item.warranty_date),
        });
    }

    function closeOperation() {
        if (operationBusy) return;
        setOperation(null);
        setSelectedAsset(null);
        setOperationError("");
    }

    async function submitOperation() {
        if (!selectedAsset || !operation) return;

        try {
            setOperationBusy(true);
            setOperationError("");
            let message = "Device operation completed successfully.";

            if (operation === "assign-direct" || operation === "reassign") {
                if (!selectedEmployee) {
                    setOperationError("Select an employee first.");
                    return;
                }

                await deviceOperationsApi.assignDirect(
                    selectedAsset.id,
                    selectedEmployee.employee_id,
                    remarks,
                );

                message =
                    operation === "reassign"
                        ? `Device reassigned to ${selectedEmployee.employee_id} · ${selectedEmployee.employee_name}.`
                        : `Device assigned directly to ${selectedEmployee.employee_id} · ${selectedEmployee.employee_name}.`;
            }

            if (operation === "assign-tt") {
                if (!selectedRequisition) {
                    setOperationError("Select an approved TT requisition first.");
                    return;
                }
                if (!selectedAsset.stock_inventory_id) {
                    setOperationError(
                        "This asset is not linked to an SCM stock row, so TT allocation cannot be completed from this screen.",
                    );
                    return;
                }

                await inventoryWorkflowApi.assignToRequisition(
                    selectedRequisition.id,
                    selectedAsset.stock_inventory_id,
                    remarks,
                );

                message = `Device assigned and delivered against TT ${selectedRequisition.tt_no}.`;
            }

            if (operation === "update") {
                await deviceOperationsApi.update(selectedAsset.id, updateForm);
                message = "Device information updated.";
            }

            if (operation === "return") {
                await deviceOperationsApi.returnAsset(selectedAsset.id, remarks);
                message = "Device marked as Returned and is ready for transfer/reassignment.";
            }

            if (operation === "owst") {
                if (owstType === "employee" && !selectedEmployee) {
                    setOperationError("Select the ownership receiver employee.");
                    return;
                }
                if (owstType === "vendor" && !owstVendor.trim()) {
                    setOperationError("Enter the receiving vendor name.");
                    return;
                }

                await deviceOperationsApi.createOWST(selectedAsset.id, {
                    ownership_type: owstType,
                    receiver_id:
                        owstType === "employee"
                            ? selectedEmployee?.employee_id
                            : undefined,
                    vendor_name:
                        owstType === "vendor"
                            ? owstVendor.trim()
                            : undefined,
                    deducted_amount: Number(owstAmount || 0),
                    remarks,
                });
                message = "OWST created and device status changed to Ownership Transfer.";
            }

            if (operation === "warranty") {
                if (!warrantyProblems.trim()) {
                    setOperationError("Describe the warranty problem first.");
                    return;
                }
                await deviceOperationsApi.createWarrantyClaim(
                    selectedAsset.id,
                    warrantyProblems.trim(),
                );
                message = "Warranty claim raised and device status changed to Claim Raised.";
            }

            if (operation === "delete") {
                await deviceOperationsApi.delete(selectedAsset.id);
                message = "Asset device deleted by ROOT user.";
            }

            setOperation(null);
            setSelectedAsset(null);
            setNotice(message);
            await loadAssets();
        } catch (reason) {
            setOperationError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to complete device operation.",
            );
        } finally {
            setOperationBusy(false);
        }
    }

    const visibleCount = visibleColumns.size + 2;
    const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(page * PAGE_SIZE, total);

    const operationTitle = useMemo(() => {
        switch (operation) {
            case "assign-direct":
                return "Assign to Employee Directly";
            case "assign-tt":
                return "Assign from Approved TT Requisition";
            case "update":
                return "Update Device";
            case "return":
                return "Return Device";
            case "owst":
                return "OWST · Ownership Transfer";
            case "warranty":
                return "Raise Warranty Claim";
            case "reassign":
                return "Transferred / Reassign Returned Device";
            case "delete":
                return "Delete Asset Device";
            default:
                return "Device Operation";
        }
    }, [operation]);

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Dashboard</span>
                        <span>/</span>
                        <span>Inventory</span>
                        <span>/</span>
                        <span className="font-medium text-primary">Device Operations</span>
                    </div>

                    <h1 className="text-xl font-bold text-foreground">
                        Device Operations Control Center
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Search, assign, return, transfer, claim and maintain devices from one page.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
                            >
                                <Columns3 className="h-4 w-4" />
                                Columns
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Show / hide columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {COLUMN_OPTIONS.map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.key}
                                    checked={visibleColumns.has(column.key)}
                                    onCheckedChange={() => toggleColumn(column.key)}
                                >
                                    {column.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                        type="button"
                        onClick={() => void loadAssets()}
                        disabled={loading}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>

                    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">Total Devices:</span>
                        <span className="ml-1 font-bold text-primary">
                            {total.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {importSuccess && showImportNotice && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                    <div className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold">SCM stock import completed</p>
                            <p className="mt-0.5 text-xs">
                                {conflictedCount > 0 ? (
                                    <>
                                        MR: {importMR || "—"} · {stockCommittedCount || importedCount + updatedCount} stock row(s) committed · {assetsCreatedCount} new asset(s) · {updatedCount} synchronized · {conflictedCount} serial conflict(s). Conflicting serials were not duplicated.
                                        {conflictSerial ? ` First conflict: ${conflictSerial}.` : ""}
                                    </>
                                ) : (
                                    <>MR: {importMR || "—"} · {importedCount} new · {updatedCount} synchronized. Imported rows are filtered below.</>
                                )}
                            </p>
                            {conflictedCount > 0 && conflictAssetID > 0 && (
                                <button
                                    type="button"
                                    onClick={() => router.push(`/dashboard/assets/devices/${conflictAssetID}`)}
                                    className="mt-2 inline-flex h-7 items-center rounded-md border border-amber-300 bg-white px-2.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-50"
                                >
                                    View Existing Asset #{conflictAssetID}
                                </button>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowImportNotice(false)}
                        className="rounded-md p-1 hover:bg-emerald-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {notice && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {notice}
                    </span>
                    <button type="button" onClick={() => setNotice("")}>
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1.6fr)_180px_180px_auto]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") applyFilters();
                            }}
                            placeholder="Search serial, asset ID, employee, brand, model, vendor, MR or PR..."
                            className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                        className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {STATUS_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <input
                        value={categoryInput}
                        onChange={(event) => {
                            setCategoryInput(event.target.value);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") applyFilters();
                        }}
                        placeholder="Category, e.g. Laptop"
                        className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                        >
                            <Filter className="h-4 w-4" />
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                            title="Clear filters"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                        <thead className="border-b border-border bg-muted/40">
                            <tr className="text-left text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                                {visibleColumns.has("serial") && <th className="min-w-[170px] px-4 py-3">Serial / Asset</th>}
                                {visibleColumns.has("device") && <th className="min-w-[240px] px-4 py-3">Device</th>}
                                {visibleColumns.has("employee") && <th className="min-w-[250px] px-4 py-3">Employee</th>}
                                {visibleColumns.has("mrpr") && <th className="min-w-[210px] px-4 py-3">MR / PR</th>}
                                {visibleColumns.has("vendor") && <th className="min-w-[160px] px-4 py-3">Vendor</th>}
                                {visibleColumns.has("assigned") && <th className="min-w-[125px] px-4 py-3">Assigned</th>}
                                {visibleColumns.has("purchase") && <th className="min-w-[125px] px-4 py-3">Purchase</th>}
                                {visibleColumns.has("warranty") && <th className="min-w-[135px] px-4 py-3">Warranty End</th>}
                                {visibleColumns.has("assetType") && <th className="min-w-[120px] px-4 py-3">Asset Type</th>}
                                <th className="sticky right-[76px] z-30 min-w-[125px] border-l border-border bg-muted px-3 py-3">Status</th>
                                <th className="sticky right-0 z-40 w-[76px] min-w-[76px] bg-muted px-3 py-3 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={visibleCount} className="px-4 py-16 text-center text-muted-foreground">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                                            Loading asset devices...
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && error && (
                                <tr>
                                    <td colSpan={visibleCount} className="px-4 py-16 text-center text-red-600">
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && items.length === 0 && (
                                <tr>
                                    <td colSpan={visibleCount} className="px-4 py-16 text-center text-muted-foreground">
                                        No asset devices found.
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && items.map((item) => (
                                <tr
                                    key={item.id}
                                    onDoubleClick={() => openDevice(item)}
                                    className="group border-b border-border/70 transition-colors hover:bg-primary/[0.035]"
                                >
                                    {visibleColumns.has("serial") && (
                                        <td className="px-4 py-3">
                                            <div className="font-semibold tracking-wide text-foreground">
                                                {item.device_serial || "—"}
                                            </div>
                                            <div className="mt-1 text-[11px] text-muted-foreground">
                                                Asset ID #{item.id}
                                            </div>
                                        </td>
                                    )}

                                    {visibleColumns.has("device") && (
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-foreground">
                                                {item.category || "Uncategorized"}
                                            </div>
                                            <div className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                                                {[item.brand, item.model].filter(Boolean).join(" · ") || "—"}
                                            </div>
                                        </td>
                                    )}

                                    {visibleColumns.has("employee") && (
                                        <td className="px-4 py-3">
                                            <div className="flex min-w-[210px] items-center gap-2.5">
                                                <EmployeeAvatar name={item.emp_name} image={item.employee_image} />
                                                <div className="min-w-0">
                                                    <div className="truncate font-semibold text-foreground">
                                                        {item.emp_id
                                                            ? `${item.emp_id} · ${item.emp_name || "Employee"}`
                                                            : "Unassigned"}
                                                    </div>
                                                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                                        {item.emp_id
                                                            ? [item.department, item.designation]
                                                                .filter(Boolean)
                                                                .join(" · ") || "—"
                                                            : "No employee assigned"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    )}

                                    {visibleColumns.has("mrpr") && (
                                        <td className="px-4 py-3">
                                            <div className="max-w-[210px] break-all text-xs font-medium">
                                                {item.mr_number || "—"}
                                            </div>
                                            <div className="mt-1 max-w-[210px] break-all text-[11px] text-muted-foreground">
                                                {item.pr_number || "—"}
                                            </div>
                                        </td>
                                    )}

                                    {visibleColumns.has("vendor") && (
                                        <td className="px-4 py-3 text-xs font-medium">
                                            {item.vendor_name || "—"}
                                        </td>
                                    )}

                                    {visibleColumns.has("assigned") && (
                                        <td className="px-4 py-3 text-xs font-medium">
                                            {formatDate(item.assigned_date)}
                                        </td>
                                    )}

                                    {visibleColumns.has("purchase") && (
                                        <td className="px-4 py-3 text-xs font-medium">
                                            {formatDate(item.purchase_date)}
                                        </td>
                                    )}

                                    {visibleColumns.has("warranty") && (
                                        <td className="px-4 py-3 text-xs font-medium">
                                            {formatDate(item.warranty_date)}
                                        </td>
                                    )}

                                    {visibleColumns.has("assetType") && (
                                        <td className="px-4 py-3 text-xs font-medium">
                                            {item.device_type || "—"}
                                        </td>
                                    )}

                                    <td className="sticky right-[76px] z-20 border-l border-border bg-card px-3 py-3 group-hover:bg-muted/30">
                                        <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(item.asset_status)}`}>
                                            {item.status_label ||
                                                STATUS_OPTIONS.find(
                                                    (statusItem) =>
                                                        statusItem.value === String(item.asset_status)
                                                )?.label ||
                                                `Status ${item.asset_status}`}
                                        </span>
                                    </td>

                                    <td className="sticky right-0 z-30 bg-card px-3 py-3 text-right group-hover:bg-muted/30">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    aria-label={`Actions for ${item.device_serial || "asset device"}`}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end" className="w-64">
                                                <DropdownMenuLabel>
                                                    {item.status_label} · Device Actions
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                {item.asset_status === 0 && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "assign-direct")} className="gap-2">
                                                            <UserPlus className="h-4 w-4 text-primary" />
                                                            Assign to Employee Directly
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "assign-tt")} className="gap-2">
                                                            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                                                            Assign from Approved TT Requisition
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openDevice(item)} className="gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "update")} className="gap-2">
                                                            <Pencil className="h-4 w-4 text-amber-600" />
                                                            Update
                                                        </DropdownMenuItem>
                                                    </>
                                                )}

                                                {item.asset_status === 1 && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => openDevice(item)} className="gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "update")} className="gap-2">
                                                            <Pencil className="h-4 w-4 text-amber-600" />
                                                            Update
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openOperation(item, "return")} className="gap-2">
                                                            <RotateCcw className="h-4 w-4 text-emerald-600" />
                                                            Return
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "owst")} className="gap-2">
                                                            <ArrowRightLeft className="h-4 w-4 text-teal-600" />
                                                            OWST
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "warranty")} className="gap-2">
                                                            <ShieldCheck className="h-4 w-4 text-violet-600" />
                                                            Warranty Claim
                                                        </DropdownMenuItem>
                                                        {isRoot && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => openOperation(item, "delete")} className="gap-2 text-red-600 focus:text-red-600">
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Delete · ROOT only
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {item.asset_status === 4 && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => openDevice(item)} className="gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "update")} className="gap-2">
                                                            <Pencil className="h-4 w-4 text-amber-600" />
                                                            Update
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "reassign")} className="gap-2">
                                                            <ArrowRightLeft className="h-4 w-4 text-primary" />
                                                            Transferred / Reassign
                                                        </DropdownMenuItem>
                                                        {isRoot && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => openOperation(item, "delete")} className="gap-2 text-red-600 focus:text-red-600">
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Delete · ROOT only
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {![0, 1, 4].includes(item.asset_status) && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => openDevice(item)} className="gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "update")} className="gap-2">
                                                            <Pencil className="h-4 w-4 text-amber-600" />
                                                            Update
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{startItem}</span>
                        {" - "}
                        <span className="font-semibold text-foreground">{endItem}</span>
                        {" of "}
                        <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </button>

                        <span className="px-1 text-sm text-muted-foreground">
                            Page <span className="font-semibold text-foreground">{page}</span> of{" "}
                            <span className="font-semibold text-foreground">{totalPages}</span>
                        </span>

                        <button
                            type="button"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <Dialog open={Boolean(operation && selectedAsset)} onOpenChange={(open) => !open && closeOperation()}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{operationTitle}</DialogTitle>
                        <DialogDescription>
                            {selectedAsset
                                ? `${selectedAsset.device_serial || `Asset #${selectedAsset.id}`} · ${selectedAsset.category || "Device"}`
                                : "Device operation"}
                        </DialogDescription>
                    </DialogHeader>

                    {operationError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {operationError}
                        </div>
                    )}

                    {(operation === "assign-direct" || operation === "reassign") && (
                        <div className="space-y-4 py-2">
                            <EmployeeSearchBox
                                query={employeeQuery}
                                onQueryChange={(value) => {
                                    setEmployeeQuery(value);
                                    if (!value) setSelectedEmployee(null);
                                }}
                                results={employeeResults}
                                selected={selectedEmployee}
                                onSelect={(employee) => {
                                    setSelectedEmployee(employee);
                                    setEmployeeResults([]);
                                    setEmployeeQuery("");
                                }}
                                searching={employeeSearching}
                            />
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">Remarks</span>
                                <textarea
                                    value={remarks}
                                    onChange={(event) => setRemarks(event.target.value)}
                                    rows={3}
                                    placeholder="Optional assignment note"
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </label>
                        </div>
                    )}

                    {operation === "assign-tt" && (
                        <div className="space-y-4 py-2">
                            {!selectedAsset?.stock_inventory_id && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    This asset has no linked SCM stock row. Direct assignment remains available, but TT allocation requires an SCM stock link.
                                </div>
                            )}

                            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                                <span className="font-semibold">Matching:</span>{" "}
                                {selectedAsset?.category || "Uncategorized"}
                                {selectedAsset?.category_id ? ` (Category ID ${selectedAsset.category_id})` : " · legacy label fallback"}
                                {selectedAsset?.brand ? ` · ${selectedAsset.brand}` : ""}
                                {selectedAsset?.model ? ` · ${selectedAsset.model}` : ""}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">
                                    Approved TT Requisition <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        value={requisitionQuery}
                                        onChange={(event) => setRequisitionQuery(event.target.value)}
                                        placeholder="Search TT no, employee ID or name..."
                                        className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-border">
                                    {requisitionLoading ? (
                                        <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                                            Loading approved requisitions...
                                        </div>
                                    ) : requisitionResults.length === 0 ? (
                                        <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                                            No approved, unfulfilled TT requisition found for this device category.
                                        </div>
                                    ) : (
                                        requisitionResults.map((req) => (
                                            <button
                                                type="button"
                                                key={req.id}
                                                onClick={() => setSelectedRequisition(req)}
                                                className={`flex w-full items-start justify-between gap-3 border-b border-border px-3 py-2.5 text-left last:border-b-0 ${selectedRequisition?.id === req.id ? "bg-primary/10" : "hover:bg-muted"}`}
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold">TT {req.tt_no}</p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {req.employee_id} · {req.employee_name}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {req.category}
                                                        {req.brand ? ` · ${req.brand}` : ""}
                                                        {req.model ? ` · ${req.model}` : ""}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {req.approval_status || (req.approved_val === 3 ? "PR (Approved)" : "Petty Cash (Approved)")}
                                                        {req.approved_by
                                                            ? ` · ${req.approved_by}${req.approved_by_name ? ` · ${req.approved_by_name}` : ""}`
                                                            : ""}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                        {req.approved_date ? `Approved ${formatDate(req.approved_date)}` : ""}
                                                        {req.department ? ` · ${req.department}` : ""}
                                                        {req.reason_details ? ` · ${req.reason_details}` : ""}
                                                    </p>
                                                </div>
                                                {selectedRequisition?.id === req.id && (
                                                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">Assignment / Delivery Remarks</span>
                                <textarea
                                    value={remarks}
                                    onChange={(event) => setRemarks(event.target.value)}
                                    rows={3}
                                    placeholder="Optional handover note"
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </label>
                        </div>
                    )}

                    {operation === "update" && (
                        <div className="grid gap-3 py-2 sm:grid-cols-2">
                            {[
                                ["category", "Category"],
                                ["brand", "Brand"],
                                ["model", "Model"],
                                ["device_type", "Asset Type"],
                                ["vendor_name", "Vendor"],
                            ].map(([key, label]) => (
                                <label key={key} className={key === "model" ? "sm:col-span-2" : ""}>
                                    <span className="mb-1 block text-xs font-semibold">{label}</span>
                                    <input
                                        value={updateForm[key as keyof typeof updateForm]}
                                        onChange={(event) => setUpdateForm((current) => ({
                                            ...current,
                                            [key]: event.target.value,
                                        }))}
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </label>
                            ))}
                            <label>
                                <span className="mb-1 block text-xs font-semibold">Purchase Date</span>
                                <input
                                    type="date"
                                    value={updateForm.purchase_date}
                                    onChange={(event) => setUpdateForm((current) => ({ ...current, purchase_date: event.target.value }))}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>
                            <label>
                                <span className="mb-1 block text-xs font-semibold">Warranty End Date</span>
                                <input
                                    type="date"
                                    value={updateForm.warranty_date}
                                    onChange={(event) => setUpdateForm((current) => ({ ...current, warranty_date: event.target.value }))}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </label>
                        </div>
                    )}

                    {operation === "return" && (
                        <div className="space-y-3 py-2">
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                                Returning the device clears the current employee assignment and moves the asset to Returned. It can then be transferred/reassigned from this page.
                            </div>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">Return Remarks</span>
                                <textarea
                                    value={remarks}
                                    onChange={(event) => setRemarks(event.target.value)}
                                    rows={4}
                                    placeholder="Condition / return note"
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </label>
                        </div>
                    )}

                    {operation === "owst" && (
                        <div className="space-y-4 py-2">
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">Ownership Transfer To</span>
                                <select
                                    value={owstType}
                                    onChange={(event) => {
                                        setOWSTType(event.target.value as "employee" | "vendor");
                                        setSelectedEmployee(null);
                                        setEmployeeQuery("");
                                    }}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                >
                                    <option value="employee">Employee / User</option>
                                    <option value="vendor">Vendor</option>
                                </select>
                            </label>

                            {owstType === "employee" ? (
                                <EmployeeSearchBox
                                    query={employeeQuery}
                                    onQueryChange={(value) => {
                                        setEmployeeQuery(value);
                                        if (!value) setSelectedEmployee(null);
                                    }}
                                    results={employeeResults}
                                    selected={selectedEmployee}
                                    onSelect={(employee) => {
                                        setSelectedEmployee(employee);
                                        setEmployeeResults([]);
                                        setEmployeeQuery("");
                                    }}
                                    searching={employeeSearching}
                                />
                            ) : (
                                <label className="block">
                                    <span className="mb-1 block text-xs font-semibold">Vendor Name <span className="text-red-500">*</span></span>
                                    <input
                                        value={owstVendor}
                                        onChange={(event) => setOWSTVendor(event.target.value)}
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                        placeholder="Receiving vendor"
                                    />
                                </label>
                            )}

                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">Deducted Amount</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={owstAmount}
                                    onChange={(event) => setOWSTAmount(event.target.value)}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                    placeholder="0"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">Remarks</span>
                                <textarea
                                    value={remarks}
                                    onChange={(event) => setRemarks(event.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Ownership transfer note"
                                />
                            </label>
                        </div>
                    )}

                    {operation === "warranty" && (
                        <div className="space-y-3 py-2">
                            <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800">
                                Warranty end date: {formatDate(selectedAsset?.warranty_date)}
                            </div>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">
                                    Problem / Claim Reason <span className="text-red-500">*</span>
                                </span>
                                <textarea
                                    value={warrantyProblems}
                                    onChange={(event) => setWarrantyProblems(event.target.value)}
                                    rows={5}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Describe the warranty issue..."
                                />
                            </label>
                        </div>
                    )}

                    {operation === "delete" && (
                        <div className="space-y-3 py-2">
                            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-red-800">
                                <FileWarning className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">ROOT-only destructive action</p>
                                    <p className="mt-1 text-xs">
                                        The asset record will be soft-deleted from the active registry. History remains available in the database.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <button
                            type="button"
                            disabled={operationBusy}
                            onClick={closeOperation}
                            className="h-9 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={operationBusy}
                            onClick={() => void submitOperation()}
                            className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50 ${operation === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:opacity-90"}`}
                        >
                            {operationBusy && <RefreshCw className="h-4 w-4 animate-spin" />}
                            {operation === "delete" ? "Delete Device" : "Submit"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
