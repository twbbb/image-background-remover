"use client";

import React from "react";
import { RemovalProgress } from "@/lib/background-removal";
import { Wifi, Cpu } from "lucide-react";

interface ProgressBarProps {
  progress: RemovalProgress;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const percent = Math.round(progress.progress * 100);

  const phaseInfo = {
    loading: {
      icon: <Wifi className="h-4 w-4 animate-pulse" />,
      label: "Preparing",
      hint: "Preparing your image for AI processing...",
      color: "from-blue-500 to-cyan-500",
    },
    processing: {
      icon: <Cpu className="h-4 w-4 animate-spin" />,
      label: "Processing",
      hint: "AI is analyzing your image and removing the background...",
      color: "from-primary to-accent",
    },
    done: {
      icon: null,
      label: "Done!",
      hint: "",
      color: "from-green-500 to-emerald-500",
    },
  };

  const current = phaseInfo[progress.phase];

  return (
    <div className="w-full max-w-md mx-auto fade-in">
      {/* Phase indicator */}
      <div className="flex items-center gap-2 mb-3">
        {current.icon}
        <span className="text-sm font-semibold text-foreground">
          {current.label}
        </span>
        <span className="ml-auto text-sm font-bold text-primary tabular-nums">
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${current.color} transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Phase-specific hint */}
      {current.hint && (
        <p className="mt-2.5 text-xs text-muted text-center leading-relaxed">
          {current.hint}
        </p>
      )}

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <StepDot
          active={progress.phase === "loading"}
          done={progress.phase === "processing" || progress.phase === "done"}
          label="Prepare"
        />
        <div className="h-px w-8 bg-border" />
        <StepDot
          active={progress.phase === "processing"}
          done={progress.phase === "done"}
          label="Process"
        />
        <div className="h-px w-8 bg-border" />
        <StepDot active={false} done={progress.phase === "done"} label="Done" />
      </div>
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
          done
            ? "bg-green-500 scale-110"
            : active
            ? "bg-primary animate-pulse scale-125"
            : "bg-border"
        }`}
      />
      <span
        className={`text-[10px] font-medium ${
          done ? "text-green-500" : active ? "text-primary" : "text-muted"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
