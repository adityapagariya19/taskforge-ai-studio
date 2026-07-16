package com.taskforge.orggraph.web;

import com.taskforge.orggraph.application.GraphService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/graph")
public class GraphController {

    private final GraphService graphService;

    public GraphController(GraphService graphService) {
        this.graphService = graphService;
    }

    public record NodeResponse(String id, String type, String label, String subtitle,
                                boolean isAi, String agentType, String currentTask, Integer taskCount, String parentId) {}
    public record GraphResponse(List<NodeResponse> nodes) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('member:view')")
    @GetMapping
    public GraphResponse get(@PathVariable UUID organizationId) {
        List<NodeResponse> nodes = graphService.buildGraph(organizationId).stream()
                .map(n -> new NodeResponse(n.id(), n.type(), n.label(), n.subtitle(), n.isAi(), n.agentType(),
                        n.currentTask(), n.taskCount(), n.parentId()))
                .toList();
        return new GraphResponse(nodes);
    }
}
