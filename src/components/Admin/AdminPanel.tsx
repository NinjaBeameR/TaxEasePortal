import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient'; // Adjust the import based on your project structure

// Helper modal component
function Modal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl">&times;</button>
        {children}
      </div>
    </div>
  );
}

const AdminPanel = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ userId: string, email: string } | null>(null);

  // Form states for modal
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');

  // Fetch users and companies
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch users
      const usersRes = await fetch('/.netlify/functions/get-users');
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
      // Build company map for quick lookup
      const companyMap: { [key: string]: any } = {};
      (usersData.companies || []).forEach((c: any) => { companyMap[c.id] = c; });
      setCompanies(companyMap);
      setLoading(false);
    };
    fetchData();
  }, [modalOpen, message]); // refetch after modal closes or message changes

  // Create user handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setCreatedCredentials(null);
    const res = await fetch('/.netlify/functions/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        business_name: businessName,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city,
        state: stateVal,
        pincode,
        gstin,
        phone,
        company_email: companyEmail,
        website,
        logo,
      }),
    });
    const data = await res.json();
    if (data.error) {
      setMessage('Error: ' + data.error);
    } else {
      setMessage('User created! Share these credentials with the user.');
      setCreatedCredentials({ email, password });
      setModalOpen(false);
      // Reset form
      setEmail(''); setPassword(''); setBusinessName(''); setAddressLine1(''); setAddressLine2('');
      setCity(''); setStateVal(''); setPincode(''); setGstin(''); setPhone(''); setCompanyEmail(''); setWebsite(''); setLogo('');
    }
  };

  // Reset password handler
  const handleResetPassword = async (email: string) => {
    setMessage('');
    const res = await fetch('/.netlify/functions/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.error) {
      setMessage('Error: ' + data.error);
    } else {
      setMessage('Password reset email sent!');
    }
  };

  // Delete user handler
  const handleDeleteUser = async (userId: string) => {
    setMessage('');
    setConfirmDelete(null);
    const res = await fetch('/.netlify/functions/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    if (data.error) {
      setMessage('Error: ' + data.error);
    } else {
      setMessage('User deleted!');
    }
  };

  const handleCopy = () => {
    if (createdCredentials) {
      const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
      navigator.clipboard.writeText(text);
      setMessage('Credentials copied to clipboard!');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 bg-white p-8 rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Create New User
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 ml-4"
          >
            Logout
          </button>
        </div>
      </div>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2">GSTIN</th>
                <th className="px-4 py-2">Created At</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const company = companies[user.company_id] || {};
                return (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.role}</td>
                    <td className="px-4 py-2">{company.business_name || '-'}</td>
                    <td className="px-4 py-2">{company.gstin || '-'}</td>
                    <td className="px-4 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleResetPassword(user.email)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ userId: user.user_id, email: user.email })}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h3 className="text-xl font-bold mb-4">Create New User & Company</h3>
        <form onSubmit={handleCreateUser} className="space-y-3">
          <div>
            <label className="block font-medium">User Email (Login)</label>
            <input type="email" className="border rounded px-3 py-2 w-full" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium">Password</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium">Business Name</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium">Address Line 1</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium">Address Line 2</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium">City</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium">State</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={stateVal} onChange={e => setStateVal(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium">Pincode</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={pincode} onChange={e => setPincode(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium">GSTIN</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={gstin} onChange={e => setGstin(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium">Phone</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium">Company Email</label>
            <input type="email" className="border rounded px-3 py-2 w-full" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium">Website</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={website} onChange={e => setWebsite(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium">Logo URL</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={logo} onChange={e => setLogo(e.target.value)} />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full mt-2">
            Create User & Company
          </button>
        </form>
        {createdCredentials && (
          <div className="mt-4 p-3 bg-gray-100 rounded border">
            <div className="mb-2 font-semibold">Credentials:</div>
            <div className="mb-2">
              <span className="font-medium">Email:</span> {createdCredentials.email}<br />
              <span className="font-medium">Password:</span> {createdCredentials.password}
            </div>
            <button
              onClick={handleCopy}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Copy Credentials
            </button>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <div className="text-lg font-semibold mb-4">Delete User</div>
        <div className="mb-4">Are you sure you want to delete user <span className="font-bold">{confirmDelete?.email}</span>? This cannot be undone.</div>
        <div className="flex gap-4">
          <button
            onClick={() => confirmDelete && handleDeleteUser(confirmDelete.userId)}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Delete
          </button>
          <button
            onClick={() => setConfirmDelete(null)}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel;