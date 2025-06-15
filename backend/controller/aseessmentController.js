const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  "activityType": "${activityType}"
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

    res.status(200).json({
      success: true,
      activityHTML: studentHtml,
      rubricHTML: rubricHtml,
    });
  } catch (err) {
    console.error("Error generating activity & rubric:", err);
    res.status(500).json({
      success: false,
      message: "OpenAI API error",
    });
  }
};

const generateEssayAssessment = async (req, res) => {
  const {
    contentStandard,
    learningStandard,
    learningOutline,
    lesson,
    subject,
    theme,
    topic,
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
- Provide a clear title and engaging prompt (e.g., “A Famous Person I Admire”)
- Include bullet points under instructions explaining what to write
- Add a large text box for the essay (at least 600px height)
- Include a note to students about tone, grammar, and proofreading

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
  "activityType": "essay"
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

    res.status(200).json({
      success: true,
      activityHTML: studentHtml,
      rubricHTML: rubricHtml,
    });
  } catch (err) {
    console.error("Error generating essay assessment:", err);
    res.status(500).json({
      success: false,
      message: "OpenAI API error",
    });
  }
}
  const generateTextbookActivity = async (req, res) => {
    const {
      contentStandard,
      learningStandard,
      learningOutline,
      lesson,
      subject,
      theme,
      topic,
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
    "activityType": "textbook"
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
  
      res.status(200).json({
        success: true,
        activityHTML: studentHtml,
        rubricHTML: rubricHtml,
      });
    } catch (err) {
      console.error("Error generating textbook activity:", err);
      res.status(500).json({
        success: false,
        message: "OpenAI API error",
      });
    }
  };

module.exports = {
  generateActivityAndRubric,
  fullLessonPlanner,
  generateEssayAssessment,
  generateTextbookActivity
};
