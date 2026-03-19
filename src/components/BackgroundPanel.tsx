"use client";

import React from "react";
import { Check, Palette } from "lucide-react";
import { PRESET_COLORS } from "@/lib/constants";

interface BackgroundPanelProps {
  selectedBg: string;
  onBgChange: (color: string) => void;
}

export default function BackgroundPanel({
  selectedBg,
  onBgChange,
}: BackgroundPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <Palette className="h-5 w-5 text-primary" />
        Background
      </h2>

      {/* Color presets */}
      <div className="grid grid-cols-6 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            title={color.name}
            className={`relative h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 ${
              selectedBg === color.value
                ? "border-primary shadow-md"
                : "border-border"
            } ${color.class}`}
            onClick={() => onBgChange(color.value)}
          >
            {selectedBg === color.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check
                  className={`h-4 w-4 ${
                    color.value === "#000000" ? "text-white" : "text-primary"
                  }`}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom color picker */}
      <div className="mt-4">
        <label className="text-sm font-medium text-muted mb-2 block">
          Custom Color
        </label>
        <input
          type="color"
          value={selectedBg === "transparent" ? "#ffffff" : selectedBg}
          onChange={(e) => onBgChange(e.target.value)}
          className="h-10 w-full rounded-lg cursor-pointer border border-border"
        />
      </div>
    </div>
  );
}
