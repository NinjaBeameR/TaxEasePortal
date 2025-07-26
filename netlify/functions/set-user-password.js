const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { email, password } = JSON.parse(event.body);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Find user by email
  const { data: { users }, error: findError } = await supabase.auth.admin.listUsers({ email });
  if (findError || !users || users.length === 0) {
    return { statusCode: 404, body: 'User not found' };
  }
  const user = users[0];
  if (!user.user_metadata?.must_set_password) {
    return { statusCode: 400, body: 'Password already set or not allowed' };
  }

  // Update password and clear flag
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    user_metadata: { ...user.user_metadata, must_set_password: false }
  });
  if (updateError) {
    return { statusCode: 400, body: updateError.message };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};