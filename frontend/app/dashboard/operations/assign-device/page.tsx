
 //app/dashboard/operations/assign-device/page.tsx


"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AssignDeviceForm() {
    const [form, setForm] = useState<Record<string, any>>({
        employeeName: "",
        employeeId: "",
        designation: "",
        department: "",
        employeeImage: null,
        category: "",
        deviceSL: "",
        deviceType: "",
        brand: "",
        model: "",
        status: "",
        os: "",
        os_key: "",
        cpu: "",
        ram: "",
        ssd: "",
        monitor: "",
        agp: "",
        battery: "",
        removal_drive: "",
        ip_address: "",
        lan_mac: "",
        wlan_mac: "",
        adapter: "",
        mouse: "",
        ups: "",
        bag: "",
        submittedDate: new Date().toISOString().split("T")[0],
        purchaseDate: "",
        warrantyEndDate: "",
        mr_number: "",
        pr_number: "",
        vendor: "",
        remarks: "",
    });

    // Set date **only on client side**
    useEffect(() => {
        setForm(prev => ({
            ...prev,
            submittedDate: new Date().toISOString().split("T")[0],
        }));
    }, []);

    const [preview, setPreview] = useState<string | null>(null);

    const categories = ["Laptop", "Desktop", "Monitor", "Mouse", "Keyboard", "UPS"];
    const deviceTypes = ["Permanent", "Temporary"];
    const statuses = ["Assigned/Active", "Transferred", "Returned", "Stored", "Disposed", "Lost", "Damaged"];
    const brands = {
        Dell: ["Latitude 5420", "Inspiron 15", "OptiPlex 7090"],
        HP: ["EliteBook 840", "ProBook 450"],
        Lenovo: ["ThinkPad T14", "IdeaPad 3"],
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const InputField = ({ label, name, type = "text" }: { label: string; name: string; type?: string }) => (
        <div className="flex flex-col">
            <Label className="text-sm">{label}</Label>
            <Input
                name={name}
                type={type}
                value={form[name] || ""}
                onChange={handleChange}
                className="text-sm py-1"
            />
        </div>
    );

    return (
        <div className="max-w-full mx-auto mt-2 px-2">
            {/* Page Header */}
            <div className="mb-2">
                <h1 className="text-lg font-semibold text-gray-800 text-center border-b border-blue-400 pb-2">
                    Assign New Device
                </h1>

                <p className="text-xs text-muted-foreground mt-1">
                    Fill in the required information to assign a device to an employee
                </p>
            </div>

            <form className="bg-card border border-border rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-6 gap-2 text-sm">
                {/* Employee Info */}
                <section className="md:col-span-6">
                    <h2 className="text-base font-medium text-gray-700 mb-2 border-b pb-1">Employee Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                        <InputField label="Employee Name *" name="employeeName" />
                        <InputField label="Employee ID *" name="employeeId" />
                        <InputField label="Designation" name="designation" />
                        <InputField label="Department" name="department" />
                        <div className="md:col-span-2">
                            <Label className="text-sm">Employee Image</Label>
                            <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 px-2 py-1 hover:bg-muted">
                                {preview ? (
                                    <img src={preview} alt="Employee" className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-[8px] text-muted-foreground">
                                        IMG
                                    </div>
                                )}
                                <span className="text-xs text-muted-foreground">Upload Photo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setForm({ ...form, employeeImage: file });
                                        setPreview(URL.createObjectURL(file));
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </section>

                {/* Device Info */}
                <section className="md:col-span-6">
                    <h2 className="text-base font-medium text-gray-700 mb-2 border-b pb-1">Device Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                        {/* Column 1: Device Identity */}
                        <div className="space-y-2 pr-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-600 border-b border-blue-600 pb-1 text-center">
                                Device Identity
                            </h3>

                            <div>
                                <Label className="text-xs">Category *</Label>
                                <Select
                                    value={form.category || ""}
                                    onValueChange={(value) => setForm({ ...form, category: value })}
                                >
                                    <SelectTrigger className="w-full text-xs py-1">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">Device Serial *</Label>
                                <Select
                                    value={form.deviceSL || ""}
                                    onValueChange={(value) => setForm({ ...form, deviceSL: value })}
                                >
                                    <SelectTrigger className="w-full text-xs py-1">
                                        <SelectValue placeholder="Select serial" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SN-001">SN-001</SelectItem>
                                        <SelectItem value="SN-002">SN-002</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">Device Type *</Label>
                                <Select
                                    value={form.deviceType || ""}
                                    onValueChange={(value) => setForm({ ...form, deviceType: value })}
                                >
                                    <SelectTrigger className="w-full text-xs py-1">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {deviceTypes.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">Brand*</Label>
                                <Select
                                    value={form.brand || ""}
                                    onValueChange={(value) => setForm({ ...form, brand: value, model: "" })}
                                >
                                    <SelectTrigger className="w-full text-xs py-1">
                                        <SelectValue placeholder="Select brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(brands).map((brand) => (
                                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">Model*</Label>
                                <Select
                                    value={form.model || ""}
                                    onValueChange={(value) => setForm({ ...form, model: value })}
                                    disabled={!form.brand}
                                >
                                    <SelectTrigger className="w-full text-xs py-1">
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(brands[form.brand] || []).map((model) => (
                                            <SelectItem key={model} value={model}>{model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* <InputField label="Status" name="status" /> */}

                            {/* Status Dropdown */}
                            <div>
                                <Label className="text-xs">Status*</Label>
                                <Select
                                    value={form.status || ""}
                                    onValueChange={(value) => setForm({ ...form, status: value })}
                                >
                                    <SelectTrigger className="w-full text-xs py-1">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* OS Dropdown */}
                            <div>
                                <Label className="text-xs">OS</Label>
                                <Select
                                    value={form.os || ""}
                                    onValueChange={(value) => setForm({ ...form, os: value })}
                                >
                                    <SelectTrigger className="w-full text-xs py-1">
                                        <SelectValue placeholder="Select OS" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Original">Original</SelectItem>
                                        <SelectItem value="Crack">Crack</SelectItem>
                                        <SelectItem value="N/A">N/A</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* <InputField label="OS" name="os" /> */}
                            <InputField label="OS Key" name="os_key" />
                        </div>

                        {/* Column 2: Hardware */}
                        <div className="space-y-2 px-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-600 border-b border-blue-600 pb-1 text-center">
                                Hardware Specs
                            </h3>
                            <InputField label="CPU / Processor" name="cpu" />
                            <InputField label="RAM" name="ram" />
                            <InputField label="SSD / HDD" name="ssd" />
                            <InputField label="Monitor" name="monitor" />
                            <InputField label="AGP" name="agp" />
                            <InputField label="Battery" name="battery" />
                            <InputField label="Removal Drive" name="removal_drive" />
                        </div>

                        {/* Column 3: Network */}
                        <div className="space-y-2 px-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-600 border-b border-blue-600 pb-1 text-center">
                                Network & Accessories
                            </h3>
                            <InputField label="IP Address" name="ip_address" />
                            <InputField label="LAN MAC" name="lan_mac" />
                            <InputField label="WLAN MAC" name="wlan_mac" />
                            <InputField label="Adapter" name="adapter" />
                            <InputField label="Mouse" name="mouse" />
                            <InputField label="UPS" name="ups" />
                            <InputField label="Bag" name="bag" />
                        </div>

                        {/* Column 4: Purchase & Vendor */}
                        <div className="space-y-2 px-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-600 border-b border-blue-600 pb-1 text-center">
                                Purchase & Vendor
                            </h3>
                            <InputField label="Submitted Date *" name="submittedDate" type="date" />
                            <InputField label="Purchase Date *" name="purchaseDate" type="date" />
                            <InputField label="Warranty End *" name="warrantyEndDate" type="date" />
                            <InputField label="MR Number" name="mr_number" />
                            <InputField label="PR Number" name="pr_number" />
                            <InputField label="Vendor" name="vendor" />

                            <div>
                                <Label className="text-xs">Remarks</Label>
                                <Textarea
                                    name="remarks"
                                    value={form.remarks || ""}
                                    onChange={handleChange}
                                    rows={2}
                                    className="text-xs"
                                    placeholder="Enter remarks"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" className="text-xs py-1 px-2">Cancel</Button>
                                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-4">
                                    Submit
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </form>
        </div>
    );
}

