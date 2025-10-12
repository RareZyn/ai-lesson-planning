// src/services/enhancedPdfExport.js - FIXED VERSION
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  }

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

      console.log("🎯 Starting PDF export for element:", elementId);

      const isSpmExam = this.detectSpmExam(element);

      if (isSpmExam) {
        console.log("✅ Detected SPM exam format, using specialized export");
        return await this.exportSpmExamToPdf(element, fileName, options);
      }

      // Fallback for non-SPM content
      return await this.exportWithCanvas(element, fileName, options);
    } catch (error) {
      console.error("❌ Error exporting HTML to PDF:", error);
      throw new Error("Failed to export to PDF");
    }
  }

  detectSpmExam(element) {
    const content = element.textContent || element.innerText || "";
    return (
      content.includes("SPM English Paper") ||
      content.includes("1119/1") ||
      content.includes("1119/2") ||
      content.includes("Reading and Use of English") ||
      content.includes("Writing")
    );
  }

  async exportSpmExamToPdf(element, fileName, options) {
    const doc = new jsPDF({
      ...this.defaultOptions,
      ...options,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    console.log("📄 Creating SPM exam PDF");

    // Extract and add header information
    const headerInfo = this.extractSpmHeader(element);
    this.addSpmHeaderPage(doc, headerInfo);

    // Add a new page for content
    doc.addPage();

    // CRITICAL FIX: Use html2canvas to capture the ENTIRE content at once
    // This prevents question splitting and blank pages
    try {
      console.log("📸 Capturing entire exam content...");

      // Find the main content container (skip the header elements)
      const contentElement = this.findExamContentElement(element);

      if (!contentElement) {
        console.error("❌ Could not find exam content element");
        throw new Error("Exam content not found");
      }

      // Capture the entire content as one large canvas
      const canvas = await html2canvas(contentElement, {
        scale: 2, // High quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: contentElement.scrollWidth,
        windowHeight: contentElement.scrollHeight,
      });

      console.log(`✅ Captured content: ${canvas.width}x${canvas.height}px`);

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Calculate how many pages we need
      const pageContentHeight = pageHeight - margin * 2;
      let heightLeft = imgHeight;
      let position = margin;
      let pageNumber = 2; // Start from page 2 (page 1 is header)

      // Add the image across multiple pages
      while (heightLeft > 0) {
        // Calculate the position for this page
        const yOffset = (pageNumber - 2) * pageContentHeight;

        doc.addImage(
          imgData,
          "PNG",
          margin,
          position - yOffset,
          imgWidth,
          imgHeight
        );

        heightLeft -= pageContentHeight;

        if (heightLeft > 0) {
          doc.addPage();
          pageNumber++;
          position = margin;
        }

        console.log(
          `✅ Added page ${pageNumber}, remaining height: ${heightLeft}mm`
        );
      }

      doc.save(fileName);
      console.log(`✅ SPM exam PDF saved as ${fileName}`);

      return { success: true, fileName };
    } catch (error) {
      console.error("❌ Error capturing SPM exam content:", error);
      throw error;
    }
  }

  // Helper method to find the main exam content (skip header/instructions)
  findExamContentElement(element) {
    // Try to find the main content area by common class names
    let contentElement =
      element.querySelector(".exam-content") ||
      element.querySelector(".assessment-content") ||
      element.querySelector('[class*="content"]');

    // If not found, look for elements that contain "Part 1" or "Question"
    if (!contentElement) {
      const allDivs = element.querySelectorAll("div");
      for (let div of allDivs) {
        const text = div.textContent;
        if (text.includes("Part 1") || text.includes("Question 1")) {
          contentElement = div;
          break;
        }
      }
    }

    // Fallback: use the entire element
    if (!contentElement) {
      contentElement = element;
    }

    console.log(
      "📍 Found content element:",
      contentElement.className || "root element"
    );
    return contentElement;
  }

  // ALTERNATIVE METHOD: If the above doesn't work well, use this intelligent chunking method
  async exportSpmExamToPdfChunked(element, fileName, options) {
    const doc = new jsPDF({
      ...this.defaultOptions,
      ...options,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const maxContentHeight = pageHeight - margin * 2;

    console.log("📄 Creating SPM exam PDF with intelligent chunking");

    // Add header page
    const headerInfo = this.extractSpmHeader(element);
    this.addSpmHeaderPage(doc, headerInfo);

    // Get all Part sections
    const parts = this.identifySpmParts(element);
    console.log(`📊 Found ${parts.length} parts to process`);

    doc.addPage();
    let currentY = margin;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      try {
        console.log(`📝 Processing ${part.title}...`);

        // Capture this part as an image
        const canvas = await html2canvas(part.element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        console.log(`📏 Part ${i + 1} size: ${imgWidth}x${imgHeight}mm`);

        // Check if this part fits on current page
        if (currentY + imgHeight > pageHeight - margin) {
          // Add new page if needed
          doc.addPage();
          currentY = margin;
          console.log(`📄 Added new page for ${part.title}`);
        }

        // Add the image
        doc.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 5; // Add small spacing

        console.log(`✅ Added ${part.title} at Y=${currentY}mm`);
      } catch (error) {
        console.error(`❌ Failed to process ${part.title}:`, error);
      }
    }

    doc.save(fileName);
    console.log(`✅ SPM exam PDF saved as ${fileName}`);

    return { success: true, fileName };
  }

  // Helper to identify SPM exam parts more accurately
  identifySpmParts(element) {
    const parts = [];

    // Look for Part headers (Part 1, Part 2, etc.)
    const partHeaders = element.querySelectorAll('h2, h3, [class*="part"]');

    partHeaders.forEach((header) => {
      const text = header.textContent.trim();
      if (text.match(/^Part\s+\d+/i)) {
        // Find the parent container that includes this part's content
        let partContainer =
          header.closest(".exam-part") ||
          header.closest('div[class*="part"]') ||
          header.parentElement;

        // If we found a container, use it
        if (partContainer) {
          parts.push({
            title: text,
            element: partContainer,
            header: header,
          });
          console.log(`✓ Found part: ${text}`);
        }
      }
    });

    // If no parts found by headers, try to find by structure
    if (parts.length === 0) {
      const allSections = element.querySelectorAll(
        'section, div.exam-part, div[class*="part"]'
      );
      allSections.forEach((section, index) => {
        parts.push({
          title: `Part ${index + 1}`,
          element: section,
        });
      });
    }

    return parts;
  }

  // RECOMMENDED: Update the exportHtmlElementToPdf method to use the fixed version
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

      console.log("🎯 Starting PDF export for element:", elementId);

      const isSpmExam = this.detectSpmExam(element);

      if (isSpmExam) {
        console.log("✅ Detected SPM exam format, using specialized export");
        // TRY THE MAIN METHOD FIRST
        return await this.exportSpmExamToPdf(element, fileName, options);

        // IF THAT DOESN'T WORK, UNCOMMENT THIS TO USE THE CHUNKED METHOD:
        // return await this.exportSpmExamToPdfChunked(element, fileName, options);
      }

      // For non-SPM content, use the existing methods
      const questionBlocks = this.identifyQuestionBlocks(element);

      if (questionBlocks.length > 0) {
        console.log(`✅ Found ${questionBlocks.length} question blocks`);
        return await this.exportWithQuestionGrouping(
          questionBlocks,
          fileName,
          options
        );
      } else {
        console.log("⚠️ No question blocks found, using canvas method");
        return await this.exportWithCanvas(element, fileName, options);
      }
    } catch (error) {
      console.error("❌ Error exporting HTML to PDF:", error);
      throw new Error("Failed to export to PDF");
    }
  }

  getSpmContentSections(element) {
    const sections = [];

    // Find the main content container (skip the header that was already extracted)
    let contentRoot = element;

    // Try to find exam-content or assessment-content div
    const examContent = element.querySelector(
      ".exam-content, .assessment-content, .activity-content"
    );
    if (examContent) {
      contentRoot = examContent;
    }

    // Look for Part sections
    const partElements = contentRoot.querySelectorAll(
      '.exam-part, [class*="part-"], section'
    );

    if (partElements.length > 0) {
      console.log(`📋 Found ${partElements.length} part elements`);

      partElements.forEach((partEl, idx) => {
        // Skip if this is the header section
        const text = partEl.textContent.substring(0, 100);
        if (
          text.includes("Duration:") &&
          text.includes("Questions:") &&
          idx === 0
        ) {
          console.log(`⏭️ Skipping header section`);
          return;
        }

        sections.push({
          element: partEl,
          type: `Part ${idx + 1}`,
          index: sections.length,
        });
      });
    } else {
      // Fallback: split by major headings
      console.log(`📋 No part elements found, using heading-based split`);

      const headings = contentRoot.querySelectorAll("h1, h2, h3");
      let currentSection = null;

      Array.from(contentRoot.children).forEach((child) => {
        if (child.matches("h1, h2, h3")) {
          if (currentSection) {
            sections.push(currentSection);
          }

          const sectionDiv = document.createElement("div");
          sectionDiv.appendChild(child.cloneNode(true));

          currentSection = {
            element: sectionDiv,
            type: child.textContent.substring(0, 50),
            index: sections.length,
          };
        } else if (currentSection) {
          currentSection.element.appendChild(child.cloneNode(true));
        }
      });

      if (currentSection) {
        sections.push(currentSection);
      }
    }

    return sections;
  }

  extractSpmHeader(element) {
    const content = element.textContent || "";

    // Extract title
    const titleMatch = content.match(/SPM English Paper \d+[^\n]*/);
    const title = titleMatch ? titleMatch[0] : "SPM English Paper 1 (1119/1)";

    // Extract subtitle
    let subtitle = "Reading and Use of English";
    if (content.includes("Writing")) {
      subtitle = "Writing";
    } else if (content.includes("Reading and Use of English")) {
      subtitle = "Reading and Use of English";
    }

    // Extract metadata
    const durationMatch = content.match(/Duration[:\s]*(\d+\s*minutes)/i);
    const questionsMatch = content.match(/Questions?[:\s]*(\d+)/i);
    const marksMatch = content.match(/Marks?[:\s]*(\d+)/i);

    return {
      title,
      subtitle,
      duration: durationMatch ? durationMatch[1] : "90 minutes",
      questions: questionsMatch ? questionsMatch[1] : "40",
      marks: marksMatch ? marksMatch[1] : "40",
    };
  }

  addSpmHeaderPage(doc, headerInfo) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(24, 144, 255);
    doc.text(headerInfo.title, pageWidth / 2, 35, { align: "center" });

    // Subtitle
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(headerInfo.subtitle, pageWidth / 2, 45, { align: "center" });

    // Student information fields
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let yPos = 65;

    doc.text("Name: _________________________________", 20, yPos);
    doc.text("IC No.: _________________________________", 120, yPos);

    yPos += 10;
    doc.text("Index No.: _________________________________", 20, yPos);
    doc.text("Class: _____________", 120, yPos);

    yPos += 15;

    // Exam information
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const infoText = `Duration: ${headerInfo.duration} | Questions: ${headerInfo.questions} | Marks: ${headerInfo.marks}`;
    doc.text(infoText, pageWidth / 2, yPos, { align: "center" });

    yPos += 15;

    // Instructions box
    doc.setDrawColor(255, 152, 0);
    doc.setFillColor(255, 243, 224);
    doc.roundedRect(15, yPos, pageWidth - 30, 60, 3, 3, "FD");

    yPos += 12;
    doc.setFontSize(14);
    doc.setTextColor(255, 87, 34);
    doc.text("Instructions:", 20, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    const instructions = [
      "• Answer all questions",
      "• For each question, choose the best answer and mark it on your answer sheet",
      "• Read all texts and questions carefully",
      "• Transfer your answers to the answer sheet in pencil",
    ];

    instructions.forEach((instruction) => {
      doc.text(instruction, 25, yPos);
      yPos += 8;
    });

    console.log("✅ SPM header page created");
  }

  // Fallback method for non-SPM content
  async exportWithCanvas(element, fileName, options) {
    console.log("📸 Using standard canvas export method");

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({
      ...this.defaultOptions,
      ...options,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = -(pageHeight - 20 - heightLeft);
      doc.addPage();
      doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    doc.save(fileName);
    return { success: true, fileName };
  }
  async exportActivityToPdf(activityData, options = {}) {
    try {
      const doc = new jsPDF({
        ...this.defaultOptions,
        ...options,
      });

      let yPosition = this.margins.top;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (this.margins.left + this.margins.right);

      yPosition = this.addHeader(doc, activityData, yPosition, contentWidth);
      yPosition = this.addActivityDetails(
        doc,
        activityData,
        yPosition,
        contentWidth
      );

      if (activityData.instructions) {
        yPosition = this.addInstructions(
          doc,
          activityData.instructions,
          yPosition,
          contentWidth
        );
      }

      if (activityData.activities) {
        yPosition = this.addActivitiesSection(
          doc,
          activityData.activities,
          yPosition,
          contentWidth
        );
      }

      this.addFooter(doc, activityData);

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

  async exportRubricToPdf(rubricData, options = {}) {
    try {
      const doc = new jsPDF({
        ...this.defaultOptions,
        orientation: "landscape",
        ...options,
      });

      let yPosition = this.margins.top;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (this.margins.left + this.margins.right);

      yPosition = this.addRubricHeader(
        doc,
        rubricData,
        yPosition,
        contentWidth
      );
      yPosition = this.addRubricTable(doc, rubricData, yPosition, contentWidth);

      if (rubricData.notes) {
        yPosition = this.addNotes(
          doc,
          rubricData.notes,
          yPosition,
          contentWidth
        );
      }

      this.addFooter(doc, rubricData);

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

      console.log("🎯 Starting PDF export for element:", elementId);

      const isSpmExam = this.detectSpmExam(element);

      if (isSpmExam) {
        console.log("✅ Detected SPM exam format, using specialized export");
        return await this.exportSpmExamToPdf(element, fileName, options);
      }

      const questionBlocks = this.identifyQuestionBlocks(element);

      if (questionBlocks.length > 0) {
        console.log(`✅ Found ${questionBlocks.length} unique question blocks`);
        return await this.exportWithQuestionGrouping(
          questionBlocks,
          fileName,
          options
        );
      } else {
        console.log("⚠️ No question blocks found, using fallback method");
        return await this.exportWithCanvas(element, fileName, options);
      }
    } catch (error) {
      console.error("❌ Error exporting HTML to PDF:", error);
      throw new Error("Failed to export to PDF");
    }
  }

  detectSpmExam(element) {
    const content = element.textContent || element.innerText || "";

    const isSpm =
      content.includes("SPM English Paper") ||
      content.includes("1119/1") ||
      content.includes("Reading and Use of English");

    return isSpm;
  }

  async exportSpmExamToPdf(element, fileName, options) {
    const doc = new jsPDF({
      ...this.defaultOptions,
      ...options,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    console.log("📄 Creating SPM exam PDF with header page");

    const headerInfo = this.extractSpmHeader(element);
    this.addSpmHeaderPage(doc, headerInfo);

    const contentBlocks = this.identifySpmContentBlocks(element);

    console.log(`📊 Processing ${contentBlocks.length} content blocks`);

    doc.addPage();
    let currentY = 15;

    for (let i = 0; i < contentBlocks.length; i++) {
      const block = contentBlocks[i];

      try {
        const canvas = await html2canvas(block.element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        console.log(`📊 Block ${block.index}: ${imgWidth}x${imgHeight}mm`);

        if (currentY + imgHeight > pageHeight - 15) {
          console.log(`📄 Block ${block.index} needs new page`);
          doc.addPage();
          currentY = 15;
        }

        doc.addImage(imgData, "PNG", 15, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 5;
      } catch (error) {
        console.error(`❌ Failed to process block ${block.index}:`, error);
      }
    }

    doc.save(fileName);
    console.log(`✅ SPM exam PDF saved as ${fileName}`);

    return { success: true, fileName };
  }

  extractSpmHeader(element) {
    const content = element.textContent || "";

    const titleMatch = content.match(/SPM English Paper \d+[^\n]*/);
    const title = titleMatch ? titleMatch[0] : "SPM English Paper 1 (1119/1)";

    const subtitle = content.includes("Reading and Use of English")
      ? "Reading and Use of English"
      : "Writing";

    const durationMatch = content.match(/Duration:\s*(\d+\s*minutes)/i);
    const questionsMatch = content.match(/Questions?:\s*(\d+)/i);
    const marksMatch = content.match(/Marks?:\s*(\d+)/i);

    return {
      title,
      subtitle,
      duration: durationMatch ? durationMatch[1] : "90 minutes",
      questions: questionsMatch ? questionsMatch[1] : "40",
      marks: marksMatch ? marksMatch[1] : "40",
    };
  }

  addSpmHeaderPage(doc, headerInfo) {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(33, 150, 243);
    doc.text(headerInfo.title, pageWidth / 2, 30, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(headerInfo.subtitle, pageWidth / 2, 40, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let yPos = 60;

    doc.text("Name: ___________________________", 20, yPos);
    doc.text("IC No.: ___________________________", 120, yPos);

    yPos += 10;
    doc.text("Index No.: ___________________________", 20, yPos);
    doc.text("Class: ___________", 120, yPos);

    yPos += 15;
    doc.setFont("helvetica", "bold");
    const infoText = `Duration: ${headerInfo.duration} | Questions: ${headerInfo.questions} | Marks: ${headerInfo.marks}`;
    doc.text(infoText, pageWidth / 2, yPos, { align: "center" });

    yPos += 15;
    doc.setDrawColor(255, 152, 0);
    doc.setFillColor(255, 243, 224);
    doc.roundedRect(15, yPos, pageWidth - 30, 50, 3, 3, "FD");

    yPos += 10;
    doc.setFontSize(13);
    doc.setTextColor(255, 87, 34);
    doc.text("Instructions:", 20, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    const instructions = [
      "• Answer all questions",
      "• For each question, choose the best answer and mark it on your answer sheet",
      "• Read all texts and questions carefully",
      "• Transfer your answers to the answer sheet in pencil",
    ];

    instructions.forEach((instruction) => {
      doc.text(instruction, 25, yPos);
      yPos += 7;
    });

    console.log("✅ Added SPM header page with instructions");
  }

  identifySpmContentBlocks(element) {
    const contentBlocks = [];
    const seenContent = new Set();

    let partElements = element.querySelectorAll(
      '[class*="part"], .exam-part, section'
    );

    if (partElements.length === 0) {
      const allDivs = element.querySelectorAll("div");
      partElements = Array.from(allDivs).filter((div) => {
        const text = div.textContent.trim();
        return (
          text.match(/^Part\s+\d+/i) ||
          text.match(/^Questions?\s+\d+/i) ||
          text.querySelector(".question, .passage, .article")
        );
      });
    }

    console.log(`🔍 Found ${partElements.length} part/section elements`);

    partElements.forEach((partEl, index) => {
      try {
        const contentText = partEl.textContent.trim().substring(0, 150);

        if (seenContent.has(contentText)) {
          console.log(`⏭️  Skipping duplicate part ${index + 1}`);
          return;
        }

        seenContent.add(contentText);

        const contentBlock = {
          element: partEl,
          index: contentBlocks.length + 1,
          height: partEl.offsetHeight || 0,
          type: this.detectBlockType(partEl),
          text: contentText,
        };

        contentBlocks.push(contentBlock);
        console.log(
          `✓ Block ${contentBlock.index} (${
            contentBlock.type
          }): ${contentText.substring(0, 50)}...`
        );
      } catch (err) {
        console.warn(`Failed to process part element ${index}:`, err);
      }
    });

    return contentBlocks;
  }

  detectBlockType(element) {
    const text = element.textContent;

    if (text.match(/^Part\s+\d+/i)) return "part-header";
    if (element.querySelector(".passage, .article, p")) return "passage";
    if (element.querySelector(".question")) return "questions";

    return "content";
  }

  identifyUniqueQuestionBlocks(element) {
    const questionBlocks = [];
    const seenQuestions = new Set();

    let questionElements = element.querySelectorAll(
      ".question-wrapper, .question"
    );

    if (questionElements.length === 0) {
      questionElements = element.querySelectorAll('div[class*="question"]');
    }

    console.log(`🔍 Found ${questionElements.length} question elements`);

    questionElements.forEach((questionEl, index) => {
      try {
        const questionText = questionEl.textContent.trim().substring(0, 100);

        if (seenQuestions.has(questionText)) {
          console.log(`⏭️  Skipping duplicate question ${index + 1}`);
          return;
        }

        seenQuestions.add(questionText);

        const questionBlock = {
          element: questionEl,
          index: questionBlocks.length + 1,
          height: questionEl.offsetHeight || 0,
          hasOptions: questionEl.querySelector(".options") !== null,
          hasAnswerSpace: questionEl.querySelector(".answer-space") !== null,
          text: questionText,
        };

        questionBlocks.push(questionBlock);
        console.log(
          `✓ Unique Question ${questionBlock.index}: ${questionText.substring(
            0,
            50
          )}...`
        );
      } catch (err) {
        console.warn(`Failed to process question element ${index}:`, err);
      }
    });

    return questionBlocks;
  }

  identifyQuestionBlocks(element) {
    return this.identifyUniqueQuestionBlocks(element);
  }

  async exportWithQuestionGrouping(questionBlocks, fileName, options) {
    const doc = new jsPDF({
      ...this.defaultOptions,
      ...options,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 20;

    let currentY = 15;

    console.log(
      `📄 Starting PDF generation with ${questionBlocks.length} blocks`
    );

    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];

      try {
        const canvas = await html2canvas(block.element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          width: block.element.scrollWidth,
          height: block.element.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        console.log(`📊 Block ${i + 1}: ${imgWidth}x${imgHeight}mm`);

        if (currentY + imgHeight > pageHeight - 15) {
          console.log(`📄 Block ${i + 1} needs new page`);
          doc.addPage();
          currentY = 15;
        }

        doc.addImage(imgData, "PNG", 10, currentY, imgWidth, imgHeight);
        console.log(`✅ Added block ${i + 1} at Y=${currentY}mm`);

        currentY += imgHeight + 5;
      } catch (error) {
        console.error(`❌ Failed to process block ${i + 1}:`, error);
      }
    }

    doc.save(fileName);
    console.log(`✅ PDF saved as ${fileName}`);

    return { success: true, fileName };
  }

  async exportWithCanvas(element, fileName, options) {
    console.log("📸 Using canvas fallback method");

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({
      ...this.defaultOptions,
      ...options,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = -(pageHeight - 20 - heightLeft);
      doc.addPage();
      doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    doc.save(fileName);
    return { success: true, fileName };
  }

  addHeader(doc, data, yPosition, contentWidth) {
    doc.setFillColor(24, 144, 255);
    doc.rect(this.margins.left, yPosition - 5, contentWidth, 25, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(
      data.title || "Activity Document",
      this.margins.left + 10,
      yPosition + 10
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const dateStr = new Date().toLocaleDateString();
    doc.text(`Generated on ${dateStr}`, this.margins.left + 10, yPosition + 18);

    return yPosition + 35;
  }

  addRubricHeader(doc, data, yPosition, contentWidth) {
    doc.setFillColor(82, 196, 26);
    doc.rect(this.margins.left, yPosition - 5, contentWidth, 25, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(
      data.title || "Assessment Rubric",
      this.margins.left + 10,
      yPosition + 10
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const dateStr = new Date().toLocaleDateString();
    doc.text(`Generated on ${dateStr}`, this.margins.left + 10, yPosition + 18);

    return yPosition + 35;
  }

  addActivityDetails(doc, data, yPosition, contentWidth) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(38, 38, 38);
    doc.text("Activity Details", this.margins.left, yPosition);
    yPosition += 10;

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

  addActivitiesSection(doc, activities, yPosition, contentWidth) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(38, 38, 38);
    doc.text("Activities", this.margins.left, yPosition);
    yPosition += 15;

    activities.forEach((activity, index) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage();
        yPosition = this.margins.top;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(24, 144, 255);
      doc.text(`${index + 1}. `, this.margins.left, yPosition);

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

  addRubricTable(doc, rubricData, yPosition, contentWidth) {
    if (!rubricData.criteria || !Array.isArray(rubricData.criteria)) {
      return yPosition;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(38, 38, 38);
    doc.text("Assessment Criteria", this.margins.left, yPosition);
    yPosition += 15;

    const rowHeight = 20;
    const colWidth = contentWidth / 5;

    const headers = [
      "Criteria",
      "Excellent (4)",
      "Good (3)",
      "Fair (2)",
      "Poor (1)",
    ];

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

    rubricData.criteria.forEach((criterion, rowIndex) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPosition = this.margins.top;
      }

      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(this.margins.left, yPosition, contentWidth, rowHeight, "F");
      }

      doc.setDrawColor(240, 240, 240);
      doc.rect(this.margins.left, yPosition, contentWidth, rowHeight, "D");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(89, 89, 89);

      const criterionText = doc.splitTextToSize(
        criterion.name || criterion.title,
        colWidth - 10
      );
      doc.text(criterionText, this.margins.left + 5, yPosition + 10);

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

  addFooter(doc, data) {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setDrawColor(240, 240, 240);
      doc.line(
        this.margins.left,
        pageHeight - 20,
        pageWidth - this.margins.right,
        pageHeight - 20
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);

      const footerLeft = `${
        data.title || "Document"
      } | Generated by AI Lesson Planner`;
      doc.text(footerLeft, this.margins.left, pageHeight - 10);

      const footerRight = `Page ${i} of ${pageCount}`;
      const footerRightWidth = doc.getTextWidth(footerRight);
      doc.text(
        footerRight,
        pageWidth - this.margins.right - footerRightWidth,
        pageHeight - 10
      );
    }
  }

  prepareElementForPdf(element) {
    const originalStyles = new Map();

    const computedStyle = window.getComputedStyle(element);
    originalStyles.set(element, {
      backgroundColor: element.style.backgroundColor,
      color: element.style.color,
      fontSize: element.style.fontSize,
    });

    element.style.backgroundColor = "#ffffff";
    element.style.color = "#000000";

    const allElements = element.querySelectorAll("*");
    allElements.forEach((el) => {
      originalStyles.set(el, {
        backgroundColor: el.style.backgroundColor,
        color: el.style.color,
        boxShadow: el.style.boxShadow,
      });

      if (window.getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)") {
        el.style.backgroundColor = "#ffffff";
      }
      el.style.color = "#000000";
      el.style.boxShadow = "none";
    });

    return originalStyles;
  }

  restoreElementStyles(element, originalStyles) {
    originalStyles.forEach((styles, el) => {
      Object.keys(styles).forEach((prop) => {
        el.style[prop] = styles[prop];
      });
    });
  }
}

export const pdfExportService = new EnhancedPdfExport();
export default pdfExportService;
