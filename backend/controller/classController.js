const Class = require('../model/Class');

// @desc    Get all classes with optional filtering
// @access  Private
const getClasses = async (req, res) => {
    try {
        const { year, subject } = req.query;
        const userId = req.user.id;
        const query = { createdBy: userId };

        if (year) query.year = year;
        if (subject) query.subject = subject;

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

// @desc    Get single class by ID
// @access  Public
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

// @desc    Create new class
// @access  Private (Admin/Teacher)
const createClass = async (req, res) => {
    try {
        const { className, grade, subject, year } = req.body;

        // Validate required fields
        if (!className || !grade || !subject || !year) {
            return res.status(400).json({
                success: false,
                error: 'Please provide className, grade, subject, and year'
            });
        }

        // Ensure user is authenticated
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized'
            });
        }

        // Create the new class
        const newClass = await Class.create({
            className,
            grade,
            subject,
            year,
            createdBy: req.user._id
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


// @desc    Update class
// @access  Private (Admin/Teacher)
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

// @desc    Delete class
// @access  Private (Admin)
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

// @desc    Get classes by year
// @access  Public
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

// @desc    Get classes by subject
// @access  Public
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

module.exports = {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
    getClassesByYear,
    getClassesBySubject
};