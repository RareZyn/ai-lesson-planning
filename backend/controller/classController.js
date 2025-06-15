const Class = require('../model/Class');
const LessonPlan = require('../model/lesson');

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

/**
 * @desc    Update a class
 * @route   PUT /api/classes/:id
 * @access  Private
 */
const updateClass = async (req, res, next) => {
    try {
        let classInfo = await Class.findById(req.params.id);

        if (!classInfo) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }

        if (classInfo.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this class' });
        }
        // --- END OF FIX ---

        // Find the class by its ID and update it with the data from the request body
        classInfo = await Class.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true // Run schema validators on the update
        });

        res.status(200).json({ success: true, data: classInfo });
    } catch (error) {
        console.error("Error updating class:", error);
        next(error);
    }
};

/**
 * @desc    Delete a class and all its associated lesson plans
 * @route   DELETE /api/classes/:id
 * @access  Private
 */
const deleteClass = async (req, res, next) => {
    try {
        let classInfo = await Class.findById(req.params.id);

        if (!classInfo) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }

        if (classInfo.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this class' });
        }
        // --- END OF FIX ---
        // **IMPORTANT**: Also delete all lesson plans associated with this class
        await LessonPlan.deleteMany({ classId: req.params.id });

        await classInfo.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
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
