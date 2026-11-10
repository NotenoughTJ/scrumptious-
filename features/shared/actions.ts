import type { Workspace, Action } from "./types";
import { validationErrors } from "../student-decisions/validation";
import { parseFrlst } from "../frlst-import/parser";

export async function reduceWorkspace(current: Workspace, action: Action): Promise<{ state: Workspace; message: string; unchanged?: boolean }> {
  const state = structuredClone(current);
  let message = "Saved to the shared workspace.";
  if (action.kind === "saveStudio") state.studio = action.studio;
  else {
    const roundNumber = action.kind === "saveDecision" ? action.decision.roundNumber : action.roundNumber;
    const round = state.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) throw new Error("This round is not configured.");
    if (action.kind === "saveDecision" || action.kind === "submit" || action.kind === "reopen") {
      if (round.status !== "open") throw new Error("This round is locked. Ask the professor to reopen it.");
      const teamId = action.kind === "saveDecision" ? action.decision.teamId : action.teamId;
      const i = state.decisions.findIndex(d => d.teamId === teamId && d.roundNumber === roundNumber);
      if (i < 0) throw new Error("Team decisions were not found.");
      if (action.kind === "saveDecision") {
        if (state.decisions[i].submittedAt) throw new Error("Reopen this submission before editing it.");
        state.decisions[i] = { ...action.decision, submittedAt: null };
        message = "Draft saved. Your team can pick up from here.";
      } else if (action.kind === "submit") {
        if (Object.keys(validationErrors(state.decisions[i])).length) throw new Error("Complete all required decisions before submitting.");
        if (state.decisions[i].submittedAt) return { state: current, message: "This team has already submitted.", unchanged: true };
        state.decisions[i].submittedAt = new Date().toISOString();
        message = "Submitted. Your professor can now review your strategy.";
      } else { state.decisions[i].submittedAt = null; message = "Submission reopened for editing."; }
    } else if (action.kind === "lock") {
      if (round.status !== "open") throw new Error("Only an open round can be locked.");
      if (!state.teams.every(t => state.decisions.some(d => d.teamId === t.id && d.roundNumber === roundNumber && d.submittedAt && !Object.keys(validationErrors(d)).length))) throw new Error("All five teams must submit valid decisions before preparing files.");
      round.status = "locked"; message = "Round locked. The RFI downloads are ready.";
    } else if (action.kind === "unlock") {
      if (round.status !== "locked") throw new Error("Only a locked round can be reopened. Imported and released results stay attached to their submissions.");
      round.status = "open"; message = "Round reopened.";
    } else if (action.kind === "import") {
      if (!["locked", "imported"].includes(round.status)) throw new Error("Lock the round before importing its output.");
      const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(action.text));
      const hash = Array.from(new Uint8Array(buffer)).map(v => v.toString(16).padStart(2, "0")).join("");
      if (round.importHash === hash) return { state: current, message: "This exact file was already imported. No duplicate results were created.", unchanged: true };
      const imported = parseFrlst(action.text, roundNumber);
      state.results = [...state.results.filter(r => r.roundNumber !== roundNumber), ...imported];
      round.importHash = hash; round.status = "imported"; round.releasedAt = null;
      message = "Imported five firm reports. Preview the results before releasing them.";
    } else if (action.kind === "release") {
      if (round.status !== "imported" || state.results.filter(r => r.roundNumber === roundNumber).length !== state.teams.length) throw new Error("Import and verify all five firm reports first.");
      round.status = "released"; round.releasedAt = new Date().toISOString();
      message = "Results released. They are now visible in the student experience.";
    }
  }
  return { state, message };
}
