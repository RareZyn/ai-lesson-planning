const mongoose = require("mongoose");

const SyllabusSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    syllabus: { type: Array, default: [] } // fully dynamic
  },
  { timestamps: true }
);

module.exports = mongoose.model("Syllabus", SyllabusSchema);
