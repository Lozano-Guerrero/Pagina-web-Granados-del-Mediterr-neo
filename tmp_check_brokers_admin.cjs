const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrokers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, is_active, account_status, is_referred')
    .eq('role', 'broker')
    .limit(10);
    
  if (error) {
    console.error("Error fetching brokers:", error);
    return;
  }
  
  console.log("Sample brokers:");
  console.table(data);
}

checkBrokers();
