// models/Textbook.js
const mongoose = require("mongoose");

const textbookSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model("Textbook", textbookSchema);
