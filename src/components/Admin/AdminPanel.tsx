import { useState } from 'react';
import { supabase } from '../../services/supabase';

const AdminPanel = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [message, setMessage] = useState('');

  // Create a new user and company
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    // Create user using Supabase Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'user' }
    });
    if (error) {
      setMessage('Error creating user: ' + error.message);
      return;
    }
    // Insert company details (optional, adjust as needed)
    await supabase.from('companies').insert([
      {
        user_id: data.user?.id,
        name: companyName,
        // ...other company fields...
      }
    ]);
    setMessage('User and company created! Share these credentials with the user.');
    setEmail('');
    setPassword('');
    setCompanyName('');
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
      <form onSubmit={handleCreateUser} className="space-y-4">
        <div>
          <label className="block font-medium">User Email</label>
          <input
            type="email"
            className="border rounded px-3 py-2 w-full"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium">Password</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium">Company Name</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create User & Company
        </button>
      </form>
      {message && <div className="mt-4 text-green-600">{message}</div>}
    </div>
  );
};

export default AdminPanel;