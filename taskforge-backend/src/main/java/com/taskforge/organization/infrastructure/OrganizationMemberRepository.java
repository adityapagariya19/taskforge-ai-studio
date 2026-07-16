package com.taskforge.organization.infrastructure;

import com.taskforge.organization.domain.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    List<OrganizationMember> findByUserId(UUID userId);
    Optional<OrganizationMember> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);
    List<OrganizationMember> findByOrganizationId(UUID organizationId);
    List<OrganizationMember> findByOrganizationIdAndDepartmentId(UUID organizationId, UUID departmentId);
    boolean existsByOrganizationIdAndUserId(UUID organizationId, UUID userId);
}
