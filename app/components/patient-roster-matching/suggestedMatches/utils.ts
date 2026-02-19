import type { Field } from "../../../api/patient/matches/schemas";

import type { PatientRecord } from "../utils";

export type PatientMatchReport = {
  recordA: PatientRecord;
  recordB: PatientRecord;
  confidenceScore: number;
  matchedFields: Field[];
};

type MatchRow = {
  kind: "match" | "rejected";
  internalId: string;
  internal: PatientRecord;
  externalId: string;
  external: PatientRecord;
  confidenceScore: number;
  matchedFields: Field[];
};

type UnmatchedRow = {
  kind: "unmatched";
  externalId: string;
  external: PatientRecord;
};

export type SuggestedMatchesRow = MatchRow | UnmatchedRow;

export function pairKey(internalId: string, externalId: string): string {
  return `${internalId}::${externalId}`;
}

export function buildSuggestedMatchesRows(args: {
  externalRecords: PatientRecord[];
  reports: PatientMatchReport[];
  threshold: number;
  showOnlyFoundMatches: boolean;
  rejectedPairs: Record<string, true>;
}): SuggestedMatchesRow[] {
  const { externalRecords, reports, threshold, showOnlyFoundMatches, rejectedPairs } = args;

  // group matches by external id so that we can display unmatched records efficiently
  const matchesByExternalId: Record<string, PatientMatchReport[]> = {};

  for (const report of reports) {
    if (report.confidenceScore < threshold) {
      continue;
    }

    const externalId = (report.recordA.externalPatientId ?? "").trim();

    if (!externalId) {
      continue;
    }

    const existing = matchesByExternalId[externalId];

    if (existing) {
      existing.push(report);
    } else {
      matchesByExternalId[externalId] = [report];
    }
  }

  const rows: SuggestedMatchesRow[] = [];

  for (const external of externalRecords) {
    const externalId = (external.externalPatientId ?? "").trim();

    if (!externalId) {
      continue;
    }

    const matches = matchesByExternalId[externalId] ?? [];

    if (!matches.length) {
      rows.push({ kind: "unmatched", externalId, external });

      continue;
    }

    for (const match of matches) {
      const internalId = (match.recordB.internalPatientId ?? "").trim();

      if (!internalId) {
        continue;
      }

      const key = pairKey(internalId, externalId);
      const kind = rejectedPairs[key] ? "rejected" : "match";

      rows.push({
        kind,
        internalId,
        internal: match.recordB,
        externalId,
        external,
        confidenceScore: match.confidenceScore,
        matchedFields: match.matchedFields,
      });
    }
  }

  return showOnlyFoundMatches ? rows.filter((row) => row.kind === "match") : rows;
}
