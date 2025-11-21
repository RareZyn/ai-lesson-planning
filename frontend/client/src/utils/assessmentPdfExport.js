// frontend/client/src/utils/assessmentPdfExport.js
// PDF Export utility for assessments and rubrics with proper styling and page breaks

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export assessment or rubric to PDF with proper styling
 * Handles SPM Paper 1 answer sheet as a separate page
 * Prevents page breaks within questions/sections
 */
export const exportAssessmentToPdf = async (htmlContent, options = {}) => {
  const {
    fileName = 'assessment.pdf',
    // title and paperType removed as they're unused
    // isSpmPaper1 = false,
    // paperType = null,
  } = options;

  let container = null;

  try {
    // Create a temporary container for the HTML content (completely hidden)
    container = document.createElement('div');
    container.id = 'pdf-export-container-' + Date.now();
    container.style.cssText = `
      position: fixed;
      left: -99999px;
      top: -99999px;
      width: 210mm;
      background: white;
      padding: 15mm;
      font-family: Arial, sans-serif;
      z-index: -9999;
      visibility: hidden;
      opacity: 0;
      pointer-events: none;
      overflow: hidden;
    `;
    container.innerHTML = htmlContent;

    // Add enhanced styling for PDF export
    addPdfStyles(container, isSpmPaper1);

    document.body.appendChild(container);

    // Small delay to ensure DOM is ready and rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    // Wait for any images to load
    await waitForImages(container);

    // Check if this contains SPM answer sheet
    const hasAnswerSheet = container.querySelector('.spm-answer-sheet');

    if (hasAnswerSheet && isSpmPaper1) {
      // Handle SPM Paper 1 with answer sheet separately
      await exportSpmPaper1WithAnswerSheet(container, fileName);
    } else {
      // Regular export for all other content
      await exportRegularContent(container, fileName);
    }

    return { success: true, message: 'PDF exported successfully' };
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error(`Failed to export PDF: ${error.message || 'Unknown error'}`);
  } finally {
    // Clean up - always remove the container
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Add enhanced PDF-specific styles to prevent unwanted page breaks
 */
const addPdfStyles = (container, isSpmPaper1) => {
  const style = document.createElement('style');
  style.textContent = `
    /* Prevent page breaks inside important elements */
    .question,
    .question-wrapper,
    .answer-item,
    .exam-part,
    .rubric-table tr,
    .activity-content > div,
    .assessment-content > div,
    .answer-key-content > div {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Keep headers with their content */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    /* Ensure answer sheet is on its own page */
    .spm-answer-sheet {
      page-break-before: always !important;
      page-break-inside: avoid !important;
      break-before: always !important;
      break-inside: avoid !important;
      width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 auto !important;
      display: block !important;
      position: relative !important;
    }

    /* Compact spacing for better fit */
    .question {
      margin-bottom: 15px;
      padding: 10px;
    }

    /* Table row protection */
    table {
      page-break-inside: auto !important;
    }

    tr {
      page-break-inside: avoid !important;
      page-break-after: auto !important;
    }

    thead {
      display: table-header-group !important;
    }

    tfoot {
      display: table-footer-group !important;
    }

    /* Ensure good typography */
    body, div, p, span, td, th {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  `;
  container.appendChild(style);
};

/**
 * Wait for all images in the container to load
 */
const waitForImages = (container) => {
  const images = container.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = resolve; // Still resolve even if image fails
      setTimeout(resolve, 3000); // Timeout after 3 seconds
    });
  });
  return Promise.all(promises);
};

/**
 * Export SPM Paper 1 with answer sheet on a separate page
 */
const exportSpmPaper1WithAnswerSheet = async (container, fileName) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Separate the main content from the answer sheet
  const answerSheet = container.querySelector('.spm-answer-sheet');

  // Create a wrapper for main content (without answer sheet)
  const mainWrapper = document.createElement('div');
  mainWrapper.id = 'pdf-main-content-' + Date.now();
  mainWrapper.style.cssText = container.style.cssText;
  mainWrapper.innerHTML = container.innerHTML;

  const mainAnswerSheet = mainWrapper.querySelector('.spm-answer-sheet');
  if (mainAnswerSheet) {
    mainAnswerSheet.remove(); // Remove answer sheet from main content
  }

  // Append main wrapper temporarily
  document.body.appendChild(mainWrapper);

  try {
    // Small delay for rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Temporarily make visible for rendering
    mainWrapper.style.visibility = 'visible';
    mainWrapper.style.opacity = '1';

    // Export main exam content first
    console.log('Rendering main content to canvas...');
    const mainCanvas = await html2canvas(mainWrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: mainWrapper.scrollWidth,
      windowHeight: mainWrapper.scrollHeight,
    });

    // Hide again
    mainWrapper.style.visibility = 'hidden';
    mainWrapper.style.opacity = '0';

    console.log('Adding main content to PDF...');
    await addCanvasToPdf(pdf, mainCanvas, false);

    // Add answer sheet on a new page
    if (answerSheet) {
      console.log('Adding new page for answer sheet...');
      pdf.addPage();

      // Make answer sheet temporarily visible
      answerSheet.style.visibility = 'visible';
      answerSheet.style.opacity = '1';
      answerSheet.style.position = 'fixed';
      answerSheet.style.left = '-99999px';
      answerSheet.style.top = '0';

      console.log('Rendering answer sheet to canvas...');
      const answerSheetCanvas = await html2canvas(answerSheet, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: answerSheet.scrollWidth,
        windowHeight: answerSheet.scrollHeight,
      });

      // Hide again
      answerSheet.style.visibility = 'hidden';
      answerSheet.style.opacity = '0';

      console.log('Adding answer sheet to PDF...');
      await addCanvasToPdf(pdf, answerSheetCanvas, true, true);
    }

    console.log('Saving PDF:', fileName);
    pdf.save(fileName);
  } catch (error) {
    console.error('Error in exportSpmPaper1WithAnswerSheet:', error);
    throw error;
  } finally {
    // Clean up main wrapper
    if (mainWrapper.parentNode) {
      document.body.removeChild(mainWrapper);
    }
  }
};

/**
 * Export regular content (non-SPM or SPM without answer sheet)
 */
const exportRegularContent = async (container, fileName) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  try {
    console.log('Rendering content to canvas...');

    // Temporarily make visible for rendering
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });

    // Hide again immediately
    container.style.visibility = 'hidden';
    container.style.opacity = '0';

    console.log('Adding content to PDF...');
    await addCanvasToPdf(pdf, canvas, false);

    console.log('Saving PDF:', fileName);
    pdf.save(fileName);
  } catch (error) {
    console.error('Error in exportRegularContent:', error);
    throw error;
  }
};

/**
 * Add canvas content to PDF, handling multi-page content
 */
const addCanvasToPdf = async (pdf, canvas, isFirstPage = false, isSinglePage = false) => {
  const imgData = canvas.toDataURL('image/png');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  const ratio = canvasWidth / canvasHeight;
  const width = pdfWidth;
  const height = width / ratio;

  if (isSinglePage || height <= pdfHeight) {
    // Single page - fit to page
    const yOffset = (pdfHeight - height) / 2; // Center vertically if smaller
    if (!isFirstPage) {
      pdf.addImage(imgData, 'PNG', 0, Math.max(0, yOffset), width, height);
    } else {
      pdf.addImage(imgData, 'PNG', 0, Math.max(0, yOffset), width, height);
    }
  } else {
    // Multiple pages needed
    let heightLeft = height;
    // position variable removed as it's unused
    let page = 0;

    while (heightLeft > 0) {
      if (page > 0) {
        pdf.addPage();
      }

      const pageCanvas = document.createElement('canvas');
      const pageContext = pageCanvas.getContext('2d');

      pageCanvas.width = canvasWidth;
      pageCanvas.height = Math.min(
        canvasHeight * (pdfHeight / height),
        canvasHeight - (page * canvasHeight * (pdfHeight / height))
      );

      pageContext.drawImage(
        canvas,
        0,
        page * canvasHeight * (pdfHeight / height),
        canvasWidth,
        pageCanvas.height,
        0,
        0,
        canvasWidth,
        pageCanvas.height
      );

      const pageImgData = pageCanvas.toDataURL('image/png');
      const pageHeight = (pageCanvas.height / canvasHeight) * height;

      pdf.addImage(pageImgData, 'PNG', 0, 0, width, pageHeight);

      heightLeft -= pdfHeight;
      page++;
    }
  }
};

/**
 * Export rubric content to PDF
 */
export const exportRubricToPdf = async (htmlContent, options = {}) => {
  return exportAssessmentToPdf(htmlContent, {
    fileName: options.fileName || 'rubric.pdf',
    title: options.title || 'Assessment Rubric',
    isSpmPaper1: false,
    ...options,
  });
};

/**
 * Export answer key to PDF
 */
export const exportAnswerKeyToPdf = async (htmlContent, options = {}) => {
  return exportAssessmentToPdf(htmlContent, {
    fileName: options.fileName || 'answer-key.pdf',
    title: options.title || 'Answer Key',
    isSpmPaper1: options.isSpmPaper1 || false,
    ...options,
  });
};
