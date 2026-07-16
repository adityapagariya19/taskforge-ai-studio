package com.taskforge.audit.web;

import com.taskforge.audit.domain.AuditLogEntry;
import com.taskforge.audit.infrastructure.AuditLogRepositoryV2;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/audit-logs")
public class AuditLogController {

    private final AuditLogRepositoryV2 repository;

    public AuditLogController(AuditLogRepositoryV2 repository) {
        this.repository = repository;
    }

    public record AuditLogResponse(String id, String actorOrganizationMemberId, String action,
                                    String resourceType, String resourceId, String metadata,
                                    String ipAddress, String createdAt) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('audit_log:view')")
    @GetMapping
    public List<AuditLogResponse> list(@PathVariable UUID organizationId,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "50") int size) {
        return repository.findByOrganizationIdOrderByCreatedAtDesc(organizationId, PageRequest.of(page, size))
                .stream().map(this::toResponse).toList();
    }

    private AuditLogResponse toResponse(AuditLogEntry e) {
        return new AuditLogResponse(e.getId().toString(),
                e.getActorOrganizationMemberId() == null ? null : e.getActorOrganizationMemberId().toString(),
                e.getAction(), e.getResourceType(),
                e.getResourceId() == null ? null : e.getResourceId().toString(),
                e.getMetadata(), e.getIpAddress(), e.getCreatedAt().toString());
    }
}
