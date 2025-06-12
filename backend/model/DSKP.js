// models/DSKP.js
const mongoose = require("mongoose");

// Learning Standard Schema
const learningStandardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Content Standard Schema
const contentStandardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    learning_standards: [learningStandardSchema],
  },
  { _id: false }
);

// Skill Schema
const skillSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
    },
    content_standards: [contentStandardSchema],
  },
  { _id: false }
);

// Form Data Schema
const formDataSchema = new mongoose.Schema(
  {
    form: {
      type: String,
      required: true,
      enum: ["form1", "form2", "form3", "form4", "form5"],
    },
    skills: [skillSchema],
  },
  { _id: false }
);

// Main DSKP Schema
const dskpSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      unique: true,
    },
    curriculum: {
      type: String,
      default: "KSSM",
    },
    forms: [formDataSchema],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
dskpSchema.index({ subject: 1, "forms.form": 1 });

// Static method to find subject data
dskpSchema.statics.findBySubject = function (subject) {
  return this.findOne({ subject: subject.toLowerCase() });
};

// Static method to find specific form data
dskpSchema.statics.findBySubjectAndForm = function (subject, form) {
  return this.findOne(
    { subject: subject.toLowerCase() },
    { forms: { $elemMatch: { form: form.toLowerCase() } } }
  );
};

// Instance method to add or update form data
dskpSchema.methods.addOrUpdateForm = function (formData) {
  const existingFormIndex = this.forms.findIndex(
    (f) => f.form === formData.form
  );

  if (existingFormIndex !== -1) {
    // Update existing form
    this.forms[existingFormIndex] = formData;
  } else {
    // Add new form
    this.forms.push(formData);
  }

  return this.save();
};

// Instance method to get all skills for a specific form
dskpSchema.methods.getSkillsByForm = function (form) {
  const formData = this.forms.find((f) => f.form === form.toLowerCase());
  return formData ? formData.skills : [];
};

module.exports = mongoose.model("DSKP", dskpSchema);
