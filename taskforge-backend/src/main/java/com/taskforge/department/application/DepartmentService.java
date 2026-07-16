package com.taskforge.department.application;

import com.taskforge.audit.application.AuditService;
import com.taskforge.common.exception.ApiException;
import com.taskforge.department.domain.Department;
import com.taskforge.department.infrastructure.DepartmentRepository;
import com.taskforge.permission.domain.OrgPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final AuditService auditService;

    public DepartmentService(DepartmentRepository departmentRepository, AuditService auditService) {
        this.departmentRepository = departmentRepository;
        this.auditService = auditService;
    }

    @Transactional
    public Department create(OrgPrincipal actingAs, UUID organizationId, String name, UUID parentDepartmentId) {
        if (parentDepartmentId != null) {
            Department parent = departmentRepository.findById(parentDepartmentId)
                    .orElseThrow(() -> ApiException.notFound("Parent department not found"));
            if (!parent.getOrganizationId().equals(organizationId)) {
                throw ApiException.badRequest("Parent department belongs to a different organization");
            }
        }
        Department department = new Department(organizationId, name, parentDepartmentId);
        departmentRepository.save(department);
        auditService.record(organizationId, actingAs.organizationMemberId(), "DEPARTMENT_CREATED",
                "DEPARTMENT", department.getId(), "{\"name\":\"" + name.replace("\"", "\\\"") + "\"}");
        return department;
    }

    public List<Department> listForOrganization(UUID organizationId) {
        return departmentRepository.findByOrganizationId(organizationId);
    }

    @Transactional
    public Department update(UUID organizationId, UUID departmentId, String name, UUID leadOrganizationMemberId) {
        Department department = getById(organizationId, departmentId);
        if (name != null) department.setName(name);
        if (leadOrganizationMemberId != null) department.setLeadOrganizationMemberId(leadOrganizationMemberId);
        return departmentRepository.save(department);
    }

    @Transactional
    public void delete(OrgPrincipal actingAs, UUID organizationId, UUID departmentId) {
        Department department = getById(organizationId, departmentId);
        boolean hasChildren = !departmentRepository.findByOrganizationIdAndParentDepartmentId(organizationId, departmentId).isEmpty();
        if (hasChildren) {
            throw ApiException.badRequest("Cannot delete a department that has sub-departments — reassign or delete them first");
        }
        departmentRepository.delete(department);
        auditService.record(organizationId, actingAs.organizationMemberId(), "DEPARTMENT_DELETED",
                "DEPARTMENT", departmentId, "{}");
    }

    public Department getById(UUID organizationId, UUID departmentId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> ApiException.notFound("Department not found"));
        if (!department.getOrganizationId().equals(organizationId)) {
            throw ApiException.notFound("Department not found in this organization");
        }
        return department;
    }
}
