


//frontend/app/dashboard/assets/devices/page.tsx
// v21: sticky status UX + global action-date ordering + reassignment history
// warranty compact modal: dense enterprise presentation
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
    Wrench,
    X,
} from "lucide-react";

import {
    api,
    assetDeviceApi,
    employeeApi,
    getToken,
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

const PAGE_SIZE = 100;
const COLUMN_STORAGE_KEY = "itm:asset-devices:visible-columns:v6";

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
    others: string;
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
    | "mrpr"
    | "employee"
    | "assignedDate"
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
    | "assetType"
    | "status";

const COLUMN_OPTIONS: Array<{ key: ColumnKey; label: string }> = [
    { key: "serial", label: "Serial / Asset ID" },
    { key: "device", label: "Device" },
    { key: "mrpr", label: "Entry Type · MR / PR" },
    { key: "employee", label: "Employee" },
    { key: "assignedDate", label: "Assigned Date" },
    { key: "designation", label: "Designation / Department" },
    { key: "brand", label: "Brand" },
    { key: "model", label: "Model" },
    { key: "deviceType", label: "Assignment Device Type" },
    { key: "vendor", label: "Vendor" },
    { key: "actionDate", label: "Status Action Date" },
    { key: "purchase", label: "Purchase Date" },
    { key: "warranty", label: "Warranty Date" },
    { key: "deviceAge", label: "Device Age" },
    { key: "usageDuration", label: "Usage Duration" },
    { key: "remarks", label: "Remarks" },
    { key: "assetType", label: "Asset Type" },
    { key: "status", label: "Status" },
];

const DEFAULT_COLUMNS: ColumnKey[] = [
    "serial",
    "device",
    "mrpr",
    "employee",
    "assignedDate",
    "warranty",
    "status",
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
    | "warranty-transfer"
    | "service"
    | "service-transfer"
    | "damaged"
    | "lost"
    | "reassign"
    | "delete"
    | null;


type ActiveWarrantyClaim = {
    id: number;
    claim_no: string;
    asset_device_id: number;
    device_serial: string;
    problem: string;
    remarks: string;
    claim_status: number;
    lifecycle_state: string;
    restore_asset_status?: number | null;
    restore_emp_id?: string | null;
    vendor_id?: number | null;
    vendor_name?: string | null;
    created_at?: string | null;
};

type WarrantyClaimHistoryEntry = {
    id: number;
    event: string;
    previous_status: number;
    current_status: number;
    remarks: string;
    vendor_personnel_name?: string;
    vendor_mobile?: string;
    changed_by?: string;
    changed_at?: string;
    attach_file?: string | null;
    metadata?: Record<string, unknown> | null;
};

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

// type ApprovedTTRequisition = AllocatableRequisition & {
//     category_id?: number;
//     brand_id?: number;
//     model_id?: number;
//     brand?: string;
//     model?: string;
//     department?: string;
//     designation?: string;
//     approval_status?: string;
//     approved_by?: string;
//     approved_by_name?: string;
//     approved_date?: string;
// };


type ApprovedTTRequisition = AllocatableRequisition & {
    category_id?: number;
    brand_id?: number;
    model_id?: number;

    brand?: string;
    model?: string;

    department?: string;
    designation?: string;

    approval_status?: string;

    approved_val?: number | null;
    delivered_val?: number | null;
    dev_assigned_val?: number | null;

    approved_by?: string | null;
    approved_by_name?: string | null;
    approved_date?: string | null;

    delivered_by?: string | null;
    delivered_date?: string | null;

    stock_inventory_id?: number | null;
    device_sl_no?: string | null;
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
        body: {
            problems: string;
            remarks: string;
            vendor_id: number;
            designated_email_to: string;
            designated_email_cc: string;
        },
    ) =>
        api.post(`/claims/device/${id}/open`, body),

    createServiceRequest: (
        id: number,
        body: {
            problems: string;
            remarks: string;
            vendor_id: number;
            designated_email_to: string;
            designated_email_cc: string;
        },
    ) =>
        api.post(`/claims/device/${id}/open`, {
            ...body,
            service_type: 1,
            claim_status: 15,
            target_asset_status: 15,
        }),

    activeWarrantyClaim: (assetID: number) =>
        api.get<{
            success: boolean;
            data: {
                active: boolean;
                claim: ActiveWarrantyClaim | null;
            };
        }>(`/claims/device/${assetID}/active`),

    warrantyClaimLifecycle: (claimID: number) =>
        api.get<{
            success: boolean;
            data: WarrantyClaimHistoryEntry[];
        }>(`/claims/${claimID}/lifecycle`),

    sendWarrantyToVendor: (
        claimID: number,
        body: {
            vendor_receiver: string;
            vendor_mobile: string;
            gate_pass_date: string;
            gate_pass_remarks: string;
            remarks: string;
            company_material: boolean;
            returnable: boolean;
            attachment?: File | null;
        },
    ) => {
        const formData = new FormData();
        formData.append("vendor_receiver", body.vendor_receiver);
        formData.append("vendor_mobile", body.vendor_mobile);
        formData.append("gate_pass_date", body.gate_pass_date);
        formData.append("gate_pass_remarks", body.gate_pass_remarks);
        formData.append("remarks", body.remarks);
        formData.append("company_material", body.company_material ? "1" : "0");
        formData.append("returnable", body.returnable ? "1" : "0");

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
                claim_status: number;
                lifecycle_state: string;
                attachment?: string | null;
            };
        }>(`/claims/${claimID}/send-vendor`, formData);
    },

    vendorRecipients: (query = "") =>
        api.get<{
            success: boolean;
            data: Array<{
                name: string;
                mobile: string;
            }>;
        }>(
            `/claims/vendor-recipients?q=${encodeURIComponent(query)}`,
        ),

    submitWarrantyWorkflow: (
        claimID: number,
        body: {
            target_status: "9" | "10";
            feedback: string;
            vendor_receiver: string;
            vendor_mobile: string;
            gate_pass_date: string;
            gate_pass_remarks: string;
            attachment?: File | null;
        },
    ) => {
        const formData = new FormData();
        formData.append("target_status", body.target_status);
        formData.append("feedback", body.feedback);
        formData.append("vendor_receiver", body.vendor_receiver);
        formData.append("vendor_mobile", body.vendor_mobile);
        formData.append("gate_pass_date", body.gate_pass_date);
        formData.append("gate_pass_remarks", body.gate_pass_remarks);

        if (body.attachment) {
            formData.append("attachment", body.attachment, body.attachment.name);
        }

        return api.postForm<{
            success: boolean;
            data: {
                claim_status: number;
                lifecycle_state: string;
                restored_asset_status?: number;
                restored_status_label?: string;
            };
        }>(`/claims/${claimID}/workflow`, formData);
    },

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


async function downloadWarrantyAttachment(
    claimID: number,
    historyID: number,
    filename: string,
) {
    const base = (
        process.env.NEXT_PUBLIC_API_URL ??
        "http://localhost:8080/api/v1"
    ).replace(/\/+$/, "");

    const token = getToken();
    const response = await fetch(
        `${base}/claims/${claimID}/history/${historyID}/attachment`,
        {
            method: "GET",
            headers: token
                ? { Authorization: `Bearer ${token}` }
                : undefined,
            credentials: "include",
            cache: "no-store",
        },
    );

    if (!response.ok) {
        let message = `Unable to download attachment (HTTP ${response.status})`;
        try {
            const payload = await response.json();
            message = payload?.error || payload?.message || message;
        } catch {
            // Keep HTTP fallback.
        }
        throw new Error(message);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "warranty-attachment";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

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
        case "assignedDate":
        case "actionDate":
        case "purchase":
            return <CalendarClock className={iconClass} />;
        case "designation":
            return <BriefcaseBusiness className={iconClass} />;
        case "brand":
            return <Tag className={iconClass} />;
        case "model":
            return <Box className={iconClass} />;
        case "deviceType":
        case "assetType":
            return <PackageCheck className={iconClass} />;
        case "vendor":
            return <Store className={iconClass} />;
        case "warranty":
            return <ShieldCheck className={iconClass} />;
        case "deviceAge":
        case "usageDuration":
            return <CalendarClock className={iconClass} />;
        case "remarks":
            return <FileText className={iconClass} />;
        case "status":
            return <BadgeCheck className={iconClass} />;
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

function todayInputValue() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function isWarrantyExpired(value: string | null | undefined) {
    if (!value) return false;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;

    const endOfWarrantyDay = new Date(date);
    endOfWarrantyDay.setHours(23, 59, 59, 999);

    return endOfWarrantyDay.getTime() < Date.now();
}

function canOpenRepairWorkflow(item: OperationalAssetDevice) {
    // Available, Assigned, Damaged, Transferred and Returned can be repaired.
    // Lost / OWST / active Claim / active Service Request are not offered a new repair workflow.
    return [0, 1, 2, 3, 4].includes(item.asset_status);
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

function formatAssignedDeviceAge(
    assignedDate: string | null | undefined,
    endValue?: string | null,
) {
    if (!assignedDate) {
        return "No Assigned Date";
    }

    return formatCompactDuration(
        assignedDate,
        endValue,
    );
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

function CompactOperationSummary({
    asset,
}: {
    asset: OperationalAssetDevice | null;
}) {
    if (!asset) return null;

    return (
        <section className="rounded-lg border border-border bg-muted/15 p-2.5">
            <div className="grid gap-1.5 sm:grid-cols-4">
                <CompactDeviceInfo label="Serial" value={asset.device_serial || `Asset #${asset.id}`} mono />
                <CompactDeviceInfo
                    label="Device"
                    value={[asset.category, asset.brand, asset.model].filter(Boolean).join(" · ") || "—"}
                />
                <CompactDeviceInfo
                    label="Employee"
                    value={
                        asset.emp_id
                            ? `${asset.emp_name || "Employee"} · ${asset.emp_id}`
                            : asset.last_emp_id
                                ? `${asset.last_emp_name || "Employee"} · ${asset.last_emp_id}`
                                : "Unassigned"
                    }
                />
                <CompactDeviceInfo
                    label="Status"
                    value={asset.status_label || historyStatusLabel(asset.asset_status)}
                />
            </div>
        </section>
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
                <CompactDeviceInfo
                    label="Device Age"
                    value={formatAssignedDeviceAge(asset.assigned_date)}
                />
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
    const [requisitionTotalApproved, setRequisitionTotalApproved] = useState(0);

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
    const [warrantyVendorID, setWarrantyVendorID] = useState("");
    const [warrantyEmailTo, setWarrantyEmailTo] = useState("");
    const [warrantyEmailCC, setWarrantyEmailCC] = useState("itm@fiberathome.net");
    const [incidentDate, setIncidentDate] = useState(todayInputValue());
    const [returnDate, setReturnDate] = useState(todayInputValue());

    const [activeWarrantyClaim, setActiveWarrantyClaim] =
        useState<ActiveWarrantyClaim | null>(null);
    const [warrantyClaimHistory, setWarrantyClaimHistory] =
        useState<WarrantyClaimHistoryEntry[]>([]);
    const [warrantyClaimLoading, setWarrantyClaimLoading] = useState(false);

    const [vendorReceiver, setVendorReceiver] = useState("");
    const [vendorReceiverMobile, setVendorReceiverMobile] = useState("");
    const [vendorGatePassDate, setVendorGatePassDate] = useState("");
    const [vendorGatePassRemarks, setVendorGatePassRemarks] = useState("");
    const [vendorTransferRemarks, setVendorTransferRemarks] = useState("");
    const [vendorTransferAttachment, setVendorTransferAttachment] =
        useState<File | null>(null);
    const [vendorTransferAttachmentPreview, setVendorTransferAttachmentPreview] =
        useState("");
    const [vendorCompanyMaterial, setVendorCompanyMaterial] = useState(true);
    const [vendorReturnable, setVendorReturnable] = useState(true);

    const [warrantyWorkflowStatus, setWarrantyWorkflowStatus] =
        useState<"9" | "10">("9");
    const [warrantyWorkflowFeedback, setWarrantyWorkflowFeedback] = useState("");
    const [warrantyWorkflowAttachment, setWarrantyWorkflowAttachment] =
        useState<File | null>(null);
    const [warrantyWorkflowAttachmentPreview, setWarrantyWorkflowAttachmentPreview] =
        useState("");

    const [workflowRecipientName, setWorkflowRecipientName] = useState("");
    const [workflowRecipientMobile, setWorkflowRecipientMobile] = useState("");
    const [workflowGatePassDate, setWorkflowGatePassDate] = useState("");
    const [workflowGatePassRemarks, setWorkflowGatePassRemarks] = useState("");
    const [workflowRecipientSuggestions, setWorkflowRecipientSuggestions] =
        useState<Array<{ name: string; mobile: string }>>([]);

    useEffect(() => {
        if (!vendorTransferAttachment || !vendorTransferAttachment.type.startsWith("image/")) {
            setVendorTransferAttachmentPreview("");
            return;
        }

        const previewURL = URL.createObjectURL(vendorTransferAttachment);
        setVendorTransferAttachmentPreview(previewURL);

        return () => URL.revokeObjectURL(previewURL);
    }, [vendorTransferAttachment]);

    useEffect(() => {
        if (
            !warrantyWorkflowAttachment ||
            !warrantyWorkflowAttachment.type.startsWith("image/")
        ) {
            setWarrantyWorkflowAttachmentPreview("");
            return;
        }

        const previewURL = URL.createObjectURL(warrantyWorkflowAttachment);
        setWarrantyWorkflowAttachmentPreview(previewURL);

        return () => URL.revokeObjectURL(previewURL);
    }, [warrantyWorkflowAttachment]);

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

    const selectedWarrantyVendor = useMemo(
        () =>
            owstVendors.find(
                (vendor) => String(vendor.id) === warrantyVendorID,
            ) ?? null,
        [owstVendors, warrantyVendorID],
    );

    const vendorEmailOptions = useMemo(() => {
        const seen = new Set<string>();

        return owstVendors
            .map((vendor) => ({
                vendorID: vendor.id,
                vendorName: vendor.name,
                email: vendor.email.trim(),
            }))
            .filter((item) => {
                const key = item.email.toLowerCase();
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    }, [owstVendors]);

    const effectiveWarrantyLifecycle = useMemo<
        "OPEN" | "WITH_VENDOR" | "RECEIVED" | "CLOSED"
    >(() => {
        if (!activeWarrantyClaim) {
            return "OPEN";
        }

        const normalizedEvents = warrantyClaimHistory.map((entry) =>
            String(entry.event || "").trim().toUpperCase(),
        );

        if (normalizedEvents.includes("CLAIM_CLOSED")) {
            return "CLOSED";
        }
        if (normalizedEvents.includes("RECEIVED_FROM_VENDOR")) {
            return "RECEIVED";
        }
        if (normalizedEvents.includes("SENT_TO_VENDOR")) {
            return "WITH_VENDOR";
        }

        const lifecycle = String(
            activeWarrantyClaim.lifecycle_state || "OPEN",
        ).toUpperCase();

        if (
            lifecycle === "WITH_VENDOR" ||
            lifecycle === "RECEIVED" ||
            lifecycle === "CLOSED"
        ) {
            return lifecycle;
        }

        return "OPEN";
    }, [activeWarrantyClaim, warrantyClaimHistory]);

    useEffect(() => {
        if (
            (operation !== "warranty-transfer" && operation !== "service-transfer") ||
            effectiveWarrantyLifecycle !== "WITH_VENDOR"
        ) {
            return;
        }

        let cancelled = false;

        void deviceOperationsApi
            .vendorRecipients()
            .then((response) => {
                if (!cancelled) {
                    setWorkflowRecipientSuggestions(
                        Array.isArray(response?.data) ? response.data : [],
                    );
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setWorkflowRecipientSuggestions([]);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [operation, effectiveWarrantyLifecycle]);

    const warrantyTransferLocked =
        !activeWarrantyClaim || effectiveWarrantyLifecycle !== "OPEN";

    const previousVendorHandover = useMemo(() => {
        return [...warrantyClaimHistory]
            .reverse()
            .find(
                (entry) =>
                    String(entry.event || "").trim().toUpperCase() ===
                    "SENT_TO_VENDOR",
            ) ?? null;
    }, [warrantyClaimHistory]);

    const previousVendorMetadata =
        previousVendorHandover?.metadata &&
            typeof previousVendorHandover.metadata === "object"
            ? previousVendorHandover.metadata
            : {};

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
                formatAssignedDeviceAge(
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
                    formatAssignedDeviceAge(
                        item.assigned_date,
                        record.created_at || undefined,
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

            // Instant-first UX: render the API page immediately.
            // Returned-holder enrichment is display-only and runs in the background.
            setItems(pageItems);
            setTotal(response.total ?? 0);

            const returnedNeedingHistory = pageItems.filter(
                (item) =>
                    item.asset_status === 4 &&
                    !item.previous_assignment &&
                    !item.last_emp_id,
            );

            if (returnedNeedingHistory.length > 0) {
                void Promise.all(
                    returnedNeedingHistory.map((item) =>
                        hydrateReturnedLastHolder(item),
                    ),
                ).then((hydratedRows) => {
                    const hydratedByID = new Map(
                        hydratedRows.map((item) => [item.id, item]),
                    );

                    setItems((current) =>
                        current.map((item) =>
                            hydratedByID.get(item.id) ?? item,
                        ),
                    );
                });
            }
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
        const needsVendorDirectory =
            operation === "warranty" ||
            operation === "service" ||
            operation === "warranty-transfer" ||
            operation === "service-transfer" ||
            (operation === "owst" && owstType === "vendor");

        if (!needsVendorDirectory) {
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
                            others: String(
                                row?.vendor_others ??
                                row?.others ??
                                row?.Others ??
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
            (operation !== "warranty" && operation !== "service") ||
            warrantyVendorID ||
            !selectedAsset?.vendor_name?.trim() ||
            owstVendors.length === 0
        ) {
            return;
        }

        const currentVendorName = selectedAsset.vendor_name.trim().toLowerCase();
        const matchedVendor = owstVendors.find(
            (vendor) => vendor.name.trim().toLowerCase() === currentVendorName,
        );

        if (matchedVendor) {
            setWarrantyVendorID(String(matchedVendor.id));
        }
    }, [
        operation,
        warrantyVendorID,
        selectedAsset?.vendor_name,
        owstVendors,
    ]);

    useEffect(() => {
        if (
            operation !== "warranty" &&
            operation !== "service"
        ) {
            return;
        }

        if (!selectedWarrantyVendor) {
            setWarrantyEmailTo("");
            return;
        }

        // Vendor email is the default recipient, but IT can search/select
        // another email from the loaded vendor directory.
        setWarrantyEmailTo(selectedWarrantyVendor.email || "");
    }, [operation, selectedWarrantyVendor]);

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
            setRequisitionTotalApproved(0);
            return;
        }

        let active = true;

        const timer = window.setTimeout(async () => {
            try {
                setRequisitionLoading(true);
                setOperationError("");

                const query = new URLSearchParams();

                if (selectedAsset.category_id) {
                    query.set("category_id", String(selectedAsset.category_id));
                } else if (selectedAsset.category) {
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

                if (!active) return;

                // Safety guard: only approved and not-yet-delivered TTs are selectable.
                const approvedRows = (response.data ?? []).filter((item) => {
                    const approvedVal = Number(item.approved_val ?? 0);
                    const deliveredVal = Number(item.delivered_val ?? 0);

                    return (
                        (approvedVal === 1 || approvedVal === 3) &&
                        deliveredVal === 0
                    );
                });

                setRequisitionResults(approvedRows);
                setRequisitionTotalApproved(approvedRows.length);
            } catch (reason) {
                if (!active) return;

                setRequisitionResults([]);
                setRequisitionTotalApproved(0);
                setOperationError(
                    reason instanceof Error
                        ? reason.message
                        : "Unable to load approved TT requisitions.",
                );
            } finally {
                if (active) {
                    setRequisitionLoading(false);
                }
            }
        }, requisitionQuery.trim() ? 180 : 0);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [
        operation,
        requisitionQuery,
        selectedAsset?.id,
        selectedAsset?.category,
        selectedAsset?.category_id,
    ]);

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

    async function loadActiveWarrantyClaim(assetID: number) {
        try {
            setWarrantyClaimLoading(true);
            const response = await deviceOperationsApi.activeWarrantyClaim(assetID);
            const claim = response?.data?.claim ?? null;
            setActiveWarrantyClaim(claim);

            if (claim?.id) {
                const historyResponse =
                    await deviceOperationsApi.warrantyClaimLifecycle(claim.id);
                const historyRows = [...(historyResponse?.data ?? [])].sort((a, b) => {
                    const aTime = Date.parse(a.changed_at || "") || 0;
                    const bTime = Date.parse(b.changed_at || "") || 0;
                    if (aTime !== bTime) {
                        return aTime - bTime;
                    }
                    return Number(a.id || 0) - Number(b.id || 0);
                });
                setWarrantyClaimHistory(historyRows);

                const vendorTransfer = [...historyRows]
                    .reverse()
                    .find((entry) => entry.event === "SENT_TO_VENDOR");

                if (vendorTransfer) {
                    const meta = vendorTransfer.metadata ?? {};
                    setVendorReceiver(vendorTransfer.vendor_personnel_name ?? "");
                    setVendorReceiverMobile(vendorTransfer.vendor_mobile ?? "");
                    setVendorGatePassDate(String(meta["gate_pass_date"] ?? ""));
                    setVendorGatePassRemarks(String(meta["gate_pass_remarks"] ?? ""));
                    setVendorTransferRemarks(vendorTransfer.remarks ?? "");
                    setVendorCompanyMaterial(Boolean(meta["company_material"] ?? true));
                    setVendorReturnable(Boolean(meta["returnable"] ?? true));
                }
            } else {
                setWarrantyClaimHistory([]);
            }
        } catch (reason) {
            setActiveWarrantyClaim(null);
            setWarrantyClaimHistory([]);
            setOperationError(
                reason instanceof Error
                    ? reason.message
                    : "Unable to load the active warranty claim.",
            );
        } finally {
            setWarrantyClaimLoading(false);
        }
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
        setRequisitionTotalApproved(0);
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
        setWarrantyVendorID(
            (next === "warranty" || next === "service") && item.vendor_id
                ? String(item.vendor_id)
                : "",
        );
        setWarrantyEmailTo("");
        setWarrantyEmailCC("itm@fiberathome.net");

        setActiveWarrantyClaim(null);
        setWarrantyClaimHistory([]);
        setVendorReceiver("");
        setVendorReceiverMobile("");
        setVendorGatePassDate(dateInputValue(new Date().toISOString()));
        setVendorGatePassRemarks("");
        setVendorTransferRemarks("");
        setVendorTransferAttachment(null);
        setVendorTransferAttachmentPreview("");
        setVendorCompanyMaterial(true);
        setVendorReturnable(true);
        setWarrantyWorkflowStatus("9");
        setWarrantyWorkflowFeedback("");
        setWarrantyWorkflowAttachment(null);
        setWarrantyWorkflowAttachmentPreview("");
        setWorkflowRecipientName("");
        setWorkflowRecipientMobile("");
        setWorkflowGatePassDate(dateInputValue(new Date().toISOString()));
        setWorkflowGatePassRemarks("");
        setIncidentDate(todayInputValue());
        setReturnDate(todayInputValue());
        setWorkflowRecipientSuggestions([]);

        if (next === "warranty-transfer" || next === "service-transfer") {
            void loadActiveWarrantyClaim(item.id);
        }

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
            next === "service" ||
            next === "warranty-transfer" ||
            next === "service-transfer" ||
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
                const returnRemarks = `[Return date: ${returnDate}] ${remarks.trim()}`.trim();

                await deviceOperationsApi.returnAsset(
                    selectedAsset.id,
                    returnRemarks,
                );

                message = `Device returned successfully on ${formatDate(returnDate)}. The current assignment has been closed.`;
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

                const damageRemarks = `[Incident date: ${incidentDate}] ${remarks.trim()}`;

                await deviceOperationsApi.markDamaged(
                    selectedAsset.id,
                    damageRemarks,
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

                const lostRemarks = `[Incident date: ${incidentDate}] ${remarks.trim()}`;

                await deviceOperationsApi.markLost(
                    selectedAsset.id,
                    lostRemarks,
                );

                message =
                    "Device status changed to Lost. The responsible employee snapshot and audit history were preserved.";
            }

            if (operation === "warranty") {
                if (!warrantyVendorID || !selectedWarrantyVendor) {
                    setOperationError("Select the warranty vendor first.");
                    return;
                }

                if (!warrantyProblems.trim()) {
                    setOperationError("Describe the warranty problem first.");
                    return;
                }

                if (!remarks.trim()) {
                    setOperationError("Enter IT claim remarks before raising the claim.");
                    return;
                }

                if (!warrantyEmailTo.trim()) {
                    setOperationError("Designated Email (To) is required.");
                    return;
                }

                if (!warrantyEmailCC.trim()) {
                    setOperationError("Designated Email (CC) is required.");
                    return;
                }

                await deviceOperationsApi.createWarrantyClaim(
                    selectedAsset.id,
                    {
                        problems: warrantyProblems.trim(),
                        remarks: remarks.trim(),
                        vendor_id: selectedWarrantyVendor.id,
                        designated_email_to: warrantyEmailTo.trim(),
                        designated_email_cc: warrantyEmailCC.trim(),
                    },
                );

                message = `Warranty claim raised with ${selectedWarrantyVendor.name}. Previous device status was preserved for automatic restoration when the claim is closed.`;
            }

            if (operation === "service") {
                if (!warrantyVendorID || !selectedWarrantyVendor) {
                    setOperationError("Select the service vendor first.");
                    return;
                }

                if (!warrantyProblems.trim()) {
                    setOperationError("Describe the service problem first.");
                    return;
                }

                if (!remarks.trim()) {
                    setOperationError("Enter IT service remarks before raising the request.");
                    return;
                }

                if (!warrantyEmailTo.trim()) {
                    setOperationError("Designated Email (To) is required.");
                    return;
                }

                if (!warrantyEmailCC.trim()) {
                    setOperationError("Designated Email (CC) is required.");
                    return;
                }

                await deviceOperationsApi.createServiceRequest(
                    selectedAsset.id,
                    {
                        problems: warrantyProblems.trim(),
                        remarks: remarks.trim(),
                        vendor_id: selectedWarrantyVendor.id,
                        designated_email_to: warrantyEmailTo.trim(),
                        designated_email_cc: warrantyEmailCC.trim(),
                    },
                );

                message = `Service request raised with ${selectedWarrantyVendor.name}. Device status is Service Request (15); the previous device status is preserved for restoration after close.`;
            }

            if (operation === "warranty-transfer" || operation === "service-transfer") {
                if (!activeWarrantyClaim) {
                    setOperationError(
                        "No active warranty claim was found for this device.",
                    );
                    return;
                }

                if (effectiveWarrantyLifecycle !== "OPEN") {
                    if (!workflowRecipientName.trim()) {
                        setOperationError(
                            "Vendor recipient / delivery-man name is required.",
                        );
                        return;
                    }

                    const workflowMobileDigits =
                        workflowRecipientMobile.replace(/\D/g, "");

                    if (workflowMobileDigits.length !== 11) {
                        setOperationError(
                            "Vendor recipient mobile must contain exactly 11 digits.",
                        );
                        return;
                    }

                    if (
                        warrantyWorkflowStatus === "9" &&
                        !workflowGatePassDate
                    ) {
                        setOperationError("Gate pass date is required.");
                        return;
                    }

                    if (
                        warrantyWorkflowStatus === "9" &&
                        !workflowGatePassRemarks.trim()
                    ) {
                        setOperationError(
                            "Gate pass remarks are required when status is Transferred to Vendor.",
                        );
                        return;
                    }

                    if (!warrantyWorkflowFeedback.trim()) {
                        setOperationError(
                            "Enter IT Feedback before submitting the Warranty Claim Workflow.",
                        );
                        return;
                    }

                    if (
                        warrantyWorkflowAttachment &&
                        warrantyWorkflowAttachment.size > 4 * 1024 * 1024
                    ) {
                        setOperationError("Attachment must be 4 MB or smaller.");
                        return;
                    }

                    const workflowResponse =
                        await deviceOperationsApi.submitWarrantyWorkflow(
                            activeWarrantyClaim.id,
                            {
                                target_status: warrantyWorkflowStatus,
                                feedback: warrantyWorkflowFeedback.trim(),
                                vendor_receiver:
                                    workflowRecipientName.trim(),
                                vendor_mobile: workflowMobileDigits,
                                gate_pass_date:
                                    warrantyWorkflowStatus === "9"
                                        ? workflowGatePassDate
                                        : "",
                                gate_pass_remarks:
                                    warrantyWorkflowStatus === "9"
                                        ? workflowGatePassRemarks.trim()
                                        : "",
                                attachment: warrantyWorkflowAttachment,
                            },
                        );

                    const restoredStatus =
                        workflowResponse?.data?.restored_asset_status;

                    const workflowMessage =
                        warrantyWorkflowStatus === "10"
                            ? `Warranty claim ${activeWarrantyClaim.claim_no} closed. Device restored to ${workflowResponse?.data?.restored_status_label || "its previous status"}.`
                            : `Warranty claim ${activeWarrantyClaim.claim_no} remains Transferred to Vendor. Feedback was added to Warranty History.`;

                    setOperation(null);
                    setSelectedAsset(null);
                    setOperationError("");
                    setNotice("");
                    setAjaxSearching(false);
                    setSearchInput("");
                    setSearch("");
                    setCategoryInput("");
                    setCategory("");

                    if (warrantyWorkflowStatus === "10") {
                        setStatus(
                            restoredStatus === 0 ||
                                restoredStatus === 1 ||
                                restoredStatus === 4
                                ? String(restoredStatus)
                                : "",
                        );
                    } else {
                        setStatus(operation === "service-transfer" ? "15" : "8");
                    }

                    setPage(1);
                    setSuccessDialog({
                        title:
                            warrantyWorkflowStatus === "10"
                                ? "Warranty Claim Closed"
                                : operation === "service-transfer"
                                    ? "Service Workflow Updated"
                                    : "Warranty Workflow Updated",
                        message: workflowMessage,
                        serial:
                            selectedAsset.device_serial ||
                            `Asset #${selectedAsset.id}`,
                        statusLabel:
                            warrantyWorkflowStatus === "10"
                                ? workflowResponse?.data?.restored_status_label ||
                                "Restored"
                                : operation === "service-transfer"
                                    ? "Service · Transferred to Vendor"
                                    : "Transferred to Vendor",
                    });

                    await loadStatusCounts();
                    return;
                }

                if (!vendorReceiver.trim()) {
                    setOperationError("Vendor recipient name is required.");
                    return;
                }

                const mobileDigits = vendorReceiverMobile.replace(/\D/g, "");
                if (mobileDigits.length !== 11) {
                    setOperationError(
                        "Vendor recipient mobile must contain exactly 11 digits.",
                    );
                    return;
                }

                if (!vendorGatePassDate) {
                    setOperationError("Gate pass date is required.");
                    return;
                }

                if (!vendorGatePassRemarks.trim()) {
                    setOperationError("Gate pass remarks are required.");
                    return;
                }

                if (
                    vendorTransferAttachment &&
                    vendorTransferAttachment.size > 4 * 1024 * 1024
                ) {
                    setOperationError("Attachment must be 4 MB or smaller.");
                    return;
                }

                const allowedExtensions = [
                    "jpg", "jpeg", "png", "gif", "pdf",
                    "txt", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
                ];

                if (vendorTransferAttachment) {
                    const extension =
                        vendorTransferAttachment.name
                            .split(".")
                            .pop()
                            ?.toLowerCase() ?? "";

                    if (!allowedExtensions.includes(extension)) {
                        setOperationError(
                            "Attachment type is not allowed. Use JPG, PNG, GIF, PDF, TXT, DOC/DOCX, PPT/PPTX or XLS/XLSX.",
                        );
                        return;
                    }
                }

                await deviceOperationsApi.sendWarrantyToVendor(
                    activeWarrantyClaim.id,
                    {
                        vendor_receiver: vendorReceiver.trim(),
                        vendor_mobile: mobileDigits,
                        gate_pass_date: vendorGatePassDate,
                        gate_pass_remarks: vendorGatePassRemarks.trim(),
                        remarks:
                            vendorTransferRemarks.trim() ||
                            "Warranty device transferred to vendor.",
                        company_material: vendorCompanyMaterial,
                        returnable: vendorReturnable,
                        attachment: vendorTransferAttachment,
                    },
                );

                message = `Warranty device transferred to ${activeWarrantyClaim.vendor_name || "the selected vendor"} successfully. Claim ${activeWarrantyClaim.claim_no} is now With Vendor.`;
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
                                    : completedOperation === "service"
                                        ? "Service Request"
                                        : completedOperation === "warranty-transfer" ||
                                            completedOperation === "service-transfer"
                                            ? "With Vendor"
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
                                            : completedOperation === "service"
                                                ? "Service Request Submitted"
                                                : completedOperation === "warranty-transfer"
                                                    ? "Warranty Device Sent to Vendor"
                                                    : completedOperation === "service-transfer"
                                                        ? "Service Device Sent to Vendor"
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

            let destinationStatus = "";

            switch (completedOperation) {
                case "assign-direct":
                case "assign-tt":
                case "transfer":
                case "reassign":
                    destinationStatus = "1";
                    break;
                case "return":
                    destinationStatus = "4";
                    break;
                case "owst":
                    destinationStatus = "7";
                    break;
                case "warranty":
                case "warranty-transfer":
                    destinationStatus = "8";
                    break;
                case "service":
                case "service-transfer":
                    destinationStatus = "15";
                    break;
                case "damaged":
                    destinationStatus = "2";
                    break;
                case "lost":
                    destinationStatus = "5";
                    break;
                case "update":
                    destinationStatus = String(selectedAsset.asset_status);
                    break;
                case "delete":
                default:
                    destinationStatus = "";
                    break;
            }

            // Post-action UX: always land on the resulting status category.
            // Clear previous search/category filters so the completed device is
            // not hidden by stale criteria. loadAssets() will rerun from the
            // existing status/page/search/category dependencies.
            setAjaxSearching(false);
            setSearchInput("");
            setSearch("");
            setCategoryInput("");
            setCategory("");
            setStatus(destinationStatus);
            setPage(1);

            setSuccessDialog({
                title: completedTitle,
                message,
                serial: completedSerial,
                statusLabel: completedStatusLabel,
            });

            await loadStatusCounts();
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
            case "warranty-transfer":
                return "Warranty Claim Workflow";
            case "service":
                return "Raise Service Request";
            case "service-transfer":
                return "Service Request Workflow";
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
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
                            >
                                <Columns3 className="h-4 w-4" />
                                Columns
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-[70vh] w-64 overflow-y-auto">
                            <DropdownMenuLabel>Show / hide columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {COLUMN_OPTIONS.map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.key}
                                    checked={visibleColumns.has(column.key)}
                                    onCheckedChange={() => toggleColumn(column.key)}
                                    onSelect={(event) => event.preventDefault()}
                                    className="gap-2"
                                >
                                    {columnIcon(column.key)}
                                    {column.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    const next = new Set(DEFAULT_COLUMNS);
                                    setVisibleColumns(next);
                                    window.localStorage.setItem(
                                        COLUMN_STORAGE_KEY,
                                        JSON.stringify(Array.from(next)),
                                    );
                                }}
                            >
                                Reset standard view
                            </DropdownMenuItem>
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

            <div className="rounded-lg border border-border bg-card px-2.5 py-2 shadow-sm">
                <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                    <div className="relative min-w-0 flex-1 xl:max-w-[520px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            autoFocus
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") applyFilters();
                            }}
                            placeholder="Search MR, PR, Serial, Asset ID or Employee ID..."
                            autoComplete="off"
                            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-9 text-[12px] outline-none transition-shadow focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                        />

                        {(ajaxSearching || (loading && searchInput.trim().length >= 2)) ? (
                            <RefreshCw className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-primary" />
                        ) : searchInput ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setAjaxSearching(false);
                                    setSearchInput("");
                                    setSearch("");
                                    setPage(1);
                                }}
                                className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label="Clear search"
                                title="Clear search"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                    </div>

                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                        className="h-9 min-w-[170px] rounded-md border border-input bg-background px-2.5 text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {STATUS_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <input
                        value={categoryInput}
                        onChange={(event) => setCategoryInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") applyFilters();
                        }}
                        placeholder="Category"
                        className="h-9 min-w-[170px] rounded-md border border-input bg-background px-2.5 text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
                    />

                    <div className="flex shrink-0 gap-1.5">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-semibold text-primary-foreground hover:opacity-90"
                        >
                            <Filter className="h-3.5 w-3.5" />
                            Search
                        </button>

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                            title="Clear filters"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="ml-auto hidden shrink-0 text-[10px] text-muted-foreground xl:block">
                        {searchInput.trim().length >= 2 && !ajaxSearching && !loading
                            ? `${total.toLocaleString()} ${total === 1 ? "match" : "matches"}`
                            : "Live search"}
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="max-h-[68vh] overflow-y-auto overflow-x-hidden">
                    <table className="w-full table-fixed text-[11px] leading-4">
                        <thead className="sticky top-0 z-20 border-b border-border bg-background/95 shadow-sm backdrop-blur">
                            <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                                <th className="w-[44px] px-2 py-2.5 text-center">SL</th>

                                {visibleColumns.has("serial") && (
                                    <th className="w-[11%] px-2.5 py-2.5">Serial</th>
                                )}

                                {visibleColumns.has("device") && (
                                    <th className="w-[12%] px-2.5 py-2.5">Device</th>
                                )}

                                {visibleColumns.has("mrpr") && (
                                    <th className="w-[15%] px-2.5 py-2.5">Entry Type</th>
                                )}

                                {visibleColumns.has("employee") && (
                                    <th className="w-[16%] px-2.5 py-2.5">Employee</th>
                                )}

                                {visibleColumns.has("assignedDate") && (
                                    <th className="w-[9%] px-2.5 py-2.5">Assigned Date</th>
                                )}

                                {visibleColumns.has("designation") && (
                                    <th className="px-2 py-2.5">Designation / Dept.</th>
                                )}

                                {visibleColumns.has("brand") && (
                                    <th className="px-2 py-2.5">Brand</th>
                                )}

                                {visibleColumns.has("model") && (
                                    <th className="px-2 py-2.5">Model</th>
                                )}

                                {visibleColumns.has("deviceType") && (
                                    <th className="px-2 py-2.5">Device Type</th>
                                )}

                                {visibleColumns.has("vendor") && (
                                    <th className="px-2 py-2.5">Vendor</th>
                                )}

                                {visibleColumns.has("actionDate") && (
                                    <th className="px-2 py-2.5">Action Date</th>
                                )}

                                {visibleColumns.has("purchase") && (
                                    <th className="px-2 py-2.5">Purchase Date</th>
                                )}

                                {visibleColumns.has("warranty") && (
                                    <th className="w-[11%] px-2.5 py-2.5">Warranty Date</th>
                                )}

                                {visibleColumns.has("deviceAge") && (
                                    <th className="px-2 py-2.5">Device Age</th>
                                )}

                                {visibleColumns.has("usageDuration") && (
                                    <th className="px-2 py-2.5">Usage</th>
                                )}

                                {visibleColumns.has("remarks") && (
                                    <th className="px-2 py-2.5">Remarks</th>
                                )}

                                {visibleColumns.has("assetType") && (
                                    <th className="px-2 py-2.5">Asset Type</th>
                                )}

                                {visibleColumns.has("status") && (
                                    <th className="sticky right-[92px] z-30 w-[9%] border-l border-border bg-background/95 px-2 py-2.5 text-center">
                                        Status
                                    </th>
                                )}

                                <th className="sticky right-0 z-40 w-[92px] border-l border-border bg-background/95 px-2 py-2.5 text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && items.length === 0 && (
                                <tr>
                                    <td colSpan={visibleColumns.size + 2} className="px-4 py-12 text-center text-muted-foreground">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                                            Loading devices...
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && error && (
                                <tr>
                                    <td colSpan={visibleColumns.size + 2} className="px-4 py-12 text-center text-red-600">
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && items.length === 0 && (
                                <tr>
                                    <td colSpan={visibleColumns.size + 2} className="px-4 py-12 text-center text-muted-foreground">
                                        No asset devices found.
                                    </td>
                                </tr>
                            )}

                            {!error && items.map((item, index) => {
                                const employeeName = item.emp_name || item.last_emp_name || "";
                                const employeeID = item.emp_id || item.last_emp_id || "";
                                const employeeImage = item.employee_image || item.last_employee_image;
                                const warrantyExpired = isWarrantyExpired(item.warranty_date);

                                return (
                                    <tr
                                        key={item.id}
                                        onDoubleClick={() => openDevice(item)}
                                        className={`group border-b border-border/70 align-middle transition-colors last:border-b-0 hover:bg-muted/25 ${loading ? "opacity-70" : ""}`}
                                    >
                                        <td className="px-2 py-2 text-center">
                                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted/30 px-1 text-[10px] font-semibold tabular-nums">
                                                {startItem + index}
                                            </span>
                                        </td>

                                        {visibleColumns.has("serial") && (
                                            <td className="px-2.5 py-2">
                                                <div className="truncate font-mono text-[11px] font-semibold text-foreground" title={item.device_serial || undefined}>
                                                    {item.device_serial || "—"}
                                                </div>
                                                <div className="mt-0.5 text-[10px] text-muted-foreground">
                                                    Asset #{item.id}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("device") && (
                                            <td className="px-2.5 py-2">
                                                <div className="truncate text-[11px] font-semibold text-foreground" title={item.category || undefined}>
                                                    {item.category || "Uncategorized"}
                                                </div>
                                                <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                                    {[item.brand, item.model].filter(Boolean).join(" · ") || "—"}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("mrpr") && (
                                            <td className="px-2.5 py-2">
                                                <div className="space-y-1">
                                                    <div className="flex min-w-0 items-center gap-1.5">
                                                        <span className={`inline-flex h-4 shrink-0 items-center rounded border px-1 text-[8px] font-bold uppercase ${item.mr_number?.trim()
                                                            ? "border-blue-200 bg-blue-50 text-blue-700"
                                                            : "border-amber-200 bg-amber-50 text-amber-700"
                                                            }`}>
                                                            {item.mr_number?.trim() ? "MR" : "Petty"}
                                                        </span>
                                                        <span className="min-w-0 truncate font-mono text-[10px] font-semibold text-foreground" title={item.mr_number || undefined}>
                                                            {item.mr_number?.trim() || "Petty Cash"}
                                                        </span>
                                                    </div>

                                                    <div className="flex min-w-0 items-center gap-1.5">
                                                        <span className="inline-flex h-4 shrink-0 items-center rounded border border-violet-200 bg-violet-50 px-1 text-[8px] font-bold uppercase text-violet-700">
                                                            PR
                                                        </span>
                                                        <span className="min-w-0 truncate font-mono text-[10px] text-foreground/85" title={item.pr_number || undefined}>
                                                            {item.pr_number?.trim() || "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("employee") && (
                                            <td className="px-2.5 py-2">
                                                {employeeID ? (
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <EmployeeAvatar
                                                            name={employeeName || null}
                                                            image={employeeImage}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="truncate text-[11px] font-semibold text-foreground" title={employeeName || "Employee"}>
                                                                {employeeName || "Employee"}
                                                            </div>
                                                            <div className="mt-0.5 truncate font-mono text-[10px] font-semibold text-blue-700">
                                                                {employeeID}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/30">
                                                            <UserRound className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-[11px] font-medium">Unassigned</span>
                                                    </div>
                                                )}
                                            </td>
                                        )}

                                        {visibleColumns.has("assignedDate") && (
                                            <td className="px-2.5 py-2 whitespace-nowrap text-[11px] font-medium">
                                                {formatDate(item.assigned_date)}
                                            </td>
                                        )}

                                        {visibleColumns.has("designation") && (
                                            <td className="px-2 py-2">
                                                <div
                                                    className="truncate text-[10px]"
                                                    title={[item.designation, item.department].filter(Boolean).join(" · ") || undefined}
                                                >
                                                    {[item.designation, item.department].filter(Boolean).join(" · ") || "—"}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("brand") && (
                                            <td className="px-2 py-2">
                                                <div className="truncate text-[10px]" title={item.brand || undefined}>
                                                    {item.brand || "—"}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("model") && (
                                            <td className="px-2 py-2">
                                                <div className="truncate text-[10px]" title={item.model || undefined}>
                                                    {item.model || "—"}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("deviceType") && (
                                            <td className="px-2 py-2">
                                                <div className="truncate text-[10px]" title={assignmentDeviceTypeLabel(item.assignment_device_type)}>
                                                    {assignmentDeviceTypeLabel(item.assignment_device_type)}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("vendor") && (
                                            <td className="px-2 py-2">
                                                <div className="truncate text-[10px]" title={item.vendor_name || undefined}>
                                                    {item.vendor_name || "—"}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("actionDate") && (
                                            <td className="px-2 py-2 whitespace-nowrap text-[10px]">
                                                {formatDate(item.status_action_date || item.assigned_date)}
                                            </td>
                                        )}

                                        {visibleColumns.has("purchase") && (
                                            <td className="px-2 py-2 whitespace-nowrap text-[10px]">
                                                {formatDate(item.purchase_date)}
                                            </td>
                                        )}

                                        {visibleColumns.has("warranty") && (
                                            <td className="px-2.5 py-2">
                                                {item.warranty_date ? (
                                                    warrantyExpired ? (
                                                        <div className="text-red-700">
                                                            <div className="flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold">
                                                                <FileWarning className="h-3.5 w-3.5 shrink-0" />
                                                                {formatDate(item.warranty_date)}
                                                            </div>
                                                            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">
                                                                Warranty Expired
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 whitespace-nowrap text-[11px] font-medium">
                                                            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                            {formatDate(item.warranty_date)}
                                                        </div>
                                                    )
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        )}

                                        {visibleColumns.has("deviceAge") && (
                                            <td className="px-2 py-2">
                                                <div className="truncate text-[10px]">
                                                    {formatAssignedDeviceAge(item.assigned_date)}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("usageDuration") && (
                                            <td className="px-2 py-2">
                                                <div className="truncate text-[10px]">
                                                    {formatCompactDuration(item.assigned_date, usageEndDate(item))}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("remarks") && (
                                            <td className="px-2 py-2">
                                                <div
                                                    className="truncate text-[10px]"
                                                    title={(item.remarks || item.history_reason || undefined) as string | undefined}
                                                >
                                                    {item.remarks || item.history_reason || "—"}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("assetType") && (
                                            <td className="px-2 py-2">
                                                <div className="truncate text-[10px]" title={item.device_type || undefined}>
                                                    {item.device_type || "—"}
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.has("status") && (
                                            <td className="sticky right-[92px] z-10 border-l border-border bg-card px-2 py-2 text-center group-hover:bg-muted/25">
                                                <span
                                                    className={`inline-flex max-w-[108px] items-center justify-center truncate whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(item.asset_status)}`}
                                                    title={item.status_label || historyStatusLabel(item.asset_status)}
                                                >
                                                    {item.status_label || historyStatusLabel(item.asset_status)}
                                                </span>
                                            </td>
                                        )}

                                        <td className="sticky right-0 z-20 border-l border-border bg-card px-2 py-2 text-center group-hover:bg-muted/25">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-8 min-w-[76px] items-center justify-center gap-1 rounded-md border border-border bg-background px-2.5 text-[11px] font-semibold shadow-sm hover:bg-muted"
                                                        aria-label={`Actions for ${item.device_serial || "asset device"}`}
                                                    >
                                                        Actions
                                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                    </button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align="end" className="w-64">
                                                    <DropdownMenuLabel className="truncate">
                                                        {item.device_serial || `Asset #${item.id}`} · {item.status_label || historyStatusLabel(item.asset_status)}
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem onClick={() => openDevice(item)} className="gap-2">
                                                        <Eye className="h-4 w-4" />
                                                        Device Details
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem onClick={() => openOperation(item, "history")} className="gap-2">
                                                        <HistoryIcon className="h-4 w-4 text-violet-600" />
                                                        Device History
                                                    </DropdownMenuItem>

                                                    {![8, 15].includes(item.asset_status) && (
                                                        <DropdownMenuItem onClick={() => openOperation(item, "update")} className="gap-2">
                                                            <Pencil className="h-4 w-4 text-amber-600" />
                                                            Update Device
                                                        </DropdownMenuItem>
                                                    )}

                                                    {canAssignNewEmployee(item) && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => openOperation(item, "assign-direct")} className="gap-2">
                                                                <UserPlus className="h-4 w-4 text-primary" />
                                                                Assign to Employee
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openOperation(item, "assign-tt")} className="gap-2">
                                                                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                                                                Assign from Approved TT
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {item.asset_status === 1 && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => openOperation(item, "reassign")} className="gap-2">
                                                                <UserPlus className="h-4 w-4 text-violet-600" />
                                                                Reassign / Correct Employee
                                                            </DropdownMenuItem>
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
                                                        </>
                                                    )}

                                                    {item.asset_status === 4 && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => openOperation(item, "reassign")} className="gap-2">
                                                                <UserPlus className="h-4 w-4 text-primary" />
                                                                Assign Again / Correct Employee
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {canOpenRepairWorkflow(item) && (
                                                        <>
                                                            <DropdownMenuSeparator />

                                                            {item.warranty_date && isWarrantyExpired(item.warranty_date) ? (
                                                                <DropdownMenuItem
                                                                    onClick={() => openOperation(item, "service")}
                                                                    className="gap-2 font-semibold text-red-700 focus:text-red-700"
                                                                >
                                                                    <Wrench className="h-4 w-4" />
                                                                    Service Request
                                                                    <span className="ml-auto text-[8px] font-normal">Expired</span>
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    onClick={() => openOperation(item, "warranty")}
                                                                    className="gap-2 text-violet-700 focus:text-violet-700"
                                                                >
                                                                    <ShieldCheck className="h-4 w-4" />
                                                                    Warranty Claim
                                                                </DropdownMenuItem>
                                                            )}

                                                            {item.asset_status !== 2 && (
                                                                <DropdownMenuItem
                                                                    onClick={() => openOperation(item, "damaged")}
                                                                    className="gap-2 text-orange-700 focus:text-orange-700"
                                                                >
                                                                    <FileWarning className="h-4 w-4" />
                                                                    Mark as Damaged
                                                                </DropdownMenuItem>
                                                            )}

                                                            {item.asset_status !== 5 && (
                                                                <DropdownMenuItem
                                                                    onClick={() => openOperation(item, "lost")}
                                                                    className="gap-2 text-red-700 focus:text-red-700"
                                                                >
                                                                    <Search className="h-4 w-4" />
                                                                    Mark as Lost
                                                                </DropdownMenuItem>
                                                            )}
                                                        </>
                                                    )}

                                                    {item.asset_status === 8 && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => openOperation(item, "warranty-transfer")}
                                                                className="gap-2 font-semibold text-blue-700 focus:text-blue-700"
                                                            >
                                                                <Truck className="h-4 w-4" />
                                                                Warranty Claim Workflow
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {item.asset_status === 15 && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => openOperation(item, "service-transfer")}
                                                                className="gap-2 font-semibold text-cyan-700 focus:text-cyan-700"
                                                            >
                                                                <Wrench className="h-4 w-4" />
                                                                Service Request Workflow
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {item.asset_status === 7 && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => void printExistingOWST(item)}
                                                                className="gap-2"
                                                            >
                                                                <Printer className="h-4 w-4 text-teal-600" />
                                                                OWST Print Preview
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {isRoot && ![8, 15].includes(item.asset_status) && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => openOperation(item, "delete")}
                                                                className="gap-2 text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Delete · ROOT only
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-2 border-t border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{startItem}</span>
                        {" - "}
                        <span className="font-semibold text-foreground">{endItem}</span>
                        {" of "}
                        <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
                    </p>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium hover:bg-muted disabled:opacity-50"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Previous
                        </button>

                        <span className="px-1 text-[11px] text-muted-foreground">
                            Page <span className="font-semibold text-foreground">{page}</span> /{" "}
                            <span className="font-semibold text-foreground">{totalPages}</span>
                        </span>

                        <button
                            type="button"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            <Dialog open={Boolean(operation && selectedAsset)} onOpenChange={(open) => !open && closeOperation()}>
                <DialogContent
                    className={`max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] overflow-y-auto p-0 ${operation === "warranty-transfer" || operation === "service-transfer"
                        ? "sm:max-w-[840px]"
                        : operation === "warranty" || operation === "service"
                            ? "sm:max-w-[920px]"
                            : operation === "owst"
                                ? "sm:max-w-[1080px]"
                                : operation === "assign-direct" || operation === "reassign"
                                    ? "sm:max-w-[980px]"
                                    : operation === "assign-tt"
                                        ? "sm:max-w-[980px]"
                                        : operation === "detail" || operation === "history"
                                            ? "sm:max-w-[980px]"
                                            : operation === "damaged" || operation === "lost"
                                                ? "sm:max-w-[820px]"
                                                : "sm:max-w-[760px]"
                        }`}
                >
                    <DialogHeader className="sticky top-0 z-30 shrink-0 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/90">
                        <DialogTitle>{operationTitle}</DialogTitle>
                        <DialogDescription>
                            {selectedAsset
                                ? operation === "assign-direct" || operation === "reassign"
                                    ? `Review ${selectedAsset.device_serial || `Asset #${selectedAsset.id}`} and select the active employee who will receive this device.`
                                    : operation === "assign-tt"
                                        ? `Available device ${selectedAsset.device_serial || `Asset #${selectedAsset.id}`} · select an approved, undelivered TT for assignment.`
                                        : operation === "transfer"
                                            ? `Transfer ${selectedAsset.device_serial || `Asset #${selectedAsset.id}`} from the current employee to another active employee.`
                                            : operation === "warranty-transfer" || operation === "service-transfer"
                                                ? `Review ${selectedAsset.device_serial || `Asset #${selectedAsset.id}`} ${operation === "service-transfer" ? "service" : "warranty"} lifecycle, vendor handover and next action.`
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
                                    <div className="mb-1.5 flex items-center justify-between gap-2">
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
                                            label="Device Age"
                                            value={formatAssignedDeviceAge(selectedAsset?.assigned_date)}
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
                        <div className="space-y-3 px-4 py-3">
                            <section className="rounded-lg border border-emerald-200 bg-emerald-50/45 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/10">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            Available Device
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            Select one approved, undelivered TT that matches this device category.
                                        </p>
                                    </div>

                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Available · Status 0
                                    </span>
                                </div>

                                <div className="mt-3 grid gap-2 sm:grid-cols-5">
                                    <CompactDeviceInfo
                                        label="Serial"
                                        value={selectedAsset?.device_serial || "—"}
                                        mono
                                    />
                                    <CompactDeviceInfo
                                        label="Device"
                                        value={selectedAsset?.category || "—"}
                                    />
                                    <CompactDeviceInfo
                                        label="Brand / Model"
                                        value={[selectedAsset?.brand, selectedAsset?.model]
                                            .filter(Boolean)
                                            .join(" · ") || "—"}
                                    />
                                    <CompactDeviceInfo
                                        label="SCM Stock Row"
                                        value={
                                            selectedAsset?.stock_inventory_id
                                                ? `#${selectedAsset.stock_inventory_id}`
                                                : "Not linked"
                                        }
                                        mono
                                    />
                                    <CompactDeviceInfo
                                        label="Current Status"
                                        value={
                                            selectedAsset?.asset_status === 0
                                                ? "Available"
                                                : selectedAsset?.status_label ||
                                                historyStatusLabel(selectedAsset?.asset_status)
                                        }
                                    />
                                </div>
                            </section>

                            {!selectedAsset?.stock_inventory_id && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                                    This asset has no linked SCM stock row. TT allocation requires an SCM stock link.
                                </div>
                            )}

                            <section className="overflow-hidden rounded-lg border border-border bg-background">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2.5">
                                    <div>
                                        <p className="text-[12px] font-semibold text-foreground">
                                            Approved TT Requisitions
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                            Category match: {selectedAsset?.category || "Uncategorized"}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                            Approved Available · {requisitionLoading ? "…" : requisitionTotalApproved}
                                        </span>

                                        {selectedRequisition && (
                                            <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold text-primary">
                                                1 Selected
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="border-b border-border p-2.5">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            value={requisitionQuery}
                                            onChange={(event) => setRequisitionQuery(event.target.value)}
                                            placeholder="Search TT number, employee ID or employee name..."
                                            autoComplete="off"
                                            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <div className="max-h-[320px] overflow-y-auto">
                                    {requisitionLoading ? (
                                        <div className="flex items-center justify-center gap-2 px-3 py-8 text-[11px] text-muted-foreground">
                                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                                            Loading approved TT requisitions...
                                        </div>
                                    ) : requisitionResults.length === 0 ? (
                                        <div className="px-3 py-8 text-center">
                                            <p className="text-[12px] font-semibold text-foreground">
                                                No approved TT available
                                            </p>
                                            <p className="mt-1 text-[10px] text-muted-foreground">
                                                There is no approved, undelivered TT matching this device category.
                                            </p>
                                        </div>
                                    ) : (
                                        requisitionResults.map((req, index) => (
                                            <button
                                                type="button"
                                                key={req.id}
                                                onClick={() => setSelectedRequisition(req)}
                                                className={`grid w-full grid-cols-[36px_minmax(135px,0.8fr)_minmax(180px,1.2fr)_minmax(120px,0.8fr)_105px] items-center gap-2 border-b border-border px-3 py-2.5 text-left text-[11px] transition-colors last:border-b-0 ${selectedRequisition?.id === req.id
                                                        ? "bg-primary/[0.07]"
                                                        : "hover:bg-muted/35"
                                                    }`}
                                            >
                                                <span className="text-center text-[10px] font-semibold text-muted-foreground">
                                                    {index + 1}
                                                </span>

                                                <div className="min-w-0">
                                                    <p className="truncate font-mono text-[11px] font-semibold text-foreground">
                                                        {req.tt_no}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                                                        {req.approved_date
                                                            ? `Approved ${formatDate(req.approved_date)}`
                                                            : "Approved"}
                                                    </p>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-[11px] font-semibold text-foreground">
                                                        {req.employee_name || "Employee"}
                                                    </p>
                                                    <p className="mt-0.5 truncate font-mono text-[9px] font-semibold text-blue-700">
                                                        {req.employee_id || "—"}
                                                    </p>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-[10px] font-medium text-foreground">
                                                        {req.category || "—"}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                                                        {[req.brand, req.model].filter(Boolean).join(" · ") || "—"}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                                                        {req.approved_val === 3
                                                            ? "PR Approved"
                                                            : "Petty Approved"}
                                                    </span>

                                                    {selectedRequisition?.id === req.id && (
                                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </section>

                            {selectedRequisition && (
                                <section className="rounded-lg border border-primary/20 bg-primary/[0.035] p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                Selected TT
                                            </p>
                                            <p className="mt-0.5 text-[13px] font-semibold text-foreground">
                                                {selectedRequisition.tt_no}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                            Ready for assignment
                                        </span>
                                    </div>

                                    <div className="mt-2 grid gap-2 sm:grid-cols-4">
                                        <CompactDeviceInfo
                                            label="Employee ID"
                                            value={selectedRequisition.employee_id || "—"}
                                            mono
                                        />
                                        <CompactDeviceInfo
                                            label="Employee Name"
                                            value={selectedRequisition.employee_name || "—"}
                                        />
                                        <CompactDeviceInfo
                                            label="Approval"
                                            value={
                                                selectedRequisition.approval_status ||
                                                (selectedRequisition.approved_val === 3
                                                    ? "PR (Approved)"
                                                    : "Petty Cash (Approved)")
                                            }
                                        />
                                        <CompactDeviceInfo
                                            label="Approved By"
                                            value={
                                                [
                                                    selectedRequisition.approved_by,
                                                    selectedRequisition.approved_by_name,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" · ") || "—"
                                            }
                                        />
                                    </div>
                                </section>
                            )}

                            <label className="block rounded-lg border border-amber-200 bg-amber-50/65 p-3 dark:border-amber-900/50 dark:bg-amber-950/10">
                                <span className="mb-1 flex items-center justify-between text-[11px] font-semibold text-amber-900 dark:text-amber-100">
                                    <span>Assignment / Delivery Remarks</span>
                                    <span className="font-normal text-amber-700 dark:text-amber-300">
                                        {remarks.length}/1000
                                    </span>
                                </span>
                                <textarea
                                    value={remarks}
                                    onChange={(event) => setRemarks(event.target.value)}
                                    rows={2}
                                    maxLength={1000}
                                    placeholder="Optional handover, delivery or TT note"
                                    className="w-full resize-none rounded-md border border-amber-200 bg-white px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-amber-200 dark:border-amber-900/60 dark:bg-background"
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
                        <div className="space-y-2.5 px-4 py-2.5">
                            <CompactOperationSummary asset={selectedAsset} />

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
                        <div className="space-y-2.5 px-4 py-2.5">
                            <CompactOperationSummary asset={selectedAsset} />

                            <section className="rounded-lg border border-emerald-200 bg-emerald-50/45 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/10">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                                            Return Device
                                        </p>
                                        <p className="mt-0.5 text-[11px] leading-4 text-emerald-800/80 dark:text-emerald-200/80">
                                            Close the current employee assignment and move the device to Returned. The employee and assignment history remain preserved for audit and future reassignment.
                                        </p>
                                    </div>

                                    <span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                        New status · Returned (4)
                                    </span>
                                </div>

                                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                                    <CompactDeviceInfo
                                        label="Current Employee"
                                        value={
                                            selectedAsset?.emp_id
                                                ? `${selectedAsset.emp_name || "Employee"} · ${selectedAsset.emp_id}`
                                                : "IT Stock / No employee"
                                        }
                                    />
                                    <CompactDeviceInfo
                                        label="Assigned Date"
                                        value={formatDate(selectedAsset?.assigned_date)}
                                    />
                                    <CompactDeviceInfo
                                        label="Current Status"
                                        value={
                                            selectedAsset?.status_label ||
                                            historyStatusLabel(selectedAsset?.asset_status)
                                        }
                                    />

                                    <label className="min-w-0 rounded-md border border-emerald-200 bg-background px-2 py-1.5">
                                        <span className="block truncate text-[9px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                                            Return Date
                                        </span>
                                        <input
                                            type="date"
                                            value={returnDate}
                                            max={todayInputValue()}
                                            onChange={(event) => setReturnDate(event.target.value)}
                                            className="mt-0.5 h-6 w-full bg-transparent text-[11px] font-medium text-foreground outline-none"
                                        />
                                    </label>
                                </div>

                                <label className="mt-3 block rounded-lg border border-amber-200 bg-amber-50/65 p-2.5 dark:border-amber-900/50 dark:bg-amber-950/10">
                                    <span className="mb-1 flex items-center justify-between text-[10px] font-semibold text-amber-900 dark:text-amber-100">
                                        <span>Return Remarks</span>
                                        <span className="font-normal text-amber-700 dark:text-amber-300">
                                            {remarks.length}/1000
                                        </span>
                                    </span>
                                    <textarea
                                        value={remarks}
                                        onChange={(event) => setRemarks(event.target.value)}
                                        rows={3}
                                        maxLength={1000}
                                        placeholder="Condition, accessories returned, location, handover details or return note..."
                                        className="min-h-[78px] w-full resize-none rounded-md border border-amber-200 bg-white px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-amber-200 dark:border-amber-900/60 dark:bg-background"
                                    />
                                </label>
                            </section>
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
                                        value={`${authUser?.full_name ||
                                            authUser?.username ||
                                            authUser?.employee_id ||
                                            "Current user"
                                            } · ${formatDateTime(new Date().toISOString())}`}
                                    />
                                </div>
                            </section>

                            <div className="grid gap-2.5 xl:grid-cols-2">
                                <section className={`rounded-xl border p-2.5 ${owstType === "user"
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
                                                    Device age: {formatAssignedDeviceAge(selectedAsset?.assigned_date)}
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
                                        <CompactDeviceInfo label="Device Age" value={formatAssignedDeviceAge(selectedAsset?.assigned_date)} />
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
                        <div className="space-y-2 px-4 py-2.5">
                            <CompactOperationSummary asset={selectedAsset} />

                            <section
                                className={`rounded-lg border p-3 ${operation === "damaged"
                                    ? "border-orange-200 bg-orange-50/45 dark:border-orange-900/50 dark:bg-orange-950/10"
                                    : "border-red-200 bg-red-50/45 dark:border-red-900/50 dark:bg-red-950/10"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${operation === "damaged"
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {operation === "damaged" ? (
                                            <FileWarning className="h-4.5 w-4.5" />
                                        ) : (
                                            <Search className="h-4.5 w-4.5" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {operation === "damaged"
                                                        ? "Record Damaged Device"
                                                        : "Record Lost Device"}
                                                </p>
                                                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                                                    {operation === "damaged"
                                                        ? "Record the observed date and a concise condition note. Employee accountability and device history remain preserved."
                                                        : "Record the reported/lost date and the last-known details. Employee accountability and device history remain preserved."}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${operation === "damaged"
                                                    ? "border-orange-200 bg-white text-orange-700"
                                                    : "border-red-200 bg-white text-red-700"
                                                    }`}
                                            >
                                                {operation === "damaged" ? "New status · Damaged (2)" : "New status · Lost (5)"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                                    <CompactDeviceInfo
                                        label="Current Status"
                                        value={
                                            selectedAsset?.status_label ||
                                            historyStatusLabel(selectedAsset?.asset_status)
                                        }
                                    />
                                    <CompactDeviceInfo
                                        label="Responsible Employee"
                                        value={
                                            selectedAsset?.emp_id
                                                ? `${selectedAsset.emp_name || "Employee"} · ${selectedAsset.emp_id}`
                                                : "IT Stock / No employee"
                                        }
                                    />
                                    <CompactDeviceInfo
                                        label="Assigned Date"
                                        value={formatDate(selectedAsset?.assigned_date)}
                                    />

                                    <label className="min-w-0 rounded-md border border-border/70 bg-background px-2 py-1.5">
                                        <span className="block truncate text-[9px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                                            {operation === "damaged" ? "Damage Date" : "Lost / Reported Date"}
                                        </span>
                                        <input
                                            type="date"
                                            value={incidentDate}
                                            max={todayInputValue()}
                                            onChange={(event) => setIncidentDate(event.target.value)}
                                            className="mt-0.5 h-6 w-full bg-transparent text-[11px] font-medium text-foreground outline-none"
                                        />
                                    </label>
                                </div>

                                <div
                                    className={`mt-3 rounded-md border px-2.5 py-2 text-[10px] leading-4 ${operation === "damaged"
                                        ? "border-orange-200 bg-white/70 text-orange-900"
                                        : "border-red-200 bg-white/70 text-red-900"
                                        }`}
                                >
                                    {operation === "damaged"
                                        ? "Use the remarks for physical condition, affected parts, present location and required follow-up. The selected date is saved with the audit remarks."
                                        : "Use the remarks for last-known location, responsible user, report/reference details and follow-up. The selected date is saved with the audit remarks."}
                                </div>

                                <label className="mt-3 block">
                                    <span
                                        className={`mb-1 flex items-center justify-between text-[10px] font-semibold ${operation === "damaged"
                                            ? "text-orange-900 dark:text-orange-100"
                                            : "text-red-900 dark:text-red-100"
                                            }`}
                                    >
                                        <span>
                                            {operation === "damaged"
                                                ? "Damage Details"
                                                : "Lost Device Details"}{" "}
                                            <span className="text-red-500">*</span>
                                        </span>
                                        <span className="font-normal text-muted-foreground">
                                            {remarks.length}/1000
                                        </span>
                                    </span>
                                    <textarea
                                        value={remarks}
                                        onChange={(event) => setRemarks(event.target.value)}
                                        rows={3}
                                        maxLength={1000}
                                        className="min-h-[78px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder={
                                            operation === "damaged"
                                                ? "Condition, affected parts, location, responsible person and required action..."
                                                : "Last-known location/time, responsible person, report/reference and follow-up action..."
                                        }
                                    />
                                </label>
                            </section>
                        </div>
                    )}

                    {(operation === "warranty" || operation === "service") && (
                        <div className="space-y-2 px-3 py-2">
                            <section className="rounded-lg border border-border bg-muted/20 p-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-foreground">
                                            {operation === "service" ? "Service Request" : "Warranty Claim"} · {selectedAsset?.device_serial || `Asset #${selectedAsset?.id}`}
                                        </p>
                                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                            {[selectedAsset?.category, selectedAsset?.brand, selectedAsset?.model].filter(Boolean).join(" · ") || "Device"}
                                        </p>
                                    </div>

                                    {selectedAsset?.warranty_date && isWarrantyExpired(selectedAsset.warranty_date) ? (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                            <FileWarning className="h-3 w-3" />
                                            Warranty Expired · {formatDate(selectedAsset.warranty_date)}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                            <ShieldCheck className="h-3 w-3" />
                                            Warranty {selectedAsset?.warranty_date ? formatDate(selectedAsset.warranty_date) : "Not Recorded"}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-2 grid gap-1.5 sm:grid-cols-4">
                                    <CompactDeviceInfo label="Employee ID" value={selectedAsset?.emp_id || selectedAsset?.last_emp_id || "—"} mono />
                                    <CompactDeviceInfo label="Employee Name" value={selectedAsset?.emp_name || selectedAsset?.last_emp_name || "—"} />
                                    <CompactDeviceInfo label="Assigned Date" value={formatDate(selectedAsset?.assigned_date)} />
                                    <CompactDeviceInfo label="Current Status" value={selectedAsset?.status_label || historyStatusLabel(selectedAsset?.asset_status)} />
                                </div>
                            </section>

                            <section className="rounded-lg border border-cyan-200/80 bg-cyan-50/25 p-2.5 dark:border-cyan-900/50 dark:bg-cyan-950/10">
                                <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_1fr]">
                                    <label className="block">
                                        <span className="mb-1 block text-[10px] font-semibold text-foreground">
                                            {operation === "service" ? "Service Vendor" : "Warranty Vendor"} <span className="text-red-500">*</span>
                                        </span>
                                        <select
                                            value={warrantyVendorID}
                                            onChange={(event) => setWarrantyVendorID(event.target.value)}
                                            disabled={owstVendorsLoading}
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[11px] outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                        >
                                            <option value="">{owstVendorsLoading ? "Loading vendors..." : "-- Select vendor --"}</option>
                                            {owstVendors.map((vendor) => (
                                                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <CompactDeviceInfo label="Vendor Mobile" value={selectedWarrantyVendor?.mobile || "—"} />
                                    <CompactDeviceInfo label="Vendor Email" value={selectedWarrantyVendor?.email || "—"} />
                                </div>
                            </section>

                            <section className="rounded-lg border border-border bg-background p-2.5">
                                <div className="grid gap-2 md:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-1 block text-[10px] font-semibold text-foreground">
                                            Problem <span className="text-red-500">*</span>
                                        </span>
                                        <textarea
                                            value={warrantyProblems}
                                            onChange={(event) => setWarrantyProblems(event.target.value)}
                                            rows={2}
                                            maxLength={2000}
                                            className="min-h-[58px] w-full resize-none rounded-md border border-input bg-background px-2.5 py-2 text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder={operation === "service" ? "Describe service problem..." : "Describe warranty problem..."}
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-1 flex items-center justify-between text-[10px] font-semibold text-foreground">
                                            <span>IT Remarks <span className="text-red-500">*</span></span>
                                            <span className="font-normal text-muted-foreground">{remarks.length}/1000</span>
                                        </span>
                                        <textarea
                                            value={remarks}
                                            onChange={(event) => setRemarks(event.target.value)}
                                            rows={2}
                                            maxLength={1000}
                                            className="min-h-[58px] w-full resize-none rounded-md border border-input bg-background px-2.5 py-2 text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="IT feedback / vendor instruction..."
                                        />
                                    </label>
                                </div>

                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold text-foreground">
                                            <span>
                                                Designated Email (To) <span className="text-red-500">*</span>
                                            </span>
                                            <span className="font-normal text-muted-foreground">
                                                Vendor directory
                                            </span>
                                        </span>
                                        <input
                                            type="email"
                                            list="vendor-designated-email-options"
                                            value={warrantyEmailTo}
                                            onChange={(event) => setWarrantyEmailTo(event.target.value)}
                                            placeholder={
                                                owstVendorsLoading
                                                    ? "Loading vendor emails..."
                                                    : "Search or select vendor email"
                                            }
                                            autoComplete="off"
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <datalist id="vendor-designated-email-options">
                                            {vendorEmailOptions.map((item) => (
                                                <option
                                                    key={`${item.vendorID}-${item.email}`}
                                                    value={item.email}
                                                    label={item.vendorName}
                                                />
                                            ))}
                                        </datalist>
                                        <p className="mt-1 truncate text-[9px] text-muted-foreground">
                                            {selectedWarrantyVendor?.email
                                                ? `Selected vendor: ${selectedWarrantyVendor.name} · ${selectedWarrantyVendor.email}`
                                                : vendorEmailOptions.length > 0
                                                    ? `${vendorEmailOptions.length} vendor email${vendorEmailOptions.length === 1 ? "" : "s"} available`
                                                    : "No vendor email is available in the vendor master."}
                                        </p>
                                    </label>

                                    <label className="block">
                                        <span className="mb-1 block text-[10px] font-semibold text-foreground">
                                            Designated Email (CC) <span className="text-red-500">*</span>
                                        </span>
                                        <input
                                            type="text"
                                            value={warrantyEmailCC}
                                            onChange={(event) => setWarrantyEmailCC(event.target.value)}
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[11px] outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </label>
                                </div>
                            </section>
                        </div>
                    )}

                    {(operation === "warranty-transfer" || operation === "service-transfer") && (
                        <div className="space-y-2 px-3 py-2">
                            {warrantyClaimLoading ? (
                                <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-10 text-xs text-muted-foreground">
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Loading active warranty claim...
                                </div>
                            ) : !activeWarrantyClaim ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    No active Claim Raised record was found for this device.
                                </div>
                            ) : (
                                <>
                                    <section
                                        className={
                                            effectiveWarrantyLifecycle === "WITH_VENDOR"
                                                ? "grid gap-2"
                                                : "grid gap-2 lg:grid-cols-2"
                                        }
                                    >
                                        <div className="rounded-lg border border-violet-200/80 bg-violet-50/40 p-2.5 dark:border-violet-900/50 dark:bg-violet-950/10">
                                            <div className="mb-2 flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold">Warranty Claim</p>
                                                    <p className="mt-0.5 font-mono text-[11px] font-semibold text-violet-700">
                                                        {activeWarrantyClaim.claim_no}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${effectiveWarrantyLifecycle === "WITH_VENDOR"
                                                        ? "border-blue-200 bg-blue-50 text-blue-700"
                                                        : effectiveWarrantyLifecycle === "RECEIVED"
                                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                            : "border-pink-200 bg-pink-50 text-pink-700"
                                                        }`}
                                                >
                                                    {effectiveWarrantyLifecycle === "WITH_VENDOR"
                                                        ? "Transferred to Vendor"
                                                        : effectiveWarrantyLifecycle === "RECEIVED"
                                                            ? "Received from Vendor"
                                                            : "Claim Raised"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                                <CompactDeviceInfo
                                                    label="Claim Raised"
                                                    value={formatDateTime(activeWarrantyClaim.created_at)}
                                                />
                                                <CompactDeviceInfo
                                                    label="Warranty Vendor"
                                                    value={activeWarrantyClaim.vendor_name || selectedAsset?.vendor_name}
                                                />
                                                <CompactDeviceInfo
                                                    label="Device Serial"
                                                    value={selectedAsset?.device_serial}
                                                    mono
                                                />
                                                <CompactDeviceInfo
                                                    label="Current Holder"
                                                    value={
                                                        selectedAsset?.emp_name
                                                            ? `${selectedAsset.emp_name} · ${selectedAsset.emp_id || ""}`
                                                            : selectedAsset?.last_emp_name || "IT Stock"
                                                    }
                                                />
                                            </div>
                                            <div className="mt-1.5 border-t border-border pt-1.5 xl:col-span-4">
                                                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Problem / Claim Reason
                                                </p>
                                                <p className="mt-1 whitespace-pre-wrap text-xs">
                                                    {activeWarrantyClaim.problem || "—"}
                                                </p>
                                            </div>
                                        </div>

                                        {effectiveWarrantyLifecycle === "OPEN" && (
                                            <div className="rounded-lg border border-sky-200/80 bg-sky-50/40 p-2.5 dark:border-sky-900/50 dark:bg-sky-950/10">
                                                <p className="text-xs font-semibold">Vendor Recipient Information</p>
                                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                    These fields become part of the warranty audit trail and gate-pass record.
                                                </p>

                                                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                                                    <label className="block">
                                                        <span className="mb-1 block text-[10px] font-semibold">
                                                            Recipient Name <span className="text-red-500">*</span>
                                                        </span>
                                                        <input
                                                            value={vendorReceiver}
                                                            disabled={effectiveWarrantyLifecycle !== "OPEN"}
                                                            onChange={(event) => setVendorReceiver(event.target.value)}
                                                            maxLength={150}
                                                            placeholder="Vendor receiving person"
                                                            className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    </label>

                                                    <label className="block">
                                                        <span className="mb-1 block text-[10px] font-semibold">
                                                            Recipient Mobile <span className="text-red-500">*</span>
                                                        </span>
                                                        <input
                                                            value={vendorReceiverMobile}
                                                            disabled={effectiveWarrantyLifecycle !== "OPEN"}
                                                            onChange={(event) =>
                                                                setVendorReceiverMobile(
                                                                    event.target.value.replace(/\D/g, "").slice(0, 11),
                                                                )
                                                            }
                                                            inputMode="numeric"
                                                            maxLength={11}
                                                            placeholder="01XXXXXXXXX"
                                                            className="h-9 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    </label>

                                                    <label className="block">
                                                        <span className="mb-1 block text-[10px] font-semibold">
                                                            Gate Pass Date <span className="text-red-500">*</span>
                                                        </span>
                                                        <input
                                                            type="date"
                                                            value={vendorGatePassDate}
                                                            disabled={effectiveWarrantyLifecycle !== "OPEN"}
                                                            onChange={(event) => setVendorGatePassDate(event.target.value)}
                                                            className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                                        />
                                                    </label>

                                                    <div className="rounded-md border border-border bg-background p-2">
                                                        <p className="text-[10px] font-semibold">IT Responsible Personnel</p>
                                                        <p className="mt-1 text-xs font-medium">
                                                            {authUser?.full_name || authUser?.username || "Current IT user"}
                                                        </p>
                                                        <p className="font-mono text-[10px] text-primary">
                                                            {authUser?.employee_id || "Signed-in user"}
                                                        </p>
                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    {effectiveWarrantyLifecycle === "WITH_VENDOR" && (
                                        <div className="space-y-2">
                                            <section className="overflow-hidden rounded-lg border border-violet-200 bg-background shadow-sm dark:border-violet-900/50">
                                                <div className="flex items-center justify-between gap-2 border-b border-violet-100 bg-violet-50/55 px-2.5 py-1.5 dark:border-violet-900/40 dark:bg-violet-950/15">
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-semibold text-violet-950 dark:text-violet-100">
                                                            Claimed Information
                                                        </p>
                                                        <p className="truncate text-[9px] text-muted-foreground">
                                                            Select the next warranty status and record IT feedback.
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 rounded-full border border-violet-200 bg-background px-2 py-0.5 text-[9px] font-semibold text-violet-700">
                                                        Step 3
                                                    </span>
                                                </div>

                                                <div className="grid gap-2 p-2 md:grid-cols-[1fr_190px]">
                                                    <label className="block">
                                                        <span className="mb-1 block text-[10px] font-semibold text-red-700">
                                                            IT Feedback <span className="text-red-600">*</span>
                                                        </span>
                                                        <textarea
                                                            value={warrantyWorkflowFeedback}
                                                            onChange={(event) =>
                                                                setWarrantyWorkflowFeedback(event.target.value)
                                                            }
                                                            rows={1}
                                                            maxLength={1500}
                                                            placeholder="Write IT feedback..."
                                                            className="min-h-[32px] w-full resize-none rounded-md border border-red-300 bg-red-50/25 px-2 py-1 text-xs outline-none transition focus:border-red-500 focus:bg-background focus:ring-2 focus:ring-red-200 dark:border-red-900/60 dark:bg-red-950/10"
                                                        />
                                                    </label>

                                                    <label className="block">
                                                        <span className="mb-1 block text-[10px] font-semibold text-red-700">
                                                            Status <span className="text-red-600">*</span>
                                                        </span>
                                                        <select
                                                            value={warrantyWorkflowStatus}
                                                            onChange={(event) =>
                                                                setWarrantyWorkflowStatus(
                                                                    event.target.value as "9" | "10",
                                                                )
                                                            }
                                                            className="h-8 w-full rounded-md border border-red-300 bg-red-50/25 px-2.5 text-xs font-semibold outline-none transition focus:border-red-500 focus:bg-background focus:ring-2 focus:ring-red-200 dark:border-red-900/60 dark:bg-red-950/10"
                                                        >
                                                            <option value="10">Closed</option>
                                                            <option value="9">Transferred to Vendor</option>
                                                        </select>
                                                        <p className="mt-1 text-[9px] leading-3 text-muted-foreground">
                                                            Closed restores the saved pre-claim status.
                                                        </p>
                                                    </label>
                                                </div>
                                            </section>

                                            <section className="overflow-hidden rounded-lg border border-sky-200 bg-background shadow-sm dark:border-sky-900/50">
                                                <div className="flex items-center justify-between gap-2 border-b border-sky-100 bg-sky-50/55 px-2.5 py-1.5 dark:border-sky-900/40 dark:bg-sky-950/15">
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-semibold text-sky-950 dark:text-sky-100">
                                                            Vendor Recipient/Delivery-Man Information
                                                        </p>
                                                        <p className="truncate text-[9px] text-muted-foreground">
                                                            Select a previous recipient or type a new name.
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 text-[9px] font-medium text-red-600">
                                                        * Mandatory
                                                    </span>
                                                </div>

                                                <div className="grid gap-1.5 p-2 md:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr]">
                                                    <label className="block">
                                                        <span className="mb-1 block text-[10px] font-semibold text-red-700">
                                                            Recipient / Delivery-Man Name <span className="text-red-600">*</span>
                                                        </span>
                                                        <input
                                                            list="warranty-recipient-suggestions"
                                                            value={workflowRecipientName}
                                                            onChange={(event) => {
                                                                const value = event.target.value;
                                                                setWorkflowRecipientName(value);

                                                                const match =
                                                                    workflowRecipientSuggestions.find(
                                                                        (item) =>
                                                                            item.name
                                                                                .trim()
                                                                                .toLowerCase() ===
                                                                            value
                                                                                .trim()
                                                                                .toLowerCase(),
                                                                    );

                                                                if (match?.mobile) {
                                                                    setWorkflowRecipientMobile(
                                                                        match.mobile,
                                                                    );
                                                                }
                                                            }}
                                                            placeholder="Type name or choose suggestion"
                                                            autoComplete="off"
                                                            className="h-8 w-full rounded-md border border-red-300 bg-red-50/25 px-2.5 text-xs outline-none transition focus:border-red-500 focus:bg-background focus:ring-2 focus:ring-red-200 dark:border-red-900/60 dark:bg-red-950/10"
                                                        />
                                                        <datalist id="warranty-recipient-suggestions">
                                                            {workflowRecipientSuggestions.map(
                                                                (item) => (
                                                                    <option
                                                                        key={`${item.name}-${item.mobile}`}
                                                                        value={item.name}
                                                                    >
                                                                        {item.mobile || "Previous recipient"}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </datalist>
                                                        <p className="mt-1 text-[9px] leading-3 text-muted-foreground">
                                                            Existing recipient auto-fills mobile; new names are allowed.
                                                        </p>
                                                    </label>

                                                    <label className="block">
                                                        <span className="mb-1 block text-[10px] font-semibold text-red-700">
                                                            Mobile <span className="text-red-600">*</span>
                                                        </span>
                                                        <input
                                                            value={workflowRecipientMobile}
                                                            onChange={(event) =>
                                                                setWorkflowRecipientMobile(
                                                                    event.target.value
                                                                        .replace(/\D/g, "")
                                                                        .slice(0, 11),
                                                                )
                                                            }
                                                            inputMode="numeric"
                                                            placeholder="01XXXXXXXXX"
                                                            className="h-8 w-full rounded-md border border-red-300 bg-red-50/25 px-2.5 font-mono text-xs outline-none transition focus:border-red-500 focus:bg-background focus:ring-2 focus:ring-red-200 dark:border-red-900/60 dark:bg-red-950/10"
                                                        />
                                                    </label>

                                                    <label className="block">
                                                        <span
                                                            className={`mb-1 block text-[10px] font-semibold ${warrantyWorkflowStatus === "9"
                                                                ? "text-red-700"
                                                                : "text-foreground"
                                                                }`}
                                                        >
                                                            Gate Pass Date
                                                            {warrantyWorkflowStatus === "9" && (
                                                                <span className="text-red-600"> *</span>
                                                            )}
                                                        </span>
                                                        <input
                                                            type="date"
                                                            value={workflowGatePassDate}
                                                            onChange={(event) =>
                                                                setWorkflowGatePassDate(event.target.value)
                                                            }
                                                            disabled={warrantyWorkflowStatus === "10"}
                                                            className={`h-9 w-full rounded-md px-2.5 text-xs outline-none transition disabled:cursor-not-allowed disabled:bg-muted/40 ${warrantyWorkflowStatus === "9"
                                                                ? "border border-red-300 bg-red-50/25 focus:border-red-500 focus:bg-background focus:ring-2 focus:ring-red-200"
                                                                : "border border-input bg-background"
                                                                }`}
                                                        />
                                                    </label>
                                                </div>

                                                {warrantyWorkflowStatus === "9" && (
                                                    <div className="grid gap-1.5 border-t border-sky-100 p-2 lg:grid-cols-[1fr_1fr] dark:border-sky-900/40">
                                                        <label className="block">
                                                            <span className="mb-1 block text-[10px] font-semibold text-red-700">
                                                                Gate Pass Remarks <span className="text-red-600">*</span>
                                                            </span>
                                                            <textarea
                                                                value={workflowGatePassRemarks}
                                                                onChange={(event) =>
                                                                    setWorkflowGatePassRemarks(event.target.value)
                                                                }
                                                                rows={1}
                                                                maxLength={1000}
                                                                placeholder="Gate pass / vendor handover remarks..."
                                                                className="min-h-[32px] w-full resize-none rounded-md border border-red-300 bg-red-50/25 px-2 py-1 text-xs outline-none transition focus:border-red-500 focus:bg-background focus:ring-2 focus:ring-red-200 dark:border-red-900/60 dark:bg-red-950/10"
                                                            />
                                                        </label>

                                                        <div className="rounded-md border border-sky-200 bg-sky-50/20 p-1.5 dark:border-sky-900/50 dark:bg-sky-950/10">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex min-w-0 items-center gap-2">
                                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-sky-200 bg-background text-sky-700">
                                                                        <Paperclip className="h-3 w-3" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[10px] font-semibold">
                                                                            Attached File
                                                                        </p>
                                                                        <p className="truncate text-[9px] text-muted-foreground">
                                                                            JPG, PNG, PDF, TXT, Office · max 4 MB
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {warrantyWorkflowAttachment && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setWarrantyWorkflowAttachment(null)
                                                                        }
                                                                        className="shrink-0 rounded-md px-2 py-1 text-[9px] font-semibold text-red-600 hover:bg-red-50"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <input
                                                                type="file"
                                                                accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                                onChange={(event) =>
                                                                    setWarrantyWorkflowAttachment(
                                                                        event.target.files?.[0] ?? null,
                                                                    )
                                                                }
                                                                className="mt-1 block w-full rounded-md border border-sky-200 bg-background px-1.5 py-0.5 text-[10px] file:mr-2 file:rounded file:border-0 file:bg-sky-100 file:px-2 file:py-0.5 file:text-[10px] file:font-semibold file:text-sky-800"
                                                            />

                                                            {warrantyWorkflowAttachment && (
                                                                <div className="mt-1 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 p-1">
                                                                    {warrantyWorkflowAttachmentPreview ? (
                                                                        <img
                                                                            src={warrantyWorkflowAttachmentPreview}
                                                                            alt="Selected attachment preview"
                                                                            className="h-9 w-12 shrink-0 rounded border border-emerald-200 bg-white object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded border border-emerald-200 bg-white">
                                                                            <FileText className="h-4 w-4 text-emerald-600" />
                                                                        </div>
                                                                    )}

                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                                            <p className="truncate text-[10px] font-semibold text-emerald-900">
                                                                                {warrantyWorkflowAttachment.name}
                                                                            </p>
                                                                        </div>
                                                                        <p className="mt-0.5 text-[9px] text-emerald-800/70">
                                                                            {(warrantyWorkflowAttachment.size / 1024).toFixed(1)} KB · selected and ready
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {warrantyWorkflowStatus === "10" && (
                                                    <div className="border-t border-emerald-100 bg-emerald-50/60 px-2.5 py-1.5 text-[10px] font-medium text-emerald-800">
                                                        Closing will automatically restore the saved pre-claim device status.
                                                    </div>
                                                )}
                                            </section>
                                        </div>
                                    )}

                                    {effectiveWarrantyLifecycle === "WITH_VENDOR" && previousVendorHandover && (
                                        <section className="rounded-lg border border-slate-200 bg-slate-50/35 p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-950/20">
                                            <div className="mb-2 flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-xs font-semibold">Previous Vendor Handover</p>
                                                    <p className="text-[9px] text-muted-foreground">
                                                        Read-only snapshot from Step 2 · shown for quick comparison.
                                                    </p>
                                                </div>
                                                <span className="rounded-full border border-slate-200 bg-background px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                                                    {formatDateTime(previousVendorHandover.changed_at)}
                                                </span>
                                            </div>

                                            <div className="grid gap-x-3 gap-y-1 md:grid-cols-2 xl:grid-cols-4">
                                                <CompactDeviceInfo
                                                    label="Vendor"
                                                    value={String(
                                                        previousVendorMetadata?.vendor_name ||
                                                        activeWarrantyClaim.vendor_name ||
                                                        "—",
                                                    )}
                                                />
                                                <CompactDeviceInfo
                                                    label="Receiver"
                                                    value={previousVendorHandover.vendor_personnel_name || "—"}
                                                />
                                                <CompactDeviceInfo
                                                    label="Receiver Mobile"
                                                    value={previousVendorHandover.vendor_mobile || "—"}
                                                    mono
                                                />
                                                <CompactDeviceInfo
                                                    label="Gate Pass Date"
                                                    value={String(previousVendorMetadata?.gate_pass_date || "—")}
                                                />
                                            </div>

                                            <div className="mt-1.5 grid gap-1.5 lg:grid-cols-2">
                                                <div className="rounded-md border border-border bg-background px-2.5 py-2">
                                                    <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Gate Pass / Vendor Handover Comment
                                                    </p>
                                                    <p className="mt-1 whitespace-pre-wrap text-[11px]">
                                                        {String(
                                                            previousVendorMetadata?.gate_pass_remarks ||
                                                            previousVendorHandover.remarks ||
                                                            "—",
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="rounded-md border border-border bg-background px-2.5 py-2">
                                                    <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        IT Transfer Comment
                                                    </p>
                                                    <p className="mt-1 whitespace-pre-wrap text-[11px]">
                                                        {previousVendorHandover.remarks || "—"}
                                                    </p>
                                                </div>
                                            </div>

                                            {previousVendorHandover.attach_file && activeWarrantyClaim && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const attachmentName =
                                                            previousVendorHandover.attach_file
                                                                ?.split(/[\\/]/)
                                                                .pop() || "attachment";

                                                        void downloadWarrantyAttachment(
                                                            activeWarrantyClaim.id,
                                                            previousVendorHandover.id,
                                                            attachmentName,
                                                        ).catch((reason) => {
                                                            setOperationError(
                                                                reason instanceof Error
                                                                    ? reason.message
                                                                    : "Unable to download previous attachment.",
                                                            );
                                                        });
                                                    }}
                                                    className="mt-2 flex w-full items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-2.5 py-2 text-left text-blue-800 hover:bg-blue-100"
                                                >
                                                    <Paperclip className="h-4 w-4 shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[10px] font-semibold">
                                                            {previousVendorHandover.attach_file
                                                                .split(/[\\/]/)
                                                                .pop()}
                                                        </p>
                                                        <p className="text-[9px] opacity-75">
                                                            Previous vendor attachment · click to download
                                                        </p>
                                                    </div>
                                                    <span className="text-[9px] font-semibold underline">
                                                        Download
                                                    </span>
                                                </button>
                                            )}
                                        </section>
                                    )}

                                    {effectiveWarrantyLifecycle === "OPEN" && (
                                        <section className="rounded-lg border border-amber-200/80 bg-amber-50/35 p-2.5 dark:border-amber-900/50 dark:bg-amber-950/10">
                                            <div className="grid gap-2 lg:grid-cols-2">
                                                <label className="block">
                                                    <span className="mb-1 block text-[10px] font-semibold">
                                                        Gate Pass Remarks <span className="text-red-500">*</span>
                                                    </span>
                                                    <textarea
                                                        value={vendorGatePassRemarks}
                                                        disabled={effectiveWarrantyLifecycle !== "OPEN"}
                                                        onChange={(event) => setVendorGatePassRemarks(event.target.value)}
                                                        rows={2}
                                                        maxLength={1000}
                                                        placeholder="Purpose, accessories, physical handover note..."
                                                        className="min-h-[58px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </label>

                                                <label className="block">
                                                    <span className="mb-1 block text-[10px] font-semibold">
                                                        IT Transfer Remarks
                                                    </span>
                                                    <textarea
                                                        value={vendorTransferRemarks}
                                                        disabled={effectiveWarrantyLifecycle !== "OPEN"}
                                                        onChange={(event) => setVendorTransferRemarks(event.target.value)}
                                                        rows={2}
                                                        maxLength={1000}
                                                        placeholder="Internal IT note for this vendor transfer"
                                                        className="min-h-[58px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </label>
                                            </div>

                                            <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_auto]">
                                                <div className="rounded-lg border border-border bg-background p-2.5">
                                                    <span className="mb-1 block text-[10px] font-semibold">
                                                        Attachment
                                                    </span>
                                                    <input
                                                        type="file"
                                                        disabled={effectiveWarrantyLifecycle !== "OPEN"}
                                                        accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                        onChange={(event) =>
                                                            setVendorTransferAttachment(
                                                                event.target.files?.[0] ?? null,
                                                            )
                                                        }
                                                        className="block w-full text-xs"
                                                    />

                                                    {vendorTransferAttachment && (
                                                        <div className="mt-2 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50/70 p-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                                            {vendorTransferAttachmentPreview ? (
                                                                <img
                                                                    src={vendorTransferAttachmentPreview}
                                                                    alt="Selected warranty attachment preview"
                                                                    className="h-16 w-20 shrink-0 rounded-md border border-border object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                                                                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-[11px] font-semibold text-foreground" title={vendorTransferAttachment.name}>
                                                                    {vendorTransferAttachment.name}
                                                                </p>
                                                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                                    {(vendorTransferAttachment.size / 1024).toFixed(1)} KB · ready to upload
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setVendorTransferAttachment(null)}
                                                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                title="Remove attachment"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    <p className="mt-1 text-[9px] text-muted-foreground">
                                                        JPG, PNG, GIF, PDF, TXT, DOC/DOCX, PPT/PPTX or XLS/XLSX · maximum 4 MB.
                                                        Stored in backend/uploads/claims/.
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 rounded-md border border-border bg-background px-2.5 py-2">
                                                    <label className="inline-flex items-center gap-2 text-xs font-medium">
                                                        <input
                                                            type="checkbox"
                                                            disabled={effectiveWarrantyLifecycle !== "OPEN"}
                                                            checked={vendorCompanyMaterial}
                                                            onChange={(event) => setVendorCompanyMaterial(event.target.checked)}
                                                        />
                                                        Company Material
                                                    </label>
                                                    <label className="inline-flex items-center gap-2 text-xs font-medium">
                                                        <input
                                                            type="checkbox"
                                                            disabled={effectiveWarrantyLifecycle !== "OPEN"}
                                                            checked={vendorReturnable}
                                                            onChange={(event) => setVendorReturnable(event.target.checked)}
                                                        />
                                                        Returnable
                                                    </label>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    <section className="overflow-hidden rounded-lg border border-border">
                                        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-2.5 py-1.5">
                                            <div>
                                                <p className="text-xs font-semibold">Warranty History</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Chronological audit trail. Previous and current vendor responses, comments and attachments remain visible at a glance.
                                                </p>
                                                <p className="mt-0.5 text-[9px] text-muted-foreground">
                                                    Flow: Claim Opened → Sent to Vendor → Received from Vendor → Claim Closed
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                {warrantyClaimHistory.length} event{warrantyClaimHistory.length === 1 ? "" : "s"}
                                            </span>
                                        </div>

                                        {warrantyClaimHistory.length === 0 ? (
                                            <div className="px-4 py-5 text-center text-xs text-muted-foreground">
                                                No claim history event is available yet.
                                            </div>
                                        ) : (
                                            <div className="max-h-64 overflow-auto px-3 py-2">
                                                {warrantyClaimHistory.map((entry, index) => {
                                                    const attachmentPath =
                                                        entry.attach_file ||
                                                        String(entry.metadata?.["attachment"] ?? "");
                                                    const attachmentName = attachmentPath
                                                        ? attachmentPath.split(/[\\/]/).filter(Boolean).pop() || attachmentPath
                                                        : "";

                                                    return (
                                                        <div key={entry.id} className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-2 pb-3 last:pb-0">
                                                            {index < warrantyClaimHistory.length - 1 && (
                                                                <span className="absolute left-[13px] top-7 h-[calc(100%-18px)] w-px bg-border" />
                                                            )}
                                                            <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-[10px] font-bold text-violet-700">
                                                                {index + 1}
                                                            </div>
                                                            <div className="rounded-lg border border-border bg-background px-3 py-2">
                                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                                    <div>
                                                                        <p className="text-[11px] font-semibold text-foreground">
                                                                            {String(entry.event || "Claim Event")
                                                                                .replace(/_/g, " ")
                                                                                .replace(/\b\w/g, (character) => character.toUpperCase())}
                                                                        </p>
                                                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                                            {formatDateTime(entry.changed_at)}
                                                                            {entry.changed_by ? ` · By ${entry.changed_by}` : ""}
                                                                        </p>
                                                                    </div>
                                                                    <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                                                                        {entry.previous_status} → {entry.current_status}
                                                                    </span>
                                                                </div>

                                                                <p className="mt-1.5 whitespace-pre-wrap text-[11px] text-foreground/85">
                                                                    {entry.remarks || "—"}
                                                                </p>

                                                                {(entry.vendor_personnel_name || entry.vendor_mobile) && (
                                                                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                                                                        {entry.vendor_personnel_name && (
                                                                            <span><strong className="text-foreground">Receiver:</strong> {entry.vendor_personnel_name}</span>
                                                                        )}
                                                                        {entry.vendor_mobile && (
                                                                            <span><strong className="text-foreground">Mobile:</strong> {entry.vendor_mobile}</span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {attachmentName && activeWarrantyClaim && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            void downloadWarrantyAttachment(
                                                                                activeWarrantyClaim.id,
                                                                                entry.id,
                                                                                attachmentName,
                                                                            ).catch((reason) => {
                                                                                setOperationError(
                                                                                    reason instanceof Error
                                                                                        ? reason.message
                                                                                        : "Unable to download attachment.",
                                                                                );
                                                                            });
                                                                        }}
                                                                        className="mt-2 flex w-full items-center gap-2 rounded-md border border-blue-200 bg-blue-50/60 px-2.5 py-2 text-left text-blue-800 transition-colors hover:bg-blue-100"
                                                                        title="Download attachment"
                                                                    >
                                                                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate text-[10px] font-semibold">
                                                                                {attachmentName}
                                                                            </p>
                                                                            <p className="truncate text-[9px] opacity-75">
                                                                                Click to download · {attachmentPath}
                                                                            </p>
                                                                        </div>
                                                                        <span className="shrink-0 text-[9px] font-semibold underline">
                                                                            Download
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>
                                </>
                            )}
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
                                        !selectedEmployee) ||
                                    (operation === "warranty-transfer" &&
                                        (warrantyClaimLoading ||
                                            !activeWarrantyClaim ||
                                            effectiveWarrantyLifecycle === "CLOSED"))
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
                                                                ? "Raise Warranty Claim"
                                                                : operation === "service"
                                                                    ? "Raise Service Request"
                                                                    : operation === "warranty-transfer" || operation === "service-transfer"
                                                                        ? effectiveWarrantyLifecycle === "WITH_VENDOR"
                                                                            ? "Submit Workflow"
                                                                            : effectiveWarrantyLifecycle === "RECEIVED"
                                                                                ? "Received from Vendor"
                                                                                : "Transfer to Vendor"
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
