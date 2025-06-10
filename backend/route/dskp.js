// routes/dskp.js
const express = require("express");
const { body } = require("express-validator");
const {
  uploadEnglishKSSM,
  uploadSingleForm,
  getAllSubjects,
  getSubjectData,
  getFormData,
  deleteSubject,
} = require("../controller/dskpController");

const router = express.Router();

// Validation rules
const uploadEnglishKSSMValidation = [
  body("forms")
    .isArray({ min: 1 })
    .withMessage("Forms must be an array with at least one item"),
  body("forms.*.form")
    .isIn(["form1", "form2", "form3", "form4", "form5"])
    .withMessage("Form must be one of: form1, form2, form3, form4, form5"),
  body("forms.*.skills")
    .isArray({ min: 1 })
    .withMessage("Skills must be an array with at least one item"),
];

const uploadSingleFormValidation = [
  body("subject")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Subject must be between 2 and 50 characters"),
  body("form")
    .isIn(["form1", "form2", "form3", "form4", "form5"])
    .withMessage("Form must be one of: form1, form2, form3, form4, form5"),
  body("skills")
    .isArray({ min: 1 })
    .withMessage("Skills must be an array with at least one item"),
];

// All routes are now public
router.get("/subjects", getAllSubjects);
router.get("/subject/:subject", getSubjectData);
router.get("/subject/:subject/form/:form", getFormData);

router.post(
  "/upload-english-kssm",
  uploadEnglishKSSMValidation,
  uploadEnglishKSSM
);
router.post("/upload-form", uploadSingleFormValidation, uploadSingleForm);
router.delete("/subject/:subject", deleteSubject);

module.exports = router;
