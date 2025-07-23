const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,        // <-- NOT VITE_
  process.env.SUPABASE_ANON_KEY    // <-- NOT VITE_
);

exports.handler = async function(event, context) {
  // Fetch all users
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*');
  if (userError) {
    return { statusCode: 400, body: JSON.stringify({ error: userError.message }) };
  }

  // Fetch all companies
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('*');
  if (companyError) {
    return { statusCode: 400, body: JSON.stringify({ error: companyError.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ users, companies })
  };
};