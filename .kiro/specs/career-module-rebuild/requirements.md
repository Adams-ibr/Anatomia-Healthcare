# Requirements Document

## Introduction

This document defines the requirements for a full rebuild of the Anatomia career module. The existing career page already fetches live job listings from `/api/careers` and supports a basic application modal with a mock resume URL. This rebuild extends the module with four major capabilities:

1. **Job detail pages** — dedicated routes per listing with full description, requirements, and an apply CTA
2. **Real file upload for resumes/CVs** — replace the mock `resumeUrl` placeholder with actual Supabase Storage upload
3. **Advanced filtering and search** — filter by department, location, employment type, and free-text search
4. **Admin application management enhancements** — filtering, sorting, bulk status updates, and resume download in the admin panel

The stack is React + TypeScript, TanStack Query, Wouter routing, Tailwind CSS, shadcn/ui, Framer Motion, and a Supabase + Express backend.

---

## Glossary

- **Career_Listing**: A job opening record stored in the `careers` table with fields: `id`, `title`, `department`, `location`, `type`, `description`, `requirements`, `isActive`, `createdAt`.
- **Job_Application**: A candidate submission stored in the `job_applications` table with fields: `id`, `jobId`, `name`, `email`, `phone`, `location`, `experience`, `startDate`, `portfolioUrl`, `coverLetter`, `resumeUrl`, `status`, `createdAt`, `updatedAt`.
- **Application_Status**: One of four values — `pending`, `reviewed`, `accepted`, `rejected`.
- **Career_Page**: The public-facing page at `/careers` listing all active Career_Listings.
- **Job_Detail_Page**: A public-facing page at `/careers/:id` showing the full details of a single Career_Listing.
- **Application_Form**: The form used by candidates to submit a Job_Application, including resume file upload.
- **Resume_File**: A PDF, DOC, or DOCX file uploaded by a candidate as part of a Job_Application.
- **File_Upload_Service**: The backend service responsible for uploading Resume_Files to Supabase Storage and returning a public URL.
- **Admin_Applications_Page**: The authenticated admin page at `/admin/applications` for managing Job_Applications.
- **Filter_Panel**: The UI component on the Career_Page that allows visitors to filter Career_Listings by department, location, and type.
- **Search_Input**: The free-text input that filters Career_Listings by title or department.
- **Slug**: A URL-safe identifier derived from a Career_Listing's `id` used in the Job_Detail_Page route.

---

## Requirements

### Requirement 1: Job Detail Pages

**User Story:** As a job seeker, I want to view a dedicated page for each job listing, so that I can read the full description and requirements before deciding to apply.

#### Acceptance Criteria

1. WHEN a visitor navigates to `/careers/:id`, THE Career_Module SHALL render the Job_Detail_Page for the Career_Listing with the matching `id`.
2. THE Job_Detail_Page SHALL display the Career_Listing's `title`, `department`, `location`, `type`, `description`, and `requirements`.
3. THE Job_Detail_Page SHALL display an "Apply Now" button that opens the Application_Form for that Career_Listing.
4. IF the Career_Listing with the requested `id` does not exist or `isActive` is `false`, THEN THE Career_Module SHALL redirect the visitor to the Career_Page.
5. THE Career_Page SHALL render each Career_Listing card with a "View Details" link that navigates to the corresponding Job_Detail_Page.
6. THE Job_Detail_Page SHALL include a breadcrumb navigation link back to the Career_Page.
7. WHEN the Job_Detail_Page is loading data, THE Career_Module SHALL display a skeleton loading state in place of the content.

### Requirement 2: Application Form with Real File Upload

**User Story:** As a job seeker, I want to upload my resume/CV as a file when applying, so that my application includes my actual document rather than a placeholder.

#### Acceptance Criteria

1. WHEN a candidate submits the Application_Form, THE File_Upload_Service SHALL upload the Resume_File to Supabase Storage before creating the Job_Application record.
2. THE Application_Form SHALL accept Resume_Files in PDF, DOC, and DOCX formats only.
3. THE Application_Form SHALL reject Resume_Files larger than 5 MB and display an error message to the candidate.
4. WHEN the Resume_File upload succeeds, THE File_Upload_Service SHALL return a public URL and THE Career_Module SHALL store it in the `resumeUrl` field of the Job_Application.
5. IF the Resume_File upload fails, THEN THE Career_Module SHALL display an error message and SHALL NOT submit the Job_Application.
6. WHILE the Resume_File is uploading, THE Application_Form SHALL display an upload progress indicator and disable the submit button.
7. THE Application_Form SHALL validate that all required fields (name, email, phone, location, experience, startDate, coverLetter, resume) are non-empty before enabling submission.
8. WHEN the Application_Form is submitted successfully, THE Career_Module SHALL display a confirmation message and close the form.

### Requirement 3: Filtering and Search

**User Story:** As a job seeker, I want to filter and search job listings by department, location, type, and keywords, so that I can quickly find roles relevant to my background.

#### Acceptance Criteria

1. THE Filter_Panel SHALL provide a department filter that lists all distinct department values present in active Career_Listings.
2. THE Filter_Panel SHALL provide a location filter that lists all distinct location values present in active Career_Listings.
3. THE Filter_Panel SHALL provide an employment type filter with options derived from the distinct `type` values in active Career_Listings (e.g., Full-time, Part-time, Contract).
4. THE Search_Input SHALL filter Career_Listings whose `title` or `department` contains the search term, case-insensitively.
5. WHEN multiple filters are active simultaneously, THE Career_Page SHALL display only Career_Listings that satisfy all active filter conditions.
6. WHEN no Career_Listings match the active filters, THE Career_Page SHALL display a "No positions match your filters" message and a "Clear filters" button.
7. WHEN the "Clear filters" button is clicked, THE Filter_Panel SHALL reset all active filters and the Search_Input to their default (unfiltered) state.
8. THE Filter_Panel SHALL display the count of Career_Listings currently matching the active filters.
9. WHILE filter values are being derived from the Career_Listings data, THE Filter_Panel SHALL display a loading state.

### Requirement 4: Admin Application Management Enhancements

**User Story:** As an admin, I want to filter, sort, and bulk-update job applications, and download candidate resumes, so that I can efficiently manage the hiring pipeline.

#### Acceptance Criteria

1. THE Admin_Applications_Page SHALL provide a filter control to display Job_Applications for a specific Career_Listing, selectable from a dropdown of all Career_Listings.
2. THE Admin_Applications_Page SHALL provide a filter control to display Job_Applications by Application_Status.
3. THE Admin_Applications_Page SHALL allow sorting Job_Applications by `createdAt` (newest/oldest) and by `experience` (highest/lowest).
4. WHEN an admin selects one or more Job_Applications using checkboxes, THE Admin_Applications_Page SHALL display a bulk action toolbar with a status update control.
5. WHEN the admin applies a bulk status update, THE Admin_Applications_Page SHALL update the `status` field of all selected Job_Applications to the chosen Application_Status.
6. IF a bulk status update fails for any Job_Application, THEN THE Admin_Applications_Page SHALL display an error message identifying which updates failed.
7. WHEN a Job_Application has a valid `resumeUrl`, THE Admin_Applications_Page SHALL display a "Download Resume" button that opens the resume file in a new browser tab.
8. THE Admin_Applications_Page SHALL display the total count of Job_Applications and the count per Application_Status as summary statistics.
9. WHEN the admin updates the Application_Status of a single Job_Application, THE Admin_Applications_Page SHALL reflect the new status without requiring a full page reload.

### Requirement 5: Backend API Extensions

**User Story:** As a developer, I want the backend to expose the necessary endpoints for job detail lookup, file upload, application filtering, and bulk status updates, so that the frontend features are fully supported.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/careers/:id`, THE API SHALL return the Career_Listing with the matching `id` if it is active, or a 404 response if it does not exist or is inactive.
2. WHEN a POST request is made to `/api/upload/resume` with a valid Resume_File, THE File_Upload_Service SHALL upload the file to Supabase Storage and return a JSON response containing the public `url`.
3. IF the uploaded file exceeds 5 MB or is not a PDF, DOC, or DOCX, THEN THE API SHALL return a 400 response with a descriptive error message.
4. WHEN a GET request is made to `/api/admin/applications` with optional query parameters `jobId`, `status`, `sortBy`, and `sortOrder`, THE API SHALL return Job_Applications filtered and sorted accordingly.
5. WHEN a PATCH request is made to `/api/admin/applications/bulk-status` with a list of application `ids` and a target `status`, THE API SHALL update the `status` field of all specified Job_Applications and return the updated records.
6. IF any `id` in a bulk status update request does not correspond to an existing Job_Application, THEN THE API SHALL return a 400 response listing the invalid IDs.
7. THE API SHALL validate the `status` value in all status update requests against the allowed Application_Status values and return a 400 response for invalid values.
