// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnValue({ error: null }),
      select: jest.fn().mockReturnValue({ data: [], error: null }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockReturnValue({ error: null }),
      })),
    },
    auth: {
      signUp: jest.fn().mockReturnValue({ error: null }),
      signIn: jest.fn().mockReturnValue({ error: null }),
    },
  })),
}));
