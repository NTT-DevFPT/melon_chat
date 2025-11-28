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
     */
    public void sendEmail(String to, String subject, String body) {
        // If email username is not configured, just log the email
        if (fromEmail == null || fromEmail.isEmpty() || fromEmail.contains("noreply@melonchat.com")) {
            logger.info("Skipping email sending (no SMTP config). To: {}, Subject: {}", to, subject);
            logger.info("Body: {}", body);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML

            mailSender.send(message);
            logger.info("Email sent successfully to: {}", to);

        } catch (MessagingException e) {
            logger.error("Failed to send email to: {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send OTP email with template
     */
    public void sendOTPEmail(String to, String code, OTPType type) {
        String subject = EmailTemplates.getOTPSubject(type);
        String body = EmailTemplates.getOTPBody(code, type);
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
