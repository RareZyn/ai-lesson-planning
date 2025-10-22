# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Lesson Planning - A full-stack MERN application for educators to create lesson plans, generate assessments, and manage educational content using AI (Google Gemini).

**Tech Stack:**
- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend: React + React Router + Material-UI/Ant Design
- AI: Google Gemini API (gemini-2.0-flash)
- PDF Export: jsPDF + html2canvas

## Development Commands

### Installation
```bash
npm run install-all          # Install all dependencies (root, backend, frontend)
```

### Running the Application
```bash
npm run dev                   # Run both backend and frontend concurrently
npm run server                # Backend only (with nodemon on port 5000)
npm run client                # Frontend only (React dev server on port 3000)
npm start                     # Production mode (backend only)
```

### Backend
```bash
cd backend
npm run server                # Run with nodemon (auto-restart)
node server.js                # Run directly
```

### Frontend
```bash
cd frontend/client
npm start                     # React development server
npm run build                 # Production build
npm test                      # Run tests
```

## Architecture

### Backend Structure

The backend follows an MVC pattern with service layers:

**Controllers** (`backend/controller/`):
- `authController.js` - Authentication (JWT, Firebase, Google OAuth)
- `assessmentController.js` - Assessment CRUD and AI generation
- `lessonController.js` - Lesson plan management
- `classController.js` - Class management
- `studentController.js` - Student data
- `gradingController.js` - Automated grading
- `ocrController.js` - OCR for answer sheets
- `communityController.js` - Community features

**Models** (`backend/model/`):
- `User.js` - Encrypted Gemini API keys, Google/Firebase auth
- `Assessment.js` - Supports multiple activity types: `activity`, `essay`, `textbook`, `assessment`, `activityInClass`, `spm-exam`
- `Lesson.js` - Lesson plans with DSKP integration
- `Class.js` - Class management
- `Student.js` - Student records
- `DSKP.js` - Malaysian curriculum standards

**Services** (`backend/services/`):
- `assessmentGenerator.js` - Core AI generation service using Gemini
- `promptBuilder.js` - Builds prompts for different assessment types
- `contentStructurer.js` - Structures AI responses
- `gradingService.js` - Auto-grading logic
- `htmlTemplates.js` - HTML generation for exports

**Routes** (`backend/route/`):
All routes are prefixed with `/api`:
- `/api/auth` - Authentication endpoints
- `/api/assessment` - Assessment CRUD + generation
- `/api/lessons` - Lesson plans
- `/api/classes` - Class management
- `/api/students` - Student management
- `/api/grading` - Grading endpoints
- `/api/ocr` - OCR processing
- `/api/community` - Community features

**Middleware** (`backend/middleware/`):
- `auth.js` - JWT verification and user authentication

### Frontend Structure

**Pages** (`frontend/client/src/pages/`):
- `auth/` - Login/Register with Firebase
- `assesstment/` - Assessment creation and viewing
- `planner/` - Multi-step lesson planner
- `class/` - Class management
- `material/` - Material management (DSKP, textbooks)
- `answerChecker/` - Student submission review
- `community/` - Community features
- `downloads/` - File downloads

**Services** (`frontend/client/src/services/`):
- `enhancedPdfExport.js` - **Critical**: Handles PDF exports, especially SPM exams with question-by-question rendering to prevent page splits

**Routing** (`frontend/client/src/routes.js`):
All app routes are under `/app` (protected), with authentication routes at root level.

### Key Data Flow

1. **Assessment Generation**:
   - User creates assessment via frontend
   - Backend controller calls `AssessmentGenerator` service
   - Service builds prompt using `promptBuilder` based on activity type
   - Gemini API generates content (uses `jsonrepair` for malformed JSON)
   - Content is saved in `Assessment` model with both JSON and HTML versions
   - Frontend displays using Material-UI components

2. **SPM Exam Export** (Special Case):
   - Frontend detects SPM exam format in `enhancedPdfExport.js`
   - Exports question-by-question to prevent page splits
   - Adds header page and answer sheet for Paper 1
   - Uses html2canvas to convert DOM elements to images

3. **Authentication**:
   - Supports email/password (bcrypt), Google OAuth, and Firebase
   - JWT tokens stored in cookies
   - Middleware validates tokens on protected routes

## Important Implementation Details

### Assessment Types

The system supports 6 activity types (defined in `Assessment.js` schema):
- `activity` - General activities (activityContent + rubricContent)
- `essay` - Essay prompts (activityContent + rubricContent)
- `textbook` - Textbook exercises (activityContent + rubricContent)
- `assessment` - Assessments/quizzes (assessmentContent + answerKeyContent)
- `activityInClass` - In-class activities (activityContent + rubricContent)
- `spm-exam` - SPM format exams (examContent + answerKeyContent)

**Critical**: SPM exams use `examContent` field but also populate `assessmentContent` for backward compatibility.

### Generated Content Structure

The `Assessment.generatedContent` field contains both JSON and HTML versions:
```javascript
{
  activityContent: {},    // JSON
  activityHTML: "",       // HTML string
  rubricContent: {},      // JSON
  rubricHTML: "",         // HTML string
  assessmentContent: {},  // JSON
  assessmentHTML: "",     // HTML string
  answerKeyContent: {},   // JSON
  answerKeyHTML: "",      // HTML string
  examContent: {},        // JSON (SPM only)
  examHTML: ""            // HTML string (SPM only)
}
```

### API Key Encryption

User Gemini API keys are encrypted using AES-256-GCM before storage:
- Encryption/decryption logic in `User.js` model
- Requires `ENCRYPTION_SECRET` (64-char hex) in `.env`
- Keys are never exposed in API responses

### PDF Export

The `enhancedPdfExport.js` service handles all PDF generation:
- Detects SPM exams and uses specialized export
- Question-by-question rendering prevents page splits
- Fallback to canvas-based export for other content
- Methods: `exportHtmlElementToPdf()`, `exportSpmExamQuestionByQuestion()`

### Environment Variables

Backend requires (in `backend/.env`):
```
MONGO_URI=<MongoDB connection string>
JWT_SECRET=<JWT signing key>
ENCRYPTION_SECRET=<64-char hex for API key encryption>
PORT=5000
```

Frontend proxy is configured in `frontend/client/package.json` to proxy to `http://localhost:5000`.

## Common Patterns

### Adding a New Assessment Type

1. Add type to `Assessment.js` activityType enum
2. Create prompt builder in `promptBuilder.js`
3. Add generation method in `assessmentGenerator.js`
4. Update `generateByType()` switch case
5. Add frontend UI components and routing

### Working with AI Generation

- All AI calls go through `AssessmentGenerator` class
- Use `parseAndRepairAIResponse()` for robust JSON parsing (handles malformed responses)
- Always validate required fields after generation
- Implement retry logic for failed generations

### Database Queries

- Use Mongoose models with proper population: `.populate('lessonPlanId', 'parameters plan')`
- Assessment model has static methods: `getUserAssessments(userId, filters)`
- Indexes are defined in models for performance

## Recent Changes

- Fixed PDF export for SPM exams (question-by-question rendering)
- Enhanced Assessment schema to support standalone assessments with `isStandalone` flag
- Added SPM exam content handling with `examContent` and `examHTML` fields
- Restructured `assessmentController.js` for better organization
- Added answer sheet generation for SPM Paper 1 exams

# Additional Sections for CLAUDE.md

## Project Context & Goals

### Problem Statement
This system addresses 6 key challenges in Malaysian education:
1. **Time-consuming manual lesson planning** - Teachers spend excessive time creating materials
2. **Lack of KSSR/KSSM alignment** - Existing tools don't follow Malaysian curriculum (DSKP)
3. **Poor internet connectivity** - Rural areas lack consistent access
4. **No integrated OCR + AI grading** - Manual checking of handwritten answers
5. **Missing unified analytics dashboard** - No centralized student performance tracking
6. **No teacher collaboration platform** - Lesson sharing happens informally via Telegram

### Target Users
- **Primary**: Malaysian secondary school teachers (KSSM syllabus)
- **Demographics**: Diverse teaching experience, predominantly Malay, some Chinese and Indian
- **Pain Points**: DSKP alignment difficulty, Bloom's Taxonomy implementation, offline access needs

### Core Objectives (Priority Order)
1. **HIGH**: AI-powered assessment generator (FR-001 to FR-003)
2. **HIGH**: OCR + auto-grading system (FR-007 to FR-011)
3. **HIGH**: Offline support with sync (FR-004 to FR-006)
4. **MEDIUM**: Performance analytics dashboard (FR-012 to FR-015)
5. **LOW**: Lesson sharing hub (FR-016 to FR-018)

## Malaysian Education Context

### DSKP (Dokumen Standard Kurikulum dan Pentaksiran)
- Ministry of Education curriculum documents
- Contains "Learning Standards" and "Success Criteria"
- Teachers must align all activities with DSKP objectives
- System should reference DSKP when generating content

### Bloom's Taxonomy Integration
All generated content must follow Bloom's 6 cognitive levels:
1. Remember (mengingat)
2. Understand (memahami)
3. Apply (mengaplikasi)
4. Analyze (menganalisis)
5. Evaluate (menilai)
6. Create (mencipta)

### Curriculum Levels
- **KSSR**: Primary school (Tahun 1-6)
- **KSSM**: Secondary school (Tingkatan 1-5) - **Primary focus**
- SPM exam format support required

## Feature Modules (Detailed)

### 1. Assessment Generator Module
**Use Cases**: UC-001 to UC-003

**Key Features**:
- AI generates pre-activity, main activity, post-activity
- Auto-generates objectives and success criteria
- Downloadable activity materials and schema answers
- Editable rubrics with point customization
- "Enhance" button for iterative improvements

**Implementation Notes**:
- Uses Gemini API with structured prompts
- Must align with Bloom's Taxonomy
- Supports 6 activity types (see Assessment Types section)
- All content stored in both JSON and HTML formats

### 2. Offline Support Module
**Use Cases**: UC-004 to UC-006

**Critical Requirements**:
- Progressive Web App (PWA) with service workers
- Local storage of lesson plans and assessments
- Queue offline changes for sync when reconnected
- Must work on low-end mobile devices
- No localStorage/sessionStorage in React artifacts (use state management)

**Implementation Status**: Partially implemented
**TODO**: 
- Implement service worker for offline caching
- Add sync queue for offline actions
- Test on 3G/4G connections in rural scenarios

### 3. Answer Recognition Module
**Use Cases**: UC-007 to UC-011

**Workflow**:
1. Teacher uploads student handwritten answer (single or batch)
2. System extracts text using OCR (Google Vision API)
3. AI compares with rubric using semantic similarity
4. Auto-generates score with confidence level
5. Teacher can manually edit extracted text and scores

**Critical Implementation**:
- Confidence threshold for flagging low-quality OCR
- Semantic scoring (not just keyword matching)
- Support batch processing for class-wide grading

### 4. Dashboard Module
**Use Cases**: UC-012 to UC-015

**Analytics Display**:
- Class averages and trends
- Individual student progress tracking
- Topic mastery levels (by DSKP learning standards)
- Frequently missed questions
- Customizable charts (bar, line, pie)

**Filtering**:
- By class, topic, difficulty level, time period
- Exportable reports for parent-teacher meetings

### 5. Lesson Sharing Hub
**Use Cases**: UC-016 to UC-018

**Features**:
- Upload lesson plans with title, description, tags
- Search by subject, level, keywords
- Like, comment, save to collection
- Replaces informal Telegram group sharing

**Implementation Priority**: LOW (Phase 2)

## Non-Functional Requirements (Critical)

### Performance Benchmarks
| Metric | Target | Testing Method |
|--------|--------|----------------|
| Page load (Desktop) | ≤ 5s | Chrome DevTools |
| Page load (Mobile) | ≤ 8s | Manual testing |
| API response | ≤ 3s | Server logs |
| Question generation | ≤ 15s | AI timing |
| OCR extraction | ≤ 5s/image | Google Vision API |
| Auto-scoring | ≤ 8s | AI processing |

### Mobile Responsiveness (NFR-004)
- Support viewports: 375px to 1920px
- Touch targets: ≥ 40px
- Must work on Chrome Mobile, Safari Mobile
- Test on both iOS and Android devices

### Offline Support (NFR-005)
- Store lesson plans locally
- Core features work without internet
- Sync changes when reconnected
- No data loss during offline period

### Web Standards (NFR-002)
- Lighthouse Performance: ≥ 70/100
- Lighthouse Accessibility: ≥ 80/100

## Development Methodology

**Approach**: Kanban (visual workflow management)

**Tool**: GitHub Projects with columns:
- To Do
- In Progress
- In Review
- Done

**Workflow**:
- Feature modules as task cards
- Flexible re-prioritization based on dependencies
- Continuous delivery of core features

## Data Collection & Validation

**Survey Method**: Google Form to Malaysian secondary teachers

**Key Findings**:
- Time-consuming manual planning (most common challenge)
- Difficulty with DSKP alignment and Bloom's Taxonomy
- Need for offline access in rural schools
- Desire for analytics dashboard
- Want for teacher collaboration platform

**Use in Design**:
- Validated need for all 5 modules
- Influenced priority ordering
- Guided UI/UX decisions (offline-first, mobile-friendly)
- Shaped rubric editing and customization features

## Testing Strategy

### Usability Testing
- Test with real Malaysian teachers
- Measure time to generate first assessment (target: ≤ 15 minutes)
- Evaluate learning curve and interface clarity

### Performance Testing
- Load testing with 100+ concurrent users
- Mobile device testing (low-end Android)
- Network throttling for 3G/4G scenarios

### AI Quality Testing
- Validate DSKP alignment in generated content
- Check Bloom's Taxonomy level distribution
- Test OCR accuracy with various handwriting styles
- Verify semantic scoring accuracy vs. manual grading

## Known Limitations & Future Work

**Current Limitations**:
1. Offline mode not fully implemented
2. Dashboard analytics in progress
3. Lesson sharing hub not started
4. Limited to secondary school (KSSM) initially

**Future Enhancements**:
1. Expand to primary school (KSSR)
2. Multi-language support (Malay, English, Chinese, Tamil)
3. Mobile native apps (iOS/Android)
4. Integration with Ministry of Education systems
5. Advanced analytics with ML predictions

## Security & Privacy

### Data Protection
- User Gemini API keys encrypted with AES-256-GCM
- JWT authentication for all protected routes
- HTTPS required for production
- No student PII exposed in community features

### Compliance Considerations
- Malaysian Personal Data Protection Act (PDPA) compliance
- Secure storage of student assessment data
- Teacher consent for lesson sharing

## UI/UX Design Principles

**Design Files**: Available in Figma (see Artifacts section)

**Key Principles**:
1. **Mobile-first**: Optimized for phones/tablets
2. **Accessibility**: Clear labels, proper contrast, screen reader support
3. **Offline-first**: Core features work without internet
4. **Minimal cognitive load**: Clear navigation, progressive disclosure
5. **Localization**: Support for Bahasa Malaysia and English

**Color Scheme**: (To be documented from Figma)

**Typography**: (To be documented from Figma)

## Deployment

**Current Status**: Development

**Planned Architecture**:
- Frontend: Vercel or Netlify
- Backend: Heroku or AWS EC2
- Database: MongoDB Atlas
- CDN: Cloudflare for static assets

**Environment Variables** (Production):
```
NODE_ENV=production
MONGO_URI=<MongoDB Atlas connection>
JWT_SECRET=<Strong secret>
ENCRYPTION_SECRET=<64-char hex>
GEMINI_API_KEY=<Optional: System fallback key>
PORT=5000
FRONTEND_URL=<Production frontend URL>
```

## References for Context

When generating content or making decisions, refer to:
1. **DSKP documents** - For curriculum alignment
2. **Bloom's Taxonomy** - For cognitive level classification
3. **Malaysian education standards** - For culturally appropriate content
4. **Lighthouse metrics** - For performance benchmarks

## Glossary

- **DSKP**: Dokumen Standard Kurikulum dan Pentaksiran (Curriculum standards)
- **KSSR**: Kurikulum Standard Sekolah Rendah (Primary curriculum)
- **KSSM**: Kurikulum Standard Sekolah Menengah (Secondary curriculum)
- **SPM**: Sijil Pelajaran Malaysia (Malaysian Certificate of Education)
- **RPH**: Rancangan Pengajaran Harian (Daily lesson plan)
- **Bloom's Taxonomy**: Framework for categorizing educational learning objective