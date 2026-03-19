"use client";

import React from "react";
import { Shield, Zap, Star, Sparkles } from "lucide-react";
import { MATTING_TABS } from "@/lib/constants";
import type { MattingMode } from "@/lib/types";
import UploadZone from "@/components/UploadZone";

interface HeroSectionProps {
  onFileSelected: (file: File, mode: MattingMode) => void;
}

export default function HeroSection({ onFileSelected }: HeroSectionProps) {
  const [mattingMode, setMattingMode] = React.useState<MattingMode>("portrait");

  const handleFileSelect = (file: File) => {
    onFileSelected(file, mattingMode);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 fade-in">
            <Sparkles className="h-4 w-4" />
            100% Free • No Signup Required
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl fade-in">
            Remove Image Background
            <br />
            <span className="gradient-text">Instantly with AI</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted leading-relaxed fade-in">
            Upload your image and get a clean, transparent background in
            seconds. Powered by AI — works right in your browser. No upload to
            server, 100% private.
          </p>

          {/* Matting Mode Tabs */}
          <div className="mt-8 flex items-center justify-center gap-2 fade-in">
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
          <p className="mt-3 text-xs text-muted fade-in">
            {MATTING_TABS.find((t) => t.mode === mattingMode)?.description}
          </p>

          {/* Upload zone */}
          <div className="mt-6 fade-in">
            <UploadZone onFileSelected={handleFileSelect} />
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted fade-in">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-500" />
              Privacy First — No Data Uploaded
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-500" />
              Lightning Fast Processing
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-orange-500" />
              HD Quality Output
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
