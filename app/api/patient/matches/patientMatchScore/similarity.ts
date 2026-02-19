function levenshteinDistance(s1: string, s2: string): number {
  if (s1.length < s2.length) {
    return levenshteinDistance(s2, s1);
  }

  let previousRow: number[] = Array.from({ length: s2.length + 1 }, (_, i) => i);

  for (let i = 0; i < s1.length; i++) {
    const currentRow: number[] = [i + 1];

    for (let j = 0; j < s2.length; j++) {
      const insertions = previousRow[j + 1] + 1;
      const deletions = currentRow[j] + 1;
      const substitutions = previousRow[j] + (s1[i] !== s2[j] ? 1 : 0);

      currentRow.push(Math.min(insertions, deletions, substitutions));
    }

    previousRow = currentRow;
  }

  return previousRow[previousRow.length - 1];
}

export function similarityRatio(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);

  if (maxLen === 0) {
    return 1.0;
  }

  return 1.0 - levenshteinDistance(s1, s2) / maxLen;
}

function getTokens(s: string): Set<string> {
  // added regex to handle double spaces or tabs
  return new Set(s.split(/\s+/));
}

export function tokenScore(
  s1: string,
  s2: string,
  scoring: "overlap" | "subset" = "overlap",
): number {
  const tokens1 = getTokens(s1);
  const tokens2 = getTokens(s2);

  if (tokens1.size === 0 || tokens2.size === 0) {
    return 0.0;
  }

  const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));

  // added subset scoring option which gives partial credit for one string being a subset of the other
  if (scoring === "subset") {
    const smallerSize = Math.min(tokens1.size, tokens2.size);
    const largerSize = Math.max(tokens1.size, tokens2.size);
    const subsetScore = intersection.size / smallerSize;
    const sizePenalty = Math.cbrt(smallerSize / largerSize);

    return subsetScore * sizePenalty;
  }

  const union = new Set([...tokens1, ...tokens2]);

  return intersection.size / union.size;
}

export function getHybridSimilarity(
  val1: string,
  val2: string,
  tokenScoring: "overlap" | "subset" = "overlap",
): number {
  if (val1 === val2) {
    return 1.0;
  }

  if (!val1 || !val2) {
    return 0.0;
  }

  const levenshtein = similarityRatio(val1, val2);
  const jaccard = tokenScore(val1, val2, tokenScoring);

  return Math.max(levenshtein, jaccard);
}
