package com.taskforge.department.infrastructure;

import com.taskforge.department.domain.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    List<Department> findByOrganizationId(UUID organizationId);
    List<Department> findByOrganizationIdAndParentDepartmentId(UUID organizationId, UUID parentDepartmentId);
}
