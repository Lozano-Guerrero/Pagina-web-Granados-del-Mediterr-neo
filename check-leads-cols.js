const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLeadsSchema() {
    console.log('--- Checking Leads Schema ---');
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error:', error);
            // Si falla el select *, probamos con una consulta que devuelva metadatos si es posible
        } else {
            if (data && data.length > 0) {
                console.log('Columns found:', Object.keys(data[0]));
            } else {
                console.log('No data in leads table to infer columns.');
            }
        }
    } catch (err) {
        console.error('Catch error:', err);
    }
}

checkLeadsSchema();
