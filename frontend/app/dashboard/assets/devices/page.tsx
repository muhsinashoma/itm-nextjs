

//frontend/app/dashboard/assets/devices/page.tsx
// v21: sticky status UX + global action-date ordering + reassignment history
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
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    BadgeCheck,
    Box,
    BriefcaseBusiness,
    Building2,
    CalendarClock,
    CircleDollarSign,
    ClipboardCheck,
    Columns3,
    Eye,
    FileText,
    FileWarning,
    Filter,
    Hash,
    History as HistoryIcon,
    Laptop2,
    MapPin,
    MoreHorizontal,
    PackageCheck,
    Paperclip,
    Pencil,
    Printer,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldCheck,
    Store,
    Tag,
    Trash2,
    Truck,
    UserCheck,
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
    vendorApi,
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
const COLUMN_STORAGE_KEY = "itm:asset-devices:visible-columns:v5";

const STATUS_OPTIONS = [
    { value: "", label: "All Status", compactLabel: "All" },
    { value: "0", label: "Available", compactLabel: "Available" },
    { value: "1", label: "Assigned", compactLabel: "Assigned" },
    { value: "2", label: "Damaged", compactLabel: "Damaged" },
    { value: "3", label: "Transferred", compactLabel: "Transfer" },
    { value: "4", label: "Returned", compactLabel: "Returned" },
    { value: "5", label: "Lost", compactLabel: "Lost" },
    { value: "7", label: "OWST", compactLabel: "OWST" },
    { value: "8", label: "Claim Raised", compactLabel: "Claim" },
    { value: "15", label: "Service Request", compactLabel: "Service" },
];

type DeviceStatusCounts = Record<string, number>;

type OperationSuccessDialog = {
    title: string;
    message: string;
    serial: string;
    statusLabel: string;
};

type OWSTVendor = {
    id: number;
    name: string;
    address: string;
    mobile: string;
    email: string;
};

type OWSTPrintSnapshot = {
    referenceNo: string;
    ownershipType: "user" | "vendor";
    ownershipLabel: string;
    raisedBy: string;
    submissionDate: string;
    employeeName: string;
    employeeID: string;
    designation: string;
    department: string;
    mobile: string;
    vendorName: string;
    vendorAddress: string;
    vendorMobile: string;
    deviceCategory: string;
    deviceSerial: string;
    brand: string;
    model: string;
    deviceType: string;
    deviceAge: string;
    amount: string;
    receiverAddress: string;
    gatePassDate: string;
    unit: string;
    quantity: string;
    remarks: string;
    attachmentName: string;
    companyMaterial: boolean;
    nonRefundable: boolean;
};

type OWSTPrintRecord = {
    id: number;
    reference_no: number;
    owst_category: number;
    employee_id: string;
    deducted_amount: string;
    device_age: string;
    receiver_id: string;
    gate_pass_date: string;
    item_name: string;
    item_description: string;
    unit: string;
    quantity: string;
    device_sl_no: string;
    remarks: string;
    created_by: string;
    created_at: string;
    company_material: number;
    non_refundable: number;
    receiver_address: string;
    vendor_name: string;
    vendor_address: string;
    vendor_mobile: string;
    vendor_deducted_amount: string;
    vendor_others: string;
    attach_file: string;
};

type ColumnKey =
    | "serial"
    | "device"
    | "employee"
    | "mrpr"
    | "designation"
    | "brand"
    | "model"
    | "deviceType"
    | "vendor"
    | "actionDate"
    | "purchase"
    | "warranty"
    | "deviceAge"
    | "usageDuration"
    | "remarks"
    | "assetType";

const COLUMN_OPTIONS: Array<{ key: ColumnKey; label: string }> = [
    { key: "serial", label: "Serial / Asset ID" },
    { key: "device", label: "Device" },
    { key: "employee", label: "Employee" },
    { key: "mrpr", label: "MR / PR" },
    { key: "designation", label: "Designation" },
    { key: "brand", label: "Brand" },
    { key: "model", label: "Model" },
    { key: "deviceType", label: "Device Type" },
    { key: "vendor", label: "Vendor" },
    { key: "actionDate", label: "Action Date" },
    { key: "purchase", label: "Purchase Date" },
    { key: "warranty", label: "Warranty Date" },
    { key: "deviceAge", label: "Device Age" },
    { key: "usageDuration", label: "Usage Duration" },
    { key: "remarks", label: "Remarks" },
    { key: "assetType", label: "Asset Type" },
];

const DEFAULT_COLUMNS: ColumnKey[] = [
    "serial",
    "device",
    "employee",
    "mrpr",
    "actionDate",
];

type OperationType =
    | "detail"
    | "history"
    | "assign-direct"
    | "assign-tt"
    | "update"
    | "transfer"
    | "return"
    | "owst"
    | "warranty"
    | "damaged"
    | "lost"
    | "reassign"
    | "delete"
    | null;

type AssignmentTechnicalForm = {
    agp: string;
    battery: string;
    removal_drive: string;
    operating_system: string;
    os_key: string;
    ip_address: string;
    lan_mac_address: string;
    wlan_mac_address: string;
    adapter: string;
    mouse: string;
    ups: string;
    bag: string;
    assignment_device_type: string;
};

const EMPTY_ASSIGNMENT_TECHNICAL_FORM: AssignmentTechnicalForm = {
    agp: "",
    battery: "",
    removal_drive: "",
    operating_system: "",
    os_key: "",
    ip_address: "",
    lan_mac_address: "",
    wlan_mac_address: "",
    adapter: "",
    mouse: "",
    ups: "",
    bag: "",
    assignment_device_type: "",
};

const OPTIONAL_ASSIGNMENT_FIELDS: Array<{
    key: keyof AssignmentTechnicalForm;
    label: string;
    placeholder: string;
}> = [
        { key: "agp", label: "AGP", placeholder: "e.g. Intel / NVIDIA / AMD" },
        { key: "battery", label: "Battery", placeholder: "Battery details" },
        { key: "removal_drive", label: "Removal Drive", placeholder: "Optional removable drive" },
        { key: "operating_system", label: "OS", placeholder: "e.g. Windows 11 Pro" },
        { key: "os_key", label: "OS Key", placeholder: "Optional license key" },
        { key: "ip_address", label: "IP Address", placeholder: "e.g. 10.10.20.15" },
        { key: "lan_mac_address", label: "LAN-MAC", placeholder: "e.g. 00:1A:2B:3C:4D:5E" },
        { key: "wlan_mac_address", label: "WLAN-MAC Address", placeholder: "Wireless MAC address" },
        { key: "adapter", label: "Adapter", placeholder: "Adapter details" },
        { key: "mouse", label: "Mouse", placeholder: "Mouse details" },
        { key: "ups", label: "UPS", placeholder: "UPS details" },
        { key: "bag", label: "Bag", placeholder: "Bag details" },
    ];

type AssignmentContext = {
    asset: {
        id: number;
        device_serial: string | null;
        category: string | null;
        brand: string | null;
        model: string | null;
        vendor_name: string | null;
        mr_number: string | null;
        pr_number: string | null;
        purchase_date: string | null;
        warranty_date: string | null;
        asset_status: number;
        remarks?: string | null;
    };
    stock: {
        stock_inventory_id: number | null;
        cpu: string | null;
        ram: string | null;
        storage: string | null;
        monitor: string | null;
    };
    technical: Omit<AssignmentTechnicalForm, "assignment_device_type"> & {
        assignment_device_type: string | number | null;
    };
};

type PreviousAssignmentV21 = {
    id: number;
    employee_id: string;
    employee_name: string;
    employee_image: string;
    department: string;
    designation: string;
    status_code: number;
    status_label: string;
    assigned_at: string | null;
    ended_at: string | null;
    assignment_remarks: string;
    end_remarks: string;
    end_reason: string;
};

type ActivityPageResponseV21 = {
    success?: boolean;
    data?: OperationalAssetDevice[];
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
    error?: string;
};

type OperationalAssetDevice = AssetDevice & {
    stock_inventory_id?: number | null;
    category_id?: number | null;
    brand_id?: number | null;
    model_id?: number | null;
    agp?: string | null;
    battery?: string | null;
    removal_drive?: string | null;
    operating_system?: string | null;
    os_key?: string | null;
    ip_address?: string | null;
    lan_mac_address?: string | null;
    wlan_mac_address?: string | null;
    adapter?: string | null;
    mouse?: string | null;
    ups?: string | null;
    bag?: string | null;
    assignment_device_type?: string | null;
    returned_at?: string | null;
    transferred_at?: string | null;
    remarks?: string | null;
    // Display-only previous holder information for Returned assets.
    // Current asset emp_id remains empty so the device is still unassigned.
    last_emp_id?: string | null;
    last_emp_name?: string | null;
    last_employee_image?: string | null;
    last_department?: string | null;
    last_designation?: string | null;
    status_action_date?: string | null;
    status_action_label?: string | null;
    history_reason?: string | null;
    previous_assignment?: PreviousAssignmentV21 | null;
};

type AssetDeviceHistoryEntry = {
    id?: number | string;
    event?: string | null;
    action?: string | null;
    assignment_type?: string | null;
    prev_status?: number | null;
    current_status?: number | null;
    from_emp_id?: string | null;
    from_emp_name?: string | null;
    to_emp_id?: string | null;
    to_emp_name?: string | null;
    emp_id?: string | null;
    emp_name?: string | null;
    user_return_id?: string | null;
    user_transfer_id?: string | null;
    remarks?: string | null;
    return_comment?: string | null;
    transfer_comment?: string | null;
    changed_by?: string | number | null;
    changed_by_name?: string | null;
    changed_at?: string | null;
    created_at?: string | null;
    assigned_at?: string | null;
    ended_at?: string | null;
    active?: boolean | null;
};

type AssetDeviceHistoryResponse = {
    success?: boolean;
    data?:
    | AssetDeviceHistoryEntry[]
    | {
        history?: AssetDeviceHistoryEntry[];
        items?: AssetDeviceHistoryEntry[];
    };
    history?: AssetDeviceHistoryEntry[];
    items?: AssetDeviceHistoryEntry[];
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
    fullUpdate: (
        id: number,
        body: {
            master: {
                device_serial: string;
                category: string;
                brand: string;
                model: string;
                device_type: string;
                vendor_name: string;
                purchase_date: string;
                warranty_date: string;
            };
            stock: {
                cpu: string;
                ram: string;
                storage: string;
                monitor: string;
            };
            technical_details: AssignmentTechnicalForm;
        },
    ) => api.put(`/assets/devices/${id}/full-update`, body),

    assignmentContext: (id: number) =>
        api.get<{
            success: boolean;
            data: AssignmentContext;
        }>(`/assets/devices/${id}/assignment-context`),

    activityPage: (params: {
        page: number;
        limit: number;
        search?: string;
        status?: number;
        category?: string;
    }) => {
        const query = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                query.set(key, String(value));
            }
        });

        return api.get<ActivityPageResponseV21>(
            `/assets/devices/activity-page?${query.toString()}`,
        );
    },

    reassignAsset: (
        id: number,
        employee_id: string,
        remarks: string,
        technical_details: AssignmentTechnicalForm,
    ) =>
        api.post(`/assets/devices/${id}/reassign`, {
            employee_id,
            remarks: remarks ?? "",
            technical_details: {
                ...technical_details,
                assignment_device_type:
                    technical_details.assignment_device_type === ""
                        ? null
                        : Number(technical_details.assignment_device_type),
            },
        }),

    assignDirect: (
        id: number,
        employee_id: string,
        remarks: string,
        technical_details: AssignmentTechnicalForm,
    ) =>
        api.post(`/assets/devices/${id}/assignment`, {
            employee_id,
            remarks: remarks ?? "",
            technical_details: {
                ...technical_details,
                assignment_device_type:
                    technical_details.assignment_device_type === ""
                        ? null
                        : Number(technical_details.assignment_device_type),
            },
        }),

    transferAsset: (
        id: number,
        to_emp_id: string,
        remarks?: string,
    ) =>
        api.post(`/assets/devices/${id}/transfer`, {
            to_emp_id,
            remarks: remarks ?? "",
        }),

    returnAsset: (id: number, remarks?: string) =>
        api.post(`/assets/devices/${id}/return`, {
            remarks: remarks ?? "",
        }),

    markDamaged: (id: number, remarks: string) =>
        api.post(`/assets/devices/${id}/damaged`, {
            remarks: remarks ?? "",
        }),

    markLost: (id: number, remarks: string) =>
        api.post(`/assets/devices/${id}/lost`, {
            remarks: remarks ?? "",
        }),

    owstPrintData: (id: number) =>
        api.get<{
            success: boolean;
            data: OWSTPrintRecord;
        }>(`/assets/devices/${id}/owst/print-data`),

    createOWST: (
        id: number,
        body: {
            ownership_type: "user" | "vendor";
            vendor_id?: number;
            deducted_amount?: number;
            vendor_deducted_amount?: number;
            vendor_others?: string;
            receiver_address: string;
            gate_pass_date: string;
            unit: string;
            quantity: number;
            remarks: string;
            company_material: boolean;
            non_refundable: boolean;
            attachment?: File | null;
        },
    ) => {
        const formData = new FormData();

        formData.append("ownership_type", body.ownership_type);
        formData.append("deducted_amount", String(body.deducted_amount ?? 0));
        formData.append(
            "vendor_deducted_amount",
            String(body.vendor_deducted_amount ?? 0),
        );
        formData.append(
            "vendor_id",
            body.vendor_id ? String(body.vendor_id) : "",
        );
        formData.append("vendor_others", body.vendor_others ?? "");
        formData.append("receiver_address", body.receiver_address);
        formData.append("gate_pass_date", body.gate_pass_date);
        formData.append("unit", body.unit);
        formData.append("quantity", String(body.quantity));
        formData.append("remarks", body.remarks);
        formData.append(
            "company_material",
            body.company_material ? "1" : "0",
        );
        formData.append(
            "non_refundable",
            body.non_refundable ? "1" : "0",
        );

        if (body.attachment) {
            formData.append(
                "attachment",
                body.attachment,
                body.attachment.name,
            );
        }

        return api.postForm<{
            success: boolean;
            data: {
                reference_no?: number;
                owst_id?: number;
                owst_category?: number;
                status_label?: string;
            };
        }>(`/assets/devices/${id}/owst`, formData);
    },

    createWarrantyClaim: (
        id: number,
        problems: string,
        remarks?: string,
    ) =>
        api.post(`/assets/devices/${id}/warranty-claim`, {
            problems,
            remarks: remarks ?? "",
        }),

    history: async (id: number): Promise<AssetDeviceHistoryEntry[]> => {
        const endpoints = [
            `/assets/devices/${id}/history`,
            `/assets/devices/${id}/status-history`,
        ];
        let lastError: unknown = null;

        for (const endpoint of endpoints) {
            try {
                const response = await api.get<AssetDeviceHistoryResponse>(endpoint);
                const payload = response?.data;
                const nested =
                    payload && !Array.isArray(payload)
                        ? payload
                        : null;
                const rows = Array.isArray(payload)
                    ? payload
                    : Array.isArray(nested?.history)
                        ? nested.history
                        : Array.isArray(nested?.items)
                            ? nested.items
                            : Array.isArray(response?.history)
                                ? response.history
                                : Array.isArray(response?.items)
                                    ? response.items
                                    : null;

                if (rows) return rows;
            } catch (reason) {
                lastError = reason;
            }
        }

        throw lastError ?? new Error("Assignment history endpoint is not available.");
    },

    delete: (id: number) =>
        api.del(`/assets/devices/${id}`),
};

const returnedEmployeeProfileCache = new Map<string, Employee | null>();

function cleanEmployeeText(value: string | null | undefined) {
    return String(value ?? "").trim();
}

async function returnedEmployeeProfile(employeeID: string) {
    const key = cleanEmployeeText(employeeID).toLowerCase();

    if (!key) {
        return null;
    }

    if (returnedEmployeeProfileCache.has(key)) {
        return returnedEmployeeProfileCache.get(key) ?? null;
    }

    try {
        const response = await employeeApi.get(
            encodeURIComponent(employeeID),
        );
        const employee = response.data ?? null;
        returnedEmployeeProfileCache.set(key, employee);
        return employee;
    } catch {
        returnedEmployeeProfileCache.set(key, null);
        return null;
    }
}

async function hydrateReturnedLastHolder(
    item: OperationalAssetDevice,
): Promise<OperationalAssetDevice> {
    // Keep the current employee untouched for assigned or legacy rows.
    if (item.asset_status !== 4 || cleanEmployeeText(item.emp_id)) {
        return item;
    }

    try {
        const history = await deviceOperationsApi.history(item.id);

        const returnedEntry =
            history.find(
                (entry) =>
                    entry.current_status === 4 &&
                    Boolean(
                        cleanEmployeeText(entry.emp_id) ||
                        cleanEmployeeText(entry.from_emp_id),
                    ),
            ) ??
            history.find(
                (entry) =>
                    Boolean(
                        cleanEmployeeText(entry.emp_id) ||
                        cleanEmployeeText(entry.from_emp_id),
                    ),
            );

        if (!returnedEntry) {
            return item;
        }

        const lastEmployeeID =
            cleanEmployeeText(returnedEntry.emp_id) ||
            cleanEmployeeText(returnedEntry.from_emp_id) ||
            cleanEmployeeText(returnedEntry.user_return_id);

        if (!lastEmployeeID) {
            return item;
        }

        const historyEmployeeName =
            cleanEmployeeText(returnedEntry.emp_name) ||
            cleanEmployeeText(returnedEntry.from_emp_name);

        const profile = await returnedEmployeeProfile(lastEmployeeID);

        return {
            ...item,
            last_emp_id: lastEmployeeID,
            last_emp_name:
                cleanEmployeeText(profile?.employee_name) ||
                historyEmployeeName ||
                "Employee",
            last_employee_image:
                cleanEmployeeText(profile?.picture) || null,
            last_department:
                cleanEmployeeText(profile?.department) || null,
            last_designation:
                cleanEmployeeText(profile?.designation) || null,
        };
    } catch {
        // History/profile lookup is display-only and must not block the table.
        return item;
    }
}
function columnIcon(key: ColumnKey) {
    const iconClass = "h-3.5 w-3.5 shrink-0 text-muted-foreground";

    switch (key) {
        case "serial":
            return <Hash className={iconClass} />;
        case "device":
            return <Laptop2 className={iconClass} />;
        case "employee":
            return <UserRound className={iconClass} />;
        case "mrpr":
            return <FileText className={iconClass} />;
        case "designation":
            return <BriefcaseBusiness className={iconClass} />;
        case "brand":
            return <Tag className={iconClass} />;
        case "model":
            return <Box className={iconClass} />;
        case "deviceType":
            return <PackageCheck className={iconClass} />;
        case "vendor":
            return <Store className={iconClass} />;
        case "actionDate":
            return <CalendarClock className={iconClass} />;
        default:
            return <Columns3 className={iconClass} />;
    }
}

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

function formatDateTime(value: string | null | undefined) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function statusActionDateHeader(
    value: string | number | null | undefined,
) {
    if (value === "" || value === null || value === undefined) {
        return "Action Date";
    }

    switch (Number(value)) {
        case 0:
            return "Available Date";
        case 1:
            return "Assigned Date";
        case 2:
            return "Damaged Date";
        case 3:
            return "Transferred Date";
        case 4:
            return "Returned Date";
        case 5:
            return "Lost Date";
        case 7:
            return "OWST Date";
        case 8:
            return "Claim Raised Date";
        case 15:
            return "Service Request Date";
        default:
            return "Action Date";
    }
}

function historyStatusLabel(value: number | null | undefined) {
    if (value == null) return "—";
    return (
        STATUS_OPTIONS.find((item) => item.value === String(value))?.label ??
        `Status ${value}`
    );
}

function historyEventLabel(entry: AssetDeviceHistoryEntry) {
    const explicit = entry.event || entry.action || entry.assignment_type;
    if (explicit?.trim()) {
        return explicit
            .trim()
            .replace(/[_-]+/g, " ")
            .replace(/\b\w/g, (character) => character.toUpperCase());
    }

    switch (entry.current_status) {
        case 1:
            return "Assigned";
        case 3:
            return "Transferred";
        case 4:
            return "Returned";
        case 7:
            return "OWST";
        case 8:
            return "Claim Raised";
        case 15:
            return "Service Request";
        default:
            return "Status Changed";
    }
}

function historyEmployee(entry: AssetDeviceHistoryEntry) {
    const name = entry.to_emp_name || entry.emp_name || entry.from_emp_name;
    const id =
        entry.to_emp_id ||
        entry.emp_id ||
        entry.user_transfer_id ||
        entry.user_return_id ||
        entry.from_emp_id;

    if (name && id) return `${name} · ${id}`;
    return name || id || "—";
}

function historyRemarks(entry: AssetDeviceHistoryEntry) {
    return (
        entry.remarks ||
        entry.transfer_comment ||
        entry.return_comment ||
        "—"
    );
}

function historyTimestamp(entry: AssetDeviceHistoryEntry) {
    return (
        entry.changed_at ||
        entry.ended_at ||
        entry.assigned_at ||
        entry.created_at ||
        null
    );
}

function canAssignNewEmployee(item: OperationalAssetDevice) {
    // Status 0 is necessary but not sufficient. A stale row that still has a
    // current employee must never be exposed as available for a new assignment.
    return item.asset_status === 0 && !item.emp_id?.trim();
}

function dateInputValue(value: string | null | undefined) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatCompactDuration(
    startValue: string | null | undefined,
    endValue?: string | null,
) {
    if (!startValue) return "—";

    const start = new Date(startValue);
    const end = endValue ? new Date(endValue) : new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return "—";
    }

    const milliseconds = Math.max(0, end.getTime() - start.getTime());
    const totalDays = Math.floor(milliseconds / 86400000);
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    const days = (totalDays % 365) % 30;

    const parts = [
        years > 0 ? `${years}y` : "",
        months > 0 ? `${months}m` : "",
        days > 0 || (years === 0 && months === 0) ? `${days}d` : "",
    ].filter(Boolean);

    return parts.join(" ");
}

function usageEndDate(item: OperationalAssetDevice) {
    if (item.returned_at) return item.returned_at;
    if (item.transferred_at) return item.transferred_at;
    return null;
}

const HRIS_IMAGE_BASE_URL =
    (process.env.NEXT_PUBLIC_HRIS_IMAGE_BASE_URL ||
        "https://hris.fiberathome.net/hris/admin").replace(/\/+$/, "");

function resolveEmployeeImageUrl(value: string | null | undefined) {
    const image = value?.trim();
    if (!image) return null;

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

function compactMacAddress(value: string) {
    return value
        .trim()
        .toUpperCase()
        .replace(/[^0-9A-F]/g, "");
}

function isValidMacAddress(value: string) {
    if (!value.trim()) return true;
    return /^[0-9A-F]{12}$/.test(compactMacAddress(value));
}

function formatMacAddress(value: string) {
    const compact = compactMacAddress(value);
    if (!/^[0-9A-F]{12}$/.test(compact)) return value.trim().toUpperCase();

    return compact.match(/.{2}/g)?.join(":") ?? compact;
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
    size = "md",
}: {
    name: string | null;
    image: string | null | undefined;
    size?: "md" | "lg";
}) {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [image]);

    const imageUrl = resolveEmployeeImageUrl(image);
    const canShowImage = Boolean(imageUrl && !imageFailed);
    const avatarClass =
        size === "lg"
            ? "h-14 w-14 text-sm"
            : "h-9 w-9 text-[10px]";

    return (
        <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-bold text-foreground ${avatarClass}`}>
            {canShowImage ? (
                <img
                    src={imageUrl!}
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
    const searchReady = query.trim().length >= 2;

    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
                Assign to Employee <span className="text-red-500">*</span>
            </label>

            {selected ? (
                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.035] px-3 py-3">
                    <EmployeeAvatar
                        name={selected.employee_name}
                        image={selected.picture}
                        size="lg"
                    />

                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                            Selected Employee
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                                {selected.employee_name}
                            </p>
                            <span className="rounded-md bg-background px-2 py-0.5 font-mono text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/15">
                                ID {selected.employee_id}
                            </span>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {[selected.designation, selected.department]
                                .filter(Boolean)
                                .join(" · ") || "Active employee"}
                        </p>

                        {(selected.official_cell || selected.personal_cell || selected.email) && (
                            <p className="mt-1 truncate text-[10px] text-muted-foreground">
                                {[
                                    selected.official_cell || selected.personal_cell,
                                    selected.email,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => onQueryChange("")}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Change employee"
                        aria-label="Change selected employee"
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
                        placeholder="Search by employee ID or employee name..."
                        autoComplete="off"
                        className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-10 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                    />

                    {searching && (
                        <RefreshCw className="pointer-events-none absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />
                    )}

                    {searchReady && (searching || results.length > 0) && (
                        <div className="absolute left-0 right-0 top-[44px] z-[80] max-h-72 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-xl">
                            {searching ? (
                                <div className="flex items-center justify-center gap-2 px-3 py-5 text-xs text-muted-foreground">
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    Searching active employees...
                                </div>
                            ) : (
                                results.map((employee) => (
                                    <button
                                        type="button"
                                        key={employee.employee_id}
                                        onClick={() => onSelect(employee)}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                                    >
                                        <EmployeeAvatar
                                            name={employee.employee_name}
                                            image={employee.picture}
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {employee.employee_name}
                                                </p>
                                                <span className="shrink-0 font-mono text-[10px] font-semibold text-primary">
                                                    {employee.employee_id}
                                                </span>
                                            </div>

                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                {[employee.designation, employee.department]
                                                    .filter(Boolean)
                                                    .join(" · ") || "—"}
                                            </p>
                                        </div>

                                        {typeof employee.device_count === "number" && (
                                            <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                {employee.device_count} device{employee.device_count === 1 ? "" : "s"}
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    <p className="mt-1 text-[10px] text-muted-foreground">
                        Type at least 2 characters. Employee master data is used as the source of truth.
                    </p>
                </div>
            )}
        </div>
    );
}

function AssignmentInfo({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string | number | null | undefined;
    mono?: boolean;
}) {
    const displayValue =
        value === null || value === undefined || String(value).trim() === ""
            ? "—"
            : String(value);

    return (
        <div className="min-w-0 rounded-lg border border-border/70 bg-background px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                {label}
            </p>
            <p
                className={`mt-1 truncate text-xs font-medium text-foreground ${mono ? "font-mono" : ""
                    }`}
                title={displayValue}
            >
                {displayValue}
            </p>
        </div>
    );
}

function CompactDeviceInfo({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string | number | null | undefined;
    mono?: boolean;
}) {
    const displayValue =
        value === null || value === undefined || String(value).trim() === ""
            ? "—"
            : String(value);

    return (
        <div className="min-w-0 rounded-md border border-border/70 bg-background px-2 py-1.5">
            <p className="truncate text-[9px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                {label}
            </p>
            <p
                className={`mt-0.5 truncate text-[11px] font-medium leading-4 text-foreground ${mono ? "font-mono" : ""
                    }`}
                title={displayValue}
            >
                {displayValue}
            </p>
        </div>
    );
}

function assignmentDeviceTypeLabel(value: string | number | null | undefined) {
    if (String(value ?? "") === "1") return "Permanent (1)";
    if (String(value ?? "") === "2") return "Temporary (2)";
    return "—";
}

function DeviceDatabaseSnapshot({
    asset,
    context,
}: {
    asset: OperationalAssetDevice | null;
    context: AssignmentContext | null;
}) {
    if (!asset) return null;

    const technical = context?.technical;
    const stock = context?.stock;

    return (
        <section className="rounded-xl border border-sky-200/80 bg-sky-50/45 p-3 dark:border-sky-900/50 dark:bg-sky-950/10">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold text-foreground">
                        Device Database Information
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        Current master, assignment, procurement, stock and technical information.
                    </p>
                </div>
                <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(
                        asset.asset_status,
                    )}`}
                >
                    {asset.status_label || `Status ${asset.asset_status}`}
                </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
                <CompactDeviceInfo label="Asset ID" value={`#${asset.id}`} mono />
                <CompactDeviceInfo label="Serial" value={asset.device_serial} mono />
                <CompactDeviceInfo label="Category" value={asset.category} />
                <CompactDeviceInfo label="Brand" value={asset.brand} />
                <CompactDeviceInfo label="Model" value={asset.model} />

                <CompactDeviceInfo label="Asset Type" value={asset.device_type} />
                <CompactDeviceInfo
                    label="Device Type"
                    value={assignmentDeviceTypeLabel(
                        technical?.assignment_device_type ??
                        asset.assignment_device_type,
                    )}
                />
                <CompactDeviceInfo label="Employee ID" value={asset.emp_id} mono />
                <CompactDeviceInfo label="Employee Name" value={asset.emp_name} />
                <CompactDeviceInfo
                    label="Department / Designation"
                    value={[asset.department, asset.designation]
                        .filter(Boolean)
                        .join(" · ")}
                />

                <CompactDeviceInfo
                    label={asset.status_action_label || statusActionDateHeader(asset.asset_status)}
                    value={formatDateTime(asset.status_action_date || asset.assigned_date)}
                />
                <CompactDeviceInfo label="Vendor" value={asset.vendor_name} />
                <CompactDeviceInfo label="MR Number" value={asset.mr_number} mono />
                <CompactDeviceInfo label="PR Number" value={asset.pr_number} mono />
                <CompactDeviceInfo
                    label="Stock Row"
                    value={stock?.stock_inventory_id ? `#${stock.stock_inventory_id}` : "—"}
                    mono
                />

                <CompactDeviceInfo label="Purchase Date" value={formatDate(asset.purchase_date)} />
                <CompactDeviceInfo label="Warranty End" value={formatDate(asset.warranty_date)} />
                <CompactDeviceInfo label="CPU / Processor" value={stock?.cpu} />
                <CompactDeviceInfo label="RAM" value={stock?.ram} />
                <CompactDeviceInfo label="SSD / HDD" value={stock?.storage} />

                <CompactDeviceInfo label="Monitor" value={stock?.monitor} />
                <CompactDeviceInfo label="AGP" value={technical?.agp ?? asset.agp} />
                <CompactDeviceInfo label="Battery" value={technical?.battery ?? asset.battery} />
                <CompactDeviceInfo
                    label="Removal Drive"
                    value={technical?.removal_drive ?? asset.removal_drive}
                />
                <CompactDeviceInfo
                    label="OS"
                    value={technical?.operating_system ?? asset.operating_system}
                />

                <CompactDeviceInfo label="OS Key" value={technical?.os_key ?? asset.os_key} />
                <CompactDeviceInfo
                    label="IP Address"
                    value={technical?.ip_address ?? asset.ip_address}
                    mono
                />
                <CompactDeviceInfo
                    label="LAN-MAC"
                    value={technical?.lan_mac_address ?? asset.lan_mac_address}
                    mono
                />
                <CompactDeviceInfo
                    label="WLAN-MAC"
                    value={technical?.wlan_mac_address ?? asset.wlan_mac_address}
                    mono
                />
                <CompactDeviceInfo label="Adapter" value={technical?.adapter ?? asset.adapter} />

                <CompactDeviceInfo label="Mouse" value={technical?.mouse ?? asset.mouse} />
                <CompactDeviceInfo label="UPS" value={technical?.ups ?? asset.ups} />
                <CompactDeviceInfo label="Bag" value={technical?.bag ?? asset.bag} />
                <CompactDeviceInfo
                    label="Entry Source"
                    value={asset.mr_number?.trim() ? "MR / SCM Stock" : "Petty Cash"}
                />
                <CompactDeviceInfo
                    label="Record State"
                    value={asset.status_label || `Status ${asset.asset_status}`}
                />
                <CompactDeviceInfo
                    label="Remarks"
                    value={asset.remarks || asset.history_reason}
                />
            </div>
        </section>
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
    const [ajaxSearching, setAjaxSearching] = useState(false);
    const [status, setStatus] = useState("");
    const [categoryInput, setCategoryInput] = useState("");
    const [category, setCategory] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [showImportNotice, setShowImportNotice] = useState(true);
    const [statusCounts, setStatusCounts] = useState<DeviceStatusCounts>({});
    const [statusCountsLoading, setStatusCountsLoading] = useState(false);
    const [successDialog, setSuccessDialog] =
        useState<OperationSuccessDialog | null>(null);
    const [showAssignmentOptional, setShowAssignmentOptional] = useState(false);

    const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
        () => new Set(DEFAULT_COLUMNS),
    );

    const [operation, setOperation] = useState<OperationType>(null);
    const [selectedAsset, setSelectedAsset] = useState<OperationalAssetDevice | null>(null);
    const [operationBusy, setOperationBusy] = useState(false);
    const [operationError, setOperationError] = useState("");
    const [remarks, setRemarks] = useState("");
    const [assignmentTechnicalForm, setAssignmentTechnicalForm] =
        useState<AssignmentTechnicalForm>(EMPTY_ASSIGNMENT_TECHNICAL_FORM);
    const [assignmentContext, setAssignmentContext] =
        useState<AssignmentContext | null>(null);
    const [assignmentContextLoading, setAssignmentContextLoading] = useState(false);
    const [historyEntries, setHistoryEntries] = useState<AssetDeviceHistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");

    const [employeeQuery, setEmployeeQuery] = useState("");
    const [employeeResults, setEmployeeResults] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [employeeSearching, setEmployeeSearching] = useState(false);

    const [requisitionQuery, setRequisitionQuery] = useState("");
    const [requisitionResults, setRequisitionResults] = useState<ApprovedTTRequisition[]>([]);
    const [selectedRequisition, setSelectedRequisition] = useState<ApprovedTTRequisition | null>(null);
    const [requisitionLoading, setRequisitionLoading] = useState(false);

    const [updateForm, setUpdateForm] = useState({
        device_serial: "",
        category: "",
        brand: "",
        model: "",
        device_type: "",
        vendor_name: "",
        purchase_date: "",
        warranty_date: "",
        cpu: "",
        ram: "",
        storage: "",
        monitor: "",
    });

    const [owstType, setOWSTType] = useState<"user" | "vendor">("user");
    const [owstVendors, setOWSTVendors] = useState<OWSTVendor[]>([]);
    const [owstVendorsLoading, setOWSTVendorsLoading] = useState(false);
    const [owstVendorID, setOWSTVendorID] = useState("");
    const [owstVendorOthers, setOWSTVendorOthers] = useState("");
    const [owstAmount, setOWSTAmount] = useState("");
    const [owstReceiverAddress, setOWSTReceiverAddress] = useState("");
    const [owstGatePassDate, setOWSTGatePassDate] = useState("");
    const [owstUnit, setOWSTUnit] = useState("Nos");
    const [owstQuantity, setOWSTQuantity] = useState("1");
    const [owstAttachment, setOWSTAttachment] = useState<File | null>(null);
    const [owstCompanyMaterial, setOWSTCompanyMaterial] = useState(true);
    const [owstNonRefundable, setOWSTNonRefundable] = useState(true);
    const [owstEmployeeProfile, setOWSTEmployeeProfile] = useState<Employee | null>(null);
    const [owstEmployeeLoading, setOWSTEmployeeLoading] = useState(false);
    const [owstPrintSnapshot, setOWSTPrintSnapshot] = useState<OWSTPrintSnapshot | null>(null);
    const [warrantyProblems, setWarrantyProblems] = useState("");

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const authUser = getUser();
    const isRoot =
        authUser?.role_code?.trim().toUpperCase() === "ROOT" ||
        Number(authUser?.user_type) === 0;

    const selectedOWSTVendor = useMemo(
        () =>
            owstVendors.find(
                (vendor) => String(vendor.id) === owstVendorID,
            ) ?? null,
        [owstVendors, owstVendorID],
    );

    function buildOWSTPrintSnapshot(
        referenceNo = "Pending",
    ): OWSTPrintSnapshot | null {
        if (!selectedAsset) {
            return null;
        }

        return {
            referenceNo,
            ownershipType: owstType,
            ownershipLabel:
                owstType === "user"
                    ? "User OWST"
                    : "Vendor OWST",
            raisedBy:
                authUser?.full_name ||
                authUser?.username ||
                authUser?.employee_id ||
                "Current user",
            submissionDate: formatDateTime(
                new Date().toISOString(),
            ),
            employeeName:
                owstEmployeeProfile?.employee_name ||
                selectedAsset.emp_name ||
                "—",
            employeeID:
                owstEmployeeProfile?.employee_id ||
                selectedAsset.emp_id ||
                "—",
            designation:
                owstEmployeeProfile?.designation ||
                selectedAsset.designation ||
                "—",
            department:
                owstEmployeeProfile?.department ||
                selectedAsset.department ||
                "—",
            mobile:
                owstEmployeeProfile?.official_cell ||
                owstEmployeeProfile?.personal_cell ||
                "—",
            vendorName:
                selectedOWSTVendor?.name || "—",
            vendorAddress:
                selectedOWSTVendor?.address || "—",
            vendorMobile:
                selectedOWSTVendor?.mobile || "—",
            deviceCategory:
                selectedAsset.category || "Device",
            deviceSerial:
                selectedAsset.device_serial || "—",
            brand:
                selectedAsset.brand || "—",
            model:
                selectedAsset.model || "—",
            deviceType:
                selectedAsset.device_type || "—",
            deviceAge:
                formatCompactDuration(
                    selectedAsset.assigned_date,
                ),
            amount:
                owstAmount.trim() || "0",
            receiverAddress:
                owstReceiverAddress.trim() || "—",
            gatePassDate:
                owstGatePassDate
                    ? formatDate(owstGatePassDate)
                    : "—",
            unit:
                owstUnit.trim() || "Nos",
            quantity:
                owstQuantity.trim() || "1",
            remarks:
                remarks.trim() || "—",
            attachmentName:
                owstAttachment?.name || "—",
            companyMaterial:
                owstCompanyMaterial,
            nonRefundable:
                owstNonRefundable,
        };
    }

    function printOWST(
        snapshot?: OWSTPrintSnapshot | null,
    ) {
        const next =
            snapshot ??
            buildOWSTPrintSnapshot(
                owstPrintSnapshot?.referenceNo || "Pending",
            );

        if (!next) {
            setOperationError(
                "Open an OWST device before printing.",
            );
            return;
        }

        setOWSTPrintSnapshot(next);

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                window.print();
            });
        });
    }

    const importSuccess = searchParams.get("import") === "success";
    const importMR = searchParams.get("mr") ?? "";
    const importedCount = Number(searchParams.get("imported") ?? 0);
    const updatedCount = Number(searchParams.get("updated") ?? 0);
    const stockCommittedCount = Number(searchParams.get("stock_committed") ?? 0);
    const assetsCreatedCount = Number(searchParams.get("assets_created") ?? importedCount);
    const assetsSynchronizedCount = Number(searchParams.get("assets_synchronized") ?? 0);
    const normalizedAvailableCount = Number(searchParams.get("normalized_available") ?? 0);
    const conflictedCount = Number(searchParams.get("conflicted") ?? 0);
    const conflictAssetID = Number(searchParams.get("conflict_asset_id") ?? 0);
    const conflictSerial = searchParams.get("conflict_serial") ?? "";
    const showSCMImportNotice =
        importSuccess &&
        Boolean(importMR.trim()) &&
        (stockCommittedCount > 0 ||
            importedCount > 0 ||
            updatedCount > 0 ||
            conflictedCount > 0);
    async function printExistingOWST(
        item: OperationalAssetDevice,
    ) {
        try {
            const response =
                await deviceOperationsApi.owstPrintData(item.id);

            const record = response.data;

            let holderProfile: Employee | null = null;
            if (record.employee_id?.trim()) {
                try {
                    const holderResponse =
                        await employeeApi.get(
                            encodeURIComponent(
                                record.employee_id.trim(),
                            ),
                        );
                    holderProfile =
                        holderResponse.data ?? null;
                } catch {
                    holderProfile = null;
                }
            }

            let raisedBy =
                record.created_by?.trim() ||
                "ITM User";

            if (record.created_by?.trim()) {
                try {
                    const raisedByResponse =
                        await employeeApi.get(
                            encodeURIComponent(
                                record.created_by.trim(),
                            ),
                        );

                    raisedBy =
                        raisedByResponse.data?.employee_name ||
                        raisedBy;
                } catch {
                    // Keep the saved employee/user ID when a profile is unavailable.
                }
            }

            const category =
                Number(record.owst_category) === 2
                    ? "vendor"
                    : "user";

            const snapshot: OWSTPrintSnapshot = {
                referenceNo: String(
                    record.reference_no ||
                    record.id ||
                    "—",
                ),
                ownershipType: category,
                ownershipLabel:
                    category === "vendor"
                        ? "Vendor OWST"
                        : "User OWST",
                raisedBy,
                submissionDate:
                    formatDateTime(record.created_at),

                employeeName:
                    holderProfile?.employee_name ||
                    item.emp_name ||
                    "—",
                employeeID:
                    record.employee_id ||
                    holderProfile?.employee_id ||
                    item.emp_id ||
                    "—",
                designation:
                    holderProfile?.designation ||
                    item.designation ||
                    "—",
                department:
                    holderProfile?.department ||
                    item.department ||
                    "—",
                mobile:
                    holderProfile?.official_cell ||
                    holderProfile?.personal_cell ||
                    "—",

                vendorName:
                    record.vendor_name || "—",
                vendorAddress:
                    record.vendor_address || "—",
                vendorMobile:
                    record.vendor_mobile || "—",

                deviceCategory:
                    record.item_name ||
                    item.category ||
                    "Device",
                deviceSerial:
                    record.device_sl_no ||
                    item.device_serial ||
                    "—",
                brand:
                    item.brand || "—",
                model:
                    item.model || "—",
                deviceType:
                    item.device_type || "—",
                deviceAge:
                    record.device_age ||
                    formatCompactDuration(
                        item.assigned_date,
                    ),

                amount:
                    category === "vendor"
                        ? String(
                              record.vendor_deducted_amount ||
                              "0",
                          )
                        : String(
                              record.deducted_amount ||
                              "0",
                          ),
                receiverAddress:
                    record.receiver_address || "—",
                gatePassDate:
                    record.gate_pass_date
                        ? formatDate(
                              record.gate_pass_date,
                          )
                        : "—",
                unit:
                    record.unit || "Nos",
                quantity:
                    String(record.quantity || "1"),
                remarks:
                    record.remarks || "—",
                attachmentName:
                    record.attach_file
                        ? record.attach_file
                              .split(/[\\/]/)
                              .filter(Boolean)
                              .pop() || record.attach_file
                        : "—",

                companyMaterial:
                    Number(record.company_material) > 0,
                nonRefundable:
                    Number(record.non_refundable) > 0,
            };

            printOWST(snapshot);
        } catch (reason) {
            const message =
                reason instanceof Error
                    ? reason.message
                    : "Unable to load OWST print data.";

            window.alert(
                `OWST Print Preview: ${message}`,
            );
        }
    }


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

    useEffect(() => {
        const query = searchInput.trim();

        // Empty / very short input resets the live search so stale results
        // are not left on screen while the user types a new MR / PR / ID.
        if (query.length < 2) {
            setAjaxSearching(false);

            if (search !== "") {
                setSearch("");
                setPage(1);
            }

            return;
        }

        setAjaxSearching(true);

        const timer = window.setTimeout(() => {
            setPage(1);
            setSearch(query);
            setAjaxSearching(false);
        }, 350);

        return () => {
            window.clearTimeout(timer);
        };
    }, [searchInput, search]);

    const loadAssets = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await deviceOperationsApi.activityPage({
                page,
                limit: PAGE_SIZE,
                search: search || undefined,
                status: status ? Number(status) : undefined,
                category: category || undefined,
            });

            const pageItems =
                (response.data ?? []) as OperationalAssetDevice[];

            // The backend returns the page globally ordered by the date that
            // produced each device's current status. Older Returned rows that
            // predate the assignment ledger still get the history fallback.
            const hydratedItems = await Promise.all(
                pageItems.map((item) =>
                    item.asset_status === 4 &&
                    !item.previous_assignment &&
                    !item.last_emp_id
                        ? hydrateReturnedLastHolder(item)
                        : Promise.resolve(item),
                ),
            );

            setItems(hydratedItems);
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

    const loadStatusCounts = useCallback(async () => {
        try {
            setStatusCountsLoading(true);

            const responses = await Promise.all(
                STATUS_OPTIONS.map((option) =>
                    assetDeviceApi.list({
                        page: 1,
                        limit: 1,
                        status: option.value ? Number(option.value) : undefined,
                    }),
                ),
            );

            const nextCounts: DeviceStatusCounts = {};
            STATUS_OPTIONS.forEach((option, index) => {
                nextCounts[option.value] = Number(responses[index]?.total ?? 0);
            });
            setStatusCounts(nextCounts);
        } catch (reason) {
            console.error("Unable to load device status counts:", reason);
        } finally {
            setStatusCountsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAssets();
    }, [loadAssets]);

    useEffect(() => {
        void loadStatusCounts();
    }, [loadStatusCounts]);

    useEffect(() => {
        const needsEmployeeSearch =
            operation === "assign-direct" ||
            operation === "reassign" ||
            operation === "transfer";

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

                const activeEmployees = (response.data ?? []).filter(
                    (employee) => {
                        const active = employee.active
                            ?.trim()
                            .toLowerCase();

                        return active === "active" || active === "yes";
                    },
                );

                setEmployeeResults(activeEmployees);
            } catch {
                setEmployeeResults([]);
            } finally {
                setEmployeeSearching(false);
            }
        }, 300);

        return () => window.clearTimeout(timer);
    }, [employeeQuery, operation, selectedEmployee]);

    useEffect(() => {
        if (operation !== "owst" || owstType !== "vendor") {
            return;
        }

        let active = true;

        async function loadOWSTVendors() {
            try {
                setOWSTVendorsLoading(true);
                const response = await vendorApi.list();
                const rows = Array.isArray(response.data)
                    ? response.data
                    : [];

                const normalized = rows
                    .map((row: any): OWSTVendor | null => {
                        const id = Number(
                            row?.id ??
                            row?.ID ??
                            0,
                        );
                        const name = String(
                            row?.vendor_name ??
                            row?.name ??
                            row?.Name ??
                            "",
                        ).trim();

                        if (!id || !name) {
                            return null;
                        }

                        return {
                            id,
                            name,
                            address: String(
                                row?.vendor_address ??
                                row?.addr ??
                                row?.Addr ??
                                "",
                            ).trim(),
                            mobile: String(
                                row?.vendor_mobile ??
                                row?.mobile ??
                                row?.Mobile ??
                                "",
                            ).trim(),
                            email: String(
                                row?.vendor_email ??
                                row?.email ??
                                row?.Email ??
                                "",
                            ).trim(),
                        };
                    })
                    .filter(
                        (vendor): vendor is OWSTVendor =>
                            Boolean(vendor),
                    );

                if (active) {
                    setOWSTVendors(normalized);
                }
            } catch (reason) {
                if (active) {
                    setOWSTVendors([]);
                    setOperationError(
                        reason instanceof Error
                            ? reason.message
                            : "Unable to load active vendors.",
                    );
                }
            } finally {
                if (active) {
                    setOWSTVendorsLoading(false);
                }
            }
        }

        void loadOWSTVendors();

        return () => {
            active = false;
        };
    }, [operation, owstType]);

    useEffect(() => {
        if (
            operation !== "owst" ||
            !selectedAsset?.emp_id?.trim()
        ) {
            setOWSTEmployeeProfile(null);
            return;
        }

        let active = true;

        async function loadOWSTCurrentEmployee() {
            try {
                setOWSTEmployeeLoading(true);
                const response = await employeeApi.get(
                    encodeURIComponent(selectedAsset!.emp_id!.trim()),
                );
                if (active) {
                    setOWSTEmployeeProfile(response.data ?? null);
                }
            } catch {
                if (active) {
                    setOWSTEmployeeProfile(null);
                }
            } finally {
                if (active) {
                    setOWSTEmployeeLoading(false);
                }
            }
        }

        void loadOWSTCurrentEmployee();

        return () => {
            active = false;
        };
    }, [operation, selectedAsset?.id, selectedAsset?.emp_id]);

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
        setAjaxSearching(false);
        setPage(1);
        setSearch(searchInput.trim());
        setCategory(categoryInput.trim());
    }

    function clearFilters() {
        setAjaxSearching(false);
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
        openOperation(item, "detail");
    }

    async function loadAssignmentContext(assetID: number) {
        try {
            setAssignmentContextLoading(true);

            const response =
                await deviceOperationsApi.assignmentContext(assetID);

            const context = response.data ?? null;
            setAssignmentContext(context);

            if (context?.technical) {
                setAssignmentTechnicalForm({
                    agp: context.technical.agp ?? "",
                    battery: context.technical.battery ?? "",
                    removal_drive: context.technical.removal_drive ?? "",
                    operating_system: context.technical.operating_system ?? "",
                    os_key: context.technical.os_key ?? "",
                    ip_address: context.technical.ip_address ?? "",
                    lan_mac_address: context.technical.lan_mac_address ?? "",
                    wlan_mac_address: context.technical.wlan_mac_address ?? "",
                    adapter: context.technical.adapter ?? "",
                    mouse: context.technical.mouse ?? "",
                    ups: context.technical.ups ?? "",
                    bag: context.technical.bag ?? "",
                    assignment_device_type:
                        context.technical.assignment_device_type == null
                            ? ""
                            : String(context.technical.assignment_device_type),
                });

                setUpdateForm((current) => ({
                    ...current,
                    cpu: context.stock.cpu ?? "",
                    ram: context.stock.ram ?? "",
                    storage: context.stock.storage ?? "",
                    monitor: context.stock.monitor ?? "",
                }));
            }
        } catch (reason) {
            console.error("Unable to load assignment context:", reason);
            setAssignmentContext(null);
        } finally {
            setAssignmentContextLoading(false);
        }
    }

    async function loadAssetHistory(item: OperationalAssetDevice) {
        try {
            setHistoryLoading(true);
            setHistoryError("");
            const rows = await deviceOperationsApi.history(item.id);
            setHistoryEntries(rows);
        } catch (reason) {
            setHistoryEntries([]);
            setHistoryError(
                reason instanceof Error
                    ? reason.message
                    : "Previous assignment history could not be loaded.",
            );
        } finally {
            setHistoryLoading(false);
        }
    }

    function openOperation(item: OperationalAssetDevice, next: Exclude<OperationType, null>) {
        setSelectedAsset(item);
        setOperation(next);
        setOperationError("");
        setShowAssignmentOptional(next === "reassign");
        setRemarks(next === "detail" || next === "update" ? item.remarks ?? "" : "");
        setAssignmentContext(null);
        setHistoryEntries([]);
        setHistoryError("");
        setAssignmentTechnicalForm({
            agp: item.agp ?? "",
            battery: item.battery ?? "",
            removal_drive: item.removal_drive ?? "",
            operating_system: item.operating_system ?? "",
            os_key: item.os_key ?? "",
            ip_address: item.ip_address ?? "",
            lan_mac_address: item.lan_mac_address ?? "",
            wlan_mac_address: item.wlan_mac_address ?? "",
            adapter: item.adapter ?? "",
            mouse: item.mouse ?? "",
            ups: item.ups ?? "",
            bag: item.bag ?? "",
            assignment_device_type: item.assignment_device_type == null ? "" : String(item.assignment_device_type),
        });
        setEmployeeQuery("");
        setEmployeeResults([]);
        setSelectedEmployee(null);
        setRequisitionQuery("");
        setRequisitionResults([]);
        setSelectedRequisition(null);
        setOWSTType("user");
        setOWSTVendorID("");
        setOWSTVendorOthers("");
        setOWSTAmount("");
        setOWSTReceiverAddress("");
        setOWSTGatePassDate(dateInputValue(new Date().toISOString()));
        setOWSTUnit("Nos");
        setOWSTQuantity("1");
        setOWSTAttachment(null);
        setOWSTCompanyMaterial(true);
        setOWSTNonRefundable(true);
        setOWSTEmployeeProfile(null);
        setOWSTPrintSnapshot(null);
        setWarrantyProblems("");
        setUpdateForm({
            device_serial: item.device_serial ?? "",
            category: item.category ?? "",
            brand: item.brand ?? "",
            model: item.model ?? "",
            device_type: item.device_type ?? "",
            vendor_name: item.vendor_name ?? "",
            purchase_date: dateInputValue(item.purchase_date),
            warranty_date: dateInputValue(item.warranty_date),
            cpu: "",
            ram: "",
            storage: "",
            monitor: "",
        });

        if (
            next === "detail" ||
            next === "assign-direct" ||
            next === "reassign" ||
            next === "update" ||
            next === "transfer" ||
            next === "return" ||
            next === "owst" ||
            next === "warranty" ||
            next === "damaged" ||
            next === "lost"
        ) {
            void loadAssignmentContext(item.id);
        }

        if (next === "history") {
            void loadAssetHistory(item);
        }
    }

    function closeOperation() {
        if (operationBusy) return;
        setOperation(null);
        setSelectedAsset(null);
        setOperationError("");
        setHistoryError("");
    }

    async function submitOperation() {
        if (!selectedAsset || !operation) return;

        try {
            setOperationBusy(true);
            setOperationError("");
            let message = "Device operation completed successfully.";

            if (operation === "assign-direct") {
                if (!canAssignNewEmployee(selectedAsset)) {
                    setOperationError(
                        "This device is no longer available for a new assignment. Refresh the list and review its current holder/status.",
                    );
                    return;
                }

                if (!selectedEmployee) {
                    setOperationError("Select an employee first.");
                    return;
                }

                if (!isValidMacAddress(assignmentTechnicalForm.lan_mac_address)) {
                    setOperationError(
                        "LAN-MAC must contain exactly 12 hexadecimal characters, e.g. 00:1A:2B:3C:4D:5E.",
                    );
                    return;
                }

                if (!isValidMacAddress(assignmentTechnicalForm.wlan_mac_address)) {
                    setOperationError(
                        "WLAN-MAC must contain exactly 12 hexadecimal characters, e.g. 00:1A:2B:3C:4D:5E.",
                    );
                    return;
                }

                const normalizedLAN = compactMacAddress(
                    assignmentTechnicalForm.lan_mac_address,
                );
                const normalizedWLAN = compactMacAddress(
                    assignmentTechnicalForm.wlan_mac_address,
                );

                if (
                    normalizedLAN &&
                    normalizedWLAN &&
                    normalizedLAN === normalizedWLAN
                ) {
                    setOperationError(
                        "LAN-MAC and WLAN-MAC must be different addresses.",
                    );
                    return;
                }

                await deviceOperationsApi.assignDirect(
                    selectedAsset.id,
                    selectedEmployee.employee_id,
                    remarks,
                    {
                        ...assignmentTechnicalForm,
                        lan_mac_address: assignmentTechnicalForm.lan_mac_address
                            ? formatMacAddress(assignmentTechnicalForm.lan_mac_address)
                            : "",
                        wlan_mac_address: assignmentTechnicalForm.wlan_mac_address
                            ? formatMacAddress(assignmentTechnicalForm.wlan_mac_address)
                            : "",
                    },
                );

                message = `Device assigned directly to ${selectedEmployee.employee_id} · ${selectedEmployee.employee_name}.`;
            }

            if (operation === "assign-tt") {
                if (!canAssignNewEmployee(selectedAsset)) {
                    setOperationError(
                        "This device is no longer available for TT allocation. Refresh the list and review its current holder/status.",
                    );
                    return;
                }

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
                if (!updateForm.device_serial.trim()) {
                    setOperationError("Device serial is required.");
                    return;
                }

                if (!updateForm.category.trim()) {
                    setOperationError("Category is required.");
                    return;
                }

                if (!isValidMacAddress(assignmentTechnicalForm.lan_mac_address)) {
                    setOperationError(
                        "LAN-MAC must contain exactly 12 hexadecimal characters, e.g. 00:1A:2B:3C:4D:5E.",
                    );
                    return;
                }

                if (!isValidMacAddress(assignmentTechnicalForm.wlan_mac_address)) {
                    setOperationError(
                        "WLAN-MAC must contain exactly 12 hexadecimal characters, e.g. 00:1A:2B:3C:4D:5E.",
                    );
                    return;
                }

                const updateLAN = compactMacAddress(
                    assignmentTechnicalForm.lan_mac_address,
                );
                const updateWLAN = compactMacAddress(
                    assignmentTechnicalForm.wlan_mac_address,
                );

                if (updateLAN && updateWLAN && updateLAN === updateWLAN) {
                    setOperationError(
                        "LAN-MAC and WLAN-MAC must be different addresses.",
                    );
                    return;
                }

                await deviceOperationsApi.fullUpdate(selectedAsset.id, {
                    master: {
                        device_serial: updateForm.device_serial.trim(),
                        category: updateForm.category.trim(),
                        brand: updateForm.brand.trim(),
                        model: updateForm.model.trim(),
                        device_type: updateForm.device_type.trim(),
                        vendor_name: updateForm.vendor_name.trim(),
                        purchase_date: updateForm.purchase_date,
                        warranty_date: updateForm.warranty_date,
                    },
                    stock: {
                        cpu: updateForm.cpu.trim(),
                        ram: updateForm.ram.trim(),
                        storage: updateForm.storage.trim(),
                        monitor: updateForm.monitor.trim(),
                    },
                    technical_details: {
                        ...assignmentTechnicalForm,
                        lan_mac_address: assignmentTechnicalForm.lan_mac_address
                            ? formatMacAddress(assignmentTechnicalForm.lan_mac_address)
                            : "",
                        wlan_mac_address: assignmentTechnicalForm.wlan_mac_address
                            ? formatMacAddress(assignmentTechnicalForm.wlan_mac_address)
                            : "",
                    },
                });

                message = "Device master, specification and technical information updated.";
            }

            if (operation === "transfer") {
                if (!selectedEmployee) {
                    setOperationError("Select the employee who will receive the transferred device.");
                    return;
                }

                if (
                    selectedAsset.emp_id &&
                    selectedAsset.emp_id.trim().toLowerCase() ===
                    selectedEmployee.employee_id.trim().toLowerCase()
                ) {
                    setOperationError(
                        "Select a different employee. The device is already assigned to this employee.",
                    );
                    return;
                }

                await deviceOperationsApi.reassignAsset(
                    selectedAsset.id,
                    selectedEmployee.employee_id,
                    remarks,
                    EMPTY_ASSIGNMENT_TECHNICAL_FORM,
                );

                message = `Previous assignment saved as Transferred and device assigned to ${selectedEmployee.employee_id} · ${selectedEmployee.employee_name}.`;
            }

            if (operation === "reassign") {
                if (!selectedEmployee) {
                    setOperationError("Select the employee who should hold this device.");
                    return;
                }

                if (
                    selectedAsset.emp_id &&
                    selectedAsset.emp_id.trim().toLowerCase() ===
                    selectedEmployee.employee_id.trim().toLowerCase()
                ) {
                    setOperationError(
                        "Select a different employee. The device is already linked to this employee.",
                    );
                    return;
                }

                if (!isValidMacAddress(assignmentTechnicalForm.lan_mac_address)) {
                    setOperationError(
                        "LAN-MAC must contain exactly 12 hexadecimal characters, e.g. 00:1A:2B:3C:4D:5E.",
                    );
                    return;
                }

                if (!isValidMacAddress(assignmentTechnicalForm.wlan_mac_address)) {
                    setOperationError(
                        "WLAN-MAC must contain exactly 12 hexadecimal characters, e.g. 00:1A:2B:3C:4D:5E.",
                    );
                    return;
                }

                await deviceOperationsApi.reassignAsset(
                    selectedAsset.id,
                    selectedEmployee.employee_id,
                    remarks,
                    {
                        ...assignmentTechnicalForm,
                        lan_mac_address: assignmentTechnicalForm.lan_mac_address
                            ? formatMacAddress(assignmentTechnicalForm.lan_mac_address)
                            : "",
                        wlan_mac_address: assignmentTechnicalForm.wlan_mac_address
                            ? formatMacAddress(assignmentTechnicalForm.wlan_mac_address)
                            : "",
                    },
                );

                message = `Previous assignment saved as Transferred and device assigned to ${selectedEmployee.employee_id} · ${selectedEmployee.employee_name}.`;
            }

            if (operation === "return") {
                await deviceOperationsApi.returnAsset(selectedAsset.id, remarks);
                message = "Device returned successfully. The current assignment has been closed.";
            }

            if (operation === "owst") {
                if (!selectedAsset.emp_id?.trim()) {
                    setOperationError(
                        "The device must have a current assigned employee before OWST.",
                    );
                    return;
                }

                const amount = Number(owstAmount || 0);
                if (!Number.isFinite(amount) || amount <= 0) {
                    setOperationError(
                        owstType === "user"
                            ? "Enter a deducted amount greater than 0 for User OWST."
                            : "Enter a deducted amount greater than 0 for Vendor OWST.",
                    );
                    return;
                }

                if (
                    owstType === "vendor" &&
                    !selectedOWSTVendor
                ) {
                    setOperationError("Select an active vendor.");
                    return;
                }

                if (!owstReceiverAddress.trim()) {
                    setOperationError("Receiver address is required for the gate pass.");
                    return;
                }

                if (!owstGatePassDate) {
                    setOperationError("Gate pass date is required.");
                    return;
                }

                const quantity = Number(owstQuantity || 0);
                if (!Number.isInteger(quantity) || quantity < 1) {
                    setOperationError("Quantity must be at least 1.");
                    return;
                }

                if (!remarks.trim()) {
                    setOperationError("OWST / gate-pass remarks are required.");
                    return;
                }

                if (
                    owstAttachment &&
                    owstAttachment.size > 4 * 1024 * 1024
                ) {
                    setOperationError("Attachment must be 4 MB or smaller.");
                    return;
                }

                const owstResponse =
                    await deviceOperationsApi.createOWST(
                        selectedAsset.id,
                        {
                            ownership_type: owstType,
                            vendor_id:
                                owstType === "vendor"
                                    ? selectedOWSTVendor?.id
                                    : undefined,
                            deducted_amount:
                                owstType === "user"
                                    ? amount
                                    : 0,
                            vendor_deducted_amount:
                                owstType === "vendor"
                                    ? amount
                                    : 0,
                            vendor_others:
                                owstType === "vendor"
                                    ? owstVendorOthers.trim()
                                    : "",
                            receiver_address:
                                owstReceiverAddress.trim(),
                            gate_pass_date: owstGatePassDate,
                            unit: owstUnit.trim() || "Nos",
                            quantity,
                            remarks: remarks.trim(),
                            company_material:
                                owstCompanyMaterial,
                            non_refundable:
                                owstNonRefundable,
                            attachment: owstAttachment,
                        },
                    );

                const generatedReference =
                    String(
                        owstResponse?.data?.reference_no ??
                        owstResponse?.data?.owst_id ??
                        "Pending",
                    );

                setOWSTPrintSnapshot(
                    buildOWSTPrintSnapshot(
                        generatedReference,
                    ),
                );

                message = `OWST (${owstType === "user" ? "User" : "Vendor"}) created successfully. Reference #${generatedReference}.`;
            }

            if (operation === "damaged") {
                if (!remarks.trim()) {
                    setOperationError(
                        "Enter damage remarks before marking the device as Damaged.",
                    );
                    return;
                }

                await deviceOperationsApi.markDamaged(
                    selectedAsset.id,
                    remarks.trim(),
                );

                message =
                    "Device status changed to Damaged. The responsible employee snapshot and audit history were preserved.";
            }

            if (operation === "lost") {
                if (!remarks.trim()) {
                    setOperationError(
                        "Enter lost-device remarks before marking the device as Lost.",
                    );
                    return;
                }

                await deviceOperationsApi.markLost(
                    selectedAsset.id,
                    remarks.trim(),
                );

                message =
                    "Device status changed to Lost. The responsible employee snapshot and audit history were preserved.";
            }

            if (operation === "warranty") {
                if (!warrantyProblems.trim()) {
                    setOperationError("Describe the warranty problem first.");
                    return;
                }
                await deviceOperationsApi.createWarrantyClaim(
                    selectedAsset.id,
                    warrantyProblems.trim(),
                    remarks.trim(),
                );
                message = "Warranty claim raised and device status changed to Claim Raised.";
            }

            if (operation === "delete") {
                await deviceOperationsApi.delete(selectedAsset.id);
                message = "Asset device deleted by ROOT user.";
            }

            if (operation === "detail" || operation === "history") {
                setOperation(null);
                setSelectedAsset(null);
                return;
            }

            const completedOperation = operation;
            const completedSerial =
                selectedAsset.device_serial || `Asset #${selectedAsset.id}`;
            const completedStatusLabel =
                completedOperation === "return"
                    ? "Returned"
                    : completedOperation === "transfer" ||
                        completedOperation === "reassign"
                        ? "Assigned"
                        : completedOperation === "assign-direct" ||
                                completedOperation === "assign-tt"
                                ? "Assigned"
                                : completedOperation === "owst"
                                    ? `OWST (${owstType === "user" ? "User" : "Vendor"})`
                                    : completedOperation === "warranty"
                                        ? "Claim Raised"
                                        : completedOperation === "damaged"
                                            ? "Damaged"
                                            : completedOperation === "lost"
                                                ? "Lost"
                                                : completedOperation === "delete"
                                            ? "Removed"
                                            : selectedAsset.status_label || "Updated";

            const completedTitle =
                completedOperation === "return"
                    ? "Device Return Completed"
                    : completedOperation === "transfer"
                        ? "Device Transfer Completed"
                        : completedOperation === "reassign"
                            ? "Employee Reassignment Completed"
                            : completedOperation === "assign-direct" ||
                                completedOperation === "assign-tt"
                                ? "Device Assignment Completed"
                                : completedOperation === "update"
                                    ? "Device Update Completed"
                                    : completedOperation === "owst"
                                        ? `OWST (${owstType === "user" ? "User" : "Vendor"}) Completed`
                                        : completedOperation === "warranty"
                                            ? "Warranty Claim Submitted"
                                            : completedOperation === "damaged"
                                                ? "Device Marked as Damaged"
                                                : completedOperation === "lost"
                                                    ? "Device Marked as Lost"
                                                    : completedOperation === "delete"
                                                ? "Device Removed"
                                                : "Operation Completed";

            setOperation(null);
            setSelectedAsset(null);
            setOperationError("");
            setNotice("");

            const alreadyAtAllStatusFirstPage = status === "" && page === 1;
            setStatus("");
            setPage(1);

            setSuccessDialog({
                title: completedTitle,
                message,
                serial: completedSerial,
                statusLabel: completedStatusLabel,
            });

            await loadStatusCounts();

            if (alreadyAtAllStatusFirstPage) {
                await loadAssets();
            }
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

    const hasExtraColumns = Array.from(visibleColumns).some(
        (key) => !DEFAULT_COLUMNS.includes(key),
    );
    const visibleCount = visibleColumns.size + 4;
    const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(page * PAGE_SIZE, total);

    const operationTitle = useMemo(() => {
        switch (operation) {
            case "detail":
                return "Device Details";
            case "history":
                return "Assignment & Transfer History";
            case "assign-direct":
                return "Assign Device to Employee";
            case "assign-tt":
                return "Assign from Approved TT Requisition";
            case "update":
                return "Update Device";
            case "transfer":
                return "Transfer Device";
            case "return":
                return "Return Device";
            case "owst":
                return "OWST · Ownership Transfer";
            case "warranty":
                return "Raise Warranty Claim";
            case "damaged":
                return "Mark Device as Damaged";
            case "lost":
                return "Mark Device as Lost";
            case "reassign":
                return "Reassign / Correct Employee";
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
                        <DropdownMenuContent align="end" className="max-h-[75vh] w-64 overflow-y-auto">
                            <DropdownMenuLabel>Show / hide columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {COLUMN_OPTIONS.map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.key}
                                    checked={visibleColumns.has(column.key)}
                                    onCheckedChange={() => toggleColumn(column.key)}
                                >
                                    <span className="flex items-center gap-2">
                                        {columnIcon(column.key)}
                                        <span>{column.label}</span>
                                    </span>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                        type="button"
                        onClick={() => {
                            void loadAssets();
                            void loadStatusCounts();
                        }}
                        disabled={loading}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>

                    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">Total Devices:</span>
                        <span className="ml-1 font-bold text-primary">
                            {loading && total === 0 ? "…" : total.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {showSCMImportNotice && showImportNotice && (
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
                                    <>MR: {importMR || "—"} · {stockCommittedCount || importedCount + updatedCount} stock row(s) committed · {assetsCreatedCount} new asset(s) · {assetsSynchronizedCount} existing asset(s) synchronized{normalizedAvailableCount > 0 ? ` · ${normalizedAvailableCount} normalized to Available` : ""}. Imported rows are filtered below.</>
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

            <div className="sticky top-0 z-30 rounded-lg border border-border bg-background/95 px-2 py-1.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90">
                <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <p className="shrink-0 text-[10px] font-semibold text-foreground">
                            Status Overview
                        </p>
                        <span className="hidden truncate text-[9px] text-muted-foreground md:inline">
                            Click a status to filter · latest action first
                        </span>
                    </div>

                    {statusCountsLoading && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[9px] text-muted-foreground">
                            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                            Refreshing
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-5 gap-1 lg:grid-cols-10">
                    {STATUS_OPTIONS.map((option) => {
                        const active = status === option.value;
                        const numericStatus =
                            option.value === "" ? null : Number(option.value);

                        return (
                            <button
                                key={option.value || "all"}
                                type="button"
                                onClick={() => {
                                    setStatus(option.value);
                                    setPage(1);
                                }}
                                className={`min-w-0 rounded-md border px-1.5 py-1 text-left transition-all ${active
                                    ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                                    : numericStatus === null
                                        ? "border-border bg-muted/20 hover:bg-muted/40"
                                        : `${statusClass(numericStatus)} hover:opacity-85`
                                    }`}
                                title={`${option.label}: ${Number(statusCounts[option.value] ?? 0).toLocaleString()}`}
                            >
                                <div className="flex min-w-0 items-center justify-between gap-1">
                                    <span className="truncate text-[7px] font-bold uppercase leading-3 tracking-[0.025em]">
                                        {option.compactLabel}
                                    </span>
                                    {active && (
                                        <span className="h-1 w-1 shrink-0 rounded-full bg-primary" />
                                    )}
                                </div>

                                <div className="mt-0.5 truncate text-[13px] font-bold leading-4 tabular-nums">
                                    {statusCountsLoading && statusCounts[option.value] == null
                                        ? "…"
                                        : Number(statusCounts[option.value] ?? 0).toLocaleString()}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1.6fr)_180px_180px_auto]">
                    <div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") applyFilters();
                                }}
                                placeholder="Type MR, PR or Employee ID..."
                                autoComplete="off"
                                className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />

                            {(ajaxSearching || (loading && searchInput.trim().length >= 2)) ? (
                                <RefreshCw className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
                            ) : searchInput ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAjaxSearching(false);
                                        setSearchInput("");
                                        setSearch("");
                                        setPage(1);
                                    }}
                                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-label="Clear live search"
                                    title="Clear search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-1 flex min-h-[16px] items-center justify-between gap-3 px-1 text-[10px] text-muted-foreground">
                            <span>Live search: MR · PR · Employee ID</span>

                            {searchInput.trim().length >= 2 && !ajaxSearching && !loading && (
                                <span className="shrink-0 font-medium text-foreground/70">
                                    {total.toLocaleString()} {total === 1 ? "match" : "matches"}
                                </span>
                            )}
                        </div>
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
                <div className="max-h-[65vh] overflow-auto">
                    <table
                        className="w-full min-w-[1280px] table-fixed text-[11px] leading-4"
                    >
                        <thead className="sticky top-0 z-20 border-b border-border bg-background/95 shadow-sm backdrop-blur">
                            <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                                <th className={hasExtraColumns ? "px-2 py-2.5 text-center" : "w-[4%] px-2 py-2.5 text-center"}>
                                    <span className="inline-flex items-center justify-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        SL
                                    </span>
                                </th>
                                {visibleColumns.has("serial") && (
                                    <th className={hasExtraColumns ? "px-2 py-2" : "w-[11%] px-2.5 py-2.5"}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Hash className="h-3.5 w-3.5" />
                                            Serial / Asset
                                        </span>
                                    </th>
                                )}
                                {visibleColumns.has("device") && (
                                    <th className={hasExtraColumns ? "px-2 py-2" : "w-[13%] px-2.5 py-2.5"}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Laptop2 className="h-3.5 w-3.5" />
                                            Device
                                        </span>
                                    </th>
                                )}
                                <th className={hasExtraColumns ? "px-2 py-2.5 text-center" : "w-[7%] px-2 py-2.5 text-center"}>
                                    <span className="inline-flex items-center justify-center gap-1.5">
                                        <PackageCheck className="h-3.5 w-3.5" />
                                        Entry
                                    </span>
                                </th>
                                {visibleColumns.has("employee") && (
                                    <th className={hasExtraColumns ? "min-w-[250px] px-2.5 py-2.5" : "w-[22%] min-w-[250px] px-2.5 py-2.5"}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <UserRound className="h-3.5 w-3.5" />
                                            Employee
                                        </span>
                                    </th>
                                )}
                                {visibleColumns.has("mrpr") && (
                                    <th className={hasExtraColumns ? "px-2 py-2" : "w-[17%] px-2.5 py-2.5"}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5" />
                                            MR / PR
                                        </span>
                                    </th>
                                )}
                                {visibleColumns.has("designation") && (
                                    <th className="px-2 py-2">
                                        <span className="inline-flex items-center gap-1.5">
                                            <BriefcaseBusiness className="h-3.5 w-3.5" />
                                            Designation
                                        </span>
                                    </th>
                                )}
                                {visibleColumns.has("brand") && (
                                    <th className="px-2 py-2">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Tag className="h-3.5 w-3.5" />
                                            Brand
                                        </span>
                                    </th>
                                )}
                                {visibleColumns.has("model") && (
                                    <th className="px-2 py-2">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Box className="h-3.5 w-3.5" />
                                            Model
                                        </span>
                                    </th>
                                )}
                                {visibleColumns.has("deviceType") && <th className="px-2 py-2">Device Type</th>}
                                {visibleColumns.has("vendor") && <th className="px-2 py-2">Vendor</th>}
                                {visibleColumns.has("actionDate") && (
                                    <th className="sticky right-[220px] z-30 w-[156px] min-w-[156px] border-l border-border bg-background/95 px-2.5 py-2.5 shadow-[-4px_0_8px_-8px_rgba(0,0,0,0.18)]">
                                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                            <CalendarClock className="h-3.5 w-3.5" />
                                            Action Date
                                        </span>
                                    </th>
                                )}
                                {visibleColumns.has("purchase") && <th className="px-2 py-2">Purchase Date</th>}
                                {visibleColumns.has("warranty") && <th className="px-2 py-2">Warranty Date</th>}
                                {visibleColumns.has("deviceAge") && <th className="px-2 py-2">Device Age</th>}
                                {visibleColumns.has("usageDuration") && <th className="px-2 py-2">Usage Duration</th>}
                                {visibleColumns.has("remarks") && <th className="px-2 py-2">Remarks</th>}
                                {visibleColumns.has("assetType") && <th className="px-2 py-2">Asset Type</th>}
                                <th className="sticky right-[96px] z-30 w-[124px] min-w-[124px] border-l border-border bg-background/95 px-2.5 py-2.5 text-center shadow-[-4px_0_8px_-8px_rgba(0,0,0,0.25)]">
                                    <span className="inline-flex items-center justify-center gap-1.5">
                                        <BadgeCheck className="h-3.5 w-3.5" />
                                        Status
                                    </span>
                                </th>
                                <th className="sticky right-0 z-40 w-[96px] min-w-[96px] border-l border-border bg-background/95 px-2 py-2.5 text-center shadow-[-8px_0_12px_-9px_rgba(0,0,0,0.35)]">
                                    <span className="inline-flex items-center justify-center gap-1.5">
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                        Actions
                                    </span>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && items.length === 0 && (
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

                            {!error && items.map((item, index) => (
                                <tr
                                    key={item.id}
                                    onDoubleClick={() => openDevice(item)}
                                    className={`group min-h-[62px] border-b border-border/70 align-middle transition-colors last:border-b-0 hover:bg-muted/30 ${loading ? "opacity-70" : ""}`}
                                >
                                    <td className="px-2.5 py-2 text-center align-middle">
                                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-muted/40 px-1 text-[10px] font-semibold tabular-nums text-foreground">
                                            {startItem + index}
                                        </span>
                                    </td>

                                    {visibleColumns.has("serial") && (
                                        <td className="min-w-0 px-2.5 py-2 align-middle">
                                            <div
                                                className="block max-w-full overflow-hidden rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-4 text-foreground"
                                                title={item.device_serial || undefined}
                                            >
                                                <span className="block truncate">{item.device_serial || "—"}</span>
                                            </div>
                                            <div className="mt-0.5 text-[10px] text-muted-foreground">
                                                Asset ID <span className="font-semibold text-foreground">#{item.id}</span>
                                            </div>
                                        </td>
                                    )}

                                    {visibleColumns.has("device") && (
                                        <td className="min-w-0 px-2.5 py-2 align-middle">
                                            <div className="flex min-w-0 items-center gap-1.5">
                                                <Laptop2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                <span
                                                    className="truncate text-[11px] font-semibold leading-4 text-foreground"
                                                    title={item.category || "Uncategorized"}
                                                >
                                                    {item.category || "Uncategorized"}
                                                </span>
                                            </div>
                                            <div className="mt-0.5 pl-5 text-[9px] text-muted-foreground">
                                                Device category
                                            </div>
                                        </td>
                                    )}

                                    <td className="px-2.5 py-2 text-center align-middle">
                                        {item.mr_number?.trim() ? (
                                            <span
                                                className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-300"
                                                title="Material Requisition entry"
                                            >
                                                MR
                                            </span>
                                        ) : (
                                            <span
                                                className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-300"
                                                title="Petty Cash entry — no MR number"
                                            >
                                                Petty Cash
                                            </span>
                                        )}
                                    </td>

                                    {visibleColumns.has("employee") && (
                                        <td className="min-w-0 px-2.5 py-2 align-middle">
                                            {item.emp_id || item.last_emp_id ? (
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <EmployeeAvatar
                                                        name={item.emp_name || item.last_emp_name || null}
                                                        image={item.employee_image || item.last_employee_image}
                                                    />

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex min-w-0 items-center gap-1.5">
                                                            <span
                                                                className="truncate text-[10px] font-semibold text-foreground"
                                                                title={item.emp_name || item.last_emp_name || "Employee"}
                                                            >
                                                                {item.emp_name || item.last_emp_name || "Employee"}
                                                            </span>
                                                            <BadgeCheck className="h-3 w-3 shrink-0 text-blue-600" />
                                                        </div>

                                                        <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[9px]">
                                                            <span className="inline-flex shrink-0 items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono font-semibold text-blue-700">
                                                                <Hash className="h-2.5 w-2.5" />
                                                                {item.emp_id || item.last_emp_id}
                                                            </span>

                                                            {!item.emp_id && item.last_emp_id && (
                                                                <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-semibold uppercase text-emerald-700">
                                                                    Last holder
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mt-1 space-y-0.5 text-[9px] leading-3 text-muted-foreground">
                                                            <div className="flex min-w-0 items-start gap-1">
                                                                <BriefcaseBusiness className="mt-0.5 h-3 w-3 shrink-0" />
                                                                <span
                                                                    className="min-w-0 whitespace-normal break-words font-medium text-foreground/75"
                                                                    title={item.designation || item.last_designation || "Employee"}
                                                                >
                                                                    {item.designation || item.last_designation || "Employee"}
                                                                </span>
                                                            </div>
                                                            <div className="flex min-w-0 items-start gap-1">
                                                                <Building2 className="mt-0.5 h-3 w-3 shrink-0" />
                                                                <span className="min-w-0 whitespace-normal break-words" title="Fiber@Home Global Ltd.">
                                                                    Fiber@Home Global Ltd.
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40">
                                                        <UserRound className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[10px] font-semibold text-muted-foreground">
                                                            Unassigned
                                                        </div>
                                                        <div className="truncate text-[9px] text-muted-foreground">
                                                            No previous employee history found
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    )}

                                    {visibleColumns.has("mrpr") && (
                                        <td className="min-w-0 px-2.5 py-2 align-middle">
                                            <div className="space-y-2">
                                                <div className="grid min-w-0 grid-cols-[26px_minmax(0,1fr)] items-center gap-1.5">
                                                    <span className="inline-flex h-5 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-1 text-[9px] font-semibold uppercase tracking-wide text-blue-700">
                                                        MR
                                                    </span>
                                                    <span
                                                        className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] font-semibold leading-4 text-foreground"
                                                        title={item.mr_number || undefined}
                                                    >
                                                        {item.mr_number || "—"}
                                                    </span>
                                                </div>

                                                <div className="grid min-w-0 grid-cols-[26px_minmax(0,1fr)] items-center gap-1.5 border-t border-border/50 pt-1">
                                                    <span className="inline-flex h-5 items-center justify-center rounded-md border border-violet-200 bg-violet-50 px-1 text-[9px] font-semibold uppercase tracking-wide text-violet-700">
                                                        PR
                                                    </span>
                                                    <span
                                                        className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] font-medium leading-4 text-foreground/90"
                                                        title={item.pr_number || undefined}
                                                    >
                                                        {item.pr_number || "—"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    )}

                                    {visibleColumns.has("designation") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="block truncate" title={String(item.designation || "—")}>{item.designation || "—"}</span>
                                        </td>
                                    )}

                                    {visibleColumns.has("brand") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="flex min-w-0 items-center gap-1.5">
                                                <Tag className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                <span className="block truncate" title={String(item.brand || "—")}>{item.brand || "—"}</span>
                                            </span>
                                        </td>
                                    )}

                                    {visibleColumns.has("model") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="flex min-w-0 items-center gap-1.5">
                                                <Box className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                <span className="block truncate" title={String(item.model || "—")}>{item.model || "—"}</span>
                                            </span>
                                        </td>
                                    )}

                                    {visibleColumns.has("deviceType") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="block truncate" title={assignmentDeviceTypeLabel(item.assignment_device_type)}>
                                                {assignmentDeviceTypeLabel(item.assignment_device_type)}
                                            </span>
                                        </td>
                                    )}

                                    {visibleColumns.has("vendor") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="block truncate" title={String(item.vendor_name || "—")}>{item.vendor_name || "—"}</span>
                                        </td>
                                    )}

                                    {visibleColumns.has("actionDate") && (
                                        <td className="sticky right-[220px] z-20 w-[156px] min-w-[156px] border-l border-border bg-card px-2.5 py-2 align-middle shadow-[-4px_0_8px_-8px_rgba(0,0,0,0.14)] group-hover:bg-muted/30">
                                            <div className="space-y-0.5">
                                                <span
                                                    className="block whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.04em] text-muted-foreground"
                                                    title={item.status_action_label || statusActionDateHeader(item.asset_status)}
                                                >
                                                    {item.status_action_label || statusActionDateHeader(item.asset_status)}
                                                </span>
                                                <span
                                                    className="block whitespace-nowrap text-[10px] font-semibold text-foreground"
                                                    title={String(formatDateTime(item.status_action_date))}
                                                >
                                                    {formatDateTime(item.status_action_date)}
                                                </span>
                                            </div>
                                        </td>
                                    )}

                                    {visibleColumns.has("purchase") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="block truncate" title={String(formatDate(item.purchase_date))}>{formatDate(item.purchase_date)}</span>
                                        </td>
                                    )}

                                    {visibleColumns.has("warranty") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="block truncate" title={String(formatDate(item.warranty_date))}>{formatDate(item.warranty_date)}</span>
                                        </td>
                                    )}

                                    {visibleColumns.has("deviceAge") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="block truncate" title={formatCompactDuration(item.purchase_date)}>
                                                {formatCompactDuration(item.purchase_date)}
                                            </span>
                                        </td>
                                    )}

                                    {visibleColumns.has("usageDuration") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="block truncate" title={formatCompactDuration(item.assigned_date, usageEndDate(item))}>
                                                {formatCompactDuration(item.assigned_date, usageEndDate(item))}
                                            </span>
                                        </td>
                                    )}

                                    {visibleColumns.has("remarks") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="block truncate" title={String(item.remarks || "—")}>{item.remarks || "—"}</span>
                                        </td>
                                    )}

                                    {visibleColumns.has("assetType") && (
                                        <td className="min-w-0 px-2.5 py-2 text-[10px] font-medium">
                                            <span className="block truncate" title={String(item.device_type || "—")}>{item.device_type || "—"}</span>
                                        </td>
                                    )}

                                    <td className="sticky right-[96px] z-20 w-[124px] min-w-[124px] border-l border-border bg-card px-2 py-2 text-center align-middle shadow-[-4px_0_8px_-8px_rgba(0,0,0,0.20)] group-hover:bg-muted/30">
                                        <span
                                            className={`inline-flex max-w-[116px] items-center justify-center truncate whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-semibold ${statusClass(item.asset_status)}`}
                                            title={
                                                item.status_label ||
                                                STATUS_OPTIONS.find(
                                                    (statusItem) =>
                                                        statusItem.value === String(item.asset_status)
                                                )?.label ||
                                                `Status ${item.asset_status}`
                                            }
                                        >
                                            {item.status_label ||
                                                STATUS_OPTIONS.find(
                                                    (statusItem) =>
                                                        statusItem.value === String(item.asset_status)
                                                )?.label ||
                                                `Status ${item.asset_status}`}
                                        </span>
                                    </td>

                                    <td className="sticky right-0 z-30 w-[96px] min-w-[96px] border-l border-border bg-card px-2 py-2 text-center align-middle shadow-[-8px_0_12px_-9px_rgba(0,0,0,0.25)] group-hover:bg-muted/30">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-8 min-w-[76px] items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[10px] font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                                                    aria-label={`Actions for ${item.device_serial || "asset device"}`}
                                                    aria-haspopup="menu"
                                                >
                                                    Actions
                                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end" className="w-64">
                                                <DropdownMenuLabel>
                                                    {item.status_label} · Device Actions
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => openOperation(item, "history")} className="gap-2">
                                                    <HistoryIcon className="h-4 w-4 text-violet-600" />
                                                    Assignment History
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />

                                                {canAssignNewEmployee(item) && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "assign-direct")} className="gap-2">
                                                            <UserPlus className="h-4 w-4 text-primary" />
                                                            Assign to Employee
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
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => openOperation(item, "damaged")}
                                                            className="gap-2 text-orange-700 focus:text-orange-700"
                                                        >
                                                            <FileWarning className="h-4 w-4" />
                                                            Mark as Damaged
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openOperation(item, "lost")}
                                                            className="gap-2 text-red-700 focus:text-red-700"
                                                        >
                                                            <Search className="h-4 w-4" />
                                                            Mark as Lost
                                                        </DropdownMenuItem>
                                                    </>
                                                )}

                                                {item.asset_status === 0 && !canAssignNewEmployee(item) && (
                                                    <>
                                                        <DropdownMenuItem disabled className="gap-2 text-amber-700 opacity-100">
                                                            <ShieldCheck className="h-4 w-4" />
                                                            Assignment locked · current holder exists
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openDevice(item)} className="gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "update")} className="gap-2">
                                                            <Pencil className="h-4 w-4 text-amber-600" />
                                                            Update
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => openOperation(item, "damaged")}
                                                            className="gap-2 text-orange-700 focus:text-orange-700"
                                                        >
                                                            <FileWarning className="h-4 w-4" />
                                                            Mark as Damaged
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openOperation(item, "lost")}
                                                            className="gap-2 text-red-700 focus:text-red-700"
                                                        >
                                                            <Search className="h-4 w-4" />
                                                            Mark as Lost
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
                                                        <DropdownMenuItem onClick={() => openOperation(item, "reassign")} className="gap-2">
                                                            <UserPlus className="h-4 w-4 text-violet-600" />
                                                            Reassign / Correct Employee
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openOperation(item, "transfer")} className="gap-2">
                                                            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                                                            Transfer
                                                        </DropdownMenuItem>
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
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => openOperation(item, "damaged")}
                                                            className="gap-2 text-orange-700 focus:text-orange-700"
                                                        >
                                                            <FileWarning className="h-4 w-4" />
                                                            Mark as Damaged
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openOperation(item, "lost")}
                                                            className="gap-2 text-red-700 focus:text-red-700"
                                                        >
                                                            <Search className="h-4 w-4" />
                                                            Mark as Lost
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

                                                {item.asset_status === 3 && (
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
                                                            <UserPlus className="h-4 w-4 text-violet-600" />
                                                            Reassign / Correct Employee
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "transfer")} className="gap-2">
                                                            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                                                            Transfer Again
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openOperation(item, "return")} className="gap-2">
                                                            <RotateCcw className="h-4 w-4 text-emerald-600" />
                                                            Return
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => openOperation(item, "damaged")}
                                                            className="gap-2 text-orange-700 focus:text-orange-700"
                                                        >
                                                            <FileWarning className="h-4 w-4" />
                                                            Mark as Damaged
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openOperation(item, "lost")}
                                                            className="gap-2 text-red-700 focus:text-red-700"
                                                        >
                                                            <Search className="h-4 w-4" />
                                                            Mark as Lost
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
                                                            Reassign / Assign Again
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => openOperation(item, "damaged")}
                                                            className="gap-2 text-orange-700 focus:text-orange-700"
                                                        >
                                                            <FileWarning className="h-4 w-4" />
                                                            Mark as Damaged
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openOperation(item, "lost")}
                                                            className="gap-2 text-red-700 focus:text-red-700"
                                                        >
                                                            <Search className="h-4 w-4" />
                                                            Mark as Lost
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

                                                {item.asset_status === 7 && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => openDevice(item)} className="gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => void printExistingOWST(item)}
                                                            className="gap-2"
                                                        >
                                                            <Printer className="h-4 w-4 text-teal-600" />
                                                            Print Preview
                                                        </DropdownMenuItem>
                                                    </>
                                                )}

                                                {![0, 1, 3, 4, 7].includes(item.asset_status) && (
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
                <DialogContent
                    className={`max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] overflow-y-auto p-0 ${operation === "owst"
                        ? "sm:max-w-[1320px]"
                        : operation === "assign-direct" || operation === "reassign"
                            ? "sm:max-w-[1240px]"
                            : operation === "assign-tt"
                            ? "sm:max-w-4xl"
                            : "sm:max-w-[1100px]"
                        }`}
                >
                    <DialogHeader className="sticky top-0 z-30 shrink-0 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/90">
                        <DialogTitle>{operationTitle}</DialogTitle>
                        <DialogDescription>
                            {selectedAsset
                                ? operation === "assign-direct" || operation === "reassign"
                                    ? `Review ${selectedAsset.device_serial || `Asset #${selectedAsset.id}`} and select the active employee who will receive this device.`
                                    : operation === "transfer"
                                        ? `Transfer ${selectedAsset.device_serial || `Asset #${selectedAsset.id}`} from the current employee to another active employee.`
                                        : operation === "history"
                                            ? `Immutable assignment, transfer and return trail for ${selectedAsset.device_serial || `Asset #${selectedAsset.id}`}.`
                                            : operation === "detail"
                                                ? `Complete at-a-glance database view for ${selectedAsset.device_serial || `Asset #${selectedAsset.id}`}.`
                                                : `${selectedAsset.device_serial || `Asset #${selectedAsset.id}`} · ${selectedAsset.category || "Device"}`
                                : "Device operation"}
                        </DialogDescription>
                    </DialogHeader>

                    {operationError && (
                        <div className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                            {operationError}
                        </div>
                    )}

                    {operation === "history" && (
                        <div className="space-y-3 overflow-y-auto px-5 py-3">
                            <section className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-3 dark:border-violet-900/50 dark:bg-violet-950/10">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                                        Device
                                    </p>
                                    <p className="mt-1 font-mono text-sm font-semibold">
                                        {selectedAsset?.device_serial || (selectedAsset ? `Asset #${selectedAsset.id}` : "—")}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {[selectedAsset?.category, selectedAsset?.brand, selectedAsset?.model]
                                            .filter(Boolean)
                                            .join(" · ") || "—"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-3 dark:border-blue-900/50 dark:bg-blue-950/10">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                                                Current Holder / State
                                            </p>
                                            <p className="mt-1 truncate text-sm font-semibold">
                                                {selectedAsset?.emp_name || selectedAsset?.emp_id || "IT Stock / No current employee"}
                                            </p>
                                            {selectedAsset?.emp_name && selectedAsset?.emp_id && (
                                                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                                    {selectedAsset.emp_id}
                                                </p>
                                            )}
                                        </div>
                                        {selectedAsset && (
                                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(selectedAsset.asset_status)}`}>
                                                {selectedAsset.status_label || historyStatusLabel(selectedAsset.asset_status)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {selectedAsset && selectedAsset.asset_status !== 0 && (
                                <div className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>
                                        This device is not in the Available state, so new-assignment actions stay locked. Transfer and return must follow the controlled workflow.
                                    </span>
                                </div>
                            )}

                            {historyError && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                                    Historical rows could not be loaded from the backend: {historyError}
                                    <span className="mt-1 block text-[10px] opacity-80">
                                        The current asset snapshot above is still valid. Deploy the included assignment-history backend contract/migration to expose previous holders.
                                    </span>
                                </div>
                            )}

                            <section className="overflow-hidden rounded-xl border border-border">
                                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
                                    <div>
                                        <p className="text-xs font-semibold">Assignment lifecycle</p>
                                        <p className="text-[10px] text-muted-foreground">Append-only audit trail · newest first</p>
                                    </div>
                                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                        {historyEntries.length} record{historyEntries.length === 1 ? "" : "s"}
                                    </span>
                                </div>

                                {historyLoading ? (
                                    <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-muted-foreground">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Loading assignment history...
                                    </div>
                                ) : historyEntries.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                                        No historical assignment rows were returned for this device.
                                    </div>
                                ) : (
                                    <div className="max-h-[52vh] overflow-auto">
                                        <table className="w-full min-w-[900px] table-fixed text-left">
                                            <thead className="sticky top-0 z-10 bg-muted/80 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                                                <tr>
                                                    <th className="w-[135px] px-3 py-2">Event</th>
                                                    <th className="w-[180px] px-3 py-2">Status Change</th>
                                                    <th className="w-[220px] px-3 py-2">Employee / Receiver</th>
                                                    <th className="w-[165px] px-3 py-2">Date & Time</th>
                                                    <th className="px-3 py-2">Remarks</th>
                                                    <th className="w-[135px] px-3 py-2">Changed By</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {historyEntries.map((entry, index) => (
                                                    <tr key={String(entry.id ?? `${historyTimestamp(entry) ?? "row"}-${index}`)} className="align-top text-xs">
                                                        <td className="px-3 py-2.5 font-semibold">
                                                            {historyEventLabel(entry)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                                                            {historyStatusLabel(entry.prev_status)}
                                                            <span className="mx-1">→</span>
                                                            <span className="font-semibold text-foreground">
                                                                {historyStatusLabel(entry.current_status)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <span className="block truncate" title={historyEmployee(entry)}>
                                                                {historyEmployee(entry)}
                                                            </span>
                                                            {entry.from_emp_id && entry.to_emp_id && (
                                                                <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                                                                    {entry.from_emp_id} → {entry.to_emp_id}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                                                            {formatDateTime(historyTimestamp(entry))}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                                                            <span className="block max-w-[360px] whitespace-normal break-words">
                                                                {historyRemarks(entry)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                                                            {entry.changed_by_name || entry.changed_by || "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {operation === "detail" && (
                        <div className="space-y-3 px-5 py-3">
                            <DeviceDatabaseSnapshot
                                asset={selectedAsset}
                                context={assignmentContext}
                            />

                            {selectedAsset?.emp_id && (
                                <section className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-violet-200/80 bg-violet-50/40 p-3 dark:border-violet-900/50 dark:bg-violet-950/10">
                                    <EmployeeAvatar
                                        name={selectedAsset.emp_name}
                                        image={selectedAsset.employee_image}
                                        size="lg"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                                            Current Employee
                                        </p>
                                        <div className="mt-0.5 flex items-center gap-2">
                                            <p className="truncate text-sm font-semibold">
                                                {selectedAsset.emp_name || "Employee"}
                                            </p>
                                            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold">
                                                {selectedAsset.emp_id}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            {[selectedAsset.designation, selectedAsset.department]
                                                .filter(Boolean)
                                                .join(" · ") || "—"}
                                        </p>
                                    </div>
                                </section>
                            )}

                            {assignmentContextLoading && (
                                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    Loading complete device information...
                                </div>
                            )}
                        </div>
                    )}

                    {(operation === "assign-direct" || operation === "reassign") && (
                        <div className="space-y-2 px-4 py-2">
                            <div className="grid gap-2 lg:grid-cols-2">
                                <section className="rounded-xl border border-sky-200/80 bg-sky-50/45 p-2.5 dark:border-sky-900/50 dark:bg-sky-950/10">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-sky-950 dark:text-sky-100">
                                                Device Snapshot
                                            </p>
                                            <p className="truncate text-[9px] text-muted-foreground">
                                                Read-only assignment snapshot
                                            </p>
                                        </div>

                                        <span className="inline-flex shrink-0 items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-700">
                                            {operation === "reassign"
                                                ? selectedAsset?.status_label || "Current"
                                                : "Available"}
                                        </span>
                                    </div>

                                    <div className="grid gap-1.5 sm:grid-cols-3">
                                        <CompactDeviceInfo
                                            label="Serial / Asset"
                                            value={
                                                selectedAsset?.device_serial
                                                    ? `${selectedAsset.device_serial} · #${selectedAsset.id}`
                                                    : selectedAsset
                                                        ? `Asset #${selectedAsset.id}`
                                                        : "—"
                                            }
                                            mono
                                        />
                                        <CompactDeviceInfo
                                            label="Device"
                                            value={[
                                                selectedAsset?.category,
                                                selectedAsset?.brand,
                                                selectedAsset?.model,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        />
                                        <CompactDeviceInfo
                                            label="Entry"
                                            value={
                                                selectedAsset?.mr_number?.trim()
                                                    ? "MR / SCM Stock"
                                                    : "Petty Cash"
                                            }
                                        />

                                        <CompactDeviceInfo
                                            label="MR / PR"
                                            value={[
                                                selectedAsset?.mr_number,
                                                selectedAsset?.pr_number,
                                            ]
                                                .filter(Boolean)
                                                .join(" / ")}
                                            mono
                                        />
                                        <CompactDeviceInfo
                                            label="Vendor"
                                            value={selectedAsset?.vendor_name}
                                        />
                                        <CompactDeviceInfo
                                            label="Purchase / Warranty"
                                            value={`${formatDate(selectedAsset?.purchase_date)} / ${formatDate(
                                                selectedAsset?.warranty_date,
                                            )}`}
                                        />

                                        <CompactDeviceInfo
                                            label="CPU / RAM"
                                            value={[
                                                assignmentContext?.stock.cpu,
                                                assignmentContext?.stock.ram,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        />
                                        <CompactDeviceInfo
                                            label="Storage / Monitor"
                                            value={[
                                                assignmentContext?.stock.storage,
                                                assignmentContext?.stock.monitor,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        />
                                        <CompactDeviceInfo
                                            label="Stock Row"
                                            value={
                                                assignmentContext?.stock.stock_inventory_id
                                                    ? `#${assignmentContext.stock.stock_inventory_id}`
                                                    : "—"
                                            }
                                            mono
                                        />
                                    </div>

                                    {assignmentContextLoading && (
                                        <div className="mt-1.5 flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[9px] text-muted-foreground">
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                            Loading specification...
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-2.5 dark:border-violet-900/50 dark:bg-violet-950/10">
                                    <div className="mb-2">
                                        <p className="text-xs font-semibold text-violet-950 dark:text-violet-100">
                                            Employee Assignment
                                        </p>
                                        <p className="text-[9px] text-muted-foreground">
                                            Search and select the active employee who will receive this device.
                                        </p>
                                    </div>

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

                                    <div className="mt-2 grid grid-cols-2 gap-1.5 xl:grid-cols-4">
                                        <CompactDeviceInfo
                                            label="Assigned By"
                                            value={
                                                [
                                                    authUser?.employee_id,
                                                    authUser?.full_name || authUser?.username,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" · ") || "Signed-in IT user"
                                            }
                                        />
                                        <CompactDeviceInfo
                                            label="Assignment Time"
                                            value="Server time"
                                        />
                                        <CompactDeviceInfo
                                            label="Status"
                                            value={
                                                operation === "reassign"
                                                    ? `${selectedAsset?.status_label || "Current"} → Assigned · previous record → Transferred (3)`
                                                    : "Available → Assigned"
                                            }
                                        />
                                        <CompactDeviceInfo
                                            label="Stock Sync"
                                            value="→ Assigned"
                                        />
                                    </div>

                                    <label className="mt-2 block rounded-lg border border-amber-200 bg-amber-50/80 p-2 dark:border-amber-900/50 dark:bg-amber-950/10">
                                        <span className="mb-1 flex items-center justify-between gap-2 text-[9px] font-semibold uppercase tracking-[0.04em] text-amber-900 dark:text-amber-100">
                                            <span>Assignment Remarks</span>
                                            <span className="font-normal normal-case tracking-normal text-amber-700 dark:text-amber-300">
                                                Optional · {remarks.length}/1000
                                            </span>
                                        </span>
                                        <textarea
                                            value={remarks}
                                            onChange={(event) => setRemarks(event.target.value)}
                                            rows={1}
                                            maxLength={1000}
                                            placeholder="Handover, accessories, location or assignment note"
                                            className="min-h-[46px] w-full resize-none rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-[11px] outline-none focus:ring-2 focus:ring-amber-200 dark:border-amber-900/60 dark:bg-background"
                                        />
                                    </label>
                                </section>
                            </div>

                            <section className="overflow-hidden rounded-xl border border-cyan-200/80 bg-cyan-50/35 dark:border-cyan-900/50 dark:bg-cyan-950/10">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignmentOptional((current) => !current)}
                                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-cyan-50/70 dark:hover:bg-cyan-950/20"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-xs font-semibold text-cyan-950 dark:text-cyan-100">
                                                Optional Device Information
                                            </p>
                                            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                                                {
                                                    Object.values(assignmentTechnicalForm).filter(
                                                        (value) => String(value ?? "").trim(),
                                                    ).length
                                                } populated
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                                            Previous assignment history plus AGP, battery, OS, IP/MAC, adapter, mouse, UPS, bag and device type.
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2 text-[10px] font-semibold text-cyan-800 dark:text-cyan-200">
                                        {showAssignmentOptional ? "Hide" : "Show"}
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform ${showAssignmentOptional ? "rotate-180" : ""
                                                }`}
                                        />
                                    </div>
                                </button>

                                {showAssignmentOptional && (
                                    <div className="border-t border-cyan-200/70 px-3 py-2.5 dark:border-cyan-900/50">
                                        {operation === "reassign" && (
                                            <div className="mb-2 rounded-lg border border-violet-200 bg-violet-50/70 p-2.5 dark:border-violet-900/50 dark:bg-violet-950/20">
                                                <div className="mb-2 flex items-center justify-between gap-2">
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-violet-900 dark:text-violet-100">
                                                            Previous Assignment History
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground">
                                                            Saved holder record remains in history after reassignment.
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-violet-200 bg-background px-2 py-0.5 text-[9px] font-semibold text-violet-700 dark:border-violet-800 dark:text-violet-300">
                                                        {selectedAsset?.previous_assignment?.status_label ||
                                                            (selectedAsset?.emp_id ? "Current holder" : "Previous holder")}
                                                    </span>
                                                </div>

                                                {selectedAsset?.previous_assignment || selectedAsset?.last_emp_id ? (
                                                    <div className="grid gap-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
                                                        <div className="flex min-w-0 items-center gap-2 rounded-md border border-border/70 bg-background p-2">
                                                            <EmployeeAvatar
                                                                name={
                                                                    selectedAsset?.previous_assignment?.employee_name ||
                                                                    selectedAsset?.last_emp_name ||
                                                                    null
                                                                }
                                                                image={
                                                                    selectedAsset?.previous_assignment?.employee_image ||
                                                                    selectedAsset?.last_employee_image
                                                                }
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="truncate text-[10px] font-semibold text-foreground">
                                                                    {selectedAsset?.previous_assignment?.employee_name ||
                                                                        selectedAsset?.last_emp_name ||
                                                                        "Previous employee"}
                                                                </p>
                                                                <p className="truncate font-mono text-[9px] text-primary">
                                                                    ID {selectedAsset?.previous_assignment?.employee_id ||
                                                                        selectedAsset?.last_emp_id ||
                                                                        "—"}
                                                                </p>
                                                                <p className="truncate text-[9px] text-muted-foreground">
                                                                    {[
                                                                        selectedAsset?.previous_assignment?.department ||
                                                                            selectedAsset?.last_department,
                                                                        selectedAsset?.previous_assignment?.designation ||
                                                                            selectedAsset?.last_designation,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(" · ") || "—"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <CompactDeviceInfo
                                                            label="Assigned Date"
                                                            value={formatDateTime(
                                                                selectedAsset?.previous_assignment?.assigned_at,
                                                            )}
                                                        />
                                                        <CompactDeviceInfo
                                                            label="Action Date"
                                                            value={formatDateTime(
                                                                selectedAsset?.previous_assignment?.ended_at,
                                                            )}
                                                        />
                                                        <CompactDeviceInfo
                                                            label="Previous Status"
                                                            value={
                                                                selectedAsset?.previous_assignment?.status_label ||
                                                                "Previous holder"
                                                            }
                                                        />

                                                        <div className="lg:col-span-4 rounded-md border border-border/70 bg-background px-2 py-1.5">
                                                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                                Previous Remarks
                                                            </p>
                                                            <p className="mt-0.5 whitespace-pre-wrap break-words text-[10px] leading-4 text-foreground">
                                                                {selectedAsset?.previous_assignment?.end_remarks ||
                                                                    selectedAsset?.previous_assignment?.assignment_remarks ||
                                                                    selectedAsset?.history_reason ||
                                                                    "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : selectedAsset?.emp_id ? (
                                                    <div className="flex items-center gap-2 rounded-md border border-border/70 bg-background p-2">
                                                        <EmployeeAvatar
                                                            name={selectedAsset.emp_name}
                                                            image={selectedAsset.employee_image}
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-[10px] font-semibold">
                                                                {selectedAsset.emp_name || "Current employee"}
                                                            </p>
                                                            <p className="font-mono text-[9px] text-primary">
                                                                ID {selectedAsset.emp_id}
                                                            </p>
                                                            <p className="text-[9px] text-muted-foreground">
                                                                On save, this assignment will be closed as Transferred (3).
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-muted-foreground">
                                                        No previous employee assignment is available for this asset.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="grid gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                                            {OPTIONAL_ASSIGNMENT_FIELDS.map((field) => (
                                                <label key={field.key} className="block min-w-0">
                                                    <span className="mb-0.5 block truncate text-[9px] font-semibold text-foreground">
                                                        {field.label}
                                                        {(field.key === "lan_mac_address" ||
                                                            field.key === "wlan_mac_address") && (
                                                                <span className="ml-1 font-normal text-primary">
                                                                    · Unique
                                                                </span>
                                                            )}
                                                    </span>

                                                    <input
                                                        type="text"
                                                        value={assignmentTechnicalForm[field.key]}
                                                        onChange={(event) =>
                                                            setAssignmentTechnicalForm((current) => ({
                                                                ...current,
                                                                [field.key]: event.target.value,
                                                            }))
                                                        }
                                                        placeholder={field.placeholder}
                                                        maxLength={255}
                                                        list={
                                                            field.key === "operating_system"
                                                                ? "assignment-os-options"
                                                                : undefined
                                                        }
                                                        onBlur={() => {
                                                            if (
                                                                field.key === "lan_mac_address" ||
                                                                field.key === "wlan_mac_address"
                                                            ) {
                                                                setAssignmentTechnicalForm((current) => ({
                                                                    ...current,
                                                                    [field.key]: current[field.key]
                                                                        ? formatMacAddress(current[field.key])
                                                                        : "",
                                                                }));
                                                            }
                                                        }}
                                                        autoComplete="off"
                                                        className="h-7 w-full rounded-md border border-input bg-background px-2 text-[10px] outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </label>
                                            ))}

                                            <label className="block min-w-0">
                                                <span className="mb-0.5 block text-[9px] font-semibold text-foreground">
                                                    Device Type
                                                </span>
                                                <select
                                                    value={assignmentTechnicalForm.assignment_device_type}
                                                    onChange={(event) =>
                                                        setAssignmentTechnicalForm((current) => ({
                                                            ...current,
                                                            assignment_device_type: event.target.value,
                                                        }))
                                                    }
                                                    className="h-7 w-full rounded-md border border-input bg-background px-2 text-[10px] outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                                                >
                                                    <option value="">-- Select --</option>
                                                    <option value="1">Permanent</option>
                                                    <option value="2">Temporary</option>
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <datalist id="assignment-os-options">
                                    <option value="Not Applicable" />
                                    <option value="Original OS" />
                                    <option value="Crack OS" />
                                    <option value="Windows 10" />
                                    <option value="Windows 11" />
                                </datalist>
                            </section>

                            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] leading-4 text-blue-800">
                                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                                <p>
                                    Server validation, employee check, stock sync and assignment history are committed together on save.
                                </p>
                            </div>
                        </div>
                    )}

                    {operation === "assign-tt" && (
                        <div className="space-y-3 px-5 py-3">
                            {!selectedAsset?.stock_inventory_id && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    This asset has no linked SCM stock row. Direct assignment remains available, but TT allocation requires an SCM stock link.
                                </div>
                            )}

                            <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/10 dark:text-blue-100">
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

                            <label className="block rounded-xl border border-amber-200 bg-amber-50/65 p-3 dark:border-amber-900/50 dark:bg-amber-950/10">
                                <span className="mb-1 flex items-center justify-between text-[10px] font-semibold text-amber-900 dark:text-amber-100">
                                    <span>Assignment / Delivery Remarks</span>
                                    <span className="font-normal text-amber-700 dark:text-amber-300">{remarks.length}/1000</span>
                                </span>
                                <textarea
                                    value={remarks}
                                    onChange={(event) => setRemarks(event.target.value)}
                                    rows={2}
                                    maxLength={1000}
                                    placeholder="Optional handover, delivery or TT note"
                                    className="w-full resize-none rounded-md border border-amber-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-200 dark:border-amber-900/60 dark:bg-background"
                                />
                            </label>
                        </div>
                    )}
                    {operation === "update" && (
                        <div className="space-y-3 px-5 py-3">
                            <section className="rounded-xl border border-amber-200/80 bg-amber-50/45 p-3 dark:border-amber-900/50 dark:bg-amber-950/10">
                                <div className="mb-2 flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold text-amber-950 dark:text-amber-100">
                                            Update Device Information
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Device master, stock specification and technical fields can be updated here.
                                        </p>
                                    </div>
                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(selectedAsset?.asset_status ?? 0)}`}>
                                        {selectedAsset?.status_label || "Current status"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-6 gap-1.5">
                                    <CompactDeviceInfo label="Asset ID" value={selectedAsset ? `#${selectedAsset.id}` : "—"} mono />
                                    <CompactDeviceInfo label="Employee ID" value={selectedAsset?.emp_id} mono />
                                    <CompactDeviceInfo label="Employee Name" value={selectedAsset?.emp_name} />
                                    <CompactDeviceInfo label="MR Number" value={selectedAsset?.mr_number} mono />
                                    <CompactDeviceInfo label="PR Number" value={selectedAsset?.pr_number} mono />
                                    <CompactDeviceInfo
                                        label="Stock Row"
                                        value={assignmentContext?.stock.stock_inventory_id ? `#${assignmentContext.stock.stock_inventory_id}` : "—"}
                                        mono
                                    />
                                </div>
                            </section>

                            <section className="rounded-xl border border-cyan-200/70 bg-cyan-50/25 p-3 dark:border-cyan-900/40 dark:bg-cyan-950/10">
                                <div className="grid grid-cols-5 gap-x-2 gap-y-1.5">
                                    <label className="min-w-0">
                                        <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Device Serial *
                                        </span>
                                        <input
                                            value={updateForm.device_serial}
                                            onChange={(event) =>
                                                setUpdateForm((current) => ({
                                                    ...current,
                                                    device_serial: event.target.value,
                                                }))
                                            }
                                            className="h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </label>

                                    {[
                                        ["category", "Category *"],
                                        ["brand", "Brand"],
                                        ["model", "Model"],
                                        ["device_type", "Asset Type"],
                                        ["vendor_name", "Vendor"],
                                        ["cpu", "CPU / Processor"],
                                        ["ram", "RAM"],
                                        ["storage", "SSD / HDD"],
                                        ["monitor", "Monitor"],
                                    ].map(([key, label]) => (
                                        <label key={key} className="min-w-0">
                                            <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                {label}
                                            </span>
                                            <input
                                                value={updateForm[key as keyof typeof updateForm]}
                                                onChange={(event) =>
                                                    setUpdateForm((current) => ({
                                                        ...current,
                                                        [key]: event.target.value,
                                                    }))
                                                }
                                                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </label>
                                    ))}

                                    <label className="min-w-0">
                                        <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Purchase Date
                                        </span>
                                        <input
                                            type="date"
                                            value={updateForm.purchase_date}
                                            onChange={(event) =>
                                                setUpdateForm((current) => ({
                                                    ...current,
                                                    purchase_date: event.target.value,
                                                }))
                                            }
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[11px]"
                                        />
                                    </label>

                                    <label className="min-w-0">
                                        <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Warranty End
                                        </span>
                                        <input
                                            type="date"
                                            value={updateForm.warranty_date}
                                            onChange={(event) =>
                                                setUpdateForm((current) => ({
                                                    ...current,
                                                    warranty_date: event.target.value,
                                                }))
                                            }
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[11px]"
                                        />
                                    </label>

                                    {OPTIONAL_ASSIGNMENT_FIELDS.map((field) => (
                                        <label key={field.key} className="min-w-0">
                                            <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                {field.label}
                                                {(field.key === "lan_mac_address" ||
                                                    field.key === "wlan_mac_address") && (
                                                        <span className="ml-1 normal-case tracking-normal text-primary">
                                                            Unique
                                                        </span>
                                                    )}
                                            </span>
                                            <input
                                                value={assignmentTechnicalForm[field.key]}
                                                onChange={(event) =>
                                                    setAssignmentTechnicalForm((current) => ({
                                                        ...current,
                                                        [field.key]: event.target.value,
                                                    }))
                                                }
                                                onBlur={() => {
                                                    if (
                                                        field.key === "lan_mac_address" ||
                                                        field.key === "wlan_mac_address"
                                                    ) {
                                                        setAssignmentTechnicalForm((current) => ({
                                                            ...current,
                                                            [field.key]: current[field.key]
                                                                ? formatMacAddress(current[field.key])
                                                                : "",
                                                        }));
                                                    }
                                                }}
                                                list={
                                                    field.key === "operating_system"
                                                        ? "update-os-options"
                                                        : undefined
                                                }
                                                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </label>
                                    ))}

                                    <label className="min-w-0">
                                        <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Device Type
                                        </span>
                                        <select
                                            value={assignmentTechnicalForm.assignment_device_type}
                                            onChange={(event) =>
                                                setAssignmentTechnicalForm((current) => ({
                                                    ...current,
                                                    assignment_device_type: event.target.value,
                                                }))
                                            }
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[11px]"
                                        >
                                            <option value="">-- Select --</option>
                                            <option value="1">Permanent (1)</option>
                                            <option value="2">Temporary (2)</option>
                                        </select>
                                    </label>
                                </div>

                                <datalist id="update-os-options">
                                    <option value="Not Applicable" />
                                    <option value="Original OS" />
                                    <option value="Crack OS" />
                                    <option value="Windows 10" />
                                    <option value="Windows 11" />
                                </datalist>

                                <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] leading-4 text-blue-800">
                                    Employee assignment, status, MR/PR, stock linkage and inventory type are workflow-controlled and remain read-only here.
                                </div>
                            </section>
                        </div>
                    )}

                    {operation === "transfer" && (
                        <div className="space-y-3 px-5 py-3">
                            <DeviceDatabaseSnapshot
                                asset={selectedAsset}
                                context={assignmentContext}
                            />

                            <div className="grid gap-3 lg:grid-cols-2">
                                <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/20">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Current Assignment</p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <EmployeeAvatar
                                            name={selectedAsset?.emp_name || null}
                                            image={selectedAsset?.employee_image}
                                            size="lg"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {selectedAsset?.emp_name || "Current employee"}
                                            </p>
                                            <p className="font-mono text-[11px] text-primary">
                                                {selectedAsset?.emp_id || "—"}
                                            </p>
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                {[selectedAsset?.designation, selectedAsset?.department]
                                                    .filter(Boolean)
                                                    .join(" · ") || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/10">
                                    <p className="mb-2 text-xs font-semibold text-blue-950 dark:text-blue-100">
                                        Transfer To <span className="text-red-500">*</span>
                                    </p>
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
                                </section>
                            </div>

                            <label className="block rounded-xl border border-amber-200 bg-amber-50/65 p-3 dark:border-amber-900/50 dark:bg-amber-950/10">
                                <span className="mb-1 flex items-center justify-between text-[10px] font-semibold text-amber-900 dark:text-amber-100">
                                    <span>Transfer Remarks</span>
                                    <span className="font-normal text-amber-700 dark:text-amber-300">{remarks.length}/1000</span>
                                </span>
                                <textarea
                                    value={remarks}
                                    onChange={(event) => setRemarks(event.target.value)}
                                    rows={2}
                                    maxLength={1000}
                                    placeholder="Handover, transfer reason, accessories or location note"
                                    className="w-full resize-none rounded-md border border-amber-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-200 dark:border-amber-900/60 dark:bg-background"
                                />
                            </label>
                        </div>
                    )}

                    {operation === "return" && (
                        <div className="space-y-3 px-5 py-3">
                            <DeviceDatabaseSnapshot
                                asset={selectedAsset}
                                context={assignmentContext}
                            />

                            <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                                    <p className="text-xs font-semibold">Return workflow</p>
                                    <p className="mt-1 text-[11px] leading-4">
                                        The current employee assignment will be cleared and the asset will move to Returned.
                                        It can then be reassigned or transferred according to the next workflow.
                                    </p>
                                </div>

                                <label className="block rounded-xl border border-amber-200 bg-amber-50/65 p-3 dark:border-amber-900/50 dark:bg-amber-950/10">
                                    <span className="mb-1 flex items-center justify-between text-[10px] font-semibold text-amber-900 dark:text-amber-100">
                                        <span>Return Remarks</span>
                                        <span className="font-normal text-amber-700 dark:text-amber-300">{remarks.length}/1000</span>
                                    </span>
                                    <textarea
                                        value={remarks}
                                        onChange={(event) => setRemarks(event.target.value)}
                                        rows={3}
                                        maxLength={1000}
                                        placeholder="Condition, accessories returned, location or return note"
                                        className="w-full resize-none rounded-md border border-amber-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-200 dark:border-amber-900/60 dark:bg-background"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {operation === "owst" && (
                        <div className="space-y-2.5 px-4 py-2.5">
                            <section className="rounded-xl border border-teal-200 bg-teal-50/45 p-2.5 dark:border-teal-900/50 dark:bg-teal-950/10">
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-semibold text-teal-950 dark:text-teal-100">
                                            OWST At-a-Glance
                                        </p>
                                        <p className="text-[9px] text-muted-foreground">
                                            User OWST = 1 · Vendor OWST = 2 · final device status = OWST
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="rounded-md border border-teal-200 bg-background px-2 py-1 text-[9px] font-semibold text-teal-800">
                                            Asset #{selectedAsset?.id ?? "—"}
                                        </span>
                                        <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${statusClass(selectedAsset?.asset_status ?? 1)}`}>
                                            {selectedAsset?.status_label || "Assigned"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-2 md:grid-cols-4">
                                    <label className="block">
                                        <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            OWST Type <span className="text-red-500">*</span>
                                        </span>
                                        <select
                                            value={owstType}
                                            onChange={(event) => {
                                                setOWSTType(
                                                    event.target.value as "user" | "vendor",
                                                );
                                                setOWSTVendorID("");
                                                setOWSTAmount("");
                                                setOperationError("");
                                            }}
                                            className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-[11px] font-semibold"
                                        >
                                            <option value="user">User OWST</option>
                                            <option value="vendor">Vendor OWST</option>
                                        </select>
                                    </label>

                                    <CompactDeviceInfo
                                        label="Current Holder"
                                        value={
                                            selectedAsset?.emp_id
                                                ? `${selectedAsset.emp_id} · ${selectedAsset.emp_name || "Employee"}`
                                                : "—"
                                        }
                                    />

                                    <CompactDeviceInfo
                                        label="Device"
                                        value={`${selectedAsset?.category || "Device"} · ${selectedAsset?.device_serial || "—"}`}
                                    />

                                    <CompactDeviceInfo
                                        label="Raised By / Date"
                                        value={`${
                                            authUser?.full_name ||
                                            authUser?.username ||
                                            authUser?.employee_id ||
                                            "Current user"
                                        } · ${formatDateTime(new Date().toISOString())}`}
                                    />
                                </div>
                            </section>

                            <div className="grid gap-2.5 xl:grid-cols-2">
                                <section className={`rounded-xl border p-2.5 ${
                                    owstType === "user"
                                        ? "border-blue-200 bg-blue-50/45 dark:border-blue-900/50 dark:bg-blue-950/10"
                                        : "border-violet-200 bg-violet-50/45 dark:border-violet-900/50 dark:bg-violet-950/10"
                                }`}>
                                    <div className="mb-2 flex items-center gap-2">
                                        {owstType === "user" ? (
                                            <UserCheck className="h-4 w-4 text-blue-700" />
                                        ) : (
                                            <Truck className="h-4 w-4 text-violet-700" />
                                        )}
                                        <div>
                                            <p className="text-[11px] font-semibold">
                                                {owstType === "user"
                                                    ? "User OWST · Receiver"
                                                    : "Vendor OWST · Receiver"}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground">
                                                {owstType === "user"
                                                    ? "The currently assigned employee receives ownership."
                                                    : "Choose the receiving vendor from the active vendor master."}
                                            </p>
                                        </div>
                                    </div>

                                    {owstType === "user" ? (
                                        <div className="grid gap-2 sm:grid-cols-[1.25fr_0.75fr]">
                                            <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-blue-200 bg-background p-2.5">
                                                <EmployeeAvatar
                                                    name={owstEmployeeProfile?.employee_name || selectedAsset?.emp_name || null}
                                                    image={owstEmployeeProfile?.picture || selectedAsset?.employee_image}
                                                    size="lg"
                                                />

                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-semibold text-foreground">
                                                        {owstEmployeeProfile?.employee_name || selectedAsset?.emp_name || "Employee"}
                                                    </p>
                                                    <p className="mt-0.5 font-mono text-[9px] font-semibold text-blue-700">
                                                        {owstEmployeeProfile?.employee_id || selectedAsset?.emp_id || "—"}
                                                    </p>
                                                    <p className="mt-1 text-[9px] leading-3 text-muted-foreground">
                                                        {[
                                                            owstEmployeeProfile?.designation || selectedAsset?.designation,
                                                            owstEmployeeProfile?.department || selectedAsset?.department,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" · ") || "—"}
                                                    </p>
                                                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                                                        {owstEmployeeLoading
                                                            ? "Loading employee contact…"
                                                            : owstEmployeeProfile?.official_cell ||
                                                              owstEmployeeProfile?.personal_cell ||
                                                              "Mobile —"}
                                                    </p>
                                                </div>
                                            </div>

                                            <label className="rounded-lg border border-amber-200 bg-amber-50/75 p-2.5">
                                                <span className="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide text-amber-800">
                                                    <CircleDollarSign className="h-3 w-3" />
                                                    Deducted Amount <span className="text-red-500">*</span>
                                                </span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    value={owstAmount}
                                                    onChange={(event) => setOWSTAmount(event.target.value)}
                                                    className="h-8 w-full rounded-md border border-amber-200 bg-white px-2.5 text-xs font-semibold"
                                                    placeholder="Amount"
                                                />
                                                <p className="mt-1 text-[8px] text-amber-700">
                                                    Device age: {formatCompactDuration(selectedAsset?.assigned_date)}
                                                </p>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <label className="block">
                                                <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Vendor <span className="text-red-500">*</span>
                                                </span>
                                                <select
                                                    value={owstVendorID}
                                                    onChange={(event) => setOWSTVendorID(event.target.value)}
                                                    disabled={owstVendorsLoading}
                                                    className="h-8 w-full rounded-md border border-input bg-background px-2 text-[10px] font-medium"
                                                >
                                                    <option value="">
                                                        {owstVendorsLoading ? "Loading vendors…" : "Select active vendor"}
                                                    </option>
                                                    {owstVendors.map((vendor) => (
                                                        <option key={vendor.id} value={String(vendor.id)}>
                                                            {vendor.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label className="rounded-lg border border-amber-200 bg-amber-50/75 p-2">
                                                <span className="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide text-amber-800">
                                                    <CircleDollarSign className="h-3 w-3" />
                                                    Deducted Amount <span className="text-red-500">*</span>
                                                </span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    value={owstAmount}
                                                    onChange={(event) => setOWSTAmount(event.target.value)}
                                                    className="h-8 w-full rounded-md border border-amber-200 bg-white px-2 text-xs font-semibold"
                                                    placeholder="Amount"
                                                />
                                            </label>

                                            <CompactDeviceInfo
                                                label="Vendor Address"
                                                value={selectedOWSTVendor?.address || "Select a vendor"}
                                            />

                                            <CompactDeviceInfo
                                                label="Vendor Mobile / Email"
                                                value={
                                                    [selectedOWSTVendor?.mobile, selectedOWSTVendor?.email]
                                                        .filter(Boolean)
                                                        .join(" · ") || "—"
                                                }
                                            />

                                            <label className="sm:col-span-2 block">
                                                <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Vendor Notes / Others
                                                </span>
                                                <input
                                                    value={owstVendorOthers}
                                                    onChange={(event) => setOWSTVendorOthers(event.target.value)}
                                                    maxLength={1000}
                                                    className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-[10px]"
                                                    placeholder="Auction / disposal / vendor reference"
                                                />
                                            </label>
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-xl border border-sky-200 bg-sky-50/35 p-2.5 dark:border-sky-900/50 dark:bg-sky-950/10">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Laptop2 className="h-4 w-4 text-sky-700" />
                                        <div>
                                            <p className="text-[11px] font-semibold">Device / Material</p>
                                            <p className="text-[9px] text-muted-foreground">
                                                Database values used in the OWST record and gate pass.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                                        <CompactDeviceInfo label="Item" value={selectedAsset?.category || "—"} />
                                        <CompactDeviceInfo label="Serial" value={selectedAsset?.device_serial || "—"} mono />
                                        <CompactDeviceInfo label="Brand" value={selectedAsset?.brand || "—"} />
                                        <CompactDeviceInfo label="Model" value={selectedAsset?.model || "—"} />
                                        <CompactDeviceInfo label="Device Type" value={selectedAsset?.device_type || "—"} />
                                        <CompactDeviceInfo label="Device Age" value={formatCompactDuration(selectedAsset?.assigned_date)} />
                                    </div>
                                </section>
                            </div>

                            <section className="rounded-xl border border-cyan-200 bg-cyan-50/35 p-2.5 dark:border-cyan-900/50 dark:bg-cyan-950/10">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-cyan-700" />
                                        <div>
                                            <p className="text-[11px] font-semibold">Gate Pass & Handover</p>
                                            <p className="text-[9px] text-muted-foreground">
                                                Complete the handover information before creating OWST.
                                            </p>
                                        </div>
                                    </div>

                                    <span className="hidden text-[8px] font-medium text-muted-foreground md:inline">
                                        One-page A4 landscape print preview
                                    </span>
                                </div>

                                <div className="grid gap-2 md:grid-cols-6">
                                    <label className="md:col-span-3 block">
                                        <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Receiver Address <span className="text-red-500">*</span>
                                        </span>
                                        <input
                                            value={owstReceiverAddress}
                                            onChange={(event) => setOWSTReceiverAddress(event.target.value)}
                                            className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-[10px]"
                                            placeholder="Receiver / destination address"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Gate Pass Date <span className="text-red-500">*</span>
                                        </span>
                                        <input
                                            type="date"
                                            value={owstGatePassDate}
                                            onChange={(event) => setOWSTGatePassDate(event.target.value)}
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[10px]"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Unit
                                        </span>
                                        <input
                                            value={owstUnit}
                                            onChange={(event) => setOWSTUnit(event.target.value)}
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[10px]"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-1 block text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Qty <span className="text-red-500">*</span>
                                        </span>
                                        <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={owstQuantity}
                                            onChange={(event) => setOWSTQuantity(event.target.value)}
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[10px]"
                                        />
                                    </label>

                                    <label className="md:col-span-2 block">
                                        <span className="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            <Paperclip className="h-3 w-3" />
                                            Attachment
                                        </span>
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                            onChange={(event) => setOWSTAttachment(event.target.files?.[0] ?? null)}
                                            className="block h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-[9px] file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-[8px] file:font-semibold"
                                        />
                                    </label>

                                    <label className="md:col-span-4 block">
                                        <span className="mb-1 flex items-center justify-between text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            <span>Remarks <span className="text-red-500">*</span></span>
                                            <span>{remarks.length}/1000</span>
                                        </span>
                                        <input
                                            value={remarks}
                                            onChange={(event) => setRemarks(event.target.value)}
                                            maxLength={1000}
                                            className="h-8 w-full rounded-md border border-amber-200 bg-amber-50/50 px-2.5 text-[10px]"
                                            placeholder="Ownership transfer / receiver / gate-pass remarks"
                                        />
                                    </label>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-border bg-background px-3 py-1.5">
                                    <label className="inline-flex items-center gap-1.5 text-[9px] font-medium">
                                        <input
                                            type="checkbox"
                                            checked={owstCompanyMaterial}
                                            onChange={(event) => setOWSTCompanyMaterial(event.target.checked)}
                                            className="h-3.5 w-3.5 rounded border-input"
                                        />
                                        Company Material
                                    </label>

                                    <label className="inline-flex items-center gap-1.5 text-[9px] font-medium">
                                        <input
                                            type="checkbox"
                                            checked={owstNonRefundable}
                                            onChange={(event) => setOWSTNonRefundable(event.target.checked)}
                                            className="h-3.5 w-3.5 rounded border-input"
                                        />
                                        Non-Refundable
                                    </label>

                                    <span className="text-[8px] text-muted-foreground">
                                        Purpose: Old Device Ownership Transfer according to IT Policy
                                    </span>
                                </div>
                            </section>
                        </div>
                    )}

                    {(operation === "damaged" || operation === "lost") && (
                        <div className="space-y-3 px-5 py-3">
                            <DeviceDatabaseSnapshot
                                asset={selectedAsset}
                                context={assignmentContext}
                            />

                            <section
                                className={`rounded-xl border p-4 ${
                                    operation === "damaged"
                                        ? "border-orange-200 bg-orange-50/60 dark:border-orange-900/50 dark:bg-orange-950/10"
                                        : "border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/10"
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                            operation === "damaged"
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {operation === "damaged" ? (
                                            <FileWarning className="h-5 w-5" />
                                        ) : (
                                            <Search className="h-5 w-5" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-foreground">
                                            {operation === "damaged"
                                                ? "Confirm Damaged Status"
                                                : "Confirm Lost Status"}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            {operation === "damaged"
                                                ? "The device will move to Damaged (2). Current holder information is retained for accountability and the active assignment is closed in history."
                                                : "The device will move to Lost (5). Current holder information is retained for accountability and the active assignment is closed in history."}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                    <CompactDeviceInfo
                                        label="Current Status"
                                        value={
                                            selectedAsset?.status_label ||
                                            historyStatusLabel(
                                                selectedAsset?.asset_status,
                                            )
                                        }
                                    />
                                    <CompactDeviceInfo
                                        label="Responsible Employee"
                                        value={
                                            selectedAsset?.emp_id
                                                ? `${selectedAsset.emp_id} · ${selectedAsset.emp_name || "Employee"}`
                                                : "IT Stock / No employee"
                                        }
                                    />
                                    <CompactDeviceInfo
                                        label="New Status"
                                        value={
                                            operation === "damaged"
                                                ? "Damaged (2)"
                                                : "Lost (5)"
                                        }
                                    />
                                </div>

                                <label className="mt-3 block">
                                    <span
                                        className={`mb-1 flex items-center justify-between text-[10px] font-semibold ${
                                            operation === "damaged"
                                                ? "text-orange-900 dark:text-orange-100"
                                                : "text-red-900 dark:text-red-100"
                                        }`}
                                    >
                                        <span>
                                            {operation === "damaged"
                                                ? "Damage Remarks"
                                                : "Lost Device Remarks"}{" "}
                                            <span className="text-red-500">*</span>
                                        </span>
                                        <span className="font-normal">
                                            {remarks.length}/1000
                                        </span>
                                    </span>
                                    <textarea
                                        value={remarks}
                                        onChange={(event) =>
                                            setRemarks(event.target.value)
                                        }
                                        rows={3}
                                        maxLength={1000}
                                        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder={
                                            operation === "damaged"
                                                ? "Describe damage, condition, location and required action..."
                                                : "Describe when/where the device was last seen, responsible user and follow-up action..."
                                        }
                                    />
                                </label>
                            </section>
                        </div>
                    )}

                    {operation === "warranty" && (
                        <div className="space-y-3 px-5 py-3">
                            <DeviceDatabaseSnapshot
                                asset={selectedAsset}
                                context={assignmentContext}
                            />

                            <div className="grid gap-3 lg:grid-cols-[0.72fr_1.28fr]">
                                <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 text-violet-900 dark:border-violet-900/50 dark:bg-violet-950/10 dark:text-violet-100">
                                    <p className="text-xs font-semibold">Warranty / Vendor Information</p>
                                    <div className="mt-2 space-y-1 text-[11px]">
                                        <p>
                                            <span className="font-medium">Vendor:</span>{" "}
                                            {selectedAsset?.vendor_name || "—"}
                                        </p>
                                        <p>
                                            <span className="font-medium">Warranty End:</span>{" "}
                                            {formatDate(selectedAsset?.warranty_date)}
                                        </p>
                                        <p>
                                            <span className="font-medium">Serial:</span>{" "}
                                            <span className="font-mono">
                                                {selectedAsset?.device_serial || "—"}
                                            </span>
                                        </p>
                                        <p>
                                            <span className="font-medium">PR:</span>{" "}
                                            <span className="font-mono">
                                                {selectedAsset?.pr_number || "—"}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    <label className="block rounded-xl border border-rose-200 bg-rose-50/55 p-3 dark:border-rose-900/50 dark:bg-rose-950/10">
                                        <span className="mb-1 block text-[10px] font-semibold text-rose-950 dark:text-rose-100">
                                            Problem / Claim Reason <span className="text-red-500">*</span>
                                        </span>
                                        <textarea
                                            value={warrantyProblems}
                                            onChange={(event) => setWarrantyProblems(event.target.value)}
                                            rows={4}
                                            maxLength={2000}
                                            className="w-full resize-none rounded-md border border-rose-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-rose-200 dark:border-rose-900/60 dark:bg-background"
                                            placeholder="Describe issue, symptom and required warranty action..."
                                        />
                                    </label>

                                    <label className="block rounded-xl border border-amber-200 bg-amber-50/65 p-3 dark:border-amber-900/50 dark:bg-amber-950/10">
                                        <span className="mb-1 flex items-center justify-between text-[10px] font-semibold text-amber-900 dark:text-amber-100">
                                            <span>IT Claim Remarks</span>
                                            <span className="font-normal text-amber-700 dark:text-amber-300">{remarks.length}/1000</span>
                                        </span>
                                        <textarea
                                            value={remarks}
                                            onChange={(event) => setRemarks(event.target.value)}
                                            rows={4}
                                            maxLength={1000}
                                            className="w-full resize-none rounded-md border border-amber-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-200 dark:border-amber-900/60 dark:bg-background"
                                            placeholder="IT feedback, vendor instruction or claim note"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {operation === "delete" && (
                        <div className="space-y-3 px-5 py-3">
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

                    <DialogFooter className="sticky bottom-0 z-30 shrink-0 border-t border-border bg-background/95 px-4 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/90">
                        {operation === "owst" && (
                            <button
                                type="button"
                                disabled={operationBusy}
                                onClick={() => printOWST()}
                                className="mr-auto inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                Print Preview
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={operationBusy}
                            onClick={closeOperation}
                            className="h-8 rounded-md border border-border bg-background px-4 text-xs font-medium hover:bg-muted disabled:opacity-50"
                        >
                            {operation === "detail" || operation === "history" ? "Close" : "Cancel"}
                        </button>

                        {operation !== "detail" && operation !== "history" && (
                            <button
                                type="button"
                                disabled={
                                    operationBusy ||
                                    ((operation === "assign-direct" ||
                                        operation === "reassign" ||
                                        operation === "transfer") &&
                                        !selectedEmployee)
                                }
                                onClick={() => void submitOperation()}
                                className={`inline-flex h-8 items-center justify-center gap-2 rounded-md px-4 text-xs font-semibold text-white disabled:opacity-50 ${operation === "delete"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-primary hover:opacity-90"
                                    }`}
                            >
                                {operationBusy && (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                )}
                                {operation === "delete"
                                    ? "Delete Device"
                                    : operation === "assign-direct"
                                        ? "Assign Device"
                                        : operation === "reassign"
                                            ? "Reassign Device"
                                            : operation === "transfer"
                                                ? "Transfer Device"
                                                : operation === "return"
                                                    ? "Confirm Return"
                                                    : operation === "update"
                                                        ? "Save Changes"
                                                        : operation === "owst"
                                                            ? "Create OWST"
                                                            : operation === "warranty"
                                                                ? "Raise Claim"
                                                                : operation === "damaged"
                                                                    ? "Confirm Damaged"
                                                                    : operation === "lost"
                                                                        ? "Confirm Lost"
                                                                        : "Submit"}
                            </button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(successDialog)}
                onOpenChange={(open) => {
                    if (!open) setSuccessDialog(null);
                }}
            >
                <DialogContent className="max-w-md overflow-hidden p-0">
                    <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-950/40">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-base font-semibold text-emerald-950 dark:text-emerald-100">
                                    {successDialog?.title || "Operation Completed"}
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">
                                    The asset workflow was saved successfully.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 px-6 py-5">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-border bg-muted/25 px-3 py-2">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Device
                                </p>
                                <p className="mt-1 truncate font-mono text-xs font-semibold text-foreground">
                                    {successDialog?.serial || "—"}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/25 px-3 py-2">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Resulting Status
                                </p>
                                <p className="mt-1 text-xs font-semibold text-foreground">
                                    {successDialog?.statusLabel || "Updated"}
                                </p>
                            </div>
                        </div>

                        <p className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-3 text-sm leading-5 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/10 dark:text-emerald-100">
                            {successDialog?.message}
                        </p>

                        <p className="text-[11px] text-muted-foreground">
                            The device list has returned to <strong>All Status</strong>, page 1, and status totals are refreshed.
                        </p>
                    </div>

                    <DialogFooter className="border-t border-border bg-muted/15 px-6 py-4">
                        {successDialog?.statusLabel?.startsWith("OWST") &&
                            owstPrintSnapshot && (
                                <button
                                    type="button"
                                    onClick={() => printOWST(owstPrintSnapshot)}
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-100"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print OWST
                                </button>
                            )}

                        <button
                            type="button"
                            onClick={() => setSuccessDialog(null)}
                            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                        >
                            Done
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {owstPrintSnapshot && (
                <div id="owst-print-sheet" className="hidden">
                    <div className="owst-print-document">
                        <header className="owst-print-letterhead">
                            <div className="owst-print-company">
                                Fiber@Home Ltd
                            </div>
                            <div className="owst-print-address">
                                House # 8/B, Road # 13, Gulshan -1, Dhaka -1212
                            </div>
                            <div className="owst-print-title">
                                DEVICE OWNERSHIP TRANSFER / GATE PASS
                            </div>
                            <div className="owst-print-gate-date">
                                <strong>Gate Pass Date :</strong>{" "}
                                {owstPrintSnapshot.gatePassDate}
                            </div>
                        </header>

                        <div className="owst-print-reference-row">
                            <div>
                                <span>Reference No.</span>
                                <strong>{owstPrintSnapshot.referenceNo}</strong>
                            </div>
                            <div>
                                <span>OWST Type</span>
                                <strong>{owstPrintSnapshot.ownershipLabel}</strong>
                            </div>
                            <div>
                                <span>Date Submitted</span>
                                <strong>{owstPrintSnapshot.submissionDate}</strong>
                            </div>
                        </div>

                        <div className="owst-print-section-title">
                            User / Current Holder Information
                        </div>
                        <table className="owst-print-table owst-print-pair-table">
                            <tbody>
                                <tr>
                                    <th>User Name</th>
                                    <td>{owstPrintSnapshot.employeeName}</td>
                                    <th>Employee ID</th>
                                    <td>{owstPrintSnapshot.employeeID}</td>
                                </tr>
                                <tr>
                                    <th>Designation</th>
                                    <td>{owstPrintSnapshot.designation}</td>
                                    <th>Department</th>
                                    <td>{owstPrintSnapshot.department}</td>
                                </tr>
                                <tr>
                                    <th>Mobile</th>
                                    <td>{owstPrintSnapshot.mobile}</td>
                                    <th>Processed By</th>
                                    <td>{owstPrintSnapshot.raisedBy}</td>
                                </tr>
                            </tbody>
                        </table>

                        {owstPrintSnapshot.ownershipType === "vendor" && (
                            <>
                                <div className="owst-print-section-title">
                                    Vendor Recipient Information
                                </div>
                                <table className="owst-print-table owst-print-pair-table">
                                    <tbody>
                                        <tr>
                                            <th>Vendor Name</th>
                                            <td>{owstPrintSnapshot.vendorName}</td>
                                            <th>Vendor Mobile</th>
                                            <td>{owstPrintSnapshot.vendorMobile}</td>
                                        </tr>
                                        <tr>
                                            <th>Vendor Address</th>
                                            <td colSpan={3}>
                                                {owstPrintSnapshot.vendorAddress}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </>
                        )}

                        <div className="owst-print-section-title">
                            Device Information
                        </div>
                        <table className="owst-print-table owst-print-pair-table">
                            <tbody>
                                <tr>
                                    <th>Device Type</th>
                                    <td>{owstPrintSnapshot.deviceCategory}</td>
                                    <th>Serial No.</th>
                                    <td>{owstPrintSnapshot.deviceSerial}</td>
                                </tr>
                                <tr>
                                    <th>Brand</th>
                                    <td>{owstPrintSnapshot.brand}</td>
                                    <th>Model</th>
                                    <td>{owstPrintSnapshot.model}</td>
                                </tr>
                                <tr>
                                    <th>Assignment Type</th>
                                    <td>{owstPrintSnapshot.deviceType}</td>
                                    <th>Device Age</th>
                                    <td>{owstPrintSnapshot.deviceAge}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="owst-print-section-title">
                            Ownership Transfer Information
                        </div>
                        <table className="owst-print-table owst-print-pair-table">
                            <tbody>
                                <tr>
                                    <th>Deducted Amount</th>
                                    <td>{owstPrintSnapshot.amount}</td>
                                    <th>Receiver Address</th>
                                    <td>{owstPrintSnapshot.receiverAddress}</td>
                                </tr>
                                <tr>
                                    <th>Attached File</th>
                                    <td>{owstPrintSnapshot.attachmentName}</td>
                                    <th>Remarks</th>
                                    <td>{owstPrintSnapshot.remarks}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="owst-print-gatepass-heading">
                            <strong>Fiber@Home Ltd</strong>
                            <span>
                                House # 8/B, Road # 13, Gulshan -1, Dhaka -1212
                            </span>
                            <span>
                                <strong>Gate Pass Date :</strong>{" "}
                                {owstPrintSnapshot.gatePassDate}
                            </span>
                        </div>

                        <table className="owst-print-table owst-print-item-table">
                            <thead>
                                <tr>
                                    <th>SL</th>
                                    <th>Item Name</th>
                                    <th>Device Serial No.</th>
                                    <th>Item Description</th>
                                    <th>Unit / PCs</th>
                                    <th>Qty</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td>{owstPrintSnapshot.deviceCategory}</td>
                                    <td>{owstPrintSnapshot.deviceSerial}</td>
                                    <td>
                                        {[
                                            owstPrintSnapshot.brand,
                                            owstPrintSnapshot.model,
                                            owstPrintSnapshot.deviceType,
                                        ]
                                            .filter(
                                                (value) =>
                                                    value &&
                                                    value !== "—",
                                            )
                                            .join(" · ") || "—"}
                                    </td>
                                    <td>{owstPrintSnapshot.unit}</td>
                                    <td>{owstPrintSnapshot.quantity}</td>
                                    <td>{owstPrintSnapshot.remarks}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="owst-print-policy">
                            <span>
                                {owstPrintSnapshot.companyMaterial ? "☑" : "☐"}{" "}
                                Company Material
                            </span>
                            <span>
                                {owstPrintSnapshot.nonRefundable ? "☑" : "☐"}{" "}
                                Non-Refundable
                            </span>
                        </div>

                        <div className="owst-print-purpose">
                            <strong>For (Purpose)</strong>
                            <span>
                                Old Device Ownership Transferred according to IT Policy
                            </span>
                        </div>

                        <div className="owst-print-signatures">
                            <div>
                                <span>Received By</span>
                                <div />
                            </div>
                            <div>
                                <span>Prepared By</span>
                                <div />
                            </div>
                            <div>
                                <span>Checked By</span>
                                <div />
                            </div>
                        </div>

                        <div className="owst-print-footer">
                            Fiber@Home Ltd · IT Management System · OWST / Gate Pass
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 8mm;
                    }

                    html,
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    #owst-print-sheet,
                    #owst-print-sheet * {
                        visibility: visible !important;
                    }

                    #owst-print-sheet {
                        display: block !important;
                        position: absolute !important;
                        inset: 0 auto auto 0 !important;
                        width: 100% !important;
                        color: #111827 !important;
                        background: #ffffff !important;
                        font-family: Arial, Helvetica, sans-serif !important;
                    }

                    .owst-print-document {
                        width: 194mm !important;
                        margin: 0 auto !important;
                        font-size: 7.2pt !important;
                        line-height: 1.18 !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid-page !important;
                    }

                    .owst-print-letterhead {
                        border: 1.3px solid #111827 !important;
                        padding: 5px 7px !important;
                        text-align: center !important;
                    }

                    .owst-print-company {
                        font-size: 13pt !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.01em !important;
                    }

                    .owst-print-address {
                        margin-top: 2px !important;
                        font-size: 7.8pt !important;
                        font-weight: 600 !important;
                    }

                    .owst-print-title {
                        margin-top: 5px !important;
                        padding-top: 4px !important;
                        border-top: 1px solid #d1d5db !important;
                        font-size: 10.5pt !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.035em !important;
                    }

                    .owst-print-gate-date {
                        margin-top: 3px !important;
                        font-size: 8pt !important;
                    }

                    .owst-print-reference-row {
                        display: grid !important;
                        grid-template-columns: 0.8fr 1fr 1.15fr !important;
                        border: 1px solid #9ca3af !important;
                        border-top: 0 !important;
                    }

                    .owst-print-reference-row > div {
                        padding: 4px 5px !important;
                        border-right: 1px solid #d1d5db !important;
                    }

                    .owst-print-reference-row > div:last-child {
                        border-right: 0 !important;
                    }

                    .owst-print-reference-row span {
                        display: block !important;
                        color: #4b5563 !important;
                        font-size: 6.5pt !important;
                        text-transform: uppercase !important;
                        font-weight: 700 !important;
                    }

                    .owst-print-reference-row strong {
                        display: block !important;
                        margin-top: 1px !important;
                        font-size: 7.5pt !important;
                    }

                    .owst-print-section-title {
                        border: 1px solid #9ca3af !important;
                        border-bottom: 0 !important;
                        background: #e5e7eb !important;
                        padding: 3px 5px !important;
                        margin-top: 5px !important;
                        font-size: 7.4pt !important;
                        font-weight: 800 !important;
                        text-align: center !important;
                    }

                    .owst-print-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                    }

                    .owst-print-table th,
                    .owst-print-table td {
                        border: 1px solid #9ca3af !important;
                        padding: 3px 4px !important;
                        vertical-align: top !important;
                        overflow-wrap: anywhere !important;
                    }

                    .owst-print-pair-table th {
                        width: 18% !important;
                        background: #f9fafb !important;
                        text-align: left !important;
                        font-size: 6.7pt !important;
                        font-weight: 800 !important;
                        text-transform: uppercase !important;
                    }

                    .owst-print-pair-table td {
                        width: 32% !important;
                        font-size: 7.3pt !important;
                        font-weight: 600 !important;
                    }

                    .owst-print-gatepass-heading {
                        margin-top: 6px !important;
                        border: 1px solid #111827 !important;
                        padding: 5px 6px !important;
                        text-align: center !important;
                    }

                    .owst-print-gatepass-heading strong {
                        display: block !important;
                        font-size: 9pt !important;
                    }

                    .owst-print-gatepass-heading span {
                        display: block !important;
                        margin-top: 2px !important;
                        font-size: 7pt !important;
                    }

                    .owst-print-item-table {
                        margin-top: 4px !important;
                    }

                    .owst-print-item-table th {
                        background: #f3f4f6 !important;
                        text-align: center !important;
                        font-size: 6.2pt !important;
                        font-weight: 800 !important;
                    }

                    .owst-print-item-table td {
                        font-size: 6.7pt !important;
                        min-height: 23px !important;
                    }

                    .owst-print-item-table th:nth-child(1),
                    .owst-print-item-table td:nth-child(1) {
                        width: 5% !important;
                        text-align: center !important;
                    }

                    .owst-print-item-table th:nth-child(2),
                    .owst-print-item-table td:nth-child(2) {
                        width: 15% !important;
                    }

                    .owst-print-item-table th:nth-child(3),
                    .owst-print-item-table td:nth-child(3) {
                        width: 16% !important;
                    }

                    .owst-print-item-table th:nth-child(4),
                    .owst-print-item-table td:nth-child(4) {
                        width: 29% !important;
                    }

                    .owst-print-item-table th:nth-child(5),
                    .owst-print-item-table td:nth-child(5) {
                        width: 10% !important;
                        text-align: center !important;
                    }

                    .owst-print-item-table th:nth-child(6),
                    .owst-print-item-table td:nth-child(6) {
                        width: 7% !important;
                        text-align: center !important;
                    }

                    .owst-print-item-table th:nth-child(7),
                    .owst-print-item-table td:nth-child(7) {
                        width: 18% !important;
                    }

                    .owst-print-policy {
                        display: flex !important;
                        gap: 24px !important;
                        border: 1px solid #111827 !important;
                        border-top: 0 !important;
                        padding: 4px 6px !important;
                        font-size: 6.8pt !important;
                        font-weight: 700 !important;
                    }

                    .owst-print-purpose {
                        display: grid !important;
                        grid-template-columns: 78px 1fr !important;
                        gap: 6px !important;
                        border: 1px solid #111827 !important;
                        border-top: 0 !important;
                        padding: 4px 6px !important;
                        font-size: 6.8pt !important;
                    }

                    .owst-print-signatures {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 22px !important;
                        border: 1px solid #111827 !important;
                        border-top: 0 !important;
                        padding: 9px 15px 5px !important;
                    }

                    .owst-print-signatures span {
                        display: block !important;
                        font-size: 6.8pt !important;
                        font-weight: 700 !important;
                    }

                    .owst-print-signatures div > div {
                        height: 17px !important;
                        border-bottom: 1px dashed #6b7280 !important;
                    }

                    .owst-print-footer {
                        margin-top: 3px !important;
                        text-align: center !important;
                        color: #6b7280 !important;
                        font-size: 6pt !important;
                    }
                }
            `}</style>
        </div>
    );
}
