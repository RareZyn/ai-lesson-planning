import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 120000, // 2 minutes for OCR processing
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("OCR Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("OCR API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

/**
 * Convert file to base64 data URL
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Compress image if needed (basic quality reduction)
 */
const compressImage = (base64Image, maxSizeMB = 10) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate new dimensions (maintain aspect ratio)
      const MAX_WIDTH = 2000;
      const MAX_HEIGHT = 2000;

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels
      let quality = 0.9;
      let compressedBase64 = canvas.toDataURL("image/jpeg", quality);

      // Check size and reduce quality if needed
      const sizeInMB = (compressedBase64.length * 0.75) / (1024 * 1024);

      if (sizeInMB > maxSizeMB) {
        quality = 0.7;
        compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      }

      resolve(compressedBase64);
    };

    img.onerror = (error) => reject(error);
  });
};

export const ocrAPI = {
  /**
   * Extract text from a single image
   * @param {File|string} imageInput - File object or base64 string
   * @param {boolean} autoCompress - Whether to auto-compress large images
   * @returns {Promise<Object>} OCR result with extracted text
   */
  extractText: async (imageInput, autoCompress = true) => {
    try {
      let base64Image;

      // Convert File to base64 if needed
      if (imageInput instanceof File) {
        base64Image = await fileToBase64(imageInput);
      } else if (typeof imageInput === "string") {
        base64Image = imageInput;
      } else {
        throw new Error("Invalid image input type");
      }

      // Auto-compress if image is large
      if (autoCompress) {
        const sizeInMB = (base64Image.length * 0.75) / (1024 * 1024);
        if (sizeInMB > 10) {
          console.log(
            `📦 Compressing image (${sizeInMB.toFixed(
              2
            )} MB -> target <10 MB)...`
          );
          base64Image = await compressImage(base64Image, 10);
          const newSize = (base64Image.length * 0.75) / (1024 * 1024);
          console.log(`✅ Compressed to ${newSize.toFixed(2)} MB`);
        }
      }

      const response = await apiClient.post("/ocr/extract", {
        image: base64Image,
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Error extracting text:", error);

      let errorMessage = "Failed to extract text from image";

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data.message || "Invalid image or request";
      } else if (error.response?.status === 401) {
        errorMessage =
          "Invalid API key. Please check your Gemini API key in settings.";
      } else if (error.response?.status === 429) {
        errorMessage =
          "API quota exceeded. Please try again later or check your Gemini API limits.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Batch extract text from multiple images
   * @param {Array<File|string>} images - Array of File objects or base64 strings
   * @param {boolean} autoCompress - Whether to auto-compress large images
   * @returns {Promise<Object>} Batch OCR results
   */
  batchExtractText: async (images, autoCompress = true) => {
    try {
      if (!Array.isArray(images) || images.length === 0) {
        throw new Error("Invalid images array");
      }

      if (images.length > 10) {
        throw new Error("Maximum 10 images allowed per batch");
      }

      console.log(`📊 Processing batch of ${images.length} images...`);

      // Convert all images to base64
      const base64Images = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        let base64Image;

        if (image instanceof File) {
          base64Image = await fileToBase64(image);
        } else if (typeof image === "string") {
          base64Image = image;
        } else {
          console.warn(`Skipping invalid image at index ${i}`);
          continue;
        }

        // Auto-compress if needed
        if (autoCompress) {
          const sizeInMB = (base64Image.length * 0.75) / (1024 * 1024);
          if (sizeInMB > 10) {
            console.log(`📦 Compressing image ${i + 1}...`);
            base64Image = await compressImage(base64Image, 10);
          }
        }

        base64Images.push(base64Image);
      }

      const response = await apiClient.post("/ocr/batch", {
        images: base64Images,
      });

      return {
        success: true,
        data: response.data.data,
        summary: response.data.summary,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Error in batch extraction:", error);

      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to process batch images",
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Extract multiple numbered answers from a single image
   * @param {File|string} imageInput - File object or base64 string
   * @param {Object} options - Optional configuration
   * @param {string} options.assessmentId - Assessment ID for context
   * @param {number} options.expectedQuestionCount - Expected number of questions
   * @returns {Promise<Object>} Extraction result with answers array
   */
  extractMultiAnswers: async (imageInput, options = {}) => {
    try {
      let base64Image;

      // Convert File to base64 if needed
      if (imageInput instanceof File) {
        base64Image = await fileToBase64(imageInput);
      } else if (typeof imageInput === "string") {
        base64Image = imageInput;
      } else {
        throw new Error("Invalid image input type");
      }

      // Auto-compress if image is large
      const sizeInMB = (base64Image.length * 0.75) / (1024 * 1024);
      if (sizeInMB > 10 && base64Image.startsWith("data:image/")) {
        console.log(
          `📦 Compressing image (${sizeInMB.toFixed(2)} MB -> target <10 MB)...`
        );
        base64Image = await compressImage(base64Image, 10);
        const newSize = (base64Image.length * 0.75) / (1024 * 1024);
        console.log(`✅ Compressed to ${newSize.toFixed(2)} MB`);
      }

      console.log("🔍 Extracting multiple answers from image...");

      const response = await apiClient.post("/ocr/extract-multi-answers", {
        image: base64Image,
        assessmentId: options.assessmentId || null,
        expectedQuestionCount: options.expectedQuestionCount || null,
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Error extracting multiple answers:", error);

      let errorMessage = "Failed to extract answers from image";

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data.message || "Invalid image or request";
      } else if (error.response?.status === 401) {
        errorMessage =
          "Invalid API key. Please check your Gemini API key in settings.";
      } else if (error.response?.status === 429) {
        errorMessage =
          "API quota exceeded. Please try again later or check your Gemini API limits.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Process OCR for a student submission
   * @param {string} submissionId - Submission ID to process
   * @returns {Promise<Object>} OCR processing result
   */
  processSubmissionOCR: async (submissionId) => {
    try {
      console.log(`🔍 Starting OCR processing for submission: ${submissionId}`);

      const response = await apiClient.post(
        `/ocr/process-submission/${submissionId}`
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "OCR processing completed",
      };
    } catch (error) {
      console.error("Error processing submission OCR:", error);

      let errorMessage = "Failed to process OCR";

      if (error.response?.status === 404) {
        errorMessage = "Submission not found";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || error,
      };
    }
  },

  /**
   * Validate image or PDF before upload
   * @param {File} file - Image or PDF file to validate
   * @returns {Object} Validation result
   */
  validateImage: (file) => {
    const errors = [];
    const warnings = [];

    // Check if file exists
    if (!file) {
      errors.push("No file provided");
      return { isValid: false, errors, warnings };
    }

    // Check file type - accept images and PDFs
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      errors.push("Invalid file type. Only JPG, PNG, and PDF are supported.");
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      errors.push(
        `File size (${(file.size / 1024 / 1024).toFixed(
          2
        )} MB) exceeds 50MB limit`
      );
    } else if (file.size > 10 * 1024 * 1024) {
      warnings.push(
        `Large file (${(file.size / 1024 / 1024).toFixed(
          2
        )} MB) - ${isPdf ? 'PDF will be processed as-is' : 'will be compressed automatically'}`
      );
    }

    // Check image format (only for images, not PDFs)
    if (isImage) {
      const supportedFormats = ["image/jpeg", "image/jpg", "image/png"];
      if (!supportedFormats.includes(file.type)) {
        warnings.push(
          `Format ${file.type} may not be optimal. JPEG/PNG recommended.`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },
};

// Utility functions
export const ocrUtils = {
  /**
   * Get confidence color for UI display
   */
  getConfidenceColor: (confidence) => {
    if (confidence >= 0.8) return { color: "#52c41a", label: "High" };
    if (confidence >= 0.6) return { color: "#faad14", label: "Medium" };
    return { color: "#ff4d4f", label: "Low" };
  },

  /**
   * Format processing time
   */
  formatProcessingTime: (seconds) => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
  },

  /**
   * Calculate image dimensions from base64
   */
  getImageDimensions: (base64Image) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = base64Image;
    });
  },
};

export default ocrAPI;
