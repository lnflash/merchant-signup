import './globals.css';
import type { Metadata } from 'next';
import Image from 'next/image';
import FlashLogo from '../public/images/logos/flash.png';
import FlashIcon from '../public/images/logos/flash_icon_transp.png';
import { config } from '../src/config';
import DatabaseStatus from '../src/components/DatabaseStatus';

export const metadata: Metadata = {
  title: 'Sign up for Flash',
  description: 'Create your Flash account to start making secure payments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto p-4">
          <header className="mb-8 pt-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 relative">
                <Image
                  src={FlashIcon}
                  alt="Flash Icon"
                  fill
                  sizes="(max-width: 768px) 100vw, 64px"
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
