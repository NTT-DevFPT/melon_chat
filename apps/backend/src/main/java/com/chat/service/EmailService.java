package com.chat.service;

import com.chat.model.enums.OTPType;
import com.chat.util.EmailTemplates;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Service for sending emails
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@melonchat.com}")
    private String fromEmail;

    /**
     * Send plain email
     * Sends from melonchat05@gmail.com (configured in application.yml)
     */
    public void sendEmail(String to, String subject, String body) {
        // Ensure fromEmail is set to melonchat05@gmail.com
        String senderEmail = (fromEmail != null && !fromEmail.isEmpty()) ? fromEmail : "melonchat05@gmail.com";
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML

            mailSender.send(message);
            logger.info("Email sent successfully from {} to: {}", senderEmail, to);

        } catch (MessagingException e) {
            logger.error("Failed to send email from {} to: {}", senderEmail, to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send OTP email with template
     * Sends to the user's email address
     */
    public void sendOTPEmail(String to, String code, OTPType type) {
        String subject = EmailTemplates.getOTPSubject(type);
        String body = EmailTemplates.getOTPBody(code, type);
        logger.info("Sending OTP email to: {}, Code: {}", to, code);
        sendEmail(to, subject, body);
    }

    /**
     * Send welcome email
     */
    public void sendWelcomeEmail(String to, String fullName) {
        String subject = EmailTemplates.getWelcomeSubject();
        String body = EmailTemplates.getWelcomeBody(fullName);
        sendEmail(to, subject, body);
    }
}
