"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, X } from "lucide-react";
import { uploadBanner, bannerFileError } from "@/lib/api/uploadApi";
import { cn } from "@/lib/utils";

type BannerUploadProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
};

export function BannerUpload({ value, onChange, disabled, className }: BannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        onChange("");
        setError(null);
        return;
      }
      const err = bannerFileError(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const url = await uploadBanner(file);
        onChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled || uploading) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, uploading, handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || uploading) return;
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [disabled, uploading, handleFile]
  );

  const clear = useCallback(() => {
    if (disabled || uploading) return;
    handleFile(null);
  }, [disabled, uploading, handleFile]);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium">Event Banner Image (optional)</label>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={cn(
          "border-2 border-dashed rounded-lg transition-colors",
          "bg-slate-50 dark:bg-slate-800/50",
          (value || uploading) ? "border-slate-200 dark:border-slate-700 p-0 overflow-hidden" : "border-slate-300 dark:border-slate-600 p-8",
          (value || uploading) && "min-h-[160px] flex flex-col items-center justify-center",
          !value && !uploading && "hover:border-[#059669]/50 cursor-pointer",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={onInputChange}
          className="hidden"
          id="banner-upload-input"
          disabled={disabled}
        />

        {uploading && (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Loader2 className="size-10 text-[#059669] animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        )}

        {!uploading && value && (
          <div className="relative w-full aspect-video max-h-48 bg-slate-100 dark:bg-slate-800">
            <Image
              src={value}
              alt="Banner preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
              unoptimized
            />
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              className="absolute top-2 right-2 size-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              aria-label="Remove banner"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {!uploading && !value && (
          <label
            htmlFor="banner-upload-input"
            className="flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
          >
            <div className="size-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <ImageIcon className="size-6 text-slate-500" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="text-[#059669] font-medium">Upload a file</span>
              {" "}or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF or WebP up to 10MB
            </p>
          </label>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
