const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin ops
);

const ADMIN_EMAIL = "admin_tep25@tep.admin.in"; // <-- Set your admin email here

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { email, password } = JSON.parse(event.body);

  // Only allow the hardcoded admin email
  if (email !== ADMIN_EMAIL) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Not authorized" }),
    };
  }

  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log({ email, error, data }); // Add this line for debugging

  if (error || !data.user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid credentials" }),
    };
  }

  // Success: return minimal info (never return password)
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};