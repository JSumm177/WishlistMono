import { appRouter } from "./router";
import { db, vehicles } from "@wishlist/db";
import { TRPCError } from "@trpc/server";

jest.mock("@wishlist/db", () => ({
  db: {
    delete: jest.fn(),
    select: jest.fn(),
  },
  vehicles: {
    id: "id",
    userId: "userId",
    price: "price",
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

  describe("getVehicles", () => {
    it("should return vehicles with correctly formatted prices, handling nulls", async () => {
      const mockVehicles = [
        { id: 1, make: "Porsche", model: "911", price: 12000000 }, // $120,000.00
        { id: 2, make: "Toyota", model: "AE86", price: null },
      ];

      const mockWhere = jest.fn().mockResolvedValue(mockVehicles);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });

      (db.select as jest.Mock).mockImplementation(mockSelect);

      const caller = appRouter.createCaller({
        db: db as any,
        userId: mockUserId,
        headers: mockHeaders,
      });

      const result = await caller.getVehicles();

      expect(result).toEqual([
        { id: 1, make: "Porsche", model: "911", price: 120000 },
        { id: 2, make: "Toyota", model: "AE86", price: null },
      ]);

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(vehicles);
      expect(mockWhere).toHaveBeenCalled();
    });

    it("should return an empty array if the user has no vehicles", async () => {
      const mockWhere = jest.fn().mockResolvedValue([]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });

      (db.select as jest.Mock).mockImplementation(mockSelect);

      const caller = appRouter.createCaller({
        db: db as any,
        userId: mockUserId,
        headers: mockHeaders,
      });

      const result = await caller.getVehicles();

      expect(result).toEqual([]);
    });
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
