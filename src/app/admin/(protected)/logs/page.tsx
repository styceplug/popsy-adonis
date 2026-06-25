import { prisma } from "@/lib/prisma";

type AdminLog = {
  action: string;
  actorName: string;
  entityType: string;
  createdAt: Date;
};

export const metadata = {
  title: "Audit Logs | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

function formatActionLabel(actionName: string) {
  return actionName
    .split(".")
    .map((part) => part.replaceAll("_", " "))
    .join(" / ");
}

function buildLogSummary(logs: AdminLog[]) {
  if (logs.length === 0) {
    return {
      headline: "No admin activity matches this view yet.",
      details: ["Once staff start checking tickets, logging in, or sending subscriber emails, the summary will appear here."],
      stats: [
        { label: "Logs reviewed", value: "0" },
        { label: "Staff active", value: "0" },
        { label: "Attention items", value: "0" },
      ],
    };
  }

  const actorCounts = new Map<string, number>();
  const actionCounts = new Map<string, number>();
  let attentionCount = 0;

  for (const log of logs) {
    actorCounts.set(log.actorName, (actorCounts.get(log.actorName) ?? 0) + 1);
    actionCounts.set(log.action, (actionCounts.get(log.action) ?? 0) + 1);

    if (
      log.action.includes("not_found") ||
      log.action.includes("unpaid") ||
      log.action.includes("duplicate") ||
      log.action.includes("failed")
    ) {
      attentionCount += 1;
    }
  }

  const topActor = [...actorCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topActions = [...actionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const newest = logs[0]?.createdAt;
  const oldest = logs[logs.length - 1]?.createdAt;
  const successfulCheckIns = actionCounts.get("ticket.checkin.success") ?? 0;
  const broadcasts = logs.filter((log) => log.action.includes("subscribers.broadcast")).length;

  const details = [
    `${logs.length} admin action${logs.length === 1 ? "" : "s"} in this view, from ${actorCounts.size} staff member${actorCounts.size === 1 ? "" : "s"}.`,
    topActor ? `${topActor[0]} is the most active staff member here with ${topActor[1]} action${topActor[1] === 1 ? "" : "s"}.` : "",
    successfulCheckIns > 0 ? `${successfulCheckIns} successful ticket check-in${successfulCheckIns === 1 ? "" : "s"} recorded.` : "",
    broadcasts > 0 ? `${broadcasts} subscriber broadcast action${broadcasts === 1 ? "" : "s"} recorded.` : "",
    attentionCount > 0
      ? `${attentionCount} item${attentionCount === 1 ? "" : "s"} may need attention, mostly duplicate, unpaid, failed, or not-found actions.`
      : "No duplicate, unpaid, failed, or not-found actions stand out in this view.",
  ].filter(Boolean);

  return {
    headline: `Activity from ${oldest ? new Date(oldest).toLocaleDateString() : "recent logs"} to ${
      newest ? new Date(newest).toLocaleDateString() : "now"
    }.`,
    details,
    stats: [
      { label: "Logs reviewed", value: String(logs.length) },
      { label: "Staff active", value: String(actorCounts.size) },
      { label: "Attention items", value: String(attentionCount) },
    ],
    topActions,
  };
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; action?: string }>;
}) {
  const params = await searchParams;
  const actor = params.actor?.trim() ?? "";
  const action = params.action?.trim() ?? "";
  const auditLogDelegate = (prisma as unknown as {
    adminAuditLog?: {
      findMany: typeof prisma.adminAuditLog.findMany;
    };
  }).adminAuditLog;

  const logs = auditLogDelegate
    ? await auditLogDelegate
        .findMany({
          where: {
            ...(actor ? { actorName: { contains: actor, mode: "insensitive" } } : {}),
            ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        })
        .catch(() => [])
    : [];
  const summary = buildLogSummary(logs);

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Audit trail</p>
      <h2 className="mt-2 font-display text-5xl font-black">Admin logs</h2>

      <section className="mt-6 rounded-ui border border-gold/25 bg-gold/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase text-gold">AI-style summary</p>
            <h3 className="mt-2 font-display text-3xl font-black text-paper">{summary.headline}</h3>
          </div>
          <div className="grid min-w-72 grid-cols-3 gap-2">
            {summary.stats.map((stat) => (
              <div key={stat.label} className="rounded-ui border border-white/10 bg-ink/55 p-3">
                <p className="font-display text-2xl font-black">{stat.value}</p>
                <p className="mt-1 text-[11px] font-black uppercase text-paper/45">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-2 text-sm leading-6 text-paper/68">
          {summary.details.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>
        {summary.topActions && summary.topActions.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {summary.topActions.map(([actionName, count]) => (
              <span key={actionName} className="rounded-ui border border-white/10 bg-ink/50 px-3 py-2 text-xs font-black uppercase text-paper/62">
                {formatActionLabel(actionName)} · {count}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <form className="mt-6 grid gap-3 rounded-ui border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_1fr_auto]">
        <input
          name="actor"
          defaultValue={actor}
          className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
          placeholder="Filter by staff name"
        />
        <input
          name="action"
          defaultValue={action}
          className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
          placeholder="Filter by action"
        />
        <button className="focus-ring h-11 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper">
          Filter
        </button>
      </form>

      <div className="mt-6 grid gap-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-ui border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-paper">{log.action}</p>
                <p className="mt-1 text-xs text-paper/45">
                  {log.actorName} · {log.entityType}
                  {log.entityId ? ` · ${log.entityId}` : ""}
                </p>
              </div>
              <p className="text-xs text-paper/45">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
            {log.metadata ? (
              <pre className="mt-3 max-h-36 overflow-auto rounded-ui bg-ink p-3 text-xs leading-5 text-paper/58">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
        {logs.length === 0 ? <p className="rounded-ui border border-white/10 p-5 text-sm text-paper/50">No logs found.</p> : null}
      </div>
    </div>
  );
}
