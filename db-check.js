import { createClient } from '@supabase/supabase-client'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkQuotes() {
    console.log('--- DB Check ---')
    const { data, error, count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Total quotes in table:', count)
    }

    // Check columns
    const { data: cols, error: colErr } = await supabase
        .from('quotes')
        .select('*')
        .limit(1)

    if (colErr) {
        console.error('Column check error:', colErr)
    } else {
        console.log('First quote structure:', cols?.[0] ? Object.keys(cols[0]) : 'No quotes found')
    }
}

checkQuotes()
