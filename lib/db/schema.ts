import { pgTable, text, timestamp, real, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk User ID
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  originalUrl: text('original_url').notNull(),
  watermarkedUrl: text('watermarked_url'),
  pHash: text('p_hash'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const detections = pgTable('detections', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  infringingUrl: text('infringing_url').notNull(),
  matchScore: real('match_score').notNull(),
  status: text('status', { enum: ['UNAUTHORIZED', 'REVIEWING', 'LICENSED', 'RESOLVED'] }).default('UNAUTHORIZED').notNull(),
  screenshotUrl: text('screenshot_url'),
  takedownDraft: text('takedown_draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const takedownNotices = pgTable('takedown_notices', {
  id: uuid('id').primaryKey().defaultRandom(),
  detectionId: uuid('detection_id').notNull().references(() => detections.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  draftText: text('draft_text').notNull(),
  sentAt: timestamp('sent_at'),
  status: text('status', { enum: ['DRAFT', 'SENT'] }).default('DRAFT').notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assets: many(assets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  user: one(users, {
    fields: [assets.userId],
    references: [users.id],
  }),
  detections: many(detections),
}));

export const detectionsRelations = relations(detections, ({ one, many }) => ({
  asset: one(assets, {
    fields: [detections.assetId],
    references: [assets.id],
  }),
  takedowns: many(takedownNotices),
}));

export const takedownNoticesRelations = relations(takedownNotices, ({ one }) => ({
  detection: one(detections, {
    fields: [takedownNotices.detectionId],
    references: [detections.id],
  }),
}));
