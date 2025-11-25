package com.chat.util;

import com.chat.model.enums.OTPType;

/**
 * Utility class for email templates
 */
public class EmailTemplates {

    /**
     * Get OTP email subject
     */
    public static String getOTPSubject(OTPType type) {
        return switch (type) {
            case REGISTRATION -> "Melon Chat - Email Verification Code";
            case PASSWORD_RESET -> "Melon Chat - Password Reset Code";
        };
    }

    /**
     * Get OTP email body
     */
    public static String getOTPBody(String code, OTPType type) {
        String purpose = switch (type) {
            case REGISTRATION -> "verify your email address";
            case PASSWORD_RESET -> "reset your password";
        };

        return String.format(
                """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                .header { background: linear-gradient(135deg, #FF6B9D 0%%, #4ADE80 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                                .otp-code { background: white; border: 2px dashed #FF6B9D; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; color: #FF6B9D; }
                                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                                .watermelon { font-size: 48px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <div class="watermelon">🍉</div>
                                    <h1>Melon Chat</h1>
                                </div>
                                <div class="content">
                                    <h2>Verification Code</h2>
                                    <p>Hello!</p>
                                    <p>You requested to %s. Please use the following verification code:</p>
                                    <div class="otp-code">%s</div>
                                    <p><strong>This code will expire in 10 minutes.</strong></p>
                                    <p>If you didn't request this code, please ignore this email.</p>
                                    <p>Best regards,<br>The Melon Chat Team 🍉</p>
                                </div>
                                <div class="footer">
                                    <p>This is an automated email. Please do not reply.</p>
                                    <p>&copy; 2025 Melon Chat. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        """,
                purpose, code);
    }

    /**
     * Get welcome email subject
     */
    public static String getWelcomeSubject() {
        return "Welcome to Melon Chat! 🍉";
    }

    /**
     * Get welcome email body
     */
    public static String getWelcomeBody(String fullName) {
        return String.format(
                """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                .header { background: linear-gradient(135deg, #FF6B9D 0%%, #4ADE80 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                                .watermelon { font-size: 64px; }
                                .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #FF6B9D; border-radius: 4px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <div class="watermelon">🍉</div>
                                    <h1>Welcome to Melon Chat!</h1>
                                </div>
                                <div class="content">
                                    <h2>Hi %s! 👋</h2>
                                    <p>Thank you for joining Melon Chat! We're excited to have you in our community.</p>

                                    <h3>What you can do:</h3>
                                    <div class="feature">💬 <strong>Chat with friends</strong> - Send messages, images, and files</div>
                                    <div class="feature">👥 <strong>Create groups</strong> - Start group conversations</div>
                                    <div class="feature">🔔 <strong>Stay connected</strong> - Real-time notifications</div>
                                    <div class="feature">🎨 <strong>Customize</strong> - Personalize your profile</div>

                                    <p>Start chatting now and enjoy the fresh experience! 🍉</p>

                                    <p>Best regards,<br>The Melon Chat Team</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        """,
                fullName);
    }
}
