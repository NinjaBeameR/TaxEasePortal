const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { email, password } = JSON.parse(event.body);

  if (!email || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email and password required' }) };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Find the user by email
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ email });
  if (error || !users || users.length === 0) {
    return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  }
  const user = users[0];

  // 2. Update the user's password in Supabase Auth
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    user_metadata: { ...user.user_metadata, must_set_password: false }
  });
  if (updateError) {
    return { statusCode: 400, body: JSON.stringify({ error: updateError.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};