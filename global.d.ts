import { ReactElement, ReactNode } from 'react';
import { FormError, NextPage } from 'next';

// Add support for Next.js pages with layout
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

// Support File in any environment
declare global {
  interface Window {
    ENV: {
      SUPABASE_URL: string;
      SUPABASE_KEY: string;
      BUILD_TIME: boolean;
      BUILD_DATE?: string;
      [key: string]: any;
    };
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  }

  // Add File constructor in non-browser environments
  var File: typeof File;
}

// Make TypeScript happy with MSW
declare module 'msw' {
  export const rest: any;
}
