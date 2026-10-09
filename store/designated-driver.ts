import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { State, initialState } from '@/lib/designated-driver';

const storage = {
  getItem: async (name: string) => Platform.OS === 'web' ? (typeof localStorage === 'undefined' ? null : localStorage.getItem(name)) : SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string) => {
    if (Platform.OS === 'web') { if (typeof localStorage !== 'undefined') localStorage.setItem(name, value); }
    else await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    if (Platform.OS === 'web') { if (typeof localStorage !== 'undefined') localStorage.removeItem(name); }
    else await SecureStore.deleteItemAsync(name);
  },
};
export const useDesignatedDriver = create<{ data: State; update: (data: State) => void }>()(persist(
  set => ({ data: initialState(), update: data => set({ data }) }),
  { name: 'anxin-development-v1', storage: createJSONStorage(() => storage) },
));
