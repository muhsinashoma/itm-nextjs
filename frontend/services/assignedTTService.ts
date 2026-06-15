import { ticketApi, Ticket } from "@/lib/api";
export type { Ticket as assignedTTService };
export async function getAssignedTTs(p?: { page?: number; status?: string }) { return ticketApi.list(p); }
