export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  /** Responsable commercial : vend lui-même et pilote uniquement son équipe. */
  TEAM_LEAD: "TEAM_LEAD",
  SALES: "SALES",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ProspectPriority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type ProspectPriority = (typeof ProspectPriority)[keyof typeof ProspectPriority];

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const ActivityType = {
  CALL: "CALL",
  EMAIL: "EMAIL",
  WHATSAPP: "WHATSAPP",
  SMS: "SMS",
  MEETING: "MEETING",
  VISIT: "VISIT",
  DEMO: "DEMO",
  PROPOSAL: "PROPOSAL",
  NOTE: "NOTE",
  OTHER: "OTHER",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const OpportunityStatus = {
  OPEN: "OPEN",
  WON: "WON",
  LOST: "LOST",
} as const;
export type OpportunityStatus = (typeof OpportunityStatus)[keyof typeof OpportunityStatus];

export const TaskType = {
  CALL: "CALL",
  FOLLOW_UP: "FOLLOW_UP",
  MEETING: "MEETING",
  VISIT: "VISIT",
  REUNION: "REUNION",
  DEADLINE: "DEADLINE",
  TASK: "TASK",
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const AgentStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  INACTIVE: "INACTIVE",
} as const;
export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

export const AssignmentMode = {
  MANUAL: "MANUAL",
  ROUND_ROBIN: "ROUND_ROBIN",
  LOAD: "LOAD",
  ZONE: "ZONE",
} as const;
export type AssignmentMode = (typeof AssignmentMode)[keyof typeof AssignmentMode];
