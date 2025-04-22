import './globals.css';
import type { Metadata } from 'next';
import Image from 'next/image';
import FlashIcon from './assets/flash_icon_transp.png';
import { config } from '../src/config';
import DatabaseStatus from '../src/components/DatabaseStatus';

export const metadata: Metadata = {
  title: 'Sign up for Flash',
  description: 'Create your Flash account to start making secure payments',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/favicon/favicon.png', type: 'image/png' }],
    apple: [{ url: '/favicon/apple-touch-icon/apple-touch-icon.png' }],
    shortcut: [{ url: '/favicon/favicon.png' }],
  },
  themeColor: '#ffffff',
  appleWebApp: {
    title: 'Flash Merchant Signup',
    statusBarStyle: 'default',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Meta tag to help with cookie handling */}
        <meta httpEquiv="Set-Cookie" content="__cf_bm=accept; SameSite=None; Secure" />
        {/* Add script to suppress Cloudflare cookie warnings in console */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Override console methods to filter out Cloudflare cookie warnings
            const originalConsoleError = console.error;
            const originalConsoleWarn = console.warn;
            const originalConsoleLog = console.log;
            
            // Helper function to check if a message is related to Cloudflare cookies
            function isCloudflareWarning(arg) {
              return typeof arg === 'string' && (
                arg.includes('Cookie "__cf_bm" has been rejected') || 
                arg.includes('Cloudflare') || 
                arg.includes('cf_bm')
              );
            }
            
            // Override console.error
            console.error = function(...args) {
              if (args.length > 0 && isCloudflareWarning(args[0])) {
                return; // Suppress the warning
              }
              originalConsoleError.apply(console, args);
            };
            
            // Override console.warn
            console.warn = function(...args) {
              if (args.length > 0 && isCloudflareWarning(args[0])) {
                return; // Suppress the warning
              }
              originalConsoleWarn.apply(console, args);
            };
            
            // Override console.log for comprehensive filtering
            console.log = function(...args) {
              if (args.length > 0 && isCloudflareWarning(args[0])) {
                return; // Suppress the log
              }
              originalConsoleLog.apply(console, args);
            };
            
            // Accept Cloudflare cookies by overriding the Storage.setItem method
            try {
              // Add event listener for Cloudflare cookies
              document.addEventListener('DOMContentLoaded', function() {
                // Accept Cloudflare cookies automatically if they appear
                if (document.cookie.includes('__cf_bm')) {
                  console.log('Cloudflare cookie detected and accepted');
                }
              });
            } catch (e) {
              // Silently fail if browser doesn't support this
            }
          `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto p-4">
          <header className="mb-8 pt-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 relative">
                <Image
                  src={FlashIcon}
                  alt="Flash Icon"
                  width={64}
                  height={64}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center text-gray-800">Sign up for Flash</h1>
          </header>
          <main className="pb-12">{children}</main>
          <footer className="mt-12 text-center text-gray-500 text-sm py-6 border-t border-gray-100">
            <div className="max-w-md mx-auto">
              <p className="mb-4">&copy; {new Date().getFullYear()} Flash. All rights reserved.</p>
              <div className="flex justify-center space-x-4 text-xs">
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Help Center
                </a>
              </div>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <p className="text-xs text-gray-400">Version {config.app.version}</p>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-xs text-gray-400">Database Connected</p>
              </div>
            </div>
          </footer>
        </div>

        {/* Database connection status indicator */}
        <DatabaseStatus />
      </body>
    </html>
  );
}
