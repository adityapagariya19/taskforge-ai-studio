package com.taskforge.audit.application;

import com.taskforge.audit.domain.AuditLogEntry;
import com.taskforge.audit.infrastructure.AuditLogRepositoryV2;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepositoryV2 repository;

    public AuditService(AuditLogRepositoryV2 repository) {
        this.repository = repository;
    }

    public void record(UUID organizationId, UUID actorOrganizationMemberId, String action,
                        String resourceType, UUID resourceId, String metadataJson) {
        AuditLogEntry entry = new AuditLogEntry();
        entry.setOrganizationId(organizationId);
        entry.setActorOrganizationMemberId(actorOrganizationMemberId);
        entry.setAction(action);
        entry.setResourceType(resourceType);
        entry.setResourceId(resourceId);
        if (metadataJson != null) entry.setMetadata(metadataJson);
        repository.save(entry);
    }
}
