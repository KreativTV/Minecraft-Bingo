import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'DEIN_FALLBACK';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'DEIN_FALLBACK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);