import { useState } from 'react';
import { supabase } from '../../services/supabase';
import logo from '../../assets/logo.png'; // adjust path as needed

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      setError('Invalid credentials');
    } else {
      onAuthSuccess();
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message || 'Registration failed.');
    } else {
      setError(null);
      setSuccess('Account created! Please check your email to confirm and then log in.');
      setIsRegister(false);
      setEmail('');
      setPassword('');
    }
    setLoading(false);
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
          <span className="text-gray-500 text-sm">Sign in to your account</span>
        </div>
        <form
          onSubmit={isRegister ? handleRegister : handleSignIn}
          className="w-full flex flex-col gap-4"
        >
          <h2 className="text-xl font-bold mb-2 text-center">{isRegister ? 'Create Account' : 'Login'}</h2>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          {error && <div className="text-red-600 text-center font-medium bg-red-50 border border-red-200 rounded p-2">{error}</div>}
          {success && <div className="text-green-700 text-center font-medium bg-green-50 border border-green-200 rounded p-2">{success}</div>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 font-semibold transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
          >
            {loading ? (isRegister ? 'Registering...' : 'Logging in...') : (isRegister ? 'Register' : 'Login')}
          </button>
          <button
            type="button"
            className="text-blue-600 underline mt-2 transition"
            onClick={() => { setIsRegister(!isRegister); setError(null); setSuccess(null); }}
          >
            {isRegister ? 'Back to Login' : 'Create new account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;