import type { Career } from "@shared/schema";

/**
 * Filters applied to the career listing page.
 * An empty string ("") means "no filter" for that field.
 */
export interface CareerFilters {
  department: string;
  location: string;
  type: string;
  search: string;
}

/**
 * Filters an array of careers by applying all four conditions conjunctively.
 * - department, location, type: exact match (empty string = all)
 * - search: case-insensitive substring match on `title` and `department`
 *
 * Validates: Requirements 3.4, 3.5
 */
export function filterCareers(careers: Career[], filters: CareerFilters): Career[] {
  const { department, location, type, search } = filters;
  const normalizedSearch = search.trim().toLowerCase();

  return careers.filter((career) => {
    if (department !== "" && career.department !== department) {
      return false;
    }

    if (location !== "" && career.location !== location) {
      return false;
    }

    if (type !== "" && career.type !== type) {
      return false;
    }

    if (normalizedSearch !== "") {
      const titleMatch = career.title.toLowerCase().includes(normalizedSearch);
      const departmentMatch = career.department.toLowerCase().includes(normalizedSearch);
      if (!titleMatch && !departmentMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * The set of MIME types accepted for resume uploads.
 * Validates: Requirements 2.2
 */
const VALID_RESUME_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/**
 * Returns true if and only if the given MIME type is one of the three
 * accepted resume formats (PDF, DOC, DOCX).
 *
 * Validates: Requirements 2.2
 */
export function isValidResumeType(mimeType: string): boolean {
  return VALID_RESUME_MIME_TYPES.has(mimeType);
}
