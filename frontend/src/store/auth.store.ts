import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UsuarioSesion } from '../types';

interface AuthState {
  accessToken: string | null;
  usuario: UsuarioSesion | null;
  isAuthenticated: boolean;
  login: (accessToken: string, usuario: UsuarioSesion) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      usuario: null,
      isAuthenticated: false,
      login: (accessToken, usuario) =>
        set({ accessToken, usuario, isAuthenticated: true }),
      logout: () => set({ accessToken: null, usuario: null, isAuthenticated: false }),
    }),
    { name: 'rp-virtual-auth' }, // clave en localStorage
  ),
);
