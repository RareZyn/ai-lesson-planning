// utils/gradientColors.js

// Array of predefined gradient combinations
const GRADIENT_COLORS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Purple to Dark Purple
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // Pink to Red
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue to Cyan
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Green to Teal
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", // Pink to Yellow
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", // Cyan to Dark Blue
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", // Light Blue to Pink
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", // Light Pink to Purple
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", // Peach to Orange
  "linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)", // Red to Light Blue
];

/**
 * Generates a consistent gradient color based on a given ID
 * @param {string} id - The unique identifier (e.g., lesson ID)
 * @returns {string} CSS gradient string
 */
export const getGradientForId = (id) => {
  if (!id) {
    // Return a default gradient if no ID is provided
    return GRADIENT_COLORS[0];
  }

  // Create a hash from the ID string
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Ensure the hash is positive and get the index
  const index = Math.abs(hash) % GRADIENT_COLORS.length;
  return GRADIENT_COLORS[index];
};

/**
 * Alternative hash function using a different algorithm
 * This can be used if you want different distribution
 * @param {string} id - The unique identifier
 * @returns {string} CSS gradient string
 */
export const getGradientForIdAlt = (id) => {
  if (!id) {
    return GRADIENT_COLORS[0];
  }

  // Simple sum of character codes
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const index = hash % GRADIENT_COLORS.length;
  return GRADIENT_COLORS[index];
};

/**
 * Get gradient by a specific index (useful for testing or manual assignment)
 * @param {number} index - The index of the gradient
 * @returns {string} CSS gradient string
 */
export const getGradientByIndex = (index) => {
  const safeIndex = Math.abs(index) % GRADIENT_COLORS.length;
  return GRADIENT_COLORS[safeIndex];
};

/**
 * Get all available gradients (useful for preview)
 * @returns {Array<string>} Array of CSS gradient strings
 */
export const getAllGradients = () => {
  return [...GRADIENT_COLORS];
};

// Export the gradient colors array if needed elsewhere
export { GRADIENT_COLORS };
