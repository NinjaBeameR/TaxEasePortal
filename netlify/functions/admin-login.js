const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin ops
);

const ADMIN_EMAIL = "admin_tep25@tep.admin.in"; // <-- Set your admin email here

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { email, password } = JSON.parse(event.body);

    if (email !== ADMIN_EMAIL) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Not authorized" }),
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // console.log({ email, error, data }); // Remove in production

    if (error || !data.user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Internal Server Error" }),
    };
  }
};