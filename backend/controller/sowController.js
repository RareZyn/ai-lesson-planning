// backend/controller/sowController.js 
const sow = require("../model/Sow");

const createSow = async (req, res) => {
  try {
    // We now expect the request body to specify the 'form' and the 'lessonData'
    const { form, lessonData } = req.body;

    // --- Step 1: Validation ---
    if (!form || !lessonData) {
      return res.status(400).json({
        success: false,
        error:
          'Please provide both "form" and "lessonData" in the request body.',
      });
    }

    // You can add more detailed validation for lessonData fields if needed
    if (!lessonData.lessonNo || !lessonData.focus) {
      return res.status(400).json({
        success: false,
        error:
          'The "lessonData" object is missing required fields like "lessonNo" or "focus".',
      });
    }

    // --- Step 2: Find the document for the form and push the new lesson ---
    // This is the core "upsert" logic.
    const updatedSow = await sow.findOneAndUpdate(
      { form: form }, // The query to find the document (e.g., { form: "Form 5" })
      { $push: { lessons: lessonData } }, // The update operation: add the new lesson to the 'lessons' array
      {
        new: true, // Option: Return the document *after* it has been updated
        upsert: true, // Option: If no document is found, create a new one
        runValidators: true, // Option: Ensure the new lesson data adheres to the schema
      }
    );

    res.status(201).json({
      success: true,
      message: `Lesson ${lessonData.lessonNo} successfully added to ${form}.`,
      data: updatedSow,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      error: "Server Error",
    });
  }
};

// NEW: Batch upload controller
const createSowBatch = async (req, res) => {
  try {
    const { form, lessons } = req.body;

    // --- Step 1: Validation ---
    if (!form || !lessons) {
      return res.status(400).json({
        success: false,
        error:
          'Please provide both "form" and "lessons" array in the request body.',
      });
    }

    if (!Array.isArray(lessons) || lessons.length === 0) {
      return res.status(400).json({
        success: false,
        error: '"lessons" must be a non-empty array.',
      });
    }

    // Validate each lesson has required fields
    const invalidLessons = lessons.filter(
      (lesson, index) => !lesson.lessonNo || !lesson.focus
    );

    if (invalidLessons.length > 0) {
      return res.status(400).json({
        success: false,
        error:
          'Some lessons are missing required fields like "lessonNo" or "focus".',
        invalidLessons: invalidLessons,
      });
    }

    // Check for duplicate lessonNo in the input
    const lessonNumbers = lessons.map((l) => l.lessonNo);
    const uniqueLessonNumbers = [...new Set(lessonNumbers)];

    if (lessonNumbers.length !== uniqueLessonNumbers.length) {
      return res.status(400).json({
        success: false,
        error: "Duplicate lesson numbers found in the input.",
      });
    }

    // --- Step 2: Process each lesson ---
    let successCount = 0;
    let updateCount = 0;
    let errors = [];

    // First, find or create the SOW document for this form
    let sowDoc = await sow.findOne({ form: form });

    if (!sowDoc) {
      // Create new document if it doesn't exist
      sowDoc = await sow.create({ form: form, lessons: [] });
    }

    // Process each lesson
    for (const lessonData of lessons) {
      try {
        // Check if lesson with this lessonNo already exists
        const existingLessonIndex = sowDoc.lessons.findIndex(
          (lesson) => lesson.lessonNo === lessonData.lessonNo
        );

        if (existingLessonIndex !== -1) {
          // Update existing lesson
          sowDoc.lessons[existingLessonIndex] = lessonData;
          updateCount++;
        } else {
          // Add new lesson
          sowDoc.lessons.push(lessonData);
          successCount++;
        }
      } catch (error) {
        errors.push({
          lessonNo: lessonData.lessonNo,
          error: error.message,
        });
      }
    }

    // Sort lessons by lessonNo to maintain order
    sowDoc.lessons.sort((a, b) => a.lessonNo - b.lessonNo);

    // Save the updated document
    await sowDoc.save();

    res.status(201).json({
      success: true,
      message: `Batch upload completed for ${form}`,
      summary: {
        totalProcessed: lessons.length,
        newLessons: successCount,
        updatedLessons: updateCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
      totalLessonsInForm: sowDoc.lessons.length,
    });
  } catch (err) {
    console.error("Batch upload error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
      error: "Server Error",
    });
  }
};

const getSowByGrade = async (req, res) => {
  try {
    // Decode the URL parameter to handle spaces and special characters
    const grade = decodeURIComponent(req.params.grade);

    console.log(`Looking for SOW data for grade: "${grade}"`);

    const sowByForm = await sow.findOne({ form: grade });

    if (!sowByForm) {
      return res.status(404).json({
        success: false,
        error: `No scheme of work found for ${grade}.`,
      });
    }

    res.status(200).json({
      success: true,
      data: sowByForm,
    });
  } catch (err) {
    console.error("Error in getSowByGrade:", err);
    res.status(500).json({
      success: false,
      message: err.message,
      error: "Server Error",
    });
  }
};

module.exports = {
  createSow,
  createSowBatch,
  getSowByGrade,
};
