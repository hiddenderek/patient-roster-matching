import { z } from "zod";

export const patientRecordSchema = z.object({
  internalPatientId: z.string().optional(),
  externalPatientId: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  dob: z.string(),
  sex: z.string(),
  phoneNumber: z.string(),
  address: z.string(),
  zipCode: z.string(),
  city: z.string(),
});

export type PatientRecord = z.infer<typeof patientRecordSchema>;

export enum Field {
  phoneNumber = "phoneNumber",
  address = "address",
  lastName = "lastName",
  dob = "dob",
  firstName = "firstName",
  zipCode = "zipCode",
  city = "city",
  sex = "sex",
}

export type PatientMatchReport = {
  recordA: PatientRecord;
  recordB: PatientRecord;
  confidenceScore: number;
  matchedFields: Field[];
};

export const matchesRequestSchema = z.object({
  list1: z.array(patientRecordSchema),
  list2: z.array(patientRecordSchema),
  threshold: z.number().min(0).max(1).optional(),
});

export type MatchesRequest = z.infer<typeof matchesRequestSchema>;
