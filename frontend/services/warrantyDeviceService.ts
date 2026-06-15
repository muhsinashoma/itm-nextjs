import { claimApi, Claim } from "@/lib/api";
export type { Claim as WarrantyDevice };
export async function getWarrantyDevices(p?: { page?: number }) { return claimApi.list({ ...p, service_type: "0" }); }
export const warrantyDevices: Claim[] = [];
