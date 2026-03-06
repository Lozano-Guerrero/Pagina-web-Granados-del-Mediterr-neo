const supabaseUrl = 'https://jszvedmmrdpqdfmwwtew.supabase.co';
const supabaseAnonKey = 'sb_publishable_bZUhTdn1baV_OBOtlvjXMQ_AlbWKO4_';

async function findQuote() {
    console.log('--- Finding Quote QT-UU31LCEH ---');
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/quotes?id=eq.QT-UU31LCEH`, {
            headers: { 'apikey': supabaseAnonKey }
        }).then(r => r.json());

        console.log('Result:', res);
    } catch (err) {
        console.error('Error:', err);
    }
}

findQuote();
