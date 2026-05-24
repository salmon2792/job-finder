import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: Array<{ name: string; options: Record<string, unknown> }> } {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {
        cookie: `${COOKIE_NAME}=mock-session-token`,
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("messages router", () => {
  it("should return list of messages for user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const messages = await caller.messages.list();

    expect(Array.isArray(messages)).toBe(true);
  });

  it("should create a new scheduled message", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.messages.create({
      title: "CPU Performance Jobs",
      description: "Daily job listings for CPU performance roles",
      reportDate: new Date(),
      messageContent: "Job 1: Senior CPU Performance Engineer at ARM\nJob 2: CPU Architect at Google",
    });

    expect(result).toBeDefined();
    expect(result.title).toBe("CPU Performance Jobs");
    expect(result.status).toBe("pending");
    expect(result.userId).toBe(ctx.user.id);
  });

  it("should update message status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a message first
    const created = await caller.messages.create({
      title: "Test Message",
      reportDate: new Date(),
      messageContent: "Test content",
    });

    // Update status to sent
    const updated = await caller.messages.updateStatus({
      messageId: created.id,
      status: "sent",
    });

    expect(updated?.status).toBe("sent");
    expect(updated?.sentAt).toBeDefined();
  });

  it("should archive a message", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a message first
    const created = await caller.messages.create({
      title: "Test Message",
      reportDate: new Date(),
      messageContent: "Test content",
    });

    // Archive the message
    const archived = await caller.messages.updateStatus({
      messageId: created.id,
      status: "archived",
    });

    expect(archived?.status).toBe("archived");
  });

  it("should list created messages", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create multiple messages
    await caller.messages.create({
      title: "Message 1",
      reportDate: new Date(),
      messageContent: "Content 1",
    });

    await caller.messages.create({
      title: "Message 2",
      reportDate: new Date(),
      messageContent: "Content 2",
    });

    const messages = await caller.messages.list();

    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages.some((m) => m.title === "Message 1")).toBe(true);
    expect(messages.some((m) => m.title === "Message 2")).toBe(true);
  });

  it("should only return messages for authenticated user", async () => {
    const { ctx: ctx1 } = createAuthContext();
    const { ctx: ctx2 } = createAuthContext();
    ctx2.user.id = Math.floor(Math.random() * 10000) + 1000; // Different user

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // Create message with user 1
    await caller1.messages.create({
      title: "User 1 Message",
      reportDate: new Date(),
      messageContent: "Content",
    });

    // Create message with user 2
    await caller2.messages.create({
      title: "User 2 Message",
      reportDate: new Date(),
      messageContent: "Content",
    });

    // User 1 should only see their message
    const user1Messages = await caller1.messages.list();
    expect(user1Messages.some((m) => m.title === "User 1 Message")).toBe(true);
    expect(user1Messages.every((m) => m.userId === ctx1.user.id)).toBe(true);

    // User 2 should only see their message
    const user2Messages = await caller2.messages.list();
    expect(user2Messages.some((m) => m.title === "User 2 Message")).toBe(true);
    expect(user2Messages.every((m) => m.userId === ctx2.user.id)).toBe(true);
  });
});

describe("job imports router", () => {
  it("should return list of imports for user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const imports = await caller.imports.list();

    expect(Array.isArray(imports)).toBe(true);
  });

  it("should create a job import record", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a job first
    const job = await caller.jobs.create({
      title: "Senior CPU Performance Engineer",
      company: "ARM",
      location: "Cambridge, UK",
      experienceYearsMin: 1,
      experienceYearsMax: 3,
      jobUrl: "https://example.com/job/1",
    });

    // Create a message
    const message = await caller.messages.create({
      title: "CPU Jobs",
      reportDate: new Date(),
      messageContent: "Job listings",
    });

    // Create an import
    const importRecord = await caller.imports.create({
      messageId: message.id,
      jobId: job.id,
      matchScore: "⭐⭐⭐⭐⭐",
      tier: "Tier 1: Perfect Fit",
    });

    expect(importRecord).toBeDefined();
    expect(importRecord.jobId).toBe(job.id);
    expect(importRecord.messageId).toBe(message.id);
    expect(importRecord.matchScore).toBe("⭐⭐⭐⭐⭐");
  });

  it("should list job imports with job details", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a job
    const job = await caller.jobs.create({
      title: "CPU Architect",
      company: "Google",
      location: "Mountain View, CA",
      experienceYearsMin: 1,
      experienceYearsMax: 3,
    });

    // Create a message
    const message = await caller.messages.create({
      title: "Google Jobs",
      reportDate: new Date(),
      messageContent: "Google job listings",
    });

    // Create an import
    await caller.imports.create({
      messageId: message.id,
      jobId: job.id,
      tier: "Tier 1",
    });

    // List imports
    const imports = await caller.imports.list();

    expect(imports.length).toBeGreaterThan(0);
    const importRecord = imports.find((i) => i.jobId === job.id);
    expect(importRecord).toBeDefined();
    expect(importRecord?.job?.title).toBe("CPU Architect");
  });

  it("should only return imports for authenticated user", async () => {
    const { ctx: ctx1 } = createAuthContext();
    const { ctx: ctx2 } = createAuthContext();
    ctx2.user.id = Math.floor(Math.random() * 10000) + 2000;

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // User 1 creates job and import
    const job1 = await caller1.jobs.create({
      title: "Job 1",
      company: "Company 1",
      location: "Location 1",
      experienceYearsMin: 1,
      experienceYearsMax: 3,
    });

    const msg1 = await caller1.messages.create({
      title: "Message 1",
      reportDate: new Date(),
      messageContent: "Content",
    });

    await caller1.imports.create({
      messageId: msg1.id,
      jobId: job1.id,
    });

    // User 2 creates job and import
    const job2 = await caller2.jobs.create({
      title: "Job 2",
      company: "Company 2",
      location: "Location 2",
      experienceYearsMin: 1,
      experienceYearsMax: 3,
    });

    const msg2 = await caller2.messages.create({
      title: "Message 2",
      reportDate: new Date(),
      messageContent: "Content",
    });

    await caller2.imports.create({
      messageId: msg2.id,
      jobId: job2.id,
    });

    // User 1 should only see their imports
    const user1Imports = await caller1.imports.list();
    expect(user1Imports.length).toBeGreaterThan(0);
    expect(user1Imports.every((i) => i.userId === ctx1.user.id)).toBe(true);

    // User 2 should only see their imports
    const user2Imports = await caller2.imports.list();
    expect(user2Imports.length).toBeGreaterThan(0);
    expect(user2Imports.every((i) => i.userId === ctx2.user.id)).toBe(true);
  });
});
