const mongoose = require('mongoose');

// It's good practice to define schemas for sub-documents (like lessons)
const LessonSchema = new mongoose.Schema({
    lessonNo: {
        type: Number,
        required: [true, 'Lesson number is required']
    },
    focus: {
        type: String,
        required: [true, 'Lesson focus is required'],
        trim: true
    },
    // Add other fields for your lesson here
    // e.g., objective: String, activities: [String], etc.
});

// The main schema for the Scheme of Work
const SowSchema = new mongoose.Schema({
    form: {
        type: String,
        required: [true, 'Form is required'],
        unique: true, // Ensures you only have one document per form, e.g., one "Form 5"
        trim: true
    },
    lessons: [LessonSchema] // An array of lessons, each following the LessonSchema
}, { timestamps: true });


// --- THIS IS THE MOST IMPORTANT PART ---
// You create the model AND export it in a single line.
// This ensures that any file requiring this module gets the Model,
// which has the .find(), .findOne(), etc. methods.
module.exports = mongoose.model('Sow', SowSchema);