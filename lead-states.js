import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import process from 'process';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
        }
    } catch (err) {
        console.error('Error loading .env:', err);
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// IMPORTANTE: Usar Service Role Key para evadir RLS y ver la realidad de la tabla
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStates() {
    console.log('Fetching leads from Supabase with Service Role...');
    try {
        const { data, error, count } = await supabase
            .from('leads')
            .select('lead_state', { count: 'exact' });

        if (error) {
            console.error('DATABASE_ERROR:', error);
            process.exit(1);
        }

        console.log('TOTAL_LEADS_COUNT:', count);

        if (!data || data.length === 0) {
            console.log('No leads found in the table (even with Service Role).');
            process.exit(0);
        }

        const states = [...new Set(data.map(l => l.lead_state || 'null'))];
        console.log('UNIQUE_STATES_IN_DB:', JSON.stringify(states));
        process.exit(0);
    } catch (err) {
        console.error('UNEXPECTED_ERROR:', err);
        process.exit(1);
    }
}

checkStates();
