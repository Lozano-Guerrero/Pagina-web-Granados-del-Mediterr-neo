import { createClient } from '@supabase/supabase-js';

// Extraídos de los archivos .env del proyecto
const supabaseUrl = "https://rzkpgpcyivpobvltwlyq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3BncGN5aXZwb2J2bHR3bHlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjczOTkxNiwiZXhwIjoyMDQ4MzE1OTE2fQ.yW-PezMEnY773_3x_fXasLp0D-eUbe0sI3B88_D0y9w"; // SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_lead_state_check;

ALTER TABLE public.leads 
ADD CONSTRAINT leads_lead_state_check 
CHECK (lead_state IN (
  'VIGENTE', 'REUNION', 'EXPIRADO', 'CERRADO', 
  'NO_CLASIFICADO', 'CONTACTADO', 'CITA', 'SEPARADO', 'GANADA', 'PERDIDA'
));
`;

async function applyFix() {
    console.log('Applying lead_state constraint fix (Direct Auth)...');
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('Error applying SQL fix via RPC:', error);
            process.exit(1);
        }

        console.log('Successfully updated lead_state constraints.');
        process.exit(0);
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

applyFix();
