"use client";

import React from "react";
import { ImageIcon } from "lucide-react";
import { MATTING_TABS } from "@/lib/constants";
import type { MattingMode, RemovalResult } from "@/lib/types";

interface ImageInfoPanelProps {
  fileName?: string;
  result: RemovalResult;
  mattingMode: MattingMode;
}

export default function ImageInfoPanel({
  fileName,
  result,
  mattingMode,
}: ImageInfoPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
        <ImageIcon className="h-5 w-5 text-primary" />
        Image Info
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">File Name</span>
          <span className="font-medium truncate max-w-[160px]">{fileName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Dimensions</span>
          <span className="font-medium">
            {result.width} × {result.height}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Mode</span>
          <span className="font-medium capitalize">
            {MATTING_TABS.find((t) => t.mode === mattingMode)?.label ||
              mattingMode}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Output</span>
          <span className="font-medium">PNG (Transparent)</span>
        </div>
      </div>
    </div>
  );
}
