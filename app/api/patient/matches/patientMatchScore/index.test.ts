import { normalizeAddressText, normalizeDob, normalizeName, normalizePhone } from "../normalizers";
import { getHybridSimilarity, similarityRatio, tokenScore } from "./similarity";
import { PatientRecord } from "../schemas";
import { getPatientMatchConfidenceScore } from "./index";

function makeRecord(overrides: Partial<PatientRecord> = {}): PatientRecord {
  return {
    internalPatientId: "I-1",
    externalPatientId: "E-1",
    firstName: "John",
    lastName: "Smith",
    dob: "1980-01-01",
    sex: "M",
    phoneNumber: "5551112222",
    address: "123 Main St #5",
    zipCode: "12345",
    city: "Springfield",
    ...overrides,
  };
}

function scoreOf(a: PatientRecord, b: PatientRecord): number {
  return getPatientMatchConfidenceScore(a as any, b as any)[0];
}

describe("normalizers", () => {
  test("normalizePhone strips punctuation", () => {
    expect(normalizePhone("(555) 111-2222")).toBe("555 111 2222");
  });

  test("normalizePhone drops leading country code 1", () => {
    expect(normalizePhone("+1 555 111 2222")).toBe("555 111 2222");
  });

  test("normalizeDob supports d-MMM-yyyy", () => {
    expect(normalizeDob("5-sep-1994")).toBe("1994-09-05");
  });

  test("normalizeName lowercases and removes punctuation", () => {
    expect(normalizeName("O'Neill")).toBe("oneill");
  });

  test("normalizeAddressText converts #unit to apt", () => {
    expect(normalizeAddressText("123 Main St #5")).toContain("apt 5");
  });
});

describe("similarity helpers", () => {
  test("similarityRatio is 1 for identical strings", () => {
    expect(similarityRatio("abc", "abc")).toBe(1);
  });

  test("tokenOverlapScore rewards shared tokens", () => {
    expect(tokenScore("123 main st", "main 123 st")).toBe(1);
  });

  test("getHybridSimilarity uses the better of levenshtein or token overlap", () => {
    const a = "john smith";
    const b = "smith john";
    expect(getHybridSimilarity(a, b)).toBeGreaterThan(0.8);
  });
});

describe("getPatientMatchConfidenceScore", () => {
  test("returns 1.0 for a strong overall exact match (caps at 1.0)", () => {
    const a = makeRecord();
    const b = makeRecord({
      firstName: "JOHN",
      lastName: "SMITH",
      city: "springfield",
      address: "123 main street apt 5",
      phoneNumber: "+1 (555) 111-2222",
    });

    expect(scoreOf(a, b)).toBe(1);
  });

  test("scores phoneNumber-only match", () => {
    const a = makeRecord();
    const b = makeRecord({
      firstName: "Zoe",
      lastName: "Ng",
      address: "999 nowhere rd",
      zipCode: "99999",
      city: "Nowhere",
      phoneNumber: a.phoneNumber,
    });

    expect(scoreOf(a, b)).toBeCloseTo(0.24, 2);
  });

  test("scores lastName-only match", () => {
    const a = makeRecord();
    const b = makeRecord({
      firstName: "Alice",
      phoneNumber: "0000000000",
      address: "999 nowhere rd",
      zipCode: "99999",
      city: "Nowhere",
      lastName: a.lastName,
    });

    expect(scoreOf(a, b)).toBeCloseTo(0.16, 2);
  });

  test("scores dob-only match", () => {
    const a = makeRecord({ dob: "1994-09-05" });
    const b = makeRecord({
      firstName: "Alice",
      phoneNumber: "0000000000",
      address: "999 nowhere rd",
      zipCode: "99999",
      city: "Nowhere",
      dob: "09/05/1994",
    });

    expect(scoreOf(a, b)).toBeCloseTo(0.16, 2);
  });

  test("scores address-only match", () => {
    const a = makeRecord({
      phoneNumber: "0000000000",
      firstName: "A",
      lastName: "B",
      zipCode: "99999",
      city: "Nowhere",
      address: "123 Main St #5",
    });
    const b = makeRecord({
      phoneNumber: "1111111111",
      firstName: "C",
      lastName: "D",
      zipCode: "99998",
      city: "Somewhere",
      address: "123 main street apt 5",
    });

    expect(scoreOf(a, b)).toBeCloseTo(0.08, 2);
  });

  test("scores address-only match via subset", () => {
    const a = makeRecord({
      phoneNumber: "0000000000",
      firstName: "A",
      lastName: "B",
      zipCode: "99999",
      city: "Nowhere",
      address: "123 Main St #5",
    });
    const b = makeRecord({
      phoneNumber: "1111111111",
      firstName: "C",
      lastName: "D",
      zipCode: "99998",
      city: "Somewhere",
      address: "123 main street",
    });

    expect(scoreOf(a, b)).toBeCloseTo(0.05, 2);
  });

  test("uses interaction boost for lastName + phoneNumber", () => {
    const a = makeRecord();
    const b = makeRecord({
      firstName: "Alice",
      address: "999 nowhere rd",
      zipCode: "99999",
      city: "Nowhere",
    });

    expect(scoreOf(a, b)).toBeCloseTo(0.49, 2);
  });

  test("penalizes for sex difference", () => {
    const a = makeRecord();
    const b = makeRecord({
      firstName: "Alice",
      address: "999 nowhere rd",
      sex: "F",
      zipCode: "99999",
      city: "Nowhere",
      lastName: a.lastName,
      phoneNumber: a.phoneNumber,
    });

    expect(scoreOf(a, b)).toBeCloseTo(0.28, 2);
  });

  test("penalizes for dob difference", () => {
    const a = makeRecord();
    const b = makeRecord({
      firstName: "Alice",
      address: "999 nowhere rd",
      dob: "1990-01-01",
      zipCode: "99999",
      city: "Nowhere",
      lastName: a.lastName,
      phoneNumber: a.phoneNumber,
    });

    expect(scoreOf(a, b)).toBeCloseTo(0.26, 2);
  });
});
