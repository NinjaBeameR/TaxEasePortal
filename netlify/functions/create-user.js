const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { email, password, role = 'user', ...companyData } = JSON.parse(event.body);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Create user in Supabase Auth
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { must_set_password: true, role }
  });

  if (userError) {
    return { statusCode: 400, body: JSON.stringify({ error: userError.message }) };
  }

  // 2. Insert company/user info into companies table
  const { error: companyError } = await supabase
    .from('companies')
    .insert([{
      ...companyData,
      email,
      role,
      user_id: userData.user.id, // link to auth user
      created_at: new Date().toISOString()
    }]);

  if (companyError) {
    return { statusCode: 400, body: JSON.stringify({ error: companyError.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ user: userData.user }) };
};