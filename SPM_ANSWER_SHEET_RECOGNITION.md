# SPM Paper 1 Answer Sheet Recognition System

## Overview

This system provides automated hybrid detection and grading for SPM Paper 1 exams (40 questions). Students answer all 40 questions on a single standardized answer sheet:
- **Questions 1-36**: Multiple-choice bubbles (options A-H)
- **Questions 37-40**: Written answers (words/phrases/numbers)

Teachers upload one image to automatically detect and grade all answers.

## Features

✅ **Single Image Upload**: Process all 40 answers (MCQ + written) from one answer sheet image
✅ **Hybrid Detection**:
   - AI-powered bubble detection for Q1-36 (A-H options)
   - OCR text extraction for Q37-40 (written answers)
✅ **Automatic Grading**: Instant grading against the answer key with breakdown by question type
✅ **Confidence Scoring**: Provides confidence levels for each detected answer
✅ **Comprehensive Results**: Question-by-question breakdown with detailed feedback
✅ **Error Handling**: Detects blank answers, ambiguous bubbles, and unclear handwriting

## Architecture

### Backend Components

#### 1. OCR Controller (`backend/controller/ocrController.js`)

**New Function**: `processSpmAnswerSheet`
- **Route**: `POST /api/ocr/process-spm-answer-sheet`
- **Purpose**: Detects filled bubbles using Gemini Vision API
- **Input**:
  - `image` (base64 string)
  - `assessmentId` (MongoDB ObjectId)
- **Output**: Array of 40 answers with confidence scores

**How it works**:
```javascript
// The prompt instructs Gemini to:
// 1. Detect filled bubbles for Q1-36
// 2. Extract written text from the right column for Q37-40
{
  "answers": [
    {"questionNumber": 1, "selectedAnswer": "A", "confidence": 0.95, "answerType": "mcq"},
    {"questionNumber": 2, "selectedAnswer": "B", "confidence": 0.90, "answerType": "mcq"},
    // ... questions 3-36 are MCQ ...
    {"questionNumber": 37, "selectedAnswer": "photosynthesis", "confidence": 0.85, "answerType": "written"},
    {"questionNumber": 38, "selectedAnswer": "enzyme", "confidence": 0.90, "answerType": "written"},
    {"questionNumber": 39, "selectedAnswer": "mitochondria", "confidence": 0.88, "answerType": "written"},
    {"questionNumber": 40, "selectedAnswer": "respiration", "confidence": 0.92, "answerType": "written"}
  ],
  "overallConfidence": 0.92,
  "metadata": {
    "totalQuestions": 40,
    "mcqQuestions": 36,
    "writtenQuestions": 4,
    "answeredQuestions": 38,
    "blankQuestions": 2,
    "ambiguousQuestions": 0
  }
}
```

#### 2. Grading Service (`backend/services/gradingService.js`)

**New Function**: `gradeSpmAnswerSheet`
- **Purpose**: Grades detected answers against answer key
- **Logic**:
  - Compares student answers with correct answers using `normalizeAnswer()`
  - Handles special cases: "BLANK", "MULTIPLE"
  - Calculates score, percentage, and grade

**Grading Rules**:
- ✅ Correct answer = 1 mark (applies to both MCQ and written)
- ❌ Incorrect answer = 0 marks
- ⚠️ Blank answer = 0 marks
- 🔄 Multiple bubbles (Q1-36) = 0 marks + flagged for review
- 📝 Written answers (Q37-40) are normalized and compared (case-insensitive, punctuation-insensitive)

#### 3. Grading Controller (`backend/controller/gradingController.js`)

**New Function**: `processAndGradeSpmAnswerSheet`
- **Route**: `POST /api/grading/process-and-grade-spm`
- **Purpose**: Combined endpoint (OCR + Grading in one call)
- **Input**:
  ```json
  {
    "image": "data:image/jpeg;base64,...",
    "assessmentId": "60d...",
    "classId": "60d...",
    "studentId": "60d..."
  }
  ```
- **Output**:
  ```json
  {
    "success": true,
    "data": {
      "submissionId": "60d...",
      "detectionResults": { ... },
      "gradingResults": {
        "results": [...],
        "summary": {
          "totalQuestions": 40,
          "correctAnswers": 35,
          "incorrectAnswers": 3,
          "blankAnswers": 2,
          "totalScore": 35,
          "percentage": "87.50",
          "grade": "A",
          "breakdown": {
            "mcq": {
              "total": 36,
              "correct": 32,
              "percentage": "88.89"
            },
            "written": {
              "total": 4,
              "correct": 3,
              "percentage": "75.00"
            }
          }
        }
      }
    }
  }
  ```

**Workflow**:
1. Validates input (image, IDs)
2. Verifies assessment is SPM exam type
3. Calls Gemini Vision API for bubble detection
4. Grades detected answers using answer key
5. Creates StudentAnswer record in database
6. Returns comprehensive results

### Frontend Components

#### 1. Grading Service Client (`frontend/client/src/services/gradingServiceClient.js`)

**New Function**: `processAndGradeSpmAnswerSheet`
```javascript
gradingService.processAndGradeSpmAnswerSheet(image, assessmentId, classId, studentId)
```

#### 2. SPM Answer Sheet Uploader Component (`frontend/client/src/components/AnswerChecker/SpmAnswerSheetUploader.jsx`)

**Features**:
- Drag-and-drop image upload
- Image compression for files > 10MB
- Real-time processing status
- Results modal with:
  - Overall score and grade
  - Question-by-question breakdown
  - Confidence indicators
  - Feedback for each answer

**Usage**:
```jsx
import SpmAnswerSheetUploader from "../components/AnswerChecker/SpmAnswerSheetUploader";

<SpmAnswerSheetUploader
  assessmentId={assessmentId}
  classId={classId}
  studentId={studentId}
  studentName="John Doe"
  onUploadComplete={(results) => {
    console.log("Processing complete:", results);
  }}
/>
```

## Answer Sheet Template

The system expects the standardized SPM answer sheet format:

```
┌──────────────────────────────────────────────────────────────┐
│ NAMA: ________________  SPM                                   │
│ ANGKA GILIRAN: ________  TINGKATAN: ____                     │
├──────────────────────────────────────────────────────────────┤
│ Q# │  ANSWER BOX (MCQ)              │ WORD/PHRASE/NUMBER     │
├────┼────────────────────────────────┼────────────────────────┤
│ 1  │ ⃝A ⃝B ⃝C ⃝D ⃝E ⃝F ⃝G ⃝H │                        │ (MCQ)
│ 2  │ ⃝A ⃝B ⃝C ⃝D ⃝E ⃝F ⃝G ⃝H │                        │ (MCQ)
│... │ (continues to question 36)     │                        │
│ 37 │ ⃝A ⃝B ⃝C ⃝D ⃝E ⃝F ⃝G ⃝H │ ______________________ │ (Write word)
│ 38 │ ⃝A ⃝B ⃝C ⃝D ⃝E ⃝F ⃝G ⃝H │ ______________________ │ (Write word)
│ 39 │ ⃝A ⃝B ⃝C ⃝D ⃝E ⃝F ⃝G ⃝H │ ______________________ │ (Write word)
│ 40 │ ⃝A ⃝B ⃝C ⃝D ⃝E ⃝F ⃝G ⃝H │ ______________________ │ (Write word)
└────┴────────────────────────────────┴────────────────────────┘
```

**Detection Behavior**:
- **Q1-36**: System only looks at the MCQ bubble column (middle), ignores right column
- **Q37-40**: System only looks at the written answer column (right), ignores MCQ bubbles

**Generated by**: `backend/services/htmlTemplates.js:generateSpmAnswerSheetHTML()`

This template is automatically appended to SPM Paper 1 PDF exports.

## Usage Flow

### For Teachers

1. **Generate SPM Paper 1 Exam**:
   - Create SPM exam using the assessment generator
   - System automatically generates answer key
   - Export includes the standardized answer sheet

2. **Print and Distribute**:
   - Print exam questions and answer sheets
   - Distribute to students
   - Students fill in bubbles on answer sheet

3. **Collect and Upload**:
   - Collect filled answer sheets
   - Navigate to Answer Checker
   - Select SPM Paper 1 assessment
   - Use `SpmAnswerSheetUploader` component
   - Upload answer sheet image (one per student)

4. **Review Results**:
   - System processes and grades in 15-30 seconds
   - View instant results in modal
   - Access detailed review page for each submission
   - Manually adjust if needed (for ambiguous answers)

### For Developers

#### Integrating the Component

```jsx
// Example: In SubmissionUploadPage.jsx
import { useState, useEffect } from "react";
import SpmAnswerSheetUploader from "../../components/AnswerChecker/SpmAnswerSheetUploader";

function SpmUploadPage() {
  const [assessment, setAssessment] = useState(null);

  useEffect(() => {
    // Fetch assessment details
    // Verify it's activityType === "spm-exam"
  }, []);

  const handleUploadComplete = (results) => {
    // Navigate to review page or show success message
    history.push(`/app/answer-checker/review/${results.submissionId}`);
  };

  // Check if assessment is SPM Paper 1
  if (assessment?.activityType === "spm-exam") {
    return (
      <SpmAnswerSheetUploader
        assessmentId={assessment._id}
        classId={selectedClass}
        studentId={selectedStudent}
        studentName={selectedStudent.name}
        onUploadComplete={handleUploadComplete}
      />
    );
  }

  // Otherwise, show regular multi-question uploader
  return <RegularAnswerUploader />;
}
```

## API Reference

### 1. Process SPM Answer Sheet (OCR Only)

```http
POST /api/ocr/process-spm-answer-sheet
Content-Type: application/json
Authorization: Bearer <token>

{
  "image": "data:image/jpeg;base64,...",
  "assessmentId": "60d..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "answers": [...],
    "overallConfidence": 0.92,
    "metadata": {...}
  }
}
```

### 2. Process and Grade (Combined)

```http
POST /api/grading/process-and-grade-spm
Content-Type: application/json
Authorization: Bearer <token>

{
  "image": "data:image/jpeg;base64,...",
  "assessmentId": "60d...",
  "classId": "60d...",
  "studentId": "60d..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "submissionId": "60d...",
    "detectionResults": {...},
    "gradingResults": {
      "results": [...],
      "summary": {
        "totalScore": 35,
        "percentage": "87.50",
        "grade": "A",
        ...
      }
    },
    "overallStats": {...}
  }
}
```

## Database Schema

### StudentAnswer Model (Enhanced)

```javascript
{
  assessmentId: ObjectId,
  classId: ObjectId,
  studentId: ObjectId,
  submissionMethod: "upload_image",
  answers: [
    {
      questionNumber: 1,
      questionText: "Question 1",
      originalImage: "data:image/jpeg;base64,...", // Full answer sheet
      ocrData: {
        extractedText: "A", // Detected answer
        confidence: 0.95,
        metadata: {
          detectionMethod: "bubble_detection",
          model: "gemini-2.0-flash-exp"
        }
      },
      grading: {
        aiScore: {
          score: 1,
          maxScore: 1,
          percentage: 100,
          feedback: "Correct!",
          reasoning: "Correct!"
        },
        finalScore: 1,
        isManuallyAdjusted: false
      },
      status: "graded"
    }
    // ... 39 more answers
  ],
  overallStats: {
    totalQuestions: 40,
    questionsAttempted: 38,
    totalScore: 35,
    maxPossibleScore: 40,
    percentage: 87.5,
    averageConfidence: 0.92
  },
  processingStatus: "completed"
}
```

## Performance Considerations

### Image Compression

- Files > 10MB are automatically compressed
- Max dimensions: 3000x3000px
- JPEG quality: 90%
- Compression preserves bubble clarity

### Processing Time

- OCR Detection: ~10-15 seconds (Gemini Vision API)
- Grading: < 1 second (simple comparison)
- **Total**: ~15-30 seconds per answer sheet

### API Rate Limits

Gemini API limits (Free tier):
- 60 requests per minute
- Recommend: Process 1 student at a time
- For batch processing (> 60 students), implement queue system

## Error Handling

### Common Issues

1. **"Expected 40 answers, got X"**
   - Gemini failed to detect all questions
   - Solution: Re-upload with better image quality

2. **"Multiple bubbles detected"**
   - Student filled multiple options
   - Solution: System marks as 0, flags for manual review

3. **"Blank answer"**
   - No bubble detected
   - Solution: System marks as 0, recorded in results

4. **"Low confidence"**
   - Bubble detection uncertain (< 60%)
   - Solution: Submission flagged for teacher review

### Manual Review Workflow

Teachers can review flagged submissions:
```javascript
// Backend automatically flags low confidence submissions
if (overallStats.averageConfidence < 0.6) {
  submission.processingStatus = "requires_review";
}
```

## Best Practices

### For Teachers

1. **Image Quality**:
   - Use good lighting (no shadows/glare)
   - Capture entire answer sheet
   - Keep sheet flat and aligned
   - Use minimum 5MP camera resolution

2. **Answer Sheet Printing**:
   - Print on white paper (avoid colored)
   - Ensure bubbles print clearly
   - Use standard A4 size

3. **Student Instructions**:
   - **Q1-36**: Fill bubbles completely with dark pen/pencil, fill only ONE bubble per question
   - **Q37-40**: Write clearly in the RIGHT COLUMN (word/phrase/number space), use dark pen
   - Erase mistakes completely
   - For Q37-40, ignore the MCQ bubbles - write your answer on the right side

### For Developers

1. **Image Validation**:
   - Validate file type before upload
   - Check file size (< 50MB)
   - Compress large images automatically

2. **Error Recovery**:
   - Implement retry mechanism for API failures
   - Cache detection results before grading
   - Allow manual correction of detected answers

3. **Scalability**:
   - Consider batch processing queue for large classes
   - Implement caching for answer keys
   - Store processed images separately (S3/Cloud Storage)

## Testing

### Unit Tests

```javascript
// Test grading logic
describe("gradeSpmAnswerSheet", () => {
  it("should grade all correct answers as 100%", () => {
    const detected = Array.from({ length: 40 }, (_, i) => ({
      questionNumber: i + 1,
      selectedAnswer: "A",
      confidence: 0.95,
    }));

    const answerKey = Array.from({ length: 40 }, (_, i) => ({
      questionNumber: i + 1,
      correctAnswer: "A",
    }));

    const result = gradeSpmAnswerSheet(detected, answerKey);
    expect(result.summary.percentage).toBe("100.00");
  });
});
```

### Integration Tests

Test the full workflow:
1. Upload answer sheet image
2. Verify OCR detection returns 40 answers
3. Verify grading produces correct score
4. Verify submission saved to database
5. Verify results displayed correctly

## Future Enhancements

- [ ] Support for Paper 2 (subjective questions)
- [ ] Batch processing (multiple students at once)
- [ ] Answer sheet template customization
- [ ] Support for different bubble patterns
- [ ] Mobile app for on-the-go scanning
- [ ] Real-time preview of detected bubbles
- [ ] Analytics dashboard for class performance
- [ ] Export results to Excel/CSV

## Troubleshooting

### Issue: Low detection confidence

**Symptoms**: Many answers marked as "BLANK" or low confidence scores

**Solutions**:
1. Re-upload with better lighting
2. Ensure bubbles are filled darkly
3. Check if answer sheet is complete in frame
4. Verify bubbles are not smudged

### Issue: Wrong answers detected

**Symptoms**: Incorrect bubbles marked as filled

**Solutions**:
1. Check for erasure marks (erase completely)
2. Ensure only one bubble filled per question
3. Use manual edit feature to correct
4. Re-train on higher quality images

### Issue: API timeout

**Symptoms**: Processing takes > 60 seconds

**Solutions**:
1. Check image size (compress if > 10MB)
2. Verify Gemini API key is valid
3. Check API quota limits
4. Implement retry with exponential backoff

## Support

For issues or questions:
- Check logs in backend console (`console.log` statements)
- Verify network requests in browser DevTools
- Review StudentAnswer records in MongoDB
- Check Gemini API usage dashboard

## License

This feature is part of the AI Lesson Planning system.
Generated with Claude Code (claude.ai/code)
