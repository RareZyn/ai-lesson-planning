import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// --- Configuration Constants ---
// --- Configuration Constants ---
const COLORS = {
    PRIMARY: '#1e3a8a',    // Deep Blue for Titles
    ACCENT: '#3b82f6',     // Bright Blue for visual accents
    TEXT_MAIN: '#374151',  // Dark Gray for body
    TEXT_LIGHT: '#6b7280', // Medium Gray for metadata
    DIVIDER: '#e5e7eb'     // Light Gray for lines
};

const SIZES = {
    TITLE: 24,
    SUBTITLE: 14,
    SECTION: 14,
    BODY: 11,
    FOOTER: 9
};

const MARGIN = 15;
const CONTENT_WIDTH = 180; // A4 (210) - 2 * MARGIN

/**
 * Adds a modern styled section to the PDF.
 */
const addSection = (doc, currentY, title, content) => {
    let y = currentY;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Check for page break (header + at least one line of context)
    if (y + 25 > pageHeight - MARGIN) {
        doc.addPage();
        y = MARGIN + 10;
    }

    // --- Section Header with Accent ---
    doc.setDrawColor(COLORS.ACCENT);
    doc.setLineWidth(1);
    doc.line(MARGIN, y, MARGIN, y + 6); // Vertical accent line

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(SIZES.SECTION);
    doc.setTextColor(COLORS.PRIMARY);
    doc.text(title.toUpperCase(), MARGIN + 3, y + 5);

    y += 12; // Space after header

    // --- Content Rendering ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(SIZES.BODY);
    doc.setTextColor(COLORS.TEXT_MAIN);

    const checkPageBreak = (needed = 7) => {
        if (y + needed > pageHeight - MARGIN - 10) { // -10 for footer space
            doc.addPage();
            y = MARGIN + 10;
            return true;
        }
        return false;
    };

    if (Array.isArray(content)) {
        content.forEach(item => {
            const bullet = "•";
            const indent = 5;
            // Wrap text with indentation for bullet
            const textLines = doc.splitTextToSize(item, CONTENT_WIDTH - indent);

            checkPageBreak(textLines.length * 6);

            // Draw bullet
            doc.text(bullet, MARGIN, y);

            // Draw text lines
            textLines.forEach((line) => {
                doc.text(line, MARGIN + indent, y);
                y += 6; // Line height
            });
            y += 2; // Extra space between items
        });
    } else if (content) {
        const textLines = doc.splitTextToSize(content, CONTENT_WIDTH);
        textLines.forEach(line => {
            checkPageBreak(6);
            doc.text(line, MARGIN, y);
            y += 6;
        });
    } else {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(COLORS.TEXT_LIGHT);
        doc.text("No content provided.", MARGIN, y);
        y += 6;
    }

    return y + 8; // Return new Y position with section padding
};

// --- The Main PDF Export Function ---
export const exportToPdf = (plan, parameters, lessonDate, classInfo) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let y = MARGIN + 10; // Top padding

    // --- 1. Document Title & Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(SIZES.TITLE);
    doc.setTextColor(COLORS.PRIMARY);

    // Wrap title if it's too long
    const titleLines = doc.splitTextToSize(`Lesson Plan: ${parameters.specificTopic}`, CONTENT_WIDTH);
    titleLines.forEach(line => {
        doc.text(line, MARGIN, y);
        y += 10;
    });

    y += 5;

    // --- 2. Metadata Block (Class, Date, etc.) ---
    doc.setDrawColor(COLORS.DIVIDER);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y); // Top divider
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(SIZES.SUBTITLE);
    doc.setTextColor(COLORS.TEXT_LIGHT);

    const metaInfo = [
        `Class: ${classInfo?.className || 'N/A'}`,
        `Date: ${new Date(lessonDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        `Subject: ${classInfo?.subject || 'General'}`
    ];

    metaInfo.forEach(info => {
        doc.text(info, MARGIN, y);
        y += 6;
    });

    y += 2;
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y); // Bottom divider
    y += 15;

    // --- 3. Content Sections ---
    y = addSection(doc, y, "Learning Objective", plan.learningObjective);
    y = addSection(doc, y, "Success Criteria", plan.successCriteria);

    if (plan.activities) {
        y = addSection(doc, y, "Pre-Lesson Activities", plan.activities.preLesson);
        y = addSection(doc, y, "During-Lesson Activities", plan.activities.duringLesson);
        y = addSection(doc, y, "Post-Lesson Activities", plan.activities.postLesson);
    }

    // --- 4. Page Numbering Footer ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(SIZES.FOOTER);
        doc.setTextColor(COLORS.TEXT_LIGHT);
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save File
    const cleanName = parameters.specificTopic.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    doc.save(`Lesson_Plan_${cleanName}.pdf`);
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