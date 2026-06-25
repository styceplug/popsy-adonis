import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Audit Logs | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

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

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Audit trail</p>
      <h2 className="mt-2 font-display text-5xl font-black">Admin logs</h2>
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
