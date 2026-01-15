const { GoogleGenerativeAI } = require("@google/generative-ai");
const LessonPlan = require("../model/Lesson");
const Material = require("../model/Material");
const Syllabus = require("../model/Syllabus");
const User = require("../model/User");
const { analyzeTeacherPatterns, predictNextLessonDate } = require("./patternAnalysisService");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Suggestion Generator Service
 * Uses Google Gemini AI to generate smart lesson planning suggestions
 */

/**
 * Generate AI-powered lesson planning suggestions
 * @param {string} userId - The teacher's user ID
 * @param {string} classId - The class ID
 * @param {Object} classData - Class information (subject, grade, etc.)
 * @returns {Object} AI-generated suggestions
 */
async function generateSmartSuggestions(userId, classId, classData) {
    try {
        // Step 1: Gather context
        const context = await gatherContext(userId, classId, classData);

        // Step 2: Analyze patterns
        const patterns = await analyzeTeacherPatterns(userId, classId, 30);

        if (!patterns.hasData) {
            return {
                success: false,
                message: "Not enough lesson history. Create a few lessons first!",
                suggestions: null,
                patterns: null,
            };
        }

        // Step 3: Generate AI suggestions
        const suggestions = await generateAISuggestions(context, patterns);

        return {
            success: true,
            suggestions,
            patterns: {
                preferredDays: patterns.patterns.preferredDays.counts,
                mostPreferredDay: patterns.patterns.preferredDays.mostPreferred,
                avgGapDays: patterns.patterns.averageGapDays,
                confidence: patterns.confidence,
            },
        };
    } catch (error) {
        console.error("Error generating smart suggestions:", error);
        throw error;
    }
}

/**
 * Gather all necessary context for AI suggestions
 * @param {string} userId - The teacher's user ID
 * @param {string} classId - The class ID
 * @param {Object} classData - Class information
 * @returns {Object} Context data
 */
async function gatherContext(userId, classId, classData) {
    // Get recent lessons for this class
    const recentLessons = await LessonPlan.find({
        createdBy: userId,
        classId: classId,
    })
        .sort({ lessonDate: -1, createdAt: -1 })
        .limit(10)
        .select("parameters.specificTopic parameters.sow parameters.activityType lessonDate createdAt");

    // Get teacher's available materials
    const materials = await Material.find({ user: userId })
        .select("name type")
        .limit(20);

    // Get available Syllabus topics for this subject/grade
    let syllabusData = [];
    try {
        const user = await User.findById(userId);
        if (user && user.schoolId) {
            const syllabusDoc = await Syllabus.findOne({
                schoolId: user.schoolId,
                subject: classData.subject,
                grade: classData.grade,
            });

            if (syllabusDoc && syllabusDoc.syllabus) {
                syllabusData = syllabusDoc.syllabus;
            }
        }
    } catch (error) {
        console.log("No Syllabus data found, continuing without it");
    }

    return {
        classData,
        recentLessons,
        materials,
        syllabusData,
        currentDate: new Date(),
    };
}

/**
 * Generate AI suggestions using Google Gemini
 * @param {Object} context - Gathered context data
 * @param {Object} patterns - Pattern analysis results
 * @returns {Object} AI-generated suggestions
 */
async function generateAISuggestions(context, patterns) {
    const prompt = buildAIPrompt(context, patterns);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON response
        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const suggestions = JSON.parse(cleanedText);

        return suggestions;
    } catch (error) {
        console.error("Error calling Gemini AI:", error);
        console.log(error)
        // Fallback to rule-based suggestions if AI fails
        return generateFallbackSuggestions(context, patterns);
    }
}

/**
 * Build the AI prompt for suggestion generation
 * @param {Object} context - Context data
 * @param {Object} patterns - Pattern analysis
 * @returns {string} AI prompt
 */
function buildAIPrompt(context, patterns) {
    const { classData, recentLessons, materials, syllabusData } = context;
    const { preferredDays, activityByDay, averageGapDays } = patterns.patterns;

    const recentTopics = recentLessons
        .map((l) => l.parameters?.specificTopic || "Unknown")
        .slice(0, 5)
        .join(", ");

    const materialNames = materials.map((m) => `${m.name} (${m.type})`).join(", ");

    const preferredDay = preferredDays.mostPreferred || "Wednesday";
    const avgGap = averageGapDays || 3;

    // Prepare syllabus context
    let syllabusContext = "- No syllabus data available";
    if (syllabusData && syllabusData.length > 0) {
        // Provide the structure by showing the first item's keys
        const sampleKeys = Object.keys(syllabusData[0]).join(", ");

        // Pass the actual data (first 50 items to avoid excessive tokens, 
        // or simplistic logic. Ideally we should find where we are, but AI can do that if we pass enough)
        // Let's pass the whole thing if < 50 items, else slice it? 
        // A syllabus might be long. Let's try to pass the whole thing formatted as JSON.
        // If it's too huge, Gemini 2.0 Flash should handle it (1M context window).
        syllabusContext = JSON.stringify(syllabusData, null, 2);
    }

    const prompt = `You are an AI teaching assistant helping a teacher plan their next lesson.

**Teacher's Class Information:**
- Subject: ${classData.subject}
- Grade: ${classData.grade}

**Teacher's Pattern Analysis:**
- Preferred teaching day: ${preferredDay} (${preferredDays.mostPreferredCount} times)
- Average gap between lessons: ${avgGap} days
- Recent topics covered in lessons: ${recentTopics}

**Available Resources:**
- Teacher's materials: ${materialNames || "None uploaded yet"}

**Course Syllabus (User Uploaded - Dynamic Structure):**
${syllabusContext}

**Recent Lesson Topics (Last 5):**
${recentLessons.slice(0, 5).map((l, i) => `${i + 1}. ${l.parameters?.specificTopic || "Unknown"} (${new Date(l.lessonDate).toLocaleDateString()})`).join("\n")}

**Task:** Based on the teacher's recent topics and the provided Syllabus, suggest the NEXT lesson plan details.

**Instructions:**
1. **Analyze the Syllabus Structure:** The syllabus is a list of items with variable fields (it might use 'Topic', 'Theme', 'Content Standard', etc.). Understand the progression.
2. **Find Current Position:** Look at the "Recent Lesson Topics" and try to find where they fit in the Syllabus.
3. **Suggest Next Topic:** Select the logically NEXT item from the Syllabus.
4. **Suggest Date & Activity:** Based on teacher patterns.
5. **Suggest Resources:** From the available materials.

**IMPORTANT:** Return ONLY valid JSON with this exact structure:
{
  "sowTopic": {
    "title": "The exact topic/title from the syllabus item",
    "rationale": "Why this topic is next (Relate to syllabus progression)"
  },
  "suggestedDate": {
    "date": "YYYY-MM-DD format",
    "dayOfWeek": "Day name",
    "rationale": "Why this date"
  },
  "activityType": {
    "type": "reading/writing/activity/assessment",
    "rationale": "Why this activity type"
  },
  "resources": [
    {
      "name": "Resource name",
      "type": "uploaded",
      "reason": "Why this match"
    }
  ]
}

Return ONLY the JSON object.`;

    return prompt;
}

/**
 * Generate fallback suggestions using rule-based logic
 * @param {Object} context - Context data
 * @param {Object} patterns - Pattern analysis
 * @returns {Object} Fallback suggestions
 */
function generateFallbackSuggestions(context, patterns) {
    const { classData, recentLessons, materials, syllabusData } = context;
    const predictedDate = predictNextLessonDate(patterns.patterns);
    const preferredDay = patterns.patterns.preferredDays.mostPreferred || "Wednesday";

    // Simple rule-based suggestions
    const lastTopics = recentLessons.slice(0, 3).map(l => l.parameters?.specificTopic);
    let nextTopic = `Next topic after ${lastTopics[0] || "previous lesson"}`;

    // Try to find next topic from syllabus if possible
    if (syllabusData && syllabusData.length > 0 && lastTopics.length > 0) {
        // Very naive search - just take the first random one if we can't match
        // A better heuristic would be hard without AI
        // Let's just suggest the first item of the syllabus if we have no better clue
        if (syllabusData[0].Topic) nextTopic = syllabusData[0].Topic;
        else if (syllabusData[0].Title) nextTopic = syllabusData[0].Title;
        // else keep default
    }

    return {
        sowTopic: {
            title: nextTopic,
            rationale: "Suggested based on your recent lesson progression",
        },
        suggestedDate: {
            date: predictedDate.toISOString().split("T")[0],
            dayOfWeek: preferredDay,
            rationale: `Based on your ${preferredDay} pattern and ${patterns.patterns.averageGapDays || 3}-day average gap`,
        },
        activityType: {
            type: "reading",
            rationale: "General suggestion based on grade level",
        },
        resources: materials.slice(0, 2).map(m => ({
            name: m.name,
            type: "uploaded",
            reason: "Available in your material library",
        })),
    };
}

/**
 * Match resources based on lesson topic and type
 * @param {string} userId - Teacher's user ID
 * @param {string} lessonTopic - Topic of the lesson
 * @param {string} activityType - Type of activity
 * @returns {Array} Matched resources
 */
async function matchResources(userId, lessonTopic, activityType) {
    try {
        const materials = await Material.find({ user: userId });

        // Simple keyword matching
        const keywords = lessonTopic.toLowerCase().split(" ");

        const scoredMaterials = materials.map((material) => {
            let score = 0;
            const materialNameLower = material.name.toLowerCase();

            // Match by keywords in name
            keywords.forEach((keyword) => {
                if (materialNameLower.includes(keyword)) {
                    score += 2;
                }
            });

            // Match by file type
            if (activityType === "reading" && material.type === "pdf") score += 1;
            if (activityType === "essay" && material.type === "docx") score += 1;

            return { material, score };
        });

        // Sort by score and return top 3
        return scoredMaterials
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .filter((m) => m.score > 0)
            .map((m) => ({
                name: m.material.name,
                type: "uploaded",
                reason: "Matches lesson topic keywords",
            }));
    } catch (error) {
        console.error("Error matching resources:", error);
        return [];
    }
}

module.exports = {
    generateSmartSuggestions,
    matchResources,
};
