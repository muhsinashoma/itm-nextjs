import { deviceApi, Device } from "@/lib/api";
export type { Device as AssignedDevice };
export async function getAssignedDevices(p?: { page?: number; page_size?: number; status?: string }) { return deviceApi.list(p); }
export async function getAssignedDevicesByEmployee(empId: string) { return deviceApi.byEmployee(empId); }
// Legacy export for compatibility - returns empty array (pages use real API now)
export const assignedDevices: Device[] = [];
