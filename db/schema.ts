import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
// Atomic shared prototype snapshot. Proposed domain model: docs/relational-schema.sql.
export const workspace = sqliteTable("workspace", { id: integer("id").primaryKey(), revision: integer("revision").notNull().default(1), state: text("state").notNull(), updatedAt: text("updated_at").notNull() });
