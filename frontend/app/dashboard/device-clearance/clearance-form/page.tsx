// //app/dashboard/device-clearance/clearance-form/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export default function ClearanceFormPage() {
    const router = useRouter();

    /* ================= STATE ================= */
    const [form, setForm] = useState({
        user_name: "",
        device_name: "",

        device_returned: false,
        vpn_removed: false,
        ip_phone_disabled: false,
        printer_access_removed: false,
        panda_removed: false,

        ec_given: false,
    });

    const [loading, setLoading] = useState(false);

    /* ================= HANDLE CHECK ================= */
    const handleCheck = (field: string, value: boolean) => {
        const updated = { ...form, [field]: value };

        const allDone =
            updated.device_returned &&
            updated.vpn_removed &&
            updated.ip_phone_disabled &&
            updated.printer_access_removed &&
            updated.panda_removed;

        updated.ec_given = allDone;

        setForm(updated);
    };

    /* ================= VALIDATION ================= */
    const isFormValid =
        form.user_name.trim() !== "" &&
        form.device_name.trim() !== "" &&
        form.device_returned &&
        form.vpn_removed &&
        form.ip_phone_disabled &&
        form.printer_access_removed &&
        form.panda_removed;

    /* ================= PROGRESS ================= */
    const steps = [
        form.device_returned,
        form.vpn_removed,
        form.ip_phone_disabled,
        form.printer_access_removed,
        form.panda_removed,
    ];

    const completed = steps.filter(Boolean).length;
    const progress = (completed / steps.length) * 100;

    /* ================= SUBMIT ================= */
    const handleSubmit = async () => {
        if (!isFormValid) {
            alert("Please complete all required fields and steps.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("/api/device-clearance", {
                method: "POST",
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error();

            const result = await res.json();

            // 🔥 Redirect to approval page
            router.push(`/dashboard/device-clearance/approval/${result.id}`);

        } catch {
            alert("Submission failed");
        } finally {
            setLoading(false);
        }
    };

    /* ================= UI ================= */
    return (
        <div className="p-6 w-full">
            <div className="w-full bg-white border rounded-2xl shadow-sm p-6 space-y-6">

                {/* ================= HEADER ================= */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Device Clearance
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Complete all steps to grant exit clearance
                        </p>
                    </div>

                    <span
                        className={`px-3 py-1 text-sm rounded-full ${isFormValid
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                            }`}
                    >
                        {isFormValid ? "Ready for Approval" : "Incomplete"}
                    </span>
                </div>

                {/* ================= USER INFO ================= */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        placeholder="Employee Name *"
                        value={form.user_name}
                        className={!form.user_name ? "border-red-300" : ""}
                        onChange={(e) =>
                            setForm({ ...form, user_name: e.target.value })
                        }
                    />

                    <Input
                        placeholder="Device Name *"
                        value={form.device_name}
                        className={!form.device_name ? "border-red-300" : ""}
                        onChange={(e) =>
                            setForm({ ...form, device_name: e.target.value })
                        }
                    />
                </div>

                {/* ================= CHECKLIST ================= */}
                <div className="border rounded-xl divide-y">

                    <ChecklistRow
                        label="Device Returned"
                        desc="User has returned assigned device"
                        checked={form.device_returned}
                        onChange={(v) => handleCheck("device_returned", v)}
                    />

                    <ChecklistRow
                        label="VPN Access Removed"
                        desc="VPN profile deleted"
                        checked={form.vpn_removed}
                        onChange={(v) => handleCheck("vpn_removed", v)}
                    />

                    <ChecklistRow
                        label="IP Phone Disabled"
                        desc="Extension removed from system"
                        checked={form.ip_phone_disabled}
                        onChange={(v) =>
                            handleCheck("ip_phone_disabled", v)
                        }
                    />

                    <ChecklistRow
                        label="Printer Access Removed"
                        desc="Print server access revoked"
                        checked={form.printer_access_removed}
                        onChange={(v) =>
                            handleCheck("printer_access_removed", v)
                        }
                    />

                    <ChecklistRow
                        label="Endpoint Security Removed"
                        desc="Panda profile removed"
                        checked={form.panda_removed}
                        onChange={(v) => handleCheck("panda_removed", v)}
                    />

                </div>

                {/* ================= PROGRESS ================= */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{completed}/5 completed</span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* ================= WARNING ================= */}
                {!isFormValid && (
                    <p className="text-sm text-red-500 text-right">
                        All fields and steps are mandatory
                    </p>
                )}

                {/* ================= ACTION ================= */}
                <div className="flex justify-end">
                    <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid || loading}
                        className="px-6"
                    >
                        {loading ? "Processing..." : "Complete Clearance"}
                    </Button>
                </div>

            </div>
        </div>
    );
}

/* ================= ROW ================= */
function ChecklistRow({
    label,
    desc,
    checked,
    onChange,
}: {
    label: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-muted transition">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
            </div>

            <Checkbox
                checked={checked}
                onCheckedChange={(v) => onChange(!!v)}
            />
        </div>
    );
}



