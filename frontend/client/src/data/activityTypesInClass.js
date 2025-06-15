// frontend/client/src/data/activityTypesInClass.js
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
  { value: "15 minutes", label: "15 minutes" },
  { value: "20 minutes", label: "20 minutes" },
  { value: "30 minutes", label: "30 minutes" },
  { value: "45 minutes", label: "45 minutes" },
  { value: "60 minutes", label: "60 minutes" },
  { value: "90 minutes", label: "90 minutes" },
];
