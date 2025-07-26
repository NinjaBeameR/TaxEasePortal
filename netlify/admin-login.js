const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs'); // Add bcryptjs to your dependencies

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { email, password } = JSON.parse(event.body);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch admin by email
  const { data, error } = await supabase
    .from('admin_cred')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
  }

  // Compare password hash
  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
  }

  // Optionally, generate a JWT or session token here for extra security

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};