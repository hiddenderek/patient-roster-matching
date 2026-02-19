"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import { CsvUploadCard } from "./CsvUploadCard";
import { SuggestedMatches } from "./suggestedMatches/SuggestedMatches";
import { ThresholdControls } from "./ThresholdControls";
import { DEFAULT_THRESHOLD } from "@/app/constants";
import { downloadMatchesCsv, removeKey } from "./utils";
import type { PatientRecord } from "./utils";
import { PatientMatchReport } from "./suggestedMatches/utils";

export function PatientRosterMatching(): ReactElement {
  const [internalRecords, setInternalRecords] = useState<PatientRecord[] | null>(null);
  const [externalRecords, setExternalRecords] = useState<PatientRecord[] | null>(null);

  const [reports, setReports] = useState<PatientMatchReport[] | null>(null);
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [appliedThreshold, setAppliedThreshold] = useState<number>(DEFAULT_THRESHOLD);

  const [confirmedByExternalId, setConfirmedByExternalId] = useState<Record<string, string>>({});
  const [rejectedPairs, setRejectedPairs] = useState<Record<string, true>>({});

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const confirmedRows = useMemo(() => {
    const rows: Array<{ externalPatientId: string; internalPatientId: string }> = [];

    for (const [externalId, internalId] of Object.entries(confirmedByExternalId)) {
      if (!externalId || !internalId) {
        continue;
      }

      rows.push({ internalPatientId: internalId, externalPatientId: externalId });
    }
    return rows;
  }, [confirmedByExternalId]);

  async function runMatching(): Promise<void> {
    setError(null);
    setIsLoading(true);
    setReports(null);
    setConfirmedByExternalId({});
    setRejectedPairs({});

    try {
      if (!internalRecords?.length || !externalRecords?.length) {
        throw new Error("Upload both Internal and External CSV files first.");
      }

      const res = await fetch("/api/patient/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list1: externalRecords,
          list2: internalRecords,
          threshold,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = `Request failed (${res.status})`;
        throw new Error(msg);
      }

      const data = json as { reports: PatientMatchReport[] };

      setReports(Array.isArray(data.reports) ? data.reports : []);
      setAppliedThreshold(threshold);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  function pairKey(internalId: string, externalId: string): string {
    return `${internalId}::${externalId}`;
  }

  function toggleReject(internalId: string, externalId: string): void {
    const key = pairKey(internalId, externalId);

    setRejectedPairs((prev) => {
      if (prev[key]) {
        return removeKey(prev, key);
      }

      return { ...prev, [key]: true };
    });

    setConfirmedByExternalId((prev) => {
      if (prev[externalId] === internalId) {
        return removeKey(prev, externalId);
      }

      return prev;
    });
  }

  function toggleConfirmMatch(internalId: string, externalId: string): void {
    const key = pairKey(internalId, externalId);

    setRejectedPairs((prev) => {
      if (prev[key]) {
        return removeKey(prev, key);
      }

      return prev;
    });

    setConfirmedByExternalId((prev) => {
      if (prev[externalId] === internalId) {
        return removeKey(prev, externalId);
      }

      return { ...prev, [externalId]: internalId };
    });
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h1 className="text-xl font-semibold text-neutral-900">Patient roster matching</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Upload internal + external CSVs, find suggested matches, confirm/reject, then export.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <CsvUploadCard
            title="Upload external CSV"
            description="Required columns include: ExternalPatientId, FirstName, LastName, DOB, Sex, PhoneNumber, Address, ZipCode, City"
            accept=".csv,text/csv"
            requiredIdField="externalPatientId"
            onRecordsLoaded={setExternalRecords}
            onError={setError}
            loadedCount={externalRecords ? externalRecords.length : null}
          />

          <CsvUploadCard
            title="Upload internal CSV"
            description="Required columns include: InternalPatientId, FirstName, LastName, DOB, Sex, PhoneNumber, Address, ZipCode, City"
            accept=".csv,text/csv"
            requiredIdField="internalPatientId"
            onRecordsLoaded={setInternalRecords}
            onError={setError}
            loadedCount={internalRecords ? internalRecords.length : null}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
          <ThresholdControls threshold={threshold} onChange={setThreshold} />

          <div className="flex items-center gap-3">
            <button
              className="cursor-pointer rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading || !internalRecords?.length || !externalRecords?.length}
              onClick={runMatching}
            >
              {isLoading ? "Matching..." : "Find matches"}
            </button>

            <button
              className="cursor-pointer rounded border border-neutral-200 bg-white px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              disabled={confirmedRows.length === 0}
              onClick={() => downloadMatchesCsv(confirmedRows)}
            >
              Download matches
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {reports && externalRecords ? (
          <SuggestedMatches
            externalRecords={externalRecords}
            reports={reports}
            threshold={appliedThreshold}
            confirmedByExternalId={confirmedByExternalId}
            rejectedPairs={rejectedPairs}
            onToggleConfirm={toggleConfirmMatch}
            onToggleReject={toggleReject}
          />
        ) : null}
      </div>
    </main>
  );
}
