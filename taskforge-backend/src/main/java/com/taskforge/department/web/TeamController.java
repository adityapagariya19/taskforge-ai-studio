package com.taskforge.department.web;

import com.taskforge.department.application.TeamService;
import com.taskforge.department.domain.Team;
import com.taskforge.department.domain.TeamMember;
import com.taskforge.permission.domain.OrgContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    public record CreateRequest(String name, String departmentId) {}
    public record TeamResponse(String id, String name, String departmentId, String leadOrganizationMemberId, String createdAt) {}
    public record AddMemberRequest(String organizationMemberId) {}
    public record TeamMemberResponse(String teamId, String organizationMemberId, String addedAt) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('team:view')")
    @GetMapping
    public List<TeamResponse> list(@PathVariable UUID organizationId) {
        return teamService.listForOrganization(organizationId).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('team:manage')")
    @PostMapping
    public TeamResponse create(@PathVariable UUID organizationId, @RequestBody CreateRequest req) {
        Team t = teamService.create(OrgContext.current(), organizationId, req.name(),
                req.departmentId() == null ? null : UUID.fromString(req.departmentId()));
        return toResponse(t);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('team:view')")
    @GetMapping("/{teamId}/members")
    public List<TeamMemberResponse> members(@PathVariable UUID organizationId, @PathVariable UUID teamId) {
        teamService.getById(organizationId, teamId);
        return teamService.listMembers(teamId).stream()
                .map(m -> new TeamMemberResponse(m.getTeamId().toString(), m.getOrganizationMemberId().toString(), m.getAddedAt().toString()))
                .toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('team:manage')")
    @PostMapping("/{teamId}/members")
    public void addMember(@PathVariable UUID organizationId, @PathVariable UUID teamId, @RequestBody AddMemberRequest req) {
        teamService.addMember(organizationId, teamId, UUID.fromString(req.organizationMemberId()));
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('team:manage')")
    @DeleteMapping("/{teamId}/members/{organizationMemberId}")
    public void removeMember(@PathVariable UUID organizationId, @PathVariable UUID teamId, @PathVariable UUID organizationMemberId) {
        teamService.removeMember(organizationId, teamId, organizationMemberId);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('team:manage')")
    @DeleteMapping("/{teamId}")
    public void delete(@PathVariable UUID organizationId, @PathVariable UUID teamId) {
        teamService.delete(OrgContext.current(), organizationId, teamId);
    }

    private TeamResponse toResponse(Team t) {
        return new TeamResponse(t.getId().toString(), t.getName(),
                t.getDepartmentId() == null ? null : t.getDepartmentId().toString(),
                t.getLeadOrganizationMemberId() == null ? null : t.getLeadOrganizationMemberId().toString(),
                t.getCreatedAt().toString());
    }
}
