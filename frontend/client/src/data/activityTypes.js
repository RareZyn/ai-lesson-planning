// data/activityTypes.js
export const englishActivityTypes = [
  // Listening Activities
  {
    category: "Listening",
    activities: [
      "Listen and identify main ideas",
      "Listen and answer comprehension questions",
      "Listen and complete dialogue",
      "Listen and sequence events",
      "Listen and match information",
      "Audio storytelling",
      "Listening to instructions",
      "Sound discrimination",
      "Listening for specific information",
      "Note-taking while listening",
    ],
  },
  // Speaking Activities
  {
    category: "Speaking",
    activities: [
      "Oral presentation",
      "Role-play dialogue",
      "Group discussion",
      "Storytelling",
      "Debate and argumentation",
      "Interview simulation",
      "Describing pictures/situations",
      "Giving directions",
      "Phone conversation practice",
      "Pronunciation practice",
    ],
  },
  // Reading Activities
  {
    category: "Reading",
    activities: [
      "Reading comprehension",
      "Scanning for information",
      "Skimming for main ideas",
      "Reading and summarizing",
      "Reading and vocabulary building",
      "Reading different text types",
      "Reading and note-taking",
      "Reading and graphic organizers",
      "Reading and prediction",
      "Silent reading",
    ],
  },
  // Writing Activities
  {
    category: "Writing",
    activities: [
      "Essay writing",
      "Creative writing",
      "Formal letter writing",
      "Informal letter writing",
      "Report writing",
      "Diary/journal writing",
      "Paragraph writing",
      "Summary writing",
      "Story completion",
      "Writing reviews",
    ],
  },
  // Literature in Action
  {
    category: "Literature in Action",
    activities: [
      "Poetry analysis",
      "Character analysis",
      "Drama performance",
      "Book review",
      "Literature discussion",
      "Creative interpretation",
      "Literature portfolio",
      "Author study",
      "Literary comparison",
      "Book club activities",
    ],
  },
  // Grammar and Language
  {
    category: "Grammar & Language",
    activities: [
      "Grammar exercises",
      "Sentence construction",
      "Word formation",
      "Tenses practice",
      "Parts of speech",
      "Punctuation practice",
      "Vocabulary games",
      "Language patterns",
      "Error correction",
      "Language transformation",
    ],
  },
  // Project-Based Activities
  {
    category: "Project-Based",
    activities: [
      "Research project",
      "Group presentation",
      "Magazine creation",
      "Website design",
      "Video production",
      "Survey and interview",
      "Cultural exchange project",
      "Environmental project",
      "Community service project",
      "Digital storytelling",
    ],
  },
];

// Flatten all activities for easy access
export const allActivityTypes = englishActivityTypes.reduce((acc, category) => {
  return [...acc, ...category.activities];
}, []);
