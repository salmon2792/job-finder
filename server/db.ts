import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, jobs, skills, bookmarks, scheduledMessages, jobImports, Job, Skill, Bookmark, ScheduledMessage, JobImport, InsertJob, InsertSkill, InsertBookmark, InsertScheduledMessage, InsertJobImport } from "../drizzle/schema";
import { ENV } from './_core/env';


let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ JOBS QUERIES ============

/**
 * Get all jobs for a user filtered by experience level (1-3 years).
 * Automatically filters to show only jobs matching 1-3 years experience.
 */
export async function getUserJobs(userId: number): Promise<Job[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.userId, userId),
        // Filter for jobs requiring 1-3 years of experience
        lte(jobs.experienceYearsMin, 3),
        gte(jobs.experienceYearsMax, 1)
      )
    );

  return result;
}

/**
 * Get a single job by ID (verify ownership).
 */
export async function getJobById(jobId: number, userId: number): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new job for a user.
 */
export async function createJob(userId: number, jobData: Omit<InsertJob, 'userId'>): Promise<Job> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jobs).values({
    ...jobData,
    userId,
  });

  const jobId = result[0].insertId;
  const newJob = await getJobById(jobId as number, userId);
  if (!newJob) throw new Error("Failed to create job");
  return newJob;
}

/**
 * Update an existing job (verify ownership).
 */
export async function updateJob(
  jobId: number,
  userId: number,
  jobData: Partial<Omit<Job, 'id' | 'userId' | 'createdAt'>>
): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(jobs)
    .set(jobData)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)));

  return getJobById(jobId, userId);
}

/**
 * Delete a job (verify ownership).
 */
export async function deleteJob(jobId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .delete(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)));

  return (result[0].affectedRows ?? 0) > 0;
}

// ============ SKILLS QUERIES ============

/**
 * Get all skills for a user.
 */
export async function getUserSkills(userId: number): Promise<Skill[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(skills)
    .where(eq(skills.userId, userId));

  return result;
}

/**
 * Get a single skill by ID (verify ownership).
 */
export async function getSkillById(skillId: number, userId: number): Promise<Skill | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(skills)
    .where(and(eq(skills.id, skillId), eq(skills.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new skill for a user.
 */
export async function createSkill(userId: number, skillData: Omit<InsertSkill, 'userId'>): Promise<Skill> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(skills).values({
    ...skillData,
    userId,
  });

  const skillId = result[0].insertId;
  const newSkill = await getSkillById(skillId as number, userId);
  if (!newSkill) throw new Error("Failed to create skill");
  return newSkill;
}

/**
 * Update an existing skill (verify ownership).
 */
export async function updateSkill(
  skillId: number,
  userId: number,
  skillData: Partial<Omit<Skill, 'id' | 'userId' | 'createdAt'>>
): Promise<Skill | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(skills)
    .set(skillData)
    .where(and(eq(skills.id, skillId), eq(skills.userId, userId)));

  return getSkillById(skillId, userId);
}

/**
 * Delete a skill (verify ownership).
 */
export async function deleteSkill(skillId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .delete(skills)
    .where(and(eq(skills.id, skillId), eq(skills.userId, userId)));

  return (result[0].affectedRows ?? 0) > 0;
}

// ============ BOOKMARKS QUERIES ============

/**
 * Get all bookmarks for a user (with job details).
 */
export async function getUserBookmarks(userId: number): Promise<(Bookmark & { job?: Job })[]> {
  const db = await getDb();
  if (!db) return [];

  const bookmarkResults = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId));

  // Fetch job details for each bookmark
  const bookmarksWithJobs = await Promise.all(
    bookmarkResults.map(async (bookmark) => {
      const job = await getJobById(bookmark.jobId, userId);
      return { ...bookmark, job };
    })
  );

  return bookmarksWithJobs;
}

/**
 * Check if a job is bookmarked by a user.
 */
export async function isJobBookmarked(jobId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.jobId, jobId), eq(bookmarks.userId, userId)))
    .limit(1);

  return result.length > 0;
}

/**
 * Add a bookmark for a job.
 */
export async function addBookmark(
  jobId: number,
  userId: number,
  notes?: string
): Promise<Bookmark> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already bookmarked
  const existing = await isJobBookmarked(jobId, userId);
  if (existing) throw new Error("Job already bookmarked");

  const result = await db.insert(bookmarks).values({
    jobId,
    userId,
    notes,
  });

  const bookmarkId = result[0].insertId;
  const newBookmark = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.id, bookmarkId as number))
    .limit(1);

  if (newBookmark.length === 0) throw new Error("Failed to create bookmark");
  return newBookmark[0];
}

/**
 * Remove a bookmark.
 */
export async function removeBookmark(jobId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.jobId, jobId), eq(bookmarks.userId, userId)));

  return (result[0].affectedRows ?? 0) > 0;
}

/**
 * Update bookmark notes.
 */
export async function updateBookmarkNotes(
  jobId: number,
  userId: number,
  notes: string | null
): Promise<Bookmark | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(bookmarks)
    .set({ notes })
    .where(and(eq(bookmarks.jobId, jobId), eq(bookmarks.userId, userId)));

  const result = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.jobId, jobId), eq(bookmarks.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ SCHEDULED MESSAGES QUERIES ============

/**
 * Get all scheduled messages for a user.
 */
export async function getUserMessages(userId: number): Promise<ScheduledMessage[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(scheduledMessages)
    .where(eq(scheduledMessages.userId, userId))
    .orderBy(desc(scheduledMessages.reportDate));

  return result;
}

/**
 * Create a new scheduled message for a user.
 */
export async function createScheduledMessage(
  userId: number,
  messageData: Omit<InsertScheduledMessage, 'userId'>
): Promise<ScheduledMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scheduledMessages).values({
    ...messageData,
    userId,
  });

  const messageId = result[0].insertId;
  const newMessage = await db
    .select()
    .from(scheduledMessages)
    .where(eq(scheduledMessages.id, messageId as number))
    .limit(1);

  if (newMessage.length === 0) throw new Error("Failed to create message");
  return newMessage[0];
}

/**
 * Update message status.
 */
export async function updateMessageStatus(
  messageId: number,
  userId: number,
  status: 'pending' | 'sent' | 'archived'
): Promise<ScheduledMessage | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(scheduledMessages)
    .set({ status, sentAt: status === 'sent' ? new Date() : undefined })
    .where(and(eq(scheduledMessages.id, messageId), eq(scheduledMessages.userId, userId)));

  const result = await db
    .select()
    .from(scheduledMessages)
    .where(and(eq(scheduledMessages.id, messageId), eq(scheduledMessages.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ JOB IMPORTS QUERIES ============

/**
 * Get all job imports for a user.
 */
export async function getUserJobImports(userId: number): Promise<(JobImport & { job?: Job })[]> {
  const db = await getDb();
  if (!db) return [];

  const importResults = await db
    .select()
    .from(jobImports)
    .where(eq(jobImports.userId, userId))
    .orderBy(desc(jobImports.importedAt));

  // Fetch job details for each import
  const importsWithJobs = await Promise.all(
    importResults.map(async (imp) => {
      const job = await getJobById(imp.jobId, userId);
      return { ...imp, job };
    })
  );

  return importsWithJobs;
}

/**
 * Create a job import record.
 */
export async function createJobImport(
  userId: number,
  importData: Omit<InsertJobImport, 'userId'>
): Promise<JobImport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jobImports).values({
    ...importData,
    userId,
  });

  const importId = result[0].insertId;
  const newImport = await db
    .select()
    .from(jobImports)
    .where(eq(jobImports.id, importId as number))
    .limit(1);

  if (newImport.length === 0) throw new Error("Failed to create import");
  return newImport[0];
}
