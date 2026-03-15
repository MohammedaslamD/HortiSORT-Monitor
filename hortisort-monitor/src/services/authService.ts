import { MOCK_USERS } from '../data/mockData';
import type { User } from '../types';

/** Stored user data (without sensitive fields). */
export type AuthUser = Omit<User, 'password_hash'>;

const STORAGE_KEY = 'hortisort_auth_user';

/** The accepted password for all mock users. */
const MOCK_PASSWORD = 'password_123';

/**
 * Authentication service — validates credentials against mock data
 * and persists session state in localStorage.
 */
export const authService = {
  /**
   * Authenticate a user by email and password.
   * @throws Error if credentials are invalid.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    // Simulate network delay
    await delay(300);

    const user = MOCK_USERS.find(
      (u) => u.email === email && u.is_active
    );

    if (!user || password !== MOCK_PASSWORD) {
      throw new Error('Invalid email or password');
    }

    const authUser = stripPasswordHash(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    return authUser;
  },

  /** Clear the stored session. */
  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /** Retrieve the currently logged-in user, or null. */
  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  /** Check whether a user session exists. */
  isAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripPasswordHash(user: User): AuthUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...rest } = user;
  return rest;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
