// utils/activityTypeMapper.js

const ACTIVITY_TYPE_MAPPING = {
  activityInClass: "activityInClass",
  activity: "activity",
  essay: "essay",
  textbook: "textbook",
  assessment: "assessment",
  "spm-exam": "spm-exam",
};

/**
 * Validate and map activity type to standardized format
 * @param {string} activityType - Raw activity type from request
 * @returns {string} - Mapped activity type
 */
const validateAndMapActivityType = (activityType) => {
  if (!activityType) {
    return "activity";
  }

  const mapped = ACTIVITY_TYPE_MAPPING[activityType.toLowerCase()];
  if (!mapped) {
    console.warn(
      `Unknown activity type "${activityType}", defaulting to "activity"`
    );
    return "activity";
  }

  console.log(`Mapped activity type: "${activityType}" -> "${mapped}"`);
  return mapped;
};

module.exports = {
  validateAndMapActivityType,
  ACTIVITY_TYPE_MAPPING,
};
