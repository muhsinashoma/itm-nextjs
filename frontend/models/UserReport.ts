/**
 * Business model for User Report
 * This will match DB table later
 */
//models/ → defines the shape of your data

//models/UserReport.ts

export interface UserReport {
    slNo: number;
    employeeName: string;
    employeeId: string;
    designation: string;
    function: string;
    department: string;
    postingArea: string;
    postingDistrict: string;
    personalMobile: string;
    officeMobile: string;
    email: string;
}