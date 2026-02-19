import { Field, PatientRecord } from "../schemas";
import { normalizeByField } from "../normalizers";
import { getHybridSimilarity } from "./similarity";

const fieldWeights: Record<Field, number> = {
  phoneNumber: 0.25,
  address: 0.2,

  lastName: 0.18,
  dob: 0.15,
  firstName: 0.06,

  zipCode: 0.06,
  city: 0.04,
  sex: 0.01,
};

const interactionBoosts = {
  "address:dob:firstName": 0.3, // 0.71
  "address:firstName:lastName": 0.2, // 0.64

  "dob:firstName:lastName": 0.4, // 0.79
  "dob:lastName:zipCode": 0.3, // 0.69
  "dob:phoneNumber:zipCode": 0.3, // 0.76
  "dob:sex:zipCode": 0.35, // 0.57

  "firstName:lastName:phoneNumber": 0.3, // 0.79
  "firstName:lastName:zipCode": 0.35, // 0.65
};

const nonMatchPenalties: Partial<Record<Field, number>> = {
  dob: -0.8,
  sex: -0.2,
  phoneNumber: -0.1,
  firstName: -0.1,
  lastName: -0.1,
};

const similarityThresholds: Record<Field, number> = {
  phoneNumber: 0.86,
  address: 0.8,
  lastName: 0.8,
  dob: 1.0,
  firstName: 0.7,
  zipCode: 1.0,
  city: 0.8,
  sex: 1.0,
};

function getSimilarityByField(field: Field, valA: string, valB: string): number {
  switch (field) {
    case Field.phoneNumber:
    case Field.address:
    case Field.firstName:
    case Field.lastName:
      return getHybridSimilarity(valA, valB, "subset");
    default:
      return getHybridSimilarity(valA, valB);
  }
}

export function getPatientMatchConfidenceScore(
  recordA: PatientRecord,
  recordB: PatientRecord,
): [number, Field[]] {
  const matches: Map<Field, number> = new Map();

  for (const key in fieldWeights) {
    const field = key as Field;

    const valA = recordA[field];
    const valB = recordB[field];

    const normalizedA = normalizeByField(field, valA);
    const normalizedB = normalizeByField(field, valB);

    if (!normalizedA || !normalizedB) {
      continue;
    }

    const similarity = getSimilarityByField(field, normalizedA, normalizedB);

    if (similarity >= similarityThresholds[field]) {
      matches.set(field, similarity);
    }
  }

  let score = 0;

  const interactionBoost = getInteractionBoost(matches);

  if (interactionBoost) {
    const boostValue = interactionBoosts[interactionBoost as keyof typeof interactionBoosts];
    const fieldsInInteraction = interactionBoost.split(":") as Field[];
    const avgSimilarity =
      fieldsInInteraction.reduce((sum, field) => sum + (matches.get(field) || 0), 0) /
      fieldsInInteraction.length;

    score += boostValue * avgSimilarity;
  }

  for (const [field, similarity] of matches) {
    score += fieldWeights[field] * similarity;
  }

  score = Math.min(score, 1.0);

  score += getNonMatchPenalty(recordA, recordB, matches);

  return [Math.max(score, 0), Array.from(matches.keys())];
}

function getInteractionBoost(matches: Map<Field, number>): string | undefined {
  let boost = 0;
  let largestInteractionBoost: string | undefined;

  for (const [interaction, interactionBoost] of Object.entries(interactionBoosts)) {
    const fields = interaction.split(":") as Field[];

    if (fields.every((field) => matches.has(field))) {
      if (interactionBoost > boost) {
        boost = interactionBoost;

        largestInteractionBoost = interaction;
      }
    }
  }

  return largestInteractionBoost;
}

function getNonMatchPenalty(
  recordA: PatientRecord,
  recordB: PatientRecord,
  matches: Map<Field, number>,
): number {
  let penalty = 0;

  for (const [key, penaltyValue] of Object.entries(nonMatchPenalties)) {
    const field = key as Field;

    if (matches.has(field)) {
      continue;
    }

    const normalizedA = normalizeByField(field, recordA[field]);
    const normalizedB = normalizeByField(field, recordB[field]);

    if (!normalizedA || !normalizedB) {
      continue;
    }

    const similarity = getSimilarityByField(field, normalizedA, normalizedB);

    // reduces the penalty based on how similar the values are
    const scaledPenalty = penaltyValue * (1 - similarity);
    penalty += scaledPenalty;
  }

  return penalty;
}
