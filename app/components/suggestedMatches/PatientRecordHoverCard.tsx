"use client";

import React, { type ReactElement } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { normalizeDob } from "../../api/patient/matches/normalizers";
import type { PatientRecord } from "../utils";

export type PatientRecordHoverCardProps = {
  name: string;
  dob?: string;
  phoneNumber?: string;
  record: PatientRecord;
  align?: "left" | "right";
};

const triggerContainerClass = "cursor-help flex max-w-full flex-col leading-tight";
const triggerNameClass = "truncate text-sm";
const triggerSubtextClass = "truncate font-mono text-xs text-neutral-600";

const popoverContentClass =
  "z-50 w-[22rem] max-h-[70vh] overflow-auto rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-900 shadow";
const popoverTitleClass = "text-xs font-semibold uppercase tracking-wide text-neutral-700";
const gridClass = "mt-2 grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1";
const fieldLabelClass = "text-xs font-medium text-neutral-600";
const fieldValueClass = "text-xs text-neutral-900";
const fieldValueMonoClass = "font-mono text-xs text-neutral-900";

function displayValue(rawValue: string | undefined): string {
  const value = (rawValue ?? "").trim();

  return value ? value : "—";
}

export function PatientRecordHoverCard({
  name,
  dob,
  phoneNumber,
  record,
  align = "left",
}: PatientRecordHoverCardProps): ReactElement {
  const displayDob = normalizeDob(dob ?? record.dob);
  const displayPhone = (phoneNumber ?? record.phoneNumber ?? "").trim();

  return (
    <HoverCard.Root openDelay={80} closeDelay={80}>
      <HoverCard.Trigger asChild>
        <div className={triggerContainerClass}>
          <div className={triggerNameClass}>{name}</div>
          {displayDob ? <div className={triggerSubtextClass}>DOB: {displayDob}</div> : null}
          {displayPhone ? <div className={triggerSubtextClass}>Phone: {displayPhone}</div> : null}
        </div>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          className={popoverContentClass}
          side="bottom"
          align={align === "right" ? "end" : "start"}
          sideOffset={8}
        >
          <div className={popoverTitleClass}>Full record</div>

          <div className={gridClass}>
            {Object.entries(record).map(([label, value]) => {
              if (!value && label.includes("PatientId")) {
                return;
              }

              return (
                <React.Fragment key={label}>
                  <div className={fieldLabelClass}>{label}</div>
                  <div className={fieldValueClass}>{displayValue(value)}</div>
                </React.Fragment>
              );
            })}
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
