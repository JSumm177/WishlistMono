import { appRouter } from "./router";
import { db, vehicles } from "@wishlist/db";
import { TRPCError } from "@trpc/server";
import { UTApi } from "uploadthing/server";

jest.mock("uploadthing/server", () => {
  const deleteFiles = jest.fn();
  return {
    UTApi: jest.fn().mockImplementation(() => ({
      deleteFiles,
    })),
  };
});

jest.mock("@wishlist/db", () => ({
  db: {
    delete: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
  },
  vehicles: {
    id: "id",
    userId: "userId",
    price: "price",
    imageUrl: "imageUrl",
  },
  marketPrices: {
    id: "id",
    vehicleId: "vehicleId",
    source: "source",
    price: "price",
    url: "url",
  },
  eq: jest.fn(),
  and: jest.fn(),
  inArray: jest.fn(),
}));

jest.mock("./services/scraper", () => ({
  scrapeMarketPrices: jest.fn().mockResolvedValue([
    { source: "cargurus", price: 3000000, url: "http://cargurus.test" },
    { source: "carmax", price: 3100000, url: "http://carmax.test" },
  ]),
}));

describe("appRouter", () => {
  const mockUserId = "user_123";
  const mockHeaders = new Headers();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getVehicles", () => {
    it("should return vehicles with correctly formatted prices, handling nulls and calculating averages", async () => {
      const mockVehicles = [
        { id: 1, make: "Porsche", model: "911", price: 12000000 }, // $120,000.00
        { id: 2, make: "Toyota", model: "AE86", price: null },
      ];

      const mockPrices = [
        {
          id: 10,
          vehicleId: 1,
          source: "cargurus",
          price: 12200000,
          url: "http://cargurus",
        },
        {
          id: 11,
          vehicleId: 1,
          source: "carmax",
          price: 12400000,
          url: "http://carmax",
        },
      ];

      const mockWhereVehicles = jest.fn().mockResolvedValue(mockVehicles);
      const mockFromVehicles = jest
        .fn()
        .mockReturnValue({ where: mockWhereVehicles });

      const mockWherePrices = jest.fn().mockResolvedValue(mockPrices);
      const mockFromPrices = jest
        .fn()
        .mockReturnValue({ where: mockWherePrices });

      const mockSelect = jest
        .fn()
        .mockReturnValueOnce({ from: mockFromVehicles })
        .mockReturnValueOnce({ from: mockFromPrices });

      (db.select as jest.Mock).mockImplementation(mockSelect);

      const caller = appRouter.createCaller({
        db: db as any,
        userId: mockUserId,
        headers: mockHeaders,
      });

      const result = await caller.getVehicles();

      expect(result).toEqual([
        {
          id: 1,
          make: "Porsche",
          model: "911",
          price: 120000,
          averageMarketPrice: 123000,
        },
        {
          id: 2,
          make: "Toyota",
          model: "AE86",
          price: null,
          averageMarketPrice: null,
        },
      ]);

      expect(db.select).toHaveBeenCalledTimes(2);
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
    it("should delete a vehicle and its image when authorized", async () => {
      const utApiInstance = new UTApi();
      const mockDeleteFiles = utApiInstance.deleteFiles as jest.Mock;

      // Mock Select (to find the image)
      const mockVehicle = {
        id: 1,
        userId: mockUserId,
        imageUrl: "https://utfs.io/f/test-key",
      };
      const mockSelectLimit = jest.fn().mockResolvedValue([mockVehicle]);
      const mockSelectWhere = jest
        .fn()
        .mockReturnValue({ limit: mockSelectLimit });
      const mockSelectFrom = jest
        .fn()
        .mockReturnValue({ where: mockSelectWhere });
      (db.select as jest.Mock).mockReturnValue({ from: mockSelectFrom });

      // Mock Delete
      const mockDeleteReturning = jest.fn().mockResolvedValue([{ id: 1 }]);
      const mockDeleteWhere = jest
        .fn()
        .mockReturnValue({ returning: mockDeleteReturning });
      (db.delete as jest.Mock).mockReturnValue({ where: mockDeleteWhere });

      const caller = appRouter.createCaller({
        db: db as any,
        userId: mockUserId,
        headers: mockHeaders,
      });

      const result = await caller.deleteVehicle({ id: 1 });

      expect(mockDeleteFiles).toHaveBeenCalledWith("test-key");
      expect(db.delete).toHaveBeenCalledWith(vehicles);
      expect(result).toEqual([{ id: 1 }]);
    });

    it("should throw error if vehicle not found", async () => {
      // Mock Select returning empty
      const mockSelectLimit = jest.fn().mockResolvedValue([]);
      const mockSelectWhere = jest
        .fn()
        .mockReturnValue({ limit: mockSelectLimit });
      const mockSelectFrom = jest
        .fn()
        .mockReturnValue({ where: mockSelectWhere });
      (db.select as jest.Mock).mockReturnValue({ from: mockSelectFrom });

      const caller = appRouter.createCaller({
        db: db as any,
        userId: mockUserId,
        headers: mockHeaders,
      });

      await expect(caller.deleteVehicle({ id: 999 })).rejects.toThrow(
        "Vehicle not found",
      );
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

  describe("getMarketPrices", () => {
    it("should return market prices for a vehicle", async () => {
      const mockVehicle = {
        id: 1,
        userId: mockUserId,
        make: "Porsche",
        model: "911",
        year: 2020,
      };
      const mockSelectVehicleLimit = jest.fn().mockResolvedValue([mockVehicle]);
      const mockSelectVehicleWhere = jest
        .fn()
        .mockReturnValue({ limit: mockSelectVehicleLimit });
      const mockSelectVehicleFrom = jest
        .fn()
        .mockReturnValue({ where: mockSelectVehicleWhere });

      const mockPrices = [
        {
          id: 10,
          vehicleId: 1,
          source: "cargurus",
          price: 12200000,
          url: "http://cargurus",
        },
      ];
      const mockSelectPricesWhere = jest.fn().mockResolvedValue(mockPrices);
      const mockSelectPricesFrom = jest
        .fn()
        .mockReturnValue({ where: mockSelectPricesWhere });

      const mockSelect = jest
        .fn()
        .mockReturnValueOnce({ from: mockSelectVehicleFrom })
        .mockReturnValueOnce({ from: mockSelectPricesFrom });

      (db.select as jest.Mock).mockImplementation(mockSelect);

      const caller = appRouter.createCaller({
        db: db as any,
        userId: mockUserId,
        headers: mockHeaders,
      });

      const result = await caller.getMarketPrices({ vehicleId: 1 });

      expect(result).toEqual([
        {
          id: 10,
          vehicleId: 1,
          source: "cargurus",
          price: 122000,
          url: "http://cargurus",
        },
      ]);
    });
  });

  describe("refreshMarketPrices", () => {
    it("should clear old and insert new market prices", async () => {
      const mockVehicle = {
        id: 1,
        userId: mockUserId,
        make: "Porsche",
        model: "911",
        year: 2020,
        price: 12000000,
      };
      const mockSelectLimit = jest.fn().mockResolvedValue([mockVehicle]);
      const mockSelectWhere = jest
        .fn()
        .mockReturnValue({ limit: mockSelectLimit });
      const mockSelectFrom = jest
        .fn()
        .mockReturnValue({ where: mockSelectWhere });
      (db.select as jest.Mock).mockReturnValue({ from: mockSelectFrom });

      const mockDeleteWhere = jest.fn().mockResolvedValue([]);
      (db.delete as jest.Mock).mockReturnValue({ where: mockDeleteWhere });

      const mockInserted = [
        {
          id: 10,
          vehicleId: 1,
          source: "cargurus",
          price: 3000000,
          url: "http://cargurus.test",
        },
      ];
      const mockInsertValues = jest
        .fn()
        .mockReturnValue({
          returning: jest.fn().mockResolvedValue(mockInserted),
        });
      (db.insert as jest.Mock).mockReturnValue({ values: mockInsertValues });

      const caller = appRouter.createCaller({
        db: db as any,
        userId: mockUserId,
        headers: mockHeaders,
      });

      const result = await caller.refreshMarketPrices({ vehicleId: 1 });

      expect(result).toEqual([
        {
          id: 10,
          vehicleId: 1,
          source: "cargurus",
          price: 30000,
          url: "http://cargurus.test",
        },
      ]);
    });
  });
});
