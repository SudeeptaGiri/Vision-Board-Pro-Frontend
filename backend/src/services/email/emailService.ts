import sgMail from '@sendgrid/mail';
import { config } from '../../config/env';

// Initialize SendGrid with API key
if (config.email.sendgridApiKey) {
  sgMail.setApiKey(config.email.sendgridApiKey);
  console.log('SendGrid email service initialized');
} else {
  console.warn('WARNING: SENDGRID_API_KEY not set. Email sending will fail.');
}

export const sendVerificationEmail = async (
  to: string,
  name: string,
  token: string
): Promise<void> => {
  if (!config.email.sendgridApiKey) {
    console.error('Cannot send email: SENDGRID_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const verificationUrl = `${config.frontend.url}/verify-email?token=${token}`;

  const msg = {
    to,
    from: {
      email: config.email.fromEmail,
      name: 'VisionBoard Pro',
    },
    subject: '🎯 Verify Your Email - VisionBoard Pro',
    text: `
      Welcome to VisionBoard Pro, ${name}!
      
      Please verify your email address by clicking the link below:
      ${verificationUrl}
      
      If you didn't create an account with VisionBoard Pro, you can safely ignore this email.
      
      Can't find this email? Check your spam or junk folder.
    `,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf8f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #d97757 0%, #c4694d 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                        🎯 VisionBoard Pro
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #2d2926; margin: 0 0 20px; font-size: 24px;">
                        Welcome, ${name}! 👋
                      </h2>
                      <p style="color: #5c5652; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Thank you for signing up for VisionBoard Pro! To complete your registration and start achieving your goals, please verify your email address.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 30px 0;">
                            <a href="${verificationUrl}" 
                               style="display: inline-block; background: linear-gradient(135deg, #d97757 0%, #c4694d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(217, 119, 87, 0.3);">
                              Verify My Email
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #5c5652; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="color: #d97757; font-size: 14px; word-break: break-all; background-color: #faf8f5; padding: 12px; border-radius: 8px; margin: 0 0 30px;">
                        ${verificationUrl}
                      </p>
                      
                      <div style="border-top: 1px solid #e8e4df; padding-top: 20px;">
                        <p style="color: #8c8580; font-size: 13px; line-height: 1.5; margin: 0;">
                          <strong>📧 Can't find this email?</strong><br>
                          Check your spam or junk folder. If you didn't create an account with VisionBoard Pro, you can safely ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #faf8f5; padding: 30px; border-radius: 0 0 16px 16px; text-align: center;">
                      <p style="color: #8c8580; font-size: 12px; margin: 0 0 10px;">
                        © ${new Date().getFullYear()} VisionBoard Pro. All rights reserved.
                      </p>
                      <p style="color: #8c8580; font-size: 12px; margin: 0;">
                        Turn your visions into reality ✨
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${to}`);
  } catch (error: any) {
    console.error('SendGrid error:', error.response?.body || error.message);
    throw error;
  }
};

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  token: string
): Promise<void> => {
  if (!config.email.sendgridApiKey) {
    console.error('Cannot send email: SENDGRID_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const resetUrl = `${config.frontend.url}/reset-password?token=${token}`;

  const msg = {
    to,
    from: {
      email: config.email.fromEmail,
      name: 'VisionBoard Pro',
    },
    subject: '🔐 Reset Your Password - VisionBoard Pro',
    text: `
      Hi ${name},
      
      We received a request to reset your password. Click the link below:
      ${resetUrl}
      
      This link will expire in 1 hour.
    `,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf8f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #d97757 0%, #c4694d 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #2d2926; margin: 0 0 20px;">Hi ${name},</h2>
                      <p style="color: #5c5652; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to create a new password:
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 30px 0;">
                            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #d97757 0%, #c4694d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #8c8580; font-size: 13px;">
                        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Password reset email sent to ${to}`);
  } catch (error: any) {
    console.error('SendGrid error:', error.response?.body || error.message);
    throw error;
  }
};
