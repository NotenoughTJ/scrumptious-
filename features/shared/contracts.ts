import { z } from "zod";
const num = z.number().finite().nullable();
export const decisionSchema = z.object({
  teamId: z.number().int().min(1).max(5), roundNumber: z.number().int().min(2).max(7),
  submittedAt: z.string().nullable(),
  menu: z.array(z.object({ lineNumber: z.number().int().min(1).max(8), itemName: z.string().max(32), prepLevel: z.number().int().min(1).max(3), orderSize: num, internalPromotion: num, salesPrice: num })).min(1).max(8),
  staffPerDay: num, hourlyCompensation: num, amenitiesPerOrder: num, entertainmentBudget: num, maintenanceBudget: num,
  reportFlags: z.array(z.number().int().min(0).max(1)).length(3),
  timeDepositChange: num, certificateOfDepositChange: num, notePayableChange: num,
});
export const studioSchema = z.object({
  title: z.string().min(1).max(80), projectNote: z.string().max(3000),
  owners: z.array(z.object({ name: z.string().min(1).max(80), area: z.string().min(1).max(100), branch: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/).max(100), scope: z.string().max(3000) })).length(5),
  colors: z.object({ primary: z.string(), text: z.string(), card: z.string(), alert: z.string(), background: z.string() }).refine(c => Object.values(c).every(v => /^#[0-9a-f]{6}$/i.test(v)), "Use six-digit hex colors."),
  architecture: z.array(z.object({ id: z.string().max(30), title: z.string().min(1).max(150), rationale: z.string().max(5000), consequence: z.string().max(5000), status: z.enum(["Accepted", "Proposed"]) })).min(1).max(20),
});
const round = { roundNumber: z.number().int().min(2).max(7) };
const team = { ...round, teamId: z.number().int().min(1).max(5) };
export const requestSchema = z.object({
  revision: z.number().int().positive(),
  action: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("saveDecision"), decision: decisionSchema }),
    z.object({ kind: z.literal("submit"), ...team }),
    z.object({ kind: z.literal("reopen"), ...team }),
    z.object({ kind: z.literal("lock"), ...round }),
    z.object({ kind: z.literal("unlock"), ...round }),
    z.object({ kind: z.literal("import"), ...round, text: z.string().min(1).max(2000000) }),
    z.object({ kind: z.literal("release"), ...round }),
    z.object({ kind: z.literal("saveStudio"), studio: studioSchema }),
  ]),
});
