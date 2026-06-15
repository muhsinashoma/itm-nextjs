import { claimApi, Claim } from "@/lib/api";
export type { Claim as ServiceRequest };
export async function getServiceRequests(p?: { page?: number }) { return claimApi.list({ ...p, service_type: "1" }); }
export const serviceRequestedDevices: Claim[] = [];
