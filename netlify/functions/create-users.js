const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key (never expose to browser)
);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, password, companyName } = JSON.parse(event.body);

  // Create user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
  }

  // Insert company info
  await supabase.from('companies').insert([
    { user_id: data.user.id, name: companyName, role: 'user' }
  ]);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};