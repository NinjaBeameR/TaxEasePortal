import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';

interface AuthPageProps {
  onAuthSuccess: () => void;
  setShowAdminPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthPage = ({ onAuthSuccess, setShowAdminPanel }: AuthPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'user' | 'admin'>('user');
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

      if (!adminData || password !== adminData.password) {
        setError('Invalid admin credentials');
        setLoading(false);
        return;
      }

      // Successful admin login (no Supabase Auth)
      setShowAdminPanel(true);
      localStorage.setItem('isAdmin', 'true'); // Persist admin session
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

  return (
    <form onSubmit={handleSignIn}>
      <select value={role} onChange={e => setRole(e.target.value as 'user' | 'admin')}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default AuthPage;