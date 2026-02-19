"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

export type ThresholdControlsProps = {
  threshold: number;
  onChange: (value: number) => void;
};

export function ThresholdControls({ threshold, onChange }: ThresholdControlsProps): ReactElement {
  const percent = Math.round(threshold * 100);
  const [inputValue, setInputValue] = useState<string>(String(percent));

  useEffect(() => {
    if (inputValue !== "") {
      setInputValue(String(percent));
    }
  }, [percent]);

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
      <label className="text-sm font-medium text-neutral-900">Confidence score threshold</label>
      <input
        className="w-28 rounded border border-neutral-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
        type="number"
        min={0}
        max={100}
        step={1}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);

          const nextPct =
            e.target.value === "" ? 0 : Math.max(0, Math.min(100, Number(e.target.value)));

          onChange(nextPct / 100);
        }}
        onBlur={() => {
          if (inputValue === "") {
            setInputValue(String(percent));
          }
        }}
      />
      <input
        className="w-56"
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
    </div>
  );
}
