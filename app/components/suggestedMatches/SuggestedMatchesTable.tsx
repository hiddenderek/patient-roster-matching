"use client";

import type { ReactElement } from "react";

import type { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { twMerge } from "tailwind-merge";

export type SuggestedMatchesTableProps<TData> = {
  table: Table<TData>;
};

const tableCardClass = "mt-4 rounded-lg border border-neutral-200 bg-white";
const headerCellBaseClass =
  "whitespace-nowrap border-b border-neutral-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-700";
const headerCellSortableClass = "cursor-pointer select-none";
const sortIndicatorClass = "text-neutral-500";
const bodyClass = "divide-y divide-neutral-200";
const rowClass = "hover:bg-neutral-50";
const cellClass = "align-top px-4 py-3";
const emptyCellClass = "px-4 py-6 text-sm text-neutral-600";
const footerClass =
  "flex flex-col gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-3 md:flex-row md:items-center md:justify-between";
const footerTextClass = "text-sm text-neutral-600";
const paginationButtonClass =
  "cursor-pointer rounded border border-neutral-200 bg-white px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50";
const pageSizeSelectClass = "rounded border border-neutral-200 bg-white px-2 py-2 text-sm";

export function SuggestedMatchesTable<TData>({
  table,
}: SuggestedMatchesTableProps<TData>): ReactElement {
  const visibleColumnCount = table
    .getAllLeafColumns()
    .filter((column) => column.getIsVisible()).length;

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <>
      <div className={tableCardClass}>
        <div className="overflow-x-auto overflow-y-visible">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        className={twMerge(
                          headerCellBaseClass,
                          canSort ? headerCellSortableClass : "",
                        )}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        title={canSort ? "Sort" : undefined}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDir === "asc" ? <span className={sortIndicatorClass}>↑</span> : null}
                          {sortDir === "desc" ? (
                            <span className={sortIndicatorClass}>↓</span>
                          ) : null}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody className={bodyClass}>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td className={emptyCellClass} colSpan={Math.max(1, visibleColumnCount)}>
                    No rows.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className={rowClass}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td key={cell.id} className={cellClass}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={footerClass}>
          <div className={footerTextClass}>
            {table.getFilteredRowModel().rows.length} rows • Page {pageIndex + 1}
            {pageCount ? ` of ${pageCount}` : ""}
          </div>

          <div className="flex items-center gap-2">
            <button
              className={paginationButtonClass}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Prev
            </button>
            <button
              className={paginationButtonClass}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>

            <select
              className={pageSizeSelectClass}
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
