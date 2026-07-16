package com.taskforge.department.application;

import com.taskforge.audit.application.AuditService;
import com.taskforge.common.exception.ApiException;
import com.taskforge.department.domain.Team;
import com.taskforge.department.domain.TeamMember;
import com.taskforge.department.infrastructure.TeamMemberRepository;
import com.taskforge.department.infrastructure.TeamRepository;
import com.taskforge.permission.domain.OrgPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final AuditService auditService;

    public TeamService(TeamRepository teamRepository, TeamMemberRepository teamMemberRepository, AuditService auditService) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.auditService = auditService;
    }

    @Transactional
    public Team create(OrgPrincipal actingAs, UUID organizationId, String name, UUID departmentId) {
        Team team = new Team(organizationId, departmentId, name);
        teamRepository.save(team);
        auditService.record(organizationId, actingAs.organizationMemberId(), "TEAM_CREATED",
                "TEAM", team.getId(), "{\"name\":\"" + name.replace("\"", "\\\"") + "\"}");
        return team;
    }

    public List<Team> listForOrganization(UUID organizationId) {
        return teamRepository.findByOrganizationId(organizationId);
    }

    public Team getById(UUID organizationId, UUID teamId) {
        Team team = teamRepository.findById(teamId).orElseThrow(() -> ApiException.notFound("Team not found"));
        if (!team.getOrganizationId().equals(organizationId)) throw ApiException.notFound("Team not found in this organization");
        return team;
    }

    @Transactional
    public void addMember(UUID organizationId, UUID teamId, UUID organizationMemberId) {
        getById(organizationId, teamId); // validates tenant ownership
        teamMemberRepository.save(new TeamMember(teamId, organizationMemberId));
    }

    @Transactional
    public void removeMember(UUID organizationId, UUID teamId, UUID organizationMemberId) {
        getById(organizationId, teamId);
        teamMemberRepository.deleteById(new TeamMember.TeamMemberId(teamId, organizationMemberId));
    }

    public List<TeamMember> listMembers(UUID teamId) {
        return teamMemberRepository.findByTeamId(teamId);
    }

    @Transactional
    public void delete(OrgPrincipal actingAs, UUID organizationId, UUID teamId) {
        Team team = getById(organizationId, teamId);
        teamRepository.delete(team);
        auditService.record(organizationId, actingAs.organizationMemberId(), "TEAM_DELETED", "TEAM", teamId, "{}");
    }
}
