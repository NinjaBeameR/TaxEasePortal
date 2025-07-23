const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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