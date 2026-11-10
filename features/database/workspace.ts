import { env } from "cloudflare:workers";
import seed from "@/data/seed.json";
import type { Workspace } from "../shared/types";

export async function readWorkspace(): Promise<Workspace> {
  if (!env.DB) throw new Error("The shared database is unavailable.");
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT OR IGNORE INTO workspace (id, revision, state, updated_at) VALUES (1, 1, ?, ?)").bind(JSON.stringify(seed), now).run();
  const row = await env.DB.prepare("SELECT revision, state FROM workspace WHERE id = 1").first<{ revision: number; state: string }>();
  if (!row) throw new Error("The workspace could not be loaded.");
  return { ...JSON.parse(row.state), revision: row.revision } as Workspace;
}
export { reduceWorkspace } from "../shared/actions";
export async function writeWorkspace(state: Workspace, expectedRevision: number) {
  if (!env.DB) throw new Error("The shared database is unavailable.");
  const next = { ...state, revision: expectedRevision + 1 };
  const result = await env.DB.prepare("UPDATE workspace SET revision = ?, state = ?, updated_at = ? WHERE id = 1 AND revision = ?")
    .bind(next.revision, JSON.stringify(next), new Date().toISOString(), expectedRevision).run();
  return result.meta.changes === 1 ? next : null;
}
