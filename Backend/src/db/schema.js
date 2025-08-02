import { text, jsonb } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Vaults with file_tree JSONB and simplified sharing
export const vaults = pgTable('vaults', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  owner_id: text('owner_id').notNull(), // Clerk user_id
  name: text('name').notNull(),
  file_tree: jsonb('file_tree').notNull().default([]), // Full hierarchy
  share_mode: text('share_mode', { enum: ['private', 'view', 'edit'] }).default('private'), // Simplified sharing
  share_token: text('share_token').unique(), // Only for share_mode != 'private'
});

// Files (flat storage, referenced by file_tree)
export const files = pgTable('files', {
  id: text('id').primaryKey().$defaultFn(() => createId()), // Matches IDs in file_tree
  vault_id: text('vault_id').references(() => vaults.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  content: text('content'), 
});