import fetch from 'node-fetch';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jszvedmmrdpqdfmwwtew.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bZUhTdn1baV_OBOtlvjXMQ_AlbWKO4_';

// The user is already logged in, so I will ask user for an access token or just look at the code error response.
console.log("We need an auth token to run this script. Pls provide it.")
