import { Field, PatientRecord } from "../schemas";
import { normalizeByField } from "../normalizers";
import { getHybridSimilarity } from "./similarity";

const fieldWeights: Record<Field, number> = {
  phoneNumber: 0.25,
  address: 0.22,

  lastName: 0.18,
  dob: 0.15,
  firstName: 0.08,

  zipCode: 0.06,
  city: 0.04,
  sex: 0.02,
};

const interactionBoosts = {
  "address:dob:firstName": 0.15, // 0.60

  "dob:firstName:lastName": 0.2, // 0.61
  "dob:lastName:zipCode": 0.1, // 0.49
  "dob:phoneNumber:zipCode": 0.1, // 0.56

  "firstName:lastName:phoneNumber": 0.1, // 0.61
  "firstName:lastName:zipCode": 0.1, // 0.42
};

const nonMatchPenalties: Partial<Record<Field, number>> = {
  dob: -0.4,
  sex: -0.2,
};

const similarityThresholds: Record<Field, number> = {
  phoneNumber: 0.86,
  address: 0.8,
  lastName: 0.5,
  dob: 1.0,
  firstName: 0.5,
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
  const nonMatches: Map<Field, number> = new Map();

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
    } else {
      nonMatches.set(field, similarity);
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

  score += getNonMatchPenalty(nonMatches);

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
  nonMatches: Map<Field, number>,
): number {
  let penalty = 0;

  for (const [key, penaltyValue] of Object.entries(nonMatchPenalties)) {
    const field = key as Field;

    const similarity = nonMatches.get(field);

    if (similarity === undefined) {
      continue;
    }

    // reduces the penalty based on how similar the values are
    const scaledPenalty = penaltyValue * (1 - similarity);
    penalty += scaledPenalty;
  }

  return penalty;
}
