// data/englishAssessmentTypes.js - KSSM English Assessment Data

export const englishForms = [
  { value: "form1", label: "Form 1", description: "Age 13 - Basic English" },
  {
    value: "form2",
    label: "Form 2",
    description: "Age 14 - Intermediate English",
  },
  {
    value: "form3",
    label: "Form 3",
    description: "Age 15 - Upper Intermediate",
  },
  { value: "form4", label: "Form 4", description: "Age 16 - SPM Preparation" },
  { value: "form5", label: "Form 5", description: "Age 17 - SPM Level" },
];

export const englishAssessmentTypes = [
  {
    category: "Formative Assessment",
    types: [
      {
        value: "vocabulary_quiz",
        label: "Vocabulary Quiz",
        description: "Test word meanings and usage",
        timeRange: "15-20 minutes",
        questionRange: "10-20 questions",
        skills: ["Vocabulary", "Word Recognition"],
      },
      {
        value: "grammar_exercise",
        label: "Grammar Exercise",
        description: "Practice grammar rules and structures",
        timeRange: "20-30 minutes",
        questionRange: "15-25 questions",
        skills: ["Grammar", "Language Use"],
      },
      {
        value: "reading_comprehension_short",
        label: "Reading Comprehension (Short)",
        description: "Short passages with questions",
        timeRange: "25-35 minutes",
        questionRange: "8-15 questions",
        skills: ["Reading", "Comprehension"],
      },
      {
        value: "listening_exercise",
        label: "Listening Exercise",
        description: "Audio-based comprehension tasks",
        timeRange: "20-30 minutes",
        questionRange: "10-20 questions",
        skills: ["Listening", "Comprehension"],
      },
    ],
  },
  {
    category: "Summative Assessment",
    types: [
      {
        value: "monthly_test",
        label: "Monthly Test",
        description: "Comprehensive monthly assessment",
        timeRange: "60-90 minutes",
        questionRange: "25-40 questions",
        skills: ["Reading", "Writing", "Language Use"],
      },
      {
        value: "mid_year_exam",
        label: "Mid-Year Examination",
        description: "Formal mid-year examination",
        timeRange: "120-150 minutes",
        questionRange: "40-50 questions",
        skills: ["Reading", "Writing", "Language Use", "Literature"],
      },
      {
        value: "final_exam",
        label: "Final Examination",
        description: "End of year examination",
        timeRange: "120-180 minutes",
        questionRange: "40-60 questions",
        skills: ["Reading", "Writing", "Language Use", "Literature"],
      },
      {
        value: "spm_practice",
        label: "SPM Practice Paper",
        description: "Practice for SPM examination format",
        timeRange: "150-180 minutes",
        questionRange: "45-55 questions",
        skills: ["Reading", "Writing", "Language Use", "Literature"],
      },
    ],
  },
  {
    category: "Skills-Based Assessment",
    types: [
      {
        value: "writing_assessment",
        label: "Writing Assessment",
        description: "Focus on writing skills and creativity",
        timeRange: "45-60 minutes",
        questionRange: "2-4 writing tasks",
        skills: ["Writing", "Creativity", "Language Use"],
      },
      {
        value: "literature_analysis",
        label: "Literature Analysis",
        description: "Analysis of poems, novels, or short stories",
        timeRange: "60-90 minutes",
        questionRange: "8-15 questions",
        skills: ["Literature", "Critical Thinking", "Analysis"],
      },
      {
        value: "oral_assessment",
        label: "Oral Assessment",
        description: "Speaking and presentation skills",
        timeRange: "10-15 minutes per student",
        questionRange: "5-8 speaking tasks",
        skills: ["Speaking", "Pronunciation", "Fluency"],
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
        label: "Multiple Choice Questions (MCQ)",
        description: "4-5 options with one correct answer",
        icon: "🔘",
        suitable: ["Vocabulary", "Grammar", "Reading Comprehension"],
      },
      {
        value: "true_false",
        label: "True/False",
        description: "Statement verification questions",
        icon: "✅",
        suitable: ["Grammar", "Literature Facts", "Comprehension"],
      },
      {
        value: "matching",
        label: "Matching",
        description: "Match items from two columns",
        icon: "🔗",
        suitable: ["Vocabulary", "Literary Terms", "Grammar Rules"],
      },
      {
        value: "fill_blanks",
        label: "Fill in the Blanks",
        description: "Complete sentences or passages",
        icon: "📝",
        suitable: ["Grammar", "Vocabulary", "Cloze Passages"],
      },
    ],
  },
  {
    category: "Subjective Questions",
    types: [
      {
        value: "short_answer",
        label: "Short Answer Questions",
        description: "Brief written responses (1-3 sentences)",
        icon: "✏️",
        suitable: ["Comprehension", "Literature", "Grammar Explanation"],
      },
      {
        value: "long_answer",
        label: "Long Answer Questions",
        description: "Extended written responses (paragraph)",
        icon: "📄",
        suitable: ["Literature Analysis", "Critical Thinking", "Comprehension"],
      },
      {
        value: "essay_writing",
        label: "Essay Writing",
        description: "Structured essay responses",
        icon: "📖",
        suitable: [
          "Creative Writing",
          "Argumentative Writing",
          "Descriptive Writing",
        ],
      },
      {
        value: "summary_writing",
        label: "Summary Writing",
        description: "Condensing information from passages",
        icon: "📋",
        suitable: ["Reading Comprehension", "Information Processing"],
      },
    ],
  },
];

export const englishSkills = [
  { value: "listening", label: "Listening", icon: "👂", color: "#1890ff" },
  { value: "speaking", label: "Speaking", icon: "🗣️", color: "#52c41a" },
  { value: "reading", label: "Reading", icon: "📖", color: "#fa8c16" },
  { value: "writing", label: "Writing", icon: "✍️", color: "#722ed1" },
  {
    value: "grammar",
    label: "Grammar & Language Use",
    icon: "📝",
    color: "#eb2f96",
  },
  { value: "vocabulary", label: "Vocabulary", icon: "📚", color: "#13c2c2" },
  { value: "literature", label: "Literature", icon: "🎭", color: "#fadb14" },
  {
    value: "critical_thinking",
    label: "Critical Thinking",
    icon: "🧠",
    color: "#f5222d",
  },
];

export const difficultyLevels = [
  {
    value: "basic",
    label: "Basic",
    color: "#52c41a",
    description: "Fundamental concepts and skills",
    forms: ["form1", "form2"],
  },
  {
    value: "intermediate",
    label: "Intermediate",
    color: "#fadb14",
    description: "Moderate complexity with some analysis",
    forms: ["form2", "form3", "form4"],
  },
  {
    value: "advanced",
    label: "Advanced",
    color: "#ff4d4f",
    description: "Complex analysis and critical thinking",
    forms: ["form4", "form5"],
  },
  {
    value: "spm_level",
    label: "SPM Level",
    color: "#722ed1",
    description: "Malaysian Certificate of Education standard",
    forms: ["form4", "form5"],
  },
];

export const timeAllocation = [
  { value: "10", label: "10 minutes", description: "Quick quiz" },
  { value: "15", label: "15 minutes", description: "Short assessment" },
  { value: "20", label: "20 minutes", description: "Brief test" },
  { value: "30", label: "30 minutes", description: "Standard quiz" },
  { value: "45", label: "45 minutes", description: "Extended test" },
  { value: "60", label: "1 hour", description: "Standard test" },
  { value: "90", label: "1.5 hours", description: "Comprehensive test" },
  { value: "120", label: "2 hours", description: "Major examination" },
  { value: "150", label: "2.5 hours", description: "Full examination" },
  { value: "180", label: "3 hours", description: "SPM format" },
];

export const literatureComponents = [
  {
    value: "novel",
    label: "Novel",
    description: "Full-length narrative fiction",
    examples: ["The Curse", "Catch Us If You Can", "Dear Mr. Kilmer"],
  },
  {
    value: "short_stories",
    label: "Short Stories",
    description: "Brief narrative fiction",
    examples: [
      "Confronting Aunt Azimah",
      "The Fruitcake Special",
      "How I Met Myself",
    ],
  },
  {
    value: "poems",
    label: "Poems",
    description: "Poetic literary works",
    examples: [
      "In the Midst of Hardship",
      "The Charge of the Light Brigade",
      "Heir Conditioning",
    ],
  },
  {
    value: "drama",
    label: "Drama/Play",
    description: "Theatrical literary works",
    examples: ["Romeo and Juliet", "The Merchant of Venice", "Othello"],
  },
];

// Flatten all assessment types for easy access
export const allEnglishAssessmentTypes = englishAssessmentTypes.reduce(
  (acc, category) => {
    return [...acc, ...category.types];
  },
  []
);

// Flatten all question types for easy access
export const allQuestionTypes = questionTypes.reduce((acc, category) => {
  return [...acc, ...category.types];
}, []);
