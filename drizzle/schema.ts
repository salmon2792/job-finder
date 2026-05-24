import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Jobs table stores job listings with experience level filtering.
 * Each job is associated with a user (owner).
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  description: text("description"),
  experienceYearsMin: int("experienceYearsMin").notNull(),
  experienceYearsMax: int("experienceYearsMax").notNull(),
  salary: varchar("salary", { length: 255 }),
  jobUrl: varchar("jobUrl", { length: 2048 }),
  source: varchar("source", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * Skills table stores user's personal skills.
 * Each skill belongs to a user (owner).
 */
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  proficiency: mysqlEnum("proficiency", ["beginner", "intermediate", "advanced", "expert"]).default("intermediate").notNull(),
  yearsOfExperience: decimal("yearsOfExperience", { precision: 3, scale: 1 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

/**
 * Bookmarks table stores user's bookmarked jobs.
 * Each bookmark links a user to a job.
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobId: int("jobId").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

/**
 * Scheduled messages table stores daily job reports/messages.
 * Each message is associated with a user and contains job listings.
 */
export const scheduledMessages = mysqlTable("scheduledMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reportDate: timestamp("reportDate").notNull(),
  messageContent: text("messageContent").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "archived"]).default("pending").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
});

export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type InsertScheduledMessage = typeof scheduledMessages.$inferInsert;

/**
 * Job imports table tracks which jobs were imported from which messages.
 * Allows users to see the source of each job and bulk import from messages.
 */
export const jobImports = mysqlTable("jobImports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  messageId: int("messageId").notNull(),
  jobId: int("jobId").notNull(),
  matchScore: varchar("matchScore", { length: 50 }),
  tier: varchar("tier", { length: 50 }),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
});

export type JobImport = typeof jobImports.$inferSelect;
export type InsertJobImport = typeof jobImports.$inferInsert;

/**
 * Relations for Drizzle ORM
 */
export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
  skills: many(skills),
  bookmarks: many(bookmarks),
  scheduledMessages: many(scheduledMessages),
  jobImports: many(jobImports),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
  bookmarks: many(bookmarks),
  jobImports: many(jobImports),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  user: one(users, {
    fields: [skills.userId],
    references: [users.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [bookmarks.jobId],
    references: [jobs.id],
  }),
}));

export const scheduledMessagesRelations = relations(scheduledMessages, ({ one, many }) => ({
  user: one(users, {
    fields: [scheduledMessages.userId],
    references: [users.id],
  }),
  jobImports: many(jobImports),
}));

export const jobImportsRelations = relations(jobImports, ({ one }) => ({
  user: one(users, {
    fields: [jobImports.userId],
    references: [users.id],
  }),
  message: one(scheduledMessages, {
    fields: [jobImports.messageId],
    references: [scheduledMessages.id],
  }),
  job: one(jobs, {
    fields: [jobImports.jobId],
    references: [jobs.id],
  }),
}));
