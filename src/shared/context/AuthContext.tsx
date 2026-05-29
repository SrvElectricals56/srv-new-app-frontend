import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { authApi, profileApi, type UserProfile } from '../api/services';
import { storage } from '../api/storage';
import type { UserRole } from '@/shared/types/navigation';
import { useAppPreviewState } from '../preview/appPreviewStore';

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  role: UserRole | null;
};

type AuthContextType = AuthState & {
  login: (user: UserProfile, role: UserRole) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function resolveProfilePoints(profile: UserProfile | null | undefined) {
  return Math.max(
    Number(profile?.totalPoints ?? 0),
    Number(profile?.walletBalance ?? 0),
  );
}

function normalizeProfile(profile: UserProfile | null | undefined): UserProfile | null {
  if (!profile) return null;

  return {
    ...profile,
    totalPoints:
      profile.role === 'dealer'
        ? profile.totalPoints
        : resolveProfilePoints(profile),
  };
}

function buildPreviewUser(role: UserRole): UserProfile {
  const base = {
    id: `preview-${role}`,
    name:
      role === 'dealer'
        ? 'Preview Dealer'
        : role === 'user'
        ? 'Preview Customer'
        : role === 'counterboy'
        ? 'Preview Counter Boy'
        : 'Preview Electrician',
    phone: '9876543210',
    email: 'preview@srv.app',
    role,
    profileImage: null,
    city: 'Mansa',
    town: 'Mansa',
    district: 'Mansa',
    state: 'Punjab',
    address: 'SRV Preview Street, Mansa, Punjab',
    status: 'active',
    totalPoints: role === 'dealer' ? 4200 : 1280,
    totalScans: role === 'dealer' ? 84 : 31,
    walletBalance: role === 'dealer' ? 210 : 1280,
    totalRedemptions: 14,
    bankLinked: true,
  } satisfies Partial<UserProfile>;

  if (role === 'dealer') {
    return {
      ...base,
      dealerCode: 'DLR-1024',
      dealerName: 'Preview Dealer',
      electricianCount: 18,
      gstNumber: '03ABCDE1234F1Z5',
    } as UserProfile;
  }

  if (role === 'user') {
    return {
      ...base,
      userCode: 'CUS-2048',
    } as UserProfile;
  }

  if (role === 'counterboy') {
    return {
      ...base,
      counterboyCode: 'CB-512',
    } as UserProfile;
  }

  return {
    ...base,
    electricianCode: 'ELX-4096',
    dealerName: 'SRV Dealer Hub',
    dealerPhone: '9988776655',
    dealerTown: 'Mansa',
    dealerCode: 'DLR-1024',
    subCategory: 'Wiring Expert',
    tier: 'Gold',
  } as UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const previewState = useAppPreviewState();
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    role: null,
  });

  // On app start — restore session from storage
  useEffect(() => {
    (async () => {
      try {
        const [token, profile, role] = await Promise.all([
          storage.getAccessToken(),
          storage.getUserProfile<UserProfile>(),
          storage.getUserRole(),
        ]);

        if (token && profile && role) {
          const normalizedProfile = normalizeProfile(profile);
          setState({
            isLoading: false,
            isAuthenticated: true,
            user: normalizedProfile,
            role: role as UserRole,
          });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        // Storage unavailable — start fresh
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback((user: UserProfile, role: UserRole) => {
    setState({
      isLoading: false,
      isAuthenticated: true,
      user: normalizeProfile(user),
      role,
    });
  }, []);

  const logout = useCallback(async () => {
    const accessToken = await storage.getAccessToken();
    await storage.clearAll();
    setState({ isLoading: false, isAuthenticated: false, user: null, role: null });
    void authApi.logout(accessToken);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const token = await storage.getAccessToken();
      if (!token) return;
      const profile = await profileApi.get();
      const normalizedProfile = normalizeProfile(profile);
      if (!normalizedProfile) return;
      await storage.setUserProfile(normalizedProfile);
      setState((s) => ({ ...s, user: normalizedProfile }));
    } catch (err: any) {
      // Session expired — force logout
      if (err?.message === 'SESSION_EXPIRED') {
        await storage.clearAll();
        setState({ isLoading: false, isAuthenticated: false, user: null, role: null });
      }
      // Other errors: silently fail — use cached profile
    }
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshProfile();
      }
    });
    // Poll every 30s while active so admin updates show up in the app without being too aggressive.
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        void refreshProfile();
      }
    }, 30000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [refreshProfile]);

  const updateUser = useCallback((data: Partial<UserProfile>) => {
    setState((s) => {
      const updated = s.user ? normalizeProfile({ ...s.user, ...data }) : null;
      if (updated) storage.setUserProfile(updated);
      return { ...s, user: updated };
    });
  }, []);

  const previewOverride = useMemo<AuthContextType | null>(() => {
    if (!previewState.enabled) {
      return null;
    }

    const previewRole = previewState.role;
    const previewUser =
      previewState.authMode === 'authenticated' ? buildPreviewUser(previewRole) : null;

    return {
      isLoading: false,
      isAuthenticated: previewState.authMode === 'authenticated',
      user: previewUser,
      role: previewState.authMode === 'authenticated' ? previewRole : null,
      login: () => {},
      logout: async () => {},
      refreshProfile: async () => {},
      updateUser: () => {},
    };
  }, [previewState.authMode, previewState.enabled, previewState.role]);

  const value = previewOverride ?? { ...state, login, logout, refreshProfile, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
