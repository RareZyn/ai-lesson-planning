// frontend/client/src/utils/assessmentPrint.js
// Print utility for assessments and rubrics with proper styling

/**
 * Print assessment or rubric content with proper styling
 * Opens a print dialog with the content properly formatted
 */
export const printAssessmentContent = (htmlContent, options = {}) => {
  const {
    title = 'Document',
    isSpmPaper1 = false,
  } = options;

  try {
    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 210mm;
      height: 297mm;
      border: none;
      visibility: hidden;
    `;

    document.body.appendChild(printFrame);

    // Get the iframe document
    const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
    const doc = frameDoc.document || frameDoc;

    // Write the content with print-optimized styles
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            /* Reset and base styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #333;
              background: white;
              padding: 0;
              margin: 0;
            }

            /* Print-specific styles */
            @media print {
              @page {
                size: A4;
                margin: 0;
              }

              body {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 0;
              }

              /* Prevent page breaks inside important elements */
              .question,
              .question-wrapper,
              .answer-item,
              .exam-part,
              .rubric-table tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              /* Keep headers with content */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }

              /* SPM Answer Sheet on new page */
              .spm-answer-sheet {
                page-break-before: always !important;
                page-break-inside: avoid !important;
                break-before: always !important;
                break-inside: avoid !important;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                display: block !important;
              }

              /* Table handling */
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

              /* Ensure colors print correctly */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }

              /* Hide unnecessary elements */
              .no-print {
                display: none !important;
              }
            }

            @media screen {
              body {
                padding: 15mm;
              }
            }

            /* Typography */
            h1 {
              font-size: 18pt;
              margin-bottom: 8px;
              color: #1890ff;
              page-break-after: avoid;
            }

            h2, h3 {
              font-size: 14pt;
              margin: 10px 0 6px 0;
              color: #262626;
              page-break-after: avoid;
            }

            h4 {
              font-size: 12pt;
              margin: 8px 0 4px 0;
              font-weight: 600;
              page-break-after: avoid;
            }

            p {
              margin: 4px 0;
              font-size: 11pt;
            }

            /* Question styling */
            .question {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-bottom: 10px;
              padding: 10px;
              border: 1px solid #e8e8e8;
              border-radius: 4px;
              background: #fafafa;
            }

            .options {
              margin: 6px 0 0 15px;
            }

            .options p {
              margin: 3px 0;
            }

            .answer-space {
              margin: 8px 0;
              border: 1px solid #d9d9d9;
              background: #fafafa;
              border-radius: 2px;
            }

            /* Answer key styling */
            .answer-item {
              page-break-inside: avoid !important;
              padding: 10px;
              border: 1px solid #d9d9d9;
              border-radius: 4px;
              background: #fafafa;
              margin-bottom: 10px;
            }

            .answer-item > div {
              padding: 6px;
              margin-bottom: 5px;
              border-radius: 3px;
              font-size: 10pt;
            }

            /* Table styling */
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10pt;
              margin: 10px 0;
            }

            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            th, td {
              padding: 6px 8px;
              border: 1px solid #d9d9d9;
              text-align: left;
              font-size: 10pt;
            }

            th {
              background: #f0f0f0;
              font-weight: 600;
            }

            /* Info boxes */
            .student-info,
            .assessment-info,
            .answer-key-info,
            .instructions {
              padding: 8px;
              margin-bottom: 10px;
              border-radius: 4px;
            }

            .student-info,
            .assessment-info {
              background: #f8f9fa;
            }

            .answer-key-info {
              background: #f6ffed;
            }

            .instructions {
              background: #fff7e6;
              border: 1px solid #ffa940;
            }

            /* Lists */
            ul, ol {
              margin: 5px 0;
              padding-left: 20px;
            }

            li {
              margin-bottom: 3px;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    doc.close();

    // Wait for content to load, then print
    printFrame.onload = () => {
      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();

          // Clean up after print dialog closes or after delay
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
        } catch (error) {
          console.error('Error printing:', error);
          document.body.removeChild(printFrame);
          throw error;
        }
      }, 500);
    };

    return { success: true, message: 'Print dialog opened' };
  } catch (error) {
    console.error('Error preparing print:', error);
    throw new Error(`Failed to print: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Print rubric content
 */
export const printRubric = (htmlContent, options = {}) => {
  return printAssessmentContent(htmlContent, {
    title: options.title || 'Assessment Rubric',
    isSpmPaper1: false,
    ...options,
  });
};

/**
 * Print answer key
 */
export const printAnswerKey = (htmlContent, options = {}) => {
  return printAssessmentContent(htmlContent, {
    title: options.title || 'Answer Key',
    isSpmPaper1: options.isSpmPaper1 || false,
    ...options,
  });
};
