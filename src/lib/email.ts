import * as brevo from '@getbrevo/brevo';

// Initialize Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

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

/**
 * Send email verification email to user
 */
export async function sendVerificationEmail({
  name,
  email,
  verificationUrl,
}: VerificationEmailParams): Promise<EmailResult> {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const sender = {
      email: process.env.BREVO_FROM_EMAIL || 'noreply@csogo.org',
      name: process.env.BREVO_FROM_NAME || 'CSO Self-Assessment Tool',
    };

    const recipients = [
      {
        email,
        name,
      },
    ];

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

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = recipients;
    sendSmtpEmail.subject = 'Verify Your Email Address - CSO Self-Assessment Tool';
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    return {
      success: true,
      messageId: response.body?.messageId || 'unknown',
    };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification email',
    };
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail({
  name,
  email,
  loginUrl,
}: WelcomeEmailParams): Promise<EmailResult> {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const sender = {
      email: process.env.BREVO_FROM_EMAIL || 'noreply@csogo.org',
      name: process.env.BREVO_FROM_NAME || 'CSO Self-Assessment Tool',
    };

    const recipients = [
      {
        email,
        name,
      },
    ];

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

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = recipients;
    sendSmtpEmail.subject = 'Welcome to CSO Self-Assessment Tool - Email Verified!';
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    return {
      success: true,
      messageId: response.body?.messageId || 'unknown',
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email',
    };
  }
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
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const sender = {
      email: process.env.BREVO_FROM_EMAIL || 'noreply@csogo.org',
      name: process.env.BREVO_FROM_NAME || 'CSO Self-Assessment Tool',
    };

    const recipients = [
      {
        email,
        name,
      },
    ];

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

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = recipients;
    sendSmtpEmail.subject = 'Admin Invitation - CSO Self-Assessment Tool';
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    return {
      success: true,
      messageId: response.body?.messageId || 'unknown',
    };
  } catch (error) {
    console.error('Error sending admin invite email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send admin invite email',
    };
  }
}
