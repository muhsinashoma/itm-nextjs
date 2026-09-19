// app/dashboard/stock/stock-entry/page.tsx
"use client";

import React, { useState } from "react";
import { Plus, Trash2, Send, PackagePlus, ClipboardList, Cpu } from "lucide-react";

interface SCMInventory {
    mrNumber: string;
    prId: string;
    vendorName: string;
    receivedDate: string;
    serialNo: string;
    purchaseDate: string;
    itemGroup: string;
    itemName: string;
}

interface ITMPart {
    category: string;
    brand: string;
    model: string;
    cpu: string;
    ram: string;
    ssd: string;
    monitor: string;
    warrantyEndDate: string;
    remarks: string;
}

interface StockRow {
    scm: SCMInventory;
    itm: ITMPart;
    mrQuantity: number | "";
}

const defaultScm: SCMInventory = {
    mrNumber: "FAHSC02-22972025-10-19MR125732",
    prId: "FAHSC02-22972025-09-04PR13795",
    vendorName: "Daffodil Computers Limited",
    receivedDate: "2025-10-13T15:17",
    serialNo: "2514APC6KVZ9",
    purchaseDate: "2025-10-13T15:17",
    itemGroup: "Computer Accessories",
    itemName: "Mouse-Wireless (Standard)",
};

const emptyScm: SCMInventory = { mrNumber: "", prId: "", vendorName: "", receivedDate: "", serialNo: "", purchaseDate: "", itemGroup: "", itemName: "" };
const emptyItm: ITMPart = { category: "", brand: "", model: "", cpu: "", ram: "", ssd: "", monitor: "", warrantyEndDate: "", remarks: "" };

const scmLabels: Record<keyof SCMInventory, string> = {
    mrNumber: "MR Number", prId: "PR ID", vendorName: "Vendor Name",
    receivedDate: "Received Date", serialNo: "Serial No", purchaseDate: "Purchase Date",
    itemGroup: "Item Group", itemName: "Item Name",
};

const itmLabels: Record<keyof ITMPart, string> = {
    category: "Category", brand: "Brand", model: "Model", cpu: "CPU",
    ram: "RAM", ssd: "SSD", monitor: "Monitor", warrantyEndDate: "Warranty End Date", remarks: "Remarks",
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition";
const readonlyCls = "w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed";

export default function StockEntry() {
    const [rows, setRows] = useState<StockRow[]>([{ scm: defaultScm, itm: emptyItm, mrQuantity: 5 }]);
    const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 16));
    const [submitted, setSubmitted] = useState(false);

    const employeeName = "Muhsina Akter";
    const employeeId = "02-0501";

    const handleRowChange = (index: number, section: "scm" | "itm" | "mrQuantity", field: string, value: string) => {
        const newRows = [...rows];
        if (section === "mrQuantity") {
            const num = value === "" ? "" : parseInt(value);
            if (num === "" || (typeof num === "number" && num >= 1 && num <= 5)) {
                newRows[index].mrQuantity = num;
            }
        } else {
            // @ts-ignore
            newRows[index][section][field] = value;
        }
        setRows(newRows);
    };

    const addRow = () => {
        if (rows.length >= 5) { alert("Maximum 5 rows allowed."); return; }
        const last = rows[rows.length - 1];
        if (!last.mrQuantity || Object.values(last.itm).some(v => v === "")) {
            alert("Please fill all ITM fields before adding a new row.");
            return;
        }
        setRows([...rows, { scm: emptyScm, itm: emptyItm, mrQuantity: 1 }]);
    };

    const removeRow = (index: number) => setRows(rows.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (!r.mrQuantity || Object.values(r.itm).some(v => !v)) {
                alert(`Row ${i + 1} is incomplete.`);
                return;
            }
        }
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        console.log("Submitted:", rows);
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto">

            {/* Page header */}
            <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <PackagePlus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-foreground">Stock Entry Form</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">IT Stock Input with Material Requisition (MR)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground px-2.5 py-1 bg-muted rounded-lg border border-border">
                            {rows.length} / 5 rows
                        </span>
                        <button
                            type="button"
                            onClick={addRow}
                            disabled={rows.length >= 5}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-40"
                        >
                            <Plus size={13} /> Add Row
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${submitted
                                ? "bg-emerald-500 text-white"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                        >
                            <Send size={13} /> {submitted ? "Submitted!" : "Submit"}
                        </button>
                    </div>
                </div>

                {/* Header fields */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="MR Number" required>
                        <input type="text" value={rows[0].scm.mrNumber} readOnly className={readonlyCls} />
                    </Field>
                    <Field label="MR Quantity" required>
                        <input
                            type="number" min={1} max={5}
                            value={rows[0].mrQuantity}
                            onChange={e => handleRowChange(0, "mrQuantity", "", e.target.value)}
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Entry Date">
                        <input
                            type="datetime-local" value={entryDate}
                            onChange={e => setEntryDate(e.target.value)}
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Employee">
                        <div className="flex gap-1.5">
                            <input type="text" value={employeeName} readOnly className={`${readonlyCls} flex-1`} />
                            <input type="text" value={employeeId} readOnly className={`${readonlyCls} w-20`} />
                        </div>
                    </Field>
                </div>
            </div>

            {/* Dynamic rows */}
            {rows.map((row, index) => (
                <div key={index} className="bg-card border border-border rounded-2xl overflow-hidden">

                    {/* Row header */}
                    <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                                {index + 1}
                            </span>
                            <span className="text-xs font-semibold text-foreground">Entry Row #{index + 1}</span>
                            {row.scm.itemName && (
                                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                    {row.scm.itemName}
                                </span>
                            )}
                        </div>
                        {rows.length > 1 && (
                            <button
                                onClick={() => removeRow(index)}
                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                            >
                                <Trash2 size={11} /> Remove
                            </button>
                        )}
                    </div>

                    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* SCM Inventory */}
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
                                <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                                <p className="text-xs font-semibold text-blue-700">SCM Inventory</p>
                                <span className="ml-auto text-[10px] text-blue-400">Read-only from MR</span>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3 bg-card">
                                {(Object.keys(row.scm) as (keyof SCMInventory)[]).map(key => (
                                    <Field key={key} label={scmLabels[key]}>
                                        <input
                                            type={key.includes("Date") ? "datetime-local" : "text"}
                                            value={row.scm[key]}
                                            readOnly
                                            className={readonlyCls}
                                        />
                                    </Field>
                                ))}
                            </div>
                        </div>

                        {/* ITM Part */}
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-100">
                                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                                <p className="text-xs font-semibold text-emerald-700">ITM Part Details</p>
                                <span className="ml-auto text-[10px] text-emerald-400">Fill all fields</span>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3 bg-card">
                                {(Object.keys(row.itm) as (keyof ITMPart)[]).map(key => (
                                    <Field key={key} label={itmLabels[key]} required={key !== "remarks"}>
                                        {key === "remarks" ? (
                                            <textarea
                                                value={row.itm[key]}
                                                onChange={e => handleRowChange(index, "itm", key, e.target.value)}
                                                rows={2}
                                                placeholder="Optional remarks..."
                                                className={`${inputCls} resize-none col-span-2`}
                                            />
                                        ) : (
                                            <input
                                                type={key === "warrantyEndDate" ? "date" : "text"}
                                                value={row.itm[key]}
                                                onChange={e => handleRowChange(index, "itm", key, e.target.value)}
                                                placeholder={itmLabels[key]}
                                                className={inputCls}
                                            />
                                        )}
                                    </Field>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Bottom actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-2xl px-5 py-4">
                <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{rows.length}</span> row{rows.length !== 1 ? "s" : ""} · Max 5 allowed
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={addRow}
                        disabled={rows.length >= 5}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-muted hover:bg-border border border-border rounded-lg transition disabled:opacity-40 text-foreground"
                    >
                        <Plus size={13} /> Add Row
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition ${submitted ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:opacity-90"
                            }`}
                    >
                        <Send size={13} /> {submitted ? "Submitted!" : "Submit Entry"}
                    </button>
                </div>
            </div>
        </div>
    );
}
