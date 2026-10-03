// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', { code: text('code').primaryKey(), state: text('state').notNull(), version: integer('version').notNull().default(0), expires: integer('expires').notNull() });

export const classroom = sqliteTable('classroom', { id: integer('id').primaryKey(), opened: integer('opened').notNull().default(1), revision: integer('revision').notNull().default(0), lastCreated: integer('last_created').notNull().default(0) });
