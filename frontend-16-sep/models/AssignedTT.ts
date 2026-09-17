
/**
 * Business model for User Report
 * This will match DB table later
 */
//models/ → defines the shape of your data

//models/AssignedTT.ts

export interface assignedTTService {
    id: number;
    employee_id: string;
    title: string;
    assignedTo: string;
    assigned_tt_no: string;
}
