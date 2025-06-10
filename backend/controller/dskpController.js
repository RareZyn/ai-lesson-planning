// controllers/dskpController.js
const DSKP = require("../model/DSKP");

// @desc    Upload all English KSSM forms data
// @route   POST /api/dskp/upload-english-kssm
// @access  Public
const uploadEnglishKSSM = async (req, res) => {
  try {
    const { forms } = req.body;

    if (!forms || !Array.isArray(forms) || forms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Forms data is required and must be an array",
      });
    }

    // Validate that we have the expected forms
    const expectedForms = ["form1", "form2", "form3", "form4", "form5"];
    const providedForms = forms.map((f) => f.form);

    for (const form of providedForms) {
      if (!expectedForms.includes(form)) {
        return res.status(400).json({
          success: false,
          message: `Invalid form: ${form}. Expected one of: ${expectedForms.join(
            ", "
          )}`,
        });
      }
    }

    // Check if English KSSM already exists
    let englishDSKP = await DSKP.findBySubject("english");

    if (englishDSKP) {
      // Update existing English DSKP
      englishDSKP.forms = forms;
      await englishDSKP.save();
    } else {
      // Create new English DSKP
      englishDSKP = await DSKP.create({
        subject: "english",
        curriculum: "KSSM",
        forms: forms,
      });
    }

    res.status(201).json({
      success: true,
      message: "English KSSM data uploaded successfully",
      data: englishDSKP,
    });
  } catch (error) {
    console.error("Upload English KSSM error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during upload",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Upload single form data for a subject
// @route   POST /api/dskp/upload-form
// @access  Public
const uploadSingleForm = async (req, res) => {
  try {
    const { subject, form, skills } = req.body;

    if (!subject || !form || !skills) {
      return res.status(400).json({
        success: false,
        message: "Subject, form, and skills are required",
      });
    }

    // Validate form
    const validForms = ["form1", "form2", "form3", "form4", "form5"];
    if (!validForms.includes(form.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid form: ${form}. Expected one of: ${validForms.join(
          ", "
        )}`,
      });
    }

    // Find or create subject DSKP
    let dskp = await DSKP.findBySubject(subject);

    const formData = {
      form: form.toLowerCase(),
      skills: skills,
    };

    if (dskp) {
      // Update existing DSKP
      await dskp.addOrUpdateForm(formData);
      await dskp.save();
    } else {
      // Create new DSKP
      dskp = await DSKP.create({
        subject: subject.toLowerCase(),
        curriculum: "KSSM",
        forms: [formData],
      });
    }

    res.status(201).json({
      success: true,
      message: `${subject} ${form} data uploaded successfully`,
      data: dskp,
    });
  } catch (error) {
    console.error("Upload single form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during upload",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all subjects
// @route   GET /api/dskp/subjects
// @access  Public
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await DSKP.find(
      {},
      "subject curriculum createdAt updatedAt"
    ).sort({ subject: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    console.error("Get all subjects error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get specific subject data
// @route   GET /api/dskp/subject/:subject
// @access  Public
const getSubjectData = async (req, res) => {
  try {
    const { subject } = req.params;

    const dskp = await DSKP.findBySubject(subject);

    if (!dskp) {
      return res.status(404).json({
        success: false,
        message: `Subject '${subject}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: dskp,
    });
  } catch (error) {
    console.error("Get subject data error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get specific form data for a subject
// @route   GET /api/dskp/subject/:subject/form/:form
// @access  Public
const getFormData = async (req, res) => {
  try {
    const { subject, form } = req.params;

    const dskp = await DSKP.findBySubjectAndForm(subject, form);

    if (!dskp || !dskp.forms.length) {
      return res.status(404).json({
        success: false,
        message: `${subject} ${form} data not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        subject: dskp.subject,
        curriculum: dskp.curriculum,
        form: dskp.forms[0],
      },
    });
  } catch (error) {
    console.error("Get form data error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/dskp/subject/:subject
// @access  Public
const deleteSubject = async (req, res) => {
  try {
    const { subject } = req.params;

    const dskp = await DSKP.findBySubject(subject);

    if (!dskp) {
      return res.status(404).json({
        success: false,
        message: `Subject '${subject}' not found`,
      });
    }

    await DSKP.deleteOne({ _id: dskp._id });

    res.status(200).json({
      success: true,
      message: `Subject '${subject}' deleted successfully`,
    });
  } catch (error) {
    console.error("Delete subject error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  uploadEnglishKSSM,
  uploadSingleForm,
  getAllSubjects,
  getSubjectData,
  getFormData,
  deleteSubject,
};
