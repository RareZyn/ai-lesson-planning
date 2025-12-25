const Lesson = require("../model/Lesson");
const Class = require("../model/Class");
const Material = require("../model/Material");
const Assessment = require("../model/Assessment");

/**
 * Global search across lessons, classes, materials, and assessments
 * @route GET /api/search
 * @access Private
 */
exports.globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.user._id;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const searchRegex = new RegExp(q, 'i');
        const results = [];

        // Search Lessons (limit 5)
        const lessons = await Lesson.find({
            createdBy: userId,
            $or: [
                { 'communityData.title': searchRegex },
                { 'parameters.specificTopic': searchRegex },
                { 'parameters.grade': searchRegex },
                { 'plan.learningObjective': searchRegex }
            ]
        })
            .limit(5)
            .select('communityData.title parameters.specificTopic parameters.grade _id')
            .populate('classId', 'subject');

        lessons.forEach(lesson => {
            const title = lesson.communityData?.title || lesson.parameters?.specificTopic || 'Untitled Lesson';
            const subject = lesson.classId?.subject || 'N/A';
            const grade = lesson.parameters?.grade || 'N/A';

            results.push({
                type: 'lesson',
                id: lesson._id,
                title: title,
                subtitle: `${subject} - Grade ${grade}`,
                path: `/app/lessons/${lesson._id}`
            });
        });

        // Search Classes (limit 5)
        const classes = await Class.find({
            createdBy: userId,
            $or: [
                { className: searchRegex },
                { subject: searchRegex },
                { grade: searchRegex }
            ]
        })
            .limit(5)
            .select('className subject grade _id');

        classes.forEach(cls => {
            results.push({
                type: 'class',
                id: cls._id,
                title: cls.className,
                subtitle: `${cls.subject} - ${cls.grade}`,
                path: `/app/classes`
            });
        });

        // Search Materials (limit 5)
        const materials = await Material.find({
            user: userId,
            name: searchRegex
        })
            .limit(5)
            .select('name type _id');

        materials.forEach(material => {
            results.push({
                type: 'material',
                id: material._id,
                title: material.name,
                subtitle: `${material.type.toUpperCase()} file`,
                path: `/app/materials`
            });
        });

        // Search Assessments (limit 5)
        const assessments = await Assessment.find({
            createdBy: userId,
            $or: [
                { title: searchRegex },
                { description: searchRegex }
            ]
        })
            .limit(5)
            .select('title description lessonPlanId _id')
            .populate('lessonPlanId', 'parameters.specificTopic');

        assessments.forEach(assessment => {
            const lessonTitle = assessment.lessonPlanId?.parameters?.specificTopic || 'Standalone Assessment';
            results.push({
                type: 'assessment',
                id: assessment._id,
                title: assessment.title,
                subtitle: `From: ${lessonTitle}`,
                path: `/app/assessment`
            });
        });

        res.json({
            success: true,
            count: results.length,
            data: results
        });

    } catch (error) {
        console.error("Global search error:", error);
        res.status(500).json({
            success: false,
            message: "Error performing search",
            error: error.message
        });
    }
};
