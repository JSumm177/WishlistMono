import { appRouter } from "./router";
import { db, vehicles } from "@wishlist/db";
import { TRPCError } from "@trpc/server";

jest.mock("@wishlist/db", () => ({
  db: {
    delete: jest.fn(),
  },
  vehicles: {
    id: "id",
    userId: "userId",
  },
  eq: jest.fn(),
  and: jest.fn(),
}));

describe("appRouter", () => {
  const mockUserId = "user_123";
  const mockHeaders = new Headers();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("deleteVehicle", () => {
    it("should delete a vehicle when the user is authorized and verify filters", async () => {
      const mockDelete = db.delete as jest.Mock;
      const mockWhere = jest.fn().mockReturnThis();
      const mockReturning = jest.fn().mockResolvedValue([{ id: 1 }]);

      mockDelete.mockReturnValue({
        where: mockWhere,
        returning: mockReturning,
      });

      const caller = appRouter.createCaller({
        db: db as any,
        userId: mockUserId,
        headers: mockHeaders,
      });

      const { eq, and } = require("@wishlist/db");
      const result = await caller.deleteVehicle({ id: 1 });

      expect(mockDelete).toHaveBeenCalledWith(vehicles);
      expect(and).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(expect.anything(), 1);
      expect(eq).toHaveBeenCalledWith(expect.anything(), mockUserId);
      expect(mockWhere).toHaveBeenCalled();
      expect(mockReturning).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1 }]);
    });

    it("should return empty array if no vehicle was deleted", async () => {
      const mockDelete = db.delete as jest.Mock;
      const mockWhere = jest.fn().mockReturnThis();
      const mockReturning = jest.fn().mockResolvedValue([]);

      mockDelete.mockReturnValue({
        where: mockWhere,
        returning: mockReturning,
      });

      const caller = appRouter.createCaller({
        db: db as any,
        userId: mockUserId,
        headers: mockHeaders,
      });

      const result = await caller.deleteVehicle({ id: 999 });

      expect(result).toEqual([]);
    });

    it("should throw UNAUTHORIZED when user is not logged in", async () => {
      const caller = appRouter.createCaller({
        db: db as any,
        userId: null,
        headers: mockHeaders,
      });

      try {
        await caller.deleteVehicle({ id: 1 });
        fail("Should have thrown UNAUTHORIZED");
      } catch (err) {
        expect(err).toBeInstanceOf(TRPCError);
        if (err instanceof TRPCError) {
          expect(err.code).toBe("UNAUTHORIZED");
        }
      }
    });
  });
});
