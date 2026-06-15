
/**
 * Business model for User Report
 * This will match DB table later
 */
//models/ → defines the shape of your data

//models/ServiceRequest.ts

export type DeviceStatus = "Expired" | "Requests" | "Vendor" | "Closed" | "Recovered" | "Open";

export interface ServiceRequest {
    sl: number;
    referenceNumber: string;
    employeeId: string;
    employeeName: string;
    designation: string;
    department: string;
    category: string;
    deviceSl: string;
    model: string;
    deviceType: string;
    status: DeviceStatus;
    userUsageDuration: string;
    deviceAge: string;
    warranty: string;
    vendor: string;
    assignedBy: string;
    assignedDate: string;
    purchaseDate: string;
}
