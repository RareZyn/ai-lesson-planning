const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, 'Please add a class name'],
    trim: true,
    maxlength: [50, 'Class name cannot exceed 50 characters'],
    unique: true
  },
  grade:{
    type: String,
    required: [true, 'Please add a grade'],
    enum: {
      values: ['Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6','Form 1', 'Form 2', 'Form 3', 'Form 4','Form 5'],
      message: 'Please select a valid grade'
    }
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    enum: {
      values: ['English', 'Mathematics', 'Science', 'History', 'Geography'],
      message: 'Please select a valid subject'
    }
  },
  year: {
    type: String,
    required: [true, 'Please add a year'],
    enum: {
      values: ['2023', '2024', '2025', '2026'],
      message: 'Please select a valid year'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent duplicate classes
classSchema.index({ className: 1, year: 1 }, { unique: true });

// Reverse populate with virtuals
classSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'class',
  justOne: false
});

module.exports = mongoose.model('Class', classSchema);