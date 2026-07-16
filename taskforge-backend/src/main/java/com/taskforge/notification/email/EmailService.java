package com.taskforge.notification.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Real SMTP email delivery — works with any SMTP provider (Gmail SMTP,
 * SendGrid's free tier, Mailgun, your company's own mail server) purely
 * through environment variables (see application-prod.yml / the Email
 * Setup Guide). No provider is hardcoded or faked.
 *
 * Deliberately fails safe: if mail isn't configured or the send fails, this
 * logs and returns rather than throwing — a notification email must never
 * be able to break the actual business operation (assigning a task,
 * approving a request) that triggered it. This mirrors how the AI provider
 * abstraction and notification system already treat side effects: real
 * when configured, visibly absent (never faked) when not.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final Optional<JavaMailSender> mailSender;
    private final String fromAddress;
    private final boolean enabled;

    public EmailService(Optional<JavaMailSender> mailSender,
                         @Value("${taskforge.email.from:noreply@taskforge.local}") String fromAddress,
                         @Value("${taskforge.email.enabled:false}") boolean enabled) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.enabled = enabled;
    }

    @Async
    public void send(String toAddress, String subject, String body) {
        if (!enabled || mailSender.isEmpty()) {
            log.info("[Email disabled] Would have sent to {}: {}", toAddress, subject);
            return;
        }
        if (toAddress == null || toAddress.isBlank()) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toAddress);
            message.setSubject(subject);
            message.setText(body);
            mailSender.get().send(message);
        } catch (MailException e) {
            // Never propagate — see class Javadoc. Logged so it's operationally visible,
            // but the triggering request (e.g. assigning a task) already succeeded.
            log.warn("Failed to send email to {}: {}", toAddress, e.getMessage());
        }
    }

    public void sendTaskAssigned(String toAddress, String assigneeName, String issueKey, String issueTitle, String assignedByName) {
        String subject = "You've been assigned " + issueKey + " on TaskForge";
        String body = "Hi " + assigneeName + ",\n\n"
                + assignedByName + " assigned you a task:\n\n"
                + issueKey + " — " + issueTitle + "\n\n"
                + "Open TaskForge to view details and get started.\n\n"
                + "— TaskForge AI Studio";
        send(toAddress, subject, body);
    }

    public void sendJoinRequestReceived(String adminAddress, String organizationName, String requesterEmail, String requestedRole) {
        String subject = "New join request for " + organizationName;
        String body = requesterEmail + " has requested to join " + organizationName + " as " + requestedRole + ".\n\n"
                + "Review this request in TaskForge under Organization → Requests.\n\n"
                + "— TaskForge AI Studio";
        send(adminAddress, subject, body);
    }

    public void sendJoinRequestDecision(String requesterAddress, String organizationName, boolean approved, String note) {
        String subject = approved ? "You're in! Welcome to " + organizationName : "Update on your request to join " + organizationName;
        String body = approved
                ? "Your request to join " + organizationName + " was approved. Sign in to get started.\n\n— TaskForge AI Studio"
                : "Your request to join " + organizationName + " was not approved."
                    + (note != null && !note.isBlank() ? ("\n\nNote: " + note) : "")
                    + "\n\n— TaskForge AI Studio";
        send(requesterAddress, subject, body);
    }
}
