const bcrypt = require('bcryptjs');
const plainPassword = 'admin@tep25';
bcrypt.hash(plainPassword, 10, (err, hash) => {
  console.log(hash); // Copy this hash to your Supabase admin table
});