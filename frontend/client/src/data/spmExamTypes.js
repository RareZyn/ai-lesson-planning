// src/data/spmExamTypes.js
export const spmForms = [
  { value: "form4", label: "Form 4", description: "Secondary 4 level" },
  { value: "form5", label: "Form 5", description: "Secondary 5 level (SPM)" },
];

export const paperTypes = [
  {
    value: "paper1",
    label: "Paper 1: Reading & Use of English",
    description:
      "40 questions, 90 minutes - Multiple choice, cloze test, reading comprehension",
    duration: "90 minutes",
    totalQuestions: 40,
    totalMarks: 40,
    parts: [
      {
        name: "Part 1",
        questions: 8,
        type: "Multiple Choice",
        description: "Short texts",
      },
      {
        name: "Part 2",
        questions: 10,
        type: "Cloze Test",
        description: "Grammar & vocabulary",
      },
      {
        name: "Part 3",
        questions: 8,
        type: "Reading Comprehension",
        description: "Longer passages",
      },
      {
        name: "Part 4",
        questions: 6,
        type: "Gapped Text",
        description: "Text organization",
      },
      {
        name: "Part 5",
        questions: 8,
        type: "Information Transfer",
        description: "Matching & completion",
      },
    ],
  },
  {
    value: "paper2",
    label: "Paper 2: Writing",
    description:
      "3 parts, 90 minutes - Short writing, directed writing, extended writing",
    duration: "90 minutes",
    totalParts: 3,
    totalMarks: 60,
    parts: [
      {
        name: "Part 1",
        marks: 20,
        type: "Short Communication",
        description: "Email/Note (80 words)",
      },
      {
        name: "Part 2",
        marks: 20,
        type: "Directed Writing",
        description: "Guided essay (125-150 words)",
      },
      {
        name: "Part 3",
        marks: 20,
        type: "Extended Writing",
        description: "Choose 1 from 3 (200-250 words)",
      },
    ],
  },
];

// Paper 1 specific configurations
export const textSources = [
  {
    value: "newspapers",
    label: "Newspapers",
    description: "News articles, editorials",
  },
  {
    value: "magazines",
    label: "Magazines",
    description: "Feature articles, reviews",
  },
  {
    value: "advertisements",
    label: "Advertisements",
    description: "Product ads, service promotions",
  },
  {
    value: "websites",
    label: "Websites",
    description: "Online content, blogs",
  },
  {
    value: "brochures",
    label: "Brochures",
    description: "Travel, educational brochures",
  },
  {
    value: "notices",
    label: "Notices & Signs",
    description: "Public notices, announcements",
  },
  {
    value: "emails",
    label: "Emails",
    description: "Formal and informal emails",
  },
  {
    value: "letters",
    label: "Letters",
    description: "Personal and business letters",
  },
];

export const readingLevels = [
  {
    value: "form4",
    label: "Form 4 Level",
    description: "B1 Low to Mid CEFR level",
  },
  {
    value: "form5",
    label: "Form 5 Level",
    description: "B1 High to B2 Low CEFR level",
  },
  {
    value: "mixed",
    label: "Mixed Levels",
    description: "Combination of Form 4 & 5 levels",
  },
];

export const topicCategories = [
  {
    value: "people_culture",
    label: "People and Culture",
    description: "Identity, traditions, diversity",
  },
  {
    value: "science_technology",
    label: "Science and Technology",
    description: "Innovation, digital life",
  },
  {
    value: "health_environment",
    label: "Health and Environment",
    description: "Wellness, sustainability",
  },
  {
    value: "consumer_finance",
    label: "Consumer and Financial Awareness",
    description: "Smart spending, economics",
  },
  {
    value: "information_age",
    label: "Information and Communication",
    description: "Media, communication",
  },
  {
    value: "sustainable_living",
    label: "Sustainable Living",
    description: "Green practices, conservation",
  },
];

// Paper 2 specific configurations
export const communicationFormats = [
  {
    value: "email",
    label: "Email Writing",
    description: "Formal and informal emails",
  },
  {
    value: "note",
    label: "Short Notes",
    description: "Brief messages, reminders",
  },
  {
    value: "letter",
    label: "Letter Writing",
    description: "Personal and official letters",
  },
  {
    value: "message",
    label: "Text Messages",
    description: "SMS, instant messages",
  },
];

export const essayTypes = [
  {
    value: "descriptive",
    label: "Descriptive Writing",
    description: "Describe places, people, experiences",
  },
  {
    value: "narrative",
    label: "Narrative Writing",
    description: "Tell stories, personal experiences",
  },
  {
    value: "report",
    label: "Report Writing",
    description: "Formal reports, investigations",
  },
  {
    value: "article",
    label: "Article Writing",
    description: "Magazine articles, blog posts",
  },
  {
    value: "review",
    label: "Review Writing",
    description: "Book, movie, product reviews",
  },
  {
    value: "letter_extended",
    label: "Extended Letter",
    description: "Longer formal letters",
  },
  {
    value: "story",
    label: "Story Writing",
    description: "Creative fictional stories",
  },
];

export const promptComplexity = [
  {
    value: "simple",
    label: "Simple Prompts",
    description: "Clear, direct instructions",
  },
  {
    value: "moderate",
    label: "Moderate Complexity",
    description: "Some interpretation needed",
  },
  {
    value: "complex",
    label: "Complex Prompts",
    description: "Multi-layered requirements",
  },
];

// Question types for Paper 1
export const questionTypes = [
  {
    category: "Multiple Choice",
    types: [
      {
        value: "main_idea",
        label: "Main Idea",
        description: "Identify central theme",
      },
      {
        value: "specific_info",
        label: "Specific Information",
        description: "Find particular details",
      },
      {
        value: "inference",
        label: "Inference",
        description: "Draw conclusions from text",
      },
      {
        value: "author_purpose",
        label: "Author's Purpose",
        description: "Identify writer's intention",
      },
    ],
  },
  {
    category: "Cloze Test",
    types: [
      {
        value: "grammar",
        label: "Grammar Focus",
        description: "Tenses, structures",
      },
      {
        value: "vocabulary",
        label: "Vocabulary Focus",
        description: "Word choice, meaning",
      },
      {
        value: "connectors",
        label: "Discourse Markers",
        description: "Linking words, transitions",
      },
      {
        value: "mixed",
        label: "Mixed Skills",
        description: "Grammar and vocabulary combined",
      },
    ],
  },
  {
    category: "Reading Comprehension",
    types: [
      {
        value: "literal",
        label: "Literal Comprehension",
        description: "Direct information from text",
      },
      {
        value: "inferential",
        label: "Inferential Reading",
        description: "Reading between lines",
      },
      {
        value: "evaluative",
        label: "Evaluative Reading",
        description: "Judge and analyze content",
      },
      {
        value: "appreciative",
        label: "Appreciative Reading",
        description: "Understand style and tone",
      },
    ],
  },
];

// Difficulty levels
export const difficultyLevels = [
  {
    value: "beginner",
    label: "Beginner (A2-B1)",
    color: "#52c41a",
    description: "Basic level",
  },
  {
    value: "intermediate",
    label: "Intermediate (B1)",
    color: "#fa8c16",
    description: "Standard SPM level",
  },
  {
    value: "advanced",
    label: "Advanced (B1-B2)",
    color: "#f5222d",
    description: "High achiever level",
  },
];

// Time allocation options
export const timeAllocations = [
  { value: "75", label: "75 minutes", description: "Shorter practice session" },
  { value: "90", label: "90 minutes", description: "Standard SPM duration" },
  {
    value: "105",
    label: "105 minutes",
    description: "Extended time for special needs",
  },
];

// Assessment focus areas
export const assessmentFocus = [
  {
    value: "reading_skills",
    label: "Reading Skills",
    description: "Comprehension, scanning, skimming",
  },
  {
    value: "language_use",
    label: "Language Use",
    description: "Grammar, vocabulary, structures",
  },
  {
    value: "writing_skills",
    label: "Writing Skills",
    description: "Organization, coherence, style",
  },
  {
    value: "communication",
    label: "Communication",
    description: "Practical language use",
  },
  {
    value: "exam_technique",
    label: "Exam Technique",
    description: "Test-taking strategies",
  },
];

// Sample themes aligned with KSSM
export const kssmThemes = [
  {
    theme: "People and Culture",
    topics: [
      "Personal Identity and Self-Awareness",
      "Family Relationships and Values",
      "Cultural Diversity in Malaysia",
      "Traditional Arts and Crafts",
      "Festivals and Celebrations",
    ],
  },
  {
    theme: "Science and Technology",
    topics: [
      "Digital Communication",
      "Medical Breakthroughs",
      "Environmental Technology",
      "Space Exploration",
      "Artificial Intelligence",
    ],
  },
  {
    theme: "Health and Environment",
    topics: [
      "Mental Health Awareness",
      "Climate Change Effects",
      "Biodiversity Conservation",
      "Sustainable Lifestyle",
      "Pollution Prevention",
    ],
  },
];

// Default configurations
export const defaultConfigurations = {
  paper1: {
    textSources: ["newspapers", "magazines", "advertisements"],
    readingLevel: "form5",
    topics: ["people_culture", "science_technology"],
    questionTypes: {
      multipleChoiceOptions: 3,
      clozeTestFocus: "mixed",
      matchingComplexity: "moderate",
    },
  },
  paper2: {
    communicationFormat: "email",
    essayTypes: ["descriptive", "narrative", "report"],
    topicCategories: ["people_culture", "health_environment"],
    promptComplexity: "moderate",
  },
};

// Helper functions
export const getConfigurationByPaper = (paperType) => {
  return defaultConfigurations[paperType] || defaultConfigurations.paper1;
};

export const getThemeTopics = (themeName) => {
  const theme = kssmThemes.find((t) =>
    t.theme.toLowerCase().includes(themeName.toLowerCase())
  );
  return theme ? theme.topics : [];
};

export const validateSPMConfiguration = (config) => {
  const errors = [];

  if (!config.paperType) {
    errors.push("Paper type is required");
  }

  if (!config.form) {
    errors.push("Form level is required");
  }

  if (config.paperType === "paper1") {
    if (!config.textSources || config.textSources.length === 0) {
      errors.push("At least one text source must be selected for Paper 1");
    }
    if (!config.readingLevel) {
      errors.push("Reading level is required for Paper 1");
    }
  }

  if (config.paperType === "paper2") {
    if (!config.communicationFormat) {
      errors.push("Communication format is required for Paper 2");
    }
    if (!config.essayTypes || config.essayTypes.length === 0) {
      errors.push("At least one essay type must be selected for Paper 2");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
