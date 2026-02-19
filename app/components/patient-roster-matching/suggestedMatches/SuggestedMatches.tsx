"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import type { ColumnDef, FilterFn, SortingState } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { patientLabel } from "../utils";
import type { PatientRecord } from "../utils";
import { MatchDecisionButtons } from "./MatchDecisionButtons";
import { MatchedFieldsBadges } from "./MatchedFieldsBadges";
import { PatientRecordHoverCard } from "./PatientRecordHoverCard";
import { SuggestedMatchesTable } from "./SuggestedMatchesTable";
import { buildSuggestedMatchesRows, pairKey } from "./utils";
import { formatPatientName } from "../utils";
import type { PatientMatchReport, SuggestedMatchesRow } from "./utils";

const globalFilterFn: FilterFn<SuggestedMatchesRow> = (row, _columnId, value) => {
  const needle = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!needle) {
    return true;
  }

  const haystack = [
    ...row.getAllCells().map((cell) => String(cell.getValue() ?? "").toLowerCase()),
    row.original.kind,
  ].join(" ");

  return haystack.includes(needle);
};

export type SuggestedMatchesProps = {
  externalRecords: PatientRecord[];
  reports: PatientMatchReport[];
  threshold: number;
  confirmedByExternalId: Record<string, string>;
  rejectedPairs: Record<string, true>;
  onToggleConfirm: (internalId: string, externalId: string) => void;
  onToggleReject: (internalId: string, externalId: string) => void;
};

export function SuggestedMatches({
  externalRecords,
  reports,
  threshold,
  confirmedByExternalId,
  rejectedPairs,
  onToggleConfirm,
  onToggleReject,
}: SuggestedMatchesProps): ReactElement {
  const [showOnlyFoundMatches, setShowOnlyFoundMatches] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "confidenceScore", desc: true }]);

  const data = useMemo((): SuggestedMatchesRow[] => {
    return buildSuggestedMatchesRows({
      externalRecords,
      reports,
      threshold,
      showOnlyFoundMatches,
      rejectedPairs,
    });
  }, [externalRecords, rejectedPairs, reports, showOnlyFoundMatches, threshold]);

  const columns = useMemo((): ColumnDef<SuggestedMatchesRow>[] => {
    return [
      {
        id: "externalId",
        header: "ExternalPatientId",
        accessorFn: (row) => row.externalId,
        enableSorting: true,
        cell: (info) => <span className="font-mono text-xs">{String(info.getValue())}</span>,
      },
      {
        id: "external",
        header: "External patient",
        accessorFn: (row) => patientLabel(row.external),
        enableSorting: true,
        cell: ({ row }) => {
          const record = row.original.external;

          return (
            <PatientRecordHoverCard
              name={formatPatientName(record)}
              dob={record.dob}
              phoneNumber={record.phoneNumber}
              record={record}
              align="left"
            />
          );
        },
      },
      {
        id: "internalId",
        header: "InternalPatientId",
        accessorFn: (row) => (row.kind === "unmatched" ? "" : row.internalId),
        enableSorting: true,
        cell: (info) => {
          const value = String(info.getValue() ?? "");

          return value ? (
            <span className="font-mono text-xs">{value}</span>
          ) : (
            <span className="font-mono text-xs text-neutral-500">—</span>
          );
        },
      },
      {
        id: "internal",
        header: "Internal patient",
        accessorFn: (row) => (row.kind === "unmatched" ? "" : patientLabel(row.internal)),
        enableSorting: true,
        cell: ({ row }) => {
          if (row.original.kind === "unmatched") {
            return <span className="text-neutral-500">—</span>;
          }

          const record = row.original.internal;

          return (
            <PatientRecordHoverCard
              name={formatPatientName(record)}
              dob={record.dob}
              phoneNumber={record.phoneNumber}
              record={record}
              align="right"
            />
          );
        },
      },
      {
        id: "confidenceScore",
        header: "Confidence Score",
        accessorFn: (row) => (row.kind === "match" ? row.confidenceScore : -1),
        enableSorting: true,
        cell: ({ row }) => {
          if (row.original.kind !== "match") {
            return <span className="text-neutral-500">—</span>;
          }

          return (
            <span className="text-sm">{(row.original.confidenceScore * 100).toFixed(1)}%</span>
          );
        },
      },
      {
        id: "matchedFields",
        header: "Matched fields",
        accessorFn: (row) => (row.kind === "match" ? row.matchedFields.join(", ") : ""),
        enableSorting: false,
        cell: ({ row }) => {
          if (row.original.kind === "rejected") {
            return (
              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                Rejected
              </span>
            );
          }

          return (
            <MatchedFieldsBadges
              matchedFields={row.original.kind === "match" ? row.original.matchedFields : undefined}
            />
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          if (row.original.kind === "unmatched") {
            return null;
          }

          const { internalId, externalId } = row.original;

          const confirmedInternalId = confirmedByExternalId[externalId] ?? "";
          const rejected = !!rejectedPairs[pairKey(internalId, externalId)];
          const confirmed = confirmedInternalId === internalId;
          const confirmDisabled = Boolean(confirmedInternalId) && !confirmed;

          return (
            <MatchDecisionButtons
              internalId={internalId}
              externalId={externalId}
              confirmed={confirmed}
              rejected={rejected}
              confirmDisabled={confirmDisabled}
              onToggleConfirm={onToggleConfirm}
              onToggleReject={onToggleReject}
            />
          );
        },
      },
    ];
  }, [confirmedByExternalId, onToggleConfirm, onToggleReject, rejectedPairs]);

  const table = useReactTable({
    data,
    columns,
    globalFilterFn,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold">Suggested matches</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Showing matches with confidenceScore ≥ {(threshold * 100).toFixed(0)}%
      </p>

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnlyFoundMatches}
            onChange={(e) => setShowOnlyFoundMatches(e.target.checked)}
          />
          Show only found matches
        </label>

        <div className="flex w-full items-center gap-2 md:w-auto">
          <input
            className="w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 md:w-80"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search"
          />
        </div>
      </div>

      <SuggestedMatchesTable table={table} />
    </div>
  );
}
