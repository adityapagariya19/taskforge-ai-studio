package com.taskforge.department.web;

import com.taskforge.department.application.DepartmentService;
import com.taskforge.department.domain.Department;
import com.taskforge.permission.domain.OrgContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    public record CreateRequest(String name, String parentDepartmentId) {}
    public record UpdateRequest(String name, String leadOrganizationMemberId) {}
    public record DepartmentResponse(String id, String name, String parentDepartmentId,
                                      String leadOrganizationMemberId, String createdAt) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('department:view')")
    @GetMapping
    public List<DepartmentResponse> list(@PathVariable UUID organizationId) {
        return departmentService.listForOrganization(organizationId).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('department:manage')")
    @PostMapping
    public DepartmentResponse create(@PathVariable UUID organizationId, @RequestBody CreateRequest req) {
        Department d = departmentService.create(OrgContext.current(), organizationId, req.name(),
                req.parentDepartmentId() == null ? null : UUID.fromString(req.parentDepartmentId()));
        return toResponse(d);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('department:manage')")
    @PatchMapping("/{departmentId}")
    public DepartmentResponse update(@PathVariable UUID organizationId, @PathVariable UUID departmentId,
                                      @RequestBody UpdateRequest req) {
        Department d = departmentService.update(organizationId, departmentId, req.name(),
                req.leadOrganizationMemberId() == null ? null : UUID.fromString(req.leadOrganizationMemberId()));
        return toResponse(d);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('department:manage')")
    @DeleteMapping("/{departmentId}")
    public void delete(@PathVariable UUID organizationId, @PathVariable UUID departmentId) {
        departmentService.delete(OrgContext.current(), organizationId, departmentId);
    }

    private DepartmentResponse toResponse(Department d) {
        return new DepartmentResponse(d.getId().toString(), d.getName(),
                d.getParentDepartmentId() == null ? null : d.getParentDepartmentId().toString(),
                d.getLeadOrganizationMemberId() == null ? null : d.getLeadOrganizationMemberId().toString(),
                d.getCreatedAt().toString());
    }
}
