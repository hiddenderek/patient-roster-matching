"use client";

import type { ReactElement } from "react";
import { twMerge } from "tailwind-merge";

export type MatchDecisionButtonsProps = {
  internalId: string;
  externalId: string;
  confirmed: boolean;
  rejected: boolean;
  confirmDisabled?: boolean;
  onToggleConfirm: (internalId: string, externalId: string) => void;
  onToggleReject: (internalId: string, externalId: string) => void;
};

export function MatchDecisionButtons({
  internalId,
  externalId,
  confirmed,
  rejected,
  confirmDisabled = false,
  onToggleConfirm,
  onToggleReject,
}: MatchDecisionButtonsProps): ReactElement {
  const wrapperClass = "inline-flex overflow-hidden rounded-md border border-neutral-200 bg-white";
  const buttonBaseClass =
    "cursor-pointer px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-inset";
  const leftButtonClass = "border-r border-neutral-200";

  const confirmClass = confirmed
    ? "bg-black text-white"
    : "bg-white text-neutral-900 hover:bg-neutral-50";

  const confirmDisabledClass = confirmDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer";

  const rejectClass = rejected
    ? "bg-black text-white"
    : "bg-white text-neutral-900 hover:bg-neutral-50";

  return (
    <div className={wrapperClass}>
      <button
        className={twMerge(buttonBaseClass, leftButtonClass, confirmClass, confirmDisabledClass)}
        title={
          confirmDisabled ? "Only one internal patient id can be confirmed at a time" : undefined
        }
        onClick={() => {
          if (confirmDisabled) {
            return;
          }

          onToggleConfirm(internalId, externalId);
        }}
        disabled={confirmDisabled}
      >
        {confirmed ? "Undo confirm" : "Confirm"}
      </button>
      <button
        className={twMerge(buttonBaseClass, rejectClass)}
        onClick={() => onToggleReject(internalId, externalId)}
      >
        {rejected ? "Undo reject" : "Reject"}
      </button>
    </div>
  );
}
