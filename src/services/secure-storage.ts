import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_PREFIX = 'wedtrack_staff_';

export const SecureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(fullKey, value);
        }
      } else {
        await SecureStore.setItemAsync(fullKey, value);
      }
    } catch (e) {
      console.warn(`[SecureStorage] Failed to set ${key}:`, e);
    }
  },

  async getItem(key: string): Promise<string | null> {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(fullKey);
        }
        return null;
      } else {
        return await SecureStore.getItemAsync(fullKey);
      }
    } catch (e) {
      console.warn(`[SecureStorage] Failed to get ${key}:`, e);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(fullKey);
        }
      } else {
        await SecureStore.deleteItemAsync(fullKey);
      }
    } catch (e) {
      console.warn(`[SecureStorage] Failed to remove ${key}:`, e);
    }
  },
};
