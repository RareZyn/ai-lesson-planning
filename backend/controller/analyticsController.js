// backend/controller/analyticsController.js
const Assessment = require("../model/Assessment");
const Student = require("../model/Student");
const StudentAnswer = require("../model/StudentAnswer");
const Class = require("../model/Class");

/**
 * FR-001: Get performance analytics for a class
 * Includes: class averages, topic mastery, frequently missed questions
 */
exports.getClassAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate, topic, assessmentType } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.submittedAt = {};
      if (startDate) dateFilter.submittedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.submittedAt.$lte = new Date(endDate);
    }

    // Get all student answers for this class
    const answers = await StudentAnswer.find({
      classId,
      processingStatus: "completed",
      ...dateFilter,
    })
      .populate("assessmentId", "title activityType difficulty lessonPlanSnapshot")
      .populate("studentId", "name studentId performanceStats")
      .sort({ submittedAt: -1 });

    if (answers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No data available for the selected filters",
        data: {
          classAverage: 0,
          totalAssessments: 0,
          totalStudents: 0,
          topicMastery: [],
          trendData: [],
          difficultyBreakdown: [],
        },
      });
    }

    // Filter by topic if provided
    let filteredAnswers = answers;
    if (topic) {
      filteredAnswers = answers.filter((answer) => {
        const snapshot = answer.assessmentId?.lessonPlanSnapshot;
        return (
          snapshot?.learningStandard?.main?.includes(topic) ||
          snapshot?.contentStandard?.main?.includes(topic)
        );
      });
    }

    // Filter by assessment type if provided
    if (assessmentType) {
      filteredAnswers = filteredAnswers.filter(
        (answer) => answer.assessmentId?.activityType === assessmentType
      );
    }

    // Calculate class average
    const totalPercentage = filteredAnswers.reduce(
      (sum, answer) => sum + (answer.overallStats?.percentage || 0),
      0
    );
    const classAverage = filteredAnswers.length > 0
      ? totalPercentage / filteredAnswers.length
      : 0;

    // Get unique students
    const uniqueStudents = new Set(
      filteredAnswers.map((a) => a.studentId?._id?.toString())
    );

    // Calculate topic mastery levels
    const topicMap = {};
    filteredAnswers.forEach((answer) => {
      const snapshot = answer.assessmentId?.lessonPlanSnapshot;
      const topicName =
        snapshot?.learningStandard?.main ||
        snapshot?.contentStandard?.main ||
        "Uncategorized";

      if (!topicMap[topicName]) {
        topicMap[topicName] = {
          topic: topicName,
          totalScore: 0,
          count: 0,
          averageScore: 0,
        };
      }

      topicMap[topicName].totalScore += answer.overallStats?.percentage || 0;
      topicMap[topicName].count += 1;
    });

    const topicMastery = Object.values(topicMap).map((topic) => ({
      topic: topic.topic,
      averageScore: topic.count > 0 ? topic.totalScore / topic.count : 0,
      assessmentCount: topic.count,
      masteryLevel:
        topic.totalScore / topic.count >= 75
          ? "High"
          : topic.totalScore / topic.count >= 50
          ? "Medium"
          : "Low",
    }));

    // Calculate trend data (by assessment - sorted by date)
    // Group answers by assessment, then calculate class average per assessment
    const assessmentMap = {};
    filteredAnswers.forEach((answer) => {
      const assessmentId = answer.assessmentId?._id?.toString();
      if (!assessmentId) return;

      if (!assessmentMap[assessmentId]) {
        assessmentMap[assessmentId] = {
          assessmentId,
          assessmentTitle: answer.assessmentId?.title || "Assessment",
          date: answer.submittedAt,
          scores: [],
        };
      }

      assessmentMap[assessmentId].scores.push(answer.overallStats?.percentage || 0);
      // Use earliest submission date for the assessment
      if (new Date(answer.submittedAt) < new Date(assessmentMap[assessmentId].date)) {
        assessmentMap[assessmentId].date = answer.submittedAt;
      }
    });

    const trendData = Object.values(assessmentMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((assessment, index) => ({
        assessmentNumber: index + 1,
        assessmentTitle: assessment.assessmentTitle,
        date: assessment.date,
        averageScore: assessment.scores.length > 0
          ? assessment.scores.reduce((sum, s) => sum + s, 0) / assessment.scores.length
          : 0,
        studentCount: assessment.scores.length,
      }));

    // Calculate difficulty breakdown
    const difficultyMap = {
      Beginner: { count: 0, totalScore: 0 },
      Intermediate: { count: 0, totalScore: 0 },
      Advanced: { count: 0, totalScore: 0 },
    };

    filteredAnswers.forEach((answer) => {
      const difficulty = answer.assessmentId?.difficulty || "Intermediate";
      if (difficultyMap[difficulty]) {
        difficultyMap[difficulty].count += 1;
        difficultyMap[difficulty].totalScore +=
          answer.overallStats?.percentage || 0;
      }
    });

    const difficultyBreakdown = Object.keys(difficultyMap).map((level) => ({
      difficulty: level,
      count: difficultyMap[level].count,
      averageScore:
        difficultyMap[level].count > 0
          ? difficultyMap[level].totalScore / difficultyMap[level].count
          : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        classAverage: Math.round(classAverage * 10) / 10,
        totalAssessments: filteredAnswers.length,
        totalStudents: uniqueStudents.size,
        topicMastery,
        trendData,
        difficultyBreakdown,
      },
    });
  } catch (error) {
    console.error("Error in getClassAnalytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class analytics",
      error: error.message,
    });
  }
};

/**
 * FR-001: Get individual student progress analytics
 */
exports.getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, assessmentType } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.submittedAt = {};
      if (startDate) dateFilter.submittedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.submittedAt.$lte = new Date(endDate);
    }

    // Build assessment type filter
    const assessmentFilter = {};
    if (assessmentType) {
      const assessments = await Assessment.find({ activityType: assessmentType });
      assessmentFilter.assessmentId = { $in: assessments.map(a => a._id) };
    }

    // Get student info
    const student = await Student.findById(studentId).populate("classId");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get all student answers
    const answers = await StudentAnswer.find({
      studentId,
      processingStatus: "completed",
      ...dateFilter,
      ...assessmentFilter,
    })
      .populate("assessmentId", "title activityType difficulty createdAt lessonPlanSnapshot")
      .sort({ submittedAt: 1 });

    if (answers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No assessment data available",
        data: {
          student: {
            name: student.name,
            studentId: student.studentId,
            class: student.classId?.className,
          },
          averageScore: 0,
          totalAssessments: 0,
          progressOverTime: [],
          topicPerformance: [],
          strengthsAndWeaknesses: {
            strengths: [],
            weaknesses: [],
          },
        },
      });
    }

    // Calculate average score
    const totalScore = answers.reduce(
      (sum, answer) => sum + (answer.overallStats?.percentage || 0),
      0
    );
    const averageScore = totalScore / answers.length;

    // Progress over time
    const progressOverTime = answers.map((answer, index) => ({
      assessmentTitle: answer.assessmentId?.title || "Assessment",
      date: answer.submittedAt,
      score: answer.overallStats?.percentage || 0,
      assessmentNumber: index + 1,
    }));

    // Topic performance
    const topicMap = {};
    answers.forEach((answer) => {
      const snapshot = answer.assessmentId?.lessonPlanSnapshot;
      const topicName =
        snapshot?.learningStandard?.main ||
        snapshot?.contentStandard?.main ||
        "Uncategorized";

      if (!topicMap[topicName]) {
        topicMap[topicName] = {
          topic: topicName,
          scores: [],
          totalScore: 0,
          count: 0,
        };
      }

      topicMap[topicName].scores.push(answer.overallStats?.percentage || 0);
      topicMap[topicName].totalScore += answer.overallStats?.percentage || 0;
      topicMap[topicName].count += 1;
    });

    const topicPerformance = Object.values(topicMap).map((topic) => ({
      topic: topic.topic,
      averageScore: topic.count > 0 ? topic.totalScore / topic.count : 0,
      assessmentCount: topic.count,
      trend:
        topic.scores.length > 1
          ? topic.scores[topic.scores.length - 1] > topic.scores[0]
            ? "improving"
            : topic.scores[topic.scores.length - 1] < topic.scores[0]
            ? "declining"
            : "stable"
          : "stable",
    }));

    // Identify strengths and weaknesses
    const sortedTopics = [...topicPerformance].sort(
      (a, b) => b.averageScore - a.averageScore
    );
    const strengths = sortedTopics.slice(0, 3).map((t) => ({
      topic: t.topic,
      score: Math.round(t.averageScore * 10) / 10,
    }));
    const weaknesses = sortedTopics
      .slice(-3)
      .reverse()
      .map((t) => ({
        topic: t.topic,
        score: Math.round(t.averageScore * 10) / 10,
      }));

    res.status(200).json({
      success: true,
      data: {
        student: {
          name: student.name,
          studentId: student.studentId,
          class: student.classId?.className,
          grade: student.grade,
        },
        averageScore: Math.round(averageScore * 10) / 10,
        totalAssessments: answers.length,
        progressOverTime,
        topicPerformance,
        strengthsAndWeaknesses: {
          strengths,
          weaknesses,
        },
      },
    });
  } catch (error) {
    console.error("Error in getStudentProgress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student progress",
      error: error.message,
    });
  }
};

/**
 * FR-001: Get frequently missed questions for an assessment or class
 */
exports.getFrequentlyMissedQuestions = async (req, res) => {
  try {
    const { classId, assessmentId } = req.params;

    // Build query
    const query = { processingStatus: "completed" };
    if (classId) query.classId = classId;
    if (assessmentId) query.assessmentId = assessmentId;

    const answers = await StudentAnswer.find(query).populate(
      "assessmentId",
      "title generatedContent"
    );

    if (answers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No data available",
        data: [],
      });
    }

    // Aggregate question performance
    const questionMap = {};

    answers.forEach((submission) => {
      submission.answers.forEach((answer) => {
        const qNum = answer.questionNumber;

        if (!questionMap[qNum]) {
          questionMap[qNum] = {
            questionNumber: qNum,
            questionText: answer.questionText || `Question ${qNum}`,
            totalAttempts: 0,
            totalScore: 0,
            maxScore: 0,
            incorrectCount: 0,
            averageScore: 0,
          };
        }

        questionMap[qNum].totalAttempts += 1;

        const score = answer.grading?.finalScore || answer.grading?.aiScore?.score || 0;
        const maxScore = answer.grading?.aiScore?.maxScore || 10;

        questionMap[qNum].totalScore += score;
        questionMap[qNum].maxScore = maxScore;

        // Count as incorrect if score is less than 50% of max
        if (score < maxScore * 0.5) {
          questionMap[qNum].incorrectCount += 1;
        }
      });
    });

    // Calculate averages and error rates
    const frequentlyMissed = Object.values(questionMap)
      .map((q) => ({
        ...q,
        averageScore: q.totalAttempts > 0 ? q.totalScore / q.totalAttempts : 0,
        errorRate:
          q.totalAttempts > 0
            ? (q.incorrectCount / q.totalAttempts) * 100
            : 0,
      }))
      .filter((q) => q.errorRate > 30) // Only show questions with >30% error rate
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 10); // Top 10 most missed

    res.status(200).json({
      success: true,
      data: frequentlyMissed,
    });
  } catch (error) {
    console.error("Error in getFrequentlyMissedQuestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch frequently missed questions",
      error: error.message,
    });
  }
};

/**
 * FR-004: Get all students in a class with their performance
 */
exports.getClassStudentsList = async (req, res) => {
  try {
    const { classId } = req.params;

    const students = await Student.find({ classId, status: "active" })
      .select("name studentId performanceStats")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Error in getClassStudentsList:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students list",
      error: error.message,
    });
  }
};

/**
 * FR-004: Get available topics for filtering
 */
exports.getAvailableTopics = async (req, res) => {
  try {
    const { classId } = req.params;

    // Get all assessments for this class
    const assessments = await Assessment.find({ classId }).select(
      "lessonPlanSnapshot"
    );

    // Extract unique topics
    const topicsSet = new Set();
    assessments.forEach((assessment) => {
      const snapshot = assessment.lessonPlanSnapshot;
      if (snapshot?.learningStandard?.main) {
        topicsSet.add(snapshot.learningStandard.main);
      }
      if (snapshot?.contentStandard?.main) {
        topicsSet.add(snapshot.contentStandard.main);
      }
    });

    const topics = Array.from(topicsSet).filter(Boolean).sort();

    res.status(200).json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error("Error in getAvailableTopics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch topics",
      error: error.message,
    });
  }
};

/**
 * FR-002: Generate and download performance report
 */
exports.generateReport = async (req, res) => {
  try {
    const { type, classId, studentId } = req.body;
    const { startDate, endDate, topic, assessmentType } = req.body.filters || {};

    let reportData;

    if (type === "class") {
      // Get class analytics
      req.params.classId = classId;
      req.query = { startDate, endDate, topic, assessmentType };

      // Call getClassAnalytics logic
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.submittedAt = {};
        if (startDate) dateFilter.submittedAt.$gte = new Date(startDate);
        if (endDate) dateFilter.submittedAt.$lte = new Date(endDate);
      }

      const answers = await StudentAnswer.find({
        classId,
        processingStatus: "completed",
        ...dateFilter,
      })
        .populate("assessmentId", "title activityType difficulty lessonPlanSnapshot")
        .populate("studentId", "name studentId");

      let filteredAnswers = answers;
      if (topic) {
        filteredAnswers = answers.filter((answer) => {
          const snapshot = answer.assessmentId?.lessonPlanSnapshot;
          return (
            snapshot?.learningStandard?.main?.includes(topic) ||
            snapshot?.contentStandard?.main?.includes(topic)
          );
        });
      }

      if (assessmentType) {
        filteredAnswers = filteredAnswers.filter(
          (answer) => answer.assessmentId?.activityType === assessmentType
        );
      }

      const classInfo = await Class.findById(classId);
      const students = await Student.find({ classId, status: "active" });

      reportData = {
        type: "class",
        class: classInfo,
        totalStudents: students.length,
        totalAssessments: filteredAnswers.length,
        classAverage:
          filteredAnswers.length > 0
            ? filteredAnswers.reduce(
                (sum, a) => sum + (a.overallStats?.percentage || 0),
                0
              ) / filteredAnswers.length
            : 0,
        studentPerformance: students.map((student) => {
          const studentAnswers = filteredAnswers.filter(
            (a) => a.studentId?._id.toString() === student._id.toString()
          );
          const avgScore =
            studentAnswers.length > 0
              ? studentAnswers.reduce(
                  (sum, a) => sum + (a.overallStats?.percentage || 0),
                  0
                ) / studentAnswers.length
              : 0;
          return {
            name: student.name,
            studentId: student.studentId,
            averageScore: Math.round(avgScore * 10) / 10,
            assessmentsCompleted: studentAnswers.length,
          };
        }),
        generatedAt: new Date(),
      };
    } else if (type === "student") {
      // Get student analytics
      const student = await Student.findById(studentId).populate("classId");

      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.submittedAt = {};
        if (startDate) dateFilter.submittedAt.$gte = new Date(startDate);
        if (endDate) dateFilter.submittedAt.$lte = new Date(endDate);
      }

      const answers = await StudentAnswer.find({
        studentId,
        processingStatus: "completed",
        ...dateFilter,
      }).populate("assessmentId", "title activityType difficulty lessonPlanSnapshot");

      reportData = {
        type: "student",
        student: {
          name: student.name,
          studentId: student.studentId,
          class: student.classId?.className,
          grade: student.grade,
        },
        totalAssessments: answers.length,
        averageScore:
          answers.length > 0
            ? answers.reduce(
                (sum, a) => sum + (a.overallStats?.percentage || 0),
                0
              ) / answers.length
            : 0,
        assessmentDetails: answers.map((a) => ({
          title: a.assessmentId?.title,
          date: a.submittedAt,
          score: a.overallStats?.percentage || 0,
          type: a.assessmentId?.activityType,
        })),
        generatedAt: new Date(),
      };
    }

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error in generateReport:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error.message,
    });
  }
};
