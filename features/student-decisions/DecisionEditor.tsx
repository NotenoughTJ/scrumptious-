"use client";
import { ArrowRight, Plus, Trash2, Check, ClipboardCheck } from "lucide-react";
import type { Decision } from "../shared/types";
import { STATIC_DEMO } from "../shared/environment";
import { ITEMS, sections, sectionErrors, validationErrors } from "./validation";
import { useState } from "react";
import { Badge, PageTitle, Warning, money, Checkmark } from "../shared/ui";

function Field({ label, name, hint, decimals = 2, signed = false, draft, update, showErrors, errors, locked }: {
  label: string; name: keyof Decision; hint: string; decimals?: number; signed?: boolean;
  draft: Decision; update: (key: keyof Decision, value: unknown) => void;
  showErrors: boolean; errors: Record<string, string>; locked: boolean;
}) {
  return <div className="field"><label htmlFor={String(name)}>{label}</label><div className="input-wrap">{decimals === 2 && <span aria-hidden="true">$</span>}<input id={String(name)} type="number" min={signed ? undefined : 0} step={decimals === 0 ? "1" : decimals === 1 ? "0.1" : "0.01"} value={(draft[name] as number | null) ?? ""} onChange={e => update(name, e.target.value === "" ? null : Number(e.target.value))} aria-invalid={showErrors && !!errors[name]} aria-describedby={String(name) + "-hint"} disabled={locked} /></div><p id={String(name) + "-hint"} className={"small " + (showErrors && errors[name] ? "field-error" : "muted")}>{showErrors && errors[name] ? errors[name] : hint}</p></div>;
}

export function DecisionEditor({ draft, setDraft, busy, dirty, onSave, onReview, locked, initialPart = 0 }: {
  initialPart?: number; draft: Decision; setDraft: (d: Decision) => void; busy: boolean; dirty: boolean;
  onSave: () => Promise<boolean>; onReview: () => void; locked: boolean;
}) {
  const [part, setPart] = useState(initialPart), [showErrors, setShowErrors] = useState(false);
  const errors = validationErrors(draft);
  const update = (key: keyof Decision, value: unknown) => setDraft({ ...draft, [key]: value });
  const rowUpdate = (i: number, key: string, value: unknown) => setDraft({ ...draft, menu: draft.menu.map((r, index) => index === i ? { ...r, [key]: value } : r) });
  const valueFrom = (v: string) => v === "" ? null : Number(v);
  async function next() {
    setShowErrors(true);
    if (sectionErrors(draft, part).length) return;
    if (await onSave()) { setShowErrors(false); if (part < 3) setPart(part + 1); else onReview(); }
  }
  return <>
    <PageTitle eyebrow={"QUARTER " + draft.roundNumber + " / YOUR STRATEGY"} title="Decisions" description="A few considered choices. One complete restaurant strategy." action={<Badge tone={dirty ? "attention" : ""}>{locked ? "Submitted" : dirty ? "Unsaved edits" : "Draft saved"}</Badge>} />
    {locked && <div className="notice"><ClipboardCheck size={18} />This strategy is submitted. Your professor can reopen it while the round is open.</div>}
    <div className="decision-layout">
      <aside className="part-list" aria-label="Decision parts">
        <p className="eyebrow">FOUR PARTS. ONE PLAN.</p>
        {sections.map((s, i) => <button key={s} className={"part-button " + (part === i ? "selected" : "")} onClick={() => { setPart(i); setShowErrors(false); }} aria-current={part === i ? "step" : undefined}><span className="part-number">{i + 1}</span><span>{s}<small>{sectionErrors(draft, i).length ? "Needs a little attention" : "Complete"}</small></span><Checkmark done={!sectionErrors(draft, i).length} /></button>)}
        <p className="small muted rail-note">Jump between parts at any time. Review everything together before you submit.</p>
      </aside>
      <section className="form-panel">
        <div className="panel-heading"><div><p className="eyebrow">PART {part + 1} OF 4</p><h2>{sections[part]}</h2></div><span className="small muted">{part === 0 ? draft.menu.length + " of 8 selections" : ""}</span></div>
        {showErrors && sectionErrors(draft, part).length > 0 && <Warning>Check the highlighted fields before continuing. You can still save an incomplete draft.</Warning>}
        {part === 0 && <><p className="muted small">Set your menu, preparation, portion, promotion, and price. Food portions use grams; beverages use centiliters.</p><div className="table-scroll menu-edit"><table><thead><tr><th scope="col">Item</th><th scope="col">Preparation</th><th scope="col">Portion</th><th scope="col">Promotion $</th><th scope="col">Price $</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead><tbody>
          {draft.menu.map((r, i) => <tr key={r.lineNumber}><td><select aria-label={"Item, selection " + (i + 1)} value={r.itemName} onChange={e => rowUpdate(i, "itemName", e.target.value)} disabled={locked}>{Object.keys(ITEMS).map(item => <option key={item}>{item}</option>)}</select></td><td><select aria-label={"Preparation, selection " + (i + 1)} value={r.prepLevel} onChange={e => rowUpdate(i, "prepLevel", Number(e.target.value))} disabled={locked}>{(ITEMS[r.itemName] || []).map((prep, n) => <option key={prep} value={n + 1}>{n + 1} · {prep}</option>)}</select></td>
            {(["orderSize", "internalPromotion", "salesPrice"] as const).map((key, n) => <td key={key}><input type="number" aria-label={["Portion", "Promotion", "Sales price"][n] + ", selection " + (i + 1)} min="0" step={[0.1, 1, 0.01][n]} value={r[key] ?? ""} onChange={e => rowUpdate(i, key, valueFrom(e.target.value))} disabled={locked} aria-invalid={showErrors && !!errors["menu." + i + "." + key]} />{showErrors && errors["menu." + i + "." + key] && <span className="field-error small">{errors["menu." + i + "." + key]}</span>}</td>)}
            <td><button className="icon-button quiet" aria-label={"Remove selection " + (i + 1)} disabled={locked || draft.menu.length === 1} onClick={() => update("menu", draft.menu.filter((_, n) => n !== i))}><Trash2 size={16} /></button></td></tr>)}
        </tbody></table></div><button className="text-link add-row" disabled={locked || draft.menu.length >= 8} onClick={() => update("menu", [...draft.menu, { lineNumber: [1,2,3,4,5,6,7,8].find(n => !draft.menu.some(r => r.lineNumber === n)), itemName: "STEAK", prepLevel: 1, orderSize: null, internalPromotion: null, salesPrice: null }])}><Plus size={16} />Add selection</button></>}
        {part === 1 && <><p className="muted">Choose the team behind your dining room and kitchen.</p><div className="field-grid"><Field draft={draft} update={update} showErrors={showErrors} errors={errors} locked={locked} name="staffPerDay" label="Staff per day" decimals={1} hint="Full-time-equivalent staff per day. One decimal place." /><Field draft={draft} update={update} showErrors={showErrors} errors={errors} locked={locked} name="hourlyCompensation" label="Average hourly compensation" hint="Include selection and training costs." /></div></>}
        {part === 2 && <><p className="muted">Plan the details guests notice and the upkeep they rely on.</p><div className="field-grid"><Field draft={draft} update={update} showErrors={showErrors} errors={errors} locked={locked} name="amenitiesPerOrder" label="Amenities per order" hint="Dollars for supplies and table amenities." /><Field draft={draft} update={update} showErrors={showErrors} errors={errors} locked={locked} name="entertainmentBudget" label="Music & entertainment" decimals={0} hint="Whole dollars for this quarter." /><Field draft={draft} update={update} showErrors={showErrors} errors={errors} locked={locked} name="maintenanceBudget" label="Repairs & maintenance" decimals={0} hint="Whole dollars for this quarter." /></div></>}
        {part === 3 && <><div className="info-note">The three report flag positions are preserved from the supplied RFI files. Their mapping to Guest Satisfaction, Financial, and Product reports still needs instructor confirmation.</div><div className="report-options">{draft.reportFlags.map((flag, i) => <label className="checkbox-row" key={i}><input type="checkbox" checked={flag === 1} onChange={e => update("reportFlags", draft.reportFlags.map((v, n) => n === i ? Number(e.target.checked) : v))} disabled={locked} /><span>Legacy report flag {i + 1}<small>Position {i + 1} · {flag ? "1 / enabled" : "0 / disabled"}</small></span></label>)}</div><h3 className="section-subtitle">Financial plan</h3><p className="small muted">Signed whole-dollar changes. A positive value increases the balance; a negative value decreases it.</p><div className="field-grid"><Field draft={draft} update={update} showErrors={showErrors} errors={errors} locked={locked} name="timeDepositChange" label="Time deposits" decimals={0} signed hint="Change this quarter." /><Field draft={draft} update={update} showErrors={showErrors} errors={errors} locked={locked} name="certificateOfDepositChange" label="Certificates of deposit" decimals={0} signed hint="Change this quarter." /><Field draft={draft} update={update} showErrors={showErrors} errors={errors} locked={locked} name="notePayableChange" label="Note payable" decimals={0} signed hint="Change this quarter." /></div></>}
        <div className="form-footer"><span className="small muted"><Check size={14} aria-hidden="true" />{locked ? "Submitted strategy" : (STATIC_DEMO ? "Saved on this browser only" : "Your draft is shared with the team")}</span><div className="button-row"><button className="button secondary" onClick={onSave} disabled={busy || locked}>Save draft</button><button className="button primary" onClick={next} disabled={busy || locked}>{part === 3 ? "Save & review" : "Save & continue"}<ArrowRight size={16} /></button></div></div>
      </section>
    </div>
  </>;
}

export function Review({ draft, busy, onSubmit, onEdit }: { draft: Decision; busy: boolean; onSubmit: () => void; onEdit: () => void }) {
  const errors = validationErrors(draft);
  return <><PageTitle eyebrow={"QUARTER " + draft.roundNumber + " / THE COMPLETE PICTURE"} title="Review your strategy" description="Make sure this is the restaurant you want to run." action={<button className="button secondary" onClick={onEdit}>Back to decisions</button>} />
    {!!Object.keys(errors).length && <Warning>{Object.keys(errors).length} fields need attention. Return to Decisions to finish your plan.</Warning>}
    <section className="panel"><div className="panel-heading"><h2>Your menu</h2><Badge>{draft.menu.length} selections</Badge></div><div className="table-scroll"><table><thead><tr><th>Selection</th><th>Preparation</th><th>Portion</th><th>Promotion</th><th>Price</th></tr></thead><tbody>{draft.menu.map(r => <tr key={r.lineNumber}><td>{r.itemName}</td><td>{ITEMS[r.itemName]?.[r.prepLevel - 1]}</td><td>{r.orderSize ?? "—"} {["WINE","BEER","SPIRITS"].includes(r.itemName) ? "cl" : "g"}</td><td>{r.internalPromotion === null ? "—" : money(r.internalPromotion)}</td><td>{r.salesPrice === null ? "—" : money(r.salesPrice, 2)}</td></tr>)}</tbody></table></div></section>
    <div className="review-grid">{[["Staffing", [["Staff / day", draft.staffPerDay], ["Hourly compensation", draft.hourlyCompensation]]], ["Amenities & upkeep", [["Amenities / order", draft.amenitiesPerOrder], ["Entertainment", draft.entertainmentBudget], ["Maintenance", draft.maintenanceBudget]]], ["Management info & finance", [["Report flags", draft.reportFlags.join(" / ")], ["Time deposits", draft.timeDepositChange], ["Certificates of deposit", draft.certificateOfDepositChange], ["Note payable", draft.notePayableChange]]]].map(([title, rows]) => <section className="panel compact" key={title as string}><h3>{title as string}</h3><dl className="summary-list">{(rows as [string, string | number | null][]).map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v ?? "Missing"}</dd></div>)}</dl></section>)}</div>
    <div className="submission-bar"><div><h3>{draft.submittedAt ? "Your strategy is submitted." : "Ready to make your move?"}</h3><p className="small muted">{draft.submittedAt ? "Your professor can see this submission." : "Submitting locks this team’s draft until the professor reopens it."}</p></div><button className="button primary" disabled={busy || !!draft.submittedAt || !!Object.keys(errors).length} onClick={onSubmit}>{draft.submittedAt ? <Check size={18} /> : <ClipboardCheck size={18} />}{draft.submittedAt ? "Submitted" : "Submit strategy"}</button></div>
  </>;
}
