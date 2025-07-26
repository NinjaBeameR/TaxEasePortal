const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { email, role = 'user', ...companyData } = JSON.parse(event.body);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Create user with no password and must_set_password flag
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { must_set_password: true, role }
  });

  if (error) {
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
  }

  // Optionally, insert companyData into your companies table here

  return { statusCode: 200, body: JSON.stringify({ user: data.user }) };
};