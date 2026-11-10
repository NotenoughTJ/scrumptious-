import { getChatGPTUser } from "@/app/chatgpt-auth";
import { readWorkspace } from "@/features/database/workspace";
import { generateRfi } from "@/features/rfi-generator/generator";
import templates from "@/data/rfi-templates.json";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development" && !await getChatGPTUser()) return Response.json({ error: "Sign in to download files." }, { status: 401 });
  const url = new URL(req.url), q = Number(url.searchParams.get("round")), firm = Number(url.searchParams.get("firm"));
  try {
    const state = await readWorkspace();
    const round = state.rounds.find(r => r.roundNumber === q);
    if (!round || !["locked", "imported", "released"].includes(round.status)) throw new Error("Lock the round after all five teams submit.");
    const d = state.decisions.find(r => r.teamId === firm && r.roundNumber === q);
    const template = (templates as Record<string, string>)[q + "-" + firm];
    if (!d?.submittedAt || !template) throw new Error("A submitted decision and matching template are required.");
    return new Response(generateRfi(d, template), { headers: { "Content-Type": "text/plain; charset=us-ascii", "Content-Disposition": 'attachment; filename="RFI' + firm + 'ME.TXT"', "Cache-Control": "no-store" } });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Could not generate file." }, { status: 409 }); }
}
