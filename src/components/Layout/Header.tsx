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

const navLinks = [
  { page: 'dashboard', label: 'Dashboard' },
  { page: 'invoices', label: 'Invoices' },
  { page: 'customers', label: 'Customers' },
  { page: 'products', label: 'Products' },
  { page: 'vehicles', label: 'Vehicles' },
  { page: 'settings', label: 'Company Profile' },
];

const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange, onLogout }) => {
  const user = useSupabaseUser();
  const isAdmin = user?.user_metadata?.role === 'admin';
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on navigation
  useEffect(() => { setMenuOpen(false); }, [currentPage]);

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 flex items-center justify-between h-16">
        <div className="text-lg sm:text-2xl font-bold text-blue-700 tracking-tight">TAX EASE PORTAL</div>
        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-2">
          {navLinks.map(link => (
            <button
              key={link.page}
              onClick={() => onPageChange(link.page)}
              className={`font-semibold px-3 py-2 rounded-lg transition-colors ${
                currentPage === link.page
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {link.label}
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
        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center">
          <button
            className="p-2 rounded hover:bg-gray-100 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open navigation menu"
          >
            <svg className="h-6 w-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 8h16M4 16h16"} />
            </svg>
          </button>
        </div>
        <button
          className="hidden md:block bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
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
      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-100 shadow animate-fade-in">
          <div className="flex flex-col gap-1 px-4 py-2">
            {navLinks.map(link => (
              <button
                key={link.page}
                onClick={() => onPageChange(link.page)}
                className={`text-left font-semibold px-3 py-2 rounded-lg transition-colors ${
                  currentPage === link.page
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => onPageChange('admin')}
                className={`text-left font-semibold px-3 py-2 rounded-lg transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Admin Panel
              </button>
            )}
            <button
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors mt-2"
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
        </nav>
      )}
    </header>
  );
};

export default Header;