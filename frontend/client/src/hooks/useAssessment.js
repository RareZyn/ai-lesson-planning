// src/hooks/useAssessment.js
import { useState, useCallback } from "react";
import { assessmentAPI, assessmentUtils } from "../services/assessmentService";
import { message } from "antd";

/**
 * Custom hook for managing assessment operations
 */
export const useAssessment = () => {
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Generate assessment from lesson plan
   */
  const generateFromLessonPlan = useCallback(
    async (lessonPlanData, activityFormData) => {
      setLoading(true);
      setError(null);

      try {
        // Validate form data
        const validation =
          assessmentUtils.validateAssessmentForm(activityFormData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(", "));
        }

        // Prepare lesson plan data
        const preparedLessonData = assessmentUtils.prepareLessonPlanData(
          lessonPlanData,
          activityFormData.classInfo
        );

        // Generate assessment
        const result = await assessmentAPI.generateFromLessonPlan(
          preparedLessonData,
          activityFormData
        );

        if (result.success) {
          setCurrentAssessment(result.data);
          message.success("Assessment generated successfully!");
          return result;
        } else {
          throw new Error(result.message || "Failed to generate assessment");
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to generate assessment";
        setError(errorMessage);
        message.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get user's assessments
   */
  const getUserAssessments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await assessmentAPI.getUserAssessments(filters);
      setAssessments(result.data || []);
      return result;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch assessments";
      setError(errorMessage);
      message.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get assessment by ID
   */
  const getAssessmentById = useCallback(async (assessmentId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await assessmentAPI.getAssessmentById(assessmentId);
      setCurrentAssessment(result.data);
      return result;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch assessment";
      setError(errorMessage);
      message.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update assessment
   */
  const updateAssessment = useCallback(async (assessmentId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await assessmentAPI.updateAssessment(
        assessmentId,
        updateData
      );
      setCurrentAssessment(result.data);
      message.success("Assessment updated successfully!");
      return result;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update assessment";
      setError(errorMessage);
      message.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete assessment
   */
  const deleteAssessment = useCallback(async (assessmentId) => {
    setLoading(true);
    setError(null);

    try {
      await assessmentAPI.deleteAssessment(assessmentId);
      setAssessments((prev) =>
        prev.filter((assessment) => assessment._id !== assessmentId)
      );
      message.success("Assessment deleted successfully!");
      return true;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete assessment";
      setError(errorMessage);
      message.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Export assessment
   */
  const exportAssessment = useCallback(async (assessmentId, format = "pdf") => {
    setLoading(true);
    setError(null);

    try {
      await assessmentAPI.exportAssessment(assessmentId, format);
      message.success(
        `Assessment exported as ${format.toUpperCase()} successfully!`
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to export assessment";
      setError(errorMessage);
      message.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get assessments by lesson plan
   */
  const getAssessmentsByLessonPlan = useCallback(async (lessonPlanId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await assessmentAPI.getAssessmentsByLessonPlan(
        lessonPlanId
      );
      return result.data || [];
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch assessments";
      setError(errorMessage);
      console.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get assessments by class
   */
  const getAssessmentsByClass = useCallback(async (classId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await assessmentAPI.getAssessmentsByClass(classId);
      return result.data || [];
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch assessments";
      setError(errorMessage);
      console.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear current assessment
   */
  const clearCurrentAssessment = useCallback(() => {
    setCurrentAssessment(null);
    setError(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    assessments,
    currentAssessment,
    error,

    // Actions
    generateFromLessonPlan,
    getUserAssessments,
    getAssessmentById,
    updateAssessment,
    deleteAssessment,
    exportAssessment,
    getAssessmentsByLessonPlan,
    getAssessmentsByClass,
    clearCurrentAssessment,
    clearError,

    // Utils
    getDefaultSettings: assessmentUtils.getDefaultSettings,
    validateForm: assessmentUtils.validateAssessmentForm,
  };
};

export default useAssessment;
