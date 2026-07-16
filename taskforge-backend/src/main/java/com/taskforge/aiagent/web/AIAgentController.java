package com.taskforge.aiagent.web;

import com.taskforge.aiagent.application.AIApprovalService;
import com.taskforge.aiagent.application.AIFileZipService;
import com.taskforge.aiagent.domain.AgentType;
import com.taskforge.aiagent.infrastructure.AIAgentExecutionEntity;
import com.taskforge.aiagent.infrastructure.AIAgentExecutionRepository;
import com.taskforge.aiagent.infrastructure.AIGeneratedFileRepository;
import com.taskforge.aiagent.infrastructure.AITaskQueueEntity;
import com.taskforge.aiagent.orchestration.AITaskQueueWorker;
import com.taskforge.common.exception.ApiException;
import com.taskforge.issue.application.IssueService;
import com.taskforge.permission.domain.OrgContext;
import com.taskforge.project.application.ProjectService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * The AI task interface: instruct an agent, get real structured output
 * (comments, sub-issues, and — for CodeAI — real files), review it, and
 * either approve (advances the pipeline to the next agent, see AIPipeline)
 * or request changes (re-queues the same agent with your note as new
 * instructions). This replaces "leave a comment and hope" with an explicit
 * state machine.
 */
@RestController
@RequestMapping("/api/v1/issues/{issueId}/ai")
public class AIAgentController {

    private final AITaskQueueWorker worker;
    private final IssueService issueService;
    private final ProjectService projectService;
    private final AIAgentExecutionRepository executionRepository;
    private final AIGeneratedFileRepository generatedFileRepository;
    private final AIApprovalService approvalService;
    private final AIFileZipService zipService;

    public AIAgentController(AITaskQueueWorker worker, IssueService issueService, ProjectService projectService,
                              AIAgentExecutionRepository executionRepository, AIGeneratedFileRepository generatedFileRepository,
                              AIApprovalService approvalService, AIFileZipService zipService) {
        this.worker = worker;
        this.issueService = issueService;
        this.projectService = projectService;
        this.executionRepository = executionRepository;
        this.generatedFileRepository = generatedFileRepository;
        this.approvalService = approvalService;
        this.zipService = zipService;
    }

    public record InvokeRequest(AgentType agentType, String instructions) {}
    public record ReviewRequest(String note) {}
    public record GeneratedFileResponse(String id, String filename, String language, int sizeBytes) {}
    public record ExecutionResponse(String id, String agentType, String triggerEvent, String status,
                                     String instructions, String outputSummary, String modelUsed,
                                     String approvalStatus, String approvedBy, String approvedAt, String reviewNote,
                                     List<GeneratedFileResponse> files, String createdAt) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('ai:invoke')")
    @PostMapping("/invoke")
    public ExecutionResponse invoke(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId,
                                     @RequestBody InvokeRequest req) {
        var issue = issueService.getById(issueId);
        projectService.requireMember(issue.getProjectId(), userId);

        AITaskQueueEntity task = AITaskQueueEntity.queued(issueId, req.agentType(), "MANUAL_INVOKE", req.instructions());
        worker.runOne(task); // synchronous: the person is waiting on this click

        AIAgentExecutionEntity latest = executionRepository.findByIssueIdOrderByCreatedAtDesc(issueId).stream()
                .filter(e -> e.getAgentType() == req.agentType())
                .findFirst()
                .orElseThrow();
        return toResponse(latest);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('ai:view_executions')")
    @GetMapping("/executions")
    public List<ExecutionResponse> executions(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId) {
        var issue = issueService.getById(issueId);
        projectService.requireMember(issue.getProjectId(), userId);
        return executionRepository.findByIssueIdOrderByCreatedAtDesc(issueId).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('ai:approve_plan')")
    @PostMapping("/executions/{executionId}/approve")
    public ExecutionResponse approve(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId,
                                      @PathVariable UUID executionId, @RequestBody(required = false) ReviewRequest req) {
        var issue = issueService.getById(issueId);
        projectService.requireMember(issue.getProjectId(), userId);
        AIAgentExecutionEntity execution = approvalService.approve(OrgContext.current(), executionId, req == null ? null : req.note());
        return toResponse(execution);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('ai:approve_plan')")
    @PostMapping("/executions/{executionId}/request-changes")
    public ExecutionResponse requestChanges(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId,
                                             @PathVariable UUID executionId, @RequestBody ReviewRequest req) {
        var issue = issueService.getById(issueId);
        projectService.requireMember(issue.getProjectId(), userId);
        AIAgentExecutionEntity execution = approvalService.requestChanges(OrgContext.current(), executionId, req.note());
        return toResponse(execution);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('ai:view_executions')")
    @GetMapping("/executions/{executionId}/download")
    public ResponseEntity<byte[]> download(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId,
                                            @PathVariable UUID executionId) {
        var issue = issueService.getById(issueId);
        projectService.requireMember(issue.getProjectId(), userId);
        var execution = executionRepository.findById(executionId)
                .orElseThrow(() -> ApiException.notFound("Execution not found"));
        if (!execution.getIssueId().equals(issueId)) throw ApiException.notFound("Execution not found on this issue");

        var zip = zipService.buildZip(executionId, issue.getIssueKey());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + zip.suggestedFilename() + "\"")
                .body(zip.bytes());
    }

    private ExecutionResponse toResponse(AIAgentExecutionEntity e) {
        var files = generatedFileRepository.findByExecutionId(e.getId()).stream()
                .map(f -> new GeneratedFileResponse(f.getId().toString(), f.getFilename(), f.getLanguage(),
                        f.getContent() == null ? 0 : f.getContent().getBytes(java.nio.charset.StandardCharsets.UTF_8).length))
                .toList();
        return new ExecutionResponse(e.getId().toString(), e.getAgentType().name(), e.getTriggerEvent(), e.getStatus(),
                e.getInstructions(), e.getOutputSummary(), e.getModelUsed(),
                e.getApprovalStatus(), e.getApprovedBy() == null ? null : e.getApprovedBy().toString(),
                e.getApprovedAt() == null ? null : e.getApprovedAt().toString(), e.getReviewNote(),
                files, e.getCreatedAt().toString());
    }
}
