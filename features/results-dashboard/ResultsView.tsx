"use client";
import { useId, useState } from "react";
import type { Workspace, Result } from "../shared/types";
import { ArrowUpRight, Download } from "lucide-react";
import { Badge, PageTitle, Stat, download, money, number, percent, ratio } from "../shared/ui";
type Metric = "netIncome" | "totalSales" | "netMargin" | "foodCostPct";
const labels: Record<Metric, string> = { netIncome: "Net income", totalSales: "Total sales", netMargin: "Net margin", foodCostPct: "Food cost %" };
const totalSales = (r: Result) => r.foodSales + r.beverageSales;
function metric(r: Result, key: Metric) { return key === "totalSales" ? totalSales(r) : key === "netMargin" ? ratio(r.netIncome, totalSales(r)) ?? 0 : key === "foodCostPct" ? ratio(r.foodCost, r.foodSales) ?? 0 : r.netIncome; }
function format(v: number, key: Metric) { return key.includes("Margin") || key.includes("Pct") ? percent(v) : money(v); }

export function Bars({ data, title, percentage = false }: { data: { label: string; value: number }[]; title: string; percentage?: boolean }) {
  const id = useId();
  const max = Math.max(...data.map(d => d.value), 1), min = Math.min(...data.map(d => d.value), 0);
  const span = max - min, y = (v: number) => 32 + (max - v) / span * 160, zero = y(0);
  const step = 570 / Math.max(data.length, 1), width = Math.min(58, step * .45);
  return <div className="bar-chart"><svg viewBox="0 0 680 250" role="img" aria-labelledby={id}><title id={id}>{title}. {data.map(d => d.label + ": " + (percentage ? percent(d.value) : money(d.value))).join("; ")}</title>
    {[0,.5,1].map((fraction, i) => { const v = min + span * fraction; return <g key={i}><line x1="70" x2="650" y1={y(v)} y2={y(v)} className="chart-grid" /><text x="57" y={y(v) + 4} textAnchor="end" className="chart-label">{percentage ? v.toFixed(0) + "%" : Math.abs(v) >= 1000 ? Math.round(v / 1000) + "k" : Math.round(v)}</text></g>; })}
    <line x1="70" x2="650" y1={zero} y2={zero} className="chart-baseline" />
    {data.map((d,i) => { const x = 85 + i * step + step / 2 - width / 2; return <g key={d.label}><rect x={x} y={Math.min(y(d.value),zero)} width={width} height={Math.max(1,Math.abs(zero-y(d.value)))} rx="4" className="chart-bar" /><text x={x+width/2} y={d.value >= 0 ? y(d.value)-10 : y(d.value)+18} textAnchor="middle" className="chart-value">{percentage ? percent(d.value) : Math.abs(d.value) >= 1000000 ? (d.value / 1000000).toFixed(2) + "m" : Math.round(d.value / 1000) + "k"}</text><text x={x+width/2} y="225" textAnchor="middle" className="chart-label">{d.label}</text></g>; })}
  </svg><details className="chart-data"><summary>View chart data</summary><table><thead><tr><th>Period / firm</th><th>Value</th></tr></thead><tbody>{data.map(d => <tr key={d.label}><td>{d.label}</td><td>{percentage ? percent(d.value) : money(d.value)}</td></tr>)}</tbody></table></details></div>;
}
function Donut({ result }: { result: Result }) {
  const sales = totalSales(result), loss = result.netIncome < 0;
  const other = sales - result.foodCost - result.beverageCost - result.netIncome;
  const total = loss ? sales - result.netIncome : sales;
  const slices = [
    { label: "Food cost", value: result.foodCost, color: "var(--text)" },
    { label: "Beverage cost", value: result.beverageCost, color: "var(--alert)" },
    { label: "Other costs & tax", value: other, color: "var(--card-contrast)" },
    ...(!loss ? [{ label: "Net income", value: result.netIncome, color: "var(--primary)" }] : []),
  ];
  let offset = 0;
  return <><div className="donut-wrap"><svg viewBox="0 0 220 220" role="img" aria-label={loss ? "Cost composition. Values are listed below." : "Sales allocation. Values are listed below."}><circle cx="110" cy="110" r="78" fill="none" className="donut-track" strokeWidth="28" />{slices.map(s => { const length = total > 0 ? Math.max(0,s.value) / total * 490.088 : 0; const start = offset; offset += length; return <circle key={s.label} cx="110" cy="110" r="78" fill="none" stroke={s.color} strokeWidth="28" strokeDasharray={Math.max(0,length-2) + " " + (490.088-Math.max(0,length-2))} strokeDashoffset={-start} transform="rotate(-90 110 110)" />; })}<text x="110" y="103" textAnchor="middle" className="donut-small">{loss ? "TOTAL COSTS" : "TOTAL SALES"}</text><text x="110" y="129" textAnchor="middle" className="donut-total">{money(total/1000000,2)}m</text></svg></div><ul className="chart-legend">{slices.map((s,i) => <li key={s.label}><span className={"legend-dot dot-" + i} /><span>{s.label}</span><strong>{percent(ratio(s.value,total))}</strong></li>)}</ul><p className="small muted">Other costs include expenses, interest, and tax from the printed report.{loss && " This ring shows costs; the net loss is shown above."}</p></>;
}
export default function ResultsView({ state, teamId, professor = false }: { state: Workspace; teamId: number; professor?: boolean }) {
  const available = state.rounds.filter(q => q.releasedAt || professor && q.status === "imported").map(q => q.roundNumber).sort((a,b) => a-b);
  const [selected, setSelected] = useState(available.at(-1) || 2);
  const q = available.includes(selected) ? selected : available.at(-1) || 2;
  const [metricKey, setMetric] = useState<Metric>("netIncome");
  const [detail, setDetail] = useState("financial");
  const results = state.results.filter(r => r.roundNumber === q);
  const r = results.find(r => r.teamId === teamId);
  const history = state.results.filter(r => r.teamId === teamId && available.includes(r.roundNumber)).sort((a,b) => a.roundNumber-b.roundNumber);
  const previous = history.filter(r => r.roundNumber < q).at(-1);
  const sales = r ? totalSales(r) : 0;
  function exportCsv() {
    const rows = ["Quarter,Firm,Food sales,Beverage sales,Food cost,Beverage cost,Operating profit,Net income,Food orders,Avg daily customers", ...results.filter(r => professor || r.teamId === teamId).map(r => [r.roundNumber,r.teamId,r.foodSales,r.beverageSales,r.foodCost,r.beverageCost,r.operatingProfit,r.netIncome,r.foodOrders,r.avgDailyCustomerCount].join(","))];
    download("scrumptious-q"+q+"-results.csv",rows.join("\r\n"),"text/csv");
  }
  return <><PageTitle eyebrow={professor ? "THE CLASS / PERFORMANCE" : "YOUR RESTAURANT / PERFORMANCE"} title={professor ? "A view across the table." : "See what your strategy served."} description="Actual results from the supplied FORTRAN reports. Ratios are calculated from the printed values." action={<div className="button-row"><label className="select-label"><span className="sr-only">Results quarter</span><select aria-label="Results quarter" value={q} onChange={e => setSelected(Number(e.target.value))}>{available.map(n => <option key={n} value={n}>Q{n}{n===1 ? " · Baseline" : ""}</option>)}</select></label><button className="button secondary" onClick={exportCsv}><Download size={16} />Export CSV</button></div>} />
    {!r ? <div className="empty-state"><h2>No released results yet.</h2><p>Your professor will release the results after importing FR.LST.</p></div> : <>
    <div className="results-meta"><Badge>Q{q} {q === 1 ? "baseline" : "results"}</Badge><span className="small muted">{professor ? results.length + " firms in market ME" : "Firm " + teamId + " · market ME"} · {state.rounds.find(v => v.roundNumber === q)?.releasedAt ? "Released" : "Imported · awaiting release"}</span></div>
    <div className="stats-grid"><Stat label={professor ? "Class total sales" : "Total sales"} value={money(professor ? results.reduce((s,r) => s+totalSales(r),0) : sales)} hint={professor ? "All five firms" : previous ? "Previous quarter " + money(totalSales(previous)) : "Starting baseline"} /><Stat label={professor ? "Class net income" : "Net income"} value={money(professor ? results.reduce((s,r) => s+r.netIncome,0) : r.netIncome)} hint="After expenses and tax" /><Stat label="Net margin" value={percent(professor ? ratio(results.reduce((s,r) => s+r.netIncome,0),results.reduce((s,r) => s+totalSales(r),0)) : ratio(r.netIncome,sales))} hint="Net income ÷ total sales" /><Stat label={professor ? "Firms with a loss" : "Food cost"} value={professor ? String(results.filter(r => r.netIncome<0).length) + " / 5" : percent(ratio(r.foodCost,r.foodSales))} hint={professor ? "Negative net income" : "Food cost ÷ food sales"} /></div>
    <div className="results-grid"><section className="panel"><div className="panel-heading"><div><h2>{professor ? "Compare teams" : "Your progress by quarter"}</h2><p className="small muted">{professor ? "Same market. Different strategies." : "Released quarters only. Q1 is the starting baseline."}</p></div><select aria-label="Chart metric" value={metricKey} onChange={e => setMetric(e.target.value as Metric)}>{Object.entries(labels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div><Bars title={labels[metricKey]} percentage={["netMargin","foodCostPct"].includes(metricKey)} data={(professor ? results : history.filter(r => r.roundNumber<=q)).map(r => ({label:professor ? "Firm "+r.teamId : "Q"+r.roundNumber,value:metric(r,metricKey)}))} /></section><section className="panel allocation"><h2>{professor ? "Selected firm · " + teamId : r.netIncome<0 ? "Cost composition" : "Where sales went"}</h2><Donut result={r} /></section></div>
    {professor ? <section className="panel"><div className="panel-heading"><h2>All firms, one quarter</h2><span className="small muted">Q{q}</span></div><div className="table-scroll"><table><thead><tr><th>Firm</th><th>Total sales</th><th>Net income</th><th>Net margin</th><th>Food cost %</th></tr></thead><tbody>{results.map(v => <tr key={v.teamId}><td>Firm {v.teamId}{v.teamId===teamId ? <span className="small muted"> · selected</span> : ""}</td><td>{money(totalSales(v))}</td><td>{money(v.netIncome)}</td><td>{percent(ratio(v.netIncome,totalSales(v)))}</td><td>{percent(ratio(v.foodCost,v.foodSales))}</td></tr>)}</tbody></table></div></section> : <section className="panel"><div className="panel-heading"><div className="inline-tabs"><button className={detail==="financial" ? "active" : ""} onClick={() => setDetail("financial")}>Financial overview</button><button className={detail==="menu" ? "active" : ""} onClick={() => setDetail("menu")}>Menu performance</button></div><ArrowUpRight size={18} /></div>{detail==="menu" ? <div className="table-scroll"><table><thead><tr><th>Selection</th><th>Preparation</th><th>Orders sold</th><th>Sales</th><th>COGS %</th></tr></thead><tbody>{r.menu.map(v => <tr key={v.lineNumber}><td>{v.itemName}</td><td>{v.prepName}</td><td>{number(v.ordersSold)}</td><td>{money(v.totalSales)}</td><td>{percent(v.costOfGoodsSoldPct)}</td></tr>)}</tbody></table></div> : <div className="financial-grid"><dl className="summary-list">{[["Food sales",money(r.foodSales)],["Beverage sales",money(r.beverageSales)],["Food cost",money(r.foodCost)],["Beverage cost",money(r.beverageCost)]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><dl className="summary-list">{[["Operating profit",money(r.operatingProfit)],["Net income",money(r.netIncome)],["Food orders",number(r.foodOrders)],["Average daily customers",number(r.avgDailyCustomerCount)]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></div>}</section>}
    </>}
  </>;
}
