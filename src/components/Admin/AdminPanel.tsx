import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function useSupabaseUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return user;
}

function Modal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-slide-up">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl transition-colors">&times;</button>
        {children}
      </div>
    </div>
  );
}

const AdminPanel: React.FC = () => {
  const user = useSupabaseUser();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Multi-step form state
  const [step, setStep] = useState(1);

  // Form fields
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
  const [formError, setFormError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Redirect admin away from non-admin routes
  useEffect(() => {
    if (localStorage.getItem('isAdmin') === 'true' && location.pathname !== '/admin') {
      navigate('/admin', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      setCompanies(data || []);
      setLoading(false);
    };
    fetchCompanies();
  }, [modalOpen, message]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setCreatedCredentials(null);

    // Basic validation
    if (step === 1) {
      if (!businessName || !companyEmail) {
        setFormError('Please fill all required company fields.');
        return;
      }
      setFormError(null);
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!email || !password) {
        setFormError('Please fill all required user fields.');
        return;
      }
      setFormError(null);
    }

    // Only submit on last step
    if (step !== 2) return;

    const res = await fetch('/.netlify/functions/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        role: 'user',
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
      setStep(1);
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
    // Sign out from Supabase session
    await supabase.auth.signOut();
    // Clear all local/session storage
    localStorage.clear();
    sessionStorage.clear();
    // Redirect to login page
    window.location.href = '/';
  };

  if (user === null) return <div>Loading...</div>;
  if (!localStorage.getItem('isAdmin')) {
    return <div>Access Denied: You are not an admin.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-10 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8 bg-white rounded-xl shadow-lg px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-full shadow" />
            <h2 className="text-3xl font-extrabold tracking-tight text-blue-800">Admin Dashboard</h2>
          </div>
          <div>
            <button
              onClick={() => { setModalOpen(true); setStep(1); }}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition-all duration-150 mr-2"
            >
              + Create New User
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-150"
            >
              Logout
            </button>
          </div>
        </div>
        {message && <div className="mb-4 text-green-700 bg-green-100 border border-green-200 rounded px-4 py-2 shadow">{message}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow-xl border border-gray-200 animate-fade-in">
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Business</th>
                <th className="px-4 py-3 font-semibold">GSTIN</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Company Email</th>
                <th className="px-4 py-3 font-semibold">Website</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="px-4 py-3 font-semibold">Pincode</th>
                <th className="px-4 py-3 font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-400">No users found.</td>
                </tr>
              )}
              {companies.map((cmp, idx) => (
                <tr
                  key={cmp.id}
                  className={`border-t transition-all duration-150 hover:bg-blue-50 hover:scale-[1.01] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ boxShadow: idx % 2 === 0 ? '0 1px 2px #e0e7ef' : undefined }}
                >
                  <td className="px-4 py-3">{cmp.email}</td>
                  <td className="px-4 py-3">{cmp.role}</td>
                  <td className="px-4 py-3">{cmp.business_name}</td>
                  <td className="px-4 py-3">{cmp.gstin}</td>
                  <td className="px-4 py-3">{cmp.phone}</td>
                  <td className="px-4 py-3">{cmp.company_email}</td>
                  <td className="px-4 py-3">{cmp.website}</td>
                  <td className="px-4 py-3">{cmp.city}</td>
                  <td className="px-4 py-3">{cmp.state}</td>
                  <td className="px-4 py-3">{cmp.pincode}</td>
                  <td className="px-4 py-3">{new Date(cmp.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-step Create User Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h3 className="text-xl font-bold mb-4 text-blue-800">Create New User & Company</h3>
        <div className="mb-2 text-sm text-gray-600">Step {step} of 2</div>
        <form onSubmit={handleCreateUser} className="space-y-3">
          {step === 1 && (
            <>
              <div>
                <label className="block font-medium">Business Name *</label>
                <input type="text" className="border rounded px-3 py-2 w-full" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
              </div>
              <div>
                <label className="block font-medium">Company Email *</label>
                <input type="email" className="border rounded px-3 py-2 w-full" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block font-medium">Address Line 1</label>
                <input type="text" className="border rounded px-3 py-2 w-full" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium">Address Line 2</label>
                <input type="text" className="border rounded px-3 py-2 w-full" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-medium">City</label>
                  <input type="text" className="border rounded px-3 py-2 w-full" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block font-medium">State</label>
                  <input type="text" className="border rounded px-3 py-2 w-full" value={stateVal} onChange={e => setStateVal(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-medium">Pincode</label>
                  <input type="text" className="border rounded px-3 py-2 w-full" value={pincode} onChange={e => setPincode(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block font-medium">GSTIN</label>
                  <input type="text" className="border rounded px-3 py-2 w-full" value={gstin} onChange={e => setGstin(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block font-medium">Website</label>
                <input type="text" className="border rounded px-3 py-2 w-full" value={website} onChange={e => setWebsite(e.target.value)} />
              </div>
              <div>
                <label className="block font-medium">Logo URL</label>
                <input type="text" className="border rounded px-3 py-2 w-full" value={logo} onChange={e => setLogo(e.target.value)} />
              </div>
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-all"
                  onClick={() => {
                    if (!businessName || !companyEmail) {
                      setFormError('Please fill all required company fields.');
                    } else {
                      setFormError(null);
                      setStep(2);
                    }
                  }}
                >
                  Next
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <label className="block font-medium">User Email (Login) *</label>
                <input type="email" className="border rounded px-3 py-2 w-full" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block font-medium">Password *</label>
                <input type="text" className="border rounded px-3 py-2 w-full" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="block font-medium">Phone</label>
                <input type="text" className="border rounded px-3 py-2 w-full" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              <div className="flex justify-between gap-2 mt-4">
                <button
                  type="button"
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-400 transition-all"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-all"
                >
                  Create User & Company
                </button>
              </div>
            </>
          )}
        </form>
        {createdCredentials && (
          <div className="mt-4 p-3 bg-gray-100 rounded border animate-fade-in">
            <div className="mb-2 font-semibold">Credentials:</div>
            <div className="mb-2">
              <span className="font-medium">Email:</span> {createdCredentials.email}<br />
              <span className="font-medium">Password:</span> {createdCredentials.password}
            </div>
            <button
              onClick={handleCopy}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-all"
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