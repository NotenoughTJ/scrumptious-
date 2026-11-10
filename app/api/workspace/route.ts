import { getChatGPTUser } from "@/app/chatgpt-auth";
import { readWorkspace, reduceWorkspace, writeWorkspace } from "@/features/database/workspace";
import { requestSchema } from "@/features/shared/contracts";

export const dynamic = "force-dynamic";
async function authorized() { return process.env.NODE_ENV === "development" || !!(await getChatGPTUser()); }
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  if (!await authorized()) return json({ error: "Sign in to open this private workspace." }, 401);
  try { return json({ state: await readWorkspace() }); }
  catch { return json({ error: "The shared workspace could not be loaded. Please try again." }, 503); }
}
export async function PATCH(req: Request) {
  if (!await authorized()) return json({ error: "Sign in to save changes." }, 401);
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json({ error: "Cross-origin writes are not allowed." }, 403);
  if (!req.headers.get("content-type")?.includes("application/json")) return json({ error: "Send a JSON request." }, 415);
  if (Number(req.headers.get("content-length") || 0) > 2200000) return json({ error: "The request is too large." }, 413);
  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Check the form values and try again." }, 400);
    const { revision, action } = parsed.data;
    const current = await readWorkspace();
    if (current.revision !== revision) return json({ error: "Someone saved a newer version. Reload the shared workspace before saving. Your unsaved form is still here." }, 409);
    const result = await reduceWorkspace(current, action);
    if (result.unchanged) return json({ state: current, message: result.message });
    const next = await writeWorkspace(result.state, revision);
    if (!next) return json({ error: "Someone saved at the same time. Reload the shared workspace before saving." }, 409);
    return json({ state: next, message: result.message });
  } catch (e) { return json({ error: e instanceof Error ? e.message : "The change could not be saved." }, 400); }
}
