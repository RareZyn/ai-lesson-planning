const mongoose = require('mongoose');

// This is the main schema for the entire lesson plan document
const LessonPlanSchema = new mongoose.Schema({
    // --- Core Relationships and Metadata ---

    // FIX 1: Renamed 'user' to 'createdBy' for clarity.
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Link to the user who created the plan
        required: true,
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class', // Link to the class this plan is for
        required: true,
    },
    lessonDate: {
        type: Date,
        required: [true, 'Lesson date is required.'],
        default: Date.now
    },

    // --- Parameters used to generate the plan ---
    parameters: {
        grade: { type: String, required: true },
        proficiencyLevel: { type: String, required: true },
        hotsFocus: { type: String, required: true },
        specificTopic: { type: String, required: true },
        activityType: { type: String },
        additionalNotes: { type: String },

        // FIX 2: The 'sow' object now stores a much more detailed snapshot.
        sow: {
            lessonNo: { type: Number},
            focus: { type: String},
            theme: { type: String},
            topic: { type: String },
            contentStandard: {
                main: { type: String },
                comp: { type: String }
            },
            learningStandard: {
                main: { type: String },
                comp: { type: String }
            },
            learningOutline: {
                pre: { type: String },
                during: { type: String },
                post: { type: String }
            },
            materials: [String],
            differentiationStrategy: { type: String },
            cce: [String] // Using 'cce' from your example
        }
    },
    plan: {
        learningObjective: {
            type: String,
            required: [true, 'A learning objective is required.'],
            trim: true
        },
        successCriteria: {
            type: [String],
            required: [true, 'Success criteria are required.']
        },
        activities: {
            preLesson: { type: [String], required: true },
            duringLesson: { type: [String], required: true },
            postLesson: { type: [String], required: true }
        }
    },
}, { 
    timestamps: true 
});

// Create the model from the schema and export it
module.exports = mongoose.model('LessonPlan', LessonPlanSchema);