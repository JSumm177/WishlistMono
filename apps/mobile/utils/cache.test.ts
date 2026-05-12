import * as SecureStore from 'expo-secure-store';
import { tokenCache } from './cache';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe('tokenCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getToken', () => {
    it('should return the token from SecureStore', async () => {
      const mockToken = 'test-token';
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockToken);

      const result = await tokenCache.getToken('test-key');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
      expect(result).toBe(mockToken);
    });

    it('should return null if SecureStore throws an error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await tokenCache.getToken('test-key');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });
  });

  describe('saveToken', () => {
    it('should call SecureStore.setItemAsync with the correct arguments', async () => {
      await tokenCache.saveToken('test-key', 'test-value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should not throw if SecureStore.setItemAsync fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(tokenCache.saveToken('test-key', 'test-value')).resolves.not.toThrow();
    });
  });
});
