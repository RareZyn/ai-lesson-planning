// controllers/textbookController.js
const Textbook = require("../model/Textbook");

const uploadTopics = async (req, res) => {
  try {
    const data = req.body;

    const textbook = await Textbook.create(data);

    res.status(201).json({
      success: true,
      message: "Topics uploaded successfully",
      data: textbook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};

const getTopics = async (req, res) => {
  try {
    const { form } = req.params;

    const textbook = await Textbook.findOne();

    if (!textbook) {
      return res.status(404).json({
        success: false,
        message: "No textbook data found",
      });
    }

    // Convert form1 to "Form 1", form2 to "Form 2", etc.
    const formKey = `Form ${form.replace("form", "")}`;

    const topics = textbook[formKey]?.topics;

    if (!topics) {
      return res.status(404).json({
        success: false,
        message: `Topics for ${form} not found`,
      });
    }

    res.status(200).json({
      success: true,
      form: form,
      topics: topics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get topics",
      error: error.message,
    });
  }
};

module.exports = { uploadTopics, getTopics };
