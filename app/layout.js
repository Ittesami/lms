'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pages that don't need sidebar
  const publicPages = ['/login', '/register'];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    if (!isPublicPage) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isPublicPage) {
    return (
      <html lang="en">
        <body className="antialiased">
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-gray-600">Loading...</div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="antialiased">
        {isPublicPage ? (
          // Public pages (login, register) - no sidebar
          <div>{children}</div>
        ) : (
          // Protected pages - with sidebar
          <div className="flex">
            {/* <Sidebar user={user} /> */}
            <main className="flex-1 bg-gray-50 min-h-screen overflow-auto">
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}