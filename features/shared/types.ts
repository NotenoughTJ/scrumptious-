export type MenuRow = {
  lineNumber: number; itemName: string; prepLevel: number;
  orderSize: number | null; internalPromotion: number | null; salesPrice: number | null;
};
export type Decision = {
  teamId: number; roundNumber: number; submittedAt: string | null; menu: MenuRow[];
  staffPerDay: number | null; hourlyCompensation: number | null;
  amenitiesPerOrder: number | null; entertainmentBudget: number | null; maintenanceBudget: number | null;
  reportFlags: number[];
  timeDepositChange: number | null; certificateOfDepositChange: number | null; notePayableChange: number | null;
};
export type MenuResult = {
  lineNumber: number; itemName: string; salesPrice: number; prepName: string; orderSize: number;
  internalPromotion: number; costOfGoodsSoldPct: number; ordersSold: number; totalSales: number;
};
export type Result = {
  teamId: number; roundNumber: number; foodSales: number; beverageSales: number;
  foodCost: number; beverageCost: number; operatingProfit: number; netIncome: number;
  foodOrders: number; avgDailyCustomerCount: number; menu: MenuResult[];
};
export type Team = { id: number; name: string; firmNumber: number };
export type Round = {
  roundNumber: number; status: "baseline" | "open" | "locked" | "imported" | "released";
  releasedAt: string | null; importHash: string | null;
};
export type Owner = { name: string; area: string; branch: string; scope: string };
export type ArchitectureDecision = {
  id: string; title: string; rationale: string; consequence: string; status: "Proposed" | "Accepted";
};
export type Studio = {
  title: string; projectNote: string; owners: Owner[]; architecture: ArchitectureDecision[];
  colors: { primary: string; text: string; card: string; alert: string; background: string };
};
export type Workspace = {
  revision: number; teams: Team[]; rounds: Round[]; decisions: Decision[]; results: Result[]; studio: Studio;
};
export type Action =
  | { kind: "saveDecision"; decision: Decision }
  | { kind: "submit"; teamId: number; roundNumber: number }
  | { kind: "reopen"; teamId: number; roundNumber: number }
  | { kind: "lock"; roundNumber: number }
  | { kind: "unlock"; roundNumber: number }
  | { kind: "import"; roundNumber: number; text: string }
  | { kind: "release"; roundNumber: number }
  | { kind: "saveStudio"; studio: Studio };
