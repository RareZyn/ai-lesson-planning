const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            enum: [
                "INVITE_TEACHER",
                "REVOKE_INVITE",
                "RESEND_INVITE",
                "REGISTER_TEACHER",
                "DELETE_TEACHER",
                "TOGGLE_TEACHER_STATUS",
                "UPDATE_TEACHER_ROLE",
                "LOGIN",
                "LOGOUT"
            ]
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            required: true
        },
        details: {
            type: mongoose.Schema.Types.Mixed // Flexible field for extra info
        },
        ipAddress: {
            type: String
        }
    },
    { timestamps: true }
);

// Index for efficient querying
auditLogSchema.index({ schoolId: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
