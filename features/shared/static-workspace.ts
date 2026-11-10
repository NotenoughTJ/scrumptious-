import seed from "@/data/seed.json";
import templates from "@/data/rfi-templates.json";
import { requestSchema } from "./contracts";
import { reduceWorkspace } from "./actions";
import { generateRfi } from "../rfi-generator/generator";
import type { Action, Workspace } from "./types";

export const DEMO_STORAGE_KEY = "scrumptious-pages-workspace-v1";
export function readDemoWorkspace(storage: Pick<Storage, "getItem"> = window.localStorage): Workspace {
  const saved = storage.getItem(DEMO_STORAGE_KEY);
  if (!saved) return structuredClone(seed) as Workspace;
  const value = JSON.parse(saved) as Workspace;
  if (!Number.isInteger(value.revision) || !value.studio || !Array.isArray(value.decisions) || !Array.isArray(value.results)) throw new Error("The saved browser demo could not be read. Clear this site’s saved data to start again.");
  return value;
}
export async function applyDemoAction(action: Action, revision: number, storage: Pick<Storage, "getItem" | "setItem"> = window.localStorage) {
  const input = requestSchema.parse({ revision, action });
  const work = async () => {
    const current = readDemoWorkspace(storage);
    if (current.revision !== revision) throw new Error("A newer browser demo was saved. Reload the browser version before saving.");
    const result = await reduceWorkspace(current, input.action);
    if (result.unchanged) return { state: current, message: result.message };
    if (readDemoWorkspace(storage).revision !== revision) throw new Error("Another tab saved changes. Reload the browser version before saving.");
    const state = { ...result.state, revision: revision + 1 };
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    return { state, message: result.message.replace("shared workspace", "browser demo") };
  };
  return typeof navigator !== "undefined" && navigator.locks ? navigator.locks.request("scrumptious-pages-save", work) : work();
}
export function demoRfi(state: Workspace, firm: number) {
  const round = state.rounds.find(r => r.roundNumber === 3);
  const decision = state.decisions.find(d => d.teamId === firm && d.roundNumber === 3);
  if (!round || !["locked", "imported", "released"].includes(round.status) || !decision?.submittedAt) throw new Error("All five teams must submit and the round must be locked.");
  return generateRfi(decision, (templates as Record<string, string>)["3-" + firm]);
}
