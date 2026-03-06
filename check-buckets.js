import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jszvedmmrdpqdfmwwtew.supabase.co';
const supabaseAnonKey = 'sb_publishable_bZUhTdn1baV_OBOtlvjXMQ_AlbWKO4_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBuckets() {
    console.log('--- Checking Storage Buckets ---');
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Error listing buckets:', error);
        } else {
            console.log('Buckets:', data.map(b => b.name));
            const hasQuotes = data.find(b => b.name === 'quotes');
            console.log('Has "quotes" bucket:', !!hasQuotes);
        }
    } catch (err) {
        console.error('Catch error:', err);
    }
}

checkBuckets();
