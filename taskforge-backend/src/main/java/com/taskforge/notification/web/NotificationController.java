package com.taskforge.notification.web;

import com.taskforge.notification.application.NotificationService;
import com.taskforge.notification.domain.Notification;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    public record NotificationResponse(String id, String type, String title, String body, String link,
                                        boolean actorIsAi, boolean isRead, String createdAt) {}

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal UUID userId) {
        return notificationService.listForUser(userId).stream().map(this::toResponse).toList();
    }

    @PatchMapping("/{id}/read")
    public void markRead(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        notificationService.markRead(id, userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId().toString(), n.getType(), n.getTitle(), n.getBody(), n.getLink(),
                n.isActorIsAi(), n.isRead(), n.getCreatedAt().toString());
    }
}
