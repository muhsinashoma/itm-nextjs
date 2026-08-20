// frontend/app/dashboard/user/downstream-device/page.tsx
"use client";

import {
    MonitorSmartphone,
} from "lucide-react";

export default function DownstreamDevicePage() {
    return (
        <div className="p-4 sm:p-5 lg:p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <MonitorSmartphone className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            My Devices
                        </p>

                        <h1 className="text-xl font-bold text-slate-900">
                            Downstream Device
                        </h1>
                    </div>
                </div>

                <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-sm font-medium text-slate-700">
                        Downstream device information will load here.
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        The secure user-specific device API will be connected next.
                    </p>
                </div>
            </div>
        </div>
    );
}