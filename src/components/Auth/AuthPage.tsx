import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

function getFriendlyErrorMessage(error: string) {
  if (!error) return '';
  if (error.includes('invalid email')) return 'Please enter a valid email address.';
  if (error.includes('password')) return 'Password must be at least 6 characters.';
  if (error.includes('already registered')) return 'This email is already registered. Please login.';
  if (error.includes('Failed to fetch')) return 'Network error. Please check your connection.';
  if (error.includes('rate limit')) return 'Too many attempts. Please try again later.';
  if (error.includes('server error')) return 'Server error. Please try again later.';
  return error;
}

const AuthPage = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [adminExists, setAdminExists] = useState(false);

  useEffect(() => {
    // Check if any admin exists
    supabase
      .from('companies')
      .select('id')
      .eq('role', 'admin')
      .then(({ data }) => {
        setAdminExists(!!(data && data.length > 0));
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Extra validation before calling Supabase
    if (!email || !password || password.length < 6) {
      setError('Please enter a valid email and a password with at least 6 characters.');
      setLoading(false);
      return;
    }

    let result;
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
      // After successful signUp, call backend to create company row
      if (!result.error && result.data?.user?.id) {
        await fetch('/.netlify/functions/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            // Add other company fields here if needed
            role: makeAdmin ? 'admin' : 'user'
          })
        });
      }
    }

    if (result.error) {
      setError(getFriendlyErrorMessage(result.error.message));
    } else {
      onAuthSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Enter your Email"
          className="w-full px-3 py-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Set a Password"
          className="w-full px-3 py-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {/* Show admin checkbox only if registering and no admin exists */}
        {!isLogin && !adminExists && (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={makeAdmin}
              onChange={e => setMakeAdmin(e.target.checked)}
            />
            <span>Make this an admin account</span>
          </label>
        )}
        {error && (
          <div className="text-red-500 border border-red-200 bg-red-50 rounded px-3 py-2 mb-2">
            {getFriendlyErrorMessage(error)}
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          className="text-blue-600 underline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;