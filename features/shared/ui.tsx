"use client";
import type { ReactNode } from "react";
import { ArrowUpRight, Check, AlertTriangle } from "lucide-react";
export const money = (value: number, digits = 0) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits }).format(value);
export const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
export const percent = (value: number | null) => value === null ? "—" : value.toFixed(1) + "%";
export const ratio = (part: number, total: number) => total === 0 ? null : part / total * 100;
export function Badge({ children, tone = "" }: { children: ReactNode; tone?: string }) { return <span className={"badge " + tone}>{children}</span>; }
export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-title"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="muted page-description">{description}</p>}</div>{action && <div className="page-action">{action}</div>}</div>;
}
export function Warning({ children }: { children: ReactNode }) { return <div className="warning" role="alert"><AlertTriangle size={18} aria-hidden="true" /><div>{children}</div></div>; }
export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) { return <div className="stat"><p>{label}</p><strong>{value}</strong>{hint && <span className="small muted">{hint}</span>}</div>; }
export function Checkmark({ done }: { done: boolean }) { return <span className={"checkmark " + (done ? "done" : "")}>{done ? <Check size={14} aria-label="Complete" /> : <span aria-label="Incomplete" />}</span>; }
export function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button className="text-link" onClick={onClick}>{children}<ArrowUpRight size={16} aria-hidden="true" /></button>; }
export function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
