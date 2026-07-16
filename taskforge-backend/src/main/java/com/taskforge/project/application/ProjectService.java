package com.taskforge.project.application;

import com.taskforge.aiagent.domain.AgentType;
import com.taskforge.common.exception.ApiException;
import com.taskforge.project.domain.*;
import com.taskforge.project.infrastructure.ProjectMemberRepository;
import com.taskforge.project.infrastructure.ProjectRepository;
import com.taskforge.project.infrastructure.WorkflowStatusRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final WorkflowStatusRepository statusRepository;

    public ProjectService(ProjectRepository projectRepository, ProjectMemberRepository memberRepository,
                           WorkflowStatusRepository statusRepository) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.statusRepository = statusRepository;
    }

    @Transactional
    public Project createProject(UUID workspaceId, UUID creatorUserId, String key, String name,
                                  String description, ProjectType type) {
        String normalizedKey = key.toUpperCase();
        if (projectRepository.existsByWorkspaceIdAndKey(workspaceId, normalizedKey)) {
            throw ApiException.badRequest("Project key already used in this workspace: " + normalizedKey);
        }
        Project project = new Project(workspaceId, normalizedKey, name, description, type);
        projectRepository.save(project);

        // Default Kanban columns — every project gets these on creation (Architecture Spec §13)
        statusRepository.save(new WorkflowStatus(project.getId(), "Backlog", StatusCategory.TODO, 0, "#8A8F9C"));
        statusRepository.save(new WorkflowStatus(project.getId(), "To Do", StatusCategory.TODO, 1, "#5B6CFF"));
        statusRepository.save(new WorkflowStatus(project.getId(), "In Progress", StatusCategory.IN_PROGRESS, 2, "#F2A93B"));
        statusRepository.save(new WorkflowStatus(project.getId(), "In Review", StatusCategory.IN_PROGRESS, 3, "#27D9C8"));
        statusRepository.save(new WorkflowStatus(project.getId(), "Done", StatusCategory.DONE, 4, "#3DD68C"));

        memberRepository.save(ProjectMember.human(project.getId(), creatorUserId, ProjectRole.PROJECT_OWNER));

        // Add all 6 AI teammates to every new project by default — this is the product's whole thesis.
        for (AgentType agentType : AgentType.values()) {
            memberRepository.save(ProjectMember.ai(project.getId(), agentType));
        }

        return project;
    }

    public List<Project> findByWorkspace(UUID workspaceId) {
        return projectRepository.findByWorkspaceId(workspaceId);
    }

    public Project getById(UUID projectId) {
        return projectRepository.findById(projectId).orElseThrow(() -> ApiException.notFound("Project not found"));
    }

    public List<ProjectMember> listMembers(UUID projectId) {
        return memberRepository.findByProjectId(projectId);
    }

    public ProjectMember addHumanMember(UUID projectId, UUID userId, ProjectRole role) {
        if (memberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw ApiException.badRequest("User is already a member of this project");
        }
        return memberRepository.save(ProjectMember.human(projectId, userId, role));
    }

    public void requireMember(UUID projectId, UUID userId) {
        if (!memberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw ApiException.forbidden("Not a member of this project");
        }
    }

    public List<WorkflowStatus> getWorkflowStatuses(UUID projectId) {
        return statusRepository.findByProjectIdOrderByPosition(projectId);
    }
}
