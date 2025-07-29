import { integer } from 'drizzle-orm/gel-core';
import { pgTable, serial, text, jsonb } from 'drizzle-orm/pg-core';

// Vaults with file_tree JSONB and simplified sharing
export const vaults = pgTable('vaults', {
  id: serial('id').primaryKey(),
  owner_id: text('owner_id').notNull(), // Clerk user_id
  name: text('name').notNull(),
  file_tree: jsonb('file_tree').notNull().default([]), // Full hierarchy
  share_mode: text('share_mode', { enum: ['private', 'view', 'edit'] }).default('private'), // Simplified sharing
  share_token: text('share_token').unique(), // Only for share_mode != 'private'
});

// Files (flat storage, referenced by file_tree)
export const files = pgTable('files', {
  id: serial('id').primaryKey(), // Matches IDs in file_tree
  vault_id: integer('vault_id').references(() => vaults.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  content: text('content'), 
});