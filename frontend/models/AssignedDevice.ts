
/**
 * Business model for User Report
 * This will match DB table later
 */
//models/ → defines the shape of your data

//models/AssignedDevice.ts

export type DeviceStatus = "Assigned" | "Transferred" | "Returned" | "Available" | "Damaged" | "Stored" | "Claimed" | "Recovered" | "Petty Cash" | "MR Type" | "In Progress" | "Open" | "Expired" | "Requests" | "To Vendor" | "Closed" | "Recovered" | "Lost" | "Ownership" | "Completed" | "Pending Clearance" | "In Process" | "Upcoming Renewals" | "Delayed" | "Obsoleted" | "User Ownership" | "Service Requrest" | "Tranferred to Vendor";

export interface AssignedDevice {
    sl: number;
    referenceNumber: string;
    mrnNumber: string;
    prNumber: string;
    employeeId: string;
    employeeName: string;
    designation: string;
    department: string;
    category: string;
    deviceSl: string;
    model: string;
    status: DeviceStatus;
    userUsageDuration: string;
    warranty: string;
    vendor: string;
    assignedBy: string;
    assignedDate: string;
    deviceType: string;
    deviceAge: string;
    purchaseDate: string;
    // ✅ ADD THESE
    avatarUrl?: string;   // image URL
    condition?: string;
    remarks?: string;
}
