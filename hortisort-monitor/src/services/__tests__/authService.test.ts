import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../authService';

// Mock localStorage since happy-dom doesn't provide a fully functional one
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

describe('authService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // --- login ---

  it('should return user data on successful login', async () => {
    const result = await authService.login('rajesh.patel@agrifresh.com', 'password_123');

    expect(result.id).toBe(1);
    expect(result.name).toBe('Rajesh Patel');
    expect(result.role).toBe('customer');
  });

  it('should store user in localStorage on login', async () => {
    await authService.login('rajesh.patel@agrifresh.com', 'password_123');

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'hortisort_auth_user',
      expect.stringContaining('"name":"Rajesh Patel"')
    );
  });

  it('should not include password_hash in returned user', async () => {
    const result = await authService.login('rajesh.patel@agrifresh.com', 'password_123');

    expect(result).not.toHaveProperty('password_hash');
  });

  it('should throw error for invalid email', async () => {
    await expect(
      authService.login('nobody@nowhere.com', 'password_123')
    ).rejects.toThrow('Invalid email or password');
  });

  it('should throw error for wrong password', async () => {
    await expect(
      authService.login('rajesh.patel@agrifresh.com', 'wrong_password')
    ).rejects.toThrow('Invalid email or password');
  });

  it.each([
    ['rajesh.patel@agrifresh.com', 'customer'],
    ['amit.sharma@hortisort.com', 'engineer'],
    ['aslam@hortisort.com', 'admin'],
  ])('should return correct role for %s (%s)', async (email, expectedRole) => {
    const result = await authService.login(email, 'password_123');
    expect(result.role).toBe(expectedRole);
  });

  // --- logout ---

  it('should remove user from localStorage on logout', async () => {
    await authService.login('rajesh.patel@agrifresh.com', 'password_123');
    authService.logout();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('hortisort_auth_user');
  });

  // --- getCurrentUser ---

  it('should return null when no user is stored', () => {
    const user = authService.getCurrentUser();
    expect(user).toBeNull();
  });

  it('should return stored user after login', async () => {
    await authService.login('amit.sharma@hortisort.com', 'password_123');
    const user = authService.getCurrentUser();

    expect(user).not.toBeNull();
    expect(user!.name).toBe('Amit Sharma');
    expect(user!.role).toBe('engineer');
  });

  // --- isAuthenticated ---

  it('should return false when no user is logged in', () => {
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('should return true after login', async () => {
    await authService.login('aslam@hortisort.com', 'password_123');
    expect(authService.isAuthenticated()).toBe(true);
  });
});
