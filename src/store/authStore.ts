import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: { id: number; name: string; role: string; email: string } | null;
  setAuth: (token: string, user: { id: number; name: string; role: string; email: string }) => void;
  updateUser: (user: { id: number; name: string; role: string; email: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'techos-auth' }
  )
);
