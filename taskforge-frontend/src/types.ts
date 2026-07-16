export interface Workspace { id: string; name: string; slug: string }
export interface Project { id: string; key: string; name: string; description: string | null; type: string }
export interface WorkflowStatus { id: string; name: string; category: 'TODO' | 'IN_PROGRESS' | 'DONE'; position: number; color: string }
export interface ProjectMember { id: string; userId: string | null; isAi: boolean; aiAgentType: string | null; role: string }

export interface Sprint {
  id: string; projectId: string; name: string; goal: string | null;
  startDate: string; endDate: string; status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  createdAt: string; startedAt: string | null; completedAt: string | null;
}

export interface BurndownData {
  sprintId: string; sprintName: string; startDate: string; endDate: string; status: string;
  totalPoints: number; completedPoints: number; totalIssues: number; completedIssues: number;
}

export interface Issue {
  id: string; issueKey: string; type: 'EPIC' | 'STORY' | 'TASK' | 'SUBTASK' | 'BUG';
  statusId: string; sprintId: string | null; title: string; description: string | null; priority: string;
  storyPoints: number | null; assigneeId: string | null; assigneeIsAi: boolean; assigneeAiType: string | null;
  reporterId: string | null; reporterIsAi: boolean; reporterAiType: string | null;
  epicId: string | null; createdAt: string; updatedAt: string;
}

export interface CommentDto {
  id: string; authorId: string | null; authorIsAi: boolean; authorAiType: string | null;
  body: string; createdAt: string;
}

export interface ActivityEntry {
  id: string; actorId: string | null; actorIsAi: boolean; actorAiType: string | null;
  actionType: string; fieldName: string | null; oldValue: string | null; newValue: string | null; createdAt: string;
}

export interface GeneratedFile {
  id: string; filename: string; language: string | null; sizeBytes: number;
}

export interface AgentExecution {
  id: string; agentType: string; triggerEvent: string; status: string;
  instructions: string | null; outputSummary: string | null; modelUsed: string | null;
  approvalStatus: 'NOT_REQUIRED' | 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';
  approvedBy: string | null; approvedAt: string | null; reviewNote: string | null;
  files: GeneratedFile[]; createdAt: string;
}

export interface JoinRequest {
  id: string; organizationId: string; userId: string; requestedRoleCode: string;
  message: string | null; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  reviewNote: string | null; createdAt: string; reviewedAt: string | null;
}

export interface OrgSummary {
  id: string; name: string; slug: string; joinCode: string; planTier: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'; memberCount: number; aiAgentCount: number; createdAt: string;
}

export interface PlatformStats {
  totalOrganizations: number; activeOrganizations: number; suspendedOrganizations: number;
  totalHumanMembers: number; totalAiAgents: number;
}

export interface Department {
  id: string; name: string; parentDepartmentId: string | null;
  leadOrganizationMemberId: string | null; createdAt: string;
}

// ── Org chart / node graph ──
export interface GraphNode {
  id: string; type: 'organization' | 'department' | 'team' | 'member';
  label: string; subtitle?: string;
  isAi?: boolean; agentType?: string | null;
  status?: 'online' | 'idle' | 'offline';
  currentTask?: string | null;
  taskCount?: number;
  parentId: string | null;
}
export interface GraphData { nodes: GraphNode[] }

export const AGENT_TYPES = ['ARCHITECT_AI', 'CODE_AI', 'TESTER_AI', 'REVIEWER_AI', 'DOCUMENTATION_AI', 'PROJECT_MANAGER_AI'] as const;

export const AGENT_LABELS: Record<string, string> = {
  ARCHITECT_AI: 'ArchitectAI',
  CODE_AI: 'CodeAI',
  TESTER_AI: 'TesterAI',
  REVIEWER_AI: 'ReviewerAI',
  DOCUMENTATION_AI: 'DocumentationAI',
  PROJECT_MANAGER_AI: 'ProjectManagerAI'
};
