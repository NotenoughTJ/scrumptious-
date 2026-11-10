import type { Result, MenuResult } from "../shared/types";

// Values come from the printed report. The FORTRAN engine stays external.
export function parseFrlst(text: string, expectedRound?: number): Result[] {
  if (text.length > 2000000) throw new Error("Use an FR.LST file smaller than 2 MB.");
  const header = /^\s*Firm\s+(\d+)\s+.*\bPeriod\s+(\d+)\s*$/gm;
  const matches = [...text.matchAll(header)];
  if (!matches.length) throw new Error("No firm report headers were found. Upload the original FR.LST text file.");
  const results: Result[] = [];
  for (let i = 0; i < matches.length; i++) {
    const teamId = Number(matches[i][1]);
    const roundNumber = Number(matches[i][2]);
    if (expectedRound !== undefined && roundNumber !== expectedRound) throw new Error("This file is for Q" + roundNumber + ", not Q" + expectedRound + ".");
    const block = text.slice(matches[i].index, matches[i + 1]?.index ?? text.length);
    // Purchased guest/product reports repeat firm headers but are not income statements.
    if (!/^\s*SALES[ \t]+\*/m.test(block)) continue;
    if (results.some(r => r.teamId === teamId)) throw new Error("The file contains a duplicate firm income statement.");
    const metric = (label: string) => {
      const m = block.match(new RegExp("^\\s*" + label + "\\s+(-?\\d+(?:\\.\\d*)?)", "mi"));
      if (!m) throw new Error("Firm " + teamId + " is missing " + label + ".");
      const value = Number(m[1]);
      if (!Number.isFinite(value)) throw new Error("An imported metric is invalid.");
      return value;
    };
    const statsLine = block.match(/Employees[^\n]*\r?\n[^\n]*\r?\n([^\r\n]+)/);
    const stats = statsLine?.[1].trim().split(/\s+/).map(Number);
    if (!stats || stats.length !== 7 || stats.some(v => !Number.isFinite(v))) throw new Error("Firm " + teamId + " is missing customer activity statistics.");
    const menu: MenuResult[] = [];
    const menuStart = block.search(/^\s*Selection[ \t]+Sales[ \t]+Purchase/m);
    if (menuStart < 0) throw new Error("Firm " + teamId + " is missing its menu report.");
    const menuSection = block.slice(menuStart).split(/^\s*Firm[ \t]+\d+[ \t]+==/m)[0];
    const menuPattern = /^\s{3,}([A-Z][A-Z ]*?)\s+(-?\d+(?:\.\d*)?)\s+(.+?)\s+(-?\d+(?:\.\d*)?)\s+(?:Gm\.|Cl\.)\s+(-?\d+(?:\.\d*)?)\s+(-?\d+(?:\.\d*)?)\s+\S+\s+(-?\d+(?:\.\d*)?)\s*%\s+(-?\d+(?:\.\d*)?)\s+(-?\d+(?:\.\d*)?)\s*$/gm;
    for (const row of menuSection.matchAll(menuPattern)) {
      menu.push({ lineNumber: menu.length + 1, itemName: row[1].trim(), salesPrice: Number(row[2]), prepName: row[3].trim(), orderSize: Number(row[4]), internalPromotion: Number(row[5]), costOfGoodsSoldPct: Number(row[7]), ordersSold: Number(row[8]), totalSales: Number(row[9]) });
    }
    const menuLines = menuSection.split(/\r?\n/).filter(line => /^\s{3,}[A-Z][A-Z ]*?\s+/.test(line) && /\b(?:Gm\.|Cl\.)/.test(line));
    if (menuLines.length !== menu.length) throw new Error("Firm " + teamId + " has an unreadable menu row. Nothing was imported.");
    if (!menu.length || menu.length > 8) throw new Error("Firm " + teamId + " has an incomplete or unsupported menu report.");
    const r = { teamId, roundNumber, foodSales: metric("Food Sales"), beverageSales: metric("Beverage Sales"), foodCost: metric("Food Cost"), beverageCost: metric("Beverage cost"), operatingProfit: metric("OPERATING PROFIT"), netIncome: metric("NET INCOME or LOSS"), foodOrders: stats[3], avgDailyCustomerCount: stats[6], menu };
    if ([r.foodSales, r.beverageSales, r.foodCost, r.beverageCost, r.foodOrders, r.avgDailyCustomerCount].some(v => v < 0)) throw new Error("Sales, costs and activity cannot be negative.");
    results.push(r);
  }
  if (results.length !== 5 || ![1, 2, 3, 4, 5].every(n => results.some(r => r.teamId === n))) throw new Error("Expected one complete report for each of firms 1 through 5. Nothing was imported.");
  if (new Set(results.map(r => r.roundNumber)).size !== 1) throw new Error("A file must contain exactly one simulation period.");
  return results;
}
