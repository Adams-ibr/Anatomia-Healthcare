# Implementation Plan: Course Content Import

## Overview

Implement the course content import feature in three layers: database migration + schema, backend ImportService + API endpoints, and frontend ImportBrowserDialog + course builder integrations. Questions and flashcards are copied as new records; 3D models are reference-linked via a new join table.

## Tasks

- [x] 1. Database: Add `lesson_anatomy_models` join table
  - [x] 1.1 Write SQL migration for `lesson_anatomy_models`
    - Create `scripts/add-lesson-anatomy-models.sql` with the table definition, FK constraints, and the `lesson_or_module` CHECK constraint from the design
    - _Requirements: 8.1, 8.2_

  - [x] 1.2 Add Drizzle schema definition in `shared/models/lms.ts`
    - Add `lessonAnatomyModels` pgTable, `insertLessonAnatomyModelSchema`, and export `LessonAnatomyModel` / `InsertLessonAnatomyModel` types
    - Export the new types from `shared/schema.ts`
    - _Requirements: 8.1, 8.2_

- [x] 2. Backend: Implement `ImportService` in `server/import-service.ts`
  - [x] 2.1 Implement `importQuestionsToQuiz`
    - Fetch source `question_bank` items and their `question_bank_options` by IDs
    - Detect duplicates by comparing question text against existing `quiz_questions` in the target quiz
    - Copy each item as a new `quiz_question` + `quiz_options`, assigning sequential order after the current max
    - Return `{ created, duplicateWarnings }`; include warning for questions with no options (Req 3.4)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.4_

  - [ ]* 2.2 Write property test for `importQuestionsToQuiz` — Property 2
    - **Property 2: Question import creates exact copies**
    - **Validates: Requirements 3.1, 3.5**

  - [ ]* 2.3 Write property test for option copying — Property 3
    - **Property 3: Question option copying fidelity**
    - **Validates: Requirements 3.2**

  - [ ]* 2.4 Write property test for order assignment — Property 4
    - **Property 4: Import order assignment invariant** (covers quiz, deck, and lesson/module order)
    - **Validates: Requirements 3.3, 6.4, 8.3**

  - [x] 2.5 Implement `importFlashcardDecksToTarget`
    - Fetch source `flashcard_decks` and their `flashcards` by IDs
    - Detect duplicates by comparing deck title against existing decks in the target course/module
    - Copy each deck as a new `flashcard_deck` with `courseId` (and optional `moduleId`) set to the target
    - Copy all cards into the new deck; warn if source deck has zero cards (Req 5.4)
    - Return `{ created, duplicateWarnings }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.2, 9.4_

  - [ ]* 2.6 Write property test for flashcard deck import — Property 5
    - **Property 5: Flashcard deck import creates copies with correct target IDs**
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 2.7 Write property test for flashcard card copying — Property 6
    - **Property 6: Flashcard card copying fidelity**
    - **Validates: Requirements 5.3**

  - [x] 2.8 Implement `importFlashcardsToDecks`
    - Fetch source `flashcards` by IDs
    - Copy each card into the target deck, assigning sequential order after the current max
    - Return `{ created, duplicateWarnings }`
    - _Requirements: 6.4, 6.5_

  - [x] 2.9 Implement `importModelsToLesson` and `importModelsToModule`
    - Validate all `modelIds` exist and are published; collect invalid IDs and throw 422 if any found (Req 8.4)
    - Detect duplicates by checking existing `lesson_anatomy_models` rows for the target lesson/module
    - Insert reference records with sequential order; return `{ created, duplicateWarnings }`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.3, 9.4_

  - [ ]* 2.10 Write property test for 3D model import — Property 7
    - **Property 7: 3D model import creates reference records**
    - **Validates: Requirements 8.1, 8.2, 8.5**

  - [ ]* 2.11 Write property test for duplicate detection — Property 8
    - **Property 8: Duplicate detection correctness**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 10.8**

  - [ ]* 2.12 Write property test for invalid ID rejection — Property 9
    - **Property 9: Invalid ID rejection**
    - **Validates: Requirements 8.4, 10.6**

- [x] 3. Backend: Add 5 import API endpoints to `server/lms-routes.ts`
  - [x] 3.1 Add `POST /api/lms/admin/quizzes/:quizId/import-questions`
    - Validate request body has `questionIds: string[]`; return 400 if malformed
    - Verify quiz exists; return 404 if not
    - Call `importService.importQuestionsToQuiz`; return 201 with result
    - _Requirements: 1.1, 1.2, 10.1, 10.7, 10.8_

  - [x] 3.2 Add `POST /api/lms/admin/courses/:courseId/import-flashcard-decks`
    - Validate `deckIds: string[]` and optional `moduleId`; return 400 if malformed
    - Verify course exists; return 404 if not
    - Call `importService.importFlashcardDecksToTarget`; return 201 with result
    - _Requirements: 1.1, 1.2, 10.2, 10.7, 10.8_

  - [x] 3.3 Add `POST /api/lms/admin/flashcard-decks/:deckId/import-flashcards`
    - Validate `flashcardIds: string[]`; return 400 if malformed
    - Verify target deck exists; return 404 if not
    - Call `importService.importFlashcardsToDecks`; return 201 with result
    - _Requirements: 1.1, 1.2, 10.3, 10.7, 10.8_

  - [x] 3.4 Add `POST /api/lms/admin/lessons/:lessonId/import-3d-models`
    - Validate `modelIds: string[]`; return 400 if malformed
    - Verify lesson exists; return 404 if not
    - Call `importService.importModelsToLesson`; propagate 422 for invalid IDs; return 201 with result
    - _Requirements: 1.1, 1.2, 10.4, 10.6, 10.7, 10.8_

  - [x] 3.5 Add `POST /api/lms/admin/modules/:moduleId/import-3d-models`
    - Validate `modelIds: string[]`; return 400 if malformed
    - Verify module exists; return 404 if not
    - Call `importService.importModelsToModule`; propagate 422 for invalid IDs; return 201 with result
    - _Requirements: 1.1, 1.2, 10.5, 10.6, 10.7, 10.8_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Frontend: Build `ImportBrowserDialog` component
  - [x] 5.1 Create `client/src/components/admin/ImportBrowserDialog.tsx` with base structure
    - Define `ImportContentType` union type and `ImportBrowserDialogProps` interface per the design
    - Scaffold the Dialog shell with search input, filter selects, item list area, and "Import Selected" button
    - Manage `searchQuery`, `filters`, `selectedIds`, and `duplicateIds` state
    - _Requirements: 2.1, 2.5, 2.6, 4.4, 4.5, 7.5, 7.6_

  - [x] 5.2 Implement question browsing mode
    - Fetch from `/api/lms/admin/question-bank` and `/api/lms/admin/question-topics`
    - Render topic and difficulty filter selects; apply client-side filtering
    - Display question text, type, topic, difficulty, and points per row
    - Visually flag items whose question text already exists in the target quiz (`duplicateIds`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.1_

  - [ ]* 5.3 Write property test for filter logic — Property 1
    - **Property 1: Import browser filtering correctness**
    - Extract the pure filter function and test it with fast-check
    - **Validates: Requirements 2.2, 2.3, 2.4, 4.2, 4.3, 6.2, 7.2, 7.3, 7.4**

  - [x] 5.4 Implement flashcard deck browsing mode
    - Fetch from `/api/lms/admin/flashcard-decks`
    - Render category filter; apply client-side filtering by title/description/category
    - Display deck title, description, category, and card count
    - Visually flag decks whose title already exists in the target course/module
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.2_

  - [x] 5.5 Implement individual flashcard browsing mode
    - Fetch all decks and their cards; group cards by source deck
    - Apply client-side search on `front` and `back` text
    - Allow multi-deck selection
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 5.6 Implement 3D model browsing mode
    - Fetch from `/api/lms/admin/anatomy-models`
    - Render category and body system filter selects; apply client-side filtering
    - Display model title, category, bodySystem, and thumbnail image
    - Visually flag models already linked to the target lesson/module
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.3_

  - [x] 5.7 Wire up import mutations and cache invalidation
    - Call the correct import endpoint based on `contentType` and target props
    - On success: invalidate relevant TanStack Query keys, call `onImportSuccess`, close dialog
    - Display `duplicateWarnings` from the response as toast notifications
    - _Requirements: 3.6, 5.6, 6.5, 8.6, 9.4_

- [x] 6. Frontend: Integrate `ImportBrowserDialog` into course builder pages
  - [x] 6.1 Add import controls to `AdminLessons.tsx`
    - Add "Import from Question Bank" button in the quiz editor section; open dialog with `contentType="questions"` and `targetQuizId`
    - Add "Import Flashcard Decks" button in the lesson flashcard section; open dialog with `contentType="flashcard-decks"` and `targetCourseId` / `targetLessonId`
    - Add "Import 3D Models" button in the lesson 3D models section; open dialog with `contentType="3d-models"` and `targetLessonId`
    - _Requirements: 1.4, 3.6, 5.6, 8.6_

  - [x] 6.2 Add import controls to `AdminModules.tsx`
    - Add "Import Flashcard Decks" button per module; open dialog with `contentType="flashcard-decks"`, `targetCourseId`, and `targetModuleId`
    - Add "Import 3D Models" button per module; open dialog with `contentType="3d-models"` and `targetModuleId`
    - _Requirements: 1.4, 5.6, 8.6_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use **fast-check** and mock the Supabase client; no real DB calls needed
- The `ImportService` validates all IDs before any writes — no partial imports on 422
- The `lesson_anatomy_models` CHECK constraint enforces that exactly one of `lesson_id` / `module_id` is set
