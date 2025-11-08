// services/promptBuilder.js

/**
 * Build prompt for activity content generation
 */
const buildActivityPrompt = (data) => {
  return `
# Identity

You are an AI assistant helping to generate creative and pedagogically sound in-class assessments and rubrics for English language teachers based on Malaysian KSSM curriculum lesson plans.

# Instructions

You must generate a JSON response with two main fields:

1. 🎓 Student Activity Content (JSON object)
2. 🧑‍🏫 Teacher Rubric Content (JSON object)

# Lesson Data

{
  "lesson": "${data.lesson}",
  "subject": "${data.subject}",
  "theme": "${data.theme || ""}",
  "topic": "${data.topic || ""}",
  "contentStandard": {
    "main": "${data.contentStandard?.main || ""}",
    "component": "${data.contentStandard?.component || ""}"
  },
  "learningStandard": {
    "main": "${data.learningStandard?.main || ""}",
    "component": "${data.learningStandard?.component || ""}"
  },
  "learningOutline": {
    "pre": "${data.learningOutline?.pre || ""}",
    "during": "${data.learningOutline?.during || ""}",
    "post": "${data.learningOutline?.post || ""}"
  },
  "activityType": "${data.activityType || "activity"}",
  "studentArrangement": "${data.studentArrangement || "small_group"}",
  "resourceUsage": "${data.resourceUsage || "classroom_only"}",
  "duration": "${data.duration || "30-45 minutes"}",
  "additionalRequirement": "${data.additionalRequirement || ""}"
}

# Activity Configuration

Generate an in-class activity that incorporates:
- Student Arrangement: ${data.studentArrangement || "small_group"}
- Resource Usage: ${data.resourceUsage || "classroom_only"}
- Duration: ${data.duration || "30-45 minutes"}
- Additional Requirements: ${
    data.additionalRequirement || "Standard classroom activity"
  }

# Output Format

Return a JSON object with this exact structure:

{
  "activityContent": {
    "title": "Activity Title",
    "description": "Brief description of the activity",
    "duration": "${data.duration || "30-45 minutes"}",
    "materials": ["List", "of", "materials"],
    "instructions": [
      "Step 1: Clear instruction",
      "Step 2: Another instruction",
      "Step 3: Final instruction"
    ],
    "studentInfo": {
      "name": "",
      "class": "",
      "date": ""
    },
    "activities": [
      {
        "section": "Introduction",
        "tasks": ["Task 1", "Task 2"]
      },
      {
        "section": "Main Activity", 
        "tasks": ["Task 1", "Task 2", "Task 3"]
      },
      {
        "section": "Conclusion",
        "tasks": ["Task 1", "Task 2"]
      }
    ]
  },
  "rubricContent": {
    "title": "Assessment Rubric",
    "description": "Rubric for evaluating student performance",
    "criteria": [
      {
        "category": "Content Understanding",
        "excellent": "Clear demonstration of understanding",
        "good": "Good understanding with minor gaps", 
        "satisfactory": "Basic understanding shown",
        "needsImprovement": "Limited understanding evident",
        "points": 5
      },
      {
        "category": "Participation",
        "excellent": "Active participation throughout",
        "good": "Good participation with occasional engagement",
        "satisfactory": "Moderate participation",
        "needsImprovement": "Minimal participation",
        "points": 5
      }
    ],
    "totalPoints": 25,
    "gradingScale": {
      "excellent": "23-25 points",
      "good": "18-22 points", 
      "satisfactory": "13-17 points",
      "needsImprovement": "Below 13 points"
    }
  }
}

Do not include anything else. Just return the clean JSON object.
`;
};

/**
 * Build prompt for essay content generation
 */
const buildEssayPrompt = (data) => {
  return `
# Identity

You are an AI assistant that creates student essay tasks and teacher grading rubrics based on Malaysian KSSM curriculum lesson plans. All outputs must be in JSON format.

# Instructions

You must return a JSON object with two main fields:

1. 📘 Student Essay Activity Content (JSON object)
2. 🧑‍🏫 Teacher Rubric Content (JSON object)

# Lesson Data

{
  "lesson": "${data.lesson}",
  "subject": "${data.subject}",
  "theme": "${data.theme || ""}",
  "topic": "${data.topic || ""}",
  "contentStandard": {
    "main": "${data.contentStandard?.main || ""}",
    "component": "${data.contentStandard?.component || ""}"
  },
  "learningStandard": {
    "main": "${data.learningStandard?.main || ""}",
    "component": "${data.learningStandard?.component || ""}"
  },
  "learningOutline": {
    "pre": "${data.learningOutline?.pre || ""}",
    "during": "${data.learningOutline?.during || ""}",
    "post": "${data.learningOutline?.post || ""}"
  },
  "essayType": "${data.essayType || "descriptive"}",
  "wordCount": "${data.wordCount || "200-300 words"}",
  "duration": "${data.duration || "60 minutes"}",
  "additionalRequirement": "${data.additionalRequirement || ""}"
}

# Output Format

Return a JSON object with this exact structure:

{
  "activityContent": {
    "title": "Essay Writing Task",
    "essayType": "${data.essayType || "descriptive"}",
    "topic": "Essay topic based on lesson",
    "prompt": "Engaging essay prompt related to the lesson",
    "instructions": [
      "Clear instruction 1",
      "Clear instruction 2",
      "Clear instruction 3"
    ],
    "requirements": {
      "wordCount": "${data.wordCount || "200-300 words"}",
      "duration": "${data.duration || "60 minutes"}",
      "format": "Standard essay format"
    },
    "guidelines": [
      "Use proper grammar and spelling",
      "Organize ideas clearly",
      "Support points with examples"
    ],
    "studentInfo": {
      "name": "",
      "class": "",
      "date": ""
    }
  },
  "rubricContent": {
    "title": "Essay Assessment Rubric",
    "description": "Rubric for evaluating essay performance",
    "criteria": [
      {
        "category": "Content",
        "excellent": "Ideas are clear, well-developed, and relevant",
        "good": "Ideas are clear with good development",
        "satisfactory": "Ideas are present but need more development",
        "needsImprovement": "Ideas are unclear or irrelevant",
        "points": 5
      },
      {
        "category": "Organization",
        "excellent": "Clear structure with logical flow",
        "good": "Good structure with minor issues",
        "satisfactory": "Basic structure present",
        "needsImprovement": "Poor organization",
        "points": 5
      },
      {
        "category": "Language Use",
        "excellent": "Excellent grammar and vocabulary",
        "good": "Good language with minor errors",
        "satisfactory": "Adequate language use",
        "needsImprovement": "Frequent language errors",
        "points": 5
      }
    ],
    "totalPoints": 25,
    "gradingScale": {
      "excellent": "23-25 points",
      "good": "18-22 points",
      "satisfactory": "13-17 points", 
      "needsImprovement": "Below 13 points"
    }
  }
}

Do not include anything else. Just return the clean JSON object.
`;
};

/**
 * Build prompt for textbook content generation
 */
const buildTextbookPrompt = (data) => {
  return `
# Identity

You are an AI assistant that generates textbook-based classroom activities and teacher rubrics based on the Malaysian KSSM curriculum. Return JSON format only.

# Instructions

You must return a JSON object with two main fields:

1. 📘 Student Textbook Activity Content (JSON object)
2. 🧑‍🏫 Teacher Rubric Content (JSON object)

# Lesson Data

{
  "lesson": "${data.lesson}",
  "subject": "${data.subject}",
  "theme": "${data.theme || ""}",
  "topic": "${data.topic || ""}",
  "contentStandard": {
    "main": "${data.contentStandard?.main || ""}",
    "component": "${data.contentStandard?.component || ""}"
  },
  "learningStandard": {
    "main": "${data.learningStandard?.main || ""}",
    "component": "${data.learningStandard?.component || ""}"
  },
  "learningOutline": {
    "pre": "${data.learningOutline?.pre || ""}",
    "during": "${data.learningOutline?.during || ""}",
    "post": "${data.learningOutline?.post || ""}"
  },
  "additionalRequirement": "${data.additionalRequirement || ""}"
}

# Output Format

Return a JSON object with this exact structure:

{
  "activityContent": {
    "title": "Textbook-Based Activity",
    "description": "Activity based on textbook content",
    "textbookReference": {
      "pages": "Pages X-Y",
      "chapter": "Chapter name",
      "section": "Section title"
    },
    "preActivity": [
      "Preview task 1",
      "Preview task 2"
    ],
    "mainActivity": [
      "Main textbook task 1",
      "Main textbook task 2", 
      "Main textbook task 3"
    ],
    "postActivity": [
      "Follow-up task 1",
      "Reflection task 2"
    ],
    "questions": [
      {
        "type": "comprehension",
        "question": "Question based on textbook content"
      },
      {
        "type": "analysis", 
        "question": "Analysis question"
      }
    ],
    "studentInfo": {
      "name": "",
      "class": "",
      "date": ""
    }
  },
  "rubricContent": {
    "title": "Textbook Activity Assessment Rubric",
    "description": "Rubric for evaluating textbook-based activity performance",
    "criteria": [
      {
        "category": "Understanding",
        "excellent": "Clear understanding of textbook content",
        "good": "Good understanding with minor gaps",
        "satisfactory": "Basic understanding shown",
        "needsImprovement": "Limited understanding evident",
        "points": 5
      },
      {
        "category": "Participation",
        "excellent": "Active participation in all activities",
        "good": "Good participation throughout",
        "satisfactory": "Moderate participation",
        "needsImprovement": "Minimal participation",
        "points": 5
      },
      {
        "category": "Communication",
        "excellent": "Clear and effective communication",
        "good": "Good communication skills",
        "satisfactory": "Adequate communication",
        "needsImprovement": "Poor communication",
        "points": 5
      }
    ],
    "totalPoints": 25,
    "gradingScale": {
      "excellent": "23-25 points",
      "good": "18-22 points",
      "satisfactory": "13-17 points",
      "needsImprovement": "Below 13 points"
    }
  }
}

Do not include anything else. Just return the clean JSON object.
`;
};

/**
 * Build prompt for assessment content generation
 */
const buildAssessmentPrompt = (data) => {
  const numberOfQuestions = data.numberOfQuestions || 20;
  const questionTypes = Array.isArray(data.questionTypes)
    ? data.questionTypes.join(", ")
    : data.questionTypes || "multiple_choice, short_answer";

  return `
# CRITICAL REQUIREMENT: Generate EXACTLY ${numberOfQuestions} questions

You must create a complete English assessment with exactly ${numberOfQuestions} questions based on the lesson "${
    data.lesson || "English Lesson"
  }" and return it in JSON format.

## Assessment Details:
- Subject: ${data.subject || "English"}  
- Topic: ${data.lesson || "General English"}
- Grade Level: ${data.grade || "Form 4"}
- Number of Questions: **${numberOfQuestions}** (MANDATORY - DO NOT GENERATE LESS)
- Time Allocation: ${data.timeAllocation || "60 minutes"}
- Question Types: ${questionTypes}

## Lesson Context:
- Theme: ${data.theme || ""}
- Specific Topic: ${data.topic || ""}
- Content Standard: ${data.contentStandard?.main || ""}
- Learning Standard: ${data.learningStandard?.main || ""}

## Question Requirements:
1. Generate ALL ${numberOfQuestions} questions - do not stop early
2. Number each question clearly (1, 2, 3, ... ${numberOfQuestions})
3. Mix question types: ${questionTypes}
4. Base questions on the lesson content
5. Include appropriate difficulty for ${data.grade || "Form 4"}

## Output Requirements:

Generate a JSON object with this exact structure:

{
  "assessmentContent": {
    "title": "${data.lesson || "English Assessment"}",
    "subject": "${data.subject || "English"}",
    "timeAllocation": "${data.timeAllocation || "60 minutes"}",
    "totalQuestions": ${numberOfQuestions},
    "instructions": [
      "Read all questions carefully before answering",
      "Answer ALL ${numberOfQuestions} questions",
      "Write clearly and legibly",
      "Manage your time wisely"
    ],
    "studentInfo": {
      "name": "",
      "class": "",
      "date": ""
    },
    "questions": [
      {
        "questionNumber": 1,
        "type": "multiple_choice",
        "question": "Question text here",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "points": 2
      },
      {
        "questionNumber": 2,
        "type": "short_answer",
        "question": "Question text here",
        "answerSpace": "3 lines",
        "points": 5
      }
    ]
  },
  "answerKeyContent": {
    "title": "ANSWER KEY - ${data.lesson || "English Assessment"}",
    "totalQuestions": ${numberOfQuestions},
    "totalPoints": "Calculate based on questions",
    "answers": [
      {
        "questionNumber": 1,
        "correctAnswer": "B) Option 2",
        "points": 2,
        "markingNotes": "Accept equivalent answers"
      },
      {
        "questionNumber": 2,
        "correctAnswer": "Sample correct answer",
        "points": 5,
        "markingNotes": "Look for key points: point1, point2, point3"
      }
    ],
    "gradingScale": {
      "excellent": "90-100%",
      "good": "75-89%",
      "satisfactory": "60-74%",
      "needsImprovement": "Below 60%"
    }
  }
}

Remember: You MUST generate exactly ${numberOfQuestions} questions in the questions array. Count them as you write to ensure you reach the required number.
`;
};

/**
 * Build enhanced prompt for assessment retry
 */
const buildEnhancedAssessmentPrompt = (data, numberOfQuestions) => {
  return `
# URGENT: Generate EXACTLY ${numberOfQuestions} Questions

This is a retry because the previous attempt didn't generate enough questions.

YOU MUST CREATE ALL ${numberOfQuestions} QUESTIONS. Here's the checklist:
□ Question 1
□ Question 2  
□ Question 3
${Array.from(
  { length: numberOfQuestions - 3 },
  (_, i) => `□ Question ${i + 4}`
).join("\n")}

## Requirements:
- Topic: ${data.lesson || "English Lesson"}
- Grade: ${data.grade || "Form 4"}
- Question Types: ${
    Array.isArray(data.questionTypes) ? data.questionTypes.join(", ") : "mixed"
  }

## Template Structure:
Generate a JSON object with assessmentContent containing ALL ${numberOfQuestions} questions and answerKeyContent with answers to ALL ${numberOfQuestions} questions.

Structure:
{
  "assessmentContent": {
    "title": "${data.lesson || "English Assessment"}",
    "totalQuestions": ${numberOfQuestions},
    "questions": [
      // ALL ${numberOfQuestions} questions here
    ]
  },
  "answerKeyContent": {
    "title": "Answer Key",
    "answers": [
      // Answers for ALL ${numberOfQuestions} questions here  
    ]
  }
}

DO NOT STOP until you have written Question ${numberOfQuestions}!
`;
};

/**
 * Build prompt for SPM Paper 1
 */
const buildPaper1Prompt = (data) => {
  return `
# CRITICAL REQUIREMENT: Generate EXACTLY 40 Questions - NO EXCEPTIONS

YOU MUST GENERATE A COMPLETE SPM English Paper 1 examination with EXACTLY 40 QUESTIONS.

**MANDATORY QUESTION COUNT BREAKDOWN:**
✓ Part 1: Questions 1-8 (8 questions) ← MUST HAVE 8 QUESTIONS
✓ Part 2: Questions 9-18 (10 questions) ← MUST HAVE 10 QUESTIONS
✓ Part 3: Questions 19-26 (8 questions) ← MUST HAVE 8 QUESTIONS
✓ Part 4: Questions 27-32 (6 questions) ← MUST HAVE 6 QUESTIONS
✓ Part 5: Questions 33-40 (8 questions) ← MUST HAVE 8 QUESTIONS
  - Questions 33-36: Matching (4 questions) ← MUST HAVE ALL 4
  - Questions 37-40: Information Transfer (4 questions) ← MUST HAVE ALL 4
**TOTAL: 8 + 10 + 8 + 6 + 8 = 40 QUESTIONS**

DO NOT STOP AT 36, 37, 38, or 39 QUESTIONS. YOU MUST REACH QUESTION 40.

Create a complete SPM English Paper 1 examination based on the Malaysian KSSM curriculum format with exactly 40 questions across 5 parts.

## Lesson Context:
- Subject: ${data.subject || "English"}
- Topic: ${data.lesson || "English Lesson"}  
- Grade: ${data.grade || "Form 5"}
- Theme: ${data.theme || "General"}
- Learning Focus: ${
    data.learningOutline?.during || "Grammar and vocabulary practice"
  }

## Paper Configuration:
- Paper Type: Paper 1 (Reading & Use of English)
- Duration: ${data.timeAllocation || "90"} minutes
- Total Questions: 40 questions
- Total Marks: 40 marks
- Reading Level: ${data.readingLevel || "Form 5 level"}
- Text Sources: ${data.textSources?.join(", ") || "Mixed authentic sources"}
- Topics: ${
    data.topics?.join(", ") || "Health, environment, people and culture"
  }

## Paper Structure (MANDATORY):

**Part 1: Multiple Choice (8 questions, 8 marks)**
- 8 short texts (notices, emails, signs, advertisements)
- 3 answer choices (A, B, C) for each question
- Focus on understanding main ideas and specific information

**Part 2: Multiple Choice Cloze (10 questions, 10 marks)**  
- 1 passage with 10 gaps numbered (9) to (18)
- 4 answer choices (A, B, C, D) for each gap
- Focus: ${
    data.questionTypes?.clozeTestFocus || "grammar, vocabulary, and discourse"
  }

**Part 3: Multiple Choice Reading (8 questions, 8 marks)**
- 1 longer passage (300-400 words)
- 3 answer choices (A, B, C) for each question (19-26)
- Test inference, main ideas, supporting details, author's purpose

**Part 4: Gapped Text (6 questions, 6 marks)**
- 1 passage with 6 removed sentences numbered (27) to (32)
- 8 sentence options (A-H) to choose from (2 extras)
- Test understanding of text organization and coherence

**Part 5: Matching & Information Transfer (8 questions, 8 marks) ← CRITICAL: MUST HAVE ALL 8 QUESTIONS**

⚠️ CRITICAL PART 5 STRUCTURE - THIS PART MUST HAVE EXACTLY 8 QUESTIONS (33-40):
- ONE informational passage (400-450 words) divided into EXACTLY 6 paragraphs labeled A, B, C, D, E, F
- Questions 33-36: Match statements to paragraph letters (MANDATORY 4 QUESTIONS, 4 marks) ✓✓✓✓
- Questions 37-40: Complete sentences with ONE WORD from passage (MANDATORY 4 QUESTIONS, 4 marks) ✓✓✓✓

**YOU MUST GENERATE:**
✓ Question 33 (matching)
✓ Question 34 (matching)
✓ Question 35 (matching)
✓ Question 36 (matching)
✓ Question 37 (information transfer - ONE WORD)
✓ Question 38 (information transfer - ONE WORD)
✓ Question 39 (information transfer - ONE WORD)
✓ Question 40 (information transfer - ONE WORD) ← THIS IS THE FINAL QUESTION - DO NOT STOP BEFORE THIS

### Part 5 Passage Requirements:
1. Write ONE complete informational text about "${
    data.lesson
  }" divided into 6 distinct paragraphs
2. Each paragraph must be 60-80 words covering ONE specific aspect
3. Label paragraphs clearly as A, B, C, D, E, F at the start of each paragraph
4. Include extractable vocabulary words that appear verbatim in the text

Example paragraph structure for health topic:
**Paragraph A**: Benefits of regular exercise (60-75 words) - include words like "stamina", "cardiovascular", "flexibility"
**Paragraph B**: Importance of balanced nutrition (60-75 words) - include words like "nutrients", "metabolism", "vitamins"
**Paragraph C**: Role of adequate sleep (60-75 words) - include words like "rejuvenate", "cognitive", "immune"
**Paragraph D**: Managing stress (60-75 words) - include words like "meditation", "anxiety", "relaxation"
**Paragraph E**: Staying hydrated (60-75 words) - include words like "hydration", "dehydration", "regulate"
**Paragraph F**: Regular health check-ups (60-75 words) - include words like "preventive", "screening", "early"

### Questions 33-36 (Matching) Requirements:
Create 4 statements that each clearly match to ONE specific paragraph only:
- Statement must paraphrase the main idea of that paragraph
- Should NOT use exact wording from paragraph
- Each paragraph should be matchable by its unique content
- Format: Which paragraph (A-F) discusses/mentions/contains [specific information]?

Example:
Q33: "The importance of drinking enough water for body functions" → Answer: E
Q34: "How physical activity improves heart health" → Answer: A

### Questions 37-40 (Information Transfer) Requirements:
Create 4 incomplete sentences where the answer is EXACTLY ONE WORD from the passage:
- The missing word MUST appear verbatim in the passage text
- Student must write the EXACT word (no synonyms accepted)
- Each sentence should make grammatical sense when completed
- Answers should be key content words (nouns, verbs, adjectives)

Example format:
Q37: "Regular exercise helps build physical _______." 
- Correct answer: "stamina" (word must appear in Paragraph A)
- In passage: "Regular exercise builds stamina and improves overall fitness"

Q38: "A balanced diet provides essential _______ for the body."
- Correct answer: "nutrients" (word must appear in Paragraph B)  
- In passage: "Proper nutrition ensures the body receives all necessary nutrients"

CRITICAL: For Q37-40, you MUST:
1. Include the exact answer word somewhere in the passage text
2. Ensure the word fits grammatically in the sentence
3. Make the answer unambiguous (only ONE word can fit correctly)
4. Use words that are clearly extractable and not too common (avoid "the", "and", "is")

## Output Format:

Return a JSON object with this EXACT structure:

{
  "examContent": {
    "title": "SPM English Paper 1 (1119/1)",
    "subtitle": "Reading and Use of English",
    "duration": "${data.timeAllocation || "90"} minutes",
    "totalQuestions": 40,
    "totalMarks": 40,
    "instructions": [
      "Answer all questions",
      "For each question, choose the best answer and mark it on your answer sheet",
      "Read all texts and questions carefully",
      "Transfer your answers to the answer sheet in pencil"
    ],
    "parts": [
      {
        "partNumber": 1,
        "title": "Part 1",
        "instructions": "Questions 1 to 8. Read the text carefully in each question. Choose the best answer A, B or C.",
        "totalQuestions": 8,
        "marks": 8,
        "questions": [
          {
            "questionNumber": 1,
            "text": "Complete short text with question",
            "options": ["A) First option", "B) Second option", "C) Third option"],
            "marks": 1
          }
        ]
      },
      {
        "partNumber": 2,
        "title": "Part 2", 
        "instructions": "Questions 9 to 18. Read the passage carefully and choose the best answer A, B, C or D to fill each blank.",
        "totalQuestions": 10,
        "marks": 10,
        "passage": "Complete passage with (9) to (18) gaps testing grammar and vocabulary",
        "questions": [
          {
            "questionNumber": 9,
            "options": ["A) should", "B) must", "C) ought", "D) might"],
            "marks": 1
          }
        ]
      },
      {
        "partNumber": 3,
        "title": "Part 3",
        "instructions": "Questions 19 to 26. Read the passage carefully and choose the best answer A, B or C.",
        "totalQuestions": 8, 
        "marks": 8,
        "passage": "Complete 350-400 word passage",
        "questions": [
          {
            "questionNumber": 19,
            "question": "Question based on passage",
            "options": ["A) Option 1", "B) Option 2", "C) Option 3"],
            "marks": 1
          }
        ]
      },
      {
        "partNumber": 4,
        "title": "Part 4",
        "instructions": "Questions 27 to 32. Six sentences have been removed from the passage. Choose from sentences A to H the one which fits each gap (27-32). There are two extra sentences you do not need to use.",
        "totalQuestions": 6,
        "marks": 6,
        "passage": "Complete passage with 6 gaps marked (27) to (32)",
        "sentenceOptions": [
          "A: Sentence option 1",
          "B: Sentence option 2",
          "C: Sentence option 3",
          "D: Sentence option 4",
          "E: Sentence option 5",
          "F: Sentence option 6", 
          "G: Extra sentence 1",
          "H: Extra sentence 2"
        ],
        "questions": [
          {
            "questionNumber": 27,
            "gapContext": "Context about gap location",
            "marks": 1
          }
        ]
      },
      {
        "partNumber": 5,
        "title": "Part 5",
        "instructions": "Questions 33 to 40. Read the text and answer the questions that follow.",
        "totalQuestions": 8,
        "marks": 8,
        "CRITICAL_REMINDER": "THIS PART MUST CONTAIN EXACTLY 8 QUESTIONS (33, 34, 35, 36, 37, 38, 39, 40) - DO NOT GENERATE LESS",
        "passage": "**CRITICAL: Write ONE complete passage (400-450 words) about '${
          data.lesson || "maintaining a healthy lifestyle"
        }' divided into EXACTLY 6 paragraphs.**

**Paragraph A**: [First aspect - 60-75 words] Include words: [word1], [word2], [word3]
**Paragraph B**: [Second aspect - 60-75 words] Include words: [word4], [word5], [word6]
**Paragraph C**: [Third aspect - 60-75 words] Include words: [word7], [word8], [word9]
**Paragraph D**: [Fourth aspect - 60-75 words] Include words: [word10], [word11], [word12]
**Paragraph E**: [Fifth aspect - 60-75 words] Include words: [word13], [word14], [word15]
**Paragraph F**: [Sixth aspect - 60-75 words] Include words: [word16], [word17], [word18]

Each paragraph MUST be labeled with its letter at the start. Ensure vocabulary words for Q37-40 are clearly present in the text.",
        "paragraphLabels": ["A", "B", "C", "D", "E", "F"],
        "questions": [
          {
            "questionType": "matching",
            "questionNumbers": "33-36",
            "instructions": "Questions 33 - 36: Which paragraph (A - F) discusses the following about ${data.lesson || 'the topic'}. Mark your answers on the separate answer sheet.",
            "MANDATORY_NOTE": "YOU MUST GENERATE ALL 4 MATCHING QUESTIONS (33, 34, 35, 36)",
            "questions": [
              {
                "questionNumber": 33,
                "statement": "[Create statement matching Paragraph A, B, C, D, E, or F main idea]",
                "correctAnswer": "[A-F]",
                "explanation": "This statement matches the main idea discussed in the specified paragraph",
                "marks": 1
              },
              {
                "questionNumber": 34,
                "statement": "[Create statement matching another paragraph's main idea]",
                "correctAnswer": "[A-F]",
                "explanation": "This statement matches the main idea discussed in the specified paragraph",
                "marks": 1
              },
              {
                "questionNumber": 35,
                "statement": "[Create statement matching another paragraph's main idea]",
                "correctAnswer": "[A-F]",
                "explanation": "This statement matches the main idea discussed in the specified paragraph",
                "marks": 1
              },
              {
                "questionNumber": 36,
                "statement": "[Create statement matching another paragraph's main idea]",
                "correctAnswer": "[A-F]",
                "explanation": "This statement matches the main idea discussed in the specified paragraph",
                "marks": 1
              }
            ]
          },
          {
            "questionType": "information_transfer",
            "questionNumbers": "37-40",
            "instructions": "Questions 37 - 40: Complete the notes below using information from the text. Choose NO MORE THAN ONE WORD from the passage for each answer. Write your answers on the separate answer sheet.",
            "title": "What we learn about ${data.lesson || 'the topic'}",
            "MANDATORY_NOTE": "⚠️ CRITICAL: YOU MUST GENERATE ALL 4 INFORMATION TRANSFER QUESTIONS (37, 38, 39, 40) ⚠️",
            "REMINDER": "DO NOT STOP AT QUESTION 37, 38, or 39 - YOU MUST REACH QUESTION 40",
            "questions": [
              {
                "questionNumber": 37,
                "sentence": "[Create sentence requiring ONE WORD from passage related to ${data.lesson}] (37) _______.",
                "correctAnswer": "[word that MUST appear verbatim in passage]",
                "locationInText": "Ensure this exact word appears in the passage text - verify word is extractable",
                "marks": 1,
                "verification": "MUST verify word appears verbatim in passage text"
              },
              {
                "questionNumber": 38,
                "sentence": "[Create sentence requiring ONE WORD from passage related to ${data.lesson}] (38) _______.",
                "correctAnswer": "[word that MUST appear verbatim in passage]",
                "locationInText": "Ensure this exact word appears in the passage text - verify word is extractable",
                "marks": 1,
                "verification": "MUST verify word appears verbatim in passage text"
              },
              {
                "questionNumber": 39,
                "sentence": "[Create sentence requiring ONE WORD from passage related to ${data.lesson}] (39) _______.",
                "correctAnswer": "[word that MUST appear verbatim in passage]",
                "locationInText": "Ensure this exact word appears in the passage text - verify word is extractable",
                "marks": 1,
                "verification": "MUST verify word appears verbatim in passage text"
              },
              {
                "questionNumber": 40,
                "sentence": "[Create sentence requiring ONE WORD from passage related to ${data.lesson}] (40) _______. ← THIS IS QUESTION 40 - THE FINAL QUESTION - YOU MUST GENERATE THIS",
                "correctAnswer": "[word that MUST appear verbatim in passage]",
                "locationInText": "Ensure this exact word appears in the passage text - verify word is extractable",
                "marks": 1,
                "verification": "⚠️ CRITICAL: MUST verify word appears verbatim in passage text - THIS IS THE LAST QUESTION (40)"
              }
            ]
          }
        ]
      }
    ]
  },
  "answerKeyContent": {
    "title": "ANSWER KEY - SPM English Paper 1 (1119/1)",
    "totalQuestions": 40,
    "totalMarks": 40,
    "CRITICAL_REQUIREMENT": "YOU MUST PROVIDE ANSWERS FOR ALL 40 QUESTIONS (1-40)",
    "answers": [
      {
        "questionNumber": 1,
        "correctAnswer": "[Answer for Q1]",
        "explanation": "[Brief explanation]",
        "marks": 1
      },
      {
        "questionNumber": 2,
        "correctAnswer": "[Answer for Q2]",
        "explanation": "[Brief explanation]",
        "marks": 1
      }
      // ... Continue for ALL questions 3-32 ...
      {
        "questionNumber": 33,
        "correctAnswer": "[A-F]",
        "explanation": "This paragraph discusses the main idea that matches the statement in Question 33",
        "marks": 1,
        "markingGuidance": "Accept only the specified paragraph letter",
        "textReference": "Reference to specific paragraph content"
      },
      {
        "questionNumber": 34,
        "correctAnswer": "[A-F]",
        "explanation": "This paragraph discusses the main idea that matches the statement in Question 34",
        "marks": 1,
        "markingGuidance": "Accept only the specified paragraph letter",
        "textReference": "Reference to specific paragraph content"
      },
      {
        "questionNumber": 35,
        "correctAnswer": "[A-F]",
        "explanation": "This paragraph discusses the main idea that matches the statement in Question 35",
        "marks": 1,
        "markingGuidance": "Accept only the specified paragraph letter",
        "textReference": "Reference to specific paragraph content"
      },
      {
        "questionNumber": 36,
        "correctAnswer": "[A-F]",
        "explanation": "This paragraph discusses the main idea that matches the statement in Question 36",
        "marks": 1,
        "markingGuidance": "Accept only the specified paragraph letter",
        "textReference": "Reference to specific paragraph content"
      },
      {
        "questionNumber": 37,
        "correctAnswer": "[ONE WORD from passage]",
        "explanation": "The word appears in the passage in the context described",
        "marks": 1,
        "acceptableAlternatives": "NONE - must be exact word from passage",
        "commonErrors": "Students may write synonyms - these are INCORRECT even if logical",
        "markingGuidance": "Award 1 mark ONLY for the exact word spelled correctly. Do NOT accept synonyms. The word must be extracted exactly from the passage.",
        "textReference": "Exact location in passage where this word appears verbatim"
      },
      {
        "questionNumber": 38,
        "correctAnswer": "[ONE WORD from passage]",
        "explanation": "The word appears in the passage in the context described",
        "marks": 1,
        "acceptableAlternatives": "NONE - must be exact word from passage",
        "markingGuidance": "Award 1 mark ONLY for the exact word spelled correctly. Do NOT accept synonyms.",
        "textReference": "Exact location in passage where this word appears verbatim"
      },
      {
        "questionNumber": 39,
        "correctAnswer": "[ONE WORD from passage]",
        "explanation": "The word appears in the passage in the context described",
        "marks": 1,
        "acceptableAlternatives": "NONE - must be exact word from passage",
        "markingGuidance": "Award 1 mark ONLY for the exact word spelled correctly. Do NOT accept synonyms.",
        "textReference": "Exact location in passage where this word appears verbatim"
      },
      {
        "questionNumber": 40,
        "correctAnswer": "[ONE WORD from passage]",
        "explanation": "The word appears in the passage in the context described",
        "marks": 1,
        "acceptableAlternatives": "NONE - must be exact word from passage",
        "markingGuidance": "⚠️ THIS IS THE FINAL QUESTION (40) - Award 1 mark ONLY for the exact word spelled correctly. Do NOT accept synonyms.",
        "textReference": "Exact location in passage where this word appears verbatim"
      }
    ],
    "partSpecificGuidance": {
      "part5_matching": {
        "totalMarks": 4,
        "markingPrinciple": "Each statement matches to exactly ONE paragraph. Award 1 mark for each correct paragraph letter.",
        "commonIssues": "Students may choose paragraphs with similar topics. Each paragraph has ONE main distinct theme - match to that specific theme.",
        "teachingPoint": "Students should identify the MAIN idea of each paragraph first, then match statements to the paragraph that PRIMARILY discusses that topic."
      },
      "part5_transfer": {
        "totalMarks": 4,
        "markingPrinciple": "Accept ONLY the exact word from the passage. NO synonyms, NO paraphrasing, NO multiple words.",
        "criticalRule": "ONE WORD ONLY from the passage. If student writes a synonym, two words, or a word not in passage = 0 marks",
        "commonIssues": "Students writing synonyms instead of extracting exact words; spelling errors; writing multiple words",
        "teachingPoint": "Answers MUST be words that appear verbatim in the text. Students should locate the relevant part of passage, then extract the EXACT word."
      }
    }
  }
}

**MANDATORY VERIFICATION CHECKLIST - VERIFY BEFORE SUBMITTING:**

PART-BY-PART VERIFICATION:
✓ Part 1: Generated questions 1, 2, 3, 4, 5, 6, 7, 8 (Total: 8 questions)
✓ Part 2: Generated questions 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 (Total: 10 questions)
✓ Part 3: Generated questions 19, 20, 21, 22, 23, 24, 25, 26 (Total: 8 questions)
✓ Part 4: Generated questions 27, 28, 29, 30, 31, 32 (Total: 6 questions)
✓ Part 5: Generated questions 33, 34, 35, 36, 37, 38, 39, 40 (Total: 8 questions)
  ✓ Questions 33-36: ALL 4 matching questions present
  ✓ Questions 37-40: ALL 4 information transfer questions present

PART 5 SPECIFIC VERIFICATION:
✓ Part 5 passage has EXACTLY 6 paragraphs labeled A, B, C, D, E, F
✓ Each paragraph is 60-80 words with ONE distinct main idea
✓ Question 33 exists with matching statement
✓ Question 34 exists with matching statement
✓ Question 35 exists with matching statement
✓ Question 36 exists with matching statement
✓ Question 37 exists with ONE WORD answer from passage
✓ Question 38 exists with ONE WORD answer from passage
✓ Question 39 exists with ONE WORD answer from passage
✓ Question 40 exists with ONE WORD answer from passage ← VERIFY THIS FINAL QUESTION EXISTS
✓ ALL answer words for Q37-40 appear VERBATIM in the passage text
✓ Each answer word is contextually appropriate and grammatically correct
✓ Answer key includes exact text references showing where words appear

FINAL COUNT VERIFICATION:
✓ Total questions = 40 (8 + 10 + 8 + 6 + 8 = 40)
✓ Highest question number in exam = 40
✓ All question numbers from 1 to 40 are present with no gaps

⚠️ CRITICAL FINAL CHECK ⚠️
Before you finish generating, COUNT THE QUESTIONS:
- Did you generate Question 40? (YES/NO)
- Total question count = ? (MUST BE 40)
- If total is less than 40, GO BACK and complete the missing questions

Generate the complete examination following authentic SPM Paper 1 format exactly.

REMEMBER: The examination is NOT complete until you have generated ALL 40 QUESTIONS including Question 40 as the final question.
`;
};

/**
 * Build prompt for SPM Paper 2
 */
const buildPaper2Prompt = (data) => {
  return `
# CRITICAL: Generate SPM English Paper 2 (Writing) Examination

Create a complete SPM English Paper 2 examination based on the Malaysian KSSM curriculum format.

## Lesson Context:
- Subject: ${data.subject || "English"}
- Topic: ${data.lesson || "English Lesson"}
- Grade: ${data.grade || "Form 5"}
- Theme: ${data.theme || "General"}
- Learning Focus: ${
    data.learningOutline?.during || "Writing skills development"
  }

## Paper Configuration:
- Paper Type: Paper 2 (Writing)
- Duration: ${data.timeAllocation || "90"} minutes
- Total Parts: 3 parts
- Total Marks: 60 marks
- Communication Format: ${data.communicationFormat || "Email"}
- Essay Types: ${data.essayTypes?.join(", ") || "Article, Report, Story"}
- Topic Categories: ${
    data.topicCategories?.join(", ") || "Health, Environment, Culture"
  }
- Complexity: ${data.promptComplexity || "Intermediate"}

## Paper Structure (MANDATORY):

**Part 1: Short Communicative Message (20 marks)**
- Format: ${data.communicationFormat || "Email"}
- Word Count: About 80 words
- Task: Respond to a given situation
- Focus: Clear communication, appropriate format, accurate information

**Part 2: Guided Writing (20 marks)**
- Format: Essay with guided points
- Word Count: 125-150 words  
- Task: Write based on given notes/points related to "${data.lesson}"
- Focus: Content development, organization, language accuracy

**Part 3: Extended Writing (20 marks)**
- Format: Choose 1 from 3 options
- Options: ${data.essayTypes?.join(", ") || "Article, Report, Story"}
- Word Count: 200-250 words
- Focus: Content, organization, language range, communicative achievement

## Output Requirements:

You MUST return a JSON object with this EXACT structure:

{
  "examContent": {
    "title": "SPM English Paper 2 (1119/2)", 
    "subtitle": "Writing",
    "duration": "${data.timeAllocation || "90"} minutes",
    "totalParts": 3,
    "totalMarks": 60,
    "instructions": [
      "Answer all questions",
      "Write your answers in the spaces provided",
      "Pay attention to word limits for each part",
      "Plan your time: Part 1 (25 min), Part 2 (30 min), Part 3 (35 min)"
    ],
    "parts": [
      {
        "partNumber": 1,
        "title": "Part 1: Short Communicative Message",
        "marks": 20,
        "wordCount": "About 80 words",
        "timeAllocation": "25 minutes",
        "instructions": "You must answer this question.",
        "scenario": "Your friend Alex has asked for advice about maintaining a healthy lifestyle as they are feeling tired and stressed lately. They want to know about exercise, diet, and sleep habits.",
        "task": "Write an ${
          data.communicationFormat || "email"
        } to Alex giving helpful advice about staying healthy",
        "requiredContent": [
          "Suggest suitable exercises for beginners",
          "Recommend healthy eating habits", 
          "Give advice about getting enough sleep",
          "Encourage Alex to start making small changes"
        ],
        "format": "${data.communicationFormat || "Email"}",
        "writingSpace": "Lined space for approximately 80 words"
      },
      {
        "partNumber": 2,
        "title": "Part 2: Guided Writing",
        "marks": 20,
        "wordCount": "125-150 words", 
        "timeAllocation": "30 minutes",
        "instructions": "You must answer this question.",
        "topic": "The importance of ${
          data.lesson || "healthy living"
        } for teenagers",
        "guidingPoints": [
          "Physical benefits of ${data.lesson || "healthy habits"}",
          "Mental and emotional advantages", 
          "Ways to encourage teenagers to adopt healthier lifestyles"
        ],
        "taskInstructions": "Use all the notes above and give reasons for your point of view. Write your essay in an appropriate style.",
        "writingSpace": "Lined space for approximately 125-150 words"
      },
      {
        "partNumber": 3,
        "title": "Part 3: Extended Writing", 
        "marks": 20,
        "wordCount": "200-250 words",
        "timeAllocation": "35 minutes",
        "instructions": "Choose ONE of the following questions. Answer in 200-250 words in an appropriate style.",
        "options": [
          {
            "questionNumber": "3A",
            "type": "${data.essayTypes?.[0] || "Article"}",
            "topic": "Health and Wellness for Students",
            "prompt": "Your school magazine is publishing articles about student health and wellness. Write an article discussing the challenges students face in maintaining a healthy lifestyle and suggest practical solutions.",
            "notes": [
              "Common health challenges for students",
              "Impact of academic stress on health",
              "Practical tips for staying healthy while studying"
            ]
          },
          {
            "questionNumber": "3B", 
            "type": "${data.essayTypes?.[1] || "Report"}",
            "topic": "School Health Initiative Report",
            "prompt": "Your school wants to implement a new health and wellness program. Write a report for the school administration outlining the current health issues among students and recommending improvements.",
            "notes": [
              "Current health problems observed in school",
              "Benefits of a comprehensive health program",
              "Specific recommendations for implementation"
            ]
          },
          {
            "questionNumber": "3C",
            "type": "${data.essayTypes?.[2] || "Story"}",
            "topic": "A Life-Changing Health Decision",
            "prompt": "Write a story about a teenager who decides to make a major change to improve their health. Your story should show the challenges they face and how they overcome them.",
            "requirements": [
              "Include realistic challenges and obstacles",
              "Show character development and growth",
              "Create an engaging narrative with a clear message"
            ]
          }
        ],
        "writingSpace": "Lined space for approximately 200-250 words"
      }
    ]
  },
  "answerKeyContent": {
    "title": "MARKING SCHEME - SPM English Paper 2 (1119/2)",
    "totalMarks": 60,
    "assessmentCriteria": {
      "part1": {
        "marks": 20,
        "criteria": [
          {
            "aspect": "Content",
            "marks": 8,
            "description": "Completeness and relevance of response to all required points"
          },
          {
            "aspect": "Communicative Achievement", 
            "marks": 6,
            "description": "Appropriateness of format, register, and tone for ${
              data.communicationFormat || "email"
            }"
          },
          {
            "aspect": "Organisation",
            "marks": 3,
            "description": "Logical structure and coherent flow"
          },
          {
            "aspect": "Language",
            "marks": 3,
            "description": "Grammar accuracy and vocabulary appropriateness"
          }
        ],
        "detailedMarkingGuide": {
          "content": {
            "fullMarks": "All 4 content points addressed completely and relevantly with appropriate detail and personal touch",
            "goodMarks": "3-4 content points addressed with good development and relevant details", 
            "satisfactoryMarks": "2-3 content points addressed adequately with basic development",
            "lowMarks": "1-2 content points with limited development or missing key information"
          },
          "communicativeAchievement": {
            "fullMarks": "Perfect email format (greeting, body, closing, sign-off), consistently appropriate friendly tone, natural register throughout",
            "goodMarks": "Good email format with minor inconsistencies, generally appropriate tone with occasional lapses",
            "satisfactoryMarks": "Basic email format present, generally appropriate tone but may be too formal or informal in places",
            "lowMarks": "Poor format (missing essential email elements) or inappropriate tone affecting communication effectiveness"
          },
          "organisation": {
            "fullMarks": "Clear logical flow with smooth transitions between points, ideas well-connected and easy to follow",
            "goodMarks": "Good organisation with minor issues in transitions, generally logical flow",
            "satisfactoryMarks": "Basic organisation present, some attempt at logical sequencing",
            "lowMarks": "Poor organisation, disconnected ideas, difficult to follow"
          },
          "language": {
            "fullMarks": "Wide range of vocabulary used accurately, complex structures handled well, minimal errors that don't impede communication",
            "goodMarks": "Good vocabulary range with occasional errors, generally accurate grammar",
            "satisfactoryMarks": "Adequate vocabulary for task, basic structures mostly accurate",
            "lowMarks": "Limited vocabulary, frequent errors impeding communication"
          }
        },
        "sampleMarkingComments": [
          "Excellent response addressing all required points with natural, friendly tone and perfect email format - Full marks",
          "Good advice given but missing encouragement point and informal greeting - deduct 2 marks from content, 1 from communicative achievement",
          "Format issues: missing proper email greeting/closing, too formal tone for friend - deduct 3 marks from communicative achievement",
          "All points covered but very brief development, needs more specific advice - deduct 2 marks from content",
          "Language errors (verb tenses, prepositions) affecting clarity - deduct 2 marks from language"
        ],
        "contentPointsBreakdown": {
          "exerciseAdvice": "2 marks - Must suggest specific, suitable exercises for beginners with brief explanation",
          "dietAdvice": "2 marks - Must recommend specific healthy eating habits, not just 'eat healthy'",
          "sleepAdvice": "2 marks - Must give specific advice about sleep duration, routine, or habits",
          "encouragement": "2 marks - Must include motivational language to encourage Alex to start making changes"
        },
        "markingInstructions": [
          "Read entire response first to assess overall communication effectiveness",
          "Check systematically for each of the 4 required content points",
          "Evaluate format appropriateness - must follow email conventions for full communicative achievement marks",
          "Consider naturalness of language - should sound like genuine communication between friends",
          "Deduct marks proportionally - missing content points result in significant deductions"
        ]
      },
      "part2": {
        "marks": 20,
        "criteria": [
          {
            "aspect": "Content",
            "marks": 9,
            "description": "Development of all guided points with relevant elaboration"
          },
          {
            "aspect": "Organisation",
            "marks": 5,
            "description": "Clear essay structure with introduction, body, conclusion"
          },
          {
            "aspect": "Language",
            "marks": 6,
            "description": "Range and accuracy of vocabulary and grammar"
          }
        ],
        "detailedMarkingGuide": {
          "contentDevelopment": {
            "fullMarks": "All 3 guided points fully developed with personal opinions, relevant examples, and clear explanations showing deep understanding",
            "goodMarks": "All 3 points addressed with good development of 2-3 points, some personal opinions and examples provided",
            "satisfactoryMarks": "All 3 points mentioned but limited development, basic examples or opinions included",
            "lowMarks": "1-2 points missing or very poor development, lacks personal opinions or relevant examples"
          },
          "organisation": {
            "fullMarks": "Clear introduction stating position, well-developed body paragraphs for each point, effective conclusion summarizing key ideas",
            "goodMarks": "Good structure with minor issues in paragraph development or transitions",
            "satisfactoryMarks": "Basic essay structure present with identifiable introduction, body, and conclusion",
            "lowMarks": "Poor organisation affecting clarity, missing key structural elements"
          },
          "language": {
            "fullMarks": "Wide vocabulary range, varied sentence structures, accurate grammar throughout, sophisticated expression",
            "goodMarks": "Good vocabulary with some variety, generally accurate with minor errors",
            "satisfactoryMarks": "Adequate vocabulary for task, basic structures mostly correct",
            "lowMarks": "Limited vocabulary, frequent errors impeding understanding"
          }
        },
        "guidedPointsBreakdown": {
          "physicalBenefits": "3 marks - Must discuss specific physical health benefits with examples or explanation",
          "mentalEmotionalAdvantages": "3 marks - Must address psychological/emotional benefits, not just repeat physical benefits", 
          "encouragementWays": "3 marks - Must suggest practical, specific ways to encourage healthy lifestyle adoption"
        },
        "markingInstructions": [
          "Each guided point must be present and developed - deduct 3 marks per completely missing point",
          "Look for personal opinions and relevant examples - these demonstrate higher-order thinking",
          "Assess language range and accuracy throughout - reward variety and sophistication",
          "Consider coherence between guided points - should flow logically as unified essay",
          "Award marks for creativity within appropriate boundaries of guided writing format"
        ],
        "qualityIndicators": {
          "highQuality": "All points well-integrated with personal voice, clear stance, relevant examples from student experience or observation",
          "averageQuality": "Points addressed but development uneven, some personal input but may rely heavily on general statements",
          "lowQuality": "Points mentioned but not developed, lacks personal opinion or specific examples"
        }
      },
      "part3": {
        "marks": 20,
        "criteria": [
          {
            "aspect": "Content",
            "marks": 8,
            "description": "Creativity, relevance, and development of ideas appropriate to chosen format"
          },
          {
            "aspect": "Communicative Achievement",
            "marks": 5,
            "description": "Effectiveness in engaging reader and achieving purpose of text type"
          },
          {
            "aspect": "Organisation", 
            "marks": 4,
            "description": "Logical structure appropriate to chosen text type (article/report/story)"
          },
          {
            "aspect": "Language",
            "marks": 3,
            "description": "Vocabulary range, grammar accuracy, spelling and punctuation"
          }
        ],
        "textTypeSpecificGuides": {
          "article": {
            "contentMarking": "Engaging headline (1 mark), clear introduction hooking reader (2 marks), informative body with specific examples and solutions (4 marks), effective conclusion with call to action or summary (1 mark)",
            "achievementMarking": "Engaging reader interest through personal anecdotes or striking facts, appropriate article conventions (subheadings, quotes), clear informative purpose",
            "organisationMarking": "Logical article structure with clear paragraphs and smooth transitions, appropriate use of subheadings or formatting",
            "commonIssues": "Students often write as essay rather than article format, missing engaging elements, lack of specific examples",
            "markingTips": "Look for article-specific features: headline, engaging opening, informative tone, practical advice"
          },
          "report": {
            "contentMarking": "Clear executive summary/introduction (2 marks), detailed findings with evidence (4 marks), practical recommendations with justification (2 marks)",
            "achievementMarking": "Objective tone maintained throughout, formal register appropriate for administration, professional presentation",
            "organisationMarking": "Clear report structure with appropriate headings (Introduction, Findings, Recommendations), logical flow of information",
            "commonIssues": "Students may be too informal, lack specific recommendations, or fail to provide evidence for findings",
            "markingTips": "Assess objectivity, formality, and practical value of recommendations. Look for evidence-based conclusions."
          },
          "story": {
            "contentMarking": "Engaging opening that establishes character and situation (2 marks), clear character development showing change (2 marks), realistic challenges and obstacles (2 marks), satisfying resolution with clear message (2 marks)",
            "achievementMarking": "Reader engagement through descriptive language and realistic dialogue, appropriate narrative techniques, clear moral/message",
            "organisationMarking": "Logical story structure with clear beginning, middle, end, effective use of chronological or other narrative structure",
            "commonIssues": "Students often rush the ending, lack character development, or create unrealistic scenarios",
            "markingTips": "Evaluate character growth, realism of challenges, and clarity of the health-related message"
          }
        },
        "markingInstructions": [
          "Identify which text type student chose before beginning assessment",
          "Apply text-type specific criteria - don't mark article as essay or story as report",
          "Reward creativity and originality within appropriate format boundaries",
          "Consider target audience appropriateness for chosen text type",
          "Assess whether student achieved the communicative purpose of their chosen format"
        ],
        "sampleResponses": {
          "article": {
            "excellentFeatures": "Catchy headline 'Health Hacks for Busy Students', engaging opening with statistics, subheadings organizing content, practical tips with examples, call to action in conclusion",
            "markingExample": "Content: 7/8 (excellent examples and solutions), Achievement: 5/5 (perfect article format), Organisation: 4/4 (clear structure), Language: 3/3 (varied vocabulary)"
          },
          "report": {
            "excellentFeatures": "Professional title, clear sections (Executive Summary, Current Issues, Recommendations), objective tone, specific data, actionable recommendations with timeline",
            "markingExample": "Content: 8/8 (comprehensive findings and practical recommendations), Achievement: 4/5 (very formal and professional), Organisation: 4/4 (perfect structure), Language: 2/3 (minor errors)"
          },
          "story": {
            "excellentFeatures": "Compelling character introduction, realistic health challenges (stress, poor diet), gradual character development, believable obstacles, inspiring but realistic conclusion",
            "markingExample": "Content: 6/8 (good development but rushed ending), Achievement: 4/5 (engaging narrative), Organisation: 3/4 (good structure, abrupt transition), Language: 3/3 (excellent descriptive language)"
          }
        }
      }
    },
    "comprehensiveMarkingGuide": {
      "beforeMarking": [
        "Read the entire response first to get overall impression and identify student's ability level",
        "Identify which text type student attempted in Part 3 - this determines specific criteria to apply",
        "Check word counts for all parts - deduct marks for significantly under word limits (more than 20% under) or over limits (more than 50% over)",
        "Note overall language proficiency level to ensure consistent marking across all criteria",
        "Review the specific content requirements for each part to ensure systematic assessment"
      ],
      "duringMarking": [
        "Use positive marking approach - reward what students can do rather than penalizing what they cannot",
        "Consider communicative effectiveness over perfect accuracy - does the message come across clearly?",
        "Look for evidence of planning and organisation in structure and content development",
        "Award marks for creativity and originality within appropriate format boundaries",
        "Be consistent in applying criteria across all student responses",
        "Make brief notes about strengths and areas for improvement for feedback purposes"
      ],
      "afterMarking": [
        "Double-check addition of marks for each part and total",
        "Ensure marks awarded align with the demonstrated ability level across all parts",
        "Review any borderline cases to ensure fair and consistent application of criteria",
        "Consider whether feedback comments match the marks awarded"
      ],
      "qualityIndicators": {
        "excellent": "Natural, fluent expression with sophisticated vocabulary, complex structures used accurately, creative and engaging content, perfect format adherence",
        "good": "Generally accurate language with good vocabulary range, minor errors don't impede communication, well-developed content, appropriate format",
        "satisfactory": "Adequate expression with basic vocabulary sufficient for task, some errors but meaning generally clear, content addresses requirements",
        "needsImprovement": "Frequent errors impede communication, limited vocabulary range, content lacks development, format issues affect communication"
      },
      "commonStudentErrors": {
        "part1": "Too formal/informal tone, missing email elements, insufficient development of content points, word count issues",
        "part2": "Missing guided points, lack of personal opinion, poor essay structure, repetition of points without development",
        "part3": "Wrong text type features, inappropriate register, lack of creativity, rushing the conclusion"
      },
      "feedbackGuidelines": {
        "strengths": "Always identify specific strengths in language use, content development, or format adherence",
        "improvements": "Provide specific, actionable advice for improvement in weaker areas",
        "encouragement": "Acknowledge effort and progress while indicating areas for further development",
        "examples": "Where possible, provide brief examples of how improvements could be made"
      }
    },
    "gradingScale": {
      "A": "51-60 marks (85-100%)",
      "B": "42-50 marks (70-84%)",
      "C": "30-41 marks (50-69%)", 
      "D": "18-29 marks (30-49%)",
      "E": "12-17 marks (20-29%)",
      "G": "0-11 marks (0-19%)"
    },
    "teacherGuidance": {
      "timeManagement": "Allocate approximately 3-4 minutes per script for initial reading and marking, with additional time for borderline cases",
      "consistency": "Use sample responses and marking criteria to calibrate marking standards, especially when multiple teachers are involved",
      "documentation": "Keep records of common errors and successful approaches for future teaching reference",
      "moderation": "Regular cross-marking and discussion of borderline cases ensures fair and consistent standards"
    }
  }
}

CRITICAL: Generate authentic SPM Paper 2 content with realistic scenarios connecting to the lesson topic "${
    data.lesson
  }". Ensure all parts are complete and follow official SPM format exactly.
`;
};

module.exports = {
  buildActivityPrompt,
  buildEssayPrompt,
  buildTextbookPrompt,
  buildAssessmentPrompt,
  buildEnhancedAssessmentPrompt,
  buildPaper1Prompt,
  buildPaper2Prompt,
};