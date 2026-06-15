// components/TTTable.tsx
"use client";

import { columns } from "./tt-columns";

import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table";

import { Section } from "./tt-columns";
import { useTTModal } from "@/components/ui/tt-modal-store";

type TTTableProps = {
    data: Section[];
};

export default function TTTable({
    data,
}: TTTableProps) {

    // GLOBAL MODAL
    const { openModal } = useTTModal();

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="w-full overflow-auto rounded-xl border">

            <table className="w-full text-xs">

                {/* HEADER */}
                <thead className="bg-muted/50 sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="
                                        px-3
                                        py-2
                                        text-left
                                        font-semibold
                                        border-b
                                        whitespace-nowrap
                                    "
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>

                {/* BODY */}
                <tbody>
                    {table.getRowModel().rows.map((row) => {

                        const ttData = row.original;

                        return (
                            <tr
                                key={row.id}
                                onClick={() => openModal(ttData)}
                                className="
                                    border-b
                                    cursor-pointer
                                    transition-colors
                                    hover:bg-muted/40
                                "
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className="
                                            px-3
                                            py-2
                                            whitespace-nowrap
                                        "
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>

            </table>
        </div>
    );
}

