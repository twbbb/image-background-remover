"use client";

import React, { useCallback, useState, useRef } from "react";
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isProcessing?: boolean;
}

export default function UploadZone({
  onFileSelected,
  isProcessing = false,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    setError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Please upload a PNG, JPG, WebP, or BMP image.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 20MB.");
      return false;
    }
    return true;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onFileSelected(file);
      }
    },
    [validateFile, onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`upload-zone rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragOver ? "drag-over scale-[1.02]" : ""
        } ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload image to remove background"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-lg font-medium text-muted">Processing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
              {isDragOver ? (
                <ImageIcon className="h-8 w-8 text-primary" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>

            <div>
              <p className="text-lg font-semibold">
                {isDragOver ? "Drop your image here" : "Upload an Image"}
              </p>
              <p className="mt-1 text-sm text-muted">
                Drag & drop or click to browse
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button className="rounded-full bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95">
                Choose Image
              </button>
            </div>

            <p className="text-xs text-muted">
              Supports PNG, JPG, WebP, BMP • Max 20MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm text-red-600 dark:text-red-400 text-center fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
