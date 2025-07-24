import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';

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

interface AuthPageProps {
  onAuthSuccess: () => void;
  setShowAdminPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthPage = ({ onAuthSuccess, setShowAdminPanel }: AuthPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'user' | 'admin'>('user'); // <-- Add role state
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (role === 'admin') {
      // Check admin table for credentials
      const { data: adminData } = await supabase
        .from('admin')
        .select('*')
        .eq('email', email)
        .single();

      if (!adminData) {
        console.log('No admin found for email:', email);
        setError('Invalid admin credentials');
        setLoading(false);
        return;
      }
      console.log('Admin row:', adminData);

      // Compare hashed password
      const passwordMatch = await bcrypt.compare(password, adminData.password);
      console.log('Password match:', passwordMatch);

      if (!passwordMatch) {
        setError('Invalid admin credentials');
        setLoading(false);
        return;
      }

      // FIX: Set admin panel state before navigating
      setShowAdminPanel(true);
      navigate('/admin');
      setLoading(false);
      return;
    }

    // User login flow
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      setError('Invalid credentials');
      setLoading(false);
      return;
    }
    // Check if user exists in companies table
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (!company) {
      setError('No company found for this user.');
      setLoading(false);
      return;
    }
    navigate('/dashboard');
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Registration only for users, not admins
    if (!email || !password || password.length < 6) {
      setError('Please enter a valid email and a password with at least 6 characters.');
      setLoading(false);
      return;
    }

    const result = await supabase.auth.signUp({ email, password });
    // After successful signUp, call backend to create company row
    if (!result.error && result.data?.user?.id) {
      await fetch('/.netlify/functions/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          // Add other company fields here if needed
          role: 'user'
        })
      });
    }

    if (result.error) {
      setError(getFriendlyErrorMessage(result.error.message));
    } else {
      onAuthSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Login' : 'Register'}</h2>
        <form onSubmit={isLogin ? handleSignIn : handleSubmit} className="space-y-5">
          {isLogin && (
            <div>
              <label className="block font-medium mb-1">Login As</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'user' | 'admin')}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your Email"
              className="border rounded px-3 py-2 w-full"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Set a Password"
              className="border rounded px-3 py-2 w-full"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="text-red-500 border border-red-200 bg-red-50 rounded px-3 py-2 mb-2 text-center">
              {getFriendlyErrorMessage(error)}
            </div>
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded w-full font-semibold shadow hover:bg-blue-700 transition"
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
    </div>
  );
};

export default AuthPage;