// frontend/client/src/data/englishAssessmentTypes.js - Updated with missing exports
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
  { value: "15", label: "15 minutes", description: "Quick assessment" },
  { value: "30", label: "30 minutes", description: "Short test" },
  { value: "45", label: "45 minutes", description: "Standard assessment" },
  { value: "60", label: "60 minutes", description: "Full period" },
  { value: "90", label: "90 minutes", description: "Extended assessment" },
  { value: "120", label: "120 minutes", description: "Major examination" },
];

// NEW EXPORTS - Added missing exports
export const englishForms = [
  { value: "form1", label: "Form 1" },
  { value: "form2", label: "Form 2" },
  { value: "form3", label: "Form 3" },
  { value: "form4", label: "Form 4" },
  { value: "form5", label: "Form 5" },
];

export const englishSkills = [
  {
    value: "reading",
    label: "Reading",
    icon: "📖",
    color: "#1890ff",
    description: "Reading comprehension and analysis",
  },
  {
    value: "writing",
    label: "Writing",
    icon: "✍️",
    color: "#52c41a",
    description: "Written communication and composition",
  },
  {
    value: "listening",
    label: "Listening",
    icon: "👂",
    color: "#fa8c16",
    description: "Audio comprehension and understanding",
  },
  {
    value: "speaking",
    label: "Speaking",
    icon: "🗣️",
    color: "#722ed1",
    description: "Oral communication and presentation",
  },
  {
    value: "grammar",
    label: "Grammar",
    icon: "📝",
    color: "#eb2f96",
    description: "Language structure and rules",
  },
  {
    value: "vocabulary",
    label: "Vocabulary",
    icon: "📚",
    color: "#13c2c2",
    description: "Word knowledge and usage",
  },
];

export const difficultyLevels = [
  {
    value: "Beginner",
    label: "Beginner",
    color: "#52c41a",
    description: "Basic level for new learners",
  },
  {
    value: "Intermediate",
    label: "Intermediate",
    color: "#fa8c16",
    description: "Moderate difficulty level",
  },
  {
    value: "Advanced",
    label: "Advanced",
    color: "#f5222d",
    description: "Challenging level for skilled learners",
  },
];

export const literatureComponents = [
  {
    value: "poetry",
    label: "Poetry",
    description: "Poems and poetic analysis",
  },
  {
    value: "prose",
    label: "Prose",
    description: "Short stories and novels",
  },
  {
    value: "drama",
    label: "Drama",
    description: "Plays and dramatic works",
  },
  {
    value: "non_fiction",
    label: "Non-Fiction",
    description: "Essays and informational texts",
  },
];
