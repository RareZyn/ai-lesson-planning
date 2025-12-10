const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["pdf", "docx", "link", "txt"],
        default: "pdf",
    },
    content: {
        type: String,
        required: false,
        default: "Content stored as Base64/Link."
    },
    originalFileUrl: {
        type: String, // Stores the Base64 Data URI (for files) or URL (for links)
        required: false,
        select: false, // Don't return by default to lighten payload
    },
    size: {
        type: String,
        default: "0 KB",
    },
    status: {
        type: String,
        enum: ["ready", "error"], // 'processing' removed as upload is now synchronous storage
        default: "ready",
    },
    uploadDate: {
        type: Date,
        default: Date.now,
    },
    metadata: {
        type: Object,
        default: {},
    },
});

module.exports = mongoose.model("Material", materialSchema);
