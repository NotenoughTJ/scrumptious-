import type { Decision } from "../shared/types";

export const ITEMS: Record<string, string[]> = {
  STEAK: ["Burger", "Sirloin", "Filet"], "ROAST BEEF": ["Sandwich", "Sirloin", "Rib Eye"],
  CHICKEN: ["Fingers", "Breast", "Game Hen"], VEAL: ["Pattie", "Cutlet", "Chop"],
  PASTA: ["Domestic", "Imported", "Fresh"], "FIN FISH": ["Portion", "Fresh", "Imported"],
  SHRIMP: ["Breaded", "Fresh", "Jumbo"], "SALAD BOWL": ["Prepack", "Self Sv", "Gourmet"],
  PORK: ["BBQ", "Ribs", "Loin"], PIZZA: ["Frozen", "Fresh", "Gourmet"],
  BEER: ["Popular", "Premium", "Imported"], SPIRITS: ["Well", "Top Shf", "Premium"],
  WINE: ["House", "Domestic", "Imported"],
};
export const sections = ["Menu", "Staffing", "Amenities & upkeep", "Management info"];
const numericFields: (keyof Decision)[][] = [
  [], ["staffPerDay", "hourlyCompensation"],
  ["amenitiesPerOrder", "entertainmentBudget", "maintenanceBudget"],
  ["timeDepositChange", "certificateOfDepositChange", "notePayableChange"],
];
export function validationErrors(d: Decision): Record<string, string> {
  const errors: Record<string, string> = {};
  const check = (key: string, value: unknown, max: number, decimals: number, signed = false) => {
    if (typeof value !== "number" || !Number.isFinite(value)) errors[key] = "Enter a number.";
    else if ((!signed && value < 0) || Math.abs(value) > max) errors[key] = "Value does not fit the legacy field.";
    else if (Math.abs(value * 10 ** decimals - Math.round(value * 10 ** decimals)) > 0.00001) errors[key] = "Use at most " + decimals + " decimal places.";
  };
  if (d.menu.length < 1 || d.menu.length > 8) errors.menu = "Choose between 1 and 8 menu selections.";
  const seen = new Set<number>();
  d.menu.forEach((r, i) => {
    const p = "menu." + i + ".";
    if (!Number.isInteger(r.lineNumber) || r.lineNumber < 1 || r.lineNumber > 8 || seen.has(r.lineNumber)) errors[p + "lineNumber"] = "Menu line numbers must be unique, from 1 to 8.";
    seen.add(r.lineNumber);
    if (!ITEMS[r.itemName]) errors[p + "itemName"] = "Choose an available menu item.";
    if (![1, 2, 3].includes(r.prepLevel)) errors[p + "prepLevel"] = "Choose preparation level 1, 2 or 3.";
    check(p + "orderSize", r.orderSize, 99999999.9, 1);
    check(p + "internalPromotion", r.internalPromotion, 9999999999, 0);
    check(p + "salesPrice", r.salesPrice, 9999999.99, 2);
  });
  check("staffPerDay", d.staffPerDay, 999999.9, 1);
  check("hourlyCompensation", d.hourlyCompensation, 9999999.99, 2);
  check("amenitiesPerOrder", d.amenitiesPerOrder, 9999999.99, 2);
  check("entertainmentBudget", d.entertainmentBudget, 9999999999, 0);
  check("maintenanceBudget", d.maintenanceBudget, 9999999999, 0);
  ["timeDepositChange", "certificateOfDepositChange", "notePayableChange"].forEach(k => check(k, d[k as keyof Decision], 999999999, 0, true));
  if (d.reportFlags.length !== 3 || !d.reportFlags.every(v => v === 0 || v === 1)) errors.reportFlags = "Each legacy report flag must be 0 or 1.";
  return errors;
}
export function sectionErrors(d: Decision, section: number) {
  const errors = validationErrors(d);
  return Object.entries(errors).filter(([k]) => section === 0 ? k === "menu" || k.startsWith("menu.") : numericFields[section].includes(k as keyof Decision) || (section === 3 && k === "reportFlags"));
}
