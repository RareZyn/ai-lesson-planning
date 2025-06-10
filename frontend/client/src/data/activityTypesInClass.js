// data/activityTypesInClass.js

export const bloomTaxonomyLevels = [
  {
    level: "Remember",
    color: "#ff4d4f",
    description: "Recall facts and basic concepts",
    keywords: ["define", "list", "recall", "identify", "name"],
  },
  {
    level: "Understand",
    color: "#fa8c16",
    description: "Explain ideas or concepts",
    keywords: ["explain", "describe", "summarize", "interpret", "classify"],
  },
  {
    level: "Apply",
    color: "#fadb14",
    description: "Use information in new situations",
    keywords: ["use", "solve", "demonstrate", "apply", "implement"],
  },
  {
    level: "Analyze",
    color: "#52c41a",
    description: "Draw connections among ideas",
    keywords: ["analyze", "compare", "contrast", "examine", "differentiate"],
  },
  {
    level: "Evaluate",
    color: "#1890ff",
    description: "Justify a stand or decision",
    keywords: ["evaluate", "critique", "judge", "justify", "assess"],
  },
  {
    level: "Create",
    color: "#722ed1",
    description: "Produce new or original work",
    keywords: ["create", "design", "compose", "plan", "construct"],
  },
];

export const classroomActivityTypes = [
  {
    category: "Collaborative Learning",
    activities: [
      "Think-Pair-Share",
      "Jigsaw Method",
      "Group Investigation",
      "Peer Teaching",
      "Group Presentation",
      "Collaborative Writing",
      "Team Problem Solving",
      "Group Discussion",
      "Peer Review",
      "Cooperative Learning",
    ],
  },
  {
    category: "Individual Activities",
    activities: [
      "Silent Reading",
      "Written Reflection",
      "Individual Research",
      "Personal Journal",
      "Self-Assessment",
      "Independent Practice",
      "Individual Presentation",
      "Creative Writing",
      "Problem Solving",
      "Worksheet Completion",
    ],
  },
  {
    category: "Interactive Activities",
    activities: [
      "Role Playing",
      "Debates",
      "Simulation Games",
      "Interactive Storytelling",
      "Question and Answer",
      "Show and Tell",
      "Gallery Walk",
      "Speed Dating (academic)",
      "Round Robin",
      "Fishbowl Discussion",
    ],
  },
  {
    category: "Creative Activities",
    activities: [
      "Mind Mapping",
      "Poster Creation",
      "Drama Performance",
      "Art Integration",
      "Music Integration",
      "Creative Projects",
      "Storytelling",
      "Design Thinking",
      "Innovation Labs",
      "Creative Problem Solving",
    ],
  },
  {
    category: "Technology Enhanced",
    activities: [
      "Digital Presentations",
      "Online Research",
      "Video Creation",
      "Interactive Quizzes",
      "Virtual Field Trips",
      "Digital Storytelling",
      "Online Collaboration",
      "Educational Games",
      "Multimedia Projects",
      "Digital Portfolio",
    ],
  },
  {
    category: "Assessment Activities",
    activities: [
      "Formative Assessment",
      "Peer Assessment",
      "Self-Evaluation",
      "Exit Tickets",
      "Quick Polls",
      "Observation Checklist",
      "Portfolio Review",
      "Rubric-based Assessment",
      "Reflection Activities",
      "Progress Monitoring",
    ],
  },
];

export const studentArrangementOptions = [
  {
    value: "individual",
    label: "Individual Work",
    description: "Students work independently",
    icon: "👤",
  },
  {
    value: "pair",
    label: "Pair Work",
    description: "Students work in pairs",
    icon: "👥",
  },
  {
    value: "small_group",
    label: "Small Group (3-5)",
    description: "Students work in small groups",
    icon: "👨‍👩‍👦",
  },
  {
    value: "large_group",
    label: "Large Group (6+)",
    description: "Students work in larger groups",
    icon: "👥👥",
  },
  {
    value: "whole_class",
    label: "Whole Class",
    description: "Entire class participates together",
    icon: "🏫",
  },
  {
    value: "mixed",
    label: "Mixed Arrangement",
    description: "Combination of different arrangements",
    icon: "🔄",
  },
];

export const resourceOptions = [
  {
    value: "classroom_only",
    label: "Classroom Resources Only",
    description: "Use only materials available in classroom",
    icon: "🏫",
  },
  {
    value: "school_resources",
    label: "School Resources",
    description: "Access to library, lab, and school facilities",
    icon: "🏢",
  },
  {
    value: "external_resources",
    label: "External Resources",
    description: "Internet, community resources, field trips",
    icon: "🌐",
  },
  {
    value: "bring_materials",
    label: "Student-Brought Materials",
    description: "Students bring materials from home",
    icon: "🎒",
  },
  {
    value: "mixed_resources",
    label: "Mixed Resources",
    description: "Combination of different resource types",
    icon: "🔄",
  },
];

export const timeDurationOptions = [
  { value: "5-10", label: "5-10 minutes", description: "Quick activity" },
  { value: "10-20", label: "10-20 minutes", description: "Short activity" },
  { value: "20-30", label: "20-30 minutes", description: "Medium activity" },
  { value: "30-45", label: "30-45 minutes", description: "Long activity" },
  { value: "45+", label: "45+ minutes", description: "Extended activity" },
  {
    value: "flexible",
    label: "Flexible timing",
    description: "Adaptable duration",
  },
];

export const difficultyLevels = [
  {
    value: "beginner",
    label: "Beginner",
    color: "#52c41a",
    description: "Basic level",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    color: "#fadb14",
    description: "Medium level",
  },
  {
    value: "advanced",
    label: "Advanced",
    color: "#ff4d4f",
    description: "High level",
  },
  {
    value: "mixed",
    label: "Mixed Levels",
    color: "#1890ff",
    description: "Various levels",
  },
];
