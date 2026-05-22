import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

interface AuthState {
 user: User | null;
 isAuthenticated: boolean;
 activeOrganizationId: string | null;
 setUser: (user: User) => void;
 clearUser: () => void;
 logout: () => void;
 setActiveOrganization: (orgId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
    user: null,
    isAuthenticated: false,
    activeOrganizationId: null,
    setUser: (user) => set({ user, isAuthenticated: true, activeOrganizationId: user.organizationId }),
    clearUser: () => set({ user: null, isAuthenticated: false, activeOrganizationId: null }),
    logout: () => set({ user: null, isAuthenticated: false, activeOrganizationId: null }),
    setActiveOrganization: (orgId) => set((state) => ({
      activeOrganizationId: orgId,
      user: state.user ? { ...state.user, organizationId: orgId } : null,
    })),
  }),
);
