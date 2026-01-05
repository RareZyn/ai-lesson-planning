const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html, fromName }) => {
    // Check if SMTP credentials exists
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn("⚠️ SMTP credentials missing. Email logging to console only.");
        console.log(`[EMAIL MOCK] From: ${fromName || "Lesson Planner"}`);
        console.log(`[EMAIL MOCK] To: ${to}`);
        console.log(`[EMAIL MOCK] Subject: ${subject}`);
        console.log(`[EMAIL MOCK] Body: ${html}`);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // Build the "From" field with display name
    const displayName = fromName ? `"${fromName} via Lesson Planner"` : `"Lesson Planner"`;
    const fromAddress = `${displayName} <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
    });

    console.log("Message sent: %s", info.messageId);
};

module.exports = { sendEmail };
