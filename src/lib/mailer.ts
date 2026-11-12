import nodemailer from "nodemailer";

// Sends email through any SMTP service (Gmail, Brevo, Resend, ...). The
// settings come from environment variables, never from the code:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
//   EMAIL_FROM  e.g. "Booked and Busy <bookedandbusy.invites@gmail.com>"
export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

export function createMailer() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Port 465 uses a secure connection from the start; 587 upgrades to one.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export function fromAddress() {
  return process.env.EMAIL_FROM || `Booked and Busy <${process.env.SMTP_USER}>`;
}
