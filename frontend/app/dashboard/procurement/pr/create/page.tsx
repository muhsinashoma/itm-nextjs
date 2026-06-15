"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeviceItem {
    deviceName: string;
    specification: string;
    quantity: number;
    estimatedPrice: number;
}

export default function CreatePRPage() {
    const router = useRouter();

    const [devices, setDevices] = useState<DeviceItem[]>([
        { deviceName: "", specification: "", quantity: 1, estimatedPrice: 0 },
    ]);

    const handleDeviceChange = (
        index: number,
        field: keyof DeviceItem,
        value: string | number
    ) => {
        const updated = [...devices];
        updated[index][field] = value as never;
        setDevices(updated);
    };

    const addNewRow = () => {
        setDevices([
            ...devices,
            { deviceName: "", specification: "", quantity: 1, estimatedPrice: 0 },
        ]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("PR Submitted:", devices);
    };

    return (
        <div className="min-h-screen bg-muted">
            <div className="max-w-7xl mx-auto p-8 space-y-8">

                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900">
                            IT Device Purchase Requisition
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            Create a new purchase requisition for IT equipment procurement.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/procurement/pr/list")}
                    >
                        Back to PR Register
                    </Button>
                </div>

                {/* Card */}
                <div className="bg-card border border-border rounded-xl shadow-sm">
                    <form onSubmit={handleSubmit} className="p-8 space-y-10">

                        {/* PR Information */}
                        <div className="space-y-6">
                            <div className="border-b-2 border-blue-600 pb-3">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                    Requisition Information
                                </h3>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <Input placeholder="PR Number (Auto Generated)" disabled />
                                <Input type="date" />
                                <Input placeholder="Department" />
                            </div>
                        </div>

                        {/* Requestor Information */}
                        <div className="space-y-6">
                            <div className="border-b-2 border-blue-600 pb-3">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                    Requestor Details
                                </h3>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <Input placeholder="Requested By" />
                                <Input placeholder="Designation" />
                                <Input placeholder="Contact Number" />
                            </div>
                        </div>

                        {/* Device Details */}
                        <div className="space-y-6">
                            <div className="border-b-2 border-blue-600 pb-3 flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                    Device Details
                                </h3>

                                <Button
                                    type="button"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={addNewRow}
                                >
                                    + Add Item
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {devices.map((device, index) => (
                                    <div
                                        key={index}
                                        className="grid md:grid-cols-4 gap-4 border p-4 rounded-md"
                                    >
                                        <Input
                                            placeholder="Device Name"
                                            value={device.deviceName}
                                            onChange={(e) =>
                                                handleDeviceChange(index, "deviceName", e.target.value)
                                            }
                                        />
                                        <Input
                                            placeholder="Specification"
                                            value={device.specification}
                                            onChange={(e) =>
                                                handleDeviceChange(index, "specification", e.target.value)
                                            }
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Quantity"
                                            value={device.quantity}
                                            onChange={(e) =>
                                                handleDeviceChange(index, "quantity", Number(e.target.value))
                                            }
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Estimated Price"
                                            value={device.estimatedPrice}
                                            onChange={(e) =>
                                                handleDeviceChange(index, "estimatedPrice", Number(e.target.value))
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Approval Section */}
                        <div className="space-y-6">
                            <div className="border-b-2 border-blue-600 pb-3">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                    Approval Routing
                                </h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <Input placeholder="Recommended By" />
                                <Input placeholder="Approved By" />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-4 pt-6 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/dashboard/procurement/pr/list")}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                            >
                                Submit Requisition
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
