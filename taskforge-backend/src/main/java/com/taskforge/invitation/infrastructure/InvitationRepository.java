package com.taskforge.invitation.infrastructure;

import com.taskforge.invitation.domain.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    Optional<Invitation> findByToken(String token);
    List<Invitation> findByOrganizationId(UUID organizationId);
    List<Invitation> findByEmailAndStatus(String email, com.taskforge.invitation.domain.InvitationStatus status);
}
