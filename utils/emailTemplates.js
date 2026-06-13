function emailShell({ title, preview, body }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background:#080808; font-family:Arial, Helvetica, sans-serif; color:#ffffff;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preview}</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#080808; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px; overflow:hidden; border-radius:18px; background:#141414; border:1px solid rgba(255,255,255,0.10);">
          <tr>
            <td style="padding:34px 34px 24px; background:linear-gradient(135deg,#dc2626 0%,#7f1d1d 52%,#141414 100%);">
              <p style="margin:0 0 10px; font-size:13px; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.76); font-weight:700;">Movieflix</p>
              <h1 style="margin:0; font-size:30px; line-height:1.18; color:#ffffff;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:34px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 34px; background:#0d0d0d; border-top:1px solid rgba(255,255,255,0.08);">
              <p style="margin:0; font-size:12px; line-height:1.7; color:rgba(255,255,255,0.48);">
                This security email was sent by Movieflix. If you did not request this action, you can ignore this email or change your password from inside the app.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function passwordResetEmail({ name, resetUrl }) {
  return emailShell({
    title: "Reset your password",
    preview: "Use this secure link to reset your Movieflix password.",
    body: `
      <p style="margin:0 0 18px; font-size:17px; line-height:1.7; color:#ffffff;">Hi <strong>${name}</strong>,</p>
      <p style="margin:0 0 24px; font-size:16px; line-height:1.8; color:rgba(255,255,255,0.74);">
        We received a request to reset your Movieflix password. Use the secure button below to create a new password. This link expires in 15 minutes.
      </p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0;">
        <tr>
          <td>
            <a href="${resetUrl}" style="display:inline-block; padding:15px 24px; border-radius:10px; background:#dc2626; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700;">Reset password</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px; font-size:14px; line-height:1.7; color:rgba(255,255,255,0.58);">
        If the button does not work, copy and paste this link into your browser:
      </p>
      <p style="margin:0; word-break:break-all; font-size:13px; line-height:1.7; color:#fca5a5;">${resetUrl}</p>
    `,
  });
}

function passwordChangedEmail({ name }) {
  return emailShell({
    title: "Your password was changed",
    preview: "Your Movieflix password has been updated.",
    body: `
      <p style="margin:0 0 18px; font-size:17px; line-height:1.7; color:#ffffff;">Hi <strong>${name}</strong>,</p>
      <p style="margin:0 0 22px; font-size:16px; line-height:1.8; color:rgba(255,255,255,0.74);">
        This is a confirmation that your Movieflix password was changed successfully.
      </p>
      <p style="margin:0; font-size:15px; line-height:1.8; color:rgba(255,255,255,0.68);">
        If this was not you, request a password reset immediately and secure your account.
      </p>
    `,
  });
}

module.exports = {
  passwordResetEmail,
  passwordChangedEmail,
};
