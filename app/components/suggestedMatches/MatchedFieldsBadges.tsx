"use client";

import type { ReactElement } from "react";

import type { Field } from "../../api/patient/matches/schemas";

export type MatchedFieldsBadgesProps = {
  matchedFields?: Field[] | null;
};

export function MatchedFieldsBadges({ matchedFields }: MatchedFieldsBadgesProps): ReactElement {
  if (!matchedFields?.length) {
    return (
      <span className="rounded-full border bg-neutral-50 px-2.5 py-1 text-xs text-neutral-700">
        No match
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {matchedFields.map((field) => (
        <span
          key={field}
          className="rounded-full border bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700"
        >
          {field}
        </span>
      ))}
    </div>
  );
}
