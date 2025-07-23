import { useState } from 'react';

const AdminPanel = () => {
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
  const [message, setMessage] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

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
      setEmail('');
      setPassword('');
      setBusinessName('');
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setStateVal('');
      setPincode('');
      setGstin('');
      setPhone('');
      setCompanyEmail('');
      setWebsite('');
      setLogo('');
    }
  };

  const handleCopy = () => {
    if (createdCredentials) {
      const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
      navigator.clipboard.writeText(text);
      setMessage('Credentials copied to clipboard!');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
      <form onSubmit={handleCreateUser} className="space-y-4">
        <div>
          <label className="block font-medium">User Email (Login)</label>
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
          <label className="block font-medium">Business Name</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium">Address Line 1</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={addressLine1}
            onChange={e => setAddressLine1(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Address Line 2</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={addressLine2}
            onChange={e => setAddressLine2(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">City</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">State</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={stateVal}
            onChange={e => setStateVal(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Pincode</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={pincode}
            onChange={e => setPincode(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">GSTIN</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={gstin}
            onChange={e => setGstin(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Phone</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Company Email</label>
          <input
            type="email"
            className="border rounded px-3 py-2 w-full"
            value={companyEmail}
            onChange={e => setCompanyEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Website</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={website}
            onChange={e => setWebsite(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">Logo URL</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={logo}
            onChange={e => setLogo(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create User & Company
        </button>
      </form>
      {createdCredentials && (
        <div className="mt-6 p-4 bg-gray-100 rounded border">
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
      {message && <div className="mt-4 text-green-600">{message}</div>}
    </div>
  );
};

export default AdminPanel;