"use client";

import React from "react";
import { MATTING_TABS } from "@/lib/constants";
import type { MattingMode } from "@/lib/types";
import UploadZone from "@/components/UploadZone";

interface CTASectionProps {
  onFileSelected: (file: File, mode: MattingMode) => void;
}

export default function CTASection({ onFileSelected }: CTASectionProps) {
  const [mattingMode, setMattingMode] = React.useState<MattingMode>("portrait");

  const handleFileSelect = (file: File) => {
    onFileSelected(file, mattingMode);
  };

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl mb-4">
          Ready to Remove Your Image Background?
        </h2>
        <p className="text-muted mb-8 max-w-xl mx-auto">
          It takes just seconds. No signup, no watermark, no limits. Try it now
          — completely free.
        </p>

        {/* Matting Mode Tabs */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-secondary/50 border border-border">
            {MATTING_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = mattingMode === tab.mode;
              return (
                <button
                  key={tab.mode}
                  onClick={() => setMattingMode(tab.mode)}
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
        </div>

        {/* Mode description */}
        <p className="text-xs text-muted mb-4">
          {MATTING_TABS.find((t) => t.mode === mattingMode)?.description}
        </p>

        <UploadZone onFileSelected={handleFileSelect} />
      </div>
    </section>
  );
}
