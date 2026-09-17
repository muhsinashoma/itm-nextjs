import { NextResponse } from "next/server";
const API = process.env.API_URL ?? "http://localhost:8080/api/v1";
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get("Authorization") ?? "";
    const res = await fetch(`${API}/reports/assigned?${searchParams.toString()}`,
        { headers: { Authorization: token }, next: { revalidate: 30 } });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
