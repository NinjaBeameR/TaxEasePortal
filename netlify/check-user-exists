const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { email } = JSON.parse(event.body);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ email });
  if (error || !users || users.length === 0) {
    return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  }
  const user = users[0];
  return {
    statusCode: 200,
    body: JSON.stringify({
      must_set_password: !!user.user_metadata?.must_set_password
    })
  };
};