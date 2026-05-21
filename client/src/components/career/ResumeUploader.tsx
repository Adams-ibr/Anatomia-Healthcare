import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { isValidResumeType } from "@/lib/careerFilters";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface ResumeUploaderProps {
  onUploadComplete: (publicUrl: string) => void;
  onUploadError: (message: string) => void;
  disabled?: boolean;
}

type UploadStatus = "idle" | "uploading" | "done" | "error";

interface UploaderState {
  file: File | null;
  progress: number;
  status: UploadStatus;
}

export function ResumeUploader({
  onUploadComplete,
  onUploadError,
  disabled = false,
}: ResumeUploaderProps) {
  const [state, setState] = useState<UploaderState>({
    file: null,
    progress: 0,
    status: "idle",
  });
  const [inlineError, setInlineError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = state.status === "uploading";
  const isDisabled = disabled || isUploading;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous error
    setInlineError(null);

    // Validate MIME type
    if (!isValidResumeType(file.type)) {
      setInlineError(
        "Invalid file type. Please upload a PDF, DOC, or DOCX file."
      );
      // Reset the input so the same file can be re-selected after correction
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setInlineError("File is too large. Maximum allowed size is 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Start upload
    setState({ file, progress: 0, status: "uploading" });

    try {
      // Step 1: Request a signed upload URL from the server
      const requestRes = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!requestRes.ok) {
        const errorData = await requestRes.json().catch(() => ({}));
        const message =
          errorData.error || "Failed to get upload URL from server.";
        setState((prev) => ({ ...prev, status: "error" }));
        onUploadError(message);
        return;
      }

      const { uploadURL, objectPath } = await requestRes.json();

      // Step 2: PUT the file to the signed URL using XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setState((prev) => ({ ...prev, progress: percent }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during file upload."));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("File upload was aborted."));
        });

        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Upload succeeded
      setState({ file, progress: 100, status: "done" });
      onUploadComplete(objectPath);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setState((prev) => ({ ...prev, status: "error" }));
      onUploadError(message);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        disabled={isDisabled}
        onChange={handleFileChange}
        aria-label="Upload resume"
        aria-describedby={inlineError ? "resume-upload-error" : undefined}
        aria-invalid={!!inlineError}
      />

      {inlineError && (
        <p
          id="resume-upload-error"
          className="text-sm text-destructive"
          role="alert"
        >
          {inlineError}
        </p>
      )}

      {isUploading && (
        <div className="space-y-1">
          <Progress value={state.progress} aria-label="Upload progress" />
          <p className="text-xs text-muted-foreground">
            Uploading… {state.progress}%
          </p>
        </div>
      )}

      {state.status === "done" && (
        <p className="text-sm text-green-600">Resume uploaded successfully.</p>
      )}
    </div>
  );
}
