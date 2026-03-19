"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import ComparisonSlider from "@/components/ComparisonSlider";
import ProgressBar from "@/components/ProgressBar";
import {
  removeImageBackground,
  applyBackground,
  downloadBlob,
  RemovalResult,
  RemovalProgress,
  MattingMode,
} from "@/lib/background-removal";
import {
  Download,
  RotateCcw,
  Palette,
  ImageIcon,
  Check,
  Upload,
  ArrowLeft,
  Sparkles,
  User,
  ShoppingBag,
  Layers,
} from "lucide-react";

const PRESET_COLORS = [
  { name: "Transparent", value: "transparent", class: "checkerboard" },
  { name: "White", value: "#FFFFFF", class: "bg-white" },
  { name: "Black", value: "#000000", class: "bg-black" },
  { name: "Red", value: "#EF4444", class: "bg-red-500" },
  { name: "Blue", value: "#3B82F6", class: "bg-blue-500" },
  { name: "Green", value: "#22C55E", class: "bg-green-500" },
  { name: "Yellow", value: "#EAB308", class: "bg-yellow-500" },
  { name: "Purple", value: "#A855F7", class: "bg-purple-500" },
  { name: "Pink", value: "#EC4899", class: "bg-pink-500" },
  { name: "Orange", value: "#F97316", class: "bg-orange-500" },
  { name: "Cyan", value: "#06B6D4", class: "bg-cyan-500" },
  { name: "Gray", value: "#9CA3AF", class: "bg-gray-400" },
];

const MATTING_TABS: {
  mode: MattingMode;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    mode: "portrait",
    label: "Portrait",
    icon: User,
    description: "Best for people & faces",
  },
  {
    mode: "goods",
    label: "Product",
    icon: ShoppingBag,
    description: "Best for products & goods",
  },
  {
    mode: "general",
    label: "General",
    icon: Layers,
    description: "Works for any subject",
  },
];

type EditorState = "upload" | "processing" | "result";

export default function EditorPage() {
  const router = useRouter();
  const [state, setState] = useState<EditorState>("upload");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [result, setResult] = useState<RemovalResult | null>(null);
  const [progress, setProgress] = useState<RemovalProgress>({
    phase: "loading",
    progress: 0,
    message: "Initializing...",
  });
  const [selectedBg, setSelectedBg] = useState("transparent");
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mattingMode, setMattingMode] = useState<MattingMode>("portrait");
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Check for image from session storage (from homepage upload)
  useEffect(() => {
    const pendingFile = (window as any).__bgremover_pending_file as File | undefined;
    const savedMode = sessionStorage.getItem("bgremover_mode") as MattingMode | null;

    if (pendingFile) {
      // Clear the global variable
      delete (window as any).__bgremover_pending_file;
      sessionStorage.removeItem("bgremover_mode");

      // Set mode from homepage if available
      if (savedMode && (savedMode === "portrait" || savedMode === "goods" || savedMode === "general")) {
        setMattingMode(savedMode);
      }

      // Use the file directly
      handleFileSelected(pendingFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelected = useCallback(async (file: File) => {
    setError(null);
    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setState("processing");
    setSelectedBg("transparent");
    setCustomBgUrl(null);
    setFinalPreviewUrl(null);

    try {
      const removalResult = await removeImageBackground(file, setProgress, mattingMode);
      setResult(removalResult);
      setFinalPreviewUrl(removalResult.url);
      setState("result");
    } catch (err) {
      console.error("Background removal failed:", err);
      setError(
        "Failed to remove background. Please try a different image or refresh the page."
      );
      setState("upload");
    }
  }, [mattingMode]);

  // When background color changes, generate preview
  useEffect(() => {
    if (!result) return;

    if (selectedBg === "transparent") {
      setFinalPreviewUrl(result.url);
      return;
    }

    applyBackground(result.url, selectedBg, result.width, result.height)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setFinalPreviewUrl(url);
      })
      .catch(console.error);
  }, [selectedBg, result]);

  const handleDownload = useCallback(async () => {
    if (!result || !originalFile) return;

    const baseName = originalFile.name.replace(/\.[^.]+$/, "");

    if (selectedBg === "transparent") {
      downloadBlob(result.blob, `${baseName}_no_bg.png`);
    } else {
      const blob = await applyBackground(
        result.url,
        selectedBg,
        result.width,
        result.height
      );
      downloadBlob(blob, `${baseName}_new_bg.png`);
    }
  }, [result, originalFile, selectedBg]);

  const handleReset = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    if (finalPreviewUrl && finalPreviewUrl !== result?.url) {
      URL.revokeObjectURL(finalPreviewUrl);
    }

    setOriginalFile(null);
    setOriginalUrl(null);
    setResult(null);
    setFinalPreviewUrl(null);
    setSelectedBg("transparent");
    setCustomBgUrl(null);
    setError(null);
    setState("upload");
  }, [originalUrl, result, finalPreviewUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back to home */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        {/* Upload State */}
        {state === "upload" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Remove Image Background
              </h1>
              <p className="text-muted">
                Choose a mode and upload your image to start
              </p>
            </div>

            {/* Matting Mode Tabs */}
            <div className="flex items-center gap-2 mb-8 p-1 rounded-2xl bg-secondary/50 border border-border">
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

            {/* Mode description */}
            <p className="text-xs text-muted mb-4">
              {MATTING_TABS.find((t) => t.mode === mattingMode)?.description}
            </p>

            <UploadZone onFileSelected={handleFileSelected} />

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 text-center max-w-md fade-in">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {state === "processing" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-8">
              {/* Show original image as thumbnail */}
              {originalUrl && (
                <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalUrl}
                    alt="Processing"
                    className="w-full h-full object-contain bg-secondary"
                  />
                </div>
              )}
              {/* Processing overlay */}
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-sm">
                <div className="processing-pulse">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            <ProgressBar progress={progress} />
          </div>
        )}

        {/* Result State */}
        {state === "result" && originalUrl && result && finalPreviewUrl && (
          <div className="fade-in">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left: Image comparison & preview */}
              <div className="lg:col-span-2 space-y-6">
                <h1 className="text-2xl font-bold">Result</h1>

                {/* Comparison slider */}
                <ComparisonSlider
                  originalUrl={originalUrl}
                  resultUrl={finalPreviewUrl}
                />

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    <Download className="h-4 w-4" />
                    Download PNG
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    New Image
                  </button>
                </div>
              </div>

              {/* Right: Background options */}
              <div className="space-y-6">
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
                        onClick={() => {
                          setSelectedBg(color.value);
                          setCustomBgUrl(null);
                        }}
                      >
                        {selectedBg === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check
                              className={`h-4 w-4 ${
                                color.value === "#000000"
                                  ? "text-white"
                                  : "text-primary"
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
                      value={
                        selectedBg === "transparent" ? "#ffffff" : selectedBg
                      }
                      onChange={(e) => {
                        setSelectedBg(e.target.value);
                        setCustomBgUrl(null);
                      }}
                      className="h-10 w-full rounded-lg cursor-pointer border border-border"
                    />
                  </div>
                </div>

                {/* Image info */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Image Info
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">File Name</span>
                      <span className="font-medium truncate max-w-[160px]">
                        {originalFile?.name}
                      </span>
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
                        {MATTING_TABS.find((t) => t.mode === mattingMode)?.label || mattingMode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Output</span>
                      <span className="font-medium">PNG (Transparent)</span>
                    </div>
                  </div>
                </div>

                {/* Upload new image */}
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload Another Image
                </button>

                {/* Hidden input for background image upload */}
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setCustomBgUrl(url);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
