import { createTRPCContext, protectedProcedure, router } from "./trpc";
import { db } from "@wishlist/db";
import { TRPCError } from "@trpc/server";

jest.mock("@wishlist/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

describe("createTRPCContext", () => {
  it("should create a context with db, userId and headers", async () => {
    const mockHeaders = {
      get: jest.fn(),
    } as unknown as Headers;
    const userId = "user_123";

    const context = await createTRPCContext({
      headers: mockHeaders,
      userId,
    });

    expect(context.db).toBe(db);
    expect(context.userId).toBe(userId);
    expect(context.headers).toBe(mockHeaders);
  });

  it("should handle null userId", async () => {
    const mockHeaders = {} as Headers;
    const userId = null;

    const context = await createTRPCContext({
      headers: mockHeaders,
      userId,
    });

    expect(context.userId).toBeNull();
  });
});

describe("protectedProcedure", () => {
  const testRouter = router({
    test: protectedProcedure.query(() => "ok"),
  });

  it("should allow access when userId is present", async () => {
    const caller = testRouter.createCaller({
      db: db as any,
      userId: "user_123",
      headers: new Headers(),
    });

    const result = await caller.test();
    expect(result).toBe("ok");
  });

  it("should throw UNAUTHORIZED when userId is missing", async () => {
    const caller = testRouter.createCaller({
      db: db as any,
      userId: null,
      headers: new Headers(),
    });

    await expect(caller.test()).rejects.toThrow(
      new TRPCError({ code: "UNAUTHORIZED" }),
    );
  });
});
