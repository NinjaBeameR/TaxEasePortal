import { useState } from 'react';
import { supabase } from '../../services/supabase';
import logo from '../../assets/logo.png';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [step, setStep] = useState<'email' | 'setPassword' | 'login'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin login state
  const [adminMode, setAdminMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Step 1: User enters email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Call backend to check user status
    const res = await fetch('/.netlify/functions/check-user-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);

    if (!res.ok) {
      setError('No account found for this email.');
      return;
    }
    const { must_set_password } = await res.json();
    if (must_set_password) {
      setStep('setPassword');
    } else {
      setStep('login');
    }
  };

  // Step 2: User sets password (first time)
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await fetch('/.netlify/functions/set-user-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword }),
    });
    setLoading(false);

    if (res.ok) {
      setStep('login');
      setError('Password set! Please log in.');
    } else {
      const msg = await res.text();
      setError(msg || 'Failed to set password. Contact admin.');
    }
  };

  // Step 3: Normal login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError || !data.user) {
      setError('Invalid credentials');
    } else {
      onAuthSuccess();
    }
  };

  // Admin login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);
    const res = await fetch('/.netlify/functions/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    setAdminLoading(false);
    if (res.ok) {
      localStorage.setItem('isAdmin', 'true');
      onAuthSuccess();
    } else {
      const { error } = await res.json();
      setAdminError(error || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl flex flex-col items-center animate-fade-in transition-all duration-500">
        {/* Logo and App Title */}
        <div className="mb-6 flex flex-col items-center">
          <img
            src={logo}
            alt="Logo"
            className="w-16 h-16 mb-2 drop-shadow-lg transition-transform duration-300 hover:scale-105"
          />
          <h1 className="text-3xl font-extrabold text-gray-800 mb-1">TaxEase Portal</h1>
          <span className="text-gray-500 text-sm">
            {adminMode ? 'Admin Login' : 'Sign in to your account'}
          </span>
        </div>

        <button
          className="mb-4 text-blue-600 underline"
          onClick={() => {
            setAdminMode(!adminMode);
            setError(null);
            setAdminError(null);
          }}
        >
          {adminMode ? 'User Login' : 'Login as Admin'}
        </button>

        {adminMode ? (
          <form onSubmit={handleAdminLogin} className="w-full flex flex-col gap-4">
            <input
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              placeholder="Admin Email"
              required
              className="border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
            <input
              type="password"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              placeholder="Admin Password"
              required
              className="border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
            {adminError && <div className="text-red-600 text-center font-medium bg-red-50 border border-red-200 rounded p-2">{adminError}</div>}
            <button
              type="submit"
              disabled={adminLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 font-semibold transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
            >
              {adminLoading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </form>
        ) : (
          <>
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                {error && <div className="text-red-600 text-center font-medium bg-red-50 border border-red-200 rounded p-2">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 font-semibold transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
                >
                  {loading ? 'Checking...' : 'Continue'}
                </button>
              </form>
            )}

            {step === 'setPassword' && (
              <form onSubmit={handleSetPassword} className="w-full flex flex-col gap-4">
                <h2 className="text-xl font-bold mb-2 text-center">Set Your Password</h2>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  required
                  className="border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  required
                  className="border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                {error && <div className="text-red-600 text-center font-medium bg-red-50 border border-red-200 rounded p-2">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 font-semibold transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
                >
                  {loading ? 'Setting Password...' : 'Set Password'}
                </button>
              </form>
            )}

            {step === 'login' && (
              <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                {error && <div className="text-red-600 text-center font-medium bg-red-50 border border-red-200 rounded p-2">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 font-semibold transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;