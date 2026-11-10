-- PROPOSED DOMAIN MODEL. This file is not an applied migration.
-- The running prototype uses drizzle/0000_rare_brood.sql and one atomic
-- D1 workspace snapshot. Review this model with the database owner first.
-- Single simulation, one market (ME), firms 1-5; add SimulationID for cohorts.
PRAGMA foreign_keys = ON;
CREATE TABLE Team (
  TeamID INTEGER PRIMARY KEY,
  TeamName TEXT NOT NULL,
  FirmNumber INTEGER NOT NULL UNIQUE CHECK (FirmNumber BETWEEN 1 AND 5)
);
CREATE TABLE AppUser (
  UserID INTEGER PRIMARY KEY,
  AuthSubject TEXT NOT NULL UNIQUE,
  Email TEXT NOT NULL,
  Name TEXT NOT NULL,
  Role TEXT NOT NULL CHECK (Role IN ('student', 'professor')),
  TeamID INTEGER REFERENCES Team(TeamID),
  CHECK ((Role = 'student' AND TeamID IS NOT NULL) OR (Role = 'professor' AND TeamID IS NULL))
);
CREATE TABLE SimulationRound (
  RoundNumber INTEGER PRIMARY KEY CHECK (RoundNumber BETWEEN 1 AND 7),
  Status TEXT NOT NULL CHECK (Status IN ('baseline', 'open', 'locked', 'imported', 'released')),
  ReleasedAt TEXT,
  ImportHash TEXT,
  CHECK (Status != 'released' OR ReleasedAt IS NOT NULL)
);
CREATE TABLE RoundDecision (
  TeamID INTEGER NOT NULL REFERENCES Team(TeamID),
  RoundNumber INTEGER NOT NULL REFERENCES SimulationRound(RoundNumber),
  SubmittedAt TEXT,
  StaffPerDay NUMERIC CHECK (StaffPerDay >= 0),
  HourlyCompensation NUMERIC CHECK (HourlyCompensation >= 0),
  AmenitiesPerOrder NUMERIC CHECK (AmenitiesPerOrder >= 0),
  EntertainmentBudget INTEGER CHECK (EntertainmentBudget >= 0),
  MaintenanceBudget INTEGER CHECK (MaintenanceBudget >= 0),
  -- Keep raw positions until report-name mapping is confirmed.
  ReportFlag1 INTEGER CHECK (ReportFlag1 IN (0, 1)),
  ReportFlag2 INTEGER CHECK (ReportFlag2 IN (0, 1)),
  ReportFlag3 INTEGER CHECK (ReportFlag3 IN (0, 1)),
  TimeDepositChange INTEGER,
  CertificateOfDepositChange INTEGER,
  NotePayableChange INTEGER,
  PRIMARY KEY (TeamID, RoundNumber)
);
CREATE TABLE MenuItem (
  MenuItemID INTEGER PRIMARY KEY,
  ItemName TEXT NOT NULL UNIQUE,
  OrderSizeUnit TEXT NOT NULL CHECK (OrderSizeUnit IN ('Gm.', 'Cl.'))
);
CREATE TABLE MenuItemDecision (
  TeamID INTEGER NOT NULL,
  RoundNumber INTEGER NOT NULL,
  LineNumber INTEGER NOT NULL CHECK (LineNumber BETWEEN 1 AND 8),
  MenuItemID INTEGER NOT NULL REFERENCES MenuItem(MenuItemID),
  PrepLevel INTEGER NOT NULL CHECK (PrepLevel BETWEEN 1 AND 3),
  OrderSize NUMERIC CHECK (OrderSize >= 0),
  InternalPromotion INTEGER CHECK (InternalPromotion >= 0),
  SalesPrice NUMERIC CHECK (SalesPrice >= 0),
  PRIMARY KEY (TeamID, RoundNumber, LineNumber),
  FOREIGN KEY (TeamID, RoundNumber) REFERENCES RoundDecision(TeamID, RoundNumber) ON DELETE CASCADE
);
CREATE TABLE RoundResult (
  TeamID INTEGER NOT NULL REFERENCES Team(TeamID),
  RoundNumber INTEGER NOT NULL REFERENCES SimulationRound(RoundNumber),
  FoodSales NUMERIC NOT NULL,
  BeverageSales NUMERIC NOT NULL,
  FoodCost NUMERIC NOT NULL,
  BeverageCost NUMERIC NOT NULL,
  OperatingProfit NUMERIC NOT NULL,
  NetIncome NUMERIC NOT NULL,
  FoodOrders INTEGER NOT NULL,
  AvgDailyCustomerCount INTEGER NOT NULL,
  PRIMARY KEY (TeamID, RoundNumber)
);
CREATE TABLE MenuItemResult (
  TeamID INTEGER NOT NULL,
  RoundNumber INTEGER NOT NULL,
  LineNumber INTEGER NOT NULL CHECK (LineNumber BETWEEN 1 AND 8),
  MenuItemID INTEGER NOT NULL REFERENCES MenuItem(MenuItemID),
  PrepName TEXT NOT NULL,
  SalesPrice NUMERIC NOT NULL,
  OrderSize NUMERIC NOT NULL,
  InternalPromotion NUMERIC NOT NULL,
  CostOfGoodsSoldPct NUMERIC NOT NULL,
  OrdersSold INTEGER NOT NULL,
  TotalSales NUMERIC NOT NULL,
  PRIMARY KEY (TeamID, RoundNumber, LineNumber),
  FOREIGN KEY (TeamID, RoundNumber) REFERENCES RoundResult(TeamID, RoundNumber) ON DELETE CASCADE
);
