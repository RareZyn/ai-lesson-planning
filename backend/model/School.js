const mongoose = require("mongoose");

const SchoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a school name"],
      unique: true,
      trim: true,
    },
    address: String,
    contactEmail: String,
    phone: String,
    schoolType: {
      type: String,
      enum: ["KSSR", "KSSM"],
      required: true,
      default: "KSSM"
    },
    // Other school-specific details can go here
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("School", SchoolSchema);