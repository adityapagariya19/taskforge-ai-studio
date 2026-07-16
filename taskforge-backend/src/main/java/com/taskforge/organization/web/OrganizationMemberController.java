package com.taskforge.organization.web;

import com.taskforge.organization.application.OrganizationMemberService;
import com.taskforge.organization.domain.OrganizationMember;
import com.taskforge.permission.domain.OrgContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/members")
public class OrganizationMemberController {

    private final OrganizationMemberService memberService;

    public OrganizationMemberController(OrganizationMemberService memberService) {
        this.memberService = memberService;
    }

    public record MemberResponse(String id, String userId, boolean isAi, String aiAgentType,
                                  String roleCode, String roleName, String departmentId, String jobTitle,
                                  String employmentStatus, String joinedAt) {}
    public record ChangeRoleRequest(String roleCode) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('member:view')")
    @GetMapping
    public List<MemberResponse> list(@PathVariable UUID organizationId) {
        return memberService.listMembers(organizationId).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('member:manage_role')")
    @PatchMapping("/{memberId}/role")
    public MemberResponse changeRole(@PathVariable UUID organizationId, @PathVariable UUID memberId,
                                      @RequestBody ChangeRoleRequest req) {
        OrganizationMember updated = memberService.changeRole(OrgContext.current(), organizationId, memberId, req.roleCode());
        return toResponse(updated);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('member:remove')")
    @DeleteMapping("/{memberId}")
    public void remove(@PathVariable UUID organizationId, @PathVariable UUID memberId) {
        memberService.removeMember(OrgContext.current(), organizationId, memberId);
    }

    private MemberResponse toResponse(OrganizationMember m) {
        return new MemberResponse(
                m.getId().toString(),
                m.getUserId() == null ? null : m.getUserId().toString(),
                m.isAi(),
                m.getAiAgentType() == null ? null : m.getAiAgentType().name(),
                m.getRole().getCode(),
                m.getRole().getName(),
                m.getDepartmentId() == null ? null : m.getDepartmentId().toString(),
                m.getJobTitle(),
                m.getEmploymentStatus().name(),
                m.getJoinedAt().toString());
    }
}
