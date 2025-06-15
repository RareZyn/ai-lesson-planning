const OpenAI = require("openai");
const Assessment = require("../model/Assessment");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const standardizeAssessmentResponse = (
  activityHTML,
  rubricHTML,
  assessmentHTML,
  answerKeyHTML
) => {
  return {
    success: true,
    generatedContent: {
      // For activities and textbook
      activityHTML: activityHTML || null,
      rubricHTML: rubricHTML || null,

      // For assessments/exams
      assessmentHTML: assessmentHTML || null,
      answerKeyHTML: answerKeyHTML || null,

      // For frontend convenience
      studentContent: activityHTML || assessmentHTML || null,
      teacherContent: rubricHTML || answerKeyHTML || null,

      // Metadata
      hasStudentContent: !!(activityHTML || assessmentHTML),
      hasTeacherContent: !!(rubricHTML || answerKeyHTML),
      generatedAt: new Date(),
    },
  };
};

const fullLessonPlanner = async (req, res) => {
  const {
    lesson,
    lessonInSow,
    day,
    subject,
    theme,
    topic,
    time,
    date,
    contentStandard,
    learningStandard,
    learningStandards,
  } = req.body;

  const prompt = `
  You are a smart lesson planner assistant.
  
  Return a JSON object that follows this exact structure:
  
  {
    "lesson": string,
    "lessonInSow": string,
    "day": string,
    "subject": string,
    "theme": string,
    "topic": string,
    "time": string,
    "date": string,
    "contentStandard": {
      "main": string,
      "component": string
    },
    "learningStandard": {
      "main": string,
      "component": string
    },
    "learningStandards": {
      "iThink": string,
      "fourSkill": string,
      "writing": string,
      "cce": string,
      "gs": string,
      "hots": string,
      "create": string
    },
    "preActivity": string,
    "activity": string,
    "postActivity": string,
    "objective": string,
    "successCriteria": string
  }
  
  Here is the lesson info to use:
  
  Lesson: ${lesson}
  Lesson in SOW: ${lessonInSow}
  Day: ${day}
  Date: ${date}
  Time: ${time}
  Subject: ${subject}
  Theme: ${theme}
  Topic: ${topic}
  
  Content Standard:
  - Main: ${contentStandard.main}
  - Component: ${contentStandard.component}
  
  Learning Standard:
  - Main: ${learningStandard.main}
  - Component: ${learningStandard.component}
  
  Extra Tags:
  - iThink: ${learningStandards.iThink}
  - Four Skills: ${learningStandards.fourSkill}
  - Writing: ${learningStandards.writing}
  - CCE: ${learningStandards.cce}
  - GS: ${learningStandards.gs}
  - HOTS: ${learningStandards.hots}
  - Create: ${learningStandards.create}
  
  IMPORTANT:
  - Keep the field names and structure exactly as shown.
  - Do not wrap values in objects like "preActivity": { ... }.
  - Do not change field names.
  - Reply only with a valid JSON object. No explanation.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You generate lesson plans in JSON format only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Invalid JSON format from OpenAI",
        raw,
      });
    }

    res.status(200).json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Generate Activity and Rubric based on lesson plan data
const generateActivityAndRubric = async (req, res) => {
  const {
    contentStandard,
    learningStandard,
    learningOutline,
    activityType = "activityInClass",
    lesson,
    subject,
    theme,
    topic,
    // Additional parameters from the frontend modal
    studentArrangement,
    resourceUsage,
    duration,
    additionalRequirement,
  } = req.body;

  const prompt = `
# Identity

You are an AI assistant helping to generate creative and pedagogically sound in-class assessments and rubrics for English language teachers based on Malaysian KSSM curriculum lesson plans.

# Instructions

You must generate two HTML outputs:

1. 🎓 Student Activity Sheet (Styled HTML)
2. 🧑‍🏫 Teacher Rubric Sheet (Styled HTML)

# Lesson Data

{
  "lesson": "${lesson}",
  "subject": "${subject}",
  "theme": "${theme}",
  "topic": "${topic}",
  "contentStandard": {
    "main": "${contentStandard.main}",
    "component": "${contentStandard.component}"
  },
  "learningStandard": {
    "main": "${learningStandard.main}",
    "component": "${learningStandard.component}"
  },
  "learningOutline": {
    "pre": "${learningOutline.pre}",
    "during": "${learningOutline.during}",
    "post": "${learningOutline.post}"
  },
  "activityType": "${activityType}",
  "studentArrangement": "${studentArrangement}",
  "resourceUsage": "${resourceUsage}",
  "duration": "${duration}",
  "additionalRequirement": "${additionalRequirement}"
}

# Activity Configuration

Generate an in-class activity that incorporates:
- Student Arrangement: ${studentArrangement || "small_group"}
- Resource Usage: ${resourceUsage || "classroom_only"}
- Duration: ${duration || "30-45 minutes"}
- Additional Requirements: ${
    additionalRequirement || "Standard classroom activity"
  }

# Output Format

1. Begin your response with \`\`\`html\n<!-- STUDENT ACTIVITY -->\n<html>...</html>\n\`\`\`
2. Then add a second HTML block: \`\`\`html\n<!-- TEACHER RUBRIC -->\n<html>...</html>\n\`\`\`

Do not include anything else. Just the two clean HTML blocks, no explanations.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You generate HTML student activities and teacher rubrics for classroom assessments.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const output = response.choices[0].message.content;

    // Flexible regex: matches even with newline/space variations
    const match = output.match(
      /```html\s*<!-- STUDENT ACTIVITY -->\s*(.*?)\s*```[\s\n]*```html\s*<!-- TEACHER RUBRIC -->\s*(.*?)\s*```/s
    );

    if (!match || match.length < 3) {
      return res.status(500).json({
        success: false,
        message: "OpenAI output did not contain both HTML blocks.",
        raw: output,
      });
    }

    const studentHtml = match[1].trim();
    const rubricHtml = match[2].trim();

    res
      .status(200)
      .json(standardizeAssessmentResponse(studentHtml, rubricHtml));
  } catch (err) {
    console.error("Error generating activity & rubric:", err);
    res.status(500).json({
      success: false,
      message: "OpenAI API error",
    });
  }
};

// Generate Essay Assessment based on lesson plan data
const generateEssayAssessment = async (req, res) => {
  const {
    contentStandard,
    learningStandard,
    learningOutline,
    lesson,
    subject,
    theme,
    topic,
    // Additional parameters from the frontend modal
    essayType,
    wordCount,
    duration,
    additionalRequirement,
  } = req.body;

  const prompt = `
# Identity

You are an AI assistant that creates HTML-based student essay tasks and teacher grading rubrics based on Malaysian KSSM curriculum lesson plans. All outputs must follow a professional, styled, printable A4-friendly layout.

# Instructions

You must return exactly two blocks of HTML content:

1. 🎓 Student Essay Activity Sheet (Styled HTML)
2. 🧑‍🏫 Teacher Rubric Sheet (Styled HTML)

Both must:
- Be ready to print on A4 size
- Be visually clear, with headings, sections, and consistent fonts
- Use modern styling (e.g., clean layout, color headers, table borders for rubrics)

## Student Essay Activity Guidelines
- Include fields for Student Name, Class, and Teacher Name
- Provide a clear title and engaging prompt related to the lesson topic
- Include bullet points under instructions explaining what to write
- Add a large text box for the essay (at least 600px height)
- Include a note to students about tone, grammar, and proofreading
- Word count requirement: ${wordCount || "200-300 words"}
- Duration: ${duration || "60 minutes"}

## Teacher Rubric Guidelines
- Create a 5-column rubric table with: Criteria | Excellent (5) | Good (4) | Satisfactory (3) | Needs Improvement (1–2)
- Include categories like Content, Organization, Tone, Language Use, and Creativity
- Add a total score summary and grading scale (e.g., 23–25 = Excellent)
- Use styled borders, background colors for headers, and even-row shading

# Lesson Data

{
  "lesson": "${lesson}",
  "subject": "${subject}",
  "theme": "${theme}",
  "topic": "${topic}",
  "contentStandard": {
    "main": "${contentStandard.main}",
    "component": "${contentStandard.component}"
  },
  "learningStandard": {
    "main": "${learningStandard.main}",
    "component": "${learningStandard.component}"
  },
  "learningOutline": {
    "pre": "${learningOutline.pre}",
    "during": "${learningOutline.during}",
    "post": "${learningOutline.post}"
  },
  "activityType": "essay",
  "essayType": "${essayType}",
  "wordCount": "${wordCount}",
  "duration": "${duration}",
  "additionalRequirement": "${additionalRequirement}"
}

# Output Format

1. Begin your response with \`\`\`html\n<!-- STUDENT ACTIVITY -->\n<html>...</html>\n\`\`\`
2. Then add a second HTML block: \`\`\`html\n<!-- TEACHER RUBRIC -->\n<html>...</html>\n\`\`\`

Do not include anything else. Just the raw HTMLs.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You generate HTML student activities and teacher rubrics for KSSM English essay assessments.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const output = response.choices[0].message.content;

    const match = output.match(
      /```html\s*<!-- STUDENT ACTIVITY -->\s*(.*?)\s*```[\s\n]*```html\s*<!-- TEACHER RUBRIC -->\s*(.*?)\s*```/s
    );

    if (!match || match.length < 3) {
      return res.status(500).json({
        success: false,
        message: "OpenAI output did not contain both HTML blocks.",
        raw: output,
      });
    }

    const studentHtml = match[1].trim();
    const rubricHtml = match[2].trim();

    res
      .status(200)
      .json(standardizeAssessmentResponse(studentHtml, rubricHtml));
  } catch (err) {
    console.error("Error generating essay assessment:", err);
    res.status(500).json({
      success: false,
      message: "OpenAI API error",
    });
  }
};

// Generate Textbook Activity based on lesson plan data
const generateTextbookActivity = async (req, res) => {
  const {
    contentStandard,
    learningStandard,
    learningOutline,
    lesson,
    subject,
    theme,
    topic,
    // Additional parameters from the frontend modal
    additionalRequirement,
  } = req.body;

  const prompt = `
  # Identity
  
  You are an AI assistant that generates printable HTML-based classroom activities and teacher rubrics based on the Malaysian KSSM curriculum. This request is for a **Textbook-Based Activity**.
  
  # Instructions
  
  You must return exactly two blocks of HTML content:
  
  1. 📘 Student Activity Sheet – Textbook Based (Styled HTML)
  2. 🧑‍🏫 Teacher Rubric Sheet (Styled HTML)
  
  ### Student Activity Sheet Must Include:
  - Title and lesson info (Lesson name, subject, theme, topic)
  - Fields for Student Name, Class, and Teacher Name
  - Reference to the specific textbook page(s)
  - Clear pre-, during-, and post-activity tasks based on provided outline
  - An open-ended task or reflective question aligned to textbook goals
  - A creative note or prompt (e.g., reflection, group discussion, or journal)
  
  ### Teacher Rubric Must Include:
  - A 5-column scoring table: Criteria | Excellent (5) | Good (4) | Satisfactory (3) | Needs Improvement (1–2)
  - Criteria: Understanding, Participation, Communication, Collaboration, Creativity
  - Total score summary and simple grading scale
  
  # Lesson Data
  
  {
    "lesson": "${lesson}",
    "subject": "${subject}",
    "theme": "${theme}",
    "topic": "${topic}",
    "contentStandard": {
      "main": "${contentStandard.main}",
      "component": "${contentStandard.component}"
    },
    "learningStandard": {
      "main": "${learningStandard.main}",
      "component": "${learningStandard.component}"
    },
    "learningOutline": {
      "pre": "${learningOutline.pre}",
      "during": "${learningOutline.during}",
      "post": "${learningOutline.post}"
    },
    "activityType": "textbook",
    "additionalRequirement": "${additionalRequirement}"
  }
  
  # Output Format
  
  1. Begin your response with \`\`\`html\n<!-- STUDENT ACTIVITY -->\n<html>...</html>\n\`\`\`
  2. Then add a second HTML block: \`\`\`html\n<!-- TEACHER RUBRIC -->\n<html>...</html>\n\`\`\`
  
  No extra explanation. Just two valid HTML blocks.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You generate HTML classroom textbook-based activities and teacher rubrics for the Malaysian curriculum.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const output = response.choices[0].message.content;

    const match = output.match(
      /```html\s*<!-- STUDENT ACTIVITY -->\s*(.*?)\s*```[\s\n]*```html\s*<!-- TEACHER RUBRIC -->\s*(.*?)\s*```/s
    );

    if (!match || match.length < 3) {
      return res.status(500).json({
        success: false,
        message: "OpenAI output did not contain both HTML blocks.",
        raw: output,
      });
    }

    const studentHtml = match[1].trim();
    const rubricHtml = match[2].trim();

    res
      .status(200)
      .json(standardizeAssessmentResponse(studentHtml, rubricHtml));
  } catch (err) {
    console.error("Error generating textbook activity:", err);
    res.status(500).json({
      success: false,
      message: "OpenAI API error",
    });
  }
};

// Generate Assessment (Exam/Test) based on lesson plan data
const generateAssessment = async (req, res) => {
  const {
    contentStandard,
    learningStandard,
    learningOutline,
    lesson,
    subject,
    theme,
    topic,
    assessmentType,
    questionTypes,
    numberOfQuestions,
    timeAllocation,
    additionalRequirement,
  } = req.body;

  const prompt = `
# Identity

You are an AI assistant that creates comprehensive English assessments (exams/tests) and marking rubrics based on Malaysian KSSM curriculum lesson plans.

# Instructions

You must return exactly two blocks of HTML content:

1. 📝 Student Assessment Paper (Styled HTML)
2. 🧑‍🏫 Teacher Answer Key & Rubric (Styled HTML)

# Assessment Configuration

- Assessment Type: ${assessmentType}
- Question Types: ${
    Array.isArray(questionTypes) ? questionTypes.join(", ") : questionTypes
  }
- Number of Questions: ${numberOfQuestions || 20}
- Time Allocation: ${timeAllocation || "60 minutes"}

# Lesson Data

{
  "lesson": "${lesson}",
  "subject": "${subject}",
  "theme": "${theme}",
  "topic": "${topic}",
  "contentStandard": {
    "main": "${contentStandard.main}",
    "component": "${contentStandard.component}"
  },
  "learningStandard": {
    "main": "${learningStandard.main}",
    "component": "${learningStandard.component}"
  },
  "learningOutline": {
    "pre": "${learningOutline.pre}",
    "during": "${learningOutline.during}",
    "post": "${learningOutline.post}"
  },
  "activityType": "assessment",
  "numberOfQuestions": ${numberOfQuestions || 20},
  "timeAllocation": "${timeAllocation || "60 minutes"}",
  "additionalRequirement": "${additionalRequirement}"
}

## Student Assessment Paper Guidelines:
- Include assessment header with subject, class, time, and instructions
- Generate ${
    numberOfQuestions || 20
  } questions based on the specified question types
- Include clear numbering and proper spacing for answers
- Add student information section (Name, Class, Date)
- Include marking scheme summary at the end

## Teacher Answer Key & Rubric Guidelines:
- Provide comprehensive answer key for all questions
- Include marking scheme with point allocation
- Add assessment rubric with grading criteria
- Include suggested time allocation per section
- Provide additional notes for markers

# Output Format

1. Begin your response with \`\`\`html\n<!-- STUDENT ASSESSMENT -->\n<html>...</html>\n\`\`\`
2. Then add a second HTML block: \`\`\`html\n<!-- TEACHER ANSWER KEY -->\n<html>...</html>\n\`\`\`

Generate a comprehensive ${assessmentType} assessment that thoroughly evaluates the lesson objectives.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You generate comprehensive HTML assessments and answer keys for English language evaluation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const output = response.choices[0].message.content;

    const match = output.match(
      /```html\s*<!-- STUDENT ASSESSMENT -->\s*(.*?)\s*```[\s\n]*```html\s*<!-- TEACHER ANSWER KEY -->\s*(.*?)\s*```/s
    );

    if (!match || match.length < 3) {
      return res.status(500).json({
        success: false,
        message: "OpenAI output did not contain both HTML blocks.",
        raw: output,
      });
    }

    const assessmentHtml = match[1].trim();
    const answerKeyHtml = match[2].trim();

    res
      .status(200)
      .json(standardizeAssessmentResponse(studentHtml, rubricHtml));
  } catch (err) {
    console.error("Error generating assessment:", err);
    res.status(500).json({
      success: false,
      message: "OpenAI API error",
    });
  }
};

// Unified function to generate assessments based on lesson plan data
const generateFromLessonPlan = async (req, res) => {
  try {
    const {
      lessonPlanId,
      classId,
      lesson,
      subject,
      theme,
      topic,
      grade,
      contentStandard,
      learningStandard,
      learningOutline,
      assessmentTitle,
      assessmentDescription,
      activityType,
      ...activityData
    } = req.body;

    // Validate required fields
    if (!lessonPlanId || !classId || !lesson || !activityType) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: lessonPlanId, classId, lesson, activityType",
      });
    }

    let generatedContent;

    // Route to appropriate generation function based on activity type
    switch (activityType) {
      case "activityInClass":
      case "activity":
        generatedContent = await generateActivityContent({
          contentStandard,
          learningStandard,
          learningOutline,
          lesson,
          subject,
          theme,
          topic,
          activityType: "activityInClass",
          ...activityData,
        });
        break;

      case "essay":
        generatedContent = await generateEssayContent({
          contentStandard,
          learningStandard,
          learningOutline,
          lesson,
          subject,
          theme,
          topic,
          ...activityData,
        });
        break;

      case "textbook":
        generatedContent = await generateTextbookContent({
          contentStandard,
          learningStandard,
          learningOutline,
          lesson,
          subject,
          theme,
          topic,
          ...activityData,
        });
        break;

      case "assessment":
        generatedContent = await generateAssessmentContent({
          contentStandard,
          learningStandard,
          learningOutline,
          lesson,
          subject,
          theme,
          topic,
          ...activityData,
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown activity type: ${activityType}`,
        });
    }

    // Save assessment to database
    const assessment = await Assessment.create({
      title: assessmentTitle || `${lesson} - ${activityType}`,
      description:
        assessmentDescription || `Generated ${activityType} assessment`,
      createdBy: req.user.id,
      lessonPlanId,
      classId,
      activityType,
      assessmentType: `${activityType
        .charAt(0)
        .toUpperCase()}${activityType.slice(1)} Assessment`,
      questionCount: activityData.numberOfQuestions || 20,
      duration:
        activityData.timeAllocation || activityData.duration || "60 minutes",
      difficulty: "Intermediate",
      skills: [],
      generatedContent,
      lessonPlanSnapshot: {
        title: lesson,
        subject,
        grade,
        contentStandard,
        learningStandard,
        learningOutline,
      },
      status: "Generated",
      hasActivity: !!(
        generatedContent.activityHTML || generatedContent.assessmentHTML
      ),
      hasRubric: !!(
        generatedContent.rubricHTML || generatedContent.answerKeyHTML
      ),
    });

    res.status(201).json({
      success: true,
      message: `${activityType} assessment generated and saved successfully`,
      data: assessment,
      generatedContent,
    });
  } catch (error) {
    console.error("Error in generateFromLessonPlan:", error);
    res.status(500).json({
      success: false,
      message: "Error generating assessment from lesson plan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper functions for different assessment types
const generateActivityContent = async (data) => {
  // Simulate the generateActivityAndRubric logic but return the content
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You generate HTML student activities and teacher rubrics for classroom assessments.",
      },
      {
        role: "user",
        content: buildActivityPrompt(data),
      },
    ],
  });

  const output = response.choices[0].message.content;
  const match = output.match(
    /```html\s*<!-- STUDENT ACTIVITY -->\s*(.*?)\s*```[\s\n]*```html\s*<!-- TEACHER RUBRIC -->\s*(.*?)\s*```/s
  );

  if (!match || match.length < 3) {
    throw new Error("Invalid response format from AI");
  }

  return {
    activityHTML: match[1].trim(),
    rubricHTML: match[2].trim(),
  };
};

const generateEssayContent = async (data) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You generate HTML student activities and teacher rubrics for KSSM English essay assessments.",
      },
      {
        role: "user",
        content: buildEssayPrompt(data),
      },
    ],
  });

  const output = response.choices[0].message.content;
  const match = output.match(
    /```html\s*<!-- STUDENT ACTIVITY -->\s*(.*?)\s*```[\s\n]*```html\s*<!-- TEACHER RUBRIC -->\s*(.*?)\s*```/s
  );

  if (!match || match.length < 3) {
    throw new Error("Invalid response format from AI");
  }

  return {
    activityHTML: match[1].trim(),
    rubricHTML: match[2].trim(),
  };
};

const generateTextbookContent = async (data) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You generate HTML classroom textbook-based activities and teacher rubrics for the Malaysian curriculum.",
      },
      {
        role: "user",
        content: buildTextbookPrompt(data),
      },
    ],
  });

  const output = response.choices[0].message.content;
  const match = output.match(
    /```html\s*<!-- STUDENT ACTIVITY -->\s*(.*?)\s*```[\s\n]*```html\s*<!-- TEACHER RUBRIC -->\s*(.*?)\s*```/s
  );

  if (!match || match.length < 3) {
    throw new Error("Invalid response format from AI");
  }

  return {
    activityHTML: match[1].trim(),
    rubricHTML: match[2].trim(),
  };
};

const generateAssessmentContent = async (data) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You generate comprehensive HTML assessments and answer keys for English language evaluation.",
      },
      {
        role: "user",
        content: buildAssessmentPrompt(data),
      },
    ],
  });

  const output = response.choices[0].message.content;
  const match = output.match(
    /```html\s*<!-- STUDENT ASSESSMENT -->\s*(.*?)\s*```[\s\n]*```html\s*<!-- TEACHER ANSWER KEY -->\s*(.*?)\s*```/s
  );

  if (!match || match.length < 3) {
    throw new Error("Invalid response format from AI");
  }

  return {
    assessmentHTML: match[1].trim(),
    answerKeyHTML: match[2].trim(),
  };
};



const saveAssessment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const {
      title,
      description,
      lessonPlanId,
      classId,
      activityType,
      assessmentType,
      questionCount,
      duration,
      difficulty,
      skills,
      generatedContent,
      lessonPlanSnapshot,
      tags,
      notes,
    } = req.body;

    // Validation
    if (!title || !lessonPlanId || !classId || !activityType) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: title, lessonPlanId, classId, activityType",
      });
    }

    // Create assessment
    const assessment = await Assessment.create({
      title,
      description,
      createdBy: req.user.id,
      lessonPlanId,
      classId,
      activityType,
      assessmentType: assessmentType || "General Assessment",
      questionCount: questionCount || 20,
      duration: duration || "60 minutes",
      difficulty: difficulty || "Intermediate",
      skills: skills || [],
      generatedContent: generatedContent || {},
      lessonPlanSnapshot: lessonPlanSnapshot || {},
      tags: tags || [],
      notes: notes || "",
      status: generatedContent ? "Generated" : "Draft",
      hasActivity: !!(generatedContent && generatedContent.activityHTML),
      hasRubric: !!(generatedContent && generatedContent.rubricHTML),
    });

    // Populate the response
    const populatedAssessment = await Assessment.findById(assessment._id)
      .populate("lessonPlanId", "parameters plan")
      .populate("classId", "className grade subject")
      .populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Assessment saved successfully",
      data: populatedAssessment,
    });
  } catch (error) {
    console.error("Save assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Error saving assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get user's assessments with filtering
 * @route   GET /api/assessment/my-assessments
 * @access  Private
 */
const getUserAssessments = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const {
      page = 1,
      limit = 10,
      classId,
      activityType,
      status,
      search,
    } = req.query;

    // Build filter object
    const filter = { createdBy: req.user.id };

    if (classId) filter.classId = classId;
    if (activityType) filter.activityType = activityType;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { assessmentType: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const assessments = await Assessment.find(filter)
      .populate({
        path: "lessonPlanId",
        select: "parameters plan",
      })
      .populate({
        path: "classId",
        select: "className grade subject year",
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assessment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: assessments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: assessments,
    });
  } catch (error) {
    console.error("Get user assessments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assessments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get assessment by ID
 * @route   GET /api/assessment/:id
 * @access  Private
 */
const getAssessmentById = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const assessment = await Assessment.findById(req.params.id)
      .populate({
        path: "lessonPlanId",
        select: "parameters plan",
      })
      .populate({
        path: "classId",
        select: "className grade subject year",
      })
      .populate({
        path: "createdBy",
        select: "name",
      });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Check if user owns this assessment
    if (assessment.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this assessment",
      });
    }

    res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error("Get assessment by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete assessment
 * @route   DELETE /api/assessment/:id
 * @access  Private
 */
const deleteAssessment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Check if user owns this assessment
    if (assessment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this assessment",
      });
    }

    await assessment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Assessment deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Delete assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update assessment status and generated content
 * @route   PUT /api/assessment/:id
 * @access  Private
 */
const updateAssessment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. User not found in request.",
      });
    }

    const {
      title,
      description,
      generatedContent,
      status,
      hasActivity,
      hasRubric,
      notes,
      tags,
    } = req.body;

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    // Check if user owns this assessment
    if (assessment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assessment",
      });
    }

    // Update fields
    if (title) assessment.title = title;
    if (description) assessment.description = description;
    if (generatedContent) assessment.generatedContent = generatedContent;
    if (status) assessment.status = status;
    if (hasActivity !== undefined) assessment.hasActivity = hasActivity;
    if (hasRubric !== undefined) assessment.hasRubric = hasRubric;
    if (notes) assessment.notes = notes;
    if (tags) assessment.tags = tags;

    // Update usage tracking
    assessment.usageCount += 1;
    assessment.lastUsed = new Date();

    await assessment.save();

    // Return populated assessment
    const updatedAssessment = await Assessment.findById(assessment._id)
      .populate("lessonPlanId", "parameters plan")
      .populate("classId", "className grade subject")
      .populate("createdBy", "name");

    res.status(200).json({
      success: true,
      message: "Assessment updated successfully",
      data: updatedAssessment,
    });
  } catch (error) {
    console.error("Update assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating assessment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  generateActivityAndRubric,
  generateEssayAssessment,
  generateTextbookActivity,
  generateAssessment,
  generateFromLessonPlan,
  fullLessonPlanner,
  saveAssessment,
  getUserAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
};
