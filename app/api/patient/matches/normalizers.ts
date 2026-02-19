import { format, isValid, parse } from "date-fns";
import { Field } from "./schemas";

type AddressNormalizerOptions = {
  keepUnitMarker?: boolean;
};

export function normalizePhone(input: string): string {
  const digits = (input ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  let normalized = digits;

  if (digits.length === 11 && digits.startsWith("1")) {
    normalized = digits.slice(1);
  } else if (digits.length > 10) {
    normalized = digits.slice(-10);
  }

  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
  }

  if (normalized.length === 7) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
  }

  return normalized.split("").join(" ");
}

export function normalizeDob(input: string): string {
  const value = (input ?? "").trim();

  if (!value) {
    return "";
  }

  const formats = [
    "yyyy-MM-dd",
    "yyyy/MM/dd",
    "MM/dd/yyyy",
    "M/d/yyyy",
    "d-MMM-yyyy",
    "dd-MMM-yyyy",
  ];

  for (const fmt of formats) {
    const parsed = parse(value, fmt, new Date(0));

    if (isValid(parsed)) {
      return format(parsed, "yyyy-MM-dd");
    }
  }

  return "";
}

export function normalizeAddressText(input: string, _opts: AddressNormalizerOptions = {}): string {
  let normalizedAddress = (input ?? "")
    .toLowerCase()
    // Treat "#5" / "# 5" as a unit marker.
    .replace(/#\s*([a-z0-9]+)/g, " apt $1 ")
    .replace(/[,]/g, " ")
    .replace(/[.]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const replacements: Array<[RegExp, string]> = [
    [/\bstreet\b|\bst\b/g, "st"],
    [/\broad\b|\brd\b/g, "rd"],
    [/\bavenue\b|\bave\b/g, "ave"],
    [/\bboulevard\b|\bblvd\b/g, "blvd"],
    [/\bdrive\b|\bdr\b/g, "dr"],
    [/\blane\b|\bln\b/g, "ln"],
    [/\bcourt\b|\bct\b/g, "ct"],
    [/\bterrace\b|\bter\b/g, "ter"],
    [/\bplace\b|\bpl\b/g, "pl"],
    [/\bcircle\b|\bcir\b/g, "cir"],
    [/\bhighway\b|\bhwy\b/g, "hwy"],
    [/\bparkway\b|\bpkwy\b/g, "pkwy"],
    [/\btrail\b|\btrl\b/g, "trl"],
    [/\bway\b/g, "way"],

    [/\bapartment\b|\bapt\.\b|\bapt\b/g, "apt"],
    [/\bsuite\b|\bste\b/g, "ste"],
    [/\bunit\b/g, "unit"],
  ];

  for (const [re, rep] of replacements) {
    normalizedAddress = normalizedAddress.replace(re, rep);
  }

  return normalizedAddress.replace(/\s+/g, " ").trim();
}

export function normalizeName(input: string): string {
  return (input ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export function normalizeByField<FieldT extends string>(field: FieldT, input: string): string {
  switch (field) {
    case Field.phoneNumber:
      return normalizePhone(input);
    case Field.dob:
      return normalizeDob(input);
    case Field.address:
      return normalizeAddressText(input);
    case Field.firstName:
    case Field.lastName:
      return normalizeName(input);
    default:
      return (input ?? "").toLowerCase().trim();
  }
}
