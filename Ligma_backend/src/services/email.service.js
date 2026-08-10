import nodemailer from "nodemailer";

import config from "../config/env.config.js";
import logger from "../utils/logger.util.js";

const transporter = config.GMAIL_USER && config.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.GMAIL_USER,
        pass: config.GMAIL_APP_PASSWORD,
      },
    })
  : null;

const buildVerificationUrl = (token) => {
  const baseUrl = config.CLIENT_URL.replace(/\/$/, "");
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
};

const sendVerificationEmail = async ({ to, name, token }) => {
  if (!transporter) {
    logger.warn("Gmail transporter is not configured; skipping verification email delivery.");
    return { success: false, skipped: true };
  }

  const verificationUrl = buildVerificationUrl(token);
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background:#f7f7fb; padding:24px; color:#111827;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
        <div style="background:linear-gradient(135deg, #5b5cf6 0%, #4f46e5 100%); padding:24px 28px; color:#ffffff;">
          <div style="font-size:12px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; opacity:0.9;">LIGMA</div>
          <h1 style="margin:12px 0 6px; font-size:24px;">Welcome to LIGMA</h1>
          <p style="margin:0; font-size:14px; opacity:0.95;">Please verify your email to start using your workspace.</p>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 12px; font-size:16px;">Hi ${name || "there"},</p>
          <p style="margin:0 0 16px; line-height:1.6; color:#374151;">
            Thanks for joining LIGMA. To finish setting up your account and unlock your workspace, please verify your email address.
          </p>
          <p style="margin:0 0 20px;">
            <a href="${verificationUrl}" style="display:inline-block; padding:12px 18px; border-radius:999px; background:#4f46e5; color:#ffffff; text-decoration:none; font-weight:700;">Verify email address</a>
          </p>
          <p style="margin:0 0 10px; font-size:13px; color:#6b7280; line-height:1.6;">
            If the button does not work, copy and open this link in your browser:<br />
            <span style="word-break:break-all;">${verificationUrl}</span>
          </p>
          <p style="margin:16px 0 0; font-size:12px; color:#9ca3af; line-height:1.6;">
            This verification link expires in 24 hours. If you did not create an account with LIGMA, you can safely ignore this message.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `Hi ${name || "there"},\n\nWelcome to LIGMA. Please verify your email address to get started.\n\n${verificationUrl}\n\nThis verification link expires in 24 hours.`;

  try {
    const info = await transporter.sendMail({
      from: `"LIGMA" <${config.GMAIL_USER}>`,
      to,
      subject: "Verify your LIGMA email",
      html,
      text,
    });

    logger.info("Verification email sent", { id: info?.messageId, to });
    return { success: true, id: info?.messageId };
  } catch (error) {
    logger.error("Failed to send verification email", { message: error?.message, to });
    throw new Error("We couldn't send the verification email right now.");
  }
};

const buildInvitationHtml = ({ inviterName, workspaceTitle, role, inviteLink }) => `
  <div style="font-family: Inter, Arial, sans-serif; background:#f7f7fb; padding:24px; color:#111827;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
      <div style="background:linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding:24px 28px; color:#ffffff;">
        <div style="font-size:12px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; opacity:0.9;">LIGMA</div>
        <h1 style="margin:12px 0 6px; font-size:22px;">You're invited to collaborate</h1>
        <p style="margin:0; font-size:14px; opacity:0.95;">${inviterName || "A teammate"} invited you to join a workspace on LIGMA.</p>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 16px; line-height:1.6; color:#374151;">
          <strong>${inviterName || "Someone"}</strong> invited you to join <strong>${workspaceTitle}</strong> as a <strong>${role}</strong>.
        </p>
        <p style="margin:0 0 20px;">
          <a href="${inviteLink}" style="display:inline-block; padding:12px 20px; border-radius:999px; background:#0d9488; color:#ffffff; text-decoration:none; font-weight:700;">Accept invitation</a>
        </p>
        <p style="margin:0 0 10px; font-size:13px; color:#6b7280; line-height:1.6;">
          If the button does not work, copy and open this link in your browser:<br />
          <span style="word-break:break-all;">${inviteLink}</span>
        </p>
        <p style="margin:16px 0 0; font-size:12px; color:#9ca3af; line-height:1.6;">
          If you weren't expecting this invitation, you can safely ignore this email.
        </p>
      </div>
    </div>
  </div>
`;

const sendInvitationEmail = async ({ to, inviterName, workspaceTitle, role, inviteLink }) => {
  if (!transporter) {
    logger.warn("Gmail transporter is not configured; skipping invitation email delivery.");
    return { success: false, skipped: true };
  }

  const html = buildInvitationHtml({ inviterName, workspaceTitle, role, inviteLink });
  const text = `${inviterName || "Someone"} invited you to join "${workspaceTitle}" as a ${role} on LIGMA.\n\nAccept the invitation: ${inviteLink}`;

  try {
    const info = await transporter.sendMail({
      from: `"LIGMA" <${config.GMAIL_USER}>`,
      to,
      subject: `${inviterName || "Someone"} invited you to join "${workspaceTitle}" on LIGMA`,
      html,
      text,
    });
    logger.info("Invitation email sent", { id: info?.messageId, to });
    return { success: true, id: info?.messageId };
  } catch (error) {
    logger.error("Failed to send invitation email", { message: error?.message, to });
    throw new Error("We couldn't send the invitation email right now.");
  }
};

export { buildVerificationUrl, sendVerificationEmail, sendInvitationEmail };

export default {
  buildVerificationUrl,
  sendVerificationEmail,
  sendInvitationEmail,
};