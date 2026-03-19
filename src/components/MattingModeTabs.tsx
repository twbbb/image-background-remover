"use client";

import React from "react";
import { MATTING_TABS } from "@/lib/constants";
import type { MattingMode } from "@/lib/types";

interface MattingModeTabsProps {
  mattingMode: MattingMode;
  onModeChange: (mode: MattingMode) => void;
}

export default function MattingModeTabs({
  mattingMode,
  onModeChange,
}: MattingModeTabsProps) {
  return (
    <div className="flex items-center gap-2 p-1 rounded-2xl bg-secondary/50 border border-border">
      {MATTING_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = mattingMode === tab.mode;
        return (
          <button
            key={tab.mode}
            onClick={() => onModeChange(tab.mode)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-white dark:bg-card shadow-md text-primary border border-border/50"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
