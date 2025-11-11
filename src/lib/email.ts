import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getSmtpConfig() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const fromEmail = process.env.EMAIL_FROM_EMAIL || user;
  const fromName = process.env.EMAIL_FROM_NAME || 'CSO Self-Assessment Tool';
  const portValue = process.env.EMAIL_PORT ?? '465';
  const secureValue = process.env.EMAIL_SECURE;

  if (!host) {
    throw new Error('EMAIL_HOST environment variable is not set');
  }

  if (!user) {
    throw new Error('EMAIL_USER environment variable is not set');
  }

  if (!pass) {
    throw new Error('EMAIL_PASS environment variable is not set');
  }

  if (!fromEmail) {
    throw new Error('EMAIL_FROM_EMAIL or EMAIL_USER environment variable is not set');
  }

  const port = Number(portValue);

  if (Number.isNaN(port)) {
    throw new Error('EMAIL_PORT environment variable must be a valid number');
  }

  const secure =
    typeof secureValue === 'string'
      ? secureValue.toLowerCase() === 'true'
      : port === 465;

  return {
    transport: {
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    },
    sender: {
      address: fromEmail,
      name: fromName,
    },
  };
}

function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const { transport } = getSmtpConfig();

  transporter = nodemailer.createTransport({
    ...transport,
  });

  return transporter;
}

interface SendTemplatedEmailParams {
  recipient: {
    email: string;
    name: string;
  };
  subject: string;
  htmlContent: string;
  textContent: string;
  context: string;
}

async function sendTemplatedEmail({
  recipient,
  subject,
  htmlContent,
  textContent,
  context,
}: SendTemplatedEmailParams): Promise<EmailResult> {
  try {
    const { sender } = getSmtpConfig();
    const smtpTransporter = getTransporter();

    const info = await smtpTransporter.sendMail({
      from: sender,
      to: {
        address: recipient.email,
        name: recipient.name,
      },
      subject,
      html: htmlContent,
      text: textContent,
    });

    return {
      success: true,
      messageId: info.messageId || undefined,
    };
  } catch (error) {
    console.error(`Error sending ${context}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to send ${context}`,
    };
  }
}

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

interface VerificationEmailParams {
  name: string;
  email: string;
  verificationUrl: string;
}

interface WelcomeEmailParams {
  name: string;
  email: string;
  loginUrl: string;
}

interface AdminInviteEmailParams {
  name: string;
  email: string;
  inviteUrl: string;
  invitedBy: string;
}

interface AdminPasswordResetEmailParams {
  name: string;
  email: string;
  loginUrl: string;
  resetBy: string;
  newPassword: string;
}

interface OrganizationPasswordResetEmailParams {
  name: string;
  email: string;
  loginUrl: string;
  resetBy: string;
  newPassword: string;
}

/**
 * Send email verification email to user
 */
export async function sendVerificationEmail({
  name,
  email,
  verificationUrl,
}: VerificationEmailParams): Promise<EmailResult> {
  // HTML content for verification email
  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - CSO Self-Assessment Tool</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #2c5530; margin-bottom: 20px;">Welcome to CSO Self-Assessment Tool!</h1>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Hi ${name},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Thank you for registering with the CSO Self-Assessment Tool. To complete your registration and start using the platform, please verify your email address by clicking the button below:
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2c5530; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${verificationUrl}" style="color: #2c5530; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This verification link will expire in 24 hours for security reasons.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999;">
            If you didn't create an account with the CSO Self-Assessment Tool, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;

  const textContent = `
      Welcome to CSO Self-Assessment Tool!
      
      Hi ${name},
      
      Thank you for registering with the CSO Self-Assessment Tool. To complete your registration and start using the platform, please verify your email address by visiting this link:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours for security reasons.
      
      If you didn't create an account with the CSO Self-Assessment Tool, please ignore this email.
    `;

  return sendTemplatedEmail({
    recipient: { email, name },
    subject: 'Verify Your Email Address - CSO Self-Assessment Tool',
    htmlContent,
    textContent,
    context: 'verification email',
  });
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail({
  name,
  email,
  loginUrl,
}: WelcomeEmailParams): Promise<EmailResult> {
  // HTML content for welcome email
  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CSO Self-Assessment Tool</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #2c5530; margin-bottom: 20px;">Welcome to CSO Self-Assessment Tool!</h1>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Hi ${name},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Congratulations! Your email address has been successfully verified. You can now access all features of the CSO Self-Assessment Tool.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            The CSO Self-Assessment Tool will help your organization evaluate its capabilities across key areas including governance, financial management, programme delivery, and more.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #2c5530; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <div style="background-color: #fff; border-left: 4px solid #2c5530; padding: 20px; margin: 30px 0; text-align: left;">
            <h3 style="color: #2c5530; margin-top: 0;">What's Next?</h3>
            <ul style="padding-left: 20px;">
              <li>Complete your first self-assessment</li>
              <li>Review your organization's capabilities</li>
              <li>Access personalized recommendations</li>
              <li>Download detailed reports</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999;">
            This email was sent from noreply@csogo.org. Please do not reply directly to this email.
          </p>
        </div>
      </body>
      </html>
    `;

  const textContent = `
      Welcome to CSO Self-Assessment Tool!
      
      Hi ${name},
      
      Congratulations! Your email address has been successfully verified. You can now access all features of the CSO Self-Assessment Tool.
      
      The CSO Self-Assessment Tool will help your organization evaluate its capabilities across key areas including governance, financial management, programme delivery, and more.
      
      Access your dashboard here: ${loginUrl}
      
      What's Next?
      - Complete your first self-assessment
      - Review your organization's capabilities
      - Access personalized recommendations
      - Download detailed reports
      
      If you have any questions or need assistance, please don't hesitate to contact our support team.
    `;

  return sendTemplatedEmail({
    recipient: { email, name },
    subject: 'Welcome to CSO Self-Assessment Tool - Email Verified!',
    htmlContent,
    textContent,
    context: 'welcome email',
  });
}

/**
 * Send admin invitation email
 */
export async function sendAdminInviteEmail({
  name,
  email,
  inviteUrl,
  invitedBy,
}: AdminInviteEmailParams): Promise<EmailResult> {
  // HTML content for admin invitation email
  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Invitation - CSO Self-Assessment Tool</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #2c5530; margin-bottom: 20px;">Admin Invitation - CSO Self-Assessment Tool</h1>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Hi ${name},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            You have been invited by ${invitedBy} to join the CSO Self-Assessment Tool as an administrator. As an admin, you'll have access to:
          </p>
          
          <div style="background-color: #fff; border-left: 4px solid #2c5530; padding: 20px; margin: 30px 0; text-align: left;">
            <h3 style="color: #2c5530; margin-top: 0;">Admin Capabilities:</h3>
            <ul style="padding-left: 20px;">
              <li>Manage assessment questions and sections</li>
              <li>View and download organization reports</li>
              <li>Manage organization data</li>
              <li>Access system analytics and insights</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            To accept this invitation and set up your admin account, please click the button below:
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #2c5530; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Accept Invitation & Set Up Account
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${inviteUrl}" style="color: #2c5530; word-break: break-all;">${inviteUrl}</a>
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This invitation link will expire in 7 days for security reasons.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999;">
            If you were not expecting this invitation, please ignore this email or contact the system administrator.
          </p>
        </div>
      </body>
      </html>
    `;

  const textContent = `
      Admin Invitation - CSO Self-Assessment Tool
      
      Hi ${name},
      
      You have been invited by ${invitedBy} to join the CSO Self-Assessment Tool as an administrator. As an admin, you'll have access to manage assessment questions, view organization reports, and access system analytics.
      
      To accept this invitation and set up your admin account, please visit this link:
      
      ${inviteUrl}
      
      This invitation link will expire in 7 days for security reasons.
      
      If you were not expecting this invitation, please ignore this email or contact the system administrator.
    `;

  return sendTemplatedEmail({
    recipient: { email, name },
    subject: 'Admin Invitation - CSO Self-Assessment Tool',
    htmlContent,
    textContent,
    context: 'admin invite email',
  });
}

/**
 * Send admin password reset email
 */
export async function sendAdminPasswordResetEmail({
  name,
  email,
  loginUrl,
  resetBy,
  newPassword,
}: AdminPasswordResetEmailParams): Promise<EmailResult> {
  // HTML content for password reset email
  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Password Reset - CSO Self-Assessment Tool</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #2c5530; margin-bottom: 20px;">Admin Password Reset - CSO Self-Assessment Tool</h1>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Hi ${name},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Your admin password has been reset by ${resetBy}. A new temporary password has been generated for your account.
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; text-align: left;">
            <h3 style="color: #856404; margin-top: 0;">⚠️ Important Security Notice</h3>
            <p style="color: #856404; margin-bottom: 10px;">
              <strong>Your new temporary password is:</strong>
            </p>
            <div style="background-color: #fff; padding: 15px; border: 2px solid #ffc107; border-radius: 5px; font-family: monospace; font-size: 18px; font-weight: bold; color: #856404; text-align: center; letter-spacing: 2px;">
              ${newPassword}
            </div>
            <p style="color: #856404; margin-top: 15px; font-size: 14px;">
              <strong>Please change this password immediately after logging in for security reasons.</strong>
            </p>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Please log in using this temporary password and set a new password of your choice.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #2c5530; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Log In to Admin Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${loginUrl}" style="color: #2c5530; word-break: break-all;">${loginUrl}</a>
          </p>
          
          <div style="background-color: #fff; border-left: 4px solid #2c5530; padding: 20px; margin: 30px 0; text-align: left;">
            <h3 style="color: #2c5530; margin-top: 0;">Security Tips:</h3>
            <ul style="padding-left: 20px; color: #666;">
              <li>Use a strong, unique password that you haven't used elsewhere</li>
              <li>Include a mix of uppercase and lowercase letters, numbers, and special characters</li>
              <li>Do not share your password with anyone</li>
              <li>Change your password regularly</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999;">
            If you did not request this password reset, please contact your system administrator immediately.
          </p>
        </div>
      </body>
      </html>
    `;

  const textContent = `
      Admin Password Reset - CSO Self-Assessment Tool
      
      Hi ${name},
      
      Your admin password has been reset by ${resetBy}. A new temporary password has been generated for your account.
      
      Your new temporary password is: ${newPassword}
      
      ⚠️ IMPORTANT: Please change this password immediately after logging in for security reasons.
      
      Please log in using this temporary password and set a new password of your choice.
      
      Log in here: ${loginUrl}
      
      Security Tips:
      - Use a strong, unique password that you haven't used elsewhere
      - Include a mix of uppercase and lowercase letters, numbers, and special characters
      - Do not share your password with anyone
      - Change your password regularly
      
      If you did not request this password reset, please contact your system administrator immediately.
    `;

  return sendTemplatedEmail({
    recipient: { email, name },
    subject: 'Admin Password Reset - CSO Self-Assessment Tool',
    htmlContent,
    textContent,
    context: 'admin password reset email',
  });
}

/**
 * Send organization password reset email
 */
export async function sendOrganizationPasswordResetEmail({
  name,
  email,
  loginUrl,
  resetBy,
  newPassword,
}: OrganizationPasswordResetEmailParams): Promise<EmailResult> {
  // HTML content for password reset email
  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - CSO Self-Assessment Tool</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #2c5530; margin-bottom: 20px;">Password Reset - CSO Self-Assessment Tool</h1>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Hi ${name},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Your organization account password has been reset by an administrator (${resetBy}). A new temporary password has been generated for your account.
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; text-align: left;">
            <h3 style="color: #856404; margin-top: 0;">⚠️ Important Security Notice</h3>
            <p style="color: #856404; margin-bottom: 10px;">
              <strong>Your new temporary password is:</strong>
            </p>
            <div style="background-color: #fff; padding: 15px; border: 2px solid #ffc107; border-radius: 5px; font-family: monospace; font-size: 18px; font-weight: bold; color: #856404; text-align: center; letter-spacing: 2px;">
              ${newPassword}
            </div>
            <p style="color: #856404; margin-top: 15px; font-size: 14px;">
              <strong>Please change this password immediately after logging in for security reasons.</strong>
            </p>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Please log in using this temporary password. We recommend changing it to a password of your choice after logging in.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #2c5530; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Log In to Your Account
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${loginUrl}" style="color: #2c5530; word-break: break-all;">${loginUrl}</a>
          </p>
          
          <div style="background-color: #fff; border-left: 4px solid #2c5530; padding: 20px; margin: 30px 0; text-align: left;">
            <h3 style="color: #2c5530; margin-top: 0;">Security Tips:</h3>
            <ul style="padding-left: 20px; color: #666;">
              <li>Use a strong, unique password that you haven't used elsewhere</li>
              <li>Include a mix of uppercase and lowercase letters, numbers, and special characters</li>
              <li>Do not share your password with anyone</li>
              <li>Change your password regularly</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999;">
            If you did not request this password reset, please contact your system administrator immediately.
          </p>
        </div>
      </body>
      </html>
    `;

  const textContent = `
      Password Reset - CSO Self-Assessment Tool
      
      Hi ${name},
      
      Your organization account password has been reset by an administrator (${resetBy}). A new temporary password has been generated for your account.
      
      Your new temporary password is: ${newPassword}
      
      ⚠️ IMPORTANT: Please change this password immediately after logging in for security reasons.
      
      Please log in using this temporary password. We recommend changing it to a password of your choice after logging in.
      
      Log in here: ${loginUrl}
      
      Security Tips:
      - Use a strong, unique password that you haven't used elsewhere
      - Include a mix of uppercase and lowercase letters, numbers, and special characters
      - Do not share your password with anyone
      - Change your password regularly
      
      If you did not request this password reset, please contact your system administrator immediately.
    `;

  return sendTemplatedEmail({
    recipient: { email, name },
    subject: 'Password Reset - CSO Self-Assessment Tool',
    htmlContent,
    textContent,
    context: 'organization password reset email',
  });
}
