# Bugfix Requirements Document

## Introduction

The Career page (`client/src/pages/Career.tsx`) displays a hardcoded static list of 4 mock job openings instead of fetching real job listings from the database. A public API endpoint (`GET /api/careers`) already exists and returns active jobs from Supabase, but the Career page never calls it. As a result, visitors always see the same stale mock data regardless of what jobs have been created or deactivated by admins.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user visits the Career page THEN the system displays a hardcoded static list of 4 mock job openings ("Senior Medical Illustrator", "Full Stack Developer", "Content Editor - Anatomy", "3D Generalist") regardless of the actual jobs in the database

1.2 WHEN an admin creates a new active job listing via the admin panel THEN the system does not show the new job on the public Career page

1.3 WHEN an admin deactivates or deletes a job listing via the admin panel THEN the system continues to display that job on the public Career page

### Expected Behavior (Correct)

2.1 WHEN a user visits the Career page THEN the system SHALL fetch and display the list of active job openings from `GET /api/careers`

2.2 WHEN an admin creates a new active job listing THEN the system SHALL show the new job on the public Career page upon the next page load or data refresh

2.3 WHEN an admin deactivates or deletes a job listing THEN the system SHALL no longer display that job on the public Career page

2.4 WHEN the Career page is loading job data from the API THEN the system SHALL display a loading state to the user

2.5 WHEN the API request to `GET /api/careers` fails THEN the system SHALL display an appropriate error or empty state rather than crashing

2.6 WHEN the API returns an empty list of active jobs THEN the system SHALL display an empty state message instead of showing mock data

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user visits the Career page THEN the system SHALL CONTINUE TO display the hero section, values section, benefits section, and "Don't see the right role?" section unchanged

3.2 WHEN a user visits the Career page THEN the system SHALL CONTINUE TO render each job card with its title, location, type, and department badges

3.3 WHEN a user interacts with the search input on the Career page THEN the system SHALL CONTINUE TO render the search field in the openings section header

3.4 WHEN the Career page renders job cards THEN the system SHALL CONTINUE TO display an "Apply Now" button on each job card

---

## Bug Condition

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type PageLoadEvent
  OUTPUT: boolean

  // Returns true when the Career page is loaded (the bug always triggers on page load)
  RETURN X.page = "Career" AND X.dataSource = "hardcoded"
END FUNCTION
```

**Property: Fix Checking**
```pascal
// Property: Fix Checking - Career page fetches real jobs
FOR ALL X WHERE isBugCondition(X) DO
  result ← renderCareerPage'(X)
  ASSERT result.jobListings = fetchFromAPI("/api/careers")
  ASSERT result.jobListings ≠ hardcodedMockOpenings
END FOR
```

**Property: Preservation Checking**
```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT renderCareerPage(X).staticSections = renderCareerPage'(X).staticSections
END FOR
```
