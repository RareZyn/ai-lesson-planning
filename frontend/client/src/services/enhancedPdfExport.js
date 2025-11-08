// src/services/enhancedPdfExport.js
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

  /**
   * MAIN EXPORT FUNCTION - Question-by-question rendering
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

      console.log("🎯 Starting PDF export for element:", elementId);

      const isSpmExam = this.detectSpmExam(element);

      if (isSpmExam) {
        console.log("✅ Detected SPM exam - using question-by-question export");
        return await this.exportSpmExamQuestionByQuestion(
          element,
          fileName,
          options
        );
      }

      // Fallback for non-SPM content
      return await this.exportWithCanvas(element, fileName, options);
    } catch (error) {
      console.error("❌ Error exporting HTML to PDF:", error);
      throw new Error("Failed to export to PDF");
    }
  }

  /**
   * CRITICAL FIX: Export SPM exam question-by-question
   * This ensures NO question is ever split across pages
   */
  async exportSpmExamQuestionByQuestion(element, fileName, options) {
    console.log("🎯 STARTING SPM EXAM EXPORT - FULL DEBUG MODE");

    const doc = new jsPDF({
      ...this.defaultOptions,
      ...options,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    // Step 1: Add header page
    const headerInfo = this.extractSpmHeader(element);
    this.addSpmHeaderPage(doc, headerInfo);

    // Step 2: Find ALL renderable elements
    const renderableElements = this.findAllRenderableElements(element);
    console.log(`📊 Found ${renderableElements.length} renderable elements`);

    // Step 3: Add first content page
    doc.addPage();
    let currentY = margin;

    // Step 4: Render each element
    for (let i = 0; i < renderableElements.length; i++) {
      const item = renderableElements[i];
      console.log(`📝 Processing ${item.type} ${item.number || i + 1}...`);

      try {
        const canvas = await html2canvas(item.element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        console.log(`📏 ${item.type} ${item.number || i + 1}: ${imgWidth}x${imgHeight}mm`);

        // Check if element fits on current page
        if (currentY + imgHeight > pageHeight - margin) {
          console.log(`📄 ${item.type} ${item.number || i + 1} needs new page`);
          doc.addPage();
          currentY = margin;
        }

        doc.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 3;

        console.log(`✅ Added ${item.type} ${item.number || i + 1} at Y=${currentY}mm`);
      } catch (error) {
        console.error(`❌ Failed to process ${item.type} ${item.number || i + 1}:`, error);
      }
    }

    // **FIX: Append answer sheet for Paper 1**
    if (headerInfo.title.includes("Paper 1") || headerInfo.title.includes("1119/1")) {
      console.log("📋 Appending SPM Paper 1 answer sheet...");
      this.addSpmAnswerSheet(doc);
    }

    doc.save(fileName);
    console.log(`✅ SPM exam PDF saved as ${fileName}`);

    return { success: true, fileName };
  }

  /**
   * Add SPM Paper 1 Answer Sheet (MCQ Bubble Sheet)
   * Questions 1-32: Multiple choice bubbles (A-H)
   * Questions 33-40: Short answer lines
   */
  addSpmAnswerSheet(doc) {
    doc.addPage();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SPM ENGLISH PAPER 1", pageWidth / 2, margin + 5, { align: "center" });

    doc.setFontSize(10);
    doc.text("READING AND USE OF ENGLISH - ANSWER SHEET", pageWidth / 2, margin + 12, { align: "center" });

    // Student info box
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(margin, margin + 16, pageWidth - 2 * margin, 20);

    doc.setFontSize(9);
    doc.text("NAME:", margin + 3, margin + 22);
    doc.line(margin + 18, margin + 22, margin + 105, margin + 22);

    doc.text("CLASS:", margin + 110, margin + 22);
    doc.line(margin + 125, margin + 22, pageWidth - margin - 3, margin + 22);

    doc.text("INDEX NO:", margin + 3, margin + 30);
    doc.line(margin + 22, margin + 30, margin + 75, margin + 30);

    doc.text("DATE:", margin + 110, margin + 30);
    doc.line(margin + 125, margin + 30, pageWidth - margin - 3, margin + 30);

    // Instructions
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const instrY = margin + 40;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, instrY, pageWidth - 2 * margin, 8, 'F');
    doc.text("INSTRUCTIONS: Use a dark pencil (2B) to fill in circles. Mark only ONE answer per question.", margin + 2, instrY + 5);

    // Two-column layout for answers
    const colWidth = (pageWidth - 3 * margin) / 2;
    const col1X = margin;
    const col2X = margin + colWidth + margin;
    let currentY = instrY + 15;

    // Column 1 Header: Questions 1-20
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.rect(col1X, currentY, colWidth, 8, 'FD');
    doc.text("QUESTIONS 1 - 20", col1X + colWidth / 2, currentY + 5, { align: "center" });

    // Column 2 Header: Questions 21-40
    doc.rect(col2X, currentY, colWidth, 8, 'FD');
    doc.text("QUESTIONS 21 - 40", col2X + colWidth / 2, currentY + 5, { align: "center" });

    currentY += 12;
    const rowHeight = 6;
    const bubbleRadius = 1.5;
    const bubbleSpacing = 8;

    // Column 1: Questions 1-20 (MCQ)
    for (let q = 1; q <= 20; q++) {
      const y = currentY + (q - 1) * rowHeight;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`${q}.`, col1X + 3, y + 3);

      // Answer bubbles A-H
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      options.forEach((opt, i) => {
        const x = col1X + 12 + i * bubbleSpacing;
        doc.circle(x, y + 1, bubbleRadius, 'S');
        doc.text(opt, x - 0.8, y - 0.5);
      });
    }

    // Column 2: Questions 21-32 (MCQ) + Questions 33-40 (Subjective)
    // MCQ section (21-32)
    for (let q = 21; q <= 32; q++) {
      const y = currentY + (q - 21) * rowHeight;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`${q}.`, col2X + 3, y + 3);

      // Answer bubbles A-H
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      options.forEach((opt, i) => {
        const x = col2X + 12 + i * bubbleSpacing;
        doc.circle(x, y + 1, bubbleRadius, 'S');
        doc.text(opt, x - 0.8, y - 0.5);
      });
    }

    // Subjective section header
    const subjectiveY = currentY + 12 * rowHeight + 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setFillColor(230, 230, 230);
    doc.rect(col2X, subjectiveY, colWidth, 6, 'F');
    doc.text("Part 5: Write your answers (Questions 33-40)", col2X + colWidth / 2, subjectiveY + 4, { align: "center" });

    // Subjective questions (33-40) with answer lines
    let subjY = subjectiveY + 10;
    for (let q = 33; q <= 40; q++) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`${q}.`, col2X + 3, subjY);

      // Answer line
      doc.setDrawColor(100);
      doc.setLineWidth(0.3);
      doc.line(col2X + 12, subjY, col2X + colWidth - 3, subjY);

      subjY += rowHeight;
    }

    // Footer
    const footerY = pageHeight - 20;
    doc.setDrawColor(180);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("DO NOT WRITE BELOW THIS LINE - FOR EXAMINER USE ONLY", pageWidth / 2, footerY + 4, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(0);
    const scoreY = footerY + 10;
    doc.text("Score: _____ / 40", margin + 10, scoreY);
    doc.text("Grade: _____", pageWidth / 2 - 10, scoreY);
    doc.text("Examiner: _____________", pageWidth - margin - 50, scoreY);

    console.log("✅ Answer sheet added with MCQ bubbles (1-32) and answer lines (33-40)");
  }

  /**
   * CRITICAL: Find ALL renderable elements in the exam
   * Returns array of: part headers, passages, questions, question groups
   */
  findAllRenderableElements(element) {
    const elements = [];

    // Find all parts
    const parts = element.querySelectorAll(
      '[class*="exam-part"], section, .part'
    );

    if (parts.length === 0) {
      console.log("⚠️ No explicit parts found, analyzing by structure");
      return this.findRenderableElementsByStructure(element);
    }

    parts.forEach((part, partIndex) => {
      const partText = part.textContent.substring(0, 100).trim();
      const partNumber = partIndex + 1;

      console.log(`🔍 Analyzing Part ${partNumber}...`);

      // Check which part this is
      if (partText.match(/Part 1/i)) {
        elements.push(...this.extractPart1Elements(part));
      } else if (partText.match(/Part 2/i)) {
        elements.push(...this.extractPart2Elements(part));
      } else if (partText.match(/Part 3/i)) {
        elements.push(...this.extractPart3Elements(part));
      } else if (partText.match(/Part 4/i)) {
        elements.push(...this.extractPart4Elements(part));
      } else if (partText.match(/Part 5/i)) {
        elements.push(...this.extractPart5Elements(part));
      } else {
        // Generic part - extract all children
        console.log(`⚠️ Unknown part structure, using generic extraction`);
        elements.push(...this.extractGenericPartElements(part, partNumber));
      }
    });

    return elements;
  }

  /**
   * Extract Part 1 elements (simple questions)
   */
  extractPart1Elements(partElement) {
    const elements = [];

    // Add part header
    const header = this.extractPartHeader(partElement, "Part 1");
    if (header) {
      elements.push({ type: "Part Header", element: header, number: "1" });
    }

    // Find all questions
    const questions = partElement.querySelectorAll(
      '[class*="question"], .question, div'
    );

    questions.forEach((q) => {
      const text = q.textContent.trim();
      const match = text.match(/^(\d+)\./);

      if (match && text.length > 20) {
        elements.push({
          type: "Question",
          element: q,
          number: match[1],
        });
      }
    });

    console.log(`✓ Part 1: ${elements.length} elements`);
    return elements;
  }

  /**
   * Extract Part 2 elements (passage + cloze questions)
   */
  extractPart2Elements(partElement) {
    const elements = [];

    // Add part header
    const header = this.extractPartHeader(partElement, "Part 2");
    if (header) {
      elements.push({ type: "Part Header", element: header, number: "2" });
    }

    // Find passage (usually in green/colored box)
    const passage = partElement.querySelector(
      '[style*="background"], .passage, p'
    );
    if (passage && passage.textContent.length > 100) {
      elements.push({ type: "Passage", element: passage });
    }

    // Find all questions (9-18)
    const questions = partElement.querySelectorAll(
      '[class*="question"], .question, div'
    );

    questions.forEach((q) => {
      const text = q.textContent.trim();
      const match = text.match(/^(\d+)\./);

      if (match && parseInt(match[1]) >= 9 && parseInt(match[1]) <= 18) {
        elements.push({
          type: "Question",
          element: q,
          number: match[1],
        });
      }
    });

    console.log(`✓ Part 2: ${elements.length} elements`);
    return elements;
  }

  /**
   * Extract Part 3 elements (passage + comprehension questions)
   */
  extractPart3Elements(partElement) {
    const elements = [];

    // Add part header
    const header = this.extractPartHeader(partElement, "Part 3");
    if (header) {
      elements.push({ type: "Part Header", element: header, number: "3" });
    }

    // Find passage
    const passage = partElement.querySelector(
      '[style*="background"], .passage, p'
    );
    if (passage && passage.textContent.length > 100) {
      elements.push({ type: "Passage", element: passage });
    }

    // Find all questions (19-26)
    const questions = partElement.querySelectorAll(
      '[class*="question"], .question, div'
    );

    questions.forEach((q) => {
      const text = q.textContent.trim();
      const match = text.match(/^(\d+)\./);

      if (match && parseInt(match[1]) >= 19 && parseInt(match[1]) <= 26) {
        elements.push({
          type: "Question",
          element: q,
          number: match[1],
        });
      }
    });

    console.log(`✓ Part 3: ${elements.length} elements`);
    return elements;
  }

  /**
   * Extract Part 4 elements (passage + sentence matching)
   */
  extractPart4Elements(partElement) {
    const elements = [];

    // Add part header
    const header = this.extractPartHeader(partElement, "Part 4");
    if (header) {
      elements.push({ type: "Part Header", element: header, number: "4" });
    }

    // Find passage
    const passage = partElement.querySelector(
      '[style*="background"], .passage'
    );
    if (passage) {
      elements.push({ type: "Passage", element: passage });
    }

    // Find sentence options (green box)
    const options = partElement.querySelector(
      '[style*="background: rgb(245"], .options, .sentences'
    );
    if (options) {
      elements.push({ type: "Options", element: options });
    }

    // Find question blanks (27-32)
    const questionDivs = partElement.querySelectorAll("div");

    questionDivs.forEach((div) => {
      const text = div.textContent.trim();
      const match = text.match(/^(\d+)\./);

      if (match && parseInt(match[1]) >= 27 && parseInt(match[1]) <= 32) {
        elements.push({
          type: "Question Blank",
          element: div,
          number: match[1],
        });
      }
    });

    console.log(`✓ Part 4: ${elements.length} elements`);
    return elements;
  }

  /**
   * Extract Part 5 elements (paragraphs A-F + matching questions)
   */
  extractPart5Elements(partElement) {
    const elements = [];

    // Add part header
    const header = this.extractPartHeader(partElement, "Part 5");
    if (header) {
      elements.push({ type: "Part Header", element: header, number: "5" });
    }

    console.log("🔍 Extracting Part 5 elements...");

    // Find the complete passage with all 6 paragraphs
    // Look for the green background div that contains the full text
    const passageContainer = partElement.querySelector(
      '[style*="background: rgb(246, 255, 237)"], [style*="background:#f6ffed"], .passage'
    );

    if (passageContainer && passageContainer.textContent.length > 500) {
      console.log("✅ Found complete passage container - adding as single element to preserve formatting");
      // Add the ENTIRE passage as one element to keep all paragraphs together
      elements.push({
        type: "Full Passage",
        element: passageContainer,
        number: "A-F"
      });
    }

    // Find Questions 33-36 section (use a more flexible selector)
    console.log("🔍 Searching for Questions 33-36 section...");
    const allSections = partElement.querySelectorAll(
      '[style*="background"], [class*="question-group"], div'
    );

    let found3336Section = false;
    for (let section of allSections) {
      const text = section.textContent;
      if ((text.includes("33") || text.includes("Questions 33")) &&
          (text.includes("36") || text.includes("paragraph") || text.includes("matching"))) {
        elements.push({
          type: "Questions Section",
          element: section,
          number: "33-36",
        });
        console.log("✅ Found Questions 33-36 section");
        found3336Section = true;
        break;
      }
    }

    // If we didn't find the section, try to find individual questions
    if (!found3336Section) {
      console.log("⚠️ Questions 33-36 section not found, searching for individual questions...");
      const questions3336 = this.collectQuestionsRange(partElement, 33, 36);
      if (questions3336.length > 0) {
        elements.push(...questions3336);
        console.log(`✅ Found ${questions3336.length} individual questions (33-36)`);
      }
    }

    // Find Questions 37-40 section (use a more flexible selector)
    console.log("🔍 Searching for Questions 37-40 section...");
    let found3740Section = false;
    for (let section of allSections) {
      const text = section.textContent;
      if ((text.includes("37") || text.includes("Questions 37")) &&
          (text.includes("40") || text.includes("transfer") || text.includes("Complete"))) {
        elements.push({
          type: "Questions Section",
          element: section,
          number: "37-40",
        });
        console.log("✅ Found Questions 37-40 section");
        found3740Section = true;
        break;
      }
    }

    // If we didn't find the section, try to find individual questions
    if (!found3740Section) {
      console.log("⚠️ Questions 37-40 section not found, searching for individual questions...");
      const questions3740 = this.collectQuestionsRange(partElement, 37, 40);
      if (questions3740.length > 0) {
        elements.push(...questions3740);
        console.log(`✅ Found ${questions3740.length} individual questions (37-40)`);
      }
    }

    console.log(`✅ Part 5 complete: ${elements.length} total elements`);
    return elements;
  }


  isQuestionStartText(text, qNum) {
    if (!text) return false;
    const t = text.trim();
    // Accept several common formats (case-insensitive where appropriate)
    const patterns = [
      new RegExp(`^${qNum}\\.\\s+`),        // "18. "
      new RegExp(`^${qNum}\\)`),            // "18)"
      new RegExp(`^\\(${qNum}\\)`),         // "(18)"
      new RegExp(`^Question\\s+${qNum}\\b`, 'i'), // "Question 18"
      new RegExp(`\\b${qNum}\\.\\s+\\w+`)   // "18. Some text" (fallback)
    ];
    return patterns.some(p => p.test(t));
  }

  /**
   * Clone and expand `matchEl` into a wrapper that includes subsequent sibling nodes
   * until we detect the next question start (or reach safety limit).
   * Returns a DOM element (wrapper) that can be rendered by html2canvas.
   */
  expandToFullQuestionContainer(matchEl, nextQuestionNumber) {
    // Create wrapper with same display characteristics so layout stays stable
    const wrapper = document.createElement('div');
    wrapper.style.display = 'block';
    wrapper.style.boxSizing = 'border-box';
    // copy computed width if available (keeps rendering consistent)
    try {
      const rect = matchEl.getBoundingClientRect();
      if (rect && rect.width) wrapper.style.width = rect.width + 'px';
    } catch (e) { /* non-blocking */ }

    // Append clone of matched element first
    wrapper.appendChild(matchEl.cloneNode(true));

    // Walk subsequent siblings of the original element and append clones
    let sibling = matchEl.nextElementSibling;
    let safety = 0;
    const MAX_SIBLINGS = 50; // safety guard
    while (sibling && safety < MAX_SIBLINGS) {
      const sText = (sibling.textContent || '').trim();

      // Stop collecting if the sibling *looks like* the next question start
      if (nextQuestionNumber && this.isQuestionStartText(sText, nextQuestionNumber)) {
        break;
      }

      // Append sibling clone
      wrapper.appendChild(sibling.cloneNode(true));

      sibling = sibling.nextElementSibling;
      safety++;
    }

    return wrapper;
  }

  /**
   * Collect full question containers for questions in range startQ..endQ (inclusive).
   * Returns array of { type: "Question", element: HTMLElement, number: '18' }.
   *
   * Usage:
   *   const questions3336 = this.collectQuestionsRange(partElement, 33, 36);
   */
  collectQuestionsRange(container, startQ, endQ) {
    const found = [];
    if (!container) return found;

    // gather candidates once to improve speed
    const candidates = Array.from(container.querySelectorAll('div, p, section, li, span'));

    for (let q = startQ; q <= endQ; q++) {
      let matchedEl = null;

      // Prefer the first candidate whose trimmed text begins with the question number
      for (let el of candidates) {
        const txt = (el.textContent || '').trim();
        if (txt.length === 0) continue;

        if (this.isQuestionStartText(txt, q)) {
          matchedEl = el;
          break;
        }
      }

      if (!matchedEl) {
        console.warn(`collectQuestionsRange: Question ${q} not found in container`);
        continue;
      }

      // Expand to include siblings until next question start
      const nextQ = q + 1;
      const fullContainer = this.expandToFullQuestionContainer(matchedEl, nextQ);

      found.push({
        type: 'Question',
        element: fullContainer,
        number: q.toString(),
      });

      console.log(`collectQuestionsRange: found Question ${q} (${(matchedEl.textContent || '').substring(0, 60)})`);
    }

    console.log(`collectQuestionsRange: collected ${found.length}/${endQ - startQ + 1} questions`);
    return found;
  }

  /**
   * Extract part header (Part X title + instructions)
   */
  extractPartHeader(partElement, partName) {
    // Look for the first heading or title div
    const header = partElement.querySelector(
      'h1, h2, h3, h4, .part-title, [class*="part-header"]'
    );

    if (header) {
      return header;
    }

    // Look for the first div that contains "Part X"
    const divs = partElement.querySelectorAll("div");
    for (let div of divs) {
      if (div.textContent.includes(partName)) {
        return div;
      }
    }

    return null;
  }

  /**
   * Generic extraction for unknown part structure
   */
  extractGenericPartElements(partElement, partNumber) {
    const elements = [];

    const children = Array.from(partElement.children);

    children.forEach((child, index) => {
      if (child.textContent.trim().length > 20) {
        elements.push({
          type: `Part ${partNumber} Content`,
          element: child,
          number: (index + 1).toString(),
        });
      }
    });

    return elements;
  }

  /**
   * Fallback: find by structure when no explicit parts
   */
  findRenderableElementsByStructure(element) {
    const elements = [];
    const topLevelDivs = Array.from(element.children);

    topLevelDivs.forEach((div, index) => {
      if (div.textContent.trim().length > 50) {
        elements.push({
          type: "Content Block",
          element: div,
          number: (index + 1).toString(),
        });
      }
    });

    return elements;
  }

  /**
   * Detect if content is an SPM exam
   */
  detectSpmExam(element) {
    const content = element.textContent || "";
    return (
      content.includes("SPM English Paper") ||
      content.includes("1119/1") ||
      content.includes("Reading and Use of English")
    );
  }

  /**
   * Extract SPM header info
   */
  extractSpmHeader(element) {
    const content = element.textContent || "";

    const titleMatch = content.match(/SPM English Paper \d+[^\n]*/);
    const title = titleMatch ? titleMatch[0] : "SPM English Paper 1 (1119/1)";

    let subtitle = "Reading and Use of English";
    if (content.includes("Writing")) subtitle = "Writing";

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

  /**
   * Add SPM header page
   */
  addSpmHeaderPage(doc, headerInfo) {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(24, 144, 255);
    doc.text(headerInfo.title, pageWidth / 2, 35, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(headerInfo.subtitle, pageWidth / 2, 45, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let yPos = 65;

    doc.text("Name: _________________________________", 20, yPos);
    doc.text("IC No.: _________________________________", 120, yPos);

    yPos += 10;
    doc.text("Index No.: _________________________________", 20, yPos);
    doc.text("Class: _____________", 120, yPos);

    yPos += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const infoText = `Duration: ${headerInfo.duration} | Questions: ${headerInfo.questions} | Marks: ${headerInfo.marks}`;
    doc.text(infoText, pageWidth / 2, yPos, { align: "center" });

    yPos += 15;
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

  /**
   * Fallback canvas export
   */
  async exportWithCanvas(element, fileName, options) {
    console.log("📸 Using canvas fallback");

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({ ...this.defaultOptions, ...options });

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

      const fileName = `Activity_${activityData.title?.replace(/[^a-z0-9]/gi, "_") || "Document"
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

      const fileName = `Rubric_${rubricData.title?.replace(/[^a-z0-9]/gi, "_") || "Document"
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
          `✓ Block ${contentBlock.index} (${contentBlock.type
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

      const footerLeft = `${data.title || "Document"
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
