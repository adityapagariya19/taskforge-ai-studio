package com.taskforge.joinrequest.infrastructure;

import com.taskforge.joinrequest.domain.JoinRequest;
import com.taskforge.joinrequest.domain.JoinRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, UUID> {
    List<JoinRequest> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    List<JoinRequest> findByOrganizationIdAndStatusOrderByCreatedAtDesc(UUID organizationId, JoinRequestStatus status);
    Optional<JoinRequest> findByOrganizationIdAndUserIdAndStatus(UUID organizationId, UUID userId, JoinRequestStatus status);
    List<JoinRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
