
const sow = require('../model/Sow');

const createSow = async (req, res) => {
    try {
        // We now expect the request body to specify the 'form' and the 'lessonData'
        const { form, lessonData } = req.body;

        // --- Step 1: Validation ---
        if (!form || !lessonData) {
            return res.status(400).json({
                success: false,
                error: 'Please provide both "form" and "lessonData" in the request body.'
            });
        }

        // You can add more detailed validation for lessonData fields if needed
        if (!lessonData.lessonNo || !lessonData.focus) {
            return res.status(400).json({
                success: false,
                error: 'The "lessonData" object is missing required fields like "lessonNo" or "focus".'
            });
        }

        // --- Step 2: Find the document for the form and push the new lesson ---
        // This is the core "upsert" logic.
        const updatedSow = await sow.findOneAndUpdate(
            { form: form }, // The query to find the document (e.g., { form: "Form 5" })
            { $push: { lessons: lessonData } }, // The update operation: add the new lesson to the 'lessons' array
            {
                new: true,    // Option: Return the document *after* it has been updated
                upsert: true, // Option: If no document is found, create a new one
                runValidators: true // Option: Ensure the new lesson data adheres to the schema
            }
        );

        res.status(201).json({
            success: true,
            message: `Lesson ${lessonData.lessonNo} successfully added to ${form}.`,
            data: updatedSow
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
            error: 'Server Error'
        });
    }
};

const getSowByGrade = async (req, res) => {
    try {
        const { grade } = req.params;

        const sowByForm = await sow.findOne({ form: grade });

        if (!sowByForm) {
            return res.status(404).json({
                success: false,
                error: `No scheme of work found for ${grade}.`
            });
        }

        res.status(200).json({
            success: true,
            data: sowByForm
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
            error: 'Server Error'
        });
    }
}

module.exports = {
    createSow,
    getSowByGrade
};