// src/data/lessonPlanData.js - Dummy data for lesson plans based on the actual structure

export const dummyLessonPlans = [
  {
    _id: "684afe8700e6d69fbd4442cb",
    user: "60c72b2f9b1d8c001c8e4d9a",
    classId: "684af4608396c2624a535137",
    className: "5 UM", // For display purposes
    lessonDate: "2025-06-08T09:00:00.000Z",
    parameters: {
      grade: "Form 5",
      proficiencyLevel: "B1 Mid",
      hotsFocus: "evaluate",
      specificTopic: "Making our school community safer",
      iThink: "",
      additionalNotes: "",
      Sow: {
        lessonNo: 2,
        focus: "reading",
        theme: "People and Culture",
        topic: "It's Personal!",
      },
    },
    plan: {
      learningObjective:
        "Students will be able to evaluate the effectiveness of different safety measures in creating a safer school community.",
      successCriteria: [
        "I can identify at least three key safety concerns within our school environment.",
        "I can propose and explain at least two different solutions to address these safety concerns.",
        "I can evaluate the potential effectiveness and limitations of each proposed solution, considering factors like cost, practicality, and impact.",
        "I can justify my chosen solution based on a reasoned evaluation of its pros and cons.",
      ],
      activities: {
        preLesson: [
          "Brainstorming session (5 mins): Students individually list safety concerns in our school. Teacher writes them on the board.",
          "Group Discussion (10 mins): Students in groups of 4 discuss their listed concerns, consolidating them into a shared list for their group.",
        ],
        duringLesson: [
          "Presentation & Discussion (15 mins): Teacher introduces different safety measures (e.g., improved lighting, security cameras, buddy system, anti-bullying programs). Students discuss the pros and cons of each.",
          "Group Work & Solution Development (20 mins): Groups brainstorm and propose solutions to the identified safety concerns. They evaluate each proposed solution using a simple rubric (provided by teacher) focusing on effectiveness, cost, and practicality.",
          "Solution Presentation (5 mins): Each group presents their chosen solution and their evaluation.",
        ],
        postLesson: [
          "Class Discussion & Feedback (10 mins): Class evaluates the presented solutions, discussing strengths and weaknesses. Teacher guides students towards a balanced understanding of various safety measure effectiveness.",
          "Reflection Journal (5 mins): Students individually write a short reflection on what they learned about evaluating safety measures and their effectiveness in a school setting.",
        ],
      },
    },
    likes: 15,
    downloads: 8,
    views: 45,
    isShared: false,
    createdAt: "2025-06-12T15:38:08.715Z",
  },
  {
    _id: "684afe8700e6d69fbd4442cc",
    user: "60c72b2f9b1d8c001c8e4d9a",
    classId: "684af4608396c2624a535137",
    className: "5 UM",
    lessonDate: "2025-06-10T10:00:00.000Z",
    parameters: {
      grade: "Form 5",
      proficiencyLevel: "B1 High",
      hotsFocus: "create",
      specificTopic: "An informal email to a friend about a celebrity I admire",
      iThink: "",
      additionalNotes:
        "Focus on using descriptive adjectives and varied sentence structures.",
      Sow: {
        lessonNo: 7,
        focus: "writing",
        theme: "People and Culture",
        topic: "It's Personal!",
      },
    },
    plan: {
      learningObjective:
        "By the end of the lesson, students will be able to write a multi-paragraph informal email, using appropriate structure, tone, and descriptive language to express admiration for a famous person.",
      successCriteria: [
        "I can structure an informal email with a proper greeting, body, and closing.",
        "I can use at least five descriptive adjectives to explain why I admire someone.",
        "I can connect my ideas between paragraphs using simple connectors.",
        "I can create a plan or outline before writing my email draft.",
      ],
      activities: {
        preLesson: [
          "Think-Pair-Share (10 mins): In pairs, students brainstorm famous people they admire and list reasons why. Groups share one example with the class.",
          "Feature Analysis (5 mins): Teacher shows a sample informal email and asks students to identify key features (greeting, contractions, closing).",
        ],
        duringLesson: [
          "Planning (10 mins): Teacher models creating a simple plan/mind map for the email. Students then create their own plan for the celebrity they chose.",
          "Drafting - Paragraph 1 (15 mins): Students write the opening paragraph, introducing the person they admire.",
          "Peer Feedback (10 mins): Students swap their opening paragraph with a partner and check for a clear topic sentence and engaging language.",
          "Drafting - Body & Conclusion (15 mins): Students continue writing the rest of their email based on their plan.",
        ],
        postLesson: [
          "Author's Chair (10 mins): Volunteers read their completed emails aloud to the class. The class provides positive feedback ('two stars and a wish').",
        ],
      },
    },
    likes: 22,
    downloads: 12,
    views: 67,
    isShared: true,
    createdAt: "2025-06-10T10:00:00.000Z",
  },
  {
    _id: "684afe8700e6d69fbd4442cd",
    user: "60c72b2f9b1d8c001c8e4d9a",
    classId: "684ae8e1f20a7dd141136657",
    className: "Biruni",
    lessonDate: "2025-06-12T11:00:00.000Z",
    parameters: {
      grade: "Form 5",
      proficiencyLevel: "A2 High",
      hotsFocus: "apply",
      specificTopic:
        "Discussing advantages and disadvantages of different holiday plans",
      iThink: "",
      additionalNotes: "",
      Sow: {
        lessonNo: 5,
        focus: "speaking",
        theme: "People and Culture",
        topic: "It's Personal!",
      },
    },
    plan: {
      learningObjective:
        "Students will be able to discuss and explain the advantages and disadvantages of different ideas and plans, using simple connectors to structure their opinions.",
      successCriteria: [
        "I can use phrases like 'One advantage is...' and 'A disadvantage is...'.",
        "I can give at least one reason to support my opinion.",
        "I can ask my partner what they think using 'What about you?'.",
        "I can listen to my partner's opinion and respond.",
      ],
      activities: {
        preLesson: [
          "Vocabulary Matching (10 mins): Students match pictures of holiday types (beach, city, adventure) with key vocabulary words (relaxing, exciting, crowded, expensive).",
          "Language Bank Intro (5 mins): Teacher introduces useful phrases for discussion on the whiteboard (e.g., 'I think...', 'I agree/disagree because...', 'That's a good point, but...').",
        ],
        duringLesson: [
          "Modelled Dialogue (10 mins): Teacher and a confident student model a short discussion about the pros and cons of a beach holiday.",
          "Paired Role-Play (20 mins): In pairs, Student A tries to convince Student B to go on a city holiday, while Student B explains the disadvantages. They must use the phrases from the language bank.",
          "Swap Roles (10 mins): Students swap roles and discuss a different type of holiday (e.g., adventure holiday).",
        ],
        postLesson: [
          "Class Vote & Justification (10 mins): The class votes on the best holiday type. Several students are asked to justify their vote by explaining one advantage of their choice.",
        ],
      },
    },
    likes: 18,
    downloads: 5,
    views: 32,
    isShared: false,
    createdAt: "2025-06-12T11:00:00.000Z",
  },
  {
    _id: "684afe8700e6d69fbd4442ce",
    user: "60c72b2f9b1d8c001c8e4d9a",
    classId: "684ae8e1f20a7dd141136657",
    className: "Biruni",
    lessonDate: "2025-06-15T09:00:00.000Z",
    parameters: {
      grade: "Form 5",
      proficiencyLevel: "B1 Low",
      hotsFocus: "understand",
      specificTopic: "Understanding different text types and their purposes",
      iThink: "Thinking Map",
      additionalNotes:
        "Focus on identifying text features and language patterns.",
      Sow: {
        lessonNo: 3,
        focus: "reading",
        theme: "Science and Technology",
        topic: "Tomorrow's World",
      },
    },
    plan: {
      learningObjective:
        "Students will be able to identify different text types and understand their specific purposes and language features.",
      successCriteria: [
        "I can identify at least three different text types.",
        "I can explain the purpose of each text type.",
        "I can recognize key language features in different texts.",
        "I can match texts to their intended audience.",
      ],
      activities: {
        preLesson: [
          "Text Gallery Walk (10 mins): Students walk around the classroom and observe different text samples posted on the walls.",
          "Initial Sorting (5 mins): In pairs, students categorize the texts they observed into groups based on their initial impressions.",
        ],
        duringLesson: [
          "Text Analysis (15 mins): Teacher introduces formal categories of text types. Students examine sample texts and identify key features.",
          "Feature Hunt (20 mins): In groups, students use a checklist to find specific language features in different text types (formal/informal language, technical terms, persuasive language, etc.).",
          "Matching Activity (10 mins): Students match text types to their purposes and target audiences using cards.",
        ],
        postLesson: [
          "Think Map Creation (10 mins): Students create a thinking map showing the relationships between text types, purposes, and features.",
          "Exit Reflection (5 mins): Students write one thing they learned about text types and one question they still have.",
        ],
      },
    },
    likes: 12,
    downloads: 7,
    views: 28,
    isShared: false,
    createdAt: "2025-06-15T09:00:00.000Z",
  },
  {
    _id: "684afe8700e6d69fbd4442cf",
    user: "60c72b2f9b1d8c001c8e4d9a",
    classId: "684af0958396c2624a5350d9",
    className: "5 UTHM",
    lessonDate: "2025-06-18T14:00:00.000Z",
    parameters: {
      grade: "Form 5",
      proficiencyLevel: "B2",
      hotsFocus: "analyze",
      specificTopic: "Analyzing persuasive techniques in advertisements",
      iThink: "Bubble Map",
      additionalNotes:
        "Students will examine real advertisements and identify persuasive strategies.",
      Sow: {
        lessonNo: 8,
        focus: "reading",
        theme: "Consumer and Financial Awareness",
        topic: "Smart Shopping",
      },
    },
    plan: {
      learningObjective:
        "Students will be able to analyze and evaluate persuasive techniques used in advertisements and understand their impact on consumers.",
      successCriteria: [
        "I can identify at least four different persuasive techniques in advertisements.",
        "I can explain how each technique tries to influence consumers.",
        "I can evaluate the effectiveness of different persuasive strategies.",
        "I can create my own analysis of an advertisement's persuasive elements.",
      ],
      activities: {
        preLesson: [
          "Advertisement Showcase (8 mins): Teacher shows 3-4 different advertisements (print/video). Students observe and note their initial reactions.",
          "Quick Discussion (7 mins): Students share what caught their attention in each advertisement and why they think it was effective.",
        ],
        duringLesson: [
          "Technique Introduction (12 mins): Teacher introduces common persuasive techniques (celebrity endorsement, emotional appeal, statistics, bandwagon effect, etc.) with examples.",
          "Advertisement Analysis (25 mins): In groups, students analyze assigned advertisements using an analysis worksheet, identifying techniques and explaining their purpose.",
          "Gallery Walk & Comparison (8 mins): Groups post their analyses and walk around to see how different advertisements use various techniques.",
        ],
        postLesson: [
          "Bubble Map Creation (8 mins): Students create a bubble map showing connections between persuasive techniques and their effects on different target audiences.",
          "Critical Reflection (7 mins): Students reflect on how understanding these techniques might change their behavior as consumers.",
        ],
      },
    },
    likes: 25,
    downloads: 14,
    views: 58,
    isShared: true,
    createdAt: "2025-06-18T14:00:00.000Z",
  },
];

// Dummy data for classes (from the classes.json structure)
export const dummyClasses = [
  {
    _id: "684ae8e1f20a7dd141136657",
    className: "Biruni",
    grade: "Form 5",
    subject: "English",
    year: "2025",
    createdBy: "6834f67e5835adc027932e03",
    createdAt: "2025-06-12T14:49:05.547Z",
  },
  {
    _id: "684af0958396c2624a5350d9",
    className: "5 UTHM",
    grade: "Form 5",
    subject: "English",
    year: "2025",
    createdBy: "683d573e6bcf9f67084dab33",
    createdAt: "2025-06-12T15:21:57.931Z",
  },
  {
    _id: "684af4608396c2624a535137",
    className: "5 UM",
    grade: "Form 5",
    subject: "English",
    year: "2025",
    createdBy: "684af4118396c2624a535114",
    createdAt: "2025-06-12T15:38:08.715Z",
  },
];

// Dummy shared lesson plans for the community
export const dummySharedLessonPlans = [
  {
    _id: "shared_001",
    originalLessonPlan: dummyLessonPlans[1], // The writing lesson
    sharedBy: {
      _id: "6834f67e5835adc027932e03",
      name: "Ahmad Albab",
      schoolName: "SMK SUBANG BESTARI",
      avatar:
        "https://lh3.googleusercontent.com/a/ACg8ocKF5O1xTW31Dj_t6YJXhU-BG2lyrMqrtLX2hs0NDwfiIU55h6I=s96-c",
    },
    className: "5 UM",
    description:
      "This lesson worked really well with my Form 5 students! They were engaged throughout and produced excellent emails. The Think-Pair-Share activity at the beginning was particularly effective in getting them to think creatively about celebrities they admire. I'd recommend giving students more time for the peer feedback session as they really valued each other's input.",
    images: [
      "https://example.com/student-work1.jpg",
      "https://example.com/classroom-activity.jpg",
    ],
    likes: 28,
    downloads: 15,
    views: 89,
    comments: [
      {
        _id: "comment_001",
        author: "Siti Nurhaliza",
        authorId: "684af4118396c2624a535114",
        text: "Thank you for sharing! I tried this with my class and they loved the celebrity email writing. Very creative approach!",
        createdAt: "2025-06-13T10:30:00.000Z",
      },
      {
        _id: "comment_002",
        author: "Rahman Ismail",
        authorId: "6834a2967941ed9081419c38",
        text: "Great lesson structure. The peer feedback component really makes a difference in writing quality.",
        createdAt: "2025-06-14T14:15:00.000Z",
      },
    ],
    sharedAt: "2025-06-11T10:00:00.000Z",
    isPublic: true,
  },
  {
    _id: "shared_002",
    originalLessonPlan: dummyLessonPlans[4], // The advertisement analysis lesson
    sharedBy: {
      _id: "684aeee48cdce75d30a8af11",
      name: "Razin Nazarudin",
      schoolName: "SAM BESTARI",
      avatar:
        "https://lh3.googleusercontent.com/a/ACg8ocIFvuY6PtRcVMEdiuR9wAXzgFYRunGESlvLZAFfCtkJoOn8v44_=s96-c",
    },
    className: "5 UTHM",
    description:
      "My students absolutely loved analyzing the advertisements! I brought in real Malaysian ads from newspapers and social media which made it very relevant to them. The bubble map activity helped them see the connections between techniques and target audiences. One tip: prepare extra advertisements as backup because students get really engaged and want to analyze more!",
    images: [
      "https://example.com/ad-analysis-board.jpg",
      "https://example.com/student-bubble-maps.jpg",
      "https://example.com/malaysian-ads-collection.jpg",
    ],
    likes: 34,
    downloads: 22,
    views: 127,
    comments: [
      {
        _id: "comment_003",
        author: "Fatimah Ahmad",
        authorId: "6834a1b87941ed9081419c32",
        text: "This is brilliant! Using local Malaysian advertisements made it so much more engaging for students.",
        createdAt: "2025-06-19T09:45:00.000Z",
      },
    ],
    sharedAt: "2025-06-19T14:30:00.000Z",
    isPublic: true,
  },
];

// Helper functions
export const getLessonPlansByClassId = (classId) => {
  return dummyLessonPlans.filter((plan) => plan.classId === classId);
};

export const getClassById = (classId) => {
  return dummyClasses.find((cls) => cls._id === classId);
};

export const getLessonPlanById = (lessonPlanId) => {
  return dummyLessonPlans.find((plan) => plan._id === lessonPlanId);
};

export const getSharedLessonPlans = (filters = {}) => {
  let filtered = [...dummySharedLessonPlans];

  if (filters.subject) {
    filtered = filtered.filter(
      (shared) =>
        shared.originalLessonPlan.parameters?.Sow?.theme
          ?.toLowerCase()
          .includes(filters.subject.toLowerCase()) ||
        shared.className.includes(filters.subject)
    );
  }

  if (filters.grade) {
    filtered = filtered.filter(
      (shared) => shared.originalLessonPlan.parameters?.grade === filters.grade
    );
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(
      (shared) =>
        shared.originalLessonPlan.parameters?.Sow?.topic
          ?.toLowerCase()
          .includes(searchTerm) ||
        shared.originalLessonPlan.parameters?.Sow?.theme
          ?.toLowerCase()
          .includes(searchTerm) ||
        shared.description.toLowerCase().includes(searchTerm) ||
        shared.originalLessonPlan.plan?.learningObjective
          ?.toLowerCase()
          .includes(searchTerm)
    );
  }

  return filtered;
};
