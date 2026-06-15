// types/tt.ts

export type Section = {
    id: string
    tt_no: string
    employee_id?: string
    employee_name?: string
    assigned_name?: string
    query_type?: string
    requistionType: string
    status: "Closed" | "Open" | "Not Started"
    dept_name: string
    func_name: string
    delivered_status?: string
    created_at?: string
    tt_age?: string
    mobile_no: string
    assigned_id?: string
    company_name?: string
}