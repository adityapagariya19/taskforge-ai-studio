package com.taskforge.orggraph.application;

import com.taskforge.department.domain.Department;
import com.taskforge.department.domain.Team;
import com.taskforge.department.infrastructure.DepartmentRepository;
import com.taskforge.department.infrastructure.TeamRepository;
import com.taskforge.issue.domain.Issue;
import com.taskforge.issue.infrastructure.IssueRepository;
import com.taskforge.organization.application.OrganizationService;
import com.taskforge.organization.domain.Organization;
import com.taskforge.organization.domain.OrganizationMember;
import com.taskforge.organization.infrastructure.OrganizationMemberRepository;
import com.taskforge.project.domain.Project;
import com.taskforge.project.domain.StatusCategory;
import com.taskforge.project.domain.WorkflowStatus;
import com.taskforge.project.infrastructure.ProjectRepository;
import com.taskforge.project.infrastructure.WorkflowStatusRepository;
import com.taskforge.workspace.domain.Workspace;
import com.taskforge.workspace.infrastructure.WorkspaceRepository;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Computes the real organization chart: Organization -> Departments -> Teams
 * -> Members, with each member's actual current task and task count derived
 * from real issue assignments across every project in the organization.
 *
 * "Online/idle/offline" status is deliberately NOT included here — this
 * platform has no real presence/heartbeat tracking yet (that's the Realtime
 * module, not built), and reporting a status without a genuine signal behind
 * it would be exactly the kind of fake data this product explicitly avoids.
 * The frontend's GraphNode.status field is optional for this reason; only
 * the demo dataset populates it, clearly behind the demo-mode banner.
 */
@Service
public class GraphService {

    private final OrganizationService organizationService;
    private final DepartmentRepository departmentRepository;
    private final TeamRepository teamRepository;
    private final OrganizationMemberRepository memberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;
    private final WorkflowStatusRepository statusRepository;

    public GraphService(OrganizationService organizationService, DepartmentRepository departmentRepository,
                         TeamRepository teamRepository, OrganizationMemberRepository memberRepository,
                         WorkspaceRepository workspaceRepository, ProjectRepository projectRepository,
                         IssueRepository issueRepository, WorkflowStatusRepository statusRepository) {
        this.organizationService = organizationService;
        this.departmentRepository = departmentRepository;
        this.teamRepository = teamRepository;
        this.memberRepository = memberRepository;
        this.workspaceRepository = workspaceRepository;
        this.projectRepository = projectRepository;
        this.issueRepository = issueRepository;
        this.statusRepository = statusRepository;
    }

    public record Node(String id, String type, String label, String subtitle,
                        boolean isAi, String agentType, String currentTask, Integer taskCount, String parentId) {}

    public List<Node> buildGraph(UUID organizationId) {
        Organization org = organizationService.getById(organizationId);
        List<Department> departments = departmentRepository.findByOrganizationId(organizationId);
        List<Team> teams = teamRepository.findByOrganizationId(organizationId);
        List<OrganizationMember> members = memberRepository.findByOrganizationId(organizationId).stream()
                .filter(OrganizationMember::isActive).toList();

        List<Issue> allActiveIssues = new ArrayList<>();
        Map<UUID, StatusCategory> statusCategoryById = new HashMap<>();
        for (Workspace ws : workspaceRepository.findByOrganizationId(organizationId)) {
            for (Project project : projectRepository.findByWorkspaceId(ws.getId())) {
                for (WorkflowStatus s : statusRepository.findByProjectIdOrderByPosition(project.getId())) {
                    statusCategoryById.put(s.getId(), s.getCategory());
                }
                allActiveIssues.addAll(issueRepository.findActiveByProject(project.getId()));
            }
        }

        List<Node> nodes = new ArrayList<>();
        nodes.add(new Node(org.getId().toString(), "organization", org.getName(),
                members.size() + " members · " + teams.size() + " teams", false, null, null, null, null));

        for (Department d : departments) {
            String parentId = d.getParentDepartmentId() != null ? d.getParentDepartmentId().toString() : org.getId().toString();
            long deptMemberCount = members.stream().filter(m -> d.getId().equals(m.getDepartmentId())).count();
            nodes.add(new Node(d.getId().toString(), "department", d.getName(),
                    deptMemberCount + " members", false, null, null, null, parentId));
        }

        for (Team t : teams) {
            String parentId = t.getDepartmentId() != null ? t.getDepartmentId().toString() : org.getId().toString();
            nodes.add(new Node(t.getId().toString(), "team", t.getName(), null, false, null, null, null, parentId));
        }

        for (OrganizationMember m : members) {
            String parentId = m.getDepartmentId() != null ? m.getDepartmentId().toString() : org.getId().toString();

            List<Issue> assigned = allActiveIssues.stream()
                    .filter(i -> m.isAi()
                            ? (i.isAssigneeIsAi() && i.getAssigneeAiType() == m.getAiAgentType())
                            : (!i.isAssigneeIsAi() && m.getUserId().equals(i.getAssigneeId())))
                    .toList();
            Optional<Issue> current = assigned.stream()
                    .filter(i -> statusCategoryById.get(i.getStatusId()) == StatusCategory.IN_PROGRESS)
                    .findFirst();

            String label = m.isAi() ? formatAgentLabel(m.getAiAgentType() == null ? "AI" : m.getAiAgentType().name()) : "Member";
            String subtitle = m.isAi() ? "AI " + m.getRole().getName() : (m.getJobTitle() != null ? m.getJobTitle() : m.getRole().getName());

            nodes.add(new Node(
                    m.getId().toString(), "member", label, subtitle,
                    m.isAi(), m.isAi() && m.getAiAgentType() != null ? m.getAiAgentType().name() : null,
                    current.map(i -> i.getIssueKey() + " " + i.getTitle()).orElse(null),
                    assigned.size(), parentId));
        }

        return nodes;
    }

    private String formatAgentLabel(String agentTypeName) {
        String[] parts = agentTypeName.split("_");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (p.equalsIgnoreCase("AI")) continue;
            sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1).toLowerCase());
        }
        return sb.append("AI").toString();
    }
}
