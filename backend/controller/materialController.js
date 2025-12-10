const Material = require("../model/Material");

/**

/**
 * @desc    Upload new material (extracts text using Gemini)
 * @route   POST /api/materials/upload
 * @access  Private
 */
exports.uploadMaterial = async (req, res) => {
    try {
        const { name, type, fileData, size } = req.body;
        const userId = req.user.id;

        if (!fileData && type !== "link") {
            return res.status(400).json({ success: false, message: "No file data provided." });
        }

        // Validate strictly for 10MB limit if it's a file
        // Base64 is ~33% larger than binary. 10MB binary ~= 13.3MB Base64.
        // Let's do a rough check on the string length. 10MB * 1.37 ~= 14MB char length.
        if (type !== "link" && fileData.length > 15 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: "File too large. Limit is 10MB." });
        }

        // Create record - NO OCR/AI EXTRACTION HERE
        const material = await Material.create({
            user: userId,
            name,
            type,
            size,
            status: "ready", // Immediately ready since we just store it
            originalFileUrl: fileData, // Store the Base64 string or Link URL
            content: "Content stored as Base64/Link. AI processing happens during lesson generation.", // Explicit placeholder
        });

        res.status(201).json({
            success: true,
            data: material,
            message: "Material uploaded successfully",
        });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to process material" });
    }
};

/**
 * @desc    Get all materials for user
 * @route   GET /api/materials
 * @access  Private
 */
exports.getMaterials = async (req, res) => {
    try {
        const materials = await Material.find({ user: req.user.id }).sort({ uploadDate: -1 });
        res.status(200).json({ success: true, data: materials });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch materials" });
    }
};

/**
 * @desc    Delete material
 * @route   DELETE /api/materials/:id
 * @access  Private
 */
exports.deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) return res.status(404).json({ success: false, message: "Material not found" });

        if (material.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        await material.deleteOne();
        res.status(200).json({ success: true, message: "Material deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete material" });
    }
};

/**
 * @desc    Update material (rename)
 * @route   PUT /api/materials/:id
 * @access  Private
 */
exports.updateMaterial = async (req, res) => {
    try {
        const { name } = req.body;
        let material = await Material.findById(req.params.id);

        if (!material) {
            return res.status(404).json({ success: false, message: "Material not found" });
        }

        // Check ownership
        if (material.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        material.name = name || material.name;
        await material.save();

        res.status(200).json({ success: true, data: material, message: "Material updated successfully" });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ success: false, message: "Failed to update material" });
    }
};

/**
 * @desc    Get single material (including content)
 * @route   GET /api/materials/:id
 * @access  Private
 */
exports.getMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id).select("+originalFileUrl");

        if (!material) {
            return res.status(404).json({ success: false, message: "Material not found" });
        }

        // Check ownership
        if (material.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        res.status(200).json({ success: true, data: material });
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch material" });
    }
};
