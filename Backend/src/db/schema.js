import { text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Vaults with file_tree JSONB and simplified sharing
export const vaults = pgTable('vaults', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  owner_id: text('owner_id').notNull(), // Clerk user_id
  name: text('name').notNull(),
  file_tree: jsonb('file_tree').notNull().default([]), // Full cached hierarchy
  share_mode: text('share_mode', { enum: ['private', 'view', 'edit'] }).default('private'), // Simplified sharing
  share_token: text('share_token').unique(), // Only for share_mode != 'private'
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const folders = pgTable('folders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  vault_id: text('vault_id').references(() => vaults.id, { onDelete: 'cascade' }), // Required for root folders
  parent_id: text('parent_id').references(() => folders.id, { onDelete: 'cascade' }), // Nullable (root if null)
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const files = pgTable('files', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  vault_id: text('vault_id').references(() => vaults.id, { onDelete: 'cascade' }),
  folder_id: text('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  content: text('content'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});