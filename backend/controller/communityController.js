// backend/controller/communityController.js - Updated with bookmark functionality
const LessonPlan = require("../model/Lesson");
const User = require("../model/User");
const mongoose = require("mongoose");

/**
 * Helper function to determine if a string is a valid MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Helper function to find MongoDB ObjectId by Firebase UID
 */
const findMongoIdByFirebaseUid = async (firebaseUid) => {
  try {
    const user = await User.findOne({ firebaseUid: firebaseUid });
    return user ? user._id : null;
  } catch (error) {
    console.error("Error finding user by Firebase UID:", error);
    return null;
  }
};

/**
 * Helper function to resolve user ID (Firebase UID to MongoDB ObjectId if needed)
 */
const resolveUserId = async (userId) => {
  if (isValidObjectId(userId)) {
    // It's already a valid ObjectId, return as is
    return userId;
  }

  // It's a Firebase UID, try to find the corresponding MongoDB ObjectId
  const mongoId = await findMongoIdByFirebaseUid(userId);
  if (mongoId) {
    return mongoId;
  }

  // If no mapping found, return the original ID (this will likely cause an error)
  console.warn(`Could not resolve Firebase UID ${userId} to MongoDB ObjectId`);
  return userId;
};

/**
 * @desc    Get all lesson plans available in the LessonPlan Collection
 * @route   GET /api/community/all-lessons
 * @access  Public
 */
exports.getAllLessonPlans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, grade, subject } = req.query;

    // Build query object
    const query = {};
    if (grade) query["parameters.grade"] = grade;

    const lessonPlans = await LessonPlan.find(query)
      .populate({
        path: "createdBy",
        select: "name schoolName",
      })
      .populate({
        path: "classId",
        select: "className subject grade",
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LessonPlan.countDocuments(query);

    // Filter by subject if provided (after population)
    let filteredLessonPlans = lessonPlans;
    if (subject) {
      filteredLessonPlans = lessonPlans.filter(
        (plan) =>
          plan.classId &&
          plan.classId.subject &&
          plan.classId.subject.toLowerCase() === subject.toLowerCase()
      );
    }

    res.status(200).json({
      success: true,
      count: filteredLessonPlans.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: filteredLessonPlans,
    });
  } catch (error) {
    console.error("Error fetching all lesson plans:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching lesson plans",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get lesson plans created by a specific user
 * @route   GET /api/community/my-lessons?userId=USER_ID
 * @access  Public
 */
exports.getUserLessonPlans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, grade, shared, userId } = req.query;

    // Check if userId is provided as query parameter
    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "userId is required as query parameter. Example: ?userId=USER_ID",
      });
    }

    // Resolve Firebase UID to MongoDB ObjectId if needed
    const resolvedUserId = await resolveUserId(userId);

    // Build query object
    const query = { createdBy: resolvedUserId };
    if (grade) query["parameters.grade"] = grade;
    if (shared !== undefined) query.isSharedToCommunity = shared === "true";

    console.log("Original userId:", userId);
    console.log("Resolved userId:", resolvedUserId);
    console.log("Query being executed:", query);

    try {
      const lessonPlans = await LessonPlan.find(query)
        .populate({
          path: "classId",
          select: "className subject grade",
        })
        .populate({
          path: "createdBy",
          select: "name schoolName",
        })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await LessonPlan.countDocuments(query);

      console.log(
        `Found ${lessonPlans.length} lesson plans for user ${userId}`
      );

      res.status(200).json({
        success: true,
        count: lessonPlans.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        data: lessonPlans,
      });
    } catch (queryError) {
      // If query still fails, return empty results instead of error
      console.error("Query failed, returning empty results:", queryError);

      res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        totalPages: 0,
        currentPage: parseInt(page),
        data: [],
        message: "No lesson plans found for this user",
      });
    }
  } catch (error) {
    console.error("Error fetching user lesson plans:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching lesson plans",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get user's bookmarked lesson plans
 * @route   GET /api/community/bookmarks?userId=USER_ID
 * @access  Public
 */
exports.getUserBookmarks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, grade, subject, userId } = req.query;

    // Check if userId is provided as query parameter
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required as query parameter",
      });
    }

    // Resolve Firebase UID to MongoDB ObjectId if needed
    const resolvedUserId = await resolveUserId(userId);

    // Find user to get their bookmarks
    const user = await User.findById(resolvedUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get bookmarked lesson plan IDs
    const bookmarkedIds = user.bookmarks || [];

    if (bookmarkedIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        totalPages: 0,
        currentPage: parseInt(page),
        data: [],
        message: "No bookmarked lesson plans found",
      });
    }

    // Build query for bookmarked lessons
    const query = {
      _id: { $in: bookmarkedIds },
      isSharedToCommunity: true, // Only show shared lessons in bookmarks
    };

    if (grade) query["parameters.grade"] = grade;

    const lessonPlans = await LessonPlan.find(query)
      .populate({
        path: "createdBy",
        select: "name schoolName",
      })
      .populate({
        path: "classId",
        select: "className subject grade",
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LessonPlan.countDocuments(query);

    // Filter by subject if provided (after population)
    let filteredLessonPlans = lessonPlans;
    if (subject) {
      filteredLessonPlans = lessonPlans.filter(
        (plan) =>
          plan.classId &&
          plan.classId.subject &&
          plan.classId.subject.toLowerCase() === subject.toLowerCase()
      );
    }

    // Add isBookmarked flag to each lesson
    const lessonPlansWithBookmarkFlag = filteredLessonPlans.map((plan) => ({
      ...plan.toObject(),
      isBookmarked: true,
    }));

    res.status(200).json({
      success: true,
      count: lessonPlansWithBookmarkFlag.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: lessonPlansWithBookmarkFlag,
    });
  } catch (error) {
    console.error("Error fetching user bookmarks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookmarks",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Toggle bookmark status for a lesson plan
 * @route   PUT /api/community/bookmark/:id
 * @access  Public
 */
exports.toggleBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Check if userId is provided in request body
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in request body",
      });
    }

    const lessonPlan = await LessonPlan.findById(id);

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: "Lesson plan not found",
      });
    }

    if (!lessonPlan.isSharedToCommunity) {
      return res.status(400).json({
        success: false,
        message: "Lesson plan is not shared to community",
      });
    }

    // Resolve Firebase UID to MongoDB ObjectId if needed
    const resolvedUserId = await resolveUserId(userId);

    // Find the user
    const user = await User.findById(resolvedUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Initialize bookmarks array if it doesn't exist
    if (!user.bookmarks) {
      user.bookmarks = [];
    }

    // Check if lesson is already bookmarked
    const bookmarkIndex = user.bookmarks.findIndex(
      (bookmarkId) => bookmarkId.toString() === lessonPlan._id.toString()
    );

    let isBookmarked;
    if (bookmarkIndex > -1) {
      // Remove bookmark
      user.bookmarks.splice(bookmarkIndex, 1);
      isBookmarked = false;
    } else {
      // Add bookmark
      user.bookmarks.push(lessonPlan._id);
      isBookmarked = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isBookmarked ? "Lesson plan bookmarked" : "Bookmark removed",
      data: {
        isBookmarked,
        bookmarkCount: user.bookmarks.length,
      },
    });
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    res.status(500).json({
      success: false,
      message: "Server error while toggling bookmark",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Add/Share lesson plan to community
 * @route   PUT /api/community/share/:id?userId=USER_ID
 * @access  Public
 */
exports.shareLessonPlanToCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, tags, userId } = req.body;

    // Check if userId is provided in request body
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in request body",
      });
    }

    // Find the lesson plan
    const lessonPlan = await LessonPlan.findById(id);

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: "Lesson plan not found",
      });
    }

    // Resolve Firebase UID to MongoDB ObjectId if needed
    const resolvedUserId = await resolveUserId(userId);

    // Check if user owns this lesson plan
    const isOwner =
      lessonPlan.createdBy.toString() === resolvedUserId.toString();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to share this lesson plan",
      });
    }

    // Check if already shared
    if (lessonPlan.isSharedToCommunity) {
      return res.status(400).json({
        success: false,
        message: "Lesson plan is already shared to community",
      });
    }

    // Update lesson plan to mark as shared
    lessonPlan.isSharedToCommunity = true;
    lessonPlan.communityData = {
      title:
        title ||
        `${lessonPlan.parameters.specificTopic} - ${lessonPlan.parameters.grade}`,
      description: description || "Shared lesson plan",
      tags: tags || [],
      sharedAt: new Date(),
      likes: 0,
      likedBy: [],
      downloads: 0,
      downloadedBy: [],
      reviews: [],
      averageRating: 0,
    };

    await lessonPlan.save();

    res.status(200).json({
      success: true,
      message: "Lesson plan successfully shared to community",
      data: lessonPlan,
    });
  } catch (error) {
    console.error("Error sharing lesson plan to community:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sharing lesson plan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Remove lesson plan from community
 * @route   PUT /api/community/unshare/:id
 * @access  Public
 */
exports.unshareLessonPlanFromCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Check if userId is provided in request body
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in request body",
      });
    }

    // Find the lesson plan
    const lessonPlan = await LessonPlan.findById(id);

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: "Lesson plan not found",
      });
    }

    // Resolve Firebase UID to MongoDB ObjectId if needed
    const resolvedUserId = await resolveUserId(userId);

    // Check if user owns this lesson plan
    if (lessonPlan.createdBy.toString() !== resolvedUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to unshare this lesson plan",
      });
    }

    // Update lesson plan to mark as not shared
    lessonPlan.isSharedToCommunity = false;
    lessonPlan.communityData = undefined;

    await lessonPlan.save();

    res.status(200).json({
      success: true,
      message: "Lesson plan removed from community",
      data: lessonPlan,
    });
  } catch (error) {
    console.error("Error unsharing lesson plan from community:", error);
    res.status(500).json({
      success: false,
      message: "Server error while unsharing lesson plan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Fetch all lesson plans shared to community
 * @route   GET /api/community/shared-lessons
 * @access  Public
 */
exports.getCommunityLessonPlans = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      grade,
      subject,
      tags,
      search,
      sortBy = "recent", // recent, popular, downloads
      userId, // Optional: to check bookmark status
    } = req.query;

    // Build query object
    const query = { isSharedToCommunity: true };

    if (grade) query["parameters.grade"] = grade;
    if (tags) {
      const tagArray = tags.split(",");
      query["communityData.tags"] = { $in: tagArray };
    }
    if (search) {
      query.$or = [
        { "communityData.title": { $regex: search, $options: "i" } },
        { "communityData.description": { $regex: search, $options: "i" } },
        { "parameters.specificTopic": { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    let sortQuery = {};
    switch (sortBy) {
      case "popular":
        sortQuery = { "communityData.likes": -1 };
        break;
      case "downloads":
        sortQuery = { "communityData.downloads": -1 };
        break;
      case "recent":
      default:
        sortQuery = { "communityData.sharedAt": -1 };
        break;
    }

    const lessonPlans = await LessonPlan.find(query)
      .populate({
        path: "createdBy",
        select: "name schoolName",
      })
      .populate({
        path: "classId",
        select: "className subject grade",
      })
      .sort(sortQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LessonPlan.countDocuments(query);

    // Filter by subject if provided (after population)
    let filteredLessonPlans = lessonPlans;
    if (subject) {
      filteredLessonPlans = lessonPlans.filter(
        (plan) =>
          plan.classId &&
          plan.classId.subject &&
          plan.classId.subject.toLowerCase() === subject.toLowerCase()
      );
    }

    // Add bookmark status if userId is provided
    if (userId) {
      try {
        const resolvedUserId = await resolveUserId(userId);
        const user = await User.findById(resolvedUserId).select("bookmarks");
        const userBookmarks = user?.bookmarks || [];

        filteredLessonPlans = filteredLessonPlans.map((plan) => ({
          ...plan.toObject(),
          isBookmarked: userBookmarks.some(
            (bookmarkId) => bookmarkId.toString() === plan._id.toString()
          ),
        }));
      } catch (error) {
        console.error("Error checking bookmark status:", error);
        // Continue without bookmark status if there's an error
      }
    }

    res.status(200).json({
      success: true,
      count: filteredLessonPlans.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: filteredLessonPlans,
    });
  } catch (error) {
    console.error("Error fetching community lesson plans:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching community lesson plans",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Like/Unlike a community lesson plan
 * @route   PUT /api/community/like/:id
 * @access  Public
 */
exports.toggleLikeLessonPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Check if userId is provided in request body
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required in request body",
      });
    }

    const lessonPlan = await LessonPlan.findById(id);

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: "Lesson plan not found",
      });
    }

    if (!lessonPlan.isSharedToCommunity) {
      return res.status(400).json({
        success: false,
        message: "Lesson plan is not shared to community",
      });
    }

    // Resolve Firebase UID to MongoDB ObjectId if needed
    const resolvedUserId = await resolveUserId(userId);

    // Initialize communityData and likedBy array if they don't exist
    if (!lessonPlan.communityData) {
      lessonPlan.communityData = {
        likes: 0,
        likedBy: [],
        downloads: 0,
      };
    }
    if (!lessonPlan.communityData.likedBy) {
      lessonPlan.communityData.likedBy = [];
    }

    const hasLiked = lessonPlan.communityData.likedBy.some(
      (id) => id.toString() === resolvedUserId.toString()
    );

    if (hasLiked) {
      // Unlike
      lessonPlan.communityData.likedBy =
        lessonPlan.communityData.likedBy.filter(
          (id) => id.toString() !== resolvedUserId.toString()
        );
      lessonPlan.communityData.likes = Math.max(
        0,
        lessonPlan.communityData.likes - 1
      );
    } else {
      // Like
      lessonPlan.communityData.likedBy.push(resolvedUserId);
      lessonPlan.communityData.likes += 1;
    }

    await lessonPlan.save();

    res.status(200).json({
      success: true,
      message: hasLiked ? "Lesson plan unliked" : "Lesson plan liked",
      data: {
        likes: lessonPlan.communityData.likes,
        hasLiked: !hasLiked,
      },
    });
  } catch (error) {
    console.error("Error toggling like on lesson plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error while toggling like",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Download/Copy a community lesson plan
 * @route   POST /api/community/download/:id
 * @access  Public
 */
exports.downloadLessonPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const lessonPlan = await LessonPlan.findById(id)
      .populate("createdBy", "name schoolName")
      .populate("classId", "className subject grade");

    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: "Lesson plan not found",
      });
    }

    if (!lessonPlan.isSharedToCommunity) {
      return res.status(400).json({
        success: false,
        message: "Lesson plan is not available for download",
      });
    }

    // Initialize communityData if it doesn't exist
    if (!lessonPlan.communityData) {
      lessonPlan.communityData = {
        downloads: 0,
        downloadedBy: [],
      };
    }

    // Increment download count
    lessonPlan.communityData.downloads += 1;

    // Record who downloaded it (if userId is provided)
    if (userId && !lessonPlan.communityData.downloadedBy) {
      lessonPlan.communityData.downloadedBy = [];
    }

    if (userId) {
      // Resolve Firebase UID to MongoDB ObjectId if needed
      const resolvedUserId = await resolveUserId(userId);

      // Check if user hasn't already downloaded
      const alreadyDownloaded = lessonPlan.communityData.downloadedBy.some(
        (download) =>
          download.user &&
          download.user.toString() === resolvedUserId.toString()
      );

      if (!alreadyDownloaded) {
        lessonPlan.communityData.downloadedBy.push({
          user: resolvedUserId,
          downloadedAt: new Date(),
        });
      }
    }

    await lessonPlan.save();

    res.status(200).json({
      success: true,
      message: "Lesson plan downloaded successfully",
      data: lessonPlan,
    });
  } catch (error) {
    console.error("Error downloading lesson plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error while downloading lesson plan",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get statistics for community
 * @route   GET /api/community/stats
 * @access  Public
 */
exports.getCommunityStats = async (req, res, next) => {
  try {
    const totalShared = await LessonPlan.countDocuments({
      isSharedToCommunity: true,
    });

    const totalLikes = await LessonPlan.aggregate([
      { $match: { isSharedToCommunity: true } },
      { $group: { _id: null, totalLikes: { $sum: "$communityData.likes" } } },
    ]);

    const totalDownloads = await LessonPlan.aggregate([
      { $match: { isSharedToCommunity: true } },
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: "$communityData.downloads" },
        },
      },
    ]);

    // Get top contributors
    const topContributors = await LessonPlan.aggregate([
      { $match: { isSharedToCommunity: true } },
      { $group: { _id: "$createdBy", sharedCount: { $sum: 1 } } },
      { $sort: { sharedCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          schoolName: "$user.schoolName",
          sharedCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalShared,
        totalLikes: totalLikes[0]?.totalLikes || 0,
        totalDownloads: totalDownloads[0]?.totalDownloads || 0,
        topContributors,
      },
    });
  } catch (error) {
    console.error("Error fetching community stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching community stats",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
