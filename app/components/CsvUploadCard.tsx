"use client";

import type { ReactElement } from "react";

import { csvRowsToPatientRecords, parseCsvFile } from "./utils";
import type { PatientRecord } from "./utils";

export type CsvUploadCardProps = {
  title: string;
  description: string;
  accept: string;
  requiredIdField: "internalPatientId" | "externalPatientId";
  onRecordsLoaded: (records: PatientRecord[] | null) => void;
  onError: (message: string | null) => void;
  loadedCount: number | null;
};

const uploadStatusClass = "rounded-full border bg-neutral-50 px-2.5 py-1 text-xs text-neutral-700";

export function CsvUploadCard({
  title,
  description,
  accept,
  requiredIdField,
  onRecordsLoaded,
  onError,
  loadedCount,
}: CsvUploadCardProps): ReactElement {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
        </div>

        <div className="shrink-0">
          {loadedCount !== null ? (
            <span className={uploadStatusClass}>{loadedCount} loaded</span>
          ) : (
            <span className={uploadStatusClass}>No file</span>
          )}
        </div>
      </div>

      <input
        className="mt-4 block w-full cursor-pointer rounded border border-neutral-200 bg-white text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-900 hover:file:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300"
        type="file"
        accept={accept}
        onChange={async (e) => {
          onError(null);
          const file = e.target.files?.[0] ?? null;

          onRecordsLoaded(null);

          if (!file) {
            return;
          }

          try {
            const rows = await parseCsvFile(file);
            const records = csvRowsToPatientRecords(rows);

            const missingId = records.find((record) => !(record[requiredIdField] ?? "").trim());

            if (missingId) {
              throw new Error(
                `${requiredIdField === "internalPatientId" ? "Internal" : "External"} CSV is missing InternalPatientId for one or more rows.`,
              );
            }

            onRecordsLoaded(records);
            onError(null);
          } catch (err) {
            onError(err instanceof Error ? err.message : "Failed to parse CSV");
          }
        }}
      />
    </div>
  );
}
