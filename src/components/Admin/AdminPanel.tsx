import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

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
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

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

  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  // Fetch all companies for the admin table
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      setCompanies(data || []);
      setLoading(false);
    };
    fetchCompanies();
  }, [modalOpen, message]); // refetch after modal closes or message changes

  // Fetch logged-in admin's company info
  useEffect(() => {
    const fetchCompany = async () => {
      setLoadingCompany(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCompany(null);
        setLoadingCompany(false);
        return;
      }
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setCompany(companyData);
      setLoadingCompany(false);
    };
    fetchCompany();
  }, []);

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

  const handleCopy = () => {
    if (createdCredentials) {
      const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
      navigator.clipboard.writeText(text);
      setMessage('Credentials copied to clipboard!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loadingCompany) return <div>Loading...</div>;
  if (!company || company.role !== 'admin') {
    return <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded shadow text-center text-red-600 font-bold">
      Access Denied: You are not an admin.
    </div>;
  }

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
              </tr>
            </thead>
            <tbody>
              {companies.map(cmp => (
                <tr key={cmp.id} className="border-t">
                  <td className="px-4 py-2">{cmp.email}</td>
                  <td className="px-4 py-2">{cmp.role}</td>
                  <td className="px-4 py-2">{cmp.business_name}</td>
                  <td className="px-4 py-2">{cmp.gstin}</td>
                  <td className="px-4 py-2">{new Date(cmp.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
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
    </div>
  );
};

export default AdminPanel;