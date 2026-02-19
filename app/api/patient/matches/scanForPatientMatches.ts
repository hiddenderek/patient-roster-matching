import { DEFAULT_THRESHOLD } from "@/app/constants";
import { PatientMatchReport, PatientRecord } from "./schemas";
import { getPatientMatchConfidenceScore } from "./patientMatchScore";
import { normalizeAddressText, normalizeDob, normalizeName, normalizePhone } from "./normalizers";

function addToIndex<T>(index: Map<string, T[]>, key: string, value: T): void {
  if (!key) {
    return;
  }

  const existing = index.get(key);
  if (existing) {
    existing.push(value);
  } else {
    index.set(key, [value]);
  }
}

export function scanForPatientMatches(
  list1: PatientRecord[],
  list2: PatientRecord[],
  options: { threshold?: number } = {},
): PatientMatchReport[] {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const patientMatchReports: PatientMatchReport[] = [];

  const lastNameIndex = new Map<string, Array<{ record: PatientRecord; index: number }>>();
  const firstNameIndex = new Map<string, Array<{ record: PatientRecord; index: number }>>();
  const dobIndex = new Map<string, Array<{ record: PatientRecord; index: number }>>();
  const phoneIndex = new Map<string, Array<{ record: PatientRecord; index: number }>>();
  const addressIndex = new Map<string, Array<{ record: PatientRecord; index: number }>>();

  for (let i = 0; i < list2.length; i++) {
    const record = list2[i];

    const last = normalizeName(record.lastName);
    const first = normalizeName(record.firstName);
    const phone = normalizePhone(record.phoneNumber);
    const dob = normalizeDob(record.dob);
    const address = normalizeAddressText(record.address);

    addToIndex(lastNameIndex, last, { record, index: i });
    addToIndex(firstNameIndex, first, { record, index: i });
    addToIndex(dobIndex, dob, { record, index: i });
    addToIndex(phoneIndex, phone, { record, index: i });
    addToIndex(addressIndex, address, { record, index: i });
  }

  for (const recordA of list1) {
    const candidateIndices = new Set<number>();
    const candidates: PatientRecord[] = [];

    const lastA = normalizeName(recordA.lastName);
    const firstA = normalizeName(recordA.firstName);
    const dobA = normalizeDob(recordA.dob);
    const phoneA = normalizePhone(recordA.phoneNumber);
    const addressA = normalizeAddressText(recordA.address);

    for (const hit of phoneIndex.get(phoneA) ?? []) {
      if (!candidateIndices.has(hit.index)) {
        candidateIndices.add(hit.index);
        candidates.push(hit.record);
      }
    }

    for (const hit of dobIndex.get(dobA) ?? []) {
      if (!candidateIndices.has(hit.index)) {
        candidateIndices.add(hit.index);
        candidates.push(hit.record);
      }
    }

    for (const hit of lastNameIndex.get(lastA) ?? []) {
      if (!candidateIndices.has(hit.index)) {
        candidateIndices.add(hit.index);
        candidates.push(hit.record);
      }
    }

    for (const hit of firstNameIndex.get(firstA) ?? []) {
      if (!candidateIndices.has(hit.index)) {
        candidateIndices.add(hit.index);
        candidates.push(hit.record);
      }
    }

    for (const hit of addressIndex.get(addressA) ?? []) {
      if (!candidateIndices.has(hit.index)) {
        candidateIndices.add(hit.index);
        candidates.push(hit.record);
      }
    }

    const recordsToCompare = candidates;

    for (const recordB of recordsToCompare) {
      const [confidenceScore, matchedFields] = getPatientMatchConfidenceScore(recordA, recordB);

      if (confidenceScore >= threshold) {
        patientMatchReports.push({
          recordA,
          recordB,
          confidenceScore,
          matchedFields,
        });
      }
    }
  }

  return patientMatchReports;
}
