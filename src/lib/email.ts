import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface WelcomeEmailOptions {
  to: string;
  driverName: string;
  tempPassword: string;
  loginUrl: string;
  orgName?: string;
}

export async function sendWelcomeEmail({
  to,
  driverName,
  tempPassword,
  loginUrl,
  orgName = "DaycareRide",
}: WelcomeEmailOptions) {
  const firstName = driverName.split(" ")[0];
  // Embed credentials directly in the sign-in link — driver just taps and lands logged in.
  const signInUrl = `${loginUrl}?email=${encodeURIComponent(to)}&password=${encodeURIComponent(tempPassword)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${orgName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <p style="margin:12px 0 0;font-size:22px;font-weight:700;color:#111827;">DaycareRide</p>
              <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${orgName}</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);padding:36px 40px;">

              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Welcome, ${firstName}! 👋</p>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                Your driver account has been created on <strong>${orgName}</strong>.
                Use the credentials below to sign in for the first time.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">Your Login Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#6b7280;width:40%;padding-right:16px;">Email:</td>
                        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">${to}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#6b7280;padding-right:16px;">Password:</td>
                        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">${tempPassword}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${signInUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:9px;">
                      Sign In Now →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#c2410c;">🔒 Important — Change your password</p>
                    <p style="margin:0;font-size:13px;color:#9a3412;line-height:1.5;">
                      This is a temporary password. Please change it after your first login via <strong>My Profile → Change Password</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                If you have questions, contact your transportation coordinator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} DaycareRide · Sent automatically when your account was created
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Welcome to ${orgName}, ${firstName}!

Your driver account has been created. Tap the link below to sign in automatically:

${signInUrl}

If the link doesn't work, go to ${loginUrl} and use:
  Email:    ${to}
  Password: ${tempPassword}

IMPORTANT: Please change your password after your first login (My Profile → Change Password).

If you have questions, contact your transportation coordinator.`;

  return transporter.sendMail({
    from: `"DaycareRide" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Welcome to ${orgName} — Your Driver Account`,
    html,
    text,
  });
}
