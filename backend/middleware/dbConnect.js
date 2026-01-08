const connectDB = require('../utils/db');

const dbConnectMiddleware = async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database connection error in middleware:", error);
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
        });
    }
};

module.exports = dbConnectMiddleware;
