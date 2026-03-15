import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock localStorage (same pattern as authService tests)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
}

describe('AuthContext + useAuth', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should have null user by default', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set user after successful login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('rajesh.patel@agrifresh.com', 'password_123');
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user!.name).toBe('Rajesh Patel');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should clear user after logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('rajesh.patel@agrifresh.com', 'password_123');
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set error on failed login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('nobody@nowhere.com', 'wrong');
    });

    expect(result.current.error).toBe('Invalid email or password');
    expect(result.current.user).toBeNull();
  });

  it('should restore user from localStorage on mount', async () => {
    // Pre-seed localStorage with a user
    const storedUser = {
      id: 5,
      name: 'Aslam Sheikh',
      email: 'aslam@hortisort.com',
      phone: '+91 54321 09876',
      whatsapp_number: '+91 54321 09876',
      role: 'admin',
      is_active: true,
      created_at: '2023-01-01T10:00:00Z',
      updated_at: '2023-01-01T10:00:00Z',
    };
    localStorageMock.setItem('hortisort_auth_user', JSON.stringify(storedUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    expect(result.current.user!.name).toBe('Aslam Sheikh');
    expect(result.current.user!.role).toBe('admin');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should expose loading state during login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(false);

    // Start login without awaiting
    let loginPromise: Promise<void>;
    act(() => {
      loginPromise = result.current.login('rajesh.patel@agrifresh.com', 'password_123');
    });

    // isLoading should be true while in-flight
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await loginPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
