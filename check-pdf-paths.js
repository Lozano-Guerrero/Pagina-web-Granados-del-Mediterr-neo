import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jszvedmmrdpqdfmwwtew.supabase.co';
const supabaseAnonKey = 'sb_publishable_bZUhTdn1baV_OBOtlvjXMQ_AlbWKO4_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLatestQuotes() {
    console.log('--- Checking Latest Quotes ---');
    try {
        const { data, error } = await supabase
            .from('quotes')
            .select('id, lead_name_snapshot, pdf_path, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Latest Quotes:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Catch error:', err);
    }
}

checkLatestQuotes();
