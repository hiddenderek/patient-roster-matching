import { scanForPatientMatches } from "./scanForPatientMatches";
import { DEFAULT_THRESHOLD } from "@/app/constants";
import type { PatientRecord } from "./schemas";

function makeRecord(overrides: Partial<PatientRecord> = {}): PatientRecord {
  return {
    firstName: "John",
    lastName: "Smith",
    dob: "1980-01-01",
    sex: "M",
    phoneNumber: "5551112222",
    address: "123 main st",
    zipCode: "12345",
    city: "Springfield",
    ...overrides,
  };
}

describe("scanForPatientMatches", () => {
  test("returns matches above threshold", () => {
    const a = makeRecord();
    const b = makeRecord({ phoneNumber: "(555) 111-2222" });

    const reports = scanForPatientMatches([a], [b], { threshold: DEFAULT_THRESHOLD });

    expect(reports.length).toBe(1);
    expect(reports[0].confidenceScore).toBeGreaterThanOrEqual(DEFAULT_THRESHOLD);
  });

  test("uses blocking keys when available", () => {
    const a = makeRecord({ firstName: "John", lastName: "Smith", phoneNumber: "5551112222" });
    const good = makeRecord({ firstName: "John", lastName: "Smith", phoneNumber: "5551112222" });
    const noise1 = makeRecord({ phoneNumber: "0000000000", lastName: "Nope", dob: "1900-12-31" });
    const noise2 = makeRecord({ phoneNumber: "0000000001", lastName: "Nope", dob: "1900-12-31" });

    const reports = scanForPatientMatches([a], [noise1, noise2, good], {
      threshold: DEFAULT_THRESHOLD,
    });

    expect(reports.some((r) => r.recordB.phoneNumber === good.phoneNumber)).toBe(true);
  });
});
