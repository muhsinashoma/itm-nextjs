import { reportApi, Employee } from "@/lib/api";
export type { Employee as UserReport };
export async function getUserReports(active?: string) { return reportApi.users(active); }
export const MOCK_USERS: Employee[] = [];
