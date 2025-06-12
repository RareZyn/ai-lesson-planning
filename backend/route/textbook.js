// routes/textbook.js
const express = require("express");
const { uploadTopics, getTopics } = require("../controller/textbookController");

const router = express.Router();

router.post("/upload", uploadTopics);
router.get("/:form", getTopics);

module.exports = router;
