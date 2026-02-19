import Papa from "papaparse";

import { normalizeDob } from "../api/patient/matches/normalizers";

export type PatientRecord = {
  internalPatientId?: string;
  externalPatientId?: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: string;
  phoneNumber: string;
  address: string;
  zipCode: string;
  city: string;
};

export type CsvRow = Record<string, unknown>;

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

export async function parseCsvFile(file: File): Promise<CsvRow[]> {
  const text = await file.text();
  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => (typeof value === "string" ? value.trim() : value),
  });

  if (parsed.errors?.length) {
    const first = parsed.errors[0];

    throw new Error(first.message || "CSV parse error");
  }

  return parsed.data ?? [];
}

export function csvRowsToPatientRecords(rows: CsvRow[]): PatientRecord[] {
  return rows.map((row) => ({
    internalPatientId: asString(row.InternalPatientId),
    externalPatientId: asString(row.ExternalPatientId),
    firstName: asString(row.FirstName),
    lastName: asString(row.LastName),
    dob: asString(row.DOB),
    sex: asString(row.Sex),
    phoneNumber: asString(row.PhoneNumber),
    address: asString(row.Address),
    zipCode: asString(row.ZipCode),
    city: asString(row.City),
  }));
}

export function formatPatientName(record: PatientRecord): string {
  const name = `${record.lastName}, ${record.firstName}`.trim().replace(/^,\s*/, "");

  return name || "(Unnamed)";
}

export function patientLabel(record: PatientRecord): string {
  const name = formatPatientName(record);
  const dobDisplay = normalizeDob(record.dob);
  const dob = dobDisplay ? ` (${dobDisplay})` : "";

  return name + dob;
}

export function downloadMatchesCsv(
  rows: Array<{ externalPatientId: string; internalPatientId: string }>,
): void {
  const header = "ExternalPatientId,InternalPatientId\n";

  const lines = rows.map((row) => `${row.externalPatientId},${row.internalPatientId}`).join("\n");

  const blob = new Blob([header + lines + "\n"], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "matches.csv";
  a.click();

  URL.revokeObjectURL(url);
}

export function removeKey<T>(obj: Record<string, T>, key: string): Record<string, T> {
  const next = { ...obj };

  delete next[key];

  return next;
}

export function pairKey(internalId: string, externalId: string): string {
  return `${internalId}::${externalId}`;
}