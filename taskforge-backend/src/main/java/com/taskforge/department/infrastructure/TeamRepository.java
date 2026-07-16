package com.taskforge.department.infrastructure;

import com.taskforge.department.domain.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {
    List<Team> findByOrganizationId(UUID organizationId);
    List<Team> findByDepartmentId(UUID departmentId);
}
