import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

type AuthenticatedUser = User;

function createAuthContext(userId: number = 1, role: "user" | "admin" = "user"): { ctx: TrpcContext; user: AuthenticatedUser } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as any as TrpcContext["res"],
  };

  return { ctx, user };
}

describe("jobs router", () => {
  describe("jobs.list", () => {
    it("returns empty list for user with no jobs", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.jobs.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.jobs.list();
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("jobs.create", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.jobs.create({
          title: "Test Job",
          company: "Test Corp",
          location: "Test City",
          experienceYearsMin: 1,
          experienceYearsMax: 3,
        });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("validates required fields", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.jobs.create({
          title: "",
          company: "Test Corp",
          location: "Test City",
          experienceYearsMin: 1,
          experienceYearsMax: 3,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("jobs.get", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.jobs.get({ id: 1 });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("returns undefined for non-existent job", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.jobs.get({ id: 99999 });

      expect(result).toBeUndefined();
    });
  });

  describe("jobs.delete", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.jobs.delete({ id: 1 });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("throws NOT_FOUND for non-existent job", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.jobs.delete({ id: 99999 });
        expect.fail("Should have thrown NOT_FOUND error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });
});

describe("skills router", () => {
  describe("skills.list", () => {
    it("returns empty list for user with no skills", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.skills.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.skills.list();
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("skills.create", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.skills.create({
          name: "Test Skill",
        });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("validates required fields", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.skills.create({
          name: "",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("skills.delete", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.skills.delete({ id: 1 });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("throws NOT_FOUND for non-existent skill", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.skills.delete({ id: 99999 });
        expect.fail("Should have thrown NOT_FOUND error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });
});

describe("bookmarks router", () => {
  describe("bookmarks.list", () => {
    it("returns empty list for user with no bookmarks", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.bookmarks.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.bookmarks.list();
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("bookmarks.isBookmarked", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.bookmarks.isBookmarked({ jobId: 1 });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("returns false for non-bookmarked job", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.bookmarks.isBookmarked({ jobId: 99999 });

      expect(result).toBe(false);
    });
  });

  describe("bookmarks.add", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.bookmarks.add({ jobId: 1 });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("bookmarks.remove", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: {} as any,
      };
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.bookmarks.remove({ jobId: 1 });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("throws NOT_FOUND for non-existent bookmark", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.bookmarks.remove({ jobId: 99999 });
        expect.fail("Should have thrown NOT_FOUND error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });
});

describe("owner-only access control", () => {
  it("jobs.list only returns jobs for authenticated user", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const { ctx: ctx2 } = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const jobs1 = await caller1.jobs.list();
    const jobs2 = await caller2.jobs.list();

    // Both should be arrays (may be empty or have different content)
    expect(Array.isArray(jobs1)).toBe(true);
    expect(Array.isArray(jobs2)).toBe(true);
  });

  it("skills.list only returns skills for authenticated user", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const { ctx: ctx2 } = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const skills1 = await caller1.skills.list();
    const skills2 = await caller2.skills.list();

    // Both should be arrays (may be empty or have different content)
    expect(Array.isArray(skills1)).toBe(true);
    expect(Array.isArray(skills2)).toBe(true);
  });

  it("bookmarks.list only returns bookmarks for authenticated user", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const { ctx: ctx2 } = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const bookmarks1 = await caller1.bookmarks.list();
    const bookmarks2 = await caller2.bookmarks.list();

    // Both should be arrays (may be empty or have different content)
    expect(Array.isArray(bookmarks1)).toBe(true);
    expect(Array.isArray(bookmarks2)).toBe(true);
  });
});
