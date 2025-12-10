const express = require("express");
const { uploadMaterial, getMaterials, deleteMaterial, updateMaterial, getMaterial } = require("../controller/materialController");
const { protect } = require("../middleware/auth"); // Assuming auth middleware exists

const router = express.Router();

router.post("/upload", protect, uploadMaterial);
router.get("/", protect, getMaterials);
router.get("/:id", protect, getMaterial); // Get single material with content
router.put("/:id", protect, updateMaterial);
router.delete("/:id", protect, deleteMaterial);

module.exports = router;
