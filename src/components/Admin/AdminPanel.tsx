import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// Accessible Modal with focus trap and Esc close
function Modal({
  open,
  onClose,
  children,
  labelledBy = 'modal-title',
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Trap focus
      if (e.key === 'Tab' && ref.current) {
        const focusable = ref.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    // Focus first input/button
    setTimeout(() => {
      ref.current?.querySelector<HTMLElement>('input,button')?.focus();
    }, 10);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in"
      aria-modal="true"
      role="dialog"
      aria-labelledby={labelledBy}
    >
      <div
        ref={ref}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 relative animate-slide-up outline-none"
        tabIndex={-1}
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl transition-colors"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

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

  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [search, setSearch] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [stats, setStats] = useState({ total: 0, active: 0, recent: 0 });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<any | null>(null);

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Button loading states
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

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
  }, [modalOpen, message, editModalOpen]);

  useEffect(() => {
    async function fetchStats() {
      const { count: total } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      const { count: recent } = await supabase.from('companies').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString());
      setStats({ total: total || 0, active: 0, recent: recent || 0 });
    }
    fetchStats();
  }, [companies]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setCreatedCredentials(null);
    setCreateLoading(true);

    // Basic validation
    if (step === 1) {
      if (!businessName || !companyEmail) {
        setFormError('Please fill all required company fields.');
        setCreateLoading(false);
        return;
      }
      setFormError(null);
      setStep(2);
      setCreateLoading(false);
      return;
    }
    if (step === 2) {
      if (!email || !password) {
        setFormError('Please fill all required user fields.');
        setCreateLoading(false);
        return;
      }
      setFormError(null);
    }

    // Only submit on last step
    if (step !== 2) {
      setCreateLoading(false);
      return;
    }

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
      setFormError('Error: ' + data.error);
    } else {
      setToast({ type: 'success', message: 'User created! Share these credentials with the user.' });
      setCreatedCredentials({ email, password });
      setModalOpen(false);
      // Reset form
      setEmail(''); setPassword(''); setBusinessName(''); setAddressLine1(''); setAddressLine2('');
      setCity(''); setStateVal(''); setPincode(''); setGstin(''); setPhone(''); setCompanyEmail(''); setWebsite(''); setLogo('');
      setStep(1);
    }
    setCreateLoading(false);
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
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleteLoading(true);
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', userId);

    if (error) {
      setToast({ type: 'error', message: 'Error deleting user: ' + error.message });
    } else {
      setToast({ type: 'success', message: 'User deleted successfully.' });
      setMessage('User deleted successfully.');
    }
    setDeleteLoading(false);
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const exportCSV = () => {
    const headers = ['Email','Role','Business','GSTIN','Phone','Company Email','Website','City','State','Pincode','Created At'];
    const rows = filteredCompanies.slice((page-1)*pageSize, page*pageSize).map(cmp =>
      [cmp.email, cmp.role, cmp.business_name, cmp.gstin, cmp.phone, cmp.company_email, cmp.website, cmp.city, cmp.state, cmp.pincode, new Date(cmp.created_at).toLocaleDateString()]
    );
    const csv = [headers, ...rows].map(r => r.map(x => `"${x||''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (user === null) return <div>Loading...</div>;
  if (!localStorage.getItem('isAdmin')) {
    return <div>Access Denied: You are not an admin.</div>;
  }

  // Filter companies based on search
  const filteredCompanies = companies.filter(cmp =>
    [cmp.email, cmp.business_name, cmp.city, cmp.company_email].some(field =>
      (field || '').toLowerCase().includes(search.toLowerCase())
    )
  );
  const totalPages = Math.ceil(filteredCompanies.length / pageSize);

  // Responsive: Table on desktop, cards on mobile
  const isMobile = window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 animate-fade-in">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-white rounded-xl shadow-lg px-4 sm:px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-800">Admin Dashboard</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setModalOpen(true); setStep(1); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-all duration-150"
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
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white animate-fade-in ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.message}
          </div>
        )}
        {message && <div className="mb-4 text-green-700 bg-green-100 border border-green-200 rounded px-4 py-2 shadow">{message}</div>}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></span>
            <span className="text-blue-700 font-semibold">Loading users...</span>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search by email, business, city..."
                className="border px-3 py-2 rounded w-full sm:w-64"
                value={search}
                aria-label="Search users"
                onChange={e => setSearch(e.target.value)}
              />
              <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition-all">
                Export CSV
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                <div className="text-gray-600">Total Users</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <div className="text-2xl font-bold text-green-700">{stats.recent}</div>
                <div className="text-gray-600">Recent Signups (7d)</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                <div className="text-2xl font-bold text-gray-700">{stats.active}</div>
                <div className="text-gray-600">Active Users</div>
              </div>
            </div>
            {/* Table for desktop, cards for mobile */}
            {!isMobile ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-xl shadow-xl border border-gray-200 animate-fade-in">
                  <thead className="sticky top-0 bg-blue-50 z-10">
                    <tr className="text-blue-900">
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
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center py-8 text-gray-400">No users found.</td>
                      </tr>
                    )}
                    {filteredCompanies.slice((page-1)*pageSize, page*pageSize).map((cmp, idx) => (
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
                        <td>
                          <button
                            className="text-blue-600 hover:underline mr-2"
                            onClick={() => {
                              setEditCompany(cmp);
                              setEditModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => {
                              setPendingDeleteId(cmp.id);
                              setConfirmOpen(true);
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredCompanies.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No users found.</div>
                )}
                {filteredCompanies.slice((page-1)*pageSize, page*pageSize).map((cmp) => (
                  <div key={cmp.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
                    <div className="font-semibold text-blue-800">{cmp.business_name}</div>
                    <div className="text-sm text-gray-600">{cmp.email}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>Role: {cmp.role}</span>
                      <span>GSTIN: {cmp.gstin}</span>
                      <span>Phone: {cmp.phone}</span>
                      <span>City: {cmp.city}</span>
                      <span>State: {cmp.state}</span>
                      <span>Pincode: {cmp.pincode}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                          setEditCompany(cmp);
                          setEditModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => {
                          setPendingDeleteId(cmp.id);
                          setConfirmOpen(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1 rounded bg-gray-200">Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p+1)} className="px-3 py-1 rounded bg-gray-200">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Multi-step Create User Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} labelledBy="create-user-title">
        <h3 id="create-user-title" className="text-2xl font-bold mb-6 text-blue-800">Create New User & Company</h3>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Step {step} of 2</span>
            <span className="text-sm text-gray-500">
              {step === 1 ? 'Company Information' : 'User Credentials'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-6" aria-label="Create user form">
          {step === 1 && (
            <div className="space-y-6">
              {/* Basic Company Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-800 text-lg border-b border-gray-200 pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="businessName" className="block font-medium text-gray-700 mb-1">Business Name *</label>
                    <input id="businessName" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={businessName} onChange={e => setBusinessName(e.target.value)} required aria-required="true" />
                  </div>
                  <div>
                    <label htmlFor="companyEmail" className="block font-medium text-gray-700 mb-1">Company Email *</label>
                    <input id="companyEmail" type="email" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} required aria-required="true" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="gstin" className="block font-medium text-gray-700 mb-1">GSTIN</label>
                    <input id="gstin" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={gstin} onChange={e => setGstin(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="website" className="block font-medium text-gray-700 mb-1">Website</label>
                    <input id="website" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" />
                  </div>
                </div>
                <div>
                  <label htmlFor="logo" className="block font-medium text-gray-700 mb-1">Logo URL</label>
                  <input id="logo" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://example.com/logo.png" />
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-800 text-lg border-b border-gray-200 pb-2">Address Details</h4>
                <div>
                  <label htmlFor="addressLine1" className="block font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input id="addressLine1" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="addressLine2" className="block font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input id="addressLine2" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block font-medium text-gray-700 mb-1">City</label>
                    <input id="city" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="stateVal" className="block font-medium text-gray-700 mb-1">State</label>
                    <input id="stateVal" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={stateVal} onChange={e => setStateVal(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="pincode" className="block font-medium text-gray-700 mb-1">Pincode</label>
                    <input id="pincode" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={pincode} onChange={e => setPincode(e.target.value)} />
                  </div>
                </div>
              </div>

              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">{formError}</div>}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 transition-all duration-200 font-medium"
                  onClick={() => {
                    if (!businessName || !companyEmail) {
                      setFormError('Please fill all required company fields.');
                    } else {
                      setFormError(null);
                      setStep(2);
                    }
                  }}
                >
                  Next: User Details →
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              {/* User Credentials */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-800 text-lg border-b border-gray-200 pb-2">User Login Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="userEmail" className="block font-medium text-gray-700 mb-1">User Email (Login) *</label>
                    <input id="userEmail" type="email" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={email} onChange={e => setEmail(e.target.value)} required aria-required="true" placeholder="user@example.com" />
                  </div>
                  <div>
                    <label htmlFor="userPassword" className="block font-medium text-gray-700 mb-1">Password *</label>
                    <input id="userPassword" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={password} onChange={e => setPassword(e.target.value)} required aria-required="true" placeholder="Enter password" />
                  </div>
                </div>
                <div>
                  <label htmlFor="userPhone" className="block font-medium text-gray-700 mb-1">Phone Number</label>
                  <input id="userPhone" type="text" className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" />
                </div>
              </div>

              {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">{formError}</div>}
              
              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md shadow hover:bg-gray-400 transition-all duration-200 font-medium"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className={`bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 transition-all duration-200 flex items-center justify-center font-medium ${createLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={createLoading}
                  aria-busy={createLoading}
                >
                  {createLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Creating...
                    </span>
                  ) : (
                    'Create User & Company'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
        {createdCredentials && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 animate-fade-in">
            <div className="mb-3 font-semibold text-green-800 text-lg">✅ User Created Successfully!</div>
            <div className="mb-3 text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border">
                  <span className="font-medium text-gray-600">Email:</span>
                  <div className="font-mono text-sm text-gray-800">{createdCredentials.email}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="font-medium text-gray-600">Password:</span>
                  <div className="font-mono text-sm text-gray-800">{createdCredentials.password}</div>
                </div>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-all duration-200 font-medium"
            >
              📋 Copy Credentials
            </button>
          </div>
        )}
      </Modal>

      {/* Edit User Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} labelledBy="edit-user-title">
        <h3 id="edit-user-title" className="text-xl font-bold mb-4 text-blue-800">Edit User & Company</h3>
        {editCompany && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setEditLoading(true);
              const { error } = await supabase
                .from('companies')
                .update({
                  business_name: editCompany.business_name,
                  address_line1: editCompany.address_line1,
                  address_line2: editCompany.address_line2,
                  city: editCompany.city,
                  state: editCompany.state,
                  pincode: editCompany.pincode,
                  gstin: editCompany.gstin,
                  phone: editCompany.phone,
                  company_email: editCompany.company_email,
                  website: editCompany.website,
                  logo: editCompany.logo,
                })
                .eq('id', editCompany.id);
              if (error) {
                setToast({ type: 'error', message: 'Error updating user: ' + error.message });
              } else {
                setToast({ type: 'success', message: 'User updated successfully.' });
                setEditModalOpen(false);
                setEditCompany(null);
                setMessage('User updated successfully.');
              }
              setEditLoading(false);
            }}
            className="space-y-3"
            aria-label="Edit user form"
          >
            <div>
              <label htmlFor="editBusinessName" className="block font-medium">Business Name</label>
              <input id="editBusinessName" type="text" className="border rounded px-3 py-2 w-full" value={editCompany.business_name}
                onChange={e => setEditCompany({ ...editCompany, business_name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="editCompanyEmail" className="block font-medium">Company Email</label>
              <input id="editCompanyEmail" type="email" className="border rounded px-3 py-2 w-full" value={editCompany.company_email}
                onChange={e => setEditCompany({ ...editCompany, company_email: e.target.value })} />
            </div>
            <div>
              <label htmlFor="editPhone" className="block font-medium">Phone</label>
              <input id="editPhone" type="text" className="border rounded px-3 py-2 w-full" value={editCompany.phone}
                onChange={e => setEditCompany({ ...editCompany, phone: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="bg-gray-300 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-400 transition-all"
                onClick={() => setEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className={`bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-all flex items-center justify-center ${editLoading ? 'opacity-60 cursor-not-allowed' : ''}`} disabled={editLoading} aria-busy={editLoading}>
                {editLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Improved Confirmation Dialog */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} labelledBy="confirm-delete-title">
        <h3 id="confirm-delete-title" className="text-lg font-bold mb-4 text-red-700">Confirm Delete</h3>
        <div className="mb-4">Are you sure you want to delete this user?</div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          <button
            onClick={() => pendingDeleteId && handleDeleteUser(pendingDeleteId)}
            className={`bg-red-600 text-white px-4 py-2 rounded flex items-center justify-center ${deleteLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={deleteLoading}
            aria-busy={deleteLoading}
          >
            {deleteLoading ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel;