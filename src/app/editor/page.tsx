"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import ComparisonSlider from "@/components/ComparisonSlider";
import ProgressBar from "@/components/ProgressBar";
import MattingModeTabs from "@/components/MattingModeTabs";
import BackgroundPanel from "@/components/BackgroundPanel";
import ImageInfoPanel from "@/components/ImageInfoPanel";
import {
  removeImageBackground,
  applyBackground,
  downloadBlob,
} from "@/lib/background-removal";
import type { RemovalResult, RemovalProgress, MattingMode, EditorState, UsageInfo } from "@/lib/types";
import {
  Download,
  RotateCcw,
  Upload,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

export default function EditorPage() {
  const router = useRouter();
  const { data: session } = useSession();
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
  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mattingMode, setMattingMode] = useState<MattingMode>("portrait");
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // 获取额度信息
  useEffect(() => {
    fetch("/api/usage")
      .then((res) => res.json())
      .then((data) => setUsage(data.usage))
      .catch(console.error);
  }, [session]);

  // Check for image from session storage (from homepage upload)
  useEffect(() => {
    const pendingFile = (window as any).__bgremover_pending_file as
      | File
      | undefined;
    const savedMode = sessionStorage.getItem("bgremover_mode") as
      | MattingMode
      | null;

    if (pendingFile) {
      delete (window as any).__bgremover_pending_file;
      sessionStorage.removeItem("bgremover_mode");

      if (
        savedMode &&
        (savedMode === "portrait" ||
          savedMode === "goods" ||
          savedMode === "general")
      ) {
        setMattingMode(savedMode);
      }

      handleFileSelected(pendingFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelected = useCallback(
    async (file: File) => {
      // 额度检查
      if (usage && usage.remaining <= 0) {
        setError("Daily quota exceeded. Please upgrade your plan or try again tomorrow.");
        return;
      }

      setError(null);
      setOriginalFile(file);
      const url = URL.createObjectURL(file);
      setOriginalUrl(url);
      setState("processing");
      setSelectedBg("transparent");
      setFinalPreviewUrl(null);

      try {
        // 消耗额度
        const usageRes = await fetch("/api/usage", { method: "POST" });
        const usageData = await usageRes.json();

        if (usageRes.status === 429) {
          setError("Daily quota exceeded. Please upgrade your plan or try again tomorrow.");
          setState("upload");
          return;
        }

        if (usageData.usage) {
          setUsage(usageData.usage);
        }

        const removalResult = await removeImageBackground(
          file,
          setProgress,
          mattingMode
        );
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
    },
    [mattingMode, usage]
  );

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
    setError(null);
    setState("upload");
  }, [originalUrl, result, finalPreviewUrl]);

  const handleBgChange = useCallback((color: string) => {
    setSelectedBg(color);
  }, []);

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

        {/* =================== Upload State =================== */}
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

            <div className="mb-8">
              <MattingModeTabs
                mattingMode={mattingMode}
                onModeChange={setMattingMode}
              />
            </div>

            <UploadZone onFileSelected={handleFileSelected} />

            {/* 额度显示 */}
            {usage && (
              <div className="mt-6 flex items-center gap-2 text-sm text-muted">
                <span>
                  Today: {usage.todayUsed}/{usage.dailyLimit} images used
                </span>
                {usage.remaining <= 5 && usage.remaining > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    {usage.remaining} left
                  </span>
                )}
                {usage.remaining <= 0 && (
                  <button
                    onClick={() => router.push("/pricing")}
                    className="ml-2 text-primary hover:underline font-medium"
                  >
                    Upgrade Plan →
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 text-center max-w-md fade-in">
                {error}
                {error.includes("quota") && (
                  <button
                    onClick={() => router.push("/pricing")}
                    className="ml-2 underline font-medium"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================== Processing State =================== */}
        {state === "processing" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-8">
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
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-sm">
                <div className="processing-pulse">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            <ProgressBar progress={progress} />
          </div>
        )}

        {/* =================== Result State =================== */}
        {state === "result" && originalUrl && result && finalPreviewUrl && (
          <div className="fade-in">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left: Image comparison & preview */}
              <div className="lg:col-span-2 space-y-6">
                <h1 className="text-2xl font-bold">Result</h1>

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

              {/* Right: Background options & info */}
              <div className="space-y-6">
                <BackgroundPanel
                  selectedBg={selectedBg}
                  onBgChange={handleBgChange}
                />

                <ImageInfoPanel
                  fileName={originalFile?.name}
                  result={result}
                  mattingMode={mattingMode}
                />

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
                      URL.createObjectURL(file);
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
