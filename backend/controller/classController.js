const Class = require('../model/Class');

const getClasses = async (req, res) => {
    const { year, subject } = req.query;
    const userId = req.user.id;
    const query = { createdBy: userId };

    if (year) query.year = year;
    if (subject) query.subject = subject;

    try {
        const classes = await Class.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: classes.length,
            data: classes
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

const getClassById = async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);

        if (!cls) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        res.status(200).json({
            success: true,
            data: cls
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

const createClass = async (req, res) => {
    const { className, grade, subject, year } = req.body;
    const userId = req.user.id;

    try {
        const newClass = await Class.create({
            className,
            grade,
            subject,
            year,
            createdBy: userId
        });

        return res.status(201).json({
            success: true,
            data: newClass
        });

    } catch (err) {
        console.error('Error creating class:', err);

        // Duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Class already exists'
            });
        }

        // Mongoose validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

const updateClass = async (req, res) => {
    try {
        const cls = await Class.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!cls) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        res.status(200).json({
            success: true,
            data: cls
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Server Error'
            });
        }
    }
};

const deleteClass = async (req, res) => {
    try {
        const cls = await Class.findByIdAndDelete(req.params.id);

        if (!cls) {
            return res.status(404).json({
                success: false,
                error: 'Class not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

const getClassesByYear = async (req, res) => {
    try {
        const classes = await Class.find({ year: req.params.year });

        res.status(200).json({
            success: true,
            count: classes.length,
            data: classes
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

const getClassesBySubject = async (req, res) => {
    try {
        const classes = await Class.find({ subject: req.params.subject });

        res.status(200).json({
            success: true,
            count: classes.length,
            data: classes
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

/**
 * @desc    Get the 5 most recently updated classes for the logged-in user
 * @route   GET /api/classes/recent
 * @access  Private
 */
const getRecentClasses = async (req, res, next) => {
    try {
        const recentClasses = await Class.find({ createdBy: req.user.id })
            .sort({ updatedAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: recentClasses
        });
    } catch (error) {
        console.error("Error fetching recent classes:", error);
        next(error);
    }
};

module.exports = {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
    getClassesByYear,
    getClassesBySubject,
    getRecentClasses
};
