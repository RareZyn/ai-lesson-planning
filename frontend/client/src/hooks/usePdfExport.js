// src/hooks/usePdfExport.js - React hook for PDF export functionality
import { useState, useCallback } from "react";
import { message } from "antd";
import pdfExportService from "../services/enhancedPdfExport";

/**
 * Custom hook for handling PDF exports with loading states and error handling
 */
export const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  /**
   * Export Activity View to PDF
   */
  const exportActivityToPdf = useCallback(
    async (activityData, options = {}) => {
      setIsExporting(true);
      setExportProgress(0);

      try {
        // Show progress
        setExportProgress(25);
        message.loading("Preparing activity for PDF export...", 0);

        // Format activity data for PDF
        const formattedData = {
          title:
            activityData.title ||
            activityData.assessmentTitle ||
            "Activity Document",
          subject: activityData.subject || "English",
          grade:
            activityData.grade || activityData.parameters?.grade || "Form 4",
          duration:
            activityData.duration || activityData.timeAllocation || "N/A",
          activityType:
            activityData.activityType || activityData.type || "Activity",
          instructions:
            activityData.instructions || activityData.description || "",
          activities:
            activityData.activities ||
            activityData.questions ||
            activityData.content ||
            [],
          generatedAt: new Date().toISOString(),
          ...activityData,
        };

        setExportProgress(50);

        // Export to PDF
        const result = await pdfExportService.exportActivityToPdf(
          formattedData,
          options
        );

        setExportProgress(100);
        message.destroy(); // Clear loading message
        message.success(`Activity exported successfully as ${result.fileName}`);

        return result;
      } catch (error) {
        console.error("Failed to export activity:", error);
        message.destroy();
        message.error("Failed to export activity to PDF. Please try again.");
        throw error;
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    },
    []
  );

  /**
   * Export Rubric View to PDF
   */
  const exportRubricToPdf = useCallback(async (rubricData, options = {}) => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      setExportProgress(25);
      message.loading("Preparing rubric for PDF export...", 0);

      // Format rubric data for PDF
      const formattedData = {
        title:
          rubricData.title || rubricData.assessmentTitle || "Assessment Rubric",
        subject: rubricData.subject || "English",
        grade: rubricData.grade || rubricData.parameters?.grade || "Form 4",
        criteria: rubricData.criteria || rubricData.rubric?.criteria || [],
        notes: rubricData.notes || rubricData.additionalNotes || "",
        totalPoints: rubricData.totalPoints || 0,
        generatedAt: new Date().toISOString(),
        ...rubricData,
      };

      setExportProgress(50);

      // Export to PDF
      const result = await pdfExportService.exportRubricToPdf(formattedData, {
        orientation: "landscape",
        ...options,
      });

      setExportProgress(100);
      message.destroy();
      message.success(`Rubric exported successfully as ${result.fileName}`);

      return result;
    } catch (error) {
      console.error("Failed to export rubric:", error);
      message.destroy();
      message.error("Failed to export rubric to PDF. Please try again.");
      throw error;
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, []);

  /**
   * Export HTML element to PDF with high quality
   */
  const exportElementToPdf = useCallback(
    async (elementId, fileName, options = {}) => {
      setIsExporting(true);
      setExportProgress(0);

      try {
        setExportProgress(25);
        message.loading("Capturing content for PDF...", 0);

        // Check if element exists
        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error(`Element with ID '${elementId}' not found`);
        }

        setExportProgress(50);

        // Export element to PDF
        const result = await pdfExportService.exportHtmlElementToPdf(
          elementId,
          fileName,
          options
        );

        setExportProgress(100);
        message.destroy();
        message.success(`Document exported successfully as ${result.fileName}`);

        return result;
      } catch (error) {
        console.error("Failed to export element:", error);
        message.destroy();
        message.error("Failed to export to PDF. Please try again.");
        throw error;
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    },
    []
  );

  /**
   * Export assessment with automatic type detection
   */
  const exportAssessmentToPdf = useCallback(
    async (assessmentData, options = {}) => {
      try {
        // Auto-detect if it's a rubric or activity
        const isRubric = !!(
          assessmentData.criteria ||
          assessmentData.rubric?.criteria ||
          assessmentData.type === "rubric" ||
          assessmentData.assessmentType === "rubric"
        );

        if (isRubric) {
          return await exportRubricToPdf(assessmentData, options);
        } else {
          return await exportActivityToPdf(assessmentData, options);
        }
      } catch (error) {
        console.error("Failed to export assessment:", error);
        throw error;
      }
    },
    [exportActivityToPdf, exportRubricToPdf]
  );

  return {
    // Export functions
    exportActivityToPdf,
    exportRubricToPdf,
    exportElementToPdf,
    exportAssessmentToPdf,

    // State
    isExporting,
    exportProgress,

    // Utility
    canExport: !isExporting,
  };
};

export default usePdfExport;
