import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { parse as parseCookie } from "cookie";
import { createHeartbeatJob } from "./_core/heartbeat";
import { eq } from "drizzle-orm";
import { scheduledMessages } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Jobs router - owner-only access
  jobs: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserJobs(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) =>
        db.getJobById(input.id, ctx.user.id)
      ),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          company: z.string().min(1),
          location: z.string().min(1),
          description: z.string().optional(),
          experienceYearsMin: z.number().int().min(0),
          experienceYearsMax: z.number().int().min(0),
          salary: z.string().optional(),
          jobUrl: z.string().url().optional(),
          source: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createJob(ctx.user.id, input)
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          company: z.string().min(1).optional(),
          location: z.string().min(1).optional(),
          description: z.string().optional(),
          experienceYearsMin: z.number().int().min(0).optional(),
          experienceYearsMax: z.number().int().min(0).optional(),
          salary: z.string().optional(),
          jobUrl: z.string().url().optional(),
          source: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        const updated = await db.updateJob(id, ctx.user.id, updateData);
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
        }
        return updated;
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await db.deleteJob(input.id, ctx.user.id);
        if (!deleted) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
        }
        return { success: true };
      }),
  }),

  // Skills router - owner-only access
  skills: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserSkills(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) =>
        db.getSkillById(input.id, ctx.user.id)
      ),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
          yearsOfExperience: z.number().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createSkill(ctx.user.id, input as any)
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
          yearsOfExperience: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        const updated = await db.updateSkill(id, ctx.user.id, updateData as any);
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
        }
        return updated;
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await db.deleteSkill(input.id, ctx.user.id);
        if (!deleted) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
        }
        return { success: true };
      }),
  }),

  // Bookmarks router - owner-only access
  bookmarks: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserBookmarks(ctx.user.id)
    ),
    isBookmarked: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(({ ctx, input }) =>
        db.isJobBookmarked(input.jobId, ctx.user.id)
      ),
    add: protectedProcedure
      .input(
        z.object({
          jobId: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await db.addBookmark(input.jobId, ctx.user.id, input.notes);
        } catch (error) {
          if (error instanceof Error && error.message.includes("already bookmarked")) {
            throw new TRPCError({ code: "CONFLICT", message: "Job already bookmarked" });
          }
          throw error;
        }
      }),
    remove: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const removed = await db.removeBookmark(input.jobId, ctx.user.id);
        if (!removed) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bookmark not found" });
        }
        return { success: true };
      }),
    updateNotes: protectedProcedure
      .input(
        z.object({
          jobId: z.number(),
          notes: z.string().nullable(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.updateBookmarkNotes(input.jobId, ctx.user.id, input.notes)
      ),
  }),

  messages: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserMessages(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          reportDate: z.date(),
          messageContent: z.string().min(1),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createScheduledMessage(ctx.user.id, input)
      ),
    updateStatus: protectedProcedure
      .input(
        z.object({
          messageId: z.number(),
          status: z.enum(["pending", "sent", "archived"]),
        })
      )
      .mutation(({ ctx, input }) =>
        db.updateMessageStatus(input.messageId, ctx.user.id, input.status)
      ),
    scheduleDaily: protectedProcedure
      .input(
        z.object({
          messageId: z.number(),
          cron: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
        const job = await createHeartbeatJob({
          name: `job-msg-${input.messageId}-${Date.now()}`,
          cron: input.cron,
          path: "/api/scheduled/deliverJobs",
          payload: {},
          description: input.description || `Daily job message delivery`,
        }, sessionToken);
        
        // Persist the taskUid to the database for later lookup
        const dbInstance = await db.getDb();
        if (dbInstance) {
          await dbInstance
            .update(scheduledMessages)
            .set({ scheduleCronTaskUid: job.taskUid })
            .where(eq(scheduledMessages.id, input.messageId));
        }
        
        return { taskUid: job.taskUid, nextExecutionAt: job.nextExecutionAt };
      }),
  }),

  imports: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserJobImports(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          messageId: z.number(),
          jobId: z.number(),
          matchScore: z.string().optional(),
          tier: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createJobImport(ctx.user.id, input)
      ),
  }),
});

export type AppRouter = typeof appRouter;
