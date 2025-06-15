// frontend/client/src/data/englishAssessmentTypes.js
export const englishAssessmentTypes = [
  {
    category: "Formative Assessments",
    types: [
      {
        value: "daily_quiz",
        label: "Daily Quiz",
        description: "Quick daily check for understanding",
        timeRange: "10-15 minutes",
        questionRange: "5-10 questions",
      },
      {
        value: "exit_ticket",
        label: "Exit Ticket",
        description: "End-of-class reflection questions",
        timeRange: "5-10 minutes",
        questionRange: "2-5 questions",
      },
      {
        value: "warm_up",
        label: "Warm-up Activity",
        description: "Beginning-of-class review",
        timeRange: "10-15 minutes",
        questionRange: "3-8 questions",
      },
    ],
  },
  {
    category: "Summative Assessments",
    types: [
      {
        value: "unit_test",
        label: "Unit Test",
        description: "Comprehensive test covering unit material",
        timeRange: "45-90 minutes",
        questionRange: "20-40 questions",
      },
      {
        value: "chapter_test",
        label: "Chapter Test",
        description: "Test covering specific chapter content",
        timeRange: "30-60 minutes",
        questionRange: "15-30 questions",
      },
      {
        value: "final_exam",
        label: "Final Examination",
        description: "Comprehensive end-of-term assessment",
        timeRange: "90-120 minutes",
        questionRange: "40-80 questions",
      },
    ],
  },
  {
    category: "Skills-Based Assessments",
    types: [
      {
        value: "reading_comprehension",
        label: "Reading Comprehension",
        description: "Assess understanding of texts",
        timeRange: "30-45 minutes",
        questionRange: "10-20 questions",
      },
      {
        value: "writing_assessment",
        label: "Writing Assessment",
        description: "Evaluate writing skills and techniques",
        timeRange: "45-90 minutes",
        questionRange: "3-8 questions",
      },
      {
        value: "listening_test",
        label: "Listening Test",
        description: "Audio-based comprehension assessment",
        timeRange: "20-40 minutes",
        questionRange: "10-25 questions",
      },
      {
        value: "speaking_assessment",
        label: "Speaking Assessment",
        description: "Oral communication evaluation",
        timeRange: "15-30 minutes",
        questionRange: "5-10 questions",
      },
    ],
  },
];

export const questionTypes = [
  {
    category: "Objective Questions",
    types: [
      {
        value: "multiple_choice",
        label: "Multiple Choice",
        icon: "🔘",
        description: "Choose the best answer from options",
        suitable: ["vocabulary", "grammar", "comprehension"],
      },
      {
        value: "true_false",
        label: "True/False",
        icon: "✅",
        description: "Determine if statements are correct",
        suitable: ["facts", "concepts", "definitions"],
      },
      {
        value: "matching",
        label: "Matching",
        icon: "🔗",
        description: "Match items from two columns",
        suitable: ["vocabulary", "concepts", "relationships"],
      },
      {
        value: "fill_blanks",
        label: "Fill in the Blanks",
        icon: "📝",
        description: "Complete sentences with missing words",
        suitable: ["vocabulary", "grammar", "spelling"],
      },
    ],
  },
  {
    category: "Subjective Questions",
    types: [
      {
        value: "short_answer",
        label: "Short Answer",
        icon: "✏️",
        description: "Brief written responses (1-3 sentences)",
        suitable: ["comprehension", "analysis", "definitions"],
      },
      {
        value: "essay_writing",
        label: "Essay Writing",
        icon: "📄",
        description: "Extended written responses",
        suitable: ["analysis", "creativity", "critical thinking"],
      },
      {
        value: "creative_writing",
        label: "Creative Writing",
        icon: "🎨",
        description: "Original creative compositions",
        suitable: ["creativity", "expression", "storytelling"],
      },
    ],
  },
  {
    category: "Interactive Questions",
    types: [
      {
        value: "ordering",
        label: "Ordering/Sequencing",
        icon: "🔢",
        description: "Arrange items in correct order",
        suitable: ["processes", "chronology", "logic"],
      },
      {
        value: "categorization",
        label: "Categorization",
        icon: "📊",
        description: "Group items into categories",
        suitable: ["classification", "organization", "concepts"],
      },
    ],
  },
];

export const timeAllocation = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
  { value: "120", label: "120 minutes" },
];
