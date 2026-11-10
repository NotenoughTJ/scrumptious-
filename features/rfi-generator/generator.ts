import type { Decision } from "../shared/types";
import { ITEMS, validationErrors } from "../student-decisions/validation";

function textCell(line: string, start: number, end: number, value: string) {
  if (line.slice(start, end).trim() === value) return line;
  if (value.length > end - start) throw new Error("A text value exceeds its fixed-width field.");
  return line.slice(0, start) + value.padEnd(end - start) + line.slice(end);
}
function numberCell(line: string, start: number, end: number, value: number, decimals: number) {
  if (Number(line.slice(start, end).trim()) === value) return line;
  const formatted = value.toFixed(decimals);
  if (formatted.length > end - start) throw new Error("A number exceeds its fixed-width field.");
  return line.slice(0, start) + formatted.padStart(end - start) + line.slice(end);
}
export function generateRfi(d: Decision, template: string) {
  if (Object.keys(validationErrors(d)).length) throw new Error("Complete and validate every decision before generating RFI.");
  const newline = template.includes("\r\n") ? "\r\n" : "\n";
  const lines = template.split(newline);
  if (!lines[3]?.includes("Firm " + d.teamId)) throw new Error("The RFI template belongs to a different firm.");
  const ops = lines.findIndex(l => l.startsWith("Operations"));
  const finance = lines.findIndex(l => l.startsWith("Finance"));
  if (ops < 0 || finance < 0 || lines.length < 23) throw new Error("Unsupported RFI template.");
  for (let slot = 1; slot <= 8; slot++) {
    const r = d.menu.find(row => row.lineNumber === slot);
    const original = lines[3 + slot];
    if (!r) {
      if (original.slice(0, 32).trim()) lines[3 + slot] = " ".repeat(88) + "0.000";
      continue;
    }
    let line = original.padEnd(103, " ");
    if (!original.slice(0, 32).trim()) line = " ".repeat(88) + "0.000         0";
    line = textCell(line, 0, 32, r.itemName);
    line = textCell(line, 32, 50, ITEMS[r.itemName][r.prepLevel - 1]);
    line = numberCell(line, 50, 53, r.prepLevel, 0);
    line = numberCell(line, 53, 63, r.orderSize!, 1);
    line = numberCell(line, 63, 73, r.internalPromotion!, 0);
    line = numberCell(line, 73, 83, r.salesPrice!, 2);
    lines[3 + slot] = line;
  }
  const values = [d.staffPerDay!, d.hourlyCompensation!, d.amenitiesPerOrder!, d.entertainmentBudget!, d.maintenanceBudget!, ...d.reportFlags];
  const decimals = [1, 2, 2, 0, 0, 0, 0, 0];
  values.forEach((v, i) => { lines[ops] = numberCell(lines[ops], 43 + i * 10, 53 + i * 10, v, decimals[i]); });
  [d.timeDepositChange!, d.certificateOfDepositChange!, d.notePayableChange!].forEach((v, i) => {
    lines[finance] = numberCell(lines[finance], 43 + i * 10, 53 + i * 10, v, 0);
  });
  return lines.join(newline);
}
