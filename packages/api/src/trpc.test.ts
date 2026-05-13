import { createTRPCContext } from "./trpc";
import { db } from "@wishlist/db";

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
