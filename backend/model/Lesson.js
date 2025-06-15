const mongoose = require("mongoose");

// Check if the model already exists before defining it
if (mongoose.models.LessonPlan) {
  module.exports = mongoose.models.LessonPlan;
} else {
  // This is the complete lesson plan document schema with community features
  const LessonPlanSchema = new mongoose.Schema(
    {
      // --- Core Relationships and Metadata ---
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Link to the user who created the plan
        required: true,
      },
      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class", // Link to the class this plan is for
        required: true,
      },
      lessonDate: {
        type: Date,
        required: [true, "Lesson date is required."],
        default: Date.now,
      },

      // --- Community Sharing Fields ---
      isSharedToCommunity: {
        type: Boolean,
        default: false,
        index: true, // Index for faster queries
      },
      communityData: {
        title: {
          type: String,
          trim: true,
          maxlength: [100, "Community title cannot exceed 100 characters"],
        },
        description: {
          type: String,
          trim: true,
          maxlength: [
            500,
            "Community description cannot exceed 500 characters",
          ],
        },
        tags: [
          {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: [30, "Tag cannot exceed 30 characters"],
          },
        ],
        sharedAt: {
          type: Date,
          index: true, // Index for sorting by shared date
        },
        likes: {
          type: Number,
          default: 0,
          min: [0, "Likes cannot be negative"],
          index: true, // Index for sorting by popularity
        },
        likedBy: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        downloads: {
          type: Number,
          default: 0,
          min: [0, "Downloads cannot be negative"],
          index: true, // Index for sorting by downloads
        },
        downloadedBy: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            downloadedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        // Community feedback/reviews (optional for future expansion)
        reviews: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            rating: {
              type: Number,
              min: 1,
              max: 5,
            },
            comment: {
              type: String,
              maxlength: [200, "Review comment cannot exceed 200 characters"],
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        averageRating: {
          type: Number,
          default: 0,
          min: 0,
          max: 5,
        },
      },
      assessmentStatus: {
        type: String,
        enum: ["not_generated", "generated"],
        default: "not_generated",
      },

      generatedAssessments: [
        {
          assessmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assessment",
          },
          activityType: {
            type: String,
            enum: ["assessment", "essay", "textbook", "activity"],
          },
          generatedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      // --- Parameters used to generate the plan ---
      parameters: {
        grade: {
          type: String,
          required: true,
          index: true, // Index for filtering by grade
        },
        proficiencyLevel: {
          type: String,
          required: true,
          // Removed enum to allow any proficiency level
        },
        hotsFocus: {
          type: String,
          required: true,
          // Removed enum to allow any HOTS focus
        },
        specificTopic: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Specific topic cannot exceed 100 characters"],
        },
        activityType: {
          type: String,
          trim: true,
        },
        additionalNotes: {
          type: String,
          trim: true,
          maxlength: [1000, "Additional notes cannot exceed 1000 characters"],
        },

        // Detailed Scheme of Work snapshot
        sow: {
          lessonNo: {
            type: Number,
            min: [1, "Lesson number must be at least 1"],
          },
          focus: {
            type: String,
            trim: true,
          },
          theme: {
            type: String,
            trim: true,
          },
          topic: {
            type: String,
            trim: true,
          },
          contentStandard: {
            main: {
              type: String,
              trim: true,
            },
            comp: {
              type: String,
              trim: true,
            },
          },
          learningStandard: {
            main: {
              type: String,
              trim: true,
            },
            comp: {
              type: String,
              trim: true,
            },
          },
          learningOutline: {
            pre: {
              type: String,
              trim: true,
            },
            during: {
              type: String,
              trim: true,
            },
            post: {
              type: String,
              trim: true,
            },
          },
          materials: [
            {
              type: String,
              trim: true,
            },
          ],
          differentiationStrategy: {
            type: String,
            trim: true,
          },
          cce: [
            {
              type: String,
              trim: true,
            },
          ],
        },
      },

      // --- Generated Lesson Plan Content ---
      plan: {
        learningObjective: {
          type: String,
          required: [true, "A learning objective is required."],
          trim: true,
          minlength: [10, "Learning objective must be at least 10 characters"],
          maxlength: [500, "Learning objective cannot exceed 500 characters"],
        },
        successCriteria: {
          type: [String],
          required: [true, "Success criteria are required."],
          validate: {
            validator: function (arr) {
              return arr && arr.length > 0;
            },
            message: "At least one success criterion is required.",
          },
        },
        activities: {
          preLesson: {
            type: [String],
            required: true,
            validate: {
              validator: function (arr) {
                return arr && arr.length > 0;
              },
              message: "At least one pre-lesson activity is required.",
            },
          },
          duringLesson: {
            type: [String],
            required: true,
            validate: {
              validator: function (arr) {
                return arr && arr.length > 0;
              },
              message: "At least one during-lesson activity is required.",
            },
          },
          postLesson: {
            type: [String],
            required: true,
            validate: {
              validator: function (arr) {
                return arr && arr.length > 0;
              },
              message: "At least one post-lesson activity is required.",
            },
          },
        },
      },

      // --- Metadata ---
      status: {
        type: String,
        enum: ["draft", "completed", "archived"],
        default: "completed",
      },
      version: {
        type: Number,
        default: 1,
      },
      lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
      // Add virtual fields and transform options
      toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
          // Don't include sensitive information in JSON output
          if (ret.communityData && ret.communityData.likedBy) {
            ret.communityData.likedByCount = ret.communityData.likedBy.length;
            // Don't expose the actual user IDs unless specifically needed
            delete ret.communityData.likedBy;
          }
          return ret;
        },
      },
      toObject: { virtuals: true },
    }
  );

  // --- INDEXES for better query performance ---
  LessonPlanSchema.index({ createdBy: 1, lessonDate: -1 });
  LessonPlanSchema.index({ "parameters.grade": 1, isSharedToCommunity: 1 });
  LessonPlanSchema.index({ "communityData.tags": 1 });
  LessonPlanSchema.index({ "communityData.sharedAt": -1 });
  LessonPlanSchema.index({ "communityData.likes": -1 });
  LessonPlanSchema.index({ "communityData.downloads": -1 });
  LessonPlanSchema.index({ "communityData.averageRating": -1 });

  // Text index for search functionality
  LessonPlanSchema.index({
    "communityData.title": "text",
    "communityData.description": "text",
    "parameters.specificTopic": "text",
    "plan.learningObjective": "text",
  });

  // --- VIRTUAL FIELDS ---
  LessonPlanSchema.virtual("communityData.likedByCount").get(function () {
    return this.communityData && this.communityData.likedBy
      ? this.communityData.likedBy.length
      : 0;
  });

  LessonPlanSchema.virtual("communityData.reviewCount").get(function () {
    return this.communityData && this.communityData.reviews
      ? this.communityData.reviews.length
      : 0;
  });

  // --- INSTANCE METHODS ---

  // Check if user has liked this lesson plan
  LessonPlanSchema.methods.hasUserLiked = function (userId) {
    if (!this.communityData || !this.communityData.likedBy) {
      return false;
    }
    return this.communityData.likedBy.some(
      (id) => id.toString() === userId.toString()
    );
  };

  // Check if user has downloaded this lesson plan
  LessonPlanSchema.methods.hasUserDownloaded = function (userId) {
    if (!this.communityData || !this.communityData.downloadedBy) {
      return false;
    }
    return this.communityData.downloadedBy.some(
      (download) => download.user.toString() === userId.toString()
    );
  };

  // Add a like from a user
  LessonPlanSchema.methods.addLike = function (userId) {
    if (!this.hasUserLiked(userId)) {
      this.communityData.likedBy.push(userId);
      this.communityData.likes += 1;
    }
    return this.save();
  };

  // Remove a like from a user
  LessonPlanSchema.methods.removeLike = function (userId) {
    if (this.hasUserLiked(userId)) {
      this.communityData.likedBy = this.communityData.likedBy.filter(
        (id) => id.toString() !== userId.toString()
      );
      this.communityData.likes = Math.max(0, this.communityData.likes - 1);
    }
    return this.save();
  };

  // Record a download
  LessonPlanSchema.methods.recordDownload = function (userId) {
    if (!this.hasUserDownloaded(userId)) {
      this.communityData.downloadedBy.push({
        user: userId,
        downloadedAt: new Date(),
      });
      this.communityData.downloads += 1;
    }
    return this.save();
  };

  // Calculate average rating
  LessonPlanSchema.methods.calculateAverageRating = function () {
    if (
      !this.communityData.reviews ||
      this.communityData.reviews.length === 0
    ) {
      this.communityData.averageRating = 0;
      return 0;
    }

    const sum = this.communityData.reviews.reduce(
      (acc, review) => acc + review.rating,
      0
    );
    this.communityData.averageRating = sum / this.communityData.reviews.length;
    return this.communityData.averageRating;
  };

  // --- STATIC METHODS ---

  // Get community lesson plans with advanced filtering
  LessonPlanSchema.statics.getCommunityLessons = function (filters = {}) {
    const query = { isSharedToCommunity: true };

    if (filters.grade) {
      query["parameters.grade"] = filters.grade;
    }
    if (filters.tags && filters.tags.length > 0) {
      query["communityData.tags"] = { $in: filters.tags };
    }
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    if (filters.minRating) {
      query["communityData.averageRating"] = { $gte: filters.minRating };
    }

    return this.find(query);
  };

  // Get popular lesson plans
  LessonPlanSchema.statics.getPopularLessons = function (limit = 10) {
    return this.find({ isSharedToCommunity: true })
      .sort({ "communityData.likes": -1 })
      .limit(limit)
      .populate("createdBy", "name schoolName")
      .populate("classId", "subject grade");
  };

  // Get trending lesson plans (recently shared with good engagement)
  LessonPlanSchema.statics.getTrendingLessons = function (
    days = 7,
    limit = 10
  ) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.find({
      isSharedToCommunity: true,
      "communityData.sharedAt": { $gte: since },
    })
      .sort({ "communityData.likes": -1, "communityData.downloads": -1 })
      .limit(limit)
      .populate("createdBy", "name schoolName")
      .populate("classId", "subject grade");
  };

  // --- PRE-SAVE MIDDLEWARE ---
  LessonPlanSchema.pre("save", function (next) {
    // Update lastModifiedBy when document is modified
    if (this.isModified() && !this.isNew) {
      this.lastModifiedBy = this.createdBy;
    }

    // Ensure communityData exists if sharing to community
    if (this.isSharedToCommunity && !this.communityData) {
      this.communityData = {
        title: `${this.parameters.specificTopic} - ${this.parameters.grade}`,
        description: "Shared lesson plan",
        tags: [],
        sharedAt: new Date(),
        likes: 0,
        likedBy: [],
        downloads: 0,
        downloadedBy: [],
        reviews: [],
        averageRating: 0,
      };
    }

    // Set sharedAt date if not already set
    if (
      this.isSharedToCommunity &&
      this.communityData &&
      !this.communityData.sharedAt
    ) {
      this.communityData.sharedAt = new Date();
    }

    next();
  });

  // --- POST-SAVE MIDDLEWARE ---
  LessonPlanSchema.post("save", function (doc) {
    // You can add any post-save logic here, like updating statistics
    console.log(`Lesson plan ${doc._id} has been saved`);
  });

  // Create the model from the schema and export it
  module.exports = mongoose.model("LessonPlan", LessonPlanSchema);
}
