import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { render } from '../../test/utils';
import { AuthProvider } from '../../context/AuthContext';
import { LoginPage } from '../LoginPage';

// Mock localStorage
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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLoginPage() {
  function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return render(<LoginPage />, { wrapper: Wrapper });
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should render email and password fields', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should render a submit button', () => {
    renderLoginPage();

    expect(screen.getByRole('button', { name: /sign in|log in|login/i })).toBeInTheDocument();
  });

  it('should show error message on invalid credentials', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'nobody@nowhere.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('should navigate to /dashboard on successful customer login', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'rajesh.patel@agrifresh.com');
    await user.type(screen.getByLabelText(/password/i), 'password_123');
    await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'rajesh.patel@agrifresh.com');
    await user.type(screen.getByLabelText(/password/i), 'password_123');

    const button = screen.getByRole('button', { name: /sign in|log in|login/i });
    await user.click(button);

    // Button should be disabled during login
    expect(button).toBeDisabled();
  });

  it('should require email field', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeRequired();
  });

  it('should require password field', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeRequired();
  });
});
