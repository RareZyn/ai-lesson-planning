// frontend/client/src/data/activityTypesInClass.js - Updated with missing exports
export const classroomActivityTypes = [
  {
    category: "Reading & Comprehension",
    activities: [
      "Silent Reading",
      "Guided Reading",
      "Reading Aloud",
      "Literature Circle",
      "Reading Comprehension Quiz",
      "Story Mapping",
      "Character Analysis",
    ],
  },
  {
    category: "Writing & Composition",
    activities: [
      "Creative Writing",
      "Essay Writing",
      "Journal Writing",
      "Collaborative Writing",
      "Peer Review Session",
      "Grammar Practice",
      "Vocabulary Building",
    ],
  },
  {
    category: "Speaking & Listening",
    activities: [
      "Class Discussion",
      "Oral Presentation",
      "Debate Activity",
      "Interview Practice",
      "Storytelling",
      "Listening Comprehension",
      "Pronunciation Practice",
    ],
  },
  {
    category: "Group Activities",
    activities: [
      "Group Project",
      "Think-Pair-Share",
      "Jigsaw Reading",
      "Role Play",
      "Problem Solving",
      "Collaborative Research",
      "Peer Teaching",
    ],
  },
];

export const studentArrangementOptions = [
  {
    value: "individual",
    label: "Individual Work",
    icon: "👤",
    description: "Students work independently on their own tasks",
  },
  {
    value: "pairs",
    label: "Pair Work",
    icon: "👥",
    description: "Students work in pairs of two",
  },
  {
    value: "small_group",
    label: "Small Groups",
    icon: "👥👥",
    description: "Groups of 3-5 students working together",
  },
  {
    value: "large_group",
    label: "Large Groups",
    icon: "👥👥👥",
    description: "Groups of 6+ students for complex tasks",
  },
  {
    value: "whole_class",
    label: "Whole Class",
    icon: "🏫",
    description: "Entire class working together as one unit",
  },
];

export const resourceOptions = [
  {
    value: "classroom_only",
    label: "Classroom Only",
    icon: "🏫",
    description: "Using only classroom resources and materials",
  },
  {
    value: "textbook_required",
    label: "Textbook Required",
    icon: "📚",
    description: "Activity requires student textbooks",
  },
  {
    value: "technology_enhanced",
    label: "Technology Enhanced",
    icon: "💻",
    description: "Using computers, tablets, or digital tools",
  },
  {
    value: "multimedia",
    label: "Multimedia",
    icon: "📽️",
    description: "Audio, video, or presentation materials needed",
  },
];

export const timeDurationOptions = [
  {
    value: "15 minutes",
    label: "15 minutes",
    description: "Quick warm-up or review activity",
  },
  {
    value: "20 minutes",
    label: "20 minutes",
    description: "Short focused activity",
  },
  {
    value: "30 minutes",
    label: "30 minutes",
    description: "Standard activity duration",
  },
  {
    value: "45 minutes",
    label: "45 minutes",
    description: "Extended activity session",
  },
  {
    value: "60 minutes",
    label: "60 minutes",
    description: "Full period activity",
  },
  {
    value: "90 minutes",
    label: "90 minutes",
    description: "Double period or block schedule",
  },
];

export const bloomTaxonomyLevels = [
  {
    level: "Remember",
    description: "Recall facts and basic concepts",
    color: "#ff4d4f",
    keywords: ["define", "list", "recall", "recognize", "state"],
  },
  {
    level: "Understand",
    description: "Explain ideas or concepts",
    color: "#fa8c16",
    keywords: ["explain", "describe", "interpret", "summarize", "classify"],
  },
  {
    level: "Apply",
    description: "Use information in new situations",
    color: "#fadb14",
    keywords: ["apply", "demonstrate", "solve", "use", "implement"],
  },
  {
    level: "Analyze",
    description: "Draw connections among ideas",
    color: "#52c41a",
    keywords: ["analyze", "compare", "contrast", "examine", "distinguish"],
  },
  {
    level: "Evaluate",
    description: "Justify a stand or decision",
    color: "#1890ff",
    keywords: ["evaluate", "judge", "defend", "assess", "critique"],
  },
  {
    level: "Create",
    description: "Produce new or original work",
    color: "#722ed1",
    keywords: ["create", "design", "compose", "plan", "construct"],
  },
];

export const difficultyLevels = [
  {
    value: "beginner",
    label: "Beginner",
    color: "#52c41a",
    description: "Basic level for new learners",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    color: "#fa8c16",
    description: "Moderate difficulty level",
  },
  {
    value: "advanced",
    label: "Advanced",
    color: "#f5222d",
    description: "Challenging level for skilled learners",
  },
];

// Additional exports for standalone assessments
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
