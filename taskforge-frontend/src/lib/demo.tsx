import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  DEMO_USER, DEMO_ORG, DEMO_WORKSPACE, DEMO_PROJECT,
  DEMO_STATUSES, DEMO_MEMBERS, DEMO_ISSUES, DEMO_SPRINTS,
  DEMO_BURNDOWN, DEMO_COMMENTS, DEMO_ACTIVITY, DEMO_NOTIFICATIONS,
  DEMO_AI_EXECUTIONS, DEMO_ORG_MEMBERS, DEMO_GRAPH_NODES,
  DEMO_JOIN_REQUESTS, DEMO_PLATFORM_ORGS, DEMO_PLATFORM_STATS, DEMO_DEPARTMENTS,
} from './demo-data';

// ─── Demo state ──────────────────────────────────────────────────────────────

interface DemoContextValue {
  isDemo: boolean;
  enter: () => void;
  exit: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem('tf_demo') === '1');

  const enter = useCallback(() => {
    localStorage.setItem('tf_demo', '1');
    localStorage.setItem('tf_token', 'demo-identity-token');
    localStorage.setItem('tf_org_token', 'demo-org-token');
    localStorage.setItem('tf_active_org_id', DEMO_ORG.id);
    localStorage.setItem('tf_active_role', 'ORG_OWNER');
    localStorage.setItem('tf_user_id', DEMO_USER.id);
    localStorage.setItem('tf_user_email', DEMO_USER.email);
    localStorage.setItem('tf_user_name', DEMO_USER.fullName);
    localStorage.setItem('tf_active_project_id', DEMO_PROJECT.id);
    setIsDemo(true);
  }, []);

  const exit = useCallback(() => {
    localStorage.removeItem('tf_demo');
    localStorage.removeItem('tf_demo_admin');
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_org_token');
    localStorage.removeItem('tf_admin_token');
    localStorage.removeItem('tf_active_org_id');
    localStorage.removeItem('tf_active_role');
    localStorage.removeItem('tf_user_id');
    localStorage.removeItem('tf_user_email');
    localStorage.removeItem('tf_user_name');
    localStorage.removeItem('tf_active_project_id');
    setIsDemo(false);
  }, []);

  return (
    <DemoContext.Provider value={{ isDemo, enter, exit }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be within DemoProvider');
  return ctx;
}

export function isDemoMode() {
  return localStorage.getItem('tf_demo') === '1';
}

/** Separate from org-level demo mode: entering the admin demo issues a fake
 * platform-admin token so the Admin Panel is explorable standalone, exactly
 * like the org-level demo — same principle, separate identity tier, since
 * that separation is the actual point of Platform Admin in the real backend. */
export function enterAdminDemo() {
  localStorage.setItem('tf_demo', '1');
  localStorage.setItem('tf_demo_admin', '1');
  localStorage.setItem('tf_admin_token', 'demo-admin-token');
}

export function isAdminDemoMode() {
  return localStorage.getItem('tf_demo_admin') === '1';
}

// ─── Mock issue store (so mutations persist within a demo session) ────────────

let _demoIssues = [...DEMO_ISSUES];
let _demoNotifications = [...DEMO_NOTIFICATIONS];
let _demoComments: Record<string, typeof DEMO_COMMENTS> = {};
let _demoExecutions: Record<string, DemoExecution[]> = {};
let _demoJoinRequests = [...DEMO_JOIN_REQUESTS];
let _demoPlatformOrgs = DEMO_PLATFORM_ORGS.map(o => ({ ...o }));

interface DemoExecutionFile { id: string; filename: string; language: string; sizeBytes: number; content: string }
interface DemoExecution {
  id: string; agentType: string; triggerEvent: string; status: string;
  instructions: string | null; outputSummary: string | null; modelUsed: string;
  approvalStatus: 'NOT_REQUIRED' | 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';
  approvedBy: string | null; approvedAt: string | null; reviewNote: string | null;
  files: DemoExecutionFile[]; createdAt: string;
}

const PIPELINE_NEXT: Record<string, string> = {
  CODE_AI: 'REVIEWER_AI',
  REVIEWER_AI: 'TESTER_AI',
  TESTER_AI: 'DOCUMENTATION_AI',
};

function getExecutionsForIssue(issueId: string): DemoExecution[] {
  if (!_demoExecutions[issueId]) {
    // Seed iss-1 (the multiplayer epic) with its existing realistic history on first read.
    _demoExecutions[issueId] = issueId === 'iss-1' ? DEMO_AI_EXECUTIONS.map(e => ({
      ...e, instructions: null, approvalStatus: 'NOT_REQUIRED' as const,
      approvedBy: null, approvedAt: null, reviewNote: null, files: [],
    })) : [];
  }
  return _demoExecutions[issueId];
}

/** Generates real, structured, agent-specific output — the same shape the actual backend agents produce. */
function generateAgentOutput(agentType: string, issueId: string, instructions: string | null): {
  outputSummary: string; commentBody: string; files: DemoExecutionFile[];
} {
  const issue = _demoIssues.find(i => i.id === issueId);
  const title = issue?.title || 'this task';
  const focus = instructions ? ` Focusing specifically on: "${instructions}"` : '';

  switch (agentType) {
    case 'ARCHITECT_AI':
      return {
        outputSummary: 'subIssuesCreated=3; commentPosted=true',
        commentBody: `**ArchitectAI**\n\nProposed a server-authoritative architecture for "${title}".${focus}\n\n\`\`\`mermaid\ngraph LR\n  Client[Client] -->|inputs| Server[Game Server]\n  Server -->|state delta| Client\n\`\`\`\n\nCreated 3 subtasks covering protocol design, library evaluation, and lag compensation.`,
        files: [],
      };
    case 'CODE_AI': {
      const files: DemoExecutionFile[] = [
        {
          id: `f-${Date.now()}-1`, filename: 'LagCompensator.java', language: 'java',
          content: `package com.taskforge.game;\n\n/**\n * Rewinds world state to a client's reported timestamp, applies their\n * input, then re-simulates forward to the present tick. Clamps max\n * rewind to 500ms to prevent exploit abuse.\n */\npublic class LagCompensator {\n\n    private static final long MAX_REWIND_MS = 500;\n\n    public WorldState compensate(WorldState current, long clientTimestampMs, PlayerInput input) {\n        long rewindMs = Math.min(System.currentTimeMillis() - clientTimestampMs, MAX_REWIND_MS);\n        WorldState rewound = current.rewindTo(rewindMs);\n        WorldState applied = rewound.applyInput(input);\n        return applied.resimulateToPresent(rewindMs);\n    }\n}\n`,
          sizeBytes: 0,
        },
        {
          id: `f-${Date.now()}-2`, filename: 'InputRingBuffer.java', language: 'java',
          content: `package com.taskforge.game;\n\nimport java.util.ArrayDeque;\nimport java.util.Deque;\n\n/** Fixed-size ring buffer of timestamped player inputs — last 1s @ 20Hz = 20 entries. */\npublic class InputRingBuffer {\n\n    private static final int CAPACITY = 20;\n    private final Deque<TimestampedInput> buffer = new ArrayDeque<>(CAPACITY);\n\n    public void record(PlayerInput input, long timestampMs) {\n        if (buffer.size() >= CAPACITY) buffer.removeFirst();\n        buffer.addLast(new TimestampedInput(input, timestampMs));\n    }\n\n    public TimestampedInput closestTo(long timestampMs) {\n        return buffer.stream()\n            .min((a, b) -> Long.compare(Math.abs(a.timestampMs() - timestampMs), Math.abs(b.timestampMs() - timestampMs)))\n            .orElseThrow();\n    }\n\n    record TimestampedInput(PlayerInput input, long timestampMs) {}\n}\n`,
          sizeBytes: 0,
        },
      ];
      files.forEach(f => { f.sizeBytes = new TextEncoder().encode(f.content).length; });
      return {
        outputSummary: `subIssuesCreated=0; commentPosted=true; filesGenerated=${files.length}`,
        commentBody: `**CodeAI**\n\nImplemented lag compensation for "${title}".${focus}\n\nApproach: record a 1-second ring buffer of timestamped inputs per player. On each server tick, rewind to the client's reported timestamp, apply their input, then re-simulate forward — clamped to 500ms max rewind to prevent exploits.\n\n${files.length} file(s) generated — download as a zip from the button above.`,
        files,
      };
    }
    case 'REVIEWER_AI':
      return {
        outputSummary: 'subIssuesCreated=0; commentPosted=true',
        commentBody: `**ReviewerAI**\n\nReviewed the implementation for "${title}".${focus}\n\n**Risks:**\n- Clock drift between clients could cause the 500ms rewind clamp to trigger prematurely on high-latency connections\n- No test coverage yet for the ring buffer's boundary condition (exactly 20 entries)\n\n**Suggestions:**\n- Use server-authoritative timestamps for the drift calculation, not client-reported ones\n- Add an explicit unit test for buffer overflow behavior`,
        files: [],
      };
    case 'TESTER_AI':
      return {
        outputSummary: 'subIssuesCreated=0; commentPosted=true',
        commentBody: `**TesterAI**\n\nTest scenarios for "${title}":${focus}\n\n- **[happy-path]** Two clients sync within 100ms under 0% packet loss\n- **[edge-case]** Ring buffer at exactly 20 entries evicts oldest correctly\n- **[edge-case]** Rewind clamps to 500ms under >600ms simulated latency\n- **[error-case]** Malformed input packet is rejected without crashing the compensator`,
        files: [],
      };
    case 'DOCUMENTATION_AI':
      return {
        outputSummary: 'subIssuesCreated=0; commentPosted=true',
        commentBody: `**DocumentationAI**\n\n## Lag Compensation — Technical Overview\n\n"${title}" uses a server-authoritative model with client-side input replay. Each player's last 20 inputs (1s @ 20Hz) are buffered. On tick, the server rewinds to the client's reported timestamp (max 500ms), applies their input, and re-simulates to present.${focus}\n\nSee \`LagCompensator.java\` and \`InputRingBuffer.java\` for the reference implementation.`,
        files: [],
      };
    case 'PROJECT_MANAGER_AI':
      return {
        outputSummary: 'subIssuesCreated=0; commentPosted=true',
        commentBody: `**ProjectManagerAI**\n\nPriority assessment for "${title}".${focus}\n\nRecommended priority: **HIGH**. This blocks the multiplayer epic's core sync guarantee — recommend keeping it on the critical path for Sprint 3.`,
        files: [],
      };
    default:
      return { outputSummary: 'commentPosted=true', commentBody: `**${agentType}**\n\nCompleted work on "${title}".${focus}`, files: [] };
  }
}

function runDemoAgent(issueId: string, agentType: string, instructions: string | null, triggerEvent: string): DemoExecution {
  const { outputSummary, commentBody, files } = generateAgentOutput(agentType, issueId, instructions);
  const needsApproval = agentType in PIPELINE_NEXT;

  const execution: DemoExecution = {
    id: `ex-demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    agentType, triggerEvent, status: 'COMPLETED',
    instructions, outputSummary, modelUsed: 'demo-mode',
    approvalStatus: needsApproval ? 'PENDING_REVIEW' : 'NOT_REQUIRED',
    approvedBy: null, approvedAt: null, reviewNote: null,
    files, createdAt: new Date().toISOString(),
  };

  const list = getExecutionsForIssue(issueId);
  list.unshift(execution);

  const commentList = _demoComments[issueId] || (_demoComments[issueId] = []);
  commentList.push({
    id: `c-demo-${Date.now()}`, authorId: null, authorIsAi: true, authorAiType: agentType,
    body: commentBody, createdAt: new Date().toISOString(),
  });

  return execution;
}

function findExecution(issueId: string, executionId: string): DemoExecution {
  const found = getExecutionsForIssue(issueId).find(e => e.id === executionId);
  if (!found) throw new Error('Execution not found');
  return found;
}

function approveDemoExecution(issueId: string, executionId: string): DemoExecution {
  const execution = findExecution(issueId, executionId);
  execution.approvalStatus = 'APPROVED';
  execution.approvedBy = DEMO_USER.id;
  execution.approvedAt = new Date().toISOString();

  const nextAgent = PIPELINE_NEXT[execution.agentType];
  if (nextAgent) {
    // Simulates the real backend's queue worker picking up the next pipeline
    // stage immediately after approval — same instructions carried forward.
    runDemoAgent(issueId, nextAgent, execution.instructions, 'PIPELINE_ADVANCE');
  }
  return execution;
}

function requestChangesDemoExecution(issueId: string, executionId: string, note: string): DemoExecution {
  const execution = findExecution(issueId, executionId);
  execution.approvalStatus = 'CHANGES_REQUESTED';
  execution.approvedBy = DEMO_USER.id;
  execution.approvedAt = new Date().toISOString();
  execution.reviewNote = note;

  const revisedInstructions = (execution.instructions ? execution.instructions + '\n\n' : '')
      + `Reviewer feedback on your previous attempt: ${note}`;
  runDemoAgent(issueId, execution.agentType, revisedInstructions, 'REVISION_REQUESTED');
  return execution;
}

// ─── URL pattern interceptor ─────────────────────────────────────────────────

type MockHandler = (
  match: RegExpMatchArray,
  body?: unknown,
  method?: string
) => unknown;

interface MockRoute {
  pattern: RegExp;
  methods: string[];
  handler: MockHandler;
}

const routes: MockRoute[] = [
  // Auth — never intercepted; in demo mode we already have fake tokens set
  // Users
  {
    pattern: /^\/users\/me$/,
    methods: ['GET'],
    handler: () => ({
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      fullName: DEMO_USER.fullName,
      avatarUrl: null,
    }),
  },
  // Organizations
  {
    pattern: /^\/organizations$/,
    methods: ['GET'],
    handler: () => [DEMO_ORG],
  },
  {
    pattern: /^\/organizations$/,
    methods: ['POST'],
    handler: () => DEMO_ORG,
  },
  {
    pattern: /^\/organizations\/[^/]+\/activate$/,
    methods: ['POST'],
    handler: () => ({
      accessToken: 'demo-org-token',
      organizationId: DEMO_ORG.id,
      roleCode: 'ORG_OWNER',
    }),
  },
  {
    pattern: /^\/organizations\/[^/]+\/members$/,
    methods: ['GET'],
    handler: () => DEMO_ORG_MEMBERS,
  },
  // Workspaces
  {
    pattern: /^\/organizations\/[^/]+\/workspaces$/,
    methods: ['GET'],
    handler: () => [DEMO_WORKSPACE],
  },
  {
    pattern: /^\/organizations\/[^/]+\/workspaces$/,
    methods: ['POST'],
    handler: () => DEMO_WORKSPACE,
  },
  // Projects
  {
    pattern: /^\/workspaces\/[^/]+\/projects$/,
    methods: ['GET'],
    handler: () => [DEMO_PROJECT],
  },
  {
    pattern: /^\/workspaces\/[^/]+\/projects$/,
    methods: ['POST'],
    handler: () => DEMO_PROJECT,
  },
  {
    pattern: /^\/projects\/[^/]+$/,
    methods: ['GET'],
    handler: () => DEMO_PROJECT,
  },
  {
    pattern: /^\/projects\/[^/]+\/statuses$/,
    methods: ['GET'],
    handler: () => DEMO_STATUSES,
  },
  {
    pattern: /^\/projects\/[^/]+\/members$/,
    methods: ['GET'],
    handler: () => DEMO_MEMBERS,
  },
  // Issues
  {
    pattern: /^\/projects\/[^/]+\/issues$/,
    methods: ['GET'],
    handler: () => [..._demoIssues],
  },
  {
    pattern: /^\/projects\/[^/]+\/issues$/,
    methods: ['POST'],
    handler: (_m, body) => {
      const b = body as Record<string, unknown>;
      const newIssue = {
        id: `iss-new-${Date.now()}`,
        issueKey: `ACE-${112 + _demoIssues.length}`,
        type: (b.type as string) || 'TASK',
        statusId: DEMO_STATUSES[0].id,
        sprintId: null,
        title: (b.title as string) || 'New issue',
        description: (b.description as string) || null,
        priority: (b.priority as string) || 'MEDIUM',
        storyPoints: null,
        assigneeId: null, assigneeIsAi: false, assigneeAiType: null,
        reporterId: DEMO_USER.id, reporterIsAi: false, reporterAiType: null,
        epicId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      _demoIssues = [..._demoIssues, newIssue];
      return newIssue;
    },
  },
  {
    pattern: /^\/issues\/([^/]+)$/,
    methods: ['GET'],
    handler: (m) => _demoIssues.find(i => i.id === m[1]) ?? _demoIssues[0],
  },
  {
    pattern: /^\/issues\/([^/]+)$/,
    methods: ['PATCH'],
    handler: (m, body) => {
      const b = body as Record<string, unknown>;
      _demoIssues = _demoIssues.map(i =>
        i.id === m[1] ? {
          ...i,
          ...(b.title ? { title: b.title as string } : {}),
          ...(b.description !== undefined ? { description: b.description as string | null } : {}),
          ...(b.priority ? { priority: b.priority as string } : {}),
          ...(b.storyPoints !== undefined ? { storyPoints: b.storyPoints as number | null } : {}),
          ...(b.assigneeAiType ? { assigneeIsAi: true, assigneeAiType: b.assigneeAiType, assigneeId: null } : {}),
          ...(b.assigneeUserId ? { assigneeIsAi: false, assigneeAiType: null, assigneeId: b.assigneeUserId } : {}),
          updatedAt: new Date().toISOString(),
        } : i
      );
      return _demoIssues.find(i => i.id === m[1])!;
    },
  },
  {
    pattern: /^\/issues\/([^/]+)\/transition$/,
    methods: ['POST'],
    handler: (m, body) => {
      const b = body as Record<string, unknown>;
      _demoIssues = _demoIssues.map(i =>
        i.id === m[1] ? { ...i, statusId: b.statusId as string, updatedAt: new Date().toISOString() } : i
      );
      return _demoIssues.find(i => i.id === m[1])!;
    },
  },
  // Comments
  {
    pattern: /^\/issues\/([^/]+)\/comments$/,
    methods: ['GET'],
    handler: (m) => {
      if (!_demoComments[m[1]]) _demoComments[m[1]] = m[1] === 'iss-1' ? [...DEMO_COMMENTS] : [];
      return _demoComments[m[1]];
    },
  },
  {
    pattern: /^\/issues\/([^/]+)\/comments$/,
    methods: ['POST'],
    handler: (m, body) => {
      const b = body as Record<string, unknown>;
      const comment = {
        id: `c-new-${Date.now()}`,
        authorId: DEMO_USER.id,
        authorIsAi: false,
        authorAiType: null,
        body: b.body as string,
        createdAt: new Date().toISOString(),
      };
      if (!_demoComments[m[1]]) _demoComments[m[1]] = [];
      _demoComments[m[1]] = [..._demoComments[m[1]], comment];
      return comment;
    },
  },
  // Activity
  {
    pattern: /^\/issues\/([^/]+)\/activity$/,
    methods: ['GET'],
    handler: () => DEMO_ACTIVITY,
  },
  // AI executions — full instruction -> output -> approval -> next-agent pipeline, entirely client-side.
  {
    pattern: /^\/issues\/([^/]+)\/ai\/executions$/,
    methods: ['GET'],
    handler: (m) => getExecutionsForIssue(m[1]),
  },
  {
    pattern: /^\/issues\/([^/]+)\/ai\/invoke$/,
    methods: ['POST'],
    handler: (m, body) => {
      const b = body as Record<string, unknown>;
      return runDemoAgent(m[1], b.agentType as string, (b.instructions as string) || null, 'MANUAL_INVOKE');
    },
  },
  {
    pattern: /^\/issues\/([^/]+)\/ai\/executions\/([^/]+)\/approve$/,
    methods: ['POST'],
    handler: (m) => approveDemoExecution(m[1], m[2]),
  },
  {
    pattern: /^\/issues\/([^/]+)\/ai\/executions\/([^/]+)\/request-changes$/,
    methods: ['POST'],
    handler: (m, body) => {
      const b = body as Record<string, unknown>;
      return requestChangesDemoExecution(m[1], m[2], (b.note as string) || '');
    },
  },
  // Notifications
  {
    pattern: /^\/notifications$/,
    methods: ['GET'],
    handler: () => [..._demoNotifications],
  },
  {
    pattern: /^\/notifications\/([^/]+)\/read$/,
    methods: ['PATCH'],
    handler: (m) => {
      _demoNotifications = _demoNotifications.map(n =>
        n.id === m[1] ? { ...n, isRead: true } : n
      );
      return null;
    },
  },
  // Sprints
  {
    pattern: /^\/projects\/[^/]+\/sprints$/,
    methods: ['GET'],
    handler: () => DEMO_SPRINTS,
  },
  {
    pattern: /^\/projects\/[^/]+\/sprints$/,
    methods: ['POST'],
    handler: (_m, body) => {
      const b = body as Record<string, unknown>;
      return {
        id: `sp-new-${Date.now()}`,
        projectId: DEMO_PROJECT.id,
        name: b.name,
        goal: b.goal ?? null,
        startDate: b.startDate,
        endDate: b.endDate,
        status: 'PLANNED',
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
      };
    },
  },
  {
    pattern: /^\/projects\/[^/]+\/sprints\/active$/,
    methods: ['GET'],
    handler: () => DEMO_SPRINTS.find(s => s.status === 'ACTIVE'),
  },
  {
    pattern: /^\/projects\/[^/]+\/sprints\/([^/]+)\/burndown$/,
    methods: ['GET'],
    handler: () => DEMO_BURNDOWN,
  },
  {
    pattern: /^\/projects\/[^/]+\/sprints\/([^/]+)\/start$/,
    methods: ['POST'],
    handler: () => ({ ...DEMO_SPRINTS[0], status: 'ACTIVE', startedAt: new Date().toISOString() }),
  },
  {
    pattern: /^\/projects\/[^/]+\/sprints\/([^/]+)\/complete$/,
    methods: ['POST'],
    handler: () => ({ ...DEMO_SPRINTS[0], status: 'COMPLETED', completedAt: new Date().toISOString() }),
  },
  {
    pattern: /^\/projects\/[^/]+\/sprints\/([^/]+)\/issues$/,
    methods: ['POST'],
    handler: () => null,
  },
  {
    pattern: /^\/projects\/[^/]+\/sprints\/[^/]+\/issues\/[^/]+$/,
    methods: ['DELETE'],
    handler: () => null,
  },
  // Join requests — employee submits by code, org admin approves/rejects
  {
    pattern: /^\/join-requests$/,
    methods: ['POST'],
    handler: (_m, body) => {
      const b = body as Record<string, unknown>;
      const code = ((b.joinCode as string) || '').trim().toUpperCase();
      if (code !== 'ACME2026') {
        throw new Error('No organization found for that join code');
      }
      const request = {
        id: `jr-demo-${Date.now()}`, organizationId: DEMO_ORG.id, userId: DEMO_USER.id,
        requestedRoleCode: (b.requestedRoleCode as string) || 'DEVELOPER',
        message: (b.message as string) || null, status: 'PENDING' as const,
        reviewNote: null, createdAt: new Date().toISOString(), reviewedAt: null,
      };
      _demoJoinRequests = [..._demoJoinRequests, request];
      return { organizationId: DEMO_ORG.id, organizationName: DEMO_ORG.name, requestId: request.id, status: 'PENDING' };
    },
  },
  {
    pattern: /^\/join-requests\/mine$/,
    methods: ['GET'],
    handler: () => _demoJoinRequests.filter(r => r.userId === DEMO_USER.id),
  },
  {
    pattern: /^\/organizations\/[^/]+\/join-requests$/,
    methods: ['GET'],
    handler: () => _demoJoinRequests,
  },
  {
    pattern: /^\/organizations\/[^/]+\/join-requests\/([^/]+)\/approve$/,
    methods: ['POST'],
    handler: (m) => {
      _demoJoinRequests = _demoJoinRequests.map(r => r.id === m[1]
        ? { ...r, status: 'APPROVED' as const, reviewedAt: new Date().toISOString() } : r);
      return _demoJoinRequests.find(r => r.id === m[1]);
    },
  },
  {
    pattern: /^\/organizations\/[^/]+\/join-requests\/([^/]+)\/reject$/,
    methods: ['POST'],
    handler: (m, body) => {
      const b = (body as Record<string, unknown>) || {};
      _demoJoinRequests = _demoJoinRequests.map(r => r.id === m[1]
        ? { ...r, status: 'REJECTED' as const, reviewNote: (b.reviewNote as string) || null, reviewedAt: new Date().toISOString() } : r);
      return _demoJoinRequests.find(r => r.id === m[1]);
    },
  },
  // Org chart / node graph
  {
    pattern: /^\/organizations\/[^/]+\/graph$/,
    methods: ['GET'],
    handler: () => ({ nodes: DEMO_GRAPH_NODES }),
  },
  // Departments
  {
    pattern: /^\/organizations\/[^/]+\/departments$/,
    methods: ['GET'],
    handler: () => DEMO_DEPARTMENTS,
  },
  // Platform admin — separate identity tier, own routes
  {
    pattern: /^\/admin\/organizations$/,
    methods: ['GET'],
    handler: () => _demoPlatformOrgs,
  },
  {
    pattern: /^\/admin\/organizations\/([^/]+)$/,
    methods: ['GET'],
    handler: (m) => _demoPlatformOrgs.find(o => o.id === m[1]) || _demoPlatformOrgs[0],
  },
  {
    pattern: /^\/admin\/organizations\/([^/]+)\/suspend$/,
    methods: ['POST'],
    handler: (m) => {
      _demoPlatformOrgs = _demoPlatformOrgs.map(o => o.id === m[1] ? { ...o, status: 'SUSPENDED' as const } : o);
      return _demoPlatformOrgs.find(o => o.id === m[1]);
    },
  },
  {
    pattern: /^\/admin\/organizations\/([^/]+)\/reactivate$/,
    methods: ['POST'],
    handler: (m) => {
      _demoPlatformOrgs = _demoPlatformOrgs.map(o => o.id === m[1] ? { ...o, status: 'ACTIVE' as const } : o);
      return _demoPlatformOrgs.find(o => o.id === m[1]);
    },
  },
  {
    pattern: /^\/admin\/stats$/,
    methods: ['GET'],
    handler: () => DEMO_PLATFORM_STATS,
  },
];

// ─── Main interceptor function (called from api.ts) ──────────────────────────

export function interceptDemo(
  method: string,
  path: string,
  body?: unknown
): { handled: true; data: unknown } | { handled: false } {
  if (!isDemoMode()) return { handled: false };

  for (const route of routes) {
    if (!route.methods.includes(method.toUpperCase())) continue;
    const match = path.match(route.pattern);
    if (match) {
      const data = route.handler(match, body, method);
      return { handled: true, data };
    }
  }

  // Unmatched demo route — return empty success rather than a network error
  console.warn('[Demo] Unhandled route:', method, path);
  return { handled: true, data: null };
}
