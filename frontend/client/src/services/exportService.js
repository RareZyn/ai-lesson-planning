import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// --- Configuration Constants ---
const FONT_SIZES = { H1: 22, H2: 16, H3: 14, BODY: 11 }; // Slightly smaller body font for better fit
const COLORS = { PRIMARY: '#111827', SECONDARY: '#3f51b5', BODY: '#374151' };
const MARGIN = 15; // Page margin in mm

/**
 * Adds a section with a title and content, now with automatic line wrapping.
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {number} currentY - The current vertical position on the page.
 * @param {string} title - The title of the section.
 * @param {string|string[]} content - The content, either a single string or an array of strings.
 * @returns {number} The new vertical position after adding the content.
 */
const addSection = (doc, currentY, title, content) => {
    let y = currentY;
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = doc.internal.pageSize.getWidth() - (MARGIN * 2); // Max width for text

    // --- Add a page break if the new section won't fit ---
    const checkPageBreak = (neededHeight) => {
        if (y + neededHeight > pageHeight - MARGIN) {
            doc.addPage();
            y = MARGIN;
        }
    };

    checkPageBreak(20); // Check space for the title and some content

    // --- Render Title ---
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(FONT_SIZES.H2);
    doc.setTextColor(COLORS.SECONDARY);
    doc.text(title, MARGIN, y);
    y += 8;

    // --- Render Content ---
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(FONT_SIZES.BODY);
    doc.setTextColor(COLORS.BODY);
    
    // THE FIX: Process content based on its type (string or array)
    const renderLines = (text) => {
        // Use splitTextToSize to wrap the text automatically
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
            checkPageBreak(7); // Check if the next line fits
            doc.text(line, MARGIN, y);
            y += 7; // Increment y position for the next line
        });
    };

    if (Array.isArray(content)) {
        // Handle lists (e.g., success criteria, activities)
        content.forEach(item => {
            // Add a bullet point and split the text
            const lines = doc.splitTextToSize(`• ${item}`, maxWidth - 5); // Indent bulleted lists slightly
            lines.forEach((line, index) => {
                checkPageBreak(7);
                // Add the bullet only to the first line of a multi-line item
                const xPos = (index === 0) ? MARGIN : MARGIN + 3; 
                doc.text(line.replace('• ', ''), xPos, y); // Render without the bullet, position handles it
                y += 7;
            });
        });
    } else {
        // Handle single paragraphs (e.g., learning objective)
        renderLines(content);
    }
    
    y += 5; // Add extra space after the section
    return y;
};


// --- The Main PDF Export Function ---
export const exportToPdf = (plan, parameters, lessonDate, classInfo) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let y = MARGIN;

    // --- Add Document Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZES.H1);
    doc.setTextColor(COLORS.PRIMARY);
    doc.text(`Lesson Plan: ${parameters.specificTopic}`, MARGIN, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZES.BODY);
    doc.setTextColor(COLORS.BODY);
    doc.text(`Class: ${classInfo?.className || 'N/A'} | Date: ${new Date(lessonDate).toLocaleDateString()}`, MARGIN, y);
    y += 7;
    
    doc.setDrawColor(COLORS.SECONDARY);
    doc.line(MARGIN, y, doc.internal.pageSize.getWidth() - MARGIN, y);
    y += 10;

    // --- Add Sections (the helper function now handles wrapping) ---
    y = addSection(doc, y, "Learning Objective", plan.learningObjective);
    y = addSection(doc, y, "Success Criteria", plan.successCriteria);
    
    if (plan.activities) {
        y = addSection(doc, y, "Pre-Lesson Activities", plan.activities.preLesson);
        y = addSection(doc, y, "During-Lesson Activities", plan.activities.duringLesson);
        y = addSection(doc, y, "Post-Lesson Activities", plan.activities.postLesson);
    }
    
    doc.save(`Lesson_Plan_${parameters.specificTopic.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

// --- DOCX EXPORT FUNCTION (Unchanged) ---
export const exportToDocx = (plan, parameters, lessonDate, classInfo) => {
    const formatDate = (date) => new Date(date).toLocaleDateString();

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [new TextRun({ text: `Lesson Plan: ${parameters.specificTopic}`, bold: true, size: 32 })],
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    children: [new TextRun({ text: `Class: ${classInfo?.className || 'N/A'} | Date: ${formatDate(lessonDate)}`, size: 24, italics: true })],
                }),
                new Paragraph({ text: "" }), // Spacer

                new Paragraph({ text: "Learning Objective", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: plan.learningObjective }),
                new Paragraph({ text: "" }),

                new Paragraph({ text: "Success Criteria", heading: HeadingLevel.HEADING_2 }),
                ...plan.successCriteria.map(item => new Paragraph({ text: item, bullet: { level: 0 } })),
                new Paragraph({ text: "" }),

                new Paragraph({ text: "Activities", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "Pre-Lesson", heading: HeadingLevel.HEADING_3 }),
                ...plan.activities.preLesson.map(item => new Paragraph({ text: item, bullet: { level: 0 } })),
                new Paragraph({ text: "During-Lesson", heading: HeadingLevel.HEADING_3 }),
                ...plan.activities.duringLesson.map(item => new Paragraph({ text: item, bullet: { level: 0 } })),
                new Paragraph({ text: "Post-Lesson", heading: HeadingLevel.HEADING_3 }),
                ...plan.activities.postLesson.map(item => new Paragraph({ text: item, bullet: { level: 0 } })),
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lesson_Plan_${parameters.specificTopic.replace(/[^a-z0-9]/gi, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
};