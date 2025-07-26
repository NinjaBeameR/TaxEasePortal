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
          <button
            onClick={() => onPageChange('dashboard')}
            className={`font-semibold px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'dashboard'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onPageChange('invoices')}
            className={`font-semibold px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'invoices'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => onPageChange('customers')}
            className={`font-semibold px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'customers'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => onPageChange('products')}
            className={`font-semibold px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'products'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => onPageChange('vehicles')}
            className={`font-semibold px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'vehicles'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Vehicles
          </button>
          <button
            onClick={() => onPageChange('settings')}
            className={`font-semibold px-3 py-2 rounded-lg transition-colors ${
              currentPage === 'settings'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Company Profile
          </button>
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
              window.location.replace('/');
            }
          }}
          disabled={!onLogout}
        >
          Sign out
        </button>
      </div>
    </header>
  );
};

export default Header;