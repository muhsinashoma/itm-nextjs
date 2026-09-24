import { api } from "@/lib/api";

export type PreviousAssignmentV20 = {
    id: number;
    employee_id: string;
    employee_name: string;
    employee_image: string;
    department: string;
    designation: string;
    status_code: number;
    status_label: string;
    assigned_at: string;
    ended_at: string;
    assignment_remarks: string;
    end_remarks: string;
    end_reason: string;
};

export type DeviceActivitySummaryV20 = {
    asset_device_id: number;
    asset_status: number;
    action_date: string;
    action_label: string;
    history_reason: string;
    previous_assignment: PreviousAssignmentV20 | null;
};

type ActivitySummaryResponseV20 = {
    success?: boolean;
    data?: DeviceActivitySummaryV20[];
    error?: string;
};

export async function loadDeviceActivitySummariesV20(
    ids: number[],
): Promise<DeviceActivitySummaryV20[]> {
    if (ids.length === 0) return [];

    const response = await api.post<ActivitySummaryResponseV20>(
        "/assets/devices/activity-summary",
        { ids },
    );

    return Array.isArray(response?.data) ? response.data : [];
}

export function statusActionDateHeaderV20(
    value: string | number | null | undefined,
) {
    if (value === "" || value === null || value === undefined) {
        return "Action Date";
    }

    const status = Number(value);

    switch (status) {
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
            return "Ownership Transfer Date";
        case 8:
            return "Claim Raised Date";
        case 15:
            return "Service Request Date";
        default:
            return "Action Date";
    }
}
