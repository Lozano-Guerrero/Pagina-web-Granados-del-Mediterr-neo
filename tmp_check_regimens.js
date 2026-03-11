import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
    // Check regimens_master
    const { data: masters, error: mErr } = await supabase
        .from('regimens_master')
        .select('*')
        .order('created_at', { ascending: false });

    console.log('--- regimens_master ---');
    console.table(masters);

    // Check user_regimens to see what users actually signed
    const { data: userRegs, error: uErr } = await supabase
        .from('user_regimens')
        .select('id, user_id, regimen_id, status, regimens_master(target, display_name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('--- active user_regimens ---');
    console.table(userRegs);
}

check();
