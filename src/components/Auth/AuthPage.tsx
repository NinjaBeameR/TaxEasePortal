import { useState } from 'react';
import { supabase } from '../../services/supabase';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message || 'Registration failed.');
    } else {
      setError(null);
      setIsRegister(false);
      setEmail('');
      setPassword('');
      alert('Account created! Please check your email to confirm and then log in.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={isRegister ? handleRegister : handleSignIn}
        className="bg-white p-8 rounded shadow max-w-sm w-full flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">{isRegister ? 'Create Account' : 'Login'}</h2>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="border rounded px-3 py-2"
        />
        {error && <div className="text-red-600 text-center">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? (isRegister ? 'Registering...' : 'Logging in...') : (isRegister ? 'Register' : 'Login')}
        </button>
        <button
          type="button"
          className="text-blue-600 underline mt-2"
          onClick={() => { setIsRegister(!isRegister); setError(null); }}
        >
          {isRegister ? 'Back to Login' : 'Create new account'}
        </button>
      </form>
    </div>
  );
};

export default AuthPage;