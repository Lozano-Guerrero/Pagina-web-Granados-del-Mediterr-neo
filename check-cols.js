const supabaseUrl = 'https://jszvedmmrdpqdfmwwtew.supabase.co';
const supabaseAnonKey = 'sb_publishable_bZUhTdn1baV_OBOtlvjXMQ_AlbWKO4_';

async function check() {
    console.log('--- Checking Schema via RPC or Select ---');
    try {
        // Try to get one row from ANY table to see what we have
        const tables = ['quotes', 'leads', 'profiles'];
        for (const t of tables) {
            const { data, error } = await fetch(`${supabaseUrl}/rest/v1/${t}?select=*&limit=1`, {
                headers: { 'apikey': supabaseAnonKey }
            }).then(r => r.json().then(j => ({ data: j, error: r.ok ? null : j })));

            if (error) {
                console.log(`Table ${t} error:`, error.message);
            } else {
                console.log(`Table ${t} columns:`, data.length > 0 ? Object.keys(data[0]) : 'Empty');
            }
        }
    } catch (err) {
        console.error('Catch error:', err);
    }
}

check();
