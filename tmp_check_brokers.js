import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jszvedmmrdpqdfmwwtew.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bZUhTdn1baV_OBOtlvjXMQ_AlbWKO4_';

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
