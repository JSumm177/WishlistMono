import * as SecureStore from "expo-secure-store";
import { tokenCache } from "./cache";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe("tokenCache", () => {
  const key = "test-key";
  const value = "test-value";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getToken", () => {
    it("should call SecureStore.getItemAsync with the correct key", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(value);
      const result = await tokenCache.getToken(key);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });

    it("should return null if SecureStore.getItemAsync throws an error", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error("Storage error"));
      const result = await tokenCache.getToken(key);
      expect(result).toBeNull();
    });
  });

  describe("saveToken", () => {
    it("should call SecureStore.setItemAsync with the correct key and value", async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
      await tokenCache.saveToken(key, value);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(key, value);
    });

    it("should return undefined if SecureStore.setItemAsync throws an error", async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error("Storage error"));
      const result = await tokenCache.saveToken(key, value);
      expect(result).toBeUndefined();
    });
  });
});
