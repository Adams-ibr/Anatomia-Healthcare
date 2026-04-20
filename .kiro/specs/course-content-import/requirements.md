# Requirements Document

## Introduction

This feature enables admins and instructors to import existing questions from the Question Bank, flashcard decks/cards from the Flashcards module, and 3D anatomy models from the 3D Models module directly into course content while building or editing a course. The goal is to eliminate content duplication by allowing reuse of centrally managed questions, flashcards, and 3D models across multiple courses.

When building a course (adding quizzes, flashcard sections, or 3D model viewers to lessons/modules), the user can open an import browser, search and filter existing content, select items, and have them linked or copied into the target lesson, module, or quiz.

## Glossary

- **Admin**: An authenticated admin-panel user with the `admin` or `super_admin` role.
- **Instructor**: An authenticated admin-panel user with the `instructor` role (if applicable) who has write access to course content.
- **Course_Builder**: The admin UI used to create and edit courses, modules, lessons, and quizzes.
- **Question_Bank**: The centralized pool of reusable questions stored in the `question_bank` table, each with associated answer options in `question_bank_options`.
- **Quiz**: A quiz/assessment attached to a course or lesson, stored in the `quizzes` table, containing `quiz_questions` and `quiz_options`.
- **Flashcard_Module**: The admin UI and backend managing `flashcard_decks` and `flashcards` tables.
- **Flashcard_Deck**: A named collection of flashcards stored in the `flashcard_decks` table, optionally linked to a course or module.
- **Flashcard**: An individual study card stored in the `flashcards` table, belonging to a deck.
- **3D_Models_Module**: The admin UI and backend managing the `anatomy_models` table, used to upload and manage interactive 3D anatomy models.
- **Anatomy_Model**: A published 3D anatomy model stored in the `anatomy_models` table, with fields including `title`, `description`, `category`, `bodySystem`, `modelUrl`, `thumbnailUrl`, `tags`, and `annotations`.
- **Lesson_3D_Model**: A reference record linking an `Anatomy_Model` to a specific lesson, stored in a `lesson_anatomy_models` join table (or equivalent), enabling students to view the model within the lesson context.
- **Import**: The act of copying a Question Bank item (with its options) into a Quiz as a new `quiz_question` + `quiz_options`, copying a Flashcard Deck (with its cards) or individual Flashcards into a course lesson or module, or linking an Anatomy_Model to a lesson or module.
- **Import_Browser**: A modal dialog within the Course_Builder that allows browsing, searching, filtering, and selecting content to import.
- **Importer**: The system component (API + UI) responsible for executing import operations.

---

## Requirements

### Requirement 1: Access Control for Import

**User Story:** As an admin or instructor, I want import functionality to be restricted to authorized roles, so that only trusted users can add content to courses.

#### Acceptance Criteria

1. WHEN a user attempts to access any import endpoint, THE Importer SHALL verify the request is authenticated via the admin session.
2. IF an unauthenticated request is made to an import endpoint, THEN THE Importer SHALL return an HTTP 401 response.
3. IF an authenticated user without admin or instructor privileges attempts an import, THEN THE Importer SHALL return an HTTP 403 response.
4. THE Course_Builder SHALL display import controls only to users with admin or instructor roles.

---

### Requirement 2: Browse and Search Question Bank for Import

**User Story:** As an admin or instructor building a quiz, I want to browse and search the Question Bank, so that I can find relevant questions to add to the quiz without leaving the course editor.

#### Acceptance Criteria

1. WHEN an admin or instructor opens the Import_Browser for questions, THE Import_Browser SHALL display a paginated list of all active Question_Bank items.
2. WHEN a search term is entered in the Import_Browser, THE Import_Browser SHALL filter the displayed questions to those whose question text contains the search term (case-insensitive).
3. WHEN a topic filter is selected in the Import_Browser, THE Import_Browser SHALL display only questions belonging to that topic.
4. WHEN a difficulty filter is selected in the Import_Browser, THE Import_Browser SHALL display only questions matching that difficulty level (`easy`, `medium`, or `hard`).
5. THE Import_Browser SHALL display each question's text, type, topic, difficulty, and point value.
6. THE Import_Browser SHALL allow the user to select one or more questions using checkboxes before confirming the import.

---

### Requirement 3: Import Questions into a Quiz

**User Story:** As an admin or instructor, I want to import selected questions from the Question Bank into a quiz, so that I can reuse existing questions without recreating them.

#### Acceptance Criteria

1. WHEN an admin or instructor confirms an import of one or more Question_Bank items into a Quiz, THE Importer SHALL create a new `quiz_question` record for each selected item in the target quiz, copying the `question`, `questionType`, `explanation`, and `points` fields.
2. WHEN a Question_Bank item is imported into a Quiz, THE Importer SHALL create corresponding `quiz_option` records for each `question_bank_option` of that item, copying `optionText`, `isCorrect`, and `order`.
3. WHEN questions are imported into a Quiz, THE Importer SHALL assign sequential `order` values starting after the last existing question in that quiz.
4. IF a Question_Bank item has no active options, THEN THE Importer SHALL still create the `quiz_question` record and return a warning indicating that options were not found.
5. WHEN the import completes successfully, THE Importer SHALL return the list of newly created `quiz_question` records.
6. THE Course_Builder SHALL refresh the quiz question list after a successful import without requiring a full page reload.

---

### Requirement 4: Browse and Search Flashcard Decks for Import

**User Story:** As an admin or instructor building course content, I want to browse and search existing flashcard decks, so that I can find relevant decks to attach to a course or module.

#### Acceptance Criteria

1. WHEN an admin or instructor opens the Import_Browser for flashcard decks, THE Import_Browser SHALL display a list of all published `flashcard_decks` not already linked to the target course or module.
2. WHEN a search term is entered in the Import_Browser, THE Import_Browser SHALL filter the displayed decks to those whose title or description contains the search term (case-insensitive).
3. WHEN a category filter is selected in the Import_Browser, THE Import_Browser SHALL display only decks matching that category.
4. THE Import_Browser SHALL display each deck's title, description, category, and card count.
5. THE Import_Browser SHALL allow the user to select one or more decks before confirming the import.

---

### Requirement 5: Import Flashcard Decks into a Course or Module

**User Story:** As an admin or instructor, I want to import a flashcard deck into a course or module, so that students enrolled in the course can access those flashcards.

#### Acceptance Criteria

1. WHEN an admin or instructor confirms an import of one or more Flashcard_Decks into a course, THE Importer SHALL create a new `flashcard_deck` record for each selected deck, copying `title`, `description`, and `category`, and setting the `courseId` to the target course.
2. WHEN a Flashcard_Deck is imported into a module, THE Importer SHALL set both `courseId` and `moduleId` on the new deck record.
3. WHEN a Flashcard_Deck is imported, THE Importer SHALL create new `flashcard` records for every card in the source deck, copying `front`, `back`, `cardType`, `options`, `correctAnswer`, `explanation`, `imageUrl`, `audioUrl`, and `order`, linked to the new deck.
4. IF a selected Flashcard_Deck contains zero flashcards, THEN THE Importer SHALL still create the deck record and return a warning indicating the deck was empty.
5. WHEN the import completes successfully, THE Importer SHALL return the list of newly created `flashcard_deck` records.
6. THE Course_Builder SHALL reflect the newly imported decks in the course/module flashcard section after a successful import without requiring a full page reload.

---

### Requirement 6: Browse and Import Individual Flashcards

**User Story:** As an admin or instructor, I want to import individual flashcards from any deck into an existing course deck, so that I can cherry-pick specific cards without importing an entire deck.

#### Acceptance Criteria

1. WHEN an admin or instructor opens the Import_Browser for individual flashcards, THE Import_Browser SHALL display all flashcards grouped by their source deck.
2. WHEN a search term is entered in the Import_Browser, THE Import_Browser SHALL filter displayed flashcards to those whose `front` or `back` text contains the search term (case-insensitive).
3. THE Import_Browser SHALL allow the user to select individual flashcards across multiple source decks.
4. WHEN an admin or instructor confirms an import of individual flashcards into a target deck, THE Importer SHALL create new `flashcard` records in the target deck for each selected card, copying all content fields and assigning sequential `order` values after the last existing card.
5. WHEN the import completes successfully, THE Importer SHALL return the list of newly created `flashcard` records.

---

### Requirement 7: Browse and Search 3D Anatomy Models for Import

**User Story:** As an admin or instructor building a lesson, I want to browse and search the existing 3D anatomy models, so that I can find relevant models to embed in a lesson without leaving the course editor.

#### Acceptance Criteria

1. WHEN an admin or instructor opens the Import_Browser for 3D models, THE Import_Browser SHALL display a paginated list of all published Anatomy_Models from the `anatomy_models` table.
2. WHEN a search term is entered in the Import_Browser, THE Import_Browser SHALL filter the displayed models to those whose `title` or `description` contains the search term (case-insensitive).
3. WHEN a category filter is selected in the Import_Browser, THE Import_Browser SHALL display only Anatomy_Models whose `category` field matches the selected value.
4. WHEN a body system filter is selected in the Import_Browser, THE Import_Browser SHALL display only Anatomy_Models whose `bodySystem` field matches the selected value.
5. THE Import_Browser SHALL display each model's `title`, `category`, `bodySystem`, and `thumbnailUrl` (as a preview image where available).
6. THE Import_Browser SHALL allow the user to select one or more Anatomy_Models using checkboxes before confirming the import.

---

### Requirement 8: Import 3D Anatomy Models into a Lesson or Module

**User Story:** As an admin or instructor, I want to import selected 3D anatomy models into a lesson or module, so that students can interact with the models as part of the course content.

#### Acceptance Criteria

1. WHEN an admin or instructor confirms an import of one or more Anatomy_Models into a lesson, THE Importer SHALL create a reference record for each selected model linking the `anatomy_model` id to the target `lesson_id`, preserving the original model data without duplication.
2. WHEN an admin or instructor confirms an import of one or more Anatomy_Models into a module, THE Importer SHALL create a reference record for each selected model linking the `anatomy_model` id to the target `module_id`.
3. WHEN 3D models are imported into a lesson, THE Importer SHALL assign sequential `order` values starting after the last existing 3D model reference in that lesson.
4. IF a selected Anatomy_Model id does not correspond to a published record in the `anatomy_models` table, THEN THE Importer SHALL return an HTTP 422 response listing the invalid IDs.
5. WHEN the import completes successfully, THE Importer SHALL return the list of newly created reference records including the `anatomy_model` id, `lessonId` or `moduleId`, and `order`.
6. THE Course_Builder SHALL reflect the newly imported 3D models in the lesson or module content section after a successful import without requiring a full page reload.

---

### Requirement 9: Prevent Duplicate Imports

**User Story:** As an admin or instructor, I want the system to warn me if I am about to import content that appears to already exist in the target quiz, deck, or lesson, so that I avoid unintentional duplication.

#### Acceptance Criteria

1. WHEN an admin or instructor selects questions for import, THE Import_Browser SHALL visually indicate any selected Question_Bank item whose question text already exists verbatim in the target quiz.
2. WHEN an admin or instructor selects flashcard decks for import, THE Import_Browser SHALL visually indicate any selected deck whose title already exists in the target course or module.
3. WHEN an admin or instructor selects Anatomy_Models for import, THE Import_Browser SHALL visually indicate any selected model that is already linked to the target lesson or module.
4. IF the user proceeds with importing a flagged item, THEN THE Importer SHALL complete the import and include a `duplicateWarnings` array in the response listing the affected items.

---

### Requirement 10: Import API Endpoints

**User Story:** As a developer, I want well-defined API endpoints for import operations, so that the frontend and any future integrations can reliably trigger imports.

#### Acceptance Criteria

1. THE Importer SHALL expose a `POST /api/lms/admin/quizzes/:quizId/import-questions` endpoint that accepts a JSON body with a `questionIds` array of Question_Bank item IDs.
2. THE Importer SHALL expose a `POST /api/lms/admin/courses/:courseId/import-flashcard-decks` endpoint that accepts a JSON body with a `deckIds` array of source Flashcard_Deck IDs and an optional `moduleId`.
3. THE Importer SHALL expose a `POST /api/lms/admin/flashcard-decks/:deckId/import-flashcards` endpoint that accepts a JSON body with a `flashcardIds` array of source Flashcard IDs.
4. THE Importer SHALL expose a `POST /api/lms/admin/lessons/:lessonId/import-3d-models` endpoint that accepts a JSON body with a `modelIds` array of Anatomy_Model IDs.
5. THE Importer SHALL expose a `POST /api/lms/admin/modules/:moduleId/import-3d-models` endpoint that accepts a JSON body with a `modelIds` array of Anatomy_Model IDs, for attaching models at the module level.
6. IF any ID in the request body does not correspond to an existing record, THEN THE Importer SHALL return an HTTP 422 response listing the invalid IDs.
7. WHEN an import request body is malformed or missing required fields, THE Importer SHALL return an HTTP 400 response with a descriptive error message.
8. WHEN an import operation succeeds, THE Importer SHALL return an HTTP 201 response containing the created records and any `duplicateWarnings`.
