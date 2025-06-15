// src/services/enhancedPdfExport.js - Advanced PDF export with preserved styling
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Enhanced PDF Export Service with High-Quality Styling Preservation
 */
class EnhancedPdfExport {
  constructor() {
    this.defaultOptions = {
      format: "a4",
      orientation: "portrait",
      unit: "mm",
      compress: true,
      precision: 2,
    };

    this.margins = {
      top: 15,
      right: 15,
      bottom: 15,
      left: 15,
    };

    this.colors = {
      primary: "#1890ff",
      secondary: "#52c41a",
      text: "#262626",
      textSecondary: "#8c8c8c",
      border: "#f0f0f0",
      background: "#ffffff",
    };
  }

  /**
   * Export Activity View to PDF with preserved styling
   */
  async exportActivityToPdf(activityData, options = {}) {
    try {
      const doc = new jsPDF({
        ...this.defaultOptions,
        ...options,
      });

      let yPosition = this.margins.top;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (this.margins.left + this.margins.right);

      // Add header
      yPosition = this.addHeader(doc, activityData, yPosition, contentWidth);

      // Add activity details
      yPosition = this.addActivityDetails(
        doc,
        activityData,
        yPosition,
        contentWidth
      );

      // Add instructions section
      if (activityData.instructions) {
        yPosition = this.addInstructions(
          doc,
          activityData.instructions,
          yPosition,
          contentWidth
        );
      }

      // Add activities/questions
      if (activityData.activities) {
        yPosition = this.addActivitiesSection(
          doc,
          activityData.activities,
          yPosition,
          contentWidth
        );
      }

      // Add footer
      this.addFooter(doc, activityData);

      // Save the PDF
      const fileName = `Activity_${
        activityData.title?.replace(/[^a-z0-9]/gi, "_") || "Document"
      }.pdf`;
      doc.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error("Error exporting activity to PDF:", error);
      throw new Error("Failed to export activity to PDF");
    }
  }

  /**
   * Export Rubric View to PDF with preserved styling
   */
  async exportRubricToPdf(rubricData, options = {}) {
    try {
      const doc = new jsPDF({
        ...this.defaultOptions,
        orientation: "landscape", // Rubrics often need more width
        ...options,
      });

      let yPosition = this.margins.top;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (this.margins.left + this.margins.right);

      // Add header
      yPosition = this.addRubricHeader(
        doc,
        rubricData,
        yPosition,
        contentWidth
      );

      // Add rubric table
      yPosition = this.addRubricTable(doc, rubricData, yPosition, contentWidth);

      // Add additional notes if any
      if (rubricData.notes) {
        yPosition = this.addNotes(
          doc,
          rubricData.notes,
          yPosition,
          contentWidth
        );
      }

      // Add footer
      this.addFooter(doc, rubricData);

      // Save the PDF
      const fileName = `Rubric_${
        rubricData.title?.replace(/[^a-z0-9]/gi, "_") || "Document"
      }.pdf`;
      doc.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error("Error exporting rubric to PDF:", error);
      throw new Error("Failed to export rubric to PDF");
    }
  }

  /**
   * High-quality HTML to PDF conversion (alternative method)
   */
  async exportHtmlElementToPdf(
    elementId,
    fileName = "document.pdf",
    options = {}
  ) {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID '${elementId}' not found`);
      }

      // Temporarily modify styles for better PDF rendering
      const originalStyles = this.prepareElementForPdf(element);

      // Generate canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      // Restore original styles
      this.restoreElementStyles(element, originalStyles);

      // Create PDF from canvas
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF({
        ...this.defaultOptions,
        ...options,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pageWidth - (this.margins.left + this.margins.right);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = this.margins.top;
      let remainingHeight = imgHeight;

      // Handle multi-page documents
      while (remainingHeight > 0) {
        const pageContentHeight =
          pageHeight - (this.margins.top + this.margins.bottom);
        const currentPageHeight = Math.min(remainingHeight, pageContentHeight);

        // Calculate source positioning for this page
        const sourceY = imgHeight - remainingHeight;
        const sourceHeight = (currentPageHeight * canvas.height) / imgHeight;

        // Create a temporary canvas for this page
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext("2d");

        pageCtx.drawImage(
          canvas,
          0,
          (sourceY * canvas.height) / imgHeight,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL("image/png");
        doc.addImage(
          pageImgData,
          "PNG",
          this.margins.left,
          yPosition,
          imgWidth,
          currentPageHeight
        );

        remainingHeight -= currentPageHeight;

        if (remainingHeight > 0) {
          doc.addPage();
          yPosition = this.margins.top;
        }
      }

      doc.save(fileName);
      return { success: true, fileName };
    } catch (error) {
      console.error("Error exporting HTML to PDF:", error);
      throw new Error("Failed to export to PDF");
    }
  }

  /**
   * Add styled header to PDF
   */
  addHeader(doc, data, yPosition, contentWidth) {
    // Background header
    doc.setFillColor(24, 144, 255); // Primary blue
    doc.rect(this.margins.left, yPosition - 5, contentWidth, 25, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(
      data.title || "Activity Document",
      this.margins.left + 10,
      yPosition + 10
    );

    // Subtitle/Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const dateStr = new Date().toLocaleDateString();
    doc.text(`Generated on ${dateStr}`, this.margins.left + 10, yPosition + 18);

    return yPosition + 35;
  }

  /**
   * Add rubric header to PDF
   */
  addRubricHeader(doc, data, yPosition, contentWidth) {
    // Background header
    doc.setFillColor(82, 196, 26); // Green for rubrics
    doc.rect(this.margins.left, yPosition - 5, contentWidth, 25, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(
      data.title || "Assessment Rubric",
      this.margins.left + 10,
      yPosition + 10
    );

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const dateStr = new Date().toLocaleDateString();
    doc.text(`Generated on ${dateStr}`, this.margins.left + 10, yPosition + 18);

    return yPosition + 35;
  }

  /**
   * Add activity details section
   */
  addActivityDetails(doc, data, yPosition, contentWidth) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(38, 38, 38);
    doc.text("Activity Details", this.margins.left, yPosition);
    yPosition += 10;

    // Details box
    doc.setDrawColor(240, 240, 240);
    doc.setFillColor(248, 249, 250);
    doc.rect(this.margins.left, yPosition, contentWidth, 30, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(89, 89, 89);

    const details = [
      `Subject: ${data.subject || "N/A"}`,
      `Grade: ${data.grade || "N/A"}`,
      `Duration: ${data.duration || "N/A"}`,
      `Type: ${data.activityType || "N/A"}`,
    ];

    details.forEach((detail, index) => {
      const xPos = this.margins.left + 10 + (index % 2) * (contentWidth / 2);
      const yPos = yPosition + 10 + Math.floor(index / 2) * 10;
      doc.text(detail, xPos, yPos);
    });

    return yPosition + 40;
  }

  /**
   * Add instructions section
   */
  addInstructions(doc, instructions, yPosition, contentWidth) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(38, 38, 38);
    doc.text("Instructions", this.margins.left, yPosition);
    yPosition += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(89, 89, 89);

    const instructionLines = doc.splitTextToSize(instructions, contentWidth);
    instructionLines.forEach((line) => {
      if (yPosition > doc.internal.pageSize.getHeight() - this.margins.bottom) {
        doc.addPage();
        yPosition = this.margins.top;
      }
      doc.text(line, this.margins.left, yPosition);
      yPosition += 6;
    });

    return yPosition + 10;
  }

  /**
   * Add activities/questions section
   */
  addActivitiesSection(doc, activities, yPosition, contentWidth) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(38, 38, 38);
    doc.text("Activities", this.margins.left, yPosition);
    yPosition += 15;

    activities.forEach((activity, index) => {
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage();
        yPosition = this.margins.top;
      }

      // Activity number
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(24, 144, 255);
      doc.text(`${index + 1}. `, this.margins.left, yPosition);

      // Activity content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(89, 89, 89);

      const activityText =
        typeof activity === "string"
          ? activity
          : activity.description || activity.text;
      const lines = doc.splitTextToSize(activityText, contentWidth - 15);

      lines.forEach((line) => {
        doc.text(line, this.margins.left + 15, yPosition);
        yPosition += 6;
      });

      yPosition += 8;
    });

    return yPosition;
  }

  /**
   * Add rubric table
   */
  addRubricTable(doc, rubricData, yPosition, contentWidth) {
    if (!rubricData.criteria || !Array.isArray(rubricData.criteria)) {
      return yPosition;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(38, 38, 38);
    doc.text("Assessment Criteria", this.margins.left, yPosition);
    yPosition += 15;

    const tableStartY = yPosition;
    const rowHeight = 20;
    const colWidth = contentWidth / 5; // Assuming 5 columns (criteria + 4 levels)

    // Table headers
    const headers = [
      "Criteria",
      "Excellent (4)",
      "Good (3)",
      "Fair (2)",
      "Poor (1)",
    ];

    // Header row
    doc.setFillColor(24, 144, 255);
    doc.rect(this.margins.left, yPosition, contentWidth, rowHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);

    headers.forEach((header, index) => {
      const xPos = this.margins.left + index * colWidth + 5;
      doc.text(header, xPos, yPosition + 12);
    });

    yPosition += rowHeight;

    // Table rows
    rubricData.criteria.forEach((criterion, rowIndex) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPosition = this.margins.top;
      }

      // Alternating row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(this.margins.left, yPosition, contentWidth, rowHeight, "F");
      }

      // Border
      doc.setDrawColor(240, 240, 240);
      doc.rect(this.margins.left, yPosition, contentWidth, rowHeight, "D");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(89, 89, 89);

      // Criterion name
      const criterionText = doc.splitTextToSize(
        criterion.name || criterion.title,
        colWidth - 10
      );
      doc.text(criterionText, this.margins.left + 5, yPosition + 10);

      // Performance levels
      const levels = criterion.levels || [];
      levels.forEach((level, levelIndex) => {
        const xPos = this.margins.left + (levelIndex + 1) * colWidth + 5;
        const levelText = doc.splitTextToSize(
          level.description || level,
          colWidth - 10
        );
        doc.text(levelText, xPos, yPosition + 10);
      });

      yPosition += rowHeight;
    });

    return yPosition + 10;
  }

  /**
   * Add notes section
   */
  addNotes(doc, notes, yPosition, contentWidth) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(38, 38, 38);
    doc.text("Additional Notes", this.margins.left, yPosition);
    yPosition += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(89, 89, 89);

    const noteLines = doc.splitTextToSize(notes, contentWidth);
    noteLines.forEach((line) => {
      if (yPosition > doc.internal.pageSize.getHeight() - this.margins.bottom) {
        doc.addPage();
        yPosition = this.margins.top;
      }
      doc.text(line, this.margins.left, yPosition);
      yPosition += 6;
    });

    return yPosition;
  }

  /**
   * Add footer to PDF
   */
  addFooter(doc, data) {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer line
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setDrawColor(240, 240, 240);
      doc.line(
        this.margins.left,
        pageHeight - 20,
        pageWidth - this.margins.right,
        pageHeight - 20
      );

      // Footer text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);

      // Left side - document info
      const footerLeft = `${
        data.title || "Document"
      } | Generated by AI Lesson Planner`;
      doc.text(footerLeft, this.margins.left, pageHeight - 10);

      // Right side - page number
      const footerRight = `Page ${i} of ${pageCount}`;
      const footerRightWidth = doc.getTextWidth(footerRight);
      doc.text(
        footerRight,
        pageWidth - this.margins.right - footerRightWidth,
        pageHeight - 10
      );
    }
  }

  /**
   * Prepare HTML element for better PDF rendering
   */
  prepareElementForPdf(element) {
    const originalStyles = new Map();

    // Store original styles
    const computedStyle = window.getComputedStyle(element);
    originalStyles.set(element, {
      backgroundColor: element.style.backgroundColor,
      color: element.style.color,
      fontSize: element.style.fontSize,
    });

    // Apply PDF-friendly styles temporarily
    element.style.backgroundColor = "#ffffff";
    element.style.color = "#000000";

    // Process child elements
    const allElements = element.querySelectorAll("*");
    allElements.forEach((el) => {
      originalStyles.set(el, {
        backgroundColor: el.style.backgroundColor,
        color: el.style.color,
        boxShadow: el.style.boxShadow,
      });

      // Make backgrounds white and text black for better PDF contrast
      if (window.getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)") {
        el.style.backgroundColor = "#ffffff";
      }
      el.style.color = "#000000";
      el.style.boxShadow = "none";
    });

    return originalStyles;
  }

  /**
   * Restore original element styles
   */
  restoreElementStyles(element, originalStyles) {
    originalStyles.forEach((styles, el) => {
      Object.keys(styles).forEach((prop) => {
        el.style[prop] = styles[prop];
      });
    });
  }
}

// Export singleton instance
export const pdfExportService = new EnhancedPdfExport();
export default pdfExportService;
