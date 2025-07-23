const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Destructure all company fields from the request body
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

  // Insert company and get its id
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
      logo
    }])
    .select()
    .single();

  if (companyError) {
    return { statusCode: 400, body: JSON.stringify({ error: companyError.message }) };
  }

  // Insert user info into users table
  const { data: userRow, error: userError } = await supabase.from('users').insert([
    {
      user_id: data.user.id,
      email: email,
      role: 'user',
      company_id: companyData.id,
    }
  ]).select().single();

  if (userError) {
    return { statusCode: 400, body: JSON.stringify({ error: userError.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      user: {
        user_id: data.user.id,
        email: email,
        company_id: companyData.id,
        company: companyData,
        user_row: userRow
      }
    })
  };
};