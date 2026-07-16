package com.taskforge.permission.infrastructure;

import com.taskforge.permission.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    /** The 16 system template roles, shared until cloned into a specific organization. */
    List<Role> findByOrganizationIdIsNull();

    List<Role> findByOrganizationId(UUID organizationId);

    Optional<Role> findByOrganizationIdAndCode(UUID organizationId, String code);

    Optional<Role> findByOrganizationIdIsNullAndCode(String code);
}
