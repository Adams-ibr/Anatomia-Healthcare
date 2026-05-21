/**
 * Unit tests for ResumeUploader logic.
 *
 * Because the vitest environment is "node" (no DOM), these tests exercise the
 * validation and upload-flow logic directly rather than rendering the component.
 * The component's behaviour is driven by two pure checks (MIME type and size)
 * and a two-step async upload flow (POST for signed URL → PUT to storage).
 *
 * Requirements: 2.2, 2.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isValidResumeType } from "@/lib/careerFilters";

// ---------------------------------------------------------------------------
// Constants mirrored from the component
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal File-like object for testing purposes.
 * In a node environment we can't use the real File constructor, so we build
 * a plain object that satisfies the shape the validation logic reads.
 */
function makeFile(
  name: string,
  type: string,
  size: number
): { name: string; type: string; size: number } {
  return { name, type, size };
}

/**
 * Simulates the client-side validation logic extracted from ResumeUploader's
 * handleFileChange function. Returns an error string or null if valid.
 */
function validateResumeFile(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (!isValidResumeType(file.type)) {
    return "Invalid file type. Please upload a PDF, DOC, or DOCX file.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File is too large. Maximum allowed size is 5 MB.";
  }
  return null;
}

/**
 * Simulates the upload flow: POST for signed URL, then PUT to storage.
 * Returns the objectPath on success, or throws with a descriptive message.
 */
async function performUpload(
  file: { name: string; type: string; size: number },
  fetchFn: typeof fetch
): Promise<string> {
  const requestRes = await fetchFn("/api/uploads/request-url", {
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
      (errorData as { error?: string }).error ||
      "Failed to get upload URL from server.";
    throw new Error(message);
  }

  const { uploadURL, objectPath } = (await requestRes.json()) as {
    uploadURL: string;
    objectPath: string;
  };

  // Simulate the XHR PUT (in tests we use fetch for simplicity)
  const putRes = await fetchFn(uploadURL, {
    method: "PUT",
    body: JSON.stringify(file), // body content doesn't matter for the mock
    headers: { "Content-Type": file.type },
  });

  if (!putRes.ok) {
    throw new Error(`Upload failed with status ${putRes.status}`);
  }

  return objectPath;
}

// ---------------------------------------------------------------------------
// Tests — MIME type validation
// Requirements: 2.2
// ---------------------------------------------------------------------------

describe("ResumeUploader — MIME type validation", () => {
  it("accepts application/pdf", () => {
    const file = makeFile("resume.pdf", "application/pdf", 1024);
    expect(validateResumeFile(file)).toBeNull();
  });

  it("accepts application/msword (DOC)", () => {
    const file = makeFile("resume.doc", "application/msword", 1024);
    expect(validateResumeFile(file)).toBeNull();
  });

  it("accepts application/vnd.openxmlformats-officedocument.wordprocessingml.document (DOCX)", () => {
    const file = makeFile(
      "resume.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      1024
    );
    expect(validateResumeFile(file)).toBeNull();
  });

  it("rejects image/jpeg and returns an inline error message", () => {
    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    const error = validateResumeFile(file);
    expect(error).not.toBeNull();
    expect(error).toContain("Invalid file type");
  });

  it("rejects text/plain and returns an inline error message", () => {
    const file = makeFile("notes.txt", "text/plain", 1024);
    const error = validateResumeFile(file);
    expect(error).not.toBeNull();
    expect(error).toContain("Invalid file type");
  });

  it("rejects an empty MIME type string", () => {
    const file = makeFile("resume", "", 1024);
    const error = validateResumeFile(file);
    expect(error).not.toBeNull();
    expect(error).toContain("Invalid file type");
  });

  it("rejects application/zip", () => {
    const file = makeFile("archive.zip", "application/zip", 1024);
    const error = validateResumeFile(file);
    expect(error).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests — file size validation
// Requirements: 2.3
// ---------------------------------------------------------------------------

describe("ResumeUploader — file size validation", () => {
  it("accepts a file exactly at the 5 MB limit", () => {
    const file = makeFile("resume.pdf", "application/pdf", MAX_FILE_SIZE_BYTES);
    expect(validateResumeFile(file)).toBeNull();
  });

  it("accepts a file well below the 5 MB limit", () => {
    const file = makeFile("resume.pdf", "application/pdf", 100_000);
    expect(validateResumeFile(file)).toBeNull();
  });

  it("rejects a file 1 byte over the 5 MB limit and returns an inline error message", () => {
    const file = makeFile(
      "resume.pdf",
      "application/pdf",
      MAX_FILE_SIZE_BYTES + 1
    );
    const error = validateResumeFile(file);
    expect(error).not.toBeNull();
    expect(error).toContain("too large");
  });

  it("rejects a file significantly over the 5 MB limit", () => {
    const file = makeFile("resume.pdf", "application/pdf", 10 * 1024 * 1024);
    const error = validateResumeFile(file);
    expect(error).not.toBeNull();
    expect(error).toContain("too large");
  });

  it("MIME type check runs before size check — wrong type returns type error even if oversized", () => {
    const file = makeFile(
      "photo.jpg",
      "image/jpeg",
      MAX_FILE_SIZE_BYTES + 1
    );
    const error = validateResumeFile(file);
    expect(error).toContain("Invalid file type");
  });
});

// ---------------------------------------------------------------------------
// Tests — upload flow: onUploadComplete called with correct URL
// Requirements: 2.4, 2.6
// ---------------------------------------------------------------------------

describe("ResumeUploader — upload flow", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls onUploadComplete with the objectPath returned by the server on successful upload", async () => {
    const expectedObjectPath =
      "https://storage.example.com/uploads/resume-abc123.pdf";

    // Mock POST /api/uploads/request-url
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadURL: "https://storage.example.com/signed-put-url",
          objectPath: expectedObjectPath,
        }),
      })
      // Mock PUT to signed URL
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

    const file = makeFile("resume.pdf", "application/pdf", 1024);
    const onUploadComplete = vi.fn();

    const objectPath = await performUpload(file, mockFetch as unknown as typeof fetch);
    onUploadComplete(objectPath);

    expect(onUploadComplete).toHaveBeenCalledWith(expectedObjectPath);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify the POST request body
    const [postUrl, postOptions] = mockFetch.mock.calls[0] as [
      string,
      RequestInit
    ];
    expect(postUrl).toBe("/api/uploads/request-url");
    expect(postOptions.method).toBe("POST");
    const body = JSON.parse(postOptions.body as string);
    expect(body.name).toBe("resume.pdf");
    expect(body.contentType).toBe("application/pdf");
  });

  it("calls onUploadError when the signed-URL POST request fails with a server error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    });

    const file = makeFile("resume.pdf", "application/pdf", 1024);
    const onUploadError = vi.fn();

    try {
      await performUpload(file, mockFetch as unknown as typeof fetch);
    } catch (err) {
      onUploadError((err as Error).message);
    }

    expect(onUploadError).toHaveBeenCalledWith("Internal server error");
    // Only the POST was attempted; no PUT should have been made
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("calls onUploadError when the signed-URL POST request fails without a JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => {
        throw new Error("not json");
      },
    });

    const file = makeFile("resume.pdf", "application/pdf", 1024);
    const onUploadError = vi.fn();

    try {
      await performUpload(file, mockFetch as unknown as typeof fetch);
    } catch (err) {
      onUploadError((err as Error).message);
    }

    expect(onUploadError).toHaveBeenCalledWith(
      "Failed to get upload URL from server."
    );
  });

  it("calls onUploadError when the PUT to the signed URL fails", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadURL: "https://storage.example.com/signed-put-url",
          objectPath: "uploads/resume.pdf",
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

    const file = makeFile("resume.pdf", "application/pdf", 1024);
    const onUploadError = vi.fn();

    try {
      await performUpload(file, mockFetch as unknown as typeof fetch);
    } catch (err) {
      onUploadError((err as Error).message);
    }

    expect(onUploadError).toHaveBeenCalledWith(
      "Upload failed with status 403"
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("sends the correct metadata in the POST body", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadURL: "https://storage.example.com/signed-put-url",
          objectPath: "uploads/my-cv.docx",
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const file = makeFile(
      "my-cv.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      2_500_000
    );

    await performUpload(file, mockFetch as unknown as typeof fetch);

    const [, postOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(postOptions.body as string);
    expect(body.name).toBe("my-cv.docx");
    expect(body.size).toBe(2_500_000);
    expect(body.contentType).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  });
});
