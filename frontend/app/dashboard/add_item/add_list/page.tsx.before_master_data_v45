// app/dashboard/add_item/add_list/page.tsx

"use client";

import { useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";

type ModalType = "query" | "device" | "vendor" | null;
type ModeType = "add" | "view" | "edit";

export default function AddItemPage() {
    const [openModal, setOpenModal] = useState<ModalType>(null);
    const [modalMode, setModalMode] = useState<ModeType>("add");
    const [selectedItem, setSelectedItem] = useState<any>({});

    // ================= STATIC DATA =================
    const queryData = [
        { id: 1, name: "Login Issue", desc: "User cannot login" },
        { id: 2, name: "Password Reset", desc: "Forgot password" },
    ];

    const deviceData = [
        { id: 1, category: "Laptop", brand: "Dell", model: "Latitude 5420" },
        { id: 2, category: "Desktop", brand: "HP", model: "ProDesk 400" },
    ];

    const vendorData = [
        {
            id: 1,
            name: "Tech Solutions Ltd.",
            category: "Supplier",
            person: "John Doe",
            email: "info@techsolutions.com",
            mobile: "+8801712345678",
        },
        {
            id: 2,
            name: "Global IT",
            category: "Service Provider",
            person: "Sarah Khan",
            email: "info@globalit.com",
            mobile: "+8801812345678",
        },
    ];

    // ================= HANDLERS =================
    const handleAdd = (type: ModalType) => {
        setOpenModal(type);
        setModalMode("add");
        setSelectedItem({});
    };

    const handleView = (type: ModalType, item: any) => {
        setOpenModal(type);
        setModalMode("view");
        setSelectedItem(item);
    };

    const handleEdit = (type: ModalType, item: any) => {
        setOpenModal(type);
        setModalMode("edit");
        setSelectedItem(item);
    };

    const handleChange = (field: string, value: string) => {
        setSelectedItem((prev: any) => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-lg font-semibold text-gray-800">
                Add Items
            </h1>

            {/* ================= GRID ================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* ================= QUERY ================= */}
                <Card title="Query Type" onAdd={() => handleAdd("query")}>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Name</Th>
                                <Th>Description</Th>
                                <Th>Action</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {queryData.map((q) => (
                                <tr key={q.id}>
                                    <Td>{q.name}</Td>
                                    <Td>{q.desc}</Td>
                                    <Td>
                                        <ActionBtns
                                            onView={() => handleView("query", q)}
                                            onEdit={() => handleEdit("query", q)}
                                        />
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>

                {/* ================= DEVICE ================= */}
                <Card title="Device Category" onAdd={() => handleAdd("device")}>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Device</Th>
                                <Th>Brand</Th>
                                <Th>Model</Th>
                                <Th>Action</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {deviceData.map((d) => (
                                <tr key={d.id}>
                                    <Td>{d.category}</Td>
                                    <Td>{d.brand}</Td>
                                    <Td>{d.model}</Td>
                                    <Td>
                                        <ActionBtns
                                            onView={() => handleView("device", d)}
                                            onEdit={() => handleEdit("device", d)}
                                        />
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>

                {/* ================= VENDOR ================= */}
                <Card title="Vendor" onAdd={() => handleAdd("vendor")}>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Name</Th>
                                <Th>Category</Th>
                                <Th>Person</Th>
                                <Th>Email</Th>
                                <Th>Action</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendorData.map((v) => (
                                <tr key={v.id}>
                                    <Td>{v.name}</Td>
                                    <Td>{v.category}</Td>
                                    <Td>{v.person}</Td>
                                    <Td className="truncate max-w-[120px]">{v.email}</Td>
                                    <Td>
                                        <ActionBtns
                                            onView={() => handleView("vendor", v)}
                                            onEdit={() => handleEdit("vendor", v)}
                                        />
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            </div>

            {/* ================= MODAL ================= */}
            {openModal && (
                <Modal
                    title={`${modalMode.toUpperCase()} ${openModal}`}
                    onClose={() => setOpenModal(null)}
                >
                    {/* QUERY */}
                    {openModal === "query" && (
                        <>
                            <Input
                                label="Name"
                                value={selectedItem?.name || ""}
                                disabled={modalMode === "view"}
                                onChange={(e: any) =>
                                    handleChange("name", e.target.value)
                                }
                            />
                            <Input
                                label="Description"
                                value={selectedItem?.desc || ""}
                                disabled={modalMode === "view"}
                                onChange={(e: any) =>
                                    handleChange("desc", e.target.value)
                                }
                            />
                        </>
                    )}

                    {/* DEVICE */}
                    {openModal === "device" && (
                        <>
                            <Input
                                label="Device"
                                value={selectedItem?.category || ""}
                                disabled={modalMode === "view"}
                                onChange={(e: any) =>
                                    handleChange("category", e.target.value)
                                }
                            />
                            <Input
                                label="Brand"
                                value={selectedItem?.brand || ""}
                                disabled={modalMode === "view"}
                                onChange={(e: any) =>
                                    handleChange("brand", e.target.value)
                                }
                            />
                            <Input
                                label="Model"
                                value={selectedItem?.model || ""}
                                disabled={modalMode === "view"}
                                onChange={(e: any) =>
                                    handleChange("model", e.target.value)
                                }
                            />
                        </>
                    )}

                    {/* VENDOR */}
                    {openModal === "vendor" && (
                        <>
                            <Input
                                label="Name"
                                value={selectedItem?.name || ""}
                                disabled={modalMode === "view"}
                                onChange={(e: any) =>
                                    handleChange("name", e.target.value)
                                }
                            />
                            <Input
                                label="Category"
                                value={selectedItem?.category || ""}
                                disabled={modalMode === "view"}
                                onChange={(e: any) =>
                                    handleChange("category", e.target.value)
                                }
                            />
                            <Input
                                label="Person"
                                value={selectedItem?.person || ""}
                                disabled={modalMode === "view"}
                                onChange={(e: any) =>
                                    handleChange("person", e.target.value)
                                }
                            />
                            <Input
                                label="Email"
                                value={selectedItem?.email || ""}
                                disabled={modalMode === "view"}
                                onChange={(e: any) =>
                                    handleChange("email", e.target.value)
                                }
                            />
                            <Input
                                label="Mobile"
                                value={selectedItem?.mobile || ""}
                                disabled={modalMode === "view"}
                                onChange={(e: any) =>
                                    handleChange("mobile", e.target.value)
                                }
                            />
                        </>
                    )}

                    {modalMode !== "view" && (
                        <button className="btn mt-3 w-full">
                            {modalMode === "edit" ? "Update" : "Save"}
                        </button>
                    )}
                </Modal>
            )}
        </div>
    );
}

/* ================= COMPONENTS ================= */

function Card({ title, onAdd, children }: any) {
    return (
        <div className="space-y-3">
            <div className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="font-medium text-gray-700">{title}</h2>
                    <Plus size={16} />
                </div>

                <button
                    onClick={onAdd}
                    className="mt-3 w-full py-2 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                    + Add
                </button>
            </div>
            {children}
        </div>
    );
}

function Table({ children }: any) {
    return (
        <div className="bg-card border rounded-lg shadow-sm overflow-x-auto">
            <table className="min-w-[600px] w-full text-xs">{children}</table>
        </div>
    );
}

function Th({ children }: any) {
    return <th className="border px-2 py-1 bg-muted text-left">{children}</th>;
}

function Td({ children, className = "" }: any) {
    return <td className={`border px-2 py-1 ${className}`}>{children}</td>;
}

function ActionBtns({ onView, onEdit }: any) {
    return (
        <div className="flex gap-2">
            <button onClick={onView} className="text-blue-600">
                <Eye size={14} />
            </button>
            <button onClick={onEdit} className="text-green-600">
                <Pencil size={14} />
            </button>
        </div>
    );
}

function Modal({ title, children, onClose }: any) {
    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-card w-full max-w-md p-5 rounded"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between mb-3">
                    <h3 className="font-semibold">{title}</h3>
                    <button onClick={onClose}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Input({ label, value, disabled, onChange }: any) {
    return (
        <input
            className="w-full border px-3 py-2 rounded text-sm mb-2"
            placeholder={label}
            value={value}
            readOnly={disabled}
            onChange={onChange}
        />
    );
}







