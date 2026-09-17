
// /**
//  * Business model for User Report
//  * This will match DB table later
//  */
// //models/ → defines the shape of your data

// //frontend/models/AssignedDevice.ts  

// export type DeviceStatus = "Assigned" | "Transferred" | "Returned" | "Available" | "Damaged" | "Stored" | "Claimed" | "Recovered" | "Petty Cash" | "MR Type" | "In Progress" | "Open" | "Expired" | "Requests" | "To Vendor" | "Closed" | "Recovered" | "Lost" | "Ownership" | "Completed" | "Pending Clearance" | "In Process" | "Upcoming Renewals" | "Delayed" | "Obsoleted" | "User Ownership" | "Service Requrest" | "Tranferred to Vendor";

// export interface AssignedDevice {
//     sl: number;
//     referenceNumber: string;
//     mrnNumber: string;
//     prNumber: string;
//     employeeId: string;
//     employeeName: string;
//     designation: string;
//     department: string;
//     category: string;
//     deviceSl: string;
//     model: string;
//     status: DeviceStatus;
//     userUsageDuration: string;
//     warranty: string;
//     vendor: string;
//     assignedBy: string;
//     assignedDate: string;
//     deviceType: string;
//     deviceAge: string;
//     purchaseDate: string;
//     // ✅ ADD THESE
//     avatarUrl?: string;   // image URL
//     condition?: string;
//     remarks?: string;
//     id?: number | string;
//     brand?: string;
// }




/**
 * Shared business model for asset report pages.
 *
 * Used by:
 * - Assigned Devices
 * - Returned Devices
 * - Transferred Devices
 * - Damaged Devices
 * - Lost Devices
 * - Ownership Transfer Devices
 */

export type DeviceStatus =
    | "Assigned"
    | "Transferred"
    | "Returned"
    | "Available"
    | "Damaged"
    | "Lost"
    | "Stored"
    | "Claimed"
    | "Recovered"
    | "Petty Cash"
    | "MR Type"
    | "In Progress"
    | "Open"
    | "Expired"
    | "Requests"
    | "To Vendor"
    | "Closed"
    | "Ownership"
    | "Ownership Transfer"
    | "Completed"
    | "Pending Clearance"
    | "In Process"
    | "Upcoming Renewals"
    | "Delayed"
    | "Obsoleted"
    | "User Ownership"
    | "Service Request"
    | "Transferred to Vendor"
    | "Unknown";

export interface AssignedDevice {
    /** Internal asset/device ID from API */
    id?: number | string;

    /** Table serial number, calculated in frontend */
    sl: number;

    /** Main visible report fields */
    referenceNumber: string;
    deviceSl: string;
    employeeId: string;
    employeeName: string;
    designation: string;
    category: string;
    model: string;
    status: DeviceStatus;

    /** Hidden fields, available through Columns menu */
    mrnNumber: string;
    prNumber: string;
    department: string;
    brand?: string;
    deviceType: string;
    vendor: string;

    assignedBy: string;
    assignedDate: string;
    returnedDate?: string;
    transferredDate?: string;

    purchaseDate: string;
    warranty: string;
    deviceAge: string;
    userUsageDuration: string;

    /** Employee profile image path or full URL */
    avatarUrl?: string;

    /** Extra asset/report fields */
    condition?: string;
    remarks?: string;

}