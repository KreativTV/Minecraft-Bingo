import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpqfygimaapxghtlsvnv.supabase.co';
const supabaseAnonKey = 'sb_publishable_l8ATnYt710V3onxCzRhD1w_0vyiU3TV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);