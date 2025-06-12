const mongoose = require('mongoose');

// This is the main schema for the entire lesson plan document
const LessonPlanSchema = new mongoose.Schema({
    // --- Link to other collections ---
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References your 'User' model
        required: true,
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class', // References your 'Class' model
        required: true
    },
    lessonDate: {
        type: Date,
        required: [true, 'Lesson date is required.']
    },
    
    // --- 1. Storing the parameters used for generation ---
    // This is your 'formData'
    parameters: {
        grade: { type: String, required: true },
        proficiencyLevel: { type: String, required: true },
        hotsFocus: { type: String, required: true },
        specificTopic: { type: String, required: true },
        additionalNotes: { type: String },
        sow: {
            // Storing a copy of the SOW lesson details
            lessonNo: { type: Number },
            focus: { type: String }
        }
    },

    // --- 2. Storing the AI-generated plan ---
    // This structure matches your example JSON exactly.
    generatedPlan: {
        learningObjective: {
            type: String,
            required: [true, 'A learning objective is required.'],
            trim: true
        },
        successCriteria: {
            type: [String], // An array of strings
            required: [true, 'Success criteria are required.']
        },
        activities: {
            // An object containing arrays of strings for each lesson stage
            preLesson: {
                type: [String],
                required: true
            },
            duringLesson: {
                type: [String],
                required: true
            },
            postLesson: {
                type: [String],
                required: true
            }
        },
        materials: {
            type: [String], // An array of strings
            required: true
        },

    },
}, { 
    // Mongoose options
    timestamps: true // Automatically adds createdAt and updatedAt fields
});


// Create the model from the schema and export it
module.exports = mongoose.model('LessonPlan', LessonPlanSchema);