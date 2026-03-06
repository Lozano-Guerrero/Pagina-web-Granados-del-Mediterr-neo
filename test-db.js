import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jszvedmmrdpqdfmwwtew.supabase.co';
const supabaseAnonKey = 'sb_publishable_bZUhTdn1baV_OBOtlvjXMQ_AlbWKO4_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('--- Checking Quotes Table ---');
    try {
        const { data: anyQuote, error: anyError } = await supabase
            .from('quotes')
            .select('*')
            .limit(1);

        if (anyError) {
            console.error('Error fetching any quote:', anyError);
        } else {
            console.log('Sample quote keys:', anyQuote && anyQuote.length > 0 ? Object.keys(anyQuote[0]) : 'Table is empty');
            if (anyQuote && anyQuote.length > 0) {
                console.log('Sample data:', JSON.stringify(anyQuote[0], null, 2));
            }
        }

        const { count, error: countError } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error fetching count:', countError);
        } else {
            console.log('Total quotes in DB (Visible to Anon):', count);
        }

    } catch (err) {
        console.error('Catch error:', err);
    }
}

check();
