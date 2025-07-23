const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,        // <-- NOT VITE_
  process.env.SUPABASE_ANON_KEY    // <-- NOT VITE_
);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const {
    email, password,
    business_name, address_line1, address_line2, city, state, pincode,
    gstin, phone, company_email, website, logo
  } = JSON.parse(event.body);

  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
  }

  // Insert company and link to user
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .insert([{
      business_name,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      gstin,
      phone,
      email: company_email,
      website,
      logo,
      user_id: data.user.id // <-- Link company to user
    }])
    .select()
    .single();

  if (companyError) {
    return { statusCode: 400, body: JSON.stringify({ error: companyError.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      company: companyData
    })
  };
};