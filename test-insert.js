import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jszvedmmrdpqdfmwwtew.supabase.co';
const supabaseAnonKey = 'sb_publishable_bZUhTdn1baV_OBOtlvjXMQ_AlbWKO4_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
    console.log('--- Testing Insert into quotes ---');
    try {
        // Attempting a very basic insert
        const { data, error } = await supabase
            .from('quotes')
            .insert([
                {
                    broker_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
                    lead_id: '00000000-0000-0000-0000-000000000000',
                    lot_number: 'TEST',
                    lead_name_snapshot: 'Test Client',
                    costo_final: 0
                }
            ])
            .select();

        if (error) {
            console.error('Insert Error Detail:', JSON.stringify(error, null, 2));
        } else {
            console.log('Insert Success:', data);
        }
    } catch (err) {
        console.error('Catch Error:', err);
    }
}

testInsert();
