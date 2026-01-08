const express = require("express");
const { uploadMaterial, getMaterials, deleteMaterial, updateMaterial, getMaterial } = require("../controller/materialController");
const { protect, checkPermission } = require("../middleware/auth");
const { PERMISSIONS } = require("../config/permissions");

const router = express.Router();

router.post("/upload", protect, checkPermission(PERMISSIONS.MATERIAL_CREATE), uploadMaterial);
router.get("/", protect, checkPermission(PERMISSIONS.MATERIAL_READ), getMaterials);
router.get("/:id", protect, checkPermission(PERMISSIONS.MATERIAL_READ), getMaterial);
router.put("/:id", protect, checkPermission(PERMISSIONS.MATERIAL_CREATE), updateMaterial); // Assuming update is a create-like permission for now
router.delete("/:id", protect, checkPermission(PERMISSIONS.MATERIAL_DELETE), deleteMaterial);

module.exports = router;
