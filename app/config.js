// Next.js app directory config file
// This file configures static generation behavior

// Main app config for static generation
export const dynamic = 'auto';
export const dynamicParams = false;
export const revalidate = false;

// Generate only the main routes statically
export async function generateStaticParams() {
  return [{ path: '/' }, { path: '/form' }];
}
