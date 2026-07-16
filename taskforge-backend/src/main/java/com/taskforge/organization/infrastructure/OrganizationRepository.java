package com.taskforge.organization.infrastructure;

import com.taskforge.organization.domain.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    boolean existsBySlug(String slug);
    Optional<Organization> findBySlug(String slug);
    Optional<Organization> findByJoinCode(String joinCode);
}
