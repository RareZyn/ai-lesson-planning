const mongoose = require("mongoose");

// Complete schema for lessons with all fields
const LessonSchema = new mongoose.Schema(
  {
    lessonNo: {
      type: Number,
      required: [true, "Lesson number is required"],
      min: 1,
    },
    focus: {
      type: String,
      required: [true, "Lesson focus is required"],
      trim: true,
    },
    theme: {
      type: String,
      trim: true,
      default: "",
    },
    topic: {
      type: String,
      trim: true,
      default: "",
    },
    contentStandard: {
      main: {
        type: String,
        trim: true,
        default: null,
      },
      comp: {
        type: String,
        trim: true,
        default: null,
      },
    },
    learningStandard: {
      main: {
        type: String,
        trim: true,
        default: null,
      },
      comp: {
        type: String,
        trim: true,
        default: null,
      },
    },
    learningOutline: {
      pre: {
        type: String,
        trim: true,
        default: "",
      },
      during: {
        type: String,
        trim: true,
        default: "",
      },
      post: {
        type: String,
        trim: true,
        default: "",
      },
    },
    differentiationStrategy: {
      type: String,
      trim: true,
      default: "",
    },
    cce: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    // This ensures that fields not defined in the schema are still saved
    strict: false,
  }
);

// The main schema for the Scheme of Work
const SowSchema = new mongoose.Schema(
  {
    form: {
      type: String,
      required: [true, "Form is required"],
      unique: true, // Ensures you only have one document per form
      trim: true,
    },
    lessons: [LessonSchema], // An array of lessons
  },
  {
    timestamps: true,
    // This allows the main document to accept fields not in the schema
    strict: false,
  }
);

// Create indexes for better query performance
SowSchema.index({ form: 1 });
SowSchema.index({ "lessons.lessonNo": 1 });

module.exports = mongoose.model("Sow", SowSchema);
