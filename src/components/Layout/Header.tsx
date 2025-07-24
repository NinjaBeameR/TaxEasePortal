import React from 'react';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange, onLogout }) => (
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
      </nav>
      <button
        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        onClick={onLogout}
        disabled={!onLogout}
      >
        Logout
      </button>
    </div>
  </header>
);

export default Header;