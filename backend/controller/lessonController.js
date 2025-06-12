
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fs = require('fs');
const path = require('path');

exports.createLesson = async (req, res, next) => {
  try {
    const { classId, Sow, proficiencyLevel, hotsFocus, specificTopic, grade, additionalNotes } = req.body;

    if (!classId || !Sow || !proficiencyLevel || !hotsFocus || !specificTopic || !grade) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for lesson plan generation.",
      });
    }

    const prompt = `
    You are Malaysian teacher, you need to create a lesson plan for your class.
    Your class is a "${grade}" class.

      Lesson Context:
      - Class Proficiency Level: ${proficiencyLevel}
      - Scheme of Work (SOW) Lesson Number: ${Sow.lessonNo}
      - Focus Skill: ${Sow.focus}
      - Specific Topic/Theme: "${specificTopic}"
      - Higher Order Thinking Skill (HOTS) to integrate: ${hotsFocus}
      - Additional Notes from Teacher: ${additionalNotes || 'None'}

      Generate a structured lesson plan. The response MUST be a valid JSON object. Do not include any text, backticks, or the word "json" before or after the JSON object.

      The JSON object must have the following keys:
      - "learningObjective": A single, clear, measurable learning objective for the lesson.
      - "successCriteria": An array of 3-4 specific "I can..." statements that students can use to self-assess their success.
      - "activities": an object that content key preLesson, duringLesson, postLesson,.
      - "materials": An array of strings listing the materials needed for the lesson.
    `;

    // --- FIX 1: Use a valid model name ---
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // --- FIX 2: Robust JSON parsing ---
    let generatedPlan;
    try {
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      generatedPlan = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON. Raw text:", text);
      throw new Error("The AI response was not in a valid JSON format.");
    }
    
    // --- FIX 3: Send the parsed JSON data, not the raw response object ---
    res.status(200).json({
      success: true,
      data: generatedPlan,
    });

  } catch (error) {
    console.error("Gemini AI generation error:", error.message);
    // Send a more specific error message back to the client
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while generating the lesson plan.",
    });
  }
};

// @desc    Get all lessons
// @access  Private (Admin/Teacher)
exports.getLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find().populate('createdBy', 'name');
        return res.status(200).json({
            success: true,
            data: lessons
        });

    } catch (err) {
        console.error('Error getting lessons:', err);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Get single lesson by ID
// @access  Private (Admin/Teacher)
exports.getLessonById = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate('createdBy', 'name');
        if (!lesson) {
            return res.status(404).json({
                success: false,
                error: 'Lesson not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: lesson
        });

    } catch (err) {
        console.error('Error getting lesson:', err);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Update lesson
// @access  Private (Admin/Teacher)
exports.updateLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!lesson) {
            return res.status(404).json({
                success: false,
                error: 'Lesson not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: lesson
        });

    } catch (err) {
        console.error('Error updating lesson:', err);

        // Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Delete lesson
// @access  Private (Admin/Teacher)
exports.deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndRemove(req.params.id);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                error: 'Lesson not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {}
        });

    } catch (err) {
        console.error('Error deleting lesson:', err);
        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
