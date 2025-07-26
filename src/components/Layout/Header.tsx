import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

function useSupabaseUser() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return user;
}

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange, onLogout }) => {
  const user = useSupabaseUser();
  const isAdmin = user?.user_metadata?.role === 'admin';

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="text-2xl font-bold text-blue-700 tracking-tight">TAX EASE PORTAL</div>
        <nav className="flex gap-6">
          {['dashboard', 'invoices', 'customers', 'products', 'settings'].map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`font-semibold px-3 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => onPageChange('admin')}
              className={`font-semibold px-3 py-2 rounded-lg transition-colors ${
                currentPage === 'admin'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Admin Panel
            </button>
          )}
        </nav>
        <button
          className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          onClick={() => {
            if (onLogout) {
              onLogout();
              // Use replace to avoid back navigation to dashboard
              window.location.replace('/');
            }
          }}
          disabled={!onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;