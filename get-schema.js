const supabaseUrl = 'https://jszvedmmrdpqdfmwwtew.supabase.co';
const supabaseAnonKey = 'sb_publishable_bZUhTdn1baV_OBOtlvjXMQ_AlbWKO4_';

async function getDefinitions() {
    console.log('--- Fetching Supabase Swagger/OpenAPI Definitions ---');
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Response not ok:', response.status, response.statusText);
            return;
        }

        const data = await response.json();
        const quotesDef = data.definitions.quotes;
        if (quotesDef) {
            console.log('Quotes Table Columns:', Object.keys(quotesDef.properties));
        } else {
            console.log('Quotes definition not found in response. Available definitions:', Object.keys(data.definitions));
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

getDefinitions();
