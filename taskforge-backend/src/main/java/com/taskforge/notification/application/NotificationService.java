package com.taskforge.notification.application;

import com.taskforge.common.exception.ApiException;
import com.taskforge.notification.domain.Notification;
import com.taskforge.notification.infrastructure.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    public void notify(UUID userId, String type, String title, String body, String link, boolean actorIsAi) {
        if (userId == null) return; // nobody to notify (e.g. AI-authored sub-issue with no human reporter yet)
        repository.save(new Notification(userId, type, title, body, link, actorIsAi));
    }

    public List<Notification> listForUser(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markRead(UUID notificationId, UUID userId) {
        Notification n = repository.findById(notificationId).orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!n.getUserId().equals(userId)) throw ApiException.forbidden("Not your notification");
        n.setRead(true);
        repository.save(n);
    }
}
