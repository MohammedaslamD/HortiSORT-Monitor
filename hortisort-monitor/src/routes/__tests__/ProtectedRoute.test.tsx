import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { render } from '../../test/utils';
import { ProtectedRoute } from '../ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';

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
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

function renderWithAuth(children: ReactNode, storedUser?: object) {
  if (storedUser) {
    localStorageMock.setItem('hortisort_auth_user', JSON.stringify(storedUser));
  }

  return render(
    <AuthProvider>{children}</AuthProvider>
  );
}

const mockCustomer = {
  id: 1, name: 'Rajesh Patel', email: 'rajesh.patel@agrifresh.com',
  phone: '+91 98765 43210', role: 'customer', is_active: true,
  created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z',
};

const mockAdmin = {
  id: 5, name: 'Aslam Sheikh', email: 'aslam@hortisort.com',
  phone: '+91 54321 09876', role: 'admin', is_active: true,
  created_at: '2023-01-01T10:00:00Z', updated_at: '2023-01-01T10:00:00Z',
};

const mockEngineer = {
  id: 3, name: 'Amit Sharma', email: 'amit.sharma@hortisort.com',
  phone: '+91 76543 21098', role: 'engineer', is_active: true,
  created_at: '2023-06-01T10:00:00Z', updated_at: '2023-06-01T10:00:00Z',
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should redirect to /login when user is not authenticated', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    const navigateEl = screen.getByTestId('navigate');
    expect(navigateEl).toHaveAttribute('data-to', '/login');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      mockCustomer
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect when user role is not in allowed roles', () => {
    renderWithAuth(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin Only Content</div>
      </ProtectedRoute>,
      mockCustomer
    );

    const navigateEl = screen.getByTestId('navigate');
    expect(navigateEl).toHaveAttribute('data-to', '/dashboard');
    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
  });

  it('should render children when user role is in allowed roles', () => {
    renderWithAuth(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin Only Content</div>
      </ProtectedRoute>,
      mockAdmin
    );

    expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
  });

  it('should allow engineer access to engineer+admin routes', () => {
    renderWithAuth(
      <ProtectedRoute allowedRoles={['engineer', 'admin']}>
        <div>Engineer Content</div>
      </ProtectedRoute>,
      mockEngineer
    );

    expect(screen.getByText('Engineer Content')).toBeInTheDocument();
  });

  it('should render children when no allowedRoles specified (any authenticated user)', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Any User Content</div>
      </ProtectedRoute>,
      mockEngineer
    );

    expect(screen.getByText('Any User Content')).toBeInTheDocument();
  });
});
