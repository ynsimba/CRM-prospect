import "server-only";

const DATE_KEYS = new Set([
  "createdAt",
  "updatedAt",
  "lastLoginAt",
  "firstContactAt",
  "lastActionAt",
  "nextContactAt",
  "lastContactAt",
  "convertedAt",
  "occurredAt",
  "dueAt",
  "expectedCloseAt",
  "readAt",
  "currentPeriodEnd",
  "lastSeenAt",
  "hiredAt",
]);

type QueryArgs = Record<string, unknown> | undefined;

// Rows come back untyped from the Laravel gateway, exactly like the Prisma client they replace.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = any;

function revive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(revive);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (DATE_KEYS.has(key)) {
      out[key] = typeof item === "string" && item ? new Date(item) : item ?? null;
    } else {
      out[key] = revive(item);
    }
  }
  return out;
}

async function call<T>(model: string, op: string, args?: QueryArgs): Promise<T> {
  const base = process.env.LARAVEL_API_URL || "http://127.0.0.1:8000";
  const token = process.env.LARAVEL_INTERNAL_TOKEN || "";
  let response: Response;
  try {
    response = await fetch(`${base}/api/data`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Internal-Token": token,
      },
      body: JSON.stringify({ model, op, args: args ?? {} }),
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    throw new Error(`Laravel injoignable (${base}). ${message}`);
  }
  const json = (await response.json().catch(() => ({}))) as { data?: T; message?: string; code?: string };
  if (!response.ok) {
    const error = new Error(json.message || "Erreur Laravel");
    Object.assign(error, { code: json.code });
    throw error;
  }
  return revive(json.data) as T;
}

type ModelApi = {
  findMany: (args?: QueryArgs) => Promise<Row[]>;
  findFirst: (args?: QueryArgs) => Promise<Row>;
  create: (args?: QueryArgs) => Promise<Row>;
  update: (args?: QueryArgs) => Promise<Row>;
  updateMany: (args?: QueryArgs) => Promise<{ count: number }>;
  delete: (args?: QueryArgs) => Promise<Row>;
  count: (args?: QueryArgs) => Promise<number>;
  groupBy: (args?: QueryArgs) => Promise<Row[]>;
  upsert: (args?: QueryArgs) => Promise<Row>;
};

type PrismaApi = {
  user: ModelApi;
  organization: ModelApi;
  team: ModelApi;
  prospectStatus: ModelApi;
  prospectSource: ModelApi;
  tag: ModelApi;
  company: ModelApi;
  contact: ModelApi;
  prospect: ModelApi;
  prospectStatusHistory: ModelApi;
  pipeline: ModelApi;
  pipelineStage: ModelApi;
  opportunity: ModelApi;
  activity: ModelApi;
  task: ModelApi;
  userNote: ModelApi;
  noteShare: ModelApi;
  notification: ModelApi;
  goal: ModelApi;
  auditLog: ModelApi;
  plan: ModelApi;
  subscription: ModelApi;
  zone: ModelApi;
  prospectAssignment: ModelApi;
  assignmentRule: ModelApi;
  $transaction: <T>(fn: (tx: PrismaApi) => Promise<T>) => Promise<T>;
};

function model(name: string): ModelApi {
  return {
    findMany: (args?: QueryArgs) => call<Row[]>(name, "findMany", args),
    findFirst: (args?: QueryArgs) => call<Row>(name, "findFirst", args),
    create: (args?: QueryArgs) => call<Row>(name, "create", args),
    update: (args?: QueryArgs) => call<Row>(name, "update", args),
    updateMany: (args?: QueryArgs) => call<{ count: number }>(name, "updateMany", args),
    delete: (args?: QueryArgs) => call<Row>(name, "delete", args),
    count: (args?: QueryArgs) => call<number>(name, "count", args),
    groupBy: (args?: QueryArgs) => call<Row[]>(name, "groupBy", args),
    upsert: (args?: QueryArgs) => call<Row>(name, "upsert", args),
  };
}

export const prisma: PrismaApi = {
  user: model("user"),
  organization: model("organization"),
  team: model("team"),
  prospectStatus: model("prospectStatus"),
  prospectSource: model("prospectSource"),
  tag: model("tag"),
  company: model("company"),
  contact: model("contact"),
  prospect: model("prospect"),
  prospectStatusHistory: model("prospectStatusHistory"),
  pipeline: model("pipeline"),
  pipelineStage: model("pipelineStage"),
  opportunity: model("opportunity"),
  activity: model("activity"),
  task: model("task"),
  userNote: model("userNote"),
  noteShare: model("noteShare"),
  notification: model("notification"),
  goal: model("goal"),
  auditLog: model("auditLog"),
  plan: model("plan"),
  subscription: model("subscription"),
  zone: model("zone"),
  prospectAssignment: model("prospectAssignment"),
  assignmentRule: model("assignmentRule"),
  $transaction: (fn) => fn(prisma),
};

export type PipelineStageRow = {
  id: string;
  pipelineId: string;
  name: string;
  sortOrder: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
};
