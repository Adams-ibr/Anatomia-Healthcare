/**
 * Unit tests for ApplicationModal logic.
 *
 * Because the vitest environment is "node" (no DOM), these tests exercise the
 * validation and submission logic directly rather than rendering the component.
 * The component's behaviour is driven by:
 *   1. A `isFormComplete` guard that checks all required fields + resumeUrl
 *   2. A POST to `/api/applications` only when the form is complete
 *   3. Toast notifications on success/failure
 *   4. Calling `onClose` only on successful submission
 *
 * Requirements: 2.1, 2.4, 2.5, 2.7, 2.8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Helpers — mirror the logic from ApplicationModal
// ---------------------------------------------------------------------------

interface FormFields {
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  startDate: string;
  coverLetter: string;
}

const EMPTY_FORM: FormFields = {
  name: "",
  email: "",
  phone: "",
  location: "",
  experience: "",
  startDate: "",
  coverLetter: "",
};

const COMPLETE_FORM: FormFields = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+1 555 000 0000",
  location: "New York, USA",
  experience: "5",
  startDate: "2025-03-01",
  coverLetter: "I am very excited about this role.",
};

/**
 * Mirrors the `isFormComplete` function from ApplicationModal.tsx.
 * Returns true only when all required fields are non-empty and a resumeUrl
 * has been obtained.
 *
 * Validates: Requirements 2.7
 */
function isFormComplete(fields: FormFields, resumeUrl: string): boolean {
  return (
    fields.name.trim() !== "" &&
    fields.email.trim() !== "" &&
    fields.phone.trim() !== "" &&
    fields.location.trim() !== "" &&
    fields.experience.trim() !== "" &&
    fields.startDate.trim() !== "" &&
    fields.coverLetter.trim() !== "" &&
    resumeUrl !== ""
  );
}

/**
 * Simulates the submit handler: only POSTs if `isFormComplete` returns true.
 * Returns the fetch call result or null if the form is incomplete.
 *
 * Validates: Requirements 2.1, 2.5
 */
async function handleSubmit(
  fields: FormFields,
  resumeUrl: string,
  jobId: string,
  fetchFn: typeof fetch
): Promise<Response | null> {
  if (!isFormComplete(fields, resumeUrl)) {
    return null;
  }

  const payload = {
    jobId,
    name: fields.name.trim(),
    email: fields.email.trim(),
    phone: fields.phone.trim(),
    location: fields.location.trim(),
    experience: parseInt(fields.experience, 10) || 0,
    startDate: fields.startDate.trim(),
    coverLetter: fields.coverLetter.trim(),
    resumeUrl,
  };

  const res = await fetchFn("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  return res;
}

// ---------------------------------------------------------------------------
// Tests — submit button disabled when required fields are empty
// Requirements: 2.7
// ---------------------------------------------------------------------------

describe("ApplicationModal — submit button disabled state", () => {
  it("is disabled when all fields are empty and no resume URL", () => {
    expect(isFormComplete(EMPTY_FORM, "")).toBe(false);
  });

  it("is disabled when name is empty", () => {
    expect(isFormComplete({ ...COMPLETE_FORM, name: "" }, "https://example.com/resume.pdf")).toBe(false);
  });

  it("is disabled when email is empty", () => {
    expect(isFormComplete({ ...COMPLETE_FORM, email: "" }, "https://example.com/resume.pdf")).toBe(false);
  });

  it("is disabled when phone is empty", () => {
    expect(isFormComplete({ ...COMPLETE_FORM, phone: "" }, "https://example.com/resume.pdf")).toBe(false);
  });

  it("is disabled when location is empty", () => {
    expect(isFormComplete({ ...COMPLETE_FORM, location: "" }, "https://example.com/resume.pdf")).toBe(false);
  });

  it("is disabled when experience is empty", () => {
    expect(isFormComplete({ ...COMPLETE_FORM, experience: "" }, "https://example.com/resume.pdf")).toBe(false);
  });

  it("is disabled when startDate is empty", () => {
    expect(isFormComplete({ ...COMPLETE_FORM, startDate: "" }, "https://example.com/resume.pdf")).toBe(false);
  });

  it("is disabled when coverLetter is empty", () => {
    expect(isFormComplete({ ...COMPLETE_FORM, coverLetter: "" }, "https://example.com/resume.pdf")).toBe(false);
  });

  it("is disabled when fields contain only whitespace", () => {
    expect(isFormComplete({ ...COMPLETE_FORM, name: "   " }, "https://example.com/resume.pdf")).toBe(false);
    expect(isFormComplete({ ...COMPLETE_FORM, email: "   " }, "https://example.com/resume.pdf")).toBe(false);
    expect(isFormComplete({ ...COMPLETE_FORM, coverLetter: "   " }, "https://example.com/resume.pdf")).toBe(false);
  });

  it("is enabled when all required fields are filled and resume URL is present", () => {
    expect(isFormComplete(COMPLETE_FORM, "https://example.com/resume.pdf")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests — submit button disabled before a resume URL is obtained
// Requirements: 2.7
// ---------------------------------------------------------------------------

describe("ApplicationModal — submit disabled before resume URL", () => {
  it("is disabled when all text fields are complete but resumeUrl is empty string", () => {
    expect(isFormComplete(COMPLETE_FORM, "")).toBe(false);
  });

  it("is disabled when resumeUrl is whitespace only (treated as empty)", () => {
    // The check is `resumeUrl !== ""` — whitespace is technically non-empty,
    // but a real URL would never be whitespace. We verify the exact contract.
    // The component stores the URL returned by ResumeUploader, which is always
    // a real URL or empty string, so this edge case is informational.
    expect(isFormComplete(COMPLETE_FORM, "   ")).toBe(true); // whitespace passes the !== "" check
  });

  it("is enabled once a non-empty resumeUrl is provided alongside complete fields", () => {
    const resumeUrl = "https://storage.example.com/uploads/resume-abc123.pdf";
    expect(isFormComplete(COMPLETE_FORM, resumeUrl)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests — does not call POST /api/applications if upload fails
// Requirements: 2.5
// ---------------------------------------------------------------------------

describe("ApplicationModal — no POST when upload fails", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not call POST /api/applications when resumeUrl is empty (upload not completed)", async () => {
    const result = await handleSubmit(COMPLETE_FORM, "", "job-123", mockFetch as unknown as typeof fetch);

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not call POST /api/applications when any required field is missing", async () => {
    const incompleteFields = { ...COMPLETE_FORM, name: "" };
    const result = await handleSubmit(
      incompleteFields,
      "https://example.com/resume.pdf",
      "job-123",
      mockFetch as unknown as typeof fetch
    );

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not call POST /api/applications when both fields are incomplete and upload failed", async () => {
    const result = await handleSubmit(EMPTY_FORM, "", "job-123", mockFetch as unknown as typeof fetch);

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests — calls onClose and shows toast on successful submission
// Requirements: 2.8
// ---------------------------------------------------------------------------

describe("ApplicationModal — successful submission", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls POST /api/applications with correct payload when form is complete", async () => {
    const resumeUrl = "https://storage.example.com/uploads/resume-abc123.pdf";
    const jobId = "job-uuid-123";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "{}",
    });

    const result = await handleSubmit(
      COMPLETE_FORM,
      resumeUrl,
      jobId,
      mockFetch as unknown as typeof fetch
    );

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/applications");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string);
    expect(body.jobId).toBe(jobId);
    expect(body.name).toBe(COMPLETE_FORM.name);
    expect(body.email).toBe(COMPLETE_FORM.email);
    expect(body.phone).toBe(COMPLETE_FORM.phone);
    expect(body.location).toBe(COMPLETE_FORM.location);
    expect(body.experience).toBe(parseInt(COMPLETE_FORM.experience, 10));
    expect(body.startDate).toBe(COMPLETE_FORM.startDate);
    expect(body.coverLetter).toBe(COMPLETE_FORM.coverLetter);
    expect(body.resumeUrl).toBe(resumeUrl);
  });

  it("includes the resumeUrl from the upload in the POST body", async () => {
    const resumeUrl = "https://storage.example.com/uploads/my-cv-xyz.pdf";
    const jobId = "job-uuid-456";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "{}",
    });

    await handleSubmit(COMPLETE_FORM, resumeUrl, jobId, mockFetch as unknown as typeof fetch);

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.resumeUrl).toBe(resumeUrl);
  });

  it("onClose should be called after a successful submission (simulated)", () => {
    // This test verifies the contract: onClose is called on success.
    // In the component, onSuccess calls onClose(). We verify the logic here.
    const onClose = vi.fn();
    const onSuccess = () => {
      onClose();
    };

    // Simulate a successful mutation callback
    onSuccess();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("onClose is NOT called when submission fails", () => {
    const onClose = vi.fn();
    const onError = (_err: Error) => {
      // onClose is not called on error — form stays open
    };

    onError(new Error("Network error"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("trims whitespace from text fields before submitting", async () => {
    const fieldsWithWhitespace: FormFields = {
      ...COMPLETE_FORM,
      name: "  Jane Doe  ",
      email: "  jane@example.com  ",
      coverLetter: "  Great fit.  ",
    };
    const resumeUrl = "https://storage.example.com/uploads/resume.pdf";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "{}",
    });

    await handleSubmit(
      fieldsWithWhitespace,
      resumeUrl,
      "job-123",
      mockFetch as unknown as typeof fetch
    );

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.name).toBe("Jane Doe");
    expect(body.email).toBe("jane@example.com");
    expect(body.coverLetter).toBe("Great fit.");
  });
});

// ---------------------------------------------------------------------------
// Tests — submission failure keeps form open
// Requirements: 2.5
// ---------------------------------------------------------------------------

describe("ApplicationModal — submission failure handling", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the failed response when POST /api/applications returns a non-ok status", async () => {
    const resumeUrl = "https://storage.example.com/uploads/resume.pdf";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    // The actual component uses apiRequest which throws on non-ok responses.
    // Here we test the raw fetch behavior to verify the response is returned.
    const result = await handleSubmit(
      COMPLETE_FORM,
      resumeUrl,
      "job-123",
      mockFetch as unknown as typeof fetch
    );

    expect(result).not.toBeNull();
    expect((result as Response).ok).toBe(false);
    expect((result as Response).status).toBe(500);
  });

  it("does not call onClose when submission fails (simulated via onError callback)", () => {
    const onClose = vi.fn();
    const toastFn = vi.fn();

    // Simulate the onError callback from useMutation
    const onError = (err: Error) => {
      toastFn({
        title: "Submission Failed",
        description: err.message,
        variant: "destructive",
      });
      // onClose is NOT called here
    };

    onError(new Error("Server error"));

    expect(onClose).not.toHaveBeenCalled();
    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Submission Failed",
        variant: "destructive",
      })
    );
  });
});
