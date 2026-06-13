const { createTransport } = require("nodemailer");

function getMailConfig() {
  const host = process.env.NODEMAILER_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.NODEMAILER_PORT || process.env.SMTP_PORT || 465);
  const user = process.env.NODEMAILER_EMAIL || process.env.SMTP_USER;
  const pass = process.env.NODEMAILER_PASSWORD || process.env.SMTP_PASS;
  const secureValue = process.env.NODEMAILER_SECURE || process.env.SMTP_SECURE;
  const from =
    process.env.NODEMAILER_FROM ||
    process.env.SMTP_FROM ||
    (user ? `Movieflix Support <${user}>` : "");

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: secureValue === "true" || port === 465,
    rejectUnauthorized: process.env.NODEMAILER_REJECT_UNAUTHORIZED === "true",
  };
}

function hasMailConfig() {
  const { host, user, pass } = getMailConfig();
  return Boolean(host && user && pass);
}

function createMailer() {
  const { host, port, secure, user, pass, rejectUnauthorized } = getMailConfig();

  return createTransport({
    host,
    port,
    secure,
    debug: process.env.NODE_ENV !== "production",
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized,
    },
  });
}

async function sendEmail({ to, subject, html, text }) {
  if (!hasMailConfig()) {
    throw new Error("Email is not configured. Add NODEMAILER_HOST, NODEMAILER_EMAIL, and NODEMAILER_PASSWORD.");
  }

  const transporter = createMailer();
  const { from } = getMailConfig();

  const result = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });

  console.log(`Email sent: ${result.response}`);
  return result;
}

function getMailErrorDetails(error) {
  return {
    code: error?.code,
    command: error?.command,
    responseCode: error?.responseCode,
    message: error?.message,
  };
}

module.exports = sendEmail;
module.exports.getMailConfig = getMailConfig;
module.exports.hasMailConfig = hasMailConfig;
module.exports.getMailErrorDetails = getMailErrorDetails;
