'use strict';

const SibApiV3Sdk = require('sib-api-v3-sdk');

/**
 * Initialize Brevo API client
 */
const getBrevoClient = () => {
  return new SibApiV3Sdk.ApiClient();
};

/**
 * Get configured Transactional Emails API instance
 */
const getTransactionalApi = () => {
  const apiClient = getBrevoClient();
  const brevoApiKey = process.env.BREVO_API_KEY;
  
  if (!brevoApiKey) {
    throw new Error('Brevo API key not configured');
  }
  
  // Configure API key
  apiClient.authentications['api-key'].apiKey = brevoApiKey;
  
  return new SibApiV3Sdk.TransactionalEmailsApi(apiClient);
};

/**
 * Send OTP email to user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} otp - 6-digit OTP
 */
const sendOTPEmail = async (email, name, otp) => {
  try {
    const apiInstance = getTransactionalApi();
    
    const senderEmail = process.env.EMAIL_FROM || 'parthmahajan27.7@gmail.com';
    const senderName = process.env.EMAIL_FROM_NAME || 'JainVerse';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">JainVerse</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Verify Your Email Address</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Hello <strong>${name}</strong>,</p>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
                Thank you for registering with JainVerse. To complete your registration, please verify your email address by entering the One-Time Password (OTP) below:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f8f9fa; border: 2px dashed #e94560; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
                <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <p style="color: #e94560; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 8px;">${otp}</p>
              </div>
              
              <p style="color: #999999; font-size: 12px; margin: 0 0 25px 0;">
                This OTP is valid for 10 minutes. Please do not share this code with anyone.
              </p>
              
              <!-- Footer -->
              <div style="border-top: 1px solid #eeeeee; padding-top: 20px;">
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  If you didn't create an account with JainVerse, please ignore this email.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `Hello ${name},

Thank you for registering with JainVerse. To complete your registration, please verify your email address by entering the One-Time Password (OTP) below:

Your Verification Code: ${otp}

This OTP is valid for 10 minutes. Please do not share this code with anyone.

If you didn't create an account with JainVerse, please ignore this email.

Best regards,
JainVerse Team`;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: email, name: name }];
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.subject = 'Verify Your Email - JainVerse';
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('Brevo OTP email sent successfully:', response.body?.messageId || response.body?.messageIds);
    return response;
  } catch (error) {
    console.error('Error sending OTP email via Brevo:', error);
    // Don't throw - continue with registration even if email fails
    return null;
  }
};

/**
 * Send welcome email after email verification
 * @param {string} email - User's email address
 * @param {string} name - User's name
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    const apiInstance = getTransactionalApi();
    
    const senderEmail = process.env.EMAIL_FROM || 'parthmahajan27.7@gmail.com';
    const senderName = process.env.EMAIL_FROM_NAME || 'JainVerse';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">JainVerse</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Welcome to Our Community!</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Hello <strong>${name}</strong>,</p>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                🎉 Welcome to JainVerse! Your email has been successfully verified.
              </p>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
                You're now part of our community of Jain businesses and professionals.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}" style="display: inline-block; background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%); color: #ffffff; padding: 14px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 14px;">
                  Explore JainVerse
                </a>
              </div>
              
              <!-- Footer -->
              <div style="border-top: 1px solid #eeeeee; padding-top: 20px;">
                <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                  Need help? Contact us at support@jainverse.com
                </p>
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  © 2026 JainVerse. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `Hello ${name},

🎉 Welcome to JainVerse! Your email has been successfully verified.

You're now part of our community of Jain businesses and professionals.

Visit us at: ${frontendUrl}

© 2026 JainVerse. All rights reserved.`;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: email, name: name }];
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.subject = 'Welcome to JainVerse!';
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('Brevo welcome email sent successfully:', response.body?.messageId || response.body?.messageIds);
    return response;
  } catch (error) {
    console.error('Error sending welcome email via Brevo:', error);
    return null;
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} otp - 6-digit OTP
 */
const sendPasswordResetEmail = async (email, name, otp) => {
  try {
    const apiInstance = getTransactionalApi();
    
    const senderEmail = process.env.EMAIL_FROM || 'parthmahajan27.7@gmail.com';
    const senderName = process.env.EMAIL_FROM_NAME || 'JainVerse';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">JainVerse</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #333333; margin-top: 0;">Password Reset OTP</h2>
              <p style="color: #666666; line-height: 1.6;">
                You requested to reset your password. Use the following OTP to reset your password:
              </p>
              <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 4px;">${otp}</span>
              </div>
              <p style="color: #666666; line-height: 1.6;">
                This OTP will expire in <strong>10 minutes</strong>.
              </p>
              <p style="color: #999999; font-size: 12px; margin-top: 20px;">
                If you didn't request a password reset, please ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await apiInstance.sendTransacEmail({
      sender: { email: senderEmail, name: senderName },
      to: [{ email, name: name || 'User' }],
      subject: 'Password Reset OTP - JainVerse',
      htmlContent,
    });

    console.log('Brevo password reset email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending password reset email via Brevo:', error);
    return null;
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
