# Anatomia - Medical Education Platform

## Overview

Anatomia is a corporate web application serving as an educational platform for medical students and professionals. The platform provides 3D anatomy models, articles, quizzes, and learning resources. Built as a full-stack TypeScript application with React frontend and Express backend, it follows a modern monorepo structure with shared schemas between client and server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Build Tool**: Vite with HMR support

The frontend follows a page-based architecture with reusable components. Pages include Home, About, Blog, Services, Contact, FAQ, Career, Search, Privacy, Terms, and Sitemap. Layout components (Navbar, Footer) wrap all pages consistently.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **HTTP Server**: Node.js native http module wrapping Express
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Development**: Vite middleware integration for hot reload

The server handles API routes for contact form submissions and newsletter subscriptions. In production, it serves static files from the Vite build output.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for shared type definitions
- **Validation**: Zod schemas generated via drizzle-zod
- **Current Storage**: In-memory storage implementation (MemStorage class)
- **Database Ready**: Drizzle config points to PostgreSQL via DATABASE_URL

The schema defines multiple tables including:
- **Auth**: users (admins), members (students), sessions
- **Content**: contact_messages, newsletter_subscriptions, articles, team_members, products, faq_items, careers
- **LMS**: courses, course_modules, lessons, lesson_assets, enrollments, lesson_progress, quizzes, quiz_questions, quiz_options, quiz_attempts, certificates

The storage abstraction (IStorage interface for basic operations, LmsStorage for LMS operations) allows swapping between memory and database implementations.

### Learning Management System (LMS)
The platform includes a full-fledged LMS with:
- **Courses**: Title, description, category, level, pricing, publishing status
- **Modules**: Sections within courses, ordered sequentially
- **Lessons**: Text, video, or interactive content with duration tracking
- **Progress Tracking**: Enrollment-based progress with lesson completion status, time-on-task tracking
- **Quizzes**: Multiple choice assessments with scoring and passing thresholds
- **Certificates**: Completion certificates with unique verification numbers
- **Course Prerequisites**: Enforced prerequisite completion before enrollment
- **Question Bank**: Centralized question repository with topics, difficulty levels, and tagging
- **Flashcards**: Spaced repetition system with SM-2 algorithm for optimal retention
- **Practice Mode**: Randomized question practice with real-time scoring and timer
- **Notifications**: In-app notification system for students and admins
- **Audit Logging**: Comprehensive admin action logging for compliance

### Role-Based Access Control (RBAC)
- **Super Admin**: Full system access, audit log viewing
- **Content Admin**: Manage courses, questions, flashcards
- **Reviewer**: Review and approve content (future)
- **Student (Member)**: Access enrolled courses, practice, flashcards

Admin routes: `/api/lms/admin/*` (requires admin auth)
Public routes: `/api/lms/courses`, `/api/lms/question-topics`, `/api/lms/question-bank`, `/api/lms/flashcard-decks`
Member routes: `/api/lms/enrollments`, `/api/lms/lessons/:id/progress`, `/api/lms/flashcards/:id/review`

### Student-Facing Pages
- `/dashboard` - Student dashboard with enrollments, progress, achievements
- `/courses` - Course catalog with search and filters (category, level, sort)
- `/practice` - Practice mode with randomized questions
- `/flashcards` - Flashcard study with browse and spaced repetition modes
- `/anatomy-viewer` - 3D anatomy model viewer with interactive controls

### 3D Anatomy Models
- Uses @google/model-viewer web component for GLB/GLTF rendering
- Supports camera controls, auto-rotate, zoom, and fullscreen
- Models organized by body system and category with search filters
- Annotations support for labeling anatomical structures

### PDF Certificate Generation
- PDFKit-based server-side certificate generation
- Landscape A4 format with medical blue/white theme
- Contains member name, course title, completion date, certificate ID
- Downloadable via /api/lms/certificates/download/:number
- Verifiable at /api/lms/certificates/verify/:number

### Build System
- **Client Build**: Vite outputs to `dist/public`
- **Server Build**: esbuild bundles server to `dist/index.cjs`
- **Development**: `tsx` runs TypeScript directly
- **Database Migrations**: `drizzle-kit push` for schema sync

### Design System
The application follows corporate design guidelines with:
- Modern sans-serif typography (Inter via Google Fonts)
- Consistent spacing system using Tailwind units
- Component library based on shadcn/ui with custom theming
- Light/dark mode support via CSS variables
- Responsive layouts with mobile-first approach

## External Dependencies

### Database
- PostgreSQL (configured but requires DATABASE_URL environment variable)
- Drizzle ORM for type-safe database operations
- connect-pg-simple available for session storage

### UI/Component Libraries
- Radix UI primitives (accordion, dialog, dropdown, tabs, etc.)
- shadcn/ui component collection
- Lucide React for icons
- React Icons for social media icons
- Embla Carousel for carousels
- react-day-picker for date selection
- Vaul for drawer components
- cmdk for command palette

### Form Handling
- React Hook Form with Zod resolver
- Zod for schema validation
- drizzle-zod for database schema to Zod conversion

### Development Tools
- Vite with React plugin
- Replit-specific plugins (error overlay, cartographer, dev banner)
- TypeScript with strict mode
- PostCSS with Tailwind and Autoprefixer